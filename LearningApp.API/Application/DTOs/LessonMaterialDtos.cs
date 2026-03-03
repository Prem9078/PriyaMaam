using System;
using System.ComponentModel.DataAnnotations;

namespace LearningApp.API.Application.DTOs
{
    public class LessonMaterialDto
    {
        public Guid Id { get; set; }
        public Guid LessonId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string SecureUrl { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
    }
}
