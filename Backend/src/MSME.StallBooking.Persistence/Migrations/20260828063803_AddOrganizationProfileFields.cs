using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSME.StallBooking.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizationProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AnnualTurnover",
                schema: "public",
                table: "organizations",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BusinessType",
                schema: "public",
                table: "organizations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompanyWebsite",
                schema: "public",
                table: "organizations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Industry",
                schema: "public",
                table: "organizations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalEmployees",
                schema: "public",
                table: "organizations",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "YearOfEstablishment",
                schema: "public",
                table: "organizations",
                type: "integer",
                nullable: true);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnnualTurnover",
                schema: "public",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "BusinessType",
                schema: "public",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "CompanyWebsite",
                schema: "public",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "Industry",
                schema: "public",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "TotalEmployees",
                schema: "public",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "YearOfEstablishment",
                schema: "public",
                table: "organizations");

        }
    }
}
