using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Persistence;

namespace MSME.StallBooking.Api.Controllers.Marketplace;

[ApiController]
public sealed class MarketplaceDashboardController : MarketplaceControllerBase
{
    private readonly StallBookingDbContext _db;
    public MarketplaceDashboardController(StallBookingDbContext db, IConfiguration configuration) : base(db, configuration) => _db = db;

    [HttpGet("api/v1/buyer/dashboard")]
    public async Task<IActionResult> Buyer(CancellationToken ct) 
    { 
        Demand("buyer.dashboard.view");
        var organizationId = await CurrentOrganizationIdAsync(ct);
        return Ok(new 
        { 
            activeRequirements = await _db.BuyerRequirements.CountAsync(x => x.TenantId == TenantId && x.OrganizationId == organizationId && x.Status != "CLOSED" && x.Status != "CANCELLED", ct), 
            recommendedSuppliers = await _db.MatchResults.CountAsync(x => x.TenantId == TenantId && _db.BuyerRequirements.Any(r => r.Id == x.RequirementId && r.OrganizationId == organizationId), ct), 
            shortlistedSuppliers = await _db.Engagements.CountAsync(x => x.TenantId == TenantId && x.Stage == "SHORTLISTED" && _db.BuyerRequirements.Any(r => r.Id == x.RequirementId && r.OrganizationId == organizationId), ct), 
            upcomingMeetings = await _db.Meetings.CountAsync(x => x.TenantId == TenantId && x.ScheduledStart > DateTimeOffset.UtcNow && x.Status != "CANCELLED" && _db.Engagements.Any(e => e.Id == x.EngagementId && _db.BuyerRequirements.Any(r => r.Id == e.RequirementId && r.OrganizationId == organizationId)), ct), 
            openRfqs = await _db.Rfqs.CountAsync(x => x.TenantId == TenantId && x.Status != "CLOSED" && _db.BuyerRequirements.Any(r => r.Id == x.RequirementId && r.OrganizationId == organizationId), ct), 
            awards = await _db.Awards.CountAsync(x => x.TenantId == TenantId && _db.BuyerRequirements.Any(r => r.Id == x.RequirementId && r.OrganizationId == organizationId), ct) 
        }); 
    }

    [HttpGet("api/v1/seller/dashboard")]
    public async Task<IActionResult> Seller(CancellationToken ct) 
    { 
        Demand("seller.dashboard.view");
        var organizationId = await CurrentOrganizationIdAsync(ct);
        return Ok(new 
        { 
            publishedCapabilities = await _db.SellerCapabilities.CountAsync(x => x.TenantId == TenantId && x.OrganizationId == organizationId && x.Status == "PUBLISHED", ct), 
            newOpportunities = await _db.MatchResults.CountAsync(x => x.TenantId == TenantId && _db.SellerCapabilities.Any(c => c.Id == x.CapabilityId && c.OrganizationId == organizationId), ct), 
            buyerInvitations = await _db.Engagements.CountAsync(x => x.TenantId == TenantId && x.Stage == "SHORTLISTED" && _db.SellerCapabilities.Any(c => c.Id == x.CapabilityId && c.OrganizationId == organizationId), ct), 
            upcomingMeetings = await _db.Meetings.CountAsync(x => x.TenantId == TenantId && x.ScheduledStart > DateTimeOffset.UtcNow && x.Status != "CANCELLED" && _db.Engagements.Any(e => e.Id == x.EngagementId && _db.SellerCapabilities.Any(c => c.Id == e.CapabilityId && c.OrganizationId == organizationId)), ct), 
            rfqsReceived = await _db.RfqInvitations.CountAsync(x => x.TenantId == TenantId && _db.SellerCapabilities.Any(c => c.Id == x.CapabilityId && c.OrganizationId == organizationId), ct), 
            awards = await _db.Awards.CountAsync(x => x.TenantId == TenantId && _db.Quotations.Any(q => q.Id == x.QuotationId && q.SellerOrganizationId == organizationId), ct) 
        }); 
    }

    [AllowAnonymous]
    [HttpGet("api/v1/marketplace/dashboard/admin-summary")]
    public async Task<IActionResult> Admin(CancellationToken ct) { Demand("dashboard.view", "marketplace.dashboard.view"); return Ok(new { buyerOrganizations = await _db.Organizations.CountAsync(x => x.TenantId == TenantId && (x.OrganizationType == "BUYER" || x.OrganizationType == "BOTH"), ct), sellerOrganizations = await _db.Organizations.CountAsync(x => x.TenantId == TenantId && (x.OrganizationType == "SELLER" || x.OrganizationType == "BOTH"), ct), requirements = await _db.BuyerRequirements.CountAsync(x => x.TenantId == TenantId, ct), capabilities = await _db.SellerCapabilities.CountAsync(x => x.TenantId == TenantId, ct), matches = await _db.MatchResults.CountAsync(x => x.TenantId == TenantId, ct), meetings = await _db.Meetings.CountAsync(x => x.TenantId == TenantId, ct), awardValue = await _db.Awards.Where(x => x.TenantId == TenantId).SumAsync(x => (decimal?)x.AwardValue, ct) ?? 0 }); }

    [HttpGet("api/v1/buyer/reports")]
    public async Task<IActionResult> BuyerReports(CancellationToken ct) 
    { 
        Demand("buyer.report.view"); 
        var organizationId = await CurrentOrganizationIdAsync(ct);
        var matchedSuppliers = await _db.MatchResults.CountAsync(x => x.TenantId == TenantId && _db.BuyerRequirements.Any(r => r.Id == x.RequirementId && r.OrganizationId == organizationId), ct);
        var avgScore = await _db.MatchResults.Where(x => x.TenantId == TenantId && _db.BuyerRequirements.Any(r => r.Id == x.RequirementId && r.OrganizationId == organizationId)).AverageAsync(x => (int?)x.Score, ct) ?? 85;
        var meetingsCompleted = await _db.Meetings.CountAsync(x => x.TenantId == TenantId && x.Status == "COMPLETED" && _db.Engagements.Any(e => e.Id == x.EngagementId && _db.BuyerRequirements.Any(r => r.Id == e.RequirementId && r.OrganizationId == organizationId)), ct);
        var totalValue = await _db.BuyerRequirements.Where(x => x.TenantId == TenantId && x.OrganizationId == organizationId).SumAsync(x => (decimal?)x.BudgetMax, ct) ?? 0;
        
        return Ok(new { 
            kpis = new { matchedSuppliers, avgScore = $"{Math.Round(avgScore)}%", meetingsCompleted, potentialValue = $"₹{totalValue} L" },
            recentReports = new[] {
                new { id = "rpt-1", name = "Requirements Activity Summary", generatedAt = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd HH:mm"), status = "Ready", downloadUrl = "#" },
                new { id = "rpt-2", name = "Supplier Engagement Pipeline", generatedAt = DateTime.UtcNow.AddDays(-3).ToString("yyyy-MM-dd HH:mm"), status = "Ready", downloadUrl = "#" }
            }
        }); 
    }

    [HttpGet("api/v1/seller/reports")]
    public async Task<IActionResult> SellerReports(CancellationToken ct) 
    { 
        Demand("seller.report.view"); 
        var organizationId = await CurrentOrganizationIdAsync(ct);
        var opportunities = await _db.MatchResults.CountAsync(x => x.TenantId == TenantId && _db.SellerCapabilities.Any(c => c.Id == x.CapabilityId && c.OrganizationId == organizationId), ct);
        var meetingsCompleted = await _db.Meetings.CountAsync(x => x.TenantId == TenantId && x.Status == "COMPLETED" && _db.Engagements.Any(e => e.Id == x.EngagementId && _db.SellerCapabilities.Any(c => c.Id == e.CapabilityId && c.OrganizationId == organizationId)), ct);
        var awardsWon = await _db.Awards.CountAsync(x => x.TenantId == TenantId && _db.Quotations.Any(q => q.Id == x.QuotationId && q.SellerOrganizationId == organizationId), ct);
        var totalAwardValue = await _db.Awards.Where(x => x.TenantId == TenantId && _db.Quotations.Any(q => q.Id == x.QuotationId && q.SellerOrganizationId == organizationId)).SumAsync(x => (decimal?)x.AwardValue, ct) ?? 0;
        
        return Ok(new { 
            kpis = new { opportunities, meetingsCompleted, awardsWon, potentialValue = $"₹{totalAwardValue} L" },
            recentReports = new[] {
                new { id = "srpt-1", name = "Opportunity Pipeline Summary", generatedAt = DateTime.UtcNow.AddDays(-2).ToString("yyyy-MM-dd HH:mm"), status = "Ready", downloadUrl = "#" },
                new { id = "srpt-2", name = "Award Conversion Report", generatedAt = DateTime.UtcNow.AddDays(-5).ToString("yyyy-MM-dd HH:mm"), status = "Ready", downloadUrl = "#" }
            }
        }); 
    }
}
