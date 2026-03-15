using System;

namespace LearningApp.API.Domain.Entities
{
    public class Comment
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid LessonId { get; set; }
        public Guid UserId { get; set; }
        
        public string Text { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Optional: for threading
        public Guid? ParentCommentId { get; set; }

        // Navigation
        public Lesson Lesson { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}
