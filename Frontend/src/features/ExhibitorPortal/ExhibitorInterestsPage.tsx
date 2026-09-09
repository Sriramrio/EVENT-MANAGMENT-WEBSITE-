import { useEffect, useState, useCallback } from 'react';
import { Heart, Phone, Mail, RefreshCw, Search, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { exhibitorApiClient, ExhibitorApiError, getExhibitorToken, setExhibitorSession } from '../../data/api/exhibitorApiClient';

interface InterestRow {
  id: string;
  visitorName: string | null;
  visitorMobile: string | null;
  visitorEmail: string | null;
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
  return new Date(iso).toLocaleDateString();
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function ExhibitorInterestsPage() {
  const navigate = useNavigate();
  const [interests, setInterests] = useState<InterestRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await exhibitorApiClient.get<{ interests: InterestRow[] }>('/exhibitor/interests');
      setInterests(Array.isArray(res.interests) ? res.interests : []);
    } catch (err) {
      if (err instanceof ExhibitorApiError) {
        if (err.status === 401) {
          setExhibitorSession(null, null);
          navigate('/exhibitor/login');
          return;
        }
        if (err.status === 404) {
          setInterests([]);
          return;
        }
      }
      setError(err instanceof ExhibitorApiError ? err.message : 'Could not load interested visitors.');
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

  const filteredInterests = interests.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      (item.visitorName && item.visitorName.toLowerCase().includes(q)) ||
      (item.visitorMobile && item.visitorMobile.includes(q)) ||
      (item.visitorEmail && item.visitorEmail.toLowerCase().includes(q))
    );
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/exhibitorShell/Dashboard"
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-black text-slate-900">Interested Visitors</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Full list of visitors who expressed interest in your stall
          </p>
        </div>

        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#0B3B75] border border-slate-200 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh List
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by visitor name or mobile number..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 shadow-sm outline-none transition focus:border-[#0B3B75] focus:ring-2 focus:ring-[#0B3B75]/20"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* List Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {!loading && filteredInterests.length === 0 && (
          <div className="px-6 py-16 text-center">
            <Heart size={44} className="mx-auto text-slate-300" />
            <p className="mt-3 text-base font-bold text-slate-800">
              {searchQuery ? 'No matching visitors found' : 'No interested visitors yet'}
            </p>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? 'Try adjusting your search terms.'
                : 'Visitors will appear here when they scan your stall QR and tap "I\'m Interested".'}
            </p>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {filteredInterests.map((item) => {
            const displayName = item.visitorName || 'Visitor';
            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 transition hover:bg-slate-50/80"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0B3B75] text-sm font-black text-white">
                    {item.visitorName ? initials(item.visitorName) : <Heart size={20} />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-base font-bold text-slate-900">
                        {displayName}
                      </p>
                      {!item.isRead && (
                        <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Received {timeAgo(item.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 sm:border-t-0 sm:pt-0">
                  {item.visitorMobile && (
                    <a
                      href={`tel:${item.visitorMobile}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <Phone size={14} /> Call {item.visitorMobile}
                    </a>
                  )}

                  {item.visitorEmail && (
                    <a
                      href={`mailto:${item.visitorEmail}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-[#0B3B75] transition hover:bg-blue-100"
                    >
                      <Mail size={14} /> Email
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ExhibitorInterestsPage;
