using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LearningApp.API.Application.DTOs;
using LearningApp.API.Application.Services;
using LearningApp.API.Domain.Entities;
using LearningApp.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.API.Infrastructure.Services
{
    public class QuizService : IQuizService
    {
        private readonly AppDbContext _db;

        public QuizService(AppDbContext db) => _db = db;

        private static QuizDto ToDto(Quiz quiz) => new QuizDto
        {
            Id = quiz.Id,
            LessonId = quiz.LessonId,
            Title = quiz.Title,
            Questions = quiz.Questions.Select(q => new QuestionDto
            {
                Id = q.Id,
                QuestionText = q.QuestionText,
                OptionA = q.OptionA,
                OptionB = q.OptionB,
                OptionC = q.OptionC,
                OptionD = q.OptionD
            }).ToList()
        };

        public async Task<List<QuizDto>> GetByLessonAsync(Guid lessonId)
        {
            var quizzes = await _db.Quizzes
                .Include(q => q.Questions)
                .Where(q => q.LessonId == lessonId)
                .ToListAsync();

            return quizzes.Select(ToDto).ToList();
        }

        public async Task<QuizDto?> GetByIdAsync(Guid quizId)
        {
            var quiz = await _db.Quizzes
                .Include(q => q.Questions)
                .FirstOrDefaultAsync(q => q.Id == quizId);

            return quiz is null ? null : ToDto(quiz);
        }

        public async Task<QuizDto> CreateAsync(CreateQuizDto dto)
        {
            var lessonExists = await _db.Lessons.AnyAsync(l => l.Id == dto.LessonId);
            if (!lessonExists)
                throw new InvalidOperationException("Lesson not found.");

            var quiz = new Quiz
            {
                LessonId = dto.LessonId,
                Title = dto.Title,
                Questions = dto.Questions.Select(q => new Question
                {
                    QuestionText = q.QuestionText,
                    OptionA = q.OptionA,
                    OptionB = q.OptionB,
                    OptionC = q.OptionC,
                    OptionD = q.OptionD,
                    CorrectAnswer = q.CorrectAnswer.ToUpper()
                }).ToList()
            };

            _db.Quizzes.Add(quiz);
            await _db.SaveChangesAsync();
            return ToDto(quiz);
        }

        public async Task<bool> DeleteAsync(Guid quizId)
        {
            var quiz = await _db.Quizzes
                .Include(q => q.Questions)
                .FirstOrDefaultAsync(q => q.Id == quizId);
            if (quiz is null) return false;
            _db.Quizzes.Remove(quiz);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<QuizResultDto> SubmitAsync(Guid userId, QuizSubmitDto dto)
        {
            var quiz = await _db.Quizzes
                .Include(q => q.Questions)
                .FirstOrDefaultAsync(q => q.Id == dto.QuizId)
                ?? throw new InvalidOperationException("Quiz not found.");

            int score = 0;
            var correctAnswers = new Dictionary<Guid, string>();

            foreach (var question in quiz.Questions)
            {
                correctAnswers[question.Id] = question.CorrectAnswer;
                if (dto.Answers.TryGetValue(question.Id, out var userAnswer))
                {
                    if (userAnswer.Equals(question.CorrectAnswer, StringComparison.OrdinalIgnoreCase))
                        score++;
                }
            }

            var result = new Result
            {
                UserId = userId,
                QuizId = dto.QuizId,
                Score = score
            };
            _db.Results.Add(result);
            await _db.SaveChangesAsync();

            return new QuizResultDto
            {
                Score = score,
                TotalQuestions = quiz.Questions.Count,
                CorrectAnswers = correctAnswers
            };
        }
    }
}
