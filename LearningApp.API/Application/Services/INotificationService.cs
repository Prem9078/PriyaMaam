using System;
using System.Threading.Tasks;

namespace LearningApp.API.Application.Services
{
    public interface INotificationService
    {
        /// <summary>Save or update the Expo push token for a user.</summary>
        Task RegisterTokenAsync(Guid userId, string token);

        /// <summary>Clear the Expo push token for a user (call on logout).</summary>
        Task ClearTokenAsync(Guid userId);

        /// <summary>Send a push notification to a single user by their userId.</summary>
        Task SendToUserAsync(Guid userId, string title, string body, object? data = null);

        /// <summary>Send a push notification to all students who have tokens.</summary>
        Task SendToAllStudentsAsync(string title, string body, object? data = null);

        /// <summary>Send a push notification to all students enrolled in a specific course.</summary>
        Task SendToEnrolledStudentsAsync(Guid courseId, string title, string body, object? data = null);
    }
}
