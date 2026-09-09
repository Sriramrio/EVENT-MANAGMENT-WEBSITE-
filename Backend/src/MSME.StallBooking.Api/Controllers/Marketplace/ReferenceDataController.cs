using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Persistence;

namespace MSME.StallBooking.Api.Controllers.Marketplace;

[ApiController]
[Route("api/v1/marketplace/reference-data")]
public sealed class ReferenceDataController : MarketplaceControllerBase
{
    private readonly StallBookingDbContext _db;
    public ReferenceDataController(StallBookingDbContext db, IConfiguration configuration) : base(db, configuration) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? kind, CancellationToken ct)
    {
        Demand("buyer.reference.view", "seller.reference.view", "buyer.requirement.view", "seller.capability.view");
        var query = _db.ReferenceData.AsNoTracking().Where(x => x.IsActive);
        if (!string.IsNullOrWhiteSpace(kind)) query = query.Where(x => x.Kind == kind.ToUpper());
        return Ok(await query.OrderBy(x => x.Kind).ThenBy(x => x.DisplayOrder).Select(x => new { x.Id, x.Kind, x.Code, x.Name, x.MetadataJson }).ToListAsync(ct));
    }

    [HttpGet("{kind}")]
    public Task<IActionResult> ByKind(string kind, CancellationToken ct) => List(kind, ct);
}
