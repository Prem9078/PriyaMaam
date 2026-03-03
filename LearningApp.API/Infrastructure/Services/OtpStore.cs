using System;
using System.Collections.Concurrent;

namespace LearningApp.API.Infrastructure.Services
{
    /// <summary>
    /// In-memory OTP store. Stores OTP + expiry per email.
    /// OTPs expire after 10 minutes.
    /// </summary>
    public class OtpStore
    {
        private readonly ConcurrentDictionary<string, (string Code, DateTime Expiry)> _store = new();

        public string Generate(string email)
        {
            var code = new Random().Next(100000, 999999).ToString();
            _store[email.ToLower()] = (code, DateTime.UtcNow.AddMinutes(10));
            return code;
        }

        public bool Verify(string email, string code)
        {
            var key = email.ToLower();
            if (!_store.TryGetValue(key, out var entry)) return false;
            if (DateTime.UtcNow > entry.Expiry) { _store.TryRemove(key, out _); return false; }
            if (!string.Equals(entry.Code, code.Trim(), StringComparison.Ordinal)) return false;

            _store.TryRemove(key, out _); // consume OTP
            return true;
        }
    }
}
