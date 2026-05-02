using System;

namespace LearningApp.API.Application.DTOs
{
    public class CreateOrderDto
    {
        public Guid CourseId { get; set; }
    }

    public class CreateOrderResponseDto
    {
        public string OrderId { get; set; } = string.Empty;
        public long Amount { get; set; }          // in paise
        public string Currency { get; set; } = "INR";
        public string Key { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
    }

    public class VerifyPaymentDto
    {
        public Guid CourseId { get; set; }
        public string RazorpayOrderId { get; set; } = string.Empty;
        public string RazorpayPaymentId { get; set; } = string.Empty;
        public string RazorpaySignature { get; set; } = string.Empty;
    }
}
