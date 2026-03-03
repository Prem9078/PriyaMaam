using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearningApp.API.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddIsFreeToCourse : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsFree",
                table: "Courses",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsFree",
                table: "Courses");
        }
    }
}
