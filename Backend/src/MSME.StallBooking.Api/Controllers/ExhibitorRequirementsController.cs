using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Application.Abstractions;
using MSME.StallBooking.Domain.Entities;
using MSME.StallBooking.Domain.Enums;
using MSME.StallBooking.Domain.Marketplace;
using MSME.StallBooking.Persistence;

namespace MSME.StallBooking.Api.Controllers;

public sealed record AdditionalRequirementCatalogItemDto(
    Guid Id,
    string Code,
    string Name,
    decimal BaseAmount,
    decimal GstPercentage,
    decimal UnitGstAmount,
    decimal UnitTotalAmount,
    string? ImageUrl,
    bool IsActive);

public sealed record SubmitAdditionalRequirementItemInput(Guid ItemId, int Quantity);

public sealed record SubmitAdditionalRequirementRequest(List<SubmitAdditionalRequirementItemInput> Items, string? Notes = null);

public sealed record ExhibitorRequirementLineDto(
    Guid Id,
    Guid ItemId,
    string ItemCode,
    string ItemName,
    int Quantity,
    decimal BaseAmount,
    decimal GstPercentage,
    decimal GstAmount,
    decimal TotalAmount);

public sealed record ExhibitorRequirementDto(
    Guid Id,
    Guid ExhibitorId,
    Guid BookingId,
    string BookingRegistrationNumber,
    string Status,
    decimal TotalBaseAmount,
    decimal TotalGstAmount,
    decimal GrandTotal,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ConfirmedAt,
    string? CallNotes,
    string? Notes,
    List<ExhibitorRequirementLineDto> Lines);

[ApiController]
[Authorize]
[Route("api/v1/exhibitor/additional-requirements")]
public sealed class ExhibitorRequirementsController : ControllerBase
{
    private readonly StallBookingDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly IEmailComposer _emailComposer;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<ExhibitorRequirementsController> _logger;

    public ExhibitorRequirementsController(
        StallBookingDbContext db,
        IConfiguration configuration,
        IEmailComposer emailComposer,
        IEmailSender emailSender,
        ILogger<ExhibitorRequirementsController> logger)
    {
        _db = db;
        _configuration = configuration;
        _emailComposer = emailComposer;
        _emailSender = emailSender;
        _logger = logger;
    }

    /// <summary>
    /// Returns the active catalog of additional requirement items available for exhibitors.
    /// </summary>
    [HttpGet("catalog")]
    public async Task<IActionResult> GetCatalog(CancellationToken ct)
    {
        var items = await _db.AdditionalRequirementItems
            .AsNoTracking()
            .Where(x => x.IsActive && !x.IsDeleted)
            .OrderBy(x => x.Name)
            .Select(x => new AdditionalRequirementCatalogItemDto(
                x.Id,
                x.Code,
                x.Name,
                x.BaseAmount,
                x.GstPercentage,
                Math.Round(x.BaseAmount * (x.GstPercentage / 100m), 2),
                x.BaseAmount + Math.Round(x.BaseAmount * (x.GstPercentage / 100m), 2),
                x.ImageUrl,
                x.IsActive))
            .ToListAsync(ct);

        return Ok(items);
    }

    /// <summary>
    /// Checks whether the Additional Requirements portal flow is currently active.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("feature-status")]
    public async Task<IActionResult> GetFeatureStatus(CancellationToken ct)
    {
        var setting = await _db.ReferenceData
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Kind == "FEATURETOGGLE" && r.Code == "REQUIREMENTS_PORTAL_ENABLED", ct);

        var isEnabled = setting == null || setting.IsActive;
        return Ok(new { enabled = isEnabled });
    }

    /// <summary>
    /// Submits a new additional requirements request for the logged-in exhibitor.
    /// Calculates all GST and totals server-side as the source of truth, and sends confirmation emails.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> SubmitRequest(
        [FromBody] SubmitAdditionalRequirementRequest request,
        CancellationToken ct)
    {
        var setting = await _db.ReferenceData
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Kind == "FEATURETOGGLE" && r.Code == "REQUIREMENTS_PORTAL_ENABLED", ct);

        if (setting != null && !setting.IsActive)
        {
            return StatusCode(403, new { message = "Additional requirement requests are currently disabled by administration." });
        }

        var exhibitorId = GetExhibitorId();
        if (exhibitorId is null)
            return Forbid();

        if (request?.Items is null || request.Items.Count == 0)
            return BadRequest(new { message = "Please select at least one additional requirement item." });

        if (request.Items.Any(x => x.Quantity <= 0))
            return BadRequest(new { message = "Quantity for each item must be greater than zero." });

        var exhibitor = await _db.Exhibitors.AsNoTracking().FirstOrDefaultAsync(e => e.Id == exhibitorId, ct);
        if (exhibitor is null)
            return Unauthorized(new { message = "Exhibitor record was not found." });

        var booking = await _db.StallBookings
            .AsNoTracking()
            .Where(b => b.ExhibitorId == exhibitorId && !b.IsDeleted)
            .OrderByDescending(b => b.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (booking is null)
            return BadRequest(new { message = "No stall booking found for this exhibitor." });

        var itemIds = request.Items.Select(x => x.ItemId).Distinct().ToList();
        var catalogItems = await _db.AdditionalRequirementItems
            .Where(x => itemIds.Contains(x.Id) && x.IsActive && !x.IsDeleted)
            .ToDictionaryAsync(x => x.Id, ct);

        if (catalogItems.Count != itemIds.Count)
            return BadRequest(new { message = "One or more selected items are no longer available in the catalog." });

        var requirement = ExhibitorAdditionalRequirement.Create(
            exhibitor.TenantId,
            booking.EventId,
            exhibitor.Id,
            booking.Id,
            request.Notes,
            exhibitor.Id,
            "exhibitor-portal");

        foreach (var reqItem in request.Items)
        {
            var item = catalogItems[reqItem.ItemId];
            requirement.AddLine(
                item.Id,
                item.Code,
                item.Name,
                reqItem.Quantity,
                item.BaseAmount,
                item.GstPercentage);
        }

        await _db.ExhibitorAdditionalRequirements.AddAsync(requirement, ct);
        await _db.SaveChangesAsync(ct);

        // Send Email Notifications (Exhibitor Confirmation + Admin Alert)
        try
        {
            var stall = booking.AllocatedStallId.HasValue
                ? await _db.Stalls.AsNoTracking().FirstOrDefaultAsync(s => s.Id == booking.AllocatedStallId.Value, ct)
                : null;

            var itemsTableHtml = BuildRequirementItemsHtmlTable(requirement.Lines);
            var companyName = !string.IsNullOrWhiteSpace(exhibitor.TradeName) ? exhibitor.TradeName : exhibitor.LegalName;

            // 1. Email to Exhibitor (who submitted the request)
            if (!string.IsNullOrWhiteSpace(exhibitor.Email))
            {
                var exhibitorEmailLog = _emailComposer.ComposeAdditionalRequirementsSubmitted(
                    requirement.TenantId,
                    requirement.EventId,
                    requirement.BookingId,
                    exhibitor.Email.Trim(),
                    companyName,
                    exhibitor.ContactPersonName,
                    exhibitor.Mobile,
                    booking.BookingRegistrationNumber,
                    stall?.StallNumber,
                    requirement.Id,
                    requirement.Status.ToString(),
                    requirement.TotalBaseAmount,
                    requirement.TotalGstAmount,
                    requirement.GrandTotal,
                    itemsTableHtml,
                    requirement.Notes);

                await _emailSender.SendEmailAsync(
                    exhibitorEmailLog.ToEmail,
                    exhibitorEmailLog.Subject,
                    exhibitorEmailLog.BodySnapshot);

                await _db.EmailLogs.AddAsync(exhibitorEmailLog, ct);
            }

            // 2. Alert Email to Superadmin / Exhibitor Requirements Admin
            var defaultAlerts = _configuration["EmailSettings:DefaultAlertRecipients"];
            var alertRecipients = !string.IsNullOrWhiteSpace(defaultAlerts)
                ? defaultAlerts.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToList()
                : new List<string> { "superadmin@lubmsmehosur.org", "exhibitoradmin@lubmsmehosur.org" };

            foreach (var recipient in alertRecipients)
            {
                if (string.IsNullOrWhiteSpace(recipient)) continue;

                var adminEmailLog = _emailComposer.ComposeAdminAdditionalRequirementsAlert(
                    requirement.TenantId,
                    requirement.EventId,
                    requirement.BookingId,
                    recipient,
                    companyName,
                    exhibitor.ContactPersonName,
                    exhibitor.Mobile,
                    exhibitor.Email ?? "N/A",
                    booking.BookingRegistrationNumber,
                    stall?.StallNumber,
                    requirement.Id,
                    requirement.Status.ToString(),
                    requirement.TotalBaseAmount,
                    requirement.TotalGstAmount,
                    requirement.GrandTotal,
                    itemsTableHtml,
                    requirement.Notes);

                await _emailSender.SendEmailAsync(
                    adminEmailLog.ToEmail,
                    adminEmailLog.Subject,
                    adminEmailLog.BodySnapshot);

                await _db.EmailLogs.AddAsync(adminEmailLog, ct);
            }

            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send additional requirement emails for requirement ID: {Id}", requirement.Id);
            // Email errors are logged but do not disrupt successful booking response
        }

        var resultDto = new ExhibitorRequirementDto(
            requirement.Id,
            requirement.ExhibitorId,
            requirement.BookingId,
            booking.BookingRegistrationNumber,
            requirement.Status.ToString(),
            requirement.TotalBaseAmount,
            requirement.TotalGstAmount,
            requirement.GrandTotal,
            requirement.CreatedAt,
            requirement.ConfirmedAt,
            requirement.CallNotes,
            requirement.Notes,
            requirement.Lines.Select(l => new ExhibitorRequirementLineDto(
                l.Id,
                l.ItemId,
                l.ItemCode,
                l.ItemName,
                l.Quantity,
                l.BaseAmount,
                l.GstPercentage,
                l.GstAmount,
                l.TotalAmount)).ToList());

        return Ok(new
        {
            message = "Requirement request submitted successfully. A confirmation email has been sent.",
            requirement = resultDto
        });
    }

    /// <summary>
    /// Returns the list of past additional requirement requests for the logged-in exhibitor.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetMyRequests(CancellationToken ct)
    {
        var exhibitorId = GetExhibitorId();
        if (exhibitorId is null)
            return Forbid();

        var requests = await _db.ExhibitorAdditionalRequirements
            .AsNoTracking()
            .Include(r => r.Lines)
            .Include(r => r.Booking)
            .Where(r => r.ExhibitorId == exhibitorId && !r.IsDeleted)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ExhibitorRequirementDto(
                r.Id,
                r.ExhibitorId,
                r.BookingId,
                r.Booking != null ? r.Booking.BookingRegistrationNumber : "",
                r.Status.ToString(),
                r.TotalBaseAmount,
                r.TotalGstAmount,
                r.GrandTotal,
                r.CreatedAt,
                r.ConfirmedAt,
                r.CallNotes,
                r.Notes,
                r.Lines.Select(l => new ExhibitorRequirementLineDto(
                    l.Id,
                    l.ItemId,
                    l.ItemCode,
                    l.ItemName,
                    l.Quantity,
                    l.BaseAmount,
                    l.GstPercentage,
                    l.GstAmount,
                    l.TotalAmount)).ToList()))
            .ToListAsync(ct);

        return Ok(requests);
    }

    private Guid? GetExhibitorId()
    {
        var value = User.FindFirst("exhibitorId")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        return Guid.TryParse(value, out var id) ? id : null;
    }

    private static string BuildRequirementItemsHtmlTable(IEnumerable<ExhibitorAdditionalRequirementLine> lines)
    {
        var sb = new System.Text.StringBuilder();
        sb.Append(@"<table style=""width:100%; border-collapse:collapse; font-size:13px; margin: 10px 0; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;"">");
        sb.Append(@"<thead><tr style=""background:#f1f5f9; color:#334155; text-align:left;"">");
        sb.Append(@"<th style=""padding:8px 10px; border-bottom:1px solid #cbd5e1;"">Item</th>");
        sb.Append(@"<th style=""padding:8px 10px; border-bottom:1px solid #cbd5e1; text-align:center;"">Qty</th>");
        sb.Append(@"<th style=""padding:8px 10px; border-bottom:1px solid #cbd5e1; text-align:right;"">Base Price</th>");
        sb.Append(@"<th style=""padding:8px 10px; border-bottom:1px solid #cbd5e1; text-align:right;"">GST</th>");
        sb.Append(@"<th style=""padding:8px 10px; border-bottom:1px solid #cbd5e1; text-align:right;"">Total</th>");
        sb.Append(@"</tr></thead><tbody>");

        foreach (var l in lines)
        {
            sb.Append(@"<tr style=""border-bottom:1px solid #f1f5f9;"">");
            sb.Append($@"<td style=""padding:8px 10px; font-weight:bold; color:#1e293b;"">{l.ItemCode} &ndash; {l.ItemName}</td>");
            sb.Append($@"<td style=""padding:8px 10px; text-align:center; font-weight:bold;"">{l.Quantity}</td>");
            sb.Append($@"<td style=""padding:8px 10px; text-align:right;"">&#8377; {l.BaseAmount:N2}</td>");
            sb.Append($@"<td style=""padding:8px 10px; text-align:right;"">&#8377; {l.GstAmount:N2} ({l.GstPercentage}%)</td>");
            sb.Append($@"<td style=""padding:8px 10px; text-align:right; font-weight:bold; color:#0f172a;"">&#8377; {l.TotalAmount:N2}</td>");
            sb.Append(@"</tr>");
        }

        sb.Append(@"</tbody></table>");
        return sb.ToString();
    }
}
