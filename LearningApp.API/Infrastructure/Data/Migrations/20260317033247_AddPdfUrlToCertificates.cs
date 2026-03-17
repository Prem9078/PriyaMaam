using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearningApp.API.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPdfUrlToCertificates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PdfUrl",
                table: "Certificates",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PdfUrl",
                table: "Certificates");
        }
    }
}
