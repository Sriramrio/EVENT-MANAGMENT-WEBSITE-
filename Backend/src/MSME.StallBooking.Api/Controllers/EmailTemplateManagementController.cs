using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Application.Abstractions;
using MSME.StallBooking.Domain.Entities;
using MSME.StallBooking.Infrastructure.Email;
using MSME.StallBooking.Persistence;
using MSME.StallBooking.SharedKernel.Errors;
using System.Text.RegularExpressions;

namespace MSME.StallBooking.Api.Controllers;

public sealed class EmailTemplateDto
{
    public Guid Id { get; set; }
    public string TemplateCode { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string SubjectTemplate { get; set; } = "";
    public string BodyHtmlTemplate { get; set; } = "";
    public string BodyTextTemplate { get; set; } = "";
    public bool IsActive { get; set; }
    public bool IsSystemTemplate { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public List<TemplatePlaceholderInfo> Placeholders { get; set; } = new();
}

public sealed class CreateEmailTemplateRequest
{
    public string TemplateCode { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string SubjectTemplate { get; set; } = "";
    public string BodyHtmlTemplate { get; set; } = "";
    public string? BodyTextTemplate { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class UpdateEmailTemplateRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string SubjectTemplate { get; set; } = "";
    public string BodyHtmlTemplate { get; set; } = "";
    public string? BodyTextTemplate { get; set; }
    public bool? IsActive { get; set; }
}

public sealed class PreviewEmailTemplateRequest
{
    public string TemplateCode { get; set; } = "";
    public string SubjectTemplate { get; set; } = "";
    public string BodyHtmlTemplate { get; set; } = "";
    public Dictionary<string, string>? SampleData { get; set; }
}

public sealed class PreviewEmailTemplateResponse
{
    public string RenderedSubject { get; set; } = "";
    public string RenderedHtml { get; set; } = "";
}

public sealed class RecipientGroupSummaryDto
{
    public int TotalExhibitors { get; set; }
    public int AllocatedExhibitors { get; set; }
    public int TotalVisitors { get; set; }
    public int MarketplaceBuyers { get; set; }
    public int MarketplaceSellers { get; set; }
    public int TotalVips { get; set; }
}

public sealed class RecipientSuggestionDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Category { get; set; } = "";
    public string? Company { get; set; }
    public string? ExtraInfo { get; set; }
}

public sealed class SendCustomEmailRequest
{
    public string RecipientType { get; set; } = "all_exhibitors"; // "custom_list" | "all_exhibitors" | "allocated_exhibitors" | "all_visitors" | "marketplace_buyers" | "marketplace_sellers" | "vips" | "selected_recipients"
    public List<string> CustomEmails { get; set; } = new();
    public List<string> SelectedRecipientEmails { get; set; } = new();
    public string SubjectTemplate { get; set; } = "";
    public string BodyHtmlTemplate { get; set; } = "";
    public string? ReplyToEmail { get; set; }
    public string? ReplyToName { get; set; }
    public string? TemplateCode { get; set; }

    // Auto-save as new template option
    public bool SaveAsNewTemplate { get; set; } = false;
    public string? NewTemplateCode { get; set; }
    public string? NewTemplateName { get; set; }
    public string? NewTemplateDescription { get; set; }
}

public sealed class SendCustomEmailResponse
{
    public int TotalTargeted { get; set; }
    public int TotalSent { get; set; }
    public int TotalFailed { get; set; }
    public List<string> Errors { get; set; } = new();
    public string Message { get; set; } = "";
    public DateTimeOffset SentAt { get; set; } = DateTimeOffset.UtcNow;
}

[ApiController]
[Route("api/v1/admin/email-templates")]
public sealed class EmailTemplateManagementController : ControllerBase
{
    private readonly StallBookingDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<EmailTemplateManagementController> _logger;

    public EmailTemplateManagementController(
        StallBookingDbContext db,
        IConfiguration configuration,
        IEmailSender emailSender,
        ILogger<EmailTemplateManagementController> logger)
    {
        _db = db;
        _configuration = configuration;
        _emailSender = emailSender;
        _logger = logger;
    }

    private async Task<(Guid TenantId, Guid EventId, string EventName)> ResolveTenantAndEventAsync(CancellationToken ct)
    {
        var eventCode = _configuration["EventDefaults:EventCode"] ?? "MSME-HOSUR-2026";
        var evt = await _db.Events.FirstOrDefaultAsync(x => x.EventCode == eventCode.ToUpper(), ct)
            ?? await _db.Events.FirstOrDefaultAsync(ct);

        if (evt is not null)
        {
            return (evt.TenantId, evt.Id, evt.EventName);
        }

        var tenant = await _db.Tenants.FirstOrDefaultAsync(ct);
        var tenantId = tenant?.Id ?? Guid.Parse("11111111-1111-1111-1111-111111111111");
        return (tenantId, Guid.Empty, "MSME Sangamam 2026");
    }

    private async Task EnsureTemplatesSeededAsync(Guid tenantId, Guid eventId, CancellationToken ct)
    {
        var existingTemplates = await _db.EmailTemplates
            .Where(x => x.TenantId == tenantId)
            .ToListAsync(ct);

        var existingCodes = new HashSet<string>(
            existingTemplates.Select(x => x.TemplateCode),
            StringComparer.OrdinalIgnoreCase);

        bool changesMade = false;

        foreach (var (code, def) in EmailTemplateCatalog.AllTemplates)
        {
            if (!existingCodes.Contains(code))
            {
                var newTemplate = EmailTemplate.Create(
                    tenantId,
                    eventId == Guid.Empty ? null : eventId,
                    code,
                    def.DefaultSubject,
                    def.DefaultHtmlBody,
                    "",
                    true);

                await _db.EmailTemplates.AddAsync(newTemplate, ct);
                changesMade = true;
            }
        }

        if (changesMade)
        {
            await _db.SaveChangesAsync(ct);
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<EmailTemplateDto>>> GetEmailTemplates(CancellationToken ct)
    {
        var (tenantId, eventId, _) = await ResolveTenantAndEventAsync(ct);
        await EnsureTemplatesSeededAsync(tenantId, eventId, ct);

        var templates = await _db.EmailTemplates
            .Where(x => x.TenantId == tenantId)
            .OrderBy(x => x.TemplateCode)
            .ToListAsync(ct);

        var result = templates.Select(t =>
        {
            var isSystem = EmailTemplateCatalog.AllTemplates.TryGetValue(t.TemplateCode, out var def);
            return new EmailTemplateDto
            {
                Id = t.Id,
                TemplateCode = t.TemplateCode,
                Name = def?.Name ?? FormatTemplateName(t.TemplateCode),
                Description = def?.Description ?? "Custom email template",
                SubjectTemplate = t.SubjectTemplate,
                BodyHtmlTemplate = t.BodyHtmlTemplate,
                BodyTextTemplate = t.BodyTextTemplate,
                IsActive = t.IsActive,
                IsSystemTemplate = isSystem,
                UpdatedAt = t.UpdatedAt ?? t.CreatedAt,
                Placeholders = def?.Placeholders ?? GetDefaultCustomPlaceholders()
            };
        }).ToList();

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EmailTemplateDto>> GetEmailTemplateById(Guid id, CancellationToken ct)
    {
        var template = await _db.EmailTemplates
            .SingleOrDefaultAsync(x => x.Id == id, ct);

        if (template == null)
        {
            throw new DomainRuleException(ErrorCodes.EntityNotFound, "Email template not found.");
        }

        var isSystem = EmailTemplateCatalog.AllTemplates.TryGetValue(template.TemplateCode, out var def);

        var dto = new EmailTemplateDto
        {
            Id = template.Id,
            TemplateCode = template.TemplateCode,
            Name = def?.Name ?? FormatTemplateName(template.TemplateCode),
            Description = def?.Description ?? "Custom email template",
            SubjectTemplate = template.SubjectTemplate,
            BodyHtmlTemplate = template.BodyHtmlTemplate,
            BodyTextTemplate = template.BodyTextTemplate,
            IsActive = template.IsActive,
            IsSystemTemplate = isSystem,
            UpdatedAt = template.UpdatedAt ?? template.CreatedAt,
            Placeholders = def?.Placeholders ?? GetDefaultCustomPlaceholders()
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<EmailTemplateDto>> CreateEmailTemplate(
        [FromBody] CreateEmailTemplateRequest request,
        CancellationToken ct)
    {
        if (request is null)
        {
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Request body cannot be empty.");
        }

        if (string.IsNullOrWhiteSpace(request.TemplateCode))
        {
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Template code is required.");
        }

        if (string.IsNullOrWhiteSpace(request.SubjectTemplate))
        {
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Email subject template is required.");
        }

        if (string.IsNullOrWhiteSpace(request.BodyHtmlTemplate))
        {
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Email body HTML template is required.");
        }

        var (tenantId, eventId, _) = await ResolveTenantAndEventAsync(ct);
        var normalizedCode = NormalizeTemplateCode(request.TemplateCode);

        var existing = await _db.EmailTemplates
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.TemplateCode == normalizedCode, ct);

        if (existing != null)
        {
            throw new DomainRuleException(ErrorCodes.ValidationFailed, $"A template with code '{normalizedCode}' already exists.");
        }

        var newTemplate = EmailTemplate.Create(
            tenantId,
            eventId == Guid.Empty ? null : eventId,
            normalizedCode,
            request.SubjectTemplate,
            request.BodyHtmlTemplate,
            request.BodyTextTemplate ?? "",
            request.IsActive);

        await _db.EmailTemplates.AddAsync(newTemplate, ct);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Created new custom email template {TemplateCode} ({Id})", newTemplate.TemplateCode, newTemplate.Id);

        var dto = new EmailTemplateDto
        {
            Id = newTemplate.Id,
            TemplateCode = newTemplate.TemplateCode,
            Name = !string.IsNullOrWhiteSpace(request.Name) ? request.Name.Trim() : FormatTemplateName(newTemplate.TemplateCode),
            Description = !string.IsNullOrWhiteSpace(request.Description) ? request.Description.Trim() : "Custom email template",
            SubjectTemplate = newTemplate.SubjectTemplate,
            BodyHtmlTemplate = newTemplate.BodyHtmlTemplate,
            BodyTextTemplate = newTemplate.BodyTextTemplate,
            IsActive = newTemplate.IsActive,
            IsSystemTemplate = false,
            UpdatedAt = newTemplate.UpdatedAt ?? newTemplate.CreatedAt,
            Placeholders = GetDefaultCustomPlaceholders()
        };

        return CreatedAtAction(nameof(GetEmailTemplateById), new { id = newTemplate.Id }, dto);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<EmailTemplateDto>> UpdateEmailTemplate(
        Guid id,
        [FromBody] UpdateEmailTemplateRequest request,
        CancellationToken ct)
    {
        if (request is null)
        {
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Request body cannot be empty.");
        }

        if (string.IsNullOrWhiteSpace(request.SubjectTemplate))
        {
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Email subject template is required.");
        }

        if (string.IsNullOrWhiteSpace(request.BodyHtmlTemplate))
        {
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Email body HTML template is required.");
        }

        var template = await _db.EmailTemplates
            .SingleOrDefaultAsync(x => x.Id == id, ct);

        if (template == null)
        {
            throw new DomainRuleException(ErrorCodes.EntityNotFound, "Email template not found.");
        }

        template.Update(
            request.SubjectTemplate,
            request.BodyHtmlTemplate,
            request.BodyTextTemplate,
            request.IsActive);

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Email template {TemplateCode} ({Id}) was updated.", template.TemplateCode, template.Id);

        var isSystem = EmailTemplateCatalog.AllTemplates.TryGetValue(template.TemplateCode, out var def);

        var dto = new EmailTemplateDto
        {
            Id = template.Id,
            TemplateCode = template.TemplateCode,
            Name = def?.Name ?? (!string.IsNullOrWhiteSpace(request.Name) ? request.Name.Trim() : FormatTemplateName(template.TemplateCode)),
            Description = def?.Description ?? (!string.IsNullOrWhiteSpace(request.Description) ? request.Description.Trim() : "Custom email template"),
            SubjectTemplate = template.SubjectTemplate,
            BodyHtmlTemplate = template.BodyHtmlTemplate,
            BodyTextTemplate = template.BodyTextTemplate,
            IsActive = template.IsActive,
            IsSystemTemplate = isSystem,
            UpdatedAt = template.UpdatedAt ?? template.CreatedAt,
            Placeholders = def?.Placeholders ?? GetDefaultCustomPlaceholders()
        };

        return Ok(dto);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteEmailTemplate(Guid id, CancellationToken ct)
    {
        var template = await _db.EmailTemplates
            .SingleOrDefaultAsync(x => x.Id == id, ct);

        if (template == null)
        {
            throw new DomainRuleException(ErrorCodes.EntityNotFound, "Email template not found.");
        }

        if (EmailTemplateCatalog.AllTemplates.ContainsKey(template.TemplateCode))
        {
            throw new DomainRuleException(ErrorCodes.Forbidden, "System default templates cannot be permanently deleted. You can disable them instead.");
        }

        _db.EmailTemplates.Remove(template);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Custom email template {TemplateCode} ({Id}) was deleted.", template.TemplateCode, id);
        return NoContent();
    }

    [HttpPost("preview")]
    public ActionResult<PreviewEmailTemplateResponse> PreviewEmailTemplate(
        [FromBody] PreviewEmailTemplateRequest request)
    {
        if (request is null)
        {
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Preview request cannot be empty.");
        }

        var sampleValues = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);

        // Prepopulate default placeholder example values
        foreach (var p in GetDefaultCustomPlaceholders())
        {
            var cleanTag = p.Tag.Trim('{', '}').Trim();
            sampleValues[cleanTag] = p.ExampleValue;
        }

        if (!string.IsNullOrWhiteSpace(request.TemplateCode) &&
            EmailTemplateCatalog.AllTemplates.TryGetValue(request.TemplateCode, out var def))
        {
            foreach (var p in def.Placeholders)
            {
                var cleanTag = p.Tag.Trim('{', '}').Trim();
                sampleValues[cleanTag] = p.ExampleValue;
            }
        }

        if (request.SampleData != null)
        {
            foreach (var (k, v) in request.SampleData)
            {
                sampleValues[k] = v;
            }
        }

        var renderedSubject = EmailTemplateCatalog.RenderTemplate(request.SubjectTemplate, sampleValues);
        var rawHtml = EmailTemplateCatalog.RenderTemplate(request.BodyHtmlTemplate, sampleValues);
        var renderedHtml = EmailSender.EnsureEmailFooter(rawHtml);

        return Ok(new PreviewEmailTemplateResponse
        {
            RenderedSubject = renderedSubject,
            RenderedHtml = renderedHtml
        });
    }

    [HttpPost("{id:guid}/reset")]
    public async Task<ActionResult<EmailTemplateDto>> ResetEmailTemplate(Guid id, CancellationToken ct)
    {
        var template = await _db.EmailTemplates
            .SingleOrDefaultAsync(x => x.Id == id, ct);

        if (template == null)
        {
            throw new DomainRuleException(ErrorCodes.EntityNotFound, "Email template not found.");
        }

        if (!EmailTemplateCatalog.AllTemplates.TryGetValue(template.TemplateCode, out var def))
        {
            throw new DomainRuleException(ErrorCodes.EntityNotFound, "No default template catalog found for this code.");
        }

        template.Update(def.DefaultSubject, def.DefaultHtmlBody, "", true);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Email template {TemplateCode} ({Id}) was reset to factory default.", template.TemplateCode, template.Id);

        var dto = new EmailTemplateDto
        {
            Id = template.Id,
            TemplateCode = template.TemplateCode,
            Name = def.Name,
            Description = def.Description,
            SubjectTemplate = template.SubjectTemplate,
            BodyHtmlTemplate = template.BodyHtmlTemplate,
            BodyTextTemplate = template.BodyTextTemplate,
            IsActive = template.IsActive,
            IsSystemTemplate = true,
            UpdatedAt = template.UpdatedAt ?? template.CreatedAt,
            Placeholders = def.Placeholders
        };

        return Ok(dto);
    }

    [HttpGet("recipients/summary")]
    public async Task<ActionResult<RecipientGroupSummaryDto>> GetRecipientSummary(CancellationToken ct)
    {
        var exhibitorsCount = await _db.Exhibitors
            .AsNoTracking()
            .Where(x => !string.IsNullOrWhiteSpace(x.Email))
            .Select(x => x.Email.ToLower().Trim())
            .Distinct()
            .CountAsync(ct);

        var allocatedExhibitorIds = await _db.StallBookings
            .AsNoTracking()
            .Where(b => b.AllocatedStallId != null)
            .Select(b => b.ExhibitorId)
            .Distinct()
            .ToListAsync(ct);

        var allocatedExhibitorsCount = await _db.Exhibitors
            .AsNoTracking()
            .Where(x => allocatedExhibitorIds.Contains(x.Id) && !string.IsNullOrWhiteSpace(x.Email))
            .Select(x => x.Email.ToLower().Trim())
            .Distinct()
            .CountAsync(ct);

        var visitorsCount = await _db.Visitors
            .AsNoTracking()
            .Where(x => !string.IsNullOrWhiteSpace(x.Email))
            .Select(x => x.Email.ToLower().Trim())
            .Distinct()
            .CountAsync(ct);

        var buyersCount = await _db.Organizations
            .AsNoTracking()
            .Where(x => (x.OrganizationType == "BUYER" || x.OrganizationType == "BOTH") && !string.IsNullOrWhiteSpace(x.Email))
            .Select(x => x.Email.ToLower().Trim())
            .Distinct()
            .CountAsync(ct);

        var sellersCount = await _db.Organizations
            .AsNoTracking()
            .Where(x => (x.OrganizationType == "SELLER" || x.OrganizationType == "BOTH") && !string.IsNullOrWhiteSpace(x.Email))
            .Select(x => x.Email.ToLower().Trim())
            .Distinct()
            .CountAsync(ct);

        var vipsCount = await _db.Vip
            .AsNoTracking()
            .Where(x => !string.IsNullOrWhiteSpace(x.Email))
            .Select(x => x.Email.ToLower().Trim())
            .Distinct()
            .CountAsync(ct);

        return Ok(new RecipientGroupSummaryDto
        {
            TotalExhibitors = exhibitorsCount,
            AllocatedExhibitors = allocatedExhibitorsCount,
            TotalVisitors = visitorsCount,
            MarketplaceBuyers = buyersCount,
            MarketplaceSellers = sellersCount,
            TotalVips = vipsCount
        });
    }

    [HttpGet("recipients/search")]
    public async Task<ActionResult<List<RecipientSuggestionDto>>> SearchRecipients(
        [FromQuery] string? query,
        [FromQuery] string? category,
        CancellationToken ct)
    {
        var q = (query ?? "").Trim().ToLowerInvariant();
        var cat = (category ?? "").Trim().ToLowerInvariant();
        var results = new List<RecipientSuggestionDto>();

        // 1. Exhibitors
        if (string.IsNullOrEmpty(cat) || cat == "exhibitors" || cat == "all_exhibitors" || cat == "allocated_exhibitors")
        {
            var exhibitorQuery = _db.Exhibitors.AsNoTracking().Where(x => !string.IsNullOrWhiteSpace(x.Email));
            if (!string.IsNullOrEmpty(q))
            {
                exhibitorQuery = exhibitorQuery.Where(x =>
                    x.LegalName.ToLower().Contains(q) ||
                    x.Email.ToLower().Contains(q) ||
                    x.ContactPersonName.ToLower().Contains(q) ||
                    (x.TradeName != null && x.TradeName.ToLower().Contains(q)));
            }

            var exhibitors = await exhibitorQuery.Take(25).ToListAsync(ct);
            results.AddRange(exhibitors.Select(e => new RecipientSuggestionDto
            {
                Id = e.Id.ToString(),
                Name = !string.IsNullOrWhiteSpace(e.ContactPersonName) ? e.ContactPersonName : e.LegalName,
                Email = e.Email.Trim().ToLowerInvariant(),
                Category = "Exhibitor",
                Company = e.LegalName,
                ExtraInfo = !string.IsNullOrWhiteSpace(e.Mobile) ? $"Mobile: {e.Mobile}" : null
            }));
        }

        // 2. Visitors
        if (string.IsNullOrEmpty(cat) || cat == "visitors" || cat == "all_visitors")
        {
            var visitorQuery = _db.Visitors.AsNoTracking().Where(x => !string.IsNullOrWhiteSpace(x.Email));
            if (!string.IsNullOrEmpty(q))
            {
                visitorQuery = visitorQuery.Where(x =>
                    x.ContactPersonName.ToLower().Contains(q) ||
                    x.Email.ToLower().Contains(q) ||
                    x.LegalName.ToLower().Contains(q));
            }

            var visitors = await visitorQuery.Take(25).ToListAsync(ct);
            results.AddRange(visitors.Select(v => new RecipientSuggestionDto
            {
                Id = v.Id.ToString(),
                Name = !string.IsNullOrWhiteSpace(v.ContactPersonName) ? v.ContactPersonName : v.LegalName,
                Email = v.Email.Trim().ToLowerInvariant(),
                Category = "Visitor",
                Company = v.LegalName,
                ExtraInfo = !string.IsNullOrWhiteSpace(v.BookingRegistrationNumber) ? $"Reg: {v.BookingRegistrationNumber}" : null
            }));
        }

        // 3. Marketplace Organizations (Buyers / Sellers)
        if (string.IsNullOrEmpty(cat) || cat == "buyers" || cat == "sellers" || cat == "marketplace")
        {
            var orgQuery = _db.Organizations.AsNoTracking().Where(x => !string.IsNullOrWhiteSpace(x.Email));
            if (!string.IsNullOrEmpty(q))
            {
                orgQuery = orgQuery.Where(x =>
                    x.LegalName.ToLower().Contains(q) ||
                    x.Email.ToLower().Contains(q) ||
                    (x.TradeName != null && x.TradeName.ToLower().Contains(q)));
            }

            var orgs = await orgQuery.Take(25).ToListAsync(ct);
            results.AddRange(orgs.Select(o => new RecipientSuggestionDto
            {
                Id = o.Id.ToString(),
                Name = o.LegalName,
                Email = o.Email.Trim().ToLowerInvariant(),
                Category = o.OrganizationType == "BUYER" ? "Buyer" : (o.OrganizationType == "SELLER" ? "Seller" : "Buyer/Seller"),
                Company = o.LegalName,
                ExtraInfo = o.City
            }));
        }

        // 4. VIPs
        if (string.IsNullOrEmpty(cat) || cat == "vips")
        {
            var vipQuery = _db.Vip.AsNoTracking().Where(x => !string.IsNullOrWhiteSpace(x.Email));
            if (!string.IsNullOrEmpty(q))
            {
                vipQuery = vipQuery.Where(x =>
                    x.ContactPersonName.ToLower().Contains(q) ||
                    x.Email.ToLower().Contains(q) ||
                    x.Name.ToLower().Contains(q) ||
                    (x.Organization != null && x.Organization.ToLower().Contains(q)));
            }

            var vips = await vipQuery.Take(15).ToListAsync(ct);
            results.AddRange(vips.Select(vp => new RecipientSuggestionDto
            {
                Id = vp.Id.ToString(),
                Name = !string.IsNullOrWhiteSpace(vp.Name) ? vp.Name : (!string.IsNullOrWhiteSpace(vp.ContactPersonName) ? vp.ContactPersonName : "VIP Guest"),
                Email = vp.Email.Trim().ToLowerInvariant(),
                Category = "VIP Guest",
                Company = vp.Organization ?? "VIP Guest",
                ExtraInfo = vp.Designation ?? "VIP"
            }));
        }

        // Distinct by Email
        var distinctResults = results
            .GroupBy(x => x.Email.ToLowerInvariant())
            .Select(g => g.First())
            .Take(40)
            .ToList();

        return Ok(distinctResults);
    }

    [HttpPost("send-custom")]
    public async Task<ActionResult<SendCustomEmailResponse>> SendCustomEmail(
        [FromBody] SendCustomEmailRequest request,
        CancellationToken ct)
    {
        if (request is null)
        {
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Send request cannot be empty.");
        }

        if (string.IsNullOrWhiteSpace(request.SubjectTemplate))
        {
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Subject cannot be empty.");
        }

        if (string.IsNullOrWhiteSpace(request.BodyHtmlTemplate))
        {
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Message content cannot be empty.");
        }

        var (tenantId, eventId, eventName) = await ResolveTenantAndEventAsync(ct);

        // Optional: Save as new template to database if checked
        if (request.SaveAsNewTemplate && !string.IsNullOrWhiteSpace(request.NewTemplateName))
        {
            var code = !string.IsNullOrWhiteSpace(request.NewTemplateCode)
                ? NormalizeTemplateCode(request.NewTemplateCode)
                : NormalizeTemplateCode(request.NewTemplateName);

            var existing = await _db.EmailTemplates.FirstOrDefaultAsync(x => x.TenantId == tenantId && x.TemplateCode == code, ct);
            if (existing != null)
            {
                existing.Update(request.SubjectTemplate, request.BodyHtmlTemplate, "", true);
            }
            else
            {
                var newTemplate = EmailTemplate.Create(
                    tenantId,
                    eventId == Guid.Empty ? null : eventId,
                    code,
                    request.SubjectTemplate,
                    request.BodyHtmlTemplate,
                    "",
                    true);
                await _db.EmailTemplates.AddAsync(newTemplate, ct);
            }
            await _db.SaveChangesAsync(ct);
        }

        // Gather target recipient models
        var recipientTargets = new List<RecipientContactData>();

        switch (request.RecipientType.ToLowerInvariant())
        {
            case "all_exhibitors":
                {
                    var exhibitors = await _db.Exhibitors
                        .AsNoTracking()
                        .Where(x => !string.IsNullOrWhiteSpace(x.Email))
                        .ToListAsync(ct);

                    var stallMapData = await (
                        from b in _db.StallBookings.AsNoTracking()
                        join s in _db.Stalls.AsNoTracking() on b.AllocatedStallId equals s.Id
                        where b.AllocatedStallId != null
                        select new { b.ExhibitorId, s.StallNumber }
                    ).ToListAsync(ct);

                    var stallMap = stallMapData
                        .GroupBy(x => x.ExhibitorId)
                        .ToDictionary(g => g.Key, g => string.Join(", ", g.Select(x => x.StallNumber)));

                    foreach (var ex in exhibitors)
                    {
                        stallMap.TryGetValue(ex.Id, out var stallNum);
                        recipientTargets.Add(new RecipientContactData
                        {
                            Email = ex.Email.Trim().ToLowerInvariant(),
                            Name = !string.IsNullOrWhiteSpace(ex.ContactPersonName) ? ex.ContactPersonName : ex.LegalName,
                            Company = ex.LegalName,
                            StallNumber = stallNum ?? "Pending Allocation",
                            RoleOrCategory = "Exhibitor"
                        });
                    }
                    break;
                }

            case "allocated_exhibitors":
                {
                    var allocatedData = await (
                        from b in _db.StallBookings.AsNoTracking()
                        join ex in _db.Exhibitors.AsNoTracking() on b.ExhibitorId equals ex.Id
                        join s in _db.Stalls.AsNoTracking() on b.AllocatedStallId equals s.Id
                        where b.AllocatedStallId != null && !string.IsNullOrWhiteSpace(ex.Email)
                        select new
                        {
                            ex.Email,
                            Name = !string.IsNullOrWhiteSpace(ex.ContactPersonName) ? ex.ContactPersonName : ex.LegalName,
                            Company = ex.LegalName,
                            s.StallNumber
                        }
                    ).ToListAsync(ct);

                    foreach (var item in allocatedData)
                    {
                        recipientTargets.Add(new RecipientContactData
                        {
                            Email = item.Email.Trim().ToLowerInvariant(),
                            Name = item.Name,
                            Company = item.Company,
                            StallNumber = item.StallNumber,
                            RoleOrCategory = "Exhibitor"
                        });
                    }
                    break;
                }

            case "all_visitors":
                {
                    var visitors = await _db.Visitors
                        .AsNoTracking()
                        .Where(x => !string.IsNullOrWhiteSpace(x.Email))
                        .ToListAsync(ct);

                    foreach (var v in visitors)
                    {
                        recipientTargets.Add(new RecipientContactData
                        {
                            Email = v.Email.Trim().ToLowerInvariant(),
                            Name = !string.IsNullOrWhiteSpace(v.ContactPersonName) ? v.ContactPersonName : v.LegalName,
                            Company = v.LegalName,
                            StallNumber = "-",
                            RoleOrCategory = "Visitor"
                        });
                    }
                    break;
                }

            case "marketplace_buyers":
                {
                    var buyers = await _db.Organizations
                        .AsNoTracking()
                        .Where(x => (x.OrganizationType == "BUYER" || x.OrganizationType == "BOTH") && !string.IsNullOrWhiteSpace(x.Email))
                        .ToListAsync(ct);

                    foreach (var b in buyers)
                    {
                        recipientTargets.Add(new RecipientContactData
                        {
                            Email = b.Email.Trim().ToLowerInvariant(),
                            Name = b.LegalName,
                            Company = b.LegalName,
                            StallNumber = "-",
                            RoleOrCategory = "Marketplace Buyer"
                        });
                    }
                    break;
                }

            case "marketplace_sellers":
                {
                    var sellers = await _db.Organizations
                        .AsNoTracking()
                        .Where(x => (x.OrganizationType == "SELLER" || x.OrganizationType == "BOTH") && !string.IsNullOrWhiteSpace(x.Email))
                        .ToListAsync(ct);

                    foreach (var s in sellers)
                    {
                        recipientTargets.Add(new RecipientContactData
                        {
                            Email = s.Email.Trim().ToLowerInvariant(),
                            Name = s.LegalName,
                            Company = s.LegalName,
                            StallNumber = "-",
                            RoleOrCategory = "Marketplace Seller"
                        });
                    }
                    break;
                }

            case "vips":
                {
                    var vips = await _db.Vip
                        .AsNoTracking()
                        .Where(x => !string.IsNullOrWhiteSpace(x.Email))
                        .ToListAsync(ct);

                    foreach (var vp in vips)
                    {
                        recipientTargets.Add(new RecipientContactData
                        {
                            Email = vp.Email.Trim().ToLowerInvariant(),
                            Name = !string.IsNullOrWhiteSpace(vp.Name) ? vp.Name : (!string.IsNullOrWhiteSpace(vp.ContactPersonName) ? vp.ContactPersonName : "VIP Guest"),
                            Company = vp.Organization ?? "VIP Guest",
                            StallNumber = "-",
                            RoleOrCategory = "VIP Guest"
                        });
                    }
                    break;
                }

            case "selected_recipients":
                {
                    foreach (var email in request.SelectedRecipientEmails)
                    {
                        if (IsValidEmail(email))
                        {
                            recipientTargets.Add(new RecipientContactData
                            {
                                Email = email.Trim().ToLowerInvariant(),
                                Name = email.Split('@')[0],
                                Company = "Valued Partner",
                                StallNumber = "-",
                                RoleOrCategory = "Selected Contact"
                            });
                        }
                    }
                    break;
                }

            case "custom_list":
            default:
                {
                    foreach (var email in request.CustomEmails)
                    {
                        if (IsValidEmail(email))
                        {
                            recipientTargets.Add(new RecipientContactData
                            {
                                Email = email.Trim().ToLowerInvariant(),
                                Name = email.Split('@')[0],
                                Company = "Valued Partner",
                                StallNumber = "-",
                                RoleOrCategory = "Custom Recipient"
                            });
                        }
                    }
                    break;
                }
        }

        // Deduplicate recipients by email
        var distinctTargets = recipientTargets
            .GroupBy(x => x.Email.ToLowerInvariant())
            .Select(g => g.First())
            .ToList();

        if (distinctTargets.Count == 0)
        {
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "No valid recipient email addresses found for the selected target group.");
        }

        int sentCount = 0;
        int failedCount = 0;
        var errors = new List<string>();

        foreach (var target in distinctTargets)
        {
            try
            {
                var placeholderValues = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
                {
                    ["recipientName"] = target.Name,
                    ["RecipientName"] = target.Name,
                    ["visitorName"] = target.Name,
                    ["VisitorName"] = target.Name,
                    ["exhibitorName"] = target.Name,
                    ["ExhibitorName"] = target.Name,
                    ["companyName"] = target.Company,
                    ["CompanyName"] = target.Company,
                    ["stallNumber"] = target.StallNumber,
                    ["StallNumber"] = target.StallNumber,
                    ["email"] = target.Email,
                    ["Email"] = target.Email,
                    ["eventName"] = eventName,
                    ["EventName"] = eventName,
                    ["date"] = DateTime.Now.ToString("dd MMMM yyyy"),
                    ["Date"] = DateTime.Now.ToString("dd MMMM yyyy")
                };

                var renderedSubject = EmailTemplateCatalog.RenderTemplate(request.SubjectTemplate, placeholderValues);
                var rawBody = EmailTemplateCatalog.RenderTemplate(request.BodyHtmlTemplate, placeholderValues);
                var renderedHtml = EmailSender.EnsureEmailFooter(rawBody);

                var templateCode = !string.IsNullOrWhiteSpace(request.TemplateCode)
                    ? request.TemplateCode
                    : "CUSTOM_BROADCAST_EMAIL";

                var emailLog = EmailLog.Create(
                    tenantId,
                    eventId == Guid.Empty ? null : eventId,
                    null,
                    target.Email,
                    renderedSubject,
                    renderedHtml,
                    templateCode);

                _db.EmailLogs.Add(emailLog);
                await _db.SaveChangesAsync(ct);

                if (!string.IsNullOrWhiteSpace(request.ReplyToEmail))
                {
                    await _emailSender.SendEmailAsync(
                        target.Email,
                        renderedSubject,
                        renderedHtml,
                        replyToEmail: request.ReplyToEmail.Trim(),
                        replyToName: request.ReplyToName?.Trim());
                }
                else
                {
                    await _emailSender.SendEmailAsync(target.Email, renderedSubject, renderedHtml);
                }

                emailLog.MarkSent(null);
                await _db.SaveChangesAsync(ct);

                sentCount++;
            }
            catch (Exception ex)
            {
                failedCount++;
                errors.Add($"Failed sending to {target.Email}: {ex.Message}");
                _logger.LogError(ex, "Failed sending custom email to {Email}", target.Email);
            }
        }

        return Ok(new SendCustomEmailResponse
        {
            TotalTargeted = distinctTargets.Count,
            TotalSent = sentCount,
            TotalFailed = failedCount,
            Errors = errors.Take(5).ToList(),
            Message = $"Dispatched {sentCount} email(s) successfully." + (failedCount > 0 ? $" ({failedCount} failed)" : ""),
            SentAt = DateTimeOffset.UtcNow
        });
    }

    private static bool IsValidEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;
        return Regex.IsMatch(email.Trim(), @"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.IgnoreCase);
    }

    private static string NormalizeTemplateCode(string input)
    {
        var cleaned = Regex.Replace(input.Trim(), @"[^a-zA-Z0-9_]+", "_").ToUpperInvariant();
        return cleaned.Trim('_');
    }

    private static string FormatTemplateName(string code)
    {
        var words = code.Split('_', StringSplitOptions.RemoveEmptyEntries)
            .Select(w => char.ToUpper(w[0]) + w.Substring(1).ToLower());
        return string.Join(" ", words);
    }

    private static List<TemplatePlaceholderInfo> GetDefaultCustomPlaceholders()
    {
        return new List<TemplatePlaceholderInfo>
        {
            new() { Tag = "{{recipientName}}", Label = "Recipient Name", Description = "Name of the person receiving the email", ExampleValue = "Ramesh Kumar" },
            new() { Tag = "{{companyName}}", Label = "Company / Org Name", Description = "Name of the recipient company or organization", ExampleValue = "Acme Engineering" },
            new() { Tag = "{{stallNumber}}", Label = "Stall Number", Description = "Stall number if assigned", ExampleValue = "A-102" },
            new() { Tag = "{{eventName}}", Label = "Event Name", Description = "Name of the active event", ExampleValue = "MSME Sangamam 2026" },
            new() { Tag = "{{email}}", Label = "Recipient Email", Description = "Email address of the recipient", ExampleValue = "ramesh@example.com" },
            new() { Tag = "{{date}}", Label = "Current Date", Description = "Formatted date of dispatch", ExampleValue = DateTime.Now.ToString("dd MMMM yyyy") }
        };
    }

    private sealed class RecipientContactData
    {
        public string Email { get; set; } = "";
        public string Name { get; set; } = "";
        public string Company { get; set; } = "";
        public string StallNumber { get; set; } = "-";
        public string RoleOrCategory { get; set; } = "";
    }
}
