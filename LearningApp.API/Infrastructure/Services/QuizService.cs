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
        private readonly INotificationService _notifications;
        private readonly EmailService _email;

        public QuizService(AppDbContext db, INotificationService notifications, EmailService email)
        {
            _db            = db;
            _notifications = notifications;
            _email         = email;
        }

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

        public async Task<AdminQuizDto?> GetAdminByIdAsync(Guid quizId)
        {
            var quiz = await _db.Quizzes
                .Include(q => q.Questions)
                .FirstOrDefaultAsync(q => q.Id == quizId);

            if (quiz is null) return null;

            return new AdminQuizDto
            {
                Id = quiz.Id,
                LessonId = quiz.LessonId,
                Title = quiz.Title,
                Questions = quiz.Questions.Select(q => new AdminQuestionDto
                {
                    Id = q.Id,
                    QuestionText = q.QuestionText,
                    OptionA = q.OptionA,
                    OptionB = q.OptionB,
                    OptionC = q.OptionC,
                    OptionD = q.OptionD,
                    CorrectAnswer = q.CorrectAnswer
                }).ToList()
            };
        }

        public async Task<QuizDto> UpdateAsync(Guid quizId, UpdateQuizDto dto)
        {
            var quiz = await _db.Quizzes
                .Include(q => q.Questions)
                .FirstOrDefaultAsync(q => q.Id == quizId);

            if (quiz == null)
                throw new InvalidOperationException("Quiz not found.");

            quiz.Title = dto.Title;

            // Snapshot the existing questions so we don't mutate the tracked
            // collection while EF is also tracking deletes against it.
            var existingQuestions = quiz.Questions.ToList();

            var incomingIds = dto.Questions
                .Where(q => q.Id.HasValue && q.Id.Value != Guid.Empty)
                .Select(q => q.Id!.Value)
                .ToHashSet();

            // 1. Delete questions that are no longer in the payload
            var toRemove = existingQuestions
                .Where(q => !incomingIds.Contains(q.Id))
                .ToList();
            _db.Questions.RemoveRange(toRemove);

            // 2. Update or insert each incoming question
            foreach (var incoming in dto.Questions)
            {
                if (incoming.Id.HasValue && incoming.Id.Value != Guid.Empty)
                {
                    var existing = existingQuestions.FirstOrDefault(q => q.Id == incoming.Id.Value);
                    if (existing != null)
                    {
                        // Update existing
                        existing.QuestionText = incoming.QuestionText;
                        existing.OptionA      = incoming.OptionA;
                        existing.OptionB      = incoming.OptionB;
                        existing.OptionC      = incoming.OptionC;
                        existing.OptionD      = incoming.OptionD;
                        existing.CorrectAnswer = incoming.CorrectAnswer.ToUpper();
                    }
                    else
                    {
                        // ID provided but not found in DB — treat as new
                        _db.Questions.Add(new Question
                        {
                            QuizId        = quiz.Id,
                            QuestionText  = incoming.QuestionText,
                            OptionA       = incoming.OptionA,
                            OptionB       = incoming.OptionB,
                            OptionC       = incoming.OptionC,
                            OptionD       = incoming.OptionD,
                            CorrectAnswer = incoming.CorrectAnswer.ToUpper()
                        });
                    }
                }
                else
                {
                    // Completely new question (no Id from client)
                    _db.Questions.Add(new Question
                    {
                        QuizId        = quiz.Id,
                        QuestionText  = incoming.QuestionText,
                        OptionA       = incoming.OptionA,
                        OptionB       = incoming.OptionB,
                        OptionC       = incoming.OptionC,
                        OptionD       = incoming.OptionD,
                        CorrectAnswer = incoming.CorrectAnswer.ToUpper()
                    });
                }
            }

            await _db.SaveChangesAsync();

            // Reload so the returned DTO reflects the final DB state
            await _db.Entry(quiz).Collection(q => q.Questions).LoadAsync();

            return ToDto(quiz);
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

            // Prepare notification data safely using DbContext
            var lesson = await _db.Lessons.FindAsync(dto.LessonId);
            if (lesson != null)
            {
                var course = await _db.Courses.FindAsync(lesson.CourseId);

                var enrolledEmails = await _db.Enrollments
                    .Where(e => e.CourseId == lesson.CourseId)
                    .Include(e => e.User)
                    .Select(e => e.User.Email)
                    .ToListAsync();

                // Fire-and-forget notifications (No DbContext usage here)
                await _notifications.SendToEnrolledStudentsAsync(
                    lesson.CourseId,
                    "📝 New Quiz Ready!",
                    $"'{quiz.Title}' quiz is available in '{course?.Title}'.",
                    new { screen = "LessonScreen", lessonId = dto.LessonId });

                if (enrolledEmails.Any())
                {
                    await _email.SendNewQuizAsync(enrolledEmails, lesson.Title, quiz.Title);
                }
            }

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

            // Push notification to the student
            await _notifications.SendToUserAsync(
                userId,
                "✅ Quiz Completed!",
                $"You scored {score}/{quiz.Questions.Count} in '{quiz.Title}'. Well done!",
                new { screen = "ResultScreen" });

            // Quiz result email
            var student = await _db.Users.FindAsync(userId);
            if (student != null)
            {
                var pct = quiz.Questions.Count == 0
                    ? 0.0
                    : Math.Round((double)score / quiz.Questions.Count * 100, 1);
                await _email.SendQuizResultAsync(student.Email, student.Name,
                    quiz.Title, score, quiz.Questions.Count, pct);
            }

            return new QuizResultDto
            {
                Score = score,
                TotalQuestions = quiz.Questions.Count,
                CorrectAnswers = correctAnswers
            };
        }

        public async Task<List<QuizHistoryItemDto>> GetMyHistoryAsync(Guid userId)
        {
            return await _db.Results
                .Where(r => r.UserId == userId)
                .Include(r => r.Quiz)
                    .ThenInclude(q => q.Lesson)
                .Include(r => r.Quiz)
                    .ThenInclude(q => q.Questions)
                .OrderByDescending(r => r.SubmittedAt)
                .Select(r => new QuizHistoryItemDto
                {
                    ResultId       = r.Id,
                    QuizId         = r.QuizId,
                    QuizTitle      = r.Quiz.Title,
                    LessonTitle    = r.Quiz.Lesson.Title,
                    Score          = r.Score,
                    TotalQuestions = r.Quiz.Questions.Count,
                    Percentage     = r.Quiz.Questions.Count == 0
                                        ? 0
                                        : Math.Round((double)r.Score / r.Quiz.Questions.Count * 100, 1),
                    SubmittedAt    = r.SubmittedAt
                })
                .ToListAsync();
        }

        public async Task<List<LeaderboardEntryDto>> GetLeaderboardAsync(Guid quizId)
        {
            var totalQuestions = await _db.Questions
                .CountAsync(q => q.QuizId == quizId);

            // Load all results for this quiz into memory (SQL handles the WHERE filter).
            // GroupBy + complex ordering inside Select cannot be translated to SQL by EF Core,
            // so we do the grouping/selection in C# after fetching the filtered rows.
            var allResults = await _db.Results
                .Where(r => r.QuizId == quizId)
                .Include(r => r.User)
                .ToListAsync();

            // Best score per student — if tied, earliest attempt wins
            var topResults = allResults
                .GroupBy(r => r.UserId)
                .Select(g => g.OrderByDescending(x => x.Score).ThenBy(x => x.SubmittedAt).First())
                .OrderByDescending(r => r.Score)
                .ThenBy(r => r.SubmittedAt)
                .Take(10)
                .ToList();

            return topResults.Select((r, index) => new LeaderboardEntryDto
            {
                Rank           = index + 1,
                UserId         = r.UserId,
                StudentName    = r.User.Name,
                Score          = r.Score,
                TotalQuestions = totalQuestions,
                Percentage     = totalQuestions == 0
                                    ? 0
                                    : Math.Round((double)r.Score / totalQuestions * 100, 1),
                BestAttemptAt  = r.SubmittedAt
            }).ToList();
        }
    }
}
