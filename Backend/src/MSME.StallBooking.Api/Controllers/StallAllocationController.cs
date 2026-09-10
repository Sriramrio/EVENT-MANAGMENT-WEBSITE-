using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Application.Contracts;
using MSME.StallBooking.Application.Services;
using MSME.StallBooking.Domain.Enums;
using MSME.StallBooking.Persistence;
using static MSME.StallBooking.Application.Services.PaymentWorkflowService;


namespace MSME.StallBooking.Api.Controllers;

[ApiController]
[Route("api/v1/admin/events/{eventId:guid}/bookings/{bookingId:guid}")]
public sealed class StallAllocationController : ControllerBase
{
    private readonly StallAllocationService _allocationService;
    private readonly PaymentWorkflowService _paymentService;
    private readonly InvoiceWorkflowService _invoiceService;
    private readonly StallBookingDbContext _db;

    public StallAllocationController(
        StallAllocationService allocationService,
        PaymentWorkflowService paymentService,
        InvoiceWorkflowService invoiceService,
        StallBookingDbContext db)
    {
        _allocationService = allocationService;
        _paymentService = paymentService;
        _invoiceService = invoiceService;
        _db = db;
    }

    [HttpGet("available-stalls")]
    public async Task<IActionResult> GetAvailableStalls(Guid eventId, Guid bookingId, CancellationToken ct)
    {
        var booking = await _db.StallBookings
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == bookingId && x.EventId == eventId, ct);

        if (booking is null)
            return NotFound(new { message = "Booking not found." });

        var stalls = await _db.Stalls
            .AsNoTracking()
            .Where(s =>
                s.EventId == eventId &&
                s.StallSizeId == booking.RequestedStallSizeId &&
                s.CurrentStatus == StallStatus.Available &&
                s.IsActive)
            .OrderBy(s => s.StallNumber)
            .Select(s => new
            {
                id = s.Id,
                stallNumber = s.StallNumber,
                stallSizeId = s.StallSizeId,
                currentStatus = s.CurrentStatus.ToString()
            })
            .ToListAsync(ct);

        return Ok(stalls);
    }

    [HttpPost("block-stall")]
    public async Task<IActionResult> BlockStall(Guid eventId, Guid bookingId, [FromBody] BlockStallRequest request, CancellationToken ct)
    {
        await _allocationService.BlockStallAsync(new BlockStallCommand(request.TenantId, eventId, bookingId, request.StallId, request.ActorUserId), ct);
        return Accepted(new { message = "Stall blocked and payment request email queued." });
    }
    [HttpPost("stalls/{stallId:guid}/release-block")]
    public async Task<IActionResult> ReleaseBlock(
    Guid eventId,
    Guid bookingId,
    Guid stallId,
    [FromBody] ReleaseBlockedStallRequest request,
    CancellationToken ct)
    {
        await using var transaction =
            await _db.Database.BeginTransactionAsync(ct);

        try
        {
            var booking = await _db.StallBookings
                .SingleOrDefaultAsync(x =>
                    x.Id == bookingId &&
                    x.EventId == eventId &&
                    x.TenantId == request.TenantId,
                    ct);

            if (booking is null)
            {
                return NotFound(new
                {
                    message = "Booking not found."
                });
            }

            if (booking.BookingStatus != BookingStatus.BlockedAwaitingPayment)
            {
                return BadRequest(new
                {
                    message =
                        $"Only BlockedAwaitingPayment booking can be released. " +
                        $"Current status is '{booking.BookingStatus}'."
                });
            }

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

            if (stall.CurrentStatus != StallStatus.Blocked)
            {
                return BadRequest(new
                {
                    message =
                        $"Only a blocked stall can be released. " +
                        $"Current status is '{stall.CurrentStatus}'."
                });
            }

            if (stall.CurrentBookingId != booking.Id)
            {
                return Conflict(new
                {
                    message = "This stall is not mapped to the selected booking."
                });
            }

            var allocation = await _db.StallAllocations
                .Where(x =>
                    x.BookingId == booking.Id &&
                    x.StallId == stall.Id &&
                    x.EventId == eventId &&
                    x.TenantId == request.TenantId)
                .OrderByDescending(x => x.BlockedAt)
                .FirstOrDefaultAsync(ct);

            var releasedAt = DateTimeOffset.UtcNow;
            var reason = string.IsNullOrWhiteSpace(request.Reason)
                ? "Blocked stall manually released."
                : request.Reason.Trim();

            // Changes stall to Available and clears CurrentBookingId.
            stall.Release(booking.Id, request.ActorUserId);

            // Private setter: move booking back to Submitted.
            _db.Entry(booking)
                .Property(x => x.BookingStatus)
                .CurrentValue = BookingStatus.Submitted;

            // Private setter: clear blocked/allocated stall.
            _db.Entry(booking)
                .Property(x => x.AllocatedStallId)
                .CurrentValue = null;

            // Private setter: clear block expiration.
            _db.Entry(booking)
                .Property(x => x.BlockExpiresAt)
                .CurrentValue = null;

            if (allocation is not null)
            {
                _db.Entry(allocation)
                    .Property(x => x.ReleasedAt)
                    .CurrentValue = releasedAt;

                _db.Entry(allocation)
                    .Property(x => x.ReleasedBy)
                    .CurrentValue = request.ActorUserId;

                _db.Entry(allocation)
                    .Property(x => x.ReleaseReason)
                    .CurrentValue = reason;
            }

            await _db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            return Ok(new
            {
                message =
                    "Blocked stall released and booking moved to Submitted successfully.",

                bookingId = booking.Id,
                bookingNumber = booking.BookingRegistrationNumber,
                bookingStatus = booking.BookingStatus.ToString(),

                stallId = stall.Id,
                stallNumber = stall.StallNumber,
                stallStatus = stall.CurrentStatus.ToString(),

                releasedAt,
                releaseReason = reason
            });
        }
        catch (Exception exception)
        {
            await transaction.RollbackAsync(ct);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    message = "Unable to release blocked stall.",
                    error = exception.Message
                });
        }
    }

    public sealed record ReleaseBlockedStallRequest(
        Guid TenantId,
        Guid ActorUserId,
        string? Reason);

    [HttpPost("payments/{paymentId:guid}/verify")]
    public async Task<IActionResult> VerifyPayment(Guid eventId, Guid bookingId, Guid paymentId, [FromBody] VerifyPaymentRequest request, CancellationToken ct)
    {
        await _paymentService.VerifyAsync(new VerifyPaymentCommand(request.TenantId, eventId, bookingId, paymentId, request.ActorUserId, request.ExpectedAmount, request.OverrideExpiredBlock), ct);
        return Accepted(new { message = "Payment verified and stall frozen." });
    }


    [HttpPost("proforma-invoice/generate")]
    public async Task<IActionResult> GenerateInvoice(Guid eventId, Guid bookingId, [FromBody] GenerateInvoiceRequest request, CancellationToken ct)
    {
        var invoiceId = await _invoiceService.GenerateAsync(new GenerateInvoiceCommand(request.TenantId, eventId, bookingId, request.ActorUserId), ct);
        return Ok(new { invoiceId, message = "Proforma invoice generated." });
    }


}

public sealed record BlockStallRequest(Guid TenantId, Guid StallId, Guid ActorUserId);
public sealed record VerifyPaymentRequest(Guid TenantId, Guid ActorUserId, decimal ExpectedAmount, bool OverrideExpiredBlock);
public sealed record GenerateInvoiceRequest(Guid TenantId, Guid ActorUserId);

