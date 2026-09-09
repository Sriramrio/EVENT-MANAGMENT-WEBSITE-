using MediatR;

namespace MSME.StallBooking.Application.Contracts;

public sealed record BookingDto(
    Guid Id,
    string BookingRegistrationNumber,
    string CompanyName,
    string ContactPerson,
    string Email,
    string Mobile,
    string District,
    string BookingStatus,
    string? StallNumber,
    DateTimeOffset? BlockExpiresAt,
    decimal? ExpectedAmount);

public sealed record DashboardSummaryDto(
    int TotalRegistrations,
    int SubmittedBookings,
    int UnderReview,
    int BlockedAwaitingPayment,
    int BlockExpiringToday,
    int BlockExpired,
    int PaymentSubmitted,
    int PaymentVerified,
    int PaymentRejected,
    int ConfirmedBookings,
    int ReleasedDueToNonPayment,
    int CancelledBookings,
    int TotalStalls,
    int AvailableStalls,
    int BlockedStalls,
    int FrozenStalls,
    int DisabledStalls,
    int InvoiceGenerated,
    int InvoiceSent,
    int InvoicePending,
    decimal TotalExpectedAmount,
    decimal TotalPaymentReceived,
    decimal PaymentPendingAmount,
    decimal GstAmountSummary);


public record CreateVisitorCommand(
    Guid TenantId,
    Guid EventId,
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
    string DeclarantName,
    string DeclarantDesignation,
    DateOnly DeclarationDate,
    bool TermsAccepted,
    bool AccuracyAccepted,
    bool PaymentTimelineAccepted,
    bool LubMember = false,
    bool InterestedInLub = false
) : IRequest<CreateVisitorResult>;
public record CreateVisitorResult(Guid VisitorId, string BookingRegistrationNumber);
