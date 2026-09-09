using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSME.StallBooking.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SellerRequirement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CapabilityType",
                schema: "public",
                table: "seller_capabilities",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Designation",
                schema: "public",
                table: "seller_capabilities",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "MobileCode",
                schema: "public",
                table: "seller_capabilities",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "MobileNumber",
                schema: "public",
                table: "seller_capabilities",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CapabilityType",
                schema: "public",
                table: "seller_capabilities");

            migrationBuilder.DropColumn(
                name: "Designation",
                schema: "public",
                table: "seller_capabilities");

            migrationBuilder.DropColumn(
                name: "MobileCode",
                schema: "public",
                table: "seller_capabilities");

            migrationBuilder.DropColumn(
                name: "MobileNumber",
                schema: "public",
                table: "seller_capabilities");
        }
    }
}
