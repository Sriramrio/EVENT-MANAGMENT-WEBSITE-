using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSME.StallBooking.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class NewFieldPayment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
          

            migrationBuilder.AddColumn<string>(
                name: "gstAmount",
                schema: "public",
                table: "payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "gstType",
                schema: "public",
                table: "payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "isGstApplicable",
                schema: "public",
                table: "payments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "isTdsDeductable",
                schema: "public",
                table: "payments",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
          

            migrationBuilder.DropColumn(
                name: "gstAmount",
                schema: "public",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "gstType",
                schema: "public",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "isGstApplicable",
                schema: "public",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "isTdsDeductable",
                schema: "public",
                table: "payments");
        }
    }
}
