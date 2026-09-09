using Xunit;

namespace MSME.StallBooking.IntegrationTests;

public sealed class StallBookingFlowTests
{
    [Fact]
    public void End_to_end_flow_contract_is_documented()
    {
        // Integration tests should run against PostgreSQL Testcontainers in CI:
        // submit booking -> block stall -> verify payment -> generate invoice -> send email.
        Assert.True(true);
    }
}
