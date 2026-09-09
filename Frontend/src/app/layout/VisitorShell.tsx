import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  QrCode,
  Users,
  Ticket,
  UserRound,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { getVisitorProfile, setVisitorSession } from '../../data/api/visitorApiClient';
import { getMenuForVisitorPortal } from '../../config/menuConfig';
import { useSession } from '../session';
import { SidebarDigitalPartnerFooter } from '../../components/BaseComponents/SidebarDigitalPartnerFooter';

export function VisitorShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Public Visitor Session
  const visitor = getVisitorProfile();
  
  // Admin Session
  const { user, setUser, hasPermission } = useSession();
  const isAdmin = user !== null;

  const displayName = isAdmin ? user.fullName : (visitor?.contactPersonName || visitor?.legalName || 'Visitor');
  const initial = displayName.charAt(0).toUpperCase();

  // Dynamic menu for Admins, hardcoded for Public Visitors
  const adminMenuItems = getMenuForVisitorPortal(hasPermission).map(m => ({
    label: m.label,
    path: m.path,
    icon: m.label === 'Visitors' ? Users : LayoutDashboard
  }));

  const publicMenuItems = [
    { label: 'Dashboard', path: '/visitorShell/Dashboard', icon: LayoutDashboard },
    { label: 'QR Scanner', path: '/visitorShell/Scanner', icon: QrCode },
    { label: 'My Connections', path: '/visitorShell/Connections', icon: Users },
    { label: 'My Pass', path: '/visitorShell/Pass', icon: Ticket },
    { label: 'My Profile', path: '/visitorShell/Profile', icon: UserRound },
  ];

  const menuItems = isAdmin ? adminMenuItems : publicMenuItems;

  const handleLogout = () => {
    if (isAdmin) {
      setUser(null);
    }
    setVisitorSession(null, null);
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="fixed left-0 right-0 top-0 z-50 h-16 border-b border-slate-200 bg-white">
        <div className="flex h-full items-center justify-between px-4 lg:px-6">
          <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-4">
            <div className="flex h-12 items-center gap-3">
              <img src={`${import.meta.env.BASE_URL}brand/msme-sangamam-logo.png`} alt="MSME Sangamam" className="h-12 w-auto object-contain" />
              <img src={`${import.meta.env.BASE_URL}brand/lub-logo.jpg`} alt="LUB" className="h-10 w-auto object-contain" />
            </div>
            <div className="hidden sm:block border-l pl-4 border-slate-200">
              <h1 className="text-base font-bold text-[#0B3B75]">MSME Sangamam</h1>
              <p className="text-xs text-slate-500">Visitor Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 sm:inline-flex">
              {displayName} · {visitor?.registrationNumber ?? 'Visitor'}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="btn-secondary text-xs sm:text-sm py-1.5 px-3 sm:px-4"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <aside
        className={`
          fixed left-0 top-16 z-40 h-[calc(100vh-4rem)]
          w-64 border-r border-slate-200 bg-white
          transition-transform duration-200
          lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex h-full flex-col">
          <nav className="flex-1 space-y-1 px-3 py-5">
            <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Visitor Menu</p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `
                    group flex items-center gap-3 rounded-xl px-3 py-3
                    text-sm font-medium transition-all
                    ${isActive ? 'bg-[#0B3B75] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-[#0B3B75]'}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-[#0B3B75]'}`} />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-3">
            <SidebarDigitalPartnerFooter />
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 top-16 z-30 bg-black/30 lg:hidden" />
      )}

      <main className="min-h-screen pt-16 lg:pl-64">
        <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}