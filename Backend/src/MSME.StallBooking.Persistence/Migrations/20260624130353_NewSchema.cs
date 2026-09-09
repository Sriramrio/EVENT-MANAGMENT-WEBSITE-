using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSME.StallBooking.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class NewSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "public");

            migrationBuilder.CreateTable(
                name: "audit_logs",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: true),
                    actor_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    entity_name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    entity_id = table.Column<Guid>(type: "uuid", nullable: false),
                    action = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    old_values = table.Column<string>(type: "jsonb", nullable: true),
                    new_values = table.Column<string>(type: "jsonb", nullable: true),
                    ip_address = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    user_agent = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    correlation_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    occurred_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_logs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "billing_profiles",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    exhibitor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    billing_legal_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    billing_address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    billing_city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    billing_state = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    billing_state_code = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    billing_pincode = table.Column<string>(type: "character varying(12)", maxLength: 12, nullable: false),
                    billing_country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    billing_gstin = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    billing_pan = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    place_of_supply = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    billing_contact_person = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    billing_email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    billing_mobile = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    is_default = table.Column<bool>(type: "boolean", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    correlation_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_billing_profiles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "dashboard_snapshots",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    EventId = table.Column<Guid>(type: "uuid", nullable: false),
                    SnapshotDate = table.Column<DateOnly>(type: "date", nullable: false),
                    TotalStalls = table.Column<int>(type: "integer", nullable: false),
                    AvailableStalls = table.Column<int>(type: "integer", nullable: false),
                    BlockedStalls = table.Column<int>(type: "integer", nullable: false),
                    FrozenStalls = table.Column<int>(type: "integer", nullable: false),
                    ReleasedStalls = table.Column<int>(type: "integer", nullable: false),
                    PaymentPendingCount = table.Column<int>(type: "integer", nullable: false),
                    PaymentReceivedCount = table.Column<int>(type: "integer", nullable: false),
                    PaymentVerifiedCount = table.Column<int>(type: "integer", nullable: false),
                    PaymentRejectedCount = table.Column<int>(type: "integer", nullable: false),
                    InvoiceGeneratedCount = table.Column<int>(type: "integer", nullable: false),
                    InvoiceSentCount = table.Column<int>(type: "integer", nullable: false),
                    InvoicePendingCount = table.Column<int>(type: "integer", nullable: false),
                    SnapshotJson = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_dashboard_snapshots", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "email_logs",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    booking_id = table.Column<Guid>(type: "uuid", nullable: true),
                    to_email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    cc_email = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    bcc_email = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    subject = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    body_snapshot = table.Column<string>(type: "text", nullable: false),
                    template_code = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    provider_message_id = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    failure_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    sent_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    retry_count = table.Column<int>(type: "integer", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    correlation_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_email_logs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "email_templates",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateCode = table.Column<string>(type: "text", nullable: false),
                    SubjectTemplate = table.Column<string>(type: "text", nullable: false),
                    BodyHtmlTemplate = table.Column<string>(type: "text", nullable: false),
                    BodyTextTemplate = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    EventId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CorrelationId = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_email_templates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "events",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    event_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    venue_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    venue_address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    district = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    state = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: false),
                    booking_open_date = table.Column<DateOnly>(type: "date", nullable: false),
                    booking_close_date = table.Column<DateOnly>(type: "date", nullable: false),
                    stall_block_validity_days = table.Column<int>(type: "integer", nullable: false, defaultValue: 3),
                    default_gst_percentage = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false, defaultValue: 18m),
                    status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    correlation_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_events", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "exhibitors",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    legal_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    trade_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    registered_address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    district = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    state = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    pincode = table.Column<string>(type: "character varying(12)", maxLength: 12, nullable: false),
                    country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    contact_person_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    contact_person_designation = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    mobile = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    alternate_mobile = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    alternate_email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    website = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    industry_scale = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    business_type = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    company_constitution = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    industry_category = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    product_service_description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    product_keywords = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    udyam_number = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    gstin = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    pan = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    lub_member = table.Column<bool>(type: "boolean", nullable: false),
                    lub_state = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    lub_chapter = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    lub_membership_number = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    correlation_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_exhibitors", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "file_attachments",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: true),
                    FileCategory = table.Column<int>(type: "integer", nullable: false),
                    OriginalFileName = table.Column<string>(type: "text", nullable: false),
                    StoredFileName = table.Column<string>(type: "text", nullable: false),
                    ContentType = table.Column<string>(type: "text", nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    ChecksumSha256 = table.Column<string>(type: "text", nullable: false),
                    StoragePath = table.Column<string>(type: "text", nullable: false),
                    UploadedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UploadedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ScanStatus = table.Column<int>(type: "integer", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    EventId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CorrelationId = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_file_attachments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "number_sequences",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    sequence_code = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    sequence_date = table.Column<DateOnly>(type: "date", nullable: true),
                    prefix = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    current_number = table.Column<long>(type: "bigint", nullable: false),
                    padding_length = table.Column<int>(type: "integer", nullable: false),
                    reset_frequency = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    correlation_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_number_sequences", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "payments",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    booking_id = table.Column<Guid>(type: "uuid", nullable: false),
                    payment_reference_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    payment_mode = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    payer_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    payer_bank = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    amount_paid = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    payment_date = table.Column<DateOnly>(type: "date", nullable: false),
                    payment_received_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    bank_account_matched = table.Column<bool>(type: "boolean", nullable: false),
                    payment_proof_file_id = table.Column<Guid>(type: "uuid", nullable: true),
                    verification_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    verified_by = table.Column<Guid>(type: "uuid", nullable: true),
                    verified_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    rejection_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    remarks = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ReceiptNumber = table.Column<string>(type: "text", nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    correlation_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payments", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "permissions",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    permission_code = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    permission_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    module_name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    action_name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    description = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    correlation_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_permissions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "proforma_invoices",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    booking_id = table.Column<Guid>(type: "uuid", nullable: false),
                    invoice_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TaxInvoiceNumber = table.Column<string>(type: "text", nullable: true),
                    invoice_date = table.Column<DateOnly>(type: "date", nullable: false),
                    invoice_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    seller_legal_name = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    seller_address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    seller_gstin = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    seller_pan = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    buyer_legal_name = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    buyer_address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    buyer_gstin = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    buyer_pan = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    place_of_supply = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    stall_number = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    stall_size_display = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    hsn_sac = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    base_amount = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    gst_percentage = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    gst_amount = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    total_amount = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    amount_in_words = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    tax_amount_in_words = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    bank_account_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    bank_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    bank_account_number = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    ifsc_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    branch_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    pdf_file_id = table.Column<Guid>(type: "uuid", nullable: true),
                    generated_by = table.Column<Guid>(type: "uuid", nullable: false),
                    generated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    sent_by = table.Column<Guid>(type: "uuid", nullable: true),
                    sent_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    correlation_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_proforma_invoices", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "role_permissions",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    role_id = table.Column<Guid>(type: "uuid", nullable: false),
                    permission_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    correlation_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_role_permissions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "roles",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    role_code = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    role_name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    description = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    is_system_role = table.Column<bool>(type: "boolean", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    correlation_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_roles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "stall_allocations",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    booking_id = table.Column<Guid>(type: "uuid", nullable: false),
                    stall_id = table.Column<Guid>(type: "uuid", nullable: false),
                    allocation_status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    blocked_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    blocked_by = table.Column<Guid>(type: "uuid", nullable: false),
                    block_expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    frozen_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    frozen_by = table.Column<Guid>(type: "uuid", nullable: true),
                    released_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    released_by = table.Column<Guid>(type: "uuid", nullable: true),
                    release_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    previous_stall_id = table.Column<Guid>(type: "uuid", nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    correlation_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stall_allocations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "stall_bookings",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    exhibitor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    billing_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    requested_stall_size_id = table.Column<Guid>(type: "uuid", nullable: false),
                    allocated_stall_id = table.Column<Guid>(type: "uuid", nullable: true),
                    booking_registration_number = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    booking_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    booking_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    fascia_name = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: false),
                    display_notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    electrical_requirement = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    special_requirement = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    hazardous_demo_declared = table.Column<bool>(type: "boolean", nullable: false),
                    terms_accepted = table.Column<bool>(type: "boolean", nullable: false),
                    accuracy_accepted = table.Column<bool>(type: "boolean", nullable: false),
                    payment_timeline_accepted = table.Column<bool>(type: "boolean", nullable: false),
                    cancellation_policy_accepted = table.Column<bool>(type: "boolean", nullable: false),
                    privacy_consent_accepted = table.Column<bool>(type: "boolean", nullable: false),
                    declarant_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    declarant_designation = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    declaration_date = table.Column<DateOnly>(type: "date", nullable: false),
                    block_expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    last_email_sent_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    confirmed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    cancelled_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    cancellation_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    correlation_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stall_bookings", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "stall_sizes",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    display_name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    width_m = table.Column<decimal>(type: "numeric(8,2)", precision: 8, scale: 2, nullable: false),
                    depth_m = table.Column<decimal>(type: "numeric(8,2)", precision: 8, scale: 2, nullable: false),
                    area_sq_m = table.Column<decimal>(type: "numeric(8,2)", precision: 8, scale: 2, nullable: false),
                    base_amount = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    gst_percentage = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    total_amount = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    correlation_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stall_sizes", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tenants",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    legal_name = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    gstin = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    pan = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    state = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    pincode = table.Column<string>(type: "character varying(12)", maxLength: 12, nullable: false),
                    email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    phone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    correlation_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tenants", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "user_roles",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role_id = table.Column<Guid>(type: "uuid", nullable: false),
                    valid_from = table.Column<DateOnly>(type: "date", nullable: false),
                    valid_to = table.Column<DateOnly>(type: "date", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    correlation_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_roles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    full_name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    mobile = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    password_hash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    last_login_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    failed_login_count = table.Column<int>(type: "integer", nullable: false),
                    locked_until = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    correlation_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "stalls",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    stall_size_id = table.Column<Guid>(type: "uuid", nullable: false),
                    stall_number = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    hall_name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    zone_name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    row_label = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    floor_label = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    layout_x = table.Column<int>(type: "integer", nullable: true),
                    layout_y = table.Column<int>(type: "integer", nullable: true),
                    current_status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    current_booking_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    correlation_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stalls", x => x.id);
                    table.ForeignKey(
                        name: "FK_stalls_stall_sizes_stall_size_id",
                        column: x => x.stall_size_id,
                        principalSchema: "public",
                        principalTable: "stall_sizes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_occurred_at",
                schema: "public",
                table: "audit_logs",
                column: "occurred_at");

            migrationBuilder.CreateIndex(
                name: "IX_billing_profiles_exhibitor_id",
                schema: "public",
                table: "billing_profiles",
                column: "exhibitor_id");

            migrationBuilder.CreateIndex(
                name: "IX_email_logs_booking_id",
                schema: "public",
                table: "email_logs",
                column: "booking_id");

            migrationBuilder.CreateIndex(
                name: "IX_email_logs_template_code",
                schema: "public",
                table: "email_logs",
                column: "template_code");

            migrationBuilder.CreateIndex(
                name: "IX_events_tenant_id_event_code",
                schema: "public",
                table: "events",
                columns: new[] { "tenant_id", "event_code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_exhibitors_tenant_id_email",
                schema: "public",
                table: "exhibitors",
                columns: new[] { "tenant_id", "email" });

            migrationBuilder.CreateIndex(
                name: "IX_exhibitors_tenant_id_gstin",
                schema: "public",
                table: "exhibitors",
                columns: new[] { "tenant_id", "gstin" });

            migrationBuilder.CreateIndex(
                name: "IX_exhibitors_tenant_id_pan",
                schema: "public",
                table: "exhibitors",
                columns: new[] { "tenant_id", "pan" });

            migrationBuilder.CreateIndex(
                name: "IX_number_sequences_tenant_id_event_id_sequence_code",
                schema: "public",
                table: "number_sequences",
                columns: new[] { "tenant_id", "event_id", "sequence_code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_payments_booking_id",
                schema: "public",
                table: "payments",
                column: "booking_id");

            migrationBuilder.CreateIndex(
                name: "IX_payments_event_id_payment_reference_number",
                schema: "public",
                table: "payments",
                columns: new[] { "event_id", "payment_reference_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_payments_verification_status",
                schema: "public",
                table: "payments",
                column: "verification_status");

            migrationBuilder.CreateIndex(
                name: "IX_permissions_permission_code",
                schema: "public",
                table: "permissions",
                column: "permission_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_proforma_invoices_booking_id",
                schema: "public",
                table: "proforma_invoices",
                column: "booking_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_proforma_invoices_event_id_invoice_status",
                schema: "public",
                table: "proforma_invoices",
                columns: new[] { "event_id", "invoice_status" });

            migrationBuilder.CreateIndex(
                name: "IX_proforma_invoices_invoice_number",
                schema: "public",
                table: "proforma_invoices",
                column: "invoice_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_role_permissions_role_id_permission_id",
                schema: "public",
                table: "role_permissions",
                columns: new[] { "role_id", "permission_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_roles_tenant_id_role_code",
                schema: "public",
                table: "roles",
                columns: new[] { "tenant_id", "role_code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_stall_allocations_booking_id",
                schema: "public",
                table: "stall_allocations",
                column: "booking_id");

            migrationBuilder.CreateIndex(
                name: "IX_stall_allocations_event_id_allocation_status",
                schema: "public",
                table: "stall_allocations",
                columns: new[] { "event_id", "allocation_status" });

            migrationBuilder.CreateIndex(
                name: "IX_stall_allocations_stall_id",
                schema: "public",
                table: "stall_allocations",
                column: "stall_id");

            migrationBuilder.CreateIndex(
                name: "IX_stall_bookings_block_expires_at",
                schema: "public",
                table: "stall_bookings",
                column: "block_expires_at");

            migrationBuilder.CreateIndex(
                name: "IX_stall_bookings_booking_registration_number",
                schema: "public",
                table: "stall_bookings",
                column: "booking_registration_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_stall_bookings_event_id_booking_status",
                schema: "public",
                table: "stall_bookings",
                columns: new[] { "event_id", "booking_status" });

            migrationBuilder.CreateIndex(
                name: "IX_stall_sizes_event_id_code",
                schema: "public",
                table: "stall_sizes",
                columns: new[] { "event_id", "code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_stalls_current_booking_id",
                schema: "public",
                table: "stalls",
                column: "current_booking_id");

            migrationBuilder.CreateIndex(
                name: "IX_stalls_current_status",
                schema: "public",
                table: "stalls",
                column: "current_status");

            migrationBuilder.CreateIndex(
                name: "IX_stalls_event_id_stall_number",
                schema: "public",
                table: "stalls",
                columns: new[] { "event_id", "stall_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_stalls_stall_size_id",
                schema: "public",
                table: "stalls",
                column: "stall_size_id");

            migrationBuilder.CreateIndex(
                name: "IX_tenants_code",
                schema: "public",
                table: "tenants",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_roles_user_id_role_id",
                schema: "public",
                table: "user_roles",
                columns: new[] { "user_id", "role_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_tenant_id_email",
                schema: "public",
                table: "users",
                columns: new[] { "tenant_id", "email" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_logs",
                schema: "public");

            migrationBuilder.DropTable(
                name: "billing_profiles",
                schema: "public");

            migrationBuilder.DropTable(
                name: "dashboard_snapshots",
                schema: "public");

            migrationBuilder.DropTable(
                name: "email_logs",
                schema: "public");

            migrationBuilder.DropTable(
                name: "email_templates",
                schema: "public");

            migrationBuilder.DropTable(
                name: "events",
                schema: "public");

            migrationBuilder.DropTable(
                name: "exhibitors",
                schema: "public");

            migrationBuilder.DropTable(
                name: "file_attachments",
                schema: "public");

            migrationBuilder.DropTable(
                name: "number_sequences",
                schema: "public");

            migrationBuilder.DropTable(
                name: "payments",
                schema: "public");

            migrationBuilder.DropTable(
                name: "permissions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "proforma_invoices",
                schema: "public");

            migrationBuilder.DropTable(
                name: "role_permissions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "roles",
                schema: "public");

            migrationBuilder.DropTable(
                name: "stall_allocations",
                schema: "public");

            migrationBuilder.DropTable(
                name: "stall_bookings",
                schema: "public");

            migrationBuilder.DropTable(
                name: "stalls",
                schema: "public");

            migrationBuilder.DropTable(
                name: "tenants",
                schema: "public");

            migrationBuilder.DropTable(
                name: "user_roles",
                schema: "public");

            migrationBuilder.DropTable(
                name: "users",
                schema: "public");

            migrationBuilder.DropTable(
                name: "stall_sizes",
                schema: "public");
        }
    }
}
