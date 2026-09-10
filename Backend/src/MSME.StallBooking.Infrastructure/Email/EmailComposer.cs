using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Application.Abstractions;
using MSME.StallBooking.Domain.Entities;
using MSME.StallBooking.Persistence;
using StallBookingEntity = MSME.StallBooking.Domain.Entities.StallBooking;

namespace MSME.StallBooking.Infrastructure.Email;

public sealed class EmailComposer : IEmailComposer
{
    private readonly StallBookingDbContext? _db;

    public EmailComposer(StallBookingDbContext? db = null)
    {
        _db = db;
    }

    private (string Subject, string Body) ResolveTemplate(
        string templateCode,
        Guid tenantId,
        IDictionary<string, string?> values)
    {
        string subjectTemplate;
        string bodyTemplate;

        EmailTemplate? dbTemplate = null;
        if (_db != null)
        {
            try
            {
                dbTemplate = _db.EmailTemplates
                    .AsNoTracking()
                    .FirstOrDefault(t => t.TenantId == tenantId && t.TemplateCode == templateCode && t.IsActive)
                    ?? _db.EmailTemplates
                    .AsNoTracking()
                    .FirstOrDefault(t => t.TemplateCode == templateCode && t.IsActive);
            }
            catch
            {
                // Fallback to default if DB lookup fails
            }
        }

        if (dbTemplate != null && !string.IsNullOrWhiteSpace(dbTemplate.SubjectTemplate) && !string.IsNullOrWhiteSpace(dbTemplate.BodyHtmlTemplate))
        {
            subjectTemplate = dbTemplate.SubjectTemplate;
            bodyTemplate = dbTemplate.BodyHtmlTemplate;

            // If the database template does not yet contain the {{notes}} placeholder for additional requirements, use the updated catalog template
            if ((templateCode.StartsWith("EXHIBITOR_ADDITIONAL_REQUIREMENTS", StringComparison.OrdinalIgnoreCase) ||
                 templateCode.StartsWith("ADMIN_ADDITIONAL_REQUIREMENTS", StringComparison.OrdinalIgnoreCase)) &&
                !bodyTemplate.Contains("{{notes}}", StringComparison.OrdinalIgnoreCase) &&
                EmailTemplateCatalog.AllTemplates.TryGetValue(templateCode, out var def))
            {
                bodyTemplate = def.DefaultHtmlBody;
            }
        }
        else if (EmailTemplateCatalog.AllTemplates.TryGetValue(templateCode, out var defaultDef))
        {
            subjectTemplate = defaultDef.DefaultSubject;
            bodyTemplate = defaultDef.DefaultHtmlBody;
        }
        else
        {
            subjectTemplate = $"MSME Sangamam Notification - {templateCode}";
            bodyTemplate = "<p>Notification from MSME Sangamam.</p>";
        }

        var renderedSubject = EmailTemplateCatalog.RenderTemplate(subjectTemplate, values);
        var renderedBody = EmailTemplateCatalog.RenderTemplate(bodyTemplate, values);

        return (renderedSubject, renderedBody);
    }

    public EmailLog ComposeBookingSubmitted(
        StallBookingEntity booking,
        Exhibitor exhibitor,
        StallSize requestedSize,
        string toEmail)
    {
        var legalName = !string.IsNullOrWhiteSpace(exhibitor.LegalName) ? exhibitor.LegalName.Trim() : "-";
        var tradeName = !string.IsNullOrWhiteSpace(exhibitor.TradeName) ? exhibitor.TradeName.Trim() : legalName;
        var contactPersonName = !string.IsNullOrWhiteSpace(exhibitor.ContactPersonName) ? exhibitor.ContactPersonName.Trim() : "Exhibitor";
        var companyName = !string.IsNullOrWhiteSpace(exhibitor.TradeName) ? exhibitor.TradeName.Trim() : legalName;

        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["bookingRegistrationNumber"] = booking.BookingRegistrationNumber,
            ["BookingRegistrationNumber"] = booking.BookingRegistrationNumber,
            ["legalName"] = legalName,
            ["tradeName"] = tradeName,
            ["companyName"] = companyName,
            ["udyamNumber"] = exhibitor.UdyamNumber ?? "-",
            ["gstin"] = exhibitor.Gstin ?? "-",
            ["pan"] = exhibitor.Pan ?? "-",
            ["contactPersonName"] = contactPersonName,
            ["contactPerson"] = contactPersonName,
            ["mobile"] = exhibitor.Mobile ?? "-",
            ["registeredAddress"] = exhibitor.RegisteredAddress ?? "-",
            ["city"] = exhibitor.City ?? "-",
            ["district"] = exhibitor.District ?? "-",
            ["state"] = exhibitor.State ?? "-",
            ["pincode"] = exhibitor.Pincode ?? "-",
            ["country"] = exhibitor.Country ?? "-",
            ["fasciaName"] = booking.FasciaName ?? "-",
            ["requestedSize"] = requestedSize.DisplayName ?? "-",
            ["stallSize"] = requestedSize.DisplayName ?? "-",
            ["electricalRequirement"] = booking.ElectricalRequirement ?? "N/A",
            ["specialRequirement"] = booking.SpecialRequirement ?? "N/A",
            ["declarantName"] = booking.DeclarantName ?? "-",
            ["declarantDesignation"] = booking.DeclarantDesignation ?? "-",
            ["declarationDate"] = booking.DeclarationDate.ToString("dd-MM-yyyy"),
            ["toEmail"] = toEmail
        };

        var (subject, body) = ResolveTemplate("BOOKING_SUBMITTED", booking.TenantId, values);

        return EmailLog.Create(
            booking.TenantId,
            booking.EventId,
            booking.Id,
            toEmail,
            subject,
            body,
            "BOOKING_SUBMITTED");
    }

    public EmailLog ComposeBookingReceived(
        StallBookingEntity booking,
        Stall stall,
        StallSize size,
        string toEmail,
        Exhibitor exhibitor,
        EmailPaymentContext paymentContext)
    {
        var contactPersonName = string.IsNullOrWhiteSpace(exhibitor.ContactPersonName)
            ? "Exhibitor"
            : exhibitor.ContactPersonName.Trim();

        var companyName = !string.IsNullOrWhiteSpace(exhibitor.TradeName)
            ? exhibitor.TradeName.Trim()
            : !string.IsNullOrWhiteSpace(exhibitor.LegalName)
                ? exhibitor.LegalName.Trim()
                : "Your Company";

        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["bookingRegistrationNumber"] = booking.BookingRegistrationNumber,
            ["BookingRegistrationNumber"] = booking.BookingRegistrationNumber,
            ["contactPersonName"] = contactPersonName,
            ["contactPerson"] = contactPersonName,
            ["companyName"] = companyName,
            ["stallNumber"] = stall.StallNumber,
            ["requestedSize"] = size.DisplayName,
            ["stallSize"] = size.DisplayName,
            ["accountName"] = paymentContext.AccountName,
            ["bankName"] = paymentContext.BankName,
            ["accountNumber"] = paymentContext.AccountNumber,
            ["ifscCode"] = paymentContext.IfscCode,
            ["branchName"] = paymentContext.BranchName,
            ["toEmail"] = toEmail
        };

        var (subject, body) = ResolveTemplate("BOOKING_RECEIVED_PAYMENT_REQUEST", booking.TenantId, values);

        return EmailLog.Create(
            booking.TenantId,
            booking.EventId,
            booking.Id,
            toEmail,
            subject,
            body,
            "BOOKING_RECEIVED_PAYMENT_REQUEST");
    }

    public EmailLog ComposePaymentVerified(
        StallBookingEntity booking,
        Stall stall,
        ProformaInvoice invoice,
        string toEmail)
    {
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["bookingRegistrationNumber"] = booking.BookingRegistrationNumber,
            ["BookingRegistrationNumber"] = booking.BookingRegistrationNumber,
            ["stallNumber"] = stall.StallNumber,
            ["invoiceNumber"] = invoice.InvoiceNumber,
            ["toEmail"] = toEmail
        };

        var (subject, body) = ResolveTemplate("PAYMENT_VERIFIED_STALL_CONFIRMED", booking.TenantId, values);

        return EmailLog.Create(
            booking.TenantId,
            booking.EventId,
            booking.Id,
            toEmail,
            subject,
            body,
            "PAYMENT_VERIFIED_STALL_CONFIRMED");
    }

    public EmailLog ComposeBookingEditRequest(
        StallBookingEntity booking,
        string toEmail,
        string editUrl)
    {
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["bookingRegistrationNumber"] = booking.BookingRegistrationNumber,
            ["BookingRegistrationNumber"] = booking.BookingRegistrationNumber,
            ["editUrl"] = editUrl,
            ["toEmail"] = toEmail
        };

        var (subject, body) = ResolveTemplate("BOOKING_EDIT_REQUEST", booking.TenantId, values);

        return EmailLog.Create(
            booking.TenantId,
            booking.EventId,
            booking.Id,
            toEmail,
            subject,
            body,
            "BOOKING_EDIT_REQUEST");
    }

    public EmailLog ComposeExhibitorStallInformation(
        StallBookingEntity booking,
        string toEmail,
        string contactPersonName,
        string companyName,
        string stallNumber,
        string stallSize)
    {
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["ContactPersonName"] = contactPersonName,
            ["CompanyName"] = companyName,
            ["BookingRegistrationNumber"] = booking.BookingRegistrationNumber,
            ["StallNumber"] = stallNumber,
            ["StallSize"] = stallSize,
            ["toEmail"] = toEmail
        };

        var (subject, body) = ResolveTemplate("EXHIBITOR_STALL_INFORMATION", booking.TenantId, values);

        return EmailLog.Create(
            booking.TenantId,
            booking.EventId,
            booking.Id,
            toEmail,
            subject,
            body,
            "EXHIBITOR_STALL_INFORMATION");
    }

    public EmailLog ComposeHotelAccommodationOptions(
        StallBookingEntity booking,
        string toEmail,
        string contactPersonName,
        string companyName)
    {
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["ContactPersonName"] = contactPersonName,
            ["CompanyName"] = companyName,
            ["toEmail"] = toEmail
        };

        var (subject, body) = ResolveTemplate("HOTEL_ACCOMMODATION_OPTIONS", booking.TenantId, values);

        return EmailLog.Create(
            booking.TenantId,
            booking.EventId,
            booking.Id,
            toEmail,
            subject,
            body,
            "HOTEL_ACCOMMODATION_OPTIONS");
    }
    public EmailLog ComposeMsmeSubsidyInfo(
    StallBookingEntity booking,
    string toEmail,
    string companyName,
    string subsidyStatus,
    string subsidyAmount)
    {
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["bookingRegistrationNumber"] = booking.BookingRegistrationNumber,
            ["companyName"] = companyName,
            ["subsidyStatus"] = subsidyStatus,
            ["subsidyAmount"] = subsidyAmount,
            ["toEmail"] = toEmail
        };
        var (subject, body) = ResolveTemplate("MSME_SUBSIDY_INFO", booking.TenantId, values);
        return EmailLog.Create(booking.TenantId, booking.EventId, booking.Id, toEmail, subject, body, "MSME_SUBSIDY_INFO");
    }

    public EmailLog ComposeFameTnSubsidyInfo(
        StallBookingEntity booking,
        string toEmail,
        string companyName,
        string subsidyStatus,
        string subsidyAmount)
    {
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["bookingRegistrationNumber"] = booking.BookingRegistrationNumber,
            ["companyName"] = companyName,
            ["subsidyStatus"] = subsidyStatus,
            ["subsidyAmount"] = subsidyAmount,
            ["toEmail"] = toEmail
        };
        var (subject, body) = ResolveTemplate("FAME_TN_SUBSIDY_INFO", booking.TenantId, values);
        return EmailLog.Create(booking.TenantId, booking.EventId, booking.Id, toEmail, subject, body, "FAME_TN_SUBSIDY_INFO");
    }

    public EmailLog ComposeExhibitorActionRequired(
        StallBookingEntity booking,
        string toEmail,
        string actionRequired)
    {
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["bookingRegistrationNumber"] = booking.BookingRegistrationNumber,
            ["actionRequired"] = actionRequired,
            ["toEmail"] = toEmail
        };
        var (subject, body) = ResolveTemplate("EXHIBITOR_ACTION_REQUIRED", booking.TenantId, values);
        return EmailLog.Create(booking.TenantId, booking.EventId, booking.Id, toEmail, subject, body, "EXHIBITOR_ACTION_REQUIRED");
    }
    public EmailLog ComposeBookingApproved(
        StallBookingEntity booking,
        Stall stall,
        string toEmail)
    {
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["bookingRegistrationNumber"] = booking.BookingRegistrationNumber,
            ["BookingRegistrationNumber"] = booking.BookingRegistrationNumber,
            ["stallNumber"] = stall.StallNumber,
            ["toEmail"] = toEmail
        };

        var (subject, body) = ResolveTemplate("BOOKING_APPROVED", booking.TenantId, values);

        return EmailLog.Create(
            booking.TenantId,
            booking.EventId,
            booking.Id,
            toEmail,
            subject,
            body,
            "BOOKING_APPROVED");
    }

    public EmailLog ComposeStallCardEmail(
        StallBookingEntity booking,
        Stall stall,
        Exhibitor exhibitor,
        string toEmail,
        string venue,
        string eventDate)
    {
        static string Display(string? value)
        {
            var displayValue = string.IsNullOrWhiteSpace(value) ? "-" : value.Trim();
            return System.Net.WebUtility.HtmlEncode(displayValue);
        }

        var companyName = !string.IsNullOrWhiteSpace(exhibitor.TradeName)
            ? exhibitor.TradeName.Trim()
            : !string.IsNullOrWhiteSpace(exhibitor.LegalName)
                ? exhibitor.LegalName.Trim()
                : "Your Company";

        var contactPerson = string.IsNullOrWhiteSpace(exhibitor.ContactPersonName)
            ? "Exhibitor"
            : exhibitor.ContactPersonName.Trim();

        var fasciaName = string.IsNullOrWhiteSpace(booking.FasciaName)
            ? "-"
            : booking.FasciaName.Trim();

        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["bookingRegistrationNumber"] = Display(booking.BookingRegistrationNumber),
            ["BookingRegistrationNumber"] = Display(booking.BookingRegistrationNumber),
            ["companyName"] = Display(companyName),
            ["contactPerson"] = Display(contactPerson),
            ["contactPersonName"] = Display(contactPerson),
            ["stallNumber"] = Display(stall.StallNumber),
            ["fasciaName"] = Display(fasciaName),
            ["venue"] = Display(venue),
            ["eventDate"] = Display(eventDate),
            ["industryCategory"] = Display(exhibitor.IndustryCategory),
            ["productKeywords"] = Display(exhibitor.ProductKeywords),
            ["productServiceDescription"] = Display(exhibitor.ProductServiceDescription),
            ["toEmail"] = toEmail
        };

        var (subject, body) = ResolveTemplate("STALL_CARD_EMAIL", booking.TenantId, values);

        return EmailLog.Create(
            booking.TenantId,
            booking.EventId,
            booking.Id,
            toEmail,
            subject,
            body,
            "STALL_CARD_EMAIL");
    }

    public EmailLog ComposePaymentReminder(
        StallBookingEntity booking,
        Exhibitor exhibitor,
        string? stallNumber,
        decimal expectedAmount,
        decimal paidAmount,
        decimal balanceAmount,
        DateTimeOffset? blockExpiresAt,
        DateTimeOffset? allocatedAt,
        string toEmail)
    {
        var allocationDateText = allocatedAt is DateTimeOffset allocated
            ? allocated.ToOffset(TimeSpan.FromHours(5.5)).ToString("dd MMM yyyy")
            : "-";

        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["bookingRegistrationNumber"] = booking.BookingRegistrationNumber,
            ["BookingRegistrationNumber"] = booking.BookingRegistrationNumber,
            ["stallNumber"] = stallNumber ?? "-",
            ["allocationDate"] = allocationDateText,
            ["expectedAmount"] = $"{expectedAmount:N2}",
            ["paidAmount"] = $"{paidAmount:N2}",
            ["balanceAmount"] = $"{balanceAmount:N2}",
            ["toEmail"] = toEmail
        };

        var (subject, body) = ResolveTemplate("PAYMENT_REMINDER", booking.TenantId, values);

        return EmailLog.Create(
            booking.TenantId,
            booking.EventId,
            booking.Id,
            toEmail,
            subject,
            body,
            "PAYMENT_REMINDER");
    }

    public EmailLog ComposePaymentReceipt(
        StallBookingEntity booking,
        Stall stall,
        Exhibitor exhibitor,
        Payment payment,
        decimal expectedTotal,
        decimal totalPaidAfterThis,
        bool isFullSettlement,
        string toEmail)
    {
        var companyName = !string.IsNullOrWhiteSpace(exhibitor.TradeName)
            ? exhibitor.TradeName.Trim()
            : !string.IsNullOrWhiteSpace(exhibitor.LegalName)
                ? exhibitor.LegalName.Trim()
                : "Your Company";

        var contactPersonName = !string.IsNullOrWhiteSpace(exhibitor.ContactPersonName)
            ? exhibitor.ContactPersonName.Trim()
            : "Exhibitor";

        var balanceDue = Math.Max(0m, expectedTotal - totalPaidAfterThis);
        var templateCode = isFullSettlement
            ? "PAYMENT_VERIFIED_RECEIPT_SENT"
            : "PART_PAYMENT_VERIFIED_RECEIPT_SENT";

        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["bookingRegistrationNumber"] = booking.BookingRegistrationNumber,
            ["BookingRegistrationNumber"] = booking.BookingRegistrationNumber,
            ["companyName"] = companyName,
            ["contactPersonName"] = contactPersonName,
            ["contactPerson"] = contactPersonName,
            ["stallNumber"] = stall.StallNumber,
            ["paymentReferenceNumber"] = payment.PaymentReferenceNumber ?? "-",
            ["paymentDate"] = payment.PaymentDate.ToString("dd-MM-yyyy"),
            ["amountPaid"] = $"{payment.AmountPaid:N2}",
            ["fullStallAmount"] = $"{expectedTotal:N2}",
            ["balanceDue"] = $"{balanceDue:N2}",
            ["toEmail"] = toEmail
        };

        var (subject, body) = ResolveTemplate(templateCode, booking.TenantId, values);

        return EmailLog.Create(
            booking.TenantId,
            booking.EventId,
            booking.Id,
            toEmail,
            subject,
            body,
            templateCode);
    }

    public EmailLog ComposeTaxInvoiceEmail(
        StallBookingEntity booking,
        ProformaInvoice invoice,
        Exhibitor exhibitor,
        string toEmail)
    {
        var companyName = !string.IsNullOrWhiteSpace(exhibitor.TradeName)
            ? exhibitor.TradeName.Trim()
            : !string.IsNullOrWhiteSpace(exhibitor.LegalName)
                ? exhibitor.LegalName.Trim()
                : "Your Company";

        var contactPersonName = !string.IsNullOrWhiteSpace(exhibitor.ContactPersonName)
            ? exhibitor.ContactPersonName.Trim()
            : "Exhibitor";

        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["bookingRegistrationNumber"] = booking.BookingRegistrationNumber,
            ["BookingRegistrationNumber"] = booking.BookingRegistrationNumber,
            ["taxInvoiceNumber"] = invoice.TaxInvoiceNumber ?? invoice.InvoiceNumber,
            ["invoiceDate"] = invoice.InvoiceDate.ToString("dd-MM-yyyy"),
            ["companyName"] = companyName,
            ["contactPerson"] = contactPersonName,
            ["stallNumber"] = invoice.StallNumber ?? "-",
            ["totalAmount"] = $"{invoice.TotalAmount:N2}",
            ["toEmail"] = toEmail
        };

        var (subject, body) = ResolveTemplate("INVOICE_SENT", invoice.TenantId, values);

        return EmailLog.Create(
            invoice.TenantId,
            invoice.EventId,
            invoice.BookingId,
            toEmail,
            subject,
            body,
            "INVOICE_SENT");
    }

    public EmailLog ComposeVisitorPass(
        string recipientName,
        string registrationNumber,
        string verificationUrl,
        string toEmail,
        Guid tenantId,
        Guid? eventId)
    {
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["recipientName"] = recipientName,
            ["registrationNumber"] = registrationNumber,
            ["verificationUrl"] = verificationUrl,
            ["toEmail"] = toEmail
        };

        var (subject, body) = ResolveTemplate("VISITOR_ENTRY_PASS", tenantId, values);

        return EmailLog.Create(
            tenantId,
            eventId,
            null,
            toEmail,
            subject,
            body,
            "VISITOR_ENTRY_PASS");
    }

    public EmailLog ComposeVisitorNotification(
        string recipientName,
        string subject,
        string messageBody,
        string toEmail,
        Guid tenantId,
        Guid? eventId)
    {
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["recipientName"] = recipientName,
            ["subject"] = subject,
            ["messageBody"] = messageBody,
            ["toEmail"] = toEmail
        };

        var (resolvedSubject, resolvedBody) = ResolveTemplate("VISITOR_NOTIFICATION", tenantId, values);

        return EmailLog.Create(
            tenantId,
            eventId,
            null,
            toEmail,
            resolvedSubject,
            resolvedBody,
            "VISITOR_NOTIFICATION");
    }

    public EmailLog ComposeVipPass(
        string recipientName,
        string registrationNumber,
        string verificationUrl,
        string toEmail,
        Guid tenantId,
        Guid? eventId)
    {
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["recipientName"] = recipientName,
            ["registrationNumber"] = registrationNumber,
            ["verificationUrl"] = verificationUrl,
            ["toEmail"] = toEmail
        };

        var (subject, body) = ResolveTemplate("VIP_ENTRY_PASS", tenantId, values);

        return EmailLog.Create(
            tenantId,
            eventId,
            null,
            toEmail,
            subject,
            body,
            "VIP_ENTRY_PASS");
    }

    public EmailLog ComposeStallVisitorInterest(
        string recipientName,
        string visitorLabel,
        string fasciaName,
        string? visitorMobile,
        string? visitorEmail,
        string toEmail,
        Guid tenantId,
        Guid? eventId,
        Guid? bookingId)
    {
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["recipientName"] = recipientName,
            ["visitorLabel"] = visitorLabel,
            ["visitorMobile"] = visitorMobile ?? "-",
            ["visitorEmail"] = visitorEmail ?? "-",
            ["fasciaName"] = fasciaName,
            ["toEmail"] = toEmail
        };

        var (subject, body) = ResolveTemplate("STALL_VISITOR_INTEREST", tenantId, values);

        return EmailLog.Create(
            tenantId,
            eventId,
            bookingId,
            toEmail,
            subject,
            body,
            "STALL_VISITOR_INTEREST");
    }

    public EmailLog ComposeMarketplaceUserWelcome(
        string contactPerson,
        string orgName,
        string contactEmail,
        string tempPassword,
        string loginUrl,
        Guid tenantId,
        Guid? eventId)
    {
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["contactPerson"] = contactPerson,
            ["orgName"] = orgName,
            ["contactEmail"] = contactEmail,
            ["tempPassword"] = tempPassword,
            ["loginUrl"] = loginUrl,
            ["toEmail"] = contactEmail
        };

        var templateToUse = "MARKETPLACE_SEND_CREDENTIALS";
        try
        {
            if (_db != null &&
                !_db.EmailTemplates.Any(t => t.TenantId == tenantId && t.TemplateCode == "MARKETPLACE_SEND_CREDENTIALS" && t.IsActive) &&
                !_db.EmailTemplates.Any(t => t.TemplateCode == "MARKETPLACE_SEND_CREDENTIALS" && t.IsActive))
            {
                templateToUse = "MARKETPLACE_USER_WELCOME";
            }
        }
        catch
        {
            templateToUse = "MARKETPLACE_SEND_CREDENTIALS";
        }

        var (subject, body) = ResolveTemplate(templateToUse, tenantId, values);

        return EmailLog.Create(
            tenantId,
            eventId,
            null,
            contactEmail,
            subject,
            body,
            templateToUse);
    }

    public EmailLog ComposeFromTemplate(
        string templateCode,
        Guid tenantId,
        Guid? eventId,
        Guid? bookingId,
        string toEmail,
        IDictionary<string, string?> values)
    {
        var (subject, body) = ResolveTemplate(templateCode, tenantId, values);

        return EmailLog.Create(
            tenantId,
            eventId,
            bookingId,
            toEmail,
            subject,
            body,
            templateCode);
    }

    public EmailLog ComposeAdditionalRequirementsSubmitted(
        Guid tenantId,
        Guid? eventId,
        Guid bookingId,
        string toEmail,
        string companyName,
        string contactPersonName,
        string mobile,
        string bookingRegistrationNumber,
        string? stallNumber,
        Guid requestId,
        string requestStatus,
        decimal totalBaseAmount,
        decimal totalGstAmount,
        decimal grandTotal,
        string itemsTableHtml,
        string? notes = null)
    {
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["companyName"] = companyName,
            ["contactPersonName"] = contactPersonName,
            ["mobile"] = mobile,
            ["email"] = toEmail,
            ["bookingRegistrationNumber"] = bookingRegistrationNumber,
            ["stallNumber"] = string.IsNullOrWhiteSpace(stallNumber) ? "Allocation Pending" : stallNumber,
            ["requestId"] = requestId.ToString(),
            ["requestStatus"] = requestStatus,
            ["notes"] = !string.IsNullOrWhiteSpace(notes) ? notes.Trim() : "None",
            ["totalBaseAmount"] = totalBaseAmount.ToString("N2"),
            ["totalGstAmount"] = totalGstAmount.ToString("N2"),
            ["grandTotal"] = grandTotal.ToString("N2"),
            ["itemsTableHtml"] = itemsTableHtml
        };

        return ComposeFromTemplate(
            "EXHIBITOR_ADDITIONAL_REQUIREMENTS_SUBMITTED",
            tenantId,
            eventId,
            bookingId,
            toEmail,
            values);
    }

    public EmailLog ComposeAdminAdditionalRequirementsAlert(
        Guid tenantId,
        Guid? eventId,
        Guid bookingId,
        string toEmail,
        string companyName,
        string contactPersonName,
        string mobile,
        string exhibitorEmail,
        string bookingRegistrationNumber,
        string? stallNumber,
        Guid requestId,
        string requestStatus,
        decimal totalBaseAmount,
        decimal totalGstAmount,
        decimal grandTotal,
        string itemsTableHtml,
        string? notes = null)
    {
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["companyName"] = companyName,
            ["contactPersonName"] = contactPersonName,
            ["mobile"] = mobile,
            ["email"] = exhibitorEmail,
            ["bookingRegistrationNumber"] = bookingRegistrationNumber,
            ["stallNumber"] = string.IsNullOrWhiteSpace(stallNumber) ? "Allocation Pending" : stallNumber,
            ["requestId"] = requestId.ToString(),
            ["requestStatus"] = requestStatus,
            ["notes"] = !string.IsNullOrWhiteSpace(notes) ? notes.Trim() : "None",
            ["totalBaseAmount"] = totalBaseAmount.ToString("N2"),
            ["totalGstAmount"] = totalGstAmount.ToString("N2"),
            ["grandTotal"] = grandTotal.ToString("N2"),
            ["itemsTableHtml"] = itemsTableHtml
        };

        return ComposeFromTemplate(
            "ADMIN_ADDITIONAL_REQUIREMENTS_ALERT",
            tenantId,
            eventId,
            bookingId,
            toEmail,
            values);
    }

    public EmailLog ComposeAdditionalRequirementsStatusUpdate(
        Guid tenantId,
        Guid? eventId,
        Guid bookingId,
        string toEmail,
        string companyName,
        string contactPersonName,
        string bookingRegistrationNumber,
        string? stallNumber,
        Guid requestId,
        string requestStatus,
        string callNotes,
        decimal totalBaseAmount,
        decimal totalGstAmount,
        decimal grandTotal,
        string itemsTableHtml,
        string? notes = null)
    {
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["companyName"] = companyName,
            ["contactPersonName"] = contactPersonName,
            ["email"] = toEmail,
            ["bookingRegistrationNumber"] = bookingRegistrationNumber,
            ["stallNumber"] = string.IsNullOrWhiteSpace(stallNumber) ? "Allocation Pending" : stallNumber,
            ["requestId"] = requestId.ToString(),
            ["requestStatus"] = requestStatus,
            ["callNotes"] = string.IsNullOrWhiteSpace(callNotes) ? "Your requirements have been processed." : callNotes,
            ["notes"] = !string.IsNullOrWhiteSpace(notes) ? notes.Trim() : "None",
            ["totalBaseAmount"] = totalBaseAmount.ToString("N2"),
            ["totalGstAmount"] = totalGstAmount.ToString("N2"),
            ["grandTotal"] = grandTotal.ToString("N2"),
            ["itemsTableHtml"] = itemsTableHtml
        };

        return ComposeFromTemplate(
            "EXHIBITOR_ADDITIONAL_REQUIREMENTS_STATUS_UPDATE",
            tenantId,
            eventId,
            bookingId,
            toEmail,
            values);
    }
}