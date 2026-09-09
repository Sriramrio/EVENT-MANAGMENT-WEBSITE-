using MSME.StallBooking.SharedKernel.Audit;
using MSME.StallBooking.SharedKernel.Errors;
using System.Text.Json.Nodes;

namespace MSME.StallBooking.Domain.Marketplace;

public enum MarketplaceMembershipRole { OWNER, ADMIN, BUYER_USER, SELLER_USER, BOTH, VIEWER }

public abstract class MarketplaceEntity : AuditableEntity
{
    public long Version { get; protected set; } = 1;

    public void Touch(Guid? actorUserId, string? correlationId)
    {
        Version++;
        StampUpdate(actorUserId, correlationId);
    }
}

public sealed class ReferenceDataItem : MarketplaceEntity
{
    private ReferenceDataItem() { }
    public string Kind { get; private set; } = "";
    public string Code { get; private set; } = "";
    public string Name { get; private set; } = "";
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; } = true;
    public string MetadataJson { get; private set; } = "{}";

    public static ReferenceDataItem Create(string kind, string code, string name, int order, string metadataJson = "{}") => new()
    {
        Kind = kind.Trim().ToUpperInvariant(),
        Code = code.Trim().ToUpperInvariant(),
        Name = name.Trim(),
        DisplayOrder = order,
        MetadataJson = metadataJson
    };

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
    }
}

public sealed class MarketplaceOrganization : MarketplaceEntity
{
    private MarketplaceOrganization() { }
    public string OrganizationType { get; private set; } = "BOTH";
    public string LegalName { get; private set; } = "";
    public string? TradeName { get; private set; }
    public string? Gstin { get; private set; }
    public string? Pan { get; private set; }
    public string? UdyamNumber { get; private set; }
    public string Email { get; private set; } = "";
    public string Phone { get; private set; } = "";
    public string Address { get; private set; } = "";
    public string City { get; private set; } = "";
    public string State { get; private set; } = "";
    public string Country { get; private set; } = "India";
    public string Pincode { get; private set; } = "";
    public Guid? SourceExhibitorId { get; private set; }
    public Guid? SourceVisitorId { get; private set; }
    public string Status { get; private set; } = "ACTIVE";

    // New fields
    public string? BusinessType { get; private set; }
    public string? Industry { get; private set; }
    public string? CompanyWebsite { get; private set; }
    public int? YearOfEstablishment { get; private set; }
    public int? TotalEmployees { get; private set; }
    public decimal? AnnualTurnover { get; private set; }

    public static MarketplaceOrganization Create(string type, string legalName, string email, string phone, string address, string city, string state, string pincode, Guid? sourceExhibitorId, Guid? sourceVisitorId, string? gstin = null, string? udyamNumber = null, string? businessType = null, string? industry = null, string? companyWebsite = null, int? yearOfEstablishment = null, int? totalEmployees = null, decimal? annualTurnover = null)
    {
        if (string.IsNullOrWhiteSpace(legalName) || string.IsNullOrWhiteSpace(email))
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Organization legal name and email are required.");
        return new MarketplaceOrganization { OrganizationType = type.Trim().ToUpperInvariant(), LegalName = legalName.Trim(), Email = email.Trim().ToLowerInvariant(), Phone = phone.Trim(), Address = address.Trim(), City = city.Trim(), State = state.Trim(), Pincode = pincode.Trim(), SourceExhibitorId = sourceExhibitorId, SourceVisitorId = sourceVisitorId, Gstin = gstin?.Trim().ToUpperInvariant(), UdyamNumber = udyamNumber?.Trim().ToUpperInvariant(), BusinessType = businessType?.Trim(), Industry = industry?.Trim(), CompanyWebsite = companyWebsite?.Trim(), YearOfEstablishment = yearOfEstablishment, TotalEmployees = totalEmployees, AnnualTurnover = annualTurnover, Status = "ACTIVE" };
    }

    public void Update(string legalName, string? tradeName, string email, string phone, string address, string city, string state, string pincode, string? gstin, string? pan, string? udyam, string? businessType, string? industry, string? companyWebsite, int? yearOfEstablishment, int? totalEmployees, decimal? annualTurnover, Guid? actor, string? correlation)
    {
        LegalName = legalName.Trim(); TradeName = tradeName?.Trim(); Email = email.Trim().ToLowerInvariant(); Phone = phone.Trim(); Address = address.Trim(); City = city.Trim(); State = state.Trim(); Pincode = pincode.Trim(); Gstin = gstin?.Trim().ToUpperInvariant(); Pan = pan?.Trim().ToUpperInvariant(); UdyamNumber = udyam?.Trim().ToUpperInvariant(); BusinessType = businessType?.Trim(); Industry = industry?.Trim(); CompanyWebsite = companyWebsite?.Trim(); YearOfEstablishment = yearOfEstablishment; TotalEmployees = totalEmployees; AnnualTurnover = annualTurnover; Touch(actor, correlation);
    }

    public void SetStatus(string status, Guid? actor, string? correlation)
    {
        Status = status.Trim().ToUpperInvariant();
        Touch(actor, correlation);
    }
}

public sealed class OrganizationUser : MarketplaceEntity
{
    private OrganizationUser() { }
    public Guid OrganizationId { get; private set; }
    public Guid UserId { get; private set; }
    public MarketplaceMembershipRole Role { get; private set; }
    public bool IsActive { get; private set; } = true;
    public static OrganizationUser Create(Guid organizationId, Guid userId, MarketplaceMembershipRole role) => new() { OrganizationId = organizationId, UserId = userId, Role = role };
}

public sealed class OrganizationContact : MarketplaceEntity
{
    private OrganizationContact() { }
    public Guid OrganizationId { get; private set; }
    public string Name { get; private set; } = "";
    public string? Designation { get; private set; }
    public string Email { get; private set; } = "";
    public string Phone { get; private set; } = "";
    public bool IsPrimary { get; private set; }
    public static OrganizationContact Create(Guid organizationId, string name, string email, string phone, string? designation, bool primary) => new() { OrganizationId = organizationId, Name = name.Trim(), Email = email.Trim().ToLowerInvariant(), Phone = phone.Trim(), Designation = designation?.Trim(), IsPrimary = primary };

    public void Update(string name, string email, string phone, string? designation, Guid? actor, string? correlation)
    {
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email))
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Contact name and email are required.");
        Name = name.Trim(); Email = email.Trim().ToLowerInvariant(); Phone = phone.Trim(); Designation = designation?.Trim(); Touch(actor, correlation);
    }
}

public sealed class OrganizationLocation : MarketplaceEntity
{
    private OrganizationLocation() { }
    public Guid OrganizationId { get; private set; }
    public string LocationType { get; private set; } = "PLANT";
    public string Address { get; private set; } = "";
    public string City { get; private set; } = "";
    public string State { get; private set; } = "";
    public string Pincode { get; private set; } = "";
}

public sealed class EventParticipation : MarketplaceEntity
{
    private EventParticipation() { }
    public Guid OrganizationId { get; private set; }
    public string ParticipationRole { get; private set; } = "BOTH";
    public string Status { get; private set; } = "ACTIVE";
}

public sealed class MarketplaceDocument : MarketplaceEntity
{
    private MarketplaceDocument() { }
    public Guid OrganizationId { get; private set; }
    public string EntityType { get; private set; } = "ORGANIZATION";
    public Guid? EntityId { get; private set; }
    public string DocumentType { get; private set; } = "OTHER";
    public string FileName { get; private set; } = "";
    public string StoragePath { get; private set; } = "";
    public string ContentType { get; private set; } = "application/octet-stream";
    public long FileSizeBytes { get; private set; }
}

public sealed class BuyerRequirement : MarketplaceEntity
{
    private BuyerRequirement() { }
    public Guid OrganizationId { get; private set; }
    public string RequirementNo { get; private set; } = "";
    public string Title { get; private set; } = "";
    public string Description { get; private set; } = "";
    public string SourcingType { get; private set; } = "PRODUCT";
    public string? SegmentCode { get; private set; }
    public string? MainCategoryCode { get; private set; }
    public string? ClassificationCode { get; private set; }
    public decimal Quantity { get; private set; }
    public string UomCode { get; private set; } = "NOS";
    public DateOnly RequirementDate { get; private set; }
    public DateOnly NeedByDate { get; private set; }
    public decimal? BudgetMin { get; private set; }
    public decimal? BudgetMax { get; private set; }
    public string Currency { get; private set; } = "INR";
    public string Status { get; private set; } = "DRAFT";
    public string DetailsJson { get; private set; } = "{}";

    public static BuyerRequirement Create(Guid organizationId, string number, string title, string description, string sourcingType, string? segmentCode, string? mainCategoryCode, string? classificationCode, decimal quantity, string uomCode, DateOnly needByDate, decimal? budgetMin, decimal? budgetMax, string detailsJson)
    {
        if (quantity <= 0) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Quantity must be greater than zero.");
        if (needByDate < DateOnly.FromDateTime(DateTime.UtcNow.Date)) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Need-by date cannot be in the past.");
        if (budgetMin.HasValue && budgetMax.HasValue && budgetMax < budgetMin) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Budget maximum cannot be lower than budget minimum.");
        return new BuyerRequirement { OrganizationId = organizationId, RequirementNo = number, Title = title.Trim(), Description = description.Trim(), SourcingType = sourcingType.Trim().ToUpperInvariant(), SegmentCode = segmentCode?.Trim().ToUpperInvariant(), MainCategoryCode = mainCategoryCode?.Trim().ToUpperInvariant(), ClassificationCode = classificationCode?.Trim(), Quantity = quantity, UomCode = uomCode.Trim().ToUpperInvariant(), RequirementDate = DateOnly.FromDateTime(DateTime.UtcNow), NeedByDate = needByDate, BudgetMin = budgetMin, BudgetMax = budgetMax, DetailsJson = detailsJson };
    }

    public void UpdateDraft(string? title, string? description, string? sourcingType, string? segmentCode, string? mainCategoryCode, string? classificationCode, decimal? quantity, string? uomCode, DateOnly? needByDate, decimal? budgetMin, decimal? budgetMax, string? detailsJson, Guid? actor, string? correlation)
    {
        if (Status is not ("DRAFT" or "PUBLISHED" or "ACTIVE" or "OPEN")) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Only draft or active requirements can be edited.");
        if (budgetMin.HasValue && budgetMax.HasValue && budgetMax < budgetMin) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Budget maximum cannot be lower than budget minimum.");
        if (!string.IsNullOrWhiteSpace(title)) Title = title.Trim();
        if (!string.IsNullOrWhiteSpace(description)) Description = description.Trim();
        if (!string.IsNullOrWhiteSpace(sourcingType)) SourcingType = sourcingType.Trim().ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(segmentCode)) SegmentCode = segmentCode.Trim().ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(mainCategoryCode)) MainCategoryCode = mainCategoryCode.Trim().ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(classificationCode)) ClassificationCode = classificationCode.Trim();
        if (quantity.HasValue && quantity.Value > 0) Quantity = quantity.Value;
        if (!string.IsNullOrWhiteSpace(uomCode)) UomCode = uomCode.Trim().ToUpperInvariant();
        if (needByDate.HasValue) NeedByDate = needByDate.Value;
        if (budgetMin.HasValue) BudgetMin = budgetMin;
        if (budgetMax.HasValue) BudgetMax = budgetMax;
        if (!string.IsNullOrWhiteSpace(detailsJson))
        {
            DetailsJson = detailsJson;
            try
            {
                var node = JsonNode.Parse(detailsJson) as JsonObject;
                if (node != null)
                {
                    if (string.IsNullOrWhiteSpace(title) && node.TryGetPropertyValue("title", out var tNode) && tNode != null && !string.IsNullOrWhiteSpace(tNode.ToString()))
                        Title = tNode.ToString().Trim();
                    if (string.IsNullOrWhiteSpace(description) && node.TryGetPropertyValue("description", out var dNode) && dNode != null && !string.IsNullOrWhiteSpace(dNode.ToString()))
                        Description = dNode.ToString().Trim();
                    if (string.IsNullOrWhiteSpace(sourcingType) && node.TryGetPropertyValue("sourcingType", out var stNode) && stNode != null && !string.IsNullOrWhiteSpace(stNode.ToString()))
                        SourcingType = stNode.ToString().Trim().ToUpperInvariant();
                    else if (string.IsNullOrWhiteSpace(sourcingType) && node.TryGetPropertyValue("requirementType", out var rtNode) && rtNode != null && !string.IsNullOrWhiteSpace(rtNode.ToString()))
                    {
                        var rtStr = rtNode.ToString().Trim();
                        SourcingType = (rtStr.Equals("Services", StringComparison.OrdinalIgnoreCase) || rtStr.Equals("Consulting", StringComparison.OrdinalIgnoreCase)) ? "SERVICE" : "PRODUCT";
                    }
                    if (string.IsNullOrWhiteSpace(segmentCode) && (node.TryGetPropertyValue("segmentCode", out var segNode) || node.TryGetPropertyValue("segment", out segNode)) && segNode != null && !string.IsNullOrWhiteSpace(segNode.ToString()))
                        SegmentCode = segNode.ToString().Trim().ToUpperInvariant();
                    if (string.IsNullOrWhiteSpace(mainCategoryCode) && (node.TryGetPropertyValue("mainCategoryCode", out var mcNode) || node.TryGetPropertyValue("mainCategory", out mcNode)) && mcNode != null && !string.IsNullOrWhiteSpace(mcNode.ToString()))
                        MainCategoryCode = mcNode.ToString().Trim().ToUpperInvariant();
                    if (string.IsNullOrWhiteSpace(classificationCode) && (node.TryGetPropertyValue("classificationCode", out var ccNode) || node.TryGetPropertyValue("classification", out ccNode) || node.TryGetPropertyValue("hsnCode", out ccNode)) && ccNode != null && !string.IsNullOrWhiteSpace(ccNode.ToString()))
                        ClassificationCode = ccNode.ToString().Trim();
                    if ((!quantity.HasValue || quantity.Value <= 0) && node.TryGetPropertyValue("quantity", out var qNode) && qNode != null && decimal.TryParse(qNode.ToString(), out var parsedQ) && parsedQ > 0)
                        Quantity = parsedQ;
                    if (string.IsNullOrWhiteSpace(uomCode) && (node.TryGetPropertyValue("uomCode", out var uomNode) || node.TryGetPropertyValue("uom", out uomNode)) && uomNode != null && !string.IsNullOrWhiteSpace(uomNode.ToString()))
                        UomCode = uomNode.ToString().Trim().ToUpperInvariant();
                    if (!needByDate.HasValue && node.TryGetPropertyValue("needByDate", out var nbNode) && nbNode != null && DateOnly.TryParse(nbNode.ToString(), out var parsedDate))
                        NeedByDate = parsedDate;
                }
            }
            catch { }
        }
        Touch(actor, correlation);
    }
    public void UpdateDraft(string? title, string? description, string? sourcingType, decimal? quantity, string? uomCode, DateOnly? needByDate, decimal? budgetMin, decimal? budgetMax, string? detailsJson, Guid? actor, string? correlation) =>
        UpdateDraft(title, description, sourcingType, null, null, null, quantity, uomCode, needByDate, budgetMin, budgetMax, detailsJson, actor, correlation);
    public void UpdateDraft(string title, string description, decimal quantity, string uomCode, DateOnly needByDate, decimal? budgetMin, decimal? budgetMax, string detailsJson, Guid? actor, string? correlation) =>
        UpdateDraft(title, description, null, null, null, null, quantity, uomCode, needByDate, budgetMin, budgetMax, detailsJson, actor, correlation);

    // Mirrors SellerCapability.SaveClassification below. Screen 02 (Classification Selection)
    // must persist to these real columns, not just into DetailsJson via SaveStep, because
    // MatchingController.Score() reads SegmentCode/MainCategoryCode/ClassificationCode
    // directly off this entity. Without this, buyer requirements never match sellers
    // correctly regardless of what the user picks on the classification screen.
    public void SaveClassification(string? segmentCode, string? mainCategoryCode, string? classificationCode, Guid? actor, string? correlation)
    {
        if (Status is not ("DRAFT" or "PUBLISHED" or "ACTIVE" or "OPEN")) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Only draft or active requirements can be edited.");
        SegmentCode = segmentCode?.Trim().ToUpperInvariant();
        MainCategoryCode = mainCategoryCode?.Trim().ToUpperInvariant();
        ClassificationCode = classificationCode?.Trim();
        Touch(actor, correlation);
    }
    public void SaveStep(string stepKey, string stepPayloadJson, Guid? actor, string? correlation)
    {
        if (Status is not ("DRAFT" or "PUBLISHED" or "ACTIVE" or "OPEN"))
            throw new DomainRuleException(ErrorCodes.ValidationFailed, "Only draft or active requirements can be edited.");

        JsonObject root;
        try
        {
            root = JsonNode.Parse(string.IsNullOrWhiteSpace(DetailsJson) ? "{}" : DetailsJson)?.AsObject() ?? new JsonObject();
        }
        catch
        {
            root = new JsonObject();
        }

        var stepNode = JsonNode.Parse(stepPayloadJson);
        var key = stepKey.ToLowerInvariant().Trim();

        // If key is captured as "steps", detect step type by its fields
        if (key == "steps" && stepNode is JsonObject nodeObj)
        {
            if (nodeObj.ContainsKey("requiredProcesses") || nodeObj.ContainsKey("materialGrade") || nodeObj.ContainsKey("minExperience"))
                key = "technical";
            else if (nodeObj.ContainsKey("deliveryTerms") || nodeObj.ContainsKey("budgetRange"))
                key = "commercial";
            else if (nodeObj.ContainsKey("hsnCode") || nodeObj.ContainsKey("uom"))
                key = "classification";
        }

        // Save section
        root[key] = stepNode?.DeepClone();
        root["lastSavedStep"] = key;
        root["lastSavedAt"] = DateTimeOffset.UtcNow.ToString("o");

        // Flatten all properties into root
        if (stepNode is JsonObject stepObj)
        {
            foreach (var kvp in stepObj)
            {
                root[kvp.Key] = kvp.Value?.DeepClone();
            }

            if (stepObj.TryGetPropertyValue("title", out var titleNode) && titleNode is not null && !string.IsNullOrWhiteSpace(titleNode.ToString()))
                Title = titleNode.ToString().Trim();
            if (stepObj.TryGetPropertyValue("description", out var descNode) && descNode is not null && !string.IsNullOrWhiteSpace(descNode.ToString()))
                Description = descNode.ToString().Trim();
            if (stepObj.TryGetPropertyValue("sourcingType", out var stNode) && stNode is not null && !string.IsNullOrWhiteSpace(stNode.ToString()))
                SourcingType = stNode.ToString().Trim().ToUpperInvariant();
            if (stepObj.TryGetPropertyValue("quantity", out var qNode) && qNode is not null && decimal.TryParse(qNode.ToString(), out var parsedQ) && parsedQ > 0)
                Quantity = parsedQ;
            if (stepObj.TryGetPropertyValue("uom", out var uNode) && uNode is not null && !string.IsNullOrWhiteSpace(uNode.ToString()))
                UomCode = uNode.ToString().Trim().ToUpperInvariant();
            else if (stepObj.TryGetPropertyValue("uomCode", out var ucNode) && ucNode is not null && !string.IsNullOrWhiteSpace(ucNode.ToString()))
                UomCode = ucNode.ToString().Trim().ToUpperInvariant();
            if (stepObj.TryGetPropertyValue("needByDate", out var dNode) && dNode is not null && DateOnly.TryParse(dNode.ToString(), out var parsedDate))
                NeedByDate = parsedDate;
            if ((stepObj.TryGetPropertyValue("segmentCode", out var sgcNode) || stepObj.TryGetPropertyValue("segment", out sgcNode)) && sgcNode is not null && !string.IsNullOrWhiteSpace(sgcNode.ToString()))
                SegmentCode = sgcNode.ToString().Trim().ToUpperInvariant();
            if ((stepObj.TryGetPropertyValue("mainCategoryCode", out var mccNode) || stepObj.TryGetPropertyValue("mainCategory", out mccNode)) && mccNode is not null && !string.IsNullOrWhiteSpace(mccNode.ToString()))
                MainCategoryCode = mccNode.ToString().Trim().ToUpperInvariant();
            if ((stepObj.TryGetPropertyValue("classificationCode", out var clcNode) || stepObj.TryGetPropertyValue("classification", out clcNode) || stepObj.TryGetPropertyValue("hsnCode", out clcNode)) && clcNode is not null && !string.IsNullOrWhiteSpace(clcNode.ToString()))
                ClassificationCode = clcNode.ToString().Trim();
        }

        // Explicitly write technicalQualification & technicalCriteria keys
        if (key.Equals("technical", StringComparison.OrdinalIgnoreCase) ||
            key.Equals("technicalqualification", StringComparison.OrdinalIgnoreCase))
        {
            root["technicalQualification"] = stepNode?.DeepClone();
            root["technicalCriteria"] = stepNode?.DeepClone();
        }

        DetailsJson = root.ToJsonString();
        Touch(actor, correlation);
    }
    public void Transition(string next, Guid? actor, string? correlation)
    {
        var normalized = next.ToUpperInvariant();
        if (Status == normalized) return; // Idempotent transition
        var allowed = (Status, normalized) switch { ("DRAFT", "PUBLISHED") => true, ("PUBLISHED", "MATCHING") => true, ("MATCHING", "AWARDED") => true, (_, "PUBLISHED") => true, (_, "CLOSED") => true, (_, "CANCELLED") => true, _ => false };
        if (!allowed) throw new DomainRuleException(ErrorCodes.ValidationFailed, $"Requirement transition {Status} -> {next} is not allowed.");
        Status = normalized; Touch(actor, correlation);
    }
}

public sealed class BuyerRequirementStatusHistory : MarketplaceEntity
{
    private BuyerRequirementStatusHistory() { }
    public Guid RequirementId { get; private set; }
    public string FromStatus { get; private set; } = "";
    public string ToStatus { get; private set; } = "";
    public string? Reason { get; private set; }
    public static BuyerRequirementStatusHistory Create(Guid id, string from, string to, string? reason) => new() { RequirementId = id, FromStatus = from, ToStatus = to, Reason = reason };
}

public sealed class SellerCapability : MarketplaceEntity
{
    private SellerCapability() { }
    public Guid OrganizationId { get; private set; }
    public string CapabilityNo { get; private set; } = "";
    public string Title { get; private set; } = "";
    public string Description { get; private set; } = "";
    public string BusinessType { get; private set; } = "MANUFACTURER";
    public string CapabilityType { get; private set; } = "Both";
    public string PlantLocation { get; private set; } = "";
    public string ContactPerson { get; private set; } = "";
    public string ContactEmail { get; private set; } = "";
    public string MobileCode { get; private set; } = "+91";
    public string MobileNumber { get; private set; } = "";
    public string Designation { get; private set; } = "";
    public string? SegmentCode { get; private set; }
    public string? MainCategoryCode { get; private set; }
    public string? ClassificationCode { get; private set; }
    public string UomCode { get; private set; } = "NOS";
    public string TechnicalJson { get; private set; } = "{}";
    public string CommercialJson { get; private set; } = "{}";
    public string Status { get; private set; } = "DRAFT";

    public static SellerCapability Create(Guid organizationId, string number, string title, string description, string businessType, string capabilityType, string plantLocation, string contactPerson, string contactEmail, string mobileCode, string mobileNumber, string designation)
    {
        if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(contactEmail)) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Capability title and contact email are required.");
        return new SellerCapability { OrganizationId = organizationId, CapabilityNo = number, Title = title.Trim(), Description = description.Trim(), BusinessType = businessType.Trim().ToUpperInvariant(), CapabilityType = capabilityType.Trim(), PlantLocation = plantLocation.Trim(), ContactPerson = contactPerson.Trim(), ContactEmail = contactEmail.Trim().ToLowerInvariant(), MobileCode = mobileCode.Trim(), MobileNumber = mobileNumber.Trim(), Designation = designation.Trim() };
    }
    public void UpdateDraft(string? title, string? description, string? businessType, string? capabilityType, string? plantLocation, string? contactPerson, string? contactEmail, string? mobileCode, string? mobileNumber, string? designation, Guid? actor, string? correlation)
    {
        if (Status is not ("DRAFT" or "PUBLISHED" or "ACTIVE")) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Only draft or active capabilities can be edited.");
        if (!string.IsNullOrWhiteSpace(title)) Title = title.Trim();
        if (!string.IsNullOrWhiteSpace(description)) Description = description.Trim();
        if (!string.IsNullOrWhiteSpace(businessType)) BusinessType = businessType.Trim().ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(capabilityType)) CapabilityType = capabilityType.Trim();
        if (plantLocation != null) PlantLocation = plantLocation.Trim();
        if (contactPerson != null) ContactPerson = contactPerson.Trim();
        if (!string.IsNullOrWhiteSpace(contactEmail)) ContactEmail = contactEmail.Trim().ToLowerInvariant();
        if (mobileCode != null) MobileCode = mobileCode.Trim();
        if (mobileNumber != null) MobileNumber = mobileNumber.Trim();
        if (designation != null) Designation = designation.Trim();
        Touch(actor, correlation);
    }
    public void SaveClassification(string? segment, string? category, string? classification, string uom, Guid? actor, string? correlation) { SegmentCode = segment; MainCategoryCode = category; ClassificationCode = classification; UomCode = uom.Trim().ToUpperInvariant(); Touch(actor, correlation); }
    public void SaveTechnical(string json, Guid? actor, string? correlation) { TechnicalJson = json; Touch(actor, correlation); }
    public void SaveCommercial(string json, Guid? actor, string? correlation) { CommercialJson = json; Touch(actor, correlation); }
    public void Transition(string next, Guid? actor, string? correlation)
    {
        var normalized = next.ToUpperInvariant();
        if (Status == normalized) return; // Idempotent transition
        if (Status == "DRAFT" && normalized is not ("PUBLISHED" or "WITHDRAWN")) throw new DomainRuleException(ErrorCodes.ValidationFailed, $"Capability transition {Status} -> {next} is not allowed.");
        Status = normalized; Touch(actor, correlation);
    }
}

public sealed class SellerCapabilityStatusHistory : MarketplaceEntity
{
    private SellerCapabilityStatusHistory() { }
    public Guid CapabilityId { get; private set; }
    public string FromStatus { get; private set; } = "";
    public string ToStatus { get; private set; } = "";
    public string? Reason { get; private set; }
    public static SellerCapabilityStatusHistory Create(Guid id, string from, string to, string? reason) => new() { CapabilityId = id, FromStatus = from, ToStatus = to, Reason = reason };
}

public sealed class MatchRun : MarketplaceEntity { private MatchRun() { } public Guid RequirementId { get; private set; } public string AlgorithmVersion { get; private set; } = "v1"; public string Status { get; private set; } = "COMPLETED"; public DateTimeOffset CompletedAt { get; private set; } = DateTimeOffset.UtcNow; public static MatchRun Create(Guid requirementId) => new() { RequirementId = requirementId }; }
public sealed class MatchResult : MarketplaceEntity { private MatchResult() { } public Guid MatchRunId { get; private set; } public Guid RequirementId { get; private set; } public Guid CapabilityId { get; private set; } public decimal Score { get; private set; } public int Rank { get; private set; } public string Explanation { get; private set; } = ""; public static MatchResult Create(Guid runId, Guid requirementId, Guid capabilityId, decimal score, int rank, string explanation) => new() { MatchRunId = runId, RequirementId = requirementId, CapabilityId = capabilityId, Score = score, Rank = rank, Explanation = explanation }; }
public sealed class MatchResultComponent : MarketplaceEntity { private MatchResultComponent() { } public Guid MatchResultId { get; private set; } public string ComponentCode { get; private set; } = ""; public decimal Weight { get; private set; } public decimal RawScore { get; private set; } public decimal WeightedScore { get; private set; } public string Explanation { get; private set; } = ""; public static MatchResultComponent Create(Guid resultId, string code, decimal weight, decimal raw, string explanation) => new() { MatchResultId = resultId, ComponentCode = code, Weight = weight, RawScore = raw, WeightedScore = Math.Round(weight * raw / 100m, 2), Explanation = explanation }; }

public sealed class RequirementSellerEngagement : MarketplaceEntity { private RequirementSellerEngagement() { } public Guid RequirementId { get; private set; } public Guid CapabilityId { get; private set; } public string Stage { get; private set; } = "SHORTLISTED"; public static RequirementSellerEngagement Create(Guid requirementId, Guid capabilityId, string stage) => new() { RequirementId = requirementId, CapabilityId = capabilityId, Stage = stage.ToUpperInvariant() }; public void Move(string stage, Guid? actor, string? correlation) { Stage = stage.ToUpperInvariant(); Touch(actor, correlation); } }
public sealed class EngagementEvent : MarketplaceEntity { private EngagementEvent() { } public Guid EngagementId { get; private set; } public string EventType { get; private set; } = ""; public string PayloadJson { get; private set; } = "{}"; public static EngagementEvent Create(Guid engagementId, string type, string payload) => new() { EngagementId = engagementId, EventType = type, PayloadJson = payload }; }
public sealed class EngagementMessage : MarketplaceEntity { private EngagementMessage() { } public Guid EngagementId { get; private set; } public Guid SenderOrganizationId { get; private set; } public string Message { get; private set; } = ""; public DateTimeOffset SentAt { get; private set; } = DateTimeOffset.UtcNow; public static EngagementMessage Create(Guid engagementId, Guid sender, string message) => new() { EngagementId = engagementId, SenderOrganizationId = sender, Message = message.Trim() }; }

public sealed class MarketplaceMeeting : MarketplaceEntity { private MarketplaceMeeting() { } public string MeetingNo { get; private set; } = ""; public Guid EngagementId { get; private set; } public DateTimeOffset ScheduledStart { get; private set; } public DateTimeOffset ScheduledEnd { get; private set; } public string Mode { get; private set; } = "IN_PERSON"; public string VenueOrLink { get; private set; } = ""; public string Status { get; private set; } = "REQUESTED"; public string Notes { get; private set; } = ""; public static MarketplaceMeeting Create(string number, Guid engagementId, DateTimeOffset start, DateTimeOffset end, string mode, string venue) { if (end <= start) throw new DomainRuleException(ErrorCodes.ValidationFailed, "Meeting end time must be after start time."); return new MarketplaceMeeting { MeetingNo = number, EngagementId = engagementId, ScheduledStart = start, ScheduledEnd = end, Mode = mode.ToUpperInvariant(), VenueOrLink = venue.Trim() }; } public void Transition(string status, string? notes, Guid? actor, string? correlation) { Status = status.ToUpperInvariant(); Notes = notes ?? Notes; Touch(actor, correlation); } }
public sealed class MeetingSlotOption : MarketplaceEntity { private MeetingSlotOption() { } public Guid MeetingId { get; private set; } public DateTimeOffset Start { get; private set; } public DateTimeOffset End { get; private set; } public bool IsAccepted { get; private set; } public static MeetingSlotOption Create(Guid meetingId, DateTimeOffset start, DateTimeOffset end) => new() { MeetingId = meetingId, Start = start, End = end }; }
public sealed class MeetingOutcome : MarketplaceEntity { private MeetingOutcome() { } public Guid MeetingId { get; private set; } public string Outcome { get; private set; } = ""; public string Notes { get; private set; } = ""; public static MeetingOutcome Create(Guid meetingId, string outcome, string notes) => new() { MeetingId = meetingId, Outcome = outcome.ToUpperInvariant(), Notes = notes.Trim() }; }
public sealed class MeetingActionItem : MarketplaceEntity { private MeetingActionItem() { } public Guid MeetingId { get; private set; } public string Title { get; private set; } = ""; public Guid? OwnerUserId { get; private set; } public DateOnly? DueDate { get; private set; } public string Status { get; private set; } = "OPEN"; public static MeetingActionItem Create(Guid meetingId, string title, Guid? owner, DateOnly? due) => new() { MeetingId = meetingId, Title = title.Trim(), OwnerUserId = owner, DueDate = due }; }

public sealed class Rfq : MarketplaceEntity { private Rfq() { } public string RfqNo { get; private set; } = ""; public Guid RequirementId { get; private set; } public DateTimeOffset SubmissionDeadline { get; private set; } public string Status { get; private set; } = "DRAFT"; public string TermsJson { get; private set; } = "{}"; public static Rfq Create(string number, Guid requirementId, DateTimeOffset deadline, string terms) => new() { RfqNo = number, RequirementId = requirementId, SubmissionDeadline = deadline, TermsJson = terms }; }
public sealed class RfqInvitation : MarketplaceEntity { private RfqInvitation() { } public Guid RfqId { get; private set; } public Guid CapabilityId { get; private set; } public string Status { get; private set; } = "INVITED"; public static RfqInvitation Create(Guid rfqId, Guid capabilityId) => new() { RfqId = rfqId, CapabilityId = capabilityId }; }
public sealed class Quotation : MarketplaceEntity { private Quotation() { } public string QuotationNo { get; private set; } = ""; public Guid RfqId { get; private set; } public Guid SellerOrganizationId { get; private set; } public int Revision { get; private set; } = 1; public decimal GrandTotal { get; private set; } public string Currency { get; private set; } = "INR"; public string Status { get; private set; } = "SUBMITTED"; public static Quotation Create(string number, Guid rfqId, Guid sellerId, decimal total, string currency) => new() { QuotationNo = number, RfqId = rfqId, SellerOrganizationId = sellerId, GrandTotal = total, Currency = currency }; public void Revise(decimal newTotal, Guid? actor, string? correlation) { Revision++; GrandTotal = newTotal; Touch(actor, correlation); } }
public sealed class QuotationLine : MarketplaceEntity { private QuotationLine() { } public Guid QuotationId { get; private set; } public string Description { get; private set; } = ""; public decimal Quantity { get; private set; } public string UomCode { get; private set; } = "NOS"; public decimal UnitPrice { get; private set; } public decimal LineTotal { get; private set; } public static QuotationLine Create(Guid quotationId, string description, decimal quantity, string uom, decimal unitPrice) => new() { QuotationId = quotationId, Description = description.Trim(), Quantity = quantity, UomCode = uom.ToUpperInvariant(), UnitPrice = unitPrice, LineTotal = quantity * unitPrice }; }
public sealed class Award : MarketplaceEntity { private Award() { } public string AwardNo { get; private set; } = ""; public Guid RequirementId { get; private set; } public Guid QuotationId { get; private set; } public decimal AwardValue { get; private set; } public string Currency { get; private set; } = "INR"; public string Status { get; private set; } = "AWARDED"; public static Award Create(string number, Guid requirementId, Guid quotationId, decimal value, string currency) => new() { AwardNo = number, RequirementId = requirementId, QuotationId = quotationId, AwardValue = value, Currency = currency }; }
public sealed class AwardMilestone : MarketplaceEntity { private AwardMilestone() { } public Guid AwardId { get; private set; } public string Title { get; private set; } = ""; public DateOnly DueDate { get; private set; } public decimal Amount { get; private set; } public string Status { get; private set; } = "PENDING"; public static AwardMilestone Create(Guid awardId, string title, DateOnly dueDate, decimal amount) => new() { AwardId = awardId, Title = title.Trim(), DueDate = dueDate, Amount = amount }; }