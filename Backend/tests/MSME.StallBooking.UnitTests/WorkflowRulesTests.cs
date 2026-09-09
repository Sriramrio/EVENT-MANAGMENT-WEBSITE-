using MSME.StallBooking.Domain.Entities;
using MSME.StallBooking.Domain.Enums;
using MSME.StallBooking.SharedKernel.Errors;
using Xunit;

namespace MSME.StallBooking.UnitTests;

public sealed class WorkflowRulesTests
{
    [Fact]
    public void Stall_cannot_be_blocked_when_not_available()
    {
        var stall = Stall.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "B1");
        stall.Block(Guid.NewGuid());

        Assert.Throws<DomainRuleException>(() => stall.Block(Guid.NewGuid()));
    }

    [Fact]
    public void Payment_verification_rejects_amount_mismatch()
    {
        var payment = Payment.Submit(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "NEFT-001", PaymentMode.Neft, "Payer", 100m, DateOnly.FromDateTime(DateTime.UtcNow), null);

        Assert.Throws<DomainRuleException>(() => payment.Verify(Guid.NewGuid(), 200m));
    }

    [Fact]
    public void Invoice_generation_snapshot_calculates_total()
    {
        var invoice = ProformaInvoice.Generate(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            "PI-001",
            Guid.NewGuid(),
            new InvoiceSnapshot(
                "Seller", "Address", "33AAATL0575H1ZT", "AAATL0575H",
                "Buyer", "Buyer Address", "33ABCDE1234F1Z5", "ABCDE1234F",
                "Tamil Nadu", "B1", "3x3 mtrs", 63000m, 18m,
                "words", "tax words", "notes", "Account", "Bank", "123", "CNRB0000936", "Branch"));

        Assert.Equal(74340m, invoice.TotalAmount);
    }
}
