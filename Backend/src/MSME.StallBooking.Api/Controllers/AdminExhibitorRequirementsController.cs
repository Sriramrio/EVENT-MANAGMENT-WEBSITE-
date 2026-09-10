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

public sealed record ToggleFeatureStatusRequest(bool Enabled);

public sealed record AdminRequirementRequestLineDto(
    Guid Id,
    Guid ItemId,
    string ItemCode,
    string ItemName,
    int Quantity,
    decimal BaseAmount,
    decimal GstPercentage,
    decimal GstAmount,
    decimal TotalAmount);

public sealed record AdminExhibitorRequirementDto(
    Guid Id,
    Guid ExhibitorId,
    string CompanyName,
    string? ContactPersonName,
    string? Mobile,
    string? Email,
    Guid BookingId,
    string BookingRegistrationNumber,
    string? StallNumber,
    string Status,
    decimal TotalBaseAmount,
    decimal TotalGstAmount,
    decimal GrandTotal,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ConfirmedAt,
    Guid? ConfirmedByUserId,
    string? CallNotes,
    string? Notes,
    List<AdminRequirementRequestLineDto> Lines,
    string? LegalName = null,
    string? TradeName = null,
    string? City = null,
    string? State = null,
    string? Gstin = null,
    string? Pan = null,
    string? StallSize = null);

public sealed record UpdateRequirementStatusRequest(string? CallNotes);

public sealed record CreateCatalogItemRequest(
    string Code,
    string Name,
    decimal BaseAmount,
    decimal GstPercentage,
    string? ImageUrl = null);

public sealed record UpdateCatalogItemRequest(
    string Name,
    decimal BaseAmount,
    decimal GstPercentage,
    string? ImageUrl = null,
    bool? IsActive = null);

public sealed record AdminExhibitorDto(
    Guid Id,
    string LegalName,
    string? TradeName,
    string RegisteredAddress,
    string City,
    string District,
    string State,
    string Pincode,
    string Country,
    string ContactPersonName,
    string ContactPersonDesignation,
    string Mobile,
    string? AlternateMobile,
    string Email,
    string? AlternateEmail,
    string? Website,
    string IndustryScale,
    string BusinessType,
    string CompanyConstitution,
    string IndustryCategory,
    string ProductServiceDescription,
    string ProductKeywords,
    string UdyamNumber,
    string? TanNumber,
    string Gstin,
    string Pan,
    bool LubMember,
    string LubState,
    string LubChapter,
    string? LubMembershipNumber,
    string? CompanyLogo,
    string? BankAccountName,
    string? BankName,
    string? BankAccountNumber,
    string? BankIfscCode,
    DateTimeOffset CreatedAt,
    Guid? BookingId,
    string? BookingRegistrationNumber,
    string? BookingStatus,
    string? StallNumber,
    string? RequestedStallSize,
    string? FasciaName,
    decimal? TotalAmount,
    decimal? TotalPaid,
    string? PaymentStatus);

[ApiController]
[Authorize]
[Route("api/v1/admin")]
public sealed class AdminExhibitorRequirementsController : ControllerBase
{
    private readonly StallBookingDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly IEmailComposer _emailComposer;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<AdminExhibitorRequirementsController> _logger;

    public AdminExhibitorRequirementsController(
        StallBookingDbContext db,
        IConfiguration configuration,
        IEmailComposer emailComposer,
        IEmailSender emailSender,
        ILogger<AdminExhibitorRequirementsController> logger)
    {
        _db = db;
        _configuration = configuration;
        _emailComposer = emailComposer;
        _emailSender = emailSender;
        _logger = logger;
    }

    #region Exhibitors Directory

    /// <summary>
    /// Returns all registered exhibitors enriched with booking, stall allocation, and payment details.
    /// </summary>
    [HttpGet("exhibitors")]
    public async Task<IActionResult> GetExhibitors(CancellationToken ct)
    {
        if (!IsAuthorizedAdmin())
            return Forbid();

        var bookings = await (
            from b in _db.StallBookings.AsNoTracking()
            join s in _db.Stalls.AsNoTracking() on b.AllocatedStallId equals s.Id
            join sz in _db.StallSizes.AsNoTracking() on b.RequestedStallSizeId equals sz.Id into szJoin
            from sz in szJoin.DefaultIfEmpty()
            where b.BookingStatus != BookingStatus.Cancelled
               && b.BookingStatus != BookingStatus.ReleasedDueToNonPayment
               && b.AllocatedStallId != null
               && s.StallNumber != null
            orderby b.CreatedAt descending
            select new
            {
                Booking = b,
                StallNumber = s.StallNumber,
                StallSizeName = sz != null ? (sz.DisplayName ?? sz.Code) : null,
                StallSizeTotal = sz != null ? sz.TotalAmount : 0m,
                IsSponsor = s.IsSponsor
            }
        ).ToListAsync(ct);

        var payments = await _db.Payments
            .AsNoTracking()
            .Where(p => p.VerificationStatus == PaymentVerificationStatus.Verified)
            .GroupBy(p => p.BookingId)
            .Select(g => new
            {
                BookingId = g.Key,
                TotalPaid = g.Sum(p => (decimal?)p.AmountPaid) ?? 0m,
                SponsorTarget = g.Where(p => p.TargetSponsorTotal.HasValue && p.TargetSponsorTotal.Value > 0)
                    .OrderByDescending(p => p.CreatedAt)
                    .Select(p => (decimal?)p.TargetSponsorTotal)
                    .FirstOrDefault()
            })
            .ToDictionaryAsync(g => g.BookingId, ct);

        var proformaSummary = await _db.ProformaInvoices
            .AsNoTracking()
            .Where(pi => pi.InvoiceStatus != InvoiceStatus.Cancelled)
            .GroupBy(pi => pi.BookingId)
            .Select(g => new
            {
                BookingId = g.Key,
                LatestTotalAmount = g.OrderByDescending(pi => pi.GeneratedAt).Select(pi => (decimal?)pi.TotalAmount).FirstOrDefault()
            })
            .ToDictionaryAsync(x => x.BookingId, x => x.LatestTotalAmount, ct);

        var bookingsByExhibitor = bookings
            .GroupBy(b => b.Booking.ExhibitorId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(b => payments.TryGetValue(b.Booking.Id, out var p) ? p.TotalPaid : 0m)
                      .ThenByDescending(b => b.Booking.BookingStatus == BookingStatus.Confirmed ? 1 : 0)
                      .ThenByDescending(b => b.Booking.CreatedAt)
                      .First()
            );

        var paidExhibitorIds = bookingsByExhibitor
            .Where(kvp => payments.TryGetValue(kvp.Value.Booking.Id, out var p) && p.TotalPaid > 0)
            .Select(kvp => kvp.Key)
            .ToHashSet();

        var exhibitors = await _db.Exhibitors
            .AsNoTracking()
            .Where(e => paidExhibitorIds.Contains(e.Id))
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync(ct);

        var result = new List<AdminExhibitorDto>(exhibitors.Count);
        foreach (var ex in exhibitors)
        {
            bookingsByExhibitor.TryGetValue(ex.Id, out var bInfo);

            Guid? bookingId = bInfo?.Booking.Id;
            string? bookingRegNumber = bInfo?.Booking.BookingRegistrationNumber;
            string? bookingStatus = bInfo?.Booking.BookingStatus.ToString();
            string? stallNumber = bInfo?.StallNumber;
            string? requestedStallSize = bInfo?.StallSizeName;
            string? fasciaName = bInfo?.Booking.FasciaName;

            decimal? totalAmount = null;
            decimal? totalPaid = null;
            string? paymentStatus = null;

            if (bInfo != null)
            {
                payments.TryGetValue(bInfo.Booking.Id, out var pay);
                proformaSummary.TryGetValue(bInfo.Booking.Id, out var prof);

                var paid = pay?.TotalPaid ?? 0m;
                var sponsorTarget = pay?.SponsorTarget;
                var isSponsor = bInfo.IsSponsor;

                decimal expectedTotal;
                if (isSponsor)
                {
                    if (sponsorTarget.HasValue && sponsorTarget.Value > 0)
                        expectedTotal = sponsorTarget.Value;
                    else if (prof.HasValue && prof.Value > 0)
                        expectedTotal = prof.Value;
                    else
                        expectedTotal = bInfo.StallSizeTotal;
                }
                else
                {
                    expectedTotal = bInfo.StallSizeTotal;
                }

                totalAmount = expectedTotal;
                totalPaid = paid;

                if (paid >= expectedTotal && expectedTotal > 0)
                {
                    paymentStatus = "Fully Paid";
                }
                else if (paid > 0)
                {
                    paymentStatus = "Partially Paid";
                }
                else
                {
                    paymentStatus = "Unpaid";
                }
            }

            // Strictly skip any unpaid exhibitors
            if (bInfo == null || (totalPaid ?? 0m) <= 0m || paymentStatus == "Unpaid")
            {
                continue;
            }

            result.Add(new AdminExhibitorDto(
                ex.Id,
                ex.LegalName ?? "",
                ex.TradeName,
                ex.RegisteredAddress ?? "",
                ex.City ?? "",
                ex.District ?? "",
                ex.State ?? "",
                ex.Pincode ?? "",
                ex.Country ?? "India",
                ex.ContactPersonName ?? "",
                ex.ContactPersonDesignation ?? "",
                ex.Mobile ?? "",
                ex.AlternateMobile,
                ex.Email ?? "",
                ex.AlternateEmail,
                ex.Website,
                ex.IndustryScale ?? "",
                ex.BusinessType ?? "",
                ex.CompanyConstitution ?? "",
                ex.IndustryCategory ?? "",
                ex.ProductServiceDescription ?? "",
                ex.ProductKeywords ?? "",
                ex.UdyamNumber ?? "",
                ex.TanNumber,
                ex.Gstin ?? "",
                ex.Pan ?? "",
                ex.LubMember,
                ex.LubState ?? "",
                ex.LubChapter ?? "",
                ex.LubMembershipNumber,
                ex.CompanyLogo,
                ex.BankAccountName,
                ex.BankName,
                ex.BankAccountNumber,
                ex.BankIfscCode,
                ex.CreatedAt,
                bookingId,
                bookingRegNumber,
                bookingStatus,
                stallNumber,
                requestedStallSize,
                fasciaName,
                totalAmount,
                totalPaid,
                paymentStatus
            ));
        }

        return Ok(result);
    }

    #endregion

    #region Exhibitor Requirement Requests Management

    /// <summary>
    /// Returns all exhibitor requirement requests with exhibitor, booking and line item details.
    /// Supports filtering by status and searching by company/phone/registration number.
    /// </summary>
    [HttpGet("exhibitor-requirements")]
    public async Task<IActionResult> GetRequirements(
        [FromQuery] string? status,
        [FromQuery] string? search,
        CancellationToken ct)
    {
        if (!IsAuthorizedAdmin())
            return Forbid();

        var query = _db.ExhibitorAdditionalRequirements
            .AsNoTracking()
            .Where(r => !r.IsDeleted)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && !string.Equals(status, "ALL", StringComparison.OrdinalIgnoreCase))
        {
            if (Enum.TryParse<AdditionalRequirementStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(r => r.Status == parsedStatus);
            }
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLowerInvariant();
            query = query.Where(r =>
                (r.Booking != null && r.Booking.BookingRegistrationNumber.ToLower().Contains(s)) ||
                (r.Exhibitor != null && (
                    (r.Exhibitor.TradeName != null && r.Exhibitor.TradeName.ToLower().Contains(s)) ||
                    (r.Exhibitor.LegalName != null && r.Exhibitor.LegalName.ToLower().Contains(s)) ||
                    (r.Exhibitor.ContactPersonName != null && r.Exhibitor.ContactPersonName.ToLower().Contains(s)) ||
                    (r.Exhibitor.Mobile != null && r.Exhibitor.Mobile.ToLower().Contains(s)) ||
                    (r.Exhibitor.Email != null && r.Exhibitor.Email.ToLower().Contains(s))
                ))
            );
        }

        var results = await (
            from r in query
            join b in _db.StallBookings.AsNoTracking() on r.BookingId equals b.Id into bJoin
            from b in bJoin.DefaultIfEmpty()
            join s in _db.Stalls.AsNoTracking() on b.AllocatedStallId equals s.Id into sJoin
            from s in sJoin.DefaultIfEmpty()
            join sz in _db.StallSizes.AsNoTracking() on b.RequestedStallSizeId equals sz.Id into szJoin
            from sz in szJoin.DefaultIfEmpty()
            orderby r.CreatedAt descending
            select new AdminExhibitorRequirementDto(
                r.Id,
                r.ExhibitorId,
                r.Exhibitor != null ? (!string.IsNullOrWhiteSpace(r.Exhibitor.TradeName) ? r.Exhibitor.TradeName : r.Exhibitor.LegalName) : "Unknown",
                r.Exhibitor != null ? r.Exhibitor.ContactPersonName : null,
                r.Exhibitor != null ? r.Exhibitor.Mobile : null,
                r.Exhibitor != null ? r.Exhibitor.Email : null,
                r.BookingId,
                b != null ? b.BookingRegistrationNumber : "",
                s != null ? s.StallNumber : null,
                r.Status.ToString(),
                r.TotalBaseAmount,
                r.TotalGstAmount,
                r.GrandTotal,
                r.CreatedAt,
                r.ConfirmedAt,
                r.ConfirmedByUserId,
                r.CallNotes,
                r.Notes,
                r.Lines.Select(l => new AdminRequirementRequestLineDto(
                    l.Id,
                    l.ItemId,
                    l.ItemCode,
                    l.ItemName,
                    l.Quantity,
                    l.BaseAmount,
                    l.GstPercentage,
                    l.GstAmount,
                    l.TotalAmount)).ToList(),
                r.Exhibitor != null ? r.Exhibitor.LegalName : null,
                r.Exhibitor != null ? r.Exhibitor.TradeName : null,
                r.Exhibitor != null ? r.Exhibitor.City : null,
                r.Exhibitor != null ? r.Exhibitor.State : null,
                r.Exhibitor != null ? r.Exhibitor.Gstin : null,
                r.Exhibitor != null ? r.Exhibitor.Pan : null,
                sz != null ? (sz.DisplayName ?? sz.Code) : null
            )
        ).ToListAsync(ct);

        return Ok(results);
    }

    /// <summary>
    /// Confirms an exhibitor additional requirement request with optional call notes, and sends email update.
    /// </summary>
    [HttpPost("exhibitor-requirements/{id:guid}/confirm")]
    public async Task<IActionResult> ConfirmRequirement(
        Guid id,
        [FromBody] UpdateRequirementStatusRequest? request,
        CancellationToken ct)
    {
        if (!IsAuthorizedAdmin())
            return Forbid();

        var req = await _db.ExhibitorAdditionalRequirements
            .Include(r => r.Exhibitor)
            .Include(r => r.Booking)
            .Include(r => r.Lines)
            .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted, ct);

        if (req is null)
            return NotFound(new { message = "Requirement request was not found." });

        var userId = GetCurrentUserId() ?? Guid.Empty;
        req.Confirm(userId, request?.CallNotes, "admin-action");
        await _db.SaveChangesAsync(ct);

        // Send Status Update Email to Exhibitor
        try
        {
            if (req.Exhibitor != null && !string.IsNullOrWhiteSpace(req.Exhibitor.Email))
            {
                var stall = req.Booking?.AllocatedStallId.HasValue == true
                    ? await _db.Stalls.AsNoTracking().FirstOrDefaultAsync(s => s.Id == req.Booking.AllocatedStallId.Value, ct)
                    : null;

                var itemsTableHtml = BuildRequirementItemsHtmlTable(req.Lines);
                var companyName = !string.IsNullOrWhiteSpace(req.Exhibitor.TradeName) ? req.Exhibitor.TradeName : req.Exhibitor.LegalName;

                var emailLog = _emailComposer.ComposeAdditionalRequirementsStatusUpdate(
                    req.TenantId,
                    req.EventId,
                    req.BookingId,
                    req.Exhibitor.Email.Trim(),
                    companyName,
                    req.Exhibitor.ContactPersonName ?? "Exhibitor",
                    req.Booking != null ? req.Booking.BookingRegistrationNumber : "",
                    stall?.StallNumber,
                    req.Id,
                    "Confirmed",
                    request?.CallNotes ?? "Your requirements have been confirmed by our operations team.",
                    req.TotalBaseAmount,
                    req.TotalGstAmount,
                    req.GrandTotal,
                    itemsTableHtml,
                    req.Notes);

                await _emailSender.SendEmailAsync(emailLog.ToEmail, emailLog.Subject, emailLog.BodySnapshot);
                await _db.EmailLogs.AddAsync(emailLog, ct);
                await _db.SaveChangesAsync(ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send confirmation email for requirement ID: {Id}", req.Id);
        }

        return Ok(new { message = "Requirement request confirmed successfully.", status = "Confirmed" });
    }

    /// <summary>
    /// Rejects an exhibitor additional requirement request with optional call notes, and sends email update.
    /// </summary>
    [HttpPost("exhibitor-requirements/{id:guid}/reject")]
    public async Task<IActionResult> RejectRequirement(
        Guid id,
        [FromBody] UpdateRequirementStatusRequest? request,
        CancellationToken ct)
    {
        if (!IsAuthorizedAdmin())
            return Forbid();

        var req = await _db.ExhibitorAdditionalRequirements
            .Include(r => r.Exhibitor)
            .Include(r => r.Booking)
            .Include(r => r.Lines)
            .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted, ct);

        if (req is null)
            return NotFound(new { message = "Requirement request was not found." });

        var userId = GetCurrentUserId() ?? Guid.Empty;
        req.Reject(userId, request?.CallNotes, "admin-action");
        await _db.SaveChangesAsync(ct);

        // Send Status Update Email to Exhibitor
        try
        {
            if (req.Exhibitor != null && !string.IsNullOrWhiteSpace(req.Exhibitor.Email))
            {
                var stall = req.Booking?.AllocatedStallId.HasValue == true
                    ? await _db.Stalls.AsNoTracking().FirstOrDefaultAsync(s => s.Id == req.Booking.AllocatedStallId.Value, ct)
                    : null;

                var itemsTableHtml = BuildRequirementItemsHtmlTable(req.Lines);
                var companyName = !string.IsNullOrWhiteSpace(req.Exhibitor.TradeName) ? req.Exhibitor.TradeName : req.Exhibitor.LegalName;

                var emailLog = _emailComposer.ComposeAdditionalRequirementsStatusUpdate(
                    req.TenantId,
                    req.EventId,
                    req.BookingId,
                    req.Exhibitor.Email.Trim(),
                    companyName,
                    req.Exhibitor.ContactPersonName ?? "Exhibitor",
                    req.Booking != null ? req.Booking.BookingRegistrationNumber : "",
                    stall?.StallNumber,
                    req.Id,
                    "Rejected",
                    request?.CallNotes ?? "Your requirement request could not be accommodated.",
                    req.TotalBaseAmount,
                    req.TotalGstAmount,
                    req.GrandTotal,
                    itemsTableHtml,
                    req.Notes);

                await _emailSender.SendEmailAsync(emailLog.ToEmail, emailLog.Subject, emailLog.BodySnapshot);
                await _db.EmailLogs.AddAsync(emailLog, ct);
                await _db.SaveChangesAsync(ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send rejection email for requirement ID: {Id}", req.Id);
        }

        return Ok(new { message = "Requirement request rejected.", status = "Rejected" });
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

    #endregion

    #region Catalog Item Management

    /// <summary>
    /// Lists all catalog items including active and inactive ones.
    /// </summary>
    [HttpGet("additional-requirement-items")]
    public async Task<IActionResult> GetCatalogItems(CancellationToken ct)
    {
        if (!IsAuthorizedAdmin())
            return Forbid();

        var items = await _db.AdditionalRequirementItems
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
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
    /// Creates a new catalog item. Validates code uniqueness, baseAmount > 0, gstPercentage >= 0.
    /// </summary>
    [HttpPost("additional-requirement-items")]
    public async Task<IActionResult> CreateCatalogItem(
        [FromBody] CreateCatalogItemRequest request,
        CancellationToken ct)
    {
        if (!IsAuthorizedAdmin())
            return Forbid();

        if (request is null || string.IsNullOrWhiteSpace(request.Code) || string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Code and Name are required." });

        if (request.BaseAmount <= 0)
            return BadRequest(new { message = "Base amount must be greater than zero." });

        if (request.GstPercentage < 0)
            return BadRequest(new { message = "GST percentage cannot be negative." });

        var code = request.Code.Trim().ToUpperInvariant();
        var codeExists = await _db.AdditionalRequirementItems.AnyAsync(x => x.Code == code && !x.IsDeleted, ct);
        if (codeExists)
            return BadRequest(new { message = $"Item with code '{code}' already exists." });

        var tenant = await _db.Tenants.FirstOrDefaultAsync(ct);
        var tenantId = tenant?.Id ?? Guid.Parse("11111111-1111-1111-1111-111111111111");

        var item = AdditionalRequirementItem.Create(
            tenantId,
            null,
            code,
            request.Name,
            request.BaseAmount,
            request.GstPercentage,
            request.ImageUrl,
            GetCurrentUserId(),
            "admin-catalog");

        await _db.AdditionalRequirementItems.AddAsync(item, ct);
        await _db.SaveChangesAsync(ct);

        var dto = new AdditionalRequirementCatalogItemDto(
            item.Id,
            item.Code,
            item.Name,
            item.BaseAmount,
            item.GstPercentage,
            Math.Round(item.BaseAmount * (item.GstPercentage / 100m), 2),
            item.BaseAmount + Math.Round(item.BaseAmount * (item.GstPercentage / 100m), 2),
            item.ImageUrl,
            item.IsActive);

        return Created($"/api/v1/admin/additional-requirement-items/{item.Id}", dto);
    }

    /// <summary>
    /// Updates an existing catalog item's name, base amount, and GST percentage.
    /// </summary>
    [HttpPut("additional-requirement-items/{id:guid}")]
    public async Task<IActionResult> UpdateCatalogItem(
        Guid id,
        [FromBody] UpdateCatalogItemRequest request,
        CancellationToken ct)
    {
        if (!IsAuthorizedAdmin())
            return Forbid();

        if (request is null || string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Name is required." });

        if (request.BaseAmount <= 0)
            return BadRequest(new { message = "Base amount must be greater than zero." });

        if (request.GstPercentage < 0)
            return BadRequest(new { message = "GST percentage cannot be negative." });

        var item = await _db.AdditionalRequirementItems.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, ct);
        if (item is null)
            return NotFound(new { message = "Catalog item was not found." });

        item.Update(request.Name, request.BaseAmount, request.GstPercentage, request.ImageUrl, request.IsActive, GetCurrentUserId(), "admin-catalog");
        await _db.SaveChangesAsync(ct);

        var dto = new AdditionalRequirementCatalogItemDto(
            item.Id,
            item.Code,
            item.Name,
            item.BaseAmount,
            item.GstPercentage,
            Math.Round(item.BaseAmount * (item.GstPercentage / 100m), 2),
            item.BaseAmount + Math.Round(item.BaseAmount * (item.GstPercentage / 100m), 2),
            item.ImageUrl,
            item.IsActive);

        return Ok(dto);
    }

    /// <summary>
    /// Soft deletes/deactivates a catalog item. It will no longer appear in the exhibitor catalog,
    /// but past requests referencing it remain intact.
    /// </summary>
    [HttpPatch("additional-requirement-items/{id:guid}/deactivate")]
    public async Task<IActionResult> DeactivateCatalogItem(Guid id, CancellationToken ct)
    {
        if (!IsAuthorizedAdmin())
            return Forbid();

        var item = await _db.AdditionalRequirementItems.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, ct);
        if (item is null)
            return NotFound(new { message = "Catalog item was not found." });

        item.Deactivate(GetCurrentUserId(), "admin-catalog");
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Item deactivated successfully.", isActive = false });
    }

    /// <summary>
    /// Reactivates a deactivated catalog item so it appears in the exhibitor catalog again.
    /// </summary>
    [HttpPatch("additional-requirement-items/{id:guid}/activate")]
    public async Task<IActionResult> ActivateCatalogItem(Guid id, CancellationToken ct)
    {
        if (!IsAuthorizedAdmin())
            return Forbid();

        var item = await _db.AdditionalRequirementItems.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, ct);
        if (item is null)
            return NotFound(new { message = "Catalog item was not found." });

        item.Activate(GetCurrentUserId(), "admin-catalog");
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Item activated successfully.", isActive = true });
    }

    /// <summary>
    /// Returns whether the Exhibitor Additional Requirements feature flow is enabled.
    /// </summary>
    [HttpGet("exhibitor-requirements/feature-status")]
    public async Task<IActionResult> GetFeatureStatus(CancellationToken ct)
    {
        var setting = await _db.ReferenceData
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Kind == "FEATURETOGGLE" && r.Code == "REQUIREMENTS_PORTAL_ENABLED", ct);

        var isEnabled = setting == null || setting.IsActive;
        return Ok(new { enabled = isEnabled });
    }

    /// <summary>
    /// Enables or disables the Exhibitor Additional Requirements flow.
    /// Accessible by SuperAdmin, ExhibitorAdmin and EventAdmin.
    /// </summary>
    [HttpPost("exhibitor-requirements/feature-status")]
    public async Task<IActionResult> UpdateFeatureStatus([FromBody] ToggleFeatureStatusRequest request, CancellationToken ct)
    {
        if (!IsAuthorizedAdmin())
            return Forbid();

        var setting = await _db.ReferenceData
            .FirstOrDefaultAsync(r => r.Kind == "FEATURETOGGLE" && r.Code == "REQUIREMENTS_PORTAL_ENABLED", ct);

        if (setting == null)
        {
            setting = ReferenceDataItem.Create("FEATURETOGGLE", "REQUIREMENTS_PORTAL_ENABLED", "Exhibitor Additional Requirements Portal Active", 1);
            setting.SetActive(request.Enabled);
            await _db.ReferenceData.AddAsync(setting, ct);
        }
        else
        {
            setting.SetActive(request.Enabled);
        }

        await _db.SaveChangesAsync(ct);
        return Ok(new
        {
            enabled = setting.IsActive,
            message = $"Requirements flow has been {(setting.IsActive ? "enabled" : "disabled")} successfully."
        });
    }

    #endregion

    private bool IsAuthorizedAdmin()
    {
        var role = User.FindFirst("role")?.Value
            ?? User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.Equals(role, "SuperAdmin", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(role, "ExhibitorAdmin", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(role, "EventAdmin", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        var permissions = User.Claims
            .Where(c => c.Type == "permission")
            .Select(c => c.Value)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return permissions.Contains(MSME.StallBooking.Application.Security.Permissions.ExhibitorRequirementsManage) ||
               permissions.Contains(MSME.StallBooking.Application.Security.Permissions.AdminUsersManage) ||
               permissions.Contains(MSME.StallBooking.Application.Security.Permissions.DashboardView);
    }

    private Guid? GetCurrentUserId()
    {
        var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(value, out var id) ? id : null;
    }
}
