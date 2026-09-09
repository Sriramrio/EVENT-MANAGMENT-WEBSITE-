using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Domain.Entities;
using MSME.StallBooking.Domain.Marketplace;
using MSME.StallBooking.Persistence;
using MSME.StallBooking.SharedKernel.Errors;
using System.Text.Json;
using System.Text.Json.Nodes;
using static MSME.StallBooking.Domain.Entities.BillingProfile;

namespace MSME.StallBooking.Api.Controllers.Marketplace;

[ApiController]
[Route("api/v1/buyer/requirements")]
public sealed class BuyerRequirementsController : MarketplaceControllerBase
{
    private readonly StallBookingDbContext _db;
    public BuyerRequirementsController(StallBookingDbContext db, IConfiguration configuration) : base(db, configuration) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? status, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 25, CancellationToken ct = default)
    {
        Demand("buyer.requirement.view", "buyer.requirement.create", "buyer.dashboard.view");
        var organizationId = await CurrentOrganizationIdAsync(ct);
        var q = _db.BuyerRequirements.AsNoTracking().Where(x => x.TenantId == TenantId && x.OrganizationId == organizationId);
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(x => x.Status == status.ToUpper()); if (!string.IsNullOrWhiteSpace(search)) q = q.Where(x => x.Title.Contains(search) || x.RequirementNo.Contains(search));
        var total = await q.CountAsync(ct); var size = Math.Clamp(pageSize, 1, 100);
        var entities = await q.OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt).Skip((Math.Max(page, 1) - 1) * size).Take(size).ToListAsync(ct);

        var requirementIds = entities.Select(x => x.Id).ToList();
        var matchStats = await _db.MatchResults.AsNoTracking()
            .Where(m => m.TenantId == TenantId && requirementIds.Contains(m.RequirementId))
            .GroupBy(m => m.RequirementId)
            .Select(g => new { RequirementId = g.Key, Count = g.Count(), AverageScore = g.Average(x => x.Score) })
            .ToListAsync(ct);
        var items = entities.Select(x =>
        {
            var stat = matchStats.FirstOrDefault(s => s.RequirementId == x.Id);
            return new
            {
                x.Id,
                x.RequirementNo,
                x.Title,
                x.Description,
                x.SourcingType,
                x.SegmentCode,
                x.MainCategoryCode,
                x.ClassificationCode,
                x.Quantity,
                x.UomCode,
                x.RequirementDate,
                x.NeedByDate,
                x.BudgetMin,
                x.BudgetMax,
                x.Currency,
                x.Status,
                x.Version,
                x.CreatedAt,
                x.UpdatedAt,
                matchCount = stat?.Count ?? 0,
                averageMatchScore = stat != null ? Math.Round(stat.AverageScore, 0) : 0,
            };
        });
        return Ok(new { items, total, page = Math.Max(page, 1), pageSize = size });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        Demand("buyer.requirement.view", "buyer.requirement.create");
        var entity = await Find(id, false, ct);

        var matchCount = await _db.MatchResults.AsNoTracking().CountAsync(m => m.TenantId == TenantId && m.RequirementId == entity.Id, ct);
        var averageMatchScore = matchCount > 0
            ? Math.Round(await _db.MatchResults.AsNoTracking().Where(m => m.TenantId == TenantId && m.RequirementId == entity.Id).AverageAsync(m => m.Score, ct), 0)
            : 0;

        JsonNode? parsedDetails;
        try
        {
            parsedDetails = !string.IsNullOrWhiteSpace(entity.DetailsJson)
                ? JsonNode.Parse(entity.DetailsJson)
                : new JsonObject();
        }
        catch
        {
            parsedDetails = new JsonObject();
        }

        return Ok(new
        {
            entity.Id,
            entity.TenantId,
            entity.EventId,
            entity.OrganizationId,
            entity.RequirementNo,
            entity.Title,
            entity.Description,
            entity.SourcingType,
            entity.SegmentCode,
            entity.MainCategoryCode,
            entity.ClassificationCode,
            entity.Quantity,
            entity.UomCode,
            entity.RequirementDate,
            entity.NeedByDate,
            entity.BudgetMin,
            entity.BudgetMax,
            entity.Currency,
            entity.Status,
            matchCount,
            averageMatchScore,
            detailsJson = parsedDetails,
            entity.Version,
            entity.CreatedAt,
            entity.CreatedBy,
            entity.UpdatedAt,
            entity.UpdatedBy,
            entity.DeletedAt,
            entity.DeletedBy,
            entity.IsDeleted,
            entity.CorrelationId
        });
    }
    [HttpPost]
    public async Task<IActionResult> Create(CreateRequirementRequest request, CancellationToken ct)
    {
        Demand("buyer.requirement.create"); var evt = await ResolveCurrentEventAsync(ct);
        var orgId = await ResolveBuyerOrganizationId(request.OrganizationId, evt, ct);
        var entity = BuyerRequirement.Create(orgId, NextNumber("REQ"), request.Title, request.Description, request.SourcingType, request.SegmentCode, request.MainCategoryCode, request.ClassificationCode, request.Quantity, request.UomCode, request.NeedByDate, request.BudgetMin, request.BudgetMax, request.Details.GetRawText()); entity.StampCreate(TenantId, evt.Id, ActorUserId, CorrelationId); _db.BuyerRequirements.Add(entity); CoreDb.AuditLogs.Add(Audit(evt.Id, "BuyerRequirement", entity.Id, "CREATE_DRAFT", null, request)); await _db.SaveChangesAsync(ct); await CoreDb.SaveChangesAsync(ct); return CreatedAtAction(nameof(Get), new { id = entity.Id }, entity);
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateRequirementRequest request, CancellationToken ct)
    {
        Demand("buyer.requirement.update", "buyer.requirement.create");
        var entity = await FindTracked(id, request.Version, ct);
        var detailsText = request.Details.HasValue && request.Details.Value.ValueKind != JsonValueKind.Undefined
            ? request.Details.Value.GetRawText()
            : null;
        entity.UpdateDraft(request.Title, request.Description, request.SourcingType, request.SegmentCode, request.MainCategoryCode, request.ClassificationCode, request.Quantity, request.UomCode, request.NeedByDate, request.BudgetMin, request.BudgetMax, detailsText, ActorUserId, CorrelationId);
        await Save(entity, "UPDATE_DRAFT", request, ct);
        return Ok(entity);
    }

    [HttpPost("{id:guid}/publish")]
    public Task<IActionResult> Publish(Guid id, TransitionRequest request, CancellationToken ct) => Transition(id, "PUBLISHED", request, "PUBLISH", ct);
    [HttpPost("{id:guid}/cancel")]
    public Task<IActionResult> Cancel(Guid id, TransitionRequest request, CancellationToken ct) => Transition(id, "CANCELLED", request, "CANCEL", ct);

    // Screen 02 — Classification Selection must land here, not in SaveStep(), because this
    // is what actually updates the queryable SegmentCode/MainCategoryCode/ClassificationCode
    // columns that MatchingController.Score() reads. Mirrors
    // SellerCapabilitiesController's PATCH {id}/classification endpoint.
    [HttpPatch("{id:guid}/classification")]
    public async Task<IActionResult> SaveClassification(Guid id, RequirementClassificationRequest request, CancellationToken ct)
    {
        Demand("buyer.requirement.update", "buyer.requirement.create");
        var entity = await FindTracked(id, request.Version, ct);
        entity.SaveClassification(request.SegmentCode, request.MainCategoryCode, request.ClassificationCode, ActorUserId, CorrelationId);
        await Save(entity, "SAVE_CLASSIFICATION", request, ct);
        return Ok(entity);
    }

    // Screen 03 — Intelligent Suggestions. Tags are looked up from ClassificationTags for
    // whatever ClassificationCode was saved by the classification screen (Classifications.VerifiedCode),
    // NOT hardcoded/string-matched on the category name in the frontend. Grouped by the tag's
    // TagType so the UI can render "Materials / Processes / Attributes / Quality" sections,
    // with DefaultSelected/EditableByUser/MandatoryStatus driving which chips start checked.
    [AllowAnonymous]
    [HttpGet("{id:guid}/tags")]
    public async Task<IActionResult> GetSuggestedTags(Guid id, CancellationToken ct)
    {
        Demand("buyer.requirement.view", "buyer.requirement.create");
        var entity = await Find(id, false, ct);

        if (string.IsNullOrWhiteSpace(entity.ClassificationCode))
            return Ok(new { classificationCode = entity.ClassificationCode, groups = Array.Empty<object>() });

        var isGuid = Guid.TryParse(entity.ClassificationCode, out var cId);
        var classification = await _db.Classifications.AsNoTracking()
            .FirstOrDefaultAsync(c => (c.VerifiedCode == entity.ClassificationCode || c.RecordId == entity.ClassificationCode || (isGuid && c.Id == cId)) && !c.IsDeleted, ct)
            ?? await _db.Classifications.AsNoTracking()
            .FirstOrDefaultAsync(c => (c.VerifiedCode != null && c.VerifiedCode.Contains(entity.ClassificationCode)) && !c.IsDeleted, ct);
        if (classification is null)
            return Ok(new { classificationCode = entity.ClassificationCode, groups = Array.Empty<object>() });

        // Tags the buyer already picked/saved for this requirement (if any), so the screen
        // can restore prior selections instead of always resetting to just the defaults.
        var savedTagIds = await _db.BuyerRequirementTags.AsNoTracking()
            .Where(t => t.TenantId == TenantId && t.BuyerRequirementId == id && !t.IsDeleted)
            .Select(t => t.TagId)
            .ToListAsync(ct);
        var savedTagIdSet = savedTagIds.ToHashSet();

        var classificationTags = await _db.ClassificationTags.AsNoTracking()
            .Where(ct2 => ct2.ClassificationId == classification.Id && !ct2.IsDeleted && ct2.Tag.IsActive && (ct2.Tag.BuyerApplicable || ct2.ApplicabilityRole == "BUYER" || ct2.ApplicabilityRole == "BOTH" || ct2.Tag.SellerApplicable))
            .OrderBy(ct2 => ct2.Tag.TagType.DisplayOrder)
            .ThenBy(ct2 => ct2.DisplayOrder)
            .Select(ct2 => new
            {
                ct2.Tag.TagType.TagTypeCode,
                ct2.Tag.TagType.TagTypeName,
                ct2.Tag.TagType.DisplayOrder,
                TagId = ct2.TagId,
                ct2.Tag.TagCode,
                ct2.Tag.TagName,
                ct2.Tag.TagGroup,
                ct2.ApplicabilityRole,
                ct2.RelationshipType,
                ct2.UiBehaviour,
                ct2.ConfidenceScore,
                ct2.RelevanceWeight,
                ct2.DefaultSelected,
                ct2.EditableByUser,
                ct2.MandatoryStatus,
                //ct2.DisplayOrder
            })
            .ToListAsync(ct);

        var groups = classificationTags
            .GroupBy(t => new { t.TagTypeCode, t.TagTypeName, t.DisplayOrder })
            .OrderBy(g => g.Key.DisplayOrder)
            .Select(g => new
            {
                tagTypeCode = g.Key.TagTypeCode,
                tagTypeName = g.Key.TagTypeName,
                tags = g.Select(t => new
                {
                    tagId = t.TagId,
                    tagCode = t.TagCode,
                    tagName = t.TagName,
                    tagGroup = t.TagGroup,
                    applicabilityRole = t.ApplicabilityRole,
                    relationshipType = t.RelationshipType,
                    uiBehaviour = t.UiBehaviour,
                    confidenceScore = t.ConfidenceScore,
                    relevanceWeight = t.RelevanceWeight,
                    mandatoryStatus = t.MandatoryStatus,
                    editableByUser = t.EditableByUser,
                    // Selected = whatever was previously saved for this requirement, falling back
                    // to the classification's own DefaultSelected flag when nothing saved yet.
                    selected = savedTagIdSet.Count > 0 ? savedTagIdSet.Contains(t.TagId) : t.DefaultSelected
                })
            });

        return Ok(new { classificationCode = entity.ClassificationCode, groups });
    }

    // Persists the buyer's chip selections from the Intelligent Suggestions screen into
    // BuyerRequirementTags (replace-all semantics — the UI always posts its full current
    // selection). MatchRelevant is copied off ClassificationTags.RelationshipType/UiBehaviour
    // so downstream matching can weight selected tags without re-joining ClassificationTags.
    [AllowAnonymous]
    [HttpPut("{id:guid}/tags")]
    public async Task<IActionResult> SaveSuggestedTags(Guid id, SaveRequirementTagsRequest request, CancellationToken ct)
    {
        Demand("buyer.requirement.update", "buyer.requirement.create");
        var entity = await FindTracked(id, request.Version, ct);

        var existing = await _db.BuyerRequirementTags
            .Where(t => t.TenantId == TenantId && t.BuyerRequirementId == id)
            .ToListAsync(ct);
        _db.BuyerRequirementTags.RemoveRange(existing);

        var selectedTagIds = (request.SelectedTagIds ?? new List<Guid>()).Distinct().ToList();
        if (selectedTagIds.Count > 0)
        {
            var isGuid = Guid.TryParse(entity.ClassificationCode, out var cId);
            var classification = string.IsNullOrWhiteSpace(entity.ClassificationCode)
                ? null
                : await _db.Classifications.AsNoTracking()
                    .FirstOrDefaultAsync(c => (c.VerifiedCode == entity.ClassificationCode || c.RecordId == entity.ClassificationCode || (isGuid && c.Id == cId)) && c.IsActive && !c.IsDeleted, ct);

            var classificationTagLookup = classification is null
                ? new List<ClassificationTag>()
                : await _db.ClassificationTags.AsNoTracking()
                    .Where(ct2 => ct2.ClassificationId == classification.Id && selectedTagIds.Contains(ct2.TagId))
                    .ToListAsync(ct);

            foreach (var tagId in selectedTagIds)
            {
                var match = classificationTagLookup.FirstOrDefault(ct2 => ct2.TagId == tagId);
                var sourceType = match is not null ? "CLASSIFICATION_SUGGESTED" : "USER_ADDED";
                var matchRelevant = match?.RelationshipType is "PRIMARY" or "REQUIRED" || match is null;
                var tag = BuyerRequirementTag.Create(TenantId, entity.EventId, id, tagId, sourceType, match is not null, true, matchRelevant);
                tag.StampCreate(TenantId, entity.EventId, ActorUserId, CorrelationId);
                _db.BuyerRequirementTags.Add(tag);
            }
        }

        CoreDb.AuditLogs.Add(Audit(entity.EventId, "BuyerRequirement", entity.Id, "SAVE_TAGS", null, request));
        await _db.SaveChangesAsync(ct);
        await CoreDb.SaveChangesAsync(ct);

        return Ok(new { requirementId = id, selectedTagIds });
    }

    [HttpPatch("{id:guid}/steps/{step}")]
    public async Task<IActionResult> SaveStep(Guid id, string step, RequirementStepRequest request, CancellationToken ct)
    {
        Demand("buyer.requirement.update", "buyer.requirement.create");
        var entity = await FindTracked(id, request.Version, ct);

        entity.SaveStep(step, request.Payload.GetRawText(), ActorUserId, CorrelationId);

        var entry = _db.Entry(entity);
        entry.Property(x => x.Title).IsModified = true;
        entry.Property(x => x.Description).IsModified = true;
        entry.Property(x => x.SourcingType).IsModified = true;
        entry.Property(x => x.DetailsJson).IsModified = true;
        entry.Property(x => x.SegmentCode).IsModified = true;
        entry.Property(x => x.MainCategoryCode).IsModified = true;
        entry.Property(x => x.ClassificationCode).IsModified = true;
        entry.Property(x => x.Quantity).IsModified = true;
        entry.Property(x => x.UomCode).IsModified = true;
        entry.Property(x => x.NeedByDate).IsModified = true;
        entry.Property(x => x.Version).IsModified = true;

        await Save(entity, $"SAVE_{step.ToUpperInvariant()}", request.Payload, ct);
        return Ok(entity);
    }
    private async Task<IActionResult> Transition(Guid id, string status, TransitionRequest request, string action, CancellationToken ct)
    {
        Demand(status == "PUBLISHED" ? "buyer.requirement.submit" : "buyer.requirement.cancel"); var entity = await FindTracked(id, request.Version, ct); var old = entity.Status; entity.Transition(status, ActorUserId, CorrelationId); var history = BuyerRequirementStatusHistory.Create(entity.Id, old, entity.Status, request.Reason); history.StampCreate(TenantId, entity.EventId, ActorUserId, CorrelationId); _db.BuyerRequirementStatusHistory.Add(history); await Save(entity, action, request, ct); return Ok(entity);
    }

    private async Task<BuyerRequirement> Find(Guid id, bool tracked, CancellationToken ct)
    {
        IQueryable<BuyerRequirement> query = _db.BuyerRequirements;
        if (!tracked) query = query.AsNoTracking();
        var organizationId = await CurrentOrganizationIdAsync(ct);
        return await query.SingleOrDefaultAsync(x => x.Id == id && (TenantId == Guid.Empty || x.TenantId == TenantId || x.TenantId == Guid.Parse("11111111-1111-1111-1111-111111111111")) && (organizationId == null || x.OrganizationId == organizationId), ct)
            ?? await query.SingleOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Buyer requirement was not found.");
    }
    private async Task<BuyerRequirement> FindTracked(Guid id, long version, CancellationToken ct)
    {
        var entity = await Find(id, true, ct);

        if (version > 0 && entity.Version != version)
        {
            throw new DomainRuleException(ErrorCodes.ConcurrencyConflict, "The requirement changed. Reload and try again.");
        }

        return entity;
    }
    private async Task<Guid> ResolveBuyerOrganizationId(Guid requestOrgId, MSME.StallBooking.Domain.Entities.Event evt, CancellationToken ct)
    {
        if (requestOrgId != Guid.Empty && await _db.Organizations.AnyAsync(x => x.Id == requestOrgId && (TenantId == Guid.Empty || x.TenantId == TenantId || x.TenantId == evt.TenantId), ct))
        {
            return requestOrgId;
        }

        var currentOrgId = await CurrentOrganizationIdAsync(ct);
        if (currentOrgId.HasValue && currentOrgId.Value != Guid.Empty)
        {
            return currentOrgId.Value;
        }

        var anyOrg = await _db.Organizations.FirstOrDefaultAsync(x => (TenantId == Guid.Empty || x.TenantId == TenantId || x.TenantId == evt.TenantId) && (x.OrganizationType == "BUYER" || x.OrganizationType == "BOTH"), ct)
            ?? await _db.Organizations.FirstOrDefaultAsync(x => TenantId == Guid.Empty || x.TenantId == TenantId || x.TenantId == evt.TenantId, ct);

        if (anyOrg != null)
        {
            return anyOrg.Id;
        }

        var defaultOrg = MarketplaceOrganization.Create("BUYER", "Default Buyer Organization", "buyer@example.com", "9999999999", "Hosur", "Hosur", "Tamil Nadu", "635109", null, null);
        defaultOrg.StampCreate(TenantId, evt.Id, ActorUserId, CorrelationId);
        _db.Organizations.Add(defaultOrg);
        await _db.SaveChangesAsync(ct);
        return defaultOrg.Id;
    }
    private async Task Save(BuyerRequirement entity, string action, object payload, CancellationToken ct) { CoreDb.AuditLogs.Add(Audit(entity.EventId, "BuyerRequirement", entity.Id, action, null, payload)); await _db.SaveChangesAsync(ct); await CoreDb.SaveChangesAsync(ct); }
}

public sealed record CreateRequirementRequest(Guid OrganizationId, string Title, string Description, string SourcingType, string? SegmentCode, string? MainCategoryCode, string? ClassificationCode, decimal Quantity, string UomCode, DateOnly NeedByDate, decimal? BudgetMin, decimal? BudgetMax, JsonElement Details);
public sealed record RequirementClassificationRequest(string? SegmentCode, string? MainCategoryCode, string? ClassificationCode, long Version);
public sealed record UpdateRequirementRequest(string? Title, string? Description, string? SourcingType, string? SegmentCode, string? MainCategoryCode, string? ClassificationCode, decimal? Quantity, string? UomCode, DateOnly? NeedByDate, decimal? BudgetMin, decimal? BudgetMax, JsonElement? Details, long Version = 0);
public sealed record RequirementStepRequest(JsonElement Payload, long Version);
public sealed record SaveRequirementTagsRequest(List<Guid> SelectedTagIds, long Version);