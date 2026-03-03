using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace LearningApp.API.Infrastructure.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config) => _config = config;

        public async Task SendOtpAsync(string toEmail, string otp,
            string subject = "Verification OTP — Priya Ma'am",
            string heading = "Email Verification")
        {
            var section = _config.GetSection("Email");
            var host     = section["Host"]!;
            var port     = int.Parse(section["Port"]!);
            var from     = section["From"]!;
            var password = section["Password"]!;
            var display  = section["DisplayName"] ?? "Priya Ma'am";

            using var client = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(from, password),
                EnableSsl   = true,
            };

            var body = $@"
<div style=""font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #E0E0E0;border-radius:12px"">
  <h2 style=""color:#4B42D6;margin-bottom:4px"">Priya Ma'am 📚</h2>
  <p style=""color:#888;font-size:13px"">हिंदी साहित्य सरल भाषा में</p>
  <hr style=""margin:16px 0""/>
  <h3 style=""color:#1a1a2e"">{heading}</h3>
  <p style=""font-size:15px"">Your one-time code is:</p>
  <div style=""font-size:36px;font-weight:900;letter-spacing:10px;color:#4B42D6;text-align:center;padding:16px 0"">{otp}</div>
  <p style=""font-size:13px;color:#999"">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
</div>";

            var message = new MailMessage
            {
                From       = new MailAddress(from, display),
                Subject    = subject,
                Body       = body,
                IsBodyHtml = true,
            };
            message.To.Add(toEmail);

            await client.SendMailAsync(message);
        }
    }
}
