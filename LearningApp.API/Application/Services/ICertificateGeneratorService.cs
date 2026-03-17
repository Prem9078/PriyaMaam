using System;

namespace LearningApp.API.Application.Services
{
    public interface ICertificateGeneratorService
    {
        byte[] GenerateCertificate(string studentName, string courseTitle, DateTime issueDate, string certificateId);
    }
}
