using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using LearningApp.API.Domain.Entities;

namespace LearningApp.API.Application.Services
{
    public interface INotificationService
    {
        // ── Expo Push (existing) ────────────────────────────────────────────
        Task RegisterTokenAsync(Guid userId, string token);
        Task ClearTokenAsync(Guid userId);
        Task SendToUserAsync(Guid userId, string title, string body, object? data = null);
        Task SendToAllStudentsAsync(string title, string body, object? data = null);
        Task SendToEnrolledStudentsAsync(Guid courseId, string title, string body, object? data = null);
        Task SendBroadcastAsync(string title, string body, object? data = null);

        // ── In-App Notifications ────────────────────────────────────────────
        Task CreateNotificationAsync(Guid userId, string title, string message, string type = "general");
        Task<List<Notification>> GetNotificationsAsync(Guid userId);
        Task MarkReadAsync(Guid notificationId, Guid userId);
        Task MarkAllReadAsync(Guid userId);
    }
}
