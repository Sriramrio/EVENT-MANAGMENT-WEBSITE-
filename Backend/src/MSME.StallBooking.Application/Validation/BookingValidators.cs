using FluentValidation;
using MSME.StallBooking.Application.Contracts;

namespace MSME.StallBooking.Application.Validation;

public sealed class SubmitBookingCommandValidator : AbstractValidator<SubmitBookingCommand>
{
    private const string PanRegex = "^[A-Z]{5}[0-9]{4}[A-Z]$";
    private const string GstRegex = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$";
    private const string MobileRegex = "^(\\+91[-\\s]?)?[6-9][0-9]{9}$";
    private const string UdyamRegex = "^(UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}|UAM-[A-Z]{2}-[0-9]{2}-[0-9]{7})$";

    public SubmitBookingCommandValidator()
    {
        //RuleFor(x => x.TenantId).NotEmpty();
        //RuleFor(x => x.EventId).NotEmpty();
        //RuleFor(x => x.RequestedStallSizeId).NotEmpty();
        //RuleFor(x => x.FasciaName).NotEmpty().MaximumLength(25);
        //RuleFor(x => x.DisplayNotes).MaximumLength(1000);
        //RuleFor(x => x.ElectricalRequirement).MaximumLength(500);
        //RuleFor(x => x.SpecialRequirement).MaximumLength(500);
        //RuleFor(x => x.FinalAllocationConsentAccepted).Equal(true);
        //RuleFor(x => x.DeclarantName).NotEmpty().MaximumLength(100);
        //RuleFor(x => x.DeclarantDesignation).NotEmpty().MaximumLength(100);
        //RuleFor(x => x.DeclarationDate).NotEmpty();

        //RuleFor(x => x.TermsAccepted).Equal(true);
        //RuleFor(x => x.AccuracyAccepted).Equal(true);
        //RuleFor(x => x.PaymentTimelineAccepted).Equal(true);
        //RuleFor(x => x.CancellationPolicyAccepted).Equal(true);
        //RuleFor(x => x.PrivacyConsentAccepted).Equal(true);

        //RuleFor(x => x.Exhibitor.LegalName).NotEmpty().MaximumLength(150);
        //RuleFor(x => x.Exhibitor.RegisteredAddress).NotEmpty().MaximumLength(500);
        //RuleFor(x => x.Exhibitor.City).NotEmpty();
        //RuleFor(x => x.Exhibitor.District).NotEmpty();
        //RuleFor(x => x.Exhibitor.State).NotEmpty();
        //RuleFor(x => x.Exhibitor.Pincode).NotEmpty().Matches("^[1-9][0-9]{5}$");
        //RuleFor(x => x.Exhibitor.Country).NotEmpty();
        //RuleFor(x => x.Exhibitor.ContactPersonName).NotEmpty().MaximumLength(100);
        //RuleFor(x => x.Exhibitor.ContactPersonDesignation).NotEmpty().MaximumLength(100);
        //RuleFor(x => x.Exhibitor.Mobile).NotEmpty().Matches(MobileRegex);
        //RuleFor(x => x.Exhibitor.Email).NotEmpty().EmailAddress();
        //RuleFor(x => x.Exhibitor.IndustryScale).NotEmpty();
        //RuleFor(x => x.Exhibitor.BusinessType).NotEmpty();
        //RuleFor(x => x.Exhibitor.CompanyConstitution).NotEmpty();
        //RuleFor(x => x.Exhibitor.IndustryCategory).NotEmpty();
        //RuleFor(x => x.Exhibitor.ProductServiceDescription).NotEmpty().MaximumLength(1000);
        //RuleFor(x => x.Exhibitor.ProductKeywords).NotEmpty().MaximumLength(250);
        //RuleFor(x => x.Exhibitor.UdyamNumber).NotEmpty().Matches(UdyamRegex);
        //RuleFor(x => x.Exhibitor.Pan).NotEmpty().Matches(PanRegex);
        //RuleFor(x => x.Exhibitor.Gstin).NotEmpty().Matches(GstRegex);
        //RuleFor(x => x.Exhibitor.LubState).NotEmpty();
        //RuleFor(x => x.Exhibitor.LubChapter).NotEmpty();
        //RuleFor(x => x.Exhibitor.LubMembershipNumber)
        //   .NotEmpty()
        //   .When(x => x.Exhibitor.LubMember);

        //When(x => x.Billing is not null, () =>
        //{
        //    RuleFor(x => x.Billing!.BillingLegalName)
        //        .MaximumLength(150);

        //    RuleFor(x => x.Billing!.BillingAddress)
        //        .MaximumLength(500);

        //    RuleFor(x => x.Billing!.BillingGstin)
        //        .Matches(GstRegex)
        //        .When(x => !string.IsNullOrWhiteSpace(x.Billing!.BillingGstin));

        //    RuleFor(x => x.Billing!.BillingPan)
        //        .Matches(PanRegex)
        //        .When(x => !string.IsNullOrWhiteSpace(x.Billing!.BillingPan));

        //    RuleFor(x => x.Billing!.BillingStateCode)
        //        .Length(2)
        //        .When(x => !string.IsNullOrWhiteSpace(x.Billing!.BillingStateCode));

        //    RuleFor(x => x.Billing!.BillingEmail)
        //        .EmailAddress()
        //        .When(x => !string.IsNullOrWhiteSpace(x.Billing!.BillingEmail));

        //    RuleFor(x => x.Billing!.BillingMobile)
        //        .Matches(MobileRegex)
        //        .When(x => !string.IsNullOrWhiteSpace(x.Billing!.BillingMobile));
        //});
    }
}

public sealed class BlockStallCommandValidator : AbstractValidator<BlockStallCommand>
{
    public BlockStallCommandValidator()
    {
        //RuleFor(x => x.TenantId).NotEmpty();
        //RuleFor(x => x.EventId).NotEmpty();
        //RuleFor(x => x.BookingId).NotEmpty();
        //RuleFor(x => x.StallId).NotEmpty();
        //RuleFor(x => x.ActorUserId).NotEmpty();
    }
}

public sealed class VerifyPaymentCommandValidator : AbstractValidator<VerifyPaymentCommand>
{
    public VerifyPaymentCommandValidator()
    {
        //RuleFor(x => x.PaymentId).NotEmpty();
        //RuleFor(x => x.BookingId).NotEmpty();
        //RuleFor(x => x.ActorUserId).NotEmpty();
        //RuleFor(x => x.ExpectedAmount).GreaterThan(0);
    }
}
