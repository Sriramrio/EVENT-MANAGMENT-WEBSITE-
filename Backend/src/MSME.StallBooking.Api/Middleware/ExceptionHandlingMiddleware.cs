using System.Net;
using System.Text.Json;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using MSME.StallBooking.SharedKernel.Errors;

namespace MSME.StallBooking.Api.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            await WriteAsync(context, HttpStatusCode.BadRequest, ErrorCodes.ValidationFailed, "Validation failed.", ex.Errors.GroupBy(e => e.PropertyName).ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray()));
        }
        catch (DomainRuleException ex)
        {
            var status = ex.ErrorCode switch
            {
                ErrorCodes.Forbidden => HttpStatusCode.Forbidden,
                ErrorCodes.Unauthorized => HttpStatusCode.Unauthorized,
                ErrorCodes.EntityNotFound or ErrorCodes.BookingNotFound or ErrorCodes.StallNotFound or ErrorCodes.PaymentNotFound => HttpStatusCode.NotFound,
                ErrorCodes.ConcurrencyConflict or ErrorCodes.DatabaseConstraintViolation or ErrorCodes.StallAlreadyBlocked or ErrorCodes.InvoiceAlreadyGenerated or ErrorCodes.EmailAlreadyExists => HttpStatusCode.Conflict,
                _ => (HttpStatusCode)422
            };
            await WriteAsync(context, status, ex.ErrorCode, ex.Message, ex.Details);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            _logger.LogWarning(ex, "Concurrency conflict");
            await WriteAsync(context, HttpStatusCode.Conflict, ErrorCodes.ConcurrencyConflict, "The record was changed by another user. Please reload and try again.", null);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database constraint/update failure");
            var isDuplicateEmail = ex.InnerException?.Message.Contains("IX_Users_Email", StringComparison.OrdinalIgnoreCase) == true
                || ex.InnerException?.Message.Contains("email", StringComparison.OrdinalIgnoreCase) == true;
            if (isDuplicateEmail)
            {
                await WriteAsync(context, HttpStatusCode.Conflict, ErrorCodes.EmailAlreadyExists, "Email already exists.", null);
                return;
            }
            await WriteAsync(context, HttpStatusCode.Conflict, ErrorCodes.DatabaseConstraintViolation, "The database rejected the operation because of a constraint or data integrity rule.", null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled API exception: {Message}", ex.Message);
            try {
                System.IO.File.AppendAllText("last_api_error.log", $"[{DateTime.UtcNow:O}] {ex}\n\n");
            } catch {}
            await WriteAsync(context, HttpStatusCode.InternalServerError, "INTERNAL_SERVER_ERROR", ex.Message, new[] { ex.ToString() });
        }
    }

    private static async Task WriteAsync(HttpContext context, HttpStatusCode status, string errorCode, string message, object? details)
    {
        if (context.Response.HasStarted) return;
        context.Response.StatusCode = (int)status;
        context.Response.ContentType = "application/json";
        var payload = new
        {
            traceId = context.TraceIdentifier,
            errorCode,
            message,
            title = message,
            detail = message,
            details = details ?? Array.Empty<object>(),
            timestamp = DateTimeOffset.UtcNow
        };
        await JsonSerializer.SerializeAsync(context.Response.Body, payload, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
    }
}
