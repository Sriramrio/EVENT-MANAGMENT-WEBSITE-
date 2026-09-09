using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Application.Abstractions;
using MSME.StallBooking.Domain.Entities;
using StallBookingEntity = MSME.StallBooking.Domain.Entities.StallBooking;
using MSME.StallBooking.Domain.Enums;

namespace MSME.StallBooking.Persistence.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly StallBookingDbContext Db;

    public Repository(StallBookingDbContext db) => Db = db;

    public virtual Task<T?> GetByIdAsync(Guid id, CancellationToken ct) => Db.Set<T>().FindAsync([id], ct).AsTask();
    public IQueryable<T> Query() => Db.Set<T>().AsQueryable();
    public Task AddAsync(T entity, CancellationToken ct) => Db.Set<T>().AddAsync(entity, ct).AsTask();
    public void Update(T entity) => Db.Set<T>().Update(entity);
}

public sealed class BookingRepository : Repository<StallBookingEntity>, IBookingRepository
{
    public BookingRepository(StallBookingDbContext db) : base(db) { }

    public Task<StallBookingEntity?> GetByRegistrationNumberAsync(Guid tenantId, string bookingNumber, CancellationToken ct)
        => Db.StallBookings.SingleOrDefaultAsync(x => EF.Property<Guid>(x, "TenantId") == tenantId && x.BookingRegistrationNumber == bookingNumber, ct);
}
public sealed class VisitorRepository : IVisitorRepository

{
    private readonly StallBookingDbContext _db; 

    public VisitorRepository(StallBookingDbContext db)
    {
        _db = db;
    }

    public async Task<BillingProfile.Visitor?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _db.Set<BillingProfile.Visitor>()
            .FirstOrDefaultAsync(v => v.Id == id, ct);
    public async Task<List<BillingProfile.Visitor>> GetAllAsync(
       Guid tenantId,
       Guid eventId,
       CancellationToken ct = default)
    {
        return await _db.Set<BillingProfile.Visitor>()
            .AsNoTracking()
            .Where(v => v.TenantId == tenantId && v.EventId == eventId)
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync(ct);
    }

    public IQueryable<BillingProfile.Visitor> Query()
        => _db.Set<BillingProfile.Visitor>().AsQueryable();

    public async Task AddAsync(BillingProfile.Visitor entity, CancellationToken ct)
        => await _db.Set<BillingProfile.Visitor>().AddAsync(entity, ct);

    public void Update(BillingProfile.Visitor entity)
        => _db.Set<BillingProfile.Visitor>().Update(entity);

    public async Task<BillingProfile.Visitor?> GetByRegistrationNumberAsync(
        Guid tenantId, string registrationNumber, CancellationToken ct)
        => await _db.Set<BillingProfile.Visitor>()
            .FirstOrDefaultAsync(v =>
                v.TenantId == tenantId &&
                v.BookingRegistrationNumber == registrationNumber,
                ct);
    public async Task<List<BillingProfile.Visitor>> GetPresentAsync(
       Guid tenantId, Guid eventId, CancellationToken ct = default)
       => await _db.Set<BillingProfile.Visitor>()
           .AsNoTracking()
           .Where(v => v.TenantId == tenantId && v.EventId == eventId && v.IsPresent)
           .OrderByDescending(v => v.CheckedInAt)
           .ToListAsync(ct);
}
public sealed class StallRepository : Repository<Stall>, IStallRepository
{
    public StallRepository(StallBookingDbContext db) : base(db) { }

    public Task<Stall?> GetForUpdateAsync(Guid tenantId, Guid eventId, Guid stallId, CancellationToken ct)
        => Db.Stalls.SingleOrDefaultAsync(x => x.Id == stallId && EF.Property<Guid>(x, "TenantId") == tenantId && EF.Property<Guid?>(x, "EventId") == eventId, ct);

    public Task<Stall?> GetByNumberAsync(Guid tenantId, Guid eventId, string stallNumber, CancellationToken ct)
        => Db.Stalls.SingleOrDefaultAsync(x => EF.Property<Guid>(x, "TenantId") == tenantId && EF.Property<Guid?>(x, "EventId") == eventId && x.StallNumber == stallNumber, ct);
}

public sealed class AllocationRepository : Repository<StallAllocation>, IAllocationRepository
{
    public AllocationRepository(StallBookingDbContext db) : base(db) { }

    public Task<StallAllocation?> GetActiveByBookingAsync(Guid bookingId, CancellationToken ct)
        => Db.StallAllocations
            .Where(x => x.BookingId == bookingId && (x.AllocationStatus == AllocationStatus.Blocked || x.AllocationStatus == AllocationStatus.Frozen))
            .OrderByDescending(x => x.BlockedAt)
            .FirstOrDefaultAsync(ct);

    public async Task<IReadOnlyList<StallAllocation>> GetExpiredBlocksAsync(DateTimeOffset now, CancellationToken ct)
        => await Db.StallAllocations
            .Where(x => x.AllocationStatus == AllocationStatus.Blocked && x.BlockExpiresAt < now)
            .ToListAsync(ct);
}

public sealed class PaymentRepository : Repository<Payment>, IPaymentRepository
{
    public PaymentRepository(StallBookingDbContext db) : base(db) { }

    public Task<Payment?> GetLatestForBookingAsync(Guid bookingId, CancellationToken ct)
        => Db.Payments.Where(x => x.BookingId == bookingId).OrderByDescending(x => x.CreatedAt).FirstOrDefaultAsync(ct);
}

public sealed class InvoiceRepository : Repository<ProformaInvoice>, IInvoiceRepository
{
    public InvoiceRepository(StallBookingDbContext db) : base(db) { }

    public Task<ProformaInvoice?> GetActiveByBookingAsync(Guid bookingId, CancellationToken ct)
        => Db.ProformaInvoices
            .Where(x => x.BookingId == bookingId && x.InvoiceStatus != InvoiceStatus.Cancelled)
            .OrderByDescending(x => x.GeneratedAt)
            .FirstOrDefaultAsync(ct);
}

public sealed class EmailLogRepository : Repository<EmailLog>, IEmailLogRepository
{
    public EmailLogRepository(StallBookingDbContext db) : base(db) { }
}
public sealed class VipRepository : IVipRepository
{
    private readonly StallBookingDbContext _db;

    public VipRepository(StallBookingDbContext db)
    {
        _db = db;
    }

    public async Task<BillingProfile.Vip?> GetByIdAsync(
        Guid id,
        CancellationToken ct)
    {
        return await _db.Set<BillingProfile.Vip>()
            .FirstOrDefaultAsync(v => v.Id == id, ct);
    }

    public IQueryable<BillingProfile.Vip> Query()
    {
        return _db.Set<BillingProfile.Vip>().AsQueryable();
    }

    public async Task AddAsync(
        BillingProfile.Vip entity,
        CancellationToken ct)
    {
        await _db.Set<BillingProfile.Vip>()
            .AddAsync(entity, ct);
    }

    public void Update(BillingProfile.Vip entity)
    {
        _db.Set<BillingProfile.Vip>().Update(entity);
    }

    public async Task<List<BillingProfile.Vip>> GetAllAsync(
        Guid tenantId,
        Guid eventId,
        CancellationToken ct = default)
    {
        return await _db.Set<BillingProfile.Vip>()
            .AsNoTracking()
            .Where(v =>
                v.TenantId == tenantId &&
                v.EventId == eventId)
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<BillingProfile.Vip?> GetByRegistrationNumberAsync(
            Guid tenantId, string registrationNumber, CancellationToken ct)
    {
        return await _db.Set<BillingProfile.Vip>()
            .FirstOrDefaultAsync(v =>
                v.TenantId == tenantId &&
                v.RegistrationNumber == registrationNumber,   // ← bug fixed
                ct);
    }

    public async Task<List<BillingProfile.Vip>> GetPresentAsync(     // NEW method
        Guid tenantId, Guid eventId, CancellationToken ct = default)
    {
        return await _db.Set<BillingProfile.Vip>()
            .AsNoTracking()
            .Where(v => v.TenantId == tenantId && v.EventId == eventId && v.IsPresent)
            .OrderByDescending(v => v.CheckedInAt)
            .ToListAsync(ct);
    }
}
