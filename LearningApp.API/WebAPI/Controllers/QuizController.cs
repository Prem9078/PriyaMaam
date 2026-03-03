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
    public class QuizController : ControllerBase
    {
        private readonly IQuizService _quizService;

        public QuizController(IQuizService quizService) => _quizService = quizService;

        private Guid GetUserId() =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
                       ?? User.FindFirstValue("sub")!);

        /// <summary>Get all quizzes for a lesson.</summary>
        [HttpGet("{lessonId:guid}")]
        public async Task<IActionResult> GetByLesson(Guid lessonId)
        {
            var quizzes = await _quizService.GetByLessonAsync(lessonId);
            return Ok(quizzes);
        }

        /// <summary>Get a single quiz by Id (students taking the quiz).</summary>
        [HttpGet("take/{quizId:guid}")]
        public async Task<IActionResult> GetById(Guid quizId)
        {
            var quiz = await _quizService.GetByIdAsync(quizId);
            return quiz is null ? NotFound() : Ok(quiz);
        }

        /// <summary>Create a quiz with questions (Admin only).</summary>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateQuizDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var quiz = await _quizService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetByLesson), new { lessonId = quiz.LessonId }, quiz);
        }

        /// <summary>Delete a quiz (Admin only).</summary>
        [HttpDelete("{quizId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid quizId)
        {
            var deleted = await _quizService.DeleteAsync(quizId);
            return deleted ? Ok(new { message = "Quiz deleted." }) : NotFound();
        }

        /// <summary>Submit quiz answers. Returns score and correct answers.</summary>
        [HttpPost("submit")]
        public async Task<IActionResult> Submit([FromBody] QuizSubmitDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _quizService.SubmitAsync(GetUserId(), dto);
            return Ok(result);
        }
    }
}
