using System;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSME.StallBooking.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class hsn_sacmasterclasss : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AttributeDefinitions",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AttributeCode = table.Column<string>(type: "text", nullable: false),
                    AttributeLabel = table.Column<string>(type: "text", nullable: false),
                    DataType = table.Column<string>(type: "text", nullable: false),
                    UnitFamily = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    SourceStatus = table.Column<string>(type: "text", nullable: false),
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
                    table.PrimaryKey("PK_AttributeDefinitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MainCategories",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MainCategoryCode = table.Column<string>(type: "text", nullable: false),
                    MainCategoryName = table.Column<string>(type: "text", nullable: false),
                    CategoryType = table.Column<string>(type: "text", nullable: false),
                    RelevantHsnSacPrefix = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    UploadedReferenceRows = table.Column<int>(type: "integer", nullable: false),
                    SourceCoverageStatus = table.Column<string>(type: "text", nullable: true),
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
                    table.PrimaryKey("PK_MainCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OperationDefinitions",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OperationCode = table.Column<string>(type: "text", nullable: false),
                    OperationName = table.Column<string>(type: "text", nullable: false),
                    OperationFamily = table.Column<string>(type: "text", nullable: true),
                    OperationType = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
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
                    table.PrimaryKey("PK_OperationDefinitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "QualityComplianceDefinitions",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    QcCode = table.Column<string>(type: "text", nullable: false),
                    QcName = table.Column<string>(type: "text", nullable: false),
                    QcType = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    GovernanceStatus = table.Column<string>(type: "text", nullable: false),
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
                    table.PrimaryKey("PK_QualityComplianceDefinitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Segments",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SegmentCode = table.Column<string>(type: "text", nullable: false),
                    SegmentName = table.Column<string>(type: "text", nullable: false),
                    UploadedSourceRows = table.Column<int>(type: "integer", nullable: false),
                    GovernanceNotes = table.Column<string>(type: "text", nullable: true),
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
                    table.PrimaryKey("PK_Segments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TagTypes",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TagTypeCode = table.Column<string>(type: "text", nullable: false),
                    TagTypeName = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("PK_TagTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Uoms",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UomCode = table.Column<string>(type: "text", nullable: false),
                    UomName = table.Column<string>(type: "text", nullable: false),
                    Symbol = table.Column<string>(type: "text", nullable: false),
                    UnitFamily = table.Column<string>(type: "text", nullable: true),
                    SourceStatus = table.Column<string>(type: "text", nullable: false),
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
                    table.PrimaryKey("PK_Uoms", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Classifications",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RecordId = table.Column<string>(type: "text", nullable: false),
                    MainCategoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubCategory = table.Column<string>(type: "text", nullable: false),
                    ClassType = table.Column<string>(type: "text", nullable: false),
                    CodeSystem = table.Column<string>(type: "text", nullable: false),
                    BaselineCode = table.Column<string>(type: "text", nullable: false),
                    BaselineClassificationName = table.Column<string>(type: "text", nullable: false),
                    MatchingKeywords = table.Column<string>(type: "text", nullable: true),
                    CodeLength = table.Column<short>(type: "smallint", nullable: false),
                    TypeSystemCheck = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    GstValidationStatus = table.Column<string>(type: "text", nullable: true),
                    GovernanceNotes = table.Column<string>(type: "text", nullable: true),
                    PortalSegmentCodes = table.Column<string>(type: "text", nullable: true),
                    SourceMainCategory = table.Column<string>(type: "text", nullable: true),
                    SourceSubCategory = table.Column<string>(type: "text", nullable: true),
                    SourceCode6OrHeading = table.Column<string>(type: "text", nullable: true),
                    SourceCode8 = table.Column<string>(type: "text", nullable: true),
                    SourceFile = table.Column<string>(type: "text", nullable: true),
                    SourceRow = table.Column<int>(type: "integer", nullable: true),
                    DuplicateUsageStatus = table.Column<string>(type: "text", nullable: true),
                    ReconciliationAction = table.Column<string>(type: "text", nullable: true),
                    SourceVerificationStatus = table.Column<string>(type: "text", nullable: true),
                    ParentCodeCoverageStatus = table.Column<string>(type: "text", nullable: true),
                    OriginalCode = table.Column<string>(type: "text", nullable: true),
                    OriginalClassificationName = table.Column<string>(type: "text", nullable: true),
                    VerifiedCode = table.Column<string>(type: "text", nullable: false),
                    VerifiedClassificationName = table.Column<string>(type: "text", nullable: false),
                    VerificationAction = table.Column<string>(type: "text", nullable: false),
                    VerificationStatus = table.Column<string>(type: "text", nullable: false),
                    TaxUseStatus = table.Column<string>(type: "text", nullable: false),
                    VerificationAuthority = table.Column<string>(type: "text", nullable: false),
                    AuthorityUrl = table.Column<string>(type: "text", nullable: true),
                    CorrectionReason = table.Column<string>(type: "text", nullable: true),
                    VerifiedAsOf = table.Column<DateOnly>(type: "date", nullable: false),
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
                    table.PrimaryKey("PK_Classifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Classifications_MainCategories_MainCategoryId",
                        column: x => x.MainCategoryId,
                        principalSchema: "public",
                        principalTable: "MainCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SegmentMainCategories",
                schema: "public",
                columns: table => new
                {
                    SegmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    MainCategoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceBasis = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SegmentMainCategories", x => new { x.SegmentId, x.MainCategoryId });
                    table.ForeignKey(
                        name: "FK_SegmentMainCategories_MainCategories_MainCategoryId",
                        column: x => x.MainCategoryId,
                        principalSchema: "public",
                        principalTable: "MainCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SegmentMainCategories_Segments_SegmentId",
                        column: x => x.SegmentId,
                        principalSchema: "public",
                        principalTable: "Segments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tags",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TagCode = table.Column<string>(type: "text", nullable: false),
                    TagName = table.Column<string>(type: "text", nullable: false),
                    TagTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    TagGroup = table.Column<string>(type: "text", nullable: true),
                    CanonicalName = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    BuyerApplicable = table.Column<bool>(type: "boolean", nullable: false),
                    SellerApplicable = table.Column<bool>(type: "boolean", nullable: false),
                    SourceStatus = table.Column<string>(type: "text", nullable: false),
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
                    table.PrimaryKey("PK_Tags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tags_TagTypes_TagTypeId",
                        column: x => x.TagTypeId,
                        principalSchema: "public",
                        principalTable: "TagTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AttributeAllowedUoms",
                schema: "public",
                columns: table => new
                {
                    AttributeId = table.Column<Guid>(type: "uuid", nullable: false),
                    UomId = table.Column<Guid>(type: "uuid", nullable: false),
                    AttributeDefinitionId = table.Column<Guid>(type: "uuid", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttributeAllowedUoms", x => new { x.AttributeId, x.UomId });
                    table.ForeignKey(
                        name: "FK_AttributeAllowedUoms_AttributeDefinitions_AttributeDefiniti~",
                        column: x => x.AttributeDefinitionId,
                        principalSchema: "public",
                        principalTable: "AttributeDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AttributeAllowedUoms_Uoms_UomId",
                        column: x => x.UomId,
                        principalSchema: "public",
                        principalTable: "Uoms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClassificationAttributes",
                schema: "public",
                columns: table => new
                {
                    ClassificationId = table.Column<Guid>(type: "uuid", nullable: false),
                    AttributeId = table.Column<Guid>(type: "uuid", nullable: false),
                    BuyerApplicable = table.Column<bool>(type: "boolean", nullable: false),
                    SellerApplicable = table.Column<bool>(type: "boolean", nullable: false),
                    MandatoryLevel = table.Column<string>(type: "text", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    SuggestedFromClassification = table.Column<bool>(type: "boolean", nullable: false),
                    ConditionText = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassificationAttributes", x => new { x.ClassificationId, x.AttributeId });
                    table.ForeignKey(
                        name: "FK_ClassificationAttributes_AttributeDefinitions_AttributeId",
                        column: x => x.AttributeId,
                        principalSchema: "public",
                        principalTable: "AttributeDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClassificationAttributes_Classifications_ClassificationId",
                        column: x => x.ClassificationId,
                        principalSchema: "public",
                        principalTable: "Classifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClassificationExceptions",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassificationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Severity = table.Column<string>(type: "text", nullable: false),
                    OriginalCode = table.Column<string>(type: "text", nullable: true),
                    VerifiedCode = table.Column<string>(type: "text", nullable: false),
                    VerificationAction = table.Column<string>(type: "text", nullable: false),
                    TaxUseStatus = table.Column<string>(type: "text", nullable: false),
                    OriginalDescription = table.Column<string>(type: "text", nullable: true),
                    VerifiedDescription = table.Column<string>(type: "text", nullable: true),
                    CorrectionReason = table.Column<string>(type: "text", nullable: false),
                    Authority = table.Column<string>(type: "text", nullable: false),
                    AuthorityUrl = table.Column<string>(type: "text", nullable: true),
                    ResolutionStatus = table.Column<string>(type: "text", nullable: false),
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
                    table.PrimaryKey("PK_ClassificationExceptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassificationExceptions_Classifications_ClassificationId",
                        column: x => x.ClassificationId,
                        principalSchema: "public",
                        principalTable: "Classifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClassificationOperations",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassificationId = table.Column<Guid>(type: "uuid", nullable: false),
                    RouteVariantCode = table.Column<string>(type: "text", nullable: false),
                    SequenceNo = table.Column<int>(type: "integer", nullable: false),
                    OperationNo = table.Column<int>(type: "integer", nullable: false),
                    OperationId = table.Column<Guid>(type: "uuid", nullable: false),
                    StageType = table.Column<string>(type: "text", nullable: false),
                    Applicability = table.Column<string>(type: "text", nullable: false),
                    MandatoryLevel = table.Column<string>(type: "text", nullable: false),
                    ConditionText = table.Column<string>(type: "text", nullable: true),
                    InputRequirement = table.Column<string>(type: "text", nullable: true),
                    OutputResult = table.Column<string>(type: "text", nullable: true),
                    QualityGateAfter = table.Column<bool>(type: "boolean", nullable: false),
                    InspectionTagId = table.Column<Guid>(type: "uuid", nullable: true),
                    RecommendedMachineTagId = table.Column<Guid>(type: "uuid", nullable: true),
                    BuyerVisible = table.Column<bool>(type: "boolean", nullable: false),
                    SellerVisible = table.Column<bool>(type: "boolean", nullable: false),
                    MatchingRelevant = table.Column<bool>(type: "boolean", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("PK_ClassificationOperations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassificationOperations_Classifications_ClassificationId",
                        column: x => x.ClassificationId,
                        principalSchema: "public",
                        principalTable: "Classifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClassificationOperations_OperationDefinitions_OperationId",
                        column: x => x.OperationId,
                        principalSchema: "public",
                        principalTable: "OperationDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClassificationQualityCompliances",
                schema: "public",
                columns: table => new
                {
                    ClassificationId = table.Column<Guid>(type: "uuid", nullable: false),
                    QualityComplianceId = table.Column<Guid>(type: "uuid", nullable: false),
                    QcTypeSnapshot = table.Column<string>(type: "text", nullable: false),
                    UiBehaviour = table.Column<string>(type: "text", nullable: false),
                    MandatoryStatus = table.Column<string>(type: "text", nullable: false),
                    ConditionText = table.Column<string>(type: "text", nullable: true),
                    ConfidenceScore = table.Column<decimal>(type: "numeric", nullable: false),
                    SourceBasis = table.Column<string>(type: "text", nullable: false),
                    GovernanceNote = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassificationQualityCompliances", x => new { x.ClassificationId, x.QualityComplianceId });
                    table.ForeignKey(
                        name: "FK_ClassificationQualityCompliances_Classifications_Classifica~",
                        column: x => x.ClassificationId,
                        principalSchema: "public",
                        principalTable: "Classifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClassificationQualityCompliances_QualityComplianceDefinitio~",
                        column: x => x.QualityComplianceId,
                        principalSchema: "public",
                        principalTable: "QualityComplianceDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClassificationSegments",
                schema: "public",
                columns: table => new
                {
                    ClassificationId = table.Column<Guid>(type: "uuid", nullable: false),
                    SegmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceBasis = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassificationSegments", x => new { x.ClassificationId, x.SegmentId });
                    table.ForeignKey(
                        name: "FK_ClassificationSegments_Classifications_ClassificationId",
                        column: x => x.ClassificationId,
                        principalSchema: "public",
                        principalTable: "Classifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClassificationSegments_Segments_SegmentId",
                        column: x => x.SegmentId,
                        principalSchema: "public",
                        principalTable: "Segments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClassificationUoms",
                schema: "public",
                columns: table => new
                {
                    ClassificationId = table.Column<Guid>(type: "uuid", nullable: false),
                    UomId = table.Column<Guid>(type: "uuid", nullable: false),
                    PreferenceRank = table.Column<short>(type: "smallint", nullable: false),
                    DefaultUom = table.Column<bool>(type: "boolean", nullable: false),
                    BuyerApplicable = table.Column<bool>(type: "boolean", nullable: false),
                    SellerApplicable = table.Column<bool>(type: "boolean", nullable: false),
                    ConditionText = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassificationUoms", x => new { x.ClassificationId, x.UomId });
                    table.ForeignKey(
                        name: "FK_ClassificationUoms_Classifications_ClassificationId",
                        column: x => x.ClassificationId,
                        principalSchema: "public",
                        principalTable: "Classifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClassificationUoms_Uoms_UomId",
                        column: x => x.UomId,
                        principalSchema: "public",
                        principalTable: "Uoms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BuyerRequirementTags",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BuyerRequirementId = table.Column<Guid>(type: "uuid", nullable: false),
                    TagId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceType = table.Column<string>(type: "text", nullable: false),
                    SuggestedFromClassification = table.Column<bool>(type: "boolean", nullable: false),
                    UserSelected = table.Column<bool>(type: "boolean", nullable: false),
                    MatchRelevant = table.Column<bool>(type: "boolean", nullable: false),
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
                    table.PrimaryKey("PK_BuyerRequirementTags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BuyerRequirementTags_Tags_TagId",
                        column: x => x.TagId,
                        principalSchema: "public",
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ClassificationTags",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassificationId = table.Column<Guid>(type: "uuid", nullable: false),
                    TagId = table.Column<Guid>(type: "uuid", nullable: false),
                    ApplicabilityRole = table.Column<string>(type: "text", nullable: false),
                    RelationshipType = table.Column<string>(type: "text", nullable: false),
                    UiBehaviour = table.Column<string>(type: "text", nullable: false),
                    ConfidenceScore = table.Column<decimal>(type: "numeric", nullable: false),
                    RelevanceWeight = table.Column<decimal>(type: "numeric", nullable: false),
                    DefaultSelected = table.Column<bool>(type: "boolean", nullable: false),
                    EditableByUser = table.Column<bool>(type: "boolean", nullable: false),
                    MandatoryStatus = table.Column<string>(type: "text", nullable: false),
                    ConditionText = table.Column<string>(type: "text", nullable: true),
                    ConditionJson = table.Column<JsonDocument>(type: "jsonb", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    SourceBasis = table.Column<string>(type: "text", nullable: false),
                    VerificationStatus = table.Column<string>(type: "text", nullable: false),
                    GovernanceNote = table.Column<string>(type: "text", nullable: true),
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
                    table.PrimaryKey("PK_ClassificationTags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassificationTags_Classifications_ClassificationId",
                        column: x => x.ClassificationId,
                        principalSchema: "public",
                        principalTable: "Classifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClassificationTags_Tags_TagId",
                        column: x => x.TagId,
                        principalSchema: "public",
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SellerCapabilityTags",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SellerCapabilityId = table.Column<Guid>(type: "uuid", nullable: false),
                    TagId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceType = table.Column<string>(type: "text", nullable: false),
                    SuggestedFromClassification = table.Column<bool>(type: "boolean", nullable: false),
                    UserSelected = table.Column<bool>(type: "boolean", nullable: false),
                    MatchRelevant = table.Column<bool>(type: "boolean", nullable: false),
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
                    table.PrimaryKey("PK_SellerCapabilityTags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SellerCapabilityTags_Tags_TagId",
                        column: x => x.TagId,
                        principalSchema: "public",
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TagAliases",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TagId = table.Column<Guid>(type: "uuid", nullable: false),
                    Alias = table.Column<string>(type: "text", nullable: false),
                    NormalizedAlias = table.Column<string>(type: "text", nullable: false),
                    AliasType = table.Column<string>(type: "text", nullable: true),
                    Source = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
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
                    table.PrimaryKey("PK_TagAliases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TagAliases_Tags_TagId",
                        column: x => x.TagId,
                        principalSchema: "public",
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AttributeAllowedUoms_AttributeDefinitionId",
                schema: "public",
                table: "AttributeAllowedUoms",
                column: "AttributeDefinitionId");

            migrationBuilder.CreateIndex(
                name: "IX_AttributeAllowedUoms_UomId",
                schema: "public",
                table: "AttributeAllowedUoms",
                column: "UomId");

            migrationBuilder.CreateIndex(
                name: "IX_BuyerRequirementTags_TagId",
                schema: "public",
                table: "BuyerRequirementTags",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassificationAttributes_AttributeId",
                schema: "public",
                table: "ClassificationAttributes",
                column: "AttributeId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassificationExceptions_ClassificationId",
                schema: "public",
                table: "ClassificationExceptions",
                column: "ClassificationId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassificationOperations_ClassificationId",
                schema: "public",
                table: "ClassificationOperations",
                column: "ClassificationId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassificationOperations_OperationId",
                schema: "public",
                table: "ClassificationOperations",
                column: "OperationId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassificationQualityCompliances_QualityComplianceId",
                schema: "public",
                table: "ClassificationQualityCompliances",
                column: "QualityComplianceId");

            migrationBuilder.CreateIndex(
                name: "IX_Classifications_MainCategoryId",
                schema: "public",
                table: "Classifications",
                column: "MainCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassificationSegments_SegmentId",
                schema: "public",
                table: "ClassificationSegments",
                column: "SegmentId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassificationTags_ClassificationId",
                schema: "public",
                table: "ClassificationTags",
                column: "ClassificationId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassificationTags_TagId",
                schema: "public",
                table: "ClassificationTags",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassificationUoms_UomId",
                schema: "public",
                table: "ClassificationUoms",
                column: "UomId");

            migrationBuilder.CreateIndex(
                name: "IX_SegmentMainCategories_MainCategoryId",
                schema: "public",
                table: "SegmentMainCategories",
                column: "MainCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_SellerCapabilityTags_TagId",
                schema: "public",
                table: "SellerCapabilityTags",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_TagAliases_TagId",
                schema: "public",
                table: "TagAliases",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_Tags_TagTypeId",
                schema: "public",
                table: "Tags",
                column: "TagTypeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AttributeAllowedUoms",
                schema: "public");

            migrationBuilder.DropTable(
                name: "BuyerRequirementTags",
                schema: "public");

            migrationBuilder.DropTable(
                name: "ClassificationAttributes",
                schema: "public");

            migrationBuilder.DropTable(
                name: "ClassificationExceptions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "ClassificationOperations",
                schema: "public");

            migrationBuilder.DropTable(
                name: "ClassificationQualityCompliances",
                schema: "public");

            migrationBuilder.DropTable(
                name: "ClassificationSegments",
                schema: "public");

            migrationBuilder.DropTable(
                name: "ClassificationTags",
                schema: "public");

            migrationBuilder.DropTable(
                name: "ClassificationUoms",
                schema: "public");

            migrationBuilder.DropTable(
                name: "SegmentMainCategories",
                schema: "public");

            migrationBuilder.DropTable(
                name: "SellerCapabilityTags",
                schema: "public");

            migrationBuilder.DropTable(
                name: "TagAliases",
                schema: "public");

            migrationBuilder.DropTable(
                name: "AttributeDefinitions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "OperationDefinitions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "QualityComplianceDefinitions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "Classifications",
                schema: "public");

            migrationBuilder.DropTable(
                name: "Uoms",
                schema: "public");

            migrationBuilder.DropTable(
                name: "Segments",
                schema: "public");

            migrationBuilder.DropTable(
                name: "Tags",
                schema: "public");

            migrationBuilder.DropTable(
                name: "MainCategories",
                schema: "public");

            migrationBuilder.DropTable(
                name: "TagTypes",
                schema: "public");
        }
    }
}
