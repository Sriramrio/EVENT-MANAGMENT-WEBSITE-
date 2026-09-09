using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSME.StallBooking.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class VisitorMark : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CheckedInAt",
                schema: "public",
                table: "Visitors",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CheckedInBy",
                schema: "public",
                table: "Visitors",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPresent",
                schema: "public",
                table: "Visitors",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CheckedInAt",
                schema: "public",
                table: "Visitors");

            migrationBuilder.DropColumn(
                name: "CheckedInBy",
                schema: "public",
                table: "Visitors");

            migrationBuilder.DropColumn(
                name: "IsPresent",
                schema: "public",
                table: "Visitors");
        }
    }
}
