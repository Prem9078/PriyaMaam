using System;
using System.Collections.Generic;

namespace LearningApp.API.Domain.Entities
{
    public class Quiz
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid LessonId { get; set; }
        public string Title { get; set; } = "Quiz";

        // Navigation
        public Lesson Lesson { get; set; } = null!;
        public ICollection<Question> Questions { get; set; } = new List<Question>();
        public ICollection<Result> Results { get; set; } = new List<Result>();
    }
}

