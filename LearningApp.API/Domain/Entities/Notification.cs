using System;
using System.Text.Json.Serialization;

namespace LearningApp.API.Domain.Entities
{
    public class Notification
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string Type { get; set; } = "general"; // e.g. "certificate", "general"

        // Navigation
        [JsonIgnore]
        public User User { get; set; } = null!;
    }
}
