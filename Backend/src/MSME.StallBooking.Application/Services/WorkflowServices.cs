using MediatR;
using MSME.StallBooking.Application.Abstractions;
using MSME.StallBooking.Application.Contracts;
using MSME.StallBooking.Application.Security;
using MSME.StallBooking.Domain.Entities;
using MSME.StallBooking.SharedKernel.Errors;
using static MSME.StallBooking.Domain.Entities.BillingProfile;

namespace MSME.StallBooking.Application.Services;

public sealed class StallAllocationService
{
    private readonly IUnitOfWork _uow;
    private readonly IPermissionGuard _permissions;
    private readonly IEmailComposer _emailComposer;

    public StallAllocationService(
        IUnitOfWork uow,
        IPermissionGuard permissions,
        IEmailComposer emailComposer)
    {
        _uow = uow;
        _permissions = permissions;
        _emailComposer = emailComposer;
    }

    public async Task BlockStallAsync(BlockStallCommand command, CancellationToken ct)
    {
        _permissions.Demand(Permissions.StallBlock);

        await _uow.ExecuteInTransactionAsync(async tx =>
        {
            var booking = await _uow.Bookings.GetByIdAsync(command.BookingId, tx)
                ?? throw new DomainRuleException(
                    ErrorCodes.BookingNotFound,
                    "Booking not found.");

            var stall = await _uow.Stalls.GetForUpdateAsync(
                    command.TenantId,
                    command.EventId,
                    command.StallId,
                    tx)
                ?? throw new DomainRuleException(
                    ErrorCodes.StallNotFound,
                    "Stall not found.");

            var blockExpiresAt = DateTimeOffset.UtcNow.AddDays(3);

            stall.Block(booking.Id);
            booking.MarkBlocked(stall.Id, blockExpiresAt);

            var allocation = StallAllocation.Block(
                command.TenantId,
                command.EventId,
                booking.Id,
                stall.Id,
                command.ActorUserId,
                blockExpiresAt);

            await _uow.Allocations.AddAsync(allocation, tx);

            await _uow.SaveChangesAsync(tx);
        }, ct);
    }

    public async Task ReleaseExpiredBlocksAsync(CancellationToken ct)
    {
        var expired = await _uow.Allocations.GetExpiredBlocksAsync(
            DateTimeOffset.UtcNow,
            ct);

        foreach (var allocation in expired)
        {
            await _uow.ExecuteInTransactionAsync(async tx =>
            {
                var booking = await _uow.Bookings.GetByIdAsync(allocation.BookingId, tx)
                    ?? throw new DomainRuleException(
                        ErrorCodes.BookingNotFound,
                        "Booking not found.");

                var stall = await _uow.Stalls.GetByIdAsync(allocation.StallId, tx);

                allocation.Release(
                    Guid.Empty,
                    "Auto release due to non-payment within configured block validity period.");

                booking.ReleaseDueToNonPayment(
                    "Payment not received within 3 days of block email.");

                if (stall is not null)
                {
                    stall.Release(booking.Id);
                }

                await _uow.SaveChangesAsync(tx);
            }, ct);
        }
    }
}

public sealed class PaymentWorkflowService
{
    private readonly IUnitOfWork _uow;
    private readonly IPermissionGuard _permissions;
    private readonly INumberSequenceService _numbers;

    public PaymentWorkflowService(
        IUnitOfWork uow,
        IPermissionGuard permissions,
        INumberSequenceService numbers)
    {
        _uow = uow;
        _permissions = permissions;
        _numbers = numbers;
    }

    public async Task VerifyAsync(VerifyPaymentCommand command, CancellationToken ct)
    {
        _permissions.Demand(Permissions.PaymentVerify);

        await _uow.ExecuteInTransactionAsync(async tx =>
        {
            var booking = await _uow.Bookings.GetByIdAsync(command.BookingId, tx)
                ?? throw new DomainRuleException(
                    ErrorCodes.BookingNotFound,
                    "Booking not found.");

            var allocation = await _uow.Allocations.GetActiveByBookingAsync(booking.Id, tx)
                ?? throw new DomainRuleException(
                    ErrorCodes.ValidationFailed,
                    "No active stall allocation found for booking.");

            var payment = await _uow.Payments.GetByIdAsync(command.PaymentId, tx)
                ?? throw new DomainRuleException(
                    ErrorCodes.PaymentNotFound,
                    "Payment not found.");

            if (allocation.BlockExpiresAt < DateTimeOffset.UtcNow &&
                !command.OverrideExpiredBlock)
            {
                throw new DomainRuleException(
                    ErrorCodes.BlockExpired,
                    "Block has expired. Override permission is required.");
            }

            var receiptNo = await _numbers.NextReceiptNumberAsync(
                command.TenantId,
                command.EventId,
                tx);

            if (payment.AmountPaid > command.ExpectedAmount)
            {
                throw new DomainRuleException(
                    ErrorCodes.PaymentAmountMismatch,
                    "Paid amount cannot exceed the expected amount.");
            }

            bool isPartialPayment = payment.AmountPaid < command.ExpectedAmount;
            bool isFullSettlement = !isPartialPayment;

            payment.Verify(
                command.ActorUserId,
                command.ExpectedAmount,
                receiptNo,
                isPartialPayment);

            if (isFullSettlement)
            {
                allocation.Freeze(command.ActorUserId);
                booking.ConfirmPaymentAndFreeze();
            }
            else
            {
                booking.MarkPaymentSubmitted();
            }

            await _uow.SaveChangesAsync(tx);

        }, ct);
    }
}

public sealed class InvoiceWorkflowService
{
    private readonly IUnitOfWork _uow;
    private readonly INumberSequenceService _numbers;
    private readonly IPermissionGuard _permissions;
    private readonly IProformaInvoicePdfGenerator _pdfGenerator;

    public InvoiceWorkflowService(
        IUnitOfWork uow,
        INumberSequenceService numbers,
        IPermissionGuard permissions,
        IProformaInvoicePdfGenerator pdfGenerator)
    {
        _uow = uow;
        _numbers = numbers;
        _permissions = permissions;
        _pdfGenerator = pdfGenerator;
    }

    public async Task<Guid> GenerateAsync(
        GenerateInvoiceCommand command,
        CancellationToken ct)
    {
        _permissions.Demand(Permissions.InvoiceGenerate);

        Guid invoiceId = Guid.Empty;

        await _uow.ExecuteInTransactionAsync(async tx =>
        {
            var existing = await _uow.Invoices.GetActiveByBookingAsync(
                command.BookingId,
                tx);

            if (existing is not null)
            {
                throw new DomainRuleException(
                    ErrorCodes.InvoiceAlreadyGenerated,
                    "Proforma invoice already exists for this booking.");
            }

            var booking = await _uow.Bookings.GetByIdAsync(command.BookingId, tx)
                ?? throw new DomainRuleException(
                    ErrorCodes.BookingNotFound,
                    "Booking not found.");

            if (booking.BookingStatus is not Domain.Enums.BookingStatus.Confirmed)
            {
                throw new DomainRuleException(
                    ErrorCodes.InvoiceNotAllowedBeforePayment,
                    "Invoice generation requires verified payment and frozen stall.");
            }

            var invoiceNo = await _numbers.NextInvoiceNumberAsync(
                command.TenantId,
                command.EventId,
                tx);

            var snapshot = new InvoiceSnapshot(
                "Laghu Udyog Bharati Tamil Nadu",
                "Plot No 63A, First Floor, 9th Street, Sidco Industrial Estate, Ambattur, Chennai - 600058",
                "33AAATL0575H1ZT",
                "AAATL0575H",
                "Buyer Legal Name",
                "Buyer Billing Address",
                "33AORPS0019L1ZO",
                "AORPS0019L",
                "Tamil Nadu",
                "TBD",
                "3x3 mtrs",
                63000m,
                18m,
                "INR Seventy four thousand Three hundred forty only",
                "Eleven thousand three hundred forty only",
                "Payment verified and stall allocation confirmed.",
                "LAGHU UDYOG BHARATI",
                "Canara Bank",
                "0908201005559",
                "CNRB0000936",
                "Ambattur Branch, Chennai 600053");

            var invoice = ProformaInvoice.Generate(
                command.TenantId,
                command.EventId,
                command.BookingId,
                invoiceNo,
                command.ActorUserId,
                snapshot);

            await _uow.Invoices.AddAsync(invoice, tx);
            await _uow.SaveChangesAsync(tx);

            await _pdfGenerator.GenerateAsync(invoice, tx);

            invoiceId = invoice.Id;
        }, ct);

        return invoiceId;
    }

    public async Task SendAsync(SendInvoiceCommand command, CancellationToken ct)
    {
        _permissions.Demand(Permissions.InvoiceSend);

        await _uow.ExecuteInTransactionAsync(async tx =>
        {
            var invoice = await _uow.Invoices.GetByIdAsync(command.InvoiceId, tx)
                ?? throw new DomainRuleException(
                    ErrorCodes.EntityNotFound,
                    "Invoice not found.");

            var taxInvoiceNo = await _numbers.NextTaxInvoiceNumberAsync(
                command.TenantId,
                command.EventId,
                tx);

            invoice.MarkSent(command.ActorUserId, taxInvoiceNo);

            await _uow.SaveChangesAsync(tx);
        }, ct);
    }
}

public sealed class VisitorWorkflowService
{
    private readonly IUnitOfWork _uow;
    private readonly IQrCodeService _qrCodeService;
    private readonly IEmailSender _emailSender;
    private readonly INumberSequenceService _numbers;
    private readonly IEmailComposer? _emailComposer;

    public VisitorWorkflowService(
        IUnitOfWork uow,
        IQrCodeService qrCodeService,
        IEmailSender emailSender,
        INumberSequenceService numbers,
        IEmailComposer? emailComposer = null)
    {
        _uow = uow;
        _qrCodeService = qrCodeService;
        _emailSender = emailSender;
        _numbers = numbers;
        _emailComposer = emailComposer;
    }

    public async Task<IReadOnlyList<VisitorDto>> GetAllVisitorsAsync(
        Guid tenantId,
        Guid eventId,
        CancellationToken ct = default)
    {
        var visitors = await _uow.Visitors.GetAllAsync(tenantId, eventId, ct);

        return visitors.Select(v => new VisitorDto(
            v.Id,
            v.BookingRegistrationNumber,
            v.LegalName,
            v.TradeName,
            v.ContactPersonName,
            v.ContactPersonDesignation,
            v.Mobile,
            v.Email,
            v.City,
            v.District,
            v.State,
            v.IndustryCategory,
            v.BusinessType,
            v.CreatedAt
        )).ToList();
    }
    public async Task<IReadOnlyList<VisitorDto>> GetPresentVisitorsAsync(
    Guid tenantId, Guid eventId, CancellationToken ct = default)
    {
        var visitors = await _uow.Visitors.GetPresentAsync(tenantId, eventId, ct);
        return visitors.Select(v => new VisitorDto(
            v.Id, v.BookingRegistrationNumber, v.LegalName, v.TradeName,
            v.ContactPersonName, v.ContactPersonDesignation, v.Mobile, v.Email,
            v.City, v.District, v.State, v.IndustryCategory, v.BusinessType,
            v.CreatedAt, v.IsPresent, v.CheckedInAt
        )).ToList();
    }

    public async Task<CheckInVisitorResult> CheckInAsync(
        Guid tenantId, string registrationNumber, Guid? actorUserId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(registrationNumber))
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Registration number is required.");

        var visitor = await _uow.Visitors.GetByRegistrationNumberAsync(
            tenantId, registrationNumber.Trim().ToUpperInvariant(), ct);

        if (visitor is null)
            throw new DomainRuleException(ErrorCodes.EntityNotFound, "No visitor found for this QR / registration number.");

        var wasAlreadyCheckedIn = !visitor.MarkPresent(actorUserId);
        if (!wasAlreadyCheckedIn)
        {
            _uow.Visitors.Update(visitor);
            await _uow.SaveChangesAsync(ct);
        }

        return new CheckInVisitorResult(
            visitor.Id, visitor.BookingRegistrationNumber, visitor.LegalName,
            visitor.ContactPersonName, wasAlreadyCheckedIn, visitor.CheckedInAt ?? DateTimeOffset.UtcNow,
            visitor.TradeName, visitor.ContactPersonDesignation, visitor.Mobile, visitor.Email,
            visitor.Website, visitor.City, visitor.District, visitor.State,
            visitor.IndustryCategory, visitor.BusinessType, visitor.ProductServiceDescription,
            visitor.FasciaName
        );
    }

    public async Task<CreateVisitorResult> SubmitVisitorRegistrationAsync(
        CreateVisitorCommand command,
        CancellationToken ct)
    {
        Guid createdVisitorId = Guid.Empty;
        string registrationNumber = string.Empty;
        string recipientEmail = string.Empty;
        string recipientName = string.Empty;

        // 1. Transactional Entity Creation & Persistence
        await _uow.ExecuteInTransactionAsync(async tx =>
        {
            // Generate sequence-based registration number
            registrationNumber = await _numbers.NextVisitorNumberAsync(
                command.TenantId,
                command.EventId,
                tx);

            var visitor = BillingProfile.Visitor.Create(
                tenantId: command.TenantId,
                eventId: command.EventId,
                bookingRegistrationNumber: registrationNumber,
                legalName: command.LegalName,
                tradeName: command.TradeName,
                registeredAddress: command.RegisteredAddress,
                city: command.City,
                district: command.District,
                state: command.State,
                pincode: command.Pincode,
                country: command.Country,
                contactPersonName: command.ContactPersonName,
                contactPersonDesignation: command.ContactPersonDesignation,
                mobile: command.Mobile,
                alternateMobile: command.AlternateMobile,
                email: command.Email,
                alternateEmail: command.AlternateEmail,
                website: command.Website,
                industryScale: command.IndustryScale,
                businessType: command.BusinessType,
                companyConstitution: command.CompanyConstitution,
                industryCategory: command.IndustryCategory,
                productServiceDescription: command.ProductServiceDescription,
                productKeywords: command.ProductKeywords,
                //udyamNumber: null,
                //gstin: null,
                //pan: null,
                //lubMember: false,
                //lubState: null,
                //lubChapter: null,
                //lubMembershipNumber: null,
                //requestedStallSizeId: Guid.Empty,
                //stallOption1Id: null,
                //stallOption2Id: null,
                fasciaName: command.LegalName,
                 lubMember: command.LubMember,
                interestedInLub: command.InterestedInLub
            //displayNotes: null,
            //electricalRequirement: null,
            //specialRequirement: null,
            //hazardousDemoDeclared: false,
            //declarantName: command.DeclarantName,
            //declarantDesignation: command.DeclarantDesignation,
            //declarationDate: command.DeclarationDate,
            //termsAccepted: command.TermsAccepted,
            //accuracyAccepted: command.AccuracyAccepted,
            //paymentTimelineAccepted: command.PaymentTimelineAccepted,
            //cancellationPolicyAccepted: false,
            //privacyConsentAccepted: false,
            //finalAllocationConsentAccepted: false
            );

            await _uow.Visitors.AddAsync(visitor, tx);
            await _uow.SaveChangesAsync(tx);

            createdVisitorId = visitor.Id;
            recipientEmail = visitor.Email;
            recipientName = visitor.ContactPersonName;
        }, ct);

        // 2. QR Code Generation
        string verificationUrl = $"https://msmesangamam.lubtn.com/visitorverification/{registrationNumber}";

        byte[] qrCodeBytes = _qrCodeService.GenerateQrCode(verificationUrl);
        //string verificationUrl = $"https://msmesangamam.lubtn.com/visitorverification/{registrationNumber}";
       // string qrImageInlineSrc = "cid:qr-code-inline";

        // 3. Email Composition
        //        string emailBody = $@"
        //            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;'>
        //                <h2 style='color: #0d6efd;'>Visitor Pass Confirmed</h2>
        //                <p>Dear <strong>{recipientName}</strong>,</p>
        //                <p>Thank you for registering. Your details have been saved successfully.</p>
        //                <div style='background-color: #f8f9fa; padding: 12px 16px; border-radius: 6px; margin: 16px 0;'>
        //                    <p style='margin: 4px 0;'><strong>Visitor Reg. No:</strong> <span style='color: #0d6efd; font-size: 16px;'>{registrationNumber}</span></p>
        //                </div>
        //<p>You can view and download your digital pass by clicking the button below:</p>
        // <div style='text-align: center; margin: 24px 0;'>
        //                    <img src='{qrImageInlineSrc}' alt='Visitor Entry Pass QR Code' style='width: 180px; height: 180px; border: 1px solid #e0e0e0; padding: 10px; border-radius: 12px; background-color: #ffffff;' />
        //                    <p style='font-size: 12px; color: #666666; margin-top: 6px;'>Show this QR code at the venue entry point for gate verification.</p>
        //                </div>
        var visitorEmail = _emailComposer?.ComposeVisitorPass(
                  recipientName,
                  registrationNumber,
                  verificationUrl,
                  recipientEmail,
                  command.TenantId,
                  command.EventId);
        if (visitorEmail != null)
        {
            await _uow.EmailLogs.AddAsync(visitorEmail, ct);
            await _uow.SaveChangesAsync(ct);
        }

        //< !-- CTA Button -->
        //<div style='text-align: center; margin: 28px 0;'>
        //    <a href='{verificationUrl}' 
        //       target='_blank' 
        //       style='background-color: #0d6efd; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 14px; text-decoration: none; border-radius: 8px; display: inline-block; shadow: 0 2px 4px rgba(0,0,0,0.1);'>
        //        View & Download Visitor Pass
        //    </a>
        //</div>
        //        <p>Please find attached your entry <strong>QR Code Pass</strong>. Show this pass at the venue entry point for verification.</p>
        //        <br/>
        var finalSubject = visitorEmail?.Subject ?? $"Visitor Entry Pass - {registrationNumber}";
        var finalBody = visitorEmail?.BodySnapshot ?? "";

        //   < div style=""
        //    margin-top:24px;
        //    padding:16px;
        //    background-color:#f5f7fa;
        //    border-left:4px solid #0d6efd;
        //    border-radius:4px;"">

        //    <h3 style=""margin:0 0 10px 0; color:#0d6efd;"">
        //        Digital Support Team
        //    </h3>

        //    <p style=""margin:0 0 12px 0;"">
        //        For assistance related to your stall booking, payment verification,
        //        or invoice, please contact our Digital Support Team.
        //    </p>

        //    <table style=""border-collapse:collapse;"">
        //        <tr>
        //            <td style=""padding:5px 12px 5px 0; font-weight:bold;"">
        //                Sriram Hariharan
        //            </td>
        //            <td style=""padding:5px 0;"">
        //                <a href=""tel:+919840727309""
        //                   style=""color:#0d6efd; text-decoration:none;"">
        //                    +91 98407 27309
        //                </a>
        //            </td>
        //        </tr>

        //        <tr>
        //            <td style=""padding:5px 12px 5px 0; font-weight:bold;"">
        //                Arun Vignesh P.B.
        //            </td>
        //            <td style=""padding:5px 0;"">
        //                <a href=""tel:+917092482244""
        //                   style=""color:#0d6efd; text-decoration:none;"">
        //                    +91 70924 82244
        //                </a>
        //            </td>
        //        </tr>
        //    </table>

        //    <p style=""margin:12px 0 0 0;"">
        //        Please mention your Booking Registration Number
        //        <b>{registrationNumber}</b>
        //        while contacting the Digital Support Team.
        //    </p>
        //</div>
        //            <p style=""margin-top:20px;"">
        //    Regards,<br/>
        //    <b>MSME Sangamam Connect - Tamil Nadu Organising Team</b>
        //</p>
        //        </div>";

        //// 4. Send Email Pass with Attachment
        //await _emailSender.SendEmailWithAttachmentAsync(
        //    to: recipientEmail,

        //    subject: finalSubject,
        //    body: finalBody,
        //    pdfBytes: qrCodeBytes,
        //    fileName: $"VisitorPass-{registrationNumber}.png"
        //);
        const int maxEmailAttempts = 3;
        for (var attempt = 1; attempt <= maxEmailAttempts; attempt++)
        {
            try
            {
                await _emailSender.SendEmailWithAttachmentAsync(
                    to: recipientEmail,
                    subject: finalSubject,
                    body: finalBody,
                    pdfBytes: qrCodeBytes,
                    fileName: $"VisitorPass-{registrationNumber}.png"
                );
                if (visitorEmail != null)
                {
                    visitorEmail.MarkSent(null);
                    await _uow.SaveChangesAsync(ct);
                }
                break;
            }
            catch (Exception emailEx)
            {
                var errorMsg = emailEx.InnerException?.Message ?? emailEx.Message;
                var isConfigError = emailEx is InvalidOperationException
                    || emailEx.GetType().Name.Contains("Authentication", StringComparison.OrdinalIgnoreCase);

                if (isConfigError || attempt == maxEmailAttempts)
                {
                    if (visitorEmail != null)
                    {
                        visitorEmail.MarkFailed(errorMsg);
                        await _uow.SaveChangesAsync(ct);
                    }
                    break;
                }

                await Task.Delay(500 * attempt, ct);
            }
        }

        // Send alert notification copy to LUB admin email
        try
        {
            var lubSubject = $"[New Visitor Registration] - {registrationNumber} - {command.LegalName}";
            var lubBody = $@"
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>
    <h2 style='color: #0d6efd; margin-top: 0;'>New Visitor Registered</h2>
    <p>A new visitor has registered for <b>MSME Sangamam</b>.</p>
    <table style='width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;'>
        <tr style='background: #f8fafc;'><td style='padding: 8px 12px; font-weight: bold; width: 40%;'>Registration No:</td><td style='padding: 8px 12px; color: #0d6efd; font-weight: bold;'>{registrationNumber}</td></tr>
        <tr><td style='padding: 8px 12px; font-weight: bold;'>Visitor Name:</td><td style='padding: 8px 12px;'>{command.ContactPersonName}</td></tr>
        <tr style='background: #f8fafc;'><td style='padding: 8px 12px; font-weight: bold;'>Company / Entity:</td><td style='padding: 8px 12px;'>{command.LegalName}</td></tr>
        <tr><td style='padding: 8px 12px; font-weight: bold;'>Mobile:</td><td style='padding: 8px 12px;'>{command.Mobile}</td></tr>
        <tr style='background: #f8fafc;'><td style='padding: 8px 12px; font-weight: bold;'>Email:</td><td style='padding: 8px 12px;'>{command.Email}</td></tr>
        <tr><td style='padding: 8px 12px; font-weight: bold;'>City / District:</td><td style='padding: 8px 12px;'>{command.City ?? "-"}, {command.District ?? "-"}</td></tr>
        <tr style='background: #f8fafc;'><td style='padding: 8px 12px; font-weight: bold;'>Category:</td><td style='padding: 8px 12px;'>{command.IndustryCategory ?? "-"}</td></tr>
        <tr><td style='padding: 8px 12px; font-weight: bold;'>LUB Member:</td><td style='padding: 8px 12px;'>{(command.LubMember == true ? "Yes" : "No")}</td></tr>
        <tr style='background: #f8fafc;'><td style='padding: 8px 12px; font-weight: bold;'>Interested in LUB:</td><td style='padding: 8px 12px;'>{(command.InterestedInLub == true ? "Yes" : "No")}</td></tr>
    </table>
    <div style='margin-top: 20px; text-align: center;'>
        <a href='{verificationUrl}' target='_blank' style='background-color: #0d6efd; color: #ffffff; padding: 10px 20px; font-size: 13px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block;'>View Visitor Pass</a>
    </div>
</div>";

            var lubEmailLog = EmailLog.Create(
                command.TenantId,
                command.EventId,
                null,
                "lubchennai2025@gmail.com",
                lubSubject,
                lubBody,
                "LUB_VISITOR_REGISTRATION_ALERT");

            await _uow.EmailLogs.AddAsync(lubEmailLog, ct);
            await _uow.SaveChangesAsync(ct);

            await _emailSender.SendEmailWithAttachmentAsync(
                to: "lubchennai2025@gmail.com",
                subject: lubSubject,
                body: lubBody,
                pdfBytes: qrCodeBytes,
                fileName: $"VisitorPass-{registrationNumber}.png"
            );

            lubEmailLog.MarkSent(null);
            await _uow.SaveChangesAsync(ct);
        }
        catch (Exception)
        {
            // Do not fail visitor registration if LUB notification fails
        }

        return new CreateVisitorResult(createdVisitorId, registrationNumber);
    }
    public async Task SendVisitorNotificationAsync(
BillingProfile.Visitor visitor,
string subject,
string messageBody,
CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(visitor);

        if (string.IsNullOrWhiteSpace(visitor.Email))
        {
            // Skip processing if visitor has no registered email
            return;
        }

        string verificationUrl = $"https://msmesangamam.lubtn.com/visitorverification/{visitor.BookingRegistrationNumber}";
        //string recipientName = !string.IsNullOrWhiteSpace(visitor.ContactPersonName)
        //    ? visitor.ContactPersonName
        //    : visitor.LegalName;
        var notifEmail = _emailComposer?.ComposeVisitorNotification(
            visitor.ContactPersonName,
            subject,
            messageBody,
            visitor.Email,
            visitor.TenantId,
            visitor.EventId);

        //// Convert custom line breaks to HTML paragraphs
        //string formattedCustomMessage = string.IsNullOrWhiteSpace(messageBody)
        //    ? string.Empty
        //    : $"<p style='color: #333333; font-size: 14px; line-height: 1.6;'>{messageBody.Replace("\n", "<br/>")}</p>";
        var finalSubject = notifEmail?.Subject ?? subject;
        var finalBody = notifEmail?.BodySnapshot ?? (string.IsNullOrWhiteSpace(messageBody) ? "" : messageBody);

     //   // Build responsive HTML template matching your existing workflow email
     //   string emailHtml = $@"
     //<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;'>
     //    <h2 style='color: #0d6efd;'>{subject}</h2>
     //    <p>Dear <strong>{recipientName}</strong>,</p>

     //    <div style='background-color: #f8f9fa; padding: 12px 16px; border-radius: 6px; margin: 16px 0;'>
     //        <p style='margin: 4px 0;'><strong>Visitor Reg. No:</strong> <span style='color: #0d6efd; font-size: 16px;'>{visitor.BookingRegistrationNumber}</span></p>
     //        <p style='margin: 4px 0;'><strong>Company Name:</strong> {visitor.LegalName}</p>
     //    </div>

     //    {formattedCustomMessage}

     //    <!-- CTA Button to Access Pass -->
     //    <div style='text-align: center; margin: 28px 0;'>
     //        <a href='{verificationUrl}' 
     //           target='_blank' 
     //           style='background-color: #0d6efd; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 14px; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>
     //            View & Download Digital Pass
     //        </a>
     //    </div>

     //    <!-- Digital Support Team Info Block -->
     //    <div style='margin-top:24px; padding:16px; background-color:#f5f7fa; border-left:4px solid #0d6efd; border-radius:4px;'>
     //        <h3 style='margin:0 0 10px 0; color:#0d6efd;'>Digital Support Team</h3>
     //        <p style='margin:0 0 12px 0; font-size: 13px;'>
     //            For assistance regarding venue entry, gate verification, or pass access, please contact our Digital Support Team:
     //        </p>
     //        <table style='border-collapse:collapse; font-size: 13px;'>
     //            <tr>
     //                <td style='padding:5px 12px 5px 0; font-weight:bold;'>Sriram Hariharan</td>
     //                <td style='padding:5px 0;'><a href='tel:+919840727309' style='color:#0d6efd; text-decoration:none;'>+91 98407 27309</a></td>
     //            </tr>
     //            <tr>
     //                <td style='padding:5px 12px 5px 0; font-weight:bold;'>Arun Vignesh P.B.</td>
     //                <td style='padding:5px 0;'><a href='tel:+917092482244' style='color:#0d6efd; text-decoration:none;'>+91 70924 82244</a></td>
     //            </tr>
     //        </table>
     //        <p style='margin:12px 0 0 0; font-size: 12px; color: #555555;'>
     //            Please mention your Registration Number <b>{visitor.BookingRegistrationNumber}</b> when reaching out.
     //        </p>
     //    </div>

     //    <p style='margin-top:20px; font-size: 13px;'>
     //        Regards,<br/>
     //        <b>MSME Sangamam Connect - Tamil Nadu Organising Team</b>
     //    </p>
     //</div>";

      
          if (notifEmail != null)
        {
            await _uow.EmailLogs.AddAsync(notifEmail, ct);
            await _uow.SaveChangesAsync(ct);
        }
        try
        {
            await _emailSender.SendEmailWithAttachmentAsync(
                to: visitor.Email,
                subject: finalSubject,
                body: finalBody,
                pdfBytes: Array.Empty<byte>(),
                fileName: string.Empty
            );
            if (notifEmail != null)
            {
                notifEmail.MarkSent(null);
                await _uow.SaveChangesAsync(ct);
            }
        }
        catch (Exception emailEx)
        {
            if (notifEmail != null)
            {
                notifEmail.MarkFailed(emailEx.Message);
                await _uow.SaveChangesAsync(ct);
            }
        }
    }

}
public record VisitorDto(
    Guid Id, string RegistrationNumber, string LegalName, string? TradeName,
    string ContactPersonName, string ContactPersonDesignation, string Mobile,
    string Email, string City, string District, string State,
    string IndustryCategory, string BusinessType,
    DateTimeOffset CreatedAt,
    bool IsPresent = false,
    DateTimeOffset? CheckedInAt = null
);

public record CheckInVisitorResult(
    Guid VisitorId, string RegistrationNumber, string LegalName,
    string ContactPersonName, bool WasAlreadyCheckedIn, DateTimeOffset CheckedInAt,
    string? TradeName = null, string? ContactPersonDesignation = null, string? Mobile = null,
    string? Email = null, string? Website = null, string? City = null, string? District = null,
    string? State = null, string? IndustryCategory = null, string? BusinessType = null,
    string? ProductServiceDescription = null, string? FasciaName = null
);
public sealed class VipWorkflowService
{
    private readonly IUnitOfWork _uow;
    private readonly IQrCodeService _qrCodeService;
    private readonly IEmailSender _emailSender;
    private readonly INumberSequenceService _numbers;
    private readonly IEmailComposer? _emailComposer;

    public VipWorkflowService(
        IUnitOfWork uow,
        IQrCodeService qrCodeService,
        IEmailSender emailSender,
        INumberSequenceService numbers,
        IEmailComposer? emailComposer = null)
    {
        _uow = uow;
        _qrCodeService = qrCodeService;
        _emailSender = emailSender;
        _numbers = numbers;
        _emailComposer = emailComposer;
    }
    public async Task<IReadOnlyList<VipDto>> GetAllVipsAsync(
    Guid tenantId,
    Guid eventId,
    CancellationToken ct = default)
    {
        var vips = await _uow.Vips.GetAllAsync(
            tenantId,
            eventId,
            ct);

        return vips.Select(v => new VipDto(
                v.Id,
                v.RegistrationNumber,
                v.Name,
                v.Designation,
                v.Organization,
                v.Mobile,
                v.Email,
                v.City,
                v.District,
                v.State,
                v.CreatedAt,
                v.IsPresent,
                v.CheckedInAt
            )).ToList();
    }

    // =========================================================
    // VIP REGISTRATION
    // =========================================================

    public async Task<SubmitVipRegistrationResult>
      SubmitVipRegistrationAsync(
          SubmitVipRegistrationCommand command,
          CancellationToken ct = default)
    {
        if (command.TenantId == Guid.Empty)
        {
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "Tenant is required.");
        }

        if (command.EventId == Guid.Empty)
        {
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "Event is required.");
        }

        if (string.IsNullOrWhiteSpace(command.ContactPersonName))
        {
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "Contact Person Name is required.");
        }

        if (string.IsNullOrWhiteSpace(command.Mobile))
        {
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "Mobile number is required.");
        }

        if (string.IsNullOrWhiteSpace(command.Email))
        {
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "Email address is required.");
        }

        Guid createdVipId = Guid.Empty;
        string registrationNumber = string.Empty;
        string recipientEmail = string.Empty;
        string recipientName = string.Empty;

        // =========================================================
        // 1. CREATE VIP + SAVE
        // =========================================================

        await _uow.ExecuteInTransactionAsync(async tx =>
        {
            registrationNumber =
                await _numbers.NextVipNumberAsync(
                    command.TenantId,
                    command.EventId,
                    tx);
            var vip = Vip.Create(
                  tenantId: command.TenantId,
                  eventId: command.EventId,
                  contactPersonName: command.ContactPersonName.Trim(),
                  contactPersonDesignation:
                      command.ContactPersonDesignation?.Trim() ?? string.Empty,
                  mobile: command.Mobile.Trim(),
                  alternateMobile:
                      command.AlternateMobile?.Trim(),
                  email: command.Email.Trim(),
                  alternateEmail:
                      command.AlternateEmail?.Trim(),
                  website:
                      command.Website?.Trim(),
                  registeredAddress:
                      command.RegisteredAddress?.Trim() ?? string.Empty,
                  city:
                      command.City?.Trim() ?? string.Empty,
                  district:
                      command.District?.Trim() ?? string.Empty,
                  state:
                      command.State?.Trim() ?? string.Empty,
                  pincode:
                      command.Pincode?.Trim() ?? string.Empty,
                  organization:
                      command.Organization?.Trim()
              );

            vip.AssignRegistrationNumber(registrationNumber);

            await _uow.Vips.AddAsync(vip, tx);

            await _uow.SaveChangesAsync(tx);

            createdVipId = vip.Id;
            recipientEmail = vip.Email;
            recipientName = vip.Name;

        }, ct);

        // =========================================================
        // 2. GENERATE VIP QR CODE
        // =========================================================

        string verificationUrl =
            $"https://msmesangamam.lubtn.com/vipverification/{registrationNumber}";

        byte[] qrCodeBytes =
            _qrCodeService.GenerateQrCode(verificationUrl);

        // 3. EMAIL BODY (via EmailComposer)
        // =========================================================
        var vipEmail = _emailComposer?.ComposeVipPass(
            recipientName,
            registrationNumber,
            verificationUrl,
            recipientEmail,
            command.TenantId,
            command.EventId);
        if (vipEmail != null)
        {
            await _uow.EmailLogs.AddAsync(vipEmail, ct);
            await _uow.SaveChangesAsync(ct);
        }
        //        string emailBody = $@"
        //<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;'>
        var finalSubject = vipEmail?.Subject ?? $"VIP Entry Pass - {registrationNumber}";
        var finalBody = vipEmail?.BodySnapshot ?? "";

        //    < h2 style='color: #0d6efd;'>VIP Registration Confirmed</h2>

        //    <p>
        //        Dear <strong>{recipientName}</strong>,
        //    </p>

        //    <p>
        //        Your VIP registration has been successfully completed.
        //    </p>

        //    <div style='background-color: #f8f9fa; padding: 12px 16px; border-radius: 6px; margin: 16px 0;'>

        //        <p style='margin: 4px 0;'>
        //            <strong>VIP Registration No:</strong>
        //            <span style='color: #0d6efd; font-size: 16px;'>
        //                {registrationNumber}
        //            </span>
        //        </p>

        //    </div>

        //    <div style='text-align: center; margin: 28px 0;'>

        //        <a href='{verificationUrl}'
        //           target='_blank'
        //           style='background-color: #0d6efd;
        //                  color: #ffffff;
        //                  padding: 12px 24px;
        //                  font-weight: bold;
        //                  font-size: 14px;
        //                  text-decoration: none;
        //                  border-radius: 8px;
        //                  display: inline-block;'>

        //            View VIP Pass

        //        </a>

        //    </div>

        //    <p>
        //        Please find attached your
        //        <strong>VIP QR Code Pass</strong>.
        //    </p>

        //    <p>
        //        Please show this QR code at the venue entry point
        //        for verification and check-in.
        //    </p>

        //    <div style='
        //        margin-top:24px;
        //        padding:16px;
        //        background-color:#f5f7fa;
        //        border-left:4px solid #0d6efd;
        //        border-radius:4px;'>

        //        <h3 style='margin:0 0 10px 0; color:#0d6efd;'>
        //            Digital Support Team
        //        </h3>

        //        <p style='margin:0 0 12px 0;'>
        //            For assistance related to your VIP registration,
        //            please contact our Digital Support Team.
        //        </p>

        //        <table style='border-collapse:collapse;'>

        //            <tr>
        //                <td style='padding:5px 12px 5px 0; font-weight:bold;'>
        //                    Sriram Hariharan
        //                </td>

        //                <td style='padding:5px 0;'>
        //                    <a href='tel:+919840727309'
        //                       style='color:#0d6efd; text-decoration:none;'>
        //                        +91 98407 27309
        //                    </a>
        //                </td>
        //            </tr>

        //            <tr>
        //                <td style='padding:5px 12px 5px 0; font-weight:bold;'>
        //                    Arun Vignesh P.B.
        //                </td>

        //                <td style='padding:5px 0;'>
        //                    <a href='tel:+917092482244'
        //                       style='color:#0d6efd; text-decoration:none;'>
        //                        +91 70924 82244
        //                    </a>
        //                </td>
        //            </tr>

        //        </table>

        //        <p style='margin:12px 0 0 0;'>
        //            Please mention your VIP Registration Number
        //            <b>{registrationNumber}</b>
        //            while contacting the Digital Support Team.
        //        </p>

        //    </div>

        //    <p style='margin-top:20px;'>
        //        Regards,<br/>
        //        <b>MSME Sangamam Connect - Tamil Nadu Organising Team</b>
        //    </p>

        //</div>";

        // =========================================================
        // 4. SEND EMAIL + QR ATTACHMENT
        // =========================================================

        //       await _emailSender.SendEmailWithAttachmentAsync(
        //           to: recipientEmail,
        //subject: finalSubject,
        //           body: finalBody,
        //           pdfBytes: qrCodeBytes,
        //           fileName: $"VIPPass-{registrationNumber}.png"
        //       );
        try
        {
            await _emailSender.SendEmailWithAttachmentAsync(
                to: recipientEmail,
                subject: finalSubject,
                body: finalBody,
                pdfBytes: qrCodeBytes,
                fileName: $"VIPPass-{registrationNumber}.png"
            );
            if (vipEmail != null)
            {
                vipEmail.MarkSent(null);
                await _uow.SaveChangesAsync(ct);
            }
        }
        catch (Exception emailEx)
        {
            if (vipEmail != null)
            {
                vipEmail.MarkFailed(emailEx.Message);
                await _uow.SaveChangesAsync(ct);
            }
        }

        // =========================================================
        // 5. RESPONSE
        // =========================================================

        return new SubmitVipRegistrationResult(
            createdVipId,
            registrationNumber);
    }
    // =========================================================
    // GET PRESENT VIPS
    // =========================================================

    public async Task<IReadOnlyList<VipDto>> GetPresentVipsAsync(
        Guid tenantId,
        Guid eventId,
        CancellationToken ct = default)
    {
        var vips = await _uow.Vips.GetPresentAsync(
            tenantId,
            eventId,
            ct);

        return vips.Select(v => new VipDto(
            v.Id,
            v.RegistrationNumber,
            v.Name,
            v.Designation,
            v.Organization,
            v.Mobile,
            v.Email,
            v.District,
            v.City,
            v.State,
            v.CreatedAt,
            v.IsPresent,
            v.CheckedInAt
        )).ToList();
    }

    // =========================================================
    // CHECK-IN
    // =========================================================

    public async Task<CheckInVipResult> CheckInAsync(
        Guid tenantId,
        string registrationNumber,
        Guid? actorUserId,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(registrationNumber))
        {
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "Registration number is required.");
        }

        var vip = await _uow.Vips.GetByRegistrationNumberAsync(
            tenantId,
            registrationNumber.Trim().ToUpperInvariant(),
            ct);

        if (vip is null)
        {
            throw new DomainRuleException(
                ErrorCodes.EntityNotFound,
                "No VIP found for this QR / registration number.");
        }

        var wasAlreadyCheckedIn = !vip.MarkPresent(actorUserId);

        if (!wasAlreadyCheckedIn)
        {
            _uow.Vips.Update(vip);
            await _uow.SaveChangesAsync(ct);
        }

        return new CheckInVipResult(
            vip.Id,
            vip.RegistrationNumber,
            vip.Name,
            vip.Designation,
            wasAlreadyCheckedIn,
            vip.CheckedInAt ?? DateTimeOffset.UtcNow
        );
    }
}
public record VipDto(
    Guid Id,
    string RegistrationNumber,
    string Name,
    string? Designation,
    string? Organization,
    string Mobile,
     string City,
     string District,
      string State,

    string Email,
    DateTimeOffset CreatedAt,
    bool IsPresent = false,
    DateTimeOffset? CheckedInAt = null
);

public record CheckInVipResult(
    Guid VipId,
    string RegistrationNumber,
    string Name,
    string? Designation,
    bool WasAlreadyCheckedIn,
    DateTimeOffset CheckedInAt
);