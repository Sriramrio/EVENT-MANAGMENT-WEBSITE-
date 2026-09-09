using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MSME.StallBooking.Domain.Marketplace;

namespace MSME.StallBooking.Persistence;

/// <summary>
/// Keeps the marketplace entity mappings organized while the application uses
/// one and only one EF Core context: <see cref="StallBookingDbContext"/>.
/// </summary>
internal static class MarketplaceModelConfiguration
{
    internal static void ConfigureModel(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("public");
        ConfigureBase(modelBuilder.Entity<ReferenceDataItem>(), "reference_data");
        ConfigureBase(modelBuilder.Entity<MarketplaceOrganization>(), "organizations");
        ConfigureBase(modelBuilder.Entity<OrganizationUser>(), "organization_users");
        ConfigureBase(modelBuilder.Entity<OrganizationContact>(), "organization_contacts");
        ConfigureBase(modelBuilder.Entity<OrganizationLocation>(), "organization_locations");
        ConfigureBase(modelBuilder.Entity<EventParticipation>(), "event_participations");
        ConfigureBase(modelBuilder.Entity<MarketplaceDocument>(), "documents");
        ConfigureBase(modelBuilder.Entity<BuyerRequirement>(), "buyer_requirements");
        ConfigureBase(modelBuilder.Entity<BuyerRequirementStatusHistory>(), "buyer_requirement_status_history");
        ConfigureBase(modelBuilder.Entity<SellerCapability>(), "seller_capabilities");
        ConfigureBase(modelBuilder.Entity<SellerCapabilityStatusHistory>(), "seller_capability_status_history");
        ConfigureBase(modelBuilder.Entity<MatchRun>(), "match_runs");
        ConfigureBase(modelBuilder.Entity<MatchResult>(), "match_results");
        ConfigureBase(modelBuilder.Entity<MatchResultComponent>(), "match_result_components");
        ConfigureBase(modelBuilder.Entity<RequirementSellerEngagement>(), "engagements");
        ConfigureBase(modelBuilder.Entity<EngagementEvent>(), "engagement_events");
        ConfigureBase(modelBuilder.Entity<EngagementMessage>(), "engagement_messages");
        ConfigureBase(modelBuilder.Entity<MarketplaceMeeting>(), "meetings");
        ConfigureBase(modelBuilder.Entity<MeetingSlotOption>(), "meeting_slot_options");
        ConfigureBase(modelBuilder.Entity<MeetingOutcome>(), "meeting_outcomes");
        ConfigureBase(modelBuilder.Entity<MeetingActionItem>(), "meeting_action_items");
        ConfigureBase(modelBuilder.Entity<Rfq>(), "rfqs");
        ConfigureBase(modelBuilder.Entity<RfqInvitation>(), "rfq_invitations");
        ConfigureBase(modelBuilder.Entity<Quotation>(), "quotations");
        ConfigureBase(modelBuilder.Entity<QuotationLine>(), "quotation_lines");
        ConfigureBase(modelBuilder.Entity<Award>(), "awards");
        ConfigureBase(modelBuilder.Entity<AwardMilestone>(), "award_milestones");

        modelBuilder.Entity<ReferenceDataItem>(b => { b.HasIndex(x => new { x.Kind, x.Code }).IsUnique(); b.Property(x => x.MetadataJson).HasColumnType("jsonb"); });
        modelBuilder.Entity<MarketplaceOrganization>(b => { b.HasIndex(x => new { x.TenantId, x.Email }); b.HasIndex(x => new { x.TenantId, x.Gstin }); b.Property(x => x.AnnualTurnover).HasPrecision(18, 2); });
        modelBuilder.Entity<OrganizationUser>(b => { b.HasIndex(x => new { x.TenantId, x.OrganizationId, x.UserId }).IsUnique(); b.Property(x => x.Role).HasConversion<string>().HasMaxLength(30); });
        modelBuilder.Entity<BuyerRequirement>(b => { b.HasIndex(x => new { x.TenantId, x.RequirementNo }).IsUnique(); b.HasIndex(x => new { x.TenantId, x.EventId, x.Status }); b.Property(x => x.DetailsJson).HasColumnType("jsonb"); b.Property(x => x.BudgetMin).HasPrecision(18, 2); b.Property(x => x.BudgetMax).HasPrecision(18, 2); });
        modelBuilder.Entity<SellerCapability>(b => { b.HasIndex(x => new { x.TenantId, x.CapabilityNo }).IsUnique(); b.HasIndex(x => new { x.TenantId, x.EventId, x.Status }); b.Property(x => x.TechnicalJson).HasColumnType("jsonb"); b.Property(x => x.CommercialJson).HasColumnType("jsonb"); });
        modelBuilder.Entity<MatchResult>(b => { b.HasIndex(x => new { x.TenantId, x.RequirementId, x.CapabilityId }).IsUnique(); b.Property(x => x.Score).HasPrecision(5, 2); });
        modelBuilder.Entity<MatchResultComponent>(b => { b.Property(x => x.Weight).HasPrecision(5, 2); b.Property(x => x.RawScore).HasPrecision(5, 2); b.Property(x => x.WeightedScore).HasPrecision(5, 2); });
        modelBuilder.Entity<RequirementSellerEngagement>().HasIndex(x => new { x.TenantId, x.RequirementId, x.CapabilityId }).IsUnique();
        modelBuilder.Entity<EngagementEvent>().Property(x => x.PayloadJson).HasColumnType("jsonb");
        modelBuilder.Entity<MarketplaceMeeting>().HasIndex(x => new { x.TenantId, x.MeetingNo }).IsUnique();
        modelBuilder.Entity<Rfq>(b => { b.HasIndex(x => new { x.TenantId, x.RfqNo }).IsUnique(); b.Property(x => x.TermsJson).HasColumnType("jsonb"); });
        modelBuilder.Entity<Quotation>(b => { b.HasIndex(x => new { x.TenantId, x.QuotationNo }).IsUnique(); b.Property(x => x.GrandTotal).HasPrecision(18, 2); });
        modelBuilder.Entity<QuotationLine>(b => { b.Property(x => x.Quantity).HasPrecision(18, 3); b.Property(x => x.UnitPrice).HasPrecision(18, 2); b.Property(x => x.LineTotal).HasPrecision(18, 2); });
        modelBuilder.Entity<Award>(b => { b.HasIndex(x => new { x.TenantId, x.AwardNo }).IsUnique(); b.Property(x => x.AwardValue).HasPrecision(18, 2); });
        modelBuilder.Entity<AwardMilestone>().Property(x => x.Amount).HasPrecision(18, 2);
    }

    private static void ConfigureBase<TEntity>(EntityTypeBuilder<TEntity> b, string table) where TEntity : MarketplaceEntity
    {
        b.ToTable(table, "public");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
        b.Property(x => x.EventId).HasColumnName("event_id");
        b.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        b.Property(x => x.CreatedBy).HasColumnName("created_by");
        b.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        b.Property(x => x.UpdatedBy).HasColumnName("updated_by");
        b.Property(x => x.DeletedAt).HasColumnName("deleted_at");
        b.Property(x => x.DeletedBy).HasColumnName("deleted_by");
        b.Property(x => x.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);
        b.Property(x => x.CorrelationId).HasColumnName("correlation_id").HasMaxLength(100);
        b.Property(x => x.Version).HasColumnName("version").IsConcurrencyToken().HasDefaultValue(1L);
        b.HasQueryFilter(x => !x.IsDeleted);
        b.HasIndex(x => new { x.TenantId, x.EventId });
    }
}
