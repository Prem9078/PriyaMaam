using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearningApp.API.Infrastructure.Data;
using LearningApp.API.Domain.Entities;
using LearningApp.API.Application.Services;
using LearningApp.API.Infrastructure.Services;
using System.Security.Claims;
using System.IO;

namespace LearningApp.API.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LearningController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly ICertificateGeneratorService _certificateGeneratorService;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly EmailService _emailService;

        public LearningController(
            AppDbContext context, 
            INotificationService notificationService,
            ICertificateGeneratorService certificateGeneratorService,
            ICloudinaryService cloudinaryService,
            EmailService emailService)
        {
            _context = context;
            _notificationService = notificationService;
            _certificateGeneratorService = certificateGeneratorService;
            _cloudinaryService = cloudinaryService;
            _emailService = emailService;
        }

        // POST /api/learning/progress/{lessonId}
        [HttpPost("progress/{lessonId}")]
        public async Task<IActionResult> MarkLessonProgress(Guid lessonId)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return Unauthorized();

            var lesson = await _context.Lessons.FindAsync(lessonId);
            if (lesson == null) return NotFound("Lesson not found.");

            // Find enrollment
            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == lesson.CourseId);

            if (enrollment == null)
            {
                var role = User.FindFirstValue(ClaimTypes.Role);
                if (role != "Admin") return Forbid("Not enrolled in this course.");
            }
            else
            {
                enrollment.LastAccessedLessonId = lessonId;
            }

            // Upsert Progress
            var progress = await _context.LessonProgresses
                .FirstOrDefaultAsync(p => p.UserId == userId && p.LessonId == lessonId);

            if (progress == null)
            {
                progress = new LessonProgress
                {
                    UserId      = userId,
                    LessonId    = lessonId,
                    IsCompleted = true,
                    CompletedAt = DateTime.UtcNow
                };
                _context.LessonProgresses.Add(progress);
            }
            else
            {
                progress.IsCompleted = true;
                progress.CompletedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // ── Check if course is now 100% complete ─────────────────────────
            if (enrollment != null)
            {
                var totalLessons = await _context.Lessons
                    .CountAsync(l => l.CourseId == lesson.CourseId);

                var completedLessons = await _context.LessonProgresses
                    .CountAsync(p => p.UserId == userId
                                  && p.Lesson.CourseId == lesson.CourseId
                                  && p.IsCompleted);

                if (totalLessons > 0 && completedLessons >= totalLessons)
                {
                    // Upsert certificate (ignore if already exists)
                    var existingCert = await _context.Certificates
                        .FirstOrDefaultAsync(c => c.UserId == userId && c.CourseId == lesson.CourseId);

                    if (existingCert == null)
                    {
                        var user = await _context.Users.FindAsync(userId);
                        var course = await _context.Courses.FindAsync(lesson.CourseId);
                        var courseTitle = course?.Title ?? "a course";
                        var userName = user?.Name ?? "Student";
                        var userEmail = user?.Email;

                        var certId = Guid.NewGuid().ToString().Substring(0, 8).ToUpper();
                        string pdfUrl = string.Empty;
                        try 
                        {
                            var pdfBytes = _certificateGeneratorService.GenerateCertificate(userName, courseTitle, DateTime.UtcNow, certId);
                            using (var stream = new MemoryStream(pdfBytes))
                            {
                                var uploadResult = await _cloudinaryService.UploadPdfStreamAsync(stream, $"cert_{userId}_{lesson.CourseId}_{certId}");
                                pdfUrl = uploadResult.SecureUrl;
                            }
                        }
                        catch (Exception ex)
                        {
                            // If upload fails, skip creating the certificate now. 
                            // It will be generated when they visit the Certificates page.
                            Console.WriteLine($"Error generating cert on completion: {ex.Message}");
                            return Ok(new { message = "Progress saved.", lastAccessedLessonId = lessonId });
                        }

                        _context.Certificates.Add(new Certificate
                        {
                            UserId   = userId,
                            CourseId = lesson.CourseId,
                            PdfUrl   = pdfUrl
                        });

                        // Create an in-app notification
                        await _notificationService.CreateNotificationAsync(
                            userId,
                            "🏆 Certificate Earned!",
                            $"Congratulations! You completed \"{courseTitle}\" and earned a certificate.",
                            "certificate"
                        );

                        // Also send a push notification (fire-and-forget)
                        _ = _notificationService.SendToUserAsync(
                            userId,
                            "🏆 Certificate Earned!",
                            $"You completed \"{courseTitle}\"! Check your Certificates.",
                            new { type = "certificate", courseId = lesson.CourseId }
                        );

                        // Dispatch email (fire-and-forget)
                        if (!string.IsNullOrEmpty(userEmail) && !string.IsNullOrEmpty(pdfUrl))
                        {
                            _ = Task.Run(async () =>
                            {
                                try { await _emailService.SendCertificateAsync(userEmail, userName, courseTitle, pdfUrl); }
                                catch { /* ignore */ }
                            });
                        }

                        await _context.SaveChangesAsync();
                    }
                }
            }

            return Ok(new { message = "Progress saved.", lastAccessedLessonId = lessonId });
        }

        // ── Comments ─────────────────────────────────────────────────────────

        // GET /api/learning/lessons/{lessonId}/comments
        [HttpGet("lessons/{lessonId}/comments")]
        public async Task<IActionResult> GetComments(Guid lessonId)
        {
            var comments = await _context.Comments
                .Where(c => c.LessonId == lessonId)
                .Include(c => c.User)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Id,
                    c.Text,
                    c.CreatedAt,
                    userName = c.User.Name
                })
                .ToListAsync();
            return Ok(comments);
        }

        // POST /api/learning/lessons/{lessonId}/comments
        [HttpPost("lessons/{lessonId}/comments")]
        public async Task<IActionResult> PostComment(Guid lessonId, [FromBody] CommentDto dto)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            var comment = new Comment
            {
                LessonId  = lessonId,
                UserId    = userId,
                Text      = dto.Text,
                CreatedAt = DateTime.UtcNow
            };
            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Comment posted." });
        }
    }

    public class CommentDto
    {
        public string Text { get; set; } = string.Empty;
    }
}
