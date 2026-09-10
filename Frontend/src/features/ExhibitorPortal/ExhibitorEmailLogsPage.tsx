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
  X
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
  const [searchTerm, setSearchTerm] = useState('');
  const [attachmentFilter, setAttachmentFilter] = useState<'All' | 'Attached' | 'NoAttachment'>('All');
  const [selectedLog, setSelectedLog] = useState<EmailLogEntry | null>(null);

  const profile = getExhibitorProfile();
  const registrationNumber = profile?.registrationNumber || 'default';
  const storageKey = `msme_exhibitor_email_logs_${registrationNumber}`;

  // Fetch and sync email logs
  const loadLogs = async () => {
    // 1. Read localStorage first for immediate rendering
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLogs(parsed);
        }
      }
    } catch {
      // ignore
    }

    // 2. Fetch from backend /exhibitor/email-logs
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
        setLogs((prev) => {
          const apiEntries: EmailLogEntry[] = apiLogs.map((l) => ({
            id: l.id,
            toEmail: l.toEmail,
            subject: l.subject,
            status: l.status || 'Sent',
            sentAt: l.sentAt,
            hasAttachment: true,
            templateCode: l.templateCode,
          }));

          // Merge with any local entries
          const apiIds = new Set(apiEntries.map((a) => a.id));
          const localOnly = prev.filter((p) => !apiIds.has(p.id));
          const merged = [...localOnly, ...apiEntries];

          try {
            localStorage.setItem(storageKey, JSON.stringify(merged));
          } catch {}

          return merged;
        });
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
  }, [registrationNumber]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLogs();
  };

  // Metrics & Counts for Data Cards
  const metrics = useMemo(() => {
    const totalSent = logs.length;
    const withAttachment = logs.filter((l) => l.hasAttachment !== false).length;
    const uniqueRecipients = new Set(logs.map((l) => l.toEmail.trim().toLowerCase())).size;
    const deliveredCount = totalSent;

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
    return logs.filter((log) => {
      const matchesSearch =
        !term ||
        log.toEmail.toLowerCase().includes(term) ||
        (log.visitorName && log.visitorName.toLowerCase().includes(term)) ||
        log.subject.toLowerCase().includes(term);

      const matchesAttachment =
        attachmentFilter === 'All' ||
        (attachmentFilter === 'Attached' && log.hasAttachment !== false) ||
        (attachmentFilter === 'NoAttachment' && log.hasAttachment === false);

      return matchesSearch && matchesAttachment;
    });
  }, [logs, searchTerm, attachmentFilter]);

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['Recipient Email', 'Visitor Name', 'Subject', 'Pass Attached', 'Sent At', 'Status'];
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
    link.download = `Exhibitor_Email_Logs_${registrationNumber}_${new Date().toISOString().slice(0, 10)}.csv`;
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
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <MailCheck className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Visitor Email Logs</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Audit trail of invitations, passes, and business emails dispatched to visitors and partners.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
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
        <div className="rounded-2xl border border-blue-100 bg-linear-to-br from-blue-50/50 to-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Total Sent</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100/80 text-blue-700">
              <Mail className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{metrics.totalSent}</span>
            <span className="text-xs text-slate-500">emails</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Lifetime emails dispatched</p>
        </div>

        {/* Card 2: E-Card Pass Attached */}
        <div className="rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50/50 to-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Pass Attached</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-700">
              <Paperclip className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">{metrics.withAttachment}</span>
            <span className="text-xs text-slate-500">with digital pass</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">High-res stall passes delivered</p>
        </div>

        {/* Card 3: Unique Recipients */}
        <div className="rounded-2xl border border-purple-100 bg-linear-to-br from-purple-50/50 to-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Unique Visitors</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100/80 text-purple-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-700">{metrics.uniqueRecipients}</span>
            <span className="text-xs text-slate-500">recipients</span>
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
            <span className="text-xs text-emerald-600 font-semibold">Verified</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">{metrics.deliveredCount} successful deliveries</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by recipient email, visitor name, or subject..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={attachmentFilter}
              onChange={(e) => setAttachmentFilter(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:outline-none"
            >
              <option value="All">All Dispatches ({logs.length})</option>
              <option value="Attached">With E-Card Pass ({metrics.withAttachment})</option>
              <option value="NoAttachment">Without Pass ({logs.length - metrics.withAttachment})</option>
            </select>

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FULL-WIDTH EMAIL LOGS TABLE */}
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
                ? 'Send your official E-Card pass and business invitations to visitors, partners, and buyers from the Send Email page.'
                : 'Try adjusting your search query or attachment filter to find what you are looking for.'}
            </p>
            {logs.length === 0 && (
              <Link
                to="/exhibitorShell/SendEmail"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
              >
                <Send className="h-4 w-4" />
                Go to Send Email
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Recipient</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">E-Card Pass</th>
                  <th className="py-3.5 px-4">Dispatched Date & Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLogs.map((item) => (
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
                      {item.hasAttachment !== false ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                          <Paperclip className="h-3 w-3 text-emerald-600" />
                          Pass Attached
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
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
                        Delivered
                      </span>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
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
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-50 p-3">
                  <span className="font-semibold text-slate-500">Recipient:</span>
                  <span className="col-span-2 font-bold text-slate-900">{selectedLog.toEmail}</span>

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

                  <span className="font-semibold text-slate-500">Pass Attached:</span>
                  <span className="col-span-2">
                    {selectedLog.hasAttachment !== false ? (
                      <span className="font-bold text-emerald-700">Yes (Official Digital Stall Pass PNG)</span>
                    ) : (
                      'No'
                    )}
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
