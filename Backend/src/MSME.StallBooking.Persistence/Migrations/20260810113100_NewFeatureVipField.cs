using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSME.StallBooking.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class NewFeatureVipField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CheckedInAt",
                schema: "public",
                table: "Vip",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CheckedInBy",
                schema: "public",
                table: "Vip",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Designation",
                schema: "public",
                table: "Vip",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPresent",
                schema: "public",
                table: "Vip",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                schema: "public",
                table: "Vip",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Organization",
                schema: "public",
                table: "Vip",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RegistrationNumber",
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
                name: "CheckedInAt",
                schema: "public",
                table: "Vip");

            migrationBuilder.DropColumn(
                name: "CheckedInBy",
                schema: "public",
                table: "Vip");

            migrationBuilder.DropColumn(
                name: "Designation",
                schema: "public",
                table: "Vip");

            migrationBuilder.DropColumn(
                name: "IsPresent",
                schema: "public",
                table: "Vip");

            migrationBuilder.DropColumn(
                name: "Name",
                schema: "public",
                table: "Vip");

            migrationBuilder.DropColumn(
                name: "Organization",
                schema: "public",
                table: "Vip");

            migrationBuilder.DropColumn(
                name: "RegistrationNumber",
                schema: "public",
                table: "Vip");
        }
    }
}
