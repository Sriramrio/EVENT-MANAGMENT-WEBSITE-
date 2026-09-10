import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Phone,
  QrCode,
  Users,
  Store,
  Building2,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  IdCard,
} from 'lucide-react';
import {
  exhibitorApiClient,
  ExhibitorApiError,
  getExhibitorToken,
  setExhibitorSession,
} from '../../data/api/exhibitorApiClient';
import { StallProfilePage } from '../public/StallProfilePage';

export interface InterestRow {
  id: string;
  visitorName: string | null;
  visitorMobile: string | null;
  visitorEmail: string | null;
  createdAt: string;
  isRead: boolean;
}

export interface MeResponse {
  companyName: string;
  registrationNumber: string | null;
  stallNumber: string | null;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function ExhibitorDashboard() {
  const navigate = useNavigate();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [interests, setInterests] = useState<InterestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showStallProfileModal, setShowStallProfileModal] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [meData, interestsData] = await Promise.all([
        exhibitorApiClient.get<MeResponse>('/exhibitor/me'),
        exhibitorApiClient.get<{ interests: InterestRow[] }>('/exhibitor/interests'),
      ]);
      setMe(meData);
      setInterests(Array.isArray(interestsData.interests) ? interestsData.interests : []);
    } catch (err) {
      if (err instanceof ExhibitorApiError && err.status === 401) {
        setExhibitorSession(null, null);
        navigate('/exhibitor/login');
        return;
      }
      setError(err instanceof ExhibitorApiError ? err.message : 'Could not load your dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!getExhibitorToken()) {
      navigate('/exhibitor/login');
      return;
    }
    load();
  }, [load, navigate]);

  const totalInterests = interests.length;
  const todayInterests = interests.filter((item) => {
    const date = new Date(item.createdAt);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }).length;

  const unreadCount = interests.filter((i) => !i.isRead).length;

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Welcome Hero Banner */}
      <section className="rounded-2xl bg-[#0B3B75] p-6 text-white shadow-lg sm:p-8">
        <div className="max-w-2xl">
          <p className="mb-2 text-sm font-semibold text-blue-100">
            Welcome to MSME Sangamam · Exhibitor Portal
          </p>

          <h2 className="text-2xl font-extrabold sm:text-3xl">
            {me?.companyName ? `${me.companyName}` : 'Manage your stall & connect with visitors'}
          </h2>

          <p className="mt-3 text-sm leading-6 text-blue-100 sm:text-base">
            Track visitors who scanned your stall QR code, view their contact details, and save leads for post-event communication.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/exhibitorShell/Scanner"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-orange-600/30 transition hover:bg-orange-600 active:scale-95"
            >
              <QrCode size={18} />
              Scan Visitor Pass QR
            </Link>
            <Link
              to="/exhibitorShell/Connections"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0B3B75] shadow-sm transition hover:bg-blue-50"
            >
              <Users size={18} />
              Visitor Connections
            </Link>
            <Link
              to="/exhibitorShell/ECard"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-700/30 transition hover:bg-emerald-700 active:scale-95"
            >
              <IdCard size={18} />
              Download E-Card
            </Link>
            <Link
              to="/exhibitorShell/StallQr"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/25"
            >
              <QrCode size={18} />
              My Stall QR
            </Link>
            {me?.registrationNumber && (
              <button
                type="button"
                onClick={() => setShowStallProfileModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/25 cursor-pointer"
              >
                <Building2 size={18} />
                Public Stall Profile
              </button>
            )}
          </div>
        </div>
      </section>

      {/* COUNTS / STAT CARDS */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Interested Visitors"
          value={loading ? '—' : totalInterests}
          subtitle="Visitors interested"
          icon={<Heart size={22} />}
        />

        <StatCard
          title="Today's Interest"
          value={loading ? '—' : todayInterests}
          subtitle="Connected today"
          icon={<Users size={22} />}
        />

        <StatCard
          title="Stall Info"
          value={me?.stallNumber ? `Stall ${me.stallNumber}` : 'Allocated'}
          subtitle={me?.registrationNumber ?? 'Exhibitor Stall'}
          icon={<Store size={22} />}
        />

        <StatCard
          title="Stall QR Code"
          value="View QR"
          subtitle="Scan & Share"
          icon={<QrCode size={22} />}
          to="/exhibitorShell/StallQr"
        />
      </section>

      {/* QUICK ACTIONS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Quick Actions
            </h3>
            <p className="text-sm text-slate-500">
              Access the most useful exhibitor features
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <QuickAction
            href="/exhibitorShell/ECard"
            icon={<IdCard size={24} />}
            title="E-Card Download"
            description="Preview & download your official Stall E-Card or email it directly."
          />

          <QuickAction
            href="/exhibitorShell/Scanner"
            icon={<QrCode size={24} />}
            title="Scan Visitor QR"
            description="Scan visitor pass badges to quickly capture verified contact info."
          />

          <QuickAction
            href="/exhibitorShell/Connections"
            icon={<Users size={24} />}
            title="Visitor Connections"
            description="Manage all scanned visitors, download CSV and follow up."
            count={totalInterests}
          />

          <QuickAction
            href="/exhibitorShell/StallQr"
            icon={<QrCode size={24} />}
            title="My Stall QR Code"
            description="Display or download your stall QR code for visitor scanning."
          />

          <QuickAction
            onClick={() => setShowStallProfileModal(true)}
            icon={<Building2 size={24} />}
            title="Stall Profile Page"
            description="Preview your public exhibitor profile & product showcase."
          />
        </div>
      </section>

      {/* RECENT INTERESTED VISITORS */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900">
                Interested Visitors
              </h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-0.5 text-[11px] font-bold text-white">
                  <Sparkles size={11} /> {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Visitors who tapped "I'm Interested" on your stall QR
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B3B75] hover:underline disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <Link
              to="/exhibitorShell/Interests"
              className="inline-flex items-center gap-1 text-sm font-bold text-[#0B3B75] hover:underline"
            >
              View all
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {error && (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {!loading && interests.length === 0 && !error && (
            <div className="px-6 py-12 text-center">
              <Heart size={38} className="mx-auto text-slate-300" />
              <p className="mt-3 font-semibold text-slate-700">
                No interested visitors yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Once a visitor scans your stall QR and taps "I'm Interested", they will appear here.
              </p>
            </div>
          )}

          {interests.slice(0, 6).map((item) => {
            const displayName = item.visitorName || 'Visitor';
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-4 px-5 py-4 sm:px-6 transition ${item.isRead ? '' : 'bg-blue-50/40'
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-black ${item.isRead ? 'bg-slate-100 text-slate-500' : 'bg-[#0B3B75] text-white'
                      }`}
                  >
                    {item.visitorName ? initials(item.visitorName) : <Heart size={18} />}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">
                      {displayName}
                    </p>
                    {item.visitorMobile ? (
                      <a
                        href={`tel:${item.visitorMobile}`}
                        className="mt-0.5 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                      >
                        <Phone size={12} /> {item.visitorMobile}
                      </a>
                    ) : (
                      <p className="mt-0.5 text-xs text-slate-400">No contact shared</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="hidden text-xs text-slate-400 sm:block">
                    {timeAgo(item.createdAt)}
                  </span>
                  {item.isRead ? (
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stall Profile Preview Modal */}
      {showStallProfileModal && me?.registrationNumber && (
        <StallProfilePage
          registrationNumber={me.registrationNumber}
          isModal={true}
          isPreview={true}
          onClose={() => setShowStallProfileModal(false)}
        />
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  to,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  to?: string;
}) {
  const content = (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {subtitle}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0B3B75]">
          {icon}
        </div>
      </div>
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }

  return content;
}

function QuickAction({
  href,
  onClick,
  icon,
  title,
  description,
  count,
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  count?: number;
}) {
  const content = (
    <div className="flex h-full flex-col justify-between">
      {/* Top row: Icon on left, Count on right */}
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0B3B75] transition group-hover:bg-[#0B3B75] group-hover:text-white">
          {icon}
        </div>

        {typeof count === 'number' && (
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#0B3B75]">
            {count}
          </span>
        )}
      </div>

      {/* Bottom area: Title & Description */}
      <div className="mt-4 flex flex-1 flex-col justify-start">
        <h4 className="font-bold text-slate-900 transition group-hover:text-[#0B3B75]">
          {title}
        </h4>

        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );

  const cardStyle =
    "group flex h-full w-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md text-left cursor-pointer";

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cardStyle}>
        {content}
      </button>
    );
  }

  return (
    <Link to={href || '#'} className={cardStyle}>
      {content}
    </Link>
  );
}

export default ExhibitorDashboard;
