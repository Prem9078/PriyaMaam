using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using LearningApp.API.Application.DTOs;

namespace LearningApp.API.Application.Services
{
    public interface ILessonService
    {
        Task<LessonDto?> GetByIdAsync(Guid id);
        Task<List<LessonDto>> GetByCourseAsync(Guid courseId, Guid userId, bool isAdmin = false);
        Task<LessonDto> CreateAsync(CreateLessonDto dto);
        Task<LessonDto?> UpdateAsync(Guid id, UpdateLessonDto dto);
        Task<bool> DeleteAsync(Guid id);
    }
}

