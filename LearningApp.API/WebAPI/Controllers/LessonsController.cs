using System;
using System.Security.Claims;
using System.Threading.Tasks;
using LearningApp.API.Application.DTOs;
using LearningApp.API.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LearningApp.API.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LessonsController : ControllerBase
    {
        private readonly ILessonService _lessonService;

        public LessonsController(ILessonService lessonService) => _lessonService = lessonService;

        private Guid GetUserId() =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
                       ?? User.FindFirstValue("sub")!);

        /// <summary>Get lessons for a course. Student must be enrolled.</summary>
        [HttpGet("{courseId:guid}")]
        public async Task<IActionResult> GetByCourse(Guid courseId)
        {
            var isAdmin = User.IsInRole("Admin");
            var lessons = await _lessonService.GetByCourseAsync(courseId, GetUserId(), isAdmin);
            return Ok(lessons);
        }

        /// <summary>Get a single lesson by its ID.</summary>
        [HttpGet("single/{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var lesson = await _lessonService.GetByIdAsync(id);
            return lesson is null ? NotFound() : Ok(lesson);
        }

        /// <summary>Create a lesson (Admin only).</summary>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateLessonDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var lesson = await _lessonService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetByCourse), new { courseId = lesson.CourseId }, lesson);
        }

        /// <summary>Update a lesson (Admin only).</summary>
        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateLessonDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var lesson = await _lessonService.UpdateAsync(id, dto);
            return lesson is null ? NotFound() : Ok(lesson);
        }

        /// <summary>Delete a lesson (Admin only).</summary>
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var success = await _lessonService.DeleteAsync(id);
            return success ? NoContent() : NotFound();
        }
    }
}
