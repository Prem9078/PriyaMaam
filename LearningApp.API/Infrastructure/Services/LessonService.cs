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
    public class LessonService : ILessonService
    {
        private readonly AppDbContext _db;

        public LessonService(AppDbContext db) => _db = db;

        public async Task<List<LessonDto>> GetByCourseAsync(Guid courseId, Guid userId, bool isAdmin = false)
        {
            if (!isAdmin)
            {
                var isEnrolled = await _db.Enrollments
                    .AnyAsync(e => e.UserId == userId && e.CourseId == courseId);

                if (!isEnrolled)
                    throw new UnauthorizedAccessException("You are not enrolled in this course.");
            }

            return await _db.Lessons
                .Where(l => l.CourseId == courseId)
                .OrderBy(l => l.Order)
                .Select(l => new LessonDto
                {
                    Id = l.Id,
                    CourseId = l.CourseId,
                    Title = l.Title,
                    YouTubeVideoId = l.YouTubeVideoId,
                    Order = l.Order
                })
                .ToListAsync();
        }

        public async Task<LessonDto> CreateAsync(CreateLessonDto dto)
        {
            var courseExists = await _db.Courses.AnyAsync(c => c.Id == dto.CourseId);
            if (!courseExists)
                throw new InvalidOperationException("Course not found.");

            var lesson = new Lesson
            {
                CourseId = dto.CourseId,
                Title = dto.Title,
                YouTubeVideoId = dto.YouTubeVideoId,
                Order = dto.Order
            };

            _db.Lessons.Add(lesson);
            await _db.SaveChangesAsync();

            return new LessonDto
            {
                Id = lesson.Id,
                CourseId = lesson.CourseId,
                Title = lesson.Title,
                YouTubeVideoId = lesson.YouTubeVideoId,
                Order = lesson.Order
            };
        }

        public async Task<LessonDto?> UpdateAsync(Guid id, UpdateLessonDto dto)
        {
            var lesson = await _db.Lessons.FindAsync(id);
            if (lesson is null) return null;

            lesson.Title = dto.Title;
            lesson.YouTubeVideoId = dto.YouTubeVideoId;
            lesson.Order = dto.Order;

            await _db.SaveChangesAsync();

            return new LessonDto
            {
                Id = lesson.Id,
                CourseId = lesson.CourseId,
                Title = lesson.Title,
                YouTubeVideoId = lesson.YouTubeVideoId,
                Order = lesson.Order
            };
        }
    }
}
