using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Application.Abstractions;
using MSME.StallBooking.Domain.Entities;
using MSME.StallBooking.Domain.Enums;
using MSME.StallBooking.Persistence;

namespace MSME.StallBooking.Infrastructure.Sequences;

public sealed class NumberSequenceService : INumberSequenceService
{
    private readonly StallBookingDbContext _db;

    public NumberSequenceService(StallBookingDbContext db) => _db = db;

    public Task<string> NextBookingNumberAsync(Guid tenantId, Guid eventId, CancellationToken ct)
        => NextAsync(tenantId, eventId, "BOOKING", "MSME-HOSUR-", ct);

    public Task<string> NextInvoiceNumberAsync(Guid tenantId, Guid eventId, CancellationToken ct)
        => NextAsync(tenantId, eventId, "PROFORMA_INVOICE", "PI-HOSUR-", ct);
    public Task<string> NextReceiptNumberAsync(Guid tenantId, Guid eventId, CancellationToken ct)
    => NextAsync(tenantId, eventId, "PAYMENT_RECEIPT", "RCP-HOSUR-", ct);

    public Task<string> NextTaxInvoiceNumberAsync(Guid tenantId, Guid eventId, CancellationToken ct)
        => NextAsync(tenantId, eventId, "TAX_INVOICE", "INV-HOSUR-", ct);
    public Task<string> NextVisitorNumberAsync(Guid tenantId, Guid eventId, CancellationToken ct)
     => NextAsync(tenantId, eventId, "VISITOR_BOOKING", "VISITOR-HOSUR-", ct,
         startingNumber: 1000,
         resetFrequency: SequenceResetFrequency.Never);
    public Task<string> NextVipNumberAsync(Guid tenantId, Guid eventId, CancellationToken ct)   // NEW
     => NextAsync(tenantId, eventId, "VIP_BOOKING", "VIP-HOSUR-", ct,
         startingNumber: 1000,
         resetFrequency: SequenceResetFrequency.Never);

    private async Task<string> NextAsync(Guid tenantId, Guid eventId, string sequenceCode, string prefix, CancellationToken ct, long startingNumber = 0, SequenceResetFrequency resetFrequency = SequenceResetFrequency.Daily)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var sequence = await _db.NumberSequences
            .Where(x => EF.Property<Guid>(x, "TenantId") == tenantId && EF.Property<Guid?>(x, "EventId") == eventId && x.SequenceCode == sequenceCode)
            .SingleOrDefaultAsync(ct);
        if (sequence is null)
        {
            sequence = NumberSequence.Create(
                tenantId, eventId, sequenceCode, prefix,
                paddingLength: 4,
                resetFrequency: resetFrequency,
                sequenceDate: today,
                startingNumber: startingNumber);

            await _db.NumberSequences.AddAsync(sequence, ct);
        }
        else
        {
            sequence.SetResetFrequency(resetFrequency);
            if (startingNumber > 0)
            {
                sequence.EnsureMinimum(startingNumber);
            }
        }

        var result = sequence.Next(today);
        await _db.SaveChangesAsync(ct);
        return result;
    }
}
