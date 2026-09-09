using MSME.StallBooking.Application.Abstractions;
using MSME.StallBooking.SharedKernel.Errors;

namespace MSME.StallBooking.Infrastructure.Security;

public sealed class PermissionGuard : IPermissionGuard
{
    private readonly ICurrentUser _currentUser;

    public PermissionGuard(ICurrentUser currentUser) => _currentUser = currentUser;

    public bool Has(string permissionCode) => _currentUser.Permissions.Contains(permissionCode);

    public void Demand(string permissionCode)
    {
        if (!Has(permissionCode))
            throw new DomainRuleException(ErrorCodes.Forbidden, $"Permission '{permissionCode}' is required.");
    }
}
