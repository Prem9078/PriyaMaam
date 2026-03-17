using System;
using System.Security.Claims;
using System.Threading.Tasks;
using LearningApp.API.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LearningApp.API.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
            => _notificationService = notificationService;

        private Guid GetUserId() =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
                       ?? User.FindFirstValue("sub")!);

        // ── Expo Push Token ──────────────────────────────────────────────────

        [HttpPost("register-token")]
        public async Task<IActionResult> RegisterToken([FromBody] RegisterTokenDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Token))
                return BadRequest(new { message = "Token is required." });

            await _notificationService.RegisterTokenAsync(GetUserId(), dto.Token);
            return Ok(new { message = "Push token registered successfully." });
        }

        [HttpPost("clear-token")]
        public async Task<IActionResult> ClearToken()
        {
            await _notificationService.ClearTokenAsync(GetUserId());
            return Ok(new { message = "Push token cleared." });
        }

        [HttpPost("broadcast")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Broadcast([FromBody] BroadcastDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Message))
                return BadRequest("Title and message are required.");

            await _notificationService.SendBroadcastAsync(dto.Title, dto.Message);
            return Ok(new { message = "Broadcast sent successfully." });
        }

        // ── In-App Notifications ─────────────────────────────────────────────

        /// <summary>Get all in-app notifications for the logged-in user.</summary>
        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var notifications = await _notificationService.GetNotificationsAsync(GetUserId());
            return Ok(notifications);
        }

        /// <summary>Mark a single notification as read.</summary>
        [HttpPut("{id:guid}/read")]
        public async Task<IActionResult> MarkRead(Guid id)
        {
            await _notificationService.MarkReadAsync(id, GetUserId());
            return Ok(new { message = "Marked as read." });
        }

        /// <summary>Mark all notifications as read for the logged-in user.</summary>
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllRead()
        {
            await _notificationService.MarkAllReadAsync(GetUserId());
            return Ok(new { message = "All notifications marked as read." });
        }
    }

    public class RegisterTokenDto
    {
        public string Token { get; set; } = string.Empty;
    }

    public class BroadcastDto
    {
        public string Title   { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
