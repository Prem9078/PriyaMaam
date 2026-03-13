using System;
using System.Security.Claims;
using System.Threading.Tasks;
using LearningApp.API.Application.DTOs;
using LearningApp.API.Application.Services;
using LearningApp.API.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LearningApp.API.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly OtpStore     _otpStore;
        private readonly EmailService _emailService;

        public AuthController(IAuthService authService, OtpStore otpStore, EmailService emailService)
        {
            _authService  = authService;
            _otpStore     = otpStore;
            _emailService = emailService;
        }

        /// <summary>Step 1 of registration: send OTP to the email address.</summary>
        [HttpPost("send-otp")]
        public async Task<IActionResult> SendOtp([FromBody] SendOtpDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Fail early if the email is already registered
            var alreadyExists = await _authService.EmailExistsAsync(dto.Email);
            if (alreadyExists)
                return Conflict(new { message = "An account with this email already exists. Please sign in or reset your password." });

            var code = _otpStore.Generate(dto.Email);
            await _emailService.SendOtpAsync(dto.Email, code);

            return Ok(new { message = "OTP sent to your email." });
        }

        /// <summary>Step 1b: Verify OTP before completing registration.</summary>
        [HttpPost("verify-otp")]
        public IActionResult VerifyOtp([FromBody] VerifyOtpDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var valid = _otpStore.Verify(dto.Email, dto.Otp);
            if (!valid)
                return BadRequest(new { message = "Invalid or expired OTP. Please request a new one." });

            // Re-generate a short-lived token the client sends back with the registration request
            // so the OTP isn't re-consumed on /register. We simply re-store a "verified" marker.
            var verifiedCode = _otpStore.Generate(dto.Email + ":verified");
            return Ok(new { message = "Email verified.", verifiedToken = verifiedCode });
        }

        /// <summary>Step 2: Register using already-verified email.</summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Confirm the verified token is still valid
            var emailVerified = _otpStore.Verify(dto.Email + ":verified", dto.Otp);
            if (!emailVerified)
                return BadRequest(new { message = "Email not verified. Please complete OTP verification first." });

            try
            {
                var result = await _authService.RegisterAsync(dto);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                // Duplicate email (safety net in case send-otp check was bypassed)
                return Conflict(new { message = ex.Message });
            }
        }

        /// <summary>Login and receive a JWT token.</summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _authService.LoginAsync(dto);
            return Ok(result);
        }

        /// <summary>Sliding session refresh.</summary>
        [HttpPost("refresh")]
        [Authorize]
        public async Task<IActionResult> Refresh()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                            ?? User.FindFirstValue("sub");
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized();

            var result = await _authService.RefreshTokenAsync(userId);
            return Ok(result);
        }

        /// <summary>Step 1 of password reset: send OTP to registered email.</summary>
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Verify that the email exists (silently succeed if not, to avoid email enumeration)
            var exists = await _authService.EmailExistsAsync(dto.Email);
            if (exists)
            {
                var code = _otpStore.Generate("reset:" + dto.Email.ToLower());
                await _emailService.SendOtpAsync(dto.Email,
                    code,
                    subject: "Password Reset OTP — Priya Ma'am",
                    heading: "Reset Your Password");
            }

            return Ok(new { message = "If that email is registered, an OTP has been sent." });
        }

        /// <summary>Step 2: verify the reset OTP.</summary>
        [HttpPost("verify-reset-otp")]
        public IActionResult VerifyResetOtp([FromBody] VerifyOtpDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var valid = _otpStore.Verify("reset:" + dto.Email.ToLower(), dto.Otp);
            if (!valid)
                return BadRequest(new { message = "Invalid or expired OTP." });

            // Generate a short-lived verified token the client sends back with reset-password
            var verifiedCode = _otpStore.Generate("reset-verified:" + dto.Email.ToLower());
            return Ok(new { message = "OTP verified. Proceed to set a new password.", verifiedToken = verifiedCode });
        }

        /// <summary>Step 3: reset the password using previously verified OTP.</summary>
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // dto.Otp contains the verifiedToken returned from verify-reset-otp
            var verified = _otpStore.Verify("reset-verified:" + dto.Email.ToLower(), dto.Otp);
            if (!verified)
                return BadRequest(new { message = "Session expired. Please request a new OTP." });

            var success = await _authService.ResetPasswordAsync(dto.Email, dto.NewPassword);
            if (!success)
                return NotFound(new { message = "User not found." });

            return Ok(new { message = "Password reset successfully." });
        }

        // ─── Change Password (authenticated) ─────────────────────────────────

        /// <summary>Send OTP to logged-in user's email to begin password change.</summary>
        [HttpPost("send-change-otp")]
        [Authorize]
        public async Task<IActionResult> SendChangePasswordOtp()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var user = await _authService.GetUserByIdAsync(userId);
            if (user == null) return Unauthorized();

            var code = _otpStore.Generate("change-pw:" + user.Email.ToLower());
            await _emailService.SendOtpAsync(user.Email, code,
                subject: "Change Password OTP — Priya Ma'am",
                heading: "Change Your Password");

            return Ok(new { message = "OTP sent to your registered email." });
        }

        /// <summary>Verify the change-password OTP.</summary>
        [HttpPost("verify-change-otp")]
        [Authorize]
        public async Task<IActionResult> VerifyChangePasswordOtp([FromBody] VerifyOtpDto dto)
        {
            var valid = _otpStore.Verify("change-pw:" + dto.Email.ToLower(), dto.Otp);
            if (!valid) return BadRequest(new { message = "Invalid or expired OTP." });

            var verifiedCode = _otpStore.Generate("change-pw-verified:" + dto.Email.ToLower());
            return Ok(new { message = "OTP verified.", verifiedToken = verifiedCode });
        }

        /// <summary>Change the password using a verified token.</summary>
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var user = await _authService.GetUserByIdAsync(userId);
            if (user == null) return Unauthorized();

            var verified = _otpStore.Verify("change-pw-verified:" + user.Email.ToLower(), dto.Otp);
            if (!verified) return BadRequest(new { message = "Session expired. Please request a new OTP." });

            await _authService.ResetPasswordAsync(user.Email, dto.NewPassword);
            return Ok(new { message = "Password changed successfully." });
        }
    }
}
