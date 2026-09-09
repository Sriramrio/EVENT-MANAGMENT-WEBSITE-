using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSME.StallBooking.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class NewFeatureTargetField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "TanNumber",
                schema: "public",
                table: "exhibitors",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "TanNumber",
                schema: "public",
                table: "exhibitors",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(10)",
                oldMaxLength: 10);
        }
    }
}
