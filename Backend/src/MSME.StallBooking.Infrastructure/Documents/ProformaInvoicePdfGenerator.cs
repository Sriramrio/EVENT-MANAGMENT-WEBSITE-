using MSME.StallBooking.Application.Abstractions;
using MSME.StallBooking.Domain.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.IO;

namespace MSME.StallBooking.Infrastructure.Documents;

public sealed class ProformaInvoicePdfGenerator : IProformaInvoicePdfGenerator
{
    private readonly string _logoPath;
    private readonly string _expoLogoPath;

    private static readonly HashSet<Guid> SpecialTenPercentTdsBookingIds = new()
   {
       Guid.Parse("4ecd38a9-f92f-4adb-91e8-88811e2acddf"),
       Guid.Parse("e56f2543-0404-4c26-a858-3c694ea142b0"),
       Guid.Parse("fe3552d8-9ae6-4e34-98b0-b59bd07f5fc4"),
       Guid.Parse("b9d1751b-b17d-401c-be0b-a8aacc1beacd"),
       Guid.Parse("3cc38899-cb26-4282-9cf9-9aa5fd04b46f"),
        Guid.Parse("ebd776e9-c540-41f9-aabb-7c374251c13f"),
        Guid.Parse("40f09360-8694-4e6a-97ec-ee7c29a0b31f")
   };



    private static readonly HashSet<string> SpecialTenPercentTdsBookingRegNumbers = new(StringComparer.OrdinalIgnoreCase)
   {
       "MSME-HOSUR-20260716-7695",
       "MSME-HOSUR-20260820-107",
       "MSME-HOSUR-20260731-043",
       "MSME-HOSUR-20260829-129",
       "MSME-HOSUR-20260829-130",
       "MSME-HOSUR-20260904-157",
       "MSME-HOSUR-20260907-172"
   };

    private static bool IsTenPercentTdsInvoice(ProformaInvoice invoice) =>
        SpecialTenPercentTdsBookingIds.Contains(invoice.BookingId) ||
        invoice.BookingId.ToString().Contains("e3552d8", StringComparison.OrdinalIgnoreCase) ||
        SpecialTenPercentTdsBookingRegNumbers.Any(reg =>
            (invoice.Notes?.Contains(reg, StringComparison.OrdinalIgnoreCase) ?? false) ||
            (invoice.Description?.Contains(reg, StringComparison.OrdinalIgnoreCase) ?? false)) ||
        (invoice.Notes?.Contains("e3552d8", StringComparison.OrdinalIgnoreCase) ?? false) ||
        (invoice.Description?.Contains("e3552d8", StringComparison.OrdinalIgnoreCase) ?? false);

    public ProformaInvoicePdfGenerator(
        string logoPath = "Assets/logo.jpg",
        string expoLogoPath = "Assets/msme-sangamam.png")
    {
        _logoPath = logoPath;
        _expoLogoPath = expoLogoPath;
    }

    public Task<Guid> GenerateAsync(
        ProformaInvoice invoice,
        CancellationToken ct)
        => Task.FromResult(Guid.NewGuid());

    public Task<byte[]> GenerateProformaPdfBytesAsync(
        ProformaInvoice invoice,
        Exhibitor exhibitor,
        DateTimeOffset? expiryDate,
        decimal? areaSqM,
        CancellationToken ct)
    {
        return GeneratePdfBytesAsync(
            invoice,
            exhibitor,
            "PROFORMA INVOICE",
            expiryDate,
            areaSqM,
            ct);
    }

    public Task<byte[]> GenerateTaxInvoicePdfBytesAsync(
        ProformaInvoice invoice,
        Exhibitor exhibitor,
        decimal? areaSqM,
        CancellationToken ct)
    {
        return GeneratePdfBytesAsync(
            invoice,
            exhibitor,
            "TAX INVOICE",
            null,
            areaSqM,
            ct);
    }

    public Task<byte[]> GeneratePdfBytesAsync(
        ProformaInvoice invoice,
        Exhibitor exhibitor,
        string documentTitle,
        DateTimeOffset? expiryDate,
        decimal? areaSqM,
        CancellationToken ct)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        // ============================================================
        // DOCUMENT TYPE
        // ============================================================

        var isTaxInvoice =
            documentTitle.Equals(
                "TAX INVOICE",
                StringComparison.OrdinalIgnoreCase);

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
        // COLORS
        // ============================================================

        var titleColor =
            isTaxInvoice
                ? "#14532D"
                : "#7C2D12";

        var lightBg =
            isTaxInvoice
                ? "#DCFCE7"
                : "#FFEDD5";

        var borderColor =
            isTaxInvoice
                ? "#166534"
                : "#C2410C";

        // ============================================================
        // SPONSOR
        // ============================================================

        var isSponsor =
            string.Equals(
                invoice.HsnSac,
                "HSN 998397",
                StringComparison.OrdinalIgnoreCase);

        // ============================================================
        // RCM
        // ============================================================

        var isRcm =
            invoice.GstAmount == 0m ||
            invoice.GstPercentage == 0m;

        // ============================================================
        // TDS
        // ============================================================

        var isTenPercentTds = IsTenPercentTdsInvoice(invoice);
        var isTdsApplicable = invoice.isTdsDeductable || isTenPercentTds;
        var effectiveTdsPercentage = invoice.TdsPercentage ?? (isTenPercentTds ? 10m : 2m);
        var tdsRate = effectiveTdsPercentage / 100m;
        var tdsLabel = $"{effectiveTdsPercentage:0.##}%";

        // ============================================================
        // AREA / RATE PER SQ.M (derived from BASE amount, excl. GST)
        // ============================================================

        var areaSqMValue =
            Math.Round(areaSqM ?? 0m, 2);

        var ratePerSqM =
            areaSqMValue > 0
                ? Math.Round(invoice.BaseAmount / areaSqMValue, 2)
                : 0m;

        // ============================================================
        // INVOICE NUMBER
        // ============================================================

        var invoiceNo =
            isTaxInvoice &&
            !string.IsNullOrWhiteSpace(invoice.TaxInvoiceNumber)
                ? invoice.TaxInvoiceNumber
                : invoice.InvoiceNumber;

        // ============================================================
        // NOTES
        // ============================================================

        var notes =
            isTaxInvoice
                ? "Payment verified and stall allocation confirmed."
                : $"Payment request for the temporarily blocked stall. " +
                  $"Kindly complete the payment on or before " +
                  $"{expiryDate:dd.MM.yyyy hh:mm tt}. " +
                  $"The blocked stall reservation will automatically expire " +
                  $"if payment is not received before the expiry date.";

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
                                                "Expo Venue : Hotel Hills,krishnagiri, Hosur, TamilNadu - 635126")
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
                        // SELLER + INVOICE DETAILS
                        // =================================================

                        col.Item()
                            .Border(1)
                            .BorderColor(borderColor)
                            .Row(row =>
                            {
                                // =========================================
                                // SELLER
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
                                            .Text(invoice.SellerLegalName)
                                            .Bold()
                                            .FontSize(9);

                                        c.Item()
                                            .Text(invoice.SellerAddress)
                                            .FontSize(7.3f);

                                        c.Item()
                                            .PaddingTop(2)
                                            .Text(
                                                $"GSTIN/UIN: {invoice.SellerGstin}")
                                            .FontSize(7.2f);

                                        c.Item()
                                            .Text(
                                                $"PAN: {invoice.SellerPan}")
                                            .FontSize(7.2f);
                                    });

                                // =========================================
                                // INVOICE META
                                // =========================================

                                row.RelativeItem(2f)
                                    .Column(meta =>
                                    {
                                        MetaRow(
                                            meta,
                                            "Invoice No.",
                                            invoiceNo,
                                            "Dated",
                                            invoice.InvoiceDate
                                                .ToString("dd.MM.yyyy"),
                                            lightBg,
                                            borderColor);

                                        MetaRow(
                                            meta,
                                            "Document Type",
                                            documentTitle,
                                            "Payment Terms",
                                            isTaxInvoice
                                                ? "Paid / Verified"
                                                : "Advance Payment Request",
                                            lightBg,
                                            borderColor);

                                        MetaRow(
                                            meta,
                                            "Stall No.",
                                            invoice.StallNumber,
                                            "Stall Size",
                                            invoice.StallSizeDisplay,
                                            lightBg,
                                            borderColor);

                                        MetaRow(
                                            meta,
                                            "Area (Sq.M)",
                                            areaSqMValue > 0
                                                ? $"{areaSqMValue:N2} Sq.M"
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
                        // BUYER DETAILS
                        // =================================================

                        col.Item()
                            .Border(1)
                            .BorderColor(borderColor)
                            .Padding(5)
                            .Column(c =>
                            {
                                c.Spacing(2);

                                c.Item()
                                    .Text("Buyer (Bill To)")
                                    .Bold()
                                    .FontSize(8.5f);

                                c.Item()
                                    .Text(exhibitor.LegalName)
                                    .Bold()
                                    .FontSize(9);

                                c.Item()
                                    .Text(exhibitor.RegisteredAddress)
                                    .FontSize(7.3f);

                                c.Item()
                                    .Text(
                                        $"{exhibitor.City}, " +
                                        $"{exhibitor.State} - " +
                                        $"{exhibitor.Pincode}")
                                    .FontSize(7.3f);

                                // =========================================
                                // BUYER DETAILS
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
                                                        $"GSTIN/UIN : {exhibitor.Gstin}")
                                                    .FontSize(7.2f);

                                                left.Item()
                                                    .Text(
                                                        $"PAN : {exhibitor.Pan}")
                                                    .FontSize(7.2f);

                                                left.Item()
                                                    .Text(
                                                        $"TAN : {exhibitor.TanNumber}")
                                                    .FontSize(7.2f);

                                                left.Item()
                                                    .Text(
                                                        $"UDYAM No. : " +
                                                        $"{(string.IsNullOrWhiteSpace(
                                                            exhibitor.UdyamNumber)
                                                            ? "-"
                                                            : exhibitor.UdyamNumber)}")
                                                    .FontSize(7.2f);
                                            });

                                        // RIGHT
                                        r.RelativeItem()
                                            .Column(right =>
                                            {
                                                right.Spacing(1.5f);

                                                right.Item()
                                                    .Text(
                                                        $"State Name : {exhibitor.State}")
                                                    .FontSize(7.2f);

                                                right.Item()
                                                    .Text(
                                                        $"Contact Person : " +
                                                        $"{exhibitor.ContactPersonName}")
                                                    .FontSize(7.2f);

                                                right.Item()
                                                    .Text(
                                                        $"Place of Supply : " +
                                                        $"{(string.IsNullOrWhiteSpace(
                                                            invoice.PlaceOfSupply)
                                                            ? "Not Applicable"
                                                            : invoice.PlaceOfSupply)}")
                                                    .FontSize(7.2f);

                                                right.Item()
                                                    .Text(
                                                        $"Mobile / Email : " +
                                                        $"{exhibitor.Mobile} / " +
                                                        $"{exhibitor.Email}")
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
                        // ITEMS TABLE
                        // =================================================

                        col.Item()
                            .Border(1)
                            .BorderColor(borderColor)
                            .Table(table =>
                            {
                                table.ColumnsDefinition(c =>
                                {
                                    c.ConstantColumn(32);
                                    c.RelativeColumn(5.5f);
                                    c.ConstantColumn(68);
                                    c.ConstantColumn(68);
                                    c.ConstantColumn(85);
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
                                        .AlignCenter()
                                        .Text("SI No.")
                                        .Bold()
                                        .FontSize(7);

                                    h.Cell()
                                        .Element(x =>
                                            HeaderCell(
                                                x,
                                                lightBg,
                                                borderColor))
                                        .AlignCenter()
                                        .Text("Particulars")
                                        .Bold()
                                        .FontSize(7);

                                    h.Cell()
                                        .Element(x =>
                                            HeaderCell(
                                                x,
                                                lightBg,
                                                borderColor))
                                        .AlignCenter()
                                        .Text("HSN/SAC")
                                        .Bold()
                                        .FontSize(7);

                                    h.Cell()
                                        .Element(x =>
                                            HeaderCell(
                                                x,
                                                lightBg,
                                                borderColor))
                                        .AlignRight()
                                        .Text("Rate")
                                        .Bold()
                                        .FontSize(7);

                                    h.Cell()
                                        .Element(x =>
                                            HeaderCell(
                                                x,
                                                lightBg,
                                                borderColor))
                                        .AlignRight()
                                        .Text("Amount")
                                        .Bold()
                                        .FontSize(7);
                                });

                                // =========================================
                                // SI
                                // =========================================

                                table.Cell()
                                    .Element(x =>
                                        BodyCell(
                                            x,
                                            borderColor))
                                    .AlignCenter()
                                    .Text("1")
                                    .FontSize(7.2f);

                                // =========================================
                                // PARTICULARS
                                // =========================================

                                table.Cell()
                                    .Element(x =>
                                        BodyCell(
                                            x,
                                            borderColor))
                                    .MinHeight(75)
                                    .Column(c =>
                                    {
                                        c.Spacing(2);

                                        c.Item()
                                            .Text(
                                                "LUB MSME SANGAMAM CONNECT EXPO ")
                                            .Bold()
                                            .FontSize(8.2f);

                                        c.Item()
                                            .Text(
                                                "Expo Venue : Hotel Hills, krishnagiri, Hosur, TamilNadu - 635126")
                                            .FontSize(7.2f);

                                        c.Item()
                                            .Text(
                                                "Expo Date : 18 & 19 September 2026")
                                            .FontSize(7.2f);

                                        if (isSponsor)
                                        {
                                            c.Item()
                                                .PaddingTop(3)
                                                .Text(
                                                    "Category : SPONSORSHIP CHARGES")
                                                .Bold()
                                                .FontSize(7.5f);
                                        }
                                        else
                                        {
                                            c.Item()
                                                .PaddingTop(3)
                                                .Text(
                                                    $"Stall Size : " +
                                                    $"{invoice.StallSizeDisplay}")
                                                .FontSize(7.2f);

                                            c.Item()
                                                .Text(
                                                    $"Stall No. : " +
                                                    $"{invoice.StallNumber}")
                                                .FontSize(7.2f);
                                        }

                                        if (isRcm)
                                        {
                                            c.Item()
                                                .PaddingTop(10)
                                                .AlignRight()
                                                .Text(
                                                    "GST 0.00% (RCM)")
                                                .Bold()
                                                .FontSize(7.2f);
                                        }
                                        else
                                        {
                                            c.Item()
                                                .PaddingTop(10)
                                                .AlignRight()
                                                .Text(
                                                    $"GST " +
                                                    $"{invoice.GstPercentage:N2}%")
                                                .Bold()
                                                .FontSize(7.2f);
                                        }
                                    });

                                // =========================================
                                // HSN
                                // =========================================

                                table.Cell()
                                    .Element(x =>
                                        BodyCell(
                                            x,
                                            borderColor))
                                    .AlignCenter()
                                    .Text(invoice.HsnSac)
                                    .FontSize(7.2f);

                                // =========================================
                                // RATE
                                // =========================================

                                table.Cell()
                                    .Element(x =>
                                        BodyCell(
                                            x,
                                            borderColor))
                                    .AlignRight()
                                    .Text(
                                        $"{invoice.BaseAmount:N2}")
                                    .FontSize(7.2f);

                                // =========================================
                                // AMOUNT
                                // =========================================

                                table.Cell()
                                    .Element(x =>
                                        BodyCell(
                                            x,
                                            borderColor))
                                    .Column(c =>
                                    {
                                        c.Item()
                                            .AlignRight()
                                            .Text(
                                                $"{invoice.BaseAmount:N2}")
                                            .FontSize(7.2f);

                                        c.Item()
                                            .PaddingTop(30)
                                            .AlignRight()
                                            .Text(
                                                isRcm
                                                    ? "0.00"
                                                    : $"{invoice.GstAmount:N2}")
                                            .Bold()
                                            .FontSize(7.2f);
                                    });

                                // =========================================
                                // TOTAL
                                // =========================================

                                table.Cell()
                                    .ColumnSpan(4)
                                    .Element(x =>
                                        HeaderCell(
                                            x,
                                            lightBg,
                                            borderColor))
                                    .AlignRight()
                                    .Text("Total")
                                    .Bold()
                                    .FontSize(8);

                                table.Cell()
                                    .Element(x =>
                                        HeaderCell(
                                            x,
                                            lightBg,
                                            borderColor))
                                    .AlignRight()
                                    .Text(
                                        $"₹ {invoice.TotalAmount:N2}")
                                    .Bold()
                                    .FontSize(8);

                                // =========================================
                                // TDS
                                // =========================================

                                if (isTdsApplicable)
                                {
                                    var tdsAmount =
                                        Math.Round(
                                            invoice.BaseAmount * tdsRate,
                                            2);

                                    var netAmountPaid =
                                        invoice.TotalAmount - tdsAmount;

                                    table.Cell()
                                        .ColumnSpan(4)
                                        .Element(x =>
                                            BodyCell(
                                                x,
                                                borderColor))
                                        .AlignRight()
                                        .Text(
                                            $"Less: TDS Deducted ({tdsLabel})")
                                        .FontSize(7.2f);

                                    table.Cell()
                                        .Element(x =>
                                            BodyCell(
                                                x,
                                                borderColor))
                                        .AlignRight()
                                        .Text(
                                            $"- ₹ {tdsAmount:N2}")
                                        .FontSize(7.2f);

                                    table.Cell()
                                        .ColumnSpan(4)
                                        .Element(x =>
                                            HeaderCell(
                                                x,
                                                lightBg,
                                                borderColor))
                                        .AlignRight()
                                        .Text(
                                            "Net Amount Received")
                                        .Bold()
                                        .FontSize(8);

                                    table.Cell()
                                        .Element(x =>
                                            HeaderCell(
                                                x,
                                                lightBg,
                                                borderColor))
                                        .AlignRight()
                                        .Text(
                                            $"₹ {netAmountPaid:N2}")
                                        .Bold()
                                        .FontSize(8);
                                }
                            });

                        // =================================================
                        // TDS NOTE
                        // =================================================

                        if (isTdsApplicable)
                        {
                            var tdsAmount =
                                Math.Round(
                                    invoice.BaseAmount * tdsRate,
                                    2);

                            var netAmountPayable =
                                invoice.TotalAmount - tdsAmount;

                            col.Item()
                                .Border(1)
                                .BorderColor(borderColor)
                                .Padding(5)
                                .Column(c =>
                                {
                                    c.Spacing(2);

                                    c.Item()
                                        .Text("TDS Note")
                                        .Bold()
                                        .FontSize(7.5f);

                                    c.Item()
                                        .Text(
                                            $"TDS at {tdsLabel} (₹{tdsAmount:N2}) " +
                                            $"has been deducted at source " +
                                            $"by the buyer. Net amount " +
                                            $"payable/received against this " +
                                            $"invoice is ₹{netAmountPayable:N2}.")
                                        .FontSize(7.2f);
                                });
                        }

                        // =================================================
                        // AMOUNT + TAX WORDS
                        // =================================================

                        col.Item()
                            .Border(1)
                            .BorderColor(borderColor)
                            .Padding(5)
                            .Column(c =>
                            {
                                c.Spacing(2);

                                c.Item()
                                    .Text(
                                        "Amount Chargeable (in words)")
                                    .FontSize(7.2f);

                                c.Item()
                                    .Text(
                                        $"INR {invoice.AmountInWords}")
                                    .Bold()
                                    .FontSize(8);

                                c.Item()
                                    .PaddingTop(2)
                                    .BorderTop(0.5f)
                                    .BorderColor(borderColor);

                                c.Item()
                                    .PaddingTop(2)
                                    .Text(
                                        "Tax Amount (in words)")
                                    .FontSize(7.2f);

                                c.Item()
                                    .Text(
                                        $"INR {invoice.TaxAmountInWords}")
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
                                    .Text(notes)
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
                                                $"Account Name : " +
                                                $"{invoice.BankAccountName}")
                                            .FontSize(7.2f);

                                        c.Item()
                                            .Text(
                                                $"Bank Name : " +
                                                $"{invoice.BankName}")
                                            .FontSize(7.2f);

                                        c.Item()
                                            .Text(
                                                $"Account No : " +
                                                $"{invoice.BankAccountNumber}")
                                            .FontSize(7.2f);

                                        c.Item()
                                            .Text(
                                                $"IFSC Code : " +
                                                $"{invoice.IfscCode}")
                                            .FontSize(7.2f);

                                        c.Item()
                                            .Text(
                                                $"Branch : " +
                                                $"{invoice.BranchName}")
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
                                            .AlignRight()
                                            .Text(
                                                $"for {invoice.SellerLegalName}")
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
                                isTaxInvoice
                                    ? "This is a Computer Generated Tax Invoice"
                                    : "This is a Computer Generated Proforma Invoice")
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
