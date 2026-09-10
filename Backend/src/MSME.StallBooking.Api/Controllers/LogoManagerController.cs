using System.IO.Compression;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Persistence;

namespace MSME.StallBooking.Api.Controllers;

public sealed record LogoStatusDto(
    Guid ExhibitorId,
    string CompanyName,
    string? TradeName,
    string Email,
    string Mobile,
    bool HasLogo,
    DateTimeOffset CreatedAt);

[ApiController]
[Authorize]
[Route("api/v1/admin/logo-manager")]
public sealed class LogoManagerController : ControllerBase
{
    private readonly StallBookingDbContext _db;

    public LogoManagerController(StallBookingDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Returns every exhibitor with a flag showing whether they have
    /// uploaded a company logo yet.
    /// </summary>
    [HttpGet("exhibitors")]
    public async Task<IActionResult> GetLogoStatus(CancellationToken ct)
    {
        if (!IsAuthorizedAdmin())
            return Forbid();

        var exhibitors = await _db.Exhibitors
            .AsNoTracking()
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new LogoStatusDto(
                e.Id,
                e.TradeName != null && e.TradeName != "" ? e.TradeName : e.LegalName,
                e.TradeName,
                e.Email,
                e.Mobile,
                e.CompanyLogo != null && e.CompanyLogo != "",
                e.CreatedAt))
            .ToListAsync(ct);

        return Ok(new
        {
            total = exhibitors.Count,
            uploaded = exhibitors.Count(e => e.HasLogo),
            pending = exhibitors.Count(e => !e.HasLogo),
            exhibitors
        });
    }

    /// <summary>
    /// Downloads every uploaded company logo as a single ZIP file,
    /// with each entry named after the exhibitor's company name.
    /// </summary>
    [HttpGet("download-zip")]
    public async Task<IActionResult> DownloadLogosZip(CancellationToken ct)
    {
        if (!IsAuthorizedAdmin())
            return Forbid();

        var exhibitors = await _db.Exhibitors
            .AsNoTracking()
            .Where(e => e.CompanyLogo != null && e.CompanyLogo != "")
            .Select(e => new
            {
                e.Id,
                CompanyName = e.TradeName != null && e.TradeName != "" ? e.TradeName : e.LegalName,
                e.CompanyLogo
            })
            .ToListAsync(ct);

        if (exhibitors.Count == 0)
        {
            return NotFound(new { message = "No exhibitor has uploaded a company logo yet." });
        }

        using var memoryStream = new MemoryStream();
        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            var usedNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var ex in exhibitors)
            {
                var decoded = TryDecodeLogo(ex.CompanyLogo);
                if (decoded is null) continue;

                var (bytes, extension) = decoded.Value;

                var safeName = SanitizeFileName(ex.CompanyName);
                var fileName = $"{safeName}{extension}";
                var attempt = 1;
                while (!usedNames.Add(fileName))
                {
                    fileName = $"{safeName}_{attempt}{extension}";
                    attempt++;
                }

                var entry = archive.CreateEntry(fileName, CompressionLevel.Fastest);
                using var entryStream = entry.Open();
                await entryStream.WriteAsync(bytes, ct);
            }
        }

        memoryStream.Position = 0;
        var zipBytes = memoryStream.ToArray();

        return File(
            zipBytes,
            "application/zip",
            $"exhibitor-logos-{DateTimeOffset.UtcNow:yyyyMMdd-HHmm}.zip");
    }

    private static (byte[] Bytes, string Extension)? TryDecodeLogo(string? companyLogo)
    {
        if (string.IsNullOrWhiteSpace(companyLogo)) return null;

        var prefixMap = new (string Prefix, string Extension)[]
        {
            ("data:image/png;base64,", ".png"),
            ("data:image/jpeg;base64,", ".jpg"),
            ("data:image/jpg;base64,", ".jpg"),
        };

        foreach (var (prefix, extension) in prefixMap)
        {
            if (companyLogo.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                var base64Value = companyLogo[prefix.Length..];
                try
                {
                    var bytes = Convert.FromBase64String(base64Value);
                    return bytes.Length == 0 ? null : (bytes, extension);
                }
                catch (FormatException)
                {
                    return null;
                }
            }
        }

        return null;
    }

    private static string SanitizeFileName(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "Unnamed";

        var invalid = Path.GetInvalidFileNameChars();
        var cleaned = new string(name
            .Select(c => invalid.Contains(c) || c == ' ' ? '_' : c)
            .ToArray())
            .Trim('_');

        while (cleaned.Contains("__"))
            cleaned = cleaned.Replace("__", "_");

        return string.IsNullOrWhiteSpace(cleaned) ? "Unnamed" : cleaned;
    }

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
}
