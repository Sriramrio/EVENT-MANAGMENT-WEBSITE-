using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSME.StallBooking.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class NewBanks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CapabilityId",
                schema: "public",
                table: "seller_capability_status_history",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "FromStatus",
                schema: "public",
                table: "seller_capability_status_history",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Reason",
                schema: "public",
                table: "seller_capability_status_history",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ToStatus",
                schema: "public",
                table: "seller_capability_status_history",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "TechnicalJson",
                schema: "public",
                table: "seller_capabilities",
                type: "jsonb",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                schema: "public",
                table: "seller_capabilities",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CommercialJson",
                schema: "public",
                table: "seller_capabilities",
                type: "jsonb",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CapabilityNo",
                schema: "public",
                table: "seller_capabilities",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BusinessType",
                schema: "public",
                table: "seller_capabilities",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ClassificationCode",
                schema: "public",
                table: "seller_capabilities",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactEmail",
                schema: "public",
                table: "seller_capabilities",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ContactPerson",
                schema: "public",
                table: "seller_capabilities",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                schema: "public",
                table: "seller_capabilities",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "MainCategoryCode",
                schema: "public",
                table: "seller_capabilities",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OrganizationId",
                schema: "public",
                table: "seller_capabilities",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "PlantLocation",
                schema: "public",
                table: "seller_capabilities",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SegmentCode",
                schema: "public",
                table: "seller_capabilities",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Title",
                schema: "public",
                table: "seller_capabilities",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UomCode",
                schema: "public",
                table: "seller_capabilities",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "TermsJson",
                schema: "public",
                table: "rfqs",
                type: "jsonb",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "RfqNo",
                schema: "public",
                table: "rfqs",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RequirementId",
                schema: "public",
                table: "rfqs",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "Status",
                schema: "public",
                table: "rfqs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "SubmissionDeadline",
                schema: "public",
                table: "rfqs",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<Guid>(
                name: "CapabilityId",
                schema: "public",
                table: "rfq_invitations",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "RfqId",
                schema: "public",
                table: "rfq_invitations",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "Status",
                schema: "public",
                table: "rfq_invitations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "MetadataJson",
                schema: "public",
                table: "reference_data",
                type: "jsonb",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Kind",
                schema: "public",
                table: "reference_data",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                schema: "public",
                table: "reference_data",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                schema: "public",
                table: "reference_data",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                schema: "public",
                table: "reference_data",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                schema: "public",
                table: "reference_data",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "QuotationNo",
                schema: "public",
                table: "quotations",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                schema: "public",
                table: "quotations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Revision",
                schema: "public",
                table: "quotations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "RfqId",
                schema: "public",
                table: "quotations",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "SellerOrganizationId",
                schema: "public",
                table: "quotations",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "Status",
                schema: "public",
                table: "quotations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                schema: "public",
                table: "quotation_lines",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "QuotationId",
                schema: "public",
                table: "quotation_lines",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "UomCode",
                schema: "public",
                table: "quotation_lines",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                schema: "public",
                table: "organizations",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Address",
                schema: "public",
                table: "organizations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "City",
                schema: "public",
                table: "organizations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Country",
                schema: "public",
                table: "organizations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LegalName",
                schema: "public",
                table: "organizations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OrganizationType",
                schema: "public",
                table: "organizations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Pan",
                schema: "public",
                table: "organizations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                schema: "public",
                table: "organizations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Pincode",
                schema: "public",
                table: "organizations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "SourceExhibitorId",
                schema: "public",
                table: "organizations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SourceVisitorId",
                schema: "public",
                table: "organizations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "State",
                schema: "public",
                table: "organizations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                schema: "public",
                table: "organizations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TradeName",
                schema: "public",
                table: "organizations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UdyamNumber",
                schema: "public",
                table: "organizations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                schema: "public",
                table: "organization_users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Address",
                schema: "public",
                table: "organization_locations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "City",
                schema: "public",
                table: "organization_locations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LocationType",
                schema: "public",
                table: "organization_locations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "OrganizationId",
                schema: "public",
                table: "organization_locations",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "Pincode",
                schema: "public",
                table: "organization_locations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "State",
                schema: "public",
                table: "organization_locations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Designation",
                schema: "public",
                table: "organization_contacts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                schema: "public",
                table: "organization_contacts",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsPrimary",
                schema: "public",
                table: "organization_contacts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                schema: "public",
                table: "organization_contacts",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "OrganizationId",
                schema: "public",
                table: "organization_contacts",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                schema: "public",
                table: "organization_contacts",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "MeetingNo",
                schema: "public",
                table: "meetings",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "EngagementId",
                schema: "public",
                table: "meetings",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "Mode",
                schema: "public",
                table: "meetings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                schema: "public",
                table: "meetings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ScheduledEnd",
                schema: "public",
                table: "meetings",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ScheduledStart",
                schema: "public",
                table: "meetings",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<string>(
                name: "Status",
                schema: "public",
                table: "meetings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "VenueOrLink",
                schema: "public",
                table: "meetings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "End",
                schema: "public",
                table: "meeting_slot_options",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<bool>(
                name: "IsAccepted",
                schema: "public",
                table: "meeting_slot_options",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "MeetingId",
                schema: "public",
                table: "meeting_slot_options",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "Start",
                schema: "public",
                table: "meeting_slot_options",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<Guid>(
                name: "MeetingId",
                schema: "public",
                table: "meeting_outcomes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                schema: "public",
                table: "meeting_outcomes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Outcome",
                schema: "public",
                table: "meeting_outcomes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateOnly>(
                name: "DueDate",
                schema: "public",
                table: "meeting_action_items",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "MeetingId",
                schema: "public",
                table: "meeting_action_items",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "OwnerUserId",
                schema: "public",
                table: "meeting_action_items",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                schema: "public",
                table: "meeting_action_items",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Title",
                schema: "public",
                table: "meeting_action_items",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AlgorithmVersion",
                schema: "public",
                table: "match_runs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CompletedAt",
                schema: "public",
                table: "match_runs",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<Guid>(
                name: "RequirementId",
                schema: "public",
                table: "match_runs",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "Status",
                schema: "public",
                table: "match_runs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Explanation",
                schema: "public",
                table: "match_results",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "MatchRunId",
                schema: "public",
                table: "match_results",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<int>(
                name: "Rank",
                schema: "public",
                table: "match_results",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ComponentCode",
                schema: "public",
                table: "match_result_components",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Explanation",
                schema: "public",
                table: "match_result_components",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "MatchResultId",
                schema: "public",
                table: "match_result_components",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "bank_account_name",
                schema: "public",
                table: "exhibitors",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "bank_account_number",
                schema: "public",
                table: "exhibitors",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "bank_ifsc_code",
                schema: "public",
                table: "exhibitors",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "bank_name",
                schema: "public",
                table: "exhibitors",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OrganizationId",
                schema: "public",
                table: "event_participations",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "ParticipationRole",
                schema: "public",
                table: "event_participations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                schema: "public",
                table: "event_participations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Stage",
                schema: "public",
                table: "engagements",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "EngagementId",
                schema: "public",
                table: "engagement_messages",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "Message",
                schema: "public",
                table: "engagement_messages",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "SenderOrganizationId",
                schema: "public",
                table: "engagement_messages",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "SentAt",
                schema: "public",
                table: "engagement_messages",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AlterColumn<string>(
                name: "PayloadJson",
                schema: "public",
                table: "engagement_events",
                type: "jsonb",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "EngagementId",
                schema: "public",
                table: "engagement_events",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "EventType",
                schema: "public",
                table: "engagement_events",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ContentType",
                schema: "public",
                table: "documents",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DocumentType",
                schema: "public",
                table: "documents",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "EntityId",
                schema: "public",
                table: "documents",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EntityType",
                schema: "public",
                table: "documents",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FileName",
                schema: "public",
                table: "documents",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<long>(
                name: "FileSizeBytes",
                schema: "public",
                table: "documents",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<Guid>(
                name: "OrganizationId",
                schema: "public",
                table: "documents",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "StoragePath",
                schema: "public",
                table: "documents",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                schema: "public",
                table: "buyer_requirements",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "RequirementNo",
                schema: "public",
                table: "buyer_requirements",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "DetailsJson",
                schema: "public",
                table: "buyer_requirements",
                type: "jsonb",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ClassificationCode",
                schema: "public",
                table: "buyer_requirements",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                schema: "public",
                table: "buyer_requirements",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                schema: "public",
                table: "buyer_requirements",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "MainCategoryCode",
                schema: "public",
                table: "buyer_requirements",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "NeedByDate",
                schema: "public",
                table: "buyer_requirements",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.AddColumn<Guid>(
                name: "OrganizationId",
                schema: "public",
                table: "buyer_requirements",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<decimal>(
                name: "Quantity",
                schema: "public",
                table: "buyer_requirements",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateOnly>(
                name: "RequirementDate",
                schema: "public",
                table: "buyer_requirements",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.AddColumn<string>(
                name: "SegmentCode",
                schema: "public",
                table: "buyer_requirements",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourcingType",
                schema: "public",
                table: "buyer_requirements",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Title",
                schema: "public",
                table: "buyer_requirements",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UomCode",
                schema: "public",
                table: "buyer_requirements",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FromStatus",
                schema: "public",
                table: "buyer_requirement_status_history",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Reason",
                schema: "public",
                table: "buyer_requirement_status_history",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RequirementId",
                schema: "public",
                table: "buyer_requirement_status_history",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "ToStatus",
                schema: "public",
                table: "buyer_requirement_status_history",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "AwardNo",
                schema: "public",
                table: "awards",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                schema: "public",
                table: "awards",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "QuotationId",
                schema: "public",
                table: "awards",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "RequirementId",
                schema: "public",
                table: "awards",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "Status",
                schema: "public",
                table: "awards",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "AwardId",
                schema: "public",
                table: "award_milestones",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateOnly>(
                name: "DueDate",
                schema: "public",
                table: "award_milestones",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));

            migrationBuilder.AddColumn<string>(
                name: "Status",
                schema: "public",
                table: "award_milestones",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Title",
                schema: "public",
                table: "award_milestones",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CapabilityId",
                schema: "public",
                table: "seller_capability_status_history");

            migrationBuilder.DropColumn(
                name: "FromStatus",
                schema: "public",
                table: "seller_capability_status_history");

            migrationBuilder.DropColumn(
                name: "Reason",
                schema: "public",
                table: "seller_capability_status_history");

            migrationBuilder.DropColumn(
                name: "ToStatus",
                schema: "public",
                table: "seller_capability_status_history");

            migrationBuilder.DropColumn(
                name: "BusinessType",
                schema: "public",
                table: "seller_capabilities");

            migrationBuilder.DropColumn(
                name: "ClassificationCode",
                schema: "public",
                table: "seller_capabilities");

            migrationBuilder.DropColumn(
                name: "ContactEmail",
                schema: "public",
                table: "seller_capabilities");

            migrationBuilder.DropColumn(
                name: "ContactPerson",
                schema: "public",
                table: "seller_capabilities");

            migrationBuilder.DropColumn(
                name: "Description",
                schema: "public",
                table: "seller_capabilities");

            migrationBuilder.DropColumn(
                name: "MainCategoryCode",
                schema: "public",
                table: "seller_capabilities");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                schema: "public",
                table: "seller_capabilities");

            migrationBuilder.DropColumn(
                name: "PlantLocation",
                schema: "public",
                table: "seller_capabilities");

            migrationBuilder.DropColumn(
                name: "SegmentCode",
                schema: "public",
                table: "seller_capabilities");

            migrationBuilder.DropColumn(
                name: "Title",
                schema: "public",
                table: "seller_capabilities");

            migrationBuilder.DropColumn(
                name: "UomCode",
                schema: "public",
                table: "seller_capabilities");

            migrationBuilder.DropColumn(
                name: "RequirementId",
                schema: "public",
                table: "rfqs");

            migrationBuilder.DropColumn(
                name: "Status",
                schema: "public",
                table: "rfqs");

            migrationBuilder.DropColumn(
                name: "SubmissionDeadline",
                schema: "public",
                table: "rfqs");

            migrationBuilder.DropColumn(
                name: "CapabilityId",
                schema: "public",
                table: "rfq_invitations");

            migrationBuilder.DropColumn(
                name: "RfqId",
                schema: "public",
                table: "rfq_invitations");

            migrationBuilder.DropColumn(
                name: "Status",
                schema: "public",
                table: "rfq_invitations");

            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                schema: "public",
                table: "reference_data");

            migrationBuilder.DropColumn(
                name: "IsActive",
                schema: "public",
                table: "reference_data");

            migrationBuilder.DropColumn(
                name: "Name",
                schema: "public",
                table: "reference_data");

            migrationBuilder.DropColumn(
                name: "Currency",
                schema: "public",
                table: "quotations");

            migrationBuilder.DropColumn(
                name: "Revision",
                schema: "public",
                table: "quotations");

            migrationBuilder.DropColumn(
                name: "RfqId",
                schema: "public",
                table: "quotations");

            migrationBuilder.DropColumn(
                name: "SellerOrganizationId",
                schema: "public",
                table: "quotations");

            migrationBuilder.DropColumn(
                name: "Status",
                schema: "public",
                table: "quotations");

            migrationBuilder.DropColumn(
                name: "Description",
                schema: "public",
                table: "quotation_lines");

            migrationBuilder.DropColumn(
                name: "QuotationId",
                schema: "public",
                table: "quotation_lines");

            migrationBuilder.DropColumn(
                name: "UomCode",
                schema: "public",
                table: "quotation_lines");

            migrationBuilder.DropColumn(
                name: "Address",
                schema: "public",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "City",
                schema: "public",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "Country",
                schema: "public",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "LegalName",
                schema: "public",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "OrganizationType",
                schema: "public",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "Pan",
                schema: "public",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "Phone",
                schema: "public",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "Pincode",
                schema: "public",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "SourceExhibitorId",
                schema: "public",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "SourceVisitorId",
                schema: "public",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "State",
                schema: "public",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "Status",
                schema: "public",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "TradeName",
                schema: "public",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "UdyamNumber",
                schema: "public",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "IsActive",
                schema: "public",
                table: "organization_users");

            migrationBuilder.DropColumn(
                name: "Address",
                schema: "public",
                table: "organization_locations");

            migrationBuilder.DropColumn(
                name: "City",
                schema: "public",
                table: "organization_locations");

            migrationBuilder.DropColumn(
                name: "LocationType",
                schema: "public",
                table: "organization_locations");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                schema: "public",
                table: "organization_locations");

            migrationBuilder.DropColumn(
                name: "Pincode",
                schema: "public",
                table: "organization_locations");

            migrationBuilder.DropColumn(
                name: "State",
                schema: "public",
                table: "organization_locations");

            migrationBuilder.DropColumn(
                name: "Designation",
                schema: "public",
                table: "organization_contacts");

            migrationBuilder.DropColumn(
                name: "Email",
                schema: "public",
                table: "organization_contacts");

            migrationBuilder.DropColumn(
                name: "IsPrimary",
                schema: "public",
                table: "organization_contacts");

            migrationBuilder.DropColumn(
                name: "Name",
                schema: "public",
                table: "organization_contacts");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                schema: "public",
                table: "organization_contacts");

            migrationBuilder.DropColumn(
                name: "Phone",
                schema: "public",
                table: "organization_contacts");

            migrationBuilder.DropColumn(
                name: "EngagementId",
                schema: "public",
                table: "meetings");

            migrationBuilder.DropColumn(
                name: "Mode",
                schema: "public",
                table: "meetings");

            migrationBuilder.DropColumn(
                name: "Notes",
                schema: "public",
                table: "meetings");

            migrationBuilder.DropColumn(
                name: "ScheduledEnd",
                schema: "public",
                table: "meetings");

            migrationBuilder.DropColumn(
                name: "ScheduledStart",
                schema: "public",
                table: "meetings");

            migrationBuilder.DropColumn(
                name: "Status",
                schema: "public",
                table: "meetings");

            migrationBuilder.DropColumn(
                name: "VenueOrLink",
                schema: "public",
                table: "meetings");

            migrationBuilder.DropColumn(
                name: "End",
                schema: "public",
                table: "meeting_slot_options");

            migrationBuilder.DropColumn(
                name: "IsAccepted",
                schema: "public",
                table: "meeting_slot_options");

            migrationBuilder.DropColumn(
                name: "MeetingId",
                schema: "public",
                table: "meeting_slot_options");

            migrationBuilder.DropColumn(
                name: "Start",
                schema: "public",
                table: "meeting_slot_options");

            migrationBuilder.DropColumn(
                name: "MeetingId",
                schema: "public",
                table: "meeting_outcomes");

            migrationBuilder.DropColumn(
                name: "Notes",
                schema: "public",
                table: "meeting_outcomes");

            migrationBuilder.DropColumn(
                name: "Outcome",
                schema: "public",
                table: "meeting_outcomes");

            migrationBuilder.DropColumn(
                name: "DueDate",
                schema: "public",
                table: "meeting_action_items");

            migrationBuilder.DropColumn(
                name: "MeetingId",
                schema: "public",
                table: "meeting_action_items");

            migrationBuilder.DropColumn(
                name: "OwnerUserId",
                schema: "public",
                table: "meeting_action_items");

            migrationBuilder.DropColumn(
                name: "Status",
                schema: "public",
                table: "meeting_action_items");

            migrationBuilder.DropColumn(
                name: "Title",
                schema: "public",
                table: "meeting_action_items");

            migrationBuilder.DropColumn(
                name: "AlgorithmVersion",
                schema: "public",
                table: "match_runs");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                schema: "public",
                table: "match_runs");

            migrationBuilder.DropColumn(
                name: "RequirementId",
                schema: "public",
                table: "match_runs");

            migrationBuilder.DropColumn(
                name: "Status",
                schema: "public",
                table: "match_runs");

            migrationBuilder.DropColumn(
                name: "Explanation",
                schema: "public",
                table: "match_results");

            migrationBuilder.DropColumn(
                name: "MatchRunId",
                schema: "public",
                table: "match_results");

            migrationBuilder.DropColumn(
                name: "Rank",
                schema: "public",
                table: "match_results");

            migrationBuilder.DropColumn(
                name: "ComponentCode",
                schema: "public",
                table: "match_result_components");

            migrationBuilder.DropColumn(
                name: "Explanation",
                schema: "public",
                table: "match_result_components");

            migrationBuilder.DropColumn(
                name: "MatchResultId",
                schema: "public",
                table: "match_result_components");

            migrationBuilder.DropColumn(
                name: "bank_account_name",
                schema: "public",
                table: "exhibitors");

            migrationBuilder.DropColumn(
                name: "bank_account_number",
                schema: "public",
                table: "exhibitors");

            migrationBuilder.DropColumn(
                name: "bank_ifsc_code",
                schema: "public",
                table: "exhibitors");

            migrationBuilder.DropColumn(
                name: "bank_name",
                schema: "public",
                table: "exhibitors");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                schema: "public",
                table: "event_participations");

            migrationBuilder.DropColumn(
                name: "ParticipationRole",
                schema: "public",
                table: "event_participations");

            migrationBuilder.DropColumn(
                name: "Status",
                schema: "public",
                table: "event_participations");

            migrationBuilder.DropColumn(
                name: "Stage",
                schema: "public",
                table: "engagements");

            migrationBuilder.DropColumn(
                name: "EngagementId",
                schema: "public",
                table: "engagement_messages");

            migrationBuilder.DropColumn(
                name: "Message",
                schema: "public",
                table: "engagement_messages");

            migrationBuilder.DropColumn(
                name: "SenderOrganizationId",
                schema: "public",
                table: "engagement_messages");

            migrationBuilder.DropColumn(
                name: "SentAt",
                schema: "public",
                table: "engagement_messages");

            migrationBuilder.DropColumn(
                name: "EngagementId",
                schema: "public",
                table: "engagement_events");

            migrationBuilder.DropColumn(
                name: "EventType",
                schema: "public",
                table: "engagement_events");

            migrationBuilder.DropColumn(
                name: "ContentType",
                schema: "public",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "DocumentType",
                schema: "public",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "EntityId",
                schema: "public",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "EntityType",
                schema: "public",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "FileName",
                schema: "public",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "FileSizeBytes",
                schema: "public",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                schema: "public",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "StoragePath",
                schema: "public",
                table: "documents");

            migrationBuilder.DropColumn(
                name: "ClassificationCode",
                schema: "public",
                table: "buyer_requirements");

            migrationBuilder.DropColumn(
                name: "Currency",
                schema: "public",
                table: "buyer_requirements");

            migrationBuilder.DropColumn(
                name: "Description",
                schema: "public",
                table: "buyer_requirements");

            migrationBuilder.DropColumn(
                name: "MainCategoryCode",
                schema: "public",
                table: "buyer_requirements");

            migrationBuilder.DropColumn(
                name: "NeedByDate",
                schema: "public",
                table: "buyer_requirements");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                schema: "public",
                table: "buyer_requirements");

            migrationBuilder.DropColumn(
                name: "Quantity",
                schema: "public",
                table: "buyer_requirements");

            migrationBuilder.DropColumn(
                name: "RequirementDate",
                schema: "public",
                table: "buyer_requirements");

            migrationBuilder.DropColumn(
                name: "SegmentCode",
                schema: "public",
                table: "buyer_requirements");

            migrationBuilder.DropColumn(
                name: "SourcingType",
                schema: "public",
                table: "buyer_requirements");

            migrationBuilder.DropColumn(
                name: "Title",
                schema: "public",
                table: "buyer_requirements");

            migrationBuilder.DropColumn(
                name: "UomCode",
                schema: "public",
                table: "buyer_requirements");

            migrationBuilder.DropColumn(
                name: "FromStatus",
                schema: "public",
                table: "buyer_requirement_status_history");

            migrationBuilder.DropColumn(
                name: "Reason",
                schema: "public",
                table: "buyer_requirement_status_history");

            migrationBuilder.DropColumn(
                name: "RequirementId",
                schema: "public",
                table: "buyer_requirement_status_history");

            migrationBuilder.DropColumn(
                name: "ToStatus",
                schema: "public",
                table: "buyer_requirement_status_history");

            migrationBuilder.DropColumn(
                name: "Currency",
                schema: "public",
                table: "awards");

            migrationBuilder.DropColumn(
                name: "QuotationId",
                schema: "public",
                table: "awards");

            migrationBuilder.DropColumn(
                name: "RequirementId",
                schema: "public",
                table: "awards");

            migrationBuilder.DropColumn(
                name: "Status",
                schema: "public",
                table: "awards");

            migrationBuilder.DropColumn(
                name: "AwardId",
                schema: "public",
                table: "award_milestones");

            migrationBuilder.DropColumn(
                name: "DueDate",
                schema: "public",
                table: "award_milestones");

            migrationBuilder.DropColumn(
                name: "Status",
                schema: "public",
                table: "award_milestones");

            migrationBuilder.DropColumn(
                name: "Title",
                schema: "public",
                table: "award_milestones");

            migrationBuilder.AlterColumn<string>(
                name: "TechnicalJson",
                schema: "public",
                table: "seller_capabilities",
                type: "jsonb",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                schema: "public",
                table: "seller_capabilities",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "CommercialJson",
                schema: "public",
                table: "seller_capabilities",
                type: "jsonb",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb");

            migrationBuilder.AlterColumn<string>(
                name: "CapabilityNo",
                schema: "public",
                table: "seller_capabilities",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "TermsJson",
                schema: "public",
                table: "rfqs",
                type: "jsonb",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb");

            migrationBuilder.AlterColumn<string>(
                name: "RfqNo",
                schema: "public",
                table: "rfqs",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "MetadataJson",
                schema: "public",
                table: "reference_data",
                type: "jsonb",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb");

            migrationBuilder.AlterColumn<string>(
                name: "Kind",
                schema: "public",
                table: "reference_data",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                schema: "public",
                table: "reference_data",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "QuotationNo",
                schema: "public",
                table: "quotations",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                schema: "public",
                table: "organizations",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "MeetingNo",
                schema: "public",
                table: "meetings",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "PayloadJson",
                schema: "public",
                table: "engagement_events",
                type: "jsonb",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                schema: "public",
                table: "buyer_requirements",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "RequirementNo",
                schema: "public",
                table: "buyer_requirements",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "DetailsJson",
                schema: "public",
                table: "buyer_requirements",
                type: "jsonb",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb");

            migrationBuilder.AlterColumn<string>(
                name: "AwardNo",
                schema: "public",
                table: "awards",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");
        }
    }
}
