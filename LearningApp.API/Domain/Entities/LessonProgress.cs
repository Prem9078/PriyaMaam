using System;

namespace LearningApp.API.Domain.Entities
{
    public class LessonProgress
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public Guid LessonId { get; set; }
        public bool IsCompleted { get; set; } = true;
        public DateTime CompletedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User User { get; set; } = null!;
        public Lesson Lesson { get; set; } = null!;
    }
}
