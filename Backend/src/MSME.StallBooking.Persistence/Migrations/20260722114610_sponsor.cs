using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSME.StallBooking.Persistence.Migrations
{
    public partial class Sponsor : Migration
    {
        protected override void Up(
            MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE stalls
                ADD COLUMN IF NOT EXISTS
                is_sponsor boolean NOT NULL DEFAULT FALSE;
                """);
        }

        protected override void Down(
            MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE stalls
                DROP COLUMN IF EXISTS is_sponsor;
                """);
        }
    }
}