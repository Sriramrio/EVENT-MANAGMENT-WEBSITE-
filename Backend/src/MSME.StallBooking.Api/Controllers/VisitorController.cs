using Microsoft.AspNetCore.Mvc;
using MSME.StallBooking.Application.Abstractions;
using MSME.StallBooking.Application.Contracts;
using MSME.StallBooking.Application.Services;
using MSME.StallBooking.Domain.Entities;
using static MSME.StallBooking.Domain.Entities.BillingProfile;
using MSME.StallBooking.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using StallBookingEntity = MSME.StallBooking.Domain.Entities.StallBooking;

namespace MSME.StallBooking.Api.Controllers;

[ApiController]
[Route("api/v1/visitors")]
public sealed class VisitorController : ControllerBase
{
    private readonly VisitorWorkflowService _visitorWorkflowService;
    private readonly IUnitOfWork _uow;
    private readonly IConfiguration _configuration;
    private readonly StallBookingDbContext _db;

    public VisitorController(
        VisitorWorkflowService visitorWorkflowService,
        IUnitOfWork uow,
        IConfiguration configuration,
        StallBookingDbContext db)
    {
        _visitorWorkflowService = visitorWorkflowService;
        _uow = uow;
        _configuration = configuration;
        _db = db;
    }

    [HttpPost("public/login")]
    public async Task<IActionResult> Login([FromBody] VisitorLoginRequest request, CancellationToken ct)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.RegistrationNumber) || string.IsNullOrWhiteSpace(request.Mobile))
            return BadRequest(new { message = "Registration number and mobile number are required." });

        var reg = request.RegistrationNumber.Trim().ToUpperInvariant();
        var mobileDigits = new string(request.Mobile.Where(char.IsDigit).ToArray());

        var query = _uow.Visitors.Query().AsNoTracking();
        if (request.TenantId.HasValue && request.TenantId.Value != Guid.Empty)
        {
            query = query.Where(v => v.TenantId == request.TenantId.Value);
        }

        // Match full registration number or last 4 digits (or ending with input)
        var candidates = await query
            .Where(v => v.BookingRegistrationNumber == reg || v.BookingRegistrationNumber.EndsWith(reg))
            .ToListAsync(ct);

        if (!candidates.Any())
            return Unauthorized(new { message = "We couldn't find a visitor registration with that number." });

        var visitor = candidates.FirstOrDefault(v =>
        {
            var vMobile = new string((v.Mobile ?? "").Where(char.IsDigit).ToArray());
            return vMobile.Length > 0 &&
                (vMobile == mobileDigits || vMobile.EndsWith(mobileDigits) || mobileDigits.EndsWith(vMobile));
        });

        if (visitor is null)
            return Unauthorized(new { message = "The mobile number does not match our records for this registration number." });

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["Jwt:SigningKey"] ?? "CHANGE_THIS_DEVELOPMENT_SIGNING_KEY_MINIMUM_32_CHARS"));

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, visitor.Id.ToString()),
            new("scope", "visitor"),
            new("visitorId", visitor.Id.ToString()),
            new("registrationNumber", visitor.BookingRegistrationNumber),
            new("tenantId", visitor.TenantId.ToString())
        };

        var token = new JwtSecurityToken(
            _configuration["Jwt:Issuer"],
            _configuration["Jwt:Audience"],
            claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return Ok(new
        {
            token = new JwtSecurityTokenHandler().WriteToken(token),
            visitorId = visitor.Id,
            registrationNumber = visitor.BookingRegistrationNumber,
            legalName = visitor.LegalName,
            contactPersonName = visitor.ContactPersonName
        });
    }

    [HttpGet("{visitorId:guid}/connections")]
    [HttpGet("/api/v1/public/visitors/{visitorId:guid}/connections")]
    public async Task<IActionResult> GetVisitorConnections([FromRoute] Guid visitorId, CancellationToken ct)
    {
        var visitor = await _db.Visitors.AsNoTracking().FirstOrDefaultAsync(v => v.Id == visitorId, ct);
        if (visitor is null)
            return NotFound(new { message = "Visitor profile not found." });

        var vMobile = visitor.Mobile?.Trim();
        var vEmail = visitor.Email?.Trim();

        var interests = await _db.StallInterests
            .AsNoTracking()
            .Where(i => !i.IsDeleted &&
                ((vMobile != null && vMobile.Length > 0 && i.VisitorMobile == vMobile) ||
                 (vEmail != null && vEmail.Length > 0 && i.VisitorEmail == vEmail)))
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(ct);

        if (!interests.Any())
        {
            return Ok(new
            {
                totalConnections = 0,
                connectedExhibitors = Array.Empty<object>(),
                connectedVisitors = Array.Empty<object>(),
                connections = Array.Empty<object>()
            });
        }

        // 1. Separate V2V (Visitor to Visitor) and Exhibitor interests
        var v2vInterests = interests.Where(i => i.CorrelationId != null && i.CorrelationId.StartsWith("V2V:")).ToList();
        var exhibitorInterests = interests.Where(i => i.CorrelationId == null || !i.CorrelationId.StartsWith("V2V:")).ToList();

        // 2. Fetch Connected Visitors
        var otherVisitorIds = v2vInterests
            .Select(i => Guid.TryParse(i.CorrelationId!.Substring(4), out var gid) ? gid : Guid.Empty)
            .Where(gid => gid != Guid.Empty)
            .Distinct()
            .ToList();

        var otherVisitors = otherVisitorIds.Any()
            ? await _db.Visitors.AsNoTracking().Where(v => otherVisitorIds.Contains(v.Id)).ToListAsync(ct)
            : new List<Visitor>();

        var connectedVisitors = v2vInterests.Select(i =>
        {
            Guid.TryParse(i.CorrelationId?.Substring(4), out var otherId);
            var other = otherVisitors.FirstOrDefault(v => v.Id == otherId);
            return new
            {
                id = i.Id,
                visitorId = other?.Id ?? otherId,
                registrationNumber = other?.BookingRegistrationNumber ?? "VIS-N/A",
                name = other?.ContactPersonName ?? i.VisitorName ?? other?.LegalName ?? "Visitor",
                companyName = other?.LegalName ?? other?.TradeName,
                designation = other?.ContactPersonDesignation,
                mobile = other?.Mobile ?? i.VisitorMobile,
                email = other?.Email ?? i.VisitorEmail,
                city = other?.City,
                district = other?.District,
                state = other?.State,
                industryCategory = other?.IndustryCategory,
                connectedAt = i.CreatedAt.ToString("o")
            };
        }).ToList();

        // 3. Fetch Connected Exhibitors
        var exhibitorIds = exhibitorInterests.Select(i => i.ExhibitorId).Where(e => e != Guid.Empty).Distinct().ToList();
        var exhibitors = exhibitorIds.Any()
            ? await _db.Exhibitors.AsNoTracking().Where(e => exhibitorIds.Contains(e.Id)).ToListAsync(ct)
            : new List<Exhibitor>();

        var bookingIds = exhibitorInterests.Select(i => i.StallBookingId).Where(b => b != Guid.Empty).Distinct().ToList();
        var bookings = await _db.StallBookings
            .AsNoTracking()
            .Where(b => bookingIds.Contains(b.Id) || exhibitorIds.Contains(b.ExhibitorId))
            .ToListAsync(ct);

        var stallIds = bookings.Where(b => b.AllocatedStallId.HasValue).Select(b => b.AllocatedStallId!.Value).Distinct().ToList();
        var stalls = stallIds.Any()
            ? await _db.Stalls.AsNoTracking().Where(s => stallIds.Contains(s.Id)).ToListAsync(ct)
            : new List<Stall>();

        var connectedExhibitors = exhibitorInterests.Select(i =>
        {
            var exhibitor = exhibitors.FirstOrDefault(e => e.Id == i.ExhibitorId);
            var booking = bookings.FirstOrDefault(b => b.Id == i.StallBookingId || b.ExhibitorId == i.ExhibitorId);
            var stall = booking?.AllocatedStallId.HasValue == true
                ? stalls.FirstOrDefault(s => s.Id == booking.AllocatedStallId.Value)
                : null;

            var companyName = !string.IsNullOrWhiteSpace(exhibitor?.TradeName)
                ? exhibitor.TradeName
                : (!string.IsNullOrWhiteSpace(exhibitor?.LegalName) ? exhibitor.LegalName : (booking?.FasciaName ?? "Exhibitor"));

            return new
            {
                id = i.Id,
                exhibitorId = i.ExhibitorId.ToString(),
                companyName,
                companyLogo = exhibitor?.CompanyLogo,
                industryCategory = exhibitor?.IndustryCategory,
                contactPersonName = exhibitor?.ContactPersonName,
                contactPersonDesignation = exhibitor?.ContactPersonDesignation,
                mobile = exhibitor?.Mobile,
                email = exhibitor?.Email,
                city = exhibitor?.City,
                district = exhibitor?.District,
                state = exhibitor?.State,
                stallNumber = stall?.StallNumber,
                fasciaName = booking?.FasciaName,
                registrationNumber = booking?.BookingRegistrationNumber,
                connectedAt = i.CreatedAt.ToString("o")
            };
        }).ToList();

        return Ok(new
        {
            totalConnections = connectedExhibitors.Count + connectedVisitors.Count,
            connectedExhibitors,
            connectedVisitors,
            connections = connectedExhibitors
        });
    }

    [HttpPost("public/visitors/scan")]
    [HttpPost("connections/scan")]
    public async Task<IActionResult> ScanConnection([FromBody] VisitorScanRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request?.RegistrationNumber))
            return BadRequest(new { message = "Registration number or QR code is required." });

        var rawInput = request.RegistrationNumber.Trim();
        var reg = rawInput.ToUpperInvariant();

        var verifyIdx = reg.IndexOf("/VISITORVERIFICATION/", StringComparison.OrdinalIgnoreCase);
        if (verifyIdx >= 0)
        {
            reg = reg.Substring(verifyIdx + "/VISITORVERIFICATION/".Length).Trim('/');
        }
        else
        {
            var stallIdx = reg.IndexOf("/STALL/", StringComparison.OrdinalIgnoreCase);
            if (stallIdx >= 0)
            {
                reg = reg.Substring(stallIdx + "/STALL/".Length).Trim('/');
            }
            else if (reg.Contains('/'))
            {
                reg = reg.Substring(reg.LastIndexOf('/') + 1).Trim();
            }
        }

        Guid? currentVisitorId = request.VisitorId;
        if (currentVisitorId is null || currentVisitorId == Guid.Empty)
        {
            var claimVal = User.FindFirst("visitorId")?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;
            if (Guid.TryParse(claimVal, out var parsedClaimId))
            {
                currentVisitorId = parsedClaimId;
            }
        }

        Visitor? currentVisitor = null;
        if (currentVisitorId.HasValue && currentVisitorId != Guid.Empty)
        {
            currentVisitor = await _db.Visitors.FirstOrDefaultAsync(v => v.Id == currentVisitorId.Value, ct);
        }

        // 1. Check if scanned code matches another VISITOR
        var scannedVisitor = await _db.Visitors
            .AsNoTracking()
            .FirstOrDefaultAsync(v => (v.BookingRegistrationNumber == reg || v.BookingRegistrationNumber.EndsWith(reg))
                && (currentVisitor == null || v.Id != currentVisitor.Id), ct);

        if (scannedVisitor is not null)
        {
            if (currentVisitor is not null)
            {
                var existingV2V = await _db.StallInterests
                    .FirstOrDefaultAsync(i => i.VisitorMobile == currentVisitor.Mobile &&
                        i.CorrelationId == $"V2V:{scannedVisitor.Id}", ct);

                if (existingV2V is null)
                {
                    var interest1 = StallInterest.Create(
                        currentVisitor.TenantId,
                        currentVisitor.EventId,
                        Guid.Empty,
                        Guid.Empty,
                        scannedVisitor.ContactPersonName ?? scannedVisitor.LegalName,
                        currentVisitor.Mobile,
                        currentVisitor.Email,
                        $"V2V:{scannedVisitor.Id}");

                    await _db.StallInterests.AddAsync(interest1, ct);

                    var existingReciprocal = await _db.StallInterests
                        .FirstOrDefaultAsync(i => i.VisitorMobile == scannedVisitor.Mobile &&
                            i.CorrelationId == $"V2V:{currentVisitor.Id}", ct);

                    if (existingReciprocal is null)
                    {
                        var interest2 = StallInterest.Create(
                            scannedVisitor.TenantId,
                            scannedVisitor.EventId,
                            Guid.Empty,
                            Guid.Empty,
                            currentVisitor.ContactPersonName ?? currentVisitor.LegalName,
                            scannedVisitor.Mobile,
                            scannedVisitor.Email,
                            $"V2V:{currentVisitor.Id}");

                        await _db.StallInterests.AddAsync(interest2, ct);
                    }

                    await _db.SaveChangesAsync(ct);
                }
            }

            return Ok(new
            {
                type = "VISITOR",
                id = scannedVisitor.Id,
                visitorId = scannedVisitor.Id,
                registrationNumber = scannedVisitor.BookingRegistrationNumber,
                name = scannedVisitor.ContactPersonName ?? scannedVisitor.LegalName,
                companyName = scannedVisitor.LegalName ?? scannedVisitor.TradeName,
                designation = scannedVisitor.ContactPersonDesignation,
                email = scannedVisitor.Email,
                mobile = scannedVisitor.Mobile,
                city = scannedVisitor.City,
                district = scannedVisitor.District,
                state = scannedVisitor.State,
                industryCategory = scannedVisitor.IndustryCategory,
                connectedAt = DateTime.UtcNow
            });
        }

        // 2. Check if scanned code matches an EXHIBITOR / STALL
        var booking = await _db.StallBookings
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.BookingRegistrationNumber == reg || b.BookingRegistrationNumber.EndsWith(reg), ct);

        if (booking is null)
        {
            var stall = await _db.Stalls.AsNoTracking().FirstOrDefaultAsync(s => s.StallNumber == reg, ct);
            if (stall is not null)
            {
                booking = await _db.StallBookings.AsNoTracking().FirstOrDefaultAsync(b => b.AllocatedStallId == stall.Id, ct);
            }
        }

        if (booking is not null)
        {
            var exhibitor = await _db.Exhibitors.AsNoTracking().FirstOrDefaultAsync(e => e.Id == booking.ExhibitorId, ct);
            var stall = booking.AllocatedStallId.HasValue
                ? await _db.Stalls.AsNoTracking().FirstOrDefaultAsync(s => s.Id == booking.AllocatedStallId.Value, ct)
                : null;

            if (currentVisitor is not null && exhibitor is not null)
            {
                var existingInterest = await _db.StallInterests
                    .FirstOrDefaultAsync(i => i.ExhibitorId == exhibitor.Id &&
                        ((!string.IsNullOrWhiteSpace(currentVisitor.Mobile) && i.VisitorMobile == currentVisitor.Mobile) ||
                         (!string.IsNullOrWhiteSpace(currentVisitor.Email) && i.VisitorEmail == currentVisitor.Email)), ct);

                if (existingInterest is null)
                {
                    var newInterest = StallInterest.Create(
                        currentVisitor.TenantId,
                        currentVisitor.EventId,
                        booking.Id,
                        exhibitor.Id,
                        currentVisitor.ContactPersonName ?? currentVisitor.LegalName,
                        currentVisitor.Mobile,
                        currentVisitor.Email);

                    await _db.StallInterests.AddAsync(newInterest, ct);
                    await _db.SaveChangesAsync(ct);
                }
            }

            var companyName = !string.IsNullOrWhiteSpace(exhibitor?.TradeName)
                ? exhibitor.TradeName
                : (!string.IsNullOrWhiteSpace(exhibitor?.LegalName) ? exhibitor.LegalName : booking.FasciaName);

            return Ok(new
            {
                type = "EXHIBITOR",
                id = exhibitor?.Id ?? booking.Id,
                exhibitorId = exhibitor?.Id.ToString(),
                registrationNumber = booking.BookingRegistrationNumber,
                companyName,
                fasciaName = booking.FasciaName,
                stallNumber = stall?.StallNumber,
                companyLogo = exhibitor?.CompanyLogo,
                contactPersonName = exhibitor?.ContactPersonName,
                contactPersonDesignation = exhibitor?.ContactPersonDesignation,
                email = exhibitor?.Email,
                mobile = exhibitor?.Mobile,
                city = exhibitor?.City,
                district = exhibitor?.District,
                state = exhibitor?.State,
                industryCategory = exhibitor?.IndustryCategory,
                connectedAt = DateTime.UtcNow
            });
        }

        return NotFound(new { message = $"No visitor or exhibitor found matching '{reg}'." });
    }

    [HttpPost]
    public async Task<ActionResult<CreateVisitorResult>> Create([FromBody] CreateVisitorCommand command, CancellationToken ct)
    {
        var result = await _visitorWorkflowService.SubmitVisitorRegistrationAsync(command, ct);
        return CreatedAtAction(nameof(GetByRegistrationNumber),
            new { registrationNumber = result.BookingRegistrationNumber, tenantId = command.TenantId }, result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid tenantId,
        [FromQuery] Guid eventId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty || eventId == Guid.Empty)
        {
            return BadRequest(new { message = "Both tenantId and eventId query parameters are required." });
        }

        var visitors = await _uow.Visitors.GetAllAsync(tenantId, eventId, ct);

        var result = visitors.Select(visitor => new
        {
            id = visitor.Id,
            registrationNumber = visitor.BookingRegistrationNumber,
            legalName = visitor.LegalName,
            tradeName = visitor.TradeName,
            contactPersonName = visitor.ContactPersonName,
            contactPersonDesignation = visitor.ContactPersonDesignation,
            email = visitor.Email,
            mobile = visitor.Mobile,
            city = visitor.City,
            district = visitor.District,
            state = visitor.State,
            industryCategory = visitor.IndustryCategory,
            businessType = visitor.BusinessType,
            createdAt = visitor.CreatedAt
        });

        return Ok(result);
    }


    [HttpGet("{registrationNumber}")]
    public async Task<IActionResult> GetByRegistrationNumber(string registrationNumber, [FromQuery] Guid tenantId, CancellationToken ct)
    {
        var visitor = await _uow.Visitors.GetByRegistrationNumberAsync(tenantId, registrationNumber, ct);
        if (visitor is null) return NotFound();
        return Ok(new
        {
            id = visitor.Id,
            registrationNumber = visitor.BookingRegistrationNumber,
            legalName = visitor.LegalName,
            contactPersonName = visitor.ContactPersonName,
            email = visitor.Email,
            mobile = visitor.Mobile
        });
    }
    [HttpPost("checkin")]
    public async Task<ActionResult<CheckInVisitorResult>> CheckIn([FromBody] CheckInVisitorRequest request, CancellationToken ct)
    {
        var actorClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        Guid? actorUserId = Guid.TryParse(actorClaim, out var parsedActorId) ? parsedActorId : null;
        var result = await _visitorWorkflowService.CheckInAsync(request.TenantId, request.RegistrationNumber, actorUserId, ct);
        return Ok(result);
    }

    [HttpGet("present")]
    public async Task<ActionResult<IReadOnlyList<VisitorDto>>> GetPresent(
        [FromQuery] Guid tenantId, [FromQuery] Guid eventId, CancellationToken ct)
    {
        if (tenantId == Guid.Empty || eventId == Guid.Empty)
            return BadRequest(new { message = "Both tenantId and eventId query parameters are required." });
        var result = await _visitorWorkflowService.GetPresentVisitorsAsync(tenantId, eventId, ct);
        return Ok(result);
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardSummary(
        [FromQuery] Guid tenantId,
        [FromQuery] Guid eventId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty || eventId == Guid.Empty)
        {
            return BadRequest(new { message = "Both tenantId and eventId query parameters are required." });
        }

        var visitors = await _uow.Visitors.GetAllAsync(tenantId, eventId, ct);
        var visitorList = visitors.ToList();

        var summary = new VisitorDashboardSummaryDto
        {
            TotalVisitors = visitorList.Count,

            VisitorsByIndustryCategory = visitorList
                .Where(v => !string.IsNullOrWhiteSpace(v.IndustryCategory))
                .GroupBy(v => v.IndustryCategory)
                .ToDictionary(g => g.Key, g => g.Count()),

            VisitorsByState = visitorList
                .Where(v => !string.IsNullOrWhiteSpace(v.District))
                .GroupBy(v => v.District)
                .ToDictionary(g => g.Key, g => g.Count()),

            RecentVisitors = visitorList
                .OrderByDescending(v => v.CreatedAt)
                .Take(5)
                .Select(v => new RecentVisitorDto
                {
                    Id = v.Id,
                    RegistrationNumber = v.BookingRegistrationNumber,
                    LegalName = v.LegalName,
                    ContactPersonName = v.ContactPersonName,
                    Mobile = v.Mobile,
                    City = v.City,
                    CreatedAt = v.CreatedAt.DateTime
                })
        };

        return Ok(summary);
    }


    [HttpPost("{visitorId:guid}/send-invite")]
    public async Task<IActionResult> SendSingleWarmupInvite(
        [FromRoute] Guid visitorId,
        [FromBody] SendSingleVisitorWarmupInviteCommand command,
        CancellationToken ct)
    {
        if (command.TenantId == Guid.Empty || command.EventId == Guid.Empty)
        {
            return BadRequest(new { message = "TenantId and EventId are required." });
        }

        var visitor = await _uow.Visitors.GetByIdAsync(visitorId, ct);
        if (visitor is null)
        {
            return NotFound(new { message = "Visitor not found." });
        }

        // Generate warm-up subject & body dynamically based on user selection
        var (subject, body) = BuildWarmupMessage(
            visitor.ContactPersonName ?? visitor.LegalName,
            command.CountdownType,
            command.DaysRemaining,
            command.CustomMessage
        );

        // Execute dispatch via your workflow/notification service
        await _visitorWorkflowService.SendVisitorNotificationAsync(visitor, subject, body, ct);

        return Ok(new
        {
            message = "Warm-up invitation sent successfully.",
            visitorId = visitor.Id,
            recipientEmail = visitor.Email,
            subject
        });
    }

    /// <summary>
    /// Sends warm-up invitation email/SMS in bulk to all visitors for an event.
    /// </summary>
    [HttpPost("send-bulk-invite")]
    public async Task<IActionResult> SendBulkWarmupInvite(
        [FromBody] SendVisitorWarmupInviteCommand command,
        CancellationToken ct)
    {
        if (command.TenantId == Guid.Empty || command.EventId == Guid.Empty)
        {
            return BadRequest(new { message = "TenantId and EventId are required." });
        }

        var visitors = (await _uow.Visitors.GetAllAsync(command.TenantId, command.EventId, ct)).ToList();
        if (!visitors.Any())
        {
            return Ok(new InviteBroadcastResult { TotalTargeted = 0, SuccessfullySent = 0, Failed = 0 });
        }

        int successCount = 0;
        int failCount = 0;

        foreach (var visitor in visitors)
        {
            try
            {
                var (subject, body) = BuildWarmupMessage(
                    visitor.ContactPersonName ?? visitor.LegalName,
                    command.CountdownType,
                    command.DaysRemaining,
                    command.CustomMessage
                );

                await _visitorWorkflowService.SendVisitorNotificationAsync(visitor, subject, body, ct);
                successCount++;
            }
            catch
            {
                failCount++;
            }
        }

        return Ok(new InviteBroadcastResult
        {
            TotalTargeted = visitors.Count,
            SuccessfullySent = successCount,
            Failed = failCount,
            TemplateUsed = command.CountdownType == WarmupCountdownType.Today
                ? "Event Today Warm-up"
                : $"{command.DaysRemaining} Days To Go Warm-up"
        });
    }

    private static (string Subject, string Body) BuildWarmupMessage(
        string recipientName,
        WarmupCountdownType type,
        int? daysRemaining,
        string? customMessage)
    {
        if (type == WarmupCountdownType.Today)
        {
            return (
                "🎉 The Event is TODAY! Welcome to MSME Expo",
                $"Hello {recipientName},\n\nThe wait is over! The event is happening TODAY. We are excited to welcome you. Please keep your QR pass ready at the entry gate.\n\n{customMessage}"
            );
        }

        int days = daysRemaining ?? 1;
        string dayText = days == 1 ? "1 Day" : $"{days} Days";

        return (
            $"Just {dayText} to Go! We are excited to welcome you",
            $"Hello {recipientName},\n\nOnly {dayText} remaining for the upcoming MSME Expo! Get ready to explore exciting stalls and connect with industry leaders.\n\n{customMessage}"
        );
    }
}

public sealed record CheckInVisitorRequest(Guid TenantId, string RegistrationNumber);

public sealed record VisitorDashboardSummaryDto
{
    public int TotalVisitors { get; init; }
    public Dictionary<string, int> VisitorsByIndustryCategory { get; init; } = new();
    public Dictionary<string, int> VisitorsByState { get; init; } = new();
    public IEnumerable<RecentVisitorDto> RecentVisitors { get; init; } = Array.Empty<RecentVisitorDto>();
}

public sealed record RecentVisitorDto
{
    public Guid Id { get; init; }
    public string RegistrationNumber { get; init; } = string.Empty;
    public string LegalName { get; init; } = string.Empty;
    public string ContactPersonName { get; init; } = string.Empty;
    public string Mobile { get; init; } = string.Empty;
    public string City { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}


public enum WarmupCountdownType
{
    DaysToGo = 1,
    Today = 2
}

public sealed record SendVisitorWarmupInviteCommand
{
    public Guid TenantId { get; init; }
    public Guid EventId { get; init; }
    public WarmupCountdownType CountdownType { get; init; } = WarmupCountdownType.DaysToGo;
    public int? DaysRemaining { get; init; } // e.g., 10, 5, 1 (Ignored if CountdownType is Today)
    public string? CustomMessage { get; init; }
}

public sealed record SendSingleVisitorWarmupInviteCommand
{
    public Guid TenantId { get; init; }
    public Guid EventId { get; init; }
    public Guid VisitorId { get; init; }
    public WarmupCountdownType CountdownType { get; init; } = WarmupCountdownType.DaysToGo;
    public int? DaysRemaining { get; init; }
    public string? CustomMessage { get; init; }
}

public sealed record InviteBroadcastResult
{
    public int TotalTargeted { get; init; }
    public int SuccessfullySent { get; init; }
    public int Failed { get; init; }
    public string TemplateUsed { get; init; } = string.Empty;
}

public sealed record VisitorLoginRequest(string RegistrationNumber, string Mobile, Guid? TenantId = null);
public sealed record VisitorScanRequest(Guid? VisitorId, string RegistrationNumber);


