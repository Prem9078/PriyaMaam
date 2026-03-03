using System;

namespace LearningApp.API.Domain.Entities
{
    public class LessonMaterial
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid LessonId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string PublicId { get; set; } = string.Empty;      // Cloudinary Public ID
        public string SecureUrl { get; set; } = string.Empty;     // Cloudinary Secure URL
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Lesson Lesson { get; set; } = null!;
    }
}
