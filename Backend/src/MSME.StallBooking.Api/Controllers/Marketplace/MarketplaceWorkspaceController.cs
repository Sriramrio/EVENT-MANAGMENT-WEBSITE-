using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Application.Security;
using MSME.StallBooking.Domain.Entities;
using MSME.StallBooking.Persistence;
using MSME.StallBooking.SharedKernel.Errors;

namespace MSME.StallBooking.Api.Controllers.Marketplace;

[ApiController]
public sealed class MarketplaceWorkspaceController : MarketplaceControllerBase
{
    private readonly StallBookingDbContext _db;
    public MarketplaceWorkspaceController(StallBookingDbContext db, IConfiguration configuration) : base(db, configuration) => _db = db;

    [HttpGet("api/v1/buyer/session")]
    [HttpGet("api/v1/seller/session")]
    public async Task<IActionResult> Session(CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);
        var userId = ActorUserId ?? Guid.Empty;
        var membership = await _db.OrganizationUsers.AsNoTracking().FirstOrDefaultAsync(x => x.TenantId == TenantId && x.UserId == userId && x.IsActive, ct);
        var organization = membership is null ? null : await _db.Organizations.AsNoTracking().FirstOrDefaultAsync(x => x.Id == membership.OrganizationId, ct);
        if (organization is null)
        {
            organization = await _db.Organizations.AsNoTracking().FirstOrDefaultAsync(x => (TenantId == Guid.Empty || x.TenantId == TenantId || x.TenantId == evt.TenantId) && (x.OrganizationType == "SELLER" || x.OrganizationType == "BOTH"), ct)
                ?? await _db.Organizations.AsNoTracking().FirstOrDefaultAsync(x => TenantId == Guid.Empty || x.TenantId == TenantId || x.TenantId == evt.TenantId, ct);
        }
        return Ok(new { userId, buyerOrganisationId = organization?.Id, sellerOrganisationId = organization?.Id, displayName = User.Identity?.Name ?? "Marketplace User", role = membership?.Role.ToString() ?? User.FindFirst("role")?.Value ?? "VIEWER", organisationName = organization?.LegalName ?? "Marketplace Participant", eventId = evt.Id, eventName = evt.EventName, permissions = User.FindAll("permission").Select(x => x.Value).Distinct().ToArray(), unreadNotifications = 0 });
    }

    [HttpGet("api/v1/buyer/organisation")]
    [HttpGet("api/v1/seller/organisation")]
    public async Task<IActionResult> Organisation(CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);
        var userId = ActorUserId ?? Guid.Empty;
        var membership = await _db.OrganizationUsers.AsNoTracking().FirstOrDefaultAsync(x => x.TenantId == TenantId && x.UserId == userId && x.IsActive, ct);
        var org = membership is null
            ? await _db.Organizations.AsNoTracking().FirstOrDefaultAsync(x => (TenantId == Guid.Empty || x.TenantId == TenantId || x.TenantId == evt.TenantId) && (x.OrganizationType == "SELLER" || x.OrganizationType == "BOTH"), ct)
                ?? await _db.Organizations.AsNoTracking().FirstOrDefaultAsync(x => TenantId == Guid.Empty || x.TenantId == TenantId || x.TenantId == evt.TenantId, ct)
            : await _db.Organizations.AsNoTracking().FirstOrDefaultAsync(x => x.Id == membership.OrganizationId, ct);

        if (org is null) return NotFound();
        return Ok(org);
    }

    [HttpGet("api/v1/buyer/contacts/primary")]
    [HttpGet("api/v1/seller/contacts/primary")]
    public async Task<IActionResult> Contact(CancellationToken ct)
    {
        var userId = ActorUserId ?? Guid.Empty; var membership = await _db.OrganizationUsers.AsNoTracking().FirstOrDefaultAsync(x => x.TenantId == TenantId && x.UserId == userId && x.IsActive, ct); if (membership is null) return NotFound(); return Ok(await _db.OrganizationContacts.AsNoTracking().FirstOrDefaultAsync(x => x.OrganizationId == membership.OrganizationId && x.IsPrimary, ct));
    }

    // Buyer/Seller onboarding screens 3 & 4 ("Save & Continue") previously had nowhere to land:
    // the frontend called a generic requirements-shaped save path and no PATCH route existed
    // here at all, so organisation/contact edits silently failed. These close that gap for the
    // signed-in user's own organisation, resolved the same way as the GET actions above.
    [HttpPatch("api/v1/buyer/organisation")]
    [HttpPatch("api/v1/seller/organisation")]
    public async Task<IActionResult> UpdateOrganisation(UpdateOrganisationRequest request, CancellationToken ct)
    {
        var userId = ActorUserId ?? Guid.Empty;
        var membership = await _db.OrganizationUsers.AsNoTracking().FirstOrDefaultAsync(x => x.TenantId == TenantId && x.UserId == userId && x.IsActive, ct);
        if (membership is null) return NotFound();
        var org = await _db.Organizations.SingleAsync(x => x.Id == membership.OrganizationId, ct);
        if (request.Version.HasValue && request.Version.Value != org.Version)
            throw new DomainRuleException(ErrorCodes.ConcurrencyConflict, "This organisation profile was updated elsewhere. Reload and try again.");
        org.Update(request.LegalName, request.TradeName, request.Email, request.Phone, request.Address, request.City, request.State, request.Pincode, request.Gstin, request.Pan, request.UdyamNumber, request.BusinessType, request.Industry, request.CompanyWebsite, request.YearOfEstablishment, request.TotalEmployees, request.AnnualTurnover, ActorUserId, CorrelationId);
        CoreDb.AuditLogs.Add(Audit(org.EventId, "MarketplaceOrganization", org.Id, "UPDATE", null, request));
        await _db.SaveChangesAsync(ct); await CoreDb.SaveChangesAsync(ct);
        return Ok(org);
    }


    [HttpGet("api/v1/buyer/contacts")]
    [HttpGet("api/v1/seller/contacts")]
    public async Task<IActionResult> ListContacts(CancellationToken ct)
    {
        var userId = ActorUserId ?? Guid.Empty;
        var membership = await _db.OrganizationUsers.AsNoTracking().FirstOrDefaultAsync(x => x.TenantId == TenantId && x.UserId == userId && x.IsActive, ct);
        if (membership is null) return NotFound();
        return Ok(await _db.OrganizationContacts.AsNoTracking().Where(x => x.OrganizationId == membership.OrganizationId).OrderByDescending(x => x.IsPrimary).ThenBy(x => x.Name).ToListAsync(ct));
    }
    [HttpPost("api/v1/buyer/contacts")]
    [HttpPost("api/v1/seller/contacts")]
    public async Task<IActionResult> CreateContact([FromBody] CreateContactRequest request, CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);
        var userId = ActorUserId ?? Guid.Empty;
        var membership = await _db.OrganizationUsers.AsNoTracking().FirstOrDefaultAsync(x => x.TenantId == TenantId && x.UserId == userId && x.IsActive, ct);
        if (membership is null) return NotFound();
        var contact = MSME.StallBooking.Domain.Marketplace.OrganizationContact.Create(
            membership.OrganizationId,
            request.FullName,
            request.Email,
            request.Mobile,
            request.Designation,
            false
        );
        contact.StampCreate(TenantId, evt.Id, ActorUserId, CorrelationId);
        _db.OrganizationContacts.Add(contact);
        await _db.SaveChangesAsync(ct);

        return Ok(contact);
    }
    [HttpDelete("api/v1/buyer/contacts/{id:guid}")]
    [HttpDelete("api/v1/seller/contacts/{id:guid}")]
    public async Task<IActionResult> DeleteContact(Guid id, CancellationToken ct)
    {
        var userId = ActorUserId ?? Guid.Empty;
        var membership = await _db.OrganizationUsers.AsNoTracking().FirstOrDefaultAsync(x => x.TenantId == TenantId && x.UserId == userId && x.IsActive, ct);
        if (membership is null) return NotFound();
        var contact = await _db.OrganizationContacts.FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == membership.OrganizationId, ct);
        if (contact is null) return NotFound();
        _db.OrganizationContacts.Remove(contact);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }



    [HttpPatch("api/v1/buyer/contacts/primary")]
    [HttpPatch("api/v1/seller/contacts/primary")]
    public async Task<IActionResult> UpdateContact(UpdateContactRequest request, CancellationToken ct)
    {
        var userId = ActorUserId ?? Guid.Empty;
        var membership = await _db.OrganizationUsers.AsNoTracking().FirstOrDefaultAsync(x => x.TenantId == TenantId && x.UserId == userId && x.IsActive, ct);
        if (membership is null) return NotFound();
        var contact = await _db.OrganizationContacts.SingleOrDefaultAsync(x => x.OrganizationId == membership.OrganizationId && x.IsPrimary, ct);
        if (contact is null) return NotFound();
        if (request.Version.HasValue && request.Version.Value != contact.Version)
            throw new DomainRuleException(ErrorCodes.ConcurrencyConflict, "This contact was updated elsewhere. Reload and try again.");
        contact.Update(request.FullName, request.Email, request.Mobile, request.Designation, ActorUserId, CorrelationId);
        CoreDb.AuditLogs.Add(Audit(null, "OrganizationContact", contact.Id, "UPDATE", null, request));
        await _db.SaveChangesAsync(ct); await CoreDb.SaveChangesAsync(ct);
        return Ok(contact);
    }

    // Backs the Settings screen "Change Password" action. Password rows live in CoreDb.Users
    // (same physical database as the marketplace tables — CoreDb is just this context's alias
    // for the non-marketplace side), not on OrganizationUsers.
    [HttpPost("api/v1/account/change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken ct)
    {
        var userId = ActorUserId ?? throw new DomainRuleException(ErrorCodes.Forbidden, "Sign in required.");
        var user = await CoreDb.Users.SingleOrDefaultAsync(x => x.Id == userId, ct)
            ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Account was not found.");
        // Mirrors PortalController.VerifyPassword's legacy-seed fallback so dev/seeded accounts
        // (stored hash "DEV_ONLY_CHANGE_ME_12345") can also change their password, not just
        // accounts created via self-registration (which are always real PBKDF2 hashes).
        var currentPasswordValid = user.PasswordHash == "DEV_ONLY_CHANGE_ME_12345"
            ? request.CurrentPassword == "ChangeMe@12345"
            : PasswordHasher.Verify(request.CurrentPassword, user.PasswordHash);
        if (!currentPasswordValid)
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Current password is incorrect.");
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 8)
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "New password must be at least 8 characters.");
        user.SetPasswordHash(PasswordHasher.Hash(request.NewPassword));
        user.StampUpdate(ActorUserId, CorrelationId);
        CoreDb.AuditLogs.Add(Audit(null, "User", user.Id, "CHANGE_PASSWORD", null, new { }));
        await CoreDb.SaveChangesAsync(ct);
        return Ok(new { message = "Password updated." });
    }
}

public sealed record UpdateOrganisationRequest(string LegalName, string? TradeName, string Email, string Phone, string Address, string City, string State, string Pincode, string? Gstin, string? Pan, string? UdyamNumber, string? BusinessType, string? Industry, string? CompanyWebsite, int? YearOfEstablishment, int? TotalEmployees, decimal? AnnualTurnover, long? Version);
public sealed record UpdateContactRequest(string FullName, string Email, string Mobile, string? Designation, long? Version);
public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public sealed record CreateContactRequest(string FullName, string Designation, string Department, string Email, string Mobile, string AlternateMobile, string DecisionRole);
public sealed record UpdateBuyerOrganisationRequest(string LegalName, string? Gstin, string? Pan, string RegisteredAddress, string City, string State, string PostalCode);
