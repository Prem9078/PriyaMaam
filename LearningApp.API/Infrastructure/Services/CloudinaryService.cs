using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using LearningApp.API.Application.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace LearningApp.API.Infrastructure.Services
{
    public class CloudinaryService : ICloudinaryService
    {
        private readonly Cloudinary _cloudinary;

        public CloudinaryService(IConfiguration config)
        {
            var section = config.GetSection("Cloudinary");
            var account = new Account(
                section["CloudName"],
                section["ApiKey"],
                section["ApiSecret"]
            );
            _cloudinary = new Cloudinary(account);
            _cloudinary.Api.Secure = true;
        }

        public async Task<CloudinaryUploadResult> UploadImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("No image file provided.");

            using var stream = file.OpenReadStream();

            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = "learningapp/thumbnails",
                UseFilename = true,
                UniqueFilename = true,
                Overwrite = false
            };

            var result = await _cloudinary.UploadAsync(uploadParams);

            if (result.Error != null)
                throw new Exception($"Cloudinary image upload failed: {result.Error.Message}");

            return new CloudinaryUploadResult
            {
                PublicId = result.PublicId,
                SecureUrl = result.SecureUrl.ToString()
            };
        }

        public async Task<CloudinaryUploadResult> UploadPdfAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("No file provided.");

            using var stream = file.OpenReadStream();

            var uploadParams = new RawUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = "learningapp/notes",
                UseFilename = true,
                UniqueFilename = true,
                AccessControl = new List<AccessControlRule>
                {
                    new AccessControlRule { AccessType = AccessType.Anonymous }
                }
            };

            var result = await _cloudinary.UploadAsync(uploadParams);

            if (result.Error != null)
                throw new Exception($"Cloudinary upload failed: {result.Error.Message}");

            return new CloudinaryUploadResult
            {
                PublicId = result.PublicId,
                SecureUrl = result.SecureUrl.ToString()
            };
        }

        public async Task<bool> DeleteFileAsync(string publicId)
        {
            var deleteParams = new DeletionParams(publicId)
            {
                ResourceType = ResourceType.Image
            };
            var result = await _cloudinary.DestroyAsync(deleteParams);
            return result.Result == "ok";
        }
    }
}
