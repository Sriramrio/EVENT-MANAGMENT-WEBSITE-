import { Link, useNavigate } from 'react-router';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Handshake,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react';
import { BRAND } from '../../../../app/brand';

const stats = [
  ['25,840+', 'Registered MSMEs', Users],
  ['3,620+', 'Buyers', Building2],
  ['12,450+', 'Matches Made', Handshake],
  ['820+', 'Events Conducted', CalendarDays],
  ['98%', 'Buyer Satisfaction', ShieldCheck],
] as const;

export default function LandingPage() {
    const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img
              src={BRAND.lubLogo}
              alt="Laghu Udyog Bharati logo"
              className="h-14"
            />
            <div className="h-9 w-px bg-slate-200" />
            <img
              src={BRAND.msmeLogo}
              alt="MSME Sangamam logo"
              className="h-14"
            />
          </div>

          <nav className="hidden items-center gap-6 text-xs font-bold text-slate-600 md:flex">
            <a href="#about" className="hover:text-slate-900">
              About
            </a>
            <a href="#events" className="hover:text-slate-900">
              Events
            </a>
            <a href="#resources" className="hover:text-slate-900">
              Resources
            </a>
            <button className="btn btn-secondary" onClick={()=>{navigate('/login')}} >Login</button>
            <Link className="btn btn-primary" to="/role-selection">
              Register
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-white via-blue-50/60 to-slate-50">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-extrabold text-brand-700">
                Buyer · Seller · Matchmaking
              </span>
              <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                Stronger Together.
                <br />
                <span className="text-brand-600">Smarter Supply Chains.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
                MSME Sangamam connects verified buyers with capable MSME
                suppliers through structured requirements, transparent
                matchmaking and accountable follow-up.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link className="btn btn-primary" to="/role-selection">
                  Buyer And Seller Register <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="card overflow-hidden p-2">
              <div className="grid min-h-80 place-items-center rounded-[.8rem] bg-gradient-to-br from-brand-50 to-slate-100 p-8 text-center">
                <div>
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-white shadow">
                    <Handshake className="h-10 w-10 text-brand-600" />
                  </div>
                  <h2 className="mt-5 text-xl font-extrabold text-slate-900">
                    Buyer–Seller Business Connect
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Requirements → verified supplier matches → meetings → RFQ →
                    conversion
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        {/* <section className="mx-auto -mt-3 grid max-w-7xl grid-cols-2 gap-3 px-4 md:grid-cols-5">
          {stats.map(([value, label, Icon]) => (
            <div className="card p-4" key={label}>
              <Icon className="h-5 w-5 text-brand-600" />
              <div className="mt-2 text-xl font-extrabold text-slate-900">
                {value}
              </div>
              <div className="text-[11px] font-semibold text-slate-500">
                {label}
              </div>
            </div>
          ))}
        </section> */}

        {/* Events Section */}
        <section id="events" className="mx-auto max-w-7xl px-4 py-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold">
                Upcoming & Ongoing Events
              </h2>
              <p className="text-xs text-slate-500">
                Buyer sourcing and MSME capability engagement.
              </p>
            </div>
            <a className="text-xs font-bold text-brand-600" href="#events">
              View all events →
            </a>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="card p-5">
              <Store className="h-6 w-6 text-brand-600" />
              <h3 className="mt-3 font-bold">
                MSME Sangamam Buyer & Seller Meet
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                18–19 September 2026 · Hosur
              </p>
            </div>

            <div className="card p-5">
              <Building2 className="h-6 w-6 text-brand-600" />
              <h3 className="mt-3 font-bold">
                Engineering Sourcing Conclave
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Precision manufacturing · Automotive · Fabrication
              </p>
            </div>

            <div className="card p-5">
              <Handshake className="h-6 w-6 text-brand-600" />
              <h3 className="mt-3 font-bold">
                Defence & Industrial Connect
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Structured capability discovery and B2B meetings
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}