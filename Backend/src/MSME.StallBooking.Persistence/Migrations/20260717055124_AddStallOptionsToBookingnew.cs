using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSME.StallBooking.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddStallOptionsToBookingnew : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "stall_option1_id",
                schema: "public",
                table: "stall_bookings",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "stall_option2_id",
                schema: "public",
                table: "stall_bookings",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_stall_bookings_stall_option1_id",
                schema: "public",
                table: "stall_bookings",
                column: "stall_option1_id");

            migrationBuilder.CreateIndex(
                name: "IX_stall_bookings_stall_option2_id",
                schema: "public",
                table: "stall_bookings",
                column: "stall_option2_id");

            migrationBuilder.AddForeignKey(
                name: "FK_stall_bookings_stalls_stall_option1_id",
                schema: "public",
                table: "stall_bookings",
                column: "stall_option1_id",
                principalSchema: "public",
                principalTable: "stalls",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_stall_bookings_stalls_stall_option2_id",
                schema: "public",
                table: "stall_bookings",
                column: "stall_option2_id",
                principalSchema: "public",
                principalTable: "stalls",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_stall_bookings_stalls_stall_option1_id",
                schema: "public",
                table: "stall_bookings");

            migrationBuilder.DropForeignKey(
                name: "FK_stall_bookings_stalls_stall_option2_id",
                schema: "public",
                table: "stall_bookings");

            migrationBuilder.DropIndex(
                name: "IX_stall_bookings_stall_option1_id",
                schema: "public",
                table: "stall_bookings");

            migrationBuilder.DropIndex(
                name: "IX_stall_bookings_stall_option2_id",
                schema: "public",
                table: "stall_bookings");

            migrationBuilder.DropColumn(
                name: "stall_option1_id",
                schema: "public",
                table: "stall_bookings");

            migrationBuilder.DropColumn(
                name: "stall_option2_id",
                schema: "public",
                table: "stall_bookings");
        }
    }
}
