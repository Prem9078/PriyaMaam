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
    public class CoursesController : ControllerBase
    {
        private readonly ICourseService _courseService;

        public CoursesController(ICourseService courseService) => _courseService = courseService;

        private Guid? GetUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? User.FindFirstValue("sub");
            return Guid.TryParse(claim, out var id) ? id : null;
        }

        /// <summary>Get all courses. If authenticated, marks enrolled courses.</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var userId = GetUserId();
            var courses = await _courseService.GetAllAsync(userId);
            return Ok(courses);
        }

        /// <summary>Get a single course by ID.</summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var userId = GetUserId();
            var course = await _courseService.GetByIdAsync(id, userId);
            return course is null ? NotFound() : Ok(course);
        }

        /// <summary>Enroll the authenticated student in a course.</summary>
        [HttpPost("enroll/{courseId:guid}")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> Enroll(Guid courseId)
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var enrolled = await _courseService.EnrollAsync(userId.Value, courseId);
            return enrolled
                ? Ok(new { message = "Successfully enrolled." })
                : Conflict(new { message = "Already enrolled in this course." });
        }

        /// <summary>Create a new course (Admin only).</summary>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromForm] CreateCourseDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var course = await _courseService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = course.Id }, course);
        }

        /// <summary>Update a course (Admin only).</summary>
        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(Guid id, [FromForm] UpdateCourseDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var course = await _courseService.UpdateAsync(id, dto);
            return course is null ? NotFound() : Ok(course);
        }

        /// <summary>Delete a course (Admin only).</summary>
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _courseService.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }

        /// <summary>Toggle a course between Free and Paid (Admin only).</summary>
        [HttpPatch("{id:guid}/toggle-free")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ToggleFree(Guid id)
        {
            var course = await _courseService.ToggleFreeAsync(id);
            return course is null ? NotFound() : Ok(course);
        }
    }
}
