using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MSME.StallBooking.Application.Services;

namespace MSME.StallBooking.Worker;

public sealed class ExpireBlockedStallsWorker : BackgroundService
{
    private readonly ILogger<ExpireBlockedStallsWorker> _logger;
    private readonly IServiceProvider _serviceProvider;

    public ExpireBlockedStallsWorker(ILogger<ExpireBlockedStallsWorker> logger, IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(1));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<StallAllocationService>();
                await service.ReleaseExpiredBlocksAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to release expired stall blocks.");
            }
        }
    }
}
