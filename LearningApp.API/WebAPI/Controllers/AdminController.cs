using System;
using System.Linq;
using System.Threading.Tasks;
using LearningApp.API.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearningApp.API.Domain.Entities;

namespace LearningApp.API.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _db;

        public AdminController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("students")]
        public async Task<IActionResult> GetStudents()
        {
            var students = await _db.Users
                .Where(u => u.Role == "Student")
                .Select(u => new
                {
                    u.Id,
                    u.Name,
                    u.Email,
                    u.Phone,
                    u.CreatedAt,
                    EnrollmentCount = u.Enrollments.Count
                })
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            return Ok(students);
        }

        [HttpGet("students/{userId:guid}/enrollments")]
        public async Task<IActionResult> GetStudentEnrollments(Guid userId)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null || user.Role != "Student") return NotFound("Student not found.");

            var enrollments = await _db.Enrollments
                .Where(e => e.UserId == userId)
                .Include(e => e.Course)
                .Select(e => new
                {
                    e.CourseId,
                    CourseTitle = e.Course.Title,
                    e.EnrolledAt
                })
                .OrderByDescending(e => e.EnrolledAt)
                .ToListAsync();

            return Ok(enrollments);
        }

        [HttpPost("students/{userId:guid}/enroll/{courseId:guid}")]
        public async Task<IActionResult> EnrollStudent(Guid userId, Guid courseId)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null || user.Role != "Student") return NotFound("Student not found.");

            var courseExists = await _db.Courses.AnyAsync(c => c.Id == courseId);
            if (!courseExists) return NotFound("Course not found.");

            var alreadyEnrolled = await _db.Enrollments.AnyAsync(e => e.UserId == userId && e.CourseId == courseId);
            if (alreadyEnrolled) return Conflict("Student is already enrolled in this course.");

            var enrollment = new Enrollment
            {
                UserId = userId,
                CourseId = courseId,
                EnrolledAt = DateTime.UtcNow
            };
            
            _db.Enrollments.Add(enrollment);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Successfully enrolled." });
        }

        [HttpDelete("students/{userId:guid}/enroll/{courseId:guid}")]
        public async Task<IActionResult> RevokeEnrollment(Guid userId, Guid courseId)
        {
            var enrollment = await _db.Enrollments.FirstOrDefaultAsync(e => e.UserId == userId && e.CourseId == courseId);
            if (enrollment == null) return NotFound("Enrollment not found.");

            _db.Enrollments.Remove(enrollment);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("dashboard-stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var totalStudents = await _db.Users.CountAsync(u => u.Role == "Student");
            var totalCourses = await _db.Courses.CountAsync();
            var totalEnrollments = await _db.Enrollments.CountAsync();

            // Calculate estimated revenue by summing the price of the course for every enrollment
            var estimatedRevenue = await _db.Enrollments
                .Include(e => e.Course)
                .Where(e => e.Course.Price > 0)
                .SumAsync(e => e.Course.Price);

            return Ok(new
            {
                TotalStudents = totalStudents,
                TotalCourses = totalCourses,
                TotalEnrollments = totalEnrollments,
                EstimatedRevenue = estimatedRevenue
            });
        }
    }
}
