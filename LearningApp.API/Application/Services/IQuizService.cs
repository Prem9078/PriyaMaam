using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using LearningApp.API.Application.DTOs;

namespace LearningApp.API.Application.Services
{
    public interface IQuizService
    {
        Task<List<QuizDto>> GetByLessonAsync(Guid lessonId);
        Task<QuizDto?> GetByIdAsync(Guid quizId);
        Task<QuizDto> CreateAsync(CreateQuizDto dto);
        Task<bool> DeleteAsync(Guid quizId);
        Task<QuizResultDto> SubmitAsync(Guid userId, QuizSubmitDto dto);
    }
}

