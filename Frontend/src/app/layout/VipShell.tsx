import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useSession } from '../session';
import { getMenuForQrPortal, getMenuForVipPortal, getMenuItems } from '../../config/menuConfig';
import { BRAND } from '../../config/brand';
import { BrandHeader } from '../../shared/components/BrandHeader';
import { SidebarDigitalPartnerFooter } from '../../components/BaseComponents/SidebarDigitalPartnerFooter';

export function VipShell() {
  const { user, setUser, hasPermission } = useSession();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const items = getMenuForVipPortal(hasPermission);

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = item.group ?? 'Main';
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});

  const logout = () => {
    setUser(null);
    navigate('/login');
  };

  const SidebarContent = () => (
    <>
      <div className="flex h-full flex-col justify-between">
        <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
          <BrandHeader compact />
        </div>

        <div className="mt-4 rounded-2xl bg-msme-blue p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">
            {BRAND.portalName}
          </p>
          <h1 className="mt-1 text-lg font-bold">{BRAND.eventName}</h1>
          <p className="mt-2 text-xs text-blue-100">
            VIP Portal
          </p>
        </div>

        <nav className="mt-6 space-y-5">
          {Object.entries(grouped).map(([group, groupItems]) => (
            <div key={group}>
              <p className="px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {group}
              </p>

              <div className="mt-2 space-y-1">
                {groupItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive
                        ? 'bg-blue-50 text-msme-blue ring-1 ring-blue-100'
                        : 'text-slate-700 hover:bg-slate-100'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <SidebarDigitalPartnerFooter />
      </div>

    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden overflow-y-auto border-r border-slate-200 bg-white p-5 lg:block lg:w-80">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] overflow-y-auto border-r border-slate-200 bg-white p-5 transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700">Menu</p>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <SidebarContent />
      </aside>

      <main className="lg:pl-80">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                {BRAND.eventName}
              </p>
              <p className="text-xs text-slate-500">LUB MSME HOSUR</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {user && (
              <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 sm:inline-flex">
                {user.fullName} · {user.roleCode}
              </span>

            )}

            <button className="btn-secondary" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <section className="p-4 sm:p-6">
          <Outlet />
        </section>
      </main>
    </div>
  );
}