using MSME.StallBooking.Domain.Enums;
using MSME.StallBooking.SharedKernel.Audit;
using MSME.StallBooking.SharedKernel.Errors;
using System.Text.Json;

namespace MSME.StallBooking.Domain.Entities;

public sealed class Tenant : AuditableEntity
{
    private Tenant() { }
    public string Code { get; private set; } = "";
    public string Name { get; private set; } = "";
    public string LegalName { get; private set; } = "";
    public string? Gstin { get; private set; }
    public string? Pan { get; private set; }
    public string Address { get; private set; } = "";
    public string City { get; private set; } = "";
    public string State { get; private set; } = "";
    public string Country { get; private set; } = "India";
    public string Pincode { get; private set; } = "";
    public string Email { get; private set; } = "";
    public string Phone { get; private set; } = "";
    public bool IsActive { get; private set; } = true;

    public static Tenant Create(string code, string name, string legalName, string address, string city, string state, string pincode, string email, string phone)
    {
        return new Tenant
        {
            Code = code.Trim().ToUpperInvariant(),
            Name = name.Trim(),
            LegalName = legalName.Trim(),
            Address = address.Trim(),
            City = city.Trim(),
            State = state.Trim(),
            Pincode = pincode.Trim(),
            Email = email.Trim().ToLowerInvariant(),
            Phone = phone.Trim(),
            IsActive = true
        };
    }
}

public sealed class Event : AuditableEntity
{
    private Event() { }
    public string EventCode { get; private set; } = "";
    public string EventName { get; private set; } = "";
    public string VenueName { get; private set; } = "";
    public string VenueAddress { get; private set; } = "";
    public string City { get; private set; } = "";
    public string District { get; private set; } = "";
    public string State { get; private set; } = "";
    public string Country { get; private set; } = "India";
    public DateOnly StartDate { get; private set; }
    public DateOnly EndDate { get; private set; }
    public DateOnly BookingOpenDate { get; private set; }
    public DateOnly BookingCloseDate { get; private set; }
    public int StallBlockValidityDays { get; private set; } = 3;
    public decimal DefaultGstPercentage { get; private set; } = 18m;
    public EventStatus Status { get; private set; } = EventStatus.Draft;
    public bool IsActive { get; private set; } = true;

    public static Event Create(Guid tenantId, string eventCode, string eventName, string venueName, DateOnly startDate, DateOnly endDate, DateOnly bookingOpenDate, DateOnly bookingCloseDate)
    {
        if (endDate < startDate) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Event end date cannot be before start date.");
        if (bookingCloseDate < bookingOpenDate) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Booking close date cannot be before open date.");

        return new Event
        {
            TenantId = tenantId,
            EventId = null,
            EventCode = eventCode.Trim().ToUpperInvariant(),
            EventName = eventName.Trim(),
            VenueName = venueName.Trim(),
            StartDate = startDate,
            EndDate = endDate,
            BookingOpenDate = bookingOpenDate,
            BookingCloseDate = bookingCloseDate,
            Status = EventStatus.Open
        };
    }
}

public sealed class StallSize : AuditableEntity
{
    private StallSize() { }
    public ICollection<Stall> Stalls { get; private set; }
    = new List<Stall>();
    public string Code { get; private set; } = "";
    public string DisplayName { get; private set; } = "";
    public decimal WidthM { get; private set; }
    public decimal DepthM { get; private set; }
    public decimal AreaSqM { get; private set; }
    public decimal BaseAmount { get; private set; }
    public decimal GstPercentage { get; private set; }
    public decimal TotalAmount { get; private set; }
    public string Currency { get; private set; } = "INR";
    public bool IsActive { get; private set; } = true;

    public static StallSize Create(Guid tenantId, Guid eventId, string code, decimal widthM, decimal depthM, decimal baseAmount, decimal gstPercentage)
    {
        if (widthM <= 0 || depthM <= 0) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Stall size dimensions must be positive.");
        if (baseAmount < 0) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Base amount cannot be negative.");
        var gst = Math.Round(baseAmount * gstPercentage / 100m, 2);
        return new StallSize
        {
            TenantId = tenantId,
            EventId = eventId,
            Code = code.Trim().ToUpperInvariant(),
            DisplayName = $"{widthM:0.#}x{depthM:0.#} mtrs",
            WidthM = widthM,
            DepthM = depthM,
            AreaSqM = widthM * depthM,
            BaseAmount = baseAmount,
            GstPercentage = gstPercentage,
            TotalAmount = baseAmount + gst
        };
    }
}

public sealed class Stall : AuditableEntity
{
    private Stall() { }
    public Guid StallSizeId { get; private set; }
    public StallSize StallSize { get; private set; } = null!;
    public string StallNumber { get; private set; } = "";
    public string? HallName { get; private set; }
    public string? ZoneName { get; private set; }
    public string? RowLabel { get; private set; }
    public string? FloorLabel { get; private set; }
    public int? LayoutX { get; private set; }
    public int? LayoutY { get; private set; }
    public StallStatus CurrentStatus { get; private set; } = StallStatus.Available;
    public Guid? CurrentBookingId { get; private set; }
    public bool IsActive { get; private set; } = true;
    public bool IsSponsor { get; private set; } = false;



    public static Stall Create(
        Guid tenantId,
        Guid eventId,
        Guid stallSizeId,
        string stallNumber,
        string? hallName,
        string? zoneName,
        string? rowLabel,
        string? floorLabel,
        int? layoutX,
        int? layoutY,
        bool isActive = true)
    {
        return new Stall
        {
            TenantId = tenantId,
            EventId = eventId,
            StallSizeId = stallSizeId,
            StallNumber = stallNumber.Trim().ToUpperInvariant(),
            HallName = hallName,
            ZoneName = zoneName,
            RowLabel = rowLabel,
            FloorLabel = floorLabel,
            LayoutX = layoutX,
            LayoutY = layoutY,
            IsActive = isActive,
            CurrentStatus = StallStatus.Available
        };
    }
    public void MarkAsSponsor()
    {
        IsSponsor = true;
    }

    public void UnmarkAsSponsor()
    {
        IsSponsor = false;
    }
    public void Block(Guid bookingId)
    {
        var canBlock =
       CurrentStatus == StallStatus.Available ||
       CurrentStatus == StallStatus.Reservation;

        if (!canBlock)
            throw new DomainRuleException(ErrorCodes.StallAlreadyBlocked, $"Stall {StallNumber} is not available.");
        CurrentStatus = StallStatus.Blocked;
        CurrentBookingId = bookingId;
    }

    public void Freeze(Guid bookingId)
    {
        if (CurrentBookingId != bookingId || CurrentStatus != StallStatus.Blocked)
            throw new DomainRuleException(ErrorCodes.StallAlreadyFrozen, $"Stall {StallNumber} cannot be frozen for this booking.");
        CurrentStatus = StallStatus.Frozen;
    }

    public void Release(Guid bookingId)
    {
        if (CurrentBookingId != bookingId) return;
        CurrentStatus = StallStatus.Available;
        CurrentBookingId = null;
    }
    public void Release(Guid bookingId, Guid actorUserId)
    {
        if (bookingId == Guid.Empty)
        {
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "Booking ID is required.");
        }

        if (actorUserId == Guid.Empty)
        {
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "Actor user ID is required.");
        }

               if (CurrentStatus != StallStatus.Blocked &&
            CurrentStatus != StallStatus.Reservation &&
            CurrentStatus != StallStatus.Frozen)
        {
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                $"Only a blocked, reserved, or frozen stall can be released. Current status: {CurrentStatus}.");
        }

        if (CurrentBookingId.HasValue &&
            CurrentBookingId.Value != bookingId)
        {
            throw new DomainRuleException(
                ErrorCodes.ValidationFailed,
                "This stall is mapped to another booking.");
        }

        CurrentStatus = StallStatus.Available;
        CurrentBookingId = null;

        UpdatedAt = DateTimeOffset.UtcNow;
        UpdatedBy = actorUserId;
    }
    public void Reserve(Guid actorUserId)
    {
        if (!IsActive)
            throw new InvalidOperationException(
                "Inactive stall cannot be reserved.");

        if (CurrentStatus != StallStatus.Available)
            throw new InvalidOperationException(
                $"Only an available stall can be reserved. Current status is {CurrentStatus}.");

        if (CurrentBookingId.HasValue)
            throw new InvalidOperationException(
                "A stall mapped to a booking cannot be reserved.");

        CurrentStatus = StallStatus.Reservation;
        CurrentBookingId = null;

        UpdatedAt = DateTimeOffset.UtcNow;
        UpdatedBy = actorUserId;
    }

    public void ReleaseReservation(Guid actorUserId)
    {
        if (CurrentStatus != StallStatus.Reservation)
            throw new InvalidOperationException(
                "Only a reserved stall can be released.");

        if (CurrentBookingId.HasValue)
            throw new InvalidOperationException(
                "A mapped reservation cannot be released.");

        CurrentStatus = StallStatus.Available;
        CurrentBookingId = null;

        UpdatedAt = DateTimeOffset.UtcNow;
        UpdatedBy = actorUserId;
    }
    public void MapReservationToBooking(Guid bookingId)
    {
        if (bookingId == Guid.Empty)
            throw new ArgumentException("Booking ID is required.", nameof(bookingId));

        if (CurrentStatus != StallStatus.Reservation)
            throw new InvalidOperationException(
                "Only a reserved stall can be mapped to a booking.");

        if (CurrentBookingId.HasValue)
            throw new InvalidOperationException(
                "This reserved stall is already mapped to a booking.");

        CurrentBookingId = bookingId;
        CurrentStatus = StallStatus.Blocked;
    }

    public void ReleaseReservation()
    {
        if (CurrentStatus != StallStatus.Reservation)
            throw new InvalidOperationException(
                "Only a reserved stall can be released.");

        if (CurrentBookingId.HasValue)
            throw new InvalidOperationException(
                "A mapped reservation cannot be released.");

        CurrentBookingId = null;
        CurrentStatus = StallStatus.Available;
    }
    public void Update(
    Guid stallSizeId,
    string stallNumber,
    string? hallName,
    string? zoneName,
    string? rowLabel,
    string? floorLabel,
    int? layoutX,
    int? layoutY,
    bool isActive)
    {
        StallSizeId = stallSizeId;
        StallNumber = stallNumber.Trim().ToUpperInvariant();
        HallName = string.IsNullOrWhiteSpace(hallName) ? null : hallName.Trim();
        ZoneName = string.IsNullOrWhiteSpace(zoneName) ? null : zoneName.Trim();
        RowLabel = string.IsNullOrWhiteSpace(rowLabel) ? null : rowLabel.Trim();
        FloorLabel = string.IsNullOrWhiteSpace(floorLabel) ? null : floorLabel.Trim();
        LayoutX = layoutX;
        LayoutY = layoutY;
        IsActive = isActive;
    }
}

public sealed class Exhibitor : AuditableEntity
{
    private Exhibitor() { }
    public string LegalName { get; private set; } = "";
    public string? TradeName { get; private set; }
    public string RegisteredAddress { get; private set; } = "";
    public string City { get; private set; } = "";
    public string District { get; private set; } = "";
    public string State { get; private set; } = "";
    public string Pincode { get; private set; } = "";
    public string Country { get; private set; } = "India";
    public string ContactPersonName { get; private set; } = "";
    public string ContactPersonDesignation { get; private set; } = "";
    public string Mobile { get; private set; } = "";
    public string? AlternateMobile { get; private set; }
    public string Email { get; private set; } = "";
    public string? AlternateEmail { get; private set; }
    public string? Website { get; private set; }
    public string IndustryScale { get; private set; } = "";
    public string BusinessType { get; private set; } = "";
    public string CompanyConstitution { get; private set; } = "";
    public string IndustryCategory { get; private set; } = "";
    public string ProductServiceDescription { get; private set; } = "";
    public string ProductKeywords { get; private set; } = "";
    public string UdyamNumber { get; private set; } = "";
    public string? TanNumber { get; private set; } = "";
    public string Gstin { get; private set; } = "";
    public string Pan { get; private set; } = "";
    public bool LubMember { get; private set; }
    public string LubState { get; private set; } = "";
    public string LubChapter { get; private set; } = "";
    public string? LubMembershipNumber { get; private set; }
    public string? CompanyLogo { get; private set; }
    public string? BankAccountName { get; private set; }
    public string? BankName { get; private set; }
    public string? BankAccountNumber { get; private set; }
    public string? BankIfscCode { get; private set; }

    public void UpdateBankDetails(
        string? bankAccountName,
        string? bankName,
        string? bankAccountNumber,
        string? bankIfscCode)
    {
        BankAccountName = string.IsNullOrWhiteSpace(bankAccountName) ? null : bankAccountName.Trim();
        BankName = string.IsNullOrWhiteSpace(bankName) ? null : bankName.Trim();
        BankAccountNumber = string.IsNullOrWhiteSpace(bankAccountNumber) ? null : bankAccountNumber.Trim();
        BankIfscCode = string.IsNullOrWhiteSpace(bankIfscCode) ? null : bankIfscCode.Trim().ToUpperInvariant();
    }

    public void UpdateCompanyLogo(
        string companyLogo)
    {
        CompanyLogo = companyLogo;
    }

    public void RemoveCompanyLogo()
    {
        CompanyLogo = null;
    }
    public static Exhibitor Create(Guid tenantId, string legalName, string email, string mobile, string gstin, string pan, string udyamNumber, string tanNumber)
    {
        return new Exhibitor
        {
            TenantId = tenantId,
            LegalName = legalName.Trim(),
            Email = email.Trim().ToLowerInvariant(),
            Mobile = mobile.Trim(),
            Gstin = gstin.Trim().ToUpperInvariant(),
            Pan = pan.Trim().ToUpperInvariant(),
            UdyamNumber = udyamNumber.Trim().ToUpperInvariant(),
            TanNumber = tanNumber.Trim().ToUpperInvariant()
        };
    }

    public static Exhibitor CreateFull(
        Guid tenantId,
        string legalName,
        string? tradeName,
        string registeredAddress,
        string city,
        string district,
        string state,
        string pincode,
        string country,
        string contactPersonName,
        string contactPersonDesignation,
        string mobile,
        string? alternateMobile,
        string email,
        string? alternateEmail,
        string? website,
        string industryScale,
        string businessType,
        string companyConstitution,
        string industryCategory,
        string productServiceDescription,
        string productKeywords,
        string udyamNumber,
        string gstin,
        string pan,
        string? tanNumber,
        bool lubMember,
        string lubState,
        string lubChapter,
        string? CompanyLogo,
        string? lubMembershipNumber)
    {
        //if (lubMember && string.IsNullOrWhiteSpace(lubMembershipNumber))
        //    throw new DomainRuleException(ErrorCodes.ValidationFailed, "LUB membership number is required when LUB member is Yes.");

        return new Exhibitor
        {
            TenantId = tenantId,
            LegalName = legalName.Trim(),
            TradeName = string.IsNullOrWhiteSpace(tradeName) ? null : tradeName.Trim(),
            RegisteredAddress = registeredAddress.Trim(),
            City = city.Trim(),
            District = district.Trim(),
            State = state.Trim(),
            Pincode = pincode.Trim(),
            Country = string.IsNullOrWhiteSpace(country) ? "India" : country.Trim(),
            ContactPersonName = contactPersonName.Trim(),
            ContactPersonDesignation = contactPersonDesignation.Trim(),
            Mobile = mobile.Trim(),
            AlternateMobile = string.IsNullOrWhiteSpace(alternateMobile) ? null : alternateMobile.Trim(),
            Email = email.Trim().ToLowerInvariant(),
            AlternateEmail = string.IsNullOrWhiteSpace(alternateEmail) ? null : alternateEmail.Trim().ToLowerInvariant(),
            Website = string.IsNullOrWhiteSpace(website) ? null : website.Trim(),
            IndustryScale = industryScale.Trim(),
            BusinessType = businessType.Trim(),
            CompanyConstitution = companyConstitution.Trim(),
            IndustryCategory = industryCategory.Trim(),
            ProductServiceDescription = productServiceDescription.Trim(),
            ProductKeywords = productKeywords.Trim(),
            UdyamNumber = udyamNumber.Trim().ToUpperInvariant(),
            TanNumber = tanNumber,
            Gstin = gstin.Trim().ToUpperInvariant(),
            Pan = pan.Trim().ToUpperInvariant(),
            LubMember = lubMember,
            LubState = lubState.Trim(),
            LubChapter = lubChapter.Trim(),
            LubMembershipNumber = string.IsNullOrWhiteSpace(lubMembershipNumber) ? null : lubMembershipNumber.Trim()
        };
    }
    public void UpdateApplicationInformation(
    string legalName,
    string? tradeName,
    string registeredAddress,
    string city,
    string district,
    string state,
    string pincode,
    string country,
    string contactPersonName,
    string contactPersonDesignation,
    string mobile,
    string? alternateMobile,
    string email,
    string? alternateEmail,
    string? website,
    string industryScale,
    string businessType,
    string companyConstitution,
    string industryCategory,
    string productServiceDescription,
    string productKeywords,
    string udyamNumber,
    string gstin,
    string pan,
     string? TanNumber,
    bool lubMember,
    string lubState,
    string lubChapter,
    string? lubMembershipNumber
        )
    {
        LegalName = legalName;
        TradeName = tradeName;
        RegisteredAddress = registeredAddress;
        City = city;
        District = district;
        State = state;
        Pincode = pincode;
        Country = country;

        ContactPersonName = contactPersonName;
        ContactPersonDesignation = contactPersonDesignation;
        Mobile = mobile;
        AlternateMobile = alternateMobile;
        Email = email;
        AlternateEmail = alternateEmail;
        Website = website;

        IndustryScale = industryScale;
        BusinessType = businessType;
        CompanyConstitution = companyConstitution;
        IndustryCategory = industryCategory;
        ProductServiceDescription = productServiceDescription;
        ProductKeywords = productKeywords;

        UdyamNumber = udyamNumber;
        this.TanNumber = TanNumber;
        Gstin = gstin;
        Pan = pan;


        LubMember = lubMember;
        LubState = lubState;
        LubChapter = lubChapter;
        LubMembershipNumber = lubMembershipNumber;
    }
}

public sealed class BillingProfile : AuditableEntity
{
    private BillingProfile() { }
    public Guid ExhibitorId { get; private set; }
    public string BillingLegalName { get; private set; } = "";
    public string BillingAddress { get; private set; } = "";
    public string BillingCity { get; private set; } = "";
    public string BillingState { get; private set; } = "";
    public string BillingStateCode { get; private set; } = "";
    public string BillingPincode { get; private set; } = "";
    public string BillingCountry { get; private set; } = "India";
    public string BillingGstin { get; private set; } = "";
    public string BillingPan { get; private set; } = "";
    public string PlaceOfSupply { get; private set; } = "";
    public string BillingContactPerson { get; private set; } = "";
    public string BillingEmail { get; private set; } = "";
    public string BillingMobile { get; private set; } = "";
    public bool IsDefault { get; private set; }

    public static BillingProfile Create(Guid tenantId, Guid exhibitorId, string legalName, string address, string gstin, string pan, string placeOfSupply)
    {
        return new BillingProfile
        {
            TenantId = tenantId,
            ExhibitorId = exhibitorId,
            BillingLegalName = legalName.Trim(),
            BillingAddress = address.Trim(),
            BillingGstin = gstin.Trim().ToUpperInvariant(),
            BillingPan = pan.Trim().ToUpperInvariant(),
            PlaceOfSupply = placeOfSupply.Trim(),
            IsDefault = true
        };
    }

    public static BillingProfile CreateFull(Guid tenantId, Guid exhibitorId, string legalName, string address, string city, string state, string stateCode, string pincode, string country, string gstin, string pan, string placeOfSupply, string contactPerson, string email, string mobile)
    {
        return new BillingProfile
        {
            TenantId = tenantId,
            ExhibitorId = exhibitorId,
            BillingLegalName = legalName.Trim(),
            BillingAddress = address.Trim(),
            BillingCity = city.Trim(),
            BillingState = state.Trim(),
            BillingStateCode = stateCode.Trim(),
            BillingPincode = pincode.Trim(),
            BillingCountry = string.IsNullOrWhiteSpace(country) ? "India" : country.Trim(),
            BillingGstin = gstin.Trim().ToUpperInvariant(),
            BillingPan = pan.Trim().ToUpperInvariant(),
            PlaceOfSupply = placeOfSupply.Trim(),
            BillingContactPerson = contactPerson.Trim(),
            BillingEmail = email.Trim().ToLowerInvariant(),
            BillingMobile = mobile.Trim(),
            IsDefault = true
        };
    }

    public sealed class Visitor : AuditableEntity
    {
        private Visitor() { }

        public string BookingRegistrationNumber { get; private set; } = string.Empty;

        // Company / Visitor Details
        public string LegalName { get; private set; } = string.Empty;
        public string? TradeName { get; private set; }
        public string RegisteredAddress { get; private set; } = string.Empty;
        public string City { get; private set; } = string.Empty;
        public string District { get; private set; } = string.Empty;
        public string State { get; private set; } = "Tamil Nadu";
        public string Pincode { get; private set; } = string.Empty;
        public string Country { get; private set; } = "India";

        // Contact Person Details
        public string ContactPersonName { get; private set; } = string.Empty;
        public string ContactPersonDesignation { get; private set; } = string.Empty;
        public string Mobile { get; private set; } = string.Empty;
        public string? AlternateMobile { get; private set; }
        public string Email { get; private set; } = string.Empty;
        public string? AlternateEmail { get; private set; }
        public string? Website { get; private set; }

        // Industry & Classification
        public string IndustryScale { get; private set; } = "Micro";
        public string BusinessType { get; private set; } = "Manufacturer";
        public string CompanyConstitution { get; private set; } = "Proprietorship";
        public string IndustryCategory { get; private set; } = "Others";
        public string ProductServiceDescription { get; private set; } = string.Empty;
        public string ProductKeywords { get; private set; } = string.Empty;

        // Statutory & LUB Membership
        //public string? UdyamNumber { get; private set; }
        //public string? Gstin { get; private set; }
        //public string? Pan { get; private set; }
        //public bool LubMember { get; private set; }
        //public string? LubState { get; private set; }
        //public string? LubChapter { get; private set; }
        //public string? LubMembershipNumber { get; private set; }

        // Stall Preferences
        //public Guid RequestedStallSizeId { get; private set; }
        //public Guid? StallOption1Id { get; private set; }
        //public Guid? StallOption2Id { get; private set; }
        public string FasciaName { get; private set; } = string.Empty;
        //public string? DisplayNotes { get; private set; }
        //public string? ElectricalRequirement { get; private set; }
        //public string? SpecialRequirement { get; private set; }
        //public bool HazardousDemoDeclared { get; private set; }

        // Declarations & Consents
        public string DeclarantName { get; private set; } = string.Empty;
        public string DeclarantDesignation { get; private set; } = string.Empty;
        public DateOnly DeclarationDate { get; private set; }
        public bool TermsAccepted { get; private set; }
        public bool AccuracyAccepted { get; private set; }
        public bool PaymentTimelineAccepted { get; private set; }
        public bool LubMember { get; private set; }
        public bool InterestedInLub { get; private set; }
        public bool IsPresent { get; private set; }
        public DateTimeOffset? CheckedInAt { get; private set; }
        public Guid? CheckedInBy { get; private set; }
        //public bool CancellationPolicyAccepted { get; private set; }
        //public bool PrivacyConsentAccepted { get; private set; }
        //public bool FinalAllocationConsentAccepted { get; private set; }
        public bool MarkPresent(Guid? actorUserId)
        {
            if (IsPresent) return false;
            IsPresent = true;
            CheckedInAt = DateTimeOffset.UtcNow;
            CheckedInBy = actorUserId;
            return true;
        }

        public static Visitor Create(
            Guid tenantId,
            Guid eventId,
            string bookingRegistrationNumber,
            string legalName,
            string? tradeName,
            string registeredAddress,
            string city,
            string district,
            string state,
            string pincode,
            string country,
            string contactPersonName,
            string contactPersonDesignation,
            string mobile,
            string? alternateMobile,
            string email,
            string? alternateEmail,
            string? website,
            string industryScale,
            string businessType,
            string companyConstitution,
            string industryCategory,
            string productServiceDescription,
            string productKeywords,

            string fasciaName,
               bool lubMember = false,
 bool interestedInLub = false)

        //string? displayNotes,
        //string? electricalRequirement,
        //string? specialRequirement,
        //bool hazardousDemoDeclared,
        //string declarantName,
        //string declarantDesignation,
        //DateOnly declarationDate,
        //bool termsAccepted,
        //bool accuracyAccepted,
        //bool paymentTimelineAccepted,
        //bool cancellationPolicyAccepted,
        //bool privacyConsentAccepted,
        //bool finalAllocationConsentAccepted)
        {
            if (string.IsNullOrWhiteSpace(legalName))
                throw new DomainRuleException(ErrorCodes.ValidationFailed, "Legal / Company Name is required.");

            if (string.IsNullOrWhiteSpace(contactPersonName))
                throw new DomainRuleException(ErrorCodes.ValidationFailed, "Contact Person Name is required.");

            if (string.IsNullOrWhiteSpace(mobile))
                throw new DomainRuleException(ErrorCodes.ValidationFailed, "Mobile number is required.");

            if (string.IsNullOrWhiteSpace(email))
                throw new DomainRuleException(ErrorCodes.ValidationFailed, "Email address is required.");


            return new Visitor
            {
                TenantId = tenantId,
                EventId = eventId,
                BookingRegistrationNumber = bookingRegistrationNumber.Trim().ToUpperInvariant(),

                LegalName = legalName.Trim(),
                TradeName = string.IsNullOrWhiteSpace(tradeName) ? null : tradeName.Trim(),
                RegisteredAddress = registeredAddress.Trim(),
                City = city.Trim(),
                District = district.Trim(),
                State = string.IsNullOrWhiteSpace(state) ? "Tamil Nadu" : state.Trim(),
                Pincode = pincode.Trim(),
                Country = string.IsNullOrWhiteSpace(country) ? "India" : country.Trim(),

                ContactPersonName = contactPersonName.Trim(),
                ContactPersonDesignation = contactPersonDesignation.Trim(),
                Mobile = mobile.Trim(),
                AlternateMobile = string.IsNullOrWhiteSpace(alternateMobile) ? null : alternateMobile.Trim(),
                Email = email.Trim().ToLowerInvariant(),
                AlternateEmail = string.IsNullOrWhiteSpace(alternateEmail) ? null : alternateEmail.Trim().ToLowerInvariant(),
                Website = string.IsNullOrWhiteSpace(website) ? null : website.Trim(),

                IndustryScale = industryScale.Trim(),
                BusinessType = businessType.Trim(),
                CompanyConstitution = companyConstitution.Trim(),
                IndustryCategory = industryCategory.Trim(),
                ProductServiceDescription = productServiceDescription.Trim(),
                ProductKeywords = productKeywords.Trim(),
                LubMember = lubMember,
                InterestedInLub = lubMember ? false : interestedInLub,

                //UdyamNumber = string.IsNullOrWhiteSpace(udyamNumber) ? null : udyamNumber.Trim().ToUpperInvariant(),
                //Gstin = string.IsNullOrWhiteSpace(gstin) ? null : gstin.Trim().ToUpperInvariant(),
                //Pan = string.IsNullOrWhiteSpace(pan) ? null : pan.Trim().ToUpperInvariant(),

                //LubMember = lubMember,
                //LubState = string.IsNullOrWhiteSpace(lubState) ? null : lubState.Trim(),
                //LubChapter = string.IsNullOrWhiteSpace(lubChapter) ? null : lubChapter.Trim(),
                //LubMembershipNumber = string.IsNullOrWhiteSpace(lubMembershipNumber) ? null : lubMembershipNumber.Trim(),

                //RequestedStallSizeId = requestedStallSizeId,
                //StallOption1Id = stallOption1Id,
                //StallOption2Id = stallOption2Id,
                //FasciaName = fasciaName.Trim().ToUpperInvariant(),
                //DisplayNotes = string.IsNullOrWhiteSpace(displayNotes) ? null : displayNotes.Trim(),
                //ElectricalRequirement = string.IsNullOrWhiteSpace(electricalRequirement) ? null : electricalRequirement.Trim(),
                //SpecialRequirement = string.IsNullOrWhiteSpace(specialRequirement) ? null : specialRequirement.Trim(),
                //HazardousDemoDeclared = hazardousDemoDeclared,

                //DeclarantName = declarantName.Trim(),
                //DeclarantDesignation = declarantDesignation.Trim(),
                //DeclarationDate = declarationDate,
                //TermsAccepted = termsAccepted,
                //AccuracyAccepted = accuracyAccepted,
                //PaymentTimelineAccepted = paymentTimelineAccepted,
                //CancellationPolicyAccepted = cancellationPolicyAccepted,
                //PrivacyConsentAccepted = privacyConsentAccepted,
                //FinalAllocationConsentAccepted = finalAllocationConsentAccepted
            };
        }

        public void UpdateApplicationDetails(
            string legalName,
            string? tradeName,
            string registeredAddress,
            string city,
            string district,
            string state,
            string pincode,
            string contactPersonName,
            string contactPersonDesignation,
            string mobile,
            string email,
            string fasciaName,
            string productServiceDescription,
            string productKeywords)
        {
            LegalName = legalName.Trim();
            TradeName = string.IsNullOrWhiteSpace(tradeName) ? null : tradeName.Trim();
            RegisteredAddress = registeredAddress.Trim();
            City = city.Trim();
            District = district.Trim();
            State = state.Trim();
            Pincode = pincode.Trim();

            ContactPersonName = contactPersonName.Trim();
            ContactPersonDesignation = contactPersonDesignation.Trim();
            Mobile = mobile.Trim();
            Email = email.Trim().ToLowerInvariant();
            FasciaName = fasciaName.Trim().ToUpperInvariant();

            ProductServiceDescription = productServiceDescription.Trim();
            ProductKeywords = productKeywords.Trim();
        }
    };
    public sealed class Vip : AuditableEntity
    {
        private Vip() { }

        public string RegistrationNumber { get; private set; } = string.Empty;
        public string Name { get; private set; } = string.Empty;
        public string? Designation { get; private set; }
        public string? Organization { get; private set; }
        public string RegisteredAddress { get; private set; } = string.Empty;
        public string City { get; private set; } = string.Empty;
        public string District { get; private set; } = string.Empty;
        public string State { get; private set; } = "Tamil Nadu";
        public string Pincode { get; private set; } = string.Empty;


        public string ContactPersonName { get; private set; } = string.Empty;
        public string ContactPersonDesignation { get; private set; } = string.Empty;
        public string Mobile { get; private set; } = string.Empty;
        public string? AlternateMobile { get; private set; }
        public string Email { get; private set; } = string.Empty;
        public string? AlternateEmail { get; private set; }
        public string? Website { get; private set; }

        // Event-day Attendance / QR Check-in
        public bool IsPresent { get; private set; }
        public DateTimeOffset? CheckedInAt { get; private set; }
        public Guid? CheckedInBy { get; private set; }

        /// <summary>
        /// Marks the VIP as present at the event (QR scan check-in).
        /// Idempotent: returns false without changing state if already checked in.
        /// </summary>
        public bool MarkPresent(Guid? actorUserId)
        {
            if (IsPresent) return false;
            IsPresent = true;
            CheckedInAt = DateTimeOffset.UtcNow;
            CheckedInBy = actorUserId;
            return true;
        }

        public void AssignRegistrationNumber(string registrationNumber)
        {
            if (string.IsNullOrWhiteSpace(registrationNumber))
                throw new DomainRuleException(ErrorCodes.ValidationFailed, "Registration number is required.");
            RegistrationNumber = registrationNumber.Trim().ToUpperInvariant();
        }

        public static Vip Create(
            Guid tenantId,
            Guid eventId,
            string contactPersonName,
            string contactPersonDesignation,
            string mobile,
            string? alternateMobile,
            string email,
            string? alternateEmail,
            string? website,
             string registeredAddress,
            string city,
            string district,
            string state,
            string pincode,
            string? organization = null)
        {
            if (string.IsNullOrWhiteSpace(contactPersonName))
                throw new ArgumentException(
                    "Contact Person Name is required.",
                    nameof(contactPersonName));

            if (string.IsNullOrWhiteSpace(mobile))
                throw new ArgumentException(
                    "Mobile number is required.",
                    nameof(mobile));

            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentException(
                    "Email address is required.",
                    nameof(email));

            return new Vip
            {
                TenantId = tenantId,
                EventId = eventId,

                Name = contactPersonName.Trim(),
                Designation = string.IsNullOrWhiteSpace(contactPersonDesignation)
                    ? null
                    : contactPersonDesignation.Trim(),
                Organization = string.IsNullOrWhiteSpace(organization)
                    ? null
                    : organization.Trim(),
                RegisteredAddress = registeredAddress.Trim(),
                City = city.Trim(),
                District = district.Trim(),
                State = string.IsNullOrWhiteSpace(state) ? "Tamil Nadu" : state.Trim(),
                Pincode = pincode.Trim(),

                ContactPersonName = contactPersonName.Trim(),
                ContactPersonDesignation = contactPersonDesignation.Trim(),
                Mobile = mobile.Trim(),

                AlternateMobile = string.IsNullOrWhiteSpace(alternateMobile)
                    ? null
                    : alternateMobile.Trim(),

                Email = email.Trim().ToLowerInvariant(),

                AlternateEmail = string.IsNullOrWhiteSpace(alternateEmail)
                    ? null
                    : alternateEmail.Trim().ToLowerInvariant(),

                Website = string.IsNullOrWhiteSpace(website)
                    ? null
                    : website.Trim()
            };
        }

        public void Update(
            string contactPersonName,
            string contactPersonDesignation,
            string mobile,
            string? alternateMobile,
            string email,
            string? alternateEmail,
             string registeredAddress,
            string city,
            string district,
            string state,
            string pincode,
            string? website)
        {
            ContactPersonName = contactPersonName.Trim();
            ContactPersonDesignation = contactPersonDesignation.Trim();
            Mobile = mobile.Trim();

            AlternateMobile = string.IsNullOrWhiteSpace(alternateMobile)
                ? null
                : alternateMobile.Trim();

            Email = email.Trim().ToLowerInvariant();
            RegisteredAddress = registeredAddress.Trim();
            City = city.Trim();
            District = district.Trim();
            State = string.IsNullOrWhiteSpace(state) ? "Tamil Nadu" : state.Trim();
            Pincode = pincode.Trim();


            AlternateEmail = string.IsNullOrWhiteSpace(alternateEmail)
                ? null
                : alternateEmail.Trim().ToLowerInvariant();

            Website = string.IsNullOrWhiteSpace(website)
                ? null
                : website.Trim();
        }
    }




    public sealed class Segment : AuditableEntity
    {
        private Segment() { }

        public string SegmentCode { get; private set; } = "";
        public string SegmentName { get; private set; } = "";
        public int UploadedSourceRows { get; private set; }
        public string? GovernanceNotes { get; private set; }
        public bool IsActive { get; private set; } = true;

        public ICollection<SegmentMainCategory> SegmentMainCategories { get; private set; } = new List<SegmentMainCategory>();

        public static Segment Create(string segmentCode, string segmentName, int uploadedSourceRows = 0, string? governanceNotes = null)
        {
            if (uploadedSourceRows < 0) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Uploaded source rows cannot be negative.");

            return new Segment
            {
                SegmentCode = segmentCode.Trim().ToUpperInvariant(),
                SegmentName = segmentName.Trim(),
                UploadedSourceRows = uploadedSourceRows,
                GovernanceNotes = governanceNotes,
                IsActive = true
            };
        }
    }

    public sealed class MainCategory : AuditableEntity
    {
        private MainCategory() { }

        public string MainCategoryCode { get; private set; } = "";
        public string MainCategoryName { get; private set; } = "";
        public string CategoryType { get; private set; } = "";
        public string? RelevantHsnSacPrefix { get; private set; }
        public string? Description { get; private set; }
        public int DisplayOrder { get; private set; }
        public bool IsActive { get; private set; } = true;
        public int UploadedReferenceRows { get; private set; }
        public string? SourceCoverageStatus { get; private set; }

        public ICollection<Classification> Classifications { get; private set; } = new List<Classification>();
        public ICollection<SegmentMainCategory> SegmentMainCategories { get; private set; } = new List<SegmentMainCategory>();

        public static MainCategory Create(string code, string name, string categoryType, int displayOrder, int uploadedReferenceRows = 0, string? sourceCoverageStatus = null)
        {
            if (displayOrder <= 0) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Display order must be > 0.");
            if (uploadedReferenceRows < 0) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Uploaded reference rows cannot be negative.");

            return new MainCategory
            {
                MainCategoryCode = code.Trim().ToUpperInvariant(),
                MainCategoryName = name.Trim(),
                CategoryType = categoryType.Trim(),
                DisplayOrder = displayOrder,
                UploadedReferenceRows = uploadedReferenceRows,
                SourceCoverageStatus = sourceCoverageStatus,
                IsActive = true
            };
        }
    }

    public sealed class SegmentMainCategory
    {
        private SegmentMainCategory() { }

        public Guid SegmentId { get; private set; }
        public Segment Segment { get; private set; } = null!;

        public Guid MainCategoryId { get; private set; }
        public MainCategory MainCategory { get; private set; } = null!;

        public string SourceBasis { get; private set; } = "VERIFIED_SEGMENT_MASTER";
        public DateTimeOffset CreatedAt { get; private set; }

        public static SegmentMainCategory Create(Guid segmentId, Guid mainCategoryId, string sourceBasis = "VERIFIED_SEGMENT_MASTER")
        {
            return new SegmentMainCategory
            {
                SegmentId = segmentId,
                MainCategoryId = mainCategoryId,
                SourceBasis = sourceBasis,
                CreatedAt = DateTimeOffset.UtcNow
            };
        }
    }

    public sealed class Classification : AuditableEntity
    {
        private Classification() { }

        public string RecordId { get; private set; } = "";
        public Guid MainCategoryId { get; private set; }
        public MainCategory MainCategory { get; private set; } = null!;
        public string SubCategory { get; private set; } = "";
        public string ClassType { get; private set; } = "";
        public string CodeSystem { get; private set; } = "";
        public string BaselineCode { get; private set; } = "";
        public string BaselineClassificationName { get; private set; } = "";
        public string? MatchingKeywords { get; private set; }
        public short CodeLength { get; private set; }
        public string? TypeSystemCheck { get; private set; }
        public bool IsActive { get; private set; } = true;
        public string? GstValidationStatus { get; private set; }
        public string? GovernanceNotes { get; private set; }
        public string? PortalSegmentCodes { get; private set; }
        public string? SourceMainCategory { get; private set; }
        public string? SourceSubCategory { get; private set; }
        public string? SourceCode6OrHeading { get; private set; }
        public string? SourceCode8 { get; private set; }
        public string? SourceFile { get; private set; }
        public int? SourceRow { get; private set; }
        public string? DuplicateUsageStatus { get; private set; }
        public string? ReconciliationAction { get; private set; }
        public string? SourceVerificationStatus { get; private set; }
        public string? ParentCodeCoverageStatus { get; private set; }
        public string? OriginalCode { get; private set; }
        public string? OriginalClassificationName { get; private set; }
        public string VerifiedCode { get; private set; } = "";
        public string VerifiedClassificationName { get; private set; } = "";
        public string VerificationAction { get; private set; } = "";
        public string VerificationStatus { get; private set; } = "";
        public string TaxUseStatus { get; private set; } = "";
        public string VerificationAuthority { get; private set; } = "";
        public string? AuthorityUrl { get; private set; }
        public string? CorrectionReason { get; private set; }
        public DateOnly VerifiedAsOf { get; private set; }

        public static Classification Create(Guid mainCategoryId, string recordId, string subCategory, string classType, string codeSystem, string baselineCode, string baselineClassificationName, short codeLength, string verifiedCode, string verifiedClassificationName, string verificationAction, string verificationStatus, string taxUseStatus, string verificationAuthority, DateOnly verifiedAsOf)
        {
            if (codeLength < 2 || codeLength > 8) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Code length must be between 2 and 8.");

            return new Classification
            {
                MainCategoryId = mainCategoryId,
                RecordId = recordId.Trim(),
                SubCategory = subCategory.Trim(),
                ClassType = classType.Trim(),
                CodeSystem = codeSystem.Trim().ToUpperInvariant(),
                BaselineCode = baselineCode.Trim(),
                BaselineClassificationName = baselineClassificationName.Trim(),
                CodeLength = codeLength,
                VerifiedCode = verifiedCode.Trim(),
                VerifiedClassificationName = verifiedClassificationName.Trim(),
                VerificationAction = verificationAction,
                VerificationStatus = verificationStatus,
                TaxUseStatus = taxUseStatus,
                VerificationAuthority = verificationAuthority,
                VerifiedAsOf = verifiedAsOf,
                IsActive = true
            };
        }
    }

    public sealed class ClassificationSegment
    {
        private ClassificationSegment() { }

        public Guid ClassificationId { get; private set; }
        public Classification Classification { get; private set; } = null!;

        public Guid SegmentId { get; private set; }
        public Segment Segment { get; private set; } = null!;

        public string SourceBasis { get; private set; } = "VERIFIED_CLASSIFICATION_PORTAL_SEGMENT";
        public DateTimeOffset CreatedAt { get; private set; }

        public static ClassificationSegment Create(Guid classificationId, Guid segmentId, string sourceBasis = "VERIFIED_CLASSIFICATION_PORTAL_SEGMENT")
        {
            return new ClassificationSegment
            {
                ClassificationId = classificationId,
                SegmentId = segmentId,
                SourceBasis = sourceBasis,
                CreatedAt = DateTimeOffset.UtcNow
            };
        }
    }

    public sealed class ClassificationException : AuditableEntity
    {
        private ClassificationException() { }

        public Guid ClassificationId { get; private set; }
        public Classification Classification { get; private set; } = null!;
        public string Severity { get; private set; } = "";
        public string? OriginalCode { get; private set; }
        public string VerifiedCode { get; private set; } = "";
        public string VerificationAction { get; private set; } = "";
        public string TaxUseStatus { get; private set; } = "";
        public string? OriginalDescription { get; private set; }
        public string? VerifiedDescription { get; private set; }
        public string CorrectionReason { get; private set; } = "";
        public string Authority { get; private set; } = "";
        public string? AuthorityUrl { get; private set; }
        public string ResolutionStatus { get; private set; } = "RESOLVED_IN_VERIFIED_BASELINE";

        public static ClassificationException Create(Guid classificationId, string severity, string verifiedCode, string verificationAction, string taxUseStatus, string correctionReason, string authority)
        {
            return new ClassificationException
            {
                ClassificationId = classificationId,
                Severity = severity.Trim().ToUpperInvariant(),
                VerifiedCode = verifiedCode.Trim(),
                VerificationAction = verificationAction,
                TaxUseStatus = taxUseStatus,
                CorrectionReason = correctionReason.Trim(),
                Authority = authority.Trim()
            };
        }
    }

    public sealed class TagType : AuditableEntity
    {
        private TagType() { }

        public string TagTypeCode { get; private set; } = "";
        public string TagTypeName { get; private set; } = "";
        public string? Description { get; private set; }
        public int DisplayOrder { get; private set; }
        public bool IsActive { get; private set; } = true;

        public static TagType Create(string code, string name, int displayOrder)
        {
            return new TagType
            {
                TagTypeCode = code.Trim().ToUpperInvariant(),
                TagTypeName = name.Trim(),
                DisplayOrder = displayOrder,
                IsActive = true
            };
        }
    }

    public sealed class Tag : AuditableEntity
    {
        private Tag() { }

        public string TagCode { get; private set; } = "";
        public string TagName { get; private set; } = "";
        public Guid TagTypeId { get; private set; }
        public TagType TagType { get; private set; } = null!;
        public string? TagGroup { get; private set; }
        public string CanonicalName { get; private set; } = "";
        public string? Description { get; private set; }
        public bool BuyerApplicable { get; private set; }
        public bool SellerApplicable { get; private set; }
        public string SourceStatus { get; private set; } = "";
        public bool IsActive { get; private set; } = true;

        public static Tag Create(string code, string name, Guid tagTypeId, string canonicalName, bool buyerApplicable, bool sellerApplicable, string sourceStatus)
        {
            return new Tag
            {
                TagCode = code.Trim().ToUpperInvariant(),
                TagName = name.Trim(),
                TagTypeId = tagTypeId,
                CanonicalName = canonicalName.Trim(),
                BuyerApplicable = buyerApplicable,
                SellerApplicable = sellerApplicable,
                SourceStatus = sourceStatus,
                IsActive = true
            };
        }
    }

    public sealed class TagAlias : AuditableEntity
    {
        private TagAlias() { }

        public Guid TagId { get; private set; }
        public Tag Tag { get; private set; } = null!;
        public string Alias { get; private set; } = "";
        public string NormalizedAlias { get; private set; } = "";
        public string? AliasType { get; private set; }
        public string? Source { get; private set; }
        public string Status { get; private set; } = "";

        public static TagAlias Create(Guid tagId, string alias, string normalizedAlias, string status)
        {
            return new TagAlias
            {
                TagId = tagId,
                Alias = alias.Trim(),
                NormalizedAlias = normalizedAlias.Trim(),
                Status = status
            };
        }
    }

    public sealed class Uom : AuditableEntity
    {
        private Uom() { }

        public string UomCode { get; private set; } = "";
        public string UomName { get; private set; } = "";
        public string Symbol { get; private set; } = "";
        public string? UnitFamily { get; private set; }
        public string SourceStatus { get; private set; } = "";
        public bool IsActive { get; private set; } = true;

        public static Uom Create(string code, string name, string symbol, string sourceStatus)
        {
            return new Uom
            {
                UomCode = code.Trim().ToUpperInvariant(),
                UomName = name.Trim(),
                Symbol = symbol.Trim(),
                SourceStatus = sourceStatus,
                IsActive = true
            };
        }
    }

    public sealed class OperationDefinition : AuditableEntity
    {
        private OperationDefinition() { }

        public string OperationCode { get; private set; } = "";
        public string OperationName { get; private set; } = "";
        public string? OperationFamily { get; private set; }
        public string OperationType { get; private set; } = "";
        public string? Description { get; private set; }
        public bool IsActive { get; private set; } = true;

        public static OperationDefinition Create(string code, string name, string operationType)
        {
            return new OperationDefinition
            {
                OperationCode = code.Trim().ToUpperInvariant(),
                OperationName = name.Trim(),
                OperationType = operationType.Trim().ToUpperInvariant(),
                IsActive = true
            };
        }
    }

    public sealed class AttributeDefinition : AuditableEntity
    {
        private AttributeDefinition() { }

        public string AttributeCode { get; private set; } = "";
        public string AttributeLabel { get; private set; } = "";
        public string DataType { get; private set; } = "";
        public string? UnitFamily { get; private set; }
        public string? Description { get; private set; }
        public string SourceStatus { get; private set; } = "";
        public bool IsActive { get; private set; } = true;

        public static AttributeDefinition Create(string code, string label, string dataType, string sourceStatus)
        {
            return new AttributeDefinition
            {
                AttributeCode = code.Trim().ToUpperInvariant(),
                AttributeLabel = label.Trim(),
                DataType = dataType.Trim().ToUpperInvariant(),
                SourceStatus = sourceStatus,
                IsActive = true
            };
        }
    }

    public sealed class AttributeAllowedUom
    {
        private AttributeAllowedUom() { }

        public Guid AttributeId { get; private set; }
        public AttributeDefinition AttributeDefinition { get; private set; } = null!;

        public Guid UomId { get; private set; }
        public Uom Uom { get; private set; } = null!;

        public int DisplayOrder { get; private set; }
        public DateTimeOffset CreatedAt { get; private set; }

        public static AttributeAllowedUom Create(Guid attributeId, Guid uomId, int displayOrder)
        {
            if (displayOrder <= 0) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Display order must be > 0.");

            return new AttributeAllowedUom
            {
                AttributeId = attributeId,
                UomId = uomId,
                DisplayOrder = displayOrder,
                CreatedAt = DateTimeOffset.UtcNow
            };
        }
    }

    public sealed class QualityComplianceDefinition : AuditableEntity
    {
        private QualityComplianceDefinition() { }

        public string QcCode { get; private set; } = "";
        public string QcName { get; private set; } = "";
        public string QcType { get; private set; } = "";
        public string? Description { get; private set; }
        public string GovernanceStatus { get; private set; } = "";
        public bool IsActive { get; private set; } = true;

        public static QualityComplianceDefinition Create(string code, string name, string qcType, string governanceStatus)
        {
            return new QualityComplianceDefinition
            {
                QcCode = code.Trim().ToUpperInvariant(),
                QcName = name.Trim(),
                QcType = qcType.Trim(),
                GovernanceStatus = governanceStatus,
                IsActive = true
            };
        }
    }

    public sealed class ClassificationTag : AuditableEntity
    {
        private ClassificationTag() { }

        public Guid ClassificationId { get; private set; }
        public Classification Classification { get; private set; } = null!;
        public Guid TagId { get; private set; }
        public Tag Tag { get; private set; } = null!;
        public string ApplicabilityRole { get; private set; } = "";
        public string RelationshipType { get; private set; } = "";
        public string UiBehaviour { get; private set; } = "";
        public decimal ConfidenceScore { get; private set; }
        public decimal RelevanceWeight { get; private set; }
        public bool DefaultSelected { get; private set; }
        public bool EditableByUser { get; private set; }
        public string MandatoryStatus { get; private set; } = "";
        public string? ConditionText { get; private set; }
        public JsonDocument ConditionJson { get; private set; } = JsonDocument.Parse("{}");
        public int DisplayOrder { get; private set; }
        public string SourceBasis { get; private set; } = "";
        public string VerificationStatus { get; private set; } = "";
        public string? GovernanceNote { get; private set; }

        public static ClassificationTag Create(Guid classificationId, Guid tagId, string applicabilityRole, string relationshipType, string uiBehaviour, decimal confidenceScore, decimal relevanceWeight, bool defaultSelected, bool editableByUser, string mandatoryStatus, int displayOrder, string sourceBasis, string verificationStatus)
        {
            if (confidenceScore < 0 || confidenceScore > 100) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Confidence score must be between 0 and 100.");
            if (relevanceWeight < 0 || relevanceWeight > 1) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Relevance weight must be between 0 and 1.");

            return new ClassificationTag
            {
                ClassificationId = classificationId,
                TagId = tagId,
                ApplicabilityRole = applicabilityRole,
                RelationshipType = relationshipType,
                UiBehaviour = uiBehaviour,
                ConfidenceScore = confidenceScore,
                RelevanceWeight = relevanceWeight,
                DefaultSelected = defaultSelected,
                EditableByUser = editableByUser,
                MandatoryStatus = mandatoryStatus,
                DisplayOrder = displayOrder,
                SourceBasis = sourceBasis,
                VerificationStatus = verificationStatus
            };
        }
    }

    public sealed class ClassificationUom
    {
        private ClassificationUom() { }

        public Guid ClassificationId { get; private set; }
        public Classification Classification { get; private set; } = null!;
        public Guid UomId { get; private set; }
        public Uom Uom { get; private set; } = null!;
        public short PreferenceRank { get; private set; }
        public bool DefaultUom { get; private set; }
        public bool BuyerApplicable { get; private set; }
        public bool SellerApplicable { get; private set; }
        public string? ConditionText { get; private set; }
        public DateTimeOffset CreatedAt { get; private set; }

        public static ClassificationUom Create(Guid classificationId, Guid uomId, short preferenceRank, bool defaultUom, bool buyerApplicable, bool sellerApplicable)
        {
            return new ClassificationUom
            {
                ClassificationId = classificationId,
                UomId = uomId,
                PreferenceRank = preferenceRank,
                DefaultUom = defaultUom,
                BuyerApplicable = buyerApplicable,
                SellerApplicable = sellerApplicable,
                CreatedAt = DateTimeOffset.UtcNow
            };
        }
    }

    public sealed class ClassificationOperation : AuditableEntity
    {
        private ClassificationOperation() { }

        public Guid ClassificationId { get; private set; }
        public Classification Classification { get; private set; } = null!;
        public string RouteVariantCode { get; private set; } = "";
        public int SequenceNo { get; private set; }
        public int OperationNo { get; private set; }
        public Guid OperationId { get; private set; }
        public OperationDefinition Operation { get; private set; } = null!;
        public string StageType { get; private set; } = "";
        public string Applicability { get; private set; } = "";
        public string MandatoryLevel { get; private set; } = "";
        public string? ConditionText { get; private set; }
        public string? InputRequirement { get; private set; }
        public string? OutputResult { get; private set; }
        public bool QualityGateAfter { get; private set; }
        public Guid? InspectionTagId { get; private set; }
        public Guid? RecommendedMachineTagId { get; private set; }
        public bool BuyerVisible { get; private set; }
        public bool SellerVisible { get; private set; }
        public bool MatchingRelevant { get; private set; }
        public int DisplayOrder { get; private set; }

        public static ClassificationOperation Create(Guid classificationId, string routeVariantCode, int sequenceNo, int operationNo, Guid operationId, string stageType, string applicability, string mandatoryLevel, bool buyerVisible, bool sellerVisible, bool matchingRelevant, int displayOrder)
        {
            return new ClassificationOperation
            {
                ClassificationId = classificationId,
                RouteVariantCode = routeVariantCode,
                SequenceNo = sequenceNo,
                OperationNo = operationNo,
                OperationId = operationId,
                StageType = stageType,
                Applicability = applicability,
                MandatoryLevel = mandatoryLevel,
                BuyerVisible = buyerVisible,
                SellerVisible = sellerVisible,
                MatchingRelevant = matchingRelevant,
                DisplayOrder = displayOrder
            };
        }
    }

    public sealed class ClassificationAttribute
    {
        private ClassificationAttribute() { }

        public Guid ClassificationId { get; private set; }
        public Classification Classification { get; private set; } = null!;
        public Guid AttributeId { get; private set; }
        public AttributeDefinition Attribute { get; private set; } = null!;
        public bool BuyerApplicable { get; private set; }
        public bool SellerApplicable { get; private set; }
        public string MandatoryLevel { get; private set; } = "";
        public int DisplayOrder { get; private set; }
        public bool SuggestedFromClassification { get; private set; }
        public string? ConditionText { get; private set; }
        public DateTimeOffset CreatedAt { get; private set; }

        public static ClassificationAttribute Create(Guid classificationId, Guid attributeId, bool buyerApplicable, bool sellerApplicable, string mandatoryLevel, int displayOrder, bool suggestedFromClassification)
        {
            return new ClassificationAttribute
            {
                ClassificationId = classificationId,
                AttributeId = attributeId,
                BuyerApplicable = buyerApplicable,
                SellerApplicable = sellerApplicable,
                MandatoryLevel = mandatoryLevel,
                DisplayOrder = displayOrder,
                SuggestedFromClassification = suggestedFromClassification,
                CreatedAt = DateTimeOffset.UtcNow
            };
        }
    }

    public sealed class ClassificationQualityCompliance
    {
        private ClassificationQualityCompliance() { }

        public Guid ClassificationId { get; private set; }
        public Classification Classification { get; private set; } = null!;
        public Guid QualityComplianceId { get; private set; }
        public QualityComplianceDefinition QualityCompliance { get; private set; } = null!;
        public string QcTypeSnapshot { get; private set; } = "";
        public string UiBehaviour { get; private set; } = "";
        public string MandatoryStatus { get; private set; } = "";
        public string? ConditionText { get; private set; }
        public decimal ConfidenceScore { get; private set; }
        public string SourceBasis { get; private set; } = "";
        public string? GovernanceNote { get; private set; }
        public DateTimeOffset CreatedAt { get; private set; }

        public static ClassificationQualityCompliance Create(Guid classificationId, Guid qualityComplianceId, string qcTypeSnapshot, string uiBehaviour, string mandatoryStatus, decimal confidenceScore, string sourceBasis)
        {
            return new ClassificationQualityCompliance
            {
                ClassificationId = classificationId,
                QualityComplianceId = qualityComplianceId,
                QcTypeSnapshot = qcTypeSnapshot,
                UiBehaviour = uiBehaviour,
                MandatoryStatus = mandatoryStatus,
                ConfidenceScore = confidenceScore,
                SourceBasis = sourceBasis,
                CreatedAt = DateTimeOffset.UtcNow
            };
        }
    }

    public sealed class BuyerRequirementTag : AuditableEntity
    {
        private BuyerRequirementTag() { }

        public Guid BuyerRequirementId { get; private set; }
        public Guid TagId { get; private set; }
        public Tag Tag { get; private set; } = null!;
        public string SourceType { get; private set; } = "";
        public bool SuggestedFromClassification { get; private set; }
        public bool UserSelected { get; private set; }
        public bool MatchRelevant { get; private set; }

        public static BuyerRequirementTag Create(Guid tenantId, Guid? eventId, Guid buyerRequirementId, Guid tagId, string sourceType, bool suggestedFromClassification, bool userSelected, bool matchRelevant)
        {
            return new BuyerRequirementTag
            {
                TenantId = tenantId,
                EventId = eventId,
                BuyerRequirementId = buyerRequirementId,
                TagId = tagId,
                SourceType = sourceType,
                SuggestedFromClassification = suggestedFromClassification,
                UserSelected = userSelected,
                MatchRelevant = matchRelevant
            };
        }
    }

    public sealed class SellerCapabilityTag : AuditableEntity
    {
        private SellerCapabilityTag() { }

        public Guid SellerCapabilityId { get; private set; }
        public Guid TagId { get; private set; }
        public Tag Tag { get; private set; } = null!;
        public string SourceType { get; private set; } = "";
        public bool SuggestedFromClassification { get; private set; }
        public bool UserSelected { get; private set; }
        public bool MatchRelevant { get; private set; }

        public static SellerCapabilityTag Create(Guid tenantId, Guid? eventId, Guid sellerCapabilityId, Guid tagId, string sourceType, bool suggestedFromClassification, bool userSelected, bool matchRelevant)
        {
            return new SellerCapabilityTag
            {
                TenantId = tenantId,
                EventId = eventId,
                SellerCapabilityId = sellerCapabilityId,
                TagId = tagId,
                SourceType = sourceType,
                SuggestedFromClassification = suggestedFromClassification,
                UserSelected = userSelected,
                MatchRelevant = matchRelevant
            };
        }
    }

}