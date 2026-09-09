import { useNavigate } from 'react-router-dom';
import msme from '../../assets/brand/msme-sangamam-logo.png'
import lub from '../../assets/brand/lub-logo.jpg'

export default function ExactPosterCard() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto my-6 max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-xl border border-slate-200">
      {/* Top Header Logos Section */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <img 
            src={msme} 
            alt="MSME Sangamam Connect Tamil Nadu" 
            className="h-14 w-auto object-contain"
          />
        </div>
        <div className="flex items-center gap-1 border-l border-slate-200 pl-5">
          <img 
            src={lub}
            alt="Laghu Udyog Bharati Logo" 
            className="h-12 w-auto object-contain"
          />
        </div>
      </div>

      {/* Main Titles */}
      <div className="my-6 text-center">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          REGISTER NOW
        </h1>
        <div className="relative my-3 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-orange-500/40"></div>
          </div>
          <span className="relative bg-white px-4 text-sm font-extrabold tracking-widest text-orange-600 uppercase">
            FOR VISITORS
          </span>
        </div>
      </div>

      {/* Event Title Capsule */}
      <div className="mb-6 rounded-full border border-blue-200 bg-white py-3 text-center shadow-sm">
        <span className="text-xl font-extrabold text-blue-900 tracking-wide">
          MSME Sangamam 2026
        </span>
      </div>

      {/* Date & Location Grid */}
      <div className="mb-6 grid grid-cols-2 divide-x divide-slate-200 rounded-2xl bg-slate-50/50 p-4 border border-slate-100 text-center">
        <div className="flex flex-col items-center justify-center px-2">
          <div className="flex items-center gap-2 text-blue-600 font-bold mb-1">
            <span className="text-xl">📅</span>
            <span className="text-sm">18th & 19th</span>
          </div>
          <span className="text-sm font-extrabold text-blue-900">Sep 2026</span>
        </div>
        <div className="flex flex-col items-center justify-center px-2">
          <div className="flex items-center gap-2 text-blue-600 font-bold mb-1">
            <span className="text-xl">📍</span>
            <span className="text-sm">Hotel Hills,</span>
          </div>
          <span className="text-sm font-extrabold text-blue-900">Hosur</span>
        </div>
      </div>

      {/* Clickable Action Button */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/visitor')}
          className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 py-4 text-lg font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-xl active:scale-[0.99]"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white transition group-hover:translate-x-1">
            &rarr;
          </span>
          REGISTER NOW
        </button>
      </div>

      {/* Scan to Register Card Section */}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-white p-1 border border-slate-200 shadow-sm flex items-center justify-center">
          {/* QR Code Graphic or Image placeholder */}
          <span className="text-[10px] font-bold text-slate-500 text-center">QR CODE</span>
        </div>
        <div>
          <span className="text-xs font-extrabold tracking-wider text-orange-600 uppercase">
            SCAN TO REGISTER
          </span>
          <p className="text-xs font-bold text-slate-900 mt-0.5">
            Visitor Registration Open
          </p>
          <p className="text-xs font-semibold text-blue-600 underline mt-1">
            msmesangamam.lubtn.com/visitor
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            18 & 19 September 2026 &bull; Hotel Hills, Hosur
          </p>
        </div>
      </div>
    </div>
  );
}