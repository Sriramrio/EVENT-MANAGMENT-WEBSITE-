import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  PackagePlus,
  Plus,
  Minus,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Layers,
  ArrowLeft,
  ChevronRight,
  PhoneCall,
  Check,
  Image as ImageIcon,
  ClipboardList,
  Trash2,
  ReceiptText,
  Lock,
  AlertTriangle,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FileText
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  exhibitorApiClient,
  ExhibitorApiError,
  getExhibitorToken,
  setExhibitorSession
} from '../../data/api/exhibitorApiClient';

interface CatalogItem {
  id: string;
  code: string;
  name: string;
  baseAmount: number;
  gstPercentage: number;
  unitGstAmount: number;
  unitTotalAmount: number;
  imageUrl?: string | null;
  isActive: boolean;
}

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
  notes: string | null;
  lines: RequirementLine[];
}

export function ExhibitorAdditionalRequirementsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'catalog' (New Request) or 'history' (My Requests)
  const initialTab = searchParams.get('tab') === 'history' ? 'history' : 'catalog';
  const [activeTab, setActiveTab] = useState<'catalog' | 'history'>(initialTab);

  // Catalog / Order State
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customNotes, setCustomNotes] = useState<string>('');
  const [featureEnabled, setFeatureEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);

  // Requests History State
  const [requests, setRequests] = useState<RequirementRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Sync tab with URL
  const handleTabChange = (tab: 'catalog' | 'history') => {
    setActiveTab(tab);
    if (tab === 'history') {
      setSearchParams({ tab: 'history' });
    } else {
      setSearchParams({});
    }
  };

  // Consolidated Concurrent Data Loader for Exhibitor Portal
  const loadAllExhibitorData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadingRequests(true);
    setError(null);

    try {
      const [statusRes, catalogRes, requestsRes] = await Promise.allSettled([
        exhibitorApiClient.get<{ enabled: boolean }>('/exhibitor/additional-requirements/feature-status'),
        exhibitorApiClient.get<CatalogItem[]>('/exhibitor/additional-requirements/catalog'),
        exhibitorApiClient.get<RequirementRequest[]>('/exhibitor/additional-requirements')
      ]);

      if (statusRes.status === 'fulfilled' && typeof statusRes.value?.enabled === 'boolean') {
        setFeatureEnabled(statusRes.value.enabled);
      }

      if (catalogRes.status === 'fulfilled') {
        setCatalog(Array.isArray(catalogRes.value) ? catalogRes.value : []);
      } else {
        const err = catalogRes.reason;
        if (err instanceof ExhibitorApiError && err.status === 401) {
          setExhibitorSession(null, null);
          navigate('/exhibitor/login');
          return;
        }
        setError(err instanceof ExhibitorApiError ? err.message : 'Failed to load additional requirements catalog.');
      }

      if (requestsRes.status === 'fulfilled') {
        setRequests(Array.isArray(requestsRes.value) ? requestsRes.value : []);
      } else {
        const err = requestsRes.reason;
        if (err instanceof ExhibitorApiError && err.status === 401) {
          setExhibitorSession(null, null);
          navigate('/exhibitor/login');
          return;
        }
      }
    } finally {
      setLoading(false);
      setLoadingRequests(false);
      setRefreshing(false);
    }
  }, [navigate]);

  // Load catalog only
  const loadCatalogData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [statusRes, catalogRes] = await Promise.allSettled([
        exhibitorApiClient.get<{ enabled: boolean }>('/exhibitor/additional-requirements/feature-status'),
        exhibitorApiClient.get<CatalogItem[]>('/exhibitor/additional-requirements/catalog')
      ]);

      if (statusRes.status === 'fulfilled' && typeof statusRes.value?.enabled === 'boolean') {
        setFeatureEnabled(statusRes.value.enabled);
      }
      if (catalogRes.status === 'fulfilled') {
        setCatalog(Array.isArray(catalogRes.value) ? catalogRes.value : []);
      } else {
        const err = catalogRes.reason;
        if (err instanceof ExhibitorApiError && err.status === 401) {
          setExhibitorSession(null, null);
          navigate('/exhibitor/login');
          return;
        }
        setError(err instanceof ExhibitorApiError ? err.message : 'Failed to load additional requirements catalog.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  // Load past requests history
  const loadRequestsHistory = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await exhibitorApiClient.get<RequirementRequest[]>('/exhibitor/additional-requirements');
      setRequests(Array.isArray(res) ? res : []);
    } catch (err: any) {
      if (err instanceof ExhibitorApiError && err.status === 401) {
        setExhibitorSession(null, null);
        navigate('/exhibitor/login');
        return;
      }
    } finally {
      setLoadingRequests(false);
    }
  }, [navigate]);

  // Initial load concurrently
  useEffect(() => {
    if (!getExhibitorToken()) {
      navigate('/exhibitor/login');
      return;
    }
    loadAllExhibitorData();
  }, [loadAllExhibitorData, navigate]);

  // Quantity helpers
  const handleQuantityChange = (itemId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const handleDirectInput = (itemId: string, val: string) => {
    const num = parseInt(val, 10);
    setQuantities((prev) => {
      if (isNaN(num) || num <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: num };
    });
  };

  const handleClearItem = (itemId: string) => {
    setQuantities((prev) => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
  };

  const handleResetAll = () => {
    setQuantities({});
    setCustomNotes('');
  };

  // Live order calculations
  const orderSummary = useMemo(() => {
    let selectedCount = 0;
    let baseSubtotal = 0;
    let gstTotal = 0;
    let grandTotal = 0;

    const lineDetails: Array<{
      item: CatalogItem;
      quantity: number;
      lineBase: number;
      lineGst: number;
      lineTotal: number;
    }> = [];

    for (const item of catalog) {
      const qty = quantities[item.id] || 0;
      if (qty > 0) {
        selectedCount += qty;
        const lineBase = item.baseAmount * qty;
        const gstPct = item.gstPercentage;
        const lineGst = Math.round(lineBase * (gstPct / 100) * 100) / 100;
        const lineTotal = lineBase + lineGst;

        baseSubtotal += lineBase;
        gstTotal += lineGst;
        grandTotal += lineTotal;

        lineDetails.push({
          item,
          quantity: qty,
          lineBase,
          lineGst,
          lineTotal
        });
      }
    }

    return {
      selectedCount,
      baseSubtotal: Math.round(baseSubtotal * 100) / 100,
      gstTotal: Math.round(gstTotal * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      lineDetails
    };
  }, [catalog, quantities]);

  // Submit request
  const handleSubmit = async () => {
    if (orderSummary.lineDetails.length === 0) {
      setError('Please select at least one item from the catalog before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        items: orderSummary.lineDetails.map((l) => ({
          itemId: l.item.id || (l.item as any).Id,
          quantity: l.quantity
        })),
        notes: customNotes.trim() ? customNotes.trim() : null
      };

      const res = await exhibitorApiClient.post<{ message: string; requirement: RequirementRequest }>(
        '/exhibitor/additional-requirements',
        payload
      );

      setSuccessMessage(
        res.message ||
          'Your requirement request has been submitted successfully! Our team will verify and contact you.'
      );
      if (res.requirement?.id) {
        setSubmittedRequestId(res.requirement.id);
      }
      setQuantities({});
      setCustomNotes('');
      await loadRequestsHistory();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err instanceof ExhibitorApiError ? err.message : 'Failed to submit additional requirement request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered requests for History tab
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (filterStatus !== 'ALL' && r.status.toUpperCase() !== filterStatus) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchId = r.id.toLowerCase().includes(query);
        const matchReg = (r.bookingRegistrationNumber || '').toLowerCase().includes(query);
        const matchItem = r.lines?.some(l => l.itemName.toLowerCase().includes(query) || l.itemCode.toLowerCase().includes(query));
        const matchNotes = (r.notes || '').toLowerCase().includes(query);
        return matchId || matchReg || matchItem || matchNotes;
      }
      return true;
    });
  }, [requests, filterStatus, searchTerm]);

  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const confirmedCount = requests.filter(r => r.status === 'Confirmed').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 shadow-sm">
            <CheckCircle2 size={14} /> Confirmed
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200 shadow-sm">
            <XCircle size={14} /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200 shadow-sm">
            <Clock size={14} /> Pending Confirmation
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-24">
      {/* Header */}
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
              <PackagePlus className="h-7 w-7 text-[#0B3B75]" />
              Additional Requirements
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Request additional power connections, display furniture, spotlights, and utilities for your stall.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadAllExhibitorData(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 border border-slate-200 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Modern Tabs Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          type="button"
          onClick={() => handleTabChange('catalog')}
          className={`relative flex items-center gap-2.5 pb-3.5 px-4 text-sm font-bold transition-colors ${
            activeTab === 'catalog'
              ? 'text-[#0B3B75] border-b-2 border-[#0B3B75]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <PackagePlus size={18} />
          Place New Request
          {orderSummary.selectedCount > 0 && (
            <span className="rounded-full bg-blue-100 text-[#0B3B75] px-2 py-0.5 text-xs font-bold">
              {orderSummary.selectedCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('history')}
          className={`relative flex items-center gap-2.5 pb-3.5 px-4 text-sm font-bold transition-colors ${
            activeTab === 'history'
              ? 'text-[#0B3B75] border-b-2 border-[#0B3B75]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList size={18} />
          My Requests & History
          {requests.length > 0 && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              pendingCount > 0
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 text-slate-700'
            }`}>
              {requests.length} {pendingCount > 0 && `(${pendingCount} Pending)`}
            </span>
          )}
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800 flex items-center gap-3">
          <XCircle size={20} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={24} className="shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-bold text-base text-emerald-950">Requirement Request Placed Successfully!</p>
              <p className="text-xs text-emerald-700 mt-0.5">{successMessage}</p>
              {submittedRequestId && (
                <p className="text-xs font-mono font-bold text-emerald-800 mt-1">
                  Request Ref: #{submittedRequestId.slice(0, 8).toUpperCase()}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleTabChange('history')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition whitespace-nowrap shadow-sm"
          >
            <ClipboardList size={15} />
            View in My Requests
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: CATALOG & PLACE NEW REQUEST */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="relative min-h-[420px]">
          {/* Disabled Alert Overlay */}
          {!featureEnabled && (
            <div className="absolute inset-0 z-30 flex items-start justify-center pt-8 sm:pt-16 pb-20 px-4 bg-slate-900/10 backdrop-blur-[2px] rounded-3xl">
              <div className="w-full max-w-lg rounded-3xl border border-amber-300 bg-white/95 backdrop-blur-md p-6 sm:p-8 text-center shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 sticky top-24">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-inner border border-amber-200">
                  <Lock size={32} />
                </div>
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                    <AlertTriangle size={13} /> Flow Not Enabled
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    Additional Requirements Disabled
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                    The additional requirements request flow is currently disabled by the exhibition administration. New requirement orders cannot be placed at this time.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    to="/exhibitorShell/Dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 transition"
                  >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleTabChange('history')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B3B75] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#082a54] transition"
                  >
                    <ClipboardList size={16} />
                    View My Requests
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Requirements Content */}
          <div className={`space-y-8 ${!featureEnabled ? 'filter blur-[4px] opacity-35 pointer-events-none select-none transition-all duration-300' : ''}`}>
            {/* Available Items Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <PackagePlus size={20} className="text-[#0B3B75]" /> Available Items
                </h2>
                <p className="text-xs text-slate-500">Select quantity of each requirement item needed for your stall.</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
                {catalog.length} items available
              </span>
            </div>

            {/* Catalog Items Grid */}
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-14 text-center text-slate-500 shadow-sm">
                <RefreshCw size={32} className="mx-auto animate-spin text-[#0B3B75]" />
                <p className="mt-3 text-sm font-medium">Loading requirements catalog...</p>
              </div>
            ) : catalog.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-14 text-center shadow-sm">
                <Layers size={44} className="mx-auto text-slate-300" />
                <p className="mt-3 text-base font-bold text-slate-800">
                  No additional requirements available yet
                </p>
                <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                  The event organizers have not added catalog items yet. Please check back later or contact the exhibition operations team.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catalog.map((item) => {
                  const base = item.baseAmount;
                  const gstPct = item.gstPercentage;
                  const unitGst = Math.round(base * (gstPct / 100));
                  const total = item.unitTotalAmount;
                  const qty = quantities[item.id] || 0;
                  const isSelected = qty > 0;
                  const itemTotal = total * qty;

                  return (
                    <div
                      key={item.id}
                      className={`group relative rounded-2xl border p-4 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isSelected
                          ? 'border-[#0B3B75] bg-gradient-to-r from-blue-50/70 via-white to-blue-50/40 shadow-md ring-2 ring-[#0B3B75]/30'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm hover:shadow-md'
                      }`}
                    >
                      {/* Left: Image & Info */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Thumbnail */}
                        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200/80 shadow-inner flex items-center justify-center">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name || (item as any).Name}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="text-slate-300">
                              <ImageIcon size={28} />
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute top-1 left-1 bg-[#0B3B75] text-white rounded-md p-0.5 shadow">
                              <Check size={12} />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider">
                              {item.code || (item as any).Code}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              {gstPct}% GST
                            </span>
                          </div>

                          <h3 className="mt-1 text-sm sm:text-base font-bold text-slate-900 leading-snug truncate">
                            {item.name || (item as any).Name}
                          </h3>

                          <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
                            <span className="text-base font-black text-[#0B3B75]">
                              ₹{base.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              + ₹{unitGst.toLocaleString('en-IN')} GST
                            </span>
                            <span className="text-[11px] font-semibold text-slate-700">
                              (₹{total.toLocaleString('en-IN')} total/unit)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Quantity Selector & Line Total */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 sm:gap-1.5 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.id, -1)}
                            disabled={qty === 0}
                            className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition shadow-sm"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={qty}
                            onChange={(e) => handleDirectInput(item.id, e.target.value)}
                            className="h-8 w-12 rounded-lg border border-slate-200 bg-white text-center text-sm font-bold text-slate-900 focus:border-[#0B3B75] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className="h-8 w-8 rounded-lg bg-[#0B3B75] text-white flex items-center justify-center hover:bg-[#082a54] active:scale-95 transition shadow-sm"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        {isSelected && (
                          <div className="text-right">
                            <span className="text-xs font-black text-[#0B3B75]">
                              = ₹{itemTotal.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Custom Extra Requirements Textbox Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-[#0B3B75]" size={20} />
                <h3 className="text-base font-bold text-slate-900">
                  Special / Custom Requirements & Extra Notes (Optional)
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                If you need any extra utilities, specific electrical sockets (e.g. 16A/32A), custom stall furniture, unlisted items, or positioning requests, please mention them clearly below.
              </p>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="Example: Need 2 extra 16A power points on the rear partition, 1 extra wooden stool, and spotlight facing the main display board."
                className="w-full rounded-xl border border-slate-200 p-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#0B3B75] focus:ring-1 focus:ring-[#0B3B75] focus:outline-none resize-y transition"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>This text will be saved to your request and sent to the operations team in confirmation emails.</span>
                <span>{customNotes.length}/2000 characters</span>
              </div>
            </div>

            {/* Request Summary & Submission */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <ReceiptText className="text-[#0B3B75]" size={22} />
                    Request Summary
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review your selected requirement items before submitting to the exhibition team.
                  </p>
                </div>

                {orderSummary.selectedCount > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetAll}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 transition"
                    >
                      <Trash2 size={13} />
                      Clear All
                    </button>
                    <span className="rounded-full bg-blue-50 text-[#0B3B75] border border-blue-200 px-3 py-1 text-xs font-bold">
                      {orderSummary.selectedCount} {orderSummary.selectedCount === 1 ? 'item' : 'items'} selected
                    </span>
                  </div>
                )}
              </div>

              {orderSummary.lineDetails.length === 0 && !customNotes.trim() ? (
                <div className="py-12 text-center text-slate-400">
                  <PackagePlus size={44} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-base font-bold text-slate-700">No items selected yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Increase the quantity on any item above or enter custom requirement notes to place your order.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Selected Items Table */}
                  {orderSummary.lineDetails.length > 0 && (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Item</th>
                            <th className="p-3 text-center">Quantity</th>
                            <th className="p-3 text-right">Unit Price</th>
                            <th className="p-3 text-right">GST %</th>
                            <th className="p-3 text-right">GST Amount</th>
                            <th className="p-3 text-right">Line Total</th>
                            <th className="p-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {orderSummary.lineDetails.map((l) => (
                            <tr key={l.item.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-bold text-slate-900 flex items-center gap-2.5">
                                {l.item.imageUrl ? (
                                  <img
                                    src={l.item.imageUrl}
                                    alt={l.item.name}
                                    className="h-9 w-9 rounded-lg object-cover border border-slate-200 shrink-0"
                                  />
                                ) : (
                                  <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                    <ImageIcon size={16} />
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-slate-800">{l.item.name}</p>
                                  <span className="text-[10px] font-mono font-normal text-slate-500">
                                    {l.item.code}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 text-center font-bold text-slate-900">
                                <span className="px-2.5 py-1 bg-slate-100 rounded-md font-mono">
                                  {l.quantity}
                                </span>
                              </td>
                              <td className="p-3 text-right text-slate-600">₹{l.item.baseAmount.toLocaleString('en-IN')}</td>
                              <td className="p-3 text-right text-slate-600">{l.item.gstPercentage}%</td>
                              <td className="p-3 text-right text-slate-600">₹{l.lineGst.toLocaleString('en-IN')}</td>
                              <td className="p-3 text-right font-bold text-slate-900">
                                ₹{l.lineTotal.toLocaleString('en-IN')}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleClearItem(l.item.id)}
                                  className="text-slate-400 hover:text-rose-600 transition"
                                  title="Remove item"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Note summary if user entered text */}
                  {customNotes.trim() && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs">
                      <p className="font-bold text-[#0B3B75] flex items-center gap-1.5 mb-1">
                        <FileText size={14} /> Attached Custom Notes:
                      </p>
                      <p className="text-slate-700 italic whitespace-pre-wrap">{customNotes}</p>
                    </div>
                  )}

                  {/* Financial Summary Breakdown Card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Coordinator Call Note Notice */}
                    <div className="rounded-xl bg-amber-50 p-4 border border-amber-200 text-xs text-amber-800 flex items-start gap-3">
                      <PhoneCall size={18} className="shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-950">Next Steps & Coordination:</p>
                        <p className="mt-0.5 text-amber-800 leading-relaxed">
                          Status will be <strong>Pending</strong> upon submission. The exhibition operations team will contact you via phone call to verify electrical loads, installation timing, and confirm delivery.
                        </p>
                      </div>
                    </div>

                    {/* Total Calculation Card */}
                    <div className="rounded-xl bg-slate-50 p-5 border border-slate-200 space-y-2.5">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Base Subtotal:</span>
                        <span className="font-bold text-slate-800">₹{orderSummary.baseSubtotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>GST (18% Estimated):</span>
                        <span className="font-bold text-slate-800">₹{orderSummary.gstTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-200 pt-3">
                        <span>Grand Total:</span>
                        <span className="text-xl text-[#0B3B75]">₹{orderSummary.grandTotal.toLocaleString('en-IN')}</span>
                      </div>

                      <div className="pt-3">
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={submitting || orderSummary.selectedCount === 0}
                          className="w-full rounded-xl bg-[#0B3B75] py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#082a54] active:scale-[0.99] disabled:opacity-50 transition flex items-center justify-center gap-2"
                        >
                          {submitting ? (
                            <>
                              <RefreshCw size={18} className="animate-spin" /> Submitting Request...
                            </>
                          ) : (
                            <>
                              <Check size={18} /> Submit Requirement Request ({orderSummary.selectedCount} items) &bull; ₹{orderSummary.grandTotal.toLocaleString('en-IN')}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Floating Bottom Sticky Bar for Quick Submission */}
      {activeTab === 'catalog' && featureEnabled && orderSummary.selectedCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 shadow-2xl p-3 sm:px-8">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <div>
                <span className="text-xs text-slate-500 font-medium">Selected {orderSummary.selectedCount} items</span>
                <p className="text-lg font-black text-[#0B3B75] leading-none">
                  ₹{orderSummary.grandTotal.toLocaleString('en-IN')}
                  <span className="text-[11px] font-normal text-slate-500 ml-1.5">(incl. GST)</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full sm:w-auto rounded-xl bg-[#0B3B75] px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#082a54] active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Submit Requirement Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MY REQUESTS & HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Total Requests Raised</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{requests.length}</p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
              <span className="text-xs font-semibold text-amber-700">Pending Verification</span>
              <p className="text-2xl font-black text-amber-900 mt-1">{pendingCount}</p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
              <span className="text-xs font-semibold text-emerald-700">Confirmed Orders</span>
              <p className="text-2xl font-black text-emerald-900 mt-1">{confirmedCount}</p>
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Request ID or Item..."
                className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#0B3B75] focus:outline-none"
              />
            </div>

            {/* Status Tabs Filter */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto">
              {['ALL', 'PENDING', 'CONFIRMED', 'REJECTED'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                    filterStatus === status
                      ? 'bg-white text-[#0B3B75] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Requests List */}
          {loadingRequests ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-14 text-center text-slate-500 shadow-sm">
              <RefreshCw size={32} className="mx-auto animate-spin text-[#0B3B75]" />
              <p className="mt-3 text-sm font-medium">Loading requirement requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-14 text-center shadow-sm">
              <ClipboardList size={44} className="mx-auto text-slate-300" />
              <p className="mt-3 text-base font-bold text-slate-800">
                {requests.length === 0 ? 'No requirement requests placed yet' : 'No matching requests found'}
              </p>
              <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                {requests.length === 0
                  ? 'Switch to the "Place New Request" tab to browse available items and submit your requirements.'
                  : 'Try adjusting your search query or status filter.'}
              </p>
              {requests.length === 0 && (
                <button
                  type="button"
                  onClick={() => handleTabChange('catalog')}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0B3B75] px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-[#082a54] transition"
                >
                  <Plus size={16} /> Place a Request Now
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((req) => {
                const isExpanded = expandedRequestId === req.id;
                const formattedDate = new Date(req.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={req.id}
                    className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:border-slate-300"
                  >
                    {/* Card Header Summary */}
                    <div
                      onClick={() => setExpandedRequestId(isExpanded ? null : req.id)}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition select-none"
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0B3B75] shrink-0 font-bold">
                          <ReceiptText size={20} />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              #{req.id.slice(0, 8).toUpperCase()}
                            </span>
                            {getStatusBadge(req.status)}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Requested on: <strong className="text-slate-700">{formattedDate}</strong>
                            {req.bookingRegistrationNumber && (
                              <span className="ml-2 font-mono text-slate-600 font-semibold">
                                · Reg: {req.bookingRegistrationNumber}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <span className="text-xs text-slate-400 block">Total Amount</span>
                          <span className="text-base font-black text-[#0B3B75]">
                            ₹{req.grandTotal.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {req.lines?.length || 0} {req.lines?.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Request Details */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-4 animate-in fade-in duration-150">
                        {/* Custom Extra Requirements Note (if exhibitor provided one) */}
                        {req.notes && (
                          <div className="rounded-xl border border-blue-200 bg-white p-4 text-xs shadow-sm">
                            <p className="font-bold text-[#0B3B75] flex items-center gap-1.5 mb-1">
                              <MessageSquare size={14} /> Exhibitor Custom Notes / Remarks:
                            </p>
                            <p className="text-slate-700 italic whitespace-pre-wrap">{req.notes}</p>
                          </div>
                        )}

                        {/* Coordinator Call Notes (if verified by admin) */}
                        {req.callNotes && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs">
                            <p className="font-bold text-amber-950 flex items-center gap-1.5 mb-1">
                              <PhoneCall size={14} /> Operations Coordinator Notes:
                            </p>
                            <p className="text-amber-900">{req.callNotes}</p>
                          </div>
                        )}

                        {/* Line Items Table */}
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                              <tr>
                                <th className="p-3">Item Name</th>
                                <th className="p-3 text-center">Qty</th>
                                <th className="p-3 text-right">Unit Price</th>
                                <th className="p-3 text-right">GST</th>
                                <th className="p-3 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {req.lines?.map((line) => (
                                <tr key={line.id} className="hover:bg-slate-50/40">
                                  <td className="p-3 font-semibold text-slate-800">
                                    {line.itemName}
                                    <span className="block text-[10px] font-mono text-slate-400 font-normal">
                                      {line.itemCode}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-bold text-slate-900 font-mono">
                                    {line.quantity}
                                  </td>
                                  <td className="p-3 text-right text-slate-600">
                                    ₹{line.baseAmount.toLocaleString('en-IN')}
                                  </td>
                                  <td className="p-3 text-right text-slate-600">
                                    ₹{line.gstAmount.toLocaleString('en-IN')} ({line.gstPercentage}%)
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-900">
                                    ₹{line.totalAmount.toLocaleString('en-IN')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="border-t border-slate-200 bg-slate-50/60 font-semibold text-slate-700 text-xs">
                              <tr>
                                <td colSpan={4} className="p-2.5 text-right text-slate-500">
                                  Base Subtotal:
                                </td>
                                <td className="p-2.5 text-right font-bold text-slate-800">
                                  ₹{req.totalBaseAmount.toLocaleString('en-IN')}
                                </td>
                              </tr>
                              <tr>
                                <td colSpan={4} className="p-2.5 text-right text-slate-500">
                                  GST Total:
                                </td>
                                <td className="p-2.5 text-right font-bold text-slate-800">
                                  ₹{req.totalGstAmount.toLocaleString('en-IN')}
                                </td>
                              </tr>
                              <tr className="border-t border-slate-200 font-bold bg-slate-100/70 text-slate-900">
                                <td colSpan={4} className="p-3 text-right text-sm">
                                  Grand Total:
                                </td>
                                <td className="p-3 text-right text-sm text-[#0B3B75] font-black">
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
      )}
    </div>
  );
}

export default ExhibitorAdditionalRequirementsPage;
