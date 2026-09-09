using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MSME.StallBooking.Domain.Entities;
using static MSME.StallBooking.Domain.Entities.BillingProfile;
using MSME.StallBooking.Application.Abstractions;
using MSME.StallBooking.Infrastructure.Email;
using MSME.StallBooking.Persistence;
using StallBookingEntity = MSME.StallBooking.Domain.Entities.StallBooking;

namespace MSME.StallBooking.Api.Controllers;

/// <summary>
/// Self-service portal for exhibitors. No password/account setup needed — an exhibitor
/// signs in with the booking registration number + the mobile number on file (both were
/// given to them at booking time), and sees who scanned their stall QR and tapped
/// "I'm Interested".
/// </summary>
[ApiController]
[Route("api/v1")]
public sealed class ExhibitorPortalController : ControllerBase
{
    private readonly StallBookingDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly IEmailSender _emailSender;
    private readonly IEmailComposer _emailComposer;

    public ExhibitorPortalController(
        StallBookingDbContext db, 
        IConfiguration configuration,
        IEmailSender emailSender,
        IEmailComposer emailComposer)
    {
        _db = db;
        _configuration = configuration;
        _emailSender = emailSender;
        _emailComposer = emailComposer;
    }

    [HttpPost("public/exhibitor/login")]
    public async Task<IActionResult> Login([FromBody] ExhibitorLoginRequest request, CancellationToken ct)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.RegistrationNumber) || string.IsNullOrWhiteSpace(request.Mobile))
            return BadRequest(new { message = "Registration number and mobile number are required." });

        var reg = request.RegistrationNumber.Trim().ToUpperInvariant();
        var mobileDigits = new string(request.Mobile.Where(char.IsDigit).ToArray());

        // Match full registration number or last 3 digits (e.g. 024, 123)
        var candidates = await _db.StallBookings
            .AsNoTracking()
            .Where(b => b.BookingRegistrationNumber == reg || b.BookingRegistrationNumber.EndsWith(reg))
            .Select(b => new { b.Id, b.ExhibitorId, b.FasciaName, b.BookingRegistrationNumber })
            .ToListAsync(ct);

        if (!candidates.Any())
            return Unauthorized(new { message = "We couldn't find a stall booking with that registration number." });

        var exhibitorIds = candidates.Select(c => c.ExhibitorId).Distinct().ToList();
        var exhibitors = await _db.Exhibitors
            .AsNoTracking()
            .Where(e => exhibitorIds.Contains(e.Id))
            .ToListAsync(ct);

        var matched = candidates
            .Select(b => new { Booking = b, Exhibitor = exhibitors.FirstOrDefault(e => e.Id == b.ExhibitorId) })
            .FirstOrDefault(pair =>
            {
                if (pair.Exhibitor is null) return false;
                var eMobile = new string((pair.Exhibitor.Mobile ?? "").Where(char.IsDigit).ToArray());
                return eMobile.Length > 0 &&
                    (eMobile == mobileDigits || eMobile.EndsWith(mobileDigits) || mobileDigits.EndsWith(eMobile));
            });

        if (matched is null || matched.Exhibitor is null)
            return Unauthorized(new { message = "The mobile number does not match our records for this registration number." });

        var booking = matched.Booking;
        var exhibitor = matched.Exhibitor;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["Jwt:SigningKey"] ?? "CHANGE_THIS_DEVELOPMENT_SIGNING_KEY_MINIMUM_32_CHARS"));

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, exhibitor.Id.ToString()),
            new("scope", "exhibitor"),
            new("exhibitorId", exhibitor.Id.ToString()),
            new("bookingId", booking.Id.ToString()),
            new("tenantId", exhibitor.TenantId.ToString())
        };

        var token = new JwtSecurityToken(
            _configuration["Jwt:Issuer"],
            _configuration["Jwt:Audience"],
            claims,
            expires: DateTime.UtcNow.AddHours(12),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return Ok(new
        {
            token = new JwtSecurityTokenHandler().WriteToken(token),
            companyName = string.IsNullOrWhiteSpace(exhibitor.TradeName) ? exhibitor.LegalName : exhibitor.TradeName,
            registrationNumber = booking.BookingRegistrationNumber,
            fasciaName = booking.FasciaName
        });
    }

    [Authorize]
    [HttpGet("exhibitor/me")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var exhibitorId = GetExhibitorId();
        if (exhibitorId is null) return Forbid();

        var exhibitor = await _db.Exhibitors.AsNoTracking().SingleOrDefaultAsync(e => e.Id == exhibitorId, ct);
        if (exhibitor is null) return NotFound();

        var booking = await _db.StallBookings
            .AsNoTracking()
            .Where(b => b.ExhibitorId == exhibitorId)
            .Select(b => new { b.Id, b.BookingRegistrationNumber, b.FasciaName, b.AllocatedStallId })
            .FirstOrDefaultAsync(ct);

        string? stallNumber = null;
        if (booking?.AllocatedStallId is Guid stallId)
        {
            stallNumber = await _db.Stalls.AsNoTracking()
                .Where(s => s.Id == stallId)
                .Select(s => s.StallNumber)
                .SingleOrDefaultAsync(ct);
        }

        return Ok(new
        {
            id = booking?.Id.ToString() ?? "",
            bookingId = booking?.Id,
            companyName = string.IsNullOrWhiteSpace(exhibitor.TradeName) ? exhibitor.LegalName : exhibitor.TradeName,
            legalName = exhibitor.LegalName,
            registrationNumber = booking?.BookingRegistrationNumber,
            bookingRegistrationNumber = booking?.BookingRegistrationNumber,
            fasciaName = booking?.FasciaName,
            stallNumber,
            industryCategory = exhibitor.IndustryCategory,
            contactPerson = exhibitor.ContactPersonName ?? "",
            contactPersonName = exhibitor.ContactPersonName,
            contactPersonDesignation = exhibitor.ContactPersonDesignation,
            email = exhibitor.Email ?? "",
            mobile = exhibitor.Mobile ?? "",
            companyLogo = exhibitor.CompanyLogo,
            manufacturing = exhibitor.ProductServiceDescription,
            productKeywords = exhibitor.ProductServiceDescription,
            productServiceDescription = exhibitor.ProductServiceDescription,
            businessType = exhibitor.BusinessType
        });
    }

    /// <summary>Returns the full stall card / E-Card details for the authenticated exhibitor.</summary>
    [Authorize]
    [HttpGet("exhibitor/stall-card")]
    public async Task<IActionResult> GetStallCard(CancellationToken ct)
    {
        var exhibitorId = GetExhibitorId();
        if (exhibitorId is null) return Forbid();

        var exhibitor = await _db.Exhibitors.AsNoTracking().SingleOrDefaultAsync(e => e.Id == exhibitorId, ct);
        if (exhibitor is null) return NotFound(new { message = "Exhibitor not found." });

        var booking = await _db.StallBookings
            .AsNoTracking()
            .Where(b => b.ExhibitorId == exhibitorId)
            .Select(b => new { b.Id, b.BookingRegistrationNumber, b.FasciaName, b.AllocatedStallId })
            .FirstOrDefaultAsync(ct);

        string? stallNumber = null;
        if (booking?.AllocatedStallId is Guid stallId)
        {
            stallNumber = await _db.Stalls.AsNoTracking()
                .Where(s => s.Id == stallId)
                .Select(s => s.StallNumber)
                .SingleOrDefaultAsync(ct);
        }

        return Ok(new
        {
            id = booking?.Id.ToString() ?? "",
            bookingRegistrationNumber = booking?.BookingRegistrationNumber ?? "",
            stallNumber,
            fasciaName = booking?.FasciaName,
            companyName = string.IsNullOrWhiteSpace(exhibitor.TradeName) ? exhibitor.LegalName : exhibitor.TradeName,
            legalName = exhibitor.LegalName,
            contactPerson = exhibitor.ContactPersonName ?? "",
            email = exhibitor.Email ?? "",
            mobile = exhibitor.Mobile ?? "",
            industryCategory = exhibitor.IndustryCategory,
            productKeywords = exhibitor.ProductServiceDescription,
            companyLogo = exhibitor.CompanyLogo,
            manufacturing = exhibitor.ProductServiceDescription
        });
    }

    /// <summary>Emails the generated E-Card image to the logged-in exhibitor's registered email address.</summary>
    [Authorize]
    [HttpPost("exhibitor/stall-card/send-email")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> SendStallCardEmail([FromForm] IFormFile cardImage, CancellationToken ct)
    {
        var exhibitorId = GetExhibitorId();
        if (exhibitorId is null) return Forbid();

        if (cardImage is null || cardImage.Length == 0)
            return BadRequest(new { message = "Stall card image is required." });

        if (cardImage.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "Stall card image must be 5 MB or smaller." });

        var booking = await _db.StallBookings.AsNoTracking()
            .FirstOrDefaultAsync(b => b.ExhibitorId == exhibitorId, ct);
        if (booking is null)
            return NotFound(new { message = "Booking not found." });

        var exhibitor = await _db.Exhibitors.AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == exhibitorId, ct);
        if (exhibitor is null)
            return NotFound(new { message = "Exhibitor details not found." });

        Stall? stall = null;
        if (booking.AllocatedStallId is Guid stallId)
        {
            stall = await _db.Stalls.AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == stallId, ct);
        }

        if (stall is null)
            return BadRequest(new { message = "Stall has not been allocated yet." });

        var recipient = exhibitor.Email?.Trim();
        if (string.IsNullOrWhiteSpace(recipient) || !System.Net.Mail.MailAddress.TryCreate(recipient, out _))
            return BadRequest(new { message = "A valid exhibitor email is not available." });

        var venue = _configuration["EventDefaults:Venue"] ?? "Hotel Hills, Hosur";
        var eventDate = _configuration["EventDefaults:EventDateDisplay"] ?? "18 & 19 September 2026";

        var emailLog = _emailComposer.ComposeStallCardEmail(
            booking,
            stall,
            exhibitor,
            recipient,
            venue,
            eventDate);

        var extension = cardImage.ContentType.Equals("image/jpeg", StringComparison.OrdinalIgnoreCase) ? ".jpg" : ".png";
        var attachmentFileName = $"StallCard_{stall.StallNumber}_{booking.BookingRegistrationNumber}{extension}";

        byte[] cardBytes;
        using (var memoryStream = new MemoryStream())
        {
            await cardImage.CopyToAsync(memoryStream, ct);
            cardBytes = memoryStream.ToArray();
        }

        await _emailSender.SendEmailWithAttachmentAsync(
            recipient,
            emailLog.Subject,
            emailLog.BodySnapshot,
            cardBytes,
            attachmentFileName);

        return Ok(new
        {
            message = $"E-Card sent successfully to {recipient}.",
            recipient,
            attachmentFileName
        });
    }

    /// <summary>Visitors who tapped "I'm Interested" on this exhibitor's stall QR page.</summary>
    [Authorize]
    [HttpGet("exhibitor/interests")]
    public async Task<IActionResult> GetInterests(CancellationToken ct)
    {
        var exhibitorId = GetExhibitorId();
        if (exhibitorId is null) return Forbid();

        var interests = await _db.StallInterests
            .AsNoTracking()
            .Where(i => i.ExhibitorId == exhibitorId && !i.IsDeleted)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new
            {
                i.Id,
                i.VisitorName,
                i.VisitorMobile,
                i.VisitorEmail,
                i.CreatedAt,
                i.IsRead
            })
            .ToListAsync(ct);

        return Ok(new
        {
            totalInterested = interests.Count,
            interests
        });
    }

    [Authorize]
    [HttpPost("exhibitor/interests/{interestId:guid}/mark-read")]
    public async Task<IActionResult> MarkRead(Guid interestId, CancellationToken ct)
    {
        var exhibitorId = GetExhibitorId();
        if (exhibitorId is null) return Forbid();

        var interest = await _db.StallInterests.SingleOrDefaultAsync(i => i.Id == interestId && i.ExhibitorId == exhibitorId, ct);
        if (interest is null) return NotFound();

        interest.MarkRead();
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Marked as read." });
    }

    [Authorize]
    [HttpPost("exhibitor/connections/scan")]
    public async Task<IActionResult> ScanVisitorConnection([FromBody] ScanVisitorRequest request, CancellationToken ct)
    {
        var exhibitorId = GetExhibitorId();
        if (exhibitorId is null) return Forbid();

        if (string.IsNullOrWhiteSpace(request?.RegistrationNumber))
            return BadRequest(new { message = "Registration number or QR code is required." });

        var rawInput = request.RegistrationNumber.Trim();
        var reg = rawInput.ToUpperInvariant();

        // Extract registration number if full URL was passed in
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

        var currentExhibitor = await _db.Exhibitors.AsNoTracking().FirstOrDefaultAsync(e => e.Id == exhibitorId, ct);
        var currentBooking = await _db.StallBookings.AsNoTracking().FirstOrDefaultAsync(b => b.ExhibitorId == exhibitorId, ct);

        // 1. Check if scanned target is a VISITOR
        var visitor = await _db.Visitors.AsNoTracking()
            .FirstOrDefaultAsync(v => v.BookingRegistrationNumber == reg || v.BookingRegistrationNumber.EndsWith(reg), ct);

        if (visitor is not null)
        {
            // Check if connection already recorded
            var existingInterest = await _db.StallInterests
                .FirstOrDefaultAsync(i => i.ExhibitorId == exhibitorId &&
                    ((!string.IsNullOrWhiteSpace(visitor.Mobile) && i.VisitorMobile == visitor.Mobile) ||
                     (!string.IsNullOrWhiteSpace(visitor.Email) && i.VisitorEmail == visitor.Email)), ct);

            if (existingInterest is null && currentExhibitor is not null)
            {
                var newInterest = StallInterest.Create(
                    visitor.TenantId,
                    visitor.EventId,
                    currentBooking?.Id ?? Guid.Empty,
                    exhibitorId.Value,
                    visitor.ContactPersonName ?? visitor.LegalName,
                    visitor.Mobile,
                    visitor.Email);

                await _db.StallInterests.AddAsync(newInterest, ct);
                await _db.SaveChangesAsync(ct);
            }

            return Ok(new
            {
                type = "VISITOR",
                id = visitor.Id,
                visitorId = visitor.Id,
                registrationNumber = visitor.BookingRegistrationNumber,
                name = visitor.ContactPersonName ?? visitor.LegalName,
                legalName = visitor.LegalName,
                tradeName = visitor.TradeName,
                companyName = visitor.LegalName ?? visitor.TradeName,
                contactPersonName = visitor.ContactPersonName,
                contactPersonDesignation = visitor.ContactPersonDesignation,
                email = visitor.Email,
                mobile = visitor.Mobile,
                city = visitor.City,
                district = visitor.District,
                state = visitor.State,
                industryCategory = visitor.IndustryCategory,
                businessType = visitor.BusinessType,
                connectedAt = DateTime.UtcNow
            });
        }

        // 2. Check if scanned target is another EXHIBITOR / STALL
        var targetBooking = await _db.StallBookings
            .AsNoTracking()
            .FirstOrDefaultAsync(b => (b.BookingRegistrationNumber == reg || b.BookingRegistrationNumber.EndsWith(reg))
                && b.ExhibitorId != exhibitorId, ct);

        if (targetBooking is null)
        {
            var stallMatch = await _db.Stalls.AsNoTracking().FirstOrDefaultAsync(s => s.StallNumber == reg, ct);
            if (stallMatch is not null)
            {
                targetBooking = await _db.StallBookings
                    .AsNoTracking()
                    .FirstOrDefaultAsync(b => b.AllocatedStallId == stallMatch.Id && b.ExhibitorId != exhibitorId, ct);
            }
        }

        if (targetBooking is not null)
        {
            var targetExhibitor = await _db.Exhibitors.AsNoTracking().FirstOrDefaultAsync(e => e.Id == targetBooking.ExhibitorId, ct);
            var targetStall = targetBooking.AllocatedStallId.HasValue
                ? await _db.Stalls.AsNoTracking().FirstOrDefaultAsync(s => s.Id == targetBooking.AllocatedStallId.Value, ct)
                : null;

            if (targetExhibitor is not null && currentExhibitor is not null)
            {
                var existingE2E = await _db.StallInterests
                    .FirstOrDefaultAsync(i => i.ExhibitorId == exhibitorId && i.CorrelationId == $"E2E:{targetExhibitor.Id}", ct);

                if (existingE2E is null)
                {
                    // Current exhibitor -> Target exhibitor
                    var interest1 = StallInterest.Create(
                        currentExhibitor.TenantId,
                        currentExhibitor.EventId,
                        targetBooking.Id,
                        exhibitorId.Value,
                        targetExhibitor.TradeName ?? targetExhibitor.LegalName,
                        targetExhibitor.Mobile,
                        targetExhibitor.Email,
                        $"E2E:{targetExhibitor.Id}");

                    await _db.StallInterests.AddAsync(interest1, ct);

                    // Reciprocal: Target exhibitor -> Current exhibitor
                    var existingReciprocal = await _db.StallInterests
                        .FirstOrDefaultAsync(i => i.ExhibitorId == targetExhibitor.Id && i.CorrelationId == $"E2E:{exhibitorId.Value}", ct);

                    if (existingReciprocal is null)
                    {
                        var interest2 = StallInterest.Create(
                            targetExhibitor.TenantId,
                            targetExhibitor.EventId,
                            currentBooking?.Id ?? Guid.Empty,
                            targetExhibitor.Id,
                            currentExhibitor.TradeName ?? currentExhibitor.LegalName,
                            currentExhibitor.Mobile,
                            currentExhibitor.Email,
                            $"E2E:{exhibitorId.Value}");

                        await _db.StallInterests.AddAsync(interest2, ct);
                    }

                    await _db.SaveChangesAsync(ct);
                }
            }

            var companyName = !string.IsNullOrWhiteSpace(targetExhibitor?.TradeName)
                ? targetExhibitor.TradeName
                : (!string.IsNullOrWhiteSpace(targetExhibitor?.LegalName) ? targetExhibitor.LegalName : targetBooking.FasciaName);

            return Ok(new
            {
                type = "EXHIBITOR",
                id = targetExhibitor?.Id ?? targetBooking.Id,
                exhibitorId = targetExhibitor?.Id.ToString(),
                registrationNumber = targetBooking.BookingRegistrationNumber,
                name = targetExhibitor?.ContactPersonName ?? companyName,
                companyName,
                fasciaName = targetBooking.FasciaName,
                stallNumber = targetStall?.StallNumber,
                companyLogo = targetExhibitor?.CompanyLogo,
                contactPersonName = targetExhibitor?.ContactPersonName,
                contactPersonDesignation = targetExhibitor?.ContactPersonDesignation,
                email = targetExhibitor?.Email,
                mobile = targetExhibitor?.Mobile,
                city = targetExhibitor?.City,
                district = targetExhibitor?.District,
                state = targetExhibitor?.State,
                industryCategory = targetExhibitor?.IndustryCategory,
                connectedAt = DateTime.UtcNow
            });
        }

        return NotFound(new { message = $"No visitor or exhibitor found matching '{reg}'." });
    }

    [Authorize]
    [HttpGet("exhibitor/connections")]
    public async Task<IActionResult> GetExhibitorConnections(CancellationToken ct)
    {
        var exhibitorId = GetExhibitorId();
        if (exhibitorId is null) return Forbid();

        var interests = await _db.StallInterests
            .AsNoTracking()
            .Where(i => i.ExhibitorId == exhibitorId && !i.IsDeleted)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(ct);

        // Separate E2E (Exhibitor to Exhibitor) and Visitor interests
        var e2eInterests = interests.Where(i => i.CorrelationId != null && i.CorrelationId.StartsWith("E2E:")).ToList();
        var visitorInterests = interests.Where(i => i.CorrelationId == null || !i.CorrelationId.StartsWith("E2E:")).ToList();

        // 1. Connected Visitors
        var mobiles = visitorInterests.Select(i => i.VisitorMobile).Where(m => !string.IsNullOrWhiteSpace(m)).ToList();
        var visitors = mobiles.Any()
            ? await _db.Visitors.AsNoTracking().Where(v => mobiles.Contains(v.Mobile)).ToListAsync(ct)
            : new List<Visitor>();

        var visitorList = visitorInterests.Select(i =>
        {
            var match = visitors.FirstOrDefault(v => v.Mobile == i.VisitorMobile);
            return new
            {
                id = i.Id,
                visitorId = match?.Id,
                registrationNumber = match?.BookingRegistrationNumber ?? "N/A",
                visitorName = i.VisitorName ?? match?.ContactPersonName ?? "Visitor",
                name = i.VisitorName ?? match?.ContactPersonName ?? "Visitor",
                companyName = match?.LegalName ?? match?.TradeName,
                designation = match?.ContactPersonDesignation,
                visitorMobile = i.VisitorMobile ?? match?.Mobile,
                mobile = i.VisitorMobile ?? match?.Mobile,
                visitorEmail = i.VisitorEmail ?? match?.Email,
                email = i.VisitorEmail ?? match?.Email,
                city = match?.City,
                district = match?.District,
                state = match?.State,
                industryCategory = match?.IndustryCategory,
                createdAt = i.CreatedAt,
                isRead = i.IsRead
            };
        }).ToList();

        // 2. Connected Exhibitors
        var otherExhibitorIds = e2eInterests
            .Select(i => Guid.TryParse(i.CorrelationId!.Substring(4), out var gid) ? gid : Guid.Empty)
            .Where(gid => gid != Guid.Empty)
            .Distinct()
            .ToList();

        var otherExhibitors = otherExhibitorIds.Any()
            ? await _db.Exhibitors.AsNoTracking().Where(e => otherExhibitorIds.Contains(e.Id)).ToListAsync(ct)
            : new List<Exhibitor>();

        var otherBookings = otherExhibitorIds.Any()
            ? await _db.StallBookings.AsNoTracking().Where(b => otherExhibitorIds.Contains(b.ExhibitorId)).ToListAsync(ct)
            : new List<StallBookingEntity>();

        var otherStallIds = otherBookings.Where(b => b.AllocatedStallId.HasValue).Select(b => b.AllocatedStallId!.Value).Distinct().ToList();
        var otherStalls = otherStallIds.Any()
            ? await _db.Stalls.AsNoTracking().Where(s => otherStallIds.Contains(s.Id)).ToListAsync(ct)
            : new List<Stall>();

        var exhibitorList = e2eInterests.Select(i =>
        {
            Guid.TryParse(i.CorrelationId?.Substring(4), out var otherId);
            var otherEx = otherExhibitors.FirstOrDefault(e => e.Id == otherId);
            var booking = otherBookings.FirstOrDefault(b => b.ExhibitorId == otherId);
            var stall = booking?.AllocatedStallId.HasValue == true
                ? otherStalls.FirstOrDefault(s => s.Id == booking.AllocatedStallId.Value)
                : null;

            var companyName = !string.IsNullOrWhiteSpace(otherEx?.TradeName)
                ? otherEx.TradeName
                : (!string.IsNullOrWhiteSpace(otherEx?.LegalName) ? otherEx.LegalName : (booking?.FasciaName ?? i.VisitorName ?? "Exhibitor"));

            return new
            {
                id = i.Id,
                exhibitorId = otherId.ToString(),
                registrationNumber = booking?.BookingRegistrationNumber ?? "N/A",
                companyName,
                companyLogo = otherEx?.CompanyLogo,
                fasciaName = booking?.FasciaName,
                stallNumber = stall?.StallNumber,
                contactPersonName = otherEx?.ContactPersonName,
                contactPersonDesignation = otherEx?.ContactPersonDesignation,
                mobile = otherEx?.Mobile ?? i.VisitorMobile,
                email = otherEx?.Email ?? i.VisitorEmail,
                city = otherEx?.City,
                district = otherEx?.District,
                state = otherEx?.State,
                industryCategory = otherEx?.IndustryCategory,
                createdAt = i.CreatedAt,
                isRead = i.IsRead
            };
        }).ToList();

        return Ok(new
        {
            totalConnections = visitorList.Count + exhibitorList.Count,
            connectedVisitors = visitorList,
            connectedExhibitors = exhibitorList,
            connections = visitorList
        });
    }

    /// <summary>
    /// Sends a personalized direct email from the logged-in exhibitor to any manually entered recipient email.
    /// Uses system SMTP credentials securely from backend, with Reply-To set to the exhibitor's registered email.
    /// </summary>
    [Authorize]
    [HttpPost("exhibitor/send-email")]
    public async Task<IActionResult> SendCustomEmail([FromBody] ExhibitorSendEmailRequest request, CancellationToken ct)
    {
        var exhibitorId = GetExhibitorId();
        if (exhibitorId is null) return Forbid();

        if (request is null)
            return BadRequest(new { message = "Invalid request payload." });

        var toEmail = request.ToEmail?.Trim();
        if (string.IsNullOrWhiteSpace(toEmail) || !System.Net.Mail.MailAddress.TryCreate(toEmail, out _))
            return BadRequest(new { message = "A valid 'To Email' address is required." });

        if (string.IsNullOrWhiteSpace(request.Subject))
            return BadRequest(new { message = "Email Subject is required." });

        if (string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(new { message = "Email Message content is required." });

        var exhibitor = await _db.Exhibitors.AsNoTracking().SingleOrDefaultAsync(e => e.Id == exhibitorId, ct);
        if (exhibitor is null) return NotFound(new { message = "Exhibitor record not found." });

        var booking = await _db.StallBookings.AsNoTracking()
            .Where(b => b.ExhibitorId == exhibitorId)
            .OrderByDescending(b => b.CreatedAt)
            .FirstOrDefaultAsync(ct);

        string stallNumber = "-";
        if (booking?.AllocatedStallId is Guid stallId)
        {
            var foundStallNumber = await _db.Stalls.AsNoTracking()
                .Where(s => s.Id == stallId)
                .Select(s => s.StallNumber)
                .SingleOrDefaultAsync(ct);
            if (!string.IsNullOrWhiteSpace(foundStallNumber))
                stallNumber = foundStallNumber;
        }

        var companyName = !string.IsNullOrWhiteSpace(exhibitor.TradeName)
            ? exhibitor.TradeName.Trim()
            : !string.IsNullOrWhiteSpace(exhibitor.LegalName)
                ? exhibitor.LegalName.Trim()
                : "Exhibitor";

        var contactPerson = !string.IsNullOrWhiteSpace(exhibitor.ContactPersonName)
            ? exhibitor.ContactPersonName.Trim()
            : "Exhibitor Representative";

        var exhibitorReplyTo = exhibitor.Email?.Trim();
        if (string.IsNullOrWhiteSpace(exhibitorReplyTo))
        {
            return BadRequest(new { message = "Your exhibitor account does not have a registered email address to receive replies." });
        }

        var visitorGreetingName = !string.IsNullOrWhiteSpace(request.VisitorName)
            ? request.VisitorName.Trim()
            : "Valued Partner";

        // Render template with dynamic values
        var templateDef = EmailTemplateCatalog.AllTemplates.TryGetValue("EXHIBITOR_DIRECT_EMAIL", out var def) ? def : null;
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
        {
            ["visitorName"] = visitorGreetingName,
            ["VisitorName"] = visitorGreetingName,
            ["companyName"] = companyName,
            ["CompanyName"] = companyName,
            ["exhibitorName"] = contactPerson,
            ["ExhibitorName"] = contactPerson,
            ["stallNumber"] = stallNumber,
            ["StallNumber"] = stallNumber,
            ["customMessage"] = request.Message.Trim(),
            ["CustomMessage"] = request.Message.Trim(),
            ["replyToEmail"] = exhibitorReplyTo,
            ["ReplyToEmail"] = exhibitorReplyTo
        };

        var rawBody = templateDef?.DefaultHtmlBody;
        string finalHtml;
        if (!string.IsNullOrWhiteSpace(rawBody))
        {
            finalHtml = EmailTemplateCatalog.RenderTemplate(rawBody, values);
        }
        else
        {
            finalHtml = $@"<div style=""font-family: Arial, sans-serif; font-size: 15px; color: #222;"">
                <p>Dear {visitorGreetingName},</p>
                <div style=""margin: 16px 0; white-space: pre-wrap;"">{System.Net.WebUtility.HtmlEncode(request.Message.Trim())}</div>
                <hr style=""border: 0; border-top: 1px solid #ddd; margin: 20px 0;""/>
                <p><b>From:</b> {contactPerson} ({companyName})<br/><b>Stall Number:</b> {stallNumber}<br/><b>Reply-To:</b> <a href=""mailto:{exhibitorReplyTo}"">{exhibitorReplyTo}</a></p>
            </div>";
        }

        var renderedSubject = EmailTemplateCatalog.RenderTemplate(request.Subject.Trim(), values);

        // Record in EmailLogs for audit trail
        var emailLog = EmailLog.Create(
            booking?.TenantId ?? exhibitor.TenantId,
            booking?.EventId,
            booking?.Id,
            toEmail,
            renderedSubject,
            finalHtml,
            "EXHIBITOR_DIRECT_EMAIL");

        _db.EmailLogs.Add(emailLog);
        await _db.SaveChangesAsync(ct);

        // Send with Reply-To set to the logged-in exhibitor
        await _emailSender.SendEmailAsync(
            toEmail,
            renderedSubject,
            finalHtml,
            replyToEmail: exhibitorReplyTo,
            replyToName: contactPerson);

        return Ok(new
        {
            message = $"Email sent successfully to {toEmail}.",
            toEmail,
            replyToEmail = exhibitorReplyTo,
            subject = renderedSubject,
            sentAt = DateTime.UtcNow
        });
    }

    private Guid? GetExhibitorId()
    {
        var value = User.FindFirst("exhibitorId")?.Value;
        return Guid.TryParse(value, out var id) ? id : null;
    }
}

public sealed record ExhibitorLoginRequest(string RegistrationNumber, string Mobile);
public sealed record ScanVisitorRequest(string RegistrationNumber, string? Notes);
public sealed record ExhibitorSendEmailRequest(string ToEmail, string Subject, string Message, string? VisitorName = null);
