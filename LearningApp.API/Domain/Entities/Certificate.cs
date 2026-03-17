using System;

namespace LearningApp.API.Domain.Entities
{
    public class Certificate
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public Guid CourseId { get; set; }
        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
        public string PdfUrl { get; set; } = string.Empty;

        // Navigation
        public User User { get; set; } = null!;
        public Course Course { get; set; } = null!;
    }
}
