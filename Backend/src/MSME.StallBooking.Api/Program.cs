using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MSME.StallBooking.Api.Middleware;
using MSME.StallBooking.Application.Abstractions;
using MSME.StallBooking.Application.Contracts;
using MSME.StallBooking.Application.Services;
using MSME.StallBooking.Application.Validation;
using MSME.StallBooking.Domain.Entities;
using MSME.StallBooking.Infrastructure.Documents;
using MSME.StallBooking.Infrastructure.Email;
using MSME.StallBooking.Infrastructure.QrCode;
using MSME.StallBooking.Infrastructure.Security;
using MSME.StallBooking.Infrastructure.Sequences;
using MSME.StallBooking.Persistence;
using MSME.StallBooking.Persistence.Repositories;
using QuestPDF.Infrastructure;
using System.Text;
using Microsoft.AspNetCore.HttpOverrides;
using static MSME.StallBooking.Application.Services.PaymentWorkflowService;

var builder = WebApplication.CreateBuilder(args);

// Render supplies PORT. Listen on all interfaces inside the container.
var renderPort = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(renderPort))
{
    if (!int.TryParse(renderPort, out var parsedPort) || parsedPort is < 1 or > 65535)
        throw new InvalidOperationException("Invalid Render PORT value.");
    builder.WebHost.UseUrls($"http://0.0.0.0:{parsedPort}");
}

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // Configure KnownProxies/KnownNetworks for the trusted proxy infrastructure
    // before enabling forwarded headers in production.
});

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

builder.Services.AddMemoryCache();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<StallBookingDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is missing.");
    options.UseNpgsql(connectionString);
});

var jwtKey = builder.Configuration["Jwt:SigningKey"];
if (string.IsNullOrWhiteSpace(jwtKey) || Encoding.UTF8.GetByteCount(jwtKey) < 32 ||
    jwtKey.StartsWith("CHANGE_THIS_", StringComparison.OrdinalIgnoreCase))
    throw new InvalidOperationException("Configure a strong Jwt:SigningKey (32+ bytes) using environment variables.");

if (string.IsNullOrWhiteSpace(builder.Configuration["Jwt:Issuer"]) ||
    string.IsNullOrWhiteSpace(builder.Configuration["Jwt:Audience"]))
    throw new InvalidOperationException("Jwt:Issuer and Jwt:Audience are required.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromMinutes(2)
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<ICurrentUser, SystemCurrentUser>();
builder.Services.AddScoped<IPermissionGuard, PermissionGuard>();
builder.Services.AddScoped<IEmailComposer, EmailComposer>();
builder.Services.AddScoped<IEmailSender, EmailSender>();
builder.Services.AddScoped<INumberSequenceService, NumberSequenceService>();
builder.Services.AddScoped<IProformaInvoicePdfGenerator, ProformaInvoicePdfGenerator>();
builder.Services.AddScoped<StallAllocationService>();
builder.Services.AddScoped<PaymentWorkflowService>();
builder.Services.AddScoped<InvoiceWorkflowService>();
builder.Services.AddValidatorsFromAssemblyContaining<SubmitBookingCommandValidator>();
builder.Services.AddScoped<IPaymentReceiptPdfGenerator, PaymentReceiptPdfGenerator>();
builder.Services.AddScoped<IQrCodeService, QrCodeService>();
builder.Services.AddScoped<VisitorWorkflowService>();
builder.Services.AddScoped<VipWorkflowService>(); 
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<CreateVisitorCommand>());
