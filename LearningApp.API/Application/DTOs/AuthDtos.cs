using System;
using System.ComponentModel.DataAnnotations;

namespace LearningApp.API.Application.DTOs
{
    public class SendOtpDto
    {
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
    }

    public class VerifyOtpDto
    {
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required] public string Otp { get; set; } = string.Empty;
    }

    public class RegisterDto
    {
        [Required] public string Name { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required] public string Phone { get; set; } = string.Empty;
        [Required, MinLength(6)] public string Password { get; set; } = string.Empty;
        [Required] public string Otp { get; set; } = string.Empty; // must be verified before register
    }

    public class LoginDto
    {
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required] public string Password { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
    }

    public class UserDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ForgotPasswordDto
    {
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordDto
    {
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required] public string Otp { get; set; } = string.Empty;
        [Required, MinLength(6)] public string NewPassword { get; set; } = string.Empty;
    }

    public class ChangePasswordDto
    {
        [Required] public string Otp { get; set; } = string.Empty;  // verifiedToken
        [Required, MinLength(6)] public string NewPassword { get; set; } = string.Empty;
    }
}
