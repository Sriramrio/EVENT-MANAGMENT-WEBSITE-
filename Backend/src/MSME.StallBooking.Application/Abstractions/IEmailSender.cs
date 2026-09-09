using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MSME.StallBooking.Application.Abstractions
{
    public interface IEmailSender
    {
        Task SendEmailAsync(string to, string subject, string body);
        Task SendEmailAsync(string to, string subject, string body, string? replyToEmail, string? replyToName = null);
        Task SendEmailWithAttachmentAsync(string to, string subject, string body, byte[] pdfBytes, string fileName, string? replyToEmail = null, string? replyToName = null);
        Task SendBulkEmailAsync(IReadOnlyList<EmailMessage> messages);
    }

    public sealed record EmailMessage(
        string To,
        string Subject,
        string Body,
        byte[]? PdfBytes = null,
        string? FileName = null);
}