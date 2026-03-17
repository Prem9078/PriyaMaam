using System.ComponentModel.DataAnnotations;

namespace LearningApp.API.Application.DTOs
{
    public class UpdateProfileDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Phone { get; set; } = string.Empty;
    }
}
