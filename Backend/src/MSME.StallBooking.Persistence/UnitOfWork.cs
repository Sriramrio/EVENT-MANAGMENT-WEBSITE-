using Microsoft.EntityFrameworkCore.Storage;
using MSME.StallBooking.Application.Abstractions;
using MSME.StallBooking.Persistence.Repositories;

namespace MSME.StallBooking.Persistence;

public sealed class UnitOfWork : IUnitOfWork
{
    private readonly StallBookingDbContext _db;

    public UnitOfWork(StallBookingDbContext db)
    {
        _db = db;
        Bookings = new BookingRepository(db);
        Stalls = new StallRepository(db);
        Allocations = new AllocationRepository(db);
        Payments = new PaymentRepository(db);
        Invoices = new InvoiceRepository(db);
        EmailLogs = new EmailLogRepository(db);
        Visitors = new VisitorRepository(db);
        Vips = new VipRepository(db);
    }

    public IBookingRepository Bookings { get; }
    public IStallRepository Stalls { get; }
    public IAllocationRepository Allocations { get; }
    public IPaymentRepository Payments { get; }
    public IInvoiceRepository Invoices { get; }
    public IEmailLogRepository EmailLogs { get; }

     public IVisitorRepository Visitors { get; }
    public IVipRepository Vips { get; }

    public async Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken ct)
    {
        await using IDbContextTransaction transaction = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            await operation(ct);
            await transaction.CommitAsync(ct);
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public Task<int> SaveChangesAsync(CancellationToken ct) => _db.SaveChangesAsync(ct);
}
