import { useEffect, useState, useCallback } from 'react';
import {
  ClipboardList,
  PackagePlus,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Search,
  ReceiptText,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  exhibitorApiClient,
  ExhibitorApiError,
  getExhibitorToken,
  setExhibitorSession
} from '../../data/api/exhibitorApiClient';

interface RequirementLine {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  baseAmount: number;
  gstPercentage: number;
  gstAmount: number;
  totalAmount: number;
}

interface RequirementRequest {
  id: string;
  exhibitorId: string;
  bookingId: string;
  bookingRegistrationNumber: string;
  status: 'Pending' | 'Confirmed' | 'Rejected';
  totalBaseAmount: number;
  totalGstAmount: number;
  grandTotal: number;
  createdAt: string;
  confirmedAt: string | null;
  callNotes: string | null;
  lines: RequirementLine[];
}

export function ExhibitorMyRequirementRequestsPage() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState<RequirementRequest[]>([]);
  const [featureEnabled, setFeatureEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const loadRequests = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Check feature status
      try {
        const statusRes = await exhibitorApiClient.get<{ enabled: boolean }>('/exhibitor/additional-requirements/feature-status');
        if (typeof statusRes?.enabled === 'boolean') {
          setFeatureEnabled(statusRes.enabled);
        }
      } catch {
        // Ignore fallback
      }

      const res = await exhibitorApiClient.get<RequirementRequest[]>('/exhibitor/additional-requirements');
      setRequests(Array.isArray(res) ? res : []);
    } catch (err: any) {
      if (err instanceof ExhibitorApiError && err.status === 401) {
        setExhibitorSession(null, null);
        navigate('/exhibitor/login');
        return;
      }
      setError(err instanceof ExhibitorApiError ? err.message : 'Failed to load requirement requests.');
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
    loadRequests();
  }, [loadRequests, navigate]);

  const filteredRequests = requests.filter((r) => {
    if (filterStatus !== 'ALL' && r.status.toUpperCase() !== filterStatus) {
      return false;
    }
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      const matchId = r.id.toLowerCase().includes(query);
      const matchReg = (r.bookingRegistrationNumber || '').toLowerCase().includes(query);
      const matchItem = r.lines?.some(l => l.itemName.toLowerCase().includes(query) || l.itemCode.toLowerCase().includes(query));
      return matchId || matchReg || matchItem;
    }
    return true;
  });

  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const confirmedCount = requests.filter(r => r.status === 'Confirmed').length;
  const totalSpend = requests
    .filter(r => r.status !== 'Rejected')
    .reduce((sum, r) => sum + r.grandTotal, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 shadow-sm">
            <CheckCircle2 size={13} /> Confirmed
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200 shadow-sm">
            <XCircle size={13} /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200 shadow-sm">
            <Clock size={13} /> Pending Confirmation
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/exhibitorShell/Dashboard"
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <ClipboardList className="h-7 w-7 text-[#0B3B75]" />
              My Requirement Requests
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Track the status and line details of your previous requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadRequests(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#0B3B75] border border-slate-200 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh List
          </button>

          {featureEnabled ? (
            <Link
              to="/exhibitorShell/AdditionalRequirements"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B3B75] px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#082a54] active:scale-[0.98]"
            >
              <PackagePlus size={16} />
              + New Requirement
            </Link>
          ) : (
            <span
              title="Requirements submission is currently paused by admin"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-400 border border-slate-200 cursor-not-allowed"
            >
              <PackagePlus size={16} />
              Requirements Paused
            </span>
          )}
        </div>
      </div>

      {/* Disabled Flow Notice Banner */}
      {!featureEnabled && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 sm:p-5 text-amber-900 shadow-sm flex items-start gap-3.5">
          <div className="rounded-xl bg-amber-200/70 p-2 text-amber-800 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-amber-950">
              New Requirement Submissions Currently Paused
            </h3>
            <p className="mt-0.5 text-xs sm:text-sm text-amber-800 leading-relaxed">
              The Additional Requirements portal has been paused by the exhibition administration. New requests cannot be placed at this time, but you can track your previously submitted requests and their status below.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Header Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Requests</span>
            <Layers size={18} className="text-[#0B3B75]" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{loading ? '—' : totalCount}</p>
          <p className="mt-0.5 text-xs text-slate-500">All submissions</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold uppercase tracking-wider">
            <span>Pending Review</span>
            <Clock size={18} className="text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-900">{loading ? '—' : pendingCount}</p>
          <p className="mt-0.5 text-xs text-amber-700">Awaiting coordinator call</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold uppercase tracking-wider">
            <span>Confirmed</span>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-900">{loading ? '—' : confirmedCount}</p>
          <p className="mt-0.5 text-xs text-emerald-700">Ready for stall delivery</p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#0B3B75] text-xs font-semibold uppercase tracking-wider">
            <span>Total Value</span>
            <ReceiptText size={18} className="text-[#0B3B75]" />
          </div>
          <p className="mt-2 text-2xl font-black text-[#0B3B75]">
            {loading ? '—' : `₹${totalSpend.toLocaleString('en-IN')}`}
          </p>
          <p className="mt-0.5 text-xs text-blue-700">Incl. GST (18%)</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { label: 'All Requests', val: 'ALL', count: totalCount },
            { label: 'Pending', val: 'PENDING', count: pendingCount },
            { label: 'Confirmed', val: 'CONFIRMED', count: confirmedCount },
            { label: 'Rejected', val: 'REJECTED', count: requests.filter(r => r.status === 'Rejected').length }
          ].map(tab => (
            <button
              key={tab.val}
              type="button"
              onClick={() => setFilterStatus(tab.val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                filterStatus === tab.val
                  ? 'bg-[#0B3B75] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filterStatus === tab.val ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search request or item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:border-[#0B3B75] focus:outline-none"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800 flex items-center gap-3">
          <XCircle size={20} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-14 text-center text-slate-500">
          <RefreshCw size={32} className="mx-auto animate-spin text-[#0B3B75]" />
          <p className="mt-3 text-sm font-medium">Loading your requirement requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-14 text-center">
          <ClipboardList size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-800">
            {searchTerm || filterStatus !== 'ALL' ? 'No matching requests found' : 'No requirement requests submitted yet'}
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            {searchTerm || filterStatus !== 'ALL'
              ? 'Try changing your search keywords or filter options to see other requests.'
              : 'Need extra power sockets, spotlight, table or chairs for your stall? Submit your additional requirements anytime.'}
          </p>
          <div className="mt-5">
            <Link
              to="/exhibitorShell/AdditionalRequirements"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B3B75] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#082a54]"
            >
              <PackagePlus size={16} />
              + Place Additional Requirement
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {filteredRequests.length} {filteredRequests.length === 1 ? 'Request' : 'Requests'} Total
            </span>
          </div>

          {filteredRequests.map((req) => {
            const isExpanded = expandedRequestId === req.id;
            const formattedDate = new Date(req.createdAt).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });

            return (
              <div
                key={req.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:border-slate-300 hover:shadow-md"
              >
                {/* Request Card Top Row */}
                <div
                  onClick={() => setExpandedRequestId(isExpanded ? null : req.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="h-11 w-11 rounded-xl bg-blue-50 text-[#0B3B75] flex items-center justify-center shrink-0 font-bold border border-blue-100">
                      <PackagePlus size={22} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-base font-black text-slate-900 tracking-tight">
                          Request #{req.id.slice(0, 8).toUpperCase()}
                        </span>
                        {getStatusBadge(req.status)}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                        <span>Submitted on {formattedDate}</span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="font-semibold text-slate-700">{req.lines.length} items</span>
                        {req.bookingRegistrationNumber && (
                          <>
                            <span className="text-slate-300">&bull;</span>
                            <span className="font-mono text-slate-600">Booking: {req.bookingRegistrationNumber}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 border-t border-slate-100 sm:border-t-0 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Grand Total</p>
                      <p className="text-xl font-black text-[#0B3B75]">
                        ₹{req.grandTotal.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Breakdown */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-5 space-y-4">
                    {/* Coordinator Call Notes */}
                    {req.callNotes ? (
                      <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
                        <Info size={18} className="shrink-0 text-blue-600 mt-0.5" />
                        <div>
                          <span className="font-bold text-blue-950">Coordinator / Team Remarks:</span>
                          <p className="mt-0.5 text-blue-800 leading-relaxed">{req.callNotes}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-white/70 p-3 text-xs text-slate-500 flex items-center gap-2">
                        <Clock size={15} className="shrink-0 text-slate-400" />
                        <span>Our exhibition team reviews requests and confirms power load and equipment availability.</span>
                      </div>
                    )}

                    {/* Table of Items */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Item Code</th>
                            <th className="p-3">Item Description</th>
                            <th className="p-3 text-center">Qty</th>
                            <th className="p-3 text-right">Base Price</th>
                            <th className="p-3 text-right">GST %</th>
                            <th className="p-3 text-right">GST Amount</th>
                            <th className="p-3 text-right">Total Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {req.lines.map((line) => (
                            <tr key={line.id} className="hover:bg-slate-50/50 transition">
                              <td className="p-3 font-mono font-bold text-slate-700">{line.itemCode}</td>
                              <td className="p-3 font-semibold text-slate-900">{line.itemName}</td>
                              <td className="p-3 text-center font-bold text-slate-800">
                                <span className="inline-block px-2 py-0.5 bg-slate-100 rounded-md font-mono">
                                  {line.quantity}
                                </span>
                              </td>
                              <td className="p-3 text-right text-slate-600">₹{line.baseAmount.toLocaleString('en-IN')}</td>
                              <td className="p-3 text-right text-slate-600">{line.gstPercentage}%</td>
                              <td className="p-3 text-right text-slate-600">₹{line.gstAmount.toLocaleString('en-IN')}</td>
                              <td className="p-3 text-right font-bold text-slate-900">
                                ₹{line.totalAmount.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                          <tr>
                            <td colSpan={3} className="p-3 font-semibold text-slate-500">Summary</td>
                            <td className="p-3 text-right font-bold text-slate-700">
                              ₹{req.totalBaseAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="p-3 text-right text-slate-400">&mdash;</td>
                            <td className="p-3 text-right font-bold text-slate-700">
                              ₹{req.totalGstAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="p-3 text-right text-[#0B3B75] text-sm font-black">
                              ₹{req.grandTotal.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ExhibitorMyRequirementRequestsPage;
