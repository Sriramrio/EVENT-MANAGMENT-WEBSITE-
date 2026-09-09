using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Domain.Marketplace;
using MSME.StallBooking.Persistence;
using MSME.StallBooking.SharedKernel.Errors;

namespace MSME.StallBooking.Api.Controllers.Marketplace;

[ApiController]
[Route("api/v1/marketplace/engagements")]
public sealed class EngagementController : MarketplaceControllerBase
{
    private readonly StallBookingDbContext _db;
    public EngagementController(StallBookingDbContext db, IConfiguration configuration) : base(db, configuration) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? requirementId, [FromQuery] Guid? capabilityId, [FromQuery] string? stage, CancellationToken ct)
    {
        Demand("buyer.engagement.view", "seller.engagement.view", "buyer.matches.view", "seller.opportunity.view");
        // Scoped to the signed-in user's own organization — as buyer via the requirement, or as
        // seller via the capability — not TenantId alone, which would return every other buyer's
        // and seller's engagements across the whole event.
        var organizationId = await CurrentOrganizationIdAsync(ct);
        var q = from engagement in _db.Engagements.AsNoTracking()
                join requirement in _db.BuyerRequirements.AsNoTracking() on engagement.RequirementId equals requirement.Id
                join capability in _db.SellerCapabilities.AsNoTracking() on engagement.CapabilityId equals capability.Id
                join buyerOrg in _db.Organizations.AsNoTracking() on requirement.OrganizationId equals buyerOrg.Id
                join sellerOrg in _db.Organizations.AsNoTracking() on capability.OrganizationId equals sellerOrg.Id
                where engagement.TenantId == TenantId && (requirement.OrganizationId == organizationId || capability.OrganizationId == organizationId)
                select new
                {
                    engagement.Id,
                    RequirementId = requirement.Id,
                    requirement.RequirementNo,
                    requirement.Title,
                    BuyerOrganizationId = requirement.OrganizationId,
                    BuyerOrganizationName = buyerOrg.LegalName,
                    CapabilityId = capability.Id,
                    SellerOrganizationId = capability.OrganizationId,
                    SellerOrganizationName = sellerOrg.LegalName,
                    engagement.Stage,
                    engagement.UpdatedAt,
                    engagement.CreatedAt
                };
        if (requirementId.HasValue) q = q.Where(x => x.RequirementId == requirementId);
        if (capabilityId.HasValue) q = q.Where(x => x.CapabilityId == capabilityId);
        if (!string.IsNullOrWhiteSpace(stage)) q = q.Where(x => x.Stage == stage.ToUpper());
        return Ok(await q.OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt).ToListAsync(ct));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateEngagementRequest request, CancellationToken ct)
    {
        Demand("buyer.engagement.shortlist", "seller.engagement.interest"); var evt = await ResolveCurrentEventAsync(ct); var existing = await _db.Engagements.SingleOrDefaultAsync(x => x.TenantId == TenantId && x.RequirementId == request.RequirementId && x.CapabilityId == request.CapabilityId, ct); if (existing is not null) return Ok(existing);
        var entity = RequirementSellerEngagement.Create(request.RequirementId, request.CapabilityId, request.Stage); entity.StampCreate(TenantId, evt.Id, ActorUserId, CorrelationId); _db.Engagements.Add(entity); var activity = EngagementEvent.Create(entity.Id, request.Stage.ToUpperInvariant(), "{}"); activity.StampCreate(TenantId, evt.Id, ActorUserId, CorrelationId); _db.EngagementEvents.Add(activity); CoreDb.AuditLogs.Add(Audit(evt.Id, "RequirementSellerEngagement", entity.Id, "CREATE", null, request)); await _db.SaveChangesAsync(ct); await CoreDb.SaveChangesAsync(ct); return CreatedAtAction(nameof(Get), new { id = entity.Id }, entity);
    }

    [HttpGet("{id:guid}")] public async Task<IActionResult> Get(Guid id, CancellationToken ct) => Ok(await Find(id, ct));

    [HttpPost("{id:guid}/transition")]
    public async Task<IActionResult> Transition(Guid id, EngagementTransitionRequest request, CancellationToken ct)
    {
        Demand("buyer.engagement.manage", "seller.engagement.respond"); var entity = await Find(id, ct); entity.Move(request.Stage, ActorUserId, CorrelationId); var activity = EngagementEvent.Create(entity.Id, request.Stage.ToUpperInvariant(), request.PayloadJson ?? "{}"); activity.StampCreate(TenantId, entity.EventId, ActorUserId, CorrelationId); _db.EngagementEvents.Add(activity); CoreDb.AuditLogs.Add(Audit(entity.EventId, "RequirementSellerEngagement", entity.Id, request.Stage, null, request)); await _db.SaveChangesAsync(ct); await CoreDb.SaveChangesAsync(ct); return Ok(entity);
    }

    [HttpGet("{id:guid}/timeline")]
    public async Task<IActionResult> Timeline(Guid id, CancellationToken ct) 
    { 
        Demand("buyer.engagement.view", "seller.engagement.view"); 
        await Find(id, ct);
        return Ok(await _db.EngagementEvents.AsNoTracking().Where(x => x.TenantId == TenantId && x.EngagementId == id).OrderBy(x => x.CreatedAt).ToListAsync(ct)); 
    }

    [HttpGet("{id:guid}/messages")]
    public async Task<IActionResult> Messages(Guid id, CancellationToken ct) 
    { 
        Demand("buyer.engagement.view", "seller.engagement.view"); 
        await Find(id, ct);
        return Ok(await _db.EngagementMessages.AsNoTracking().Where(x => x.TenantId == TenantId && x.EngagementId == id).OrderBy(x => x.SentAt).ToListAsync(ct)); 
    }

    [HttpPost("{id:guid}/messages")]
    public async Task<IActionResult> Message(Guid id, CreateEngagementMessageRequest request, CancellationToken ct)
    {
        Demand("buyer.engagement.message", "seller.engagement.message");
        var entity = await Find(id, ct);
        // Previously this trusted request.SenderOrganizationId as sent by the client. If the
        // frontend's session data was momentarily missing/null (the exact bug just fixed in
        // MessagesPage.tsx), the message got stored with a wrong/empty sender id and could
        // never render as "mine" again on the sender's own screen. It was also a spoofing hole:
        // any signed-in client could claim to be messaging as a different organisation. Resolve
        // the sender authoritatively from the signed-in user's own membership instead, so this
        // class of bug (and impersonation) is no longer possible regardless of client state.
        var organizationId = await CurrentOrganizationIdAsync(ct)
            ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "No active organisation membership found for this user.");
        var message = EngagementMessage.Create(entity.Id, organizationId, request.Message);
        message.StampCreate(TenantId, entity.EventId, ActorUserId, CorrelationId);
        _db.EngagementMessages.Add(message);
        await _db.SaveChangesAsync(ct);
        return Ok(message);
    }

    private async Task<RequirementSellerEngagement> Find(Guid id, CancellationToken ct) 
    {
        var organizationId = await CurrentOrganizationIdAsync(ct);
        var engagement = await _db.Engagements.SingleOrDefaultAsync(x => x.Id == id && x.TenantId == TenantId, ct) ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Engagement was not found.");
        var requirement = await _db.BuyerRequirements.AsNoTracking().SingleOrDefaultAsync(x => x.Id == engagement.RequirementId, ct);
        var capability = await _db.SellerCapabilities.AsNoTracking().SingleOrDefaultAsync(x => x.Id == engagement.CapabilityId, ct);
        if (requirement?.OrganizationId != organizationId && capability?.OrganizationId != organizationId) throw new DomainRuleException(ErrorCodes.Forbidden, "You do not have access to this engagement.");
        return engagement;
    }
}
public sealed record CreateEngagementRequest(Guid RequirementId, Guid CapabilityId, string Stage);
public sealed record EngagementTransitionRequest(string Stage, string? PayloadJson);
public sealed record CreateEngagementMessageRequest(Guid SenderOrganizationId, string Message);