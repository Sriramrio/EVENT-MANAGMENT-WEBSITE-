using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using MSME.StallBooking.Application.Abstractions;

namespace MSME.StallBooking.Infrastructure.Email;

public sealed class EmailSender : IEmailSender
{
    private readonly IConfiguration
        _configuration;

    private readonly ILogger<EmailSender>
        _logger;

    private static readonly SemaphoreSlim
        SmtpLock = new(1, 1);

    public EmailSender(
        IConfiguration configuration,
        ILogger<EmailSender> logger)
    {
        _configuration =
            configuration;

        _logger =
            logger;
    }

    public Task SendEmailAsync(
        string to,
        string subject,
        string body)
    {
        return SendEmailWithAttachmentAsync(
            to,
            subject,
            body,
            Array.Empty<byte>(),
            string.Empty);
    }

    public Task SendEmailAsync(
        string to,
        string subject,
        string body,
        string? replyToEmail,
        string? replyToName = null)
    {
        return SendEmailWithAttachmentAsync(
            to,
            subject,
            body,
            Array.Empty<byte>(),
            string.Empty,
            replyToEmail,
            replyToName);
    }

    /*
     * This method now supports PDF, PNG, JPG and other attachment types.
     * The MIME type is inferred from fileName inside BuildMessage().
     * Existing PDF calls do not need to be changed.
     */
    public async Task
        SendEmailWithAttachmentAsync(
            string to,
            string subject,
            string body,
            byte[] attachmentBytes,
            string fileName,
            string? replyToEmail = null,
            string? replyToName = null)
    {
        await SmtpLock.WaitAsync();

        try
        {
            using var client =
                await ConnectAsync();

            var message =
                BuildMessage(
                    to,
                    subject,
                    body,
                    attachmentBytes,
                    fileName,
                    replyToEmail,
                    replyToName);

            await client.SendAsync(
                message);

            await client.DisconnectAsync(
                true);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to send email to {To}",
                to);

            throw;
        }
        finally
        {
            SmtpLock.Release();
        }
    }

    public async Task SendBulkEmailAsync(
        IReadOnlyList<EmailMessage> messages)
    {
        if (messages.Count == 0)
        {
            return;
        }

        await SmtpLock.WaitAsync();

        try
        {
            using var client =
                await ConnectAsync();

            foreach (var item in messages)
            {
                try
                {
                    var message =
                        BuildMessage(
                            item.To,
                            item.Subject,
                            item.Body,
                            item.PdfBytes ??
                            Array.Empty<byte>(),
                            item.FileName ??
                            string.Empty);

                    await client.SendAsync(
                        message);

                    await Task.Delay(500);
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Failed to send bulk email to {To}",
                        item.To);
                }
            }

            await client.DisconnectAsync(
                true);
        }
        finally
        {
            SmtpLock.Release();
        }
    }

    private async Task
        <MailKit.Net.Smtp.SmtpClient>
        ConnectAsync()
    {
        var smtpServer =
            _configuration[
                "EmailSettings:SmtpServer"]
            ?? string.Empty;

        var smtpPort =
            int.TryParse(
                _configuration[
                    "EmailSettings:SmtpPort"],
                out var configuredPort)
                ? configuredPort
                : 587;

        var enableSsl =
            bool.TryParse(
                _configuration[
                    "EmailSettings:EnableSsl"],
                out var configuredSsl) &&
            configuredSsl;

        var username =
            _configuration[
                "EmailSettings:Username"]
            ?? string.Empty;

        var password =
            _configuration[
                "EmailSettings:Password"]
            ?? string.Empty;

        if (string.IsNullOrWhiteSpace(
                smtpServer) ||
            string.IsNullOrWhiteSpace(
                username) ||
            string.IsNullOrWhiteSpace(
                password))
        {
            throw new InvalidOperationException(
                "Email SMTP configuration is incomplete.");
        }

        // The checked-in appsettings value is a placeholder, not a real credential.
        // Fail with a clear, actionable message instead of a confusing Gmail auth error.
        if (password.Contains("SET_IN_USER_SECRETS_OR_ENVIRONMENT", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "EmailSettings:Password is still the placeholder value. Set the real Gmail App " +
                "Password via .NET User Secrets (dev) or the EmailSettings__Password environment " +
                "variable (prod), then restart the API.");
        }

        var client =
            new MailKit.Net.Smtp
                .SmtpClient();

        await client.ConnectAsync(
            smtpServer,
            smtpPort,
            enableSsl
                ? SecureSocketOptions.StartTls
                : SecureSocketOptions.None);

        await client.AuthenticateAsync(
            username,
            password);

        return client;
    }

    private MimeMessage BuildMessage(
        string to,
        string subject,
        string body,
        byte[] attachmentBytes,
        string fileName,
        string? replyToEmail = null,
        string? replyToName = null)
    {
        var fromEmail =
            _configuration[
                "EmailSettings:FromEmail"]
            ?? string.Empty;

        var fromName =
            _configuration[
                "EmailSettings:FromName"]
            ?? string.Empty;

        var defaultRecipient =
            _configuration[
                "EmailSettings:DefaultAlertRecipients"];

        var recipient =
            string.IsNullOrWhiteSpace(to)
                ? defaultRecipient?
                    .Split(
                        ',',
                        StringSplitOptions
                            .RemoveEmptyEntries)
                    .FirstOrDefault()
                    ?? string.Empty
                : to;

        if (string.IsNullOrWhiteSpace(
                fromEmail))
        {
            throw new InvalidOperationException(
                "EmailSettings:FromEmail is not configured.");
        }

        var message =
            new MimeMessage();

        message.From.Add(
            new MailboxAddress(
                fromName,
                fromEmail));

        if (!string.IsNullOrWhiteSpace(replyToEmail))
        {
            var cleanReplyTo = replyToEmail.Trim();
            var cleanReplyName = string.IsNullOrWhiteSpace(replyToName) ? cleanReplyTo : replyToName.Trim();
            message.ReplyTo.Add(new MailboxAddress(cleanReplyName, cleanReplyTo));
        }

        AddRecipients(
            message.To,
            recipient);

        AddRecipients(
            message.Cc,
            _configuration[
                "EmailSettings:CcRecipients"]);

        AddRecipients(
            message.Bcc,
            _configuration[
                "EmailSettings:BccRecipients"]);

        if (message.To.Count == 0)
        {
            throw new InvalidOperationException(
                "A valid email recipient was not provided.");
        }

        message.Subject =
            subject;

        var finalBody = EnsureEmailFooter(body);

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = finalBody,
            TextBody = ConvertHtmlToPlainText(finalBody)
        };

        if (attachmentBytes.Length > 0 && !string.IsNullOrWhiteSpace(fileName))
        {
            var mimeType = MimeTypes.GetMimeType(fileName);
            var isImage = mimeType.StartsWith("image/", StringComparison.OrdinalIgnoreCase);

            // If the HTML template references this image via inline CID, register it as an inline linked resource.
            if (isImage && body.Contains("cid:qr-code-inline", StringComparison.OrdinalIgnoreCase))
            {
                var linkedResource = bodyBuilder.LinkedResources.Add(fileName, attachmentBytes, MimeKit.ContentType.Parse(mimeType));
                linkedResource.ContentId = "qr-code-inline";
                linkedResource.ContentDisposition = new ContentDisposition(ContentDisposition.Inline);
            }

            // Always provide the file as a downloadable attachment (PDF, PNG, etc.)
            var attachment = bodyBuilder.Attachments.Add(fileName, attachmentBytes, MimeKit.ContentType.Parse(mimeType));
            attachment.ContentDisposition = new ContentDisposition(ContentDisposition.Attachment);
        }

        message.Body = bodyBuilder.ToMessageBody();

        return message;
    }

    private static string ConvertHtmlToPlainText(string html)
    {
        if (string.IsNullOrWhiteSpace(html))
        {
            return string.Empty;
        }

        var text = html
            .Replace("<br>", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("<br/>", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("<br />", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("</p>", "\n\n", StringComparison.OrdinalIgnoreCase)
            .Replace("</div>", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("</tr>", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("</li>", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("</h1>", "\n\n", StringComparison.OrdinalIgnoreCase)
            .Replace("</h2>", "\n\n", StringComparison.OrdinalIgnoreCase)
            .Replace("</h3>", "\n\n", StringComparison.OrdinalIgnoreCase);

        text = System.Text.RegularExpressions.Regex.Replace(text, "<[^>]+>", string.Empty);
        text = System.Net.WebUtility.HtmlDecode(text);
        text = System.Text.RegularExpressions.Regex.Replace(text, @"(\r?\n){3,}", "\n\n");

        return text.Trim();
    }

    private const string EmailFooterHtml = @"
<div style=""margin-top:32px; padding-top:20px; border-top:1px solid #e2e8f0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; color:#64748b; text-align:center; line-height:1.6;"">
    <p style=""margin:0 0 4px 0; font-size:13px; font-weight:600; color:#1e293b;"">
        Digital supported by <a href=""https://www.atribsglobal.com/"" target=""_blank"" style=""color:#0d6efd; text-decoration:none; font-weight:700;"">Atribs</a>
    </p>
    <p style=""margin:0; font-size:11px; color:#94a3b8;"">
        ATRIBS GLOBAL &bull; Technology &amp; Digital Transformation Partner &bull; <a href=""https://www.atribsglobal.com/"" target=""_blank"" style=""color:#0d6efd; text-decoration:none;"">www.atribsglobal.com</a>
    </p>
</div>";

    public static string EnsureEmailFooter(string html)
    {
        if (string.IsNullOrWhiteSpace(html))
        {
            return html;
        }

        if (html.Contains("Digital supported by Atribs", StringComparison.OrdinalIgnoreCase) ||
            html.Contains("Digital Support by Atribs", StringComparison.OrdinalIgnoreCase))
        {
            return html;
        }

        if (html.Contains("</body>", StringComparison.OrdinalIgnoreCase))
        {
            var idx = html.LastIndexOf("</body>", StringComparison.OrdinalIgnoreCase);
            return html.Insert(idx, EmailFooterHtml);
        }
        else if (html.TrimEnd().EndsWith("</div>", StringComparison.OrdinalIgnoreCase))
        {
            var idx = html.LastIndexOf("</div>", StringComparison.OrdinalIgnoreCase);
            return html.Insert(idx, EmailFooterHtml);
        }
        else
        {
            return html + EmailFooterHtml;
        }
    }

    private static void AddRecipients(
        InternetAddressList target,
        string? rawRecipients)
    {
        if (string.IsNullOrWhiteSpace(
                rawRecipients))
        {
            return;
        }

        var emailAddresses =
            rawRecipients
                .Split(
                    new[]
                    {
                        ',',
                        ';'
                    },
                    StringSplitOptions
                        .RemoveEmptyEntries)
                .Select(
                    value =>
                        value.Trim())
                .Where(
                    value =>
                        !string.IsNullOrWhiteSpace(
                            value))
                .Distinct(
                    StringComparer
                        .OrdinalIgnoreCase);

        foreach (var emailAddress in emailAddresses)
        {
            if (MailboxAddress.TryParse(emailAddress, out var mailbox))
            {
                target.Add(mailbox);
            }
            else
            {
                var cleaned = emailAddress.Trim();
                if (MailboxAddress.TryParse(cleaned, out var fallbackMailbox))
                {
                    target.Add(fallbackMailbox);
                }
            }
        }
    }
}