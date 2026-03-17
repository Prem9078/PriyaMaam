using System;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using LearningApp.API.Application.Services;

namespace LearningApp.API.Infrastructure.Services
{
    public class CertificateGeneratorService : ICertificateGeneratorService
    {
        public CertificateGeneratorService()
        {
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public byte[] GenerateCertificate(string studentName, string courseTitle, DateTime issueDate, string certificateId)
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(20).FontFamily(Fonts.Arial));

                    page.Content().Border(5).BorderColor("#4B42D6").Padding(1, Unit.Centimetre).Column(col =>
                    {
                        col.Spacing(20);

                        col.Item().AlignCenter().Text("CERTIFICATE OF COMPLETION").SemiBold().FontSize(40).FontColor("#4B42D6");
                        col.Item().AlignCenter().Text("This is to certify that").FontSize(25);
                        col.Item().AlignCenter().Text(studentName).Bold().FontSize(35).FontColor(Colors.Black);
                        col.Item().AlignCenter().Text("has successfully completed the course").FontSize(25);
                        col.Item().AlignCenter().Text(courseTitle).Bold().FontSize(30).FontColor("#F5A623");
                        
                        col.Item().PaddingTop(30).Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text($"Date: {issueDate:dd MMM yyyy}").FontSize(18);
                                c.Item().Text($"ID: {certificateId}").FontSize(14).FontColor(Colors.Grey.Darken2);
                            });

                            row.RelativeItem().AlignRight().Column(c =>
                            {
                                c.Item().AlignCenter().Text("Priya Ma'am").FontFamily("Snell Roundhand").FontSize(30).FontColor("#4B42D6");
                                c.Item().AlignCenter().Text("Course Instructor").FontSize(18);
                            });
                        });
                    });
                });
            });

            return document.GeneratePdf();
        }
    }
}
