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

        /// <summary>
        /// Register or update the Expo push token for the currently authenticated user.
        /// Called from the mobile app after login.
        /// </summary>
        [HttpPost("register-token")]
        public async Task<IActionResult> RegisterToken([FromBody] RegisterTokenDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Token))
                return BadRequest(new { message = "Token is required." });

            await _notificationService.RegisterTokenAsync(GetUserId(), dto.Token);
            return Ok(new { message = "Push token registered successfully." });
        }

        /// <summary>
        /// Clear the Expo push token when a user logs out.
        /// Prevents another user logging in on the same device from receiving notifications
        /// meant for the previous user.
        /// </summary>
        [HttpPost("clear-token")]
        public async Task<IActionResult> ClearToken()
        {
            await _notificationService.ClearTokenAsync(GetUserId());
            return Ok(new { message = "Push token cleared." });
        }
    }

    public class RegisterTokenDto
    {
        public string Token { get; set; } = string.Empty;
    }
}
