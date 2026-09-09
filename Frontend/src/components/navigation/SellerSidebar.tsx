import {
  Award,
  BarChart3,
  CalendarDays,
  FileText,
  Handshake,
  LayoutDashboard,
  MessageSquare,
  PackageCheck,
  Settings,
  Target,
  Users,
  ClipboardList,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../app/store/hooks';
import { setMobileNavOpen } from '../../app/store/uiSlice';
import { SidebarDigitalPartnerFooter } from '../BaseComponents/SidebarDigitalPartnerFooter';

const nav = [
  ['Dashboard', '/seller/dashboard', LayoutDashboard],
  ['Capabilities', '/seller/capabilities', PackageCheck],
  ['Contacts', '/seller/contacts?from=settings', Users],
  ['Opportunities', '/seller/opportunities', Target],
  ['Meetings', '/seller/meetings', CalendarDays],
  ['Meeting Outcomes', '/seller/meeting-outcomes', ClipboardList],
  ['Messages', '/seller/messages', MessageSquare],
  ['RFQs & Quotations', '/seller/rfqs', FileText],
  ['Negotiations', '/seller/negotiations', Handshake],
  ['Awards / POs', '/seller/awards', Award],
  ['Reports', '/seller/reports', BarChart3],
  ['Settings', '/seller/settings', Settings],
] as const;

export function SellerSidebar() {
  const open = useAppSelector((s) => s.ui.mobileNavOpen);
  const dispatch = useAppDispatch();

  return (
    <>
      <button
        className={`fixed inset-0 z-40 bg-slate-950/40 lg:hidden ${
          open ? 'block' : 'hidden'
        }`}
        onClick={() => dispatch(setMobileNavOpen(false))}
        aria-label="Close navigation overlay"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-blue-950 text-white transition-transform lg:sticky lg:top-[4.5rem] lg:self-start lg:z-10 lg:h-[calc(100vh-4.5rem)] lg:w-64 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Mobile Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-4 lg:hidden">
            <span className="text-sm font-bold">Seller Workspace</span>
            <button
              onClick={() => dispatch(setMobileNavOpen(false))}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav
            className="flex-1 overflow-y-auto p-3 scrollbar-hide"
            aria-label="Seller portal navigation"
          >
            {nav.map(([label, to, Icon]) => (
              <NavLink
                key={label}
                to={to}
                end={true}
                onClick={() => dispatch(setMobileNavOpen(false))}
                className={({ isActive }) =>
                  `mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-500 text-white shadow'
                      : 'text-blue-50 hover:bg-white/10'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}

            {/* MSME Sangamam Card */}
            <div className="mx-0 mt-6 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Handshake className="h-4 w-4" />
                MSME Sangamam
              </div>
              <p className="mt-2 text-[10px] leading-4 text-blue-100">
                Seller matchmaking workspace with server-authoritative permissions.
              </p>
            </div>
          </nav>

          {/* Digital Partner & Support Helpline Branding */}
          <div className="shrink-0 p-3">
            <SidebarDigitalPartnerFooter />
          </div>
        </div>
      </aside>
    </>
  );
}

export default SellerSidebar;