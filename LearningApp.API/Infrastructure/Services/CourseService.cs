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
    public class CourseService : ICourseService
    {
        private readonly AppDbContext _db;
        private readonly ICloudinaryService _cloudinary;
        private readonly INotificationService _notifications;
        private readonly EmailService _email;

        public CourseService(AppDbContext db, ICloudinaryService cloudinary,
            INotificationService notifications, EmailService email)
        {
            _db            = db;
            _cloudinary    = cloudinary;
            _notifications = notifications;
            _email         = email;
        }

        public async Task<List<CourseDto>> GetAllAsync(Guid? userId)
        {
            var enrolledIds = userId.HasValue
                ? await _db.Enrollments
                    .Where(e => e.UserId == userId.Value)
                    .Select(e => e.CourseId)
                    .ToListAsync()
                : new List<Guid>();

            return await _db.Courses
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new CourseDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    ThumbnailUrl = c.ThumbnailUrl,
                    Price = c.Price,
                    IsFree = c.IsFree,
                    CreatedAt = c.CreatedAt,
                    IsEnrolled = enrolledIds.Contains(c.Id)
                })
                .ToListAsync();
        }

        public async Task<CourseDto?> GetByIdAsync(Guid id, Guid? userId)
        {
            var course = await _db.Courses.FindAsync(id);
            if (course is null) return null;

            var isEnrolled = userId.HasValue &&
                await _db.Enrollments.AnyAsync(e => e.UserId == userId.Value && e.CourseId == id);

            return new CourseDto
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                ThumbnailUrl = course.ThumbnailUrl,
                Price = course.Price,
                IsFree = course.IsFree,
                CreatedAt = course.CreatedAt,
                IsEnrolled = isEnrolled
            };
        }

        public async Task<CourseDto> CreateAsync(CreateCourseDto dto)
        {
            // Upload thumbnail to Cloudinary if provided
            string thumbnailUrl = string.Empty;
            if (dto.ThumbnailImage != null && dto.ThumbnailImage.Length > 0)
            {
                var uploaded = await _cloudinary.UploadImageAsync(dto.ThumbnailImage);
                thumbnailUrl = uploaded.SecureUrl;
            }

            // Collect student emails BEFORE the async boundary
            var studentEmails = await _db.Users
                .Where(u => u.Role == "Student")
                .Select(u => u.Email)
                .ToListAsync();

            var course = new Course
            {
                Title = dto.Title,
                Description = dto.Description,
                ThumbnailUrl = thumbnailUrl,
                Price = dto.Price,
                IsFree = dto.IsFree
            };
            _db.Courses.Add(course);
            await _db.SaveChangesAsync();

            // Push notification to all students
            await _notifications.SendToAllStudentsAsync(
                "📚 New Course Available!",
                $"'{course.Title}' just launched. Check it out!",
                new { screen = "HomeScreen" });

            // Bulk email to all students
            await _email.SendNewCourseAsync(studentEmails, course.Title);

            return new CourseDto
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                ThumbnailUrl = course.ThumbnailUrl,
                Price = course.Price,
                IsFree = course.IsFree,
                CreatedAt = course.CreatedAt
            };
        }

        public async Task<CourseDto?> UpdateAsync(Guid id, UpdateCourseDto dto)
        {
            var course = await _db.Courses.FindAsync(id);
            if (course is null) return null;

            course.Title = dto.Title;
            course.Description = dto.Description;
            course.Price = dto.Price;
            course.IsFree = dto.IsFree;

            // Re-upload thumbnail only if a new image is provided
            if (dto.ThumbnailImage != null && dto.ThumbnailImage.Length > 0)
            {
                var uploaded = await _cloudinary.UploadImageAsync(dto.ThumbnailImage);
                course.ThumbnailUrl = uploaded.SecureUrl;
            }

            await _db.SaveChangesAsync();

            return new CourseDto
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                ThumbnailUrl = course.ThumbnailUrl,
                Price = course.Price,
                IsFree = course.IsFree,
                CreatedAt = course.CreatedAt
            };
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var course = await _db.Courses.FindAsync(id);
            if (course is null) return false;
            _db.Courses.Remove(course);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> EnrollAsync(Guid userId, Guid courseId)
        {
            var exists = await _db.Enrollments
                .AnyAsync(e => e.UserId == userId && e.CourseId == courseId);
            if (exists) return false; // already enrolled

            var courseExists = await _db.Courses.AnyAsync(c => c.Id == courseId);
            if (!courseExists)
                throw new InvalidOperationException("Course not found.");

            _db.Enrollments.Add(new Enrollment { UserId = userId, CourseId = courseId });
            await _db.SaveChangesAsync();

            var course = await _db.Courses.FindAsync(courseId);
            var enrolledUser = await _db.Users.FindAsync(userId);

            if (course != null && enrolledUser != null)
            {
                // Push notification to the enrolled student
                await _notifications.SendToUserAsync(
                    userId,
                    "🎉 Enrollment Successful!",
                    $"You are now enrolled in '{course.Title}'. Start learning!",
                    new { screen = "HomeScreen" });

                // Enrollment confirmation email
                await _email.SendEnrollmentConfirmAsync(enrolledUser.Email, enrolledUser.Name, course.Title);
            }

            return true;
        }

        public async Task<CourseDto?> ToggleFreeAsync(Guid id)
        {
            var course = await _db.Courses.FindAsync(id);
            if (course is null) return null;

            course.IsFree = !course.IsFree;
            await _db.SaveChangesAsync();

            return new CourseDto
            {
                Id = course.Id,
                Title = course.Title,
                Description = course.Description,
                ThumbnailUrl = course.ThumbnailUrl,
                Price = course.Price,
                IsFree = course.IsFree,
                CreatedAt = course.CreatedAt
            };
        }
    }
}
