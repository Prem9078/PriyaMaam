using System;

namespace LearningApp.API.Domain.Entities
{
    public class Result
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public Guid QuizId { get; set; }
        public int Score { get; set; }
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User User { get; set; } = null!;
        public Quiz Quiz { get; set; } = null!;
    }
}
