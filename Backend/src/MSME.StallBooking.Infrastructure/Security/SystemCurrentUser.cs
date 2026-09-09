using MSME.StallBooking.Application.Abstractions;
using MSME.StallBooking.Application.Security;

namespace MSME.StallBooking.Infrastructure.Security;

public sealed class SystemCurrentUser : ICurrentUser
{
    public Guid? UserId => Guid.Empty;
    public Guid TenantId => Guid.Empty;
    public IReadOnlySet<string> Permissions { get; } = new HashSet<string>
    {
        MSME.StallBooking.Application.Security.Permissions.BookingView,
        MSME.StallBooking.Application.Security.Permissions.BookingReview,
        MSME.StallBooking.Application.Security.Permissions.StallView,
        MSME.StallBooking.Application.Security.Permissions.StallBlock,
        MSME.StallBooking.Application.Security.Permissions.StallRelease,
        MSME.StallBooking.Application.Security.Permissions.PaymentView,
        MSME.StallBooking.Application.Security.Permissions.PaymentVerify,
        MSME.StallBooking.Application.Security.Permissions.InvoiceView,
        MSME.StallBooking.Application.Security.Permissions.InvoiceGenerate,
        MSME.StallBooking.Application.Security.Permissions.InvoiceSend,
        MSME.StallBooking.Application.Security.Permissions.DashboardView,
        MSME.StallBooking.Application.Security.Permissions.AuditView,
        MSME.StallBooking.Application.Security.Permissions.BuyerDashboardView,
        MSME.StallBooking.Application.Security.Permissions.BuyerOrganisationUpdate,
        MSME.StallBooking.Application.Security.Permissions.BuyerRequirementView,
        MSME.StallBooking.Application.Security.Permissions.BuyerRequirementCreate,
        MSME.StallBooking.Application.Security.Permissions.BuyerRequirementUpdate,
        MSME.StallBooking.Application.Security.Permissions.BuyerRequirementSubmit,
        MSME.StallBooking.Application.Security.Permissions.BuyerMatchesView,
        MSME.StallBooking.Application.Security.Permissions.SellerDashboardView,
        MSME.StallBooking.Application.Security.Permissions.SellerOrganisationUpdate,
        MSME.StallBooking.Application.Security.Permissions.SellerCapabilityView,
        MSME.StallBooking.Application.Security.Permissions.SellerCapabilityCreate,
        MSME.StallBooking.Application.Security.Permissions.SellerCapabilityUpdate,
        MSME.StallBooking.Application.Security.Permissions.SellerCapabilityPublish,
        MSME.StallBooking.Application.Security.Permissions.SellerOpportunityView,
        MSME.StallBooking.Application.Security.Permissions.ExhibitorRequirementsManage
    };
    public string? CorrelationId => "system";
}
