using System;
using System.Collections.Generic;

namespace LearningApp.API.Domain.Entities
{
    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "Student";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? ExpoPushToken { get; set; }

        // Navigation
        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
        public ICollection<Result> Results { get; set; } = new List<Result>();
        public ICollection<LessonProgress> LessonProgresses { get; set; } = new List<LessonProgress>();
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    }
}
