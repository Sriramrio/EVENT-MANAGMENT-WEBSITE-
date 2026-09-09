using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MSME.StallBooking.Persistence;

namespace MSME.StallBooking.Persistence.Migrations;

[DbContext(typeof(StallBookingDbContext)), Migration("202608210001_MarketplaceModule1ReferenceData")]
public sealed class MarketplaceModule1ReferenceData : Migration
{
    protected override void Up(MigrationBuilder m)
    {
        m.Sql("""
CREATE TABLE IF NOT EXISTS public.reference_data (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid NULL,
  "Kind" varchar(80) NOT NULL, "Code" varchar(80) NOT NULL, "Name" varchar(240) NOT NULL,
  "DisplayOrder" integer NOT NULL DEFAULT 0, "IsActive" boolean NOT NULL DEFAULT true, "MetadataJson" jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL, created_by uuid NULL, updated_at timestamptz NULL, updated_by uuid NULL,
  deleted_at timestamptz NULL, deleted_by uuid NULL, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100) NULL, version bigint NOT NULL DEFAULT 1,
  CONSTRAINT uq_marketplace_reference_kind_code UNIQUE ("Kind", "Code"));
CREATE INDEX IF NOT EXISTS ix_marketplace_reference_tenant_event ON public.reference_data(tenant_id,event_id);
""");
        m.Sql(ReadEmbeddedSeed());
    }
    protected override void Down(MigrationBuilder m) => m.Sql("DROP TABLE IF EXISTS public.reference_data;");
    private static string ReadEmbeddedSeed()
    {
        using var stream = typeof(MarketplaceModule1ReferenceData).Assembly.GetManifestResourceStream("MSME.StallBooking.Persistence.marketplace_reference_seed.sql")
            ?? throw new InvalidOperationException("Embedded marketplace reference seed was not found.");
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}

[DbContext(typeof(StallBookingDbContext)), Migration("202608210002_MarketplaceModule2Organizations")]
public sealed class MarketplaceModule2Organizations : Migration
{
    protected override void Up(MigrationBuilder m) => m.Sql("""
CREATE TABLE IF NOT EXISTS public.organizations (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid NULL, "OrganizationType" varchar(20) NOT NULL, "LegalName" varchar(240) NOT NULL,
 "TradeName" varchar(240), "Gstin" varchar(15), "Pan" varchar(10), "UdyamNumber" varchar(40), "Email" varchar(180) NOT NULL, "Phone" varchar(30) NOT NULL,
 "Address" varchar(600) NOT NULL, "City" varchar(100) NOT NULL, "State" varchar(100) NOT NULL, "Country" varchar(100) NOT NULL DEFAULT 'India', "Pincode" varchar(12) NOT NULL,
 "SourceExhibitorId" uuid NULL, "SourceVisitorId" uuid NULL, "Status" varchar(30) NOT NULL DEFAULT 'DRAFT',
 created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1);
CREATE INDEX IF NOT EXISTS ix_marketplace_organizations_tenant_event ON public.organizations(tenant_id,event_id);
CREATE INDEX IF NOT EXISTS ix_marketplace_organizations_email ON public.organizations(tenant_id,"Email");
CREATE TABLE IF NOT EXISTS public.organization_users (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid NULL, "OrganizationId" uuid NOT NULL, "UserId" uuid NOT NULL, "Role" varchar(30) NOT NULL, "IsActive" boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1,
 CONSTRAINT uq_marketplace_org_user UNIQUE(tenant_id,"OrganizationId","UserId"));
CREATE TABLE IF NOT EXISTS public.organization_contacts (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid NULL, "OrganizationId" uuid NOT NULL, "Name" varchar(160) NOT NULL, "Designation" varchar(160), "Email" varchar(180) NOT NULL, "Phone" varchar(30) NOT NULL, "IsPrimary" boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS public.organization_locations (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid NULL, "OrganizationId" uuid NOT NULL, "LocationType" varchar(30) NOT NULL, "Address" varchar(600) NOT NULL, "City" varchar(100) NOT NULL, "State" varchar(100) NOT NULL, "Pincode" varchar(12) NOT NULL,
 created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS public.event_participations (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid NULL, "OrganizationId" uuid NOT NULL, "ParticipationRole" varchar(30) NOT NULL, "Status" varchar(30) NOT NULL,
 created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS public.documents (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid NULL, "OrganizationId" uuid NOT NULL, "EntityType" varchar(60) NOT NULL, "EntityId" uuid, "DocumentType" varchar(60) NOT NULL, "FileName" varchar(260) NOT NULL, "StoragePath" text NOT NULL, "ContentType" varchar(120) NOT NULL, "FileSizeBytes" bigint NOT NULL,
 created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1);
""");
    protected override void Down(MigrationBuilder m) => m.Sql("DROP TABLE IF EXISTS public.documents, public.event_participations, public.organization_locations, public.organization_contacts, public.organization_users, public.organizations;");
}

[DbContext(typeof(StallBookingDbContext)), Migration("202608210003_MarketplaceModule3BuyerRequirements")]
public sealed class MarketplaceModule3BuyerRequirements : Migration
{
    protected override void Up(MigrationBuilder m) => m.Sql("""
CREATE TABLE IF NOT EXISTS public.buyer_requirements (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid, "OrganizationId" uuid NOT NULL, "RequirementNo" varchar(40) NOT NULL, "Title" varchar(240) NOT NULL, "Description" text NOT NULL, "SourcingType" varchar(30) NOT NULL,
 "SegmentCode" varchar(40), "MainCategoryCode" varchar(40), "ClassificationCode" varchar(40), "Quantity" numeric(18,3) NOT NULL, "UomCode" varchar(30) NOT NULL,
 "RequirementDate" date NOT NULL, "NeedByDate" date NOT NULL, "BudgetMin" numeric(18,2), "BudgetMax" numeric(18,2), "Currency" varchar(3) NOT NULL, "Status" varchar(30) NOT NULL, "DetailsJson" jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1,
 CONSTRAINT uq_marketplace_requirement_no UNIQUE(tenant_id,"RequirementNo"), CONSTRAINT ck_marketplace_requirement_budget CHECK ("BudgetMax" IS NULL OR "BudgetMin" IS NULL OR "BudgetMax">="BudgetMin"), CONSTRAINT ck_marketplace_requirement_date CHECK ("NeedByDate">="RequirementDate"));
CREATE INDEX IF NOT EXISTS ix_marketplace_requirements_status ON public.buyer_requirements(tenant_id,event_id,"Status");
CREATE TABLE IF NOT EXISTS public.buyer_requirement_status_history (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid, "RequirementId" uuid NOT NULL, "FromStatus" varchar(30) NOT NULL, "ToStatus" varchar(30) NOT NULL, "Reason" text,
 created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1);
""");
    protected override void Down(MigrationBuilder m) => m.Sql("DROP TABLE IF EXISTS public.buyer_requirement_status_history, public.buyer_requirements;");
}

[DbContext(typeof(StallBookingDbContext)), Migration("202608210004_MarketplaceModule4SellerCapabilities")]
public sealed class MarketplaceModule4SellerCapabilities : Migration
{
    protected override void Up(MigrationBuilder m) => m.Sql("""
CREATE TABLE IF NOT EXISTS public.seller_capabilities (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid, "OrganizationId" uuid NOT NULL, "CapabilityNo" varchar(40) NOT NULL, "Title" varchar(240) NOT NULL, "Description" text NOT NULL,
 "BusinessType" varchar(40) NOT NULL, "PlantLocation" varchar(300) NOT NULL, "ContactPerson" varchar(160) NOT NULL, "ContactEmail" varchar(180) NOT NULL,
 "SegmentCode" varchar(40), "MainCategoryCode" varchar(40), "ClassificationCode" varchar(40), "UomCode" varchar(30) NOT NULL, "TechnicalJson" jsonb NOT NULL DEFAULT '{}'::jsonb, "CommercialJson" jsonb NOT NULL DEFAULT '{}'::jsonb, "Status" varchar(30) NOT NULL,
 created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1,
 CONSTRAINT uq_marketplace_capability_no UNIQUE(tenant_id,"CapabilityNo"));
CREATE INDEX IF NOT EXISTS ix_marketplace_capabilities_status ON public.seller_capabilities(tenant_id,event_id,"Status");
CREATE TABLE IF NOT EXISTS public.seller_capability_status_history (
 id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid, "CapabilityId" uuid NOT NULL, "FromStatus" varchar(30) NOT NULL, "ToStatus" varchar(30) NOT NULL, "Reason" text,
 created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1);
""");
    protected override void Down(MigrationBuilder m) => m.Sql("DROP TABLE IF EXISTS public.seller_capability_status_history, public.seller_capabilities;");
}

[DbContext(typeof(StallBookingDbContext)), Migration("202608210005_MarketplaceModule5Matching")]
public sealed class MarketplaceModule5Matching : Migration
{
    protected override void Up(MigrationBuilder m) => m.Sql("""
CREATE TABLE IF NOT EXISTS public.match_runs (id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid, "RequirementId" uuid NOT NULL, "AlgorithmVersion" varchar(30) NOT NULL, "Status" varchar(30) NOT NULL, "CompletedAt" timestamptz NOT NULL, created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS public.match_results (id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid, "MatchRunId" uuid NOT NULL, "RequirementId" uuid NOT NULL, "CapabilityId" uuid NOT NULL, "Score" numeric(5,2) NOT NULL, "Rank" integer NOT NULL, "Explanation" text NOT NULL, created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1, CONSTRAINT uq_marketplace_match UNIQUE(tenant_id,"RequirementId","CapabilityId"));
CREATE TABLE IF NOT EXISTS public.match_result_components (id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid, "MatchResultId" uuid NOT NULL, "ComponentCode" varchar(50) NOT NULL, "Weight" numeric(5,2) NOT NULL, "RawScore" numeric(5,2) NOT NULL, "WeightedScore" numeric(5,2) NOT NULL, "Explanation" text NOT NULL, created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1);
""");
    protected override void Down(MigrationBuilder m) => m.Sql("DROP TABLE IF EXISTS public.match_result_components, public.match_results, public.match_runs;");
}

[DbContext(typeof(StallBookingDbContext)), Migration("202608210006_MarketplaceModule6EngagementMeetings")]
public sealed class MarketplaceModule6EngagementMeetings : Migration
{
    protected override void Up(MigrationBuilder m) => m.Sql("""
CREATE TABLE IF NOT EXISTS public.engagements (id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid, "RequirementId" uuid NOT NULL, "CapabilityId" uuid NOT NULL, "Stage" varchar(40) NOT NULL, created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1, CONSTRAINT uq_marketplace_engagement UNIQUE(tenant_id,"RequirementId","CapabilityId"));
CREATE TABLE IF NOT EXISTS public.engagement_events (id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid, "EngagementId" uuid NOT NULL, "EventType" varchar(60) NOT NULL, "PayloadJson" jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS public.engagement_messages (id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid, "EngagementId" uuid NOT NULL, "SenderOrganizationId" uuid NOT NULL, "Message" text NOT NULL, "SentAt" timestamptz NOT NULL, created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS public.meetings (id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid, "MeetingNo" varchar(40) NOT NULL, "EngagementId" uuid NOT NULL, "ScheduledStart" timestamptz NOT NULL, "ScheduledEnd" timestamptz NOT NULL, "Mode" varchar(30) NOT NULL, "VenueOrLink" text NOT NULL, "Status" varchar(30) NOT NULL, "Notes" text NOT NULL, created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1, CONSTRAINT uq_marketplace_meeting_no UNIQUE(tenant_id,"MeetingNo"));
CREATE TABLE IF NOT EXISTS public.meeting_slot_options (id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid, "MeetingId" uuid NOT NULL, "Start" timestamptz NOT NULL, "End" timestamptz NOT NULL, "IsAccepted" boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS public.meeting_outcomes (id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid, "MeetingId" uuid NOT NULL, "Outcome" varchar(60) NOT NULL, "Notes" text NOT NULL, created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS public.meeting_action_items (id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid, "MeetingId" uuid NOT NULL, "Title" text NOT NULL, "OwnerUserId" uuid, "DueDate" date, "Status" varchar(30) NOT NULL, created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1);
""");
    protected override void Down(MigrationBuilder m) => m.Sql("DROP TABLE IF EXISTS public.meeting_action_items, public.meeting_outcomes, public.meeting_slot_options, public.meetings, public.engagement_messages, public.engagement_events, public.engagements;");
}

[DbContext(typeof(StallBookingDbContext)), Migration("202608210007_MarketplaceModule7RfqQuotationAward")]
public sealed class MarketplaceModule7RfqQuotationAward : Migration
{
    protected override void Up(MigrationBuilder m) => m.Sql("""
CREATE TABLE IF NOT EXISTS public.rfqs (id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid, "RfqNo" varchar(40) NOT NULL, "RequirementId" uuid NOT NULL, "SubmissionDeadline" timestamptz NOT NULL, "Status" varchar(30) NOT NULL, "TermsJson" jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1, CONSTRAINT uq_marketplace_rfq_no UNIQUE(tenant_id,"RfqNo"));
CREATE TABLE IF NOT EXISTS public.rfq_invitations (id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid, "RfqId" uuid NOT NULL, "CapabilityId" uuid NOT NULL, "Status" varchar(30) NOT NULL, created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS public.quotations (id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid, "QuotationNo" varchar(40) NOT NULL, "RfqId" uuid NOT NULL, "SellerOrganizationId" uuid NOT NULL, "Revision" integer NOT NULL, "GrandTotal" numeric(18,2) NOT NULL, "Currency" varchar(3) NOT NULL, "Status" varchar(30) NOT NULL, created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1, CONSTRAINT uq_marketplace_quotation_no UNIQUE(tenant_id,"QuotationNo"));
CREATE TABLE IF NOT EXISTS public.quotation_lines (id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid, "QuotationId" uuid NOT NULL, "Description" text NOT NULL, "Quantity" numeric(18,3) NOT NULL, "UomCode" varchar(30) NOT NULL, "UnitPrice" numeric(18,2) NOT NULL, "LineTotal" numeric(18,2) NOT NULL, created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS public.awards (id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid, "AwardNo" varchar(40) NOT NULL, "RequirementId" uuid NOT NULL, "QuotationId" uuid NOT NULL, "AwardValue" numeric(18,2) NOT NULL, "Currency" varchar(3) NOT NULL, "Status" varchar(30) NOT NULL, created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1, CONSTRAINT uq_marketplace_award_no UNIQUE(tenant_id,"AwardNo"));
CREATE TABLE IF NOT EXISTS public.award_milestones (id uuid PRIMARY KEY, tenant_id uuid NOT NULL, event_id uuid, "AwardId" uuid NOT NULL, "Title" text NOT NULL, "DueDate" date NOT NULL, "Amount" numeric(18,2) NOT NULL, "Status" varchar(30) NOT NULL, created_at timestamptz NOT NULL, created_by uuid, updated_at timestamptz, updated_by uuid, deleted_at timestamptz, deleted_by uuid, is_deleted boolean NOT NULL DEFAULT false, correlation_id varchar(100), version bigint NOT NULL DEFAULT 1);
""");
    protected override void Down(MigrationBuilder m) => m.Sql("DROP TABLE IF EXISTS public.award_milestones, public.awards, public.quotation_lines, public.quotations, public.rfq_invitations, public.rfqs;");
}
