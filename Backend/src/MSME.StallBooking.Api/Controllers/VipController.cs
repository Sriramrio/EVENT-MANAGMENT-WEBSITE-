using Microsoft.AspNetCore.Mvc;
using MSME.StallBooking.Application.Abstractions;
using MSME.StallBooking.Application.Contracts;
using MSME.StallBooking.Application.Services;
using System.Security.Claims;

namespace MSME.StallBooking.Api.Controllers;

[ApiController]
[Route("api/v1/vips")]
public sealed class VipController : ControllerBase
{
    private readonly VipWorkflowService _vipWorkflowService;
    private readonly IUnitOfWork _uow;

    public VipController(
        VipWorkflowService vipWorkflowService,
        IUnitOfWork uow)
    {
        _vipWorkflowService = vipWorkflowService;
        _uow = uow;
    }

    // =========================================================
    // CREATE VIP
    // POST: /api/v1/vips
    // =========================================================
    [HttpPost]
    public async Task<ActionResult<SubmitVipRegistrationResult>> Create(
        [FromBody] SubmitVipRegistrationCommand command,
        CancellationToken ct)
    {
        var result =
            await _vipWorkflowService.SubmitVipRegistrationAsync(
                command,
                ct);

        return Ok(result);
    }

    // =========================================================
    // GET ALL VIPS
    // GET: /api/v1/vips?tenantId=...&eventId=...
    // =========================================================
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid tenantId,
        [FromQuery] Guid eventId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty || eventId == Guid.Empty)
        {
            return BadRequest(new
            {
                message = "Both tenantId and eventId query parameters are required."
            });
        }

        var result = await _vipWorkflowService.GetAllVipsAsync(
            tenantId,
            eventId,
            ct);

        return Ok(result);
    }

    // =========================================================
    // CHECK-IN
    // POST: /api/v1/vips/checkin
    // =========================================================
    [HttpPost("checkin")]
    public async Task<ActionResult<CheckInVipResult>> CheckIn(
        [FromBody] CheckInVipRequest request,
        CancellationToken ct)
    {
        var actorClaim =
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        Guid? actorUserId =
            Guid.TryParse(actorClaim, out var parsedActorId)
                ? parsedActorId
                : null;

        var result = await _vipWorkflowService.CheckInAsync(
            request.TenantId,
            request.RegistrationNumber,
            actorUserId,
            ct);

        return Ok(result);
    }

    // =========================================================
    // GET PRESENT VIPS
    // GET: /api/v1/vips/present?tenantId=...&eventId=...
    // =========================================================
    [HttpGet("present")]
    public async Task<ActionResult<IReadOnlyList<VipDto>>> GetPresent(
        [FromQuery] Guid tenantId,
        [FromQuery] Guid eventId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty || eventId == Guid.Empty)
        {
            return BadRequest(new
            {
                message = "Both tenantId and eventId query parameters are required."
            });
        }

        var result = await _vipWorkflowService.GetPresentVipsAsync(
            tenantId,
            eventId,
            ct);

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

        var vips = await _uow.Vips.GetAllAsync(tenantId, eventId, ct);
        var vipList = vips.ToList();

        var summary = new VipDashboardSummaryDto
        {
            TotalVips = vipList.Count,
            CheckedInCount = vipList.Count(v => v.IsPresent),
            PendingCheckInCount = vipList.Count(v => !v.IsPresent),

            VipsByOrganization = vipList
                .Where(v => !string.IsNullOrWhiteSpace(v.Organization))
                .GroupBy(v => v.Organization!)
                .ToDictionary(g => g.Key, g => g.Count()),

            VipsByDesignation = vipList
                .Where(v => !string.IsNullOrWhiteSpace(v.Designation))
                .GroupBy(v => v.Designation!)
                .ToDictionary(g => g.Key, g => g.Count()),

            RecentVips = vipList
                .OrderByDescending(v => v.CreatedAt)
                .Take(5)
                .Select(v => new RecentVipDto
                {
                    Id = v.Id,
                    RegistrationNumber = v.RegistrationNumber,
                    Name = v.Name,
                    Designation = v.Designation,
                    Organization = v.Organization,
                    Mobile = v.Mobile,
                    City = v.City,
                    District = v.District,
                    State = v.State,
                    CreatedAt = v.CreatedAt.DateTime
                })
        };

        return Ok(summary);
    }
    }

public sealed record CheckInVipRequest(
    Guid TenantId,
    string RegistrationNumber);
public sealed record VipDashboardSummaryDto
{
    public int TotalVips { get; init; }
    public int CheckedInCount { get; init; }
    public int PendingCheckInCount { get; init; }
    public Dictionary<string, int> VipsByOrganization { get; init; } = new();
    public Dictionary<string, int> VipsByDesignation { get; init; } = new();
    public IEnumerable<RecentVipDto> RecentVips { get; init; } = Array.Empty<RecentVipDto>();
}

public sealed record RecentVipDto
{
    public Guid Id { get; init; }
    public string RegistrationNumber { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string? Designation { get; init; }
    public string? Organization { get; init; }
    public string Mobile { get; init; } = string.Empty;
    public string City { get; init; } = string.Empty;
    public string District { get; init; } = string.Empty;
    public string State { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}