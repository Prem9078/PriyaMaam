using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearningApp.API.Infrastructure.Data;
using LearningApp.API.Domain.Entities;
using System.Security.Claims;

namespace LearningApp.API.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Available to Students and Admins
    public class LearningController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LearningController(AppDbContext context)
        {
            _context = context;
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
                // Verify if Admin, just ignore enrollment check
                var role = User.FindFirstValue(ClaimTypes.Role);
                if (role != "Admin") return Forbid("Not enrolled in this course.");
            }
            else
            {
                // Update LastAccessedLessonId
                enrollment.LastAccessedLessonId = lessonId;
            }

            // Upsert Progress
            var progress = await _context.LessonProgresses
                .FirstOrDefaultAsync(p => p.UserId == userId && p.LessonId == lessonId);

            if (progress == null)
            {
                progress = new LessonProgress
                {
                    UserId = userId,
                    LessonId = lessonId,
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
            return Ok(new { message = "Progress saved.", lastAccessedLessonId = lessonId });
        }
    }
}
