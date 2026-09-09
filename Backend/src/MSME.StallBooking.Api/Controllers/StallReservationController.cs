using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Domain.Enums;
using MSME.StallBooking.Persistence;

namespace MSME.StallBooking.Api.Controllers;

[ApiController]
[Route("api/v1/admin/events/{eventId:guid}/stall-reservations")]
public sealed class StallReservationController : ControllerBase
{
    private readonly StallBookingDbContext _db;

    public StallReservationController(StallBookingDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Gets stalls that can be reserved by the admin.
    /// </summary>
    [HttpGet("available-stalls")]
    public async Task<IActionResult> GetAvailableStalls(
        Guid eventId,
        [FromQuery] Guid tenantId,
        CancellationToken ct)
    {
        var stalls = await _db.Stalls
            .AsNoTracking()
            .Where(x =>
                x.EventId == eventId &&
                x.TenantId == tenantId &&
                x.IsActive &&
                x.CurrentStatus == StallStatus.Available)
            .OrderBy(x => x.StallNumber)
            .Select(x => new
            {
                id = x.Id,
                stallNumber = x.StallNumber,
                stallSizeId = x.StallSizeId,
                hallName = x.HallName,
                zoneName = x.ZoneName,
                rowLabel = x.RowLabel,
                floorLabel = x.FloorLabel,
                currentStatus = x.CurrentStatus.ToString()
            })
            .ToListAsync(ct);

        return Ok(stalls);
    }

    /// <summary>
    /// Gets stalls reserved by the admin but not yet mapped to a booking.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetReservations(
        Guid eventId,
        [FromQuery] Guid tenantId,
        CancellationToken ct)
    {
        var stalls = await _db.Stalls
            .AsNoTracking()
            .Where(x =>
                x.EventId == eventId &&
                x.TenantId == tenantId &&
                x.IsActive &&
                x.CurrentStatus == StallStatus.Reservation &&
                x.CurrentBookingId == null)
            .OrderBy(x => x.StallNumber)
            .Select(x => new
            {
                id = x.Id,
                stallNumber = x.StallNumber,
                stallSizeId = x.StallSizeId,
                hallName = x.HallName,
                zoneName = x.ZoneName,
                rowLabel = x.RowLabel,
                floorLabel = x.FloorLabel,
                currentStatus = x.CurrentStatus.ToString(),
                currentBookingId = x.CurrentBookingId
            })
            .ToListAsync(ct);

        return Ok(stalls);
    }

    /// <summary>
    /// Reserves a stall without mapping it to a booking.
    /// </summary>
    [HttpPost("{stallId:guid}/reserve")]
    public async Task<IActionResult> ReserveStall(
    Guid eventId,
    Guid stallId,
    [FromBody] ReserveStallRequest request,
    CancellationToken ct)
    {
        var stall = await _db.Stalls
            .SingleOrDefaultAsync(x =>
                x.Id == stallId &&
                x.EventId == eventId &&
                x.TenantId == request.TenantId,
                ct);

        if (stall is null)
        {
            return NotFound(new
            {
                message = "Stall not found."
            });
        }

        if (!stall.IsActive)
        {
            return BadRequest(new
            {
                message = "Inactive stall cannot be reserved."
            });
        }

        if (stall.CurrentStatus != StallStatus.Available)
        {
            return Conflict(new
            {
                message = $"Stall {stall.StallNumber} is currently {stall.CurrentStatus}."
            });
        }

        if (stall.CurrentBookingId.HasValue)
        {
            return Conflict(new
            {
                message = "This stall is already mapped to a booking."
            });
        }

        // This sets CurrentStatus = Reservation
        stall.Reserve(request.ActorUserId);

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            message = "Stall reserved successfully.",
            stallId = stall.Id,
            stallNumber = stall.StallNumber,
            status = stall.CurrentStatus.ToString(),
            currentBookingId = stall.CurrentBookingId
        });
    }

    /// <summary>
    /// Releases an unmapped reservation.
    /// </summary>
    [HttpPost("{stallId:guid}/release")]
    public async Task<IActionResult> ReleaseReservation(
     Guid eventId,
     Guid stallId,
     [FromBody] ReleaseReservationRequest request,
     CancellationToken ct)
    {
        var stall = await _db.Stalls
            .SingleOrDefaultAsync(x =>
                x.Id == stallId &&
                x.EventId == eventId &&
                x.TenantId == request.TenantId,
                ct);

        if (stall is null)
        {
            return NotFound(new
            {
                message = "Stall not found."
            });
        }

        if (stall.CurrentStatus != StallStatus.Reservation && stall.CurrentStatus != StallStatus.Blocked)
        {
            return BadRequest(new
            {
                message = "Only a reserved or blocked stall can be released."
            });
        }

        if (stall.CurrentBookingId.HasValue)
        {
            return Conflict(new
            {
                message = "This reservation is already mapped to a booking."
            });
        }

        // This sets CurrentStatus back to Available
        stall.ReleaseReservation(request.ActorUserId);

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            message = "Reservation released successfully.",
            stallId = stall.Id,
            stallNumber = stall.StallNumber,
            status = stall.CurrentStatus.ToString()
        });
    }
}

public sealed record ReserveStallRequest(
    Guid TenantId,
    Guid ActorUserId
);

public sealed record ReleaseReservationRequest(
    Guid TenantId,
    Guid ActorUserId
);