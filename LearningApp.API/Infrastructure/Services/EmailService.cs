using System.Collections.Generic;
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

        // ─── Shared SMTP sender ───────────────────────────────────────────────
        private async Task SendAsync(string toEmail, string subject, string htmlBody)
        {
            var section  = _config.GetSection("Email");
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

            var message = new MailMessage
            {
                From       = new MailAddress(from, display),
                Subject    = subject,
                Body       = htmlBody,
                IsBodyHtml = true,
            };
            message.To.Add(toEmail);
            await client.SendMailAsync(message);
        }

        private static string Wrap(string content) => $@"
<div style=""font-family:'Segoe UI',sans-serif;max-width:520px;margin:auto;background:#fff;border:1px solid #E0DEFF;border-radius:16px;overflow:hidden"">
  <div style=""background:#4B42D6;padding:24px 32px"">
    <h2 style=""color:#fff;margin:0;font-size:22px"">Priya Ma'am 📚</h2>
    <p style=""color:rgba(255,255,255,0.75);margin:4px 0 0;font-size:13px"">हिंदी साहित्य सरल भाषा में</p>
  </div>
  <div style=""padding:28px 32px"">
    {content}
  </div>
  <div style=""background:#F5F6FF;padding:14px 32px;text-align:center"">
    <p style=""font-size:11px;color:#aaa;margin:0"">© Priya Ma'am Learning App · Do not reply to this email.</p>
  </div>
</div>";

        // ─── 1: OTP (existing — kept for compatibility) ───────────────────────
        public Task SendOtpAsync(string toEmail, string otp,
            string subject = "Verification OTP — Priya Ma'am",
            string heading = "Email Verification")
        {
            var body = Wrap($@"
<h3 style=""color:#1a1a2e;margin-top:0"">{heading}</h3>
<p style=""font-size:15px;color:#444"">Your one-time code is:</p>
<div style=""font-size:40px;font-weight:900;letter-spacing:12px;color:#4B42D6;text-align:center;padding:20px 0"">{otp}</div>
<p style=""font-size:13px;color:#999"">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>");

            return SendAsync(toEmail, subject, body);
        }

        // ─── 2: Welcome after registration ───────────────────────────────────
        public Task SendWelcomeAsync(string toEmail, string name)
        {
            var body = Wrap($@"
<h3 style=""color:#1a1a2e;margin-top:0"">Welcome aboard, {name}! 🎉</h3>
<p style=""color:#444;line-height:1.6"">
  Your account has been successfully created on <strong>Priya Ma'am</strong> — the best place to learn Hindi Literature easily.
</p>
<p style=""color:#444;line-height:1.6"">Here's what you can do next:</p>
<ul style=""color:#555;line-height:1.8"">
  <li>📚 Browse and enrol in courses</li>
  <li>📝 Take mock tests in each lesson</li>
  <li>🏆 Check your rank on the leaderboard</li>
</ul>
<p style=""color:#888;font-size:13px"">Happy learning! 🌟</p>");

            return SendAsync(toEmail, "Welcome to Priya Ma'am 📚", body);
        }

        // ─── 3: Course enrollment confirmation ───────────────────────────────
        public Task SendEnrollmentConfirmAsync(string toEmail, string name, string courseTitle)
        {
            var body = Wrap($@"
<h3 style=""color:#1a1a2e;margin-top:0"">You're enrolled! 🎓</h3>
<p style=""color:#444;line-height:1.6"">Hi <strong>{name}</strong>, you have successfully enrolled in:</p>
<div style=""background:#F0EFFF;border-left:4px solid #4B42D6;border-radius:8px;padding:14px 18px;margin:16px 0"">
  <strong style=""color:#4B42D6;font-size:16px"">{courseTitle}</strong>
</div>
<p style=""color:#444;line-height:1.6"">Head to the app, open the course, and start your first lesson today. Best of luck! 💪</p>");

            return SendAsync(toEmail, $"Enrolled: {courseTitle} — Priya Ma'am", body);
        }

        // ─── 4: Quiz result ───────────────────────────────────────────────────
        public Task SendQuizResultAsync(string toEmail, string name,
            string quizTitle, int score, int total, double percentage)
        {
            var passed   = percentage >= 60;
            var emoji    = passed ? "🎉" : "💪";
            var verdict  = passed ? "Passed" : "Keep Practising";
            var barColor = percentage >= 70 ? "#27ae60" : percentage >= 40 ? "#f39c12" : "#e74c3c";
            var barWidth = (int)percentage;

            var body = Wrap($@"
<h3 style=""color:#1a1a2e;margin-top:0"">Quiz Result {emoji}</h3>
<p style=""color:#444"">Hi <strong>{name}</strong>, here are your results for:</p>
<div style=""background:#F0EFFF;border-left:4px solid #4B42D6;border-radius:8px;padding:14px 18px;margin:16px 0"">
  <strong style=""color:#4B42D6;font-size:15px"">{quizTitle}</strong>
</div>
<table style=""width:100%;border-collapse:collapse;margin-bottom:16px"">
  <tr>
    <td style=""padding:8px;color:#888;width:50%"">Score</td>
    <td style=""padding:8px;font-weight:700;color:#1a1a2e"">{score} / {total}</td>
  </tr>
  <tr style=""background:#F9F9F9"">
    <td style=""padding:8px;color:#888"">Percentage</td>
    <td style=""padding:8px;font-weight:700;color:{barColor}"">{percentage}%</td>
  </tr>
  <tr>
    <td style=""padding:8px;color:#888"">Result</td>
    <td style=""padding:8px;font-weight:700;color:{barColor}"">{verdict}</td>
  </tr>
</table>
<div style=""background:#f0f0f0;border-radius:8px;height:10px;overflow:hidden"">
  <div style=""background:{barColor};height:100%;width:{barWidth}%;border-radius:8px""></div>
</div>
<p style=""color:#888;font-size:13px;margin-top:16px"">Open the app to view the leaderboard and see how you compare with other students!</p>");

            return SendAsync(toEmail, $"Quiz Result: {score}/{total} in {quizTitle} — Priya Ma'am", body);
        }

        // ─── 5: New course published (bulk) ──────────────────────────────────
        public async Task SendNewCourseAsync(IEnumerable<string> emails, string courseTitle)
        {
            var body = Wrap($@"
<h3 style=""color:#1a1a2e;margin-top:0"">New Course Available! 📚</h3>
<p style=""color:#444;line-height:1.6"">A new course has just been published on <strong>Priya Ma'am</strong>:</p>
<div style=""background:#F0EFFF;border-left:4px solid #4B42D6;border-radius:8px;padding:14px 18px;margin:16px 0"">
  <strong style=""color:#4B42D6;font-size:16px"">{courseTitle}</strong>
</div>
<p style=""color:#444;line-height:1.6"">Open the app to browse the course and enrol now before it fills up!</p>");

            foreach (var email in emails)
            {
                try { await SendAsync(email, $"New Course: {courseTitle} — Priya Ma'am", body); }
                catch { /* skip failed recipients so others still get the email */ }
            }
        }

        // ─── 6: New quiz in a lesson (bulk) ──────────────────────────────────
        public async Task SendNewQuizAsync(IEnumerable<string> emails, string lessonTitle, string quizTitle)
        {
            var body = Wrap($@"
<h3 style=""color:#1a1a2e;margin-top:0"">New Quiz Ready! 📝</h3>
<p style=""color:#444;line-height:1.6"">A new mock test has been added to <strong>{lessonTitle}</strong>:</p>
<div style=""background:#F0EFFF;border-left:4px solid #4B42D6;border-radius:8px;padding:14px 18px;margin:16px 0"">
  <strong style=""color:#4B42D6;font-size:15px"">{quizTitle}</strong>
</div>
<p style=""color:#444;line-height:1.6"">Open the app, go to the lesson, and attempt the quiz. Check the leaderboard after submitting! 🏆</p>");

            foreach (var email in emails)
            {
                try { await SendAsync(email, $"New Quiz: {quizTitle} — Priya Ma'am", body); }
                catch { /* skip failed recipients */ }
            }
        }

        // ─── 7: Password changed / reset confirmation ─────────────────────────
        public Task SendPasswordChangedAsync(string toEmail, string name)
        {
            var body = Wrap($@"
<h3 style=""color:#1a1a2e;margin-top:0"">Password Changed 🔐</h3>
<p style=""color:#444;line-height:1.6"">Hi <strong>{name}</strong>, your password was successfully changed.</p>
<p style=""color:#444;line-height:1.6"">If you did <strong>not</strong> make this change, please contact us immediately and reset your password from the app.</p>
<p style=""color:#888;font-size:13px"">Stay safe! 🛡️</p>");

            return SendAsync(toEmail, "Password Changed — Priya Ma'am", body);
        }
    }
}
