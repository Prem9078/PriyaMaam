using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearningApp.API.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExpoPushToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExpoPushToken",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExpoPushToken",
                table: "Users");
        }
    }
}
