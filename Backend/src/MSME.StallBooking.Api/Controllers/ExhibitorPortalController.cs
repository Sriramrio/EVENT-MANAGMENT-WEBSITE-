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
            companyName = string.IsNullOrWhiteSpace(exhibitor.LegalName) ? (exhibitor.TradeName ?? "Exhibitor") : exhibitor.LegalName,
            tradeName = exhibitor.TradeName,
            legalName = exhibitor.LegalName,
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
    /// Supports attaching the exhibitor's official E-Card image (PNG/JPEG) and dispatching an optional copy to the exhibitor.
    /// Uses system SMTP credentials securely from backend, with Reply-To set to the exhibitor's registered email.
    /// </summary>
    [Authorize]
    [HttpPost("exhibitor/send-email")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> SendCustomEmail(CancellationToken ct)
    {
        var exhibitorId = GetExhibitorId();
        if (exhibitorId is null) return Forbid();

        string? toEmail = null;
        string? subject = null;
        string? message = null;
        string? visitorName = null;
        bool attachECard = true;
        bool sendCopyToMe = false;
        string? cardImageBase64 = null;
        string? templateKey = null;
        IFormFile? cardImage = null;

        if (Request.HasFormContentType)
        {
            var form = await Request.ReadFormAsync(ct);
            toEmail = form["toEmail"].FirstOrDefault();
            subject = form["subject"].FirstOrDefault();
            message = form["message"].FirstOrDefault();
            visitorName = form["visitorName"].FirstOrDefault();
            templateKey = form["templateKey"].FirstOrDefault();
            bool.TryParse(form["attachECard"].FirstOrDefault(), out attachECard);
            bool.TryParse(form["sendCopyToMe"].FirstOrDefault(), out sendCopyToMe);
            cardImageBase64 = form["cardImageBase64"].FirstOrDefault();
            cardImage = form.Files.GetFile("cardImage");
        }
        else
        {
            var jsonRequest = await System.Text.Json.JsonSerializer.DeserializeAsync<ExhibitorSendEmailRequest>(
                Request.Body,
                new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true },
                ct);

            if (jsonRequest is null)
                return BadRequest(new { message = "Invalid request payload." });

            toEmail = jsonRequest.ToEmail;
            subject = jsonRequest.Subject;
            message = jsonRequest.Message;
            visitorName = jsonRequest.VisitorName;
            templateKey = jsonRequest.TemplateKey;
            attachECard = jsonRequest.AttachECard;
            sendCopyToMe = jsonRequest.SendCopyToMe;
            cardImageBase64 = jsonRequest.CardImageBase64;
        }

        toEmail = toEmail?.Trim();
        if (string.IsNullOrWhiteSpace(toEmail) || !System.Net.Mail.MailAddress.TryCreate(toEmail, out _))
            return BadRequest(new { message = "A valid 'To Email' address is required." });

        if (string.IsNullOrWhiteSpace(subject))
            return BadRequest(new { message = "Email Subject is required." });

        if (string.IsNullOrWhiteSpace(message))
            return BadRequest(new { message = "Email Message content is required." });

        if (cardImage is not null && cardImage.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "Stall card image must be 5 MB or smaller." });

        var exhibitor = await _db.Exhibitors.AsNoTracking().SingleOrDefaultAsync(e => e.Id == exhibitorId, ct);
        if (exhibitor is null) return NotFound(new { message = "Exhibitor record not found." });

        var bookingClaim = User.FindFirst("bookingId")?.Value;
        Guid.TryParse(bookingClaim, out var claimBookingId);

        var booking = await _db.StallBookings.AsNoTracking()
            .Where(b => (claimBookingId != Guid.Empty && b.Id == claimBookingId) || b.ExhibitorId == exhibitorId)
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

        var visitorGreetingName = !string.IsNullOrWhiteSpace(visitorName)
            ? visitorName.Trim()
            : "Valued Partner";

        // Generate card attachment bytes from cardImageBase64 or uploaded cardImage file
        byte[] cardBytes = Array.Empty<byte>();
        string attachmentFileName = string.Empty;
        var cleanStall = string.Join("_", stallNumber.Split(Path.GetInvalidFileNameChars()));

        if (attachECard)
        {
            if (!string.IsNullOrWhiteSpace(cardImageBase64))
            {
                try
                {
                    var base64Data = cardImageBase64.Contains(",")
                        ? cardImageBase64.Substring(cardImageBase64.IndexOf(",") + 1)
                        : cardImageBase64;
                    cardBytes = Convert.FromBase64String(base64Data);
                    attachmentFileName = $"StallCard_{cleanStall}_{DateTime.UtcNow:yyyyMMdd}.png";
                }
                catch { cardBytes = Array.Empty<byte>(); }
            }
            else if (cardImage is not null && cardImage.Length > 0)
            {
                var extension = cardImage.ContentType.Contains("jpeg", StringComparison.OrdinalIgnoreCase) || cardImage.ContentType.Contains("jpg", StringComparison.OrdinalIgnoreCase)
                    ? ".jpg"
                    : ".png";
                attachmentFileName = $"StallCard_{cleanStall}_{DateTime.UtcNow:yyyyMMdd}{extension}";

                using var ms = new MemoryStream();
                await cardImage.CopyToAsync(ms, ct);
                cardBytes = ms.ToArray();
            }
        }

        var formattedMessage = FormatMessageLinks(message.Trim());

        bool isB2B = string.Equals(templateKey, "b2b_sourcing", StringComparison.OrdinalIgnoreCase)
            || subject.Contains("B2B", StringComparison.OrdinalIgnoreCase)
            || message.Contains("buyer/register", StringComparison.OrdinalIgnoreCase);

        string registrationBoxHtml = isB2B
            ? $@"<div style=""margin: 18px 0; padding: 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; text-align: center;"">
                    <p style=""margin: 0 0 12px 0; font-weight: 700; color: #0B3B75; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;"">B2B Connect & Registration Portal</p>
                    <table style=""margin: 0 auto; border-collapse: separate; border-spacing: 12px 0;"">
                        <tr>
                            <td style=""background: #ffffff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; text-align: center;"">
                                <p style=""margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #334155;"">For Sourcing & Procurement</p>
                                <a href=""https://msmesangamam.lubtn.com/buyer/register"" target=""_blank"" style=""display: inline-block; background: #0B3B75; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px;"">Register as Buyer &rarr;</a>
                            </td>
                            <td style=""background: #ffffff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; text-align: center;"">
                                <p style=""margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #334155;"">For Vendors & Manufacturers</p>
                                <a href=""https://msmesangamam.lubtn.com/seller/register"" target=""_blank"" style=""display: inline-block; background: #15803d; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px;"">Register as Seller &rarr;</a>
                            </td>
                        </tr>
                    </table>
                </div>"
            : $@"<div style=""margin: 16px 0; padding: 14px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; text-align: center;"">
                    <p style=""margin: 0 0 8px 0; font-weight: 600; color: #1e40af;"">Please register as a visitor to attend the expo:</p>
                    <a href=""https://msmesangamam.lubtn.com/visitor"" target=""_blank"" style=""display: inline-block; background: #0B3B75; color: #fff; padding: 8px 18px; text-decoration: none; border-radius: 6px; font-weight: 600;"">Register as Visitor &rarr;</a>
                </div>";

        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["visitorName"] = visitorGreetingName,
            ["companyName"] = companyName,
            ["exhibitorName"] = contactPerson,
            ["stallNumber"] = stallNumber,
            ["customMessage"] = formattedMessage,
            ["replyToEmail"] = exhibitorReplyTo
        };

        string finalHtml = $@"<div style=""font-family: Arial, sans-serif; font-size: 15px; color: #222;"">
            <p>Dear {visitorGreetingName},</p>
            <div style=""margin: 16px 0; white-space: pre-wrap;"">{formattedMessage}</div>
            {registrationBoxHtml}
            {(cardBytes.Length > 0 ? @"<div style=""margin: 12px 0; color: #166534; font-weight: 600;"">📎 Stall card attached, please check.</div>" : "")}
            <hr style=""border: 0; border-top: 1px solid #ddd; margin: 20px 0;""/>
            <p><b>From:</b> {contactPerson} ({companyName})<br/><b>Stall Number:</b> {stallNumber}<br/><b>Reply-To:</b> <a href=""mailto:{exhibitorReplyTo}"">{exhibitorReplyTo}</a></p>
        </div>";

        var renderedSubject = EmailTemplateCatalog.RenderTemplate(subject.Trim(), values);

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

        try
        {
            // Send with attachment if card image bytes exist
            if (cardBytes.Length > 0)
            {
                await _emailSender.SendEmailWithAttachmentAsync(
                    toEmail,
                    renderedSubject,
                    finalHtml,
                    cardBytes,
                    attachmentFileName,
                    replyToEmail: exhibitorReplyTo,
                    replyToName: contactPerson);

                if (sendCopyToMe && !string.IsNullOrWhiteSpace(exhibitorReplyTo) && !exhibitorReplyTo.Equals(toEmail, StringComparison.OrdinalIgnoreCase))
                {
                    await _emailSender.SendEmailWithAttachmentAsync(
                        exhibitorReplyTo,
                        $"[Copy] {renderedSubject}",
                        finalHtml,
                        cardBytes,
                        attachmentFileName,
                        replyToEmail: exhibitorReplyTo,
                        replyToName: contactPerson);
                }
            }
            else
            {
                await _emailSender.SendEmailAsync(
                    toEmail,
                    renderedSubject,
                    finalHtml,
                    replyToEmail: exhibitorReplyTo,
                    replyToName: contactPerson);

                if (sendCopyToMe && !string.IsNullOrWhiteSpace(exhibitorReplyTo) && !exhibitorReplyTo.Equals(toEmail, StringComparison.OrdinalIgnoreCase))
                {
                    await _emailSender.SendEmailAsync(
                        exhibitorReplyTo,
                        $"[Copy] {renderedSubject}",
                        finalHtml,
                        replyToEmail: exhibitorReplyTo,
                        replyToName: contactPerson);
                }
            }

            emailLog.MarkSent(null);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            emailLog.MarkFailed(ex.Message);
            await _db.SaveChangesAsync(ct);
            throw;
        }

        return Ok(new
        {
            message = $"Email sent successfully to {toEmail}.",
            toEmail,
            replyToEmail = exhibitorReplyTo,
            subject = renderedSubject,
            hasCardAttached = cardBytes.Length > 0,
            copySent = sendCopyToMe,
            sentAt = DateTime.UtcNow
        });
    }

    [Authorize]
    [HttpGet("exhibitor/email-logs")]
    public async Task<IActionResult> GetExhibitorEmailLogs(CancellationToken ct)
    {
        var exhibitorId = GetExhibitorId();
        if (exhibitorId is null) return Forbid();

        var exhibitor = await _db.Exhibitors.AsNoTracking().FirstOrDefaultAsync(e => e.Id == exhibitorId, ct);
        if (exhibitor is null) return NotFound();

        var bookingClaim = User.FindFirst("bookingId")?.Value;
        Guid.TryParse(bookingClaim, out var claimBookingId);

        var bookingIds = await _db.StallBookings.AsNoTracking()
            .Where(b => b.ExhibitorId == exhibitorId || (claimBookingId != Guid.Empty && b.Id == claimBookingId))
            .Select(b => b.Id)
            .ToListAsync(ct);

        if (!bookingIds.Any() && claimBookingId != Guid.Empty)
        {
            bookingIds.Add(claimBookingId);
        }

        if (!bookingIds.Any())
        {
            return Ok(Array.Empty<object>());
        }

        var logs = await _db.EmailLogs.AsNoTracking()
            .Where(l => l.BookingId.HasValue && bookingIds.Contains(l.BookingId.Value) && l.TemplateCode == "EXHIBITOR_DIRECT_EMAIL")
            .OrderByDescending(l => l.CreatedAt)
            .Take(100)
            .Select(l => new
            {
                id = l.Id,
                toEmail = l.ToEmail,
                subject = l.Subject,
                status = l.Status.ToString(),
                sentAt = l.SentAt ?? l.CreatedAt,
                templateCode = l.TemplateCode,
                hasAttachment = true
            })
            .ToListAsync(ct);

        return Ok(logs);
    }

    private Guid? GetExhibitorId()
    {
        var value = User.FindFirst("exhibitorId")?.Value;
        return Guid.TryParse(value, out var id) ? id : null;
    }

    private static string FormatMessageLinks(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        var encoded = System.Net.WebUtility.HtmlEncode(text);
        var urlRegex = new System.Text.RegularExpressions.Regex(@"(https?://[^\s<]+)");
        return urlRegex.Replace(encoded, "<a href=\"$1\" target=\"_blank\" style=\"color:#2563eb; text-decoration:underline; font-weight:600;\">$1</a>");
    }
}

public sealed record ExhibitorLoginRequest(string RegistrationNumber, string Mobile);
public sealed record ScanVisitorRequest(string RegistrationNumber, string? Notes);
public sealed record ExhibitorSendEmailRequest(
    string ToEmail,
    string Subject,
    string Message,
    string? VisitorName = null,
    bool AttachECard = false,
    bool SendCopyToMe = false,
    string? CardImageBase64 = null,
    string? TemplateKey = null);
