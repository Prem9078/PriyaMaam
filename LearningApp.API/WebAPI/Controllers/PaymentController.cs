using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using LearningApp.API.Application.DTOs;
using LearningApp.API.Application.Services;
using LearningApp.API.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Razorpay.Api;

namespace LearningApp.API.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Student")]
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext    _db;
        private readonly ICourseService  _courseService;
        private readonly IConfiguration  _config;

        public PaymentController(AppDbContext db, ICourseService courseService, IConfiguration config)
        {
            _db            = db;
            _courseService = courseService;
            _config        = config;
        }

        private Guid? GetUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? User.FindFirstValue("sub");
            return Guid.TryParse(claim, out var id) ? id : null;
        }

        // ─── POST /api/payment/create-order ─────────────────────────────────
        /// <summary>Creates a Razorpay order for a paid course.</summary>
        [HttpPost("create-order")]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto dto)
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var course = await _db.Courses.FindAsync(dto.CourseId);
            if (course is null) return NotFound(new { message = "Course not found." });

            // Already enrolled — no payment needed
            var alreadyEnrolled = await _db.Enrollments
                .AnyAsync(e => e.UserId == userId.Value && e.CourseId == dto.CourseId);
            if (alreadyEnrolled)
                return Conflict(new { message = "Already enrolled in this course." });

            // Free course — direct enroll instead
            if (course.IsFree || course.Price <= 0)
                return BadRequest(new { message = "This is a free course. Use the enroll endpoint directly." });

            var keyId     = _config["Razorpay:KeyId"]!;
            var keySecret = _config["Razorpay:KeySecret"]!;

            var client = new RazorpayClient(keyId, keySecret);

            // Amount must be in paise (1 INR = 100 paise)
            var amountInPaise = (long)(course.Price * 100);

            var options = new Dictionary<string, object>
            {
                { "amount",   amountInPaise },
                { "currency", "INR" },
                { "receipt",  $"rcpt_{userId.ToString().Replace("-","").Substring(0,12)}" }
            };

            var order = client.Order.Create(options);

            return Ok(new CreateOrderResponseDto
            {
                OrderId    = order["id"].ToString(),
                Amount     = amountInPaise,
                Currency   = "INR",
                Key        = keyId,
                CourseName = course.Title
            });
        }

        // ─── POST /api/payment/verify ────────────────────────────────────────
        /// <summary>Verifies Razorpay signature and enrolls the student.</summary>
        [HttpPost("verify")]
        public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentDto dto)
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var keySecret = _config["Razorpay:KeySecret"]!;

            // HMAC-SHA256: generated = HMAC(order_id + "|" + payment_id, key_secret)
            var payload   = $"{dto.RazorpayOrderId}|{dto.RazorpayPaymentId}";
            var keyBytes  = Encoding.UTF8.GetBytes(keySecret);
            var dataBytes = Encoding.UTF8.GetBytes(payload);

            using var hmac      = new HMACSHA256(keyBytes);
            var computed        = hmac.ComputeHash(dataBytes);
            var computedHex     = BitConverter.ToString(computed).Replace("-", "").ToLower();

            if (computedHex != dto.RazorpaySignature)
                return BadRequest(new { message = "Payment verification failed. Invalid signature." });

            // Enroll the student
            try
            {
                var enrolled = await _courseService.EnrollAsync(userId.Value, dto.CourseId);
                if (!enrolled)
                    return Conflict(new { message = "Already enrolled in this course." });

                return Ok(new { message = "Payment successful! You are now enrolled." });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
