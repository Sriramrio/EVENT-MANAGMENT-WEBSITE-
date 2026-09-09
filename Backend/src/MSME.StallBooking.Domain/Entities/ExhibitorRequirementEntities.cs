using MSME.StallBooking.Domain.Enums;
using MSME.StallBooking.SharedKernel.Audit;

namespace MSME.StallBooking.Domain.Entities;

/// <summary>
/// Master catalog item for additional requirements (e.g. extra chairs, 3-phase power, spotlights).
/// Catalog starts empty. Items are created and managed by ExhibitorAdmin.
/// </summary>
public sealed class AdditionalRequirementItem : AuditableEntity
{
    private AdditionalRequirementItem() { }

    public string Code { get; private set; } = "";
    public string Name { get; private set; } = "";
    public decimal BaseAmount { get; private set; }
    public decimal GstPercentage { get; private set; } = 18m;
    public string? ImageUrl { get; private set; }
    public bool IsActive { get; private set; } = true;

    public static AdditionalRequirementItem Create(
        Guid tenantId,
        Guid? eventId,
        string code,
        string name,
        decimal baseAmount,
        decimal gstPercentage,
        string? imageUrl = null,
        Guid? createdBy = null,
        string? correlationId = null)
    {
        var item = new AdditionalRequirementItem
        {
            Code = code.Trim().ToUpperInvariant(),
            Name = name.Trim(),
            BaseAmount = baseAmount,
            GstPercentage = gstPercentage,
            ImageUrl = string.IsNullOrWhiteSpace(imageUrl) ? null : imageUrl.Trim(),
            IsActive = true
        };
        item.StampCreate(tenantId, eventId, createdBy, correlationId);
        return item;
    }

    public void Update(
        string name,
        decimal baseAmount,
        decimal gstPercentage,
        string? imageUrl = null,
        bool? isActive = null,
        Guid? updatedBy = null,
        string? correlationId = null)
    {
        Name = name.Trim();
        BaseAmount = baseAmount;
        GstPercentage = gstPercentage;
        if (imageUrl != null)
        {
            ImageUrl = string.IsNullOrWhiteSpace(imageUrl) ? null : imageUrl.Trim();
        }
        if (isActive.HasValue)
        {
            IsActive = isActive.Value;
        }
        StampUpdate(updatedBy, correlationId);
    }

    public void Deactivate(Guid? updatedBy = null, string? correlationId = null)
    {
        IsActive = false;
        StampUpdate(updatedBy, correlationId);
    }

    public void Activate(Guid? updatedBy = null, string? correlationId = null)
    {
        IsActive = true;
        StampUpdate(updatedBy, correlationId);
    }
}

/// <summary>
/// A single request raised by an exhibitor for additional stall requirements.
/// </summary>
public sealed class ExhibitorAdditionalRequirement : AuditableEntity
{
    private readonly List<ExhibitorAdditionalRequirementLine> _lines = new();

    private ExhibitorAdditionalRequirement() { }

    public Guid ExhibitorId { get; private set; }
    public Guid BookingId { get; private set; }
    public AdditionalRequirementStatus Status { get; private set; } = AdditionalRequirementStatus.Pending;
    public decimal TotalBaseAmount { get; private set; }
    public decimal TotalGstAmount { get; private set; }
    public decimal GrandTotal { get; private set; }
    public DateTimeOffset? ConfirmedAt { get; private set; }
    public Guid? ConfirmedByUserId { get; private set; }
    public string? CallNotes { get; private set; }
    public string? Notes { get; private set; }

    public IReadOnlyCollection<ExhibitorAdditionalRequirementLine> Lines => _lines.AsReadOnly();

    public Exhibitor? Exhibitor { get; private set; }
    public StallBooking? Booking { get; private set; }

    public static ExhibitorAdditionalRequirement Create(
        Guid tenantId,
        Guid? eventId,
        Guid exhibitorId,
        Guid bookingId,
        string? notes = null,
        Guid? createdBy = null,
        string? correlationId = null)
    {
        var req = new ExhibitorAdditionalRequirement
        {
            ExhibitorId = exhibitorId,
            BookingId = bookingId,
            Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim(),
            Status = AdditionalRequirementStatus.Pending
        };
        req.StampCreate(tenantId, eventId, createdBy, correlationId);
        return req;
    }

    public void SetNotes(string? notes)
    {
        Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim();
    }

    public void AddLine(
        Guid itemId,
        string itemCode,
        string itemName,
        int quantity,
        decimal unitBaseAmount,
        decimal gstPercentage)
    {
        var lineBase = unitBaseAmount * quantity;
        var lineGst = Math.Round(lineBase * (gstPercentage / 100m), 2);
        var lineTotal = lineBase + lineGst;

        var line = new ExhibitorAdditionalRequirementLine
        {
            RequirementId = Id,
            ItemId = itemId,
            ItemCode = itemCode,
            ItemName = itemName,
            Quantity = quantity,
            BaseAmount = unitBaseAmount,
            GstPercentage = gstPercentage,
            GstAmount = lineGst,
            TotalAmount = lineTotal
        };
        line.StampCreate(TenantId, EventId, CreatedBy, CorrelationId);
        _lines.Add(line);

        RecalculateTotals();
    }

    public void RecalculateTotals()
    {
        TotalBaseAmount = _lines.Sum(x => x.BaseAmount * x.Quantity);
        TotalGstAmount = _lines.Sum(x => x.GstAmount);
        GrandTotal = _lines.Sum(x => x.TotalAmount);
    }

    public void Confirm(Guid userId, string? callNotes, string? correlationId = null)
    {
        Status = AdditionalRequirementStatus.Confirmed;
        ConfirmedAt = DateTimeOffset.UtcNow;
        ConfirmedByUserId = userId;
        CallNotes = callNotes?.Trim();
        StampUpdate(userId, correlationId);
    }

    public void Reject(Guid userId, string? callNotes, string? correlationId = null)
    {
        Status = AdditionalRequirementStatus.Rejected;
        ConfirmedAt = DateTimeOffset.UtcNow;
        ConfirmedByUserId = userId;
        CallNotes = callNotes?.Trim();
        StampUpdate(userId, correlationId);
    }
}

/// <summary>
/// Child line item of an exhibitor's additional requirement request.
/// </summary>
public sealed class ExhibitorAdditionalRequirementLine : AuditableEntity
{
    internal ExhibitorAdditionalRequirementLine() { }

    public Guid RequirementId { get; internal set; }
    public Guid ItemId { get; internal set; }
    public string ItemCode { get; internal set; } = "";
    public string ItemName { get; internal set; } = "";
    public int Quantity { get; internal set; }
    public decimal BaseAmount { get; internal set; }
    public decimal GstPercentage { get; internal set; }
    public decimal GstAmount { get; internal set; }
    public decimal TotalAmount { get; internal set; }

    public ExhibitorAdditionalRequirement? Requirement { get; private set; }
    public AdditionalRequirementItem? Item { get; private set; }
}
