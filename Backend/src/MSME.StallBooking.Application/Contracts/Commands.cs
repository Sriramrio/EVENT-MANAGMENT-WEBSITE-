using MSME.StallBooking.Domain.Enums;

namespace MSME.StallBooking.Application.Contracts;

public sealed record SubmitBookingCommand(
    Guid TenantId,
    Guid EventId,
    ExhibitorInput Exhibitor,
    BillingInput? Billing,
    Guid RequestedStallSizeId,
    Guid? StallOption1Id,
    Guid? StallOption2Id,
    string FasciaName,
    string? DisplayNotes,
    string? ElectricalRequirement,
    string? SpecialRequirement,
    bool HazardousDemoDeclared,
    bool FinalAllocationConsentAccepted,
    string? DeclarantName,
    string? DeclarantDesignation,
    DateOnly? DeclarationDate,
    bool TermsAccepted,
    bool? AccuracyAccepted,
    bool? PaymentTimelineAccepted,
    bool? CancellationPolicyAccepted,
    bool? PrivacyConsentAccepted);

public sealed record ExhibitorInput(
    string LegalName,
    string? TradeName,
    string RegisteredAddress,
    string City,
    string District,
    string State,
    string Pincode,
    string Country,
    string ContactPersonName,
    string ContactPersonDesignation,
    string Mobile,
    string? AlternateMobile,
    string Email,
    string? AlternateEmail,
    string? Website,
    string IndustryScale,
    string BusinessType,
    string CompanyConstitution,
    string IndustryCategory,
    string ProductServiceDescription,
    string ProductKeywords,
    string UdyamNumber,
     string TanNumber,
    string Gstin,
    string Pan,
    bool LubMember,
    string LubState,
    string LubChapter,
    string? LubMembershipNumber,
    string? BankAccountName,
    string? BankName,
    string? BankAccountNumber,
    string? BankIfscCode);

public sealed record BillingInput(
    string BillingLegalName,
    string BillingAddress,
    string BillingCity,
    string BillingState,
    string BillingStateCode,
    string BillingPincode,
    string BillingCountry,
    string BillingGstin,
    string BillingPan,
    string PlaceOfSupply,
    string BillingContactPerson,
    string BillingEmail,
    string BillingMobile);

public sealed record BlockStallCommand(Guid TenantId, Guid EventId, Guid BookingId, Guid StallId, Guid ActorUserId);
public sealed record ChangeBlockedStallCommand(Guid TenantId, Guid EventId, Guid BookingId, Guid CurrentStallId, Guid NewStallId, Guid ActorUserId, string Reason);
public sealed record ReleaseStallCommand(Guid TenantId, Guid EventId, Guid BookingId, Guid ActorUserId, Guid StallId, string Reason);
public sealed record SubmitPaymentCommand(Guid TenantId, Guid EventId, Guid BookingId, string ReferenceNumber, PaymentMode PaymentMode, string PayerName, string? PayerBank, decimal AmountPaid, DateOnly PaymentDate, Guid? ProofFileId);
public sealed record VerifyPaymentCommand(Guid TenantId, Guid EventId, Guid BookingId, Guid PaymentId, Guid ActorUserId, decimal ExpectedAmount, bool OverrideExpiredBlock);
public sealed record RejectPaymentCommand(Guid TenantId, Guid EventId, Guid PaymentId, Guid ActorUserId, string Reason);
public sealed record GenerateInvoiceCommand(Guid TenantId, Guid EventId, Guid BookingId, Guid ActorUserId);
public sealed record SendInvoiceCommand(Guid TenantId, Guid EventId, Guid InvoiceId, Guid ActorUserId);
public sealed record UpdateBookingApplicationRequest(
    Guid RequestedStallSizeId,
    UpdateApplicationExhibitorRequest Exhibitor,
    string? FasciaName,
    string? DisplayNotes,
    string? ElectricalRequirement,
    string? SpecialRequirement,
    bool HazardousDemoDeclared,
    bool TermsAccepted,
    string? DeclarantName,
    string? DeclarantDesignation,
    DateOnly? DeclarationDate
);

public sealed record UpdateApplicationExhibitorRequest(
    string? LegalName,
    string? TradeName,
    string? RegisteredAddress,
    string? City,
    string? District,
    string? State,
    string? Pincode,
    string? Country,
    string? ContactPersonName,
    string? ContactPersonDesignation,
    string? Mobile,
    string? AlternateMobile,
    string? Email,
    string? AlternateEmail,
    string? Website,
    string? IndustryScale,
    string? BusinessType,
    string? CompanyConstitution,
    string? IndustryCategory,
    string? ProductServiceDescription,
    string? ProductKeywords,
    string? UdyamNumber,
    string? Gstin,
    string? Pan,
    string? TanNumber,
    bool LubMember,
    string? LubState,
    string? LubChapter,
    string? LubMembershipNumber,
     string? CompanyLogo,
    string? BankAccountName,
    string? BankName,
    string? BankAccountNumber,
    string? BankIfscCode
);
public sealed record SubmitVipRegistrationCommand(
    Guid TenantId,
    Guid EventId,
    string ContactPersonName,
    string ContactPersonDesignation,
    string Mobile,
    string? AlternateMobile,
    string Email,
    string? AlternateEmail,
    string? Website,
    string? RegisteredAddress,
    string? District,
    string? State,
    string? Pincode,
    string? City,


    string? Organization
);

public sealed record SubmitVipRegistrationResult(
    Guid createdVipId, string RegistrationNumber
);

public interface IQrCodeService
{
    byte[] GenerateQrCode(string textToEncode);
}

public interface IEmailService
{
    Task SendEmailWithAttachmentAsync(string toEmail, string subject, string body, byte[] attachmentBytes, string fileName, string contentType);
}