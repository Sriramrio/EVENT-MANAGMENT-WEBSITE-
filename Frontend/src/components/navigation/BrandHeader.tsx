import {
  Bell,
  HelpCircle,
  Menu,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAppDispatch } from '../../app/store/hooks';
import { setMobileNavOpen } from '../../app/store/uiSlice';
import {
  useBuyerSession,
  useNotifications,
} from '../../services/buyer/hooks';
import { useSellerSession } from '../../services/seller/hooks';
import { Button } from '../ui/Button';
import { BRAND } from '../../config/brand';
import { useEffect, useState, useRef } from 'react';

export function BrandHeader({
  title,
  subtitle,
  stepBadge,
  showSession = true,
}: {
  title?: string;
  subtitle?: string;
  stepBadge?: string;
  showSession?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const isSellerPortal = location.pathname.startsWith('/seller');
  const { data: buyerSession, error: buyerSessionError, isError: isBuyerError } = useBuyerSession(!isSellerPortal && showSession);
  const { data: sellerSession } = useSellerSession();
  const session = isSellerPortal ? sellerSession : buyerSession;
  const isError = isSellerPortal ? false : isBuyerError;
  const sessionError = buyerSessionError;
  const { data: notes } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set(
    JSON.parse(localStorage.getItem('readNotifications') || '[]')
  ));
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
  if (isError) {
    const status = (sessionError as any)?.response?.status;
    if (status === 401 || status === 403) {
      handleLogout();
    }
  }
}, [isError, sessionError]);
  const unread =
    notes?.filter((n: any) => !n.read && !readNotificationIds.has(n.id)).length ??
    session?.unreadNotifications ??
    0;

  const initials = (session?.displayName ?? 'Buyer')
    .split(' ')
    .map((x) => x[0])
    .join('')
    .slice(0, 2);

  const handleLogout = async () => {
    try {
      // 1. Optional: Invalidate token on the backend server
      // await apiClient.post('/api/v1/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      // 2. Clear all local & session storage auth keys
      localStorage.removeItem('buyerToken');
      localStorage.removeItem('buyerSession');
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      sessionStorage.clear();

      // 3. Clear cookie tokens if stored as non-HttpOnly
      document.cookie = 'token=; Max-Age=0; path=/;';
      document.cookie = 'buyerToken=; Max-Age=0; path=/;';

      // 4. Wipe React Query cache so no cached session remains in memory
      queryClient.removeQueries();
      queryClient.clear();

      // 5. Optional: dispatch Redux logout action if you have an auth slice
      // dispatch(logout());

      // 6. Redirect to public home / login screen
      navigate('/', { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-18 items-center justify-between gap-4 px-4 md:px-6">

        {/* LEFT */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            className="rounded-lg p-2 text-slate-600 lg:hidden"
            aria-label="Open navigation"
            onClick={() => dispatch(setMobileNavOpen(true))}
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="flex items-center gap-3">
            <img
              src={BRAND.lubLogoUrl}
              alt="Laghu Udyog Bharati logo"
              className="h-12 w-auto object-contain"
            />

            <div className="h-9 w-px bg-slate-200" />

            <img
              src={BRAND.msmeLogoUrl}
              alt="MSME Sangamam logo"
              className="h-12 w-auto object-contain"
            />
          </Link>

          {title && (
            <>
              <div className="hidden h-9 w-px bg-slate-200 md:block" />

              <div className="hidden min-w-0 md:block">
                <h1 className="truncate text-sm font-extrabold text-slate-900">
                  {title}
                </h1>

                {subtitle && (
                  <p className="truncate text-xs text-slate-500">
                    {subtitle}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">

          {stepBadge && (
            <span className="hidden rounded-lg border border-brand-100 bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700 sm:inline">
              {stepBadge}
            </span>
          )}

          <Button
            variant="ghost"
            className="!p-2"
            aria-label="Help"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-50"
              aria-label={`${unread} unread notifications`}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-5 w-5" />

              {unread > 0 && (
                <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <h3 className="text-sm font-extrabold text-slate-900">Notifications</h3>
                  {unread > 0 && (
                    <button
                      onClick={() => {
                        const allIds = notes?.map((n: any) => n.id) || [];
                        const newReadIds = new Set([...readNotificationIds, ...allIds]);
                        setReadNotificationIds(newReadIds);
                        localStorage.setItem('readNotifications', JSON.stringify([...newReadIds]));
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto p-2">
                  {!notes || notes.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">No new notifications</div>
                  ) : (
                    notes.map((n: any) => {
                      const isRead = n.read || readNotificationIds.has(n.id);
                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (n.href && n.href !== '#') {
                              navigate(n.href);
                              setShowNotifications(false);
                            }
                          }}
                          className={`mb-1 flex items-start gap-3 rounded-lg p-3 transition hover:bg-slate-50 cursor-pointer ${isRead ? 'opacity-60' : 'bg-blue-50/50'}`}
                        >
                          <div className="mt-0.5 shrink-0">
                            <span className={`block h-2 w-2 rounded-full ${isRead ? 'bg-slate-300' : 'bg-blue-600'}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs ${isRead ? 'text-slate-600 font-medium' : 'text-slate-900 font-bold'}`}>
                              {n.title}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              {new Date(n.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const newReadIds = new Set(readNotificationIds);
                              if (isRead) {
                                newReadIds.delete(n.id);
                              } else {
                                newReadIds.add(n.id);
                              }
                              setReadNotificationIds(newReadIds);
                              localStorage.setItem('readNotifications', JSON.stringify([...newReadIds]));
                            }}
                            className="shrink-0 rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-200"
                          >
                            {isRead ? 'Mark unread' : 'Mark read'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {showSession && (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 sm:inline-flex">
                {session?.displayName ?? (isSellerPortal ? 'Seller' : 'Buyer')} · {session?.role ?? (isSellerPortal ? 'Seller' : 'Buyer')}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                className="btn-secondary text-xs sm:text-sm py-1.5 px-3 sm:px-4"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}