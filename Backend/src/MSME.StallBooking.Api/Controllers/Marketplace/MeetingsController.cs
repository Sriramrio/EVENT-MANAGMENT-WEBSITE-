using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Domain.Marketplace;
using MSME.StallBooking.Persistence;
using MSME.StallBooking.SharedKernel.Errors;

namespace MSME.StallBooking.Api.Controllers.Marketplace;

[ApiController]
[Route("api/v1/marketplace/meetings")]
public sealed class MeetingsController : MarketplaceControllerBase
{
    private readonly StallBookingDbContext _db;
    public MeetingsController(StallBookingDbContext db, IConfiguration configuration) : base(db, configuration) => _db = db;

    [HttpGet]
    [HttpGet("/api/v1/buyer/meetings")]
    [HttpGet("/api/v1/seller/meetings")]
    public async Task<IActionResult> List([FromQuery] string? status, CancellationToken ct)
    {
        Demand("buyer.meeting.view", "seller.meeting.view");
        // Scoped to the signed-in user's own organization (as buyer, via the requirement, or
        // as seller, via the capability) — not TenantId alone, which would return every other
        // buyer's and seller's meetings across the whole event.
        var organizationId = await CurrentOrganizationIdAsync(ct);
        var normalizedStatus = string.IsNullOrWhiteSpace(status) ? null : status.ToUpper();
        var meetings = await MeetingQuery(organizationId, normalizedStatus).ToListAsync(ct);
        // Sorted in memory rather than in the query itself: composing an orderby with the
        // predicate Get() needs (filtering by Id on the projected DTO) is what EF Core could
        // not translate. Meeting volume per org is small, so this is cheap and always safe.
        return Ok(meetings.OrderByDescending(x => x.ScheduledStart));
    }

    [HttpGet("{id:guid}")]
    [HttpGet("/api/v1/buyer/meetings/{id:guid}")]
    [HttpGet("/api/v1/seller/meetings/{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        Demand("buyer.meeting.view", "seller.meeting.view");
        var organizationId = await CurrentOrganizationIdAsync(ct);
        var meeting = await MeetingQuery(organizationId: organizationId, meetingId: id).SingleOrDefaultAsync(ct)
            ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Meeting was not found.");
        var outcome = await _db.MeetingOutcomes.AsNoTracking().SingleOrDefaultAsync(x => x.MeetingId == id, ct);
        var actionItems = await _db.MeetingActionItems.AsNoTracking().Where(x => x.MeetingId == id).ToListAsync(ct);
        return Ok(new { meeting, outcome, actionItems });
    }

    [HttpPost]
    public async Task<IActionResult> Schedule(ScheduleMeetingRequest request, CancellationToken ct)
    {
        Demand("buyer.meeting.request", "seller.meeting.request");
        var engagement = await _db.Engagements.SingleOrDefaultAsync(x => x.Id == request.EngagementId && x.TenantId == TenantId, ct)
            ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Engagement was not found.");
        var entity = MarketplaceMeeting.Create(NextNumber("MTG"), request.EngagementId, request.Start, request.End, request.Mode, request.VenueOrLink);
        entity.StampCreate(TenantId, engagement.EventId, ActorUserId, CorrelationId);
        _db.Meetings.Add(entity);
        foreach (var slot in request.AlternativeSlots ?? [])
        {
            var option = MeetingSlotOption.Create(entity.Id, slot.Start, slot.End);
            option.StampCreate(TenantId, engagement.EventId, ActorUserId, CorrelationId);
            _db.MeetingSlotOptions.Add(option);
        }
        CoreDb.AuditLogs.Add(Audit(entity.EventId, "Meeting", entity.Id, "SCHEDULE", null, request));
        await _db.SaveChangesAsync(ct);
        await CoreDb.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = entity.Id }, entity);
    }

    [HttpPost("{id:guid}/transition")]
    public async Task<IActionResult> Transition(Guid id, MeetingTransitionRequest request, CancellationToken ct)
    {
        Demand("buyer.meeting.manage", "seller.meeting.manage", "buyer.meeting.checkin", "seller.meeting.checkin");
        var entity = await Find(id, ct);
        entity.Transition(request.Status, request.Notes, ActorUserId, CorrelationId);
        CoreDb.AuditLogs.Add(Audit(entity.EventId, "Meeting", entity.Id, request.Status, null, request));
        await _db.SaveChangesAsync(ct);
        await CoreDb.SaveChangesAsync(ct);
        return Ok(entity);
    }

    [HttpPost("{id:guid}/outcome")]
    public async Task<IActionResult> Outcome(Guid id, MeetingOutcomeRequest request, CancellationToken ct)
    {
        Demand("buyer.meeting.outcome", "seller.meeting.outcome");
        var meeting = await Find(id, ct);
        var outcome = MeetingOutcome.Create(id, request.Outcome, request.Notes);
        outcome.StampCreate(TenantId, meeting.EventId, ActorUserId, CorrelationId);
        _db.MeetingOutcomes.Add(outcome);
        foreach (var item in request.ActionItems ?? [])
        {
            var action = MeetingActionItem.Create(id, item.Title, item.OwnerUserId, item.DueDate);
            action.StampCreate(TenantId, meeting.EventId, ActorUserId, CorrelationId);
            _db.MeetingActionItems.Add(action);
        }
        meeting.Transition("COMPLETED", request.Notes, ActorUserId, CorrelationId);
        CoreDb.AuditLogs.Add(Audit(meeting.EventId, "Meeting", meeting.Id, "OUTCOME", null, request));
        await _db.SaveChangesAsync(ct);
        await CoreDb.SaveChangesAsync(ct);
        return Ok(new { meeting, outcome });
    }

    [HttpPost("{id:guid}/notes")]
    [HttpPost("/api/v1/buyer/meetings/{id:guid}/notes")]
    [HttpPost("/api/v1/seller/meetings/{id:guid}/notes")]
    public async Task<IActionResult> SaveNotes(Guid id, [FromBody] SaveMeetingNotesRequest request, CancellationToken ct)
    {
        Demand("buyer.meeting.manage", "seller.meeting.manage", "buyer.meeting.view", "seller.meeting.view");
        var entity = await Find(id, ct);
        entity.Transition(entity.Status, request.Notes, ActorUserId, CorrelationId);
        await _db.SaveChangesAsync(ct);
        return Ok(new { id = entity.Id, notes = entity.Notes });
    }

    [HttpGet("outcomes")]
    [HttpGet("/api/v1/buyer/meetings/outcomes")]
    [HttpGet("/api/v1/seller/meetings/outcomes")]
    public async Task<IActionResult> Outcomes(CancellationToken ct)
    {
        Demand("buyer.meeting.view", "seller.meeting.view");
        var organizationId = await CurrentOrganizationIdAsync(ct);
        
        var baseQuery = MeetingQuery(organizationId);

        var meetings = await baseQuery.ToListAsync(ct);
        var meetingIds = meetings.Select(m => m.Id).ToList();

        var outcomes = await _db.MeetingOutcomes.AsNoTracking()
            .Where(x => meetingIds.Contains(x.MeetingId))
            .ToListAsync(ct);
            
        var actionItems = await _db.MeetingActionItems.AsNoTracking()
            .Where(x => meetingIds.Contains(x.MeetingId))
            .ToListAsync(ct);

        var result = outcomes.Select(outcome => 
        {
            var meeting = meetings.Single(m => m.Id == outcome.MeetingId);
            var actions = actionItems.Where(a => a.MeetingId == meeting.Id).ToList();
            return new MeetingOutcomeListDto(
                meeting.Id,
                meeting.MeetingNo,
                meeting.BuyerOrganizationName,
                meeting.SellerOrganizationName,
                meeting.RequirementNo,
                meeting.ScheduledStart,
                outcome.Outcome,
                outcome.Notes,
                actions.Select(a => new MeetingActionDto(a.Title, a.DueDate, a.Status)).ToList()
            );
        }).OrderByDescending(x => x.ScheduledStart);

        return Ok(result);
    }

    // organizationId, status, AND meetingId are all applied inside the join chain, on the
    // underlying entity fields — never as a predicate against the already-constructed

    // MeetingDto. EF Core could not reliably translate .Where()/.SingleOrDefaultAsync(predicate)
    // composed on top of a query that projects into a positional record type, no matter how
    // simple the predicate; filtering everything pre-projection sidesteps that entirely.
    // Deliberately NO orderby here either — List() sorts the materialized results in memory.
    private IQueryable<MeetingDto> MeetingQuery(Guid? organizationId = null, string? status = null, Guid? meetingId = null) =>
        from meeting in _db.Meetings.AsNoTracking()
        join engagement in _db.Engagements.AsNoTracking() on meeting.EngagementId equals engagement.Id
        join requirement in _db.BuyerRequirements.AsNoTracking() on engagement.RequirementId equals requirement.Id
        join capability in _db.SellerCapabilities.AsNoTracking() on engagement.CapabilityId equals capability.Id
        join buyerOrg in _db.Organizations.AsNoTracking() on requirement.OrganizationId equals buyerOrg.Id
        join sellerOrg in _db.Organizations.AsNoTracking() on capability.OrganizationId equals sellerOrg.Id
        where meeting.TenantId == TenantId
            && (organizationId == null || requirement.OrganizationId == organizationId || capability.OrganizationId == organizationId)
            && (status == null || meeting.Status == status)
            && (meetingId == null || meeting.Id == meetingId)
        select new MeetingDto(
            meeting.Id, meeting.MeetingNo, meeting.EngagementId,
            requirement.Id, requirement.RequirementNo, requirement.Title,
            requirement.OrganizationId, buyerOrg.LegalName,
            capability.Id, capability.OrganizationId, sellerOrg.LegalName,
            meeting.ScheduledStart, meeting.ScheduledEnd, meeting.Mode, meeting.VenueOrLink,
            meeting.Status, meeting.Notes, meeting.Version);

    private async Task<MarketplaceMeeting> Find(Guid id, CancellationToken ct) 
    {
        var organizationId = await CurrentOrganizationIdAsync(ct);
        var meeting = await _db.Meetings.SingleOrDefaultAsync(x => x.Id == id && x.TenantId == TenantId, ct) ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Meeting was not found.");
        var engagement = await _db.Engagements.SingleOrDefaultAsync(x => x.Id == meeting.EngagementId, ct);
        var requirement = await _db.BuyerRequirements.AsNoTracking().SingleOrDefaultAsync(x => x.Id == engagement.RequirementId, ct);
        var capability = await _db.SellerCapabilities.AsNoTracking().SingleOrDefaultAsync(x => x.Id == engagement.CapabilityId, ct);
        if (requirement?.OrganizationId != organizationId && capability?.OrganizationId != organizationId) throw new DomainRuleException(ErrorCodes.Forbidden, "You do not have access to this meeting.");
        return meeting;
    }
}

public sealed record MeetingDto(
    Guid Id, string MeetingNo, Guid EngagementId,
    Guid RequirementId, string RequirementNo, string RequirementTitle,
    Guid BuyerOrganizationId, string BuyerOrganizationName,
    Guid CapabilityId, Guid SellerOrganizationId, string SellerOrganizationName,
    DateTimeOffset ScheduledStart, DateTimeOffset ScheduledEnd, string Mode, string VenueOrLink,
    string Status, string? Notes, long Version);

public sealed record SlotRequest(DateTimeOffset Start, DateTimeOffset End);
public sealed record ScheduleMeetingRequest(Guid EngagementId, DateTimeOffset Start, DateTimeOffset End, string Mode, string VenueOrLink, IReadOnlyList<SlotRequest>? AlternativeSlots);
public sealed record MeetingTransitionRequest(string Status, string? Notes);
public sealed record SaveMeetingNotesRequest(string Notes);
public sealed record MeetingActionRequest(string Title, Guid? OwnerUserId, DateOnly? DueDate);
public sealed record MeetingOutcomeRequest(string Outcome, string Notes, IReadOnlyList<MeetingActionRequest>? ActionItems);

public sealed record MeetingActionDto(string Title, DateOnly? DueDate, string Status);
public sealed record MeetingOutcomeListDto(
    Guid MeetingId,
    string MeetingNo,
    string BuyerName,
    string SellerName,
    string RequirementNo,
    DateTimeOffset ScheduledStart,
    string Outcome,
    string Notes,
    IReadOnlyList<MeetingActionDto> Actions);
