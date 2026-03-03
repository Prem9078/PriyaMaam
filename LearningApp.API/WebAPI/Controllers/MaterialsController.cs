using System;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;
using LearningApp.API.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace LearningApp.API.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MaterialsController : ControllerBase
    {
        private readonly IMaterialService _materialService;
        private readonly IHttpClientFactory _httpClientFactory;

        public MaterialsController(IMaterialService materialService, IHttpClientFactory httpClientFactory)
        {
            _materialService = materialService;
            _httpClientFactory = httpClientFactory;
        }

        /// <summary>Get all materials for a lesson.</summary>
        [HttpGet("{lessonId:guid}")]
        public async Task<IActionResult> GetByLesson(Guid lessonId)
        {
            var materials = await _materialService.GetByLessonAsync(lessonId);
            return Ok(materials);
        }

        /// <summary>
        /// Proxy-download a material: the API fetches the raw Cloudinary file
        /// server-side and streams it to the client, bypassing Cloudinary access restrictions.
        /// </summary>
        [HttpGet("view/{materialId:guid}")]
        public async Task<IActionResult> View(Guid materialId)
        {
            var material = await _materialService.GetByIdAsync(materialId);
            if (material is null) return NotFound();

            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync(material.SecureUrl);

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode,
                    $"Cloudinary returned HTTP {(int)response.StatusCode} for URL: {material.SecureUrl}");

            var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/pdf";
            var stream = await response.Content.ReadAsStreamAsync();
            return File(stream, contentType, material.FileName);
        }

        /// <summary>Upload a new material file for a lesson (Admin only).</summary>
        [HttpPost("{lessonId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Upload(Guid lessonId, IFormFile file)
        {
            if (file is null || file.Length == 0)
                return BadRequest(new { message = "Please provide a file." });

            var material = await _materialService.UploadAsync(lessonId, file);
            return Ok(material);
        }

        /// <summary>Delete a material (Admin only).</summary>
        [HttpDelete("{materialId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid materialId)
        {
            var deleted = await _materialService.DeleteAsync(materialId);
            return deleted ? Ok(new { message = "Deleted." }) : NotFound();
        }
    }
}
