import { Link, useNavigate, useParams } from 'react-router-dom';
import { BrandHeader } from '../../shared/components/BrandHeader';
import { BRAND } from '../../config/brand';

export function PublicBookingSuccessPage() {
  const { bookingRegistrationNumber } = useParams();
 const navigate=useNavigate()
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <BrandHeader />
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.25em] text-green-700">Booking interest received</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">{BRAND.portalName}</h1>
        <p className="mt-2 text-sm text-slate-500">{BRAND.publicEventName}</p>
        <div className="mt-6 rounded-2xl bg-green-50 p-5">
          <p className="text-sm font-semibold text-green-800">Your booking registration number is</p>
          <p className="mt-2 text-2xl font-black text-green-900">{bookingRegistrationNumber}</p>
        </div>
        <p className="mt-6 text-sm leading-6 text-slate-600">Your stall booking interest has been received. Our organising team will review and confirm the stall allocation process. Please keep your booking registration number for future reference.</p>
        <button onClick={()=>{navigate('*')}} className="btn-secondary mt-6 inline-flex">Home Page</button>
      </section>
    </main>
  );
}