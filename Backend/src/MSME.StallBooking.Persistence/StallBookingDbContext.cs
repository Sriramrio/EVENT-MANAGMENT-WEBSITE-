using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.Domain.Entities;
using MSME.StallBooking.Domain.Enums;
using MSME.StallBooking.Domain.Marketplace;
using static MSME.StallBooking.Domain.Entities.BillingProfile;
using StallBookingEntity = MSME.StallBooking.Domain.Entities.StallBooking;

namespace MSME.StallBooking.Persistence;

public sealed class StallBookingDbContext : DbContext
{
    public StallBookingDbContext(DbContextOptions<StallBookingDbContext> options) : base(options) { }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<StallSize> StallSizes => Set<StallSize>();
    public DbSet<Stall> Stalls => Set<Stall>();
    public DbSet<Exhibitor> Exhibitors => Set<Exhibitor>();
    public DbSet<BillingProfile> BillingProfiles => Set<BillingProfile>();
    public DbSet<StallBookingEntity> StallBookings => Set<StallBookingEntity>();
    public DbSet<StallAllocation> StallAllocations => Set<StallAllocation>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<ProformaInvoice> ProformaInvoices => Set<ProformaInvoice>();
    public DbSet<FileAttachment> FileAttachments => Set<FileAttachment>();
    public DbSet<EmailTemplate> EmailTemplates => Set<EmailTemplate>();
    public DbSet<EmailLog> EmailLogs => Set<EmailLog>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<NumberSequence> NumberSequences => Set<NumberSequence>();
    public DbSet<DashboardSnapshot> DashboardSnapshots => Set<DashboardSnapshot>();
    public DbSet<Visitor> Visitors => Set<Visitor>();
    public DbSet<Vip> Vip => Set<Vip>();
  
    public DbSet<StallInterest> StallInterests => Set<StallInterest>();

    // Buyer/Seller marketplace uses the same context and the same public schema.
    public DbSet<ReferenceDataItem> ReferenceData => Set<ReferenceDataItem>();
    public DbSet<MarketplaceOrganization> Organizations => Set<MarketplaceOrganization>();
    public DbSet<OrganizationUser> OrganizationUsers => Set<OrganizationUser>();
    public DbSet<OrganizationContact> OrganizationContacts => Set<OrganizationContact>();
    public DbSet<OrganizationLocation> OrganizationLocations => Set<OrganizationLocation>();
    public DbSet<EventParticipation> EventParticipations => Set<EventParticipation>();
    public DbSet<MarketplaceDocument> Documents => Set<MarketplaceDocument>();
    public DbSet<BuyerRequirement> BuyerRequirements => Set<BuyerRequirement>();
    public DbSet<BuyerRequirementStatusHistory> BuyerRequirementStatusHistory => Set<BuyerRequirementStatusHistory>();
    public DbSet<SellerCapability> SellerCapabilities => Set<SellerCapability>();
    public DbSet<SellerCapabilityStatusHistory> SellerCapabilityStatusHistory => Set<SellerCapabilityStatusHistory>();
    public DbSet<MatchRun> MatchRuns => Set<MatchRun>();
    public DbSet<MatchResult> MatchResults => Set<MatchResult>();
    public DbSet<MatchResultComponent> MatchResultComponents => Set<MatchResultComponent>();
    public DbSet<RequirementSellerEngagement> Engagements => Set<RequirementSellerEngagement>();
    public DbSet<EngagementEvent> EngagementEvents => Set<EngagementEvent>();
    public DbSet<EngagementMessage> EngagementMessages => Set<EngagementMessage>();
    public DbSet<MarketplaceMeeting> Meetings => Set<MarketplaceMeeting>();
    public DbSet<MeetingSlotOption> MeetingSlotOptions => Set<MeetingSlotOption>();
    public DbSet<MeetingOutcome> MeetingOutcomes => Set<MeetingOutcome>();
    public DbSet<MeetingActionItem> MeetingActionItems => Set<MeetingActionItem>();
    public DbSet<Rfq> Rfqs => Set<Rfq>();
    public DbSet<RfqInvitation> RfqInvitations => Set<RfqInvitation>();
    public DbSet<Quotation> Quotations => Set<Quotation>();
    public DbSet<QuotationLine> QuotationLines => Set<QuotationLine>();
    public DbSet<Award> Awards => Set<Award>();
    public DbSet<AwardMilestone> AwardMilestones => Set<AwardMilestone>();

    public DbSet<Segment> Segments => Set<Segment>();
    public DbSet<MainCategory> MainCategories => Set<MainCategory>();
    public DbSet<SegmentMainCategory> SegmentMainCategories => Set<SegmentMainCategory>();
    public DbSet<Classification> Classifications => Set<Classification>();
    public DbSet<ClassificationSegment> ClassificationSegments => Set<ClassificationSegment>();
    public DbSet<ClassificationException> ClassificationExceptions => Set<ClassificationException>();
    public DbSet<TagType> TagTypes => Set<TagType>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<TagAlias> TagAliases => Set<TagAlias>();
    public DbSet<Uom> Uoms => Set<Uom>();
    public DbSet<OperationDefinition> OperationDefinitions => Set<OperationDefinition>();
    public DbSet<AttributeDefinition> AttributeDefinitions => Set<AttributeDefinition>();
    public DbSet<AttributeAllowedUom> AttributeAllowedUoms => Set<AttributeAllowedUom>();
    public DbSet<QualityComplianceDefinition> QualityComplianceDefinitions => Set<QualityComplianceDefinition>();
    public DbSet<ClassificationTag> ClassificationTags => Set<ClassificationTag>();
    public DbSet<ClassificationUom> ClassificationUoms => Set<ClassificationUom>();
    public DbSet<ClassificationOperation> ClassificationOperations => Set<ClassificationOperation>();
    public DbSet<ClassificationAttribute> ClassificationAttributes => Set<ClassificationAttribute>();
    public DbSet<ClassificationQualityCompliance> ClassificationQualityCompliances => Set<ClassificationQualityCompliance>();
    public DbSet<BuyerRequirementTag> BuyerRequirementTags => Set<BuyerRequirementTag>();
    public DbSet<SellerCapabilityTag> SellerCapabilityTags => Set<SellerCapabilityTag>();
    public DbSet<AdditionalRequirementItem> AdditionalRequirementItems => Set<AdditionalRequirementItem>();
    public DbSet<ExhibitorAdditionalRequirement> ExhibitorAdditionalRequirements => Set<ExhibitorAdditionalRequirement>();
    public DbSet<ExhibitorAdditionalRequirementLine> ExhibitorAdditionalRequirementLines => Set<ExhibitorAdditionalRequirementLine>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("public");
        ConfigureTenant(modelBuilder);
        ConfigureEvent(modelBuilder);
        ConfigureStallSize(modelBuilder);
        ConfigureStall(modelBuilder);
        ConfigureExhibitor(modelBuilder);
        ConfigureBilling(modelBuilder);
        ConfigureBooking(modelBuilder);
        ConfigureAllocation(modelBuilder);
        ConfigurePayment(modelBuilder);
        ConfigureInvoice(modelBuilder);
        ConfigureSystem(modelBuilder);
       ConfigureAdditionalRequirements(modelBuilder);
        modelBuilder.Entity<SegmentMainCategory>().HasKey(x => new { x.SegmentId, x.MainCategoryId });
        modelBuilder.Entity<ClassificationSegment>().HasKey(x => new { x.ClassificationId, x.SegmentId });
        modelBuilder.Entity<AttributeAllowedUom>().HasKey(x => new { x.AttributeId, x.UomId });
        modelBuilder.Entity<ClassificationUom>().HasKey(x => new { x.ClassificationId, x.UomId });
        modelBuilder.Entity<ClassificationAttribute>().HasKey(x => new { x.ClassificationId, x.AttributeId });
        modelBuilder.Entity<ClassificationQualityCompliance>().HasKey(x => new { x.ClassificationId, x.QualityComplianceId }); MarketplaceModelConfiguration.ConfigureModel(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(StallBookingDbContext).Assembly);
    }

    private static void Audit<TEntity>(Microsoft.EntityFrameworkCore.Metadata.Builders.EntityTypeBuilder<TEntity> b) where TEntity : class
    {
        b.Property<Guid>("TenantId").HasColumnName("tenant_id").IsRequired();
        b.Property<Guid?>("EventId").HasColumnName("event_id");
        b.Property<DateTimeOffset>("CreatedAt").HasColumnName("created_at").IsRequired();
        b.Property<Guid?>("CreatedBy").HasColumnName("created_by");
        b.Property<DateTimeOffset?>("UpdatedAt").HasColumnName("updated_at");
        b.Property<Guid?>("UpdatedBy").HasColumnName("updated_by");
        b.Property<DateTimeOffset?>("DeletedAt").HasColumnName("deleted_at");
        b.Property<Guid?>("DeletedBy").HasColumnName("deleted_by");
        b.Property<bool>("IsDeleted").HasColumnName("is_deleted").HasDefaultValue(false);
        b.Property<string?>("CorrelationId").HasColumnName("correlation_id").HasMaxLength(100);
        b.HasQueryFilter(e => EF.Property<bool>(e, "IsDeleted") == false);
    }

    private static void ConfigureTenant(ModelBuilder modelBuilder)
    {
        var b = modelBuilder.Entity<Tenant>();
        b.ToTable("tenants");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.Code).HasColumnName("code").HasMaxLength(40).IsRequired();
        b.Property(x => x.Name).HasColumnName("name").HasMaxLength(150).IsRequired();
        b.Property(x => x.LegalName).HasColumnName("legal_name").HasMaxLength(180).IsRequired();
        b.Property(x => x.Gstin).HasColumnName("gstin").HasMaxLength(15);
        b.Property(x => x.Pan).HasColumnName("pan").HasMaxLength(10);
        b.Property(x => x.Address).HasColumnName("address").HasMaxLength(500).IsRequired();
        b.Property(x => x.City).HasColumnName("city").HasMaxLength(100).IsRequired();
        b.Property(x => x.State).HasColumnName("state").HasMaxLength(100).IsRequired();
        b.Property(x => x.Country).HasColumnName("country").HasMaxLength(100).IsRequired();
        b.Property(x => x.Pincode).HasColumnName("pincode").HasMaxLength(12).IsRequired();
        b.Property(x => x.Email).HasColumnName("email").HasMaxLength(150).IsRequired();
        b.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(30).IsRequired();
        b.Property(x => x.IsActive).HasColumnName("is_active").HasDefaultValue(true);
        b.HasIndex(x => x.Code).IsUnique();
        b.Ignore("TenantId");
        b.Ignore("EventId");
        b.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        b.Property(x => x.CreatedBy).HasColumnName("created_by");
        b.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        b.Property(x => x.UpdatedBy).HasColumnName("updated_by");
        b.Property(x => x.DeletedAt).HasColumnName("deleted_at");
        b.Property(x => x.DeletedBy).HasColumnName("deleted_by");
        b.Property(x => x.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);
        b.Property(x => x.CorrelationId).HasColumnName("correlation_id").HasMaxLength(100);
    }

    private static void ConfigureEvent(ModelBuilder modelBuilder)
    {
        var b = modelBuilder.Entity<Event>();
        b.ToTable("events");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.EventCode).HasColumnName("event_code").HasMaxLength(50).IsRequired();
        b.Property(x => x.EventName).HasColumnName("event_name").HasMaxLength(200).IsRequired();
        b.Property(x => x.VenueName).HasColumnName("venue_name").HasMaxLength(200).IsRequired();
        b.Property(x => x.VenueAddress).HasColumnName("venue_address").HasMaxLength(500);
        b.Property(x => x.City).HasColumnName("city").HasMaxLength(100);
        b.Property(x => x.District).HasColumnName("district").HasMaxLength(100);
        b.Property(x => x.State).HasColumnName("state").HasMaxLength(100);
        b.Property(x => x.Country).HasColumnName("country").HasMaxLength(100);
        b.Property(x => x.StartDate).HasColumnName("start_date");
        b.Property(x => x.EndDate).HasColumnName("end_date");
        b.Property(x => x.BookingOpenDate).HasColumnName("booking_open_date");
        b.Property(x => x.BookingCloseDate).HasColumnName("booking_close_date");
        b.Property(x => x.StallBlockValidityDays).HasColumnName("stall_block_validity_days").HasDefaultValue(3);
        b.Property(x => x.DefaultGstPercentage).HasColumnName("default_gst_percentage").HasPrecision(5, 2).HasDefaultValue(18m);
        b.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(40).IsRequired();
        b.Property(x => x.IsActive).HasColumnName("is_active").HasDefaultValue(true);
        b.HasIndex("TenantId", "EventCode").IsUnique();
        Audit(b);
    }

    private static void ConfigureStallSize(ModelBuilder modelBuilder)
    {
        var b = modelBuilder.Entity<StallSize>();
        b.ToTable("stall_sizes");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.Code).HasColumnName("code").HasMaxLength(20).IsRequired();
        b.Property(x => x.DisplayName).HasColumnName("display_name").HasMaxLength(80).IsRequired();
        b.Property(x => x.WidthM).HasColumnName("width_m").HasPrecision(8,2);
        b.Property(x => x.DepthM).HasColumnName("depth_m").HasPrecision(8,2);
        b.Property(x => x.AreaSqM).HasColumnName("area_sq_m").HasPrecision(8,2);
        b.Property(x => x.BaseAmount).HasColumnName("base_amount").HasPrecision(14,2);
        b.Property(x => x.GstPercentage).HasColumnName("gst_percentage").HasPrecision(5,2);
        b.Property(x => x.TotalAmount).HasColumnName("total_amount").HasPrecision(14,2);
        b.Property(x => x.Currency).HasColumnName("currency").HasMaxLength(3);
        b.Property(x => x.IsActive).HasColumnName("is_active").HasDefaultValue(true);
        b.HasIndex("EventId", "Code").IsUnique();
        Audit(b);
    }

    private static void ConfigureStall(ModelBuilder modelBuilder)
    {
        var b = modelBuilder.Entity<Stall>();
        b.ToTable("stalls");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.StallSizeId).HasColumnName("stall_size_id");
        b.Property(x => x.StallNumber).HasColumnName("stall_number").HasMaxLength(40).IsRequired();
        b.Property(x => x.HallName).HasColumnName("hall_name").HasMaxLength(80);
        b.Property(x => x.ZoneName).HasColumnName("zone_name").HasMaxLength(80);
        b.Property(x => x.RowLabel).HasColumnName("row_label").HasMaxLength(40);
        b.Property(x => x.FloorLabel).HasColumnName("floor_label").HasMaxLength(40);
        b.Property(x => x.LayoutX).HasColumnName("layout_x");
        b.Property(x => x.LayoutY).HasColumnName("layout_y");
        b.Property(x => x.CurrentStatus).HasColumnName("current_status").HasConversion<string>().HasMaxLength(40);
        b.Property(x => x.CurrentBookingId).HasColumnName("current_booking_id");
        b.Property(x => x.IsActive).HasColumnName("is_active").HasDefaultValue(true);
        b.Property(x => x.IsSponsor).HasColumnName("is_sponsor").HasDefaultValue(false);

        b.HasIndex("EventId", nameof(Stall.StallNumber)).IsUnique();
        b.HasIndex(x => x.CurrentStatus);
        b.HasIndex(x => x.CurrentBookingId);
        Audit(b);
    }

    private static void ConfigureExhibitor(ModelBuilder modelBuilder)
    {
        var b = modelBuilder.Entity<Exhibitor>();
        b.ToTable("exhibitors");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.LegalName).HasColumnName("legal_name").HasMaxLength(150).IsRequired();
        b.Property(x => x.TradeName).HasColumnName("trade_name").HasMaxLength(150);
        b.Property(x => x.RegisteredAddress).HasColumnName("registered_address").HasMaxLength(500).IsRequired();
        b.Property(x => x.City).HasColumnName("city").HasMaxLength(100);
        b.Property(x => x.District).HasColumnName("district").HasMaxLength(100);
        b.Property(x => x.State).HasColumnName("state").HasMaxLength(100);
        b.Property(x => x.Pincode).HasColumnName("pincode").HasMaxLength(12);
        b.Property(x => x.Country).HasColumnName("country").HasMaxLength(100);
        b.Property(x => x.ContactPersonName).HasColumnName("contact_person_name").HasMaxLength(100).IsRequired();
        b.Property(x => x.ContactPersonDesignation).HasColumnName("contact_person_designation").HasMaxLength(100);
        b.Property(x => x.Mobile).HasColumnName("mobile").HasMaxLength(30).IsRequired();
        b.Property(x => x.AlternateMobile).HasColumnName("alternate_mobile").HasMaxLength(30);
        b.Property(x => x.Email).HasColumnName("email").HasMaxLength(150).IsRequired();
        b.Property(x => x.AlternateEmail).HasColumnName("alternate_email").HasMaxLength(150);
        b.Property(x => x.Website).HasColumnName("website").HasMaxLength(200);
        b.Property(x => x.IndustryScale).HasColumnName("industry_scale").HasMaxLength(40);
        b.Property(x => x.BusinessType).HasColumnName("business_type").HasMaxLength(60);
        b.Property(x => x.CompanyConstitution).HasColumnName("company_constitution").HasMaxLength(60);
        b.Property(x => x.IndustryCategory).HasColumnName("industry_category").HasMaxLength(120);
        b.Property(x => x.ProductServiceDescription).HasColumnName("product_service_description").HasMaxLength(1000);
        b.Property(x => x.ProductKeywords).HasColumnName("product_keywords").HasMaxLength(250);
        b.Property(x => x.UdyamNumber).HasColumnName("udyam_number").HasMaxLength(30);
        b.Property(x => x.TanNumber)
    .HasColumnName("TanNumber")
    .HasMaxLength(10);
        b.Property(x => x.Gstin).HasColumnName("gstin").HasMaxLength(15);
        b.Property(x => x.Pan).HasColumnName("pan").HasMaxLength(10);
        b.Property(x => x.LubMember).HasColumnName("lub_member");
        b.Property(x => x.LubState).HasColumnName("lub_state").HasMaxLength(100);
        b.Property(x => x.LubChapter).HasColumnName("lub_chapter").HasMaxLength(100);
        b.Property(x => x.LubMembershipNumber).HasColumnName("lub_membership_number").HasMaxLength(80);
        b.Property(x => x.BankAccountName).HasColumnName("bank_account_name").HasMaxLength(150);
        b.Property(x => x.BankName).HasColumnName("bank_name").HasMaxLength(150);
        b.Property(x => x.BankAccountNumber).HasColumnName("bank_account_number").HasMaxLength(30);
        b.Property(x => x.BankIfscCode).HasColumnName("bank_ifsc_code").HasMaxLength(20);
        b.HasIndex("TenantId", nameof(Exhibitor.Email)); b.HasIndex("TenantId", nameof(Exhibitor.Gstin));
        b.HasIndex("TenantId", nameof(Exhibitor.Pan));
        Audit(b);
    }

    private static void ConfigureBilling(ModelBuilder modelBuilder)
    {
        var b = modelBuilder.Entity<BillingProfile>();
        b.ToTable("billing_profiles");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.ExhibitorId).HasColumnName("exhibitor_id");
        b.Property(x => x.BillingLegalName).HasColumnName("billing_legal_name").HasMaxLength(150).IsRequired();
        b.Property(x => x.BillingAddress).HasColumnName("billing_address").HasMaxLength(500).IsRequired();
        b.Property(x => x.BillingCity).HasColumnName("billing_city").HasMaxLength(100);
        b.Property(x => x.BillingState).HasColumnName("billing_state").HasMaxLength(100);
        b.Property(x => x.BillingStateCode).HasColumnName("billing_state_code").HasMaxLength(2);
        b.Property(x => x.BillingPincode).HasColumnName("billing_pincode").HasMaxLength(12);
        b.Property(x => x.BillingCountry).HasColumnName("billing_country").HasMaxLength(100);
        b.Property(x => x.BillingGstin).HasColumnName("billing_gstin").HasMaxLength(15);
        b.Property(x => x.BillingPan).HasColumnName("billing_pan").HasMaxLength(10);
        b.Property(x => x.PlaceOfSupply).HasColumnName("place_of_supply").HasMaxLength(100);
        b.Property(x => x.BillingContactPerson).HasColumnName("billing_contact_person").HasMaxLength(100);
        b.Property(x => x.BillingEmail).HasColumnName("billing_email").HasMaxLength(150);
        b.Property(x => x.BillingMobile).HasColumnName("billing_mobile").HasMaxLength(30);
        b.Property(x => x.IsDefault).HasColumnName("is_default");

        b.HasIndex(x => x.ExhibitorId);
        Audit(b);
    }

    private static void ConfigureBooking(ModelBuilder modelBuilder)
    {
        var b = modelBuilder.Entity<StallBookingEntity>();
        b.ToTable("stall_bookings");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.ExhibitorId).HasColumnName("exhibitor_id");
        b.Property(x => x.BillingProfileId).HasColumnName("billing_profile_id");
        b.Property(x => x.RequestedStallSizeId).HasColumnName("requested_stall_size_id");
        b.Property(x => x.AllocatedStallId).HasColumnName("allocated_stall_id");

        b.Property(x => x.StallOption1Id)
            .HasColumnName("stall_option1_id");

        b.Property(x => x.StallOption2Id)
            .HasColumnName("stall_option2_id");
        b.Property(x => x.BookingRegistrationNumber).HasColumnName("booking_registration_number").HasMaxLength(40).IsRequired();
        b.Property(x => x.BookingDate).HasColumnName("booking_date");
        b.Property(x => x.BookingStatus).HasColumnName("booking_status").HasConversion<string>().HasMaxLength(50);
        b.Property(x => x.FasciaName).HasColumnName("fascia_name").HasMaxLength(25).IsRequired();
        b.Property(x => x.DisplayNotes).HasColumnName("display_notes").HasMaxLength(500);
        b.Property(x => x.ElectricalRequirement).HasColumnName("electrical_requirement").HasMaxLength(500);
        b.Property(x => x.SpecialRequirement).HasColumnName("special_requirement").HasMaxLength(500);
        b.Property(x => x.HazardousDemoDeclared).HasColumnName("hazardous_demo_declared");
        b.Property(x => x.TermsAccepted).HasColumnName("terms_accepted");
        b.Property(x => x.AccuracyAccepted).HasColumnName("accuracy_accepted");
        b.Property(x => x.PaymentTimelineAccepted).HasColumnName("payment_timeline_accepted");
        b.Property(x => x.CancellationPolicyAccepted).HasColumnName("cancellation_policy_accepted");
        b.Property(x => x.PrivacyConsentAccepted).HasColumnName("privacy_consent_accepted");
        b.Property(x => x.DeclarantName).HasColumnName("declarant_name").HasMaxLength(100);
        b.Property(x => x.DeclarantDesignation).HasColumnName("declarant_designation").HasMaxLength(100);
        b.Property(x => x.DeclarationDate).HasColumnName("declaration_date");
        b.Property(x => x.BlockExpiresAt).HasColumnName("block_expires_at");
        b.Property(x => x.LastEmailSentAt).HasColumnName("last_email_sent_at");
        b.Property(x => x.ConfirmedAt).HasColumnName("confirmed_at");
        b.Property(x => x.CancelledAt).HasColumnName("cancelled_at");
        b.Property(x => x.CancellationReason).HasColumnName("cancellation_reason").HasMaxLength(500);
        b.HasIndex(x => x.BookingRegistrationNumber).IsUnique();
        b.HasIndex("EventId", nameof(StallBookingEntity.BookingStatus));
        b.HasOne(x => x.StallOption1)
       .WithMany()
       .HasForeignKey(x => x.StallOption1Id)
       .OnDelete(DeleteBehavior.SetNull);

        b.HasOne(x => x.StallOption2)
            .WithMany()
            .HasForeignKey(x => x.StallOption2Id)
            .OnDelete(DeleteBehavior.SetNull);
        b.HasIndex(x => x.BlockExpiresAt);
        Audit(b);
    }

    private static void ConfigureAllocation(ModelBuilder modelBuilder)
    {
        var b = modelBuilder.Entity<StallAllocation>();
        b.ToTable("stall_allocations");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.BookingId).HasColumnName("booking_id");
        b.Property(x => x.StallId).HasColumnName("stall_id");
        b.Property(x => x.AllocationStatus).HasColumnName("allocation_status").HasConversion<string>().HasMaxLength(40);
        b.Property(x => x.BlockedAt).HasColumnName("blocked_at");
        b.Property(x => x.BlockedBy).HasColumnName("blocked_by");
        b.Property(x => x.BlockExpiresAt).HasColumnName("block_expires_at");
        b.Property(x => x.FrozenAt).HasColumnName("frozen_at");
        b.Property(x => x.FrozenBy).HasColumnName("frozen_by");
        b.Property(x => x.ReleasedAt).HasColumnName("released_at");
        b.Property(x => x.ReleasedBy).HasColumnName("released_by");
        b.Property(x => x.ReleaseReason).HasColumnName("release_reason").HasMaxLength(500);
        b.Property(x => x.PreviousStallId).HasColumnName("previous_stall_id");
        b.HasIndex(x => x.BookingId);
        b.HasIndex(x => x.StallId);
        b.HasIndex("EventId", nameof(StallAllocation.AllocationStatus));
        Audit(b);
    }

    private static void ConfigurePayment(ModelBuilder modelBuilder)
    {
        var b = modelBuilder.Entity<Payment>();
        b.ToTable("payments");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.BookingId).HasColumnName("booking_id");
        b.Property(x => x.PaymentReferenceNumber).HasColumnName("payment_reference_number").HasMaxLength(100);
        b.Property(x => x.PaymentMode).HasColumnName("payment_mode").HasConversion<string>().HasMaxLength(40);
        b.Property(x => x.PayerName).HasColumnName("payer_name").HasMaxLength(150);
        b.Property(x => x.PayerBank).HasColumnName("payer_bank").HasMaxLength(150);
        b.Property(x => x.AmountPaid).HasColumnName("amount_paid").HasPrecision(14, 2);
        b.Property(x => x.PaymentDate).HasColumnName("payment_date");
        b.Property(x => x.PaymentReceivedDate).HasColumnName("payment_received_date");
        b.Property(x => x.BankAccountMatched).HasColumnName("bank_account_matched");
        b.Property(x => x.PaymentProofFileId).HasColumnName("payment_proof_file_id");
        b.Property(x => x.VerificationStatus).HasColumnName("verification_status").HasConversion<string>().HasMaxLength(50);
        b.Property(x => x.VerifiedBy).HasColumnName("verified_by");
        b.Property(x => x.VerifiedAt).HasColumnName("verified_at");
        b.Property(x => x.RejectionReason).HasColumnName("rejection_reason").HasMaxLength(500);
        b.Property(x => x.Remarks).HasColumnName("remarks").HasMaxLength(500);
        b.HasIndex("EventId", nameof(Payment.PaymentReferenceNumber)).IsUnique();
        b.Property(x => x.isTdsDeductable).HasColumnName("isTdsDeductable").HasDefaultValue(false);
        b.HasIndex(x => x.BookingId);
        b.HasIndex(x => x.VerificationStatus);
        Audit(b);
    }

    private static void ConfigureInvoice(ModelBuilder modelBuilder)
    {
        var b = modelBuilder.Entity<ProformaInvoice>();
        b.ToTable("proforma_invoices");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.BookingId).HasColumnName("booking_id");
        b.Property(x => x.InvoiceNumber).HasColumnName("invoice_number").HasMaxLength(50);
        b.Property(x => x.InvoiceDate).HasColumnName("invoice_date");
        b.Property(x => x.InvoiceStatus).HasColumnName("invoice_status").HasConversion<string>().HasMaxLength(50);
        b.Property(x => x.SellerLegalName).HasColumnName("seller_legal_name").HasMaxLength(180);
        b.Property(x => x.SellerAddress).HasColumnName("seller_address").HasMaxLength(500);
        b.Property(x => x.SellerGstin).HasColumnName("seller_gstin").HasMaxLength(15);
        b.Property(x => x.SellerPan).HasColumnName("seller_pan").HasMaxLength(10);
        b.Property(x => x.BuyerLegalName).HasColumnName("buyer_legal_name").HasMaxLength(180);
        b.Property(x => x.BuyerAddress).HasColumnName("buyer_address").HasMaxLength(500);
        b.Property(x => x.BuyerGstin).HasColumnName("buyer_gstin").HasMaxLength(15);
        b.Property(x => x.BuyerPan).HasColumnName("buyer_pan").HasMaxLength(10);
        b.Property(x => x.PlaceOfSupply).HasColumnName("place_of_supply").HasMaxLength(100);
        b.Property(x => x.StallNumber).HasColumnName("stall_number").HasMaxLength(40);
        b.Property(x => x.StallSizeDisplay).HasColumnName("stall_size_display").HasMaxLength(80);
        b.Property(x => x.HsnSac).HasColumnName("hsn_sac").HasMaxLength(20);
        b.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
        b.Property(x => x.BaseAmount).HasColumnName("base_amount").HasPrecision(14,2);
        b.Property(x => x.GstPercentage).HasColumnName("gst_percentage").HasPrecision(5,2);
        b.Property(x => x.GstAmount).HasColumnName("gst_amount").HasPrecision(14,2);
        b.Property(x => x.TotalAmount).HasColumnName("total_amount").HasPrecision(14,2);
        b.Property(x => x.AmountInWords).HasColumnName("amount_in_words").HasMaxLength(500);
        b.Property(x => x.isTdsDeductable).HasColumnName("isTdsDeductable").HasDefaultValue(false);
        b.Property(x => x.TaxAmountInWords).HasColumnName("tax_amount_in_words").HasMaxLength(500);
        b.Property(x => x.Notes).HasColumnName("notes").HasMaxLength(500);
        b.Property(x => x.BankAccountName).HasColumnName("bank_account_name").HasMaxLength(150);
        b.Property(x => x.BankName).HasColumnName("bank_name").HasMaxLength(150);
        b.Property(x => x.BankAccountNumber).HasColumnName("bank_account_number").HasMaxLength(60);
        b.Property(x => x.IfscCode).HasColumnName("ifsc_code").HasMaxLength(20);
        b.Property(x => x.BranchName).HasColumnName("branch_name").HasMaxLength(150);
        b.Property(x => x.PdfFileId).HasColumnName("pdf_file_id");
        b.Property(x => x.GeneratedBy).HasColumnName("generated_by");
        b.Property(x => x.GeneratedAt).HasColumnName("generated_at");
        b.Property(x => x.SentBy).HasColumnName("sent_by");
        b.Property(x => x.SentAt).HasColumnName("sent_at");
        b.HasIndex(x => x.BookingId).IsUnique();
        b.HasIndex(x => x.InvoiceNumber).IsUnique();
        b.HasIndex("EventId", nameof(ProformaInvoice.InvoiceStatus));
        Audit(b);
    }

    private static void ConfigureSystem(ModelBuilder modelBuilder)
    {
        var emailLog = modelBuilder.Entity<EmailLog>();
        emailLog.ToTable("email_logs");
        emailLog.HasKey(x => x.Id);
        emailLog.Property(x => x.Id).HasColumnName("id");
        emailLog.Property(x => x.BookingId).HasColumnName("booking_id");
        emailLog.Property(x => x.ToEmail).HasColumnName("to_email").HasMaxLength(150).IsRequired();
        emailLog.Property(x => x.CcEmail).HasColumnName("cc_email").HasMaxLength(250);
        emailLog.Property(x => x.BccEmail).HasColumnName("bcc_email").HasMaxLength(250);
        emailLog.Property(x => x.Subject).HasColumnName("subject").HasMaxLength(250).IsRequired();
        emailLog.Property(x => x.BodySnapshot).HasColumnName("body_snapshot");
        emailLog.Property(x => x.TemplateCode).HasColumnName("template_code").HasMaxLength(80).IsRequired();
        emailLog.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(40);
        emailLog.Property(x => x.ProviderMessageId).HasColumnName("provider_message_id").HasMaxLength(120);
        emailLog.Property(x => x.FailureReason).HasColumnName("failure_reason").HasMaxLength(500);
        emailLog.Property(x => x.SentAt).HasColumnName("sent_at");
        emailLog.Property(x => x.RetryCount).HasColumnName("retry_count");
        emailLog.HasIndex(x => x.BookingId);
        emailLog.HasIndex(x => x.TemplateCode);
        Audit(emailLog);

        var user = modelBuilder.Entity<User>();
        user.ToTable("users");
        user.HasKey(x => x.Id);
        user.Property(x => x.Id).HasColumnName("id");
        user.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(120).IsRequired();
        user.Property(x => x.Email).HasColumnName("email").HasMaxLength(150).IsRequired();
        user.Property(x => x.Mobile).HasColumnName("mobile").HasMaxLength(30);
        user.Property(x => x.PasswordHash).HasColumnName("password_hash").HasMaxLength(500).IsRequired();
        user.Property(x => x.IsActive).HasColumnName("is_active");
        user.Property(x => x.LastLoginAt).HasColumnName("last_login_at");
        user.Property(x => x.FailedLoginCount).HasColumnName("failed_login_count");
        user.Property(x => x.LockedUntil).HasColumnName("locked_until");
        user.HasIndex("TenantId", nameof(User.Email)).IsUnique();
        Audit(user);

        var role = modelBuilder.Entity<Role>();
        role.ToTable("roles");
        role.HasKey(x => x.Id);
        role.Property(x => x.Id).HasColumnName("id");
        role.Property(x => x.RoleCode).HasColumnName("role_code").HasMaxLength(80).IsRequired();
        role.Property(x => x.RoleName).HasColumnName("role_name").HasMaxLength(120).IsRequired();
        role.Property(x => x.Description).HasColumnName("description").HasMaxLength(300);
        role.Property(x => x.IsSystemRole).HasColumnName("is_system_role");
        role.Property(x => x.IsActive).HasColumnName("is_active");
        role.HasIndex("TenantId", nameof(Role.RoleCode)).IsUnique();
        Audit(role);

        var permission = modelBuilder.Entity<Permission>();
        permission.ToTable("permissions");
        permission.HasKey(x => x.Id);
        permission.Property(x => x.Id).HasColumnName("id");
        permission.Property(x => x.PermissionCode).HasColumnName("permission_code").HasMaxLength(120).IsRequired();
        permission.Property(x => x.PermissionName).HasColumnName("permission_name").HasMaxLength(150).IsRequired();
        permission.Property(x => x.ModuleName).HasColumnName("module_name").HasMaxLength(80).IsRequired();
        permission.Property(x => x.ActionName).HasColumnName("action_name").HasMaxLength(80).IsRequired();
        permission.Property(x => x.Description).HasColumnName("description").HasMaxLength(300);
        permission.Property(x => x.IsActive).HasColumnName("is_active");
        permission.HasIndex(x => x.PermissionCode).IsUnique();
        Audit(permission);

        var userRole = modelBuilder.Entity<UserRole>();
        userRole.ToTable("user_roles");
        userRole.HasKey(x => x.Id);
        userRole.Property(x => x.Id).HasColumnName("id");
        userRole.Property(x => x.UserId).HasColumnName("user_id");
        userRole.Property(x => x.RoleId).HasColumnName("role_id");
        userRole.Property(x => x.ValidFrom).HasColumnName("valid_from");
        userRole.Property(x => x.ValidTo).HasColumnName("valid_to");
        userRole.Property(x => x.IsActive).HasColumnName("is_active");
        userRole.HasIndex(x => new { x.UserId, x.RoleId }).IsUnique();
        Audit(userRole);

        var rolePermission = modelBuilder.Entity<RolePermission>();
        rolePermission.ToTable("role_permissions");
        rolePermission.HasKey(x => x.Id);
        rolePermission.Property(x => x.Id).HasColumnName("id");
        rolePermission.Property(x => x.RoleId).HasColumnName("role_id");
        rolePermission.Property(x => x.PermissionId).HasColumnName("permission_id");
        rolePermission.HasIndex(x => new { x.RoleId, x.PermissionId }).IsUnique();
        Audit(rolePermission);

        var audit = modelBuilder.Entity<AuditLog>();
        audit.ToTable("audit_logs");
        audit.HasKey(x => x.Id);
        audit.Property(x => x.Id).HasColumnName("id");
        audit.Property(x => x.TenantId).HasColumnName("tenant_id");
        audit.Property(x => x.EventId).HasColumnName("event_id");
        audit.Property(x => x.ActorUserId).HasColumnName("actor_user_id");
        audit.Property(x => x.EntityName).HasColumnName("entity_name").HasMaxLength(120);
        audit.Property(x => x.EntityId).HasColumnName("entity_id");
        audit.Property(x => x.Action).HasColumnName("action").HasMaxLength(180);
        audit.Property(x => x.OldValuesJson).HasColumnName("old_values").HasColumnType("jsonb");
        audit.Property(x => x.NewValuesJson).HasColumnName("new_values").HasColumnType("jsonb");
        audit.Property(x => x.IpAddress).HasColumnName("ip_address").HasMaxLength(80);
        audit.Property(x => x.UserAgent).HasColumnName("user_agent").HasMaxLength(300);
        audit.Property(x => x.CorrelationId).HasColumnName("correlation_id").HasMaxLength(100);
        audit.Property(x => x.OccurredAt).HasColumnName("occurred_at");
        audit.HasIndex(x => x.OccurredAt);

        var number = modelBuilder.Entity<NumberSequence>();
        number.ToTable("number_sequences");
        number.HasKey(x => x.Id);
        number.Property(x => x.Id).HasColumnName("id");
        number.Property(x => x.SequenceCode).HasColumnName("sequence_code").HasMaxLength(80);
        number.Property(x => x.SequenceDate).HasColumnName("sequence_date");
        number.Property(x => x.Prefix).HasColumnName("prefix").HasMaxLength(40);
        number.Property(x => x.CurrentNumber).HasColumnName("current_number");
        number.Property(x => x.PaddingLength).HasColumnName("padding_length");
        number.Property(x => x.ResetFrequency).HasColumnName("reset_frequency").HasConversion<string>().HasMaxLength(40);
        number.HasIndex("TenantId", "EventId", nameof(NumberSequence.SequenceCode)).IsUnique();
        Audit(number);

        modelBuilder.Entity<FileAttachment>().ToTable("file_attachments");
        modelBuilder.Entity<EmailTemplate>().ToTable("email_templates");
        modelBuilder.Entity<DashboardSnapshot>().ToTable("dashboard_snapshots");
    }

    private static void ConfigureAdditionalRequirements(ModelBuilder modelBuilder)
    {
        var item = modelBuilder.Entity<AdditionalRequirementItem>();
        item.ToTable("additional_requirement_items");
        item.HasKey(x => x.Id);
        item.Property(x => x.Id).HasColumnName("id");
        item.Property(x => x.Code).HasColumnName("code").HasMaxLength(50).IsRequired();
        item.Property(x => x.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        item.Property(x => x.BaseAmount).HasColumnName("base_amount").HasPrecision(14, 2).IsRequired();
        item.Property(x => x.GstPercentage).HasColumnName("gst_percentage").HasPrecision(5, 2).HasDefaultValue(18m).IsRequired();
        item.Property(x => x.ImageUrl).HasColumnName("image_url");
        item.Property(x => x.IsActive).HasColumnName("is_active").HasDefaultValue(true);
        item.HasIndex("TenantId", nameof(AdditionalRequirementItem.Code)).IsUnique();
        Audit(item);

        var req = modelBuilder.Entity<ExhibitorAdditionalRequirement>();
        req.ToTable("exhibitor_additional_requirements");
        req.HasKey(x => x.Id);
        req.Property(x => x.Id).HasColumnName("id");
        req.Property(x => x.ExhibitorId).HasColumnName("exhibitor_id").IsRequired();
        req.Property(x => x.BookingId).HasColumnName("booking_id").IsRequired();
        req.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(40).IsRequired();
        req.Property(x => x.TotalBaseAmount).HasColumnName("total_base_amount").HasPrecision(14, 2);
        req.Property(x => x.TotalGstAmount).HasColumnName("total_gst_amount").HasPrecision(14, 2);
        req.Property(x => x.GrandTotal).HasColumnName("grand_total").HasPrecision(14, 2);
        req.Property(x => x.ConfirmedAt).HasColumnName("confirmed_at");
        req.Property(x => x.ConfirmedByUserId).HasColumnName("confirmed_by_user_id");
        req.Property(x => x.CallNotes).HasColumnName("call_notes").HasMaxLength(1000);
        req.Property(x => x.Notes).HasColumnName("notes").HasMaxLength(2000);

        req.HasOne(x => x.Exhibitor).WithMany().HasForeignKey(x => x.ExhibitorId).OnDelete(DeleteBehavior.Restrict);
        req.HasOne(x => x.Booking).WithMany().HasForeignKey(x => x.BookingId).OnDelete(DeleteBehavior.Restrict);
        req.HasMany(x => x.Lines).WithOne(x => x.Requirement).HasForeignKey(x => x.RequirementId).OnDelete(DeleteBehavior.Cascade);

        req.HasIndex(x => x.ExhibitorId);
        req.HasIndex(x => x.BookingId);
        req.HasIndex(x => x.Status);
        Audit(req);

        var line = modelBuilder.Entity<ExhibitorAdditionalRequirementLine>();
        line.ToTable("exhibitor_additional_requirement_lines");
        line.HasKey(x => x.Id);
        line.Property(x => x.Id).HasColumnName("id");
        line.Property(x => x.RequirementId).HasColumnName("requirement_id").IsRequired();
        line.Property(x => x.ItemId).HasColumnName("item_id").IsRequired();
        line.Property(x => x.ItemCode).HasColumnName("item_code").HasMaxLength(50).IsRequired();
        line.Property(x => x.ItemName).HasColumnName("item_name").HasMaxLength(200).IsRequired();
        line.Property(x => x.Quantity).HasColumnName("quantity").IsRequired();
        line.Property(x => x.BaseAmount).HasColumnName("base_amount").HasPrecision(14, 2).IsRequired();
        line.Property(x => x.GstPercentage).HasColumnName("gst_percentage").HasPrecision(5, 2).IsRequired();
        line.Property(x => x.GstAmount).HasColumnName("gst_amount").HasPrecision(14, 2).IsRequired();
        line.Property(x => x.TotalAmount).HasColumnName("total_amount").HasPrecision(14, 2).IsRequired();
        line.HasOne(x => x.Item).WithMany().HasForeignKey(x => x.ItemId).OnDelete(DeleteBehavior.Restrict);
        line.HasIndex(x => x.ItemId);
        line.HasIndex(x => x.RequirementId);
        Audit(line);
    }
}
