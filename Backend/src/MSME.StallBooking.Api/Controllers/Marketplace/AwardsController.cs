using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Domain.Marketplace;
using MSME.StallBooking.Persistence;
using MSME.StallBooking.SharedKernel.Errors;

namespace MSME.StallBooking.Api.Controllers.Marketplace;

[ApiController]
[Route("api/v1/marketplace/awards")]
public sealed class AwardsController : MarketplaceControllerBase
{
    private readonly StallBookingDbContext _db;
    public AwardsController(StallBookingDbContext db, IConfiguration configuration) : base(db, configuration) => _db = db;
    [HttpGet]
    [HttpGet("/api/v1/buyer/purchase-orders")]
    [HttpGet("/api/v1/seller/awards")]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        Demand("buyer.purchase_order.view", "seller.award.view");
        // Was TenantId-only — returned every buyer's and seller's awards across the whole
        // event to any signed-in user. Scoped to the caller's own organization (buyer via the
        // requirement, seller via the winning quotation) and enriched with the names/titles
        // the seller Awards screen needs instead of a raw entity dump.
        var organizationId = await CurrentOrganizationIdAsync(ct);
        var q = from award in _db.Awards.AsNoTracking()
                join requirement in _db.BuyerRequirements.AsNoTracking() on award.RequirementId equals requirement.Id
                join quotation in _db.Quotations.AsNoTracking() on award.QuotationId equals quotation.Id
                join buyerOrg in _db.Organizations.AsNoTracking() on requirement.OrganizationId equals buyerOrg.Id
                join sellerOrg in _db.Organizations.AsNoTracking() on quotation.SellerOrganizationId equals sellerOrg.Id
                where award.TenantId == TenantId && (requirement.OrganizationId == organizationId || quotation.SellerOrganizationId == organizationId)
                select new
                {
                    award.Id,
                    award.AwardNo,
                    requirement.RequirementNo,
                    requirement.Title,
                    BuyerName = buyerOrg.LegalName,
                    SellerName = sellerOrg.LegalName,
                    award.AwardValue,
                    award.Currency,
                    award.Status,
                    award.CreatedAt
                };
        return Ok(await q.OrderByDescending(x => x.CreatedAt).ToListAsync(ct));
    }
    [HttpPost]
    public async Task<IActionResult> Create(CreateAwardRequest request, CancellationToken ct) { Demand("buyer.award.create"); var quotation = await _db.Quotations.SingleOrDefaultAsync(x => x.Id == request.QuotationId && x.TenantId == TenantId, ct) ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Quotation was not found."); var rfq = await _db.Rfqs.SingleAsync(x => x.Id == quotation.RfqId, ct); var award = Award.Create(NextNumber("AWD"), rfq.RequirementId, quotation.Id, quotation.GrandTotal, quotation.Currency); award.StampCreate(TenantId, quotation.EventId, ActorUserId, CorrelationId); _db.Awards.Add(award); foreach (var m in request.Milestones ?? []) { var milestone = AwardMilestone.Create(award.Id, m.Title, m.DueDate, m.Amount); milestone.StampCreate(TenantId, award.EventId, ActorUserId, CorrelationId); _db.AwardMilestones.Add(milestone); } CoreDb.AuditLogs.Add(Audit(award.EventId, "Award", award.Id, "CREATE", null, request)); await _db.SaveChangesAsync(ct); await CoreDb.SaveChangesAsync(ct); return Ok(award); }
}
public sealed record AwardMilestoneRequest(string Title, DateOnly DueDate, decimal Amount);
public sealed record CreateAwardRequest(Guid QuotationId, IReadOnlyList<AwardMilestoneRequest>? Milestones);
