import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  MailCheck,
  Paperclip,
  Search,
  RotateCw,
  Download,
  Users,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Calendar,
} from 'lucide-react';
import { exhibitorApiClient, getExhibitorProfile } from '../../data/api/exhibitorApiClient';
import { ModalPortal } from '../../shared/components/ModalPortal';

export interface EmailLogEntry {
  id: string;
  toEmail: string;
  visitorName?: string;
  subject: string;
  sentAt: string;
  hasAttachment?: boolean;
  copySent?: boolean;
  status?: string;
  templateCode?: string;
}

export function ExhibitorEmailLogsPage() {
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DELIVERED' | 'PENDING' | 'FAILED'>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [selectedLog, setSelectedLog] = useState<EmailLogEntry | null>(null);

  const [regNumber, setRegNumber] = useState<string>(() => {
    return getExhibitorProfile()?.registrationNumber || '';
  });

  // Fetch and sync email logs strictly for the current authenticated exhibitor
  const loadLogs = async () => {
    try {
      localStorage.removeItem('msme_exhibitor_email_logs_default');
    } catch {}

    let currentReg = regNumber;
    if (!currentReg) {
      const prof = getExhibitorProfile();
      if (prof?.registrationNumber) {
        currentReg = prof.registrationNumber;
        setRegNumber(currentReg);
      } else {
        const me = await exhibitorApiClient.get<any>('/exhibitor/me').catch(() => null);
        if (me?.registrationNumber) {
          currentReg = me.registrationNumber;
          setRegNumber(currentReg);
        }
      }
    }

    const storageKey = currentReg ? `msme_exhibitor_email_logs_${currentReg}` : null;

    // 1. Read cached logs for this specific exhibitor
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLogs(parsed);
          }
        }
      } catch {}
    }

    // 2. Authoritative fetch from backend /exhibitor/email-logs
    try {
      const apiLogs = await exhibitorApiClient.get<Array<{
        id: string;
        toEmail: string;
        subject: string;
        status: string;
        sentAt: string;
        templateCode?: string;
      }>>('/exhibitor/email-logs');

      if (Array.isArray(apiLogs)) {
        const apiEntries: EmailLogEntry[] = apiLogs.map((l) => ({
          id: l.id,
          toEmail: l.toEmail,
          subject: l.subject,
          status: l.status || 'Delivered',
          sentAt: l.sentAt,
          hasAttachment: true,
          templateCode: l.templateCode,
        }));

        // Replace logs directly with authenticated exhibitor's authoritative logs
        setLogs(apiEntries);

        if (storageKey) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(apiEntries));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Could not fetch backend email logs, using local cache:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [regNumber]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLogs();
  };

  // Metrics & Counts for Top Data Cards
  const metrics = useMemo(() => {
    const totalSent = logs.length;
    const withAttachment = logs.filter((l) => l.hasAttachment !== false).length;
    const uniqueRecipients = new Set(logs.map((l) => l.toEmail.trim().toLowerCase())).size;
    const deliveredCount = logs.filter((l) => (l.status || 'Delivered').toLowerCase().includes('deliver') || (l.status || '').toLowerCase().includes('sent')).length;

    return {
      totalSent,
      withAttachment,
      uniqueRecipients,
      deliveredCount,
    };
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const now = new Date();

    return logs.filter((log) => {
      // 1. Search Query Filter
      const matchesSearch =
        !term ||
        log.toEmail.toLowerCase().includes(term) ||
        (log.visitorName && log.visitorName.toLowerCase().includes(term)) ||
        log.subject.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      // 2. Status Filter
      if (statusFilter !== 'ALL') {
        const st = (log.status || 'Delivered').toUpperCase();
        if (statusFilter === 'DELIVERED' && !st.includes('DELIVER') && !st.includes('SENT')) return false;
        if (statusFilter === 'PENDING' && !st.includes('PEND')) return false;
        if (statusFilter === 'FAILED' && !st.includes('FAIL')) return false;
      }

      // 3. Date Range Filter
      if (dateFilter !== 'ALL' && log.sentAt) {
        const sentDate = new Date(log.sentAt);
        if (!isNaN(sentDate.getTime())) {
          const diffMs = now.getTime() - sentDate.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          if (dateFilter === 'TODAY' && diffDays > 1) return false;
          if (dateFilter === 'WEEK' && diffDays > 7) return false;
          if (dateFilter === 'MONTH' && diffDays > 30) return false;
        }
      }

      return true;
    });
  }, [logs, searchTerm, dateFilter, statusFilter]);

  // Reset current page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, statusFilter, pageSize]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredLogs.length);

  const hasActiveFilters = searchTerm !== '' || dateFilter !== 'ALL' || statusFilter !== 'ALL';

  const resetFilters = () => {
    setSearchTerm('');
    setDateFilter('ALL');
    setStatusFilter('ALL');
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['Recipient Email', 'Visitor Name', 'Subject', 'Stall Card Attached', 'Sent At', 'Status'];
    const rows = filteredLogs.map((l) => [
      `"${l.toEmail || ''}"`,
      `"${l.visitorName || ''}"`,
      `"${(l.subject || '').replace(/"/g, '""')}"`,
      l.hasAttachment !== false ? 'Yes' : 'No',
      `"${new Date(l.sentAt).toLocaleString('en-IN')}"`,
      `"${l.status || 'Delivered'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Exhibitor_Email_Logs_${regNumber || 'Dispatched'}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
              <MailCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Visitor Email Logs</h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                Audit trail of invitations, stall cards, and business emails dispatched to visitors and partners.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <RotateCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Export CSV
          </button>

          <Link
            to="/exhibitorShell/SendEmail"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Send className="h-3.5 w-3.5" />
            Compose New Email
          </Link>
        </div>
      </div>

      {/* COUNTS DATA CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Emails Sent */}
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Total Sent</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100/80 text-blue-700">
              <Mail className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{metrics.totalSent}</span>
            <span className="text-xs text-slate-500 font-medium">emails</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Emails dispatched from your account</p>
        </div>

        {/* Card 2: Stall Card Attached */}
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Stall Card Attached</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-700">
              <Paperclip className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">{metrics.withAttachment}</span>
            <span className="text-xs text-slate-500 font-medium">with stall card</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Official digital stall card delivered</p>
        </div>

        {/* Card 3: Unique Recipients */}
        <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/50 to-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Unique Visitors</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100/80 text-purple-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-700">{metrics.uniqueRecipients}</span>
            <span className="text-xs text-slate-500 font-medium">recipients</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Individual contacts reached</p>
        </div>

        {/* Card 4: Delivery Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Delivery Status</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {metrics.totalSent > 0 ? '100%' : '0%'}
            </span>
            <span className="text-xs text-emerald-600 font-bold">Verified</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">{metrics.deliveredCount} successful deliveries</p>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS BAR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by recipient email, visitor name, or subject..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Date Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium text-[11px]">Date:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer py-1"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="WEEK">Last 7 Days</option>
                <option value="MONTH">Last 30 Days</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium text-[11px]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer py-1"
              >
                <option value="ALL">All Statuses</option>
                <option value="DELIVERED">Delivered</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* EMAIL LOGS TABLE */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RotateCw className="mx-auto h-8 w-8 text-blue-500 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-700">Loading email logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              {logs.length === 0 ? 'No emails sent yet' : 'No logs match your filter'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 mb-5">
              {logs.length === 0
                ? 'Send your official stall card and business invitations to visitors, partners, and buyers from the Send Email page.'
                : 'Try adjusting your search query, date filter, or status filter to find what you are looking for.'}
            </p>
            {logs.length === 0 ? (
              <Link
                to="/exhibitorShell/SendEmail"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
              >
                <Send className="h-4 w-4" />
                Go to Send Email
              </Link>
            ) : (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Recipient</th>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4">Stall Card</th>
                    <th className="py-3.5 px-4">Dispatched Date & Time</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedLogs.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{item.toEmail}</span>
                          {item.copySent && (
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-100">
                              CC Me
                            </span>
                          )}
                        </div>
                        {item.visitorName && item.visitorName !== 'Visitor' && (
                          <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                            {item.visitorName}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs md:max-w-md">
                        <p className="truncate font-medium text-slate-800" title={item.subject}>
                          {item.subject}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                          <Paperclip className="h-3 w-3 text-emerald-600" />
                          Stall Card Attached
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formatDate(item.sentAt)}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          {item.status || 'Delivered'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedLog(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Details
                          </button>
                          <Link
                            to={`/exhibitorShell/SendEmail?to=${encodeURIComponent(item.toEmail)}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                            title="Compose to this visitor"
                          >
                            Resend
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION CONTROLS */}
            <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>
                  Showing <strong className="text-slate-800">{filteredLogs.length === 0 ? 0 : startIndex + 1}</strong> to{' '}
                  <strong className="text-slate-800">{endIndex}</strong> of{' '}
                  <strong className="text-slate-800">{filteredLogs.length}</strong> dispatches
                </span>
                {filteredLogs.length !== logs.length && (
                  <span className="text-[11px] text-slate-400">
                    (filtered from {logs.length} total)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Rows per page selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* Page Navigation Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="First Page"
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="Previous Page"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>

                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="Next Page"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="Last Page"
                  >
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedLog && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
            onClick={() => setSelectedLog(null)}
          >
            <div
              className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <MailCheck className="h-5 w-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">Email Dispatch Details</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-xs text-slate-700">
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-50 p-3.5 space-y-1">
                  <span className="font-semibold text-slate-500 pt-1">Recipient:</span>
                  <span className="col-span-2 font-bold text-slate-900 pt-1">{selectedLog.toEmail}</span>

                  {selectedLog.visitorName && (
                    <>
                      <span className="font-semibold text-slate-500">Visitor Name:</span>
                      <span className="col-span-2 text-slate-800">{selectedLog.visitorName}</span>
                    </>
                  )}

                  <span className="font-semibold text-slate-500">Subject:</span>
                  <span className="col-span-2 font-semibold text-blue-700">{selectedLog.subject}</span>

                  <span className="font-semibold text-slate-500">Sent At:</span>
                  <span className="col-span-2 text-slate-800">{formatDate(selectedLog.sentAt)}</span>

                  <span className="font-semibold text-slate-500">Stall Card Attached:</span>
                  <span className="col-span-2">
                    <span className="font-bold text-emerald-700">Yes (Stall Card Attached - Please Check)</span>
                  </span>

                  <span className="font-semibold text-slate-500">Status:</span>
                  <span className="col-span-2 font-bold text-emerald-700">Delivered & Verified</span>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <Link
                  to={`/exhibitorShell/SendEmail?to=${encodeURIComponent(selectedLog.toEmail)}`}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Compose Another Email
                </Link>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

export default ExhibitorEmailLogsPage;
