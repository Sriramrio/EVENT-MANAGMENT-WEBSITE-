import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  FileText,
  Handshake,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Star,
  Target,
  Users,
  ClipboardCheck,
  X,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import {
  useAppSelector,
  useAppDispatch,
} from "../../app/store/hooks";
import { setMobileNavOpen } from "../../app/store/uiSlice";
import { useRequirements } from "../../services/buyer/hooks";
import { SidebarDigitalPartnerFooter } from "../BaseComponents/SidebarDigitalPartnerFooter";

export function BuyerSidebar() {
  const open = useAppSelector((s) => s.ui.mobileNavOpen);
  const dispatch = useAppDispatch();
  const reqs = useRequirements();
  const firstReqId = reqs.data && reqs.data.length > 0 ? reqs.data[0].id : 'req-001';

  const nav = [
    ["Dashboard", "/buyer/dashboard", LayoutDashboard],
    ["Requirements", "/buyer/requirements", ClipboardList],
    ["Matches", `/buyer/requirements/${firstReqId}/matches`, Target],
    ["Shortlist", "/buyer/shortlist", Star],
    ["Meetings", "/buyer/meetings", CalendarDays],
    ["Meeting Outcomes", "/buyer/meeting-outcomes", ClipboardList],
    ["RFQs", "/buyer/rfqs", FileText],
    ["Actions", "/buyer/actions", ClipboardCheck],
    ["Contacts", "/buyer/contacts?from=settings", Users],
    ["Reports", "/buyer/reports", BarChart3],
    ["Messages", "/buyer/messages", MessageSquare],
    ["Settings", "/buyer/settings", Settings],
  ] as const;

  return (
    <>
      <button
        className={`fixed inset-0 z-40 bg-slate-950/40 lg:hidden ${
          open ? "block" : "hidden"
        }`}
        onClick={() => dispatch(setMobileNavOpen(false))}
        aria-label="Close navigation overlay"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-blue-900 text-white transition-transform lg:sticky lg:top-[4.5rem] lg:self-start lg:z-10 lg:h-[calc(100vh-4.5rem)] lg:w-64 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Mobile Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-4 lg:hidden">
            <span className="text-sm font-bold">
              Buyer Workspace
            </span>

            <button
              onClick={() => dispatch(setMobileNavOpen(false))}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav
            className="flex-1 overflow-y-auto p-3 scrollbar-hide"
            aria-label="Buyer portal navigation"
          >
            {nav.map(([label, to, Icon]) => (
              <NavLink
                key={label}
                to={to}
                end={true}
                onClick={() =>
                  dispatch(setMobileNavOpen(false))
                }
                className={({ isActive }) =>
                  `mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-blue-500 text-white shadow"
                      : "text-blue-50 hover:bg-white/10"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}

            {/* MSME Sangamam */}
            <div className="mx-0 mt-6 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Handshake className="h-4 w-4" />
                MSME Sangamam
              </div>

              <p className="mt-2 text-[10px] leading-4 text-blue-100">
                Buyer-Seller matchmaking workspace. Server
                permissions remain authoritative.
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