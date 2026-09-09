import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Users,
  Store,
  Search,
  RefreshCw,
  Download,
  QrCode,
  Phone,
  Mail,
  Building2,
  MapPin,
  Briefcase,
  ExternalLink,
  Calendar,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  exhibitorApiClient,
  ExhibitorApiError,
  getExhibitorToken,
  setExhibitorSession
} from '../../data/api/exhibitorApiClient';

interface ConnectedVisitor {
  id: string;
  visitorId?: string | null;
  registrationNumber: string;
  visitorName: string | null;
  name?: string | null;
  companyName: string | null;
  designation?: string | null;
  visitorMobile: string | null;
  mobile?: string | null;
  visitorEmail: string | null;
  email?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  industryCategory?: string | null;
  createdAt: string;
  isRead: boolean;
}

interface ConnectedExhibitor {
  id: string;
  exhibitorId: string;
  registrationNumber: string;
  companyName: string;
  companyLogo?: string | null;
  fasciaName?: string | null;
  stallNumber?: string | null;
  contactPersonName?: string | null;
  contactPersonDesignation?: string | null;
  mobile?: string | null;
  email?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  industryCategory?: string | null;
  createdAt: string;
  isRead: boolean;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function getInitials(name: string | null | undefined): string {
  if (!name) return 'C';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'C';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function ExhibitorConnectionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'exhibitors' ? 'exhibitors' : 'visitors';

  const [activeTab, setActiveTab] = useState<'visitors' | 'exhibitors'>(initialTab);
  const [connectedVisitors, setConnectedVisitors] = useState<ConnectedVisitor[]>([]);
  const [connectedExhibitors, setConnectedExhibitors] = useState<ConnectedExhibitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const loadConnections = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      try {
        const res = await exhibitorApiClient.get<{
          totalConnections: number;
          connectedVisitors?: ConnectedVisitor[];
          connectedExhibitors?: ConnectedExhibitor[];
          connections?: ConnectedVisitor[];
        }>('/exhibitor/connections');

        setConnectedVisitors(
          Array.isArray(res.connectedVisitors)
            ? res.connectedVisitors
            : Array.isArray(res.connections)
            ? res.connections
            : []
        );

        setConnectedExhibitors(
          Array.isArray(res.connectedExhibitors) ? res.connectedExhibitors : []
        );
      } catch (err) {
        if (err instanceof ExhibitorApiError) {
          if (err.status === 401) {
            setExhibitorSession(null, null);
            navigate('/exhibitor/login');
            return;
          }
          if (err.status === 404) {
            setConnectedVisitors([]);
            setConnectedExhibitors([]);
            return;
          }
        }
        setError(err instanceof ExhibitorApiError ? err.message : 'Could not load connections.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (!getExhibitorToken()) {
      navigate('/exhibitor/login');
      return;
    }
    loadConnections();
  }, [loadConnections, navigate]);

  const handleTabSwitch = (tab: 'visitors' | 'exhibitors') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Filtered lists
  const filteredVisitors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return connectedVisitors;
    return connectedVisitors.filter((item) => {
      const name = item.name || item.visitorName;
      const mobile = item.mobile || item.visitorMobile;
      const email = item.email || item.visitorEmail;
      return (
        (name && name.toLowerCase().includes(q)) ||
        (item.companyName && item.companyName.toLowerCase().includes(q)) ||
        (item.registrationNumber && item.registrationNumber.toLowerCase().includes(q)) ||
        (mobile && mobile.includes(q)) ||
        (email && email.toLowerCase().includes(q)) ||
        (item.city && item.city.toLowerCase().includes(q)) ||
        (item.industryCategory && item.industryCategory.toLowerCase().includes(q))
      );
    });
  }, [connectedVisitors, searchQuery]);

  const filteredExhibitors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return connectedExhibitors;
    return connectedExhibitors.filter((item) => {
      return (
        (item.companyName && item.companyName.toLowerCase().includes(q)) ||
        (item.fasciaName && item.fasciaName.toLowerCase().includes(q)) ||
        (item.contactPersonName && item.contactPersonName.toLowerCase().includes(q)) ||
        (item.stallNumber && item.stallNumber.toLowerCase().includes(q)) ||
        (item.registrationNumber && item.registrationNumber.toLowerCase().includes(q)) ||
        (item.mobile && item.mobile.includes(q)) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.city && item.city.toLowerCase().includes(q)) ||
        (item.industryCategory && item.industryCategory.toLowerCase().includes(q))
      );
    });
  }, [connectedExhibitors, searchQuery]);

  // Export CSV
  const handleExportCsv = () => {
    if (activeTab === 'visitors') {
      if (filteredVisitors.length === 0) return;
      const headers = ['Registration Number', 'Visitor Name', 'Company Name', 'Designation', 'Mobile', 'Email', 'City', 'Industry Category', 'Connected At'];
      const rows = filteredVisitors.map((v) => [
        `"${v.registrationNumber}"`,
        `"${(v.name || v.visitorName || '').replace(/"/g, '""')}"`,
        `"${(v.companyName || '').replace(/"/g, '""')}"`,
        `"${(v.designation || '').replace(/"/g, '""')}"`,
        `"${v.mobile || v.visitorMobile || ''}"`,
        `"${v.email || v.visitorEmail || ''}"`,
        `"${v.city || ''}"`,
        `"${(v.industryCategory || '').replace(/"/g, '""')}"`,
        `"${new Date(v.createdAt).toLocaleString()}"`
      ]);
      downloadCsvFile('exhibitor-connected-visitors.csv', [headers.join(','), ...rows.map(r => r.join(','))].join('\n'));
    } else {
      if (filteredExhibitors.length === 0) return;
      const headers = ['Stall Number', 'Registration Number', 'Company Name', 'Fascia Name', 'Contact Person', 'Mobile', 'Email', 'City', 'Industry Category', 'Connected At'];
      const rows = filteredExhibitors.map((e) => [
        `"${e.stallNumber || ''}"`,
        `"${e.registrationNumber}"`,
        `"${(e.companyName || '').replace(/"/g, '""')}"`,
        `"${(e.fasciaName || '').replace(/"/g, '""')}"`,
        `"${(e.contactPersonName || '').replace(/"/g, '""')}"`,
        `"${e.mobile || ''}"`,
        `"${e.email || ''}"`,
        `"${e.city || ''}"`,
        `"${(e.industryCategory || '').replace(/"/g, '""')}"`,
        `"${new Date(e.createdAt).toLocaleString()}"`
      ]);
      downloadCsvFile('exhibitor-connected-exhibitors.csv', [headers.join(','), ...rows.map(r => r.join(','))].join('\n'));
    }
  };

  const totalConnections = connectedVisitors.length + connectedExhibitors.length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Users size={22} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Visitor & Exhibitor Connections
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Contacts captured by scanning visitor pass QR codes and visiting other exhibitor stalls.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => loadConnections(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            title="Refresh Connections"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh List
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={activeTab === 'visitors' ? filteredVisitors.length === 0 : filteredExhibitors.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
          >
            <Download size={14} />
            Export {activeTab === 'visitors' ? 'Visitors' : 'Exhibitors'} CSV
          </button>

          <Link
            to="/exhibitorShell/Scanner"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-orange-500 active:scale-95"
          >
            <QrCode size={15} />
            Scan QR
          </Link>
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-900">Unable to load connections</h3>
              <p className="mt-1 text-xs text-red-700 leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={() => loadConnections()}
                className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TWO MENUS / TABS (Visitors vs Exhibitors) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-2">
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => handleTabSwitch('visitors')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === 'visitors'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={15} />
            Connected Visitors
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                activeTab === 'visitors'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {connectedVisitors.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('exhibitors')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === 'exhibitors'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store size={15} />
            Connected Exhibitors
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                activeTab === 'exhibitors'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {connectedExhibitors.length}
            </span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder={activeTab === 'visitors' ? 'Search visitors by name or pass...' : 'Search exhibitors by company or stall...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* CONTENT LIST */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" />
          ))}
        </div>
      ) : activeTab === 'visitors' ? (
        /* VISITORS TAB */
        filteredVisitors.length === 0 ? (
          <EmptyState
            title="No Scanned Visitors Yet"
            description={
              searchQuery
                ? `No visitors match "${searchQuery}". Try clearing your search filter.`
                : "You haven't scanned any visitor pass QR codes yet. Open the camera scanner to capture verified leads instantly!"
            }
            onScan={() => navigate('/exhibitorShell/Scanner')}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVisitors.map((visitor) => (
              <VisitorCard key={visitor.id} visitor={visitor} />
            ))}
          </div>
        )
      ) : (
        /* EXHIBITORS TAB */
        filteredExhibitors.length === 0 ? (
          <EmptyState
            title="No Connected Exhibitors Yet"
            description={
              searchQuery
                ? `No exhibitors match "${searchQuery}". Try clearing your search filter.`
                : "You haven't connected with other exhibitors yet. Open the scanner and scan other stalls' QR codes to save their contact details!"
            }
            onScan={() => navigate('/exhibitorShell/Scanner')}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredExhibitors.map((exhibitor) => (
              <ExhibitorCard key={exhibitor.id} exhibitor={exhibitor} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Visitor Card Component
// ----------------------------------------------------------------------
function VisitorCard({ visitor }: { visitor: ConnectedVisitor }) {
  const visitorName = visitor.name || visitor.visitorName || 'Visitor';
  const mobile = visitor.mobile || visitor.visitorMobile;
  const email = visitor.email || visitor.visitorEmail;

  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="p-5 space-y-3.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-base font-extrabold text-orange-700">
              {getInitials(visitorName)}
            </div>

            <div>
              <h3 className="font-bold text-slate-900 leading-tight">
                {visitorName}
              </h3>
              {visitor.companyName && (
                <p className="text-xs text-slate-600 font-medium">{visitor.companyName}</p>
              )}
            </div>
          </div>

          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-600 border border-slate-200">
            {visitor.registrationNumber}
          </span>
        </div>

        {/* Details list */}
        <div className="space-y-1.5 text-xs text-slate-600">
          {visitor.designation && (
            <div className="flex items-center gap-2">
              <Briefcase size={13} className="text-slate-400 shrink-0" />
              <span>{visitor.designation}</span>
            </div>
          )}

          {(visitor.city || visitor.district) && (
            <div className="flex items-center gap-2">
              <MapPin size={13} className="text-slate-400 shrink-0" />
              <span>{[visitor.city, visitor.district, visitor.state].filter(Boolean).join(', ')}</span>
            </div>
          )}

          {visitor.industryCategory && (
            <div className="pt-1">
              <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                {visitor.industryCategory}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
            <Calendar size={12} />
            <span>Connected {timeAgo(visitor.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-slate-100 bg-slate-50 p-3">
        <div className="grid grid-cols-2 gap-2">
          {mobile ? (
            <a
              href={`tel:${mobile}`}
              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition"
            >
              <Phone size={13} /> Call
            </a>
          ) : (
            <span className="py-1.5 px-2 bg-slate-100 text-slate-400 rounded-lg text-xs text-center font-bold opacity-50">
              Call
            </span>
          )}

          {email ? (
            <a
              href={`mailto:${email}`}
              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition"
            >
              <Mail size={13} /> Email
            </a>
          ) : (
            <span className="py-1.5 px-2 bg-slate-100 text-slate-400 rounded-lg text-xs text-center font-bold opacity-50">
              Email
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Exhibitor Card Component
// ----------------------------------------------------------------------
function ExhibitorCard({ exhibitor }: { exhibitor: ConnectedExhibitor }) {
  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="p-5 space-y-3.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {exhibitor.companyLogo ? (
              <img
                src={exhibitor.companyLogo}
                alt={exhibitor.companyName}
                className="h-11 w-11 rounded-xl border border-slate-100 object-contain p-1"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-base font-extrabold text-[#0B3B75]">
                {getInitials(exhibitor.companyName)}
              </div>
            )}

            <div>
              <h3 className="font-bold text-slate-900 leading-tight">
                {exhibitor.companyName}
              </h3>
              {exhibitor.fasciaName && exhibitor.fasciaName !== exhibitor.companyName && (
                <p className="text-xs text-slate-500">{exhibitor.fasciaName}</p>
              )}
            </div>
          </div>

          {exhibitor.stallNumber ? (
            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#0B3B75] border border-blue-200">
              Stall {exhibitor.stallNumber}
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              Exhibitor
            </span>
          )}
        </div>

        {/* Details list */}
        <div className="space-y-1.5 text-xs text-slate-600">
          {exhibitor.contactPersonName && (
            <div className="flex items-center gap-2">
              <Users size={13} className="text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-700">{exhibitor.contactPersonName}</span>
              {exhibitor.contactPersonDesignation && (
                <span className="text-slate-400">· {exhibitor.contactPersonDesignation}</span>
              )}
            </div>
          )}

          {exhibitor.city && (
            <div className="flex items-center gap-2">
              <MapPin size={13} className="text-slate-400 shrink-0" />
              <span>{[exhibitor.city, exhibitor.district, exhibitor.state].filter(Boolean).join(', ')}</span>
            </div>
          )}

          {exhibitor.industryCategory && (
            <div className="pt-1">
              <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                {exhibitor.industryCategory}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
            <Calendar size={12} />
            <span>Connected {timeAgo(exhibitor.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-slate-100 bg-slate-50 p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {exhibitor.mobile ? (
            <a
              href={`tel:${exhibitor.mobile}`}
              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition"
            >
              <Phone size={13} /> Call
            </a>
          ) : (
            <span className="py-1.5 px-2 bg-slate-100 text-slate-400 rounded-lg text-xs text-center font-bold opacity-50">
              Call
            </span>
          )}

          {exhibitor.email ? (
            <a
              href={`mailto:${exhibitor.email}`}
              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition"
            >
              <Mail size={13} /> Email
            </a>
          ) : (
            <span className="py-1.5 px-2 bg-slate-100 text-slate-400 rounded-lg text-xs text-center font-bold opacity-50">
              Email
            </span>
          )}
        </div>

        {exhibitor.registrationNumber && (
          <Link
            to={`/stall/${encodeURIComponent(exhibitor.registrationNumber)}`}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-[#0B3B75] hover:bg-blue-50 hover:border-blue-200 transition shadow-xs"
          >
            <ExternalLink size={13} /> View Stall Profile
          </Link>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Empty State Component
// ----------------------------------------------------------------------
function EmptyState({
  title,
  description,
  onScan
}: {
  title: string;
  description: string;
  onScan: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 mb-4">
        <QrCode size={30} />
      </div>
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      <p className="mt-2 max-w-md text-xs text-slate-500 leading-relaxed">{description}</p>
      <button
        type="button"
        onClick={onScan}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-orange-500 active:scale-95"
      >
        <QrCode size={16} />
        Scan QR Code Now
      </button>
    </div>
  );
}

function downloadCsvFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
