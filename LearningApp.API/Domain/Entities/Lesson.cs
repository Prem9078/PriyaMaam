using System;
using System.Collections.Generic;

namespace LearningApp.API.Domain.Entities
{
    public class Lesson
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid CourseId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string YouTubeVideoId { get; set; } = string.Empty;
        public int Order { get; set; }

        // Navigation
        public Course Course { get; set; } = null!;
        public ICollection<LessonMaterial> Materials { get; set; } = new List<LessonMaterial>();
        public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
    }
}

