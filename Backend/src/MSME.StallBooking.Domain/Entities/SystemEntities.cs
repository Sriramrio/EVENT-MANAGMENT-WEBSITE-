using MSME.StallBooking.Domain.Enums;
using MSME.StallBooking.SharedKernel.Audit;
using MSME.StallBooking.SharedKernel.Errors;

namespace MSME.StallBooking.Domain.Entities;

public sealed class FileAttachment : AuditableEntity
{
    private FileAttachment() { }
    public Guid? BookingId { get; private set; }
    public FileCategory FileCategory { get; private set; }
    public string OriginalFileName { get; private set; } = "";
    public string StoredFileName { get; private set; } = "";
    public string ContentType { get; private set; } = "";
    public long FileSizeBytes { get; private set; }
    public string ChecksumSha256 { get; private set; } = "";
    public string StoragePath { get; private set; } = "";
    public Guid? UploadedBy { get; private set; }
    public DateTimeOffset UploadedAt { get; private set; } = DateTimeOffset.UtcNow;
    public FileScanStatus ScanStatus { get; private set; } = FileScanStatus.Pending;
}

public sealed class EmailTemplate : AuditableEntity
{
    private EmailTemplate() { }
    public string TemplateCode { get; private set; } = "";
    public string SubjectTemplate { get; private set; } = "";
    public string BodyHtmlTemplate { get; private set; } = "";
    public string BodyTextTemplate { get; private set; } = "";
    public bool IsActive { get; private set; } = true;

    public static EmailTemplate Create(
        Guid tenantId,
        Guid? eventId,
        string templateCode,
        string subjectTemplate,
        string bodyHtmlTemplate,
        string bodyTextTemplate = "",
        bool isActive = true)
    {
        return new EmailTemplate
        {
            TenantId = tenantId,
            EventId = eventId,
            TemplateCode = templateCode.Trim().ToUpperInvariant(),
            SubjectTemplate = subjectTemplate.Trim(),
            BodyHtmlTemplate = bodyHtmlTemplate,
            BodyTextTemplate = bodyTextTemplate,
            IsActive = isActive
        };
    }

    public void Update(
        string subjectTemplate,
        string bodyHtmlTemplate,
        string? bodyTextTemplate = null,
        bool? isActive = null)
    {
        SubjectTemplate = subjectTemplate.Trim();
        BodyHtmlTemplate = bodyHtmlTemplate;
        if (bodyTextTemplate != null)
        {
            BodyTextTemplate = bodyTextTemplate;
        }
        if (isActive.HasValue)
        {
            IsActive = isActive.Value;
        }
    }
}
public sealed class EmailLog : AuditableEntity
{
    private EmailLog() { }
    public Guid? BookingId { get; private set; }
    public string ToEmail { get; private set; } = "";
    public string? CcEmail { get; private set; }
    public string? BccEmail { get; private set; }
    public string Subject { get; private set; } = "";
    public string BodySnapshot { get; private set; } = "";
    public string TemplateCode { get; private set; } = "";
    public EmailStatus Status { get; private set; } = EmailStatus.Pending;
    public string? ProviderMessageId { get; private set; }
    public string? FailureReason { get; private set; }
    public DateTimeOffset? SentAt { get; private set; }
    public int RetryCount { get; private set; }

    public static EmailLog Create(Guid tenantId, Guid? eventId, Guid? bookingId, string to, string subject, string body, string templateCode)
    {
        return new EmailLog
        {
            TenantId = tenantId,
            EventId = eventId,
            BookingId = bookingId,
            ToEmail = to.Trim().ToLowerInvariant(),
            Subject = subject.Trim(),
            BodySnapshot = body,
            TemplateCode = templateCode,
            Status = EmailStatus.Pending
        };
    }

    public void MarkSent(string? providerMessageId)
    {
        Status = EmailStatus.Sent;
        ProviderMessageId = providerMessageId;
        SentAt = DateTimeOffset.UtcNow;
    }
    public void MarkFailed(string? failureReason)
    {
        Status = EmailStatus.Failed;
        FailureReason = failureReason;
    }
}

public sealed class User : AuditableEntity
{
    private User() { }
    public string FullName { get; private set; } = "";
    public string Email { get; private set; } = "";
    public string? Mobile { get; private set; }
    public string PasswordHash { get; private set; } = "";
    public bool IsActive { get; private set; } = true;
    public DateTimeOffset? LastLoginAt { get; private set; }
    public int FailedLoginCount { get; private set; }
    public DateTimeOffset? LockedUntil { get; private set; }

    public static User Create(string fullName, string email, string? mobile, string passwordHash) => new()
    {
        FullName = fullName.Trim(),
        Email = email.Trim().ToLowerInvariant(),
        Mobile = string.IsNullOrWhiteSpace(mobile) ? null : mobile.Trim(),
        PasswordHash = passwordHash,
        IsActive = true
    };

    /// <summary>Used by the buyer/seller Settings → Change Password flow. Caller is responsible
    /// for verifying the current password before calling this.</summary>
    public void SetPasswordHash(string newPasswordHash) => PasswordHash = newPasswordHash;
}

public sealed class Role : AuditableEntity
{
    private Role() { }
    public string RoleCode { get; private set; } = "";
    public string RoleName { get; private set; } = "";
    public string? Description { get; private set; }
    public bool IsSystemRole { get; private set; }
    public bool IsActive { get; private set; } = true;

    public static Role Create(string roleCode, string roleName, string? description = null) => new()
    {
        RoleCode = roleCode,
        RoleName = roleName,
        Description = description,
        IsSystemRole = false,
        IsActive = true
    };
}

public sealed class Permission : AuditableEntity
{
    private Permission() { }
    public string PermissionCode { get; private set; } = "";
    public string PermissionName { get; private set; } = "";
    public string ModuleName { get; private set; } = "";
    public string ActionName { get; private set; } = "";
    public string? Description { get; private set; }
    public bool IsActive { get; private set; } = true;

    public static Permission Create(string permissionCode, string permissionName, string moduleName, string actionName, string? description = null) => new()
    {
        PermissionCode = permissionCode.Trim().ToLowerInvariant(),
        PermissionName = permissionName.Trim(),
        ModuleName = moduleName.Trim(),
        ActionName = actionName.Trim(),
        Description = description,
        IsActive = true
    };
}

public sealed class UserRole : AuditableEntity
{
    private UserRole() { }
    public Guid UserId { get; private set; }
    public Guid RoleId { get; private set; }
    public DateOnly ValidFrom { get; private set; }
    public DateOnly? ValidTo { get; private set; }
    public bool IsActive { get; private set; } = true;

    public static UserRole Create(Guid userId, Guid roleId) => new()
    {
        UserId = userId,
        RoleId = roleId,
        ValidFrom = DateOnly.FromDateTime(DateTime.UtcNow),
        IsActive = true
    };
}

public sealed class RolePermission : AuditableEntity
{
    private RolePermission() { }
    public Guid RoleId { get; private set; }
    public Guid PermissionId { get; private set; }

    public static RolePermission Create(Guid roleId, Guid permissionId) => new()
    {
        RoleId = roleId,
        PermissionId = permissionId
    };
}

public sealed class AuditLog
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid TenantId { get; private set; }
    public Guid? EventId { get; private set; }
    public Guid? ActorUserId { get; private set; }
    public string EntityName { get; private set; } = "";
    public Guid EntityId { get; private set; }
    public string Action { get; private set; } = "";
    public string? OldValuesJson { get; private set; }
    public string? NewValuesJson { get; private set; }
    public string? IpAddress { get; private set; }
    public string? UserAgent { get; private set; }
    public string? CorrelationId { get; private set; }
    public DateTimeOffset OccurredAt { get; private set; } = DateTimeOffset.UtcNow;


    public static AuditLog Create(Guid tenantId, Guid? eventId, Guid? actorUserId, string entityName, Guid entityId, string action, string? oldValuesJson, string? newValuesJson, string? correlationId)
    {
        return new AuditLog
        {
            TenantId = tenantId,
            EventId = eventId,
            ActorUserId = actorUserId,
            EntityName = entityName.Trim(),
            EntityId = entityId,
            Action = action.Trim(),
            OldValuesJson = oldValuesJson,
            NewValuesJson = newValuesJson,
            CorrelationId = correlationId,
            OccurredAt = DateTimeOffset.UtcNow
        };
    }
}

public sealed class NumberSequence : AuditableEntity
{
    private NumberSequence() { }
    public string SequenceCode { get; private set; } = "";
    public DateOnly? SequenceDate { get; private set; }
    public string Prefix { get; private set; } = "";
    public long CurrentNumber { get; private set; }
    public int PaddingLength { get; private set; } = 4;
    public SequenceResetFrequency ResetFrequency { get; private set; }
        = SequenceResetFrequency.Never;
    public string Next(DateOnly date)
    {
        SequenceDate = date;
        CurrentNumber += 1;

        return $"{Prefix}{date:yyyyMMdd}-" +
               $"{CurrentNumber.ToString().PadLeft(PaddingLength, '0')}";
    }
    public void EnsureMinimum(long minimum)          // ← NEW
    {
        if (CurrentNumber < minimum)
        {
            CurrentNumber = minimum;
        }
    }

    public void SetResetFrequency(SequenceResetFrequency resetFrequency)   // ← NEW
    {
        ResetFrequency = resetFrequency;
    }

    public static NumberSequence Create(
    Guid tenantId,
    Guid eventId,
    string sequenceCode,
    string prefix,
    int paddingLength,
    SequenceResetFrequency resetFrequency,
    DateOnly sequenceDate, long startingNumber = 0)
    {
        return new NumberSequence
        {
            TenantId = tenantId,
            EventId = eventId,
            SequenceCode = sequenceCode,
            Prefix = prefix,
            PaddingLength = paddingLength,
            ResetFrequency = resetFrequency,
            SequenceDate = sequenceDate,
            CurrentNumber = 0
        };
    }
}

public sealed class DashboardSnapshot
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid TenantId { get; private set; }
    public Guid EventId { get; private set; }
    public DateOnly SnapshotDate { get; private set; }
    public int TotalStalls { get; private set; }
    public int AvailableStalls { get; private set; }
    public int BlockedStalls { get; private set; }
    public int FrozenStalls { get; private set; }
    public int ReleasedStalls { get; private set; }
    public int PaymentPendingCount { get; private set; }
    public int PaymentReceivedCount { get; private set; }
    public int PaymentVerifiedCount { get; private set; }
    public int PaymentRejectedCount { get; private set; }
    public int InvoiceGeneratedCount { get; private set; }
    public int InvoiceSentCount { get; private set; }
    public int InvoicePendingCount { get; private set; }
    public string SnapshotJson { get; private set; } = "{}";
    public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
}