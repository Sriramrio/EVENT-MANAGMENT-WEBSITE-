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
using Microsoft.AspNetCore.ResponseCompression;
using static MSME.StallBooking.Application.Services.PaymentWorkflowService;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[]
    {
        "application/json",
        "application/javascript",
        "text/css",
        "text/plain",
        "image/svg+xml"
    });
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = System.IO.Compression.CompressionLevel.Fastest;
});
builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = System.IO.Compression.CompressionLevel.Fastest;
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

var jwtKey = builder.Configuration["Jwt:SigningKey"] ?? "CHANGE_THIS_DEVELOPMENT_SIGNING_KEY_MINIMUM_32_CHARS";
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

builder.Services.AddCors(options =>
{
    options.AddPolicy("AdminPortal", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:5173"];
        policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
    });
});
QuestPDF.Settings.License = LicenseType.Community;

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseResponseCompression();
app.UseSwagger();
app.UseSwaggerUI();
app.UseHttpsRedirection();
app.UseCors("AdminPortal");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<StallBookingDbContext>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var eventCode = config["EventDefaults:EventCode"] ?? "MSME-HOSUR-2026";
        var evt = await db.Events.FirstOrDefaultAsync(x => x.EventCode == eventCode.ToUpper())
            ?? await db.Events.FirstOrDefaultAsync();

        var tenant = await db.Tenants.FirstOrDefaultAsync();
        var tenantId = evt?.TenantId ?? tenant?.Id ?? Guid.Parse("11111111-1111-1111-1111-111111111111");
        var eventId = evt?.Id;

        var existingTemplates = await db.EmailTemplates
            .Where(x => x.TenantId == tenantId)
            .ToListAsync();

        var existingCodes = new HashSet<string>(
            existingTemplates.Select(x => x.TemplateCode),
            StringComparer.OrdinalIgnoreCase);

        bool hasNew = false;
        foreach (var (code, def) in EmailTemplateCatalog.AllTemplates)
        {
            if (!existingCodes.Contains(code))
            {
                var newTemplate = EmailTemplate.Create(
                    tenantId,
                    eventId,
                    code,
                    def.DefaultSubject,
                    def.DefaultHtmlBody,
                    "",
                    true);
                await db.EmailTemplates.AddAsync(newTemplate);
                hasNew = true;
            }
            else
            {
                var existing = existingTemplates.FirstOrDefault(t => string.Equals(t.TemplateCode, code, StringComparison.OrdinalIgnoreCase));
                if (existing != null && (code.StartsWith("EXHIBITOR_ADDITIONAL_REQUIREMENTS", StringComparison.OrdinalIgnoreCase) ||
                                         code.StartsWith("ADMIN_ADDITIONAL_REQUIREMENTS", StringComparison.OrdinalIgnoreCase)))
                {
                    if (!existing.BodyHtmlTemplate.Contains("{{notes}}", StringComparison.OrdinalIgnoreCase))
                    {
                        existing.Update(def.DefaultSubject, def.DefaultHtmlBody, existing.BodyTextTemplate, existing.IsActive);
                        hasNew = true;
                    }
                }
            }
        }

        if (hasNew)
        {
            await db.SaveChangesAsync();
        }

        // Seed permission & role for ExhibitorAdmin and ensure image_url column exists
        try
        {
            try
            {
                await db.Database.ExecuteSqlRawAsync("ALTER TABLE public.additional_requirement_items ADD COLUMN IF NOT EXISTS image_url text;");
                await db.Database.ExecuteSqlRawAsync("ALTER TABLE public.exhibitor_additional_requirements ADD COLUMN IF NOT EXISTS notes character varying(2000);");
            }
            catch { /* Ignore if already exists or permission restricted */ }

            var permCode = MSME.StallBooking.Application.Security.Permissions.ExhibitorRequirementsManage;
            var perm = await db.Permissions.FirstOrDefaultAsync(p => p.PermissionCode == permCode);
            if (perm == null)
            {
                perm = Permission.Create(permCode, "Exhibitor Requirements Manage", "ExhibitorManagement", "Manage", "Allows managing exhibitor additional requirements and catalog");
                perm.StampCreate(tenantId, eventId, null, "seed");
                await db.Permissions.AddAsync(perm);
                await db.SaveChangesAsync();
            }

            var exhibitorAdminRole = await db.Roles.FirstOrDefaultAsync(r => r.RoleCode == "ExhibitorAdmin");
            if (exhibitorAdminRole == null)
            {
                exhibitorAdminRole = Role.Create("ExhibitorAdmin", "Exhibitor Admin", "Exhibitor requirements and catalog management");
                exhibitorAdminRole.StampCreate(tenantId, eventId, null, "seed");
                await db.Roles.AddAsync(exhibitorAdminRole);
                await db.SaveChangesAsync();
            }

            var superAdminRole = await db.Roles.FirstOrDefaultAsync(r => r.RoleCode == "SuperAdmin");

            var hasExhibitorAdminPerm = await db.RolePermissions.AnyAsync(rp => rp.RoleId == exhibitorAdminRole.Id && rp.PermissionId == perm.Id);
            if (!hasExhibitorAdminPerm)
            {
                var rp = RolePermission.Create(exhibitorAdminRole.Id, perm.Id);
                rp.StampCreate(tenantId, eventId, null, "seed");
                await db.RolePermissions.AddAsync(rp);
            }

            if (superAdminRole != null)
            {
                var hasSuperAdminPerm = await db.RolePermissions.AnyAsync(rp => rp.RoleId == superAdminRole.Id && rp.PermissionId == perm.Id);
                if (!hasSuperAdminPerm)
                {
                    var rp = RolePermission.Create(superAdminRole.Id, perm.Id);
                    rp.StampCreate(tenantId, eventId, null, "seed");
                    await db.RolePermissions.AddAsync(rp);
                }
            }

            // Seed default ExhibitorAdmin user account
            var exhibitorAdminUser = await db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == "exhibitoradmin@lubmsmehosur.org");
            if (exhibitorAdminUser == null)
            {
                exhibitorAdminUser = User.Create(
                    "Exhibitor Requirements Admin",
                    "exhibitoradmin@lubmsmehosur.org",
                    "9876543210",
                    "DEV_ONLY_CHANGE_ME_12345");
                exhibitorAdminUser.StampCreate(tenantId, eventId, null, "seed");
                await db.Users.AddAsync(exhibitorAdminUser);
                await db.SaveChangesAsync();

                var userRole = UserRole.Create(exhibitorAdminUser.Id, exhibitorAdminRole.Id);
                userRole.StampCreate(tenantId, eventId, null, "seed");
                await db.UserRoles.AddAsync(userRole);
            }

            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
            logger.LogWarning(ex, "Note: Additional requirements table setup / role seed warning: {Message}", ex.Message);
        }
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Failed to auto-seed startup data.");
    }
}

app.Run();
