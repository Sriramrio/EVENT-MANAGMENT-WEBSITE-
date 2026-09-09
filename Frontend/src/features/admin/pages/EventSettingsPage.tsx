import { BRAND } from '../../../config/brand';
import { PageHeader } from '../../../shared/components/PageHeader';
import { BrandHeader } from '../../../shared/components/BrandHeader';

export function EventSettingsPage() {
  return <div><PageHeader title="Event Settings" description="Branding, payment and invoice constants for LUB MSME HOSUR." />
    <section className="card p-6"><BrandHeader /><div className="mt-6 grid gap-4 md:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Event</p><p className="mt-1 font-semibold">{BRAND.eventName}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Organiser</p><p className="mt-1 font-semibold">{BRAND.sellerLegalName}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">GSTIN</p><p className="mt-1 font-semibold">{BRAND.sellerGstin}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Bank</p><p className="mt-1 font-semibold">{BRAND.bankName} · {BRAND.ifscCode}</p></div></div></section>
  </div>;
}
