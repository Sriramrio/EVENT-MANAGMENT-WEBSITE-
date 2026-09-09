import { BRAND } from '../../config/brand';
import { BrandHeader } from '../../shared/components/BrandHeader';

export function ProformaInvoicePreviewPage() {
  return (
    <section className="mx-auto max-w-4xl bg-white p-8 shadow print:shadow-none">
      <BrandHeader />
      <div className="mt-6 border-y py-4"><h3 className="text-center text-xl font-extrabold">PRO-FORMA INVOICE</h3></div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div><p className="font-bold">Seller</p><p className="text-sm text-slate-600">{BRAND.sellerLegalName}<br />Plot No 63A, First Floor, 9th Street, Sidco Industrial Estate, Ambattur, Chennai - 600058<br />GSTIN: {BRAND.sellerGstin}<br />PAN: {BRAND.sellerPan}</p></div>
        <div><p className="font-bold">Bank Details</p><p className="text-sm text-slate-600">{BRAND.bankAccountName}<br />{BRAND.bankName}<br />A/c: {BRAND.bankAccountNumber}<br />IFSC: {BRAND.ifscCode}<br />{BRAND.branchName}</p></div>
      </div>
      <p className="mt-6 rounded-xl bg-orange-50 p-4 text-sm font-semibold text-orange-700">Invoice data is generated from verified payment and frozen stall records. This preview route does not permit invoice generation before payment verification.</p>
    </section>
  );
}
