import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Menu, X } from 'lucide-react';
import { useSession } from '../session';
import { getMenuItems } from '../../config/menuConfig';
import { BRAND } from '../../config/brand';
import { BrandHeader } from '../../shared/components/BrandHeader';
import { apiClient } from '../../data/api/apiClient';
import { repositories } from '../../data/repositoryFactory';
import { appConfig } from '../../config/appConfig';
import { SidebarDigitalPartnerFooter } from '../../components/BaseComponents/SidebarDigitalPartnerFooter';

import { PERMISSIONS } from '../../config/permissions';

export function AdminShell() {
  const { user, setUser, hasPermission } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const queryClient = useQueryClient();

  const desktopNavRef = useRef<HTMLElement>(null);
  const activeDesktopLinkRef = useRef<HTMLAnchorElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const activeMobileLinkRef = useRef<HTMLAnchorElement>(null);

  // Background prefetch all core admin data so menu navigation is instant (0ms)
  useEffect(() => {
    if (!user) return;

    // Prefetch Exhibitor Management data if user has permission
    if (hasPermission(PERMISSIONS.exhibitorRequirementsManage) || user.roleCode === 'ExhibitorAdmin' || user.roleCode === 'SuperAdmin') {
      void queryClient.prefetchQuery({
        queryKey: ['admin', 'exhibitors'],
        queryFn: () => apiClient.get('/admin/exhibitors'),
        staleTime: 60_000,
      });

      void queryClient.prefetchQuery({
        queryKey: ['admin', 'exhibitor-requirements'],
        queryFn: () => apiClient.get('/admin/exhibitor-requirements'),
        staleTime: 60_000,
      });

      void queryClient.prefetchQuery({
        queryKey: ['admin', 'additional-requirement-items'],
        queryFn: () => apiClient.get('/admin/additional-requirement-items'),
        staleTime: 5 * 60_000,
      });

      void queryClient.prefetchQuery({
        queryKey: ['admin', 'exhibitor-requirements-feature-status'],
        queryFn: () => apiClient.get('/admin/exhibitor-requirements/feature-status'),
        staleTime: 5 * 60_000,
      });

      void queryClient.prefetchQuery({
        queryKey: ['admin', 'email-templates'],
        queryFn: () => apiClient.get('/admin/email-templates'),
        staleTime: 5 * 60_000,
      });
    }

    // Prefetch core booking, stall, and financial data only for roles with access
    if (user.roleCode !== 'BuyerAdmin' && user.roleCode !== 'SellerAdmin' && user.roleCode !== 'ExhibitorAdmin') {
      void queryClient.prefetchQuery({
        queryKey: ['admin', 'bookings'],
        queryFn: () => apiClient.get('/admin/events/current/bookings'),
        staleTime: 60_000,
      });

      void queryClient.prefetchQuery({
        queryKey: ['admin', 'stalls'],
        queryFn: () => repositories.stalls.list(),
        staleTime: 5 * 60_000,
      });

      void queryClient.prefetchQuery({
        queryKey: ['public', 'stall-sizes'],
        queryFn: () => apiClient.get(`/public/events/${appConfig.defaultEventCode}/stall-sizes`),
        staleTime: 10 * 60_000,
      });

      void queryClient.prefetchQuery({
        queryKey: ['admin', 'sponsor-stalls'],
        queryFn: () => apiClient.get('/admin/events/current/sponsor-stalls'),
        staleTime: 5 * 60_000,
      });

      void queryClient.prefetchQuery({
        queryKey: ['admin', 'payment-summaries'],
        queryFn: () => apiClient.get('/admin/events/current/bookings/payment-summaries'),
        staleTime: 60_000,
      });

      void queryClient.prefetchQuery({
        queryKey: ['admin', 'invoices'],
        queryFn: () => repositories.invoices.list(),
        staleTime: 60_000,
      });

      void queryClient.prefetchQuery({
        queryKey: ['admin', 'audit-logs'],
        queryFn: () => repositories.audit.list(),
        staleTime: 60_000,
      });

      void queryClient.prefetchQuery({
        queryKey: ['admin', 'email-logs'],
        queryFn: () => repositories.emails.list(),
        staleTime: 60_000,
      });

      void queryClient.prefetchQuery({
        queryKey: ['admin', 'dashboard-summary'],
        queryFn: () => repositories.dashboard.summary(),
        staleTime: 60_000,
      });

      void queryClient.prefetchQuery({
        queryKey: ['admin', 'marketplace-summary'],
        queryFn: () => apiClient.get('/marketplace/dashboard/admin-summary').catch(() => null),
        staleTime: 60_000,
      });

      void queryClient.prefetchQuery({
        queryKey: ['admin', 'email-templates'],
        queryFn: () => apiClient.get('/admin/email-templates'),
        staleTime: 5 * 60_000,
      });
    }
  }, [user, hasPermission, queryClient]);

  const items = useMemo(() => getMenuItems(hasPermission, user?.roleCode), [hasPermission, user?.roleCode]);

  const grouped = useMemo(() => {
    return items.reduce<Record<string, typeof items>>((acc, item) => {
      const key = item.group ?? 'Main';
      acc[key] = acc[key] ?? [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [items]);

  // Keep the active menu item in view when navigating
  useLayoutEffect(() => {
    if (activeDesktopLinkRef.current) {
      activeDesktopLinkRef.current.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [location.pathname]);

  const logout = () => {
    setUser(null);
    navigate('/login');
  };

  const renderNavItems = (isMobile: boolean) => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm shrink-0">
        <BrandHeader compact />
      </div>

      {/* Portal Info */}
      <div className="mt-4 rounded-2xl bg-msme-blue p-4 text-white shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">
          {BRAND.portalName}
        </p>

        <h1 className="mt-1 text-lg font-bold">
          {BRAND.eventName}
        </h1>

        <p className="mt-2 text-xs text-blue-100">
          Public booking · stall allocation · payment · proforma invoice
        </p>
      </div>

      {/* Navigation - only this area scrolls smoothly without resetting */}
      <nav
        ref={isMobile ? mobileNavRef : desktopNavRef}
        className="mt-6 flex-1 overflow-y-auto space-y-5 pr-1"
      >
        {Object.entries(grouped).map(([group, groupItems]) => (
          <div key={group}>
            <p className="px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {group}
            </p>

            <div className="mt-2 space-y-1">
              {groupItems.map((item) => {
                const isExactActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    ref={isExactActive ? (isMobile ? activeMobileLinkRef : activeDesktopLinkRef) : undefined}
                    onClick={() => {
                      if (isMobile) setSidebarOpen(false);
                    }}
                    className={({ isActive }) =>
                      `block rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive
                        ? 'bg-blue-50 text-msme-blue ring-1 ring-blue-100 font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Digital Partner & Support - fixed at bottom */}
      <SidebarDigitalPartnerFooter />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden overflow-hidden border-r border-slate-200 bg-white p-5 lg:block lg:w-80">
        {renderNavItems(false)}
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
        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] overflow-hidden border-r border-slate-200 bg-white p-5 transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
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

        {renderNavItems(true)}
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