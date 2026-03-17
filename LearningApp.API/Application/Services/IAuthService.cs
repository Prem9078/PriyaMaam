using System;
using System.Threading.Tasks;
using LearningApp.API.Application.DTOs;

using Microsoft.AspNetCore.Http;

namespace LearningApp.API.Application.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
        Task<AuthResponseDto> RefreshTokenAsync(Guid userId);
        Task<bool> EmailExistsAsync(string email);
        Task<bool> ResetPasswordAsync(string email, string newPassword);
        Task<Domain.Entities.User?> GetUserByIdAsync(Guid userId);
        Task<AuthResponseDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto);
        Task<string> UploadAvatarAsync(Guid userId, IFormFile file);
    }
}
