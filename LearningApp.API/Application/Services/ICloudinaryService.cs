using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace LearningApp.API.Application.Services
{
    public class CloudinaryUploadResult
    {
        public string PublicId { get; set; } = string.Empty;
        public string SecureUrl { get; set; } = string.Empty;
    }

    public interface ICloudinaryService
    {
        Task<CloudinaryUploadResult> UploadImageAsync(IFormFile file);
        Task<CloudinaryUploadResult> UploadPdfAsync(IFormFile file);
        Task<bool> DeleteFileAsync(string publicId);
    }
}
