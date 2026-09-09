using MSME.StallBooking.Application.Abstractions;
using MSME.StallBooking.Domain.Entities;
using StallBookingEntity = MSME.StallBooking.Domain.Entities.StallBooking;

namespace MSME.StallBooking.Application.Abstractions;

public interface IReadRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct);
    IQueryable<T> Query();
}

public interface IRepository<T> : IReadRepository<T> where T : class
{
    Task AddAsync(T entity, CancellationToken ct);
    void Update(T entity);
}

public interface IBookingRepository : IRepository<StallBookingEntity>
{
    Task<StallBookingEntity?> GetByRegistrationNumberAsync(Guid tenantId, string bookingNumber, CancellationToken ct);
}

public interface IStallRepository : IRepository<Stall>
{
    Task<Stall?> GetForUpdateAsync(Guid tenantId, Guid eventId, Guid stallId, CancellationToken ct);
    Task<Stall?> GetByNumberAsync(Guid tenantId, Guid eventId, string stallNumber, CancellationToken ct);
}

public interface IAllocationRepository : IRepository<StallAllocation>
{
    Task<StallAllocation?> GetActiveByBookingAsync(Guid bookingId, CancellationToken ct);
    Task<IReadOnlyList<StallAllocation>> GetExpiredBlocksAsync(DateTimeOffset now, CancellationToken ct);
}

public interface IPaymentRepository : IRepository<Payment>
{
    Task<Payment?> GetLatestForBookingAsync(Guid bookingId, CancellationToken ct);
}

public interface IInvoiceRepository : IRepository<ProformaInvoice>
{
    Task<ProformaInvoice?> GetActiveByBookingAsync(Guid bookingId, CancellationToken ct);
}

public interface IEmailLogRepository : IRepository<EmailLog> { }

public interface IUnitOfWork
{
    IBookingRepository Bookings { get; }
    IStallRepository Stalls { get; }
    IAllocationRepository Allocations { get; }
    IPaymentRepository Payments { get; }
    IInvoiceRepository Invoices { get; }
    IEmailLogRepository EmailLogs { get; }
    IVisitorRepository Visitors { get; }
    IVipRepository Vips { get; }

    Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken ct);
    Task<int> SaveChangesAsync(CancellationToken ct);
}

public interface INumberSequenceService
{
    Task<string> NextBookingNumberAsync(Guid tenantId, Guid eventId, CancellationToken ct);
    Task<string> NextInvoiceNumberAsync(Guid tenantId, Guid eventId, CancellationToken ct);
    Task<string> NextReceiptNumberAsync(Guid tenantId, Guid eventId, CancellationToken ct);
    Task<string> NextTaxInvoiceNumberAsync(Guid tenantId, Guid eventId, CancellationToken ct);
    Task<string> NextVisitorNumberAsync(Guid tenantId, Guid eventId, CancellationToken ct); // add this
    Task<string> NextVipNumberAsync(
          Guid tenantId,
          Guid eventId,
          CancellationToken ct);
}



public interface ICurrentUser
{
    Guid? UserId { get; }
    Guid TenantId { get; }
    IReadOnlySet<string> Permissions { get; }
    string? CorrelationId { get; }
}

public interface IPermissionGuard
{
    void Demand(string permissionCode);
    bool Has(string permissionCode);
}

public interface IEmailComposer
{
    EmailLog ComposeBookingReceived(
        StallBookingEntity booking,
        Stall stall,
        StallSize size,
        string toEmail,
                  Exhibitor exhibitor,

        EmailPaymentContext paymentContext);
    EmailLog ComposeBookingEditRequest(
    StallBookingEntity booking,
    string toEmail,
    string editUrl);
    EmailLog ComposeExhibitorStallInformation(
        StallBookingEntity booking,
        string toEmail,
        string contactPersonName,
        string companyName,
        string stallNumber,
        string stallSize);
    EmailLog ComposeHotelAccommodationOptions(
        StallBookingEntity booking,
        string toEmail,
        string contactPersonName,
        string companyName);
    EmailLog ComposePaymentVerified(
        StallBookingEntity booking,
        Stall stall,
        ProformaInvoice invoice,
        string toEmail);

    EmailLog ComposeBookingSubmitted(
     StallBookingEntity booking,
         Exhibitor exhibitor,
     StallSize requestedSize,
     string toEmail);

    EmailLog ComposeBookingApproved(
        StallBookingEntity booking,
        Stall stall,
        string toEmail);
    EmailLog ComposeStallCardEmail(
    StallBookingEntity booking,
    Stall stall,
    Exhibitor exhibitor,
    string toEmail,
    string venue,
    string eventDate);
    EmailLog ComposePaymentReminder(
        StallBookingEntity booking,
        Exhibitor exhibitor,
        string? stallNumber,
        decimal expectedAmount,
        decimal paidAmount,
        decimal balanceAmount,
        DateTimeOffset? blockExpiresAt,
        DateTimeOffset? allocatedAt,
        string toEmail);

    EmailLog ComposePaymentReceipt(
        StallBookingEntity booking,
        Stall stall,
        Exhibitor exhibitor,
        Payment payment,
        decimal expectedTotal,
        decimal totalPaidAfterThis,
        bool isFullSettlement,
        string toEmail);

    EmailLog ComposeTaxInvoiceEmail(
        StallBookingEntity booking,
        ProformaInvoice invoice,
        Exhibitor exhibitor,
        string toEmail);

    EmailLog ComposeVisitorPass(
        string recipientName,
        string registrationNumber,
        string verificationUrl,
        string toEmail,
        Guid tenantId,
        Guid? eventId);

    EmailLog ComposeVisitorNotification(
        string recipientName,
        string subject,
        string messageBody,
        string toEmail,
        Guid tenantId,
        Guid? eventId);

    EmailLog ComposeVipPass(
        string recipientName,
        string registrationNumber,
        string verificationUrl,
        string toEmail,
        Guid tenantId,
        Guid? eventId);

    EmailLog ComposeStallVisitorInterest(
        string recipientName,
        string visitorLabel,
        string fasciaName,
        string? visitorMobile,
        string? visitorEmail,
        string toEmail,
        Guid tenantId,
        Guid? eventId,
        Guid? bookingId);

    EmailLog ComposeMarketplaceUserWelcome(
        string contactPerson,
        string orgName,
        string contactEmail,
        string tempPassword,
        string loginUrl,
        Guid tenantId,
        Guid? eventId);

    EmailLog ComposeFromTemplate(
        string templateCode,
        Guid tenantId,
        Guid? eventId,
        Guid? bookingId,
        string toEmail,
        IDictionary<string, string?> values);
    EmailLog ComposeMsmeSubsidyInfo(
        StallBookingEntity booking,
        string toEmail,
        string companyName,
        string subsidyStatus,
        string subsidyAmount);

    EmailLog ComposeFameTnSubsidyInfo(
        StallBookingEntity booking,
        string toEmail,
        string companyName,
        string subsidyStatus,
        string subsidyAmount);

    EmailLog ComposeExhibitorActionRequired(
        StallBookingEntity booking,
        string toEmail,
        string actionRequired);

    EmailLog ComposeAdditionalRequirementsSubmitted(
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
        string? notes = null);

    EmailLog ComposeAdminAdditionalRequirementsAlert(
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
        string? notes = null);

    EmailLog ComposeAdditionalRequirementsStatusUpdate(
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
        string? notes = null);
}




public interface IProformaInvoicePdfGenerator
{
    Task<Guid> GenerateAsync(ProformaInvoice invoice, CancellationToken ct);

    Task<byte[]> GeneratePdfBytesAsync(
        ProformaInvoice invoice,
        Exhibitor exhibitor,

        string documentTitle,
           DateTimeOffset? expiryDate,
        decimal? areaSqM,
        CancellationToken ct);

    Task<byte[]> GenerateProformaPdfBytesAsync(
        ProformaInvoice invoice,
        Exhibitor exhibitor,
    DateTimeOffset? expiryDate,
    decimal? areaSqM,
    CancellationToken ct);

    Task<byte[]> GenerateTaxInvoicePdfBytesAsync(
        ProformaInvoice invoice,
        Exhibitor exhibitor,
        decimal? areaSqM,
        CancellationToken ct);
}

public interface IPaymentReceiptPdfGenerator
{
    Task<byte[]> GeneratePdfBytesAsync(
        StallBookingEntity booking,
        Stall stall,
        StallSize stallSize,
        Payment payment,
        Exhibitor exhibitor,
        decimal expectedTotalAmount,
        decimal totalPaidAmount,
         decimal totalTdsAmount,
         decimal baseAmount,
        CancellationToken ct);
}


public interface IVisitorRepository : IRepository<BillingProfile.Visitor>
{
    Task<BillingProfile.Visitor?> GetByRegistrationNumberAsync(Guid tenantId, string registrationNumber, CancellationToken ct);
    Task<List<BillingProfile.Visitor>> GetAllAsync(Guid tenantId, Guid eventId, CancellationToken ct = default);
    Task<List<BillingProfile.Visitor>> GetPresentAsync(Guid tenantId, Guid eventId, CancellationToken ct = default);
}
public interface IVipRepository : IRepository<BillingProfile.Vip>
{
    Task<BillingProfile.Vip?> GetByRegistrationNumberAsync(Guid tenantId, string registrationNumber, CancellationToken ct);
    Task<List<BillingProfile.Vip>> GetAllAsync(Guid tenantId, Guid eventId, CancellationToken ct = default);
    Task<List<BillingProfile.Vip>> GetPresentAsync(Guid tenantId, Guid eventId, CancellationToken ct = default);  // NEW
}


public sealed record EmailPaymentContext(
    string AccountName,
    string BankName,
    string AccountNumber,
    string IfscCode,
    string BranchName);
