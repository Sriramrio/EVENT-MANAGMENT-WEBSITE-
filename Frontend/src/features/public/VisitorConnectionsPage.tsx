import {
  Building2,
  Store,
  Users,
  UserCheck,
  Download,
  Mail,
  MapPin,
  Phone,
  QrCode,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  LogIn,
  Search,
  Briefcase,
  CalendarDays
} from 'lucide-react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { appConfig } from '../../config/appConfig';
import { getVisitorProfile, getVisitorToken } from '../../data/api/visitorApiClient';

interface ConnectedExhibitor {
  id?: string;
  exhibitorId: string;
  companyName: string;
  companyLogo?: string | null;
  industryCategory?: string | null;
  contactPersonName?: string | null;
  contactPersonDesignation?: string | null;
  mobile?: string | null;
  email?: string | null;
  stallNumber?: string | null;
  fasciaName?: string | null;
  registrationNumber?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  connectedAt: string;
}

interface ConnectedVisitor {
  id?: string;
  visitorId: string;
  registrationNumber: string;
  name: string;
  companyName?: string | null;
  designation?: string | null;
  mobile?: string | null;
  email?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  industryCategory?: string | null;
  connectedAt: string;
}

const API_BASE_URL = appConfig.apiBaseUrl;

export function VisitorConnectionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'visitors' ? 'visitors' : 'exhibitors';

  const [activeTab, setActiveTab] = useState<'exhibitors' | 'visitors'>(initialTab);
  const [connectedExhibitors, setConnectedExhibitors] = useState<ConnectedExhibitor[]>([]);
  const [connectedVisitors, setConnectedVisitors] = useState<ConnectedVisitor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const getVisitorId = useCallback(() => {
    const profile = getVisitorProfile();
    if (profile?.visitorId) return profile.visitorId;

    const token = getVisitorToken();
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          return payload.visitorId || payload.sub || null;
        }
      } catch { }
    }
    return null;
  }, []);

  const loadConnections = useCallback(async (isRefresh = false) => {
    const visitorId = getVisitorId();

    if (!visitorId) {
      setError('Visitor session expired or not found. Please log in again to view your connections.');
      setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const token = getVisitorToken();
      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let response = await fetch(
        `${API_BASE_URL}/public/visitors/${visitorId}/connections`,
        { headers }
      );

      if (response.status === 404) {
        response = await fetch(
          `${API_BASE_URL}/visitors/${visitorId}/connections`,
          { headers }
        );
      }

      if (response.status === 404) {
        setConnectedExhibitors([]);
        setConnectedVisitors([]);
        return;
      }

      if (!response.ok) {
        let errorMsg = `Server returned status ${response.status}`;
        try {
          const errData = await response.json();
          if (errData?.message) errorMsg = errData.message;
        } catch {
          errorMsg = response.statusText ? `${response.status} ${response.statusText}` : errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setConnectedExhibitors(data);
        setConnectedVisitors([]);
      } else {
        setConnectedExhibitors(Array.isArray(data.connectedExhibitors) ? data.connectedExhibitors : []);
        setConnectedVisitors(Array.isArray(data.connectedVisitors) ? data.connectedVisitors : []);
      }
    } catch (err: any) {
      console.error('Visitor connections fetch error:', err);
      setError(err.message || 'Unable to connect to server. Please check your network connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getVisitorId]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleTabSwitch = (tab: 'exhibitors' | 'visitors') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Filtered lists
  const filteredExhibitors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return connectedExhibitors;
    return connectedExhibitors.filter((item) =>
      item.companyName?.toLowerCase().includes(q) ||
      item.fasciaName?.toLowerCase().includes(q) ||
      item.contactPersonName?.toLowerCase().includes(q) ||
      item.stallNumber?.toLowerCase().includes(q) ||
      item.mobile?.includes(q) ||
      item.email?.toLowerCase().includes(q) ||
      item.industryCategory?.toLowerCase().includes(q) ||
      item.city?.toLowerCase().includes(q)
    );
  }, [connectedExhibitors, searchQuery]);

  const filteredVisitors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return connectedVisitors;
    return connectedVisitors.filter((item) =>
      item.name?.toLowerCase().includes(q) ||
      item.companyName?.toLowerCase().includes(q) ||
      item.registrationNumber?.toLowerCase().includes(q) ||
      item.designation?.toLowerCase().includes(q) ||
      item.mobile?.includes(q) ||
      item.email?.toLowerCase().includes(q) ||
      item.industryCategory?.toLowerCase().includes(q) ||
      item.city?.toLowerCase().includes(q)
    );
  }, [connectedVisitors, searchQuery]);

  // Export CSV
  const handleExportCsv = () => {
    if (activeTab === 'exhibitors') {
      if (filteredExhibitors.length === 0) return;
      const headers = ['Stall Number', 'Company Name', 'Fascia Name', 'Contact Person', 'Mobile', 'Email', 'City', 'Industry Category', 'Connected At'];
      const rows = filteredExhibitors.map(e => [
        `"${e.stallNumber || ''}"`,
        `"${(e.companyName || '').replace(/"/g, '""')}"`,
        `"${(e.fasciaName || '').replace(/"/g, '""')}"`,
        `"${(e.contactPersonName || '').replace(/"/g, '""')}"`,
        `"${e.mobile || ''}"`,
        `"${e.email || ''}"`,
        `"${e.city || ''}"`,
        `"${(e.industryCategory || '').replace(/"/g, '""')}"`,
        `"${new Date(e.connectedAt).toLocaleString()}"`
      ]);
      downloadCsvFile('connected-exhibitors.csv', [headers.join(','), ...rows.map(r => r.join(','))].join('\n'));
    } else {
      if (filteredVisitors.length === 0) return;
      const headers = ['Pass ID', 'Name', 'Company/Organization', 'Designation', 'Mobile', 'Email', 'City', 'Category', 'Connected At'];
      const rows = filteredVisitors.map(v => [
        `"${v.registrationNumber || ''}"`,
        `"${(v.name || '').replace(/"/g, '""')}"`,
        `"${(v.companyName || '').replace(/"/g, '""')}"`,
        `"${(v.designation || '').replace(/"/g, '""')}"`,
        `"${v.mobile || ''}"`,
        `"${v.email || ''}"`,
        `"${v.city || ''}"`,
        `"${(v.industryCategory || '').replace(/"/g, '""')}"`,
        `"${new Date(v.connectedAt).toLocaleString()}"`
      ]);
      downloadCsvFile('connected-visitors.csv', [headers.join(','), ...rows.map(r => r.join(','))].join('\n'));
    }
  };

  const totalConnections = connectedExhibitors.length + connectedVisitors.length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0B3B75]">
              <Users size={20} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              My Connections
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Contacts and stall partners you've scanned and connected with at the expo.
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
            disabled={activeTab === 'exhibitors' ? filteredExhibitors.length === 0 : filteredVisitors.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
          >
            <Download size={14} />
            Export {activeTab === 'exhibitors' ? 'Exhibitors' : 'Visitors'} CSV
          </button>

          <Link
            to="/visitorShell/Scanner"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0B3B75] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#092f5d]"
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
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => loadConnections()}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/visitor/login')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 transition"
                >
                  <LogIn size={13} />
                  Log In Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TWO MENUS / TABS (Exhibitors vs Visitors) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-2">
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => handleTabSwitch('exhibitors')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === 'exhibitors'
                ? 'bg-white text-[#0B3B75] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store size={15} />
            Connected Exhibitors
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                activeTab === 'exhibitors'
                  ? 'bg-blue-100 text-[#0B3B75]'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {connectedExhibitors.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('visitors')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === 'visitors'
                ? 'bg-white text-[#0B3B75] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={15} />
            Connected Visitors
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                activeTab === 'visitors'
                  ? 'bg-blue-100 text-[#0B3B75]'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {connectedVisitors.length}
            </span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder={activeTab === 'exhibitors' ? 'Search exhibitors or stalls...' : 'Search visitors by name or pass...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
      ) : activeTab === 'exhibitors' ? (
        /* EXHIBITORS TAB */
        filteredExhibitors.length === 0 ? (
          <EmptyConnectionsState
            title="No Connected Exhibitors Yet"
            description={
              searchQuery
                ? `No exhibitors match "${searchQuery}". Try clearing your search filter.`
                : "You haven't connected with any exhibitors yet. Walk around the expo and scan stall QR codes to save their contact details!"
            }
            onScan={() => navigate('/visitorShell/Scanner')}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredExhibitors.map((exhibitor) => (
              <ExhibitorCard key={exhibitor.id || exhibitor.exhibitorId} exhibitor={exhibitor} />
            ))}
          </div>
        )
      ) : (
        /* VISITORS TAB */
        filteredVisitors.length === 0 ? (
          <EmptyConnectionsState
            title="No Connected Visitors Yet"
            description={
              searchQuery
                ? `No visitors match "${searchQuery}". Try clearing your search filter.`
                : "You haven't scanned another visitor yet. Open the scanner and scan other attendees' QR pass badges to connect and exchange contacts!"
            }
            onScan={() => navigate('/visitorShell/Scanner')}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVisitors.map((visitor) => (
              <VisitorCard key={visitor.id || visitor.visitorId} visitor={visitor} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Exhibitor Card Component
// ----------------------------------------------------------------------
function ExhibitorCard({ exhibitor }: { exhibitor: ConnectedExhibitor }) {
  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="p-5 space-y-4">
        {/* Header with Stall badge */}
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
                {exhibitor.companyName ? exhibitor.companyName.charAt(0).toUpperCase() : 'E'}
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
        <div className="space-y-2 text-xs text-slate-600">
          {exhibitor.contactPersonName && (
            <div className="flex items-center gap-2">
              <Users size={14} className="text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-700">{exhibitor.contactPersonName}</span>
              {exhibitor.contactPersonDesignation && (
                <span className="text-slate-400">· {exhibitor.contactPersonDesignation}</span>
              )}
            </div>
          )}

          {exhibitor.city && (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-slate-400 shrink-0" />
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
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-slate-100 bg-slate-50 p-3">
        <div className="grid grid-cols-2 gap-2 mb-2">
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
// Visitor Card Component
// ----------------------------------------------------------------------
function VisitorCard({ visitor }: { visitor: ConnectedVisitor }) {
  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="p-5 space-y-4">
        {/* Header with Pass badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-base font-extrabold text-indigo-700">
              {visitor.name ? visitor.name.charAt(0).toUpperCase() : 'V'}
            </div>

            <div>
              <h3 className="font-bold text-slate-900 leading-tight">
                {visitor.name}
              </h3>
              {visitor.companyName && (
                <p className="text-xs text-slate-600 font-medium">{visitor.companyName}</p>
              )}
            </div>
          </div>

          <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
            {visitor.registrationNumber}
          </span>
        </div>

        {/* Details list */}
        <div className="space-y-2 text-xs text-slate-600">
          {visitor.designation && (
            <div className="flex items-center gap-2">
              <Briefcase size={14} className="text-slate-400 shrink-0" />
              <span>{visitor.designation}</span>
            </div>
          )}

          {(visitor.city || visitor.district) && (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-slate-400 shrink-0" />
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
            <CalendarDays size={13} />
            <span>Connected {new Date(visitor.connectedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-slate-100 bg-slate-50 p-3">
        <div className="grid grid-cols-2 gap-2">
          {visitor.mobile ? (
            <a
              href={`tel:${visitor.mobile}`}
              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition"
            >
              <Phone size={13} /> Call
            </a>
          ) : (
            <span className="py-1.5 px-2 bg-slate-100 text-slate-400 rounded-lg text-xs text-center font-bold opacity-50">
              Call
            </span>
          )}

          {visitor.email ? (
            <a
              href={`mailto:${visitor.email}`}
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
// Empty State Component
// ----------------------------------------------------------------------
function EmptyConnectionsState({
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
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#0B3B75] mb-4">
        <QrCode size={30} />
      </div>
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      <p className="mt-2 max-w-md text-xs text-slate-500 leading-relaxed">{description}</p>
      <button
        type="button"
        onClick={onScan}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B3B75] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#092f5d]"
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