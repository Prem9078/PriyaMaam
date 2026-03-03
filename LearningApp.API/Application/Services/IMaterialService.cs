using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using LearningApp.API.Application.DTOs;
using Microsoft.AspNetCore.Http;

namespace LearningApp.API.Application.Services
{
    public interface IMaterialService
    {
        Task<List<LessonMaterialDto>> GetByLessonAsync(Guid lessonId);
        Task<LessonMaterialDto?> GetByIdAsync(Guid materialId);
        Task<LessonMaterialDto> UploadAsync(Guid lessonId, IFormFile file);
        Task<bool> DeleteAsync(Guid materialId);
    }
}
