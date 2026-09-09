using System.Linq;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Domain.Marketplace;
using MSME.StallBooking.Persistence;
using MSME.StallBooking.SharedKernel.Errors;

namespace MSME.StallBooking.Api.Controllers.Marketplace;

[ApiController]
[Route("api/v1/marketplace/matching")]
public sealed class MatchingController : MarketplaceControllerBase
{
    private readonly StallBookingDbContext _db;
    public MatchingController(StallBookingDbContext db, IConfiguration configuration) : base(db, configuration) => _db = db;

    [HttpPost("requirements/{requirementId:guid}/run")]
    public async Task<IActionResult> Run(Guid requirementId, CancellationToken ct)
    {
        Demand("buyer.matches.run", "buyer.requirement.submit");
        var requirement = await _db.BuyerRequirements.SingleOrDefaultAsync(x => x.Id == requirementId && x.TenantId == TenantId, ct) ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Requirement was not found.");
        var capabilities = await _db.SellerCapabilities.Where(x => x.TenantId == TenantId && x.Status == "PUBLISHED").ToListAsync(ct);

        // The buyer UI calls this endpoint on every visit to the Matches screen so results
        // stay fresh as sellers publish new capabilities. That only works if re-running is
        // actually idempotent: previously it was not — (a) old MatchResults/components from
        // earlier runs were never removed, so results would have duplicated once the buyer
        // revisited the page, and (b) requirement.Transition("MATCHING") throws once the
        // requirement is already in MATCHING status, since MATCHING -> MATCHING isn't in the
        // allowed transition set. That second bug silently failed every re-run after the
        // first (the whole request 400'd before SaveChangesAsync), which is why matches could
        // get stuck at whatever the first run found — including zero, if no capability had
        // been published yet at that point.
        var previousResults = await _db.MatchResults.Where(x => x.TenantId == TenantId && x.RequirementId == requirementId).ToListAsync(ct);
        if (previousResults.Count > 0)
        {
            var previousResultIds = previousResults.Select(x => x.Id).ToList();
            var previousComponents = await _db.MatchResultComponents.Where(x => x.TenantId == TenantId && previousResultIds.Contains(x.MatchResultId)).ToListAsync(ct);
            _db.MatchResultComponents.RemoveRange(previousComponents);
            _db.MatchResults.RemoveRange(previousResults);
        }

        var run = MatchRun.Create(requirementId); run.StampCreate(TenantId, requirement.EventId, ActorUserId, CorrelationId); _db.MatchRuns.Add(run);
        var rank = 0;
        foreach (var candidate in capabilities.Select(x => new { Capability = x, Score = Score(requirement, x) }).OrderByDescending(x => x.Score))
        {
            rank++;
            var explanation = candidate.Capability.ClassificationCode == requirement.ClassificationCode ? "Exact classification match" : candidate.Capability.MainCategoryCode == requirement.MainCategoryCode ? "Main-category match" : "Keyword and capacity candidate";
            var result = MatchResult.Create(run.Id, requirement.Id, candidate.Capability.Id, candidate.Score, rank, explanation); result.StampCreate(TenantId, requirement.EventId, ActorUserId, CorrelationId); _db.MatchResults.Add(result);

            var locationRaw = LocationScore(requirement.DetailsJson, candidate.Capability.PlantLocation) / 12m * 100m;
            var certificationRaw = CertificationScore(requirement.DetailsJson, candidate.Capability.TechnicalJson) / 10m * 100m;

            AddComponent(result.Id, requirement.EventId, "EXACT_CODE", 40, candidate.Capability.ClassificationCode == requirement.ClassificationCode ? 100 : 0, "Exact HSN/SAC code signal");
            AddComponent(result.Id, requirement.EventId, "HEADING_4", 15, SameHeading(requirement.ClassificationCode, candidate.Capability.ClassificationCode) ? 100 : 0, "Same four-digit classification heading");
            AddComponent(result.Id, requirement.EventId, "CATEGORY", 10, candidate.Capability.MainCategoryCode == requirement.MainCategoryCode ? 100 : 0, "Same normalized main category");
            AddComponent(result.Id, requirement.EventId, "KEYWORD_PROCESS", 10, candidate.Capability.TechnicalJson.Length > 10 ? 80 : 30, "Process and technical-keyword coverage");
            AddComponent(result.Id, requirement.EventId, "FIT", 3, candidate.Capability.CommercialJson.Length > 10 ? 80 : 40, "Location, capacity and certification fit");
            AddComponent(result.Id, requirement.EventId, "LOCATION_FIT", 12, locationRaw, "Preferred state / plant location fit");
            AddComponent(result.Id, requirement.EventId, "CERTIFICATION_FIT", 10, certificationRaw, "Certification overlap (ISO/IATF etc.)");
        }
        if (requirement.Status == "PUBLISHED") requirement.Transition("MATCHING", ActorUserId, CorrelationId);
        CoreDb.AuditLogs.Add(Audit(requirement.EventId, "MatchRun", run.Id, "RUN", null, new { requirementId, matches = rank })); await _db.SaveChangesAsync(ct); await CoreDb.SaveChangesAsync(ct); return Ok(new { run.Id, run.Status, matchCount = rank });
    }

    [HttpGet("/api/v1/buyer/requirements/{requirementId:guid}/matches")]
    public async Task<IActionResult> BuyerMatches(Guid requirementId, CancellationToken ct)
    {
        Demand("buyer.matches.view");
        var organizationId = await CurrentOrganizationIdAsync(ct);
        var ownsRequirement = await _db.BuyerRequirements.AsNoTracking().AnyAsync(x => x.Id == requirementId && x.TenantId == TenantId && x.OrganizationId == organizationId, ct);
        if (!ownsRequirement) throw new DomainRuleException(ErrorCodes.EntityNotFound, "Requirement was not found.");
        var items = await (from result in _db.MatchResults.AsNoTracking() join capability in _db.SellerCapabilities.AsNoTracking() on result.CapabilityId equals capability.Id where result.TenantId == TenantId && result.RequirementId == requirementId orderby result.Rank select new { id = result.Id, requirementId, supplierId = capability.OrganizationId, capabilityId = capability.Id, supplierName = capability.Title, score = result.Score, rank = result.Rank, explanation = result.Explanation, status = "Recommended" }).ToListAsync(ct);
        return Ok(items);
    }

    [HttpGet("/api/v1/seller/opportunities")]
    public async Task<IActionResult> SellerOpportunities(CancellationToken ct)
    {
        Demand("seller.opportunity.view", "seller.dashboard.view");
        var organizationId = await CurrentOrganizationIdAsync(ct);
        var q = from result in _db.MatchResults.AsNoTracking() join capability in _db.SellerCapabilities.AsNoTracking() on result.CapabilityId equals capability.Id join requirement in _db.BuyerRequirements.AsNoTracking() on result.RequirementId equals requirement.Id where result.TenantId == TenantId select new { id = result.Id, requirementId = requirement.Id, requirementNo = requirement.RequirementNo, title = requirement.Title, capabilityId = capability.Id, capabilityTitle = capability.Title, matchScore = result.Score, status = "NEW", needByDate = requirement.NeedByDate, requirement.Quantity, requirement.UomCode, explanation = result.Explanation, classificationCode = requirement.ClassificationCode, mainCategoryCode = requirement.MainCategoryCode };
        if (organizationId.HasValue) q = q.Where(x => _db.SellerCapabilities.Any(c => c.Id == x.capabilityId && c.OrganizationId == organizationId)); return Ok(await q.OrderByDescending(x => x.matchScore).ToListAsync(ct));
    }

    [HttpGet("results/{matchResultId:guid}/explanation")]
    public async Task<IActionResult> Explanation(Guid matchResultId, CancellationToken ct) { Demand("buyer.matches.view", "seller.opportunity.view"); return Ok(await _db.MatchResultComponents.AsNoTracking().Where(x => x.TenantId == TenantId && x.MatchResultId == matchResultId).OrderByDescending(x => x.WeightedScore).ToListAsync(ct)); }

    private static decimal Score(BuyerRequirement requirement, SellerCapability capability)
    {
        decimal score = 0;
        if (!string.IsNullOrWhiteSpace(requirement.ClassificationCode) && requirement.ClassificationCode == capability.ClassificationCode) score += 40;
        if (SameHeading(requirement.ClassificationCode, capability.ClassificationCode)) score += 15;
        if (!string.IsNullOrWhiteSpace(requirement.MainCategoryCode) && requirement.MainCategoryCode == capability.MainCategoryCode) score += 10;
        score += capability.TechnicalJson.Length > 10 ? 10 : 3.5m;
        score += capability.CommercialJson.Length > 10 ? 3 : 1.5m;
        score += LocationScore(requirement.DetailsJson, capability.PlantLocation);
        score += CertificationScore(requirement.DetailsJson, capability.TechnicalJson);
        return Math.Min(100, score);
    }

    private static bool SameHeading(string? left, string? right) => !string.IsNullOrWhiteSpace(left) && !string.IsNullOrWhiteSpace(right) && left.Length >= 4 && right.Length >= 4 && left[..4] == right[..4];

    // Buyer wizard Step 4 (Commercial & Delivery) writes preferredStates / considerOtherStates
    // into BuyerRequirement.DetailsJson via SaveStep() — no schema change needed, this just
    // reads what the wizard already persists. Neutral half-credit when data is missing/unparsable
    // so a requirement that never touched this step doesn't get unfairly zeroed out.
    private static decimal LocationScore(string requirementDetailsJson, string plantLocation)
    {
        try
        {
            var root = JsonDocument.Parse(string.IsNullOrWhiteSpace(requirementDetailsJson) ? "{}" : requirementDetailsJson).RootElement;
            var preferredStates = root.TryGetProperty("preferredStates", out var p) ? p.GetString() ?? "" : "";
            var considerOtherStates = root.TryGetProperty("considerOtherStates", out var c) ? c.GetString() ?? "Yes" : "Yes";
            if (string.IsNullOrWhiteSpace(preferredStates)) return 6m;

            var states = preferredStates.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            var isPreferred = states.Any(s => plantLocation.Contains(s, StringComparison.OrdinalIgnoreCase));
            if (isPreferred) return 12m;
            return considerOtherStates.Equals("Yes", StringComparison.OrdinalIgnoreCase) ? 4m : 0m;
        }
        catch { return 6m; }
    }

    // Buyer wizard Step 3 (Technical Criteria) writes certifications[] into DetailsJson; seller
    // wizard Technical step writes certifications[] into SellerCapability.TechnicalJson. Both
    // already exist — this only reads them. Neutral half-credit if either side hasn't specified.
    private static decimal CertificationScore(string requirementDetailsJson, string capabilityTechnicalJson)
    {
        try
        {
            var reqRoot = JsonDocument.Parse(string.IsNullOrWhiteSpace(requirementDetailsJson) ? "{}" : requirementDetailsJson).RootElement;
            var capRoot = JsonDocument.Parse(string.IsNullOrWhiteSpace(capabilityTechnicalJson) ? "{}" : capabilityTechnicalJson).RootElement;
            if (!reqRoot.TryGetProperty("certifications", out var reqCertsEl) || !capRoot.TryGetProperty("certifications", out var capCertsEl))
                return 5m;

            var reqCerts = reqCertsEl.EnumerateArray().Select(x => x.GetString() ?? "").Where(x => x.Length > 0).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var capCerts = capCertsEl.EnumerateArray().Select(x => x.GetString() ?? "").Where(x => x.Length > 0).ToHashSet(StringComparer.OrdinalIgnoreCase);
            if (reqCerts.Count == 0) return 5m;

            var overlap = reqCerts.Intersect(capCerts, StringComparer.OrdinalIgnoreCase).Count();
            return Math.Min(10m, overlap * (10m / reqCerts.Count));
        }
        catch { return 5m; }
    }

    private void AddComponent(Guid resultId, Guid? eventId, string code, decimal weight, decimal raw, string explanation) { var component = MatchResultComponent.Create(resultId, code, weight, raw, explanation); component.StampCreate(TenantId, eventId, ActorUserId, CorrelationId); _db.MatchResultComponents.Add(component); }
}