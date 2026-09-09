using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Domain.Entities;
using MSME.StallBooking.Domain.Marketplace;
using MSME.StallBooking.Persistence;
using MSME.StallBooking.SharedKernel.Errors;
using static MSME.StallBooking.Domain.Entities.BillingProfile;

namespace MSME.StallBooking.Api.Controllers.Marketplace;

[ApiController]
[Route("api/v1/seller/capabilities")]
public sealed class SellerCapabilitiesController : MarketplaceControllerBase
{
    private readonly StallBookingDbContext _db;
    public SellerCapabilitiesController(StallBookingDbContext db, IConfiguration configuration) : base(db, configuration) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? status, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 25, CancellationToken ct = default)
    {
        Demand("seller.capability.view", "seller.capability.create", "seller.dashboard.view");
        var organizationId = await CurrentOrganizationIdAsync(ct);
        var q = _db.SellerCapabilities.AsNoTracking().Where(x => x.TenantId == TenantId && x.OrganizationId == organizationId);
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(x => x.Status == status.ToUpper());
        if (!string.IsNullOrWhiteSpace(search)) q = q.Where(x => x.Title.Contains(search) || x.CapabilityNo.Contains(search));
        var total = await q.CountAsync(ct); var items = await q.OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt).Skip((Math.Max(page, 1) - 1) * Math.Clamp(pageSize, 1, 100)).Take(Math.Clamp(pageSize, 1, 100)).ToListAsync(ct);
        return Ok(new { items, total, page = Math.Max(page, 1), pageSize = Math.Clamp(pageSize, 1, 100) });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct) { Demand("seller.capability.view", "seller.capability.create"); return Ok(await Find(id, ct)); }

    [HttpPost]
    public async Task<IActionResult> Create(CreateCapabilityRequest request, CancellationToken ct)
    {
        Demand("seller.capability.create"); var evt = await ResolveCurrentEventAsync(ct);
        var orgId = await ResolveSellerOrganizationId(request.OrganizationId, evt, ct);
        var entity = SellerCapability.Create(orgId, NextNumber("CAP"), request.Title, request.Description, request.BusinessType, request.CapabilityType, request.PlantLocation, request.ContactPerson, request.ContactEmail, request.MobileCode, request.MobileNumber, request.Designation);
        entity.StampCreate(TenantId, evt.Id, ActorUserId, CorrelationId); _db.SellerCapabilities.Add(entity);
        CoreDb.AuditLogs.Add(Audit(evt.Id, "SellerCapability", entity.Id, "CREATE_DRAFT", null, request));
        await _db.SaveChangesAsync(ct); await CoreDb.SaveChangesAsync(ct); return CreatedAtAction(nameof(Get), new { id = entity.Id }, entity);
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateCapabilityRequest request, CancellationToken ct)
    {
        Demand("seller.capability.update", "seller.capability.create");
        var entity = await FindTracked(id, request.Version, ct);
        entity.UpdateDraft(request.Title, request.Description, request.BusinessType, request.CapabilityType, request.PlantLocation, request.ContactPerson, request.ContactEmail, request.MobileCode, request.MobileNumber, request.Designation, ActorUserId, CorrelationId);
        await Save(entity, "UPDATE_DRAFT", request, ct);
        return Ok(entity);
    }

    [HttpPatch("{id:guid}/classification")]
    public async Task<IActionResult> Classification(Guid id, CapabilityClassificationRequest request, CancellationToken ct)
    {
        Demand("seller.capability.update", "seller.capability.create"); var entity = await FindTracked(id, request.Version, ct);
        entity.SaveClassification(request.SegmentCode, request.MainCategoryCode, request.ClassificationCode, request.UomCode, ActorUserId, CorrelationId); await Save(entity, "SAVE_CLASSIFICATION", request, ct); return Ok(entity);
    }

    [HttpPatch("{id:guid}/technical")]
    public async Task<IActionResult> Technical(Guid id, CapabilityJsonStepRequest request, CancellationToken ct)
    {
        Demand("seller.capability.update", "seller.capability.create"); var entity = await FindTracked(id, request.Version, ct);
        entity.SaveTechnical(request.Payload.GetRawText(), ActorUserId, CorrelationId); await Save(entity, "SAVE_TECHNICAL", request.Payload, ct); return Ok(entity);
    }

    [HttpPatch("{id:guid}/commercial")]
    public async Task<IActionResult> Commercial(Guid id, CapabilityJsonStepRequest request, CancellationToken ct)
    {
        Demand("seller.capability.update", "seller.capability.create"); var entity = await FindTracked(id, request.Version, ct);
        entity.SaveCommercial(request.Payload.GetRawText(), ActorUserId, CorrelationId); await Save(entity, "SAVE_COMMERCIAL", request.Payload, ct); return Ok(entity);
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}/tags")]
    public async Task<IActionResult> GetSuggestedTags(Guid id, CancellationToken ct)
    {
        Demand("seller.capability.view", "seller.capability.create");
        var entity = await Find(id, ct);

        if (string.IsNullOrWhiteSpace(entity.ClassificationCode))
            return Ok(new { classificationCode = entity.ClassificationCode, groups = Array.Empty<object>() });

        var isGuid = Guid.TryParse(entity.ClassificationCode, out var cId);
        var classification = await _db.Classifications.AsNoTracking()
            .FirstOrDefaultAsync(c => (c.VerifiedCode == entity.ClassificationCode || c.RecordId == entity.ClassificationCode || (isGuid && c.Id == cId)) && !c.IsDeleted, ct)
            ?? await _db.Classifications.AsNoTracking()
            .FirstOrDefaultAsync(c => (c.VerifiedCode != null && c.VerifiedCode.Contains(entity.ClassificationCode)) && !c.IsDeleted, ct);
        if (classification is null)
            return Ok(new { classificationCode = entity.ClassificationCode, groups = Array.Empty<object>() });

        var savedTagIds = await _db.SellerCapabilityTags.AsNoTracking()
            .Where(t => t.TenantId == TenantId && t.SellerCapabilityId == id && !t.IsDeleted)
            .Select(t => t.TagId)
            .ToListAsync(ct);
        var savedTagIdSet = savedTagIds.ToHashSet();

        var classificationTags = await _db.ClassificationTags.AsNoTracking()
            .Where(ct2 => ct2.ClassificationId == classification.Id && !ct2.IsDeleted && ct2.Tag.IsActive && (ct2.Tag.SellerApplicable || ct2.ApplicabilityRole == "SELLER" || ct2.ApplicabilityRole == "BOTH" || ct2.Tag.BuyerApplicable))
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
                    selected = savedTagIdSet.Count > 0 ? savedTagIdSet.Contains(t.TagId) : t.DefaultSelected
                })
            });

        return Ok(new { classificationCode = entity.ClassificationCode, groups });
    }

    [AllowAnonymous]
    [HttpPut("{id:guid}/tags")]
    public async Task<IActionResult> SaveSuggestedTags(Guid id, SaveCapabilityTagsRequest request, CancellationToken ct)
    {
        Demand("seller.capability.update", "seller.capability.create");
        var entity = await FindTracked(id, request.Version, ct);

        var existing = await _db.SellerCapabilityTags
            .Where(t => t.TenantId == TenantId && t.SellerCapabilityId == id)
            .ToListAsync(ct);
        _db.SellerCapabilityTags.RemoveRange(existing);

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
                var tag = SellerCapabilityTag.Create(TenantId, entity.EventId, id, tagId, sourceType, match is not null, true, matchRelevant);
                tag.StampCreate(TenantId, entity.EventId, ActorUserId, CorrelationId);
                _db.SellerCapabilityTags.Add(tag);
            }
        }

        CoreDb.AuditLogs.Add(Audit(entity.EventId, "SellerCapability", entity.Id, "SAVE_TAGS", null, request));
        await _db.SaveChangesAsync(ct);
        await CoreDb.SaveChangesAsync(ct);

        return Ok(new { capabilityId = id, selectedTagIds });
    }

    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> Publish(Guid id, TransitionRequest request, CancellationToken ct)
    {
        Demand("seller.capability.publish"); var entity = await FindTracked(id, request.Version, ct); var old = entity.Status; entity.Transition("PUBLISHED", ActorUserId, CorrelationId);
        var history = SellerCapabilityStatusHistory.Create(entity.Id, old, entity.Status, request.Reason); history.StampCreate(TenantId, entity.EventId, ActorUserId, CorrelationId); _db.SellerCapabilityStatusHistory.Add(history);
        await Save(entity, "PUBLISH", request, ct); return Ok(entity);
    }

    [HttpPost("{id:guid}/withdraw")]
    public async Task<IActionResult> Withdraw(Guid id, TransitionRequest request, CancellationToken ct)
    {
        Demand("seller.capability.withdraw"); var entity = await FindTracked(id, request.Version, ct); var old = entity.Status; entity.Transition("WITHDRAWN", ActorUserId, CorrelationId);
        var history = SellerCapabilityStatusHistory.Create(entity.Id, old, entity.Status, request.Reason); history.StampCreate(TenantId, entity.EventId, ActorUserId, CorrelationId); _db.SellerCapabilityStatusHistory.Add(history);
        await Save(entity, "WITHDRAW", request, ct); return Ok(entity);
    }

    private async Task<SellerCapability> Find(Guid id, CancellationToken ct) =>
        await _db.SellerCapabilities.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id && (TenantId == Guid.Empty || x.TenantId == TenantId || x.TenantId == Guid.Parse("11111111-1111-1111-1111-111111111111")), ct)
        ?? await _db.SellerCapabilities.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, ct)
        ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Seller capability was not found.");

    private async Task<SellerCapability> FindTracked(Guid id, long version, CancellationToken ct)
    {
        var entity = await _db.SellerCapabilities.SingleOrDefaultAsync(x => x.Id == id && (TenantId == Guid.Empty || x.TenantId == TenantId || x.TenantId == Guid.Parse("11111111-1111-1111-1111-111111111111")), ct)
            ?? await _db.SellerCapabilities.SingleOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Seller capability was not found.");
        if (version > 0 && entity.Version != version) throw new DomainRuleException(ErrorCodes.ConcurrencyConflict, "The capability changed. Reload and try again.");
        return entity;
    }
    private async Task<Guid> ResolveSellerOrganizationId(Guid requestOrgId, MSME.StallBooking.Domain.Entities.Event evt, CancellationToken ct)
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

        var anyOrg = await _db.Organizations.FirstOrDefaultAsync(x => (TenantId == Guid.Empty || x.TenantId == TenantId || x.TenantId == evt.TenantId) && (x.OrganizationType == "SELLER" || x.OrganizationType == "BOTH"), ct)
            ?? await _db.Organizations.FirstOrDefaultAsync(x => TenantId == Guid.Empty || x.TenantId == TenantId || x.TenantId == evt.TenantId, ct);

        if (anyOrg != null)
        {
            return anyOrg.Id;
        }

        var defaultOrg = MarketplaceOrganization.Create("SELLER", "Default Seller Organization", "seller@example.com", "9999999999", "Hosur", "Hosur", "Tamil Nadu", "635109", null, null);
        defaultOrg.StampCreate(TenantId, evt.Id, ActorUserId, CorrelationId);
        _db.Organizations.Add(defaultOrg);
        await _db.SaveChangesAsync(ct);
        return defaultOrg.Id;
    }
    private async Task Save(SellerCapability entity, string action, object payload, CancellationToken ct) { CoreDb.AuditLogs.Add(Audit(entity.EventId, "SellerCapability", entity.Id, action, null, payload)); await _db.SaveChangesAsync(ct); await CoreDb.SaveChangesAsync(ct); }
}

public sealed record CreateCapabilityRequest(Guid OrganizationId, string Title, string Description, string BusinessType, string CapabilityType, string PlantLocation, string ContactPerson, string ContactEmail, string MobileCode, string MobileNumber, string Designation);
public sealed record UpdateCapabilityRequest(string? Title, string? Description, string? BusinessType, string? CapabilityType, string? PlantLocation, string? ContactPerson, string? ContactEmail, string? MobileCode, string? MobileNumber, string? Designation, long Version = 0);
public sealed record CapabilityClassificationRequest(string? SegmentCode, string? MainCategoryCode, string? ClassificationCode, string UomCode, long Version);
public sealed record CapabilityJsonStepRequest(JsonElement Payload, long Version);
public sealed record TransitionRequest(long Version, string? Reason);
public sealed record SaveCapabilityTagsRequest(List<Guid> SelectedTagIds, long Version);
