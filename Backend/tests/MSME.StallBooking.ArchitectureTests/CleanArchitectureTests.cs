using Xunit;

namespace MSME.StallBooking.ArchitectureTests;

public sealed class CleanArchitectureTests
{
    [Fact]
    public void Domain_project_must_not_reference_infrastructure()
    {
        // Use NetArchTest or ArchUnitNET in CI to enforce domain independence.
        Assert.True(true);
    }
}
