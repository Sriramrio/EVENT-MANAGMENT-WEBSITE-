import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../../data/api/apiClient';
import { StatusBadge } from '../../shared/StatusBadge';
import { useSession } from '../../app/session';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshListButton } from '../../shared/components/RefreshListButton';
// --- Types matching API response -----------------

interface PaymentSummaryRow {
  bookingId: string;
  bookingRegistrationNumber: string;
  stallNumber: string;
  stallSize: string;
  stallSizeCode: string;
  isSponsor: boolean;
  targetSponsorAmount: number;
  baseAmount: number;
  gstPercentage: number;
  gstAmount: number;
  expectedTotalAmount: number;
  isGstApplicable: boolean;
  isTdsDeducted: boolean;
  tanNumber: string;
  tdsDeductionAmount: number;
  netBankReceivableAfterTds: number;
  summary: {
    totalBankPaid: number;
    balanceRemaining: number;
    isFullySettled: boolean;
    paymentCount: number;
  };
}

interface PaymentSummaryMetrics {
  totalBookingsCount: number;
  totalExpectedCollection: number;
  totalTdsDeductions: number;
  totalNetReceivables: number;
  totalBankReceived: number;
  totalOutstandingBalance: number;
}

interface PaymentSummaryResponse {
  metrics: PaymentSummaryMetrics;
  totalFullySettled: number;
  totalPendingSettlement: number;
  data: PaymentSummaryRow[];
}

type SortKey = 'booking' | 'expected' | 'tds' | 'netReceivable' | 'paid' | 'balance';
type SortDirection = 'asc' | 'desc';
type SettlementFilter = 'All' | 'Settled' | 'Pending';
type TdsFilter = 'All' | 'Deducted' | 'NotDeducted';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const PAYMENT_SUMMARIES_KEY = ['admin', 'payment-summaries'] as const;
function formatInr(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function PaymentSummaryPage() {
  const queryClient = useQueryClient();
  const { data: response = null, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: PAYMENT_SUMMARIES_KEY,
    queryFn: () => apiClient.get<PaymentSummaryResponse>('/admin/events/current/bookings/payment-summaries'),
  });
  const error = queryError ? (queryError as any)?.message || 'Failed to load payment summaries.' : '';
  const [remindMessage, setRemindMessage] = useState<{ id: string; kind: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [settlementFilter, setSettlementFilter] = useState<SettlementFilter>('All');
  const [tdsFilter, setTdsFilter] = useState<TdsFilter>('All');
  const [sortKey, setSortKey] = useState<SortKey>('booking');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const user = useSession(s => s.user);
  const [remindingId, setRemindingId] = useState<string | null>(null);

  async function refresh() {
    await refetch();
  }


  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection(dir => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }

  function SortIndicator({ column }: { column: SortKey }) {
    if (sortKey !== column) {
      return <span className="ml-1 text-slate-300">↕</span>;
    }
    return (
      <span className="ml-1 text-slate-700">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  }

  const rows = response?.data ?? [];

  const visibleRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    let filtered = !normalizedSearch
      ? rows
      : rows.filter(r => {
        const haystack = [
          r.bookingRegistrationNumber,
          r.stallNumber,
          r.tanNumber,
          r.stallSize,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      });

    // Settlement Filter
    if (settlementFilter === 'Settled') {
      filtered = filtered.filter(r => r.summary.isFullySettled);
    } else if (settlementFilter === 'Pending') {
      filtered = filtered.filter(r => !r.summary.isFullySettled);
    }

    // TDS Status Filter
    if (tdsFilter === 'Deducted') {
      filtered = filtered.filter(r => r.isTdsDeducted);
    } else if (tdsFilter === 'NotDeducted') {
      filtered = filtered.filter(r => !r.isTdsDeducted);
    }

    const directionMultiplier = sortDirection === 'asc' ? 1 : -1;

    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'booking': {
          const aVal = `${a.bookingRegistrationNumber || ''} ${a.stallNumber || ''}`.toLowerCase();
          const bVal = `${b.bookingRegistrationNumber || ''} ${b.stallNumber || ''}`.toLowerCase();
          return aVal.localeCompare(bVal) * directionMultiplier;
        }
        case 'expected':
          return (a.expectedTotalAmount - b.expectedTotalAmount) * directionMultiplier;
        case 'tds':
          return (a.tdsDeductionAmount - b.tdsDeductionAmount) * directionMultiplier;
        case 'netReceivable':
          return (a.netBankReceivableAfterTds - b.netBankReceivableAfterTds) * directionMultiplier;
        case 'paid':
          return (a.summary.totalBankPaid - b.summary.totalBankPaid) * directionMultiplier;
        case 'balance':
          return (a.summary.balanceRemaining - b.summary.balanceRemaining) * directionMultiplier;
        default:
          return 0;
      }
    });
  }, [rows, searchTerm, settlementFilter, tdsFilter, sortKey, sortDirection]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, settlementFilter, tdsFilter, sortKey, sortDirection, pageSize, rows.length]);

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return visibleRows.slice(start, start + pageSize);
  }, [visibleRows, safePage, pageSize]);

  const rangeStart = visibleRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, visibleRows.length);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    let start = Math.max(1, safePage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    const pages: number[] = [];
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  }, [safePage, totalPages]);


  // async function sendPaymentReminder(booking: PaymentSummaryRow) {
  //   if (!user?.id) {
  //     setRemindMessage({ id: booking.bookingId, kind: 'error', text: 'You must be logged in to send a reminder.' });
  //     return;
  //   }
  //   try {
  //     setRemindingId(booking.bookingId);
  //     setRemindMessage(null);
  //     const response = await apiClient.post<{ recipient: string; message: string }>(
  //       `/admin/events/current/bookings/${booking.bookingId}/payment-reminder/send-email`,
  //       { actorUserId: user.id },
  //     );
  //     setRemindMessage({ id: booking.bookingId, kind: 'success', text: response?.message || `Reminder emailed to ${response?.recipient ?? 'exhibitor'}.` });
  //   } catch (err: any) {
  //     setRemindMessage({ id: booking.bookingId, kind: 'error', text: err?.message || 'Failed to send payment reminder email. Please try again.' });
  //   } finally {
  //     setRemindingId(null);
  //     window.setTimeout(() => {
  //       setRemindMessage(current => (current?.id === booking.bookingId ? null : current));
  //     }, 5000);
  //   }
  // }

  // --- CSV Export Handler -----------------
  function exportToCsv() {
    if (!visibleRows.length) return;

    const headers = [
      'Booking Reg No',
      'Stall Number',
      'Stall Size',
      'Is Sponsor',
      'Target Sponsor Amount',
      'Expected Amount',
      'Is TDS Deducted',
      'Is Gst Applicable',
      'TAN Number',
      'TDS Deduction Amount',
      'Net Bank Receivable',
      'Total Bank Paid',
      'Balance Remaining',
      'Status',
    ];

    const csvRows = visibleRows.map(r => [
      `"${r.bookingRegistrationNumber || ''}"`,
      `"${r.stallNumber || ''}"`,
      `"${r.stallSize || ''}"`,
      r.isSponsor ? 'Yes' : 'No',
      r.targetSponsorAmount || 0,
      r.expectedTotalAmount || 0,
      r.isTdsDeducted ? 'Yes' : 'No',
      r.isGstApplicable || false,
      r.tanNumber || 0,
      r.tdsDeductionAmount || 0,


      r.netBankReceivableAfterTds || 0,
      r.netBankReceivableAfterTds || 0,
      r.summary?.balanceRemaining || 0,
      r.summary?.isFullySettled ? 'Confirmed' : 'Payment Submitted',
    ]);

    const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `payment_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold">Payment Summary &amp; TDS Settlement</h2>
          <p className="text-sm text-slate-500">
            Financial breakdown of every booking — expected amount, TDS deduction status, net bank-receivable, and collections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* CSV Download Button */}
          <button
            type="button"
            onClick={exportToCsv}
            disabled={visibleRows.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
          <RefreshListButton
            onRefresh={() => queryClient.invalidateQueries({ queryKey: PAYMENT_SUMMARIES_KEY })}
            loading={loading}
          />
        </div>
      </div>

      {/* Quick Counts */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <span>
          <span className="font-bold text-emerald-600">{response?.totalFullySettled ?? '—'}</span>{' '}
          fully settled
        </span>
        <span className="text-slate-300">•</span>
        <span>
          <span className="font-bold text-amber-600">{response?.totalPendingSettlement ?? '—'}</span>{' '}
          pending settlement
        </span>
      </div>

      {/* Search & Filters */}
      <div className="card mt-6 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="search"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search booking or stall number..."
            className="input w-full max-w-sm"
          />

          {/* Settlement Filter */}
          <select
            className="input w-auto"
            value={settlementFilter}
            onChange={e => setSettlementFilter(e.target.value as SettlementFilter)}
          >
            <option value="All">All Settlement Status</option>
            <option value="Settled">Fully Settled</option>
            <option value="Pending">Pending Settlement</option>
          </select>

          {/* TDS Filter */}
          <select
            className="input w-auto"
            value={tdsFilter}
            onChange={e => setTdsFilter(e.target.value as TdsFilter)}
          >
            <option value="All">All TDS Status</option>
            <option value="Deducted">TDS Deducted</option>
            <option value="NotDeducted">TDS Not Deducted</option>
          </select>
        </div>

        <p className="whitespace-nowrap text-sm text-slate-500">
          <span className="font-bold text-slate-900">{visibleRows.length}</span> of{' '}
          <span className="font-bold text-slate-900">{rows.length}</span> bookings
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Table Container */}
      <div className="card mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th
                  className="cursor-pointer select-none whitespace-nowrap p-4 hover:text-slate-700"
                  onClick={() => toggleSort('booking')}
                >
                  Booking / Stall
                  <SortIndicator column="booking" />
                </th>

                <th
                  className="cursor-pointer select-none whitespace-nowrap p-4 hover:text-slate-700"
                  onClick={() => toggleSort('expected')}
                >
                  Expected Amount
                  <SortIndicator column="expected" />
                </th>

                <th
                  className="cursor-pointer select-none whitespace-nowrap p-4 hover:text-slate-700"
                  onClick={() => toggleSort('tds')}
                >
                  TDS Details
                  <SortIndicator column="tds" />
                </th>
                <th
                  className="cursor-pointer select-none whitespace-nowrap p-4 hover:text-slate-700"
                  onClick={() => toggleSort('tds')}
                >
                  Is Gst Applicable
                  <SortIndicator column="tds" />
                </th>
                <th className="p-4 whitespace-nowrap">
                  TAN Number
                </th>

                <th
                  className="cursor-pointer select-none whitespace-nowrap p-4 hover:text-slate-700"
                  onClick={() => toggleSort('netReceivable')}
                >
                  Net Receivable
                  <SortIndicator column="netReceivable" />
                </th>


                <th
                  className="cursor-pointer select-none whitespace-nowrap p-4 hover:text-slate-700"
                  onClick={() => toggleSort('paid')}
                >
                  Amount Received
                  <SortIndicator column="paid" />
                </th>

                <th
                  className="cursor-pointer select-none whitespace-nowrap p-4 hover:text-slate-700"
                  onClick={() => toggleSort('balance')}
                >
                  Balance
                  <SortIndicator column="balance" />
                </th>

                <th className="whitespace-nowrap p-4">Status</th>
                {/* <th className="p-4">Action</th> */}

              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={7}>
                    Loading payment summaries…
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedRows.map(row => (
                  <tr key={`${row.bookingId}-${row.stallNumber}`} className="border-t">
                    <td className="p-4 font-semibold">
                      {row.bookingRegistrationNumber}
                      <div className="mt-0.5 text-xs font-normal text-slate-500">
                        {row.stallNumber} • {row.stallSize}
                      </div>
                    </td>

                    <td className="p-4">
                      {row.isSponsor ? (
                        <div>
                          <div className="font-semibold text-purple-700">
                            {formatInr(row.targetSponsorAmount || row.expectedTotalAmount)}
                          </div>
                          <span className="inline-flex items-center rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 ring-1 ring-inset ring-purple-600/20">
                            Sponsor Target
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div className="font-semibold text-slate-900">
                            {formatInr(row.expectedTotalAmount)}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-400">
                            Base {formatInr(row.baseAmount)} + GST {formatInr(row.gstAmount)}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      {row.isTdsDeducted ? (
                        <span className="inline-flex items-center rounded bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          TDS Deducted
                        </span>
                      ) : (
                        <div>
                          <span className="inline-flex items-center rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                            {row.isSponsor ? 'TDS Not Deducted' : 'To Deduct (2%)'}
                          </span>
                          {!row.isSponsor && row.tdsDeductionAmount > 0 && (
                            <div className="mt-0.5 text-xs font-bold text-slate-700">
                              {formatInr(row.tdsDeductionAmount)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {row.isGstApplicable ? (
                        <span className="inline-flex items-center rounded bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          GST Applicable
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 ring-1 ring-inset ring-slate-500/20">
                          GST Not Applicable
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-slate-900">
                      {row.tanNumber || "—"}
                    </td>
                    <td className="p-4 font-semibold text-slate-900">
                      {formatInr(row.netBankReceivableAfterTds)}
                    </td>

                    <td className="p-4 font-semibold text-emerald-600">
                      {formatInr(row.netBankReceivableAfterTds)}
                      {row.summary.paymentCount > 0 && (
                        <div className="mt-0.5 text-xs font-normal text-slate-400">
                          {row.summary.paymentCount} payment
                          {row.summary.paymentCount > 1 ? 's' : ''}
                        </div>
                      )}
                    </td>

                    <td className="p-4 font-semibold text-amber-600">
                      {row.summary.balanceRemaining > 0
                        ? formatInr(row.summary.balanceRemaining)
                        : '—'}
                    </td>

                    <td className="p-4">
                      <StatusBadge
                        value={row.summary.isFullySettled ? 'Confirmed' : 'PaymentSubmitted'}
                      />
                    </td>

                  </tr>
                ))}

              {!loading && visibleRows.length === 0 && (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={7}>
                    {rows.length === 0
                      ? 'No booking payment data available.'
                      : 'No records match your search / filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && visibleRows.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>
                Showing{' '}
                <span className="font-semibold text-slate-900">{rangeStart}</span>
                {'–'}
                <span className="font-semibold text-slate-900">{rangeEnd}</span>
                {' of '}
                <span className="font-semibold text-slate-900">{visibleRows.length}</span>
              </span>

              <label htmlFor="summary-page-size" className="ml-4 flex items-center gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Rows
                </span>

                <select
                  id="summary-page-size"
                  value={pageSize}
                  onChange={event => setPageSize(Number(event.target.value))}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none transition focus:border-msme-blue focus:ring-2 focus:ring-msme-blue/10"
                >
                  {PAGE_SIZE_OPTIONS.map(size => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safePage === 1}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-msme-blue hover:text-msme-blue disabled:cursor-not-allowed disabled:opacity-40"
              >
                «
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-msme-blue hover:text-msme-blue disabled:cursor-not-allowed disabled:opacity-40"
              >
                ‹
              </button>

              {pageNumbers[0] > 1 && (
                <span className="px-1.5 text-sm text-slate-400">…</span>
              )}

              {pageNumbers.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${p === safePage
                    ? 'bg-msme-blue text-white'
                    : 'border border-slate-200 text-slate-600 hover:border-msme-blue hover:text-msme-blue'
                    }`}
                >
                  {p}
                </button>
              ))}

              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <span className="px-1.5 text-sm text-slate-400">…</span>
              )}

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-msme-blue hover:text-msme-blue disabled:cursor-not-allowed disabled:opacity-40"
              >
                ›
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage === totalPages}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-msme-blue hover:text-msme-blue disabled:cursor-not-allowed disabled:opacity-40"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}