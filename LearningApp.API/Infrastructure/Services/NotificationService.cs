using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using LearningApp.API.Application.Services;
using LearningApp.API.Domain.Entities;
using LearningApp.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LearningApp.API.Infrastructure.Services
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _db;
        private readonly IHttpClientFactory _httpClientFactory;
        private const string ExpoApiUrl = "https://exp.host/--/api/v2/push/send";

        public NotificationService(AppDbContext db, IHttpClientFactory httpClientFactory)
        {
            _db = db;
            _httpClientFactory = httpClientFactory;
        }

        // ── Expo Push ────────────────────────────────────────────────────────

        public async Task RegisterTokenAsync(Guid userId, string token)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user is null) return;
            user.ExpoPushToken = token;
            await _db.SaveChangesAsync();
        }

        public async Task ClearTokenAsync(Guid userId)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user is null) return;
            user.ExpoPushToken = null;
            await _db.SaveChangesAsync();
        }

        public async Task SendToUserAsync(Guid userId, string title, string body, object? data = null)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user?.ExpoPushToken is null) return;
            await SendAsync(new List<string> { user.ExpoPushToken }, title, body, data);
        }

        public async Task SendToAllStudentsAsync(string title, string body, object? data = null)
        {
            var tokens = await _db.Users
                .Where(u => u.Role == "Student" && u.ExpoPushToken != null)
                .Select(u => u.ExpoPushToken!)
                .ToListAsync();
            if (tokens.Count == 0) return;
            await SendAsync(tokens, title, body, data);
        }

        public async Task SendToEnrolledStudentsAsync(Guid courseId, string title, string body, object? data = null)
        {
            var tokens = await _db.Enrollments
                .Where(e => e.CourseId == courseId)
                .Include(e => e.User)
                .Where(e => e.User.ExpoPushToken != null)
                .Select(e => e.User.ExpoPushToken!)
                .ToListAsync();
            if (tokens.Count == 0) return;
            await SendAsync(tokens, title, body, data);
        }

        public async Task SendBroadcastAsync(string title, string body, object? data = null)
        {
            var tokens = await _db.Users
                .Where(u => u.ExpoPushToken != null)
                .Select(u => u.ExpoPushToken!)
                .ToListAsync();
            if (tokens.Count == 0) return;
            await SendAsync(tokens, title, body, data);
        }

        // ── In-App Notifications ─────────────────────────────────────────────

        public async Task CreateNotificationAsync(Guid userId, string title, string message, string type = "general")
        {
            var notification = new Notification
            {
                UserId  = userId,
                Title   = title,
                Message = message,
                Type    = type
            };
            _db.Notifications.Add(notification);
            await _db.SaveChangesAsync();
        }

        public async Task<List<Notification>> GetNotificationsAsync(Guid userId)
        {
            return await _db.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        public async Task MarkReadAsync(Guid notificationId, Guid userId)
        {
            var notification = await _db.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);
            if (notification is null) return;
            notification.IsRead = true;
            await _db.SaveChangesAsync();
        }

        public async Task MarkAllReadAsync(Guid userId)
        {
            var unread = await _db.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();
            foreach (var n in unread)
                n.IsRead = true;
            await _db.SaveChangesAsync();
        }

        // ── Private helper ───────────────────────────────────────────────────
        private async Task SendAsync(List<string> tokens, string title, string body, object? data)
        {
            Console.WriteLine($"[Notifications] Attempting to send '{title}' to {tokens.Count} token(s)...");
            var messages = tokens.Select(token => new
            {
                to    = token,
                title = title,
                body  = body,
                sound = "default",
                data  = data ?? new { }
            });

            var json    = JsonSerializer.Serialize(messages);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var client  = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("Accept", "application/json");
            client.DefaultRequestHeaders.Add("Accept-Encoding", "gzip, deflate");

            try
            {
                var response        = await client.PostAsync(ExpoApiUrl, content);
                var responseContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[Notifications] Expo API Response: {response.StatusCode} | Body: {responseContent}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Notifications] Error sending to Expo API: {ex.Message}");
            }
        }
    }
}
