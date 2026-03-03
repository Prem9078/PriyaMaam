using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LearningApp.API.Application.DTOs;
using LearningApp.API.Application.Services;
using LearningApp.API.Domain.Entities;
using LearningApp.API.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.API.Infrastructure.Services
{
    public class MaterialService : IMaterialService
    {
        private readonly AppDbContext _db;
        private readonly ICloudinaryService _cloudinary;

        public MaterialService(AppDbContext db, ICloudinaryService cloudinary)
        {
            _db = db;
            _cloudinary = cloudinary;
        }

        public async Task<List<LessonMaterialDto>> GetByLessonAsync(Guid lessonId)
        {
            return await _db.LessonMaterials
                .Where(m => m.LessonId == lessonId)
                .OrderBy(m => m.UploadedAt)
                .Select(m => new LessonMaterialDto
                {
                    Id = m.Id,
                    LessonId = m.LessonId,
                    FileName = m.FileName,
                    SecureUrl = m.SecureUrl,
                    UploadedAt = m.UploadedAt
                })
                .ToListAsync();
        }

        public async Task<LessonMaterialDto?> GetByIdAsync(Guid materialId)
        {
            var m = await _db.LessonMaterials.FindAsync(materialId);
            if (m is null) return null;
            return new LessonMaterialDto
            {
                Id = m.Id,
                LessonId = m.LessonId,
                FileName = m.FileName,
                SecureUrl = m.SecureUrl,
                UploadedAt = m.UploadedAt
            };
        }

        public async Task<LessonMaterialDto> UploadAsync(Guid lessonId, IFormFile file)
        {
            var lessonExists = await _db.Lessons.AnyAsync(l => l.Id == lessonId);
            if (!lessonExists)
                throw new InvalidOperationException("Lesson not found.");

            var result = await _cloudinary.UploadPdfAsync(file);

            var material = new LessonMaterial
            {
                LessonId = lessonId,
                FileName = file.FileName,
                PublicId = result.PublicId,
                SecureUrl = result.SecureUrl,
                UploadedAt = DateTime.UtcNow
            };

            _db.LessonMaterials.Add(material);
            await _db.SaveChangesAsync();

            return new LessonMaterialDto
            {
                Id = material.Id,
                LessonId = material.LessonId,
                FileName = material.FileName,
                SecureUrl = material.SecureUrl,
                UploadedAt = material.UploadedAt
            };
        }

        public async Task<bool> DeleteAsync(Guid materialId)
        {
            var material = await _db.LessonMaterials.FindAsync(materialId);
            if (material is null) return false;

            await _cloudinary.DeleteFileAsync(material.PublicId);
            _db.LessonMaterials.Remove(material);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
