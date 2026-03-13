using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace LearningApp.API.Application.DTOs
{
    // Quiz
    public class QuizDto
    {
        public Guid Id { get; set; }
        public Guid LessonId { get; set; }
        public string Title { get; set; } = string.Empty;
        public List<QuestionDto> Questions { get; set; } = new();
    }

    public class QuestionDto
    {
        public Guid Id { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public string OptionA { get; set; } = string.Empty;
        public string OptionB { get; set; } = string.Empty;
        public string OptionC { get; set; } = string.Empty;
        public string OptionD { get; set; } = string.Empty;
        // CorrectAnswer is NOT returned to the client
    }

    public class CreateQuizDto
    {
        [Required] public Guid LessonId { get; set; }
        [Required] public string Title { get; set; } = string.Empty;
        [Required] public List<CreateQuestionDto> Questions { get; set; } = new();
    }

    public class CreateQuestionDto
    {
        [Required] public string QuestionText { get; set; } = string.Empty;
        [Required] public string OptionA { get; set; } = string.Empty;
        [Required] public string OptionB { get; set; } = string.Empty;
        [Required] public string OptionC { get; set; } = string.Empty;
        [Required] public string OptionD { get; set; } = string.Empty;
        [Required] public string CorrectAnswer { get; set; } = string.Empty; // "A","B","C","D"
    }

    public class UpdateQuizDto
    {
        [Required] public string Title { get; set; } = string.Empty;
        [Required] public List<UpdateQuestionDto> Questions { get; set; } = new();
    }

    public class UpdateQuestionDto
    {
        public Guid? Id { get; set; }
        [Required] public string QuestionText { get; set; } = string.Empty;
        [Required] public string OptionA { get; set; } = string.Empty;
        [Required] public string OptionB { get; set; } = string.Empty;
        [Required] public string OptionC { get; set; } = string.Empty;
        [Required] public string OptionD { get; set; } = string.Empty;
        [Required] public string CorrectAnswer { get; set; } = string.Empty;
    }

    // Returned to Admin to pre-fill the edit form (includes CorrectAnswer)
    public class AdminQuizDto
    {
        public Guid Id { get; set; }
        public Guid LessonId { get; set; }
        public string Title { get; set; } = string.Empty;
        public List<AdminQuestionDto> Questions { get; set; } = new();
    }

    public class AdminQuestionDto
    {
        public Guid Id { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public string OptionA { get; set; } = string.Empty;
        public string OptionB { get; set; } = string.Empty;
        public string OptionC { get; set; } = string.Empty;
        public string OptionD { get; set; } = string.Empty;
        public string CorrectAnswer { get; set; } = string.Empty;
    }

    // Quiz Submission
    public class QuizSubmitDto
    {
        [Required] public Guid QuizId { get; set; }
        [Required] public Dictionary<Guid, string> Answers { get; set; } = new(); // QuestionId -> Answer
    }

    public class QuizResultDto
    {
        public int Score { get; set; }
        public int TotalQuestions { get; set; }
        public Dictionary<Guid, string> CorrectAnswers { get; set; } = new(); // QuestionId -> CorrectAnswer
    }

    // Result
    public class ResultDto
    {
        public Guid Id { get; set; }
        public Guid QuizId { get; set; }
        public int Score { get; set; }
        public DateTime SubmittedAt { get; set; }
    }

    // Quiz History (per student)
    public class QuizHistoryItemDto
    {
        public Guid ResultId { get; set; }
        public Guid QuizId { get; set; }
        public string QuizTitle { get; set; } = string.Empty;
        public string LessonTitle { get; set; } = string.Empty;
        public int Score { get; set; }
        public int TotalQuestions { get; set; }
        public double Percentage { get; set; }
        public DateTime SubmittedAt { get; set; }
    }

    // Leaderboard (per quiz)
    public class LeaderboardEntryDto
    {
        public int Rank { get; set; }
        public Guid UserId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public int Score { get; set; }
        public int TotalQuestions { get; set; }
        public double Percentage { get; set; }
        public DateTime BestAttemptAt { get; set; }
    }
}
