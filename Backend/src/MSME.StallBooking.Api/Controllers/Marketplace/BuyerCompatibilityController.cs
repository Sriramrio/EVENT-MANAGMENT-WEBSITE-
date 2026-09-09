using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Persistence;
using MSME.StallBooking.SharedKernel.Errors;

namespace MSME.StallBooking.Api.Controllers.Marketplace;

[ApiController]
[Route("api/v1/buyer")]
public sealed class BuyerCompatibilityController : MarketplaceControllerBase
{
    private readonly StallBookingDbContext _db;
    public BuyerCompatibilityController(StallBookingDbContext db, IConfiguration configuration) : base(db, configuration) => _db = db;
    [HttpGet("suppliers/{organizationId:guid}")]
    public async Task<IActionResult> Supplier(Guid organizationId, CancellationToken ct) { Demand("buyer.matches.view"); var org = await _db.Organizations.AsNoTracking().SingleOrDefaultAsync(x => x.Id == organizationId && x.TenantId == TenantId, ct) ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Supplier organization was not found."); var publishedCapabilities = await _db.SellerCapabilities.AsNoTracking().Where(x => x.OrganizationId == organizationId && x.Status == "PUBLISHED").Select(x => new { x.Id, x.Title }).ToListAsync(ct); return Ok(new { id = org.Id, name = org.LegalName, location = $"{org.City}, {org.State}", industry = "MSME", employees = "Not disclosed", certifications = Array.Empty<string>(), capabilities = publishedCapabilities.Select(x => x.Title).ToList(), capabilityId = publishedCapabilities.Select(x => (Guid?)x.Id).FirstOrDefault(), qualityScore = 0, deliveryScore = 0, technicalScore = 0, responseScore = 0, visibility = "full" }); }
    // All endpoints below are scoped to the signed-in buyer's own organization via
    // CurrentOrganizationIdAsync (OrganizationUsers membership), the same pattern used in
    // BuyerRequirementsController. Filtering by TenantId alone would return every buyer's
    // and seller's actions/negotiations/notifications across the whole event to any signed-in
    // buyer, since TenantId is shared by every organisation in the event.
    [HttpGet("actions")]
    public async Task<IActionResult> Actions(CancellationToken ct)
    {
        Demand("buyer.action.manage");
        var organizationId = await CurrentOrganizationIdAsync(ct);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        // Enriched to match the buyer Actions screen (action/relatedTo/owner/dueDate/priority) —
        // the raw MeetingActionItem only carries a title, an unresolved owner user id and a
        // due date, none of which the screen can render on its own.
        var rows = await (from action in _db.MeetingActionItems.AsNoTracking()
                          join meeting in _db.Meetings.AsNoTracking() on action.MeetingId equals meeting.Id
                          join engagement in _db.Engagements.AsNoTracking() on meeting.EngagementId equals engagement.Id
                          join requirement in _db.BuyerRequirements.AsNoTracking() on engagement.RequirementId equals requirement.Id
                          join capability in _db.SellerCapabilities.AsNoTracking() on engagement.CapabilityId equals capability.Id
                          join sellerOrg in _db.Organizations.AsNoTracking() on capability.OrganizationId equals sellerOrg.Id
                          where action.TenantId == TenantId && requirement.OrganizationId == organizationId
                          orderby action.DueDate
                          select new { action.Id, action.Title, action.OwnerUserId, action.DueDate, action.Status, requirement.RequirementNo, SellerName = sellerOrg.LegalName }).ToListAsync(ct);
        var ownerIds = rows.Where(x => x.OwnerUserId.HasValue).Select(x => x.OwnerUserId!.Value).Distinct().ToList();
        var ownerNames = await _db.Users.AsNoTracking().Where(x => ownerIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id, x => x.FullName, ct);
        var items = rows.Select(x => new
        {
            id = x.Id,
            action = x.Title,
            relatedTo = $"{x.SellerName} · {x.RequirementNo}",
            owner = x.OwnerUserId.HasValue && ownerNames.TryGetValue(x.OwnerUserId.Value, out var name) ? name : "Unassigned",
            dueDate = x.DueDate?.ToString("yyyy-MM-dd") ?? "",
            status = x.Status,
            priority = x.DueDate.HasValue && x.DueDate.Value < today && x.Status != "COMPLETED" ? "High" : x.Status == "COMPLETED" ? "Low" : "Medium"
        });
        return Ok(items);
    }
    [HttpGet("samples")] public IActionResult Samples() => Ok(Array.Empty<object>());
    [HttpGet("qualifications")] public IActionResult Qualifications() => Ok(Array.Empty<object>());
    [HttpGet("evaluations")] public IActionResult Evaluations() => Ok(Array.Empty<object>());
    [HttpGet("vendor-onboarding")] public IActionResult VendorOnboarding() => Ok(Array.Empty<object>());
    [HttpGet("audits")]
    public async Task<IActionResult> Audits(CancellationToken ct)
    {
        var organizationId = await CurrentOrganizationIdAsync(ct);
        var myMeetingIds = await (from meeting in _db.Meetings.AsNoTracking()
                                  join engagement in _db.Engagements.AsNoTracking() on meeting.EngagementId equals engagement.Id
                                  join requirement in _db.BuyerRequirements.AsNoTracking() on engagement.RequirementId equals requirement.Id
                                  where requirement.OrganizationId == organizationId
                                  select meeting.Id).ToListAsync(ct);
        var myAwardIds = await (from award in _db.Awards.AsNoTracking()
                                join requirement in _db.BuyerRequirements.AsNoTracking() on award.RequirementId equals requirement.Id
                                where requirement.OrganizationId == organizationId
                                select award.Id).ToListAsync(ct);
        var relevantMeetingOrAwardIds = myMeetingIds.Concat(myAwardIds).ToHashSet();
        return Ok(await CoreDb.AuditLogs.AsNoTracking()
            .Where(x => x.TenantId == TenantId &&
                ((x.EntityName == "Meeting" || x.EntityName == "Award") && relevantMeetingOrAwardIds.Contains(x.EntityId)
                 || x.EntityName == "SellerCapability"))
            .OrderByDescending(x => x.OccurredAt).Take(100).ToListAsync(ct));
    }
    [HttpGet("negotiations")]
    public async Task<IActionResult> Negotiations(CancellationToken ct)
    {
        Demand("buyer.engagement.view");
        var organizationId = await CurrentOrganizationIdAsync(ct);
        var items = await (from engagement in _db.Engagements.AsNoTracking()
                           join requirement in _db.BuyerRequirements.AsNoTracking() on engagement.RequirementId equals requirement.Id
                           join capability in _db.SellerCapabilities.AsNoTracking() on engagement.CapabilityId equals capability.Id
                           join sellerOrg in _db.Organizations.AsNoTracking() on capability.OrganizationId equals sellerOrg.Id
                           where engagement.TenantId == TenantId && engagement.Stage == "NEGOTIATION" && requirement.OrganizationId == organizationId
                           select new { engagement.Id, requirement.RequirementNo, requirement.Title, SellerName = sellerOrg.LegalName, engagement.Stage, engagement.UpdatedAt }).ToListAsync(ct);
        return Ok(items);
    }
    [HttpGet("notifications")]
    public async Task<IActionResult> Notifications(CancellationToken ct)
    {
        var organizationId = await CurrentOrganizationIdAsync(ct);
        
        var myEngagementIds = await (from engagement in _db.Engagements.AsNoTracking()
                                     join requirement in _db.BuyerRequirements.AsNoTracking() on engagement.RequirementId equals requirement.Id
                                     join capability in _db.SellerCapabilities.AsNoTracking() on engagement.CapabilityId equals capability.Id
                                     where requirement.OrganizationId == organizationId || capability.OrganizationId == organizationId
                                     select engagement.Id).ToListAsync(ct);
        
        var myMeetingIds = await _db.Meetings.AsNoTracking().Where(m => myEngagementIds.Contains(m.EngagementId)).Select(m => m.Id).ToListAsync(ct);
        
        var myRfqIds = await (from rfq in _db.Rfqs.AsNoTracking()
                              join requirement in _db.BuyerRequirements.AsNoTracking() on rfq.RequirementId equals requirement.Id
                              join invitation in _db.RfqInvitations.AsNoTracking() on rfq.Id equals invitation.RfqId
                              join capability in _db.SellerCapabilities.AsNoTracking() on invitation.CapabilityId equals capability.Id
                              where requirement.OrganizationId == organizationId || capability.OrganizationId == organizationId
                              select rfq.Id).ToListAsync(ct);
                              
        var myQuotationIds = await _db.Quotations.AsNoTracking().Where(q => myRfqIds.Contains(q.RfqId)).Select(q => q.Id).ToListAsync(ct);
        
        var myMatchResultIds = await (from result in _db.MatchResults.AsNoTracking()
                                      join requirement in _db.BuyerRequirements.AsNoTracking() on result.RequirementId equals requirement.Id
                                      join capability in _db.SellerCapabilities.AsNoTracking() on result.CapabilityId equals capability.Id
                                      where requirement.OrganizationId == organizationId || capability.OrganizationId == organizationId
                                      select result.Id).ToListAsync(ct);

        var relevantIds = myEngagementIds.Concat(myMeetingIds).Concat(myMatchResultIds).Concat(myRfqIds).Concat(myQuotationIds).ToHashSet();
        
        var logs = await CoreDb.AuditLogs.AsNoTracking()
            .Where(x => x.TenantId == TenantId && (x.EntityName == "RequirementSellerEngagement" || x.EntityName == "Meeting" || x.EntityName == "MatchResult" || x.EntityName == "Quotation" || x.EntityName == "Rfq") && relevantIds.Contains(x.EntityId))
            .OrderByDescending(x => x.OccurredAt)
            .Take(100)
            .ToListAsync(ct);
            
        var notifications = logs.Select(x => {
            var title = $"{x.EntityName} {x.Action}";
            var href = "#";
            
            if (x.EntityName == "Quotation" && x.Action == "SUBMIT") { title = "Quotation Received"; href = "/buyer/rfqs"; }
            if (x.EntityName == "Rfq" && x.Action == "CREATE") { title = "New RFQ Received"; href = "/seller/rfqs"; }
            if (x.EntityName == "Meeting" && x.Action == "SCHEDULE") { title = "Meeting Scheduled"; href = "/buyer/meetings"; }
            if (x.EntityName == "Meeting" && x.Action == "OUTCOME") { title = "Meeting Outcome Updated"; href = "/buyer/meetings"; }
            
            return new {
                id = x.Id,
                type = x.Action,
                title,
                timestamp = x.OccurredAt,
                read = false,
                href
            };
        }).ToList();
        
        // Add dynamic meeting reminders for next 24 hours
        var upcomingMeetings = await _db.Meetings.AsNoTracking()
            .Where(m => myMeetingIds.Contains(m.Id) && m.Status == "SCHEDULED" && m.ScheduledStart > DateTimeOffset.UtcNow && m.ScheduledStart < DateTimeOffset.UtcNow.AddDays(1))
            .ToListAsync(ct);
            
        foreach (var m in upcomingMeetings) {
            notifications.Insert(0, new {
                id = Guid.NewGuid(),
                type = "REMINDER",
                title = $"Meeting Reminder: Starts at {m.ScheduledStart.ToLocalTime():g}",
                timestamp = DateTimeOffset.UtcNow,
                read = false,
                href = $"/buyer/meetings/{m.Id}"
            });
        }
        
        // Ensure New Messages are included too (since they aren't in AuditLogs, query directly)
        var recentMessages = await _db.EngagementMessages.AsNoTracking()
            .Where(m => myEngagementIds.Contains(m.EngagementId) && m.SenderOrganizationId != organizationId)
            .OrderByDescending(m => m.SentAt)
            .Take(20)
            .ToListAsync(ct);
            
        foreach (var msg in recentMessages) {
            notifications.Add(new {
                id = msg.Id,
                type = "MESSAGE",
                title = "New Message Received",
                timestamp = msg.SentAt,
                read = false,
                href = $"/buyer/meetings"
            });
        }
        
        return Ok(notifications.OrderByDescending(n => n.timestamp));
    }
    [HttpGet("reports")]
    public async Task<IActionResult> Reports(CancellationToken ct)
    {
        var organizationId = await CurrentOrganizationIdAsync(ct);
        return Ok(new[] { new {
            id = "marketplace-summary",
            name = "Buyer–Seller Marketplace Summary",
            generatedAt = DateTimeOffset.UtcNow,
            status = "Ready",
            requirements = await _db.BuyerRequirements.CountAsync(x => x.TenantId == TenantId && x.OrganizationId == organizationId, ct),
            matches = await _db.MatchResults.CountAsync(x => x.TenantId == TenantId && _db.BuyerRequirements.Any(r => r.Id == x.RequirementId && r.OrganizationId == organizationId), ct),
            awards = await _db.Awards.CountAsync(x => x.TenantId == TenantId && _db.BuyerRequirements.Any(r => r.Id == x.RequirementId && r.OrganizationId == organizationId), ct)
        } });
    }
}