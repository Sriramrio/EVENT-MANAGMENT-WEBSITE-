using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Domain.Marketplace;
using MSME.StallBooking.Persistence;
using MSME.StallBooking.SharedKernel.Errors;

namespace MSME.StallBooking.Api.Controllers.Marketplace;

[ApiController]
[Route("api/v1/marketplace/rfqs")]
public sealed class RfqController : MarketplaceControllerBase
{
    private readonly StallBookingDbContext _db;
    public RfqController(StallBookingDbContext db, IConfiguration configuration) : base(db, configuration) => _db = db;

    [HttpGet]
    [HttpGet("/api/v1/buyer/rfqs")]
    [HttpGet("/api/v1/seller/rfqs")]
    public async Task<IActionResult> List([FromQuery] string? status, CancellationToken ct)
    {
        Demand("buyer.rfq.view", "seller.rfq.view");
        // Scoped to the signed-in user's own organization — as buyer via the RFQ's requirement,
        // or as seller via being invited to the RFQ — not TenantId alone, which would return
        // every other buyer's and seller's RFQs across the whole event.
        var organizationId = await CurrentOrganizationIdAsync(ct);
        var q = from rfq in _db.Rfqs.AsNoTracking()
                join requirement in _db.BuyerRequirements.AsNoTracking() on rfq.RequirementId equals requirement.Id
                where rfq.TenantId == TenantId &&
                    (requirement.OrganizationId == organizationId ||
                     _db.RfqInvitations.Any(inv => inv.RfqId == rfq.Id && _db.SellerCapabilities.Any(c => c.Id == inv.CapabilityId && c.OrganizationId == organizationId)))
                select rfq;
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(x => x.Status == status.ToUpper());
        return Ok(await q.OrderByDescending(x => x.CreatedAt).ToListAsync(ct));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateRfqRequest request, CancellationToken ct) { Demand("buyer.rfq.create"); var requirement = await _db.BuyerRequirements.SingleOrDefaultAsync(x => x.Id == request.RequirementId && x.TenantId == TenantId, ct) ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Requirement was not found."); var entity = Rfq.Create(NextNumber("RFQ"), request.RequirementId, request.SubmissionDeadline, request.TermsJson); entity.StampCreate(TenantId, requirement.EventId, ActorUserId, CorrelationId); _db.Rfqs.Add(entity); foreach (var capabilityId in request.CapabilityIds.Distinct()) { var invitation = RfqInvitation.Create(entity.Id, capabilityId); invitation.StampCreate(TenantId, requirement.EventId, ActorUserId, CorrelationId); _db.RfqInvitations.Add(invitation); } CoreDb.AuditLogs.Add(Audit(entity.EventId, "RFQ", entity.Id, "CREATE_AND_INVITE", null, request)); CoreDb.AuditLogs.Add(Audit(entity.EventId, "RFQ", entity.Id, "EMAIL_SENT", null, new { to = "seller", subject = "New RFQ Created" })); await _db.SaveChangesAsync(ct); await CoreDb.SaveChangesAsync(ct); return Ok(entity); }

    [HttpPost("{rfqId:guid}/quotations")]
    public async Task<IActionResult> SubmitQuotation(Guid rfqId, SubmitQuotationRequest request, CancellationToken ct) { Demand("seller.quotation.submit"); var rfq = await _db.Rfqs.SingleOrDefaultAsync(x => x.Id == rfqId && x.TenantId == TenantId, ct) ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "RFQ was not found."); if (rfq.SubmissionDeadline < DateTimeOffset.UtcNow) throw new DomainRuleException(ErrorCodes.ValidationFailed, "RFQ submission deadline has passed."); var total = request.Lines.Sum(x => x.Quantity * x.UnitPrice); var quotation = Quotation.Create(NextNumber("QUO"), rfqId, request.SellerOrganizationId, total, request.Currency); quotation.StampCreate(TenantId, rfq.EventId, ActorUserId, CorrelationId); _db.Quotations.Add(quotation); foreach (var line in request.Lines) { var item = QuotationLine.Create(quotation.Id, line.Description, line.Quantity, line.UomCode, line.UnitPrice); item.StampCreate(TenantId, rfq.EventId, ActorUserId, CorrelationId); _db.QuotationLines.Add(item); } CoreDb.AuditLogs.Add(Audit(rfq.EventId, "Quotation", quotation.Id, "SUBMIT", null, request)); await _db.SaveChangesAsync(ct); await CoreDb.SaveChangesAsync(ct); return Ok(quotation); }

    [HttpGet("{rfqId:guid}/quotations/me")]
    public async Task<IActionResult> GetMyQuotations(Guid rfqId, CancellationToken ct) { Demand("seller.quotation.submit"); var organizationId = await CurrentOrganizationIdAsync(ct); var quotes = await _db.Quotations.AsNoTracking().Where(x => x.TenantId == TenantId && x.RfqId == rfqId && x.SellerOrganizationId == organizationId).OrderByDescending(x => x.Revision).ToListAsync(ct); return Ok(quotes); }

    [HttpGet("{rfqId:guid}/comparison")]
    public async Task<IActionResult> Compare(Guid rfqId, CancellationToken ct) { Demand("buyer.quotation.compare"); var quotes = await _db.Quotations.AsNoTracking().Where(x => x.TenantId == TenantId && x.RfqId == rfqId).OrderBy(x => x.GrandTotal).ToListAsync(ct); var ids = quotes.Select(x => x.Id).ToArray(); var lines = await _db.QuotationLines.AsNoTracking().Where(x => x.TenantId == TenantId && ids.Contains(x.QuotationId)).ToListAsync(ct); return Ok(quotes.Select(x => new { quotation = x, lines = lines.Where(l => l.QuotationId == x.Id), isLowest = x.Id == quotes.FirstOrDefault()?.Id })); }

    [HttpPost("{rfqId:guid}/quotations/{quotationId:guid}/revise")]
    public async Task<IActionResult> ReviseQuotation(Guid rfqId, Guid quotationId, SubmitQuotationRequest request, CancellationToken ct) { Demand("seller.quotation.submit"); var quotation = await _db.Quotations.SingleOrDefaultAsync(x => x.Id == quotationId && x.TenantId == TenantId, ct) ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Quotation was not found."); var rfq = await _db.Rfqs.SingleOrDefaultAsync(x => x.Id == rfqId, ct); if (rfq == null) throw new DomainRuleException(ErrorCodes.EntityNotFound, "RFQ was not found."); var oldLines = await _db.QuotationLines.Where(x => x.QuotationId == quotation.Id).ToListAsync(ct); _db.QuotationLines.RemoveRange(oldLines); var total = request.Lines.Sum(x => x.Quantity * x.UnitPrice); quotation.Revise(total, ActorUserId, CorrelationId); foreach (var line in request.Lines) { var item = QuotationLine.Create(quotation.Id, line.Description, line.Quantity, line.UomCode, line.UnitPrice); item.StampCreate(TenantId, rfq.EventId, ActorUserId, CorrelationId); _db.QuotationLines.Add(item); } CoreDb.AuditLogs.Add(Audit(rfq.EventId, "Quotation", quotation.Id, "REVISE", null, request)); await _db.SaveChangesAsync(ct); await CoreDb.SaveChangesAsync(ct); return Ok(quotation); }
}
public sealed record CreateRfqRequest(Guid RequirementId, DateTimeOffset SubmissionDeadline, string TermsJson, IReadOnlyList<Guid> CapabilityIds);
public sealed record QuotationLineRequest(string Description, decimal Quantity, string UomCode, decimal UnitPrice);
public sealed record SubmitQuotationRequest(Guid SellerOrganizationId, string Currency, IReadOnlyList<QuotationLineRequest> Lines);
