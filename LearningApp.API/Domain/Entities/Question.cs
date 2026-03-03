using System;

namespace LearningApp.API.Domain.Entities
{
    public class Question
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid QuizId { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public string OptionA { get; set; } = string.Empty;
        public string OptionB { get; set; } = string.Empty;
        public string OptionC { get; set; } = string.Empty;
        public string OptionD { get; set; } = string.Empty;
        public string CorrectAnswer { get; set; } = string.Empty; // "A", "B", "C", or "D"

        // Navigation
        public Quiz Quiz { get; set; } = null!;
    }
}
