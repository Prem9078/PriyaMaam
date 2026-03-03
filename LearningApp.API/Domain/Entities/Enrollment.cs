using System;

namespace LearningApp.API.Domain.Entities
{
    public class Enrollment
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public Guid CourseId { get; set; }
        public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User User { get; set; } = null!;
        public Course Course { get; set; } = null!;
    }
}
