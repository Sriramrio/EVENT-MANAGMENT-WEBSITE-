using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Persistence;

namespace MSME.StallBooking.Api.Controllers;

[ApiController]
[Route("api/v1/taxonomy")]
public class TaxonomyController : ControllerBase
{
    private readonly StallBookingDbContext _db;

    public TaxonomyController(StallBookingDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// 1. Populates Segments (Sends both Id and Code so frontend can bind either)
    /// </summary>
    [HttpGet("segments")]
    public async Task<ActionResult<List<SegmentDto>>> GetSegments(CancellationToken ct)
    {
        var segments = await _db.Segments
            .AsNoTracking()
            .Where(x => x.IsActive && !x.IsDeleted)
            .OrderBy(x => x.SegmentName)
            .Select(x => new SegmentDto(
                x.Id,
                x.SegmentCode,
                x.SegmentName))
            .ToListAsync(ct);

        return Ok(segments);
    }

    /// <summary>
    /// 2. Accepts either Segment UUID (Id) OR SegmentCode
    /// </summary>
    [HttpGet("segments/{segmentKey}/categories")]
    public async Task<ActionResult<List<MainCategoryDto>>> GetCategoriesBySegment(string segmentKey, CancellationToken ct)
    {
        bool isGuid = Guid.TryParse(segmentKey, out Guid segmentId);

        var query = _db.SegmentMainCategories
            .AsNoTracking()
            .Where(smc => smc.MainCategory.IsActive && !smc.MainCategory.IsDeleted);

        if (isGuid)
        {
            query = query.Where(smc => smc.SegmentId == segmentId);
        }
        else
        {
            query = query.Where(smc => smc.Segment.SegmentCode == segmentKey);
        }

        var categories = await query
            .OrderBy(smc => smc.MainCategory.DisplayOrder)
            .Select(smc => new MainCategoryDto(
                smc.MainCategory.Id,
                smc.MainCategory.MainCategoryCode,
                smc.MainCategory.MainCategoryName))
            .Distinct()
            .ToListAsync(ct);

        return Ok(categories);
    }

    [HttpGet("categories")]
    public async Task<ActionResult<List<MainCategoryDto>>> GetAllCategories(CancellationToken ct)
    {
        var categories = await _db.MainCategories
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.MainCategoryName)
            .Select(x => new MainCategoryDto(
                x.Id,
                x.MainCategoryCode,
                x.MainCategoryName))
            .ToListAsync(ct);

        return Ok(categories);
    }

    /// <summary>
    /// 3. Accepts either Category UUID (Id) OR CategoryCode
    /// </summary>
    [HttpGet("categories/{categoryKey}/classifications")]
    public async Task<ActionResult<List<ClassificationDto>>> GetClassificationsByCategory(string categoryKey, CancellationToken ct)
    {
        bool isGuid = Guid.TryParse(categoryKey, out Guid categoryId);

        var query = _db.Classifications
            .AsNoTracking()
            .Where(c => c.IsActive && !c.IsDeleted);

        if (isGuid)
        {
            query = query.Where(c => c.MainCategoryId == categoryId);
        }
        else
        {
            query = query.Where(c => c.MainCategory.MainCategoryCode == categoryKey);
        }

        var classifications = await query
            .OrderBy(c => c.SubCategory)
            .Select(c => new ClassificationDto(
                c.Id,
                c.RecordId,
                c.SubCategory,
                c.CodeSystem,
                c.VerifiedCode,
                c.VerifiedClassificationName))
            .ToListAsync(ct);

        return Ok(classifications);
    }
}

public sealed record SegmentDto(
    Guid Id,
    string SegmentCode,
    string SegmentName);

public sealed record MainCategoryDto(
    Guid Id,
    string CategoryCode,
    string CategoryName);

public sealed record ClassificationDto(
    Guid Id,
    string RecordId,
    string SubCategory,
    string CodeSystem,
    string VerifiedCode,
    string VerifiedClassificationName);