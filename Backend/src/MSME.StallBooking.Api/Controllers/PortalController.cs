using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MSME.StallBooking.Application.Abstractions;
using MSME.StallBooking.Application.Contracts;
using MSME.StallBooking.Domain.Entities;
using MSME.StallBooking.Domain.Enums;
using Microsoft.Extensions.Caching.Memory;
using MSME.StallBooking.Persistence;
using MSME.StallBooking.SharedKernel.Errors;
using MSME.StallBooking.SharedKernel.Helpers;
using Org.BouncyCastle.Asn1.Ocsp;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Mail;
using System.Security.Claims;
using System.Text;
using EventEntity = MSME.StallBooking.Domain.Entities.Event;
using StallBookingEntity = MSME.StallBooking.Domain.Entities.StallBooking;


namespace MSME.StallBooking.Api.Controllers;

[ApiController]
[Route("api/v1")]
public sealed class PortalController : ControllerBase
{
    private readonly StallBookingDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly IEmailSender _emailSender;
    private readonly IEmailComposer _emailComposer;
    private readonly IProformaInvoicePdfGenerator _pdfGenerator;
    private readonly IPaymentReceiptPdfGenerator _paymentReceiptPdfGenerator;
    private readonly ILogger<PortalController> _logger;
    private readonly IMemoryCache _cache;
    private static readonly HashSet<Guid> SpecialTenPercentTdsBookingIds = new()
    {
        Guid.Parse("4ecd38a9-f92f-4adb-91e8-88811e2acddf"),
        Guid.Parse("e56f2543-0404-4c26-a858-3c694ea142b0"),
        Guid.Parse("fe3552d8-9ae6-4e34-98b0-b59bd07f5fc4"),
        Guid.Parse("b9d1751b-b17d-401c-be0b-a8aacc1beacd"),
        Guid.Parse("3cc38899-cb26-4282-9cf9-9aa5fd04b46f"),
         Guid.Parse("ebd776e9-c540-41f9-aabb-7c374251c13f")
    };



    private static readonly HashSet<string> SpecialTenPercentTdsBookingRegNumbers = new(StringComparer.OrdinalIgnoreCase)
    {
        "MSME-HOSUR-20260716-7695",
        "MSME-HOSUR-20260820-107",
        "MSME-HOSUR-20260731-043",
        "MSME-HOSUR-20260829-129",
        "MSME-HOSUR-20260829-130",
        "MSME-HOSUR-20260904-157"
    };
    private static bool IsTenPercentTdsBooking(Guid bookingId, string? regNumber) =>
         SpecialTenPercentTdsBookingIds.Contains(bookingId) ||
         bookingId.ToString().Contains("e3552d8", StringComparison.OrdinalIgnoreCase) ||
         (!string.IsNullOrWhiteSpace(regNumber) && SpecialTenPercentTdsBookingRegNumbers.Contains(regNumber));


    public PortalController(
        StallBookingDbContext db,
        IConfiguration configuration,
        IEmailSender emailSender,
        IEmailComposer emailComposer,
        IProformaInvoicePdfGenerator pdfGenerator,
        IPaymentReceiptPdfGenerator paymentReceiptPdfGenerator,
 ILogger<PortalController> logger,
        IMemoryCache cache
        )

    {
        _db = db;
        _configuration = configuration;
        _emailSender = emailSender;
        _paymentReceiptPdfGenerator = paymentReceiptPdfGenerator;
        _emailComposer = emailComposer;
        _pdfGenerator = pdfGenerator;
        _logger = logger;
        _cache = cache;
    }
    [HttpPost("auth/login")]
    public async Task<ActionResult<AuthResponseDto>> Login(
   [FromBody] LoginRequest request,
   CancellationToken ct)
    {
        try
        {
            if (request is null ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    error = "Email and password are required."
                });
            }

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();

            var user = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.Email.ToLower() == normalizedEmail &&
                         !x.IsDeleted,
                    ct);

            if (user is null)
            {
                return Unauthorized(new
                {
                    error = "User was not found."
                });
            }

            if (!user.IsActive)
            {
                return Unauthorized(new
                {
                    error = "User is disabled."
                });
            }

            bool passwordValid;

            try
            {
                passwordValid = VerifyPassword(
                    request.Password,
                    user.PasswordHash);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    step = "VerifyPassword",
                    exception = ex.GetType().Name,
                    message = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }

            if (!passwordValid)
            {
                return Unauthorized(new
                {
                    error = "Invalid password."
                });
            }

            var roleIds = await _db.UserRoles
                .AsNoTracking()
                .Where(x =>
                    x.UserId == user.Id &&
                    x.IsActive &&
                    !x.IsDeleted)
                .Select(x => x.RoleId)
                .Distinct()
                .ToListAsync(ct);

            if (roleIds.Count == 0)
            {
                return StatusCode(500, new
                {
                    step = "LoadRoles",
                    message = "No active role is assigned to this user.",
                    userId = user.Id,
                    email = user.Email
                });
            }

            var roles = await _db.Roles
                .AsNoTracking()
                .Where(x =>
                    roleIds.Contains(x.Id) &&
                    x.IsActive &&
                    !x.IsDeleted)
                .ToListAsync(ct);

            if (roles.Count == 0)
            {
                return StatusCode(500, new
                {
                    step = "LoadRoles",
                    message = "Assigned role records were not found or are inactive.",
                    roleIds
                });
            }

            var permissionIds = await _db.RolePermissions
                .AsNoTracking()
                .Where(x =>
                    roleIds.Contains(x.RoleId) &&
                    !x.IsDeleted)
                .Select(x => x.PermissionId)
                .Distinct()
                .ToListAsync(ct);

            var permissions = await _db.Permissions
                .AsNoTracking()
                .Where(x =>
                    permissionIds.Contains(x.Id) &&
                    x.IsActive &&
                    !x.IsDeleted)
                .Select(x => x.PermissionCode)
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync(ct);

            var orgMembership = await (
                            from ou in _db.OrganizationUsers.AsNoTracking()
                            join o in _db.Organizations.AsNoTracking() on ou.OrganizationId equals o.Id
                            where ou.TenantId == user.TenantId
                                  && ou.UserId == user.Id
                                  && ou.IsActive
                                  && !o.IsDeleted
                            select new
                            {
                                ou.OrganizationId,
                                OrganizationName = o.LegalName,
                                OrganizationType = o.OrganizationType,
                                Role = (MSME.StallBooking.Domain.Marketplace.MarketplaceMembershipRole?)ou.Role
                            }
                        ).FirstOrDefaultAsync(ct);

            if (orgMembership?.Role.HasValue == true)
            {
                permissions.AddRange(MarketplacePermissionsFor(orgMembership.Role.Value));
            }
            permissions = permissions.Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(x => x).ToList();

            var roleCode = roles
                .Select(x => x.RoleCode)
                .First();

            string token;

            try
            {
                token = CreateToken(
                    user,
                    roleCode,
                    permissions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    step = "CreateToken",
                    exception = ex.GetType().Name,
                    message = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }

            return Ok(new AuthResponseDto(
                token,
                new UserDto(
                    user.Id,
                    user.TenantId,
                    user.FullName,
                    user.Email,
                    roleCode,
                    permissions,

                    orgMembership?.OrganizationType)));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                step = "Login",
                exception = ex.GetType().FullName,
                message = ex.Message,
                innerException = ex.InnerException?.Message,
                stackTrace = ex.StackTrace
            });
        }
    }

    [HttpPost(
    "admin/events/current/bookings/" +
    "{bookingId:guid}/stall-card/send-email")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> SendStallCardEmail(
    Guid bookingId,
    [FromForm] IFormFile cardImage,
    CancellationToken ct)
    {
        var evt =
            await ResolveCurrentEventAsync(ct);

        if (cardImage is null ||
            cardImage.Length == 0)
        {
            return BadRequest(new
            {
                message = "Stall card image is required."
            });
        }

        if (cardImage.Length > 5 * 1024 * 1024)
        {
            return BadRequest(new
            {
                message =
                    "Stall card image must be 5 MB or smaller."
            });
        }

        var allowedTypes = new[]
        {
        "image/png",
        "image/jpeg"
    };

        if (!allowedTypes.Contains(
                cardImage.ContentType,
                StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                message =
                    "Only PNG or JPEG images are allowed."
            });
        }

        var booking =
            await _db.StallBookings
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    x =>
                        x.Id == bookingId &&
                        x.EventId == evt.Id,
                    ct);

        if (booking is null)
        {
            return NotFound(new
            {
                message = "Booking not found."
            });
        }

        var exhibitor =
            await _db.Exhibitors
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    x => x.Id == booking.ExhibitorId,
                    ct);

        if (exhibitor is null)
        {
            return NotFound(new
            {
                message = "Exhibitor not found."
            });
        }

        if (booking.AllocatedStallId is null)
        {
            return UnprocessableEntity(new
            {
                message =
                    "No stall is allocated to this booking."
            });
        }

        var stall =
            await _db.Stalls
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    x =>
                        x.Id ==
                        booking.AllocatedStallId.Value &&
                        x.EventId == evt.Id,
                    ct);

        if (stall is null)
        {
            return NotFound(new
            {
                message = "Allocated stall not found."
            });
        }

        var recipient =
            exhibitor.Email?.Trim();

        if (string.IsNullOrWhiteSpace(recipient) ||
            !System.Net.Mail.MailAddress.TryCreate(
                recipient,
                out _))
        {
            return UnprocessableEntity(new
            {
                message =
                    "A valid exhibitor email is not available."
            });
        }

        var venue =
            _configuration[
                "EventDefaults:Venue"]
            ?? "Hotel Hills, Hosur";

        var eventDate =
            _configuration[
                "EventDefaults:EventDateDisplay"]
            ?? "18 & 19 September 2026";

        var emailLog =
            _emailComposer.ComposeStallCardEmail(
                booking,
                stall,
                exhibitor,
                recipient,
                venue,
                eventDate);

        var extension =
            cardImage.ContentType.Equals(
                "image/jpeg",
                StringComparison.OrdinalIgnoreCase)
                ? ".jpg"
                : ".png";

        var attachmentFileName =
            $"StallCard_{stall.StallNumber}_" +
            $"{booking.BookingRegistrationNumber}" +
            extension;

        byte[] cardBytes;

        await using (var stream =
                     new MemoryStream())
        {
            await cardImage.CopyToAsync(
                stream,
                ct);

            cardBytes =
                stream.ToArray();
        }

        try
        {
            await _emailSender
                .SendEmailWithAttachmentAsync(
                    emailLog.ToEmail,
                    emailLog.Subject,
                    emailLog.BodySnapshot,
                    cardBytes,
                    attachmentFileName);
        }
        catch (Exception emailException)
        {
            _logger.LogError(
                emailException,
                "Failed to email stall card for " +
                "booking {BookingId} to {Recipient}",
                booking.Id,
                recipient);

            return StatusCode(
                StatusCodes.Status502BadGateway,
                new
                {
                    message =
                        "Stall card generated, but email delivery failed.",
                    errorType =
                        emailException.GetType().Name,
                    exactError =
                        emailException.Message,
                    innerError =
                        emailException
                            .InnerException?
                            .Message
                });
        }

        await _db.EmailLogs.AddAsync(
            emailLog,
            ct);

        var actorClaim =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        Guid? actorUserId =
            Guid.TryParse(
                actorClaim,
                out var parsedActorId)
                ? parsedActorId
                : null;

        await _db.AuditLogs.AddAsync(
            Audit(
                evt.TenantId,
                evt.Id,
                actorUserId,
                "StallBooking",
                booking.Id,
                "Stall card emailed",
                null,
                new
                {
                    BookingId = booking.Id,
                    booking.BookingRegistrationNumber,
                    StallId = stall.Id,
                    stall.StallNumber,
                    Recipient = recipient,
                    AttachmentFileName =
                        attachmentFileName
                }),
            ct);

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            message =
                "Stall details card emailed successfully.",
            recipient,
            attachmentFileName
        });
    }
    [HttpPost("auth/logout")]
    public IActionResult Logout() => NoContent();

    [HttpGet("auth/me")]
    public IActionResult Me() => Ok(new { authenticated = User.Identity?.IsAuthenticated == true, email = User.Identity?.Name });

    [HttpGet("auth/my-permissions")]
    public IActionResult MyPermissions() => Ok(User.Claims.Where(c => c.Type == "permission").Select(c => c.Value).Distinct().ToArray());

    [HttpGet("auth/my-menu")]
    public IActionResult MyMenu()
    {
        var permissions = User.Claims.Where(c => c.Type == "permission").Select(c => c.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var menu = new List<object>();
        if (permissions.Contains("dashboard.view")) menu.Add(new { label = "Dashboard", path = "/app/dashboard", permission = "dashboard.view" });
        if (permissions.Contains("booking.view")) menu.Add(new { label = "Bookings", path = "/app/bookings", permission = "booking.view" });
        if (permissions.Contains("stall.view")) menu.Add(new { label = "Stall Allocation", path = "/app/stall-allocation", permission = "stall.view" });
        if (permissions.Contains("payment.view")) menu.Add(new { label = "Payments", path = "/app/payments", permission = "payment.view" });
        if (permissions.Contains("invoice.view")) menu.Add(new { label = "Proforma Invoices", path = "/app/invoices", permission = "invoice.view" });
        if (permissions.Contains("audit.view")) menu.Add(new { label = "Audit Logs", path = "/app/audit", permission = "audit.view" });
        if (permissions.Contains("admin.users.manage")) menu.Add(new { label = "Administration", path = "/app/admin/users", permission = "admin.users.manage" });
        return Ok(menu);
    }

    [HttpGet("public/events/{eventCode}/stall-sizes")]
    public async Task<IActionResult> PublicStallSizes(string eventCode, CancellationToken ct)
    {
        var cacheKey = $"public_stall_sizes_{eventCode.ToUpper()}";
        if (_cache.TryGetValue(cacheKey, out object? cached) && cached != null)
        {
            return Ok(cached);
        }
        var evt = await ResolveEventAsync(eventCode, ct);
        var sizes = await _db.StallSizes.AsNoTracking().Where(x => x.EventId == evt.Id && x.IsActive).OrderByDescending(x => x.AreaSqM)
            .Select(x => new { x.Id, x.Code, x.DisplayName, x.BaseAmount, x.GstPercentage, x.TotalAmount })
            .ToListAsync(ct);
        _cache.Set(cacheKey, sizes, TimeSpan.FromMinutes(10));
        return Ok(sizes);
    }

    [HttpGet("public/events/{eventCode}/stalls")]
    public async Task<IActionResult> PublicAvailableStalls(string eventCode, [FromQuery] Guid? stallSizeId, CancellationToken ct)
    {
        var evt = await ResolveEventAsync(eventCode, ct);

        var query = _db.Stalls.Where(x =>
            x.EventId == evt.Id &&
            x.IsActive &&
            x.CurrentStatus == StallStatus.Available);

        if (stallSizeId is Guid sizeId)
        {
            query = query.Where(x => x.StallSizeId == sizeId);
        }

        var items = await query
            .OrderBy(x => x.StallNumber)
            .Select(x => new
            {
                x.Id,
                x.StallNumber,
                x.HallName,
                x.ZoneName,
                x.RowLabel,
                x.FloorLabel
            })
            .ToListAsync(ct);

        return Ok(items);
    }
    [HttpPost(
     "admin/events/current/bookings/{bookingId:guid}/proforma-invoice/send-email")]
    public async Task<IActionResult> SendProformaInvoiceEmail(
     Guid bookingId,
     [FromBody] ActorRequest request,
     CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var booking = await _db.StallBookings
            .SingleOrDefaultAsync(
                x => x.Id == bookingId &&
                     x.EventId == evt.Id,
                ct)
            ?? throw new DomainRuleException(
                ErrorCodes.BookingNotFound,
                "Booking not found.");

        if (booking.AllocatedStallId is null)
        {
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "A stall must be blocked or allocated before sending the proforma invoice.");
        }

        var stall = await _db.Stalls
            .SingleOrDefaultAsync(
                x => x.Id == booking.AllocatedStallId.Value &&
                     x.EventId == evt.Id,
                ct)
            ?? throw new DomainRuleException(
                ErrorCodes.StallNotFound,
                "Allocated stall not found.");

        /*
         * Load the size from the allocated stall.
         * Do not use booking.RequestedStallSizeId because the
         * allocated stall may have a different size.
         */
        var blockedStallSize = await _db.StallSizes
            .SingleOrDefaultAsync(
                x => x.Id == stall.StallSizeId,
                ct)
            ?? throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "Size configuration for the allocated stall was not found.");

        var billing = await _db.BillingProfiles
            .SingleOrDefaultAsync(
                x => x.Id == booking.BillingProfileId,
                ct)
            ?? throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "Billing profile not found.");

        var exhibitor = await GetExhibitorAsync(
            booking.ExhibitorId,
            ct);

        var exhibitorEmail = await GetExhibitorEmailAsync(
            booking.ExhibitorId,
            ct);

        if (string.IsNullOrWhiteSpace(exhibitorEmail))
        {
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "Exhibitor email address is not available.");
        }

        var proformaInvoice = await _db.ProformaInvoices
            .FirstOrDefaultAsync(
                x => x.BookingId == booking.Id &&
                     x.InvoiceStatus != InvoiceStatus.Cancelled,
                ct);

        /*
         * Create the invoice when one does not already exist.
         */
        if (proformaInvoice is null)
        {
            var invoiceNo = await NextNumberAsync(
                evt.TenantId,
                evt.Id,
                "PROFORMA_INVOICE",
                "PI-HOSUR-",
                ct);

            var baseAmount = blockedStallSize.BaseAmount;
            var gstAmount = Math.Round(baseAmount * (blockedStallSize.GstPercentage / 100m), 2);
            var totalAmount = baseAmount + gstAmount;

            var expiryText = booking.BlockExpiresAt.HasValue
                ? booking.BlockExpiresAt.Value
                    .ToString("dd MMM yyyy hh:mm tt")
                : "the specified due date";

            var snapshot = new InvoiceSnapshot(
                "Laghu Udyog Bharati Tamil Nadu",
                "Plot No 63A, First Floor, 9th Street, " +
                "Sidco Industrial Estate, Ambattur, Chennai - 600058",
                "33AAATL0575H1ZT",
                "AAATL0575H",

                billing.BillingLegalName,
                billing.BillingAddress,
                billing.BillingGstin,
                billing.BillingPan,
                billing.PlaceOfSupply,

                stall.StallNumber,
                blockedStallSize.DisplayName,
                baseAmount,
                blockedStallSize.GstPercentage,

                NumberToWordsConverter.Convert(totalAmount),

                NumberToWordsConverter.Convert(gstAmount),

                $"Payment request for temporarily blocked stall " +
                $"{stall.StallNumber} ({blockedStallSize.DisplayName}). " +
                $"Please complete payment on or before {expiryText} " +
                $"to confirm the stall allocation. " +
                $"The stall reservation will expire automatically after this date.",

                "LAGHU UDYOG BHARATI",
                "Canara Bank",
                "0908201005559",
                "CNRB0000936",
                "Ambattur Branch, Chennai 600053",
                 stall.IsSponsor ? "HSN 998397" : "HSN 998596");


            proformaInvoice = ProformaInvoice.Generate(
                evt.TenantId,
                evt.Id,
                booking.Id,
                invoiceNo,
                request.ActorUserId,
                snapshot);

            await _db.ProformaInvoices.AddAsync(
                proformaInvoice,
                ct);

            await _db.SaveChangesAsync(ct);
        }
        else
        {
            // Sponsor status may have changed (mark/unmark-sponsor) after this
            // invoice was first generated. Sync the HSN/SAC code as long as the
            // invoice hasn't been sent to the exhibitor yet.
            var expectedHsn = stall.IsSponsor ? "HSN 998397" : "HSN 998596";
            if (proformaInvoice.HsnSac != expectedHsn && proformaInvoice.InvoiceStatus == InvoiceStatus.Generated)
            {
                proformaInvoice.UpdateHsn(expectedHsn);
                await _db.SaveChangesAsync(ct);
            }
        }

        /*
         * Generate the proforma invoice PDF.
         */
        var pdfBytes =
            await _pdfGenerator.GenerateProformaPdfBytesAsync(
                proformaInvoice,
                exhibitor,
                booking.BlockExpiresAt,
                  blockedStallSize.AreaSqM,

                ct);

        var pdfFileName =
            $"ProformaInvoice_{proformaInvoice.InvoiceNumber}.pdf";

        /*
         * Compose the same payment request email used while
         * blocking the stall.
         */
        var paymentContext = new EmailPaymentContext(
            "Laghu Udyog Bharati",
            "Canara Bank",
            "0908201005559",
            "CNRB0000936",
            "Ambattur Branch, Chennai 600053");

        var emailLog = _emailComposer.ComposeBookingReceived(
            booking,
            stall,
            blockedStallSize,
            exhibitorEmail,
            exhibitor,
            paymentContext);

        await _db.EmailLogs.AddAsync(
            emailLog,
            ct);

        await _db.AuditLogs.AddAsync(
            Audit(
                evt.TenantId,
                evt.Id,
                request.ActorUserId,
                "ProformaInvoice",
                proformaInvoice.Id,
                "Proforma invoice emailed",
                null,
                new
                {
                    BookingId = booking.Id,
                    InvoiceId = proformaInvoice.Id,
                    proformaInvoice.InvoiceNumber,
                    StallId = stall.Id,
                    StallNumber = stall.StallNumber,
                    StallSize = blockedStallSize.DisplayName,
                    Amount = blockedStallSize.TotalAmount,
                    Recipient = exhibitorEmail
                }),
            ct);

        await _db.SaveChangesAsync(ct);

        try
        {
            await _emailSender.SendEmailWithAttachmentAsync(
                emailLog.ToEmail,
                emailLog.Subject,
                emailLog.BodySnapshot,
                pdfBytes,
                pdfFileName);
        }
        catch (Exception emailEx)
        {
            _logger.LogError(
                emailEx,
                "Failed to send proforma invoice {InvoiceNumber} " +
                "for booking {BookingId}",
                proformaInvoice.InvoiceNumber,
                booking.Id);

            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "The proforma invoice was generated, but the email could not be sent.");
        }

        return Accepted(new
        {
            message = "Proforma invoice emailed with PDF attachment.",
            bookingId = booking.Id,
            invoiceId = proformaInvoice.Id,
            invoiceNumber = proformaInvoice.InvoiceNumber,
            stallId = stall.Id,
            stallNumber = stall.StallNumber,
            stallSize = blockedStallSize.DisplayName,
            amount = blockedStallSize.TotalAmount,
            recipient = exhibitorEmail,
            blockExpiresAt = booking.BlockExpiresAt
        });
    }

    [HttpGet("admin/events/current/bookings/{bookingId:guid}/proforma-invoice/download")]
    public async Task<IActionResult> DownloadProformaInvoice(
        Guid bookingId,
        CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var booking = await _db.StallBookings
            .SingleOrDefaultAsync(x => x.Id == bookingId && x.EventId == evt.Id, ct)
            ?? throw new DomainRuleException(ErrorCodes.BookingNotFound, "Booking not found.");

        var proformaInvoice = await _db.ProformaInvoices
            .FirstOrDefaultAsync(x => x.BookingId == booking.Id && x.InvoiceStatus != InvoiceStatus.Cancelled, ct)
            ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Proforma invoice has not been generated yet.");

        var exhibitor = await GetExhibitorAsync(booking.ExhibitorId, ct);
        var stallForDownload = booking.AllocatedStallId is Guid sid
            ? await _db.Stalls.SingleOrDefaultAsync(x => x.Id == sid, ct)
            : null;
        var sizeForDownload = stallForDownload is not null
            ? await _db.StallSizes.SingleOrDefaultAsync(x => x.Id == stallForDownload.StallSizeId, ct)
            : null;

        var pdfBytes = await _pdfGenerator.GenerateProformaPdfBytesAsync(
            proformaInvoice,
            exhibitor,
            booking.BlockExpiresAt,
            sizeForDownload?.AreaSqM,
            ct);

        var fileName = $"ProformaInvoice_{proformaInvoice.InvoiceNumber}.pdf";

        return File(pdfBytes, "application/pdf", fileName);
    }
    [HttpDelete("admin/events/current/bookings/{bookingId:guid}")]
    public async Task<IActionResult> DeleteBooking(
    Guid bookingId,
    [FromQuery] Guid? actorUserId,
    CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var booking = await _db.StallBookings
            .SingleOrDefaultAsync(x => x.Id == bookingId && x.EventId == evt.Id, ct)
            ?? throw new DomainRuleException(ErrorCodes.BookingNotFound, "Booking not found.");

        // Only "Submitted" bookings can be deleted — anything past this
        // (BlockedAwaitingPayment, PaymentSubmitted, Confirmed) is protected.
        if (booking.BookingStatus != BookingStatus.Submitted)
        {
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "Only bookings in 'Submitted' status can be deleted.");
        }

        var bookingRegNo = booking.BookingRegistrationNumber;
        var exhibitorId = booking.ExhibitorId;
        var billingProfileId = booking.BillingProfileId;

        var exhibitor = await _db.Exhibitors.SingleOrDefaultAsync(x => x.Id == exhibitorId, ct);
        var billing = await _db.BillingProfiles.SingleOrDefaultAsync(x => x.Id == billingProfileId, ct);

        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        var emailLogs = await _db.EmailLogs.Where(x => x.BookingId == booking.Id).ToListAsync(ct);
        if (emailLogs.Count > 0) _db.EmailLogs.RemoveRange(emailLogs);

        var proformaInvoices = await _db.ProformaInvoices.Where(x => x.BookingId == booking.Id).ToListAsync(ct);
        if (proformaInvoices.Count > 0) _db.ProformaInvoices.RemoveRange(proformaInvoices);

        var payments = await _db.Payments.Where(x => x.BookingId == booking.Id).ToListAsync(ct);
        if (payments.Count > 0) _db.Payments.RemoveRange(payments);

        var allocations = await _db.StallAllocations.Where(x => x.BookingId == booking.Id).ToListAsync(ct);
        if (allocations.Count > 0) _db.StallAllocations.RemoveRange(allocations);

        // Audit BEFORE removing the booking row (keeps a trace it existed).
        await _db.AuditLogs.AddAsync(
            Audit(
                evt.TenantId,
                evt.Id,
                actorUserId,
                "StallBooking",
                booking.Id,
                "Booking deleted (Submitted)",
                new
                {
                    BookingRegistrationNumber = bookingRegNo,
                    ExhibitorName = exhibitor?.LegalName,
                    ExhibitorEmail = exhibitor?.Email
                },
                null),
            ct);

        _db.StallBookings.Remove(booking);

        if (billing is not null) _db.BillingProfiles.Remove(billing);
        if (exhibitor is not null) _db.Exhibitors.Remove(exhibitor);

        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        InvalidateAdminCaches(evt.Id);

        return Ok(new
        {
            bookingId,
            bookingRegistrationNumber = bookingRegNo,
            message = "Booking, exhibitor and billing details deleted successfully."
        });
    }

    public class BulkEditAccessRequest
    {
        [System.Text.Json.Serialization.JsonPropertyName("bookingIds")]
        public List<Guid>? BookingIds { get; set; }
    }

    [HttpPost("admin/events/current/bookings/send-edit-access-allocated")]
    public async Task<IActionResult> SendEditAccessForAllocatedStalls(
        [FromBody] BulkEditAccessRequest? request,
        CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var query = _db.StallBookings
            .Where(x => x.EventId == evt.Id && x.AllocatedStallId != null);

        // if specific booking ids were selected (checkboxes), restrict to those.
        if (request?.BookingIds is { Count: > 0 })
        {
            query = query.Where(x => request.BookingIds.Contains(x.Id));
        }

        var bookings = await query.ToListAsync(ct);

        if (!bookings.Any())
            return Ok(new { message = "No eligible bookings found (stall must be blocked/allocated).", totalEligible = 0, emailsSent = 0 });

        var newEmails = new List<EmailLog>();
        foreach (var booking in bookings)
        {
            var exhibitor = await _db.Exhibitors
                .SingleOrDefaultAsync(x => x.Id == booking.ExhibitorId, ct);

            if (exhibitor == null || string.IsNullOrWhiteSpace(exhibitor.Email))
                continue;

            var editUrl = $"https://msmesangamam.lubtn.com/stall-booking/{booking.Id}";

            var email = _emailComposer.ComposeBookingEditRequest(
                booking,
                exhibitor.Email,
                editUrl);

            await _db.EmailLogs.AddAsync(email, ct);
            newEmails.Add(email);
        }

        await _db.SaveChangesAsync(ct);

        // Load EmailCard.png once (same asset used in single-send)
        var emailCardPath = Path.Combine(AppContext.BaseDirectory, "Assets", "EmailCard.png");

        if (!System.IO.File.Exists(emailCardPath))
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new { message = "EmailCard.png was not found.", searchedPath = emailCardPath });
        }

        var emailCardBytes = await System.IO.File.ReadAllBytesAsync(emailCardPath, ct);

        if (emailCardBytes.Length == 0)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new { message = "EmailCard.png is empty." });
        }

        var sentCount = 0;
        var failedRecipients = new List<string>();

        foreach (var e in newEmails)
        {
            try
            {
                await _emailSender.SendEmailWithAttachmentAsync(
                    e.ToEmail,
                    e.Subject,
                    e.BodySnapshot,
                    emailCardBytes,
                    "EmailCard.png");

                e.MarkSent(null);
                sentCount++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send edit-access email with attachment to {Email}", e.ToEmail);
                failedRecipients.Add(e.ToEmail);
            }
        }

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            totalEligible = bookings.Count,
            emailsSent = sentCount,
            emailsFailed = failedRecipients.Count,
            failedRecipients,
            message = "Edit access mail sent successfully to bookings with an allocated stall."
        });
    }

    [HttpPost("public/events/{eventCode}/bookings")]
    public async Task<IActionResult> SubmitPublicBooking(
        string eventCode,
        [FromBody] SubmitBookingCommand command,
        CancellationToken ct)
    {
        var evt = await ResolveEventAsync(eventCode, ct);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if (evt.Status != EventStatus.Open ||
            today < evt.BookingOpenDate ||
            today > evt.BookingCloseDate)
        {
            throw new DomainRuleException(
                "EVENT_NOT_OPEN",
                "Booking is not open for this event.");
        }

        var size = await _db.StallSizes
            .SingleOrDefaultAsync(
                x => x.Id == command.RequestedStallSizeId &&
                     x.EventId == evt.Id &&
                     x.IsActive,
                ct)
            ?? throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "Requested stall size is not available for the event.");

        ValidatePublicBooking(command);

        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        var exhibitor = Exhibitor.CreateFull(
            evt.TenantId,
            command.Exhibitor.LegalName,
            command.Exhibitor.TradeName,
            command.Exhibitor.RegisteredAddress,
            command.Exhibitor.City,
            command.Exhibitor.District,
            command.Exhibitor.State,
            command.Exhibitor.Pincode,
            command.Exhibitor.Country,
            command.Exhibitor.ContactPersonName,
            command.Exhibitor.ContactPersonDesignation,
            command.Exhibitor.Mobile,
            command.Exhibitor.AlternateMobile,
            command.Exhibitor.Email,
            command.Exhibitor.AlternateEmail,
            command.Exhibitor.Website,
            command.Exhibitor.IndustryScale,
            command.Exhibitor.BusinessType,
            command.Exhibitor.CompanyConstitution,
            command.Exhibitor.IndustryCategory,
            command.Exhibitor.ProductServiceDescription,
            command.Exhibitor.ProductKeywords,
// Corrected order in PortalController.cs
command.Exhibitor.UdyamNumber,
command.Exhibitor.Gstin,      // Move Gstin here (3rd)
command.Exhibitor.Pan,        // Move Pan here (4th)
command.Exhibitor.TanNumber,  // Move TanNumber here (5th)

            command.Exhibitor.LubMember,
            command.Exhibitor.LubState,
            command.Exhibitor.LubChapter,
              null,
            command.Exhibitor.LubMembershipNumber);

        exhibitor.UpdateBankDetails(
            command.Exhibitor.BankAccountName,
            command.Exhibitor.BankName,
            command.Exhibitor.BankAccountNumber,
            command.Exhibitor.BankIfscCode);

        await _db.Exhibitors.AddAsync(exhibitor, ct);
        await _db.SaveChangesAsync(ct);

        var b = command.Billing;

        var billing = BillingProfile.CreateFull(
            evt.TenantId,
            exhibitor.Id,
            b?.BillingLegalName ?? "",
            b?.BillingAddress ?? "",
            b?.BillingCity ?? "",
            b?.BillingState ?? "",
            b?.BillingStateCode ?? "",
            b?.BillingPincode ?? "",
            b?.BillingCountry ?? "",
            b?.BillingGstin ?? "",
            b?.BillingPan ?? "",
            //b?.BillingTanNumber ?? "",
            b?.PlaceOfSupply ?? "",
            b?.BillingContactPerson ?? "",
            b?.BillingEmail ?? "",
            b?.BillingMobile ?? "");

        await _db.BillingProfiles.AddAsync(billing, ct);
        await _db.SaveChangesAsync(ct);

        var number = await NextNumberAsync(
            evt.TenantId,
            evt.Id,
            "BOOKING",
            "MSME-HOSUR-",
            ct);

        var booking = StallBookingEntity.Submit(
            evt.TenantId,
            evt.Id,
            exhibitor.Id,
            billing.Id,
            size.Id,
            number,
            command.FasciaName,
            command.DisplayNotes,
            command.ElectricalRequirement,
            command.SpecialRequirement,
            command.HazardousDemoDeclared,
            command.TermsAccepted == true,
            command.AccuracyAccepted == true,
            command.PaymentTimelineAccepted == true,
            command.CancellationPolicyAccepted == true,
            command.PrivacyConsentAccepted == true,
            command.DeclarantName ?? "",
            command.DeclarantDesignation ?? "",


            command.DeclarationDate ?? DateOnly.FromDateTime(DateTime.UtcNow));
        if (command.StallOption1Id is Guid option1Id)
        {
            var option1 = await _db.Stalls.SingleOrDefaultAsync(
                x => x.Id == option1Id && x.EventId == evt.Id && x.IsActive, ct)
                ?? throw new DomainRuleException(ErrorCodes.StallNotFound, "Preferred stall option 1 was not found.");
            booking.StallOption1Id = option1.Id;
        }

        if (command.StallOption2Id is Guid option2Id)
        {
            var option2 = await _db.Stalls.SingleOrDefaultAsync(
                x => x.Id == option2Id && x.EventId == evt.Id && x.IsActive, ct)
                ?? throw new DomainRuleException(ErrorCodes.StallNotFound, "Preferred stall option 2 was not found.");
            booking.StallOption2Id = option2.Id;
        }
        _logger.LogInformation("Before Save 3");
        await _db.StallBookings.AddAsync(booking, ct);

        await _db.AuditLogs.AddAsync(
            Audit(
                evt.TenantId,
                evt.Id,
                null,
                "StallBooking",
                booking.Id,
                "Public booking submitted",
                null,
                new { number }),
            ct);
        _logger.LogInformation("After Save 1");

        await _db.SaveChangesAsync(ct);

        var submittedEmail = _emailComposer.ComposeBookingSubmitted(
            booking,
            exhibitor,
            size,
            command.Exhibitor.Email);

        await _db.EmailLogs.AddAsync(submittedEmail, ct);
        _logger.LogInformation("Before Save 1");
        await _db.SaveChangesAsync(ct);

        await tx.CommitAsync(ct);

        try
        {
            await _emailSender.SendEmailAsync(
                submittedEmail.ToEmail,
                submittedEmail.Subject,
                submittedEmail.BodySnapshot);

            submittedEmail.MarkSent(null);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception emailEx)
        {
            _logger.LogError(emailEx, "Failed to send booking confirmation email for booking {BookingId}", booking.Id);
            // Email failure should not fail the booking — it is already saved.

            submittedEmail.MarkFailed(emailEx.Message);
            await _db.SaveChangesAsync(ct);
        }

        return Ok(new
        {
            booking = new
            {
                id = booking.Id,
                tenantId = booking.TenantId,
                eventId = booking.EventId,
                exhibitorId = booking.ExhibitorId,
                billingProfileId = booking.BillingProfileId,
                stallSizeId = booking.RequestedStallSizeId,

                bookingRegistrationNumber = booking.BookingRegistrationNumber,
                status = booking.BookingStatus.ToString(),

                fasciaName = booking.FasciaName,
                displayNotes = booking.DisplayNotes,
                electricalRequirement = booking.ElectricalRequirement,
                specialRequirement = booking.SpecialRequirement,
                hazardousDemoDeclared = booking.HazardousDemoDeclared,

                termsAccepted = booking.TermsAccepted,
                accuracyAccepted = booking.AccuracyAccepted,
                paymentTimelineAccepted = booking.PaymentTimelineAccepted,
                cancellationPolicyAccepted = booking.CancellationPolicyAccepted,
                privacyConsentAccepted = booking.PrivacyConsentAccepted,

                declarantName = booking.DeclarantName,
                declarantDesignation = booking.DeclarantDesignation,
                declarationDate = booking.DeclarationDate,

                stallOption1Id = booking.StallOption1Id,
                stallOption2Id = booking.StallOption2Id
            },

            exhibitor = new
            {
                id = exhibitor.Id,
                legalName = exhibitor.LegalName,
                tradeName = exhibitor.TradeName,
                registeredAddress = exhibitor.RegisteredAddress,
                city = exhibitor.City,
                district = exhibitor.District,
                state = exhibitor.State,
                pincode = exhibitor.Pincode,
                country = exhibitor.Country,

                contactPersonName = exhibitor.ContactPersonName,
                contactPersonDesignation = exhibitor.ContactPersonDesignation,
                mobile = exhibitor.Mobile,
                alternateMobile = exhibitor.AlternateMobile,
                email = exhibitor.Email,
                alternateEmail = exhibitor.AlternateEmail,
                website = exhibitor.Website,

                industryScale = exhibitor.IndustryScale,
                businessType = exhibitor.BusinessType,
                companyConstitution = exhibitor.CompanyConstitution,
                industryCategory = exhibitor.IndustryCategory,
                productServiceDescription = exhibitor.ProductServiceDescription,
                productKeywords = exhibitor.ProductKeywords,

                udyamNumber = exhibitor.UdyamNumber,
                gstin = exhibitor.Gstin,
                pan = exhibitor.Pan,
                tanNumber = exhibitor.TanNumber,

                lubMember = exhibitor.LubMember,
                lubState = exhibitor.LubState,
                lubChapter = exhibitor.LubChapter,
                lubMembershipNumber = exhibitor.LubMembershipNumber
            },

            billing = new
            {
                id = billing.Id,
                billingLegalName = billing.BillingLegalName,
                billingAddress = billing.BillingAddress,
                billingCity = billing.BillingCity,
                billingState = billing.BillingState,
                billingStateCode = billing.BillingStateCode,
                billingPincode = billing.BillingPincode,
                billingCountry = billing.BillingCountry,
                billingGstin = billing.BillingGstin,
                billingPan = billing.BillingPan,
                placeOfSupply = billing.PlaceOfSupply,
                billingContactPerson = billing.BillingContactPerson,
                billingEmail = billing.BillingEmail,
                billingMobile = billing.BillingMobile
            },

            stall = new
            {
                id = size.Id,
                stallSizeId = size.Id
            },

            message = "Your stall booking interest has been received successfully."
        });
    }
    private void InvalidateAdminCaches(Guid? eventId = null)
    {
        _cache.Remove("admin_bookings_all");
        _cache.Remove("admin_bookings_submitted");
        _cache.Remove("admin_bookings_underreview");
        _cache.Remove("admin_bookings_blockedawaitingpayment");
        _cache.Remove("admin_bookings_confirmed");
        _cache.Remove("admin_bookings_allocated");
        _cache.Remove("admin_bookings_paymentsubmitted");
        _cache.Remove("admin_bookings_null");
        if (eventId.HasValue)
        {
            _cache.Remove($"admin_stalls_{eventId.Value}");
            _cache.Remove($"admin_dashboard_summary_{eventId.Value}");
            _cache.Remove($"admin_payment_summaries_{eventId.Value}");
        }
    }

    [HttpGet("admin/events/current/bookings")]
    public async Task<ActionResult<IReadOnlyList<BookingDto>>> ListBookings([FromQuery] string? status, CancellationToken ct)
    {

        var cacheKey = $"admin_bookings_{status?.ToLowerInvariant() ?? "all"}";
        if (_cache.TryGetValue(cacheKey, out IReadOnlyList<BookingDto>? cachedResult) && cachedResult != null)
        {
            return Ok(cachedResult);
        }
        var evt = await ResolveCurrentEventAsync(ct);

        var query = _db.StallBookings
                  .AsNoTracking()
                  .Where(x => x.EventId == evt.Id);
        if (!string.IsNullOrWhiteSpace(status) &&
            status != "All" &&
            Enum.TryParse<BookingStatus>(status, out var parsed))
        {
            query = query.Where(x => x.BookingStatus == parsed);
        }

        var items = await (
            from booking in query
            join exhibitor in _db.Exhibitors.AsNoTracking() on booking.ExhibitorId equals exhibitor.Id
            join stall in _db.Stalls.AsNoTracking() on booking.AllocatedStallId equals stall.Id into stallJoin
            from stall in stallJoin.DefaultIfEmpty()
            join size in _db.StallSizes.AsNoTracking() on booking.RequestedStallSizeId equals size.Id
            join option1 in _db.Stalls.AsNoTracking() on booking.StallOption1Id equals option1.Id into option1Join
            from option1 in option1Join.DefaultIfEmpty()
            join option2 in _db.Stalls.AsNoTracking() on booking.StallOption2Id equals option2.Id into option2Join
            from option2 in option2Join.DefaultIfEmpty()

            orderby booking.CreatedAt descending
            select new
            {
                booking,
                exhibitor,
                stall,
                size,
                option1,
                option2
            }
        ).ToListAsync(ct);

        var bookingIds = items.Select(x => x.booking.Id).ToHashSet();
        var paymentSummary = bookingIds.Count == 0
            ? new Dictionary<Guid, (decimal TotalPaid, decimal? SponsorTarget)>()
            : await _db.Payments
                   .AsNoTracking()
                   .Where(p => p.EventId == evt.Id && p.VerificationStatus == PaymentVerificationStatus.Verified)
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
                   .ToDictionaryAsync(x => x.BookingId, x => (x.TotalPaid, x.SponsorTarget), ct);

        var proformaSummary = bookingIds.Count == 0
            ? new Dictionary<Guid, decimal?>()
            : await _db.ProformaInvoices
                   .AsNoTracking()
                   .Where(pi => pi.EventId == evt.Id && pi.InvoiceStatus != InvoiceStatus.Cancelled)
                   .GroupBy(pi => pi.BookingId)
                   .Select(g => new
                   {
                       BookingId = g.Key,
                       LatestTotalAmount = g.OrderByDescending(pi => pi.GeneratedAt).Select(pi => (decimal?)pi.TotalAmount).FirstOrDefault()
                   })
                   .ToDictionaryAsync(x => x.BookingId, x => x.LatestTotalAmount, ct);

        var result = items.Select(x =>
        {
            paymentSummary.TryGetValue(x.booking.Id, out var pay);
            proformaSummary.TryGetValue(x.booking.Id, out var prof);

            var totalPaid = pay.TotalPaid;
            var sponsorTarget = pay.SponsorTarget;
            var sponsorTargetFromAllocation = prof;
            var isSponsor = x.stall != null && x.stall.IsSponsor;

            var expectedTotal = isSponsor
                ? (sponsorTarget > 0
                    ? sponsorTarget!.Value
                    : (sponsorTargetFromAllocation > 0 ? sponsorTargetFromAllocation!.Value : x.size.TotalAmount))
                     : x.size.TotalAmount;

            var balance = expectedTotal - totalPaid;

            return new BookingDto(
                x.booking.Id,
                x.booking.TenantId,
                x.booking.EventId,
                x.booking.ExhibitorId,
                x.booking.BillingProfileId,
                x.booking.RequestedStallSizeId,
                x.booking.AllocatedStallId,
                x.booking.BookingRegistrationNumber,
                x.booking.BookingDate,

                x.exhibitor.LegalName,
                x.exhibitor.ContactPersonName,
                x.exhibitor.Email,
                x.exhibitor.Mobile,

                x.exhibitor.Pan,
                x.exhibitor.UdyamNumber,
     x.exhibitor.TanNumber,
                x.exhibitor.Gstin,

                x.exhibitor.District,
                x.exhibitor.RegisteredAddress,
                x.exhibitor.City,
                x.exhibitor.IndustryCategory,
                x.exhibitor.ProductKeywords,
                x.exhibitor.BusinessType,
                x.exhibitor.ProductServiceDescription,
                x.booking.FasciaName,
                  x.exhibitor.LubMember,

                x.booking.BookingStatus.ToString(),
                x.stall == null ? null : x.stall.StallNumber,
                x.booking.BlockExpiresAt,
                x.booking.LastEmailSentAt,
                x.booking.ConfirmedAt,
                x.booking.CancelledAt,
                x.booking.CancellationReason,
                x.size.Code,
                x.size.DisplayName,
                expectedTotal,                 // was x.size.TotalAmount
                x.option1 == null ? null : x.option1.StallNumber,
                x.option2 == null ? null : x.option2.StallNumber,
                x.exhibitor.CompanyLogo,


               totalPaid,
                balance                       // was x.size.TotalAmount - TotalPaid
            );
        }).ToList();
        _cache.Set(cacheKey, (IReadOnlyList<BookingDto>)result, TimeSpan.FromSeconds(30));


        return Ok(result);

    }


    [HttpGet("admin/events/current/bookings/{bookingId:guid}")]
    public async Task<IActionResult> GetBooking(
       Guid bookingId,
       CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var booking = await _db.StallBookings
            .AsNoTracking()
            .Where(x =>
                x.Id == bookingId &&
                x.EventId == evt.Id)
            .Select(x => new
            {
                x.Id,
                x.EventId,
                x.ExhibitorId,
                x.BillingProfileId,
                x.RequestedStallSizeId,
                x.AllocatedStallId,

                x.BookingRegistrationNumber,
                x.FasciaName,
                x.DisplayNotes,
                x.ElectricalRequirement,
                x.SpecialRequirement,
                x.HazardousDemoDeclared,
                x.TermsAccepted,
                x.DeclarantName,
                x.DeclarantDesignation,
                x.DeclarationDate,

                x.BookingStatus,
                x.BlockExpiresAt,
                x.CreatedAt,
                x.UpdatedAt
            })
            .SingleOrDefaultAsync(ct);

        if (booking is null)
        {
            throw new DomainRuleException(
                ErrorCodes.BookingNotFound,
                "Booking not found.");
        }

        var exhibitor = await _db.Exhibitors
            .AsNoTracking()
            .Where(x => x.Id == booking.ExhibitorId)
            .Select(x => new
            {
                x.Id,
                x.LegalName,
                x.TradeName,
                x.RegisteredAddress,
                x.City,
                x.District,
                x.State,
                x.Pincode,
                x.Country,

                x.ContactPersonName,
                x.ContactPersonDesignation,
                x.Mobile,
                x.AlternateMobile,
                x.Email,
                x.AlternateEmail,
                x.Website,

                x.IndustryScale,
                x.BusinessType,
                x.CompanyConstitution,
                x.IndustryCategory,
                x.ProductServiceDescription,
                x.ProductKeywords,

                x.UdyamNumber,
                x.Gstin,
                x.Pan,
                x.TanNumber,
                x.LubMember,
                x.LubState,
                x.LubChapter,
                x.LubMembershipNumber,
                x.CompanyLogo,
                x.BankAccountName,
                x.BankAccountNumber,
                x.BankIfscCode,
                x.BankName
            })
            .SingleOrDefaultAsync(ct);

        object? billing = null;

        if (booking.BillingProfileId != Guid.Empty)
        {
            billing = await _db.BillingProfiles
                .AsNoTracking()
                .Where(x => x.Id == booking.BillingProfileId)
                .Select(x => new
                {
                    x.Id,
                    x.BillingContactPerson,
                    x.BillingPan,
                    x.BillingAddress,
                    x.BillingCity,
                    x.BillingCountry,
                    x.BillingState,
                    x.BillingPincode,
                    x.BillingGstin,
                    x.BillingEmail,
                    x.BillingMobile
                })
                .SingleOrDefaultAsync(ct);
        }

        object? stall = null;

        if (booking.AllocatedStallId.HasValue)
        {
            stall = await _db.Stalls
                .AsNoTracking()
                .Where(x =>
                    x.Id == booking.AllocatedStallId.Value &&
                    x.EventId == evt.Id)
                .Select(x => new
                {
                    x.Id,
                    x.StallNumber,
                    x.CurrentStatus,
                    x.HallName,
                    x.ZoneName
                })
                .SingleOrDefaultAsync(ct);
        }

        var stallSize = await _db.StallSizes
            .AsNoTracking()
            .Where(x =>
                x.Id == booking.RequestedStallSizeId &&
                x.EventId == evt.Id)
            .Select(x => new
            {
                x.Id,
                x.Code,
                x.DisplayName,
                x.BaseAmount,
                x.GstPercentage,
                x.TotalAmount
            })
            .SingleOrDefaultAsync(ct);

        var proformaInvoice = await _db.ProformaInvoices
            .AsNoTracking()
            .Where(x =>
                x.BookingId == bookingId &&
                x.InvoiceStatus != InvoiceStatus.Cancelled)
            .OrderByDescending(x => x.GeneratedAt)
            .Select(x => new
            {
                x.Id,
                x.InvoiceNumber,
                x.TaxInvoiceNumber,
                x.InvoiceDate,
                x.InvoiceStatus,
                x.BaseAmount,
                x.GstAmount,
                x.TotalAmount,
                x.GeneratedAt,
                x.SentAt
            })
            .FirstOrDefaultAsync(ct);

        var payment = await _db.Payments
            .AsNoTracking()
            .Where(x => x.BookingId == bookingId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                x.Id,
                x.PaymentReferenceNumber,
                x.ReceiptNumber,
                x.AmountPaid,
                x.PaymentDate,
                x.PaymentMode,
                x.VerificationStatus,
                x.PayerName,
                x.PayerBank,
                x.Remarks,
                x.VerifiedAt
            })
            .FirstOrDefaultAsync(ct);

        return Ok(new
        {
            booking,
            exhibitor,
            billing,
            stall,
            stallSize,
            proformaInvoice,
            payment
        });
    }

    [HttpGet("admin/events/current/stalls")]
    public async Task<IActionResult> ListStalls(CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);
        var cacheKey = $"admin_stalls_{evt.Id}";
        if (_cache.TryGetValue(cacheKey, out object? cached) && cached != null)
        {
            return Ok(cached);
        }
        var items = await _db.Stalls.AsNoTracking().Where(x => x.EventId == evt.Id).OrderBy(x => x.StallNumber).Select(x => new { x.Id, x.TenantId, x.EventId, x.StallSizeId, x.StallNumber, currentStatus = x.CurrentStatus.ToString(), x.CurrentBookingId, x.IsSponsor }).ToListAsync(ct);
        _cache.Set(cacheKey, items, TimeSpan.FromSeconds(60)); return Ok(items);
    }
    [HttpPost("admin/events/{eventId:guid}/stalls/{stallId:guid}/mark-sponsor")]
    public async Task<IActionResult> MarkStallAsSponsor(Guid eventId, Guid stallId, CancellationToken ct)
    {
        var stall = await _db.Stalls.SingleOrDefaultAsync(x => x.Id == stallId && x.EventId == eventId, ct)
            ?? throw new DomainRuleException(ErrorCodes.StallNotFound, "Stall not found.");
        stall.MarkAsSponsor();
        await _db.SaveChangesAsync(ct);
        return Ok(new
        {
            message = "Stall marked as sponsor. Its proforma invoice will use HSN 998397.",
            stallId = stall.Id,
            stallNumber = stall.StallNumber,
            isSponsor = stall.IsSponsor
        });
    }

    [HttpPost("admin/events/{eventId:guid}/stalls/{stallId:guid}/unmark-sponsor")]
    public async Task<IActionResult> UnmarkStallAsSponsor(Guid eventId, Guid stallId, CancellationToken ct)
    {
        var stall = await _db.Stalls.SingleOrDefaultAsync(x => x.Id == stallId && x.EventId == eventId, ct)
            ?? throw new DomainRuleException(ErrorCodes.StallNotFound, "Stall not found.");
        stall.UnmarkAsSponsor();
        await _db.SaveChangesAsync(ct);
        return Ok(new
        {
            message = "Stall unmarked as sponsor. Its proforma invoice will use the standard HSN code.",
            stallId = stall.Id,
            stallNumber = stall.StallNumber,
            isSponsor = stall.IsSponsor
        });
    }


    [HttpPost("admin/events/current/stalls")]
    public async Task<IActionResult> CreateStall([FromBody] StallMasterRequest request, CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var stall = Stall.Create(
            evt.TenantId,
            evt.Id,
            request.StallSizeId,
            request.StallNumber,
            request.HallName,
            request.ZoneName,
            request.RowLabel,
            request.FloorLabel,
            request.LayoutX,
            request.LayoutY,
            request.IsActive);

        await _db.Stalls.AddAsync(stall, ct);
        await _db.SaveChangesAsync(ct);

        return Ok(stall);
    }

    [HttpPut("admin/events/current/stalls/{stallId:guid}")]
    public async Task<IActionResult> UpdateStall(Guid stallId, [FromBody] StallMasterRequest request, CancellationToken ct)
    {
        var stall = await _db.Stalls.SingleOrDefaultAsync(x => x.Id == stallId, ct);
        if (stall is null) return NotFound();

        stall.Update(
            request.StallSizeId,
            request.StallNumber,
            request.HallName,
            request.ZoneName,
            request.RowLabel,
            request.FloorLabel,
            request.LayoutX,
            request.LayoutY,
            request.IsActive);

        await _db.SaveChangesAsync(ct);

        return Ok(stall);
    }
    [HttpPost("admin/events/current/bookings/{bookingId:guid}/block-stall")]
    public async Task<IActionResult> BlockStall(
       Guid bookingId,
       [FromBody] BlockStallApiRequest request,
       CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var booking = await _db.StallBookings
            .SingleOrDefaultAsync(x => x.Id == bookingId, ct)
            ?? throw new DomainRuleException(
                ErrorCodes.BookingNotFound,
                "Booking not found.");

        var stall = await _db.Stalls
            .SingleOrDefaultAsync(
                x => x.Id == request.StallId &&
                     x.EventId == evt.Id,
                ct)
            ?? throw new DomainRuleException(
                ErrorCodes.StallNotFound,
                "Stall not found.");

        if (booking.BookingStatus is not
            (BookingStatus.Submitted or BookingStatus.UnderReview))
        {
            throw new DomainRuleException(
                ErrorCodes.BookingNotEligibleForBlocking,
                "Booking is not eligible for stall blocking.");
        }

        /*
         * IMPORTANT:
         * Load the size from the selected stall, not from
         * booking.RequestedStallSizeId.
         *
         * Replace StallSizeId below if your Stall entity uses
         * another property name, such as SizeId.
         */
        var blockedStallSize = await _db.StallSizes
               .SingleOrDefaultAsync(
                   x => x.Id == stall.StallSizeId,
                   ct);

        decimal baseAmountForBlock;
        decimal gstAmountForBlock;
        decimal totalAmountForBlock;
        if (stall.IsSponsor)
        {
            if (!request.TargetSponsorTotal.HasValue || request.TargetSponsorTotal.Value <= 0)
            {
                throw new DomainRuleException(
                    ErrorCodes.ValidationFailed,
                    "This is a sponsor stall. Please enter the target (open) amount before allocating it.");
            }

            decimal targetAmount = request.TargetSponsorTotal.Value;

            if (request.IsGstApplicable)
            {
                baseAmountForBlock = targetAmount;
                gstAmountForBlock = Math.Round(baseAmountForBlock * (blockedStallSize.GstPercentage / 100m), 2);
                totalAmountForBlock = baseAmountForBlock + gstAmountForBlock;
            }
            else
            {
                baseAmountForBlock = targetAmount;
                gstAmountForBlock = 0m;
                totalAmountForBlock = baseAmountForBlock;
            }
        }
        else
        {
            if (request.IsGstApplicable)
            {
                baseAmountForBlock = blockedStallSize.BaseAmount;
                gstAmountForBlock = Math.Round(baseAmountForBlock * (blockedStallSize.GstPercentage / 100m), 2);
                totalAmountForBlock = baseAmountForBlock + gstAmountForBlock;
            }
            else
            {
                baseAmountForBlock = blockedStallSize.BaseAmount;
                gstAmountForBlock = 0m;
                totalAmountForBlock = baseAmountForBlock;
            }
        }

        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        var expiresAt = DateTimeOffset.UtcNow
            .AddDays(evt.StallBlockValidityDays);

        stall.Block(booking.Id);

        booking.MarkBlocked(
            stall.Id,
            expiresAt);

        await _db.StallAllocations.AddAsync(
            StallAllocation.Block(
                evt.TenantId,
                evt.Id,
                booking.Id,
                stall.Id,
                request.ActorUserId,
                expiresAt),
            ct);

        var paymentContext = new EmailPaymentContext(
            "Laghu Udyog Bharati",
            "Canara Bank",
            "0908201005559",
            "CNRB0000936",
            "Ambattur Branch, Chennai 600053");

        var exhibitorEmail = await GetExhibitorEmailAsync(
            booking.ExhibitorId,
            ct);
        var exhibitor = await GetExhibitorAsync(
booking.ExhibitorId,
ct);
        /*
         * Email also receives the actual blocked-stall size.
         */
        var email = _emailComposer.ComposeBookingReceived(
            booking,
            stall,
            blockedStallSize,
            exhibitorEmail,
            exhibitor,
            paymentContext);

        await _db.EmailLogs.AddAsync(email, ct);

        await _db.AuditLogs.AddAsync(
            Audit(
                evt.TenantId,
                evt.Id,
                request.ActorUserId,
                "StallBooking",
                booking.Id,
                "Stall blocked",
                null,
                new
                {
                    StallId = stall.Id,
                    StallName = stall.StallNumber,
                    StallSizeId = blockedStallSize.Id,
                    StallSize = blockedStallSize.DisplayName,
                    ExpiresAt = expiresAt
                }),
            ct);

        var billing = await _db.BillingProfiles
            .SingleOrDefaultAsync(
                x => x.Id == booking.BillingProfileId,
                ct);
        //?? throw new DomainRuleException(
        //    //ErrorCodes.BillingProfileNotFound,
        //    "Billing profile not found.");

        //var exhibitor = await GetExhibitorAsync(
        //    booking.ExhibitorId,
        //    ct);

        /*
         * The invoice snapshot now uses:
         *
         * 1. The selected stall's number/name
         * 2. The selected stall's actual configured size
         * 3. The selected stall size's amounts
         */
        var snapshot = new InvoiceSnapshot(
     "Laghu Udyog Bharati Tamil Nadu",
     "Plot No 63A, First Floor, 9th Street, " +
     "Sidco Industrial Estate, Ambattur, Chennai - 600058",
     "33AAATL0575H1ZT",
     "AAATL0575H",

     billing.BillingLegalName,
     billing.BillingAddress,
     billing.BillingGstin,
     billing.BillingPan,
     billing.PlaceOfSupply,

     stall.StallNumber,

 blockedStallSize.DisplayName,

 baseAmountForBlock,
 blockedStallSize.GstPercentage,

 NumberToWordsConverter.Convert(
     totalAmountForBlock),

 NumberToWordsConverter.Convert(
     gstAmountForBlock),

 $"Payment request generated for temporarily blocked stall " +
             $"{stall.StallNumber} ({blockedStallSize.DisplayName}). " +
             $"Please complete payment before " +
             $"{expiresAt:dd MMM yyyy hh:mm tt} UTC to confirm the allocation.",

     "LAGHU UDYOG BHARATI",
     "Canara Bank",
     "0908201005559",
     "CNRB0000936",
     "Ambattur Branch, Chennai 600053",
      stall.IsSponsor ? "HSN 998397" : "HSN 998596",
      request.IsTdsDeductable);   // NEW: TDS flag now reaches the proforma invoice


        var proformaInvoice = await _db.ProformaInvoices
            .FirstOrDefaultAsync(
                x => x.BookingId == booking.Id &&
                     x.InvoiceStatus != InvoiceStatus.Cancelled,
                ct);

        if (proformaInvoice is null)
        {
            var invoiceNo = await NextNumberAsync(
                evt.TenantId,
                evt.Id,
                "PROFORMA_INVOICE",
                "PI-HOSUR-",
                ct);

            proformaInvoice = ProformaInvoice.Generate(
                evt.TenantId,
                evt.Id,
                booking.Id,
                invoiceNo,
                request.ActorUserId,
                snapshot);

            await _db.ProformaInvoices.AddAsync(proformaInvoice, ct);
        }
        else if (proformaInvoice.InvoiceStatus == InvoiceStatus.Generated)
        {
            // Invoice already exists but hasn't been sent yet — safe to sync it
            // with the latest snapshot (stall re-allocation, sponsor status change, etc).
            // Not touched if already Sent, to protect the exhibitor-facing PDF/GST trail.
            proformaInvoice.UpdateStallDetails(snapshot, request.ActorUserId);

            // Sponsor status may have changed (mark/unmark-sponsor) after this
            // invoice was first generated. Sync the HSN/SAC code too.
            var expectedHsn = stall.IsSponsor ? "HSN 998397" : "HSN 998596";
            if (proformaInvoice.HsnSac != expectedHsn)
            {
                proformaInvoice.UpdateHsn(expectedHsn);
            }
        }
        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        try
        {
            if (!stall.IsSponsor)
            {
                var pdfBytes =
                    await _pdfGenerator.GenerateProformaPdfBytesAsync(
                        proformaInvoice,
                        exhibitor,
                        booking.BlockExpiresAt,
                          blockedStallSize.AreaSqM,

                        ct);

                var pdfFileName =
                    $"ProformaInvoice_{proformaInvoice.InvoiceNumber}.pdf";

                await _emailSender.SendEmailWithAttachmentAsync(
                    email.ToEmail,
                    email.Subject,
                    email.BodySnapshot,
                    pdfBytes,
                    pdfFileName);
            }
            else
            {
                _logger.LogInformation(
                    "Skipping automatic proforma invoice email for sponsor stall " +
                    "{StallNumber} on booking {BookingId}. Invoice can be downloaded manually.",
                    stall.StallNumber,
                    booking.Id);
            }
        }
        catch (Exception emailEx)
        {
            _logger.LogError(
                emailEx,
                "Failed to send block email with proforma invoice " +
                "for booking {BookingId}",
                booking.Id);
        }

        InvalidateAdminCaches(evt.Id);

        return Accepted(new
        {
            message = stall.IsSponsor
                ? "Sponsor stall blocked. Proforma invoice generated but not emailed automatically — download it manually."
                : "Stall blocked and payment request email sent with proforma invoice PDF.",
            stallId = stall.Id,
            stallName = stall.StallNumber,
            stallSize = blockedStallSize.DisplayName,
            amount = blockedStallSize.TotalAmount,
            blockExpiresAt = expiresAt
        });
    }

    [HttpGet("admin/events/current/payments")]
    public async Task<IActionResult> ListPayments(CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);
        return Ok(await _db.Payments.Where(x => x.EventId == evt.Id).OrderByDescending(x => x.CreatedAt).ToListAsync(ct));
    }
    [HttpGet("admin/events/current/payments/{paymentId:guid}")]
    public async Task<IActionResult> GetPaymentById(Guid paymentId, CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var payment = await _db.Payments
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == paymentId && x.EventId == evt.Id, ct);

        if (payment is null)
            return NotFound(new { message = "Payment not found." });

        return Ok(payment);
    }

    [HttpGet("admin/events/current/bookings/{bookingId:guid}/payment-receipt/download")]
    public async Task<IActionResult> DownloadPaymentReceipt(
    Guid bookingId,
    CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var booking = await _db.StallBookings
            .SingleOrDefaultAsync(x => x.Id == bookingId && x.EventId == evt.Id, ct)
            ?? throw new DomainRuleException(ErrorCodes.BookingNotFound, "Booking not found.");

        var payment = await _db.Payments
            .Where(x => x.BookingId == booking.Id && x.VerificationStatus == PaymentVerificationStatus.Verified)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(ct)
            ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Verified payment not found for this booking.");

        if (booking.AllocatedStallId is null)
        {
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Stall not allocated for this booking.");
        }

        var stall = await _db.Stalls
            .SingleOrDefaultAsync(x => x.Id == booking.AllocatedStallId.Value, ct)
            ?? throw new DomainRuleException(ErrorCodes.StallNotFound, "Allocated stall not found.");

        // NEW — same expected-total / paid-so-far calc used during verification
        var size = await _db.StallSizes.SingleAsync(x => x.Id == booking.RequestedStallSizeId, ct);

        decimal expectedTotal;
        if (stall.IsSponsor)
        {
            var sponsorTargetForReceipt = await _db.Payments
                .Where(x => x.BookingId == booking.Id &&
                            x.VerificationStatus == PaymentVerificationStatus.Verified &&
                            x.TargetSponsorTotal.HasValue &&
                            x.TargetSponsorTotal.Value > 0)
                .OrderByDescending(x => x.VerifiedAt)
                .Select(x => x.TargetSponsorTotal!.Value)
                .FirstOrDefaultAsync(ct);

            expectedTotal = sponsorTargetForReceipt > 0 ? sponsorTargetForReceipt : size.TotalAmount;
        }
        else
        {
            expectedTotal = size.TotalAmount;
        }

        var totalPaidAmount = await _db.Payments
                   .Where(x => x.BookingId == booking.Id && x.VerificationStatus == PaymentVerificationStatus.Verified)
                   .SumAsync(x => x.AmountPaid, ct);

        // TDS is calculated on the base amount (excl. GST), not on the
        // already-net AmountPaid — matches GetAllBookingPaymentSummaries logic.
        var isSpecialTenPercentTds = IsTenPercentTdsBooking(booking.Id, booking.BookingRegistrationNumber);

        var isTdsDeducted = isSpecialTenPercentTds || await _db.Payments
            .Where(x => x.BookingId == booking.Id && x.VerificationStatus == PaymentVerificationStatus.Verified)
            .AnyAsync(x => x.isTdsDeductable, ct);

        var tdsRate = isSpecialTenPercentTds ? 0.10m : 0.02m;
        var tdsBaseAmount = stall.IsSponsor ? expectedTotal : size.BaseAmount;

        var totalTdsAmount = isTdsDeducted
            ? Math.Round(tdsBaseAmount * tdsRate, 2)
            : 0m;

        var exhibitor = await GetExhibitorAsync(booking.ExhibitorId, ct);


        var baseAmountForReceipt = stall.IsSponsor
            ? Math.Round(expectedTotal / (1 + (size.GstPercentage / 100m)), 2)
            : size.BaseAmount;

        var pdfBytes = await _paymentReceiptPdfGenerator.GeneratePdfBytesAsync(
          booking,
          stall,
          size,
          payment,
          exhibitor,
          expectedTotal,
          totalPaidAmount,
          totalTdsAmount,
          baseAmountForReceipt,

          ct);

        var fileName = $"PaymentReceipt_{booking.BookingRegistrationNumber}.pdf";

        return File(pdfBytes, "application/pdf", fileName);
    }

    private static string HtmlEncode(string? value)
    {
        return System.Net.WebUtility.HtmlEncode(
            value ?? string.Empty);
    }

    [HttpGet(
       "admin/events/current/stalls/{stallId:guid}/block-details")]
    public async Task<ActionResult<StallAllocationDetailsDto>>
       GetStallAllocationDetails(
           Guid stallId,
           CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var stall = await _db.Stalls
            .AsNoTracking()
            .SingleOrDefaultAsync(
                x => x.Id == stallId &&
                     x.EventId == evt.Id,
                ct);

        if (stall is null)
        {
            return NotFound(new
            {
                message = "Stall not found."
            });
        }


        if (stall.CurrentStatus is not
            (StallStatus.Blocked or StallStatus.Frozen))
        {
            return UnprocessableEntity(new
            {
                message =
                    "Only blocked or frozen stall details can be viewed."
            });
        }

        if (stall.CurrentBookingId is null)
        {
            return UnprocessableEntity(new
            {
                message =
                    "No booking is linked to this stall."
            });
        }

        var booking = await _db.StallBookings
            .AsNoTracking()
            .SingleOrDefaultAsync(
                x =>
                    x.Id ==
                    stall.CurrentBookingId.Value &&
                    x.EventId == evt.Id,
                ct);

        if (booking is null)
        {
            return NotFound(new
            {
                message =
                    "Booking linked to this stall was not found."
            });
        }

        var exhibitor = await _db.Exhibitors
            .AsNoTracking()
            .SingleOrDefaultAsync(
                x => x.Id == booking.ExhibitorId,
                ct);

        if (exhibitor is null)
        {
            return NotFound(new
            {
                message =
                    "Exhibitor linked to this booking was not found."
            });
        }

        /*
         * AllocationStatus == Blocked filter இங்கு போடக்கூடாது.
         * Freeze செய்த பிறகு allocation status Frozen ஆகிவிடும்.
         */
        var allocation = await _db.StallAllocations
            .AsNoTracking()
            .Where(x =>
                x.EventId == evt.Id &&
                x.BookingId == booking.Id &&
                x.StallId == stall.Id)
            .OrderByDescending(x => x.BlockedAt)
            .FirstOrDefaultAsync(ct);

        if (allocation is null)
        {
            return NotFound(new
            {
                message =
                    "Stall allocation record was not found."
            });
        }

        Guid? actionByUserId;
        DateTimeOffset? actionAt;

        if (stall.CurrentStatus == StallStatus.Frozen)
        {
            /*
             * FrozenBy/FrozenAt null என்றால்
             * original blocker information fallback ஆகும்.
             */
            actionByUserId =
                allocation.FrozenBy ??
                allocation.BlockedBy;

            actionAt =
                allocation.FrozenAt ??
                allocation.BlockedAt;
        }
        else
        {
            actionByUserId =
                allocation.BlockedBy;

            actionAt =
                allocation.BlockedAt;
        }

        var actionByUser =
            actionByUserId.HasValue
                ? await _db.Users
                    .AsNoTracking()
                    .SingleOrDefaultAsync(
                        x =>
                            x.Id ==
                            actionByUserId.Value &&
                            x.TenantId ==
                            evt.TenantId,
                        ct)
                : null;

        var response =
            new StallAllocationDetailsDto(
                StallId:
                    stall.Id,

                StallNumber:
                    stall.StallNumber,

                StallStatus:
                    stall.CurrentStatus.ToString(),

                BookingRegistrationNumber:
                    booking.BookingRegistrationNumber,

                BookingStatus:
                    booking.BookingStatus.ToString(),

                CompanyName:
                    exhibitor.LegalName,

                ContactPerson:
                    exhibitor.ContactPersonName,

                Email:
                    exhibitor.Email,

                Mobile:
                    exhibitor.Mobile,

                BlockedAt:
                    allocation.BlockedAt,

                BlockExpiresAt:
                    allocation.BlockExpiresAt,

                ActionByUserId:
                    actionByUserId,

                ActionByName:
                    actionByUser?.FullName,

                ActionAt:
                    actionAt);

        return Ok(response);
    }

    [HttpPost("admin/events/current/bookings/{bookingId:guid}/payments")]
    public async Task<IActionResult> SubmitAndVerifyPayment(Guid bookingId, [FromBody] PaymentApiRequest request, CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);
        var booking = await _db.StallBookings.SingleOrDefaultAsync(x => x.Id == bookingId, ct)
            ?? throw new DomainRuleException(ErrorCodes.BookingNotFound, "Booking not found.");
        var allocation = await _db.StallAllocations

            .Where(x => x.BookingId == booking.Id && x.AllocationStatus == AllocationStatus.Blocked)
            .OrderByDescending(x => x.BlockedAt)
            .FirstOrDefaultAsync(ct)
            ?? throw new DomainRuleException(ErrorCodes.ValidationFailed, "No active blocked allocation found.");
        var stall = await _db.Stalls.SingleAsync(x => x.Id == allocation.StallId, ct);
        var size = await _db.StallSizes.SingleAsync(x => x.Id == booking.RequestedStallSizeId, ct);
        var isSponsorStall = stall.IsSponsor;
        if (allocation.BlockExpiresAt < DateTimeOffset.UtcNow && !request.OverrideExpiredBlock)
            throw new DomainRuleException(ErrorCodes.BlockExpired, "Block has expired. Override is required.");

        if (request.AmountPaid <= 0)
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "Amount paid must be greater than zero.");

        var verifiedPayments = await _db.Payments
            .Where(x => x.BookingId == booking.Id && x.VerificationStatus == PaymentVerificationStatus.Verified)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);

        var previouslyVerifiedAmount = verifiedPayments.Sum(x => x.AmountPaid);

        var existingSponsorTargetInDb = verifiedPayments
     .Where(x => x.TargetSponsorTotal.HasValue && x.TargetSponsorTotal.Value > 0)
     .Select(x => x.TargetSponsorTotal!.Value).FirstOrDefault();

        var sponsorTargetFromAllocationInvoice = isSponsorStall
            ? await _db.ProformaInvoices
                .Where(x => x.BookingId == booking.Id && x.InvoiceStatus != InvoiceStatus.Cancelled)
                .OrderByDescending(x => x.GeneratedAt)
                .Select(x => (decimal?)x.TotalAmount)
                .FirstOrDefaultAsync(ct)
            : null;

        decimal expectedTotal;
        if (isSponsorStall)
        {
            if (request.TargetSponsorTotal.HasValue && request.TargetSponsorTotal.Value > 0)
                expectedTotal = request.TargetSponsorTotal.Value;
            else if (existingSponsorTargetInDb > 0)
                expectedTotal = existingSponsorTargetInDb;
            else if (sponsorTargetFromAllocationInvoice.HasValue && sponsorTargetFromAllocationInvoice.Value > 0)
                expectedTotal = sponsorTargetFromAllocationInvoice.Value;
            else
                expectedTotal = size.TotalAmount;
        }
        else
        {
            expectedTotal = size.TotalAmount;
        }

        var totalPaidAfterThis = previouslyVerifiedAmount + request.AmountPaid;

        var isSpecialTenPercentTds = IsTenPercentTdsBooking(booking.Id, booking.BookingRegistrationNumber);
        var tdsRate = isSpecialTenPercentTds ? 0.10m : 0.02m;
        var isTdsApplicable = isSpecialTenPercentTds || request.isTdsDeductable || verifiedPayments.Any(x => x.isTdsDeductable);
        var tdsBaseAmount = isSponsorStall ? expectedTotal : size.BaseAmount;
        var totalTdsAmount = isTdsApplicable ? Math.Round(tdsBaseAmount * tdsRate, 2) : 0m;
        var netReceivableExpected = expectedTotal - totalTdsAmount;

        decimal targetSettlementAmount;
        if (isSpecialTenPercentTds && !isSponsorStall)
        {
            targetSettlementAmount = Math.Min(size.BaseAmount, netReceivableExpected);
        }
        else if (isTdsApplicable && !isSponsorStall)
        {
            targetSettlementAmount = netReceivableExpected;
        }
        else
        {
            targetSettlementAmount = expectedTotal;
        }

        if (!isSponsorStall && totalPaidAfterThis > expectedTotal)
        {
            throw new DomainRuleException(
                ErrorCodes.PaymentAmountMismatch,
                $"Total amount paid (₹{totalPaidAfterThis:N2}) would exceed expected amount (₹{expectedTotal:N2}).");
        }

        var isFullSettlement = totalPaidAfterThis >= targetSettlementAmount;
        var isPartialPayment = !isFullSettlement;




        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        var payment = Payment.Submit(
              evt.TenantId,
              evt.Id,
              booking.Id,
              request.PaymentReferenceNumber,
              PaymentMode.Neft,
              request.PayerName ?? "Exhibitor",
              request.AmountPaid,
              request.PaymentDate,
              null,
              request.isTdsDeductable,
              request.isGstApplicable,
              request.gstType,
              request.gstAmount,
             isSponsorStall ? (decimal?)expectedTotal : null
          );

        payment.UpdateBankDetails(request.PayerBank, request.Remarks);

        var rawReceiptNo = await NextNumberAsync(
            evt.TenantId,
            evt.Id,
            "PAYMENT_RECEIPT",
            string.Empty,
            ct);

        var lastPart = rawReceiptNo
            .Split('-', StringSplitOptions.RemoveEmptyEntries)
            .Last();

        if (!int.TryParse(lastPart, out var sequenceNumber))
        {
            throw new InvalidOperationException(
                $"Invalid payment receipt sequence: {rawReceiptNo}");
        }

        var verifyDate = DateTimeOffset.UtcNow
            .ToOffset(TimeSpan.FromHours(5.5))
            .ToString("ddMMyyyy");

        var receiptNo = $"RCP-HOSUR-{verifyDate}-{sequenceNumber:D3}";

        // CHANGED: pass expectedTotal (not size.TotalAmount directly, same value) + isPartialPayment flag
        payment.Verify(
            request.ActorUserId,
            expectedTotal,
            receiptNo,
               isPartialPayment,
    request.isTdsDeductable);

        if (isFullSettlement)
        {
            booking.ConfirmPaymentAndFreeze();
            stall.Freeze(booking.Id);
            allocation.Freeze(request.ActorUserId);
        }
        else
        {
            // Partial payment: booking stays visible in the payment queue,
            // stall/allocation remain Blocked (not frozen).
            booking.MarkPaymentSubmitted();
        }

        await _db.Payments.AddAsync(payment, ct);

        await _db.AuditLogs.AddAsync(
            Audit(evt.TenantId, evt.Id, request.ActorUserId,
            "Payment", payment.Id,
            isFullSettlement ? "Payment verified and stall frozen" : "Part payment verified",
            null,
            new
            {
                request.PaymentReferenceNumber,
                request.AmountPaid,
                isPartialPayment,
                totalPaidAfterThis,
                expectedTotal,
                balanceRemaining = expectedTotal - totalPaidAfterThis
            }), ct);

        await _db.SaveChangesAsync(ct);

        var exhibitorEmail = await GetExhibitorEmailAsync(booking.ExhibitorId, ct);
        var exhibitor = await GetExhibitorAsync(booking.ExhibitorId, ct);

        var contactPersonName = string.IsNullOrWhiteSpace(exhibitor.ContactPersonName)
            ? "Exhibitor"
            : exhibitor.ContactPersonName.Trim();
        var receiptLog = _emailComposer.ComposePaymentReceipt(
                    booking,
                    stall,
                    exhibitor,
                    payment,
                    expectedTotal,
                    totalPaidAfterThis,
                    isFullSettlement,
                    exhibitorEmail);


        await _db.EmailLogs.AddAsync(receiptLog, ct);
        await _db.SaveChangesAsync(ct);


        var baseAmountForPayment = isSponsorStall
       ? Math.Round(expectedTotal / (1 + (size.GstPercentage / 100m)), 2)
       : size.BaseAmount;

        var pdfBytes = await _paymentReceiptPdfGenerator.GeneratePdfBytesAsync(
            booking,
            stall,
            size,
            payment,
            exhibitor,
            expectedTotal,
            totalPaidAfterThis,
             totalTdsAmount,
             baseAmountForPayment,
            ct);

        await tx.CommitAsync(ct);

        try
        {
            await _emailSender.SendEmailWithAttachmentAsync(
                receiptLog.ToEmail,
                receiptLog.Subject,
                receiptLog.BodySnapshot,
                pdfBytes,
                $"PaymentReceipt_{booking.BookingRegistrationNumber}.pdf");
            receiptLog.MarkSent(null);
            await _db.SaveChangesAsync(ct);

        }
        catch (Exception emailEx)
        {
            _logger.LogError(
                emailEx,
                "Failed to send payment {Kind} email for booking {BookingId}",
                isFullSettlement ? "receipt" : "part-payment receipt",
                booking.Id);
            receiptLog.MarkFailed(emailEx.Message);
            await _db.SaveChangesAsync(ct);
        }

        InvalidateAdminCaches(evt.Id);

        return Accepted(new
        {
            message = isFullSettlement
                ? "Payment verified and stall frozen."
                : "Part payment verified. Booking remains in the payment queue until fully paid.",
            bookingId = booking.Id,
            isPartialPayment,
            amountPaidNow = request.AmountPaid,
            totalPaid = totalPaidAfterThis,
            expectedAmount = expectedTotal,
            balanceRemaining = expectedTotal - totalPaidAfterThis,
            isTdsDeductable = request.isTdsDeductable
        });
    }
    // ============================================================================
    // REPLACE the existing [HttpGet("admin/events/current/bookings/payment-summaries")]
    // method in PortalController.cs with this ENTIRE method (same signature/route).
    // ============================================================================
    [HttpGet("admin/events/current/bookings/payment-summaries")]
    public async Task<IActionResult> GetAllBookingPaymentSummaries(CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        // 1. Fetch ALL bookings for current event joined with StallSize + Exhibitor (for TanNumber)
        var cacheKey = $"admin_payment_summaries_{evt.Id}";
        if (_cache.TryGetValue(cacheKey, out object? cachedResult) && cachedResult != null)
        {
            return Ok(cachedResult);
        }

        // 1. Fetch latest stall allocations in a fast batch
        var latestStallByBooking = await _db.StallAllocations.AsNoTracking()
            .Where(a => a.EventId == evt.Id &&
                        (a.AllocationStatus == AllocationStatus.Blocked ||
                         a.AllocationStatus == AllocationStatus.Frozen ||
                         a.AllocationStatus == AllocationStatus.Allocated))
            .OrderByDescending(a => a.BlockedAt)
            .GroupBy(a => a.BookingId)
            .Select(g => new { BookingId = g.Key, StallId = g.Select(x => (Guid?)x.StallId).FirstOrDefault() })
            .ToDictionaryAsync(x => x.BookingId, x => x.StallId, ct);

        // 2. Fetch ALL bookings for current event joined with StallSize + Exhibitor (for TanNumber)
        var bookings = await (
            from b in _db.StallBookings.AsNoTracking()
            join s in _db.StallSizes.AsNoTracking() on b.RequestedStallSizeId equals s.Id
            join ex in _db.Exhibitors.AsNoTracking() on b.ExhibitorId equals ex.Id
            where b.EventId == evt.Id
            select new
            {
                BookingId = b.Id,
                BookingRegistrationNumber = b.BookingRegistrationNumber,

                StallSizeDisplayName = s.DisplayName,
                StallSizeCode = s.Code,
                BaseAmount = s.BaseAmount,
                GstPercentage = s.GstPercentage,
                ExpectedTotal = s.TotalAmount,
                TanNumber = ex.TanNumber
            }
        ).ToListAsync(ct);

        // Resolve stall numbers
        var stallIds = latestStallByBooking.Values
                   .Where(id => id.HasValue)
                   .Select(id => id!.Value).Distinct()
            .ToList();

        var stallNumbersById = await _db.Stalls
            .AsNoTracking()
            .Where(s => stallIds.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id, s => s.StallNumber, ct);

        // 2. Fetch payments: TargetSponsorAmount, isTdsDeductable, IsGstApplicable FROM PAYMENTS TABLE
        var verifiedPaymentTotals = await _db.Payments
            .AsNoTracking()
            .Where(x => x.EventId == evt.Id && x.VerificationStatus == PaymentVerificationStatus.Verified)
            .GroupBy(x => x.BookingId)
            .Select(g => new
            {
                BookingId = g.Key,
                TotalBankPaid = g.Sum(x => x.AmountPaid),
                PaymentCount = g.Count(),

                IsTdsDeducted = g.Any(x => x.isTdsDeductable),

                // NEW: GST applicability now comes from Payments, not StallSizes.
                // If ANY verified payment for this booking says GST applies, treat it as applicable.
                IsGstApplicable = g.Any(x => x.isGstApplicable),

                TargetSponsorAmount = g.Max(x => (decimal?)x.TargetSponsorTotal)
            })
            .ToDictionaryAsync(g => g.BookingId, ct);

        // 3. Map summaries applying UNIFIED TDS logic for both normal and sponsor stalls
        var summaries = bookings
            .Where(b => verifiedPaymentTotals.ContainsKey(b.BookingId)
                        && verifiedPaymentTotals[b.BookingId].PaymentCount > 0)
            .Select(b =>
            {
                var paymentInfo = verifiedPaymentTotals[b.BookingId];

                decimal totalBankPaid = paymentInfo.TotalBankPaid;
                int paymentCount = paymentInfo.PaymentCount;
                bool isTdsDeducted = paymentInfo.IsTdsDeducted;
                bool isGstApplicable = paymentInfo.IsGstApplicable;

                // Sponsor Determination
                decimal? targetSponsorAmount = paymentInfo.TargetSponsorAmount;
                bool isSponsor = targetSponsorAmount.HasValue && targetSponsorAmount.Value > 0;

                // GST amount depends on the payment-level flag now
                decimal gstAmount = isGstApplicable
                    ? Math.Round(b.BaseAmount * (b.GstPercentage / 100m), 2)
                    : 0m;

                // 1. Gross Expected Amount
                //    - Sponsor bookings use the fixed target amount as-is.
                //    - Normal bookings = BaseAmount + GstAmount (0 when not applicable).
                decimal expectedTotal = isSponsor
                    ? targetSponsorAmount!.Value
                    : b.BaseAmount + gstAmount;

                // 2. TDS Calculation
                var isSpecialTenPercentTds = IsTenPercentTdsBooking(b.BookingId, b.BookingRegistrationNumber);
                var tdsRate = isSpecialTenPercentTds ? 0.10m : 0.02m;
                var hasTdsDeducted = isSpecialTenPercentTds || isTdsDeducted;

                decimal tdsBase = isSponsor ? expectedTotal : b.BaseAmount;
                decimal calculatedTds = Math.Round(tdsBase * tdsRate, 2);

                // 3. Net Bank Receivable
                decimal netBankReceivable;

                if (isSponsor)
                {
                    netBankReceivable = targetSponsorAmount!.Value;

                    if (!isGstApplicable && b.GstPercentage > 0)
                    {
                        decimal gstIncludedAmount = Math.Round(
                            netBankReceivable * b.GstPercentage / (100m + b.GstPercentage),
                            2
                        );

                        netBankReceivable -= gstIncludedAmount;
                    }

                    if (hasTdsDeducted)
                    {
                        decimal tds = Math.Round(netBankReceivable * tdsRate, 2);
                        netBankReceivable -= tds;
                    }
                }
                else
                {
                    netBankReceivable = expectedTotal;

                    if (hasTdsDeducted)
                    {
                        netBankReceivable -= calculatedTds;
                    }

                    if (isSpecialTenPercentTds && totalBankPaid >= b.BaseAmount && totalBankPaid < netBankReceivable)
                    {
                        netBankReceivable = totalBankPaid;
                    }
                }

                decimal balanceRemaining = Math.Max(0m, netBankReceivable - totalBankPaid);
                bool isFullySettled = totalBankPaid >= netBankReceivable;
                var stallId = latestStallByBooking.TryGetValue(b.BookingId, out var sid) ? sid : null;
                var stallNumber = stallId.HasValue && stallNumbersById.TryGetValue(stallId.Value, out var num) ? num
                    : "Unallocated";

                return new
                {
                    bookingId = b.BookingId,
                    bookingRegistrationNumber = b.BookingRegistrationNumber,
                    stallNumber,
                    stallSize = b.StallSizeDisplayName,
                    stallSizeCode = b.StallSizeCode,
                    tanNumber = b.TanNumber,

                    // Sponsor Details
                    isSponsor,
                    targetSponsorAmount = targetSponsorAmount ?? 0m,

                    // Financial Breakdown
                    baseAmount = b.BaseAmount,
                    isGstApplicable,
                    gstPercentage = isGstApplicable ? b.GstPercentage : 0m,
                    gstAmount,
                    expectedTotalAmount = expectedTotal,

                    // TDS & Net Amounts
                    isTdsDeducted = hasTdsDeducted,
                    tdsDeductionAmount = hasTdsDeducted ? calculatedTds : 0m,
                    netBankReceivableAfterTds = netBankReceivable,

                    // Live Payment State
                    summary = new
                    {
                        totalBankPaid,
                        balanceRemaining,
                        isFullySettled,
                        paymentCount,
                        paymentStatus = isFullySettled ? "Full Paid" : "Part Paid"
                    }
                };
            })
            .ToList();

        var resultObj = new
        {
            metrics = new
            {
                totalBookingsCount = summaries.Count,
                totalExpectedCollection = summaries.Sum(x => x.expectedTotalAmount),
                totalTdsDeductions = summaries.Sum(x => x.tdsDeductionAmount),
                totalNetReceivables = summaries.Sum(x => x.netBankReceivableAfterTds),
                totalBankReceived = summaries.Sum(x => x.summary.totalBankPaid),
                totalOutstandingBalance = summaries.Sum(x => x.summary.balanceRemaining)
            },
            totalFullySettled = summaries.Count(x => x.summary.isFullySettled),
            totalPendingSettlement = summaries.Count(x => !x.summary.isFullySettled),
            data = summaries
        };

        _cache.Set(cacheKey, resultObj, TimeSpan.FromSeconds(30));

        return Ok(resultObj);
    }
    public sealed record ExtendBlockApiRequest(Guid ActorUserId, DateTimeOffset NewExpiryAt);
    [HttpPost("admin/events/current/bookings/{bookingId:guid}/extend-block")]
    public async Task<IActionResult> ExtendBlockExpiry(Guid bookingId, [FromBody] ExtendBlockApiRequest request, CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var booking = await _db.StallBookings
            .SingleOrDefaultAsync(x => x.Id == bookingId, ct)
            ?? throw new DomainRuleException(ErrorCodes.BookingNotFound, "Booking not found.");

        // 1. Disallow extending blocks for Confirmed bookings
        if (booking.BookingStatus == BookingStatus.Confirmed)
        {
            throw new DomainRuleException(
               "",
                "Cannot extend block expiry for a confirmed booking.");
        }

        // 2. Explicitly ensure booking is in an eligible status (BlockedAwaitingPayment OR PaymentSubmitted)
        if (booking.BookingStatus is not (BookingStatus.BlockedAwaitingPayment or BookingStatus.PaymentSubmitted))
        {
            throw new DomainRuleException(
                ErrorCodes.BookingNotEligibleForBlocking,
                "Only blocked-awaiting-payment or payment-submitted bookings can have their block expiry extended.");
        }

        // 3. Fetch latest active allocation record (excluding Frozen or Confirmed)
        var allocation = await _db.StallAllocations
            .Where(x => x.BookingId == booking.Id &&
                       (x.AllocationStatus == AllocationStatus.Blocked))
            .OrderByDescending(x => x.BlockedAt)
            .FirstOrDefaultAsync(ct);

        var previousExpiry = booking.BlockExpiresAt;

        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        booking.ExtendBlockExpiry(request.NewExpiryAt);
        allocation?.ExtendBlock(request.NewExpiryAt);

        await _db.AuditLogs.AddAsync(
            Audit(evt.TenantId, evt.Id, request.ActorUserId,
            "StallBooking", booking.Id,
            "Block expiry extended",
            new { PreviousExpiry = previousExpiry },
            new { NewExpiry = request.NewExpiryAt }), ct);

        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        InvalidateAdminCaches(evt.Id);

        return Ok(new
        {
            message = "Block expiry extended.",
            bookingId = booking.Id,
            blockExpiresAt = booking.BlockExpiresAt
        });
    }



    // =========================================================
    // BULK EXTEND BLOCK EXPIRY
    // POST: /admin/events/current/bookings/bulk-extend-block
    // =========================================================
    [HttpPost("admin/events/current/bookings/bulk-extend-block")]
    public async Task<IActionResult> BulkExtendBlockExpiry(
        [FromBody] BulkExtendBlockApiRequest request,
        CancellationToken ct)
    {
        if (request.BookingIds is null || request.BookingIds.Count == 0)
        {
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "At least one booking ID must be provided.");
        }

        var evt = await ResolveCurrentEventAsync(ct);

        // Fetch all matching bookings
        var bookings = await _db.StallBookings
            .Where(x => request.BookingIds.Contains(x.Id))
            .ToListAsync(ct);

        if (bookings.Count == 0)
        {
            throw new DomainRuleException(
                ErrorCodes.BookingNotFound,
                "No matching bookings found for extension.");
        }

        // Filter to only eligible bookings (BlockedAwaitingPayment OR PaymentSubmitted)
        var eligibleBookings = bookings
            .Where(x => x.BookingStatus is BookingStatus.BlockedAwaitingPayment or BookingStatus.PaymentSubmitted)
            .ToList();

        if (eligibleBookings.Count == 0)
        {
            throw new DomainRuleException(
                ErrorCodes.BookingNotEligibleForBlocking,
                "None of the provided bookings are in a status eligible for block extension.");
        }

        var eligibleBookingIds = eligibleBookings.Select(x => x.Id).ToList();

        // Fetch active allocations for all eligible bookings in one query
        var allocations = await _db.StallAllocations
            .Where(x => eligibleBookingIds.Contains(x.BookingId) &&
                        x.AllocationStatus == AllocationStatus.Blocked)
            .ToListAsync(ct);

        var allocationLookup = allocations
            .GroupBy(x => x.BookingId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.BlockedAt).FirstOrDefault());

        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        var updatedResults = new List<object>();

        foreach (var booking in eligibleBookings)
        {
            var previousExpiry = booking.BlockExpiresAt;

            // Apply domain mutations
            booking.ExtendBlockExpiry(request.NewExpiryAt);

            if (allocationLookup.TryGetValue(booking.Id, out var allocation) && allocation is not null)
            {
                allocation.ExtendBlock(request.NewExpiryAt);
            }

            // Add audit trail entry per booking
            await _db.AuditLogs.AddAsync(
                Audit(evt.TenantId, evt.Id, request.ActorUserId,
                "StallBooking", booking.Id,
                "Block expiry bulk extended",
                new { PreviousExpiry = previousExpiry },
                new { NewExpiry = request.NewExpiryAt }), ct);

            updatedResults.Add(new
            {
                bookingId = booking.Id,
                previousExpiry,
                blockExpiresAt = booking.BlockExpiresAt
            });
        }

        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        InvalidateAdminCaches(evt.Id);

        return Ok(new
        {
            message = $"Successfully extended block expiry for {eligibleBookings.Count} booking(s).",
            totalRequested = request.BookingIds.Count,
            totalUpdated = eligibleBookings.Count,
            skippedCount = request.BookingIds.Count - eligibleBookings.Count,
            updatedBookings = updatedResults
        });
    }
    [HttpPost("admin/events/current/bookings/{bookingId:guid}/payment-reminder/send-email")]
    public async Task<IActionResult> SendPaymentReminder(
        Guid bookingId,
        [FromBody] ActorRequest? request,
        CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var booking = await _db.StallBookings
            .SingleOrDefaultAsync(x => x.Id == bookingId && x.EventId == evt.Id, ct)
            ?? throw new DomainRuleException(ErrorCodes.BookingNotFound, "Booking not found.");

        if (booking.BookingStatus is not (BookingStatus.BlockedAwaitingPayment or BookingStatus.PaymentSubmitted))
        {
            throw new DomainRuleException(
                ErrorCodes.BookingNotEligibleForBlocking,
                "Payment reminders can only be sent for bookings that are blocked and awaiting payment.");
        }

        var exhibitor = await GetExhibitorAsync(booking.ExhibitorId, ct);

        if (string.IsNullOrWhiteSpace(exhibitor.Email))
        {
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "Exhibitor does not have a valid email on file.");
        }

        var size = await _db.StallSizes.SingleAsync(x => x.Id == booking.RequestedStallSizeId, ct);

        string? stallNumber = null;
        decimal expectedTotal;
        DateTimeOffset? allocatedAt = null;

        if (booking.AllocatedStallId is Guid allocatedStallId)
        {
            var allocatedStall = await _db.Stalls
                .SingleOrDefaultAsync(x => x.Id == allocatedStallId, ct);
            stallNumber = allocatedStall?.StallNumber;

            allocatedAt = await _db.StallAllocations
                .Where(x => x.BookingId == booking.Id && x.StallId == allocatedStallId)
                .OrderByDescending(x => x.BlockedAt)
                .Select(x => (DateTimeOffset?)x.BlockedAt)
                .FirstOrDefaultAsync(ct);

            if (allocatedStall is { IsSponsor: true })
            {
                var sponsorTarget = await _db.Payments
                    .Where(x => x.BookingId == booking.Id &&
                                x.VerificationStatus == PaymentVerificationStatus.Verified &&
                                x.TargetSponsorTotal.HasValue &&
                                x.TargetSponsorTotal.Value > 0)
                    .OrderByDescending(x => x.VerifiedAt)
                    .Select(x => x.TargetSponsorTotal!.Value)
                    .FirstOrDefaultAsync(ct);

                expectedTotal = sponsorTarget > 0 ? sponsorTarget : size.TotalAmount;
            }
            else
            {
                expectedTotal = size.TotalAmount;
            }
        }
        else
        {
            expectedTotal = size.TotalAmount;
        }

        var totalPaidAmount = await _db.Payments
            .Where(x => x.BookingId == booking.Id && x.VerificationStatus == PaymentVerificationStatus.Verified)
            .SumAsync(x => x.AmountPaid, ct);

        var balanceAmount = expectedTotal - totalPaidAmount;
        if (balanceAmount < 0) balanceAmount = 0;

        var email = _emailComposer.ComposePaymentReminder(
            booking,
            exhibitor,
            stallNumber,
            expectedTotal,
            totalPaidAmount,
            balanceAmount,
            booking.BlockExpiresAt,
            allocatedAt,
            exhibitor.Email);

        await _db.EmailLogs.AddAsync(email, ct);

        await _db.AuditLogs.AddAsync(
            Audit(evt.TenantId, evt.Id, request?.ActorUserId,
            "StallBooking", booking.Id,
            "Payment reminder email sent",
            null,
            new { ToEmail = exhibitor.Email, BalanceAmount = balanceAmount }), ct);

        await _db.SaveChangesAsync(ct);

        try
        {
            await _emailSender.SendEmailAsync(
                email.ToEmail,
                email.Subject,
                email.BodySnapshot);

            email.MarkSent(null);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to send payment reminder email for booking {BookingId}",
                booking.Id);

            return StatusCode(
                StatusCodes.Status502BadGateway,
                new { message = "Reminder saved but the email failed to send. Please try again." });
        }

        return Ok(new
        {
            bookingId = booking.Id,
            recipient = email.ToEmail,
            balanceAmount,
            message = $"Payment reminder emailed to {email.ToEmail}."
        });
    }


    [HttpGet("admin/events/current/invoices")]
    public async Task<IActionResult> ListInvoices(CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);
        var cacheKey = $"admin_invoices_{evt.Id}";
        if (_cache.TryGetValue(cacheKey, out object? cached) && cached != null)
        {
            return Ok(cached);
        }
        var data = await _db.ProformaInvoices.AsNoTracking().Where(x => x.EventId == evt.Id).OrderByDescending(x => x.GeneratedAt).ToListAsync(ct);
        _cache.Set(cacheKey, data, TimeSpan.FromSeconds(30));
        return Ok(data);
    }

    [HttpPost("admin/events/current/bookings/{bookingId:guid}/proforma-invoice/generate")]
    public async Task<IActionResult> GenerateInvoice(
  Guid bookingId,
  [FromBody] ActorRequest request,
  CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var existing = await _db.ProformaInvoices
            .FirstOrDefaultAsync(x =>
                x.BookingId == bookingId &&
                x.InvoiceStatus != InvoiceStatus.Cancelled,
                ct);
        if (existing is not null)
        {
            // Only resync an invoice that hasn't been emailed/finalized yet —
            // once Sent, the exhibitor-facing PDF/GST trail must not change.
            if (existing.InvoiceStatus == InvoiceStatus.Generated)
            {
                var bookingForRefresh = await _db.StallBookings.SingleAsync(x => x.Id == bookingId, ct);

                // Pull the latest TDS decision from the verified payment —
                // this invoice may have been auto-created before payment was
                // verified, when TDS was not yet known (always false then).
                var latestTdsApplicable = await _db.Payments
                    .Where(x => x.BookingId == bookingId && x.VerificationStatus == PaymentVerificationStatus.Verified)
                    .OrderByDescending(x => x.VerifiedAt)
                    .Select(x => x.isTdsDeductable)
                    .FirstOrDefaultAsync(ct);

                if (bookingForRefresh.AllocatedStallId is Guid allocatedStallId)
                {
                    var stallForRefresh = await _db.Stalls.SingleAsync(x => x.Id == allocatedStallId, ct);
                    var sizeForRefresh = await _db.StallSizes.SingleAsync(x => x.Id == bookingForRefresh.RequestedStallSizeId, ct);
                    var expectedHsn = stallForRefresh.IsSponsor ? "HSN 998397" : "HSN 998596";
                    var billingForRefresh = await _db.BillingProfiles.SingleAsync(x => x.Id == bookingForRefresh.BillingProfileId, ct);
                    var paymentForRefresh = await _db.Payments
                           .Where(x => x.BookingId == bookingId &&
                                       x.VerificationStatus == PaymentVerificationStatus.Verified)
                           .OrderByDescending(x => x.VerifiedAt)
                           .FirstAsync(ct);

                    // NEW: sum of ALL verified payments, not just the latest one
                    var totalVerifiedPaidForRefresh = await _db.Payments
                        .Where(x => x.BookingId == bookingId &&
                                    x.VerificationStatus == PaymentVerificationStatus.Verified)
                        .SumAsync(x => x.AmountPaid, ct);

                    decimal baseAmountForRefresh;
                    decimal gstAmountForRefresh;
                    decimal totalAmountForRefresh;

                    if (stallForRefresh.IsSponsor)
                    {
                        var sponsorTargetForRefresh = await _db.Payments
                            .Where(x => x.BookingId == bookingId &&
                                        x.VerificationStatus == PaymentVerificationStatus.Verified &&
                                        x.TargetSponsorTotal.HasValue &&
                                        x.TargetSponsorTotal.Value > 0)
                            .OrderByDescending(x => x.VerifiedAt)
                            .Select(x => x.TargetSponsorTotal!.Value)
                            .FirstOrDefaultAsync(ct);

                        totalAmountForRefresh = sponsorTargetForRefresh > 0
                            ? sponsorTargetForRefresh
                            : existing.TotalAmount;
                        baseAmountForRefresh = Math.Round(
                            totalAmountForRefresh / (1 + (sizeForRefresh.GstPercentage / 100m)), 2);
                        gstAmountForRefresh = totalAmountForRefresh - baseAmountForRefresh;
                    }
                    else
                    {
                        baseAmountForRefresh = sizeForRefresh.BaseAmount;
                        gstAmountForRefresh = sizeForRefresh.TotalAmount - sizeForRefresh.BaseAmount;
                        totalAmountForRefresh = sizeForRefresh.TotalAmount;
                    }

                    var amountMismatch = existing.TotalAmount != totalAmountForRefresh;

                    if (existing.isTdsDeductable != latestTdsApplicable || existing.HsnSac != expectedHsn || amountMismatch)
                    {
                        var refreshSnapshot = new InvoiceSnapshot(
                            "Laghu Udyog Bharati Tamil Nadu",
                            "Plot No 63A, First Floor, 9th Street, Sidco Industrial Estate, Ambattur, Chennai - 600058",
                            "33AAATL0575H1ZT",
                            "AAATL0575H",
                            billingForRefresh.BillingLegalName,
                            billingForRefresh.BillingAddress,
                            billingForRefresh.BillingGstin,
                            billingForRefresh.BillingPan,
                            billingForRefresh.PlaceOfSupply,
                            stallForRefresh.StallNumber,
                            sizeForRefresh.DisplayName,
              baseAmountForRefresh,
sizeForRefresh.GstPercentage,
NumberToWordsConverter.Convert(totalAmountForRefresh),
NumberToWordsConverter.Convert(gstAmountForRefresh),
                            "Payment verified and stall allocation confirmed.",
                            "LAGHU UDYOG BHARATI",
                            "Canara Bank",
                            "0908201005559",
                            "CNRB0000936",
                            "Ambattur Branch, Chennai 600053",
                            expectedHsn,
                            latestTdsApplicable);

                        existing.UpdateStallDetails(refreshSnapshot, request.ActorUserId);
                        await _db.SaveChangesAsync(ct);
                    }
                }
            }
            return Ok(existing);
        }

        var booking = await _db.StallBookings
            .SingleOrDefaultAsync(x => x.Id == bookingId, ct)
            ?? throw new DomainRuleException(
                ErrorCodes.BookingNotFound,
                "Booking not found.");

        if (booking.BookingStatus != BookingStatus.Confirmed)
        {
            throw new DomainRuleException(
                ErrorCodes.InvoiceNotAllowedBeforePayment,
                "Invoice generation requires confirmed booking and frozen stall.");
        }

        var billing = await _db.BillingProfiles
            .SingleAsync(x => x.Id == booking.BillingProfileId, ct);

        var stall = await _db.Stalls
            .SingleAsync(x => x.Id == booking.AllocatedStallId, ct);

        var size = await _db.StallSizes
            .SingleAsync(x => x.Id == booking.RequestedStallSizeId, ct);
        var tdsApplicable = await _db.Payments
    .Where(x => x.BookingId == booking.Id && x.VerificationStatus == PaymentVerificationStatus.Verified)
    .OrderByDescending(x => x.VerifiedAt)
    .Select(x => x.isTdsDeductable)
    .FirstOrDefaultAsync(ct);

        var invoiceNo = await NextNumberAsync(
            evt.TenantId,
            evt.Id,
            "PROFORMA_INVOICE",
            "PI-HOSUR-",
            ct);

        var payment = await _db.Payments
            .Where(x => x.BookingId == booking.Id &&
                        x.VerificationStatus == PaymentVerificationStatus.Verified)
            .OrderByDescending(x => x.VerifiedAt)
            .FirstAsync(ct);

        // NEW: sum of ALL verified payments (partial + final), not just the latest one
        var totalVerifiedPaid = await _db.Payments
            .Where(x => x.BookingId == booking.Id &&
                        x.VerificationStatus == PaymentVerificationStatus.Verified)
            .SumAsync(x => x.AmountPaid, ct);

        decimal baseAmount;
        decimal gstAmount;
        decimal totalAmount;
        if (stall.IsSponsor)
        {
            var sponsorTarget = await _db.Payments
                .Where(x => x.BookingId == booking.Id &&
                            x.VerificationStatus == PaymentVerificationStatus.Verified &&
                            x.TargetSponsorTotal.HasValue &&
                            x.TargetSponsorTotal.Value > 0)
                .OrderByDescending(x => x.VerifiedAt)
                .Select(x => x.TargetSponsorTotal!.Value)
                .FirstOrDefaultAsync(ct);

            var targetAmount = sponsorTarget > 0 ? sponsorTarget : size.BaseAmount;
            baseAmount = targetAmount;
            gstAmount = Math.Round(baseAmount * (size.GstPercentage / 100m), 2);
            totalAmount = baseAmount + gstAmount;
        }
        else
        {
            baseAmount = size.BaseAmount;
            gstAmount = Math.Round(baseAmount * (size.GstPercentage / 100m), 2);
            totalAmount = baseAmount + gstAmount;
        }
        var snapshot = new InvoiceSnapshot(
            "Laghu Udyog Bharati Tamil Nadu",
            "Plot No 63A, First Floor, 9th Street, Sidco Industrial Estate, Ambattur, Chennai - 600058",
            "33AAATL0575H1ZT",
            "AAATL0575H",
            billing.BillingLegalName,
            billing.BillingAddress,
            billing.BillingGstin,
            billing.BillingPan,
            billing.PlaceOfSupply,
            stall.StallNumber,
            size.DisplayName,
            baseAmount,
size.GstPercentage,
NumberToWordsConverter.Convert(totalAmount),
NumberToWordsConverter.Convert(gstAmount),
            "Payment verified and stall allocation confirmed.",
            "LAGHU UDYOG BHARATI",
            "Canara Bank",
            "0908201005559",
            "CNRB0000936",
            "Ambattur Branch, Chennai 600053",
              stall.IsSponsor ? "HSN 998397" : "HSN 998596",
    tdsApplicable);


        var invoice = ProformaInvoice.Generate(
            evt.TenantId,
            evt.Id,
            booking.Id,
            invoiceNo,
            request.ActorUserId,
            snapshot);

        await _db.ProformaInvoices.AddAsync(invoice, ct);
        await _db.SaveChangesAsync(ct);

        return Ok(invoice);
    }

    [HttpPost("admin/events/current/invoices/{invoiceId:guid}/send-email")]
    public async Task<IActionResult> SendInvoice(
        Guid invoiceId,
        [FromBody] ActorRequest request,
        CancellationToken ct)
    {
        var invoice = await _db.ProformaInvoices
            .SingleOrDefaultAsync(x => x.Id == invoiceId, ct)
            ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Invoice not found.");

        var booking = await _db.StallBookings
            .SingleOrDefaultAsync(x => x.Id == invoice.BookingId, ct)
            ?? throw new DomainRuleException(ErrorCodes.BookingNotFound, "Booking not found.");

        var exhibitor = await GetExhibitorAsync(booking.ExhibitorId, ct);

        var exhibitorEmail = exhibitor.Email;

        if (string.IsNullOrWhiteSpace(exhibitorEmail))
        {
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Exhibitor email address is not available.");
        }

        var contactPersonName = string.IsNullOrWhiteSpace(exhibitor.ContactPersonName)
            ? "Exhibitor"
            : exhibitor.ContactPersonName.Trim();

        var companyName = !string.IsNullOrWhiteSpace(exhibitor.TradeName)
            ? exhibitor.TradeName.Trim()
            : !string.IsNullOrWhiteSpace(exhibitor.LegalName)
                ? exhibitor.LegalName.Trim()
                : "Your Company";

        var isSpecialTenPercentTds = IsTenPercentTdsBooking(booking.Id, booking.BookingRegistrationNumber);

        // Refresh TDS + GstType from the latest verified payment before the Tax Invoice is locked in
        var latestVerifiedPayment = await _db.Payments
            .Where(x => x.BookingId == invoice.BookingId && x.VerificationStatus == PaymentVerificationStatus.Verified)
            .OrderByDescending(x => x.VerifiedAt)
            .Select(x => new { x.isTdsDeductable, x.gstType })
            .FirstOrDefaultAsync(ct);

        var latestTdsApplicable = isSpecialTenPercentTds || (latestVerifiedPayment?.isTdsDeductable ?? false);
        var latestGstTypeForSend = latestVerifiedPayment?.gstType ?? "Normal";

        // RCM = Reverse Charge Mechanism: supplier does not charge GST on the invoice
        var isRcmForSend = string.Equals(latestGstTypeForSend, "RCM", StringComparison.OrdinalIgnoreCase);

        var stallForSend = await _db.Stalls.SingleAsync(x => x.Id == booking.AllocatedStallId, ct);
        var sizeForSend = await _db.StallSizes.SingleAsync(x => x.Id == booking.RequestedStallSizeId, ct);
        var expectedHsnForSend = stallForSend.IsSponsor ? "HSN 998397" : "HSN 998596";

        decimal totalAmountForSend;
        decimal baseAmountForSend;
        decimal gstAmountForSend;

        var tdsGrossUpDivisor = isSpecialTenPercentTds ? 0.90m : 0.98m;

        if (stallForSend.IsSponsor)
        {
            // Sum of ALL verified payments for this sponsor booking
            var rawVerifiedPaid = await _db.Payments
                .Where(x => x.BookingId == invoice.BookingId && x.VerificationStatus == PaymentVerificationStatus.Verified)
                .SumAsync(x => x.AmountPaid, ct);

            if (isRcmForSend)
            {
                // RCM SPONSOR LOGIC:
                // 1. Deduct/less 18% GST from the target sponsor amount (rawVerifiedPaid)
                var sponsorBaseAmountExcludingGst = Math.Round(rawVerifiedPaid / 1.18m, 2);

                // 2. Gross up for TDS if applicable (based on the net base amount)
                var finalSponsorBaseAmount = latestTdsApplicable
                    ? Math.Round(sponsorBaseAmountExcludingGst / tdsGrossUpDivisor, 2)
                    : sponsorBaseAmountExcludingGst;

                // 3. For RCM, Supplier GST is 0, so Total Amount equals the reduced Base Amount
                baseAmountForSend = finalSponsorBaseAmount;
                gstAmountForSend = 0m;
                totalAmountForSend = finalSponsorBaseAmount;
            }
            else
            {
                var grossAmountForSend = latestTdsApplicable
                    ? Math.Round(rawVerifiedPaid / tdsGrossUpDivisor, 2)
                    : rawVerifiedPaid;

                totalAmountForSend = grossAmountForSend;
                baseAmountForSend = Math.Round(totalAmountForSend / (1 + (sizeForSend.GstPercentage / 100m)), 2);
                gstAmountForSend = totalAmountForSend - baseAmountForSend;
            }
        }
        else
        {
            if (isRcmForSend)
            {
                baseAmountForSend = sizeForSend.BaseAmount;
                gstAmountForSend = 0m;
                totalAmountForSend = sizeForSend.BaseAmount;
            }
            else
            {
                baseAmountForSend = sizeForSend.BaseAmount;
                gstAmountForSend = sizeForSend.TotalAmount - sizeForSend.BaseAmount;
                totalAmountForSend = sizeForSend.TotalAmount;
            }
        }

        var amountMismatchForSend = invoice.TotalAmount != totalAmountForSend;

        // Force snapshot refresh if RCM is active but the stored invoice still has GST > 0 or base amount mismatch
        var isGstMismatchForRcm = isRcmForSend && invoice.GstAmount > 0m;

        if (invoice.isTdsDeductable != latestTdsApplicable
            || invoice.HsnSac != expectedHsnForSend
            || invoice.BaseAmount != baseAmountForSend
            || isGstMismatchForRcm
            || amountMismatchForSend)
        {
            var billingForSend = await _db.BillingProfiles.SingleAsync(x => x.Id == booking.BillingProfileId, ct);

            var refreshSnapshotForSend = new InvoiceSnapshot(
                "Laghu Udyog Bharati Tamil Nadu",
                "Plot No 63A, First Floor, 9th Street, Sidco Industrial Estate, Ambattur, Chennai - 600058",
                "33AAATL0575H1ZT",
                "AAATL0575H",
                billingForSend.BillingLegalName,
                billingForSend.BillingAddress,
                billingForSend.BillingGstin,
                billingForSend.BillingPan,
                billingForSend.PlaceOfSupply,
                stallForSend.StallNumber,
                sizeForSend.DisplayName,
                baseAmountForSend,
                isRcmForSend ? 0m : sizeForSend.GstPercentage, // Set rate to 0% for RCM
                NumberToWordsConverter.Convert(totalAmountForSend),
                NumberToWordsConverter.Convert(gstAmountForSend),
                "Payment verified and stall allocation confirmed.",
                "LAGHU UDYOG BHARATI",
                "Canara Bank",
                "0908201005559",
                "CNRB0000936",
                "Ambattur Branch, Chennai 600053",
                expectedHsnForSend,
                latestTdsApplicable
            );

            invoice.UpdateStallDetails(refreshSnapshotForSend, request.ActorUserId);
            await _db.SaveChangesAsync(ct);
        }

        if (string.IsNullOrWhiteSpace(invoice.TaxInvoiceNumber))
        {
            var evt = await ResolveCurrentEventAsync(ct);

            var taxInvoiceNo = await NextNumberAsync(
                evt.TenantId,
                evt.Id,
                "TAX_INVOICE",
                "INV-HOSUR-",
                ct);

            invoice.MarkSent(request.ActorUserId, taxInvoiceNo);

            await _db.SaveChangesAsync(ct);
        }

        // Pass the updated invoice instance directly to PDF Generator
        var pdfBytes = await _pdfGenerator.GenerateTaxInvoicePdfBytesAsync(invoice, exhibitor, sizeForSend.AreaSqM, ct);

        var pdfFileName = $"TaxInvoice_{invoice.TaxInvoiceNumber}.pdf";
        //        var subject = $"Tax Invoice {invoice.TaxInvoiceNumber} - {companyName}";
        var emailLog = _emailComposer.ComposeTaxInvoiceEmail(
                   booking,
                   invoice,
                   exhibitor,
                   exhibitorEmail);
        await _db.EmailLogs.AddAsync(emailLog, ct);

        await _db.AuditLogs.AddAsync(
            Audit(
                invoice.TenantId,
                invoice.EventId,
                request.ActorUserId,
                "ProformaInvoice",
                invoice.Id,
                "Tax invoice emailed",
                null,
                new
                {
                    BookingId = booking.Id,
                    InvoiceId = invoice.Id,
                    invoice.TaxInvoiceNumber,
                    CompanyName = companyName,
                    ContactPerson = contactPersonName,
                    Recipient = exhibitorEmail,
                    invoice.TotalAmount,
                    GstType = latestGstTypeForSend
                }),
            ct);

        await _db.SaveChangesAsync(ct);

        try
        {
            await _emailSender.SendEmailWithAttachmentAsync(
                emailLog.ToEmail,
                emailLog.Subject,
                emailLog.BodySnapshot,
                pdfBytes,
                pdfFileName);
            emailLog.MarkSent(null);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception emailEx)
        {
            _logger.LogError(
                emailEx,
                "Failed to send tax invoice {TaxInvoiceNumber} for booking {BookingId}",
                invoice.TaxInvoiceNumber,
                booking.Id);

            emailLog.MarkFailed(emailEx.Message);
            await _db.SaveChangesAsync(ct);

            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "The tax invoice was generated, but the email could not be sent.");
        }

        return Accepted(new
        {
            message = "Tax invoice emailed with PDF attachment.",
            bookingId = booking.Id,
            invoiceId = invoice.Id,
            taxInvoiceNumber = invoice.TaxInvoiceNumber,
            companyName,
            contactPersonName,
            recipient = exhibitorEmail,
            totalAmount = invoice.TotalAmount,
            gstType = latestGstTypeForSend
        });
    }

    [HttpGet("admin/events/current/bookings/{bookingId:guid}/tax-invoice/download")]
    public async Task<IActionResult> DownloadTaxInvoice(
        Guid bookingId,
        CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var booking = await _db.StallBookings
            .SingleOrDefaultAsync(x => x.Id == bookingId && x.EventId == evt.Id, ct)
            ?? throw new DomainRuleException(ErrorCodes.BookingNotFound, "Booking not found.");

        var invoice = await _db.ProformaInvoices
            .FirstOrDefaultAsync(x => x.BookingId == booking.Id && x.InvoiceStatus != InvoiceStatus.Cancelled, ct)
            ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Invoice has not been generated yet.");

        if (string.IsNullOrWhiteSpace(invoice.TaxInvoiceNumber))
        {
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "Tax invoice has not been generated/sent yet.");
        }

        var exhibitor = await GetExhibitorAsync(booking.ExhibitorId, ct);

        var stallForTaxDl = await _db.Stalls.SingleOrDefaultAsync(x => x.Id == booking.AllocatedStallId, ct);
        var sizeForTaxDl = stallForTaxDl is not null
            ? await _db.StallSizes.SingleOrDefaultAsync(x => x.Id == stallForTaxDl.StallSizeId, ct)
            : null;

        var pdfBytes = await _pdfGenerator.GenerateTaxInvoicePdfBytesAsync(
            invoice,
            exhibitor,
            sizeForTaxDl?.AreaSqM,
            ct);

        var fileName = $"TaxInvoice_{invoice.TaxInvoiceNumber}.pdf";

        return File(pdfBytes, "application/pdf", fileName);
    }

    [HttpPost("admin/events/current/bookings/send-edit-access")]
    public async Task<IActionResult> SendEditAccess([FromBody] BulkEditAccessRequest? request, CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var query = _db.StallBookings.Where(x => x.EventId == evt.Id);
        if (request?.BookingIds is { Count: > 0 })
        {
            query = query.Where(x => request.BookingIds.Contains(x.Id));
        }

        var bookings = await query.ToListAsync(ct);

        if (!bookings.Any())
            return Ok(new { message = "No bookings found." });

        var newEmails = new List<EmailLog>();
        foreach (var booking in bookings)
        {
            var exhibitor = await _db.Exhibitors
                .SingleOrDefaultAsync(x => x.Id == booking.ExhibitorId, ct);

            if (exhibitor == null)
                continue;

            var editUrl = $"https://msmesangamam.lubtn.com/stall-booking/{booking.Id}";

            var email = _emailComposer.ComposeBookingEditRequest(
                booking,
                exhibitor.Email,
                editUrl);

            await _db.EmailLogs.AddAsync(email, ct);
            newEmails.Add(email);
        }

        await _db.SaveChangesAsync(ct);

        var messages = newEmails
            .Select(e => new EmailMessage(e.ToEmail, e.Subject, e.BodySnapshot))
            .ToList();

        try
        {
            await _emailSender.SendBulkEmailAsync(messages);
            foreach (var e in newEmails) e.MarkSent(null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Bulk edit-access email send failed");
        }

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            total = bookings.Count,
            emailsSent = newEmails.Count,
            message = "Edit access mail sent successfully."
        });
    }

    [HttpPost("admin/events/current/bookings/{bookingId:guid}/edit-access/send-email")]
    public async Task<IActionResult> SendEditAccessForBooking(
        Guid bookingId,
        CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var booking = await _db.StallBookings
            .SingleOrDefaultAsync(x => x.Id == bookingId && x.EventId == evt.Id, ct)
            ?? throw new DomainRuleException(ErrorCodes.BookingNotFound, "Booking not found.");

        var exhibitor = await _db.Exhibitors
            .SingleOrDefaultAsync(x => x.Id == booking.ExhibitorId, ct)
            ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Exhibitor not found.");

        var editUrl = $"https://msmesangamam.lubtn.com/stall-booking/{booking.Id}";

        var email = _emailComposer.ComposeBookingEditRequest(
            booking,
            exhibitor.Email,
            editUrl);

        await _db.EmailLogs.AddAsync(email, ct);
        await _db.SaveChangesAsync(ct);

        try
        {
            var emailCardPath = Path.Combine(
                AppContext.BaseDirectory,
                "Assets",
                "EmailCard.png");

            if (!System.IO.File.Exists(emailCardPath))
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message = "EmailCard.png was not found.",
                        searchedPath = emailCardPath
                    });
            }

            var emailCardBytes =
                await System.IO.File.ReadAllBytesAsync(
                    emailCardPath,
                    ct);

            if (emailCardBytes.Length == 0)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message = "EmailCard.png is empty."
                    });
            }

            await _emailSender.SendEmailWithAttachmentAsync(
                email.ToEmail,
                email.Subject,
                email.BodySnapshot,
                emailCardBytes,
                "EmailCard.png");

            email.MarkSent(null);
            await _db.SaveChangesAsync(ct);

            return Ok(new
            {
                bookingId = booking.Id,
                editUrl,
                attachmentFileName = "EmailCard.png",
                attachmentSizeBytes = emailCardBytes.Length,
                message = "Edit link emailed with EmailCard.png attachment."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to send edit-access email with attachment for booking {BookingId}",
                booking.Id);

            return StatusCode(
                StatusCodes.Status502BadGateway,
                new
                {
                    message = "Email could not be sent with attachment.",
                    exactError = ex.Message,
                    innerError = ex.InnerException?.Message
                });
        }
    }

    [HttpPost("admin/events/current/bookings/send-stall-information")]
    public async Task<IActionResult> SendStallInformationBulk([FromBody] BulkEditAccessRequest? request, CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var query = _db.StallBookings.Where(x => x.EventId == evt.Id);
        if (request?.BookingIds is { Count: > 0 })
        {
            query = query.Where(x => request.BookingIds.Contains(x.Id));
        }

        var bookings = await query.ToListAsync(ct);

        if (!bookings.Any())
            return Ok(new { message = "No bookings found." });

        var newEmails = new List<EmailLog>();
        foreach (var booking in bookings)
        {
            var exhibitor = await _db.Exhibitors
                .SingleOrDefaultAsync(x => x.Id == booking.ExhibitorId, ct);
            if (exhibitor == null) continue;

            var stall = await _db.Stalls.SingleOrDefaultAsync(s => s.CurrentBookingId == booking.Id, ct);
            var size = stall != null ? await _db.StallSizes.SingleOrDefaultAsync(s => s.Id == stall.StallSizeId, ct) : null;

            var email = _emailComposer.ComposeExhibitorStallInformation(
                booking,
                exhibitor.Email,
                exhibitor.ContactPersonName ?? "Exhibitor",
                exhibitor.TradeName ?? exhibitor.LegalName ?? "Company",
                stall?.StallNumber ?? "TBA",
                size?.DisplayName ?? "TBA");

            await _db.EmailLogs.AddAsync(email, ct);
            newEmails.Add(email);
        }

        await _db.SaveChangesAsync(ct);

        var pdfPath = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "Assets", "StallInformation.pdf");
        byte[]? pdfBytes = null;
        if (System.IO.File.Exists(pdfPath))
        {
            pdfBytes = await System.IO.File.ReadAllBytesAsync(pdfPath, ct);
        }

        var messages = newEmails
            .Select(e => new EmailMessage(e.ToEmail, e.Subject, e.BodySnapshot, pdfBytes, pdfBytes != null ? "StallInformation.pdf" : null))
            .ToList();

        var scopeFactory = HttpContext.RequestServices.GetRequiredService<IServiceScopeFactory>();
        _ = Task.Run(async () =>
        {
            using var scope = scopeFactory.CreateScope();
            var emailSender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
            var dbContext = scope.ServiceProvider.GetRequiredService<StallBookingDbContext>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<PortalController>>();
            try
            {
                await emailSender.SendBulkEmailAsync(messages);
                var emailIds = newEmails.Select(e => e.Id).ToList();
                var logs = await dbContext.EmailLogs.Where(e => emailIds.Contains(e.Id)).ToListAsync();
                foreach (var e in logs) e.MarkSent(null);
                await dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Bulk stall information email send failed");
            }
        });

        return Ok(new { total = bookings.Count, emailsSent = newEmails.Count, message = "Stall information mails queued successfully." });
    }

    [HttpPost("admin/events/current/bookings/{bookingId:guid}/stall-information/send-email")]
    public async Task<IActionResult> SendStallInformation(Guid bookingId, CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var booking = await _db.StallBookings
            .SingleOrDefaultAsync(x => x.Id == bookingId && x.EventId == evt.Id, ct)
            ?? throw new DomainRuleException(ErrorCodes.BookingNotFound, "Booking not found.");

        var exhibitor = await _db.Exhibitors
            .SingleOrDefaultAsync(x => x.Id == booking.ExhibitorId, ct)
            ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Exhibitor not found.");

        var stall = await _db.Stalls.SingleOrDefaultAsync(s => s.CurrentBookingId == booking.Id, ct);
        var size = stall != null ? await _db.StallSizes.SingleOrDefaultAsync(s => s.Id == stall.StallSizeId, ct) : null;

        var email = _emailComposer.ComposeExhibitorStallInformation(
            booking,
            exhibitor.Email,
            exhibitor.ContactPersonName ?? "Exhibitor",
            exhibitor.TradeName ?? exhibitor.LegalName ?? "Company",
            stall?.StallNumber ?? "TBA",
            size?.DisplayName ?? "TBA");

        await _db.EmailLogs.AddAsync(email, ct);
        await _db.SaveChangesAsync(ct);

        var pdfPath = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "Assets", "StallInformation.pdf");
        byte[]? pdfBytes = null;
        if (System.IO.File.Exists(pdfPath))
        {
            pdfBytes = await System.IO.File.ReadAllBytesAsync(pdfPath, ct);
        }

        try
        {
            if (pdfBytes != null)
            {
                await _emailSender.SendEmailWithAttachmentAsync(email.ToEmail, email.Subject, email.BodySnapshot, pdfBytes, "StallInformation.pdf");
            }
            else
            {
                await _emailSender.SendEmailAsync(email.ToEmail, email.Subject, email.BodySnapshot);
            }
            email.MarkSent(null);
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Stall information email sent." });
        }
        catch (Exception ex)
        {
            return StatusCode(502, new { message = "Failed to send email.", error = ex.Message });
        }
    }

    [HttpPost("admin/events/current/bookings/send-hotel-accommodation")]
    public async Task<IActionResult> SendHotelAccommodationBulk([FromBody] BulkEditAccessRequest? request, CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var query = _db.StallBookings.Where(x => x.EventId == evt.Id);
        if (request?.BookingIds is { Count: > 0 })
        {
            query = query.Where(x => request.BookingIds.Contains(x.Id));
        }

        var bookings = await query.ToListAsync(ct);

        if (!bookings.Any())
            return Ok(new { message = "No bookings found." });

        var newEmails = new List<EmailLog>();
        foreach (var booking in bookings)
        {
            var exhibitor = await _db.Exhibitors
                .SingleOrDefaultAsync(x => x.Id == booking.ExhibitorId, ct);
            if (exhibitor == null) continue;

            var email = _emailComposer.ComposeHotelAccommodationOptions(
                booking,
                exhibitor.Email,
                exhibitor.ContactPersonName ?? "Exhibitor",
                exhibitor.TradeName ?? exhibitor.LegalName ?? "Company");

            await _db.EmailLogs.AddAsync(email, ct);
            newEmails.Add(email);
        }

        await _db.SaveChangesAsync(ct);

        var messages = newEmails
            .Select(e => new EmailMessage(e.ToEmail, e.Subject, e.BodySnapshot))
            .ToList();

        var scopeFactory = HttpContext.RequestServices.GetRequiredService<IServiceScopeFactory>();
        _ = Task.Run(async () =>
        {
            using var scope = scopeFactory.CreateScope();
            var emailSender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
            var dbContext = scope.ServiceProvider.GetRequiredService<StallBookingDbContext>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<PortalController>>();
            try
            {
                await emailSender.SendBulkEmailAsync(messages);
                var emailIds = newEmails.Select(e => e.Id).ToList();
                var logs = await dbContext.EmailLogs.Where(e => emailIds.Contains(e.Id)).ToListAsync();
                foreach (var e in logs) e.MarkSent(null);
                await dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Bulk hotel accommodation email send failed");
            }
        });

        return Ok(new { total = bookings.Count, emailsSent = newEmails.Count, message = "Hotel accommodation mails queued successfully." });
    }

    [HttpPost("admin/events/current/bookings/{bookingId:guid}/hotel-accommodation/send-email")]
    public async Task<IActionResult> SendHotelAccommodation(Guid bookingId, CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var booking = await _db.StallBookings
            .SingleOrDefaultAsync(x => x.Id == bookingId && x.EventId == evt.Id, ct)
            ?? throw new DomainRuleException(ErrorCodes.BookingNotFound, "Booking not found.");

        var exhibitor = await _db.Exhibitors
            .SingleOrDefaultAsync(x => x.Id == booking.ExhibitorId, ct)
            ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Exhibitor not found.");

        var email = _emailComposer.ComposeHotelAccommodationOptions(
            booking,
            exhibitor.Email,
            exhibitor.ContactPersonName ?? "Exhibitor",
            exhibitor.TradeName ?? exhibitor.LegalName ?? "Company");

        await _db.EmailLogs.AddAsync(email, ct);
        await _db.SaveChangesAsync(ct);

        try
        {
            await _emailSender.SendEmailAsync(email.ToEmail, email.Subject, email.BodySnapshot);
            email.MarkSent(null);
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Hotel accommodation email sent." });
        }
        catch (Exception ex)
        {
            return StatusCode(502, new { message = "Failed to send email.", error = ex.Message });
        }
    }
    [HttpGet("admin/events/current/sponsor-stalls")]
    public async Task<IActionResult> ListSponsorStalls(CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var items = await (
            from stall in _db.Stalls.AsNoTracking()
            join size in _db.StallSizes.AsNoTracking()
                on stall.StallSizeId equals size.Id
            where stall.EventId == evt.Id &&
                  stall.IsSponsor
            orderby stall.StallNumber
            select new
            {
                stall.Id,
                stall.TenantId,
                stall.EventId,
                stall.StallSizeId,
                stall.StallNumber,
                StallSizeCode = size.Code,
                StallSizeName = size.DisplayName,
                CurrentStatus = stall.CurrentStatus.ToString(),
                stall.CurrentBookingId,
                stall.IsSponsor
            }
        ).ToListAsync(ct);

        return Ok(items);
    }

    [HttpPut("admin/events/current/bookings/{bookingId:guid}/application")]
    public async Task<IActionResult> UpdateBookingApplication(
       Guid bookingId,
       [FromBody] UpdateBookingApplicationRequest request,
       CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var booking = await _db.StallBookings
            .SingleOrDefaultAsync(
                x => x.Id == bookingId &&
                     x.EventId == evt.Id,
                ct)
            ?? throw new DomainRuleException(
                ErrorCodes.BookingNotFound,
                "Booking not found.");

        var exhibitor = await _db.Exhibitors
            .SingleOrDefaultAsync(
                x => x.Id == booking.ExhibitorId,
                ct)
            ?? throw new DomainRuleException(
                ErrorCodes.EntityNotFound,
                "Exhibitor not found.");

        var stallSize = await _db.StallSizes
            .SingleOrDefaultAsync(
                x => x.Id == request.RequestedStallSizeId &&
                     x.EventId == evt.Id &&
                     x.IsActive,
                ct)
            ?? throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "Requested stall size is not available.");

        exhibitor.UpdateApplicationInformation(
            request.Exhibitor.LegalName ?? "",
            request.Exhibitor.TradeName,
            request.Exhibitor.RegisteredAddress ?? "",
            request.Exhibitor.City ?? "",
            request.Exhibitor.District ?? "",
            request.Exhibitor.State ?? "",
            request.Exhibitor.Pincode ?? "",
            request.Exhibitor.Country ?? "",
            request.Exhibitor.ContactPersonName ?? "",
            request.Exhibitor.ContactPersonDesignation ?? "",
            request.Exhibitor.Mobile ?? "",
            request.Exhibitor.AlternateMobile,
            request.Exhibitor.Email ?? "",
            request.Exhibitor.AlternateEmail,
            request.Exhibitor.Website,
            request.Exhibitor.IndustryScale ?? "",
            request.Exhibitor.BusinessType ?? "",
            request.Exhibitor.CompanyConstitution ?? "",
            request.Exhibitor.IndustryCategory ?? "",
            request.Exhibitor.ProductServiceDescription ?? "",
            request.Exhibitor.ProductKeywords ?? "",
            request.Exhibitor.UdyamNumber ?? "",
            request.Exhibitor.Gstin ?? "",
            request.Exhibitor.Pan ?? "",
            request.Exhibitor.TanNumber ?? "",
            request.Exhibitor.LubMember,
            request.Exhibitor.LubState ?? "",
            request.Exhibitor.LubChapter ?? "",
            request.Exhibitor.LubMembershipNumber
        );
        exhibitor.UpdateBankDetails(
            request.Exhibitor.BankAccountName,
            request.Exhibitor.BankName,
            request.Exhibitor.BankAccountNumber,
            request.Exhibitor.BankIfscCode
        );
        if (!string.IsNullOrWhiteSpace(
                request.Exhibitor.CompanyLogo))
        {
            var logoValidationError =
                ValidateCompanyLogoBase64(
                    request.Exhibitor.CompanyLogo);

            if (logoValidationError is not null)
            {
                return BadRequest(new
                {
                    message = logoValidationError
                });
            }

            exhibitor.UpdateCompanyLogo(
                request.Exhibitor.CompanyLogo);
        }
        booking.UpdateApplicationInformation(
            stallSize.Id,
            request.FasciaName ?? "",
            request.DisplayNotes,
            request.ElectricalRequirement,
            request.SpecialRequirement,
            request.HazardousDemoDeclared,
            request.TermsAccepted,
            request.DeclarantName ?? "",
            request.DeclarantDesignation ?? "",
            request.DeclarationDate
                ?? DateOnly.FromDateTime(DateTime.UtcNow)
        );

        await _db.SaveChangesAsync(ct);

        InvalidateAdminCaches(evt.Id);

        return Ok(new
        {
            bookingId = booking.Id,
            bookingRegistrationNumber =
                booking.BookingRegistrationNumber,
            message = "Application information updated successfully."
        });
    }

    [HttpGet("admin/events/current/dashboard/summary")]
    public async Task<IActionResult> DashboardSummary(CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);

        var cacheKey = $"admin_dashboard_summary_{evt.Id}";
        if (_cache.TryGetValue(cacheKey, out Dictionary<string, decimal>? cached) && cached != null)
        {
            return Ok(cached);
        }

        var bookingCounts = await _db.StallBookings.AsNoTracking()
            .Where(x => x.EventId == evt.Id)
            .GroupBy(x => x.BookingStatus)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var stallCounts = await _db.Stalls.AsNoTracking()
            .Where(x => x.EventId == evt.Id)
            .GroupBy(x => x.CurrentStatus)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var paymentVerifiedCount = await _db.Payments.AsNoTracking()
            .CountAsync(x => x.EventId == evt.Id && x.VerificationStatus == PaymentVerificationStatus.Verified, ct);

        var invoiceCounts = await _db.ProformaInvoices.AsNoTracking()
            .Where(x => x.EventId == evt.Id)
            .GroupBy(x => x.InvoiceStatus)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var totalRegistrations = bookingCounts.Sum(x => x.Count);
        var submittedBookings = bookingCounts.FirstOrDefault(x => x.Status == BookingStatus.Submitted)?.Count ?? 0;
        var blockedAwaitingPayment = bookingCounts.FirstOrDefault(x => x.Status == BookingStatus.BlockedAwaitingPayment)?.Count ?? 0;
        var confirmedBookings = bookingCounts.FirstOrDefault(x => x.Status == BookingStatus.Confirmed)?.Count ?? 0;

        var totalStalls = stallCounts.Sum(x => x.Count);
        var reservationStalls = stallCounts.FirstOrDefault(x => x.Status == StallStatus.Reservation)?.Count ?? 0;
        var availableStalls = stallCounts.FirstOrDefault(x => x.Status == StallStatus.Available)?.Count ?? 0;
        var blockedStalls = stallCounts.FirstOrDefault(x => x.Status == StallStatus.Blocked)?.Count ?? 0;
        var frozenStalls = stallCounts.FirstOrDefault(x => x.Status == StallStatus.Frozen)?.Count ?? 0;

        var invoiceGenerated = invoiceCounts.FirstOrDefault(x => x.Status == InvoiceStatus.Generated)?.Count ?? 0;
        var invoiceSent = invoiceCounts.FirstOrDefault(x => x.Status == InvoiceStatus.Sent)?.Count ?? 0;

        // Buyer-Seller Marketplace Activity
        var buyerOrganizations = await _db.Organizations.AsNoTracking().CountAsync(x => x.TenantId == evt.TenantId && (x.OrganizationType == "BUYER" || x.OrganizationType == "BOTH"), ct);
        var sellerOrganizations = await _db.Organizations.AsNoTracking().CountAsync(x => x.TenantId == evt.TenantId && (x.OrganizationType == "SELLER" || x.OrganizationType == "BOTH"), ct);
        var requirements = await _db.BuyerRequirements.AsNoTracking().CountAsync(x => x.TenantId == evt.TenantId, ct);
        var capabilities = await _db.SellerCapabilities.AsNoTracking().CountAsync(x => x.TenantId == evt.TenantId, ct);
        var matches = await _db.MatchResults.AsNoTracking().CountAsync(x => x.TenantId == evt.TenantId, ct);
        var meetings = await _db.Meetings.AsNoTracking().CountAsync(x => x.TenantId == evt.TenantId, ct);
        var awardValue = await _db.Awards.AsNoTracking().Where(x => x.TenantId == evt.TenantId).SumAsync(x => (decimal?)x.AwardValue, ct) ?? 0;

        var result = new Dictionary<string, decimal>
        {
            ["totalRegistrations"] = totalRegistrations,
            ["submittedBookings"] = submittedBookings,
            ["blockedAwaitingPayment"] = blockedAwaitingPayment,
            ["confirmedBookings"] = confirmedBookings,
            ["reservation"] = reservationStalls,
            ["totalStalls"] = totalStalls,
            ["availableStalls"] = availableStalls,
            ["blockedStalls"] = blockedStalls,
            ["frozenStalls"] = frozenStalls,
            ["paymentVerified"] = paymentVerifiedCount,
            ["invoiceGenerated"] = invoiceGenerated,
            ["invoiceSent"] = invoiceSent,
            ["buyerOrganizations"] = buyerOrganizations,
            ["sellerOrganizations"] = sellerOrganizations,
            ["requirements"] = requirements,
            ["capabilities"] = capabilities,
            ["matches"] = matches,
            ["meetings"] = meetings,
            ["awardValue"] = awardValue
        };

        _cache.Set(cacheKey, result, TimeSpan.FromSeconds(30));
        return Ok(result);
    }
    [HttpPost("admin/events/current/bookings/{bookingId:guid}/msme-subsidy/send-email")]
    public async Task<IActionResult> SendMsmeSubsidyInfo(Guid bookingId, CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);
        var booking = await _db.StallBookings
            .SingleOrDefaultAsync(x => x.Id == bookingId && x.EventId == evt.Id, ct)
            ?? throw new DomainRuleException(ErrorCodes.BookingNotFound, "Booking not found.");
        var exhibitor = await _db.Exhibitors
            .SingleOrDefaultAsync(x => x.Id == booking.ExhibitorId, ct)
            ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Exhibitor not found.");

        var email = _emailComposer.ComposeMsmeSubsidyInfo(
            booking,
            exhibitor.Email,
            exhibitor.TradeName ?? exhibitor.LegalName ?? "Company",
            "Approved",
            "0.00");

        await _db.EmailLogs.AddAsync(email, ct);
        await _db.SaveChangesAsync(ct);
        try
        {
            await _emailSender.SendEmailAsync(email.ToEmail, email.Subject, email.BodySnapshot);
            email.MarkSent(null);
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "MSME subsidy email sent." });
        }
        catch (Exception ex)
        {
            return StatusCode(502, new { message = "Failed to send email.", error = ex.Message });
        }
    }

    [HttpPost("admin/events/current/bookings/{bookingId:guid}/fame-tn-subsidy/send-email")]
    public async Task<IActionResult> SendFameTnSubsidyInfo(Guid bookingId, CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);
        var booking = await _db.StallBookings
            .SingleOrDefaultAsync(x => x.Id == bookingId && x.EventId == evt.Id, ct)
            ?? throw new DomainRuleException(ErrorCodes.BookingNotFound, "Booking not found.");
        var exhibitor = await _db.Exhibitors
            .SingleOrDefaultAsync(x => x.Id == booking.ExhibitorId, ct)
            ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Exhibitor not found.");

        var email = _emailComposer.ComposeFameTnSubsidyInfo(
            booking,
            exhibitor.Email,
            exhibitor.TradeName ?? exhibitor.LegalName ?? "Company",
            "Approved",
            "0.00");

        await _db.EmailLogs.AddAsync(email, ct);
        await _db.SaveChangesAsync(ct);
        try
        {
            await _emailSender.SendEmailAsync(email.ToEmail, email.Subject, email.BodySnapshot);
            email.MarkSent(null);
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Fame TN subsidy email sent." });
        }
        catch (Exception ex)
        {
            return StatusCode(502, new { message = "Failed to send email.", error = ex.Message });
        }
    }

    [HttpPost("admin/events/current/bookings/{bookingId:guid}/exhibitor-action/send-email")]
    public async Task<IActionResult> SendExhibitorActionRequired(Guid bookingId, [FromBody] ExhibitorActionRequest request, CancellationToken ct)
    {
        var evt = await ResolveCurrentEventAsync(ct);
        var booking = await _db.StallBookings
            .SingleOrDefaultAsync(x => x.Id == bookingId && x.EventId == evt.Id, ct)
            ?? throw new DomainRuleException(ErrorCodes.BookingNotFound, "Booking not found.");
        var exhibitor = await _db.Exhibitors
            .SingleOrDefaultAsync(x => x.Id == booking.ExhibitorId, ct)
            ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, "Exhibitor not found.");

        var email = _emailComposer.ComposeExhibitorActionRequired(
            booking,
            exhibitor.Email,
            request?.ActionRequired ?? "Please complete your pending action.");

        await _db.EmailLogs.AddAsync(email, ct);
        await _db.SaveChangesAsync(ct);
        try
        {
            await _emailSender.SendEmailAsync(email.ToEmail, email.Subject, email.BodySnapshot);
            email.MarkSent(null);
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Exhibitor action email sent." });
        }
        catch (Exception ex)
        {
            return StatusCode(502, new { message = "Failed to send email.", error = ex.Message });
        }
    }

    public record ExhibitorActionRequest(string? ActionRequired);

    [HttpGet("admin/events/current/audit")]
    public async Task<IActionResult> Audit(CancellationToken ct)
    {
        const string cacheKey = "admin_audit_logs";
        if (_cache.TryGetValue(cacheKey, out object? cached) && cached != null)
        {
            return Ok(cached);
        }
        var data = await _db.AuditLogs.AsNoTracking().OrderByDescending(x => x.OccurredAt).Take(250).ToListAsync(ct);
        _cache.Set(cacheKey, data, TimeSpan.FromSeconds(30));
        return Ok(data);
    }
    [HttpGet("admin/events/current/email-logs")]
    public async Task<IActionResult> EmailLogs(CancellationToken ct)
    {
        const string cacheKey = "admin_email_logs";
        if (_cache.TryGetValue(cacheKey, out object? cached) && cached != null)
        {
            return Ok(cached);
        }
        var data = await _db.EmailLogs.AsNoTracking().OrderByDescending(x => x.CreatedAt).Take(250).ToListAsync(ct);
        _cache.Set(cacheKey, data, TimeSpan.FromSeconds(30));
        return Ok(data);
    }
    private async Task<EventEntity> ResolveCurrentEventAsync(CancellationToken ct)
    {
        var eventCode = _configuration["EventDefaults:EventCode"] ?? "MSME-HOSUR-2026";
        return await ResolveEventAsync(eventCode, ct);
    }

    private async Task<EventEntity> ResolveEventAsync(string eventCode, CancellationToken ct)
    {
        return await _db.Events.SingleOrDefaultAsync(x => x.EventCode == eventCode.ToUpper(), ct)
            ?? throw new DomainRuleException(ErrorCodes.EntityNotFound, $"Event {eventCode} was not found.");
    }

    private async Task<string> NextNumberAsync(
        Guid tenantId,
        Guid eventId,
        string code,
        string prefix,
        CancellationToken ct)
    {
        var indiaTime = DateTimeOffset.UtcNow
            .ToOffset(TimeSpan.FromHours(5.5));

        var today = DateOnly.FromDateTime(indiaTime.DateTime);

        var seq = await _db.NumberSequences
            .SingleOrDefaultAsync(x =>
                x.TenantId == tenantId &&
                x.EventId == eventId &&
                x.SequenceCode == code,
                ct);

        if (seq is null)
        {
            seq = NumberSequence.Create(
                tenantId: tenantId,
                eventId: eventId,
                sequenceCode: code,
                prefix: prefix,
                paddingLength: 3,
                resetFrequency: SequenceResetFrequency.Never,
                sequenceDate: today);

            await _db.NumberSequences.AddAsync(seq, ct);
        }

        var next = seq.Next(today);

        await _db.SaveChangesAsync(ct);

        return next;
    }

    private async Task<string> GetExhibitorEmailAsync(Guid exhibitorId, CancellationToken ct) => (await _db.Exhibitors.SingleAsync(x => x.Id == exhibitorId, ct)).Email;
    private async Task<Exhibitor> GetExhibitorAsync(Guid exhibitorId, CancellationToken ct) =>
    await _db.Exhibitors.SingleAsync(x => x.Id == exhibitorId, ct);

    private string CreateToken(User user, string roleCode, IEnumerable<string> permissions)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:SigningKey"] ?? "CHANGE_THIS_DEVELOPMENT_SIGNING_KEY_MINIMUM_32_CHARS"));
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.Name, user.Email),
            new("tenantId", user.TenantId.ToString()),
            new("role", roleCode)
        };
        claims.AddRange(permissions.Select(p => new Claim("permission", p)));
        var token = new JwtSecurityToken(_configuration["Jwt:Issuer"], _configuration["Jwt:Audience"], claims, expires: DateTime.UtcNow.AddMinutes(60), signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    private static IEnumerable<string> MarketplacePermissionsFor(MSME.StallBooking.Domain.Marketplace.MarketplaceMembershipRole role) => role switch
    {
        MSME.StallBooking.Domain.Marketplace.MarketplaceMembershipRole.OWNER or MSME.StallBooking.Domain.Marketplace.MarketplaceMembershipRole.ADMIN or MSME.StallBooking.Domain.Marketplace.MarketplaceMembershipRole.BOTH =>
            ["buyer.dashboard.view", "buyer.organisation.view", "buyer.organisation.update", "buyer.requirement.view", "buyer.requirement.create", "buyer.requirement.update", "buyer.requirement.submit", "buyer.requirement.cancel", "buyer.matches.view", "buyer.matches.run", "buyer.engagement.view", "buyer.engagement.manage", "buyer.meeting.view", "buyer.meeting.request", "buyer.meeting.manage", "buyer.meeting.outcome", "buyer.rfq.view", "buyer.rfq.create", "buyer.quotation.compare", "buyer.award.create", "buyer.purchase_order.view", "seller.dashboard.view", "seller.organisation.view", "seller.organisation.update", "seller.capability.view", "seller.capability.create", "seller.capability.update", "seller.capability.publish", "seller.capability.withdraw", "seller.opportunity.view", "seller.engagement.view", "seller.engagement.respond", "seller.meeting.view", "seller.meeting.request", "seller.meeting.manage", "seller.meeting.outcome", "seller.rfq.view", "seller.quotation.submit", "seller.award.view"],
        MSME.StallBooking.Domain.Marketplace.MarketplaceMembershipRole.BUYER_USER => ["buyer.dashboard.view", "buyer.organisation.view", "buyer.requirement.view", "buyer.requirement.create", "buyer.requirement.update", "buyer.requirement.submit", "buyer.matches.view", "buyer.engagement.view", "buyer.engagement.manage", "buyer.meeting.view", "buyer.meeting.request", "buyer.rfq.view", "buyer.purchase_order.view"],
        MSME.StallBooking.Domain.Marketplace.MarketplaceMembershipRole.SELLER_USER => ["seller.dashboard.view", "seller.organisation.view", "seller.capability.view", "seller.capability.create", "seller.capability.update", "seller.capability.publish", "seller.opportunity.view", "seller.engagement.view", "seller.engagement.respond", "seller.meeting.view", "seller.meeting.request", "seller.rfq.view", "seller.quotation.submit", "seller.award.view"],
        _ => ["buyer.dashboard.view", "buyer.requirement.view", "buyer.matches.view", "seller.dashboard.view", "seller.capability.view", "seller.opportunity.view"]
    };

    private static bool VerifyPassword(string supplied, string storedHash)
    {
        // Legacy dev seed accounts still use this fixed marker/password pair.
        if (storedHash == "DEV_ONLY_CHANGE_ME_12345") return supplied == "ChangeMe@12345";

        // Real accounts (including self-registered Buyer/Seller marketplace users) use PBKDF2 hashes.
        return MSME.StallBooking.Application.Security.PasswordHasher.Verify(supplied, storedHash);
    }

    private static void ValidatePublicBooking(SubmitBookingCommand c)
    {
        if (!c.TermsAccepted)
        {
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "Terms and Conditions must be accepted.");
        }
        //if (c.Exhibitor.LubMember && string.IsNullOrWhiteSpace(c.Exhibitor.LubMembershipNumber))
        //    throw new DomainRuleException(ErrorCodes.ValidationFailed, "LUB membership number is required when LUB member is Yes.");
    }

    private static AuditLog Audit(Guid tenantId, Guid? eventId, Guid? actorId, string entity, Guid entityId, string action, object? oldValues, object? newValues)
    {
        string? oldJson = oldValues is null ? null : System.Text.Json.JsonSerializer.Serialize(oldValues);
        string? newJson = newValues is null ? null : System.Text.Json.JsonSerializer.Serialize(newValues);
        return AuditLog.Create(tenantId, eventId, actorId, entity, entityId, action, oldJson, newJson, null);
    }
    private static string? ValidateCompanyLogo(
    IFormFile? logo)
    {
        if (logo is null ||
            logo.Length == 0)
        {
            return "Company logo is required.";
        }

        if (logo.Length >
            1 * 1024 * 1024)
        {
            return
                "Company logo must be 1 MB or smaller.";
        }

        var allowedContentTypes =
            new[]
            {
            "image/png",
            "image/jpeg",
            "image/jpg"
            };

        if (!allowedContentTypes.Contains(
                logo.ContentType,
                StringComparer.OrdinalIgnoreCase))
        {
            return
                "Only PNG, JPG and JPEG logos are allowed.";
        }

        var extension =
            Path.GetExtension(
                logo.FileName)
            .ToLowerInvariant();

        var allowedExtensions =
            new[]
            {
            ".png",
            ".jpg",
            ".jpeg"
            };

        if (!allowedExtensions.Contains(
                extension,
                StringComparer.OrdinalIgnoreCase))
        {
            return
                "Only .png, .jpg and .jpeg files are allowed.";
        }

        return null;
    }

    private static string? ValidateCompanyLogoBase64(
     string? companyLogo)
    {
        if (string.IsNullOrWhiteSpace(companyLogo))
        {
            return null;
        }

        var allowedPrefixes = new[]
        {
        "data:image/png;base64,",
        "data:image/jpeg;base64,",
        "data:image/jpg;base64,"
    };

        var validPrefix =
            allowedPrefixes.Any(prefix =>
                companyLogo.StartsWith(
                    prefix,
                    StringComparison.OrdinalIgnoreCase));

        if (!validPrefix)
        {
            return
                "Company logo must be a PNG, JPG or JPEG Base64 image.";
        }

        var commaIndex =
            companyLogo.IndexOf(',');

        if (commaIndex < 0 ||
            commaIndex == companyLogo.Length - 1)
        {
            return "Invalid company logo Base64 format.";
        }

        var base64Value =
            companyLogo[(commaIndex + 1)..];

        try
        {
            var logoBytes =
                Convert.FromBase64String(base64Value);

            if (logoBytes.Length == 0)
            {
                return "Company logo is empty.";
            }

            if (logoBytes.Length > 1 * 1024 * 1024)
            {
                return
                    "Company logo must be 1 MB or smaller.";
            }
        }
        catch (FormatException)
        {
            return "Invalid company logo Base64 value.";
        }

        return null;
    }
}


public sealed record LoginRequest(string Email, string Password);
public sealed record AuthResponseDto(string AccessToken, UserDto User);
public sealed record UserDto(Guid Id, Guid TenantId, string FullName, string Email, string RoleCode, IReadOnlyCollection<string> Permissions, string? OrganizationType = null);
public sealed record BlockStallApiRequest(
    Guid StallId,
    Guid ActorUserId,
    decimal? TargetSponsorTotal = null,
    bool IsGstApplicable = true,
    bool IsTdsDeductable = false);
public sealed record PaymentApiRequest(
    Guid ActorUserId,
    string PaymentReferenceNumber,
    decimal AmountPaid,
    string? PayerName,
    string? PayerBank,
    DateOnly PaymentDate,
    string? Remarks,
    bool OverrideExpiredBlock = false,
     bool isTdsDeductable = false,
        bool isGstApplicable = false,
    string? gstType = null,
    string? gstAmount = null,
    decimal? TargetSponsorTotal = null
);

public sealed record StallMasterRequest(
    Guid StallSizeId,
    string StallNumber,
    string? HallName,
    string? ZoneName,
    string? RowLabel,
    string? FloorLabel,
    int? LayoutX,
    int? LayoutY,
    bool IsActive = true);
public sealed record ActorRequest(Guid ActorUserId);
public sealed record BookingDto(
    Guid Id,
    Guid TenantId,
    Guid? EventId,
    Guid ExhibitorId,
    Guid BillingProfileId,
    Guid RequestedStallSizeId,
    Guid? AllocatedStallId,
    string BookingRegistrationNumber,
    DateTimeOffset BookingDate,
    string CompanyName,
    string ContactPerson,
    string Email,
    string Mobile,
    string? PanNumber,
    string? UdyamRegistrationNumber,
    string? Gstin,
    string? TanNumber,

    string District,
    string? RegisteredAddress,
    string? City,
    string? IndustryCategory,
    string? ProductKeywords,
    string? BusinessType,
    string? Manufacturing,
    string? FasciaName,
         bool? LubMember,


    string BookingStatus,
    string? StallNumber,
    DateTimeOffset? BlockExpiresAt,
    DateTimeOffset? LastEmailSentAt,
    DateTimeOffset? ConfirmedAt,
    DateTimeOffset? CancelledAt,
    string? CancellationReason,
    string StallSizeCode,
    string StallSizeName,
    decimal ExpectedAmount,
    string? StallOption1Number,
    string? StallOption2Number,
    string? CompanyLogo,
     decimal TotalPaidAmount,
    decimal BalanceDueAmount
);
public sealed record UpdateBookingRequest(
    Guid ActorUserId,
    Guid RequestedStallSizeId,
    UpdateExhibitorRequest Exhibitor,
    UpdateBillingRequest? Billing,
    string? FasciaName,

    string? DisplayNotes,
    string? ElectricalRequirement,
    string? SpecialRequirement,
    bool HazardousDemoDeclared,
    bool TermsAccepted,
    string? DeclarantName,
    string? DeclarantDesignation,

    DateOnly? DeclarationDate
);

public sealed record UpdateExhibitorRequest(
    string? LegalName,
    string? TradeName,
    string? RegisteredAddress,
    string? City,
    string? District,
    string? State,
    string? Pincode,
    string? Country,
    string? ContactPersonName,
    string? ContactPersonDesignation,
    string? Mobile,
    string? AlternateMobile,
    string? Email,
    string? AlternateEmail,
    string? Website,
    string? IndustryScale,
    string? BusinessType,
    string? CompanyConstitution,
    string? IndustryCategory,
    string? ProductServiceDescription,
    string? ProductKeywords,
    string? UdyamNumber,
    string? Gstin,
    string? Pan,
    string? TanNumber,
    bool LubMember,
    string? LubState,
    string? LubChapter,
    string? LubMembershipNumber,
      string? CompanyLogo
);

public sealed record UpdateBillingRequest(
    string? BillingLegalName,
    string? BillingAddress,
    string? BillingCity,
    string? BillingState,
    string? BillingStateCode,
    string? BillingPincode,
    string? BillingCountry,
    string? BillingGstin,
    string? BillingPan,
    string? PlaceOfSupply,
    string? BillingContactPerson,
    string? BillingEmail,
    string? BillingMobile
);
public sealed record StallAllocationDetailsDto(
    Guid StallId,
    string StallNumber,
    string StallStatus,

    string BookingRegistrationNumber,
    string BookingStatus,

    string CompanyName,
    string ContactPerson,
    string Email,
    string Mobile,

    DateTimeOffset? BlockedAt,
    DateTimeOffset? BlockExpiresAt,

    Guid? ActionByUserId,
    string? ActionByName,
    DateTimeOffset? ActionAt);

public sealed record BulkExtendBlockApiRequest(
   Guid ActorUserId,
   List<Guid> BookingIds,
   DateTimeOffset NewExpiryAt);