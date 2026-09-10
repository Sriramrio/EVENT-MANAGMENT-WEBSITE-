using System.Text.RegularExpressions;

namespace MSME.StallBooking.Infrastructure.Email;

public sealed class TemplatePlaceholderInfo
{
    public string Tag { get; set; } = "";
    public string Label { get; set; } = "";
    public string Description { get; set; } = "";
    public string ExampleValue { get; set; } = "";
}

public sealed class TemplateDefinition
{
    public string TemplateCode { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string DefaultSubject { get; set; } = "";
    public string DefaultHtmlBody { get; set; } = "";
    public List<TemplatePlaceholderInfo> Placeholders { get; set; } = new();
}

public static class EmailTemplateCatalog
{
    public static string RenderTemplate(string template, IDictionary<string, string?> values)
    {
        if (string.IsNullOrEmpty(template)) return "";

        var result = template;
        foreach (var kvp in values)
        {
            var key = kvp.Key;
            var val = kvp.Value ?? "";

            // Replace {{key}}, {{Key}}, {key}, {Key}, case-insensitively
            var pattern = @"\{{1,2}\s*" + Regex.Escape(key) + @"\s*\}{1,2}";
            result = Regex.Replace(result, pattern, val, RegexOptions.IgnoreCase);
        }

        return result;
    }

    public static readonly Dictionary<string, TemplateDefinition> AllTemplates = new(StringComparer.OrdinalIgnoreCase)
    {
        ["EXHIBITOR_DIRECT_EMAIL"] = new TemplateDefinition
        {
            TemplateCode = "EXHIBITOR_DIRECT_EMAIL",
            Name = "Exhibitor Direct Message / Invitation",
            Description = "Sent by exhibitors directly to visitors or business partners with reply-to set to the exhibitor.",
            DefaultSubject = "Connect & Meet with {{companyName}} - MSME Sangamam Connect - Hosur 2026",
            DefaultHtmlBody = @"<div style=""font-family:'Segoe UI', Arial, sans-serif; font-size:15px; color:#1e293b; line-height:1.6; max-width:640px; margin:0 auto; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; background-color:#ffffff;"">
    <div style=""background: linear-gradient(135deg, #0B3B75 0%, #1e40af 100%); padding:22px 28px; text-align:left; color:#ffffff;"">
        <h2 style=""margin:0; font-size:19px; font-weight:700; color:#ffffff;"">MSME Sangamam Connect - Hosur 2026</h2>
        <p style=""margin:4px 0 0 0; font-size:13px; color:#e2e8f0;"">Hosur | Business & Industrial Expo</p>
    </div>
    <div style=""padding:28px;"">
        <p style=""margin-top:0; font-size:16px; font-weight:600; color:#0f172a;"">
            Dear {{visitorName}},
        </p>
        <div style=""font-size:15px; color:#334155; line-height:1.7; margin:18px 0; white-space:pre-wrap;"">{{customMessage}}</div>
        
        <div style=""margin:20px 0; padding:18px 20px; background-color:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; text-align:center;"">
            <p style=""margin:0 0 12px 0; font-size:13px; font-weight:700; color:#0B3B75; text-transform:uppercase; letter-spacing:0.5px;"">B2B Connect & Registration Portal</p>
            <table style=""margin:0 auto; border-collapse:separate; border-spacing:12px 0;"">
                <tr>
                    <td style=""background:#ffffff; border:1px solid #bfdbfe; border-radius:8px; padding:12px 16px; text-align:center;"">
                        <p style=""margin:0 0 8px 0; font-size:12px; font-weight:600; color:#334155;"">For Sourcing & Procurement</p>
                        <a href=""https://msmesangamam.lubtn.com/buyer/register"" target=""_blank"" style=""display:inline-block; background-color:#0B3B75; color:#ffffff; font-weight:600; font-size:13px; padding:8px 16px; text-decoration:none; border-radius:6px;"">
                            Register as Buyer &rarr;
                        </a>
                        <p style=""margin:6px 0 0 0; font-size:11px;""><a href=""https://msmesangamam.lubtn.com/buyer/register"" target=""_blank"" style=""color:#2563eb; text-decoration:underline; font-weight:500;"">https://msmesangamam.lubtn.com/buyer/register</a></p>
                    </td>
                    <td style=""background:#ffffff; border:1px solid #bfdbfe; border-radius:8px; padding:12px 16px; text-align:center;"">
                        <p style=""margin:0 0 8px 0; font-size:12px; font-weight:600; color:#334155;"">For Vendors & Manufacturers</p>
                        <a href=""https://msmesangamam.lubtn.com/seller/register"" target=""_blank"" style=""display:inline-block; background-color:#15803d; color:#ffffff; font-weight:600; font-size:13px; padding:8px 16px; text-decoration:none; border-radius:6px;"">
                            Register as Seller &rarr;
                        </a>
                        <p style=""margin:6px 0 0 0; font-size:11px;""><a href=""https://msmesangamam.lubtn.com/seller/register"" target=""_blank"" style=""color:#15803d; text-decoration:underline; font-weight:500;"">https://msmesangamam.lubtn.com/seller/register</a></p>
                    </td>
                </tr>
            </table>
            <div style=""margin-top:14px; padding-top:10px; border-top:1px solid #dbeafe; font-size:13px; color:#1e40af;"">
                🌐 <strong>Official Expo Website:</strong> <a href=""https://msmesangamam.lubtn.com"" target=""_blank"" style=""color:#2563eb; font-weight:600; text-decoration:underline;"">https://msmesangamam.lubtn.com</a>
            </div>
        </div>

        <div style=""margin:16px 0; padding:12px 16px; background-color:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; font-size:13px; color:#166534;"">
            <strong>📎 Stall card attached, please check.</strong>
        </div>

        <div style=""margin-top:24px; padding:18px 20px; background-color:#f8fafc; border-left:4px solid #0B3B75; border-radius:8px;"">
            <h4 style=""margin:0 0 10px 0; font-size:13px; font-weight:700; color:#0B3B75; text-transform:uppercase; letter-spacing:0.04em;"">
                Exhibitor Information
            </h4>
            <table style=""width:100%; border-collapse:collapse; font-size:14px;"">
                <tr>
                    <td style=""padding:4px 10px 4px 0; color:#64748b; width:130px; font-weight:500;"">Company Name:</td>
                    <td style=""padding:4px 0; color:#0f172a; font-weight:600;"">{{companyName}}</td>
                </tr>
                <tr>
                    <td style=""padding:4px 10px 4px 0; color:#64748b; font-weight:500;"">Contact Person:</td>
                    <td style=""padding:4px 0; color:#0f172a;"">{{exhibitorName}}</td>
                </tr>
                <tr>
                    <td style=""padding:4px 10px 4px 0; color:#64748b; font-weight:500;"">Stall Number:</td>
                    <td style=""padding:4px 0; color:#0B3B75; font-weight:700;"">{{stallNumber}}</td>
                </tr>
                <tr>
                    <td style=""padding:4px 10px 4px 0; color:#64748b; font-weight:500;"">Direct Email:</td>
                    <td style=""padding:4px 0; color:#2563eb;"">{{replyToEmail}}</td>
                </tr>
                <tr>
                    <td style=""padding:4px 10px 4px 0; color:#64748b; font-weight:500;"">Official Website:</td>
                    <td style=""padding:4px 0; color:#2563eb;""><a href=""https://msmesangamam.lubtn.com"" target=""_blank"" style=""color:#2563eb; text-decoration:underline;"">https://msmesangamam.lubtn.com</a></td>
                </tr>
            </table>
        </div>
        <p style=""margin:20px 0 0 0; font-size:12px; color:#64748b; line-height:1.5;"">
            To reply to this email, please click <b>Reply</b> and your response will be sent directly to <b>{{exhibitorName}}</b> ({{replyToEmail}}).
        </p>
    </div>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{visitorName}}", Label = "Visitor / Recipient Name", Description = "Name of the visitor or recipient", ExampleValue = "Ramesh Kumar" },
                new() { Tag = "{{companyName}}", Label = "Exhibitor Company Name", Description = "Company name of the exhibitor", ExampleValue = "Acme Engineering" },
                new() { Tag = "{{exhibitorName}}", Label = "Exhibitor Contact Person", Description = "Name of the exhibitor representative", ExampleValue = "Suresh" },
                new() { Tag = "{{stallNumber}}", Label = "Stall Number", Description = "Allocated stall number", ExampleValue = "A-102" },
                new() { Tag = "{{customMessage}}", Label = "Custom Message", Description = "Personalized message content typed by exhibitor", ExampleValue = "We invite you to visit our stall." },
                new() { Tag = "{{replyToEmail}}", Label = "Exhibitor Reply-To Email", Description = "Email address where replies will be delivered", ExampleValue = "exhibitor@acme.com" }
            }
        },
        ["BOOKING_SUBMITTED"] = new TemplateDefinition
        {
            TemplateCode = "BOOKING_SUBMITTED",
            Name = "Booking Submitted Confirmation",
            Description = "Sent immediately to the exhibitor when a public stall booking form is submitted.",
            DefaultSubject = "MSME Sangamam Stall Booking Submitted - Registration No. {{bookingRegistrationNumber}}",
            DefaultHtmlBody = @"<div style=""font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
    <p>Dear Exhibitor,</p>

    <p>
        Thank you for submitting your stall booking interest for
        <b>MSME Sangamam Connect - Tamil Nadu</b>.
    </p>

    <p>
        <b>Stall Booking Registration Number:</b><br/>
        {{bookingRegistrationNumber}}
    </p>

    <div style=""
        margin-top:24px;
        padding:16px;
        background-color:#f5f7fa;
        border-left:4px solid #0d6efd;
        border-radius:4px;"">

        <h3 style=""margin:0 0 10px 0; color:#0d6efd;"">
            Exhibitor Details
        </h3>

        <table style=""border-collapse:collapse; width:100%;"">
            <tr>
                <td style=""padding:5px 12px 5px 0; font-weight:bold;"">Company Name</td>
                <td style=""padding:5px 0;"">{{legalName}}</td>
            </tr>
            <tr>
                <td style=""padding:5px 12px 5px 0; font-weight:bold;"">Trade Name</td>
                <td style=""padding:5px 0;"">{{tradeName}}</td>
            </tr>
            <tr>
                <td style=""padding:5px 12px 5px 0; font-weight:bold;"">Udyam Number</td>
                <td style=""padding:5px 0;"">{{udyamNumber}}</td>
            </tr>
            <tr>
                <td style=""padding:5px 12px 5px 0; font-weight:bold;"">GSTIN</td>
                <td style=""padding:5px 0;"">{{gstin}}</td>
            </tr>
            <tr>
                <td style=""padding:5px 12px 5px 0; font-weight:bold;"">PAN</td>
                <td style=""padding:5px 0;"">{{pan}}</td>
            </tr>
            <tr>
                <td style=""padding:5px 12px 5px 0; font-weight:bold;"">Contact Person</td>
                <td style=""padding:5px 0;"">{{contactPersonName}}</td>
            </tr>
            <tr>
                <td style=""padding:5px 12px 5px 0; font-weight:bold;"">Mobile</td>
                <td style=""padding:5px 0;"">{{mobile}}</td>
            </tr>
            <tr>
                <td style=""padding:5px 12px 5px 0; font-weight:bold;"">Registered Address</td>
                <td style=""padding:5px 0;"">{{registeredAddress}}</td>
            </tr>
            <tr>
                <td style=""padding:5px 12px 5px 0; font-weight:bold;"">City / District</td>
                <td style=""padding:5px 0;"">{{city}} / {{district}}</td>
            </tr>
            <tr>
                <td style=""padding:5px 12px 5px 0; font-weight:bold;"">State / Country</td>
                <td style=""padding:5px 0;"">{{state}} - {{pincode}}, {{country}}</td>
            </tr>
            <tr>
                <td style=""padding:5px 12px 5px 0; font-weight:bold;"">Fascia Name</td>
                <td style=""padding:5px 0;"">{{fasciaName}}</td>
            </tr>
            <tr>
                <td style=""padding:5px 12px 5px 0; font-weight:bold;"">Requested Stall Size</td>
                <td style=""padding:5px 0;"">{{requestedSize}}</td>
            </tr>
            <tr>
                <td style=""padding:5px 12px 5px 0; font-weight:bold;"">Electrical Requirement</td>
                <td style=""padding:5px 0;"">{{electricalRequirement}}</td>
            </tr>
            <tr>
                <td style=""padding:5px 12px 5px 0; font-weight:bold;"">Special Requirement</td>
                <td style=""padding:5px 0;"">{{specialRequirement}}</td>
            </tr>
            <tr>
                <td style=""padding:5px 12px 5px 0; font-weight:bold;"">Declarant Name</td>
                <td style=""padding:5px 0;"">{{declarantName}}</td>
            </tr>
            <tr>
                <td style=""padding:5px 12px 5px 0; font-weight:bold;"">Declarant Designation</td>
                <td style=""padding:5px 0;"">{{declarantDesignation}}</td>
            </tr>
            <tr>
                <td style=""padding:5px 12px 5px 0; font-weight:bold;"">Declaration Date</td>
                <td style=""padding:5px 0;"">{{declarationDate}}</td>
            </tr>
        </table>
    </div>

    <p>
        Our organising team will review your submission and get back to you shortly.
    </p>

    <div style=""margin-top:24px; padding:16px; background-color:#f5f7fa; border-left:4px solid #0d6efd; border-radius:4px; font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
        <h3 style=""margin:0 0 10px 0; color:#0d6efd; font-size:15px; font-weight:bold;"">Digital Support Team</h3>
        <p style=""margin:0 0 12px 0;"">For assistance related to your booking submission or login, please contact our Digital Support Team.</p>
        <p style=""margin:0 0 12px 0;""><b>Sriram Hariharan</b> <a href=""tel:+919840727309"" style=""color:#0d6efd; text-decoration:none; font-weight:bold; margin-left:12px;"">+91 98407 27309</a></p>
        <p style=""margin:0;"">Please mention your Booking Registration Number <b>{{bookingRegistrationNumber}}</b> while contacting the Digital Support Team.</p>
    </div>

    <p style=""margin-top:20px;"">
        Regards,<br/>
        <b>MSME Sangamam Connect - Tamil Nadu Organising Team</b>
    </p>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{bookingRegistrationNumber}}", Label = "Registration Number", Description = "Unique booking registration reference number", ExampleValue = "MSME-20260827-0042" },
                new() { Tag = "{{legalName}}", Label = "Legal Company Name", Description = "Exhibitor's registered company legal name", ExampleValue = "Acme Engineering Pvt Ltd" },
                new() { Tag = "{{tradeName}}", Label = "Trade Name", Description = "Exhibitor brand / trade name", ExampleValue = "Acme Tools" },
                new() { Tag = "{{udyamNumber}}", Label = "Udyam Number", Description = "MSME Udyam registration number", ExampleValue = "UDYAM-TN-03-0012345" },
                new() { Tag = "{{gstin}}", Label = "GSTIN", Description = "Goods & Services Tax Identification Number", ExampleValue = "33AAAAA0000A1Z5" },
                new() { Tag = "{{pan}}", Label = "PAN", Description = "Permanent Account Number", ExampleValue = "AAAAA0000A" },
                new() { Tag = "{{contactPersonName}}", Label = "Contact Person", Description = "Name of primary contact person", ExampleValue = "Rajesh Kumar" },
                new() { Tag = "{{mobile}}", Label = "Mobile Number", Description = "Primary contact mobile number", ExampleValue = "+91 9876543210" },
                new() { Tag = "{{registeredAddress}}", Label = "Registered Address", Description = "Registered company address", ExampleValue = "Plot 12, Industrial Estate" },
                new() { Tag = "{{city}}", Label = "City", Description = "City name", ExampleValue = "Hosur" },
                new() { Tag = "{{district}}", Label = "District", Description = "District name", ExampleValue = "Krishnagiri" },
                new() { Tag = "{{state}}", Label = "State", Description = "State name", ExampleValue = "Tamil Nadu" },
                new() { Tag = "{{pincode}}", Label = "Pincode", Description = "Postal code", ExampleValue = "635126" },
                new() { Tag = "{{country}}", Label = "Country", Description = "Country name", ExampleValue = "India" },
                new() { Tag = "{{fasciaName}}", Label = "Fascia Name", Description = "Name to be printed on stall fascia board", ExampleValue = "ACME TOOLS & DIES" },
                new() { Tag = "{{requestedSize}}", Label = "Requested Stall Size", Description = "Requested stall size display name", ExampleValue = "3x3m (9 sq.m)" },
                new() { Tag = "{{electricalRequirement}}", Label = "Electrical Requirement", Description = "Custom electrical power requirement", ExampleValue = "3 Phase 5kW" },
                new() { Tag = "{{specialRequirement}}", Label = "Special Requirement", Description = "Special layout or utility requirements", ExampleValue = "N/A" },
                new() { Tag = "{{declarantName}}", Label = "Declarant Name", Description = "Name of person submitting declaration", ExampleValue = "Rajesh Kumar" },
                new() { Tag = "{{declarantDesignation}}", Label = "Declarant Designation", Description = "Designation of declarant", ExampleValue = "Managing Director" },
                new() { Tag = "{{declarationDate}}", Label = "Declaration Date", Description = "Date of declaration (DD-MM-YYYY)", ExampleValue = "27-08-2026" }
            }
        },

        ["BOOKING_RECEIVED_PAYMENT_REQUEST"] = new TemplateDefinition
        {
            TemplateCode = "BOOKING_RECEIVED_PAYMENT_REQUEST",
            Name = "Stall Blocked & Payment Request",
            Description = "Sent when a stall is temporarily blocked with bank payment instructions.",
            DefaultSubject = "Stall Blocked - {{companyName}} - Registration No. {{bookingRegistrationNumber}}",
            DefaultHtmlBody = @"<div style=""font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
    <p>Dear Exhibitor,</p>

    <p>
        We have received your interest for stall booking for
        <b>MSME Sangamam Connect - Tamil Nadu</b>.
    </p>

    <p>
        The stall requested for
        <strong>{{companyName}}</strong>
        has been temporarily blocked successfully.
    </p>

    <p>The following stall has been blocked temporarily:</p>

    <table style=""border-collapse:collapse;"">
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Contact Person</td>
            <td style=""padding:6px 12px;"">{{contactPersonName}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Company Name</td>
            <td style=""padding:6px 12px;"">{{companyName}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Stall Number</td>
            <td style=""padding:6px 12px;"">{{stallNumber}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Stall Size</td>
            <td style=""padding:6px 12px;"">{{requestedSize}}</td>
        </tr>
    </table>

    <p>
        Please complete the payment and share payment details within
        <b>3 days</b> from this email date.
        Once payment confirmation and verification are completed, your allotted stall
        number will be frozen/finalized.
    </p>

    <p>
        If payment is not received within 3 days, the blocked stall will be released
        and made available to others.
    </p>

    <h3 style=""margin-top:20px;"">Payment Details</h3>

    <table style=""border-collapse:collapse;"">
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Account Name</td>
            <td style=""padding:6px 12px;"">{{accountName}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Bank Name</td>
            <td style=""padding:6px 12px;"">{{bankName}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Account Number</td>
            <td style=""padding:6px 12px;"">{{accountNumber}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">IFSC Code</td>
            <td style=""padding:6px 12px;"">{{ifscCode}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Branch</td>
            <td style=""padding:6px 12px;"">{{branchName}}</td>
        </tr>
    </table>

    <div style=""margin-top:24px; padding:16px; background-color:#f5f7fa; border-left:4px solid #0d6efd; border-radius:4px; font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
        <h3 style=""margin:0 0 10px 0; color:#0d6efd; font-size:15px; font-weight:bold;"">Digital Support Team</h3>
        <p style=""margin:0 0 12px 0;"">For assistance related to your booking submission or login, please contact our Digital Support Team.</p>
        <p style=""margin:0 0 12px 0;""><b>Sriram Hariharan</b> <a href=""tel:+919840727309"" style=""color:#0d6efd; text-decoration:none; font-weight:bold; margin-left:12px;"">+91 98407 27309</a></p>
        <p style=""margin:0;"">Please mention your Booking Registration Number <b>{{bookingRegistrationNumber}}</b> while contacting the Digital Support Team.</p>
    </div>

    <p style=""margin-top:20px;"">
        Regards,<br/>
        <b>MSME Sangamam Connect - Tamil Nadu Organising Team</b>
    </p>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{bookingRegistrationNumber}}", Label = "Registration Number", Description = "Booking registration number", ExampleValue = "MSME-20260827-0042" },
                new() { Tag = "{{companyName}}", Label = "Company Name", Description = "Company trade or legal name", ExampleValue = "Acme Tools" },
                new() { Tag = "{{contactPersonName}}", Label = "Contact Person", Description = "Contact person name", ExampleValue = "Rajesh Kumar" },
                new() { Tag = "{{stallNumber}}", Label = "Stall Number", Description = "Temporarily blocked stall number", ExampleValue = "A-102" },
                new() { Tag = "{{requestedSize}}", Label = "Stall Size", Description = "Stall size display name", ExampleValue = "3x3m (9 sq.m)" },
                new() { Tag = "{{accountName}}", Label = "Account Name", Description = "Bank account name for payment transfer", ExampleValue = "LUB MSME SANGAMAM" },
                new() { Tag = "{{bankName}}", Label = "Bank Name", Description = "Bank name", ExampleValue = "State Bank of India" },
                new() { Tag = "{{accountNumber}}", Label = "Account Number", Description = "Bank account number", ExampleValue = "123456789012" },
                new() { Tag = "{{ifscCode}}", Label = "IFSC Code", Description = "Bank IFSC code", ExampleValue = "SBIN0001234" },
                new() { Tag = "{{branchName}}", Label = "Branch Name", Description = "Bank branch name", ExampleValue = "Hosur Main Branch" }
            }
        },

        ["BOOKING_EDIT_REQUEST"] = new TemplateDefinition
        {
            TemplateCode = "BOOKING_EDIT_REQUEST",
            Name = "Booking Edit / Details Update Request",
            Description = "Sent to exhibitors to request company bank details, logo, or application updates.",
            DefaultSubject = "MSME Sangamam - {{bookingRegistrationNumber}} - Update your Company Bank details & other details",
            DefaultHtmlBody = @"<div style=""font-family:Arial,sans-serif; font-size:14px; color:#222; line-height:1.6;"">
    <p>Dear Exhibitor,</p>
    <p>Could you please update the requested details within the next day or two?</p>
    <p><b>Booking Registration Number:</b><br/>{{bookingRegistrationNumber}}</p>

    <div style=""margin:22px 0; padding:18px; background-color:#1f2937; color:#ffffff; border-left:5px solid #f59e0b; border-radius:6px;"">
        <h3 style=""margin:0 0 10px 0; color:#fbbf24; font-size:18px;"">Important: Company Logo Required</h3>
        <p style=""margin:0 0 10px 0; color:#ffffff;"">Please upload your company logo while editing your stall booking application.</p>
        <p style=""margin:0; color:#ffffff;"">The company logo will be displayed on your stall details card.</p>
    </div>

    <div style=""margin:22px 0; padding:18px; background-color:#1f2937; color:#ffffff; border-left:5px solid #f59e0b; border-radius:6px;"">
        <h3 style=""margin:0 0 10px 0; color:#fbbf24; font-size:18px;"">Important: Bank Details Required</h3>
        <p style=""margin:0 0 10px 0; color:#ff4d4d; font-weight:bold;"">As per MSME Development Institute, your company's bank account details are mandatory for subsidy processing.</p>
        <p style=""margin:0; color:#ffffff;"">Please enter your Account Name, Bank Name, Account Number and IFSC Code while editing your stall booking application.</p>
    </div>

    <p>Click the link below to edit your application:</p>
    <p><a href=""{{editUrl}}"">{{editUrl}}</a></p>

    <div style=""margin-top:24px; padding:16px; background-color:#f5f7fa; border-left:4px solid #0d6efd; border-radius:4px; font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
        <h3 style=""margin:0 0 10px 0; color:#0d6efd; font-size:15px; font-weight:bold;"">Digital Support Team</h3>
        <p style=""margin:0 0 12px 0;"">For assistance related to your booking submission or login, please contact our Digital Support Team.</p>
        <p style=""margin:0 0 12px 0;""><b>Sriram Hariharan</b> <a href=""tel:+919840727309"" style=""color:#0d6efd; text-decoration:none; font-weight:bold; margin-left:12px;"">+91 98407 27309</a></p>
        <p style=""margin:0;"">Please mention your Booking Registration Number <b>{{bookingRegistrationNumber}}</b> while contacting the Digital Support Team.</p>
    </div>

    <p style=""margin-top:20px;"">
        Regards,<br/>
        <b>MSME Sangamam Connect - Tamil Nadu Organising Team</b>
    </p>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{bookingRegistrationNumber}}", Label = "Registration Number", Description = "Booking registration number", ExampleValue = "MSME-20260827-0042" },
                new() { Tag = "{{editUrl}}", Label = "Edit Application URL", Description = "Unique secure edit link for exhibitor", ExampleValue = "https://msmehsur.com/portal/edit/token-xyz" }
            }
        },

        ["BOOKING_APPROVED"] = new TemplateDefinition
        {
            TemplateCode = "BOOKING_APPROVED",
            Name = "Booking Approved",
            Description = "Sent when a booking submission is officially approved.",
            DefaultSubject = "MSME Sangamam Stall Booking Approved - Registration No. {{bookingRegistrationNumber}}",
            DefaultHtmlBody = @"<div style=""font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
    <p>Dear Exhibitor,</p>
    <p>We are pleased to inform you that your stall booking for <b>MSME Sangamam Connect - Tamil Nadu</b> has been approved.</p>
    <p><b>Stall Booking Registration Number:</b><br/>{{bookingRegistrationNumber}}</p>
    <p><b>Allocated Stall Number:</b><br/>{{stallNumber}}</p>

    <div style=""margin-top:24px; padding:16px; background-color:#f5f7fa; border-left:4px solid #0d6efd; border-radius:4px; font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
        <h3 style=""margin:0 0 10px 0; color:#0d6efd; font-size:15px; font-weight:bold;"">Digital Support Team</h3>
        <p style=""margin:0 0 12px 0;"">For assistance related to your booking submission or login, please contact our Digital Support Team.</p>
        <p style=""margin:0 0 12px 0;""><b>Sriram Hariharan</b> <a href=""tel:+919840727309"" style=""color:#0d6efd; text-decoration:none; font-weight:bold; margin-left:12px;"">+91 98407 27309</a></p>
        <p style=""margin:0;"">Please mention your Booking Registration Number <b>{{bookingRegistrationNumber}}</b> while contacting the Digital Support Team.</p>
    </div>

    <p style=""margin-top:20px;"">
        Regards,<br/>
        <b>MSME Sangamam Connect - Tamil Nadu Organising Team</b>
    </p>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{bookingRegistrationNumber}}", Label = "Registration Number", Description = "Booking registration number", ExampleValue = "MSME-20260827-0042" },
                new() { Tag = "{{stallNumber}}", Label = "Stall Number", Description = "Allocated stall number", ExampleValue = "B-205" }
            }
        },

        ["PAYMENT_VERIFIED_STALL_CONFIRMED"] = new TemplateDefinition
        {
            TemplateCode = "PAYMENT_VERIFIED_STALL_CONFIRMED",
            Name = "Payment Verified & Stall Confirmed",
            Description = "Sent when exhibitor payment is verified and stall allocation is confirmed with proforma invoice.",
            DefaultSubject = "MSME Sangamam Stall Allocation Confirmed - {{bookingRegistrationNumber}}",
            DefaultHtmlBody = @"<div style=""font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
    <p>Dear Exhibitor,</p>
    <p>Your payment has been verified against Booking Registration Number <b>{{bookingRegistrationNumber}}</b>.</p>
    <p>Your stall allocation is now confirmed:</p>
    <table style=""border-collapse:collapse;"">
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Stall Number</td>
            <td style=""padding:6px 12px;"">{{stallNumber}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Proforma Invoice Number</td>
            <td style=""padding:6px 12px;"">{{invoiceNumber}}</td>
        </tr>
    </table>

    <div style=""margin-top:24px; padding:16px; background-color:#f5f7fa; border-left:4px solid #0d6efd; border-radius:4px; font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
        <h3 style=""margin:0 0 10px 0; color:#0d6efd; font-size:15px; font-weight:bold;"">Digital Support Team</h3>
        <p style=""margin:0 0 12px 0;"">For assistance related to your booking submission or login, please contact our Digital Support Team.</p>
        <p style=""margin:0 0 12px 0;""><b>Sriram Hariharan</b> <a href=""tel:+919840727309"" style=""color:#0d6efd; text-decoration:none; font-weight:bold; margin-left:12px;"">+91 98407 27309</a></p>
        <p style=""margin:0;"">Please mention your Booking Registration Number <b>{{bookingRegistrationNumber}}</b> while contacting the Digital Support Team.</p>
    </div>

    <p style=""margin-top:20px;"">
        Regards,<br/>
        <b>MSME Sangamam Connect - Tamil Nadu Organising Team</b>
    </p>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{bookingRegistrationNumber}}", Label = "Registration Number", Description = "Booking registration number", ExampleValue = "MSME-20260827-0042" },
                new() { Tag = "{{stallNumber}}", Label = "Stall Number", Description = "Confirmed stall number", ExampleValue = "A-102" },
                new() { Tag = "{{invoiceNumber}}", Label = "Invoice Number", Description = "Proforma invoice number", ExampleValue = "PI-2026-0042" }
            }
        },

        ["PAYMENT_REMINDER"] = new TemplateDefinition
        {
            TemplateCode = "PAYMENT_REMINDER",
            Name = "Payment Reminder",
            Description = "Sent to remind exhibitors with pending payment balances before stall release.",
            DefaultSubject = "MSME Sangamam 2026 - Hosur - Important Update: Stall Confirmation & Payment Request - {{bookingRegistrationNumber}}",
            DefaultHtmlBody = @"<div style=""font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
    <p style=""margin:0 0 4px 0; font-weight:bold;"">MSME SANGAMAM 2026 &ndash; HOSUR</p>
    <p style=""margin:0 0 18px 0; font-weight:bold;"">Important Update &ndash; Stall Confirmation & Payment Request</p>
    <p>Dear Exhibitor,</p>
    <p>We are happy to share that <b>MSME Sangamam 2026 &ndash; Hosur has received the necessary approval relating to FaMe TN / MSME subsidy support for eligible participation</b>.</p>
    <table style=""border-collapse:collapse; margin:16px 0;"">
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Booking Number</td>
            <td style=""padding:6px 12px;"">{{bookingRegistrationNumber}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Allocated Stall Number</td>
            <td style=""padding:6px 12px;"">{{stallNumber}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Date of Stall Allocation</td>
            <td style=""padding:6px 12px;"">{{allocationDate}}</td>
        </tr>
    </table>

    <h3 style=""margin-top:20px;"">Payment Summary</h3>
    <table style=""border-collapse:collapse; margin:16px 0;"">
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Total Amount Payable</td>
            <td style=""padding:6px 12px;"">&#8377; {{expectedAmount}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Amount Paid</td>
            <td style=""padding:6px 12px;"">&#8377; {{paidAmount}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold; color:#b91c1c;"">Balance Due</td>
            <td style=""padding:6px 12px; font-weight:bold; color:#b91c1c;"">&#8377; {{balanceAmount}}</td>
        </tr>
    </table>

    <div style=""margin-top:24px; padding:16px; background-color:#f5f7fa; border-left:4px solid #0d6efd; border-radius:4px; font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
        <h3 style=""margin:0 0 10px 0; color:#0d6efd; font-size:15px; font-weight:bold;"">Digital Support Team</h3>
        <p style=""margin:0 0 12px 0;"">For assistance related to your booking submission or login, please contact our Digital Support Team.</p>
        <p style=""margin:0 0 12px 0;""><b>Sriram Hariharan</b> <a href=""tel:+919840727309"" style=""color:#0d6efd; text-decoration:none; font-weight:bold; margin-left:12px;"">+91 98407 27309</a></p>
        <p style=""margin:0;"">Please mention your Booking Registration Number <b>{{bookingRegistrationNumber}}</b> while contacting the Digital Support Team.</p>
    </div>

    <p style=""margin-top:20px;"">
        Warm Regards,<br/>
        <b>MSME Sangamam 2026 &ndash; Finance Team</b><br/>
        Hosur
    </p>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{bookingRegistrationNumber}}", Label = "Registration Number", Description = "Booking registration number", ExampleValue = "MSME-20260827-0042" },
                new() { Tag = "{{stallNumber}}", Label = "Stall Number", Description = "Allocated stall number", ExampleValue = "A-102" },
                new() { Tag = "{{allocationDate}}", Label = "Allocation Date", Description = "Date of stall allocation", ExampleValue = "20 Aug 2026" },
                new() { Tag = "{{expectedAmount}}", Label = "Total Payable Amount", Description = "Total stall amount payable in INR", ExampleValue = "59,000.00" },
                new() { Tag = "{{paidAmount}}", Label = "Amount Paid", Description = "Amount paid so far in INR", ExampleValue = "20,000.00" },
                new() { Tag = "{{balanceAmount}}", Label = "Balance Due", Description = "Pending balance amount in INR", ExampleValue = "39,000.00" }
            }
        },

        ["STALL_CARD_EMAIL"] = new TemplateDefinition
        {
            TemplateCode = "STALL_CARD_EMAIL",
            Name = "Stall Details Card Email",
            Description = "Sent with attached stall details card containing logo, fascia name, venue, and product description.",
            DefaultSubject = "MSME Sangamam Connect - Hosur 2026 - Stall Details Card - Registration No. {{bookingRegistrationNumber}}",
            DefaultHtmlBody = @"<div style=""font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
    <p>Dear Exhibitor,</p>
    <p>Greetings from <b>MSME Sangamam Connect - Hosur 2026</b>.</p>
    <p>Your stall details card has been generated successfully for the following booking. Please find the stall details card attached to this email.</p>

    <h3 style=""margin-top:20px;"">Stall Allocation Details</h3>
    <table style=""border-collapse:collapse;"">
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Booking Registration Number</td>
            <td style=""padding:6px 12px;"">{{bookingRegistrationNumber}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Company Name</td>
            <td style=""padding:6px 12px;"">{{companyName}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Contact Person</td>
            <td style=""padding:6px 12px;"">{{contactPerson}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Stall Number</td>
            <td style=""padding:6px 12px;"">{{stallNumber}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Fascia Name</td>
            <td style=""padding:6px 12px;"">{{fasciaName}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Venue</td>
            <td style=""padding:6px 12px;"">{{venue}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Event Date</td>
            <td style=""padding:6px 12px;"">{{eventDate}}</td>
        </tr>
    </table>

    <div style=""margin-top:24px; padding:16px; background-color:#f5f7fa; border-left:4px solid #0d6efd; border-radius:4px; font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
        <h3 style=""margin:0 0 10px 0; color:#0d6efd; font-size:15px; font-weight:bold;"">Digital Support Team</h3>
        <p style=""margin:0 0 12px 0;"">For assistance related to your booking submission or login, please contact our Digital Support Team.</p>
        <p style=""margin:0 0 12px 0;""><b>Sriram Hariharan</b> <a href=""tel:+919840727309"" style=""color:#0d6efd; text-decoration:none; font-weight:bold; margin-left:12px;"">+91 98407 27309</a></p>
        <p style=""margin:0;"">Please mention your Booking Registration Number <b>{{bookingRegistrationNumber}}</b> while contacting the Digital Support Team.</p>
    </div>

    <p style=""margin-top:20px;"">
        Regards,<br/>
        <b>MSME Sangamam Connect - Hosur 2026 Organising Team</b>
    </p>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{bookingRegistrationNumber}}", Label = "Registration Number", Description = "Booking registration number", ExampleValue = "MSME-20260827-0042" },
                new() { Tag = "{{companyName}}", Label = "Company Name", Description = "Exhibitor company name", ExampleValue = "Acme Tools" },
                new() { Tag = "{{contactPerson}}", Label = "Contact Person", Description = "Contact person name", ExampleValue = "Rajesh Kumar" },
                new() { Tag = "{{stallNumber}}", Label = "Stall Number", Description = "Allotted stall number", ExampleValue = "A-102" },
                new() { Tag = "{{fasciaName}}", Label = "Fascia Name", Description = "Fascia display name", ExampleValue = "ACME TOOLS" },
                new() { Tag = "{{venue}}", Label = "Venue", Description = "Event venue name", ExampleValue = "Adhiyamaan College Campus, Hosur" },
                new() { Tag = "{{eventDate}}", Label = "Event Date", Description = "Event dates", ExampleValue = "28-30 August 2026" }
            }
        },

        ["PAYMENT_VERIFIED_RECEIPT_SENT"] = new TemplateDefinition
        {
            TemplateCode = "PAYMENT_VERIFIED_RECEIPT_SENT",
            Name = "Full Payment Verified Receipt Email",
            Description = "Sent when full stall payment is verified and stall is frozen, with attached Payment Receipt PDF.",
            DefaultSubject = "Payment Verified & Stall Approved - {{companyName}} - {{bookingRegistrationNumber}}",
            DefaultHtmlBody = @"<div style=""font-family: Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
    <p>Dear Exhibitor,</p>

    <p>
        Your payment has been verified and your stall booking has been approved for
        <b>MSME Sangamam Connect - Tamil Nadu</b>.
    </p>

    <h3>Booking & Stall Details</h3>

    <table style=""border-collapse: collapse;"">
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Company Name</td>
            <td style=""padding:6px 12px;"">{{companyName}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Contact Person</td>
            <td style=""padding:6px 12px;"">{{contactPersonName}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Booking Registration No.</td>
            <td style=""padding:6px 12px;"">{{bookingRegistrationNumber}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Allocated Stall Number</td>
            <td style=""padding:6px 12px;"">{{stallNumber}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Payment Reference No.</td>
            <td style=""padding:6px 12px;"">{{paymentReferenceNumber}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Payment Date</td>
            <td style=""padding:6px 12px;"">{{paymentDate}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Amount Paid</td>
            <td style=""padding:6px 12px;"">₹{{amountPaid}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Payment Status</td>
            <td style=""padding:6px 12px;""><b>Verified</b></td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Stall Status</td>
            <td style=""padding:6px 12px;""><b>Frozen / Finalized</b></td>
        </tr>
    </table>

    <p>
        Please find the payment receipt PDF attached for your records.
    </p>

    <div style=""margin-top:24px; padding:16px; background-color:#f5f7fa; border-left:4px solid #0d6efd; border-radius:4px; font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
        <h3 style=""margin:0 0 10px 0; color:#0d6efd; font-size:15px; font-weight:bold;"">Digital Support Team</h3>
        <p style=""margin:0 0 12px 0;"">For assistance related to your booking submission or login, please contact our Digital Support Team.</p>
        <p style=""margin:0 0 12px 0;""><b>Sriram Hariharan</b> <a href=""tel:+919840727309"" style=""color:#0d6efd; text-decoration:none; font-weight:bold; margin-left:12px;"">+91 98407 27309</a></p>
        <p style=""margin:0;"">Please mention your Booking Registration Number <b>{{bookingRegistrationNumber}}</b> while contacting the Digital Support Team.</p>
    </div>

    <p style=""margin-top:20px;"">
        Regards,<br/>
        <b>MSME Sangamam Connect - Tamil Nadu Organising Team</b>
    </p>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{bookingRegistrationNumber}}", Label = "Registration Number", Description = "Booking registration number", ExampleValue = "MSME-20260827-0042" },
                new() { Tag = "{{companyName}}", Label = "Company Name", Description = "Company trade or legal name", ExampleValue = "Acme Tools" },
                new() { Tag = "{{contactPersonName}}", Label = "Contact Person", Description = "Contact person name", ExampleValue = "Rajesh Kumar" },
                new() { Tag = "{{stallNumber}}", Label = "Stall Number", Description = "Allocated stall number", ExampleValue = "A-102" },
                new() { Tag = "{{paymentReferenceNumber}}", Label = "Payment Reference", Description = "Bank transaction / UTR reference number", ExampleValue = "UTR987654321" },
                new() { Tag = "{{paymentDate}}", Label = "Payment Date", Description = "Date of payment (DD-MM-YYYY)", ExampleValue = "27-08-2026" },
                new() { Tag = "{{amountPaid}}", Label = "Amount Paid", Description = "Amount paid in INR", ExampleValue = "59,000.00" }
            }
        },

        ["PART_PAYMENT_VERIFIED_RECEIPT_SENT"] = new TemplateDefinition
        {
            TemplateCode = "PART_PAYMENT_VERIFIED_RECEIPT_SENT",
            Name = "Part Payment Verified Receipt Email",
            Description = "Sent when part payment is verified with balance due details and attached Payment Receipt PDF.",
            DefaultSubject = "Part Payment Received - {{companyName}} - {{bookingRegistrationNumber}}",
            DefaultHtmlBody = @"<div style=""font-family: Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
    <p>Dear Exhibitor,</p>

    <p>
        We have received and verified a part payment towards your stall booking for
        <b>MSME Sangamam Connect - Tamil Nadu</b>.
    </p>

    <h3>Booking & Payment Details</h3>

    <table style=""border-collapse: collapse;"">
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Company Name</td>
            <td style=""padding:6px 12px;"">{{companyName}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Contact Person</td>
            <td style=""padding:6px 12px;"">{{contactPersonName}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Booking Registration No.</td>
            <td style=""padding:6px 12px;"">{{bookingRegistrationNumber}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Stall Number</td>
            <td style=""padding:6px 12px;"">{{stallNumber}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Payment Reference No.</td>
            <td style=""padding:6px 12px;"">{{paymentReferenceNumber}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Payment Date</td>
            <td style=""padding:6px 12px;"">{{paymentDate}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Amount Paid Now</td>
            <td style=""padding:6px 12px;"">₹{{amountPaid}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Full Stall Amount</td>
            <td style=""padding:6px 12px;"">₹{{fullStallAmount}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Balance Due</td>
            <td style=""padding:6px 12px;""><b>₹{{balanceDue}}</b></td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Payment Status</td>
            <td style=""padding:6px 12px;""><b>Part Payment Verified</b></td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Stall Status</td>
            <td style=""padding:6px 12px;""><b>Blocked (pending full payment)</b></td>
        </tr>
    </table>

    <p>
        Your stall remains blocked for you. Please pay the remaining balance of
        <b>₹{{balanceDue}}</b> before the block expiry date to confirm your allocation.
        Please find the receipt for this part payment attached as PDF.
    </p>

    <div style=""margin-top:24px; padding:16px; background-color:#f5f7fa; border-left:4px solid #0d6efd; border-radius:4px; font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
        <h3 style=""margin:0 0 10px 0; color:#0d6efd; font-size:15px; font-weight:bold;"">Digital Support Team</h3>
        <p style=""margin:0 0 12px 0;"">For assistance related to your booking submission or login, please contact our Digital Support Team.</p>
        <p style=""margin:0 0 12px 0;""><b>Sriram Hariharan</b> <a href=""tel:+919840727309"" style=""color:#0d6efd; text-decoration:none; font-weight:bold; margin-left:12px;"">+91 98407 27309</a></p>
        <p style=""margin:0;"">Please mention your Booking Registration Number <b>{{bookingRegistrationNumber}}</b> while contacting the Digital Support Team.</p>
    </div>

    <p style=""margin-top:20px;"">
        Regards,<br/>
        <b>MSME Sangamam Connect - Tamil Nadu Organising Team</b>
    </p>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{bookingRegistrationNumber}}", Label = "Registration Number", Description = "Booking registration number", ExampleValue = "MSME-20260827-0042" },
                new() { Tag = "{{companyName}}", Label = "Company Name", Description = "Company trade or legal name", ExampleValue = "Acme Tools" },
                new() { Tag = "{{contactPersonName}}", Label = "Contact Person", Description = "Contact person name", ExampleValue = "Rajesh Kumar" },
                new() { Tag = "{{stallNumber}}", Label = "Stall Number", Description = "Allocated stall number", ExampleValue = "A-102" },
                new() { Tag = "{{paymentReferenceNumber}}", Label = "Payment Reference", Description = "Bank transaction / UTR reference number", ExampleValue = "UTR987654321" },
                new() { Tag = "{{paymentDate}}", Label = "Payment Date", Description = "Date of payment (DD-MM-YYYY)", ExampleValue = "27-08-2026" },
                new() { Tag = "{{amountPaid}}", Label = "Amount Paid Now", Description = "Amount paid in this transaction in INR", ExampleValue = "20,000.00" },
                new() { Tag = "{{fullStallAmount}}", Label = "Full Stall Amount", Description = "Total stall cost in INR", ExampleValue = "59,000.00" },
                new() { Tag = "{{balanceDue}}", Label = "Balance Due", Description = "Pending balance due in INR", ExampleValue = "39,000.00" }
            }
        },

        ["INVOICE_SENT"] = new TemplateDefinition
        {
            TemplateCode = "INVOICE_SENT",
            Name = "Tax Invoice Emailed",
            Description = "Sent when official Tax Invoice PDF is generated and emailed to the exhibitor.",
            DefaultSubject = "MSME Sangamam Tax Invoice - {{companyName}} - {{taxInvoiceNumber}}",
            DefaultHtmlBody = @"<div style=""font-family: Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
    <p>Dear Exhibitor,</p>

    <p>
        Please find attached your official <b>Tax Invoice</b> for
        <strong>MSME Sangamam Connect - Tamil Nadu</strong>.
    </p>

    <h3>Invoice Summary</h3>

    <table style=""border-collapse: collapse;"">
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Tax Invoice Number</td>
            <td style=""padding:6px 12px;"">{{taxInvoiceNumber}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Invoice Date</td>
            <td style=""padding:6px 12px;"">{{invoiceDate}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Company Name</td>
            <td style=""padding:6px 12px;"">{{companyName}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Contact Person</td>
            <td style=""padding:6px 12px;"">{{contactPerson}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Booking Registration No.</td>
            <td style=""padding:6px 12px;"">{{bookingRegistrationNumber}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Allocated Stall Number</td>
            <td style=""padding:6px 12px;"">{{stallNumber}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px; font-weight:bold;"">Total Invoice Amount</td>
            <td style=""padding:6px 12px;"">₹{{totalAmount}}</td>
        </tr>
    </table>

    <p>
        The tax invoice PDF is attached to this email. Please retain it for your accounting, audit, and tax records.
    </p>

    <div style=""margin-top:24px; padding:16px; background-color:#f5f7fa; border-left:4px solid #0d6efd; border-radius:4px; font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
        <h3 style=""margin:0 0 10px 0; color:#0d6efd; font-size:15px; font-weight:bold;"">Digital Support Team</h3>
        <p style=""margin:0 0 12px 0;"">For assistance related to your booking submission or login, please contact our Digital Support Team.</p>
        <p style=""margin:0 0 12px 0;""><b>Sriram Hariharan</b> <a href=""tel:+919840727309"" style=""color:#0d6efd; text-decoration:none; font-weight:bold; margin-left:12px;"">+91 98407 27309</a></p>
        <p style=""margin:0;"">Please mention your Booking Registration Number <b>{{bookingRegistrationNumber}}</b> while contacting the Digital Support Team.</p>
    </div>

    <p style=""margin-top:20px;"">
        Thank you for participating in <strong>MSME Sangamam Connect - Tamil Nadu</strong>.
    </p>

    <p style=""margin-top:20px;"">
        Regards,<br/>
        <strong>MSME Sangamam Connect - Tamil Nadu Organising Team</strong>
    </p>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{bookingRegistrationNumber}}", Label = "Registration Number", Description = "Booking registration number", ExampleValue = "MSME-20260827-0042" },
                new() { Tag = "{{taxInvoiceNumber}}", Label = "Tax Invoice Number", Description = "Official Tax Invoice reference number", ExampleValue = "INV-2026-0042" },
                new() { Tag = "{{invoiceDate}}", Label = "Invoice Date", Description = "Date of invoice generation", ExampleValue = "27-08-2026" },
                new() { Tag = "{{companyName}}", Label = "Company Name", Description = "Exhibitor company name", ExampleValue = "Acme Tools" },
                new() { Tag = "{{contactPerson}}", Label = "Contact Person", Description = "Contact person name", ExampleValue = "Rajesh Kumar" },
                new() { Tag = "{{stallNumber}}", Label = "Stall Number", Description = "Allocated stall number", ExampleValue = "A-102" },
                new() { Tag = "{{totalAmount}}", Label = "Total Amount", Description = "Total invoice amount in INR", ExampleValue = "59,000.00" }
            }
        },

        ["VISITOR_ENTRY_PASS"] = new TemplateDefinition
        {
            TemplateCode = "VISITOR_ENTRY_PASS",
            Name = "Visitor Entry Pass with QR Code",
            Description = "Sent to registered visitors with digital entry pass link and attached QR code pass.",
            DefaultSubject = "Visitor Entry Pass - {{registrationNumber}}",
            DefaultHtmlBody = @"<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;'>
    <h2 style='color: #0d6efd;'>Visitor Pass Confirmed</h2>
    <p>Dear <strong>{{recipientName}}</strong>,</p>
    <p>Thank you for registering for <b>MSME Sangamam Connect - Tamil Nadu</b>. Your details have been saved successfully.</p>
    <div style='background-color: #f8f9fa; padding: 12px 16px; border-radius: 6px; margin: 16px 0;'>
        <p style='margin: 4px 0;'><strong>Visitor Reg. No:</strong> <span style='color: #0d6efd; font-size: 16px;'>{{registrationNumber}}</span></p>
    </div>
    <p>You can view and download your digital pass by clicking the button below:</p>
    <div style='text-align: center; margin: 24px 0;'>
        <a href='{{verificationUrl}}' target='_blank' style='background-color: #0d6efd; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 14px; text-decoration: none; border-radius: 8px; display: inline-block;'>
            View &amp; Download Visitor Pass
        </a>
    </div>
    <div style='text-align: center; margin: 20px 0;'>
        <img src='cid:qr-code-inline' alt='Visitor QR Pass' style='width: 180px; height: 180px; border: 1px solid #e0e0e0; padding: 10px; border-radius: 12px; background-color: #ffffff; display: inline-block;' />
        <p style='font-size: 12px; color: #666666; margin-top: 6px;'>Show this QR code at the venue entry point for gate verification.</p>
    </div>
    <p>Please find attached your entry <strong>QR Code Pass</strong>. Show this pass at the venue entry point for verification.</p>

    <div style=""margin-top:24px; padding:16px; background-color:#f5f7fa; border-left:4px solid #0d6efd; border-radius:4px; font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
        <h3 style=""margin:0 0 10px 0; color:#0d6efd; font-size:15px; font-weight:bold;"">Digital Support Team</h3>
        <p style=""margin:0 0 12px 0;"">For assistance related to your booking submission or login, please contact our Digital Support Team.</p>
        <p style=""margin:0 0 12px 0;""><b>Sriram Hariharan</b> <a href=""tel:+919840727309"" style=""color:#0d6efd; text-decoration:none; font-weight:bold; margin-left:12px;"">+91 98407 27309</a></p>
        <p style=""margin:0;"">Please mention your Visitor Registration Number <b>{{registrationNumber}}</b> while contacting the Digital Support Team.</p>
    </div>

    <p style='margin-top:20px;'>
        Regards,<br/>
        <b>MSME Sangamam Connect - Tamil Nadu Organising Team</b>
    </p>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{recipientName}}", Label = "Recipient Name", Description = "Visitor contact person name", ExampleValue = "Karthik Subramanian" },
                new() { Tag = "{{registrationNumber}}", Label = "Registration Number", Description = "Visitor pass registration reference number", ExampleValue = "VIS-2026-0089" },
                new() { Tag = "{{verificationUrl}}", Label = "Pass Verification URL", Description = "Link to online digital QR pass and download", ExampleValue = "https://msmesangamam.lubtn.com/visitorverification/VIS-2026-0089" }
            }
        },

        ["VISITOR_NOTIFICATION"] = new TemplateDefinition
        {
            TemplateCode = "VISITOR_NOTIFICATION",
            Name = "Visitor Event Notification",
            Description = "Sent to broadcast updates, speaker announcements, and event schedule to visitors.",
            DefaultSubject = "{{subject}}",
            DefaultHtmlBody = @"<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;'>
    <h2 style='color: #0d6efd;'>{{subject}}</h2>
    <p>Dear <strong>{{recipientName}}</strong>,</p>
    <div style='margin: 16px 0; font-size: 14px; line-height: 1.6; color: #333;'>
        {{messageBody}}
    </div>

    <div style=""margin-top:24px; padding:16px; background-color:#f5f7fa; border-left:4px solid #0d6efd; border-radius:4px; font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
        <h3 style=""margin:0 0 10px 0; color:#0d6efd; font-size:15px; font-weight:bold;"">Digital Support Team</h3>
        <p style=""margin:0 0 12px 0;"">For assistance related to your booking submission or login, please contact our Digital Support Team.</p>
        <p style=""margin:0 0 12px 0;""><b>Sriram Hariharan</b> <a href=""tel:+919840727309"" style=""color:#0d6efd; text-decoration:none; font-weight:bold; margin-left:12px;"">+91 98407 27309</a></p>
        <p style=""margin:0;"">Please mention your registered email or name while contacting the Digital Support Team.</p>
    </div>

    <p style='margin-top:20px; font-size: 13px;'>
        Regards,<br/>
        <b>MSME Sangamam Connect - Tamil Nadu Organising Team</b>
    </p>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{recipientName}}", Label = "Recipient Name", Description = "Visitor contact name", ExampleValue = "Karthik Subramanian" },
                new() { Tag = "{{subject}}", Label = "Notification Subject", Description = "Notification headline or subject", ExampleValue = "Important Update: Event Schedule & Parking Info" },
                new() { Tag = "{{messageBody}}", Label = "Message Body", Description = "Custom notification content", ExampleValue = "We look forward to seeing you tomorrow at Adhiyamaan College Campus, Hosur." }
            }
        },

        ["VIP_ENTRY_PASS"] = new TemplateDefinition
        {
            TemplateCode = "VIP_ENTRY_PASS",
            Name = "VIP Entry Pass with QR Code",
            Description = "Sent to VIP guests with fast-track digital entry pass link and attached QR pass.",
            DefaultSubject = "VIP Entry Pass - {{registrationNumber}}",
            DefaultHtmlBody = @"<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;'>
    <h2 style='color: #0d6efd;'>VIP Registration Confirmed</h2>
    <p>Dear <strong>{{recipientName}}</strong>,</p>
    <p>Your VIP registration for <b>MSME Sangamam Connect - Tamil Nadu</b> has been successfully completed.</p>
    <div style='background-color: #f8f9fa; padding: 12px 16px; border-radius: 6px; margin: 16px 0;'>
        <p style='margin: 4px 0;'><strong>VIP Registration No:</strong> <span style='color: #0d6efd; font-size: 16px;'>{{registrationNumber}}</span></p>
    </div>
    <div style='text-align: center; margin: 28px 0;'>
        <a href='{{verificationUrl}}' target='_blank' style='background-color: #0d6efd; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 14px; text-decoration: none; border-radius: 8px; display: inline-block;'>
            View VIP Pass
        </a>
    </div>
    <p>Please find attached your <strong>VIP QR Code Pass</strong>. Show this QR code at the VIP entry point for fast-track verification.</p>

    <div style=""margin-top:24px; padding:16px; background-color:#f5f7fa; border-left:4px solid #0d6efd; border-radius:4px; font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
        <h3 style=""margin:0 0 10px 0; color:#0d6efd; font-size:15px; font-weight:bold;"">Digital Support Team</h3>
        <p style=""margin:0 0 12px 0;"">For assistance related to your booking submission or login, please contact our Digital Support Team.</p>
        <p style=""margin:0 0 12px 0;""><b>Sriram Hariharan</b> <a href=""tel:+919840727309"" style=""color:#0d6efd; text-decoration:none; font-weight:bold; margin-left:12px;"">+91 98407 27309</a></p>
        <p style=""margin:0;"">Please mention your VIP Registration Number <b>{{registrationNumber}}</b> while contacting the Digital Support Team.</p>
    </div>

    <p style='margin-top:20px;'>
        Regards,<br/>
        <b>MSME Sangamam Connect - Tamil Nadu Organising Team</b>
    </p>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{recipientName}}", Label = "Recipient Name", Description = "VIP guest name", ExampleValue = "Thiru M. Anbarasan" },
                new() { Tag = "{{registrationNumber}}", Label = "Registration Number", Description = "VIP registration reference number", ExampleValue = "VIP-2026-0005" },
                new() { Tag = "{{verificationUrl}}", Label = "Pass Verification URL", Description = "Link to online VIP pass", ExampleValue = "https://msmesangamam.lubtn.com/vipverification/VIP-2026-0005" }
            }
        },

        ["STALL_VISITOR_INTEREST"] = new TemplateDefinition
        {
            TemplateCode = "STALL_VISITOR_INTEREST",
            Name = "Stall QR Visitor Interest Alert",
            Description = "Sent to exhibitor when a visitor scans their stall QR code and registers interest.",
            DefaultSubject = "New Interest — {{visitorLabel}} is interested in your stall",
            DefaultHtmlBody = @"<div style=""font-family: Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
    <p>Dear {{recipientName}},</p>
    <p>A visitor has scanned your stall QR code at <b>MSME Sangamam Connect - Tamil Nadu</b> and expressed interest in your products / services.</p>

    <div style=""margin-top:16px; padding:16px; background-color:#f5f7fa; border-left:4px solid #0d6efd; border-radius:4px;"">
        <h3 style=""margin:0 0 10px 0; color:#0d6efd;"">Visitor Contact Details</h3>
        <table style=""border-collapse:collapse; width:100%;"">
            <tr>
                <td style=""padding:5px 12px 5px 0; font-weight:bold;"">Visitor Name</td>
                <td style=""padding:5px 0;"">{{visitorLabel}}</td>
            </tr>
            <tr>
                <td style=""padding:5px 12px 5px 0; font-weight:bold;"">Mobile Number</td>
                <td style=""padding:5px 0;"">{{visitorMobile}}</td>
            </tr>
            <tr>
                <td style=""padding:5px 12px 5px 0; font-weight:bold;"">Email Address</td>
                <td style=""padding:5px 0;"">{{visitorEmail}}</td>
            </tr>
            <tr>
                <td style=""padding:5px 12px 5px 0; font-weight:bold;"">Stall Fascia</td>
                <td style=""padding:5px 0;"">{{fasciaName}}</td>
            </tr>
        </table>
    </div>

    <p style=""margin-top:20px;"">We encourage you to connect with this potential lead at your earliest convenience.</p>

    <div style=""margin-top:24px; padding:16px; background-color:#f5f7fa; border-left:4px solid #0d6efd; border-radius:4px; font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
        <h3 style=""margin:0 0 10px 0; color:#0d6efd; font-size:15px; font-weight:bold;"">Digital Support Team</h3>
        <p style=""margin:0 0 12px 0;"">For assistance related to your booking submission or login, please contact our Digital Support Team.</p>
        <p style=""margin:0 0 12px 0;""><b>Sriram Hariharan</b> <a href=""tel:+919840727309"" style=""color:#0d6efd; text-decoration:none; font-weight:bold; margin-left:12px;"">+91 98407 27309</a></p>
        <p style=""margin:0;"">Please mention your registered email or company name while contacting the Digital Support Team.</p>
    </div>

    <p style=""margin-top:20px;"">
        Regards,<br/>
        <b>MSME Sangamam Connect - Tamil Nadu Organising Team</b>
    </p>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{recipientName}}", Label = "Recipient Name", Description = "Exhibitor contact person name", ExampleValue = "Rajesh Kumar" },
                new() { Tag = "{{visitorLabel}}", Label = "Visitor Name", Description = "Visitor name or label", ExampleValue = "Venkatesh Rao" },
                new() { Tag = "{{visitorMobile}}", Label = "Visitor Mobile", Description = "Visitor mobile phone number", ExampleValue = "+91 94441 23456" },
                new() { Tag = "{{visitorEmail}}", Label = "Visitor Email", Description = "Visitor email address", ExampleValue = "venkatesh@example.com" },
                new() { Tag = "{{fasciaName}}", Label = "Fascia Name", Description = "Stall fascia name", ExampleValue = "ACME TOOLS" }
            }
        },

        ["MARKETPLACE_SEND_CREDENTIALS"] = new TemplateDefinition
        {
            TemplateCode = "MARKETPLACE_SEND_CREDENTIALS",
            Name = "Send Credentials Email Template (Buyer & Seller)",
            Description = "Sent to Buyer or Seller organizations when Admin clicks 'Send Credentials' from the admin marketplace user management portal, containing portal URL, login email, and temporary password.",
            DefaultSubject = "MSME Sangamam Marketplace - Your Login Credentials",
            DefaultHtmlBody = @"<div style=""font-family:Arial,sans-serif;font-size:14px;color:#222;line-height:1.6;"">
    <p>Dear {{contactPerson}},</p>
    <p>Your sign-in credentials for <strong>{{orgName}}</strong> on the <strong>MSME Sangamam Buyer &ndash; Seller Marketplace</strong> are provided below.</p>
    <p>Please use these credentials to log in to your account:</p>
    <table style=""border-collapse:collapse;margin:16px 0;"">
        <tr>
            <td style=""padding:6px 12px;font-weight:bold;"">Portal Link</td>
            <td style=""padding:6px 12px;""><a href=""{{loginUrl}}"">{{loginUrl}}</a></td>
        </tr>
        <tr>
            <td style=""padding:6px 12px;font-weight:bold;"">Email (Username)</td>
            <td style=""padding:6px 12px;"">{{contactEmail}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px;font-weight:bold;"">Temporary Password</td>
            <td style=""padding:6px 12px;font-family:monospace;font-weight:bold;color:#0d6efd;"">{{tempPassword}}</td>
        </tr>
    </table>
    <p>Please sign in and change your password from your profile settings.</p>

    <div style=""margin-top:24px; padding:16px; background-color:#f5f7fa; border-left:4px solid #0d6efd; border-radius:4px; font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
        <h3 style=""margin:0 0 10px 0; color:#0d6efd; font-size:15px; font-weight:bold;"">Digital Support Team</h3>
        <p style=""margin:0 0 12px 0;"">For assistance related to your account or login, please contact our Digital Support Team.</p>
        <p style=""margin:0 0 12px 0;""><b>Sriram Hariharan</b> <a href=""tel:+919840727309"" style=""color:#0d6efd; text-decoration:none; font-weight:bold; margin-left:12px;"">+91 98407 27309</a></p>
        <p style=""margin:0;"">Please mention your registered email <b>{{contactEmail}}</b> while contacting the Digital Support Team.</p>
    </div>

    <p style=""margin-top:20px;"">Regards,<br/><b>MSME Sangamam Marketplace Team</b></p>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{contactPerson}}", Label = "Contact Person", Description = "Name of organization contact person", ExampleValue = "Suresh Patel" },
                new() { Tag = "{{orgName}}", Label = "Organization Name", Description = "Buyer or seller company legal name", ExampleValue = "Precision Forgings Ltd" },
                new() { Tag = "{{contactEmail}}", Label = "Contact Email", Description = "Login email address", ExampleValue = "suresh@example.com" },
                new() { Tag = "{{tempPassword}}", Label = "Temporary Password", Description = "Generated temporary password", ExampleValue = "Pass@1234" },
                new() { Tag = "{{loginUrl}}", Label = "Login URL", Description = "Marketplace portal login link", ExampleValue = "https://msmesangamam.lubtn.com/role-selection" }
            }
        },

        ["MARKETPLACE_USER_WELCOME"] = new TemplateDefinition
        {
            TemplateCode = "MARKETPLACE_USER_WELCOME",
            Name = "Send Credentials & Welcome Email (Buyer & Seller)",
            Description = "Sent to newly registered Buyer or Seller organizations with temporary login password.",
            DefaultSubject = "Welcome to MSME Sangamam Marketplace - Your Account Details",
            DefaultHtmlBody = @"<div style=""font-family:Arial,sans-serif;font-size:14px;color:#222;line-height:1.6;"">
    <p>Dear {{contactPerson}},</p>
    <p>Your organization <strong>{{orgName}}</strong> has been registered on the <strong>MSME Sangamam Buyer &ndash; Seller Marketplace</strong>.</p>
    <p>Here are your temporary sign-in credentials:</p>
    <table style=""border-collapse:collapse;margin:16px 0;"">
        <tr>
            <td style=""padding:6px 12px;font-weight:bold;"">Portal Link</td>
            <td style=""padding:6px 12px;""><a href=""{{loginUrl}}"">{{loginUrl}}</a></td>
        </tr>
        <tr>
            <td style=""padding:6px 12px;font-weight:bold;"">Email (Username)</td>
            <td style=""padding:6px 12px;"">{{contactEmail}}</td>
        </tr>
        <tr>
            <td style=""padding:6px 12px;font-weight:bold;"">Temporary Password</td>
            <td style=""padding:6px 12px;font-family:monospace;"">{{tempPassword}}</td>
        </tr>
    </table>
    <p>Please sign in and change your password from your profile settings.</p>

    <div style=""margin-top:24px; padding:16px; background-color:#f5f7fa; border-left:4px solid #0d6efd; border-radius:4px; font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
        <h3 style=""margin:0 0 10px 0; color:#0d6efd; font-size:15px; font-weight:bold;"">Digital Support Team</h3>
        <p style=""margin:0 0 12px 0;"">For assistance related to your booking submission or login, please contact our Digital Support Team.</p>
        <p style=""margin:0 0 12px 0;""><b>Sriram Hariharan</b> <a href=""tel:+919840727309"" style=""color:#0d6efd; text-decoration:none; font-weight:bold; margin-left:12px;"">+91 98407 27309</a></p>
        <p style=""margin:0;"">Please mention your registered email <b>{{contactEmail}}</b> while contacting the Digital Support Team.</p>
    </div>

    <p style=""margin-top:20px;"">Regards,<br/><b>MSME Sangamam Marketplace Team</b></p>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{contactPerson}}", Label = "Contact Person", Description = "Name of organization contact person", ExampleValue = "Suresh Patel" },
                new() { Tag = "{{orgName}}", Label = "Organization Name", Description = "Buyer or seller company legal name", ExampleValue = "Precision Forgings Ltd" },
                new() { Tag = "{{contactEmail}}", Label = "Contact Email", Description = "Login email address", ExampleValue = "suresh@example.com" },
                new() { Tag = "{{tempPassword}}", Label = "Temporary Password", Description = "Generated temporary password", ExampleValue = "Pass@1234" },
                new() { Tag = "{{loginUrl}}", Label = "Login URL", Description = "Marketplace portal login link", ExampleValue = "https://msmesangamam.lubtn.com/role-selection" }
            }
        },
        ["EXHIBITOR_STALL_INFORMATION"] = new TemplateDefinition
        {
            TemplateCode = "EXHIBITOR_STALL_INFORMATION",
            Name = "Exhibitor Stall Information",
            Description = "Information regarding exhibition stall design and layout.",
            DefaultSubject = "MSME Sangamam 2026 - Important Exhibitor Stall Information",
            DefaultHtmlBody = @"<meta charset=""UTF-8"">
<meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
<title>MSME Sangamam 2026 – Stall Information</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; padding:0; -webkit-text-size-adjust:100%; }
  table { border-collapse:collapse; }
  img { max-width:100%; height:auto; border:0; }
  .outer { width:100%; }
  .container { width:640px; max-width:640px; margin:0 auto; }

  @media only screen and (max-width:600px) {
    .container { width:100% !important; max-width:100% !important; }
    .content-pad { padding:16px !important; }
    /* stack image above text */
    .stack-table { width:100% !important; }
    .stack-cell { display:block !important; width:100% !important; padding:0 0 10px 0 !important; }
    .stack-img { width:100% !important; text-align:center; }
    .stack-img img { width:100% !important; max-width:280px !important; height:auto !important; margin:0 auto 10px auto !important; }
    /* stall details table -> one row per line */
    .detail-table { width:100% !important; }
    .detail-table td { display:block !important; width:100% !important; padding:8px 12px !important; }
    .detail-table td:first-child { padding-bottom:2px !important; border-bottom:none !important; }
    /* branding price table -> stack label/value */
    .price-table td { display:block !important; width:100% !important; border:none !important; }
    .price-table tr { display:block !important; border:1px solid #e0e0e0 !important; margin-bottom:8px !important; border-radius:4px !important; overflow:hidden; }
  }
</style>


<table role=""presentation"" class=""outer"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#eef1f4; padding:24px 0;"">
<tbody><tr>
<td align=""center"">
<table role=""presentation"" class=""container"" width=""640"" cellpadding=""0"" cellspacing=""0"" style=""width:640px; max-width:640px; background-color:#ffffff; font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6; border-radius:6px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.08);"">

<!-- Header banner -->
<tbody><tr>
<td style=""background-color:#0d6efd; padding:20px 30px;"">
<h2 style=""margin:0; color:#ffffff; font-size:20px;"">MSME Sangamam 2026 – Hosur</h2>
</td>
</tr>

<tr>
<td class=""content-pad"" style=""padding:24px 30px;"">

<p>Dear <strong>{{ContactPersonName}}</strong>,</p>
<p>Greetings from MSME Sangamam 2026 – Hosur.</p>
<p>As we prepare for MSME Sangamam 2026 on 18 &amp; 19 September 2026, we are sharing important information regarding your exhibition stall, including:</p>
<ul style=""margin:0 0 16px 0; padding-left:20px;"">
<li>Standard stall design and layout</li>
<li>Facilities included with each stall</li>
<li>Stall mock-up/design reference</li>
<li>Optional stall branding</li>
<li>Additional furniture, electrical and display requirements</li>
<li>Details to be submitted if you require anything additional</li>
</ul>
<p>Please review the information carefully and plan your stall display, branding and additional requirements.</p>

<h3 style=""color:#0d6efd; margin:24px 0 10px 0; border-bottom:2px solid #eef1f4; padding-bottom:6px;"">Your Stall Details</h3>
<table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" class=""detail-table"" style=""border-collapse:collapse; margin-bottom:20px; background-color:#f8f9fb; border-radius:4px;"">
<tbody><tr>
<td style=""padding:10px 14px; font-weight:bold; width:45%; vertical-align:top;"">Company Name:</td>
<td style=""padding:10px 14px; vertical-align:top;"">{{CompanyName}}</td>
</tr>
<tr>
<td style=""padding:10px 14px; font-weight:bold; vertical-align:top; background-color:#f1f3f6;"">Booking Registration Number:</td>
<td style=""padding:10px 14px; vertical-align:top; background-color:#f1f3f6;"">{{BookingRegistrationNumber}}</td>
</tr>
<tr>
<td style=""padding:10px 14px; font-weight:bold; vertical-align:top;"">Stall Number:</td>
<td style=""padding:10px 14px; vertical-align:top;"">{{StallNumber}}</td>
</tr>
<tr>
<td style=""padding:10px 14px; font-weight:bold; vertical-align:top; background-color:#f1f3f6;"">Stall Size:</td>
<td style=""padding:10px 14px; vertical-align:top; background-color:#f1f3f6;"">{{StallSize}}</td>
</tr>
</tbody></table>

<hr style=""border:none; border-top:1px solid #e0e0e0; margin:20px 0;"">

<h3 style=""color:#0d6efd; margin:0 0 10px 0;"">1. Standard Stall Design &amp; Layout</h3>
<p>The exhibition stalls will be provided using the Octonorm exhibition stall system, based on the approved stall design and mock-up.</p>
<p>Depending on your allotted stall size, the standard stall setup includes: Octonorm stall structure, Carpet, Standard company fascia, Electrical socket, Octonorm table, Plastic chairs, Spotlights, Dust bin.</p>

<hr style=""border:none; border-top:1px solid #e0e0e0; margin:20px 0;"">

<h3 style=""color:#0d6efd; margin:0 0 16px 0;"">2. Standard Stall Facilities &amp; Design</h3>

<!-- 3x3 Stall block: image on top, text below on mobile -->
<table role=""presentation"" class=""stack-table"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""margin-bottom:20px;"">
<tbody><tr>
<td class=""stack-cell stack-img"" width=""200"" style=""vertical-align:top; padding-right:16px; text-align:center;"">
<img src=""https://msmesangamam.lubtn.com/assets/3x3-stall.jpeg"" alt=""3m x 3m Stall design reference"" style=""display:block; border-radius:4px; width:200px; height:160px; margin:0 auto;"">
</td>
<td class=""stack-cell"" style=""vertical-align:top;"">
<p style=""margin:0 0 6px 0;""><strong>A. 3m × 3m Stall</strong></p>
<p style=""margin:0;"">3m × 3m Octonorm Stall, 3m × 3m Carpet, 5 Amp Power Socket – 1 No., Octonorm Table – 1 No., Plastic Chairs – 2 Nos., Spotlights – 3 Nos., Dust Bin.</p>
</td>
</tr>
</tbody></table>

<!-- 3x2 Stall block -->
<table role=""presentation"" class=""stack-table"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""margin-bottom:20px;"">
<tbody><tr>
<td class=""stack-cell stack-img"" width=""200"" style=""vertical-align:top; padding-right:16px; text-align:center;"">
<img src=""https://msmesangamam.lubtn.com/assets/3x2-stall.jpeg"" alt=""3m x 2m Stall design reference"" style=""display:block; border-radius:4px; width:200px; height:160px; margin:0 auto;"">
</td>
<td class=""stack-cell"" style=""vertical-align:top;"">
<p style=""margin:0 0 6px 0;""><strong>B. 3m × 2m Stall</strong></p>
<p style=""margin:0;"">3m × 2m Octonorm Stall, 3m × 2m Carpet, 5 Amp Power Socket – 1 No., Octonorm Table – 1 No., Plastic Chairs – 2 Nos., Spotlights – 3 Nos., Dust Bin.</p>
</td>
</tr>
</tbody></table>

<!-- 2x2 Stall block -->
<table role=""presentation"" class=""stack-table"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""margin-bottom:20px;"">
<tbody><tr>
<td class=""stack-cell stack-img"" width=""200"" style=""vertical-align:top; padding-right:16px; text-align:center;"">
<img src=""https://msmesangamam.lubtn.com/assets/2x2-stall.jpeg"" alt=""2m x 2m Stall design reference"" style=""display:block; border-radius:4px; width:200px; height:160px; margin:0 auto;"">
</td>
<td class=""stack-cell"" style=""vertical-align:top;"">
<p style=""margin:0 0 6px 0;""><strong>C. 2m × 2m Stall</strong></p>
<p style=""margin:0;"">2m × 2m Octonorm Stall, 2m × 2m Carpet, 5 Amp Power Socket – 1 No., Octonorm Table – 1 No., Plastic Chairs – 2 Nos., Spotlights – 3 Nos., Dust Bin.</p>
</td>
</tr>
</tbody></table>

<hr style=""border:none; border-top:1px solid #e0e0e0; margin:20px 0;"">

<h3 style=""color:#0d6efd; margin:0 0 10px 0;"">3. Stall Branding – Optional &amp; Chargeable</h3>
<p>Exhibitors who wish to enhance the visual presentation of their stall may opt for the additional vinyl branding package.</p>
<table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" class=""price-table"" style=""border-collapse:collapse; margin:12px 0 16px 0;"">
<tbody><tr>
<td style=""padding:8px 14px; border:1px solid #e0e0e0; font-weight:bold;"">3m × 3m Stall</td>
<td style=""padding:8px 14px; border:1px solid #e0e0e0;"">₹15,360/- + 18% GST</td>
</tr>
<tr>
<td style=""padding:8px 14px; border:1px solid #e0e0e0; font-weight:bold; background-color:#f8f9fb;"">3m × 2m Stall</td>
<td style=""padding:8px 14px; border:1px solid #e0e0e0; background-color:#f8f9fb;"">₹12,280/- + 18% GST</td>
</tr>
<tr>
<td style=""padding:8px 14px; border:1px solid #e0e0e0; font-weight:bold;"">2m × 2m Stall</td>
<td style=""padding:8px 14px; border:1px solid #e0e0e0;"">₹10,740/- + 18% GST</td>
</tr>
</tbody></table>

<p><strong>Important:</strong> Customised vinyl branding is not included in the standard stall setup and will be charged separately if opted for. If you require customised branding, please inform the Organising Team in advance.</p>

<p>Please review your requirements and communicate any additional furniture, electrical, display or branding requirements as early as possible.</p>

<!-- Support box -->
<table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""margin-top:24px; background-color:#f5f7fa; border-left:4px solid #0d6efd; border-radius:4px;"">
<tbody><tr>
<td style=""padding:16px;"">
<h3 style=""margin:0 0 10px 0; color:#0d6efd; font-size:15px; font-weight:bold;"">Digital Support Team</h3>
<p style=""margin:0 0 12px 0;"">For assistance related to your booking submission or login, please contact our Digital Support Team.</p>
<p style=""margin:0 0 12px 0;"">
<strong>Sriram Hariharan</strong>
<a href=""tel:+919840727309"" style=""color:#0d6efd; text-decoration:none; font-weight:bold; margin-left:12px;"">+91 9840727309</a>
</p>
<p style=""margin:0 0 12px 0;"">
<strong>Sathish Exhibitor - Coordination </strong>
<a href=""tel:+919677930330"" style=""color:#0d6efd; text-decoration:none; font-weight:bold; margin-left:12px;"">+91 9677930330</a>
</p>
<p style=""margin:0;"">Please mention your Booking Registration Number <strong>{{BookingRegistrationNumber}}</strong> while contacting the Digital Support Team.</p>
</td>
</tr>
</tbody></table>

<p style=""margin-top:24px;"">Warm regards,<br><strong>MSME Sangamam 2026 – Organising Team</strong></p>
<p style=""margin:0; color:#555;"">
Laghu Udyog Bharati – Tamil Nadu<br>
Event: MSME Sangamam 2026<br>
Dates: 18 &amp; 19 September 2026<br>
Venue: Hosur<br>
Website: <a href=""https://msmesangamam.lubtn.com"" style=""color:#0d6efd;"">msmesangamam.lubtn.com</a>
</p>

</td>
</tr>
</tbody></table>
</td>
</tr>
</tbody></table>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{ContactPersonName}}", Label = "Contact Person", Description = "Name of contact person", ExampleValue = "Rajesh" },
                new() { Tag = "{{CompanyName}}", Label = "Company Name", Description = "Company Name", ExampleValue = "Acme Corp" },
                new() { Tag = "{{BookingRegistrationNumber}}", Label = "Registration Number", Description = "Registration Number", ExampleValue = "MSME-1234" },
                new() { Tag = "{{StallNumber}}", Label = "Stall Number", Description = "Stall Number", ExampleValue = "A10" },
                new() { Tag = "{{StallSize}}", Label = "Stall Size", Description = "Stall Size", ExampleValue = "3x3" }
            }
        },
        ["HOTEL_ACCOMMODATION_OPTIONS"] = new TemplateDefinition
        {
            TemplateCode = "HOTEL_ACCOMMODATION_OPTIONS",
            Name = "Hotel & Accommodation Options",
            Description = "Sent to exhibitors to provide hotel and accommodation options.",
            DefaultSubject = "MSME Sangamam 2026 - Hotel & Accommodation Options in Hosur",
            DefaultHtmlBody = @"<div style=""font-family:Arial, sans-serif; font-size:14px; color:#222; line-height:1.6;"">
    <p>Dear {{ContactPersonName}} ({{CompanyName}}),</p>
    <p>Greetings from MSME Sangamam 2026 – Hosur.</p>
    <p>As we get closer to MSME Sangamam 2026, scheduled for 18 & 19 September 2026 at Hosur, we are sharing a list of hotels and accommodation options for the convenience of exhibitors and their team members travelling to Hosur.</p>
    <p>We request exhibitors who require accommodation to plan and book their rooms at the earliest, particularly if multiple rooms are required for your exhibition team.</p>
    
    <div style=""margin-top:24px; padding:16px; background-color:#f5f7fa; border-left:4px solid #0d6efd; border-radius:4px;"">
        <h3 style=""margin:0 0 10px 0; color:#0d6efd;"">Event Details</h3>
        <p style=""margin:0;""><strong>Event:</strong> MSME Sangamam 2026</p>
        <p style=""margin:0;""><strong>Dates:</strong> 18 & 19 September 2026</p>
        <p style=""margin:0;""><strong>Venue:</strong> Hosur</p>
        <p style=""margin:0;""><strong>Website:</strong> <a href=""https://msmesangamam.lubtn.com"">msmesangamam.lubtn.com</a></p>
    </div>
    
    <h3 style=""color:#0d6efd; margin-top:20px;"">Hotel & Accommodation Options</h3>
    <p><strong>1. ANANDHAS INN ELITE, HOSUR</strong><br/>Location: Opp. to Bus Stand, Hosur – 635109<br/>Contact: 96550 05666 / 93676 78282 / 04344-244999<br/>Rates: Single ₹2,300, Double ₹2,800 (Breakfast Not Included, Tax Extra)</p>
    
    <p><strong>2. PEPPER MINT HOTEL, HOSUR</strong><br/>Address: 3/19, Seetharam Nagar, Hosur – 635109<br/>Contact Person: Mr. Suresh | Mobile: 75021 63717<br/>Rates: Economic Single ₹2,500, Double ₹3,000 (Breakfast Included, Tax Extra)</p>
    
    <p><strong>3. TGI GRAND FORTUNA, HOSUR</strong><br/>Address: No. 3/24, Seetharam Nagar, Hosur – 635109<br/>Contact: 70944 65202 / 04344-667600<br/>Rates: Single ₹4,500, Double ₹5,000 (Breakfast Included, Tax Extra)</p>
    
    <p><strong>4. BHAVANI'S VISTA, HOSUR</strong><br/>Address: No. 22B, Ring Road, Hosur – 635109<br/>Contact: Mrs. N. Kalpana | Mobile: 89259 14562<br/>Rates: Single ₹3,600, Double ₹4,000 (Without Breakfast, Tax Extra)</p>
    
    <p><strong>5. HOTEL ANAND GRAND PALACE, HOSUR</strong><br/>Address: No. 242/1, Thally Road, Hosur – 635109<br/>Rates: Deluxe Single ₹3,300, Deluxe Double ₹3,850 (Breakfast Included, Tax Extra)</p>

    <p><strong>6. LA CLASSIC HOTEL, ATTIBELE – BENGALURU</strong><br/>Address: Yadhavanahalli, Hosur Main Road, Attibele, Bengaluru – 562107<br/>Contact Person: Vivek Nair C. | Contact: 96862 03938 / 080-28021717<br/>Rates: Superior Single ₹4,750, Superior Double ₹5,750 (Breakfast Included, Tax Extra)</p>

    <p><strong>7. HOTEL HILLS, HOSUR</strong><br/>Location: Expo Venue, SIPCOT Industrial Area, Hosur – 635126<br/>Rates: Superior Room ₹5,700 (Breakfast Included, Tax Extra)</p>
    
    <p><strong>8. HOTEL RAAI, HOSUR</strong><br/>Address: 485, Nanjappa Kuttai, Bangalore Road, Hosur, Tamil Nadu – 635109<br/>Contact: 94870 16677<br/>Rates: Single ₹3,200, Double ₹4,000 (Breakfast Included, Tax Extra)</p>
    
    <p><strong>9. HOTEL SAKURA INN, HOSUR</strong><br/>Address: No. 16, Rayakottai Road, Hosur, Tamil Nadu – 635109<br/>Contact: 97917 98886<br/>Rates: Double ₹2,464, Triple ₹3,696 (Breakfast Included, Tax Extra)</p>
    
    <h3 style=""color:#0d6efd;"">Important – Please Book Early</h3>
    <p>As the exhibition dates approach, room availability may change based on bookings received by the respective hotels. We therefore recommend that exhibitors requiring accommodation contact the preferred hotel directly and complete their reservation at the earliest.</p>
    
    <div style=""margin-top:24px; padding:16px; background-color:#f5f7fa; border-left:4px solid #0d6efd; border-radius:4px;"">
        <h3 style=""margin:0 0 10px 0; color:#0d6efd; font-size:15px; font-weight:bold;"">Digital Support & Coordination</h3>
        <p style=""margin:0 0 12px 0;""><b>Sriram Hariharan</b> <a href=""tel:+919840727309"" style=""color:#0d6efd; text-decoration:none; font-weight:bold; margin-left:12px;"">+91 98407 27309</a></p>
        <p style=""margin:0 0 12px 0;""><b>Sathish</b> <span style=""color:#666; font-size:13px; margin-left:8px;"">(Exhibitor - Coordination)</span> <a href=""tel:+919677930330"" style=""color:#0d6efd; text-decoration:none; font-weight:bold; margin-left:12px;"">+91 96779 30330</a></p>
        <p style=""margin:0;"">Please mention your registered email while contacting the Support Team.</p>
    </div>
    
    <p style=""margin-top:20px;"">Warm regards,<br/><strong>MSME Sangamam 2026 – Organising Team</strong></p>
    <p>Laghu Udyog Bharati – Tamil Nadu</p>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{ContactPersonName}}", Label = "Contact Person", Description = "Name of contact person", ExampleValue = "Rajesh" },
                new() { Tag = "{{CompanyName}}", Label = "Company Name", Description = "Company Name", ExampleValue = "Acme Corp" }
            }
        },


        ["MSME_SUBSIDY_INFO"] = new TemplateDefinition
        {
            TemplateCode = "MSME_SUBSIDY_INFO",
            Name = "MSME Subsidy Information",
            Description = "Sent to inform eligible exhibitors about MSME subsidy approval / eligibility for stall participation.",
            DefaultSubject = "MSME Sangamam 2026 Hosur MSME Subsidy Approval Update - {{bookingRegistrationNumber}}",
            DefaultHtmlBody = @"<div style=""font-family:Arial, sans-serif; font-size:14px; color: #222; line-height: 1.6;"">
<p style=""margin:0 0 8px 0; font-weight: bold;"">MSME SANGAMAM 2026 &ndash; HOSUR</p>
<p style=""margin:0 0 18px 0; font-weight:bold;"">MSME Subsidy &ndash; Approval Update</p>
<p>Dear Exhibitor,</p>
<p>We are happy to inform you that your participation for booking <b>{{bookingRegistrationNumber}}</b> has been reviewed under the <b>MSME Subsidy Scheme</b>.</p>
<table style=""border-collapse:collapse; margin:16px 0;"">
<tr>
<td style=""padding:6px 12px; font-weight:bold;"">Company Name</td>
<td style=""padding:6px 12px;"">{{companyName}}</td>
</tr>
<tr>
<td style=""padding:6px 12px; font-weight: bold;"">Subsidy Eligibility Status</td>
<td style=""padding:6px 12px;"">{{subsidyStatus}}</td>
</tr>
<tr>
<td style=""padding:6px 12px; font-weight: bold;"">Subsidy Amount (if applicable)</td>
<td style=""padding:6px 12px;"">&#8377; {{subsidyAmount}}</td>
</tr>
</table>
<p>Kindly keep your Udyam Registration Certificate ready for verification at the venue.</p>
<p style=""margin-top: 20px;"">
Warm Regards, <br/>
<b>MSME Sangamam 2026 &ndash; Finance Team</b><br/>
Hosur
</p>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
    {
        new() { Tag = "{{bookingRegistrationNumber}}", Label = "Registration Number", Description = "Booking registration number", ExampleValue = "MSME-20260827-0042" },
        new() { Tag = "{{companyName}}", Label = "Company Name", Description = "Exhibitor company name", ExampleValue = "Acme Tools" },
        new() { Tag = "{{subsidyStatus}}", Label = "Subsidy Status", Description = "MSME subsidy eligibility status", ExampleValue = "Approved" },
        new() { Tag = "{{subsidyAmount}}", Label = "Subsidy Amount", Description = "Approved subsidy amount in INR", ExampleValue = "10,600.00" }
    }
        },

        // Template #2: FaMe TN Subsidy Info
        ["FAME_TN_SUBSIDY_INFO"] = new TemplateDefinition
        {
            TemplateCode = "FAME_TN_SUBSIDY_INFO",
            Name = "FaMe TN Subsidy Information",
            Description = "Sent to inform eligible exhibitors about FaMe TN subsidy approval eligibility for stall participation.",
            DefaultSubject = "MSME Sangamam 2026 Hosur FaMe TN Subsidy Approval Update - {{bookingRegistrationNumber}}",
            DefaultHtmlBody = @"<div style=""font-family:Arial, sans-serif; font-size:14px; color: #222; line-height: 1.6;"">
<p style=""margin:0 0 8px 0; font-weight: bold;"">MSME SANGAMAM 2026 &ndash; HOSUR</p>
<p style=""margin:0 0 18px 0; font-weight:bold;"">FaMe TN Subsidy &ndash; Approval Update</p>
<p>Dear Exhibitor,</p>
<p>We are happy to inform you that your participation for booking <b>{{bookingRegistrationNumber}}</b> has been reviewed under the <b>FaMe TN Subsidy Scheme</b>.</p>
<table style=""border-collapse:collapse; margin:16px 0;"">
<tr>
<td style=""padding:6px 12px; font-weight: bold;"">Company Name</td>
<td style=""padding:6px 12px;"">{{companyName}}</td>
</tr>
<tr>
<td style=""padding:6px 12px; font-weight: bold;"">Subsidy Eligibility Status</td>
<td style=""padding:6px 12px;"">{{subsidyStatus}}</td>
</tr>
<tr>
<td style=""padding:6px 12px; font-weight:bold;"">Subsidy Amount (if applicable)</td>
<td style=""padding:6px 12px;"">&#8377; {{subsidyAmount}}</td>
</tr>
</table>
<p>Kindly keep your relevant FaMe TN registration documents ready for verification at the venue.</p>
<p style=""margin-top:20px;"">
Warm Regards, <br/>
<b>MSME Sangamam 2026 &ndash; Finance Team</b><br/>
Hosur
</p>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
    {
        new() { Tag = "{{bookingRegistrationNumber}}", Label = "Registration Number", Description = "Booking registration number", ExampleValue = "MSME-20260827-0042" },
        new() { Tag = "{{companyName}}", Label = "Company Name", Description = "Exhibitor company name", ExampleValue = "Acme Tools" },
        new() { Tag = "{{subsidyStatus}}", Label = "Subsidy Status", Description = "FaMe TN subsidy eligibility status", ExampleValue = "Approved" },
        new() { Tag = "{{subsidyAmount}}", Label = "Subsidy Amount", Description = "Approved subsidy amount in INR", ExampleValue = "10,000.00" }
    }
        },

        // Template #3: Exhibitor Action Required
        ["EXHIBITOR_ACTION_REQUIRED"] = new TemplateDefinition
        {
            TemplateCode = "EXHIBITOR_ACTION_REQUIRED",
            Name = "Exhibitor Action Required",
            Description = "Sent when an exhibitor needs to complete a pending action (documents, payment, form, etc.).",
            DefaultSubject = "MSME Sangamam 2026 Hosur Action Required - {{bookingRegistrationNumber}}",
            DefaultHtmlBody = @"<div style=""font-family:Arial, sans-serif; font-size:14px; color:#222; line-height: 1.6;"">
<p style=""margin:0 0 8px 0; font-weight: bold;"">MSME SANGAMAM 2026 &ndash; HOSUR</p>
<p style=""margin:0 0 18px 0; font-weight: bold; color:#b91c1c;"">Action Required From Your End</p>
<p>Dear Exhibitor,</p>
<p>Your booking <b>{{bookingRegistrationNumber}}</b> requires the following action to be completed:</p>
<div style=""margin: 16px 0; padding: 14px 16px; background-color: #fff7ed; border-left:4px solid #ea580c; border-radius: 4px;"">
<b>{{actionRequired}}</b>
</div>
<p>Please complete this at the earliest to avoid delay in your stall confirmation.</p>
<div style=""margin-top: 24px; padding:16px; background-color: #f5f7fa; border-left: 4px solid #0d6efd; border-radius: 4px;"">
<h3 style=""margin:0 0 6px 0; color:#0d6efd; font-size:15px; font-weight: bold;"">Digital Support Team</h3>
<p style=""margin:0;"">Please mention your Booking Registration Number <b>{{bookingRegistrationNumber}}</b> while contacting us.</p>
</div>
<p style=""margin-top: 20px;"">
Warm Regards, <br/>
<b>MSME Sangamam 2026 &ndash; Coordination Team</b><br/>
Hosur
</p>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
    {
        new() { Tag = "{{bookingRegistrationNumber}}", Label = "Registration Number", Description = "Booking registration number", ExampleValue = "MSME-20260827-0042" },
        new() { Tag = "{{actionRequired}}", Label = "Action Required", Description = "Description of the pending action", ExampleValue = "Please upload your Udyam Registration Certificate." }
    }
        },

        // Template #4: Exhibitor Additional Requirements Submitted (Exhibitor Copy)
        ["EXHIBITOR_ADDITIONAL_REQUIREMENTS_SUBMITTED"] = new TemplateDefinition
        {
            TemplateCode = "EXHIBITOR_ADDITIONAL_REQUIREMENTS_SUBMITTED",
            Name = "Additional Requirements Submitted (Exhibitor)",
            Description = "Sent to the exhibitor when they submit a request for additional stall requirements (power, furniture, accessories).",
            DefaultSubject = "MSME Sangamam 2026 - Additional Requirements Request Received ({{bookingRegistrationNumber}})",
            DefaultHtmlBody = @"<div style=""font-family: Arial, sans-serif; font-size: 14px; color: #1e293b; line-height: 1.6; max-width: 600px; margin: 0 auto;"">
    <div style=""background: #0B3B75; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; color: #ffffff;"">
        <h2 style=""margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;"">MSME SANGAMAM 2026 &ndash; HOSUR</h2>
        <p style=""margin: 6px 0 0 0; font-size: 13px; color: #93c5fd;"">Additional Requirements Request Confirmation</p>
    </div>

    <div style=""padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;"">
        <p style=""margin-top: 0;"">Dear <b>{{contactPersonName}}</b>,</p>
        <p>Thank you for submitting your additional requirements request for <b>{{companyName}}</b> at <b>MSME Sangamam 2026 &ndash; Hosur</b>.</p>

        <div style=""margin: 16px 0; padding: 14px 16px; background-color: #f8fafc; border-left: 4px solid #0B3B75; border-radius: 4px;"">
            <table style=""width: 100%; border-collapse: collapse; font-size: 13px;"">
                <tr>
                    <td style=""padding: 4px 0; font-weight: bold; color: #475569; width: 45%;"">Booking Reg Number:</td>
                    <td style=""padding: 4px 0; font-weight: bold; color: #0B3B75;"">{{bookingRegistrationNumber}}</td>
                </tr>
                <tr>
                    <td style=""padding: 4px 0; font-weight: bold; color: #475569;"">Allocated Stall:</td>
                    <td style=""padding: 4px 0;"">{{stallNumber}}</td>
                </tr>
                <tr>
                    <td style=""padding: 4px 0; font-weight: bold; color: #475569;"">Request Status:</td>
                    <td style=""padding: 4px 0;""><span style=""background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 9999px; font-weight: bold; font-size: 11px;"">{{requestStatus}}</span></td>
                </tr>
                <tr>
                    <td style=""padding: 4px 0; font-weight: bold; color: #475569;"">Special / Custom Requirements &amp; Extra Notes:</td>
                    <td style=""padding: 4px 0; color: #0B3B75; font-weight: bold;"">{{notes}}</td>
                </tr>
            </table>
        </div>

        <h4 style=""margin: 20px 0 10px 0; color: #0B3B75; font-size: 14px;"">Requested Utilities / Furniture</h4>
        {{itemsTableHtml}}

        <div style=""margin-top: 16px; padding: 12px 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;"">
            <table style=""width: 100%; border-collapse: collapse; font-size: 13px;"">
                <tr>
                    <td style=""padding: 3px 0; color: #166534;"">Base Subtotal:</td>
                    <td style=""padding: 3px 0; text-align: right; font-weight: bold; color: #166534;"">&#8377; {{totalBaseAmount}}</td>
                </tr>
                <tr>
                    <td style=""padding: 3px 0; color: #166534;"">GST (18%):</td>
                    <td style=""padding: 3px 0; text-align: right; font-weight: bold; color: #166534;"">&#8377; {{totalGstAmount}}</td>
                </tr>
                <tr style=""border-top: 1px solid #86efac;"">
                    <td style=""padding: 6px 0 0 0; font-weight: bold; font-size: 14px; color: #14532d;"">Grand Total:</td>
                    <td style=""padding: 6px 0 0 0; text-align: right; font-weight: bold; font-size: 15px; color: #14532d;"">&#8377; {{grandTotal}}</td>
                </tr>
            </table>
        </div>

        <div style=""margin-top: 20px; padding: 14px; background: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px;"">
            <p style=""margin: 0; font-size: 12px; color: #9a3412;"">
                <b>What happens next?</b> Our exhibition operations coordinator will contact you at <b>{{mobile}}</b> to verify power load specifications and installation logistics before confirming your request.
            </p>
        </div>

        <p style=""margin-top: 24px; font-size: 13px;"">
            Warm Regards,<br/>
            <b>MSME Sangamam 2026 &ndash; Exhibition Operations Team</b><br/>
            Hosur
        </p>
    </div>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{bookingRegistrationNumber}}", Label = "Registration Number", Description = "Booking registration number", ExampleValue = "MSME-20260827-0042" },
                new() { Tag = "{{companyName}}", Label = "Company Name", Description = "Exhibitor company name", ExampleValue = "Acme Tools Private Limited" },
                new() { Tag = "{{contactPersonName}}", Label = "Contact Person", Description = "Exhibitor contact person name", ExampleValue = "R. Rajesh" },
                new() { Tag = "{{stallNumber}}", Label = "Stall Number", Description = "Allocated stall number or pending allocation", ExampleValue = "A-102" },
                new() { Tag = "{{requestId}}", Label = "Request ID", Description = "Unique ID of the requirements request", ExampleValue = "18dd0c70-2c4a-471d-ad61-e87e046cc97b" },
                new() { Tag = "{{requestStatus}}", Label = "Request Status", Description = "Status of the requirement (Pending / Confirmed / Rejected)", ExampleValue = "Pending" },
                new() { Tag = "{{notes}}", Label = "Special / Extra Requirements", Description = "Custom requirements or notes entered by the exhibitor", ExampleValue = "Need 2 extra 16A power sockets on left wall." },
                new() { Tag = "{{itemsTableHtml}}", Label = "Items Table HTML", Description = "Formatted HTML table of all requested requirement items with quantities and totals", ExampleValue = @"<table style=""width:100%; border-collapse:collapse; font-size:13px; margin: 10px 0; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;""><thead><tr style=""background:#f1f5f9; color:#334155; text-align:left;""><th style=""padding:8px 10px; border-bottom:1px solid #cbd5e1;"">Item</th><th style=""padding:8px 10px; border-bottom:1px solid #cbd5e1; text-align:center;"">Qty</th><th style=""padding:8px 10px; border-bottom:1px solid #cbd5e1; text-align:right;"">Base Price</th><th style=""padding:8px 10px; border-bottom:1px solid #cbd5e1; text-align:right;"">GST</th><th style=""padding:8px 10px; border-bottom:1px solid #cbd5e1; text-align:right;"">Total</th></tr></thead><tbody><tr style=""border-bottom:1px solid #f1f5f9; background:#ffffff;""><td style=""padding:8px 10px; font-weight:bold; color:#1e293b;"">PWR-3P-5KW &ndash; 3 Phase 5kW Power Connection</td><td style=""padding:8px 10px; text-align:center; font-weight:bold;"">1</td><td style=""padding:8px 10px; text-align:right;"">&#8377; 25,000.00</td><td style=""padding:8px 10px; text-align:right;"">&#8377; 4,500.00 (18%)</td><td style=""padding:8px 10px; text-align:right; font-weight:bold; color:#0f172a;"">&#8377; 29,500.00</td></tr></tbody><tfoot><tr style=""border-top:1px solid #cbd5e1; background:#f8fafc;""><td colspan=""4"" style=""padding:8px 10px; text-align:right; font-weight:bold; color:#475569;"">Base Subtotal:</td><td style=""padding:8px 10px; text-align:right; font-weight:bold; color:#334155;"">&#8377; 25,000.00</td></tr><tr style=""background:#f8fafc;""><td colspan=""4"" style=""padding:8px 10px; text-align:right; font-weight:bold; color:#475569;"">GST (18%):</td><td style=""padding:8px 10px; text-align:right; font-weight:bold; color:#334155;"">&#8377; 4,500.00</td></tr><tr style=""background:#f1f5f9; border-top:2px solid #cbd5e1;""><td colspan=""4"" style=""padding:9px 10px; text-align:right; font-weight:bold; font-size:14px; color:#1e1b4b;"">Grand Total (Total Amount):</td><td style=""padding:9px 10px; text-align:right; font-weight:bold; font-size:14px; color:#059669;"">&#8377; 29,500.00</td></tr></tfoot></table>" },
                new() { Tag = "{{totalBaseAmount}}", Label = "Base Subtotal", Description = "Sum of base amounts in INR", ExampleValue = "25,000.00" },
                new() { Tag = "{{totalGstAmount}}", Label = "GST Amount", Description = "Sum of GST amounts in INR", ExampleValue = "4,500.00" },
                new() { Tag = "{{grandTotal}}", Label = "Grand Total", Description = "Grand total including taxes in INR", ExampleValue = "29,500.00" },
                new() { Tag = "{{mobile}}", Label = "Mobile", Description = "Exhibitor mobile number", ExampleValue = "9876543210" },
                new() { Tag = "{{email}}", Label = "Email", Description = "Exhibitor email address", ExampleValue = "contact@acmetools.com" }
            }
        },

        // Template #5: Additional Requirements Admin Alert (Sent to Superadmin & Operations)
        ["ADMIN_ADDITIONAL_REQUIREMENTS_ALERT"] = new TemplateDefinition
        {
            TemplateCode = "ADMIN_ADDITIONAL_REQUIREMENTS_ALERT",
            Name = "Additional Requirements Admin Alert",
            Description = "Sent to Superadmin and Exhibitor Requirements Admin when an exhibitor places a new requirements request.",
            DefaultSubject = "[ALERT] New Additional Requirements Request - {{companyName}} ({{bookingRegistrationNumber}})",
            DefaultHtmlBody = @"<div style=""font-family: Arial, sans-serif; font-size: 14px; color: #1e293b; line-height: 1.6; max-width: 600px; margin: 0 auto;"">
    <div style=""background: #1e1b4b; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; color: #ffffff;"">
        <h2 style=""margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;"">MSME SANGAMAM 2026 &ndash; ADMIN ALERT</h2>
        <p style=""margin: 6px 0 0 0; font-size: 13px; color: #a5b4fc;"">New Additional Requirements Submitted</p>
    </div>

    <div style=""padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;"">
        <div style=""margin-bottom: 20px; padding: 12px 16px; background-color: #e0e7ff; border-left: 4px solid #4f46e5; border-radius: 4px;"">
            <p style=""margin: 0; font-size: 13px; font-weight: bold; color: #3730a3;"">
                A new additional stall utilities / furniture request has been submitted by an exhibitor.
            </p>
        </div>

        <h4 style=""margin: 0 0 10px 0; color: #1e1b4b; font-size: 14px;"">Exhibitor Information</h4>
        <table style=""width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 18px; background: #f8fafc; border-radius: 6px;"">
            <tr>
                <td style=""padding: 6px 12px; font-weight: bold; color: #475569; width: 40%;"">Company Name:</td>
                <td style=""padding: 6px 12px; font-weight: bold; color: #1e293b;"">{{companyName}}</td>
            </tr>
            <tr>
                <td style=""padding: 6px 12px; font-weight: bold; color: #475569;"">Contact Person:</td>
                <td style=""padding: 6px 12px;"">{{contactPersonName}}</td>
            </tr>
            <tr>
                <td style=""padding: 6px 12px; font-weight: bold; color: #475569;"">Mobile / Phone:</td>
                <td style=""padding: 6px 12px;""><a href=""tel:{{mobile}}"" style=""color: #2563eb; text-decoration: none; font-weight: bold;"">{{mobile}}</a></td>
            </tr>
            <tr>
                <td style=""padding: 6px 12px; font-weight: bold; color: #475569;"">Email:</td>
                <td style=""padding: 6px 12px;""><a href=""mailto:{{email}}"" style=""color: #2563eb; text-decoration: none;"">{{email}}</a></td>
            </tr>
            <tr>
                <td style=""padding: 6px 12px; font-weight: bold; color: #475569;"">Booking Reg #:</td>
                <td style=""padding: 6px 12px; font-weight: bold; color: #4f46e5;"">{{bookingRegistrationNumber}}</td>
            </tr>
            <tr>
                <td style=""padding: 6px 12px; font-weight: bold; color: #475569;"">Stall Number:</td>
                <td style=""padding: 6px 12px;"">{{stallNumber}}</td>
            </tr>
            <tr>
                <td style=""padding: 6px 12px; font-weight: bold; color: #475569;"">Total Value:</td>
                <td style=""padding: 6px 12px; font-weight: bold; color: #059669; font-size: 14px;"">&#8377; {{grandTotal}}</td>
            </tr>
            <tr>
                <td style=""padding: 6px 12px; font-weight: bold; color: #475569;"">Special / Custom Requirements &amp; Extra Notes:</td>
                <td style=""padding: 6px 12px; color: #0B3B75; font-weight: bold;"">{{notes}}</td>
            </tr>
        </table>

        <h4 style=""margin: 18px 0 10px 0; color: #1e1b4b; font-size: 14px;"">Requested Requirement Items</h4>
        {{itemsTableHtml}}

        <div style=""margin-top: 24px; text-align: center;"">
            <p style=""font-size: 13px; color: #64748b; margin-bottom: 12px;"">
                Log in to the Admin Portal &rarr; Exhibitor Requirements to review, verify via phone call, and confirm this request.
            </p>
        </div>

        <p style=""margin-top: 24px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;"">
            Automated Alert System &bull; MSME Sangamam 2026 Admin Portal
        </p>
    </div>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{bookingRegistrationNumber}}", Label = "Registration Number", Description = "Booking registration number", ExampleValue = "MSME-20260827-0042" },
                new() { Tag = "{{companyName}}", Label = "Company Name", Description = "Exhibitor company name", ExampleValue = "Acme Tools Private Limited" },
                new() { Tag = "{{contactPersonName}}", Label = "Contact Person", Description = "Exhibitor contact person name", ExampleValue = "R. Rajesh" },
                new() { Tag = "{{mobile}}", Label = "Mobile", Description = "Exhibitor mobile number", ExampleValue = "9876543210" },
                new() { Tag = "{{email}}", Label = "Email", Description = "Exhibitor email address", ExampleValue = "contact@acmetools.com" },
                new() { Tag = "{{stallNumber}}", Label = "Stall Number", Description = "Allocated stall number", ExampleValue = "A-102" },
                new() { Tag = "{{requestId}}", Label = "Request ID", Description = "Requirement request ID", ExampleValue = "18dd0c70-2c4a-471d-ad61-e87e046cc97b" },
                new() { Tag = "{{requestStatus}}", Label = "Request Status", Description = "Status of requirement", ExampleValue = "Pending" },
                new() { Tag = "{{notes}}", Label = "Special / Extra Requirements", Description = "Custom requirements or notes entered by the exhibitor", ExampleValue = "Need 2 extra 16A power sockets on left wall." },
                new() { Tag = "{{itemsTableHtml}}", Label = "Items Table HTML", Description = "Formatted HTML table of requested items", ExampleValue = @"<table style=""width:100%; border-collapse:collapse; font-size:13px; margin: 10px 0; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;""><thead><tr style=""background:#f1f5f9; color:#334155; text-align:left;""><th style=""padding:8px 10px; border-bottom:1px solid #cbd5e1;"">Item</th><th style=""padding:8px 10px; border-bottom:1px solid #cbd5e1; text-align:center;"">Qty</th><th style=""padding:8px 10px; border-bottom:1px solid #cbd5e1; text-align:right;"">Base Price</th><th style=""padding:8px 10px; border-bottom:1px solid #cbd5e1; text-align:right;"">GST</th><th style=""padding:8px 10px; border-bottom:1px solid #cbd5e1; text-align:right;"">Total</th></tr></thead><tbody><tr style=""border-bottom:1px solid #f1f5f9; background:#ffffff;""><td style=""padding:8px 10px; font-weight:bold; color:#1e293b;"">PWR-3P-5KW &ndash; 3 Phase 5kW Power Connection</td><td style=""padding:8px 10px; text-align:center; font-weight:bold;"">1</td><td style=""padding:8px 10px; text-align:right;"">&#8377; 25,000.00</td><td style=""padding:8px 10px; text-align:right;"">&#8377; 4,500.00 (18%)</td><td style=""padding:8px 10px; text-align:right; font-weight:bold; color:#0f172a;"">&#8377; 29,500.00</td></tr></tbody><tfoot><tr style=""border-top:1px solid #cbd5e1; background:#f8fafc;""><td colspan=""4"" style=""padding:8px 10px; text-align:right; font-weight:bold; color:#475569;"">Base Subtotal:</td><td style=""padding:8px 10px; text-align:right; font-weight:bold; color:#334155;"">&#8377; 25,000.00</td></tr><tr style=""background:#f8fafc;""><td colspan=""4"" style=""padding:8px 10px; text-align:right; font-weight:bold; color:#475569;"">GST (18%):</td><td style=""padding:8px 10px; text-align:right; font-weight:bold; color:#334155;"">&#8377; 4,500.00</td></tr><tr style=""background:#f1f5f9; border-top:2px solid #cbd5e1;""><td colspan=""4"" style=""padding:9px 10px; text-align:right; font-weight:bold; font-size:14px; color:#1e1b4b;"">Grand Total (Total Amount):</td><td style=""padding:9px 10px; text-align:right; font-weight:bold; font-size:14px; color:#059669;"">&#8377; 29,500.00</td></tr></tfoot></table>" },
                new() { Tag = "{{totalBaseAmount}}", Label = "Base Subtotal", Description = "Sum of base amounts in INR", ExampleValue = "25,000.00" },
                new() { Tag = "{{totalGstAmount}}", Label = "GST Amount", Description = "Sum of GST amounts in INR", ExampleValue = "4,500.00" },
                new() { Tag = "{{grandTotal}}", Label = "Grand Total", Description = "Grand total including taxes in INR", ExampleValue = "29,500.00" }
            }
        },

        // Template #6: Additional Requirements Status Update (Exhibitor Notification)
        ["EXHIBITOR_ADDITIONAL_REQUIREMENTS_STATUS_UPDATE"] = new TemplateDefinition
        {
            TemplateCode = "EXHIBITOR_ADDITIONAL_REQUIREMENTS_STATUS_UPDATE",
            Name = "Additional Requirements Status Update",
            Description = "Sent to the exhibitor when an admin Confirms or Rejects their additional requirements request.",
            DefaultSubject = "MSME Sangamam 2026 - Additional Requirements Request {{requestStatus}} - {{bookingRegistrationNumber}}",
            DefaultHtmlBody = @"<div style=""font-family: Arial, sans-serif; font-size: 14px; color: #1e293b; line-height: 1.6; max-width: 600px; margin: 0 auto;"">
    <div style=""background: #0B3B75; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; color: #ffffff;"">
        <h2 style=""margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;"">MSME SANGAMAM 2026 &ndash; HOSUR</h2>
        <p style=""margin: 6px 0 0 0; font-size: 13px; color: #93c5fd;"">Additional Requirements Status Update</p>
    </div>

    <div style=""padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;"">
        <p style=""margin-top: 0;"">Dear <b>{{contactPersonName}}</b>,</p>
        <p>This is to update you regarding your additional requirements request for <b>{{companyName}}</b> (Booking: <b>{{bookingRegistrationNumber}}</b>).</p>

        <div style=""margin: 16px 0; padding: 14px 16px; background-color: #f8fafc; border-left: 4px solid #0B3B75; border-radius: 4px;"">
            <table style=""width: 100%; border-collapse: collapse; font-size: 13px;"">
                <tr>
                    <td style=""padding: 4px 0; font-weight: bold; color: #475569; width: 45%;"">Booking Reg Number:</td>
                    <td style=""padding: 4px 0; font-weight: bold; color: #0B3B75;"">{{bookingRegistrationNumber}}</td>
                </tr>
                <tr>
                    <td style=""padding: 4px 0; font-weight: bold; color: #475569;"">Allocated Stall:</td>
                    <td style=""padding: 4px 0; font-weight: bold;"">{{stallNumber}}</td>
                </tr>
                <tr>
                    <td style=""padding: 4px 0; font-weight: bold; color: #475569;"">Current Status:</td>
                    <td style=""padding: 4px 0;""><span style=""background: #dcfce7; color: #166534; padding: 3px 10px; border-radius: 9999px; font-weight: bold; font-size: 12px;"">{{requestStatus}}</span></td>
                </tr>
                <tr>
                    <td style=""padding: 4px 0; font-weight: bold; color: #475569;"">Total Amount:</td>
                    <td style=""padding: 4px 0; font-weight: bold; color: #059669; font-size: 14px;"">&#8377; {{grandTotal}}</td>
                </tr>
                <tr>
                    <td style=""padding: 4px 0; font-weight: bold; color: #475569;"">Coordinator Remarks:</td>
                    <td style=""padding: 4px 0; font-style: italic; color: #334155;"">{{callNotes}}</td>
                </tr>
            </table>
        </div>

        <h4 style=""margin: 20px 0 10px 0; color: #0B3B75; font-size: 14px;"">Summary of Items</h4>
        {{itemsTableHtml}}

        <div style=""margin-top: 16px; padding: 12px 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;"">
            <table style=""width: 100%; border-collapse: collapse; font-size: 13px;"">
                <tr>
                    <td style=""padding: 3px 0; color: #166534;"">Base Subtotal:</td>
                    <td style=""padding: 3px 0; text-align: right; font-weight: bold; color: #166534;"">&#8377; {{totalBaseAmount}}</td>
                </tr>
                <tr>
                    <td style=""padding: 3px 0; color: #166534;"">GST (18%):</td>
                    <td style=""padding: 3px 0; text-align: right; font-weight: bold; color: #166534;"">&#8377; {{totalGstAmount}}</td>
                </tr>
                <tr style=""border-top: 1px solid #86efac;"">
                    <td style=""padding: 6px 0 0 0; font-weight: bold; font-size: 14px; color: #14532d;"">Grand Total:</td>
                    <td style=""padding: 6px 0 0 0; text-align: right; font-weight: bold; font-size: 15px; color: #14532d;"">&#8377; {{grandTotal}}</td>
                </tr>
            </table>
        </div>

        <p style=""margin-top: 24px; font-size: 13px;"">
            Warm Regards,<br/>
            <b>MSME Sangamam 2026 &ndash; Exhibition Operations Team</b><br/>
            Hosur
        </p>
    </div>
</div>",
            Placeholders = new List<TemplatePlaceholderInfo>
            {
                new() { Tag = "{{bookingRegistrationNumber}}", Label = "Registration Number", Description = "Booking registration number", ExampleValue = "MSME-20260827-0042" },
                new() { Tag = "{{companyName}}", Label = "Company Name", Description = "Exhibitor company name", ExampleValue = "Acme Tools Private Limited" },
                new() { Tag = "{{contactPersonName}}", Label = "Contact Person", Description = "Exhibitor contact person name", ExampleValue = "R. Rajesh" },
                new() { Tag = "{{stallNumber}}", Label = "Stall Number", Description = "Allocated stall number", ExampleValue = "A-102" },
                new() { Tag = "{{requestId}}", Label = "Request ID", Description = "Requirement request ID", ExampleValue = "18dd0c70-2c4a-471d-ad61-e87e046cc97b" },
                new() { Tag = "{{requestStatus}}", Label = "Request Status", Description = "Status of requirement", ExampleValue = "Confirmed" },
                new() { Tag = "{{callNotes}}", Label = "Coordinator Remarks", Description = "Call notes / remarks from the exhibition team", ExampleValue = "Verified power supply with electrician; confirmed for 29500 total." },
                new() { Tag = "{{itemsTableHtml}}", Label = "Items Table HTML", Description = "Formatted HTML table of requested items", ExampleValue = @"<table style=""width:100%; border-collapse:collapse; font-size:13px; margin: 10px 0; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;""><thead><tr style=""background:#f1f5f9; color:#334155; text-align:left;""><th style=""padding:8px 10px; border-bottom:1px solid #cbd5e1;"">Item</th><th style=""padding:8px 10px; border-bottom:1px solid #cbd5e1; text-align:center;"">Qty</th><th style=""padding:8px 10px; border-bottom:1px solid #cbd5e1; text-align:right;"">Base Price</th><th style=""padding:8px 10px; border-bottom:1px solid #cbd5e1; text-align:right;"">GST</th><th style=""padding:8px 10px; border-bottom:1px solid #cbd5e1; text-align:right;"">Total</th></tr></thead><tbody><tr style=""border-bottom:1px solid #f1f5f9; background:#ffffff;""><td style=""padding:8px 10px; font-weight:bold; color:#1e293b;"">PWR-3P-5KW &ndash; 3 Phase 5kW Power Connection</td><td style=""padding:8px 10px; text-align:center; font-weight:bold;"">1</td><td style=""padding:8px 10px; text-align:right;"">&#8377; 25,000.00</td><td style=""padding:8px 10px; text-align:right;"">&#8377; 4,500.00 (18%)</td><td style=""padding:8px 10px; text-align:right; font-weight:bold; color:#0f172a;"">&#8377; 29,500.00</td></tr></tbody><tfoot><tr style=""border-top:1px solid #cbd5e1; background:#f8fafc;""><td colspan=""4"" style=""padding:8px 10px; text-align:right; font-weight:bold; color:#475569;"">Base Subtotal:</td><td style=""padding:8px 10px; text-align:right; font-weight:bold; color:#334155;"">&#8377; 25,000.00</td></tr><tr style=""background:#f8fafc;""><td colspan=""4"" style=""padding:8px 10px; text-align:right; font-weight:bold; color:#475569;"">GST (18%):</td><td style=""padding:8px 10px; text-align:right; font-weight:bold; color:#334155;"">&#8377; 4,500.00</td></tr><tr style=""background:#f1f5f9; border-top:2px solid #cbd5e1;""><td colspan=""4"" style=""padding:9px 10px; text-align:right; font-weight:bold; font-size:14px; color:#1e1b4b;"">Grand Total (Total Amount):</td><td style=""padding:9px 10px; text-align:right; font-weight:bold; font-size:14px; color:#059669;"">&#8377; 29,500.00</td></tr></tfoot></table>" },
                new() { Tag = "{{totalBaseAmount}}", Label = "Base Subtotal", Description = "Sum of base amounts in INR", ExampleValue = "25,000.00" },
                new() { Tag = "{{totalGstAmount}}", Label = "GST Amount", Description = "Sum of GST amounts in INR", ExampleValue = "4,500.00" },
                new() { Tag = "{{grandTotal}}", Label = "Grand Total", Description = "Grand total in INR", ExampleValue = "29,500.00" }
            }
        }
    };
}
