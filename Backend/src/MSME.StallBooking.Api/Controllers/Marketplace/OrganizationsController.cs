using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Application.Security;
using MSME.StallBooking.Application.Abstractions;
using MSME.StallBooking.Domain.Entities;
using MSME.StallBooking.Domain.Marketplace;
using MSME.StallBooking.Persistence;
using MSME.StallBooking.SharedKernel.Errors;
using DomainUser = MSME.StallBooking.Domain.Entities.User;

namespace MSME.StallBooking.Api.Controllers.Marketplace;

[ApiController]
[Route("api/v1/marketplace/organizations")]
public sealed class OrganizationsController : MarketplaceControllerBase
{
    private readonly StallBookingDbContext _db;
    private readonly IEmailSender _emailSender;
    private readonly IEmailComposer _emailComposer;

    public OrganizationsController(
        StallBookingDbContext db,
        IConfiguration configuration,
        IEmailSender emailSender,
        IEmailComposer emailComposer) : base(db, configuration)
    {
        _db = db;
        _emailSender = emailSender;
        _emailComposer = emailComposer;
    }
    /// <summary>
    /// Public, unauthenticated Buyer/Seller self-registration. No permission/login is required to
    /// fill this form. On success it creates the organisation, a login-capable User, and emails the
    /// person their login credentials so they can sign in afterwards to reach their dashboard.
    /// </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register(PublicMarketplaceRegistrationRequest request, CancellationToken ct)
    {
        try
        {
            // 1. Basic validation
            var orgType = (request.OrganizationType ?? "").Trim().ToUpperInvariant();
            if (orgType != "BUYER" && orgType != "SELLER")
                throw new DomainRuleException(ErrorCodes.ValidationFailed, "OrganizationType must be BUYER or SELLER.");

            var contactEmail = (request.ContactEmail ?? "").Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(contactEmail) || string.IsNullOrWhiteSpace(request.ContactName))
                throw new DomainRuleException(ErrorCodes.ValidationFailed, "Contact name and email are required so we can send your login credentials.");

            if (string.IsNullOrWhiteSpace(request.LegalName))
                throw new DomainRuleException(ErrorCodes.ValidationFailed, "Legal name of the organisation is required.");

            // 2. Fetch event & tenant details
            var eventCode = Configuration["EventDefaults:EventCode"] ?? "MSME-HOSUR-2026";
            var evt = await CoreDb.Events.SingleOrDefaultAsync(x => x.EventCode == eventCode, ct)
                ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, $"Event {eventCode} was not found.");
            var tenantId = evt.TenantId;

            // 3. Check for existing active user
            var orgEmail = (request.OrgEmail ?? "").Trim().ToLowerInvariant();
            if (await CoreDb.Users.AnyAsync(x => x.TenantId == tenantId && (x.Email == contactEmail || (!string.IsNullOrEmpty(orgEmail) && x.Email == orgEmail)) && !x.IsDeleted, ct))
            {
                return Conflict(new
                {
                    errorCode = ErrorCodes.EmailAlreadyExists,
                    message = "Email already exists.",
                    title = "Email already exists.",
                    detail = "Email already exists. An account already exists for this email. Please log in instead."
                });
            }

            // 4. Begin transaction on the primary DbContext
            await using var tx = await _db.Database.BeginTransactionAsync(ct);

            // 5. Create Organization
            var organization = MarketplaceOrganization.Create(
                orgType,
                request.LegalName,
                string.IsNullOrWhiteSpace(request.OrgEmail) ? contactEmail : request.OrgEmail,
                request.OrgPhone ?? request.ContactPhone ?? "",
                request.Address,
                request.City,
                request.State,
                request.Pincode,
                null,
                null,
                request.Gstin,
                request.UdyamNumber
            );
            organization.StampCreate(tenantId, evt.Id, null, CorrelationId);
            _db.Organizations.Add(organization);

            // 6. Create User in CoreDb
            var tempPassword = PasswordHasher.GenerateTemporaryPassword();
            var user = DomainUser.Create(request.ContactName, contactEmail, request.ContactPhone, PasswordHasher.Hash(tempPassword));
            user.StampCreate(tenantId, evt.Id, null, CorrelationId);
            CoreDb.Users.Add(user);

            // Save changes across both contexts to generate IDs
            await _db.SaveChangesAsync(ct);
            await CoreDb.SaveChangesAsync(ct);

            // 7. Create Organization Contact
            var contact = OrganizationContact.Create(
                organization.Id,
                request.ContactName,
                contactEmail,
                request.ContactPhone ?? "",
                request.ContactDesignation,
                true
            );
            contact.StampCreate(tenantId, evt.Id, null, CorrelationId);
            _db.OrganizationContacts.Add(contact);

            // 8. Resolve or create MarketplaceUser Role
            var role = await CoreDb.Roles.FirstOrDefaultAsync(x => x.TenantId == tenantId && x.RoleCode == "MarketplaceUser", ct);
            if (role is null)
            {
                role = Role.Create("MarketplaceUser", "Marketplace User", "Self-registered Buyer/Seller account. Access is governed by the organisation membership role, not this base role.");
                role.StampCreate(tenantId, evt.Id, null, CorrelationId);
                CoreDb.Roles.Add(role);
                await CoreDb.SaveChangesAsync(ct);
            }

            // 9. Assign Role & Organization Membership
            var userRole = UserRole.Create(user.Id, role.Id);
            userRole.StampCreate(tenantId, evt.Id, null, CorrelationId);
            CoreDb.UserRoles.Add(userRole);

            var member = OrganizationUser.Create(organization.Id, user.Id, MarketplaceMembershipRole.OWNER);
            member.StampCreate(tenantId, evt.Id, user.Id, CorrelationId);
            _db.OrganizationUsers.Add(member);

            // 10. Audit Log
            CoreDb.AuditLogs.Add(AuditLog.Create(
                tenantId,
                evt.Id,
                null,
                "MarketplaceOrganization",
                organization.Id,
                "PUBLIC_REGISTER",
                null,
                System.Text.Json.JsonSerializer.Serialize(new { organization.Id, orgType, contactEmail }),
                CorrelationId
            ));

            // Final commit to both contexts
            await _db.SaveChangesAsync(ct);
            await CoreDb.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            // 11. Dispatch Email Notification
            var welcomeEmail = _emailComposer.ComposeMarketplaceUserWelcome(
       contactPerson: request.ContactName,
       orgName: request.LegalName,
       contactEmail: contactEmail,
       tempPassword: tempPassword,
       loginUrl: "https://msmesangamam.lubtn.com/role-selection",
       tenantId: tenantId,
       eventId: evt.Id);

            await _db.EmailLogs.AddAsync(welcomeEmail, ct);
            await _db.SaveChangesAsync(ct);

            var subject = welcomeEmail.Subject;
            var body = welcomeEmail.BodySnapshot;
            // Track email delivery state explicitly
            string? emailError = null;

            if (_emailSender is null)
            {
                emailError = "Email sender service is null (_emailSender was not injected).";
                welcomeEmail.MarkFailed(emailError);
                await _db.SaveChangesAsync(ct);
            }
            else
            {
                // This endpoint is public/unauthenticated - unlike the admin-triggered
                // invoice/receipt/stall-block emails elsewhere in the app, anyone can hit
                // it at any time, including two people registering close together or a
                // double-clicked submit. That occasionally lands a transient SMTP/socket
                // hiccup against Gmail even when the credentials are fine. Retry a couple
                // of times here, scoped to just this registration email, before reporting
                // it as failed - IEmailSender itself (used by invoice/receipt/stall-block)
                // is left untouched.
                const int maxEmailAttempts = 3;
                for (var attempt = 1; attempt <= maxEmailAttempts; attempt++)
                {
                    try
                    {
                        await _emailSender.SendEmailAsync(contactEmail, subject, body);
                        emailError = null;
                        welcomeEmail.MarkSent(null);
                        await _db.SaveChangesAsync(ct);
                        break;
                    }
                    catch (Exception ex)
                    {
                        emailError = ex.InnerException?.Message ?? ex.Message;

                        // Config problems (bad/placeholder password, missing FromEmail) will
                        // never succeed on retry - fail fast instead of waiting pointlessly.
                        var isConfigError = ex is InvalidOperationException
                            || ex is MailKit.Security.AuthenticationException;

                        if (isConfigError || attempt == maxEmailAttempts)
                        {
                            welcomeEmail.MarkFailed(emailError);
                            await _db.SaveChangesAsync(ct);
                            break;
                        }


                        await Task.Delay(500 * attempt, ct);
                    }
                }
            }

            // Only surface the password in the API response as a fallback when email genuinely
            // failed to send - once email delivery succeeds, the password should live in the
            // inbox only, not in API responses/logs/browser devtools.
            return Ok(new
            {
                organizationId = organization.Id,
                loginEmail = contactEmail,
                temporaryPassword = emailError is null ? null : tempPassword,
                emailSent = emailError is null,
                emailError = emailError,
                message = emailError is null
                    ? $"Registration successful. Login credentials have been sent to {contactEmail}."
                    : $"Registration successful, but email failed: {emailError}. Please note down the temporary password below and share it securely, or fix email settings and ask the user to reset their password."
            });
        }
        catch (DomainRuleException)
        {
            throw;
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                error = "An error occurred while processing your registration.",
                detail = ex.InnerException?.Message ?? ex.Message
            });
        }
    }

    [HttpGet("mine")]
    public async Task<IActionResult> Mine(CancellationToken ct)
    {
        Demand("buyer.organisation.view", "seller.organisation.view", "buyer.organisation.update", "seller.organisation.update");
        var userId = ActorUserId ?? Guid.Empty;
        var ids = _db.OrganizationUsers.Where(x => x.TenantId == TenantId && x.UserId == userId && x.IsActive).Select(x => x.OrganizationId);
        return Ok(await _db.Organizations.AsNoTracking().Where(x => x.TenantId == TenantId && ids.Contains(x.Id)).ToListAsync(ct));
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        Demand("admin.users.manage"); // Super Admin check
        return Ok(await _db.Organizations.AsNoTracking().Where(x => x.TenantId == TenantId).ToListAsync(ct));
    }

    [HttpGet("prefill")]
    public async Task<IActionResult> Prefill([FromQuery] Guid? sourceExhibitorId, [FromQuery] Guid? sourceVisitorId, CancellationToken ct)
    {
        Demand("buyer.organisation.update", "seller.organisation.update");
        if (sourceExhibitorId.HasValue)
        {
            var x = await CoreDb.Exhibitors.AsNoTracking().SingleOrDefaultAsync(e => e.Id == sourceExhibitorId && e.TenantId == TenantId, ct)
                ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Source exhibitor was not found for the current tenant.");
            return Ok(new { legalName = x.LegalName, tradeName = x.TradeName, email = x.Email, phone = x.Mobile, address = x.RegisteredAddress, x.City, x.State, x.Pincode, x.Gstin, x.Pan, x.UdyamNumber, sourceExhibitorId = x.Id });
        }
        if (sourceVisitorId.HasValue)
        {
            var x = await CoreDb.Visitors.AsNoTracking().SingleOrDefaultAsync(v => v.Id == sourceVisitorId && v.TenantId == TenantId, ct)
                ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Source visitor was not found for the current tenant.");
            return Ok(new { legalName = x.LegalName, tradeName = x.TradeName, email = x.Email, phone = x.Mobile, address = x.RegisteredAddress, x.City, x.State, x.Pincode, sourceVisitorId = x.Id });
        }
        throw new DomainRuleException(ErrorCodes.ValidationFailed, "sourceExhibitorId or sourceVisitorId is required.");
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateOrganizationRequest request, CancellationToken ct)
    {
        Demand(request.OrganizationType.Equals("SELLER", StringComparison.OrdinalIgnoreCase) ? "seller.organisation.update" : "buyer.organisation.update");
        await ResolveSourceAsync(request.SourceExhibitorId, request.SourceVisitorId, ct);
        var evt = await ResolveCurrentEventAsync(ct);
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        var organization = MarketplaceOrganization.Create(request.OrganizationType, request.LegalName, request.Email, request.Phone, request.Address, request.City, request.State, request.Pincode, request.SourceExhibitorId, request.SourceVisitorId);
        organization.StampCreate(TenantId, evt.Id, ActorUserId, CorrelationId);
        _db.Organizations.Add(organization);
        if (ActorUserId.HasValue)
        {
            var member = OrganizationUser.Create(organization.Id, ActorUserId.Value, MarketplaceMembershipRole.OWNER);
            member.StampCreate(TenantId, evt.Id, ActorUserId, CorrelationId);
            _db.OrganizationUsers.Add(member);
        }
        CoreDb.AuditLogs.Add(Audit(evt.Id, "MarketplaceOrganization", organization.Id, "CREATE", null, request));
        await _db.SaveChangesAsync(ct); await CoreDb.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = organization.Id }, organization);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct) => Ok(await _db.Organizations.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id && x.TenantId == TenantId, ct) ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Organization was not found."));

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateOrganizationRequest request, CancellationToken ct)
    {
        Demand("buyer.organisation.update", "seller.organisation.update");
        var row = await _db.Organizations.SingleOrDefaultAsync(x => x.Id == id && x.TenantId == TenantId, ct) ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Organization was not found.");
        row.Update(request.LegalName, request.TradeName, request.Email, request.Phone, request.Address, request.City, request.State, request.Pincode, request.Gstin, request.Pan, request.UdyamNumber, request.BusinessType, request.Industry, request.CompanyWebsite, request.YearOfEstablishment, request.TotalEmployees, request.AnnualTurnover, ActorUserId, CorrelationId);
        CoreDb.AuditLogs.Add(Audit(row.EventId, "MarketplaceOrganization", row.Id, "UPDATE", null, request));
        await _db.SaveChangesAsync(ct); await CoreDb.SaveChangesAsync(ct); return Ok(row);
    }

    [HttpGet("admin/buyers")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAdminBuyers(CancellationToken ct)
    {
        var orgs = await _db.Organizations.AsNoTracking()
            .Where(x => (x.OrganizationType == "BUYER" || x.OrganizationType == "BOTH") && !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);

        var orgIds = orgs.Select(x => x.Id).ToList();
        var contacts = await _db.OrganizationContacts.AsNoTracking()
            .Where(x => orgIds.Contains(x.OrganizationId) && !x.IsDeleted)
            .ToListAsync(ct);

        var orgUsers = await _db.OrganizationUsers.AsNoTracking()
            .Where(x => orgIds.Contains(x.OrganizationId) && x.IsActive)
            .ToListAsync(ct);

        var userIds = orgUsers.Select(x => x.UserId).Distinct().ToList();
        var users = await CoreDb.Users.AsNoTracking()
            .Where(x => userIds.Contains(x.Id) && !x.IsDeleted)
            .ToListAsync(ct);

        var allBuyerEmails = contacts.Select(c => c.Email.Trim().ToLower())
            .Concat(users.Select(u => u.Email.Trim().ToLower()))
            .Concat(orgs.Select(o => o.Email.Trim().ToLower()))
            .Where(e => !string.IsNullOrEmpty(e))
            .Distinct()
            .ToList();

        var buyerWelcomeLogs = await _db.EmailLogs.AsNoTracking()
            .Where(x => x.TemplateCode == "MARKETPLACE_USER_WELCOME" && allBuyerEmails.Contains(x.ToEmail.ToLower()))
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);

        var result = orgs.Select(o =>
        {
            var primaryContact = contacts.FirstOrDefault(c => c.OrganizationId == o.Id && c.IsPrimary)
                                 ?? contacts.FirstOrDefault(c => c.OrganizationId == o.Id);
            var oUser = orgUsers.FirstOrDefault(ou => ou.OrganizationId == o.Id);
            var u = oUser != null ? users.FirstOrDefault(x => x.Id == oUser.UserId) : null;
            var targetEmail = (primaryContact?.Email ?? u?.Email ?? o.Email).Trim().ToLower();

            var log = buyerWelcomeLogs.FirstOrDefault(l => l.ToEmail.Equals(targetEmail, StringComparison.OrdinalIgnoreCase));
            var passHint = ExtractTemporaryPasswordFromEmailLog(log?.BodySnapshot);

            return new
            {
                id = o.Id,
                legalName = o.LegalName,
                tradeName = o.TradeName,
                gstin = o.Gstin,
                city = o.City,
                state = o.State,
                status = o.Status,
                createdAt = o.CreatedAt,
                contactName = primaryContact?.Name ?? u?.FullName ?? "N/A",
                contactEmail = primaryContact?.Email ?? u?.Email ?? o.Email,
                contactPhone = primaryContact?.Phone ?? u?.Mobile ?? o.Phone,
                contactDesignation = primaryContact?.Designation,
                passwordHint = passHint ?? "Available on Send",
                userId = u?.Id
            };
        });

        return Ok(result);
    }

    [HttpGet("admin/sellers")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAdminSellers(CancellationToken ct)
    {
        var orgs = await _db.Organizations.AsNoTracking()
            .Where(x => (x.OrganizationType == "SELLER" || x.OrganizationType == "BOTH") && !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);

        var orgIds = orgs.Select(x => x.Id).ToList();
        var contacts = await _db.OrganizationContacts.AsNoTracking()
            .Where(x => orgIds.Contains(x.OrganizationId) && !x.IsDeleted)
            .ToListAsync(ct);

        var orgUsers = await _db.OrganizationUsers.AsNoTracking()
            .Where(x => orgIds.Contains(x.OrganizationId) && x.IsActive)
            .ToListAsync(ct);

        var userIds = orgUsers.Select(x => x.UserId).Distinct().ToList();
        var users = await CoreDb.Users.AsNoTracking()
            .Where(x => userIds.Contains(x.Id) && !x.IsDeleted)
            .ToListAsync(ct);

        var allSellerEmails = contacts.Select(c => c.Email.Trim().ToLower())
            .Concat(users.Select(u => u.Email.Trim().ToLower()))
            .Concat(orgs.Select(o => o.Email.Trim().ToLower()))
            .Where(e => !string.IsNullOrEmpty(e))
            .Distinct()
            .ToList();

        var sellerWelcomeLogs = await _db.EmailLogs.AsNoTracking()
            .Where(x => x.TemplateCode == "MARKETPLACE_USER_WELCOME" && allSellerEmails.Contains(x.ToEmail.ToLower()))
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);

        var result = orgs.Select(o =>
        {
            var primaryContact = contacts.FirstOrDefault(c => c.OrganizationId == o.Id && c.IsPrimary)
                                 ?? contacts.FirstOrDefault(c => c.OrganizationId == o.Id);
            var oUser = orgUsers.FirstOrDefault(ou => ou.OrganizationId == o.Id);
            var u = oUser != null ? users.FirstOrDefault(x => x.Id == oUser.UserId) : null;
            var targetEmail = (primaryContact?.Email ?? u?.Email ?? o.Email).Trim().ToLower();

            var log = sellerWelcomeLogs.FirstOrDefault(l => l.ToEmail.Equals(targetEmail, StringComparison.OrdinalIgnoreCase));
            var passHint = ExtractTemporaryPasswordFromEmailLog(log?.BodySnapshot);

            return new
            {
                id = o.Id,
                legalName = o.LegalName,
                tradeName = o.TradeName,
                gstin = o.Gstin,
                udyamNumber = o.UdyamNumber,
                city = o.City,
                state = o.State,
                status = o.Status,
                createdAt = o.CreatedAt,
                contactName = primaryContact?.Name ?? u?.FullName ?? "N/A",
                contactEmail = primaryContact?.Email ?? u?.Email ?? o.Email,
                contactPhone = primaryContact?.Phone ?? u?.Mobile ?? o.Phone,
                contactDesignation = primaryContact?.Designation,
                passwordHint = passHint ?? "Available on Send",
                userId = u?.Id
            };
        });

        return Ok(result);
    }

    [HttpPost("admin/{id:guid}/send-credentials")]
    [AllowAnonymous]
    public async Task<IActionResult> SendCredentials(Guid id, CancellationToken ct)
    {
        var org = await _db.Organizations.SingleOrDefaultAsync(x => x.Id == id && !x.IsDeleted, ct)
            ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Organization was not found.");

        var contact = await _db.OrganizationContacts.FirstOrDefaultAsync(x => x.OrganizationId == id && x.IsPrimary && !x.IsDeleted, ct)
            ?? await _db.OrganizationContacts.FirstOrDefaultAsync(x => x.OrganizationId == id && !x.IsDeleted, ct);

        var member = await _db.OrganizationUsers.FirstOrDefaultAsync(x => x.OrganizationId == id && x.IsActive, ct);
        DomainUser? user = null;
        if (member != null)
        {
            user = await CoreDb.Users.FirstOrDefaultAsync(x => x.Id == member.UserId && !x.IsDeleted, ct);
        }

        var contactEmail = contact?.Email ?? user?.Email ?? org.Email;
        var contactName = contact?.Name ?? user?.FullName ?? org.LegalName;

        var passToSend = PasswordHasher.GenerateTemporaryPassword();
        if (user != null)
        {
            user.SetPasswordHash(PasswordHasher.Hash(passToSend));
            await CoreDb.SaveChangesAsync(ct);
        }

        var evt = await ResolveCurrentEventAsync(ct);
        var welcomeEmail = _emailComposer.ComposeMarketplaceUserWelcome(
            contactPerson: contactName,
            orgName: org.LegalName,
            contactEmail: contactEmail,
            tempPassword: passToSend,
            loginUrl: "https://msmesangamam.lubtn.com/role-selection",
            tenantId: TenantId,
            eventId: evt.Id);

        await _db.EmailLogs.AddAsync(welcomeEmail, ct);
        await _db.SaveChangesAsync(ct);

        if (_emailSender != null)
        {
            try
            {
                await _emailSender.SendEmailAsync(contactEmail, welcomeEmail.Subject, welcomeEmail.BodySnapshot);
                welcomeEmail.MarkSent(null);
                await _db.SaveChangesAsync(ct);
            }
            catch (Exception ex)
            {
                welcomeEmail.MarkFailed(ex.Message);
                await _db.SaveChangesAsync(ct);
            }
        }

        return Ok(new { 
            message = $"Credentials email sent to {contactEmail} successfully.",
            temporaryPassword = passToSend
        });
    }

    [HttpPost("admin/{id:guid}/toggle-status")]
    [AllowAnonymous]
    public async Task<IActionResult> ToggleStatus(Guid id, CancellationToken ct)
    {
        var org = await _db.Organizations.SingleOrDefaultAsync(x => x.Id == id && !x.IsDeleted, ct)
            ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Organization was not found.");

        var newStatus = org.Status == "ACTIVE" ? "INACTIVE" : "ACTIVE";
        org.SetStatus(newStatus, ActorUserId, CorrelationId);
        await _db.SaveChangesAsync(ct);

        return Ok(new { id = org.Id, status = org.Status });
    }

    [HttpGet("admin/buyer-requirements")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAdminBuyerRequirements(CancellationToken ct)
    {
        var requirements = await _db.BuyerRequirements.AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);

        var orgIds = requirements.Select(x => x.OrganizationId).Distinct().ToList();
        var orgs = await _db.Organizations.AsNoTracking()
            .Where(x => orgIds.Contains(x.Id))
            .ToListAsync(ct);

        var contacts = await _db.OrganizationContacts.AsNoTracking()
            .Where(x => orgIds.Contains(x.OrganizationId) && !x.IsDeleted)
            .ToListAsync(ct);

        var reqIds = requirements.Select(x => x.Id).ToList();
        var matchStats = await _db.MatchResults.AsNoTracking()
            .Where(m => reqIds.Contains(m.RequirementId))
            .GroupBy(m => m.RequirementId)
            .Select(g => new { RequirementId = g.Key, Count = g.Count(), AverageScore = g.Average(x => x.Score) })
            .ToListAsync(ct);

        var result = requirements.Select(r =>
        {
            var org = orgs.FirstOrDefault(o => o.Id == r.OrganizationId);
            var primaryContact = contacts.FirstOrDefault(c => c.OrganizationId == r.OrganizationId && c.IsPrimary)
                                 ?? contacts.FirstOrDefault(c => c.OrganizationId == r.OrganizationId);
            var stat = matchStats.FirstOrDefault(s => s.RequirementId == r.Id);

            return new
            {
                id = r.Id,
                requirementNo = r.RequirementNo,
                title = r.Title,
                description = r.Description,
                sourcingType = r.SourcingType,
                segmentCode = r.SegmentCode,
                mainCategoryCode = r.MainCategoryCode,
                classificationCode = r.ClassificationCode,
                quantity = r.Quantity,
                uomCode = r.UomCode,
                requirementDate = r.RequirementDate,
                needByDate = r.NeedByDate,
                budgetMin = r.BudgetMin,
                budgetMax = r.BudgetMax,
                currency = r.Currency,
                status = r.Status,
                createdAt = r.CreatedAt,
                updatedAt = r.UpdatedAt,
                detailsJson = r.DetailsJson,
                organizationId = r.OrganizationId,
                organizationName = org?.LegalName ?? org?.TradeName ?? "N/A",
                organizationCity = org?.City ?? "",
                organizationState = org?.State ?? "",
                organizationGstin = org?.Gstin ?? "",
                contactPerson = primaryContact?.Name ?? "N/A",
                contactEmail = primaryContact?.Email ?? org?.Email ?? "",
                contactPhone = primaryContact?.Phone ?? org?.Phone ?? "",
                matchCount = stat?.Count ?? 0,
                averageMatchScore = stat != null ? Math.Round(stat.AverageScore, 0) : 0
            };
        });

        return Ok(result);
    }

    [HttpGet("admin/seller-requirements")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAdminSellerRequirements(CancellationToken ct)
    {
        var capabilities = await _db.SellerCapabilities.AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);

        var orgIds = capabilities.Select(x => x.OrganizationId).Distinct().ToList();
        var orgs = await _db.Organizations.AsNoTracking()
            .Where(x => orgIds.Contains(x.Id))
            .ToListAsync(ct);

        var contacts = await _db.OrganizationContacts.AsNoTracking()
            .Where(x => orgIds.Contains(x.OrganizationId) && !x.IsDeleted)
            .ToListAsync(ct);

        var result = capabilities.Select(c =>
        {
            var org = orgs.FirstOrDefault(o => o.Id == c.OrganizationId);
            var primaryContact = contacts.FirstOrDefault(x => x.OrganizationId == c.OrganizationId && x.IsPrimary)
                                 ?? contacts.FirstOrDefault(x => x.OrganizationId == c.OrganizationId);

            return new
            {
                id = c.Id,
                capabilityNo = c.CapabilityNo,
                title = c.Title,
                description = c.Description,
                businessType = c.BusinessType,
                capabilityType = c.CapabilityType,
                plantLocation = c.PlantLocation,
                contactPerson = !string.IsNullOrWhiteSpace(c.ContactPerson) ? c.ContactPerson : (primaryContact?.Name ?? "N/A"),
                contactEmail = !string.IsNullOrWhiteSpace(c.ContactEmail) ? c.ContactEmail : (primaryContact?.Email ?? org?.Email ?? ""),
                mobileCode = c.MobileCode,
                mobileNumber = !string.IsNullOrWhiteSpace(c.MobileNumber) ? c.MobileNumber : (primaryContact?.Phone ?? org?.Phone ?? ""),
                designation = c.Designation,
                segmentCode = c.SegmentCode,
                mainCategoryCode = c.MainCategoryCode,
                classificationCode = c.ClassificationCode,
                uomCode = c.UomCode,
                status = c.Status,
                technicalJson = c.TechnicalJson,
                commercialJson = c.CommercialJson,
                createdAt = c.CreatedAt,
                updatedAt = c.UpdatedAt,
                organizationId = c.OrganizationId,
                organizationName = org?.LegalName ?? org?.TradeName ?? "N/A",
                organizationCity = org?.City ?? "",
                organizationState = org?.State ?? "",
                organizationGstin = org?.Gstin ?? "",
                udyamNumber = org?.UdyamNumber ?? ""
            };
        });

        return Ok(result);
    }


    private static string? ExtractTemporaryPasswordFromEmailLog(string? body)
    {
        if (string.IsNullOrWhiteSpace(body)) return null;

        var match = System.Text.RegularExpressions.Regex.Match(
            body,
            @"Temporary Password\s*</td>\s*<td[^>]*>\s*([^<\r\n]+?)\s*</td>",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);

        if (match.Success)
        {
            var val = match.Groups[1].Value.Trim();
            if (!string.IsNullOrEmpty(val)) return val;
        }

        return null;
    }

    private async Task ResolveSourceAsync(Guid? exhibitorId, Guid? visitorId, CancellationToken ct)
    {
        if (exhibitorId.HasValue && !await CoreDb.Exhibitors.AnyAsync(x => x.Id == exhibitorId && x.TenantId == TenantId, ct)) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Source exhibitor does not belong to the current tenant.");
        if (visitorId.HasValue && !await CoreDb.Visitors.AnyAsync(x => x.Id == visitorId && x.TenantId == TenantId, ct)) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Source visitor does not belong to the current tenant.");
    }
}

public sealed record CreateOrganizationRequest(string OrganizationType, string LegalName, string Email, string Phone, string Address, string City, string State, string Pincode, Guid? SourceExhibitorId, Guid? SourceVisitorId);
public sealed record UpdateOrganizationRequest(string LegalName, string? TradeName, string Email, string Phone, string Address, string City, string State, string Pincode, string? Gstin, string? Pan, string? UdyamNumber, string? BusinessType, string? Industry, string? CompanyWebsite, int? YearOfEstablishment, int? TotalEmployees, decimal? AnnualTurnover);

/// <summary>Payload for the public, unauthenticated Buyer/Seller self-registration endpoint.</summary>
public sealed record PublicMarketplaceRegistrationRequest(
    string OrganizationType,
    string LegalName,
    string? OrgEmail,
    string? OrgPhone,
    string Address,
    string City,
    string State,
    string Pincode,
    string ContactName,
    string ContactEmail,
    string? ContactPhone,
    string? ContactDesignation,
    string? Gstin,
    string? UdyamNumber);
