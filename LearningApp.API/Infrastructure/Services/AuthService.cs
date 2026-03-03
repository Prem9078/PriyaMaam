using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using LearningApp.API.Application.DTOs;
using LearningApp.API.Application.Services;
using LearningApp.API.Domain.Entities;
using LearningApp.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace LearningApp.API.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;

        public AuthService(AppDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            var exists = await _db.Users.AnyAsync(u => u.Email == dto.Email);
            if (exists)
                throw new InvalidOperationException("Email is already registered.");

            var user = new User
            {
                Name         = dto.Name,
                Email        = dto.Email,
                Phone        = dto.Phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role         = "Student"
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return new AuthResponseDto
            {
                Token = GenerateToken(user),
                Name  = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                Role  = user.Role
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email)
                       ?? throw new UnauthorizedAccessException("Invalid email or password.");

            if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                throw new UnauthorizedAccessException("Invalid email or password.");

            return new AuthResponseDto
            {
                Token = GenerateToken(user),
                Name  = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                Role  = user.Role
            };
        }

        private string GenerateToken(User user)
        {
            var jwtSettings = _config.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<AuthResponseDto> RefreshTokenAsync(Guid userId)
        {
            var user = await _db.Users.FindAsync(userId)
                       ?? throw new UnauthorizedAccessException("User not found.");

            return new AuthResponseDto
            {
                Token = GenerateToken(user),
                Name = user.Name,
                Email = user.Email,
                Role = user.Role
            };
        }

        public async Task<bool> EmailExistsAsync(string email)
            => await _db.Users.AnyAsync(u => u.Email.ToLower() == email.ToLower());

        public async Task<bool> ResetPasswordAsync(string email, string newPassword)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
            if (user == null) return false;

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<Domain.Entities.User?> GetUserByIdAsync(Guid userId)
            => await _db.Users.FindAsync(userId);
    }
}
