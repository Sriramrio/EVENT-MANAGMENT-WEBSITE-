namespace MSME.StallBooking.SharedKernel.Audit;

public abstract class AuditableEntity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
    public Guid TenantId { get; protected set; }
    public Guid? EventId { get; protected set; }

    public DateTimeOffset CreatedAt { get; protected set; } = DateTimeOffset.UtcNow;
    public Guid? CreatedBy { get; protected set; }
    public DateTimeOffset? UpdatedAt { get; protected set; }
    public Guid? UpdatedBy { get; protected set; }
    public DateTimeOffset? DeletedAt { get; protected set; }
    public Guid? DeletedBy { get; protected set; }
    public bool IsDeleted { get; protected set; }
    public string? CorrelationId { get; protected set; }

    public void StampCreate(Guid tenantId, Guid? eventId, Guid? actorUserId, string? correlationId)
    {
        TenantId = tenantId;
        EventId = eventId;
        CreatedAt = DateTimeOffset.UtcNow;
        CreatedBy = actorUserId;
        CorrelationId = correlationId;
    }

    public void StampUpdate(Guid? actorUserId, string? correlationId)
    {
        UpdatedAt = DateTimeOffset.UtcNow;
        UpdatedBy = actorUserId;
        CorrelationId = correlationId;
    }

    public void SoftDelete(Guid? actorUserId, string reason, string? correlationId)
    {
        if (IsDeleted) return;
        IsDeleted = true;
        DeletedAt = DateTimeOffset.UtcNow;
        DeletedBy = actorUserId;
        CorrelationId = correlationId;
    }
}
