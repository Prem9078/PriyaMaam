using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using LearningApp.API.Application.Services;
using LearningApp.API.Domain.Entities;
using LearningApp.API.Infrastructure.Data;
using LearningApp.API.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.API.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CertificatesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ICertificateGeneratorService _certificateGeneratorService;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly EmailService _emailService;
        private readonly INotificationService _notificationService;

        public CertificatesController(
            AppDbContext db,
            ICertificateGeneratorService certificateGeneratorService,
            ICloudinaryService cloudinaryService,
            EmailService emailService,
            INotificationService notificationService)
        {
            _db = db;
            _certificateGeneratorService = certificateGeneratorService;
            _cloudinaryService = cloudinaryService;
            _emailService = emailService;
            _notificationService = notificationService;
        }

        private Guid GetUserId() =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
                       ?? User.FindFirstValue("sub")!);

        /// <summary>Get all certificates earned by the currently logged-in user.</summary>
        [HttpGet]
        public async Task<IActionResult> GetMyCertificates()
        {
            var userId = GetUserId();
            
            // Auto-generate missing certificates for courses already completed
            await SyncMissingCertificatesAsync(userId);

            var certs = await _db.Certificates
                .Where(c => c.UserId == userId)
                .Include(c => c.Course)
                .OrderByDescending(c => c.IssuedAt)
                .Select(c => new
                {
                    c.Id,
                    c.CourseId,
                    courseTitle = c.Course.Title,
                    c.IssuedAt,
                    pdfUrl = c.PdfUrl
                })
                .ToListAsync();

            return Ok(certs);
        }

        private async Task SyncMissingCertificatesAsync(Guid userId)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return;

            // Get all courses the user is enrolled in
            var enrollments = await _db.Enrollments
                .Include(e => e.Course)
                .Where(e => e.UserId == userId)
                .ToListAsync();

            foreach (var enrollment in enrollments)
            {
                var courseId = enrollment.CourseId;

                // Check if user already has a valid `.pdf` certificate for this course
                var existingCert = await _db.Certificates
                    .FirstOrDefaultAsync(c => c.UserId == userId && c.CourseId == courseId);

                // If cert exists and already has the correct PDF extension, skip to save server load
                if (existingCert != null && !string.IsNullOrEmpty(existingCert.PdfUrl) && existingCert.PdfUrl.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase)) 
                {
                    continue;
                }

                var totalLessons = await _db.Lessons.CountAsync(l => l.CourseId == courseId);
                if (totalLessons == 0) continue;

                var completedLessons = await _db.LessonProgresses
                    .CountAsync(p => p.UserId == userId && p.Lesson.CourseId == courseId && p.IsCompleted);

                // If fully completed but no certificate exists
                if (completedLessons >= totalLessons)
                {
                    var courseTitle = enrollment.Course?.Title ?? "a course";
                    var userName = user.Name ?? "Student";
                    var certId = Guid.NewGuid().ToString().Substring(0, 8).ToUpper();

                    string pdfUrl = string.Empty;
                    try 
                    {
                        var pdfBytes = _certificateGeneratorService.GenerateCertificate(userName, courseTitle, DateTime.UtcNow, certId);
                        using var stream = new MemoryStream(pdfBytes);
                        var uploadResult = await _cloudinaryService.UploadPdfStreamAsync(stream, $"cert_{userId}_{courseId}_{certId}");
                        pdfUrl = uploadResult.SecureUrl;
                    }
                    catch (Exception ex)
                    {
                        // Skip if upload fails, will try again next time they visit Certificates
                        Console.WriteLine($"Error generating cert: {ex.Message}");
                        continue;
                    }

                    if (existingCert == null)
                    {
                        _db.Certificates.Add(new Certificate
                        {
                            UserId = userId,
                            CourseId = courseId,
                            PdfUrl = pdfUrl
                        });

                        // Only notify for completely new certificates, not background URL fixes
                        await _notificationService.CreateNotificationAsync(
                            userId,
                            "🏆 Certificate Earned!",
                            $"Congratulations! You completed \"{courseTitle}\" and earned a certificate.",
                            "certificate"
                        );

                        _ = _notificationService.SendToUserAsync(
                            userId,
                            "🏆 Certificate Earned!",
                            $"You completed \"{courseTitle}\"! Check your Certificates.",
                            new { type = "certificate", courseId = courseId }
                        );
                    }
                    else
                    {
                        existingCert.PdfUrl = pdfUrl;
                    }

                    // Dispatch email
                    if (!string.IsNullOrEmpty(user.Email) && !string.IsNullOrEmpty(pdfUrl))
                    {
                        var userEmail = user.Email;
                        _ = Task.Run(async () =>
                        {
                            try { await _emailService.SendCertificateAsync(userEmail, userName, courseTitle, pdfUrl); }
                            catch { /* ignore */ }
                        });
                    }
                    
                    // Save incrementally so subsequent loops see the changes
                    await _db.SaveChangesAsync();
                }
            }
        }
    }
}
