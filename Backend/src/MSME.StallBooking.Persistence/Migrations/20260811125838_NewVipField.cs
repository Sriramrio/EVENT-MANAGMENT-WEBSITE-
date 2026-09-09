using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSME.StallBooking.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class NewVipField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "City",
                schema: "public",
                table: "Vip",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "District",
                schema: "public",
                table: "Vip",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Pincode",
                schema: "public",
                table: "Vip",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RegisteredAddress",
                schema: "public",
                table: "Vip",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "State",
                schema: "public",
                table: "Vip",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "City",
                schema: "public",
                table: "Vip");

            migrationBuilder.DropColumn(
                name: "District",
                schema: "public",
                table: "Vip");

            migrationBuilder.DropColumn(
                name: "Pincode",
                schema: "public",
                table: "Vip");

            migrationBuilder.DropColumn(
                name: "RegisteredAddress",
                schema: "public",
                table: "Vip");

            migrationBuilder.DropColumn(
                name: "State",
                schema: "public",
                table: "Vip");
        }
    }
}
