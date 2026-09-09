import { useEffect, useMemo, useState } from 'react';
import type { StallBooking } from '../../domain/models';
import { apiRepositories as repositories } from '../../data/api/ApiRepositories';
import { apiClient } from '../../data/api/apiClient';
import { useSession } from '../../app/session';
import { PERMISSIONS } from '../../config/permissions';
import { StatusBadge } from '../../shared/StatusBadge';
import { Eye, InfoIcon } from 'lucide-react';
import { SponsorStall } from '../stalls/SponsorstallPage';
import { Check } from '../public/PublicBookingPage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshListButton } from '../../shared/components/RefreshListButton';
type SortKey = 'booking' | 'status' | 'expectedAmount' | 'blockExpiresAt';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'All' | 'BlockedAwaitingPayment' | 'PaymentSubmitted';
type SponsorFilter = 'All' | 'Sponsor' | 'Regular';
const BOOKINGS_KEY = ['admin', 'bookings'] as const;
const SPONSOR_STALLS_KEY = ['admin', 'sponsor-stalls'] as const;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function getPaidAmount(booking: StallBooking): number {
  return Number(booking.totalPaidAmount || 0);
}

function getBalanceAmount(booking: StallBooking): number {
  if (booking.balanceDueAmount != null) {
    return booking.balanceDueAmount > 0 ? booking.balanceDueAmount : 0;
  }
  const balance = Number(booking.expectedAmount || 0) - getPaidAmount(booking);
  return balance > 0 ? balance : 0;
}

export function PaymentQueuePage() {
  const queryClient = useQueryClient();
  const { data: initialBookings = [] } = useQuery({
    queryKey: BOOKINGS_KEY,
    queryFn: () => repositories.bookings.list('All'),
  });
  const { data: initialSponsorStalls = [] } = useQuery({
    queryKey: SPONSOR_STALLS_KEY,
    queryFn: () => apiClient.get<SponsorStall[]>('/admin/events/current/sponsor-stalls'),
  });
  const [bookings, setBookings] = useState<StallBooking[]>([]);
  useEffect(() => {
    if (initialBookings.length > 0) {
      setBookings(
        initialBookings.filter(x =>
          ['BlockedAwaitingPayment', 'PaymentSubmitted'].includes(x.bookingStatus)
        )
      );
    }
  }, [initialBookings]);
  const [selectedBooking, setSelectedBooking] = useState<StallBooking | null>(null);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [sponsorFilter, setSponsorFilter] = useState<SponsorFilter>('All');
  const [districtFilter, setDistrictFilter] = useState<string>('All');

  const [sortKey, setSortKey] = useState<SortKey>('blockExpiresAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [viewBooking, setViewBooking] = useState<StallBooking | null>(null);
  const [paymentType, setPaymentType] = useState<'Full' | 'Part'>('Full');

  const [paymentForm, setPaymentForm] = useState({
    paymentReferenceNumber: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    isTdsDeductable: false,
    isGstApplicable: true,
    payerName: '',
    payerBank: '',
    gstType: '',
    gstAmount: '',
    amountPaid: 0,
    partAmountPaid: 0,
    remarks: '',
    TargetSponsorTotal: 0
  });

  const [extendTarget, setExtendTarget] = useState<StallBooking | null>(null);
  const [newExpiryAt, setNewExpiryAt] = useState('');
  const [extending, setExtending] = useState(false);
  const [extendError, setExtendError] = useState('');
  const [stalls, setStalls] = useState<SponsorStall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [remindMessage, setRemindMessage] = useState<{ id: string; kind: 'success' | 'error'; text: string } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkExtendOpen, setBulkExtendOpen] = useState(false);
  const [bulkNewExpiryAt, setBulkNewExpiryAt] = useState('');
  const [bulkExtending, setBulkExtending] = useState(false);
  const [bulkExtendError, setBulkExtendError] = useState('');
  const canViewPayment = useSession(s => s.hasPermission(PERMISSIONS.paymentView));
  const [actionButton, setShowActionButton] = useState<StallBooking | null>(null);
  const [bulkSendingEditAccess, setBulkSendingEditAccess] = useState(false);
  const user = useSession(s => s.user);
  const canVerify = useSession(s =>
    s.hasPermission(PERMISSIONS.paymentVerify)
  );
  const hasBookingManage = useSession(s =>
    s.hasPermission(PERMISSIONS.adminUsersManage)
  );

  function calculateGst(amount: number, rate = 18) {
    return Math.round((amount * rate) / 100);
  }
  async function sendPaymentReminder(booking: StallBooking) {
    if (!user?.id) {
      setRemindMessage({ id: booking.id, kind: 'error', text: 'You must be logged in to send a reminder.' });
      return;
    }
    try {
      setRemindingId(booking.id);
      setRemindMessage(null);
      const response = await apiClient.post<{ recipient: string; message: string }>(
        `/admin/events/current/bookings/${booking.id}/payment-reminder/send-email`,
        { actorUserId: user.id },
      );
      setRemindMessage({ id: booking.id, kind: 'success', text: response?.message || `Reminder emailed to ${response?.recipient ?? 'exhibitor'}.` });
    } catch (err: any) {
      setRemindMessage({ id: booking.id, kind: 'error', text: err?.message || 'Failed to send payment reminder email. Please try again.' });
    } finally {
      setRemindingId(null);
      window.setTimeout(() => {
        setRemindMessage(current => (current?.id === booking.id ? null : current));
      }, 5000);
    }
  }
  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    const pageIds = paginatedBookings.map(b => b.id);
    const allSelected = pageIds.every(id => selectedIds.has(id));

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach(id => next.delete(id));
      } else {
        pageIds.forEach(id => next.add(id));
      }
      return next;
    });
  }

  function openBulkExtendModal() {
    setBulkNewExpiryAt('');
    setBulkExtendError('');
    setBulkExtendOpen(true);
  }

  function closeBulkExtendModal() {
    if (bulkExtending) return;
    setBulkExtendOpen(false);
    setBulkNewExpiryAt('');
    setBulkExtendError('');
  }

  async function submitBulkExtend() {
    if (!user?.id) {
      setBulkExtendError('You must be logged in to extend blocks.');
      return;
    }

    if (selectedIds.size === 0) {
      setBulkExtendError('Select at least one booking first.');
      return;
    }

    if (!bulkNewExpiryAt) {
      setBulkExtendError('Pick a new expiry date and time first.');
      return;
    }

    const newExpiryDate = new Date(bulkNewExpiryAt);

    if (Number.isNaN(newExpiryDate.getTime()) || newExpiryDate <= new Date()) {
      setBulkExtendError('New expiry date must be a valid time in the future.');
      return;
    }

    try {
      setBulkExtending(true);
      setBulkExtendError('');

      const response = await apiClient.post<{
        message: string;
        totalRequested: number;
        totalUpdated: number;
        skippedCount: number;
        updatedBookings: { bookingId: string; blockExpiresAt: string }[];
      }>('/admin/events/current/bookings/bulk-extend-block', {
        actorUserId: user.id,
        bookingIds: Array.from(selectedIds),
        newExpiryAt: newExpiryDate.toISOString(),
      });

      const updatedMap = new Map(
        (response?.updatedBookings || []).map(u => [u.bookingId, u.blockExpiresAt])
      );

      setBookings(previous =>
        previous.map(booking =>
          updatedMap.has(booking.id)
            ? { ...booking, blockExpiresAt: updatedMap.get(booking.id)! }
            : booking
        )
      );

      alert(
        response?.message ||
        `Extended ${response?.totalUpdated ?? 0} of ${response?.totalRequested ?? selectedIds.size} booking(s).`
      );

      setSelectedIds(new Set());
      setBulkExtendOpen(false);
      setBulkNewExpiryAt('');
    } catch (err: any) {
      console.error('BULK EXTEND BLOCK ERROR', err);
      setBulkExtendError(err?.message || 'Failed to extend block expiry. Please try again.');
    } finally {
      setBulkExtending(false);
    }
  }

  async function handleBulkSendEditAccess() {
    const hasSelection = selectedIds.size > 0;
    const targetCount = hasSelection ? selectedIds.size : visibleBookings.length;

    if (targetCount === 0) {
      alert('No bookings available to send the edit access mail.');
      return;
    }

    const confirmMessage = hasSelection
      ? `This will email the edit link to the ${targetCount} selected booking(s). Continue?`
      : `No bookings selected — this will email the edit link to ALL ${targetCount} booking(s) currently in the queue. Continue?`;

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    try {
      setBulkSendingEditAccess(true);
      const res = await apiClient.post<{ emailsSent: number; totalEligible: number; message: string }>(
        '/admin/events/current/bookings/send-edit-access-allocated',
        hasSelection ? { bookingIds: Array.from(selectedIds) } : { bookingIds: visibleBookings.map(b => b.id) }
      );
      alert(res?.message || `Sent to ${res?.emailsSent ?? 0} booking(s).`);
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error('BULK EDIT ACCESS ERROR', err);
      alert(err?.message || 'Failed to send bulk edit access emails.');
    } finally {
      setBulkSendingEditAccess(false);
    }
  }
  useEffect(() => {
    if (initialSponsorStalls.length > 0) {
      setStalls(initialSponsorStalls);
      setIsLoading(false);
    }
  }, [initialSponsorStalls]);
  async function refresh() {
    queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
    queryClient.invalidateQueries({ queryKey: ['admin', 'payment-summaries'] });
    const b = await repositories.bookings.list('All');

    setBookings(
      b.filter(x =>
        ['BlockedAwaitingPayment', 'PaymentSubmitted'].includes(x.bookingStatus)
      )
    );
  }


  const isSponsorStall = (booking: StallBooking) =>
    stalls.some(
      stall =>
        stall.stallNumber?.trim().toLowerCase() ===
        booking.stallNumber?.trim().toLowerCase()
    );

  // Extract unique sorted districts from bookings for the dropdown filter
  const uniqueDistricts = useMemo(() => {
    const districtsSet = new Set<string>();
    bookings.forEach(b => {
      if (b.district && b.district.trim() !== '') {
        districtsSet.add(b.district.trim());
      }
    });
    return Array.from(districtsSet).sort();
  }, [bookings]);

  function openExtendModal(booking: StallBooking) {
    setExtendTarget(booking);
    setNewExpiryAt('');
    setExtendError('');
  }

  function closeExtendModal() {
    if (extending) return;
    setExtendTarget(null);
    setNewExpiryAt('');
    setExtendError('');
  }

  async function submitExtend() {
    if (!extendTarget) return;

    if (!user?.id) {
      setExtendError('You must be logged in to extend the block.');
      return;
    }

    if (!newExpiryAt) {
      setExtendError('Pick a new expiry date and time first.');
      return;
    }

    const newExpiryDate = new Date(newExpiryAt);

    if (Number.isNaN(newExpiryDate.getTime()) || newExpiryDate <= new Date()) {
      setExtendError('New expiry date must be a valid time in the future.');
      return;
    }

    try {
      setExtending(true);
      setExtendError('');

      const response = await apiClient.post<{ blockExpiresAt: string }>(
        `/admin/events/current/bookings/${extendTarget.id}/extend-block`,
        {
          actorUserId: user.id,
          newExpiryAt: newExpiryDate.toISOString(),
        },
      );

      setBookings(previous =>
        previous.map(booking =>
          booking.id === extendTarget.id
            ? { ...booking, blockExpiresAt: response?.blockExpiresAt ?? newExpiryDate.toISOString() }
            : booking,
        ),
      );

      setExtendTarget(null);
      setNewExpiryAt('');
    } catch (err: any) {
      console.error('EXTEND BLOCK ERROR', err);
      setExtendError(
        err?.message ||
        'Failed to extend the block expiry. Please try again.'
      );
    } finally {
      setExtending(false);
    }
  }

  function getSponsorTargetAmount(booking: StallBooking): number {
    return Number(booking.expectedAmount || booking.totalPaidAmount || 0);
  }

  function openVerifyForm(booking: StallBooking) {
    if (!canVerify) {
      alert('You do not have permission to verify payment.');
      return;
    }
    const sponsorStall = isSponsorStall(booking);

    if (!sponsorStall && (!booking.expectedAmount || booking.expectedAmount <= 0)) {
      alert('Expected amount missing. Please check stall size amount from backend.');
      console.log('BOOKING EXPECTED AMOUNT MISSING', booking);
      return;
    }

    const alreadyPaid = getPaidAmount(booking);
    const balanceDue = getBalanceAmount(booking);
    const hasExistingPartPayment = alreadyPaid > 0 && balanceDue > 0;

    setSelectedBooking(booking);
    setPaymentType(hasExistingPartPayment ? 'Part' : 'Full');
    const existingTarget = sponsorStall ? getSponsorTargetAmount(booking) : Number(booking.expectedAmount || 0);

    setPaymentForm({
      paymentReferenceNumber: '',
      isTdsDeductable: paymentForm.isTdsDeductable,
      isGstApplicable: paymentForm.isGstApplicable,
      paymentDate: new Date().toISOString().slice(0, 10),
      payerName: booking.companyName || booking.fasciaName || '',
      payerBank: '',
      gstType: paymentForm.gstType,
      gstAmount: paymentForm.gstAmount,
      amountPaid: sponsorStall
        ? 0
        : hasExistingPartPayment
          ? balanceDue
          : Number(booking.expectedAmount),

      partAmountPaid: sponsorStall
        ? 0
        : hasExistingPartPayment
          ? balanceDue
          : 0,
      TargetSponsorTotal: existingTarget,
      remarks: sponsorStall ? "Sponsor Stall" : "",
    });
  }

  function handlePaymentTypeChange(nextType: 'Full' | 'Part') {
    setPaymentType(nextType);

    setPaymentForm(previous => ({
      ...previous,
      partAmountPaid: nextType === 'Part' ? previous.partAmountPaid : 0,
    }));
  }

  async function submitVerifyPayment() {
    try {
      if (!canVerify) {
        alert('You do not have permission to verify payment.');
        return;
      }

      if (!user || !selectedBooking) {
        alert('User or booking missing');
        return;
      }

      if (!paymentForm.paymentReferenceNumber.trim()) {
        alert('Payment reference number required');
        return;
      }

      if (!paymentForm.paymentDate) {
        alert('Payment date required');
        return;
      }

      const balanceDue = getBalanceAmount(selectedBooking);

      const effectiveAmountPaid =
        paymentType === 'Part'
          ? Number(paymentForm.partAmountPaid)
          : Number(paymentForm.amountPaid);
      const sponsorStall = isSponsorStall(selectedBooking);

      const gstAmount = sponsorStall && paymentForm.isGstApplicable
        ? calculateGst(effectiveAmountPaid, 18)
        : 0;

      if (!effectiveAmountPaid || effectiveAmountPaid <= 0) {
        alert(
          paymentType === 'Part'
            ? 'Enter a valid part amount'
            : 'Valid amount required'
        );
        return;
      }

      if (
        paymentType === 'Part' &&
        effectiveAmountPaid > balanceDue
      ) {
        alert(
          `Part amount cannot exceed the balance due (₹${balanceDue.toLocaleString('en-IN')}).`
        );
        return;
      }

      setSaving(true);

      await repositories.payments.submitAndVerify(selectedBooking.id, {
        actorUserId: user.id,
        paymentReferenceNumber: paymentForm.paymentReferenceNumber.trim(),
        paymentDate: paymentForm.paymentDate,
        payerName: paymentForm.payerName.trim() || 'Exhibitor',
        payerBank: paymentForm.payerBank.trim(),
        amountPaid: effectiveAmountPaid,
        remarks: paymentForm.remarks.trim(),
        overrideExpiredBlock: false,
        isTdsDeductable: paymentForm.isTdsDeductable,

        TargetSponsorTotal: sponsorStall ? Number(paymentForm.TargetSponsorTotal) : null,
        isGstApplicable: paymentForm.isGstApplicable,
        gstType: paymentForm.gstType,
        gstAmount: '',
      });

      alert(
        paymentType === 'Part'
          ? 'Part payment verified successfully. Booking will stay in the queue until the balance is paid.'
          : 'Payment verified successfully'
      );

      setSelectedBooking(null);
      await refresh();
    } catch (err: any) {
      console.error('PAYMENT VERIFY ERROR', err);
      alert(err?.message || 'Payment verify failed.');
    } finally {
      setSaving(false);
    }
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection(dir => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }

  function exportToCsv() {
    if (!visibleBookings.length) return;

    const headers = [
      'Booking Reg No',
      'Fascia Name',
      'Company Name',
      'Status',
      'Is Sponsor',
      'Expected Amount',
      'Amount Paid',
      'Balance Due',
      'Stall Number',
      'District',
      'Block Expires At',
    ];

    const csvRows = visibleBookings.map(b => [
      `"${b.bookingRegistrationNumber || ''}"`,
      `"${b.fasciaName || ''}"`,
      `"${b.companyName || ''}"`,
      b.bookingStatus || '',
      isSponsorStall(b) ? 'Yes' : 'No',
      Number(b.expectedAmount || 0),
      getPaidAmount(b),
      getBalanceAmount(b),
      `"${b.stallNumber || ''}"`,
      `"${b.district || ''}"`,
      b.blockExpiresAt
        ? new Date(b.blockExpiresAt).toLocaleString('en-IN')
        : '',
    ]);

    const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `payment_queue_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  const visibleBookings = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    let filtered = !normalizedSearch
      ? bookings
      : bookings.filter(booking => {
        const haystack = [
          booking.bookingRegistrationNumber,
          booking.fasciaName,
          booking.companyName,
          booking.bookingStatus,
          booking.district,
          booking.expectedAmount != null ? String(booking.expectedAmount) : '',
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      });

    if (statusFilter !== 'All') {
      filtered = filtered.filter(b => b.bookingStatus === statusFilter);
    }

    if (sponsorFilter === 'Sponsor') {
      filtered = filtered.filter(b => isSponsorStall(b));
    } else if (sponsorFilter === 'Regular') {
      filtered = filtered.filter(b => !isSponsorStall(b));
    }

    if (districtFilter !== 'All') {
      filtered = filtered.filter(
        b => b.district?.trim().toLowerCase() === districtFilter.trim().toLowerCase()
      );
    }

    const directionMultiplier = sortDirection === 'asc' ? 1 : -1;

    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'booking': {
          const aVal = `${a.bookingRegistrationNumber || ''} ${a.fasciaName || ''}`.toLowerCase();
          const bVal = `${b.bookingRegistrationNumber || ''} ${b.fasciaName || ''}`.toLowerCase();
          return aVal.localeCompare(bVal) * directionMultiplier;
        }

        case 'status': {
          const aVal = (a.bookingStatus || '').toLowerCase();
          const bVal = (b.bookingStatus || '').toLowerCase();
          return aVal.localeCompare(bVal) * directionMultiplier;
        }

        case 'expectedAmount': {
          const aVal = Number(a.expectedAmount || 0);
          const bVal = Number(b.expectedAmount || 0);
          return (aVal - bVal) * directionMultiplier;
        }

        case 'blockExpiresAt': {
          const aTime = a.blockExpiresAt ? new Date(a.blockExpiresAt).getTime() : null;
          const bTime = b.blockExpiresAt ? new Date(b.blockExpiresAt).getTime() : null;

          if (aTime === null && bTime === null) return 0;
          if (aTime === null) return 1;
          if (bTime === null) return -1;

          return (aTime - bTime) * directionMultiplier;
        }

        default:
          return 0;
      }
    });

    return sorted;
  }, [bookings, searchTerm, statusFilter, sponsorFilter, districtFilter, sortKey, sortDirection, stalls]);

  function set(name: string, value: string | boolean) {
    setPaymentForm(previous => ({ ...previous, [name]: value }));
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sponsorFilter, districtFilter, sortKey, sortDirection, pageSize, bookings.length]);

  const totalPages = Math.max(1, Math.ceil(visibleBookings.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedBookings = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return visibleBookings.slice(start, start + pageSize);
  }, [visibleBookings, safePage, pageSize]);

  const rangeStart = visibleBookings.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, visibleBookings.length);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    let start = Math.max(1, safePage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);

    const pages: number[] = [];
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    return pages;
  }, [safePage, totalPages]);

  const partAmountExceedsBalance =
    selectedBooking != null &&
    paymentType === 'Part' &&
    Number(paymentForm.partAmountPaid || 0) > getBalanceAmount(selectedBooking);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold">Payment Verification Queue</h2>
          <p className="text-sm text-slate-500">
            Verify payment only after matching amount, transaction reference, date and proof.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (hasBookingManage || canViewPayment) && (
            <button
              type="button"
              onClick={openBulkExtendModal}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              Bulk Extend ({selectedIds.size})
            </button>
          )}
          {(hasBookingManage || canViewPayment) && (
            <button
              type="button"
              onClick={handleBulkSendEditAccess}
              disabled={bulkSendingEditAccess || visibleBookings.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkSendingEditAccess
                ? 'Sending...'
                : selectedIds.size > 0
                  ? `Bulk Edit Mail - Selected (${selectedIds.size})`
                  : `Bulk Edit Mail - All in Queue (${visibleBookings.length})`}
            </button>
          )}
          <button
            type="button"
            onClick={exportToCsv}
            disabled={visibleBookings.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export CSV
          </button>
          <RefreshListButton onRefresh={refresh} />
        </div>

      </div>

      <div className="card mt-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="search"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search booking, fascia, company or status..."
            className="input w-full"
          />

          <select
            className="input w-auto"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="All">All Statuses</option>
            <option value="BlockedAwaitingPayment">Blocked Awaiting Payment</option>
            <option value="PaymentSubmitted">Payment Submitted</option>
          </select>

          <select
            className="input w-auto"
            value={sponsorFilter}
            onChange={e => setSponsorFilter(e.target.value as SponsorFilter)}
          >
            <option value="All">All Stalls</option>
            <option value="Sponsor">Sponsor Stalls Only</option>
            <option value="Regular">Regular Stalls Only</option>
          </select>

          {/* District Filter Dropdown */}
          <select
            className="input w-auto"
            value={districtFilter}
            onChange={e => setDistrictFilter(e.target.value)}
          >
            <option value="All">All Districts</option>
            {uniqueDistricts.map(district => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-3 whitespace-nowrap text-sm text-slate-500">
          <span className="font-bold text-slate-900">{visibleBookings.length}</span> of{' '}
          <span className="font-bold text-slate-900">{bookings.length}</span> pending
        </p>
      </div>

      <div className="card mt-4 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th
                className="cursor-pointer select-none p-4 hover:text-slate-700"
                onClick={() => toggleSort('booking')}
              >
                Booking
                <SortIndicator column="booking" />
              </th>

              <th
                className="cursor-pointer select-none p-4 hover:text-slate-700"
                onClick={() => toggleSort('status')}
              >
                Status
                <SortIndicator column="status" />
              </th>

              <th
                className="cursor-pointer select-none p-4 hover:text-slate-700"
                onClick={() => toggleSort('expectedAmount')}
              >
                Expected Amount
                <SortIndicator column="expectedAmount" />
              </th>

              <th className="p-4">Sponsors stall</th>

              <th
                className="cursor-pointer select-none p-4 hover:text-slate-700"
                onClick={() => toggleSort('blockExpiresAt')}
              >
                Block Expires
                <SortIndicator column="blockExpiresAt" />
              </th>

              <th className="p-4">Action</th>
              <th className="w-12 p-4">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 accent-msme-blue"
                  checked={paginatedBookings.length > 0 && paginatedBookings.every(b => selectedIds.has(b.id))}
                  onChange={toggleSelectAllOnPage}
                  aria-label="Select all on page"
                />
              </th>
            </tr>
          </thead>

          <tbody>
            {paginatedBookings.map(booking => (
              <tr key={booking.id} className="border-t">
                <td className="p-4 font-semibold">
                  {booking.bookingRegistrationNumber} - {booking.fasciaName}
                </td>

                <td className="p-4">
                  <StatusBadge value={booking.bookingStatus} />
                </td>

                <td className="p-4 font-semibold">
                  ₹{Number(booking.expectedAmount || 0).toLocaleString('en-IN')}
                  {getPaidAmount(booking) > 0 && (
                    <div className="mt-1 text-xs font-normal text-slate-500">
                      <span className="text-emerald-600">₹{getPaidAmount(booking).toLocaleString('en-IN')} paid</span>
                      {' · '}
                      <span className="text-amber-600">₹{getBalanceAmount(booking).toLocaleString('en-IN')} due</span>
                    </div>
                  )}
                </td>

                <td>
                  {isSponsorStall(booking) && (
                    <span className="ml-2 rounded bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                      Sponsor Stall
                    </span>
                  )}
                </td>

                <td className="p-4">
                  {booking.blockExpiresAt
                    ? new Date(booking.blockExpiresAt).toLocaleString()
                    : '—'}
                </td>

                {/* <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-msme-blue hover:text-msme-blue"
                      onClick={() => setViewBooking(booking)}
                      aria-label="View booking details"
                      title="View booking details"
                    >
                      <Eye />
                    </button>
                  </div>
                </td> */}

                <td className="p-4">
                  <button
                    type="button"
                    onClick={() => setShowActionButton(booking)}
                    title="View booking details"
                    className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    aria-label="View booking details"
                  >
                    <InfoIcon className="h-4 w-4" />
                  </button>
                  <div className="flex items-center justify-end gap-2">
                    {/* {(hasBookingManage || canViewPayment) && booking.blockExpiresAt && (
                      <button
                        onClick={() => sendPaymentReminder(booking)}
                        disabled={remindingId === booking.id}
                        className="inline-flex rounded-lg px-3 py-2 font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                      >
                        {remindingId === booking.id ? 'Sending...' : 'Remind'}
                      </button>
                    )}
                    {(hasBookingManage || canViewPayment) && booking.blockExpiresAt && (
                      <button
                        type="button"
                        onClick={() => openExtendModal(booking)}
                        title="Extend the block expiry date for this booking"
                        className="inline-flex rounded-lg px-3 py-2 font-semibold text-amber-700 transition hover:bg-amber-50"
                      >
                        Extend
                      </button>
                    )} */}


                    {/* {canVerify ? (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => openVerifyForm(booking)}
                      >
                        Verify & Freeze Stall
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">
                        No permission
                      </span>
                    )} */}
                  </div>
                </td>
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(booking.id)}
                    onChange={() => toggleSelect(booking.id)}
                    aria-label={`Select ${booking.bookingRegistrationNumber}`}
                  />
                </td>
              </tr>
            ))}

            {visibleBookings.length === 0 && (
              <tr>
                <td className="p-6 text-slate-500" colSpan={7}>
                  {bookings.length === 0
                    ? 'No payment pending records.'
                    : 'No records match your search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {viewBooking && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold">Booking Details</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {viewBooking.bookingRegistrationNumber}
                  </p>
                </div>

                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-700 text-xl leading-none"
                  onClick={() => setViewBooking(null)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <DetailRow label="Company Name" value={viewBooking.companyName} />
                <DetailRow label="Fascia Name" value={viewBooking.fasciaName} />
                <DetailRow label="Contact Person" value={viewBooking.contactPerson} />
                <DetailRow label="Email" value={viewBooking.email} />
                <DetailRow label="Mobile" value={viewBooking.mobile} />
                <DetailRow label="Status" value={<StatusBadge value={viewBooking.bookingStatus} />} />
                <DetailRow
                  label="Expected Amount"
                  value={`₹${Number(viewBooking.expectedAmount || 0).toLocaleString('en-IN')}`}
                />
                {getPaidAmount(viewBooking) > 0 && (
                  <>
                    <DetailRow
                      label="Paid"
                      value={
                        <span className="font-semibold text-emerald-700">
                          ₹{getPaidAmount(viewBooking).toLocaleString('en-IN')}
                        </span>
                      }
                    />
                    <DetailRow
                      label="Due"
                      value={
                        <span className="font-semibold text-amber-700">
                          ₹{getBalanceAmount(viewBooking).toLocaleString('en-IN')}
                        </span>
                      }
                    />
                  </>
                )}
                <DetailRow label="Stall Number" value={viewBooking.stallNumber || '—'} />
                <DetailRow label="Stall Size" value={viewBooking.stallSizeName} />
                <DetailRow label="District" value={viewBooking.district} />
                <DetailRow label="GSTIN" value={viewBooking.gstin || '—'} />
                <DetailRow label="PAN" value={viewBooking.panNumber || '—'} />
                <DetailRow label="Udyam No." value={viewBooking.udyamRegistrationNumber || '—'} />
                <DetailRow
                  label="Block Expires"
                  value={
                    viewBooking.blockExpiresAt
                      ? new Date(viewBooking.blockExpiresAt).toLocaleString()
                      : '—'
                  }
                />
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setViewBooking(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {visibleBookings.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>
                Showing{' '}
                <span className="font-semibold text-slate-900">{rangeStart}</span>
                {'–'}
                <span className="font-semibold text-slate-900">{rangeEnd}</span>
                {' of '}
                <span className="font-semibold text-slate-900">{visibleBookings.length}</span>
              </span>

              <label htmlFor="page-size" className="ml-4 flex items-center gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Rows
                </span>

                <select
                  id="page-size"
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
                aria-label="First page"
              >
                «
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-msme-blue hover:text-msme-blue disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
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
                aria-label="Next page"
              >
                ›
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage === totalPages}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-msme-blue hover:text-msme-blue disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Last page"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl">
            <h3 className="text-xl font-bold">Verify Payment</h3>

            <p className="text-sm text-slate-500 mt-1">
              Booking No: {selectedBooking.bookingRegistrationNumber}
            </p>

            <p className="mt-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
              Full Stall Amount ₹{Number(selectedBooking.expectedAmount || 0).toLocaleString('en-IN')}
            </p>

            {getPaidAmount(selectedBooking) > 0 && (
              <p className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700">
                Already paid ₹{getPaidAmount(selectedBooking).toLocaleString('en-IN')} — ₹
                {getBalanceAmount(selectedBooking).toLocaleString('en-IN')} more to pay
              </p>
            )}

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payment Type
                </span>
                <select
                  className="input"
                  value={paymentType}
                  onChange={e => handlePaymentTypeChange(e.target.value as 'Full' | 'Part')}
                >
                  <option value="Full">Full Amount</option>
                  <option value="Part">Part Amount</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payment Reference Number
                </span>
                <input
                  className="input"
                  placeholder="Payment Reference Number"
                  value={paymentForm.paymentReferenceNumber}
                  onChange={e =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentReferenceNumber: e.target.value,
                    })
                  }
                />
              </label>

              {isSponsorStall(selectedBooking) && (
                <div className="sm:col-span-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-blue-800">
                      Total Agreed Sponsor Target Amount
                    </span>
                    <input
                      className="input border-blue-300 bg-white"
                      type="number"
                      placeholder="Enter agreed target deal amount for sponsor stall"
                      value={paymentForm.TargetSponsorTotal || ''}
                      onChange={e => {
                        const newTarget = Number(e.target.value);
                        setPaymentForm(prev => ({
                          ...prev,
                          TargetSponsorTotal: newTarget,
                        }));
                      }}
                    />
                    <span className="mt-1 block text-xs text-blue-600">
                      {getPaidAmount(selectedBooking) > 0
                        ? `Already Paid: ₹${getPaidAmount(selectedBooking).toLocaleString('en-IN')}. Remaining Balance: ₹${Math.max(
                          0,
                          (paymentForm.TargetSponsorTotal || 0) - getPaidAmount(selectedBooking)
                        ).toLocaleString('en-IN')}`
                        : 'Set total target deal amount so part vs full settlement can be tracked accurately.'}
                    </span>
                  </label>
                </div>
              )}

              <div className="mt-2 flex gap-6 sm:col-span-2">
                <Check
                  label="TDS Deductable"
                  name="isTdsDeductable"
                  checked={paymentForm.isTdsDeductable}
                  onChange={set}
                />
                {isSponsorStall(selectedBooking) && (
                  <Check
                    label="GST Applicable"
                    name="isGstApplicable"
                    checked={paymentForm.isGstApplicable}
                    onChange={set}
                  />
                )}
              </div>

              {paymentForm.isGstApplicable && isSponsorStall(selectedBooking) && (
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    GST Type
                  </span>
                  <select
                    className="input"
                    value={paymentForm.gstType}
                    onChange={e =>
                      setPaymentForm(prev => ({
                        ...prev,
                        gstType: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select GST Type</option>
                    <option value="GST">GST</option>
                    <option value="IGST">IGST</option>
                    <option value="RCM">RCM</option>
                  </select>
                </label>
              )}

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payment Date
                </span>
                <input
                  className="input"
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={e =>
                    setPaymentForm({ ...paymentForm, paymentDate: e.target.value })
                  }
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payer Name
                </span>
                <input
                  className="input"
                  placeholder="Payer Name"
                  value={paymentForm.payerName}
                  onChange={e =>
                    setPaymentForm({ ...paymentForm, payerName: e.target.value })
                  }
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payer Bank
                </span>
                <input
                  className="input"
                  placeholder="Payer Bank"
                  value={paymentForm.payerBank}
                  onChange={e =>
                    setPaymentForm({ ...paymentForm, payerBank: e.target.value })
                  }
                />
              </label>

              {paymentType === 'Full' && (
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount Paid (Full Settlement)
                  </span>
                  <input
                    className="input"
                    type="number"
                    placeholder="Amount Paid"
                    value={paymentForm.amountPaid || ''}
                    onChange={e => {
                      const amount = Number(e.target.value);
                      setPaymentForm({
                        ...paymentForm,
                        amountPaid: amount,
                        gstAmount:
                          isSponsorStall(selectedBooking) && paymentForm.isGstApplicable
                            ? calculateGst(amount, 18).toString()
                            : '0',
                      });
                    }}
                  />
                </label>
              )}

              {paymentType === 'Part' && (
                <label className="block sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amber-700">
                    Part Amount Paid Now
                  </span>
                  <input
                    className={`input ${partAmountExceedsBalance ? 'border-red-400 focus:ring-red-200' : ''}`}
                    type="number"
                    placeholder={`Enter part payment amount (Max: ₹${isSponsorStall(selectedBooking)
                      ? Math.max(0, (paymentForm.TargetSponsorTotal || 0) - getPaidAmount(selectedBooking)).toLocaleString('en-IN')
                      : getBalanceAmount(selectedBooking).toLocaleString('en-IN')
                      })`}
                    value={paymentForm.partAmountPaid || ''}
                    onChange={e =>
                      setPaymentForm({
                        ...paymentForm,
                        partAmountPaid: Number(e.target.value),
                      })
                    }
                  />
                  {partAmountExceedsBalance ? (
                    <span className="mt-1 block text-xs font-semibold text-red-600">
                      This exceeds the balance due. Switch to "Full Amount" if clearing full settlement.
                    </span>
                  ) : (
                    <span className="mt-1 block text-xs text-slate-600">
                      Booking stays in the queue until the remaining balance is paid.
                    </span>
                  )}
                </label>
              )}

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reference Details / Remarks
                </span>
                <textarea
                  className="input min-h-[90px]"
                  placeholder="Reference Details / Remarks"
                  value={paymentForm.remarks}
                  onChange={e =>
                    setPaymentForm({ ...paymentForm, remarks: e.target.value })
                  }
                />
              </label>
            </div>

            <div className="mt-5 flex gap-3 justify-end">
              <button
                type="button"
                className="btn-secondary"
                disabled={saving}
                onClick={() => setSelectedBooking(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-primary"
                disabled={saving || !canVerify || partAmountExceedsBalance}
                onClick={submitVerifyPayment}
              >
                {saving ? 'Saving...' : 'Save & Verify'}
              </button>
            </div>
          </div>
        </div>
      )}
      {actionButton && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setShowActionButton(null)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h6l5 5v11a2 2 0 01-2 2z"
                        />
                      </svg>
                    </span>

                    <h3 className="text-lg font-bold text-slate-900">
                      Booking Actions
                    </h3>
                  </div>

                  <p className="text-sm text-slate-500">
                    Manage booking and payment actions
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowActionButton(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700"
                  aria-label="Close"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Booking Number */}
              <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Booking Registration Number
                </p>

                <p className="mt-1 text-base font-bold text-slate-900">
                  {actionButton.bookingRegistrationNumber}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-900">
                  Available Actions
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                  Choose an action to continue with this booking.
                </p>
              </div>

              <div className="space-y-3">
                {/* View */}
                <button
                  type="button"
                  onClick={() => {
                    setShowActionButton(null)
                    setViewBooking(actionButton)
                  }}
                  className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition group-hover:bg-blue-200">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900">
                        View Booking
                      </p>
                      <p className="text-xs text-slate-500">
                        View complete booking details
                      </p>
                    </div>
                  </div>

                  <svg
                    className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                {/* Reminder */}
                {(hasBookingManage || canViewPayment) &&
                  actionButton.blockExpiresAt && (
                    <button
                      type="button"
                      onClick={() => {
                        sendPaymentReminder(actionButton)
                        setShowActionButton(null)
                      }}
                      disabled={remindingId === actionButton.id}
                      className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                          </svg>
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {remindingId === actionButton.id
                              ? "Sending Reminder..."
                              : "Send Payment Reminder"}
                          </p>

                          <p className="text-xs text-slate-500">
                            Remind the exhibitor about pending payment
                          </p>
                        </div>
                      </div>

                      {remindingId !== actionButton.id && (
                        <svg
                          className="h-5 w-5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      )}
                    </button>
                  )}

                {/* Extend */}
                {(hasBookingManage || canViewPayment) &&
                  actionButton.blockExpiresAt && (
                    <button
                      type="button"
                      onClick={() => {
                        openExtendModal(actionButton)
                        setShowActionButton(null)
                      }}
                      className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-amber-200 hover:bg-amber-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            Extend Block
                          </p>

                          <p className="text-xs text-slate-500">
                            Extend the stall block expiry date
                          </p>
                        </div>
                      </div>

                      <svg
                        className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  )}

                {/* Verify */}
                {canVerify ? (
                  <button
                    type="button"
                    onClick={() => {
                      openVerifyForm(actionButton)
                      setShowActionButton(null)
                    }}
                    className="group flex w-full items-center justify-between rounded-xl bg-blue-600 p-4 text-left shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>

                      <div>
                        <p className="font-semibold text-white">
                          Verify & Freeze Stall
                        </p>

                        <p className="text-xs text-blue-100">
                          Verify payment and freeze the allocated stall
                        </p>
                      </div>
                    </div>

                    <svg
                      className="h-5 w-5 text-white transition group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-400">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-600">
                        Verification Restricted
                      </p>

                      <p className="text-xs text-slate-400">
                        You don't have permission to verify payments.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                onClick={() => setShowActionButton(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {extendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="font-bold text-slate-900">
              Extend Block Expiry
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {extendTarget.bookingRegistrationNumber || 'This booking'}
              {' — current expiry: '}
              {extendTarget.blockExpiresAt
                ? new Date(extendTarget.blockExpiresAt).toLocaleString()
                : '—'}
            </p>

            <label
              htmlFor="new-expiry-at"
              className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              New Expiry Date &amp; Time
            </label>

            <input
              id="new-expiry-at"
              type="datetime-local"
              value={newExpiryAt}
              onChange={event => setNewExpiryAt(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-msme-blue focus:ring-2 focus:ring-msme-blue/10"
            />

            {extendError && (
              <p className="mt-2 text-sm font-semibold text-red-600">
                {extendError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={extending}
                onClick={closeExtendModal}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={extending}
                onClick={submitExtend}
                className="rounded-lg bg-msme-blue px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {extending ? 'Extending...' : 'Confirm Extend'}
              </button>
            </div>
          </div>
        </div>
      )}
      {bulkExtendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="font-bold text-slate-900">Bulk Extend Block Expiry</h3>

            <p className="mt-1 text-sm text-slate-500">
              {selectedIds.size} booking(s) selected. Only bookings still in
              "Blocked Awaiting Payment" or "Payment Submitted" will be extended.
            </p>

            <label
              htmlFor="bulk-new-expiry-at"
              className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              New Expiry Date &amp; Time
            </label>

            <input
              id="bulk-new-expiry-at"
              type="datetime-local"
              value={bulkNewExpiryAt}
              onChange={event => setBulkNewExpiryAt(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-msme-blue focus:ring-2 focus:ring-msme-blue/10"
            />

            {bulkExtendError && (
              <p className="mt-2 text-sm font-semibold text-red-600">{bulkExtendError}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={bulkExtending}
                onClick={closeBulkExtendModal}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={bulkExtending}
                onClick={submitBulkExtend}
                className="rounded-lg bg-msme-blue px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {bulkExtending ? 'Extending...' : `Extend ${selectedIds.size} Booking(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </div>
        <div className="mt-0.5 font-medium text-slate-900">{value ?? '—'}</div>
      </div>
    );
  }
}