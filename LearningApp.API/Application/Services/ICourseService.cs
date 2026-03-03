using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using LearningApp.API.Application.DTOs;

namespace LearningApp.API.Application.Services
{
    public interface ICourseService
    {
        Task<List<CourseDto>> GetAllAsync(Guid? userId);
        Task<CourseDto?> GetByIdAsync(Guid id, Guid? userId);
        Task<CourseDto> CreateAsync(CreateCourseDto dto);
        Task<CourseDto?> UpdateAsync(Guid id, UpdateCourseDto dto);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> EnrollAsync(Guid userId, Guid courseId);
        Task<CourseDto?> ToggleFreeAsync(Guid id);
    }
}
