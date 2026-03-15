using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearningApp.API.Infrastructure.Data;
using LearningApp.API.Domain.Entities;
using System.Security.Claims;

namespace LearningApp.API.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CommentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CommentsController(AppDbContext context)
        {
            _context = context;
        }

        public class CommentDto
        {
            public Guid Id { get; set; }
            public string Text { get; set; } = string.Empty;
            public DateTime CreatedAt { get; set; }
            public string UserName { get; set; } = string.Empty;
        }

        public class CreateCommentRequest
        {
            public string Text { get; set; } = string.Empty;
        }

        [HttpGet("/api/learning/lessons/{lessonId}/comments")]
        public async Task<IActionResult> GetComments(Guid lessonId)
        {
            var comments = await _context.Comments
                .Include(c => c.User)
                .Where(c => c.LessonId == lessonId)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new CommentDto
                {
                    Id = c.Id,
                    Text = c.Text,
                    CreatedAt = c.CreatedAt,
                    UserName = c.User.Name
                })
                .ToListAsync();

            return Ok(comments);
        }

        [HttpPost("/api/learning/lessons/{lessonId}/comments")]
        public async Task<IActionResult> PostComment(Guid lessonId, [FromBody] CreateCommentRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Text)) return BadRequest("Comment text is required.");

            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return Unauthorized();

            var lessonExists = await _context.Lessons.AnyAsync(l => l.Id == lessonId);
            if (!lessonExists) return NotFound("Lesson not found.");

            var comment = new Comment
            {
                LessonId = lessonId,
                UserId = userId,
                Text = request.Text,
                CreatedAt = DateTime.UtcNow
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            var userRecord = await _context.Users.FindAsync(userId);

            return Ok(new CommentDto
            {
                Id = comment.Id,
                Text = comment.Text,
                CreatedAt = comment.CreatedAt,
                UserName = userRecord?.Name ?? "Student"
            });
        }
    }
}
