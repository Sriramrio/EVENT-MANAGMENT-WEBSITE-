using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Application.Abstractions;
using MSME.StallBooking.Domain.Entities;
using MSME.StallBooking.Persistence;

namespace MSME.StallBooking.Api.Controllers;

/// <summary>
/// Public, unauthenticated endpoints backing the QR code that is printed and placed at
/// each exhibitor's stall. Scanning it opens the company profile page (see
/// PublicStallController.GetByRegistrationNumber) and lets a visitor tap "I'm Interested"
/// to notify the exhibitor (RegisterInterest).
/// </summary>
[ApiController]
[Route("api/v1/public/stalls")]
public sealed class PublicStallController : ControllerBase
{
    private readonly StallBookingDbContext _db;
    private readonly IEmailSender _emailSender;
    private readonly IEmailComposer _emailComposer;

    // Publicly hosted brand assets — same host pattern used by the front-end
    // (see frontend brandAsset()/PUBLIC_BASE_URL: https://msmesangamam.lubtn.com/...)
    private const string BrandAssetBaseUrl = "https://msmesangamam.lubtn.com/brand";
    //private const string MsmeLogoUrl = $"{BrandAssetBaseUrl}/Assets/logo.jpg";
    private const string LubLogoUrl = $"{BrandAssetBaseUrl}/Assets/logo.jpg";
    private const string BrandBlue = "#0B3B75";
    private const string BrandOrange = "#F97316";

    public PublicStallController(
        StallBookingDbContext db,
        IEmailSender emailSender,
        IEmailComposer emailComposer)
    {
        _db = db;
        _emailSender = emailSender;
        _emailComposer = emailComposer;
    }

    [HttpGet("{registrationNumber}")]
    public async Task<IActionResult> GetByRegistrationNumber(string registrationNumber, CancellationToken ct)
    {
        var reg = registrationNumber.Trim().ToUpperInvariant();

        var booking = await _db.StallBookings
            .AsNoTracking()
            .Where(b => b.BookingRegistrationNumber == reg)
            .Select(b => new { b.ExhibitorId, b.AllocatedStallId, b.FasciaName, b.BookingRegistrationNumber })
            .SingleOrDefaultAsync(ct);

        if (booking is null)
            return NotFound(new { message = "No stall found for this QR code." });

        var exhibitor = await _db.Exhibitors
            .AsNoTracking()
            .SingleOrDefaultAsync(e => e.Id == booking.ExhibitorId, ct);

        if (exhibitor is null)
            return NotFound(new { message = "Company details are not available for this stall yet." });

        string? stallNumber = null;
        if (booking.AllocatedStallId is Guid stallId)
        {
            stallNumber = await _db.Stalls
                .AsNoTracking()
                .Where(s => s.Id == stallId)
                .Select(s => s.StallNumber)
                .SingleOrDefaultAsync(ct);
        }

        return Ok(new
        {
            registrationNumber = booking.BookingRegistrationNumber,
            companyName = string.IsNullOrWhiteSpace(exhibitor.LegalName) ? (exhibitor.TradeName ?? "Exhibitor") : exhibitor.LegalName,
            legalName = exhibitor.LegalName,
            tradeName = exhibitor.TradeName,
            fasciaName = booking.FasciaName,
            stallNumber,
            industryCategory = exhibitor.IndustryCategory,
            businessType = exhibitor.BusinessType,
            productServiceDescription = exhibitor.ProductServiceDescription,
            contactPersonName = exhibitor.ContactPersonName,
            contactPersonDesignation = exhibitor.ContactPersonDesignation,
            mobile = exhibitor.Mobile,
            email = exhibitor.Email,
            website = exhibitor.Website,
            city = exhibitor.City,
            district = exhibitor.District,
            state = exhibitor.State,
            companyLogo = exhibitor.CompanyLogo
        });
    }

    /// <summary>
    /// Called when a visitor taps "I'm Interested" on the company profile page.
    /// Emails the exhibitor's contact so the lead reaches them immediately —
    /// no admin scanner or login required on the visitor's side.
    /// </summary>
    [HttpPost("{registrationNumber}/interest")]
    public async Task<IActionResult> RegisterInterest(
        string registrationNumber,
        [FromBody] StallInterestRequest request,
        CancellationToken ct)
    {
        var reg = registrationNumber.Trim().ToUpperInvariant();

        var bookingRow = await _db.StallBookings
            .AsNoTracking()
            .Where(b => b.BookingRegistrationNumber == reg)
            .Select(b => new { b.Id, b.ExhibitorId, b.FasciaName })
            .SingleOrDefaultAsync(ct);

        if (bookingRow is null)
            return NotFound(new { message = "No stall found for this QR code." });

        var exhibitor = await _db.Exhibitors
            .AsNoTracking()
            .SingleOrDefaultAsync(e => e.Id == bookingRow.ExhibitorId, ct);

        if (exhibitor is null)
            return NotFound(new { message = "Company details are not available for this stall yet." });

        if (!string.IsNullOrWhiteSpace(exhibitor.Email))
        {
            var visitorLabel = string.IsNullOrWhiteSpace(request.VisitorName) ? "A visitor" : request.VisitorName!.Trim();
            var recipientName = string.IsNullOrWhiteSpace(exhibitor.ContactPersonName)
                ? exhibitor.LegalName
                : exhibitor.ContactPersonName;
            var emailLog = _emailComposer.ComposeStallVisitorInterest(
     recipientName: recipientName,
     visitorLabel: visitorLabel,
     fasciaName: bookingRow.FasciaName ?? "-",
     visitorMobile: request.VisitorMobile,
     visitorEmail: request.VisitorEmail,
     toEmail: exhibitor.Email,
     tenantId: exhibitor.TenantId,
     eventId: exhibitor.EventId,
     bookingId: bookingRow.Id);

            await _db.EmailLogs.AddAsync(emailLog, ct);
            await _db.SaveChangesAsync(ct);
            try
            {
                await _emailSender.SendEmailAsync(emailLog.ToEmail, emailLog.Subject, emailLog.BodySnapshot);
                emailLog.MarkSent(null);
                await _db.SaveChangesAsync(ct);
            }
            catch (Exception ex)
            {
                emailLog.MarkFailed(ex.Message);
                await _db.SaveChangesAsync(ct);
            }
        }

        var interest = StallInterest.Create(
            exhibitor.TenantId,
            exhibitor.EventId,
            bookingRow.Id,
            exhibitor.Id,
            request.VisitorName,
            request.VisitorMobile,
            request.VisitorEmail);

        _db.StallInterests.Add(interest);
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Thanks! We've let the exhibitor know you're interested." });
    }

    /// <summary>
    /// Builds the HTML body for the "visitor interested" notification email —
    /// branded header (MSME + LUB logos), a clean details card, and an
    /// "Powered by ATRIBS GLOBAL" footer. Table-based layout for email-client compatibility.
    /// </summary>
    private static string BuildInterestEmailBody(
        string recipientName,
        string visitorLabel,
        string? fasciaName,
        string? visitorMobile,
        string? visitorEmail)
    {
        var sb = new StringBuilder();

        sb.Append($@"
<!DOCTYPE html>
<html>
<head>
  <meta charset=""UTF-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
</head>
<body style=""margin:0;padding:0;background-color:#f1f5f9;font-family:Segoe UI,Helvetica,Arial,sans-serif;"">
  <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#f1f5f9;padding:24px 0;"">
    <tr>
      <td align=""center"">
        <table role=""presentation"" width=""480"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 18px rgba(11,59,117,0.12);max-width:480px;width:100%;"">

          <!-- ===== HEADER: LOGOS ===== -->
          <tr>
            <td align=""center"" style=""background-color:{BrandBlue};padding:20px 24px;"">
              <table role=""presentation"" cellpadding=""0"" cellspacing=""0"">
                <tr>
                 
                  <td style=""padding:0 10px;"">
                    <img src=""{LubLogoUrl}"" alt=""Laghu Udyog Bharati"" height=""40"" style=""display:block;height:40px;width:auto;border:0;"" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== TITLE ===== -->
          <tr>
            <td align=""center"" style=""padding:28px 24px 8px 24px;"">
              <p style=""margin:0;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:{BrandOrange};"">New Stall Interest</p>
              <h1 style=""margin:6px 0 0 0;font-size:20px;font-weight:800;color:#0f172a;"">Someone is interested in your stall!</h1>
            </td>
          </tr>

          <!-- ===== BODY TEXT ===== -->
          <tr>
            <td style=""padding:12px 32px 0 32px;"">
              <p style=""margin:0;font-size:14px;line-height:22px;color:#334155;"">
                Hello <strong>{System.Net.WebUtility.HtmlEncode(recipientName)}</strong>,
              </p>
              <p style=""margin:10px 0 0 0;font-size:14px;line-height:22px;color:#334155;"">
                <strong>{System.Net.WebUtility.HtmlEncode(visitorLabel)}</strong> scanned your stall QR code{(string.IsNullOrWhiteSpace(fasciaName) ? "" : $" (<strong>{System.Net.WebUtility.HtmlEncode(fasciaName)}</strong>)")} and marked interest in your products/services.
              </p>
            </td>
          </tr>

          <!-- ===== VISITOR DETAILS CARD ===== -->
          <tr>
            <td style=""padding:20px 32px 0 32px;"">
              <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;"">
                <tr>
                  <td style=""padding:14px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8;border-bottom:1px solid #f1f5f9;"">Visitor Name</td>
                  <td align=""right"" style=""padding:14px 16px;font-size:13px;font-weight:700;color:#0f172a;border-bottom:1px solid #f1f5f9;"">{System.Net.WebUtility.HtmlEncode(visitorLabel)}</td>
                </tr>");

        if (!string.IsNullOrWhiteSpace(visitorMobile))
        {
            sb.Append($@"
                <tr>
                  <td style=""padding:14px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8;border-bottom:1px solid #f1f5f9;"">Mobile</td>
                  <td align=""right"" style=""padding:14px 16px;font-size:13px;font-weight:700;color:{BrandBlue};border-bottom:1px solid #f1f5f9;"">
                    <a href=""tel:{System.Net.WebUtility.HtmlEncode(visitorMobile)}"" style=""color:{BrandBlue};text-decoration:none;"">{System.Net.WebUtility.HtmlEncode(visitorMobile)}</a>
                  </td>
                </tr>");
        }

        if (!string.IsNullOrWhiteSpace(visitorEmail))
        {
            sb.Append($@"
                <tr>
                  <td style=""padding:14px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8;"">Email</td>
                  <td align=""right"" style=""padding:14px 16px;font-size:13px;font-weight:700;color:{BrandBlue};"">
                    <a href=""mailto:{System.Net.WebUtility.HtmlEncode(visitorEmail)}"" style=""color:{BrandBlue};text-decoration:none;"">{System.Net.WebUtility.HtmlEncode(visitorEmail)}</a>
                  </td>
                </tr>");
        }

        sb.Append($@"
              </table>
            </td>
          </tr>

          <!-- ===== SIGN-OFF ===== -->
          <tr>
            <td style=""padding:24px 32px 28px 32px;"">
              <p style=""margin:0;font-size:13px;line-height:20px;color:#64748b;"">Regards,<br/>MSME Sangamam</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>");

        return sb.ToString();
    }
}

public sealed record StallInterestRequest(string? VisitorName, string? VisitorMobile, string? VisitorEmail);