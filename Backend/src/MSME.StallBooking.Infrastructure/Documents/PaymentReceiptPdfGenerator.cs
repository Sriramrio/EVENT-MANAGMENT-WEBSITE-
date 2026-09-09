using MSME.StallBooking.Application.Abstractions;
using MSME.StallBooking.Domain.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.IO;
using StallBookingEntity = MSME.StallBooking.Domain.Entities.StallBooking;

namespace MSME.StallBooking.Infrastructure.Documents;

public sealed class PaymentReceiptPdfGenerator : IPaymentReceiptPdfGenerator
{
    private readonly string _logoPath;
    private readonly string _expoLogoPath;



    private static readonly HashSet<Guid> SpecialTenPercentTdsBookingIds = new()
    {
        Guid.Parse("4ecd38a9-f92f-4adb-91e8-88811e2acddf"),
        Guid.Parse("e56f2543-0404-4c26-a858-3c694ea142b0"),
        Guid.Parse("fe3552d8-9ae6-4e34-98b0-b59bd07f5fc4"),
        Guid.Parse("b9d1751b-b17d-401c-be0b-a8aacc1beacd"),
        Guid.Parse("3cc38899-cb26-4282-9cf9-9aa5fd04b46f")
    };

    private static readonly HashSet<string> SpecialTenPercentTdsBookingRegNumbers = new(StringComparer.OrdinalIgnoreCase)
    {
        "MSME-HOSUR-20260716-7695",
        "MSME-HOSUR-20260820-107",
        "MSME-HOSUR-20260731-043",
        "MSME-HOSUR-20260829-129",
        "MSME-HOSUR-20260829-130"
    };

    private static bool IsTenPercentTdsBooking(Guid bookingId, string? regNumber) =>
        SpecialTenPercentTdsBookingIds.Contains(bookingId) ||
        bookingId.ToString().Contains("e3552d8", StringComparison.OrdinalIgnoreCase) ||
        (!string.IsNullOrWhiteSpace(regNumber) && SpecialTenPercentTdsBookingRegNumbers.Contains(regNumber));

    public PaymentReceiptPdfGenerator(
        string logoPath = "Assets/logo.jpg",
        string expoLogoPath = "Assets/msme-sangamam.png")
    {
        _logoPath = logoPath;
        _expoLogoPath = expoLogoPath;
    }

    public Task<byte[]> GeneratePdfBytesAsync(
        StallBookingEntity booking,
        Stall stall,
        StallSize stallSize,
        Payment payment,
        Exhibitor exhibitor,
        decimal expectedTotalAmount,
        decimal totalPaidAmount,
        decimal totalTdsAmount,
        decimal baseAmount,
        CancellationToken ct)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        // ============================================================
        // LOAD ORGANISER LOGO
        // ============================================================

        var logoBytes =
            File.Exists(_logoPath)
                ? File.ReadAllBytes(_logoPath)
                : null;

        // ============================================================
        // LOAD MSME SANGAMAM LOGO
        // ============================================================

        var expoLogoBytes =
            File.Exists(_expoLogoPath)
                ? File.ReadAllBytes(_expoLogoPath)
                : null;

        // ============================================================
        // PAYMENT CALCULATION
        // ============================================================

        var effectivePayableAmount =
            expectedTotalAmount - totalTdsAmount;

        var balanceDue =
            effectivePayableAmount - totalPaidAmount;

        var isFullyPaid =
            balanceDue <= 0;

        // ============================================================
        // RATE PER SQ.M CALCULATION
        // ============================================================
        //
        // StallSize stores area in square metres (AreaSqM). Rate/Sq.M is
        // now derived from the BASE amount (excl. GST) instead of the
        // GST-inclusive expected total, so the printed rate reflects the
        // pure stall rate, not the tax-inflated figure.

        var areaSqM =
              Math.Round(stallSize?.AreaSqM ?? 0m, 2);

        var ratePerSqM =
            areaSqM > 0
                ? Math.Round(baseAmount / areaSqM, 2)
                : 0m;

        var isTenPercentTds = IsTenPercentTdsBooking(booking.Id, booking.BookingRegistrationNumber);
        var tdsPercentageLabel = isTenPercentTds ? "10%" : "2%";

        // ============================================================
        // COLORS (same green "paid/verified" scheme as the Tax Invoice)
        // ============================================================

        const string titleColor = "#14532D";
        const string lightBg = "#DCFCE7";
        const string borderColor = "#166534";

        var documentTitle = "PAYMENT RECEIPT";

        // ============================================================
        // GENERATE PDF
        // ============================================================

        var pdf = Document.Create(container =>
        {
            container.Page(page =>
            {
                // ====================================================
                // PAGE
                // ====================================================

                page.Size(PageSizes.A4);

                page.MarginTop(
                    0.65f,
                    Unit.Centimetre);

                page.MarginBottom(
                    0.65f,
                    Unit.Centimetre);

                page.MarginLeft(
                    0.55f,
                    Unit.Centimetre);

                page.MarginRight(
                    0.55f,
                    Unit.Centimetre);

                page.DefaultTextStyle(
                    x => x
                        .FontSize(7.4f)
                        .FontFamily("Arial"));

                // ====================================================
                // CONTENT
                // ====================================================

                page.Content()
                    .Shrink()
                    .Column(col =>
                    {
                        col.Spacing(4);

                        // =================================================
                        // TITLE
                        // =================================================

                        col.Item()
                            .Background(titleColor)
                            .PaddingVertical(7)
                            .AlignCenter()
                            .Text(documentTitle)
                            .FontColor("#FFFFFF")
                            .Bold()
                            .FontSize(15);

                        // =================================================
                        // EXPO DETAILS + MSME LOGO
                        // =================================================

                        col.Item()
                            .Border(1)
                            .BorderColor(borderColor)
                            .Padding(5)
                            .Row(row =>
                            {
                                // =========================================
                                // LEFT - EXPO DETAILS
                                // =========================================

                                row.RelativeItem()
                                    .Column(c =>
                                    {
                                        c.Spacing(2);

                                        c.Item()
                                            .Text(
                                                "LUB MSME SANGAMAM CONNECT EXPO ")
                                            .Bold()
                                            .FontSize(9);

                                        c.Item()
                                            .Text(
                                                "Expo Venue : Hotel Hills, krishnagiri, Hosur, TamilNadu - 635126")
                                            .FontSize(7.7f);

                                        c.Item()
                                            .Text(
                                                "Expo Date : 18 & 19 September 2026")
                                            .FontSize(7.7f);
                                    });

                                // =========================================
                                // RIGHT - MSME SANGAMAM LOGO
                                // =========================================

                                if (expoLogoBytes != null)
                                {
                                    row.ConstantItem(90)
                                        .Height(42)
                                        .AlignRight()
                                        .AlignMiddle()
                                        .Image(expoLogoBytes)
                                        .FitArea();
                                }
                            });

                        // =================================================
                        // ORGANISER + RECEIPT DETAILS
                        // =================================================

                        col.Item()
                            .Border(1)
                            .BorderColor(borderColor)
                            .Row(row =>
                            {
                                // =========================================
                                // ORGANISER
                                // =========================================

                                row.RelativeItem(1.6f)
                                    .BorderRight(1)
                                    .BorderColor(borderColor)
                                    .Padding(5)
                                    .Column(c =>
                                    {
                                        c.Spacing(2);

                                        // ORGANISER LOGO
                                        if (logoBytes != null)
                                        {
                                            c.Item()
                                                .PaddingBottom(2)
                                                .Width(50)
                                                .Height(30)
                                                .Image(logoBytes)
                                                .FitArea();
                                        }

                                        c.Item()
                                            .Text(
                                                "Laghu Udyog Bharati Tamil Nadu")
                                            .Bold()
                                            .FontSize(9);

                                        c.Item()
                                            .Text(
                                                "Plot No 63A, First Floor, 9th Street, " +
                                                "Sidco Industrial Estate, Ambattur, " +
                                                "Chennai - 600058")
                                            .FontSize(7.3f);

                                        c.Item()
                                            .PaddingTop(2)
                                            .Text(
                                                "GSTIN: 33AAATL0575H1ZT")
                                            .FontSize(7.2f);
                                    });

                                // =========================================
                                // RECEIPT META
                                // =========================================

                                row.RelativeItem(2f)
                                    .Column(meta =>
                                    {
                                        MetaRow(
                                            meta,
                                            "Receipt No.",
                                            payment.ReceiptNumber ?? "-",
                                            "Payment Date",
                                            payment.PaymentDate
                                                .ToString("dd.MM.yyyy"),
                                            lightBg,
                                            borderColor);

                                        MetaRow(
                                            meta,
                                            "Receipt For",
                                            "Stall Booking Payment",
                                            "Verification Status",
                                            payment.VerificationStatus
                                                .ToString(),
                                            lightBg,
                                            borderColor);

                                        MetaRow(
                                            meta,
                                            "Booking Reg. No.",
                                            booking.BookingRegistrationNumber,
                                            "Stall No.",
                                            stall.StallNumber,
                                            lightBg,
                                            borderColor);

                                        MetaRow(
       meta,
       "Stall Size (Sq.M)",
       areaSqM > 0
           ? $"{areaSqM:N2} Sq.M"
           : "-",
       "Rate / Sq.M (Base Amt)",
       ratePerSqM > 0
           ? $"Rs. {ratePerSqM:N2}"
           : "-",
       lightBg,
       borderColor);
                                    });
                            });

                        // =================================================
                        // EXHIBITOR (PAYER) DETAILS
                        // =================================================

                        col.Item()
                            .Border(1)
                            .BorderColor(borderColor)
                            .Padding(5)
                            .Column(c =>
                            {
                                c.Spacing(2);

                                c.Item()
                                    .Text("Received From")
                                    .Bold()
                                    .FontSize(8.5f);

                                c.Item()
                                    .Text(exhibitor.LegalName)
                                    .Bold()
                                    .FontSize(9);

                                // =========================================
                                // EXHIBITOR DETAILS
                                // =========================================

                                c.Item()
                                    .PaddingTop(3)
                                    .Row(r =>
                                    {
                                        // LEFT
                                        r.RelativeItem()
                                            .Column(left =>
                                            {
                                                left.Spacing(1.5f);

                                                left.Item()
                                                    .Text(
                                                        $"PAN No. : " +
                                                        $"{(string.IsNullOrWhiteSpace(
                                                            exhibitor.Pan)
                                                            ? "-"
                                                            : exhibitor.Pan)}")
                                                    .FontSize(7.2f);
                                                left.Item()
                                                    .Text(
                                                        $"UDYAM No. : " +
                                                        $"{(string.IsNullOrWhiteSpace(
                                                            exhibitor.UdyamNumber)
                                                            ? "-"
                                                            : exhibitor.UdyamNumber)}")
                                                    .FontSize(7.2f);

                                                left.Item()
                                                    .Text(
                                                        $"Contact Person : " +
                                                        $"{exhibitor.ContactPersonName}")
                                                    .FontSize(7.2f);
                                            });

                                        // RIGHT
                                        r.RelativeItem()
                                            .Column(right =>
                                            {
                                                right.Spacing(1.5f);

                                                right.Item()
                                                    .Text(
                                                        $"Mobile : {exhibitor.Mobile}")
                                                    .FontSize(7.2f);

                                                right.Item()
                                                    .Text(
                                                        $"Email : {exhibitor.Email}")
                                                    .FontSize(7.2f);
                                            });
                                    });

                                // =========================================
                                // EXHIBITOR BANK DETAILS
                                // =========================================

                                c.Item()
                                    .PaddingTop(4)
                                    .BorderTop(1)
                                    .BorderColor(borderColor)
                                    .PaddingTop(4)
                                    .Column(bank =>
                                    {
                                        bank.Spacing(1.5f);

                                        bank.Item()
                                            .Text(
                                                "Bank Details of the Exhibitor")
                                            .Bold()
                                            .FontSize(8);

                                        bank.Item()
                                            .Text(
                                                $"Account Name : " +
                                                $"{(string.IsNullOrWhiteSpace(
                                                    exhibitor.BankAccountName)
                                                    ? "-"
                                                    : exhibitor.BankAccountName)}")
                                            .FontSize(7.1f);

                                        bank.Item()
                                            .Text(
                                                $"Bank Name : " +
                                                $"{(string.IsNullOrWhiteSpace(
                                                    exhibitor.BankName)
                                                    ? "-"
                                                    : exhibitor.BankName)}")
                                            .FontSize(7.1f);

                                        bank.Item()
                                            .Text(
                                                $"Account No : " +
                                                $"{(string.IsNullOrWhiteSpace(
                                                    exhibitor.BankAccountNumber)
                                                    ? "-"
                                                    : exhibitor.BankAccountNumber)}")
                                            .FontSize(7.1f);

                                        bank.Item()
                                            .Text(
                                                $"IFSC Code : " +
                                                $"{(string.IsNullOrWhiteSpace(
                                                    exhibitor.BankIfscCode)
                                                    ? "-"
                                                    : exhibitor.BankIfscCode)}")
                                            .FontSize(7.1f);
                                    });
                            });

                        // =================================================
                        // PAYMENT DETAILS TABLE
                        // =================================================

                        col.Item()
                            .Border(1)
                            .BorderColor(borderColor)
                            .Table(table =>
                            {
                                table.ColumnsDefinition(c =>
                                {
                                    c.RelativeColumn(3f);
                                    c.RelativeColumn(3f);
                                });

                                // =========================================
                                // HEADER
                                // =========================================

                                table.Header(h =>
                                {
                                    h.Cell()
                                        .Element(x =>
                                            HeaderCell(
                                                x,
                                                lightBg,
                                                borderColor))
                                        .Text("Particulars")
                                        .Bold()
                                        .FontSize(7);

                                    h.Cell()
                                        .Element(x =>
                                            HeaderCell(
                                                x,
                                                lightBg,
                                                borderColor))
                                        .Text("Details")
                                        .Bold()
                                        .FontSize(7);
                                });

                                // =========================================
                                // ROWS
                                // =========================================

                                TableRow(
     table,
     borderColor,
     "Stall Size",
     stallSize?.DisplayName ?? "-");

                                TableRow(
                                    table,
                                    borderColor,
                                    "Area (Sq.M)",
                                    areaSqM > 0
                                        ? $"{areaSqM:N2} Sq.M"
                                        : "-");

                                TableRow(
                                    table,
                                    borderColor,
                                    "Rate / Sq.M (Base Amt)",
                                    ratePerSqM > 0
                                        ? $"Rs. {ratePerSqM:N2}"
                                        : "-");

                                TableRow(
                                    table,
                                    borderColor,
                                    "Payment Reference No.",
                                    payment.PaymentReferenceNumber);

                                TableRow(
                                    table,
                                    borderColor,
                                    "Payment Mode",
                                    payment.PaymentMode.ToString());

                                TableRow(
                                    table,
                                    borderColor,
                                    "Payer Name",
                                    payment.PayerName);

                                TableRow(
                                    table,
                                    borderColor,
                                    "Payer Bank",
                                    payment.PayerBank ?? "-");

                                TableRow(
                                    table,
                                    borderColor,
                                    "Amount Paid (This Payment)",
                                    $"₹ {payment.AmountPaid:N2}");

                                TableRow(
                                    table,
                                    borderColor,
                                    $"TDS Deducted ({tdsPercentageLabel})",
                                    (payment.isTdsDeductable || isTenPercentTds)
                                        ? "Yes"
                                        : "No");

                                TableRow(
                                    table,
                                    borderColor,
                                    "Notes",
                                    payment.Remarks ?? "-");
                            });

                        // =================================================
                        // PAYMENT SUMMARY TABLE
                        // =================================================

                        col.Item()
                            .Border(1)
                            .BorderColor(borderColor)
                            .Table(table =>
                            {
                                table.ColumnsDefinition(c =>
                                {
                                    c.RelativeColumn(3f);
                                    c.RelativeColumn(3f);
                                });

                                table.Header(h =>
                                {
                                    h.Cell()
                                        .Element(x =>
                                            HeaderCell(
                                                x,
                                                lightBg,
                                                borderColor))
                                        .Text("Payment Summary")
                                        .Bold()
                                        .FontSize(7);

                                    h.Cell()
                                        .Element(x =>
                                            HeaderCell(
                                                x,
                                                lightBg,
                                                borderColor))
                                        .Text("Amount")
                                        .Bold()
                                        .FontSize(7);
                                });

                                TableRow(
                                    table,
                                    borderColor,
                                    "Full Stall Amount",
                                    $"₹ {expectedTotalAmount:N2}");

                                TableRow(
                                    table,
                                    borderColor,
                                    "TDS Deducted (Adjusted)",
                                    $"₹ {totalTdsAmount:N2}");

                                TableRow(
                                    table,
                                    borderColor,
                                    "Net Amount Received",
                                    $"₹ {effectivePayableAmount:N2}");

                                table.Cell()
                                    .Element(x =>
                                        HeaderCell(
                                            x,
                                            lightBg,
                                            borderColor))
                                    .Text("Balance Due")
                                    .Bold()
                                    .FontSize(8);

                                table.Cell()
                                    .Element(x =>
                                        HeaderCell(
                                            x,
                                            lightBg,
                                            borderColor))
                                    .Text(
                                        isFullyPaid
                                            ? "₹ 0.00 (Fully Paid)"
                                            : $"₹ {balanceDue:N2}")
                                    .Bold()
                                    .FontSize(8);
                            });

                        // =================================================
                        // NOTES
                        // =================================================

                        col.Item()
                            .Border(1)
                            .BorderColor(borderColor)
                            .Padding(5)
                            .Column(c =>
                            {
                                c.Spacing(2);

                                c.Item()
                                    .Text("NOTES")
                                    .Bold()
                                    .FontSize(8);

                                c.Item()
                                    .Text(
                                        isFullyPaid
                                            ? "This receipt confirms that the payment " +
                                              "has been verified and the stall has " +
                                              "been frozen/finalized."
                                            : "This receipt confirms that a part " +
                                              "payment has been verified. The stall " +
                                              "remains blocked until the balance " +
                                              "above is paid.")
                                    .FontSize(7.2f);
                            });

                        // =================================================
                        // ORGANISER BANK DETAILS + SIGNATURE
                        // =================================================

                        col.Item()
                            .Border(1)
                            .BorderColor(borderColor)
                            .Row(r =>
                            {
                                // =========================================
                                // BANK DETAILS
                                // =========================================

                                r.RelativeItem()
                                    .BorderRight(1)
                                    .BorderColor(borderColor)
                                    .Padding(5)
                                    .Column(c =>
                                    {
                                        c.Spacing(1.5f);

                                        c.Item()
                                            .Text(
                                                "BANK DETAILS OF THE ORGANISER")
                                            .Bold()
                                            .FontSize(8);

                                        c.Item()
                                            .Text(
                                                "Account Name : " +
                                                "LAGHU UDYOG BHARATI")
                                            .FontSize(7.2f);

                                        c.Item()
                                            .Text(
                                                "Bank Name : Canara Bank")
                                            .FontSize(7.2f);

                                        c.Item()
                                            .Text(
                                                "Account No : 0908201005559")
                                            .FontSize(7.2f);

                                        c.Item()
                                            .Text(
                                                "IFSC Code : CNRB0000936")
                                            .FontSize(7.2f);

                                        c.Item()
                                            .Text(
                                                "Branch : Ambattur Branch, " +
                                                "Chennai 600053")
                                            .FontSize(7.2f);
                                    });

                                // =========================================
                                // SIGNATURE
                                // =========================================

                                r.RelativeItem()
                                    .Padding(5)
                                    .Column(c =>
                                    {
                                        c.Item()
                                            .Text("Customer Signature")
                                            .FontSize(7.2f);

                                        c.Item()
                                            .Height(20);

                                        c.Item()
                                            .AlignRight()
                                            .Text(
                                                "for Laghu Udyog Bharati Tamil Nadu")
                                            .Bold()
                                            .FontSize(8);

                                        c.Item()
                                            .Height(32);

                                        c.Item()
                                            .AlignRight()
                                            .Text(
                                                "Authorised Signatory")
                                            .FontSize(7.2f);
                                    });
                            });

                        // =================================================
                        // FOOTER
                        // =================================================

                        col.Item()
                            .PaddingTop(2)
                            .AlignCenter()
                            .Text(
                                "This is a Computer Generated Payment Receipt")
                            .Italic()
                            .FontSize(7.2f);
                    });
            });
        }).GeneratePdf();

        return Task.FromResult(pdf);
    }

    // ================================================================
    // META ROW
    // ================================================================

    private static void MetaRow(
        ColumnDescriptor col,
        string leftHeader,
        string leftValue,
        string rightHeader,
        string rightValue,
        string bg,
        string border)
    {
        col.Item()
            .Row(r =>
            {
                r.RelativeItem()
                    .Element(x =>
                        HeaderCell(
                            x,
                            bg,
                            border))
                    .Text(leftHeader)
                    .FontSize(6.7f);

                r.RelativeItem()
                    .Element(x =>
                        HeaderCell(
                            x,
                            bg,
                            border))
                    .Text(rightHeader)
                    .FontSize(6.7f);
            });

        col.Item()
            .Row(r =>
            {
                r.RelativeItem()
                    .Element(x =>
                        ValueCell(
                            x,
                            border))
                    .Text(leftValue ?? "")
                    .FontSize(7.1f);

                r.RelativeItem()
                    .Element(x =>
                        ValueCell(
                            x,
                            border))
                    .Text(rightValue ?? "")
                    .FontSize(7.1f);
            });
    }

    // ================================================================
    // TABLE ROW (2-column label/value row inside a Table)
    // ================================================================

    private static void TableRow(
        TableDescriptor table,
        string border,
        string label,
        string value)
    {
        table.Cell()
            .Element(x =>
                BodyCell(
                    x,
                    border))
            .Text(label)
            .FontSize(7.2f);

        table.Cell()
            .Element(x =>
                BodyCell(
                    x,
                    border))
            .Text(
                string.IsNullOrWhiteSpace(value)
                    ? "-"
                    : value)
            .FontSize(7.2f);
    }

    // ================================================================
    // HEADER CELL
    // ================================================================

    private static IContainer HeaderCell(
        IContainer container,
        string bg,
        string border)
    {
        return container
            .Background(bg)
            .BorderRight(1)
            .BorderBottom(1)
            .BorderColor(border)
            .PaddingVertical(4)
            .PaddingHorizontal(4);
    }

    // ================================================================
    // VALUE CELL
    // ================================================================

    private static IContainer ValueCell(
        IContainer container,
        string border)
    {
        return container
            .BorderRight(1)
            .BorderBottom(1)
            .BorderColor(border)
            .PaddingVertical(4)
            .PaddingHorizontal(4);
    }

    // ================================================================
    // BODY CELL
    // ================================================================

    private static IContainer BodyCell(
        IContainer container,
        string border)
    {
        return container
            .BorderRight(1)
            .BorderBottom(1)
            .BorderColor(border)
            .PaddingVertical(4)
            .PaddingHorizontal(4);
    }
}
