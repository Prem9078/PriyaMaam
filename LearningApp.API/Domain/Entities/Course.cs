using System;
using System.Collections.Generic;

namespace LearningApp.API.Domain.Entities
{
    public class Course
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public bool IsFree { get; set; } = true;  // Courses are free by default
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
        public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    }
}
