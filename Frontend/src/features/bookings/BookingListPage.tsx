import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Stall, StallBooking } from '../../domain/models';
import { repositories } from '../../data/repositoryFactory';
import { StatusBadge } from '../../shared/StatusBadge';
import { useSession } from '../../app/session';
import { PERMISSIONS } from '../../config/permissions';
import { apiClient } from '../../data/api/apiClient';
import { ChevronDown, Eye, InfoIcon, QrCode, Trash2 } from 'lucide-react';
import { EmailStallCardBooking, EmailStallCardModal } from './EmailStallCardModal';
import { StallQrModal } from './StallQrModal';
import { RefreshListButton } from '../../shared/components/RefreshListButton';
import { ModalPortal } from '../../shared/components/ModalPortal';

type ExpiryFilter = 'All' | 'Active' | 'Expired' | 'No Expiry' | 'Confirmed';
type SortKey =
  | 'bookingRegistrationNumber'
  | 'fasciaName'
  | 'bookingStatus'
  | 'blockExpiresAt'
  | 'stallNumber'
  | 'bookingDate'
  | 'stallSizeCode';

type SortDirection = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const BOOKINGS_KEY = ['admin', 'bookings'] as const;
const STALLS_KEY = ['admin', 'stalls'] as const;
export function BookingListPage() {
  const queryClient = useQueryClient();

  // ── Data fetching (react-query) ──────────────────────────────
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: BOOKINGS_KEY,
    queryFn: () => apiClient.get<StallBooking[]>('/admin/events/current/bookings'),
  });

  const { data: stalls = [] } = useQuery({
    queryKey: STALLS_KEY,
    queryFn: () => repositories.stalls.list(),
  });

  // ── UI state ──────────────────────────────────────────────────
  const [isStallReportExpanded, setIsStallReportExpanded] = useState(false);
  const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>('All');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [sizeFilter, setSizeFilter] = useState('All');
  const [lubMemberFilter, setLubMemberFilter] = useState<'All' | 'Yes' | 'No'>('All');
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);

  const formatDistrict = (value?: string | null): string => {
    const district = String(value ?? '').trim();
    return district && district !== '-' ? district : '';
  };

  const isMissingValue = (value: unknown): boolean => {
    if (value === null || value === undefined) {
      return true;
    }

    const normalizedValue = String(value).trim().toLowerCase();

    return (
      normalizedValue === '' ||
      normalizedValue === '-' ||
      normalizedValue === 'null' ||
      normalizedValue === 'undefined'
    );
  };

  const [sortKey, setSortKey] = useState<SortKey>('bookingDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [
    emailStallCardBooking,
    setEmailStallCardBooking
  ] = useState<EmailStallCardBooking | null>(null)
  const [sendingProformaFor, setSendingProformaFor] = useState<string | null>(null);
  const [editLinks, setEditLinks] = useState<Record<string, string>>({});
  const [generatingLinkFor, setGeneratingLinkFor] = useState<string | null>(null);
  const [downloadingProformaFor, setDownloadingProformaFor] = useState<string | null>(null);
  const [downloadingReceiptFor, setDownloadingReceiptFor] = useState<string | null>(null);
  const [downloadingTaxInvoiceFor, setDownloadingTaxInvoiceFor] = useState<string | null>(null);
  const [viewBooking, setViewBooking] = useState<StallBooking | null>(null);
  const [actionButton, setShowActionButton] = useState<StallBooking | null>(null);
  const [qrBooking, setQrBooking] = useState<StallBooking | null>(null);
  const [deleteConfirmBooking, setDeleteConfirmBooking] = useState<StallBooking | null>(null);
  const user = useSession(s => s.user);

  // Extend-block-expiry modal state
  const [extendTarget, setExtendTarget] = useState<StallBooking | null>(null);
  const [newExpiryAt, setNewExpiryAt] = useState('');
  const [extending, setExtending] = useState(false);
  const [extendError, setExtendError] = useState('');

  const [bulkSendingEditAccess, setBulkSendingEditAccess] = useState(false);
  const [bulkSendingStallInfo, setBulkSendingStallInfo] = useState(false);
  const [bulkSendingHotelInfo, setBulkSendingHotelInfo] = useState(false);

  const [sendingStallInfoFor, setSendingStallInfoFor] = useState<string | null>(null);
  const [sendingHotelInfoFor, setSendingHotelInfoFor] = useState<string | null>(null);
  const [sendingMsmeSubsidyFor, setSendingMsmeSubsidyFor] = useState<string | null>(null);
  const [sendingFameTnSubsidyFor, setSendingFameTnSubsidyFor] = useState<string | null>(null);
  const [sendingExhibitorActionFor, setSendingExhibitorActionFor] = useState<string | null>(null);

  const [bulkModalConfig, setBulkModalConfig] = useState<{
    isOpen: boolean;
    type: 'msme' | 'fame' | 'action' | null;
  }>({ isOpen: false, type: null });
  const [bulkSendingStatus, setBulkSendingStatus] = useState(false);

  const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(new Set());

  function triggerBlobDownload(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  async function handleSendProforma(booking: StallBooking) {
    if (!user) {
      alert('User session missing. Please re-login.');
      return;
    }

    if (!booking.stallNumber) {
      alert('Cannot send proforma for a booking whose stall is not blocked yet. Please block the stall first.');
      return;
    }

    try {
      setSendingProformaFor(booking.id);
      await repositories.invoices.sendProforma(booking.id, user.id);
      alert(`The proforma invoice has been successfully sent to ${booking.email || 'the user'}.`);
      queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
    } catch (err: any) {
      console.error('SEND PROFORMA ERROR', err);
      alert(
        err?.message ||
        'Failed to send the proforma invoice. Please check your network connection or the browser console for more details.'
      );
    } finally {
      setSendingProformaFor(null);
    }
  }

  async function handleDownloadProforma(booking: StallBooking) {
    try {
      setDownloadingProformaFor(booking.id);
      const { blob, fileName } = await apiClient.getBlob(
        `/admin/events/current/bookings/${booking.id}/proforma-invoice/download`
      );
      triggerBlobDownload(blob, fileName ?? `ProformaInvoice_${booking.bookingRegistrationNumber}.pdf`);
    } catch (err: any) {
      console.error('DOWNLOAD PROFORMA ERROR', err);
      alert(err?.message || 'Failed to download the proforma invoice.');
    } finally {
      setDownloadingProformaFor(null);
    }
  }

  async function handleDownloadPaymentReceipt(booking: StallBooking) {
    try {
      setDownloadingReceiptFor(booking.id);
      const { blob, fileName } = await apiClient.getBlob(
        `/admin/events/current/bookings/${booking.id}/payment-receipt/download`
      );
      triggerBlobDownload(blob, fileName ?? `PaymentReceipt_${booking.bookingRegistrationNumber}.pdf`);
    } catch (err: any) {
      console.error('DOWNLOAD RECEIPT ERROR', err);
      alert(err?.message || 'Failed to download the payment receipt.');
    } finally {
      setDownloadingReceiptFor(null);
    }
  }

  async function handleDownloadTaxInvoice(booking: StallBooking) {
    try {
      setDownloadingTaxInvoiceFor(booking.id);
      const { blob, fileName } = await apiClient.getBlob(
        `/admin/events/current/bookings/${booking.id}/tax-invoice/download`
      );
      triggerBlobDownload(blob, fileName ?? `TaxInvoice_${booking.bookingRegistrationNumber}.pdf`);
    } catch (err: any) {
      console.error('DOWNLOAD TAX INVOICE ERROR', err);
      alert(err?.message || 'Failed to download the tax invoice. It may not have been generated/sent yet.');
    } finally {
      setDownloadingTaxInvoiceFor(null);
    }
  }

  async function handleGenerateOrCopyLink(booking: StallBooking) {
    const existingLink = editLinks[booking.id];

    if (existingLink) {
      try {
        await navigator.clipboard.writeText(existingLink);
        alert('Edit link copied to clipboard.');
      } catch {
        alert(`Copy failed. Link: ${existingLink}`);
      }
      return;
    }

    try {
      setGeneratingLinkFor(booking.id);
      const response = await apiClient.post<{ editUrl: string }>(
        `/admin/events/current/bookings/${booking.id}/edit-access/send-email`,
        {}
      );

      if (response?.editUrl) {
        setEditLinks(prev => ({ ...prev, [booking.id]: response.editUrl }));
      }
    } catch (err: any) {
      console.error('GENERATE EDIT LINK ERROR', err);
      alert(err?.message || 'Failed to generate the edit link.');
    } finally {
      setGeneratingLinkFor(null);
    }
  }

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

      await apiClient.post<{ blockExpiresAt: string }>(
        `/admin/events/current/bookings/${extendTarget.id}/extend-block`,
        {
          actorUserId: user.id,
          newExpiryAt: newExpiryDate.toISOString(),
        },
      );

      await queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });

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

  const allocatedCount = useMemo(() => {
    return bookings.filter(b => Boolean(b.bookingStatus) && b.bookingStatus !== 'Submitted').length;
  }, [bookings]);

  const statusOptions = useMemo(() => {
    const statuses = bookings
      .map(booking => booking.bookingStatus)
      //@ts-ignore
      .filter((status): status is string => Boolean(status));

    const unique = Array.from(new Set(statuses));
    return ['All', 'Allocated', ...unique];
  }, [bookings]);

  const districtOptions = useMemo(() => {
    const districts = bookings
      .map(booking => formatDistrict(booking.district))
      .filter((district): district is string => Boolean(district));

    return ['All', ...Array.from(new Set(districts)).sort()];
  }, [bookings]);

  const sizeOptions = useMemo(() => {
    const sizes = bookings
      .map(booking => booking.stallSizeCode || booking.stallSizeName)
      .filter((size): size is string => Boolean(size));

    return ['All', ...Array.from(new Set(sizes)).sort()];
  }, [bookings]);

  const statusCounts = useMemo(() => {
    return bookings.reduce<Record<string, number>>((counts, booking) => {
      const status = booking.bookingStatus || 'Unknown';
      counts[status] = (counts[status] ?? 0) + 1;
      return counts;
    }, {});
  }, [bookings]);

  const activeBlockCount = useMemo(() => {
    const now = new Date().getTime();

    return bookings.filter(booking => {
      if (!booking.blockExpiresAt) {
        return false;
      }

      return new Date(booking.blockExpiresAt).getTime() >= now;
    }).length;
  }, [bookings]);

  async function handleDeleteBooking(booking: StallBooking) {
    if (booking.bookingStatus !== 'Submitted') {
      alert('Only bookings in "Submitted" status can be deleted.');
      return;
    }

    const confirmed = window.confirm(
      `Delete booking ${booking.bookingRegistrationNumber || ''} (${booking.companyName || booking.fasciaName || ''})?\n\nThis will permanently remove the booking, exhibitor and billing details from the database. This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeletingBookingId(booking.id);
      await apiClient.delete(
        `/admin/events/current/bookings/${booking.id}${user?.id ? `?actorUserId=${user.id}` : ''}`
      );
      await queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
    } catch (err: any) {
      console.error('DELETE BOOKING ERROR', err);
      alert(err?.message || 'Failed to delete the booking.');
    } finally {
      setDeletingBookingId(null);
    }
  }

  const expiredBlockCount = useMemo(() => {
    const now = new Date().getTime();

    return bookings.filter(booking => {
      if (!booking.blockExpiresAt) {
        return false;
      }

      return new Date(booking.blockExpiresAt).getTime() < now;
    }).length;
  }, [bookings]);

  const getDisplayStatus = (status?: string | null): string | null | undefined => {
    if (status === 'PaymentSubmitted') {
      return 'Payment Verified';
    }
    return status;
  };

  const filteredBookings = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const now = new Date().getTime();

    return bookings.filter(booking => {
      const matchesSearch =
        !normalizedSearch ||
        [
          booking.bookingRegistrationNumber,
          booking.fasciaName,
          booking.companyName,
          booking.bookingStatus,
          booking.stallNumber,
          booking.stallSizeCode,
          booking.email,
        ]
          .filter(Boolean)
          .some(field => field!.toLowerCase().includes(normalizedSearch));

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Allocated'
          ? booking.bookingStatus !== 'Submitted'
          : booking.bookingStatus === statusFilter);

      const expiryTime = booking.blockExpiresAt
        ? new Date(booking.blockExpiresAt).getTime()
        : null;

      const isLockedIn =
        booking.bookingStatus === 'Confirmed'

      const matchesExpiry =
        expiryFilter === 'All' ||
        (expiryFilter === 'Active' &&
          !isLockedIn &&
          expiryTime !== null &&
          expiryTime >= now) ||
        (expiryFilter === 'Expired' &&
          !isLockedIn &&
          expiryTime !== null &&
          expiryTime < now) ||
        (expiryFilter === 'No Expiry' &&
          !isLockedIn &&
          expiryTime === null) ||
        (expiryFilter === 'Confirmed' &&
          isLockedIn);

      const matchesDistrict =
        districtFilter === 'All' ||
        formatDistrict(booking.district) === districtFilter;

      const matchesSize =
        sizeFilter === 'All' ||
        booking.stallSizeCode === sizeFilter ||
        booking.stallSizeName === sizeFilter;

      const matchesLubMember =
        lubMemberFilter === 'All' ||
        (lubMemberFilter === 'Yes' && booking.lubMember === true) ||
        (lubMemberFilter === 'No' && booking.lubMember !== true);

      return matchesSearch && matchesStatus && matchesExpiry && matchesDistrict && matchesSize && matchesLubMember;
    });
  }, [bookings, searchTerm, statusFilter, expiryFilter, districtFilter, sizeFilter, lubMemberFilter]);

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

  const sortedBookings = useMemo(() => {
    const directionMultiplier = sortDirection === 'asc' ? 1 : -1;

    return [...filteredBookings].sort((a, b) => {
      if (sortKey === 'blockExpiresAt') {
        const aTime = a.blockExpiresAt ? new Date(a.blockExpiresAt).getTime() : null;
        const bTime = b.blockExpiresAt ? new Date(b.blockExpiresAt).getTime() : null;

        if (aTime === null && bTime === null) return 0;
        if (aTime === null) return 1;
        if (bTime === null) return -1;

        return (aTime - bTime) * directionMultiplier;
      }

      const aVal = (a[sortKey] || '').toString().toLowerCase();
      const bVal = (b[sortKey] || '').toString().toLowerCase();

      return aVal.localeCompare(bVal) * directionMultiplier;
    });
  }, [filteredBookings, sortKey, sortDirection]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, expiryFilter, districtFilter, sizeFilter, lubMemberFilter, sortKey, sortDirection, pageSize, bookings.length]);

  const totalPages = Math.max(1, Math.ceil(sortedBookings.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedBookings = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedBookings.slice(start, start + pageSize);
  }, [sortedBookings, safePage, pageSize]);

  const rangeStart = sortedBookings.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, sortedBookings.length);

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

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    statusFilter !== 'All' ||
    expiryFilter !== 'All' ||
    districtFilter !== 'All' ||
    sizeFilter !== 'All' ||
    lubMemberFilter !== 'All';

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setExpiryFilter('All');
    setDistrictFilter('All');
    setSizeFilter('All');
    setLubMemberFilter('All');
  };

  const hasBookingManage = useSession(
    s => s.hasPermission(PERMISSIONS.adminUsersManage)
  );

  const canViewBooking = useSession(s => s.hasPermission(PERMISSIONS.bookingView));
  const canReviewBooking = useSession(s => s.hasPermission(PERMISSIONS.bookingReview));
  const canViewPayment = useSession(s => s.hasPermission(PERMISSIONS.paymentView));

  const escapeCsvValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '';
    }

    const text = String(value);

    if (
      text.includes(',') ||
      text.includes('"') ||
      text.includes('\n') ||
      text.includes('\r')
    ) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  };

  const formatCsvDate = (value?: string | null): string => {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('en-IN');
  };

  const missingDetailBookings = useMemo(() => {
    return bookings.filter(booking => {
      const hasAllocatedStall =
        !isMissingValue(booking.allocatedStallId) &&
        !isMissingValue(booking.stallNumber);

      if (!hasAllocatedStall) {
        return false;
      }

      const hasMissingDetails =
        isMissingValue(booking.contactPerson) ||
        isMissingValue(booking.mobile) ||
        isMissingValue(booking.panNumber) ||
        isMissingValue(booking.udyamRegistrationNumber) ||
        isMissingValue(booking.gstin) ||
        isMissingValue(booking.registeredAddress) ||
        isMissingValue(booking.city) ||
        isMissingValue(booking.industryCategory) ||
        isMissingValue(booking.productKeywords) ||
        isMissingValue(booking.businessType) ||
        isMissingValue(booking.fasciaName);

      return hasMissingDetails;
    });
  }, [bookings]);

  const eligibleBookings = useMemo(
    () => bookings.filter(b => Boolean(b.allocatedStallId)),
    [bookings]
  );
  const eligibleForBulkEditCount = eligibleBookings.length;

  const eligibleOnPage = useMemo(
    () => paginatedBookings.filter(b => Boolean(b.allocatedStallId)),
    [paginatedBookings]
  );

  const allOnPageSelected =
    eligibleOnPage.length > 0 &&
    eligibleOnPage.every(b => selectedBookingIds.has(b.id));

  function toggleSelectBooking(bookingId: string, isEligible: boolean) {
    if (!isEligible) return;
    setSelectedBookingIds(prev => {
      const next = new Set(prev);
      if (next.has(bookingId)) {
        next.delete(bookingId);
      } else {
        next.add(bookingId);
      }
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    setSelectedBookingIds(prev => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        eligibleOnPage.forEach(b => next.delete(b.id));
      } else {
        eligibleOnPage.forEach(b => next.add(b.id));
      }
      return next;
    });
  }

  const handleDownloadCsv = () => {
    if (filteredBookings.length === 0) {
      alert('No booking records are available for the selected filters.');
      return;
    }

    const headers = [
      'S.No.',
      'Booking Number',
      'Company Name',
      'Fascia Name',
      'contactPerson',
      'Email',
      'District',
      'Mobile',
      'Booking Status',
      'Block Expires At',
      'Block State',
      'Stall Number',
      'Stall Size',
      'Expected Amount',
    ];

    const rows = filteredBookings.map((booking, index) => [
      index + 1,
      booking.bookingRegistrationNumber ?? '',
      booking.companyName ?? '',
      booking.fasciaName ?? booking.companyName ?? "",
      booking.contactPerson,
      booking.email ?? '',
      formatDistrict(booking.district),
      booking.mobile ?? '',
      booking.bookingStatus ?? '',
      formatCsvDate(booking.blockExpiresAt),
      getBlockState(booking.blockExpiresAt, booking.bookingStatus).label,
      booking.stallNumber ?? '',
      booking.stallSizeCode ?? '',
      booking.expectedAmount ?? '',
    ]);

    const csvContent = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map(row => row.map(escapeCsvValue).join(',')),
    ].join('\r\n');

    const blob = new Blob(['\uFEFF', csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    const statusName =
      statusFilter === 'All'
        ? 'all-statuses'
        : statusFilter.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const expiryName =
      expiryFilter === 'All'
        ? 'all-blocks'
        : expiryFilter.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const date = new Date().toISOString().slice(0, 10);

    anchor.href = url;
    anchor.download = `booking-list-${statusName}-${expiryName}-${date}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
  };

  const handleDownloadLubMemberCsv = (lubStatus: boolean) => {
    const rows2 = filteredBookings.filter(b => Boolean(b.lubMember) === lubStatus);

    if (rows2.length === 0) {
      alert(`No ${lubStatus ? 'LUB Member' : 'Non-LUB Member'} bookings found for the selected filters.`);
      return;
    }

    const headers = [
      'S.No.',
      'Booking Number',
      'Company Name',
      'Fascia Name',
      'contactPerson',
      'Email',
      'District',
      'Mobile',
      'PAN Number',
      'TAN Number',
      'GSTIN',
      'UDYAM Register Number',
      'Booking Status',
      'Block Expires At',
      'Block State',
      'Stall Number',
      'Stall Size',
      'Expected Amount',
    ];

    const rows = filteredBookings.map((booking, index) => [
      index + 1,
      booking.bookingRegistrationNumber ?? '',
      booking.companyName ?? '',
      booking.fasciaName ?? booking.companyName ?? "",
      booking.contactPerson,
      booking.email ?? '',
      formatDistrict(booking.district),
      booking.mobile ? `'${booking.mobile}` : '',
      booking.panNumber ?? '',
      booking.tanNumber ?? '',
      booking.gstin ?? '',
      booking.udyamRegistrationNumber ?? '',
      booking.bookingStatus ?? '',
      formatCsvDate(booking.blockExpiresAt),
      getBlockState(booking.blockExpiresAt, booking.bookingStatus).label,
      booking.stallNumber ?? '',
      booking.stallSizeCode ?? '',
      booking.expectedAmount ?? '',
    ]);
    const csvContent = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map(row => row.map(escapeCsvValue).join(',')),
    ].join('\r\n');

    const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);

    anchor.href = url;
    anchor.download = `booking-list-lub-${lubStatus ? 'yes' : 'no'}-${date}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  async function handleBulkSendEditAccess() {
    const hasSelection = selectedBookingIds.size > 0;
    const targetCount = hasSelection ? selectedBookingIds.size : eligibleForBulkEditCount;

    if (targetCount === 0) {
      alert('No bookings with an allocated stall found.');
      return;
    }

    const confirmMessage = hasSelection
      ? `This will email the edit link to the ${targetCount} selected booking(s). Continue?`
      : `No bookings selected — this will email the edit link to ALL ${targetCount} booking(s) whose stall has been blocked/allocated. Continue?`;

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    try {
      setBulkSendingEditAccess(true);
      const res = await apiClient.post<{ emailsSent: number; totalEligible: number; message: string }>(
        '/admin/events/current/bookings/send-edit-access-allocated',
        hasSelection ? { bookingIds: Array.from(selectedBookingIds) } : {}
      );
      alert(res?.message || `Sent to ${res?.emailsSent ?? 0} booking(s).`);
      setSelectedBookingIds(new Set());
    } catch (err: any) {
      console.error('BULK EDIT ACCESS ERROR', err);
      alert(err?.message || 'Failed to send bulk edit access emails.');
    } finally {
      setBulkSendingEditAccess(false);
    }
  }

  async function handleSendStallInfo(booking: StallBooking) {
    try {
      setSendingStallInfoFor(booking.id);
      const res = await apiClient.post<{ message: string }>(
        `/admin/events/current/bookings/${booking.id}/stall-information/send-email`,
        {}
      );
      alert(res?.message || 'Stall information email sent.');
    } catch (err: any) {
      console.error('SEND STALL INFO ERROR', err);
      alert(err?.message || 'Failed to send stall information email.');
    } finally {
      setSendingStallInfoFor(null);
    }
  }

  async function handleSendMsmeSubsidy(booking: StallBooking) {
    try {
      setSendingMsmeSubsidyFor(booking.id);
      const res = await apiClient.post<{ message: string }>(
        `/admin/events/current/bookings/${booking.id}/msme-subsidy/send-email`,
        {}
      );
      alert(res?.message || 'MSME subsidy email sent.');
    } catch (err: any) {
      console.error('SEND MSME SUBSIDY ERROR', err);
      alert(err?.message || 'Failed to send MSME subsidy email.');
    } finally {
      setSendingMsmeSubsidyFor(null);
    }
  }

  async function handleSendFameTnSubsidy(booking: StallBooking) {
    try {
      setSendingFameTnSubsidyFor(booking.id);
      const res = await apiClient.post<{ message: string }>(
        `/admin/events/current/bookings/${booking.id}/fame-tn-subsidy/send-email`,
        {}
      );
      alert(res?.message || 'FaMe TN subsidy email sent.');
    } catch (err: any) {
      console.error('SEND FAME TN SUBSIDY ERROR', err);
      alert(err?.message || 'Failed to send FaMe TN subsidy email.');
    } finally {
      setSendingFameTnSubsidyFor(null);
    }
  }

  async function handleSendExhibitorAction(booking: StallBooking) {
    const actionRequired = window.prompt('Enter the action required from the exhibitor:');
    if (!actionRequired) return;
    try {
      setSendingExhibitorActionFor(booking.id);
      const res = await apiClient.post<{ message: string }>(
        `/admin/events/current/bookings/${booking.id}/exhibitor-action/send-email`,
        { actionRequired }
      );
      alert(res?.message || 'Exhibitor action email sent.');
    } catch (err: any) {
      console.error('SEND EXHIBITOR ACTION ERROR', err);
      alert(err?.message || 'Failed to send exhibitor action email.');
    } finally {
      setSendingExhibitorActionFor(null);
    }
  }

  async function executeBulkAction(actionRequired?: string) {
    const type = bulkModalConfig.type;
    if (!type) return;

    const hasSelection = selectedBookingIds.size > 0;
    const targetBookings = hasSelection
      ? filteredBookings.filter(b => selectedBookingIds.has(b.id))
      : filteredBookings;

    if (targetBookings.length === 0) {
      alert('No bookings match the criteria.');
      return;
    }

    try {
      setBulkSendingStatus(true);
      let sentCount = 0;

      for (const b of targetBookings) {
        if (type === 'msme') {
          await apiClient.post(`/admin/events/current/bookings/${b.id}/msme-subsidy/send-email`, {});
        } else if (type === 'fame') {
          await apiClient.post(`/admin/events/current/bookings/${b.id}/fame-tn-subsidy/send-email`, {});
        } else if (type === 'action') {
          await apiClient.post(`/admin/events/current/bookings/${b.id}/exhibitor-action/send-email`, { actionRequired });
        }
        sentCount++;
      }

      alert(`Successfully processed and sent emails to ${sentCount} booking(s).`);
      setSelectedBookingIds(new Set());
      setBulkModalConfig({ isOpen: false, type: null });
    } catch (err: any) {
      console.error('BULK ACTION ERROR', err);
      alert(err?.message || 'Failed to complete bulk operation.');
    } finally {
      setBulkSendingStatus(false);
    }
  }

  async function handleBulkSendStallInfo() {
    const hasSelection = selectedBookingIds.size > 0;
    const targetCount = hasSelection ? selectedBookingIds.size : eligibleBookings.length;

    if (targetCount === 0) {
      alert('No eligible bookings found.');
      return;
    }

    const confirmMessage = hasSelection
      ? `This will email stall information to the ${targetCount} selected booking(s). Continue?`
      : `No bookings selected — this will email stall information to ALL ${targetCount} booking(s). Continue?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setBulkSendingStallInfo(true);
      const res = await apiClient.post<{ emailsSent: number; message: string }>(
        '/admin/events/current/bookings/send-stall-information',
        hasSelection ? { bookingIds: Array.from(selectedBookingIds) } : {}
      );
      alert(res?.message || `Sent to ${res?.emailsSent ?? 0} booking(s).`);
      setSelectedBookingIds(new Set());
    } catch (err: any) {
      console.error('BULK STALL INFO ERROR', err);
      alert(err?.message || 'Failed to send bulk stall information emails.');
    } finally {
      setBulkSendingStallInfo(false);
    }
  }

  async function handleSendHotelInfo(booking: StallBooking) {
    try {
      setSendingHotelInfoFor(booking.id);
      const res = await apiClient.post<{ message: string }>(
        `/admin/events/current/bookings/${booking.id}/hotel-accommodation/send-email`,
        {}
      );
      alert(res?.message || 'Hotel accommodation email sent.');
    } catch (err: any) {
      console.error('SEND HOTEL INFO ERROR', err);
      alert(err?.message || 'Failed to send hotel accommodation email.');
    } finally {
      setSendingHotelInfoFor(null);
    }
  }

  async function handleBulkSendHotelInfo() {
    const hasSelection = selectedBookingIds.size > 0;
    const targetCount = hasSelection ? selectedBookingIds.size : eligibleBookings.length;

    if (targetCount === 0) {
      alert('No eligible bookings found.');
      return;
    }

    const confirmMessage = hasSelection
      ? `This will email hotel accommodation options to the ${targetCount} selected booking(s). Continue?`
      : `No bookings selected — this will email hotel accommodation options to ALL ${targetCount} booking(s). Continue?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setBulkSendingHotelInfo(true);
      const res = await apiClient.post<{ emailsSent: number; message: string }>(
        '/admin/events/current/bookings/send-hotel-accommodation',
        hasSelection ? { bookingIds: Array.from(selectedBookingIds) } : {}
      );
      alert(res?.message || `Sent to ${res?.emailsSent ?? 0} booking(s).`);
      setSelectedBookingIds(new Set());
    } catch (err: any) {
      console.error('BULK HOTEL INFO ERROR', err);
      alert(err?.message || 'Failed to send bulk hotel accommodation emails.');
    } finally {
      setBulkSendingHotelInfo(false);
    }
  }

  const handleDownloadMissingDetailsCsv = () => {
    if (missingDetailBookings.length === 0) {
      alert('All required booking details are complete.');
      return;
    }
    const headers = [
      'S.No.',
      'Booking Number',
      'Contact Person',
      'Company Name',
      'Email',
      'Mobile',
      'PAN Number',
      'Udyam Number',
      'GSTIN',
      'Registered Address',
      'City',
      'Industry Category',
      'Product Keywords',
      'Business Type',
      'Fascia Name',
      'Missing Fields',
    ];

    const rows = missingDetailBookings.map((booking, index) => {
      const missingFields: string[] = [];

      if (isMissingValue(booking.contactPerson)) {
        missingFields.push('Contact Person');
      }

      if (isMissingValue(booking.mobile)) {
        missingFields.push('Mobile');
      }

      if (isMissingValue(booking.panNumber)) {
        missingFields.push('PAN Number');
      }

      if (isMissingValue(booking.udyamRegistrationNumber)) {
        missingFields.push('Udyam Number');
      }

      if (isMissingValue(booking.gstin)) {
        missingFields.push('GSTIN');
      }

      if (isMissingValue(booking.registeredAddress)) {
        missingFields.push('Registered Address');
      }

      if (isMissingValue(booking.city)) {
        missingFields.push('City');
      }

      if (isMissingValue(booking.industryCategory)) {
        missingFields.push('Industry Category');
      }

      if (isMissingValue(booking.productKeywords)) {
        missingFields.push('Product Keywords');
      }

      if (isMissingValue(booking.businessType)) {
        missingFields.push('Business Type');
      }

      if (isMissingValue(booking.fasciaName)) {
        missingFields.push('Fascia Name');
      }

      return [
        index + 1,
        booking.bookingRegistrationNumber ?? '',
        booking.contactPerson ?? '',
        booking.companyName ?? '',
        booking.email ?? '',

        booking.mobile
          ? `'${booking.mobile}`
          : '',

        booking.panNumber ?? '',
        booking.udyamRegistrationNumber ?? '',
        booking.gstin ?? '',
        booking.registeredAddress ?? '',
        booking.city ?? '',
        booking.industryCategory ?? '',
        booking.productKeywords ?? '',
        booking.businessType ?? '',
        booking.fasciaName ?? '',
        missingFields.join(', '),
      ];
    });

    const csvContent = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map(row =>
        row.map(escapeCsvValue).join(',')
      ),
    ].join('\r\n');

    const blob = new Blob(['\uFEFF', csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);

    anchor.href = url;
    anchor.download = `booking-missing-details-${date}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
  };

  type StallReportBucket = 'Blocked' | 'Frozen' | 'Confirmed';

  interface StallReportEntry {
    stallNumber: string;
    bookingRegistrationNumber: string;
    fasciaName: string;
    contactPerson: string;
    mobileNumber: string;
    blockExpiresAt?: string | null;
  }

  const stallReport = useMemo(() => {
    type SizeBuckets = Record<string, Record<StallReportBucket, StallReportEntry[]>>;
    const byDistrict: Record<string, SizeBuckets> = {};

    filteredBookings.forEach(booking => {
      if (isMissingValue(booking.stallNumber)) return;

      const district = formatDistrict(booking.district) || 'Unspecified';
      const size = booking.stallSizeCode || booking.stallSizeName || 'Unspecified';

      let bucket: StallReportBucket | null = null;

      if (booking.bookingStatus === 'Confirmed') {
        bucket = 'Confirmed';
      } else if (booking.bookingStatus === 'BlockedAwaitingPayment' || booking.bookingStatus === 'PaymentSubmitted') {
        bucket = 'Blocked';
      }

      if (!bucket) return;

      if (!byDistrict[district]) byDistrict[district] = {};
      if (!byDistrict[district][size]) {
        byDistrict[district][size] = { Blocked: [], Frozen: [], Confirmed: [] };
      }

      byDistrict[district][size][bucket].push({
        stallNumber: booking.stallNumber || '—',
        bookingRegistrationNumber: booking.bookingRegistrationNumber || '—',
        fasciaName: booking.fasciaName || booking.companyName || '—',
        contactPerson: booking.contactPerson || '—',
        mobileNumber: booking.mobile || '—',
        blockExpiresAt: booking.blockExpiresAt,
      });
    });

    return {
      districts: Object.keys(byDistrict).sort(),
      data: byDistrict,
    };
  }, [filteredBookings]);

  const handleDownloadStallReportCsv = () => {
    const rows: (string | number)[][] = [];

    stallReport.districts.forEach(district => {
      const sizes = stallReport.data[district];

      Object.keys(sizes)
        .sort()
        .forEach(size => {
          (['Blocked', 'Frozen', 'Confirmed'] as StallReportBucket[]).forEach(bucket => {
            sizes[size][bucket].forEach(entry => {
              rows.push([
                district,
                size,
                bucket,
                entry.stallNumber,
                entry.bookingRegistrationNumber,
                entry.fasciaName,
                entry.contactPerson,
                entry.mobileNumber,
                formatCsvDate(entry.blockExpiresAt),
              ]);
            });
          });
        });
    });

    if (rows.length === 0) {
      alert('No stall data available to generate the report.');
      return;
    }

    const headers = [
      'District',
      'Stall Size',
      'Status',
      'Stall Number',
      'Booking Number',
      'Fascia Name',
      'Contact Person',
      'Mobile Number',

      'Block Expires At',
    ];

    const csvContent = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map(row => row.map(escapeCsvValue).join(',')),
    ].join('\r\n');

    const blob = new Blob(['\uFEFF', csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);

    const statusName =
      statusFilter === 'All'
        ? 'all-statuses'
        : statusFilter.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const expiryName =
      expiryFilter === 'All'
        ? 'all-blocks'
        : expiryFilter.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    anchor.href = url;
    anchor.download = `district-stall-report-${statusName}-${expiryName}-${date}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Booking List
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Submitted interests, blocked stalls, payment status and invoice
            readiness.
          </p>
        </div>

        <RefreshListButton
          onRefresh={async () => {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY }),
              queryClient.invalidateQueries({ queryKey: STALLS_KEY }),
            ]);
          }}
          isRefreshing={isLoading}
        />
      </div>

      {/* Count cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CountCard
          label="Total Bookings"
          value={bookings.length}
          description="All booking records"
        />

        <CountCard
          label="Active Blocks"
          value={activeBlockCount}
          description="Blocks not yet expired"
        />

        <CountCard
          label="Expired Blocks"
          value={expiredBlockCount}
          description="Blocks requiring attention"
        />

        <CountCard
          label="Current Results"
          value={filteredBookings.length}
          description="Bookings matching filters"
        />
      </div>

      {/* District-wise stall report */}
      {stallReport.districts.length > 0 && (
        <div className="card mt-6 overflow-hidden border border-slate-200 bg-white rounded-xl shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 bg-slate-50/50">
            <button
              type="button"
              onClick={() => setIsStallReportExpanded(prev => !prev)}
              className="flex items-center gap-3 text-left transition hover:opacity-80 focus:outline-none"
            >
              <ChevronDown
                className={`h-5 w-5 text-slate-500 transform transition-transform duration-200 ${isStallReportExpanded ? 'rotate-180 text-msme-blue' : ''
                  }`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    District-wise Stall Report
                  </h3>
                  <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {stallReport.districts.length} Districts
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  Stall numbers grouped by district, size, and status — reflects applied filters.
                </p>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsStallReportExpanded(prev => !prev)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                {isStallReportExpanded ? 'Hide Report' : 'Show Report'}
              </button>

              <button
                type="button"
                onClick={handleDownloadStallReportCsv}
                className="inline-flex items-center rounded-lg bg-msme-blue px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Download Filtered Report (CSV)
              </button>
            </div>
          </div>

          {isStallReportExpanded && (
            <div className="max-h-[480px] flex flex-col divide-y divide-slate-100 overflow-y-auto">
              {stallReport.districts.map(district => {
                const sizes = stallReport.data[district];

                const sizeKeys = Object.keys(sizes).sort((a, b) =>
                  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
                );

                return (
                  <div key={district} className="p-4">
                    <h4 className="text-sm font-bold text-slate-900">{district}</h4>

                    <div className="mt-3 space-y-3">
                      {sizeKeys.map(size => {
                        const buckets = sizes[size];
                        const bucketConfig: {
                          key: StallReportBucket;
                          label: string;
                          className: string;
                        }[] = [
                            { key: 'Blocked', label: 'Blocked', className: 'bg-amber-100 text-amber-700' },
                            { key: 'Frozen', label: 'Frozen', className: 'bg-sky-100 text-sky-700' },
                            { key: 'Confirmed', label: 'Confirmed', className: 'bg-emerald-100 text-emerald-700' },
                          ];

                        const hasAny = bucketConfig.some(b => buckets[b.key]?.length > 0);
                        if (!hasAny) return null;

                        return (
                          <div key={size} className="rounded-lg border border-slate-100 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {size}
                            </p>

                            <div className="mt-2 space-y-2">
                              {bucketConfig.map(({ key, label, className }) => {
                                const entries = [...(buckets[key] || [])].sort((a, b) =>
                                  a.stallNumber.localeCompare(b.stallNumber, undefined, {
                                    numeric: true,
                                    sensitivity: 'base',
                                  })
                                );

                                if (entries.length === 0) return null;

                                return (
                                  <div key={key} className="flex flex-wrap items-start gap-2">
                                    <span
                                      className={`mt-0.5 inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
                                    >
                                      {label} ({entries.length})
                                    </span>

                                    <div className="flex flex-wrap gap-1.5">
                                      {entries.map((entry, idx) => (
                                        <span
                                          key={`${entry.stallNumber}-${idx}`}
                                          title={`${entry.bookingRegistrationNumber} — ${entry.fasciaName}`}
                                          className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700"
                                        >
                                          {entry.stallNumber}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Status counts */}
      {Object.keys(statusCounts).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('Allocated')}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${statusFilter === 'Allocated'
              ? 'border-msme-blue bg-msme-blue text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-msme-blue hover:text-msme-blue'
              }`}
          >
            Allocated: {allocatedCount}
          </button>
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${statusFilter === status
                ? 'border-msme-blue bg-msme-blue text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-msme-blue hover:text-msme-blue'
                }`}
            >
              {getDisplayStatus(status)}: {count}            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card mt-6 p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <label
              htmlFor="booking-search"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Search
            </label>

            <input
              id="booking-search"
              type="search"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Search booking no, fascia, company, status, stall..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-msme-blue focus:ring-2 focus:ring-msme-blue/10"
            />
          </div>

          <div>
            <label
              htmlFor="status-filter"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Booking Status
            </label>

            <select
              id="status-filter"
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-msme-blue focus:ring-2 focus:ring-msme-blue/10"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status === 'All'
                    ? `All Statuses (${bookings.length})`
                    : status === 'Allocated'
                      ? `Allocated (${allocatedCount})`
                      : `${getDisplayStatus(status)} (${statusCounts[status] ?? 0})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="expiry-filter"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Block Expiry
            </label>
            <select
              id="expiry-filter"
              value={expiryFilter}
              onChange={event =>
                setExpiryFilter(event.target.value as ExpiryFilter)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-msme-blue focus:ring-2 focus:ring-msme-blue/10"
            >
              <option value="All">All Blocks</option>
              <option value="Active">Active Blocks</option>
              <option value="Expired">Expired Blocks</option>
              <option value="No Expiry">No Expiry Date</option>
              <option value="Confirmed">Confirmed</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="district-filter"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              District
            </label>
            <select
              id="district-filter"
              value={districtFilter}
              onChange={event => setDistrictFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-msme-blue focus:ring-2 focus:ring-msme-blue/10"
            >
              {districtOptions.map(district => (
                <option key={district} value={district}>
                  {district === 'All' ? 'All Districts' : district}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="size-filter"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Stall Size
            </label>
            <select
              id="size-filter"
              value={sizeFilter}
              onChange={event => setSizeFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-msme-blue focus:ring-2 focus:ring-msme-blue/10"
            >
              {sizeOptions.map(size => (
                <option key={size} value={size}>
                  {size === 'All' ? 'All Sizes' : size}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="lub-member-filter"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              LUB Member
            </label>
            <select
              id="lub-member-filter"
              value={lubMemberFilter}
              onChange={event => setLubMemberFilter(event.target.value as 'All' | 'Yes' | 'No')}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-msme-blue focus:ring-2 focus:ring-msme-blue/10"
            >
              <option value="All">All</option>
              <option value="Yes">LUB Member - Yes</option>
              <option value="No">LUB Member - No</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">
            Showing{' '}
            <span className="font-bold text-slate-900">
              {filteredBookings.length}
            </span>{' '}
            of{' '}
            <span className="font-bold text-slate-900">
              {bookings.length}
            </span>{' '}
            bookings
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                Clear Filters
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadMissingDetailsCsv}
              disabled={isLoading || missingDetailBookings.length === 0}
              className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Download Missing Details ({missingDetailBookings.length})
            </button>
            <button
              type="button"
              onClick={handleBulkSendEditAccess}
              disabled={isLoading || bulkSendingEditAccess || eligibleForBulkEditCount === 0}
              className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkSendingEditAccess
                ? 'Sending...'
                : selectedBookingIds.size > 0
                  ? `Bulk Edit Mail - Selected (${selectedBookingIds.size})`
                  : `Bulk Edit Mail - Allocated (${eligibleForBulkEditCount})`}
            </button>
            <button
              type="button"
              onClick={handleBulkSendStallInfo}
              disabled={isLoading || bulkSendingStallInfo || eligibleBookings.length === 0}
              className="inline-flex items-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkSendingStallInfo
                ? 'Sending...'
                : selectedBookingIds.size > 0
                  ? `Bulk Stall Info - Selected (${selectedBookingIds.size})`
                  : `Bulk Stall Info - All (${eligibleBookings.length})`}
            </button>
            <button
              type="button"
              onClick={handleBulkSendHotelInfo}
              disabled={isLoading || bulkSendingHotelInfo || eligibleBookings.length === 0}
              className="inline-flex items-center rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkSendingHotelInfo
                ? 'Sending...'
                : selectedBookingIds.size > 0
                  ? `Bulk Hotel Info - Selected (${selectedBookingIds.size})`
                  : `Bulk Hotel Info - All (${eligibleBookings.length})`}
            </button>

            {/* Clean Bulk Actions Dropdown Menu Trigger */}
            <div className="relative inline-block text-left">
              <button
                type="button"
                onClick={() => setIsBulkMenuOpen(prev => !prev)}
                disabled={isLoading || filteredBookings.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
              >
                <span>Subsidy Actions ({selectedBookingIds.size > 0 ? `${selectedBookingIds.size} Selected` : `${filteredBookings.length} Filtered`})</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isBulkMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isBulkMenuOpen && (
                <div className="absolute left-0 mt-2 w-72 origin-top-left rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 divide-y divide-slate-100">
                  <div className="py-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => { setIsBulkMenuOpen(false); setBulkModalConfig({ isOpen: true, type: 'msme' }); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                      Bulk MSME Subsidy Info
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsBulkMenuOpen(false); setBulkModalConfig({ isOpen: true, type: 'fame' }); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700"
                    >
                      <span className="h-2 w-2 rounded-full bg-cyan-600"></span>
                      Bulk FaMe TN Subsidy Info
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsBulkMenuOpen(false); setBulkModalConfig({ isOpen: true, type: 'action' }); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-orange-50 hover:text-orange-700"
                    >
                      <span className="h-2 w-2 rounded-full bg-orange-600"></span>
                      Bulk Action Required
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={isLoading || filteredBookings.length === 0}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Download CSV ({filteredBookings.length})
            </button>
            <button
              type="button"
              onClick={() => handleDownloadLubMemberCsv(true)}
              disabled={isLoading || filteredBookings.filter(b => b.lubMember === true).length === 0}
              className="inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Download LUB Member (Yes) ({filteredBookings.filter(b => b.lubMember === true).length})
            </button>
            <button
              type="button"
              onClick={() => handleDownloadLubMemberCsv(false)}
              disabled={isLoading || filteredBookings.filter(b => b.lubMember !== true).length === 0}
              className="inline-flex items-center rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Download LUB Member (No) ({filteredBookings.filter(b => b.lubMember !== true).length})
            </button>
          </div>
        </div>
      </div>

      {/* Booking table */}
      <div className="card mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-4">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAllOnPage}
                    disabled={eligibleOnPage.length === 0}
                    aria-label="Select all eligible bookings on this page"
                  />
                </th>
                <th className="p-4">S.No.</th>
                <th
                  className="cursor-pointer select-none p-4 hover:text-slate-700"
                  onClick={() => toggleSort('bookingRegistrationNumber')}
                >
                  Booking No.
                  <SortIndicator column="bookingRegistrationNumber" />
                </th>

                <th
                  className="cursor-pointer select-none p-4 hover:text-slate-700"
                  onClick={() => toggleSort('fasciaName')}
                >
                  Fascia
                  <SortIndicator column="fasciaName" />
                </th>

                <th
                  className="cursor-pointer select-none p-4 hover:text-slate-700"
                  onClick={() => toggleSort('bookingStatus')}
                >
                  Status
                  <SortIndicator column="bookingStatus" />
                </th>

                <th
                  className="cursor-pointer select-none p-4 hover:text-slate-700"
                  onClick={() => toggleSort('blockExpiresAt')}
                >
                  Block Expires
                  <SortIndicator column="blockExpiresAt" />
                </th>

                <th className="p-4">Block State</th>

                <th
                  className="cursor-pointer select-none p-4 hover:text-slate-700"
                  onClick={() => toggleSort('stallNumber')}
                >
                  Stall Name
                  <SortIndicator column="stallNumber" />
                </th>

                <th
                  className="cursor-pointer select-none p-4 hover:text-slate-700"
                  onClick={() => toggleSort('stallSizeCode')}
                >
                  Size
                  <SortIndicator column="stallSizeCode" />
                </th>

                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={10}
                    className="p-10 text-center text-sm text-slate-500"
                  >
                    Loading bookings...
                  </td>
                </tr>
              )}

              {!isLoading && sortedBookings.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-10 text-center">
                    <p className="font-semibold text-slate-700">
                      No bookings found
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Try changing or clearing the selected filters.
                    </p>
                  </td>
                </tr>
              )}

              {!isLoading &&
                paginatedBookings.map((booking, index) => {
                  const blockState = getBlockState(booking.blockExpiresAt, booking.bookingStatus);
                  const isEligible = Boolean(booking.allocatedStallId);

                  return (
                    <tr
                      key={booking.id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/70"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedBookingIds.has(booking.id)}
                          onChange={() => toggleSelectBooking(booking.id, isEligible)}
                          disabled={!isEligible}
                          title={!isEligible ? 'Stall not allocated yet — cannot select' : undefined}
                        />
                      </td>
                      <td className="p-4 text-slate-500">
                        {(safePage - 1) * pageSize + index + 1}
                      </td>

                      <td className="p-4 font-semibold text-slate-900">
                        {booking.bookingRegistrationNumber || '—'}
                      </td>

                      <td className="p-4 text-slate-700">
                        {booking.fasciaName || booking.companyName}
                      </td>

                      <td className="p-4">
                        <StatusBadge value={getDisplayStatus(booking.bookingStatus)} />
                      </td>

                      <td className="p-4 text-slate-600">
                        {booking.blockExpiresAt
                          ? new Date(
                            booking.blockExpiresAt
                          ).toLocaleString()
                          : '—'}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${blockState.className}`}
                        >
                          {blockState.label}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700">
                        {booking.stallNumber || '—'}
                      </td>

                      <td className="p-4 text-slate-700">
                        {booking.stallSizeCode || '—'}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowActionButton(booking)}
                            title="View booking details"
                            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                            aria-label="View booking details"
                          >
                            <InfoIcon className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setViewBooking(booking)}
                            title="View booking details"
                            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                            aria-label="View booking details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setQrBooking(booking)}
                            title="Stall QR code (scan for company details)"
                            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600"
                            aria-label="Show stall QR code"
                          >
                            <QrCode className="h-4 w-4" />
                          </button>
                          {booking.bookingStatus === 'Submitted' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteBooking(booking)}
                              disabled={deletingBookingId === booking.id}
                              title="Delete booking (Submitted only)"
                              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label="Delete booking"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          {canViewBooking && (
                            <Link
                              className="inline-flex rounded-lg px-3 py-2 font-semibold text-msme-blue transition hover:bg-blue-50"
                              to={`/app/bookings/${booking.id}`}
                            >
                              Open
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {viewBooking && (
          <ModalPortal>
            <div
              className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
              onClick={() => setViewBooking(null)}
            >
              <div
                className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
                onClick={event => event.stopPropagation()}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Booking Details</h3>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {viewBooking.bookingRegistrationNumber}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setViewBooking(null)}
                    className="text-xl leading-none text-slate-400 hover:text-slate-700"
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
                  <DetailRow label="Status" value={<StatusBadge value={getDisplayStatus(viewBooking.bookingStatus)} />} />                <DetailRow
                    label="Expected Amount"
                    value={`₹${Number(viewBooking.expectedAmount || 0).toLocaleString('en-IN')}`}
                  />
                  <DetailRow label="Stall Number" value={viewBooking.stallNumber || '—'} />
                  <DetailRow label="Stall Size" value={viewBooking.stallSizeCode || viewBooking.stallSizeName} />
                  <DetailRow label="District" value={viewBooking.district || '—'} />
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
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
                    onClick={() => setViewBooking(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}

        {actionButton && (
          <ModalPortal>
            <div
              className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
              onClick={() => setShowActionButton(null)}
            >
              <div
                className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
                onClick={event => event.stopPropagation()}
              >
              {/* ================= HEADER ================= */}
              <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-6 py-5 sm:px-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                        BOOKING
                      </span>

                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {actionButton.bookingStatus}
                      </span>
                    </div>

                    <h3 className="mt-3 truncate text-xl font-bold tracking-tight text-slate-900">
                      Booking Details
                    </h3>

                    <p className="mt-1 font-mono text-sm font-medium text-slate-500">
                      {actionButton.bookingRegistrationNumber}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowActionButton(null)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Close"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Booking quick info */}
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Company
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                      {actionButton.companyName || '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Stall
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {actionButton.stallNumber || 'Not allocated'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Contact
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                      {actionButton.contactPerson || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ================= ACTIONS ================= */}
              <div className="max-h-[60vh] overflow-y-auto px-6 py-6 sm:px-7">
                {(() => {
                  const blockState = getBlockState(
                    actionButton.blockExpiresAt,
                    actionButton.bookingStatus
                  );

                  return (
                    <div className="space-y-7">

                      {/* PRIMARY ACTIONS */}
                      {(hasBookingManage &&
                        actionButton.bookingStatus === 'Confirmed') ||
                        (hasBookingManage &&
                          actionButton.blockExpiresAt &&
                          blockState.label !== 'Confirmed') ? (
                        <section>
                          <div className="mb-3">
                            <h4 className="text-sm font-bold text-slate-900">
                              Booking Actions
                            </h4>
                            <p className="mt-0.5 text-xs text-slate-500">
                              Manage the exhibitor booking and stall allocation.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                            {/* E-CARD */}
                            {hasBookingManage &&
                              actionButton.bookingStatus === 'Confirmed' && (
                                <button
                                  type="button"
                                  disabled={
                                    !actionButton.email ||
                                    !actionButton.stallNumber
                                  }
                                  onClick={() => {
                                    setShowActionButton(null);

                                    setEmailStallCardBooking({
                                      id: actionButton.id,
                                      bookingRegistrationNumber:
                                        actionButton.bookingRegistrationNumber,
                                      stallNumber:
                                        actionButton.stallNumber ?? null,
                                      fasciaName:
                                        actionButton.fasciaName ?? null,
                                      companyName:
                                        actionButton.companyName ?? '',
                                      contactPerson:
                                        actionButton.contactPerson ?? '',
                                      email: actionButton.email ?? '',
                                      mobile: actionButton.mobile ?? '',
                                      industryCategory:
                                        actionButton.industryCategory ?? null,
                                      productKeywords:
                                        actionButton.productKeywords ?? null,
                                      companyLogo:
                                        actionButton.companyLogo ?? null,
                                      manufacturing: (
                                        actionButton as StallBooking & {
                                          manufacturing?: string | null;
                                        }
                                      ).manufacturing ?? null,
                                    });
                                  }}
                                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
                                  title={
                                    !actionButton.email
                                      ? 'Exhibitor email address is not available.'
                                      : !actionButton.stallNumber
                                        ? 'A stall must be allocated before sending the email.'
                                        : 'Send stall details card through email'
                                  }
                                >
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                                    <svg
                                      viewBox="0 0 24 24"
                                      className="h-5 w-5"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.8"
                                    >
                                      <rect
                                        x="3"
                                        y="5"
                                        width="18"
                                        height="14"
                                        rx="2"
                                      />
                                      <path d="m3 7 9 6 9-6" />
                                    </svg>
                                  </div>

                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900">
                                      E-Card
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                      Send stall details card by email
                                    </p>
                                  </div>

                                  <svg
                                    viewBox="0 0 24 24"
                                    className="ml-auto h-4 w-4 text-slate-300 transition group-hover:text-blue-500"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="m9 18 6-6-6-6" />
                                  </svg>
                                </button>
                              )}

                            {/* EXTEND */}
                            {hasBookingManage &&
                              actionButton.blockExpiresAt &&
                              blockState.label !== 'Confirmed' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowActionButton(null);
                                    openExtendModal(actionButton);
                                  }}
                                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50/40 hover:shadow-md"
                                  title="Extend the block expiry date for this booking"
                                >
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 transition group-hover:bg-amber-500 group-hover:text-white">
                                    <svg
                                      viewBox="0 0 24 24"
                                      className="h-5 w-5"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.8"
                                    >
                                      <circle cx="12" cy="12" r="9" />
                                      <path d="M12 7v5l3 2" />
                                    </svg>
                                  </div>

                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900">
                                      Extend Block
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                      Extend the stall block expiry date
                                    </p>
                                  </div>

                                  <svg
                                    viewBox="0 0 24 24"
                                    className="ml-auto h-4 w-4 text-slate-300 transition group-hover:text-amber-500"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="m9 18 6-6-6-6" />
                                  </svg>
                                </button>
                              )}
                          </div>
                        </section>
                      ) : null}

                      {/* DOCUMENTS */}
                      {canViewPayment &&
                        actionButton.bookingStatus !== 'Submitted' && (
                          <section>
                            <div className="mb-3">
                              <h4 className="text-sm font-bold text-slate-900">
                                Documents & Payments
                              </h4>
                              <p className="mt-0.5 text-xs text-slate-500">
                                Generate, send or download booking documents.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                              {/* SEND PROFORMA */}
                              <button
                                type="button"
                                disabled={sendingProformaFor === actionButton.id}
                                onClick={() =>
                                  handleSendProforma(actionButton)
                                }
                                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-md disabled:opacity-50"
                              >
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                  >
                                    <path d="M4 4h16v16H4z" />
                                    <path d="M8 9h8M8 13h6" />
                                  </svg>
                                </div>

                                <div>
                                  <p className="font-bold text-slate-900">
                                    {sendingProformaFor === actionButton.id
                                      ? 'Sending...'
                                      : 'Send Proforma'}
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    Email proforma invoice
                                  </p>
                                </div>
                              </button>

                              {/* DOWNLOAD PROFORMA */}
                              <button
                                type="button"
                                disabled={
                                  downloadingProformaFor === actionButton.id
                                }
                                onClick={() =>
                                  handleDownloadProforma(actionButton)
                                }
                                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50/40 hover:shadow-md disabled:opacity-50"
                              >
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 transition group-hover:bg-sky-600 group-hover:text-white">
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                  >
                                    <path d="M12 3v12" />
                                    <path d="m7 10 5 5 5-5" />
                                    <path d="M5 20h14" />
                                  </svg>
                                </div>

                                <div>
                                  <p className="font-bold text-slate-900">
                                    {downloadingProformaFor === actionButton.id
                                      ? 'Downloading...'
                                      : 'Download Proforma'}
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    Download invoice PDF
                                  </p>
                                </div>
                              </button>

                              {/* RECEIPT */}
                              {(actionButton.bookingStatus === 'Confirmed' ||
                                actionButton.bookingStatus ===
                                'PaymentSubmitted') && (
                                  <button
                                    type="button"
                                    disabled={
                                      downloadingReceiptFor === actionButton.id
                                    }
                                    onClick={() =>
                                      handleDownloadPaymentReceipt(actionButton)
                                    }
                                    className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50/40 hover:shadow-md disabled:opacity-50"
                                  >
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 transition group-hover:bg-amber-500 group-hover:text-white">
                                      <svg
                                        viewBox="0 0 24 24"
                                        className="h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                      >
                                        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
                                        <path d="M9 8h6M9 12h6" />
                                      </svg>
                                    </div>

                                    <div>
                                      <p className="font-bold text-slate-900">
                                        {downloadingReceiptFor === actionButton.id
                                          ? 'Downloading...'
                                          : 'Payment Receipt'}
                                      </p>
                                      <p className="mt-0.5 text-xs text-slate-500">
                                        Download payment receipt
                                      </p>
                                    </div>
                                  </button>
                                )}

                              {/* TAX INVOICE */}
                              {actionButton.bookingStatus === 'Confirmed' && (
                                <button
                                  type="button"
                                  disabled={
                                    downloadingTaxInvoiceFor === actionButton.id
                                  }
                                  onClick={() =>
                                    handleDownloadTaxInvoice(actionButton)
                                  }
                                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-purple-200 hover:bg-purple-50/40 hover:shadow-md disabled:opacity-50"
                                >
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 transition group-hover:bg-purple-600 group-hover:text-white">
                                    <svg
                                      viewBox="0 0 24 24"
                                      className="h-5 w-5"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.8"
                                    >
                                      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
                                      <path d="M9 8h6M9 12h6" />
                                    </svg>
                                  </div>

                                  <div>
                                    <p className="font-bold text-slate-900">
                                      {downloadingTaxInvoiceFor === actionButton.id
                                        ? 'Downloading...'
                                        : 'Tax Invoice'}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                      Download GST tax invoice
                                    </p>
                                  </div>
                                </button>
                              )}
                            </div>
                          </section>
                        )}

                      {/* BOOKING LINK */}
                      {canReviewBooking && (
                        <section className="space-y-3">
                          <div className="mb-3">
                            <h4 className="text-sm font-bold text-slate-900">
                              Exhibitor Access
                            </h4>
                            <p className="mt-0.5 text-xs text-slate-500">
                              Allow the exhibitor to review or update their booking.
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={generatingLinkFor === actionButton.id}
                            onClick={() =>
                              handleGenerateOrCopyLink(actionButton)
                            }
                            className="group flex w-full items-center gap-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 text-left transition-all hover:bg-indigo-50 hover:shadow-md disabled:opacity-50"
                          >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                              <svg
                                viewBox="0 0 24 24"
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                              >
                                <path d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15" />
                                <path d="M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 12 20l1.15-1.15" />
                              </svg>
                            </div>

                            <div className="min-w-0">
                              <p className="font-bold text-slate-900">
                                {generatingLinkFor === actionButton.id
                                  ? 'Generating...'
                                  : editLinks[actionButton.id]
                                    ? 'Copy Exhibitor Link'
                                    : 'Generate Exhibitor Link'}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-500">
                                {editLinks[actionButton.id]
                                  ? 'Copy the existing booking edit link'
                                  : 'Generate and email a secure edit link'}
                              </p>
                            </div>

                            <svg
                              viewBox="0 0 24 24"
                              className="ml-auto h-4 w-4 text-indigo-400"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            disabled={sendingStallInfoFor === actionButton.id}
                            onClick={() => handleSendStallInfo(actionButton)}
                            className="group flex w-full items-center gap-4 rounded-2xl border border-purple-200 bg-purple-50/50 p-4 text-left transition-all hover:bg-purple-50 hover:shadow-md disabled:opacity-50"
                          >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
                              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M22 2L11 13" />
                                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900">
                                {sendingStallInfoFor === actionButton.id ? 'Sending...' : 'Send Stall Info'}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                Email stall design and layout details
                              </p>
                            </div>
                            <svg viewBox="0 0 24 24" className="ml-auto h-4 w-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            disabled={sendingHotelInfoFor === actionButton.id}
                            onClick={() => handleSendHotelInfo(actionButton)}
                            className="group flex w-full items-center gap-4 rounded-2xl border border-fuchsia-200 bg-fuchsia-50/50 p-4 text-left transition-all hover:bg-fuchsia-50 hover:shadow-md disabled:opacity-50"
                          >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fuchsia-600 text-white">
                              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M3 21v-8a2 2 0 0 1 2-2h4" />
                                <path d="M9 11v10" />
                                <path d="M15 21v-8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v8" />
                                <path d="M21 11V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4" />
                                <path d="M2 21h20" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900">
                                {sendingHotelInfoFor === actionButton.id ? 'Sending...' : 'Send Hotel Info'}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                Email hotel and accommodation options
                              </p>
                            </div>
                            <svg viewBox="0 0 24 24" className="ml-auto h-4 w-4 text-fuchsia-400" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </button>

                          {/* Button #1: Send MSME Subsidy Info */}
                          <button
                            type="button"
                            disabled={sendingMsmeSubsidyFor === actionButton.id}
                            onClick={() => handleSendMsmeSubsidy(actionButton)}
                            className="group flex w-full items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-left transition-all hover:bg-emerald-50 hover:shadow-md disabled:opacity-50"
                          >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M12 7v10M8.5 9.5h5a2 2 0 1 1 0 4h-5" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900">
                                {sendingMsmeSubsidyFor === actionButton.id ? 'Sending...' : 'Send MSME Subsidy Info'}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">Email MSME subsidy eligibility details</p>
                            </div>
                            <svg viewBox="0 0 24 24" className="ml-auto h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </button>

                          {/* Button #2: Send FaMe TN Subsidy Info */}
                          <button
                            type="button"
                            disabled={sendingFameTnSubsidyFor === actionButton.id}
                            onClick={() => handleSendFameTnSubsidy(actionButton)}
                            className="group flex w-full items-center gap-4 rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4 text-left transition-all hover:bg-cyan-50 hover:shadow-md disabled:opacity-50"
                          >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white">
                              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M12 7v10M8.5 9.5h5a2 2 0 1 1 0 4h-5" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900">
                                {sendingFameTnSubsidyFor === actionButton.id ? 'Sending...' : 'Send FaMe TN Subsidy Info'}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">Email FaMe TN subsidy eligibility details</p>
                            </div>
                            <svg viewBox="0 0 24 24" className="ml-auto h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </button>

                          {/* Button #3: Send Exhibitor Action Required */}
                          <button
                            type="button"
                            disabled={sendingExhibitorActionFor === actionButton.id}
                            onClick={() => handleSendExhibitorAction(actionButton)}
                            className="group flex w-full items-center gap-4 rounded-2xl border border-orange-200 bg-orange-50/50 p-4 text-left transition-all hover:bg-orange-50 hover:shadow-md disabled:opacity-50"
                          >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white">
                              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M12 9v4M12 17h.01" />
                                <circle cx="12" cy="12" r="9" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900">
                                {sendingExhibitorActionFor === actionButton.id ? 'Sending...' : 'Send Exhibitor Action Required'}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">Notify exhibitor of a pending action</p>
                            </div>
                            <svg viewBox="0 0 24 24" className="ml-auto h-4 w-4 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </button>

                        </section>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* ================= FOOTER ================= */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-4 sm:px-7">
                <p className="hidden text-xs text-slate-400 sm:block">
                  Select an action to continue
                </p>

                <button
                  type="button"
                  onClick={() => setShowActionButton(null)}
                  className="ml-auto rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
          </ModalPortal>
        )}

        {/* Bulk Action Confirmation Modal */}
        {bulkModalConfig.isOpen && (
          <ModalPortal>
            <div
              className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
              onClick={() => setBulkModalConfig({ isOpen: false, type: null })}
            >
              <div
                className="w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5"
                onClick={e => e.stopPropagation()}
              >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {bulkModalConfig.type === 'msme'
                      ? 'Send Bulk MSME Subsidy Emails'
                      : bulkModalConfig.type === 'fame'
                        ? 'Send Bulk FaMe TN Subsidy Emails'
                        : 'Send Bulk Exhibitor Action Required Emails'}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    This action will process emails based on your current selection or applied filters.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBulkModalConfig({ isOpen: false, type: null })}
                  className="text-slate-400 hover:text-slate-700"
                >
                  ×
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Target Scope:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedBookingIds.size > 0 ? 'Selected Bookings' : 'Filtered Bookings'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-t border-slate-200/60">
                  <span className="text-slate-500">Total Recipients:</span>
                  <span className="font-bold text-msme-blue">
                    {selectedBookingIds.size > 0 ? selectedBookingIds.size : filteredBookings.length} Booking(s)
                  </span>
                </div>
              </div>

              {bulkModalConfig.type === 'action' && (
                <div className="mt-4">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action Required Description
                  </label>
                  <input
                    type="text"
                    id="bulk-action-required-input"
                    placeholder="e.g., Please upload your Udyam Registration Certificate."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-msme-blue focus:ring-2 focus:ring-msme-blue/10"
                  />
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={bulkSendingStatus}
                  onClick={() => setBulkModalConfig({ isOpen: false, type: null })}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={bulkSendingStatus}
                  onClick={() => {
                    const inputVal = bulkModalConfig.type === 'action'
                      ? (document.getElementById('bulk-action-required-input') as HTMLInputElement)?.value
                      : undefined;
                    if (bulkModalConfig.type === 'action' && !inputVal?.trim()) {
                      alert('Please enter the action required description.');
                      return;
                    }
                    executeBulkAction(inputVal);
                  }}
                  className="rounded-xl bg-msme-blue px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {bulkSendingStatus ? 'Sending Emails...' : `Confirm & Send (${selectedBookingIds.size > 0 ? selectedBookingIds.size : filteredBookings.length})`}
                </button>
              </div>
            </div>
          </div>
          </ModalPortal>
        )}

        {/* Pagination controls */}
        {!isLoading && sortedBookings.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>
                Showing{' '}
                <span className="font-semibold text-slate-900">{rangeStart}</span>
                {'–'}
                <span className="font-semibold text-slate-900">{rangeEnd}</span>
                {' of '}
                <span className="font-semibold text-slate-900">{sortedBookings.length}</span>
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
      {emailStallCardBooking && (
        <EmailStallCardModal
          booking={emailStallCardBooking}
          onClose={() => {
            setEmailStallCardBooking(null)
            setShowActionButton(null)
          }

          }
          disableSendEmail
        />
      )}

      {qrBooking && (
        <StallQrModal
          booking={{
            bookingRegistrationNumber: qrBooking.bookingRegistrationNumber,
            fasciaName: qrBooking.fasciaName,
            companyName: qrBooking.companyName,
            stallNumber: (qrBooking as StallBooking & { stallNumber?: string }).stallNumber
          }}
          onClose={() => setQrBooking(null)}
        />
      )}

      {/* Extend block expiry modal */}
      {extendTarget && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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
        </ModalPortal>
      )}
    </div>
  );
}

interface CountCardProps {
  label: string;
  value: number;
  description: string;
}

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

function CountCard({ label, value, description }: CountCardProps) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p>

      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function getBlockState(blockExpiresAt?: string | null, bookingStatus?: string | null) {
  if (bookingStatus === 'Confirmed' || bookingStatus === 'Frozen') {
    return {
      label: 'Confirmed',
      className: 'bg-blue-100 text-blue-700',
    };
  }

  if (!blockExpiresAt) {
    return {
      label: 'No Expiry',
      className: 'bg-slate-100 text-slate-600',
    };
  }

  const expiryTime = new Date(blockExpiresAt).getTime();
  const now = new Date().getTime();

  if (Number.isNaN(expiryTime)) {
    return {
      label: 'Invalid Date',
      className: 'bg-amber-100 text-amber-700',
    };
  }

  if (expiryTime < now) {
    return {
      label: 'Expired',
      className: 'bg-red-100 text-red-700',
    };
  }

  return {
    label: 'Active',
    className: 'bg-emerald-100 text-emerald-700',
  };
}