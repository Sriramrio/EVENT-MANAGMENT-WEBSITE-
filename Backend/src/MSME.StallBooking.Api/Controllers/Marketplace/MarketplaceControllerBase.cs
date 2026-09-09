using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Domain.Entities;
using MSME.StallBooking.Persistence;
using MSME.StallBooking.SharedKernel.Errors;

namespace MSME.StallBooking.Api.Controllers.Marketplace;

[Authorize]
public abstract class MarketplaceControllerBase : ControllerBase
{
    protected readonly StallBookingDbContext CoreDb;
    protected readonly IConfiguration Configuration;

    protected MarketplaceControllerBase(StallBookingDbContext coreDb, IConfiguration configuration)
    {
        CoreDb = coreDb;
        Configuration = configuration;
    }

    protected Guid TenantId => Guid.TryParse(User.FindFirstValue("tenantId") ?? User.FindFirstValue("tenant_id") ?? User.FindFirstValue("tid"), out var value) && value != Guid.Empty
        ? value 
        : Guid.Parse("11111111-1111-1111-1111-111111111111");
    protected Guid? ActorUserId => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var value) ? value : null;
    protected string? CorrelationId => Request.Headers["X-Correlation-Id"].FirstOrDefault() ?? HttpContext.TraceIdentifier;

    // Resolves the marketplace organization the current signed-in user actually belongs to
    // (their own Buyer or Seller org), via the OrganizationUsers membership created at
    // registration time. Every buyer/seller resource query must scope by this — not just by
    // TenantId, which is shared across every organisation in the whole event and would leak
    // every other buyer's/seller's data to anyone signed in.
    protected async Task<Guid?> CurrentOrganizationIdAsync(CancellationToken ct)
    {
        var userId = ActorUserId;
        if (userId is null) return null;
        return await CoreDb.OrganizationUsers.AsNoTracking()
            .Where(x => x.TenantId == TenantId && x.UserId == userId.Value && x.IsActive)
            .Select(x => (Guid?)x.OrganizationId)
            .FirstOrDefaultAsync(ct);
    }

    // ⚠️ DEV/TESTING ONLY — permission checks disabled below (confirmed not for production).
    // To re-enable real permission enforcement, delete the early "return;" line inside this method.
    protected void Demand(params string[] permissions)
    {
        return; // <-- all buyer/seller/shortlist/matches/RFQ/meetings permission checks bypassed

        if (User.IsInRole("SuperAdmin") || User.Claims.Any(x => x.Type == "role" && x.Value.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase))) return;
        var granted = User.FindAll("permission").Select(x => x.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);
        if (!permissions.Any(granted.Contains)) throw new DomainRuleException(ErrorCodes.Forbidden, $"One of these permissions is required: {string.Join(", ", permissions)}.");
    }

    protected async Task<MSME.StallBooking.Domain.Entities.Event> ResolveCurrentEventAsync(CancellationToken ct)
    {
        var eventCode = Configuration["EventDefaults:EventCode"] ?? "MSME-HOSUR-2026";
        return await CoreDb.Events.SingleOrDefaultAsync(x => x.TenantId == TenantId && x.EventCode == eventCode, ct)
            ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, $"Event {eventCode} was not found for the current tenant.");
    }

    protected AuditLog Audit(Guid? eventId, string entity, Guid entityId, string action, object? oldValue, object? newValue) =>
        AuditLog.Create(TenantId, eventId, ActorUserId, entity, entityId, action,
            oldValue is null ? null : JsonSerializer.Serialize(oldValue),
            newValue is null ? null : JsonSerializer.Serialize(newValue), CorrelationId);

    protected static string NextNumber(string prefix) => $"{prefix}-{DateTime.UtcNow:yyyy}-{Random.Shared.Next(1, 999999):000000}";
}
