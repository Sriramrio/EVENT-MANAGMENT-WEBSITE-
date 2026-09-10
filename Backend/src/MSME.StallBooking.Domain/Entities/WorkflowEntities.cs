using MSME.StallBooking.Domain.Enums;
using MSME.StallBooking.SharedKernel.Audit;
using MSME.StallBooking.SharedKernel.Errors;

namespace MSME.StallBooking.Domain.Entities;

public sealed class StallBooking : AuditableEntity
{
    private StallBooking() { }

    public Guid ExhibitorId { get; private set; }
    public Guid BillingProfileId { get; private set; }
    public Guid RequestedStallSizeId { get; private set; }
    public Guid? AllocatedStallId { get; private set; }
    public Guid? StallOption1Id { get; set; }
    public Guid? StallOption2Id { get; set; }

    public Stall? StallOption1 { get; set; }
    public Stall? StallOption2 { get; set; }
    public string BookingRegistrationNumber { get; private set; } = "";
    public DateTimeOffset BookingDate { get; private set; } = DateTimeOffset.UtcNow;
    public BookingStatus BookingStatus { get; private set; } = BookingStatus.Submitted;
    public string FasciaName { get; private set; } = "";
    public string? DisplayNotes { get; private set; }
    public string? ElectricalRequirement { get; private set; }
    public string? SpecialRequirement { get; private set; }
    public bool HazardousDemoDeclared { get; private set; }
    public bool TermsAccepted { get; private set; }
    public bool AccuracyAccepted { get; private set; }
    public bool PaymentTimelineAccepted { get; private set; }
    public bool CancellationPolicyAccepted { get; private set; }
    public bool PrivacyConsentAccepted { get; private set; }
    public string DeclarantName { get; private set; } = "";
    public string DeclarantDesignation { get; private set; } = "";
    public DateOnly DeclarationDate { get; private set; }
    public DateTimeOffset? BlockExpiresAt { get; private set; }
    public DateTimeOffset? LastEmailSentAt { get; private set; }
    public DateTimeOffset? ConfirmedAt { get; private set; }
    public DateTimeOffset? CancelledAt { get; private set; }
    public string? CancellationReason { get; private set; }

    public static StallBooking Submit(Guid tenantId, Guid eventId, Guid exhibitorId, Guid billingProfileId, Guid requestedStallSizeId, string bookingRegistrationNumber, string fasciaName, string? displayNotes, string? electricalRequirement, string? specialRequirement, bool hazardousDemoDeclared, bool termsAccepted, bool accuracyAccepted, bool paymentTimelineAccepted, bool cancellationPolicyAccepted, bool privacyConsentAccepted, string declarantName, string declarantDesignation, DateOnly declarationDate)
    {
        return new StallBooking
        {
            TenantId = tenantId,
            EventId = eventId,
            ExhibitorId = exhibitorId,
            BillingProfileId = billingProfileId,
            RequestedStallSizeId = requestedStallSizeId,
            BookingRegistrationNumber = bookingRegistrationNumber,
            BookingDate = DateTimeOffset.UtcNow,
            BookingStatus = BookingStatus.Submitted,
            FasciaName = fasciaName.Trim().ToUpperInvariant(),
            DisplayNotes = string.IsNullOrWhiteSpace(displayNotes) ? null : displayNotes.Trim(),
            ElectricalRequirement = string.IsNullOrWhiteSpace(electricalRequirement) ? null : electricalRequirement.Trim(),
            SpecialRequirement = string.IsNullOrWhiteSpace(specialRequirement) ? null : specialRequirement.Trim(),
            HazardousDemoDeclared = hazardousDemoDeclared,
            TermsAccepted = termsAccepted,
            AccuracyAccepted = accuracyAccepted,
            PaymentTimelineAccepted = paymentTimelineAccepted,
            CancellationPolicyAccepted = cancellationPolicyAccepted,
            PrivacyConsentAccepted = privacyConsentAccepted,
            DeclarantName = declarantName.Trim(),
            DeclarantDesignation = declarantDesignation.Trim(),
            DeclarationDate = declarationDate
        };
    }

    public void MarkUnderReview()
    {
        if (BookingStatus != BookingStatus.Submitted)
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Only submitted bookings can be marked under review.");
        BookingStatus = BookingStatus.UnderReview;
    }
    public void UpdateApplicationInformation(
    Guid requestedStallSizeId,
    string fasciaName,
    string? displayNotes,
    string? electricalRequirement,
    string? specialRequirement,
    bool hazardousDemoDeclared,
    bool termsAccepted,
    string declarantName,
    string declarantDesignation,
    DateOnly declarationDate)
    {
        RequestedStallSizeId = requestedStallSizeId;
        FasciaName = fasciaName;
        DisplayNotes = displayNotes;
        ElectricalRequirement = electricalRequirement;
        SpecialRequirement = specialRequirement;
        HazardousDemoDeclared = hazardousDemoDeclared;
        TermsAccepted = termsAccepted;
        DeclarantName = declarantName;
        DeclarantDesignation = declarantDesignation;
        DeclarationDate = declarationDate;
    }

    public void MarkBlocked(Guid stallId, DateTimeOffset blockExpiresAt)
    {
        if (BookingStatus is not (BookingStatus.Submitted or BookingStatus.UnderReview))
            throw new DomainRuleException(ErrorCodes.BookingNotEligibleForBlocking, "Booking is not eligible for stall blocking.");
        AllocatedStallId = stallId;
        BookingStatus = BookingStatus.BlockedAwaitingPayment;
        BlockExpiresAt = blockExpiresAt;
        LastEmailSentAt = DateTimeOffset.UtcNow;
    }
    public void ExtendBlockExpiry(DateTimeOffset newExpiryAt)
    {
        // UPDATE THIS GUARD CLAUSE
        if (BookingStatus is not (BookingStatus.BlockedAwaitingPayment or BookingStatus.PaymentSubmitted))
        {
            throw new DomainRuleException(
                ErrorCodes.BookingNotEligibleForBlocking,
                "Only a blocked-awaiting-payment or payment-submitted booking's expiry can be extended.");
        }

        if (newExpiryAt <= DateTimeOffset.UtcNow)
        {
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "New expiry date must be in the future.");
        }

        BlockExpiresAt = newExpiryAt;
        UpdatedAt = DateTimeOffset.UtcNow;
    }


    public void MarkPaymentSubmitted() => BookingStatus = BookingStatus.PaymentSubmitted;

    public void ConfirmPaymentAndFreeze()
    {
        if (AllocatedStallId is null)
            throw new DomainRuleException(ErrorCodes.InvoiceNotAllowedBeforePayment, "Cannot confirm booking without allocated stall.");
        if (BookingStatus is not (BookingStatus.BlockedAwaitingPayment or BookingStatus.PaymentSubmitted))
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Booking is not in payment-confirmable status.");
        BookingStatus = BookingStatus.Confirmed;
        ConfirmedAt = DateTimeOffset.UtcNow;
        BlockExpiresAt = null;
    }

    public void ReleaseDueToNonPayment(string reason)
    {
        if (BookingStatus != BookingStatus.BlockedAwaitingPayment && BookingStatus != BookingStatus.PaymentSubmitted)
            return;
        BookingStatus = BookingStatus.ReleasedDueToNonPayment;
        AllocatedStallId = null;
        BlockExpiresAt = null;
        CancellationReason = reason;
    }

    public void Cancel(string reason)
    {
        if (string.IsNullOrWhiteSpace(reason)) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Cancellation reason is required.");
        BookingStatus = BookingStatus.Cancelled;
        CancelledAt = DateTimeOffset.UtcNow;
        CancellationReason = reason.Trim();
    }
}

public sealed class StallAllocation : AuditableEntity
{
    private StallAllocation() { }
    public Guid BookingId { get; private set; }
    public Guid StallId { get; private set; }
    public AllocationStatus AllocationStatus { get; private set; }
    public DateTimeOffset BlockedAt { get; private set; }
    public Guid BlockedBy { get; private set; }
    public DateTimeOffset? BlockExpiresAt { get; private set; }
    public DateTimeOffset? FrozenAt { get; private set; }
    public Guid? FrozenBy { get; private set; }
    public DateTimeOffset? ReleasedAt { get; private set; }
    public Guid? ReleasedBy { get; private set; }
    public string? ReleaseReason { get; private set; }
    public Guid? PreviousStallId { get; private set; }

    public static StallAllocation Block(Guid tenantId, Guid eventId, Guid bookingId, Guid stallId, Guid actorUserId, DateTimeOffset expiresAt)
    {
        return new StallAllocation
        {
            TenantId = tenantId,
            EventId = eventId,
            BookingId = bookingId,
            StallId = stallId,
            BlockedAt = DateTimeOffset.UtcNow,
            BlockedBy = actorUserId,
            BlockExpiresAt = expiresAt,
            AllocationStatus = AllocationStatus.Blocked
        };
    }
    public void ExtendBlock(DateTimeOffset newExpiryAt)
    {
        if (AllocationStatus != AllocationStatus.Blocked)
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Only a blocked allocation's expiry can be extended.");
        if (newExpiryAt <= DateTimeOffset.UtcNow)
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "New expiry date must be in the future.");
        BlockExpiresAt = newExpiryAt;
    }

    public void Freeze(Guid actorUserId)
    {
        if (AllocationStatus != AllocationStatus.Blocked)
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Only blocked allocation can be frozen.");
        AllocationStatus = AllocationStatus.Frozen;
        FrozenAt = DateTimeOffset.UtcNow;
        FrozenBy = actorUserId;
        BlockExpiresAt = null;

    }

    public void Release(Guid actorUserId, string reason)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Release reason is required.");
        AllocationStatus = AllocationStatus.Released;
        ReleasedAt = DateTimeOffset.UtcNow;
        ReleasedBy = actorUserId;
        ReleaseReason = reason.Trim();
    }
    public void ReleaseBlock(Guid actorUserId, string reason)
    {
        if (actorUserId == Guid.Empty)
        {
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "Actor user ID is required.");
        }

        if (AllocationStatus != AllocationStatus.Blocked &&
            AllocationStatus != AllocationStatus.Frozen)
        {
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                $"Only a blocked or frozen allocation can be released. Current status: {AllocationStatus}.");
        }

        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "Release reason is required.");
        }

        AllocationStatus = AllocationStatus.Released;
        ReleasedAt = DateTimeOffset.UtcNow;
        ReleasedBy = actorUserId;
        ReleaseReason = reason.Trim();

        UpdatedAt = DateTimeOffset.UtcNow;
        UpdatedBy = actorUserId;
    }
}

public sealed class Payment : AuditableEntity
{
    private Payment() { }
    public Guid BookingId { get; private set; }
    public string PaymentReferenceNumber { get; private set; } = "";
    public PaymentMode PaymentMode { get; private set; }
    public string PayerName { get; private set; } = "";
    public string? PayerBank { get; private set; } = "";
    public decimal AmountPaid { get; private set; }
    public DateOnly PaymentDate { get; private set; }
    public DateTimeOffset? PaymentReceivedDate { get; private set; }
    public bool BankAccountMatched { get; private set; }
    public Guid? PaymentProofFileId { get; private set; }
    public PaymentVerificationStatus VerificationStatus { get; private set; } = PaymentVerificationStatus.Submitted;
    public Guid? VerifiedBy { get; private set; }
    public DateTimeOffset? VerifiedAt { get; private set; }
    public string? RejectionReason { get; private set; }
    public string? Remarks { get; private set; }
    public string? ReceiptNumber { get; private set; }
    public bool IsPartialPayment { get; private set; }
    public bool isTdsDeductable { get; private set; }
    public decimal? TdsPercentage { get; private set; }
    public bool isGstApplicable { get; private set; }
    public string? gstType { get; private set; }

    public string? gstAmount { get; private set; }
    public decimal? TargetSponsorTotal { get; set; }


    public static Payment Submit(
      Guid tenantId,
      Guid eventId,
      Guid bookingId,
      string reference,
      PaymentMode mode,
      string payerName,
      decimal amount,
      DateOnly paymentDate,
      Guid? proofFileId,
      bool isTdsDeductable = false,
      decimal? tdsPercentage = null,
      bool isGstApplicable = false,
      string? gstType = null,
      string? gstAmount = null,
      decimal? TargetSponsorTotal = null
      )
    {
        if (amount <= 0) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Payment amount must be positive.");
        return new Payment
        {
            TenantId = tenantId,
            EventId = eventId,
            BookingId = bookingId,
            PaymentReferenceNumber = reference.Trim(),
            PaymentMode = mode,
            PayerName = payerName.Trim(),
            AmountPaid = amount,
            PaymentDate = paymentDate,
            PaymentProofFileId = proofFileId,
            VerificationStatus = PaymentVerificationStatus.Submitted,
            isTdsDeductable = isTdsDeductable,
            TdsPercentage = isTdsDeductable ? (tdsPercentage ?? 2m) : null,
            isGstApplicable = isGstApplicable,
            gstType = gstType,
            gstAmount = gstAmount,
            TargetSponsorTotal = TargetSponsorTotal
        };
    }

    public void UpdateBankDetails(string? payerBank, string? remarks)
    {
        PayerBank = string.IsNullOrWhiteSpace(payerBank) ? null : payerBank.Trim();
        Remarks = string.IsNullOrWhiteSpace(remarks) ? null : remarks.Trim();
    }

    public void Verify(
     Guid actorUserId,
     decimal expectedAmount,
     string receiptNumber,
     bool isPartialPayment,
     bool isTdsDeductable = false,
     decimal? tdsPercentage = null)
    {
        if (VerificationStatus == PaymentVerificationStatus.Verified)
            throw new DomainRuleException(
                ErrorCodes.PaymentAlreadyVerified,
                "Payment is already verified.");

        VerificationStatus = PaymentVerificationStatus.Verified;
        VerifiedBy = actorUserId;
        VerifiedAt = DateTimeOffset.UtcNow;
        BankAccountMatched = true;
        PaymentReceivedDate = DateTimeOffset.UtcNow;
        ReceiptNumber = receiptNumber;
        IsPartialPayment = isPartialPayment;
        this.isTdsDeductable = isTdsDeductable;
        TdsPercentage = isTdsDeductable ? (tdsPercentage ?? TdsPercentage ?? 2m) : null;
    }

    public void Reject(Guid actorUserId, string reason)
    {
        if (string.IsNullOrWhiteSpace(reason)) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Payment rejection reason is required.");
        VerificationStatus = PaymentVerificationStatus.Rejected;
        VerifiedBy = actorUserId;
        VerifiedAt = DateTimeOffset.UtcNow;
        RejectionReason = reason.Trim();
    }
}

public sealed class ProformaInvoice : AuditableEntity
{
    private ProformaInvoice() { }
    public Guid BookingId { get; private set; }
    public string InvoiceNumber { get; private set; } = "";
    public string? TaxInvoiceNumber { get; private set; } = "";
    public DateOnly InvoiceDate { get; private set; }
    public InvoiceStatus InvoiceStatus { get; private set; } = InvoiceStatus.Generated;
    public string SellerLegalName { get; private set; } = "";
    public string SellerAddress { get; private set; } = "";
    public string SellerGstin { get; private set; } = "";
    public string SellerPan { get; private set; } = "";
    public string BuyerLegalName { get; private set; } = "";
    public string BuyerAddress { get; private set; } = "";
    public string BuyerGstin { get; private set; } = "";
    public string BuyerPan { get; private set; } = "";
    public string PlaceOfSupply { get; private set; } = "";
    public string StallNumber { get; private set; } = "";
    public string StallSizeDisplay { get; private set; } = "";
    public string HsnSac { get; private set; } = "HSN 998596";
    public string Description { get; private set; } = "MSME SANGAMAM EXPO TAMILNADU";
    public decimal BaseAmount { get; private set; }
    public decimal GstPercentage { get; private set; }
    public decimal GstAmount { get; private set; }
    public decimal TotalAmount { get; private set; }
    public bool isTdsDeductable { get; private set; }
    public decimal? TdsPercentage { get; private set; }
    public string AmountInWords { get; private set; } = "";
    public string TaxAmountInWords { get; private set; } = "";
    public string Notes { get; private set; } = "";
    public string BankAccountName { get; private set; } = "";
    public string BankName { get; private set; } = "";
    public string BankAccountNumber { get; private set; } = "";
    public string IfscCode { get; private set; } = "";
    public string BranchName { get; private set; } = "";
    public Guid? PdfFileId { get; private set; }
    public Guid GeneratedBy { get; private set; }
    public DateTimeOffset GeneratedAt { get; private set; }
    public Guid? SentBy { get; private set; }
    public DateTimeOffset? SentAt { get; private set; }

    public static ProformaInvoice Generate(Guid tenantId, Guid eventId, Guid bookingId, string invoiceNumber, Guid actorUserId, InvoiceSnapshot snapshot)
    {
        var gstAmount = Math.Round(snapshot.BaseAmount * snapshot.GstPercentage / 100m, 2);
        return new ProformaInvoice
        {
            TenantId = tenantId,
            EventId = eventId,
            BookingId = bookingId,
            InvoiceNumber = invoiceNumber,
            InvoiceDate = DateOnly.FromDateTime(DateTime.UtcNow),
            InvoiceStatus = InvoiceStatus.Generated,
            SellerLegalName = snapshot.SellerLegalName,
            SellerAddress = snapshot.SellerAddress,
            SellerGstin = snapshot.SellerGstin,
            SellerPan = snapshot.SellerPan,
            BuyerLegalName = snapshot.BuyerLegalName,
            BuyerAddress = snapshot.BuyerAddress,
            BuyerGstin = snapshot.BuyerGstin,
            BuyerPan = snapshot.BuyerPan,
            PlaceOfSupply = snapshot.PlaceOfSupply,
            StallNumber = snapshot.StallNumber,
            StallSizeDisplay = snapshot.StallSizeDisplay,
            BaseAmount = snapshot.BaseAmount,
            GstPercentage = snapshot.GstPercentage,
            GstAmount = gstAmount,
            TotalAmount = snapshot.BaseAmount + gstAmount,
            isTdsDeductable = snapshot.isTdsDeductable,
            TdsPercentage = snapshot.isTdsDeductable ? (snapshot.TdsPercentage ?? 2m) : null,
            AmountInWords = MSME.StallBooking.SharedKernel.Helpers.NumberToWordsConverter.Convert(snapshot.BaseAmount + gstAmount),
            TaxAmountInWords = MSME.StallBooking.SharedKernel.Helpers.NumberToWordsConverter.Convert(gstAmount),
            Notes = snapshot.Notes,
            HsnSac = string.IsNullOrWhiteSpace(snapshot.HsnSac) ? "HSN 998596" : snapshot.HsnSac,
            BankAccountName = snapshot.BankAccountName,
            BankName = snapshot.BankName,
            BankAccountNumber = snapshot.BankAccountNumber,
            IfscCode = snapshot.IfscCode,
            BranchName = snapshot.BranchName,
            GeneratedBy = actorUserId,
            GeneratedAt = DateTimeOffset.UtcNow

        };
    }
    public void UpdateStallDetails(
    InvoiceSnapshot snapshot,
    Guid actorUserId)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        var gstAmount = Math.Round(
            snapshot.BaseAmount * snapshot.GstPercentage / 100m,
            2);

        SellerLegalName = snapshot.SellerLegalName;
        SellerAddress = snapshot.SellerAddress;
        SellerGstin = snapshot.SellerGstin;
        SellerPan = snapshot.SellerPan;

        BuyerLegalName = snapshot.BuyerLegalName;
        BuyerAddress = snapshot.BuyerAddress;
        BuyerGstin = snapshot.BuyerGstin;
        BuyerPan = snapshot.BuyerPan;
        PlaceOfSupply = snapshot.PlaceOfSupply;
        InvoiceDate = DateOnly.FromDateTime(DateTime.UtcNow);
        // Update selected blocked stall details
        StallNumber = snapshot.StallNumber;
        StallSizeDisplay = snapshot.StallSizeDisplay;

        // Update selected stall-size pricing
        BaseAmount = snapshot.BaseAmount;
        GstPercentage = snapshot.GstPercentage;
        GstAmount = gstAmount;
        TotalAmount = snapshot.BaseAmount + gstAmount;
        isTdsDeductable = snapshot.isTdsDeductable;
        TdsPercentage = snapshot.isTdsDeductable ? (snapshot.TdsPercentage ?? 2m) : null;

        AmountInWords = MSME.StallBooking.SharedKernel.Helpers.NumberToWordsConverter.Convert(snapshot.BaseAmount + gstAmount);
        TaxAmountInWords = MSME.StallBooking.SharedKernel.Helpers.NumberToWordsConverter.Convert(gstAmount);
        Notes = snapshot.Notes;

        BankAccountName = snapshot.BankAccountName;
        BankName = snapshot.BankName;
        BankAccountNumber = snapshot.BankAccountNumber;
        IfscCode = snapshot.IfscCode;
        BranchName = snapshot.BranchName;

        GeneratedBy = actorUserId;
        GeneratedAt = DateTimeOffset.UtcNow;

        UpdatedBy = actorUserId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void MarkSent(Guid actorUserId, string taxInvoiceNumber)
    {
        TaxInvoiceNumber = taxInvoiceNumber;
        InvoiceStatus = InvoiceStatus.Sent;
        SentBy = actorUserId;
        SentAt = DateTimeOffset.UtcNow;
    }
    public void UpdateHsn(string hsnSac)
    {
        if (string.IsNullOrWhiteSpace(hsnSac)) return;
        HsnSac = hsnSac;
    }

    public void UpdateTdsApplicable(bool isTdsDeductable, decimal? tdsPercentage = null)
    {
        this.isTdsDeductable = isTdsDeductable;
        TdsPercentage = isTdsDeductable ? (tdsPercentage ?? TdsPercentage ?? 2m) : null;
    }
}

public sealed record InvoiceSnapshot(
    string SellerLegalName,
    string SellerAddress,
    string SellerGstin,
    string SellerPan,
    string BuyerLegalName,
    string BuyerAddress,
    string BuyerGstin,
    string BuyerPan,
    string PlaceOfSupply,
    string StallNumber,
    string StallSizeDisplay,
    decimal BaseAmount,
    decimal GstPercentage,
    string AmountInWords,
    string TaxAmountInWords,
    string Notes,
    string BankAccountName,
    string BankName,
    string BankAccountNumber,
    string IfscCode,
    string BranchName,
    string? HsnSac = null,
    bool isTdsDeductable = false,
    decimal? TdsPercentage = null);
public sealed class StallInterest : AuditableEntity
{
    private StallInterest() { }

    public Guid StallBookingId { get; private set; }
    public Guid ExhibitorId { get; private set; }
    public string? VisitorName { get; private set; }
    public string? VisitorMobile { get; private set; }
    public string? VisitorEmail { get; private set; }
    public bool IsRead { get; private set; }

    public static StallInterest Create(
        Guid tenantId,
        Guid? eventId,
        Guid stallBookingId,
        Guid exhibitorId,
        string? visitorName,
        string? visitorMobile,
        string? visitorEmail,
        string? correlationId = null)
    {
        var interest = new StallInterest
        {
            StallBookingId = stallBookingId,
            ExhibitorId = exhibitorId,
            VisitorName = string.IsNullOrWhiteSpace(visitorName) ? null : visitorName.Trim(),
            VisitorMobile = string.IsNullOrWhiteSpace(visitorMobile) ? null : visitorMobile.Trim(),
            VisitorEmail = string.IsNullOrWhiteSpace(visitorEmail) ? null : visitorEmail.Trim()
        };
        interest.StampCreate(tenantId, eventId, null, correlationId);
        return interest;
    }

    public void MarkRead() => IsRead = true;
}