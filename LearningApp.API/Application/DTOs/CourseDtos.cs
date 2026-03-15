using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace LearningApp.API.Application.DTOs
{
    // Course
    public class CourseDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public bool IsFree { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsEnrolled { get; set; }
        public int ProgressPercentage { get; set; }
        public Guid? LastAccessedLessonId { get; set; }
    }

    public class CreateCourseDto
    {
        [Required] public string Title { get; set; } = string.Empty;
        [Required] public string Description { get; set; } = string.Empty;
        public IFormFile? ThumbnailImage { get; set; }
        [Range(0, double.MaxValue)] public decimal Price { get; set; }
        public bool IsFree { get; set; } = true;
    }

    public class UpdateCourseDto
    {
        [Required] public string Title { get; set; } = string.Empty;
        [Required] public string Description { get; set; } = string.Empty;
        public IFormFile? ThumbnailImage { get; set; }
        [Range(0, double.MaxValue)] public decimal Price { get; set; }
        public bool IsFree { get; set; } = true;
    }

    // Lesson
    public class LessonDto
    {
        public Guid Id { get; set; }
        public Guid CourseId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string YouTubeVideoId { get; set; } = string.Empty;
        public int Order { get; set; }
    }

    public class CreateLessonDto
    {
        [Required] public Guid CourseId { get; set; }
        [Required] public string Title { get; set; } = string.Empty;
        [Required] public string YouTubeVideoId { get; set; } = string.Empty;
        public int Order { get; set; }
    }

    public class UpdateLessonDto
    {
        [Required] public string Title { get; set; } = string.Empty;
        [Required] public string YouTubeVideoId { get; set; } = string.Empty;
        public int Order { get; set; }
    }
}
