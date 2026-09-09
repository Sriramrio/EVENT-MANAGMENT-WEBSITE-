import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Stall, StallBooking } from '../../domain/models';
import { repositories } from '../../data/repositoryFactory';
import { StatusBadge } from '../../shared/StatusBadge';
import { useSession } from '../../app/session';
import { PERMISSIONS } from '../../config/permissions';
import { apiClient, ApiError } from '../../data/api/apiClient';
import { StallMaster } from '../../data/api/ApiRepositories';

import {
  Eye,
  Info,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Clock,
  Send,
  FileText,
  CreditCard,
  Link as LinkIcon,
  Grid,
  List,
  Layers,
  Award,
  Bookmark
} from 'lucide-react';
import { EmailStallCardBooking, EmailStallCardModal } from './EmailStallCardModal';
import { appConfig } from '../../config/appConfig';
import { StallSizeOption } from '../stalls/StallMasterPage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshListButton } from '../../shared/components/RefreshListButton';

const BOOKINGS_KEY = ['admin', 'bookings'] as const;
const STALLS_KEY = ['admin', 'stalls'] as const;
const STALL_SIZES_KEY = ['public', 'stall-sizes'] as const;

// Extended type interface to support flexible backend payloads
interface ExtendedStallBooking extends StallBooking {
  isSponsor?: boolean;
  isSponser?: boolean;
}

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

// Helper to sort stall numbers naturally (e.g., B1, B2, B10 instead of B1, B10, B2)
const naturalSortStalls = (a: string, b: string) => {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

export function BookingReport() {
  const stallMaster = useMemo(() => new StallMaster(), []);
  const queryClient = useQueryClient();
  const { data: initialBookings = [], isLoading: loadingBookings, error: bookingError } = useQuery({
    queryKey: BOOKINGS_KEY,
    queryFn: () => apiClient.get<ExtendedStallBooking[]>('/admin/events/current/bookings'),
  });
  const { data: initialStalls = [], isLoading: loadingStalls, error: stallError } = useQuery({
    queryKey: STALLS_KEY,
    queryFn: () => stallMaster.list(),
  });
  const { data: initialStallSizes = [], isLoading: loadingStallSizes, error: sizesError } = useQuery({
    queryKey: STALL_SIZES_KEY,
    queryFn: () => apiClient.get<StallSizeOption[]>(`/public/events/${appConfig.defaultEventCode}/stall-sizes`),
    gcTime: 30 * 60_000,
  });

  const [bookings, setBookings] = useState<ExtendedStallBooking[]>([]);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [stallSizes, setStallSizes] = useState<StallSizeOption[]>([]);
  const isLoading = loadingBookings || loadingStalls || loadingStallSizes;
  const [activeTab, setActiveTab] = useState<'matrix' | 'status-matrix' | 'list'>('status-matrix');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>('All');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [sizeFilter, setSizeFilter] = useState('All');

  // Sorting & Pagination States
  const [sortKey, setSortKey] = useState<SortKey>('bookingDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  // Modals & Action States
  const [emailStallCardBooking, setEmailStallCardBooking] = useState<EmailStallCardBooking | null>(null);
  const [sendingProformaFor, setSendingProformaFor] = useState<string | null>(null);
  const [editLinks, setEditLinks] = useState<Record<string, string>>({});
  const [generatingLinkFor, setGeneratingLinkFor] = useState<string | null>(null);
  const [downloadingProformaFor, setDownloadingProformaFor] = useState<string | null>(null);
  const [downloadingReceiptFor, setDownloadingReceiptFor] = useState<string | null>(null);
  const [viewBooking, setViewBooking] = useState<ExtendedStallBooking | null>(null);
  const [actionButtonModal, setActionButtonModal] = useState<ExtendedStallBooking | null>(null);

  // Session & Permissions
  const user = useSession((s) => s.user);
  const hasBookingManage = useSession((s) => s.hasPermission(PERMISSIONS.adminUsersManage));
  const canViewBooking = useSession((s) => s.hasPermission(PERMISSIONS.bookingView));
  const canReviewBooking = useSession((s) => s.hasPermission(PERMISSIONS.bookingReview));
  const canViewInvoice = useSession((s) => s.hasPermission(PERMISSIONS.invoiceView));
  const canSendInvoice = useSession((s) => s.hasPermission(PERMISSIONS.invoiceSend));
  const canViewPayment = useSession((s) => s.hasPermission(PERMISSIONS.paymentView));
  const [error, setError] = useState('');

  // Helpers
  const formatDistrict = (value?: string | null): string => {
    const district = String(value ?? '').trim();
    return district && district !== '-' ? district : 'Unspecified';
  };

  const getStallSizeId = (stall: Stall): string => {
    const value = stall as Stall & {
      stallSizeId?: string | null;
      StallSizeId?: string | null;
      stallSize?: { id?: string | null } | null;
    };

    return (
      value.stallSizeId ??
      value.StallSizeId ??
      value.stallSize?.id ??
      ''
    );
  };

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

  const getErrorMessage = (currentError: unknown, fallback: string): string => {
    const apiError = currentError as ApiError;
    return (
      //@ts-ignore
      apiError?.response?.data?.message ??
      apiError?.message ??
      fallback
    );
  };

  // API Call Handlers
  async function handleSendProforma(booking: ExtendedStallBooking) {
    if (!user) return alert('User session missing. Please re-login.');
    if (!booking.stallNumber) {
      return alert('Cannot send proforma for a booking whose stall is not blocked yet.');
    }

    try {
      setSendingProformaFor(booking.id);
      await repositories.invoices.sendProforma(booking.id, user.id);
      alert(`Proforma invoice sent to ${booking.email || 'the exhibitor'}.`);
    } catch (err: any) {
      console.error('SEND PROFORMA ERROR', err);
      alert(err?.message || 'Failed to send proforma invoice.');
    } finally {
      setSendingProformaFor(null);
    }
  }

  async function handleDownloadProforma(booking: ExtendedStallBooking) {
    try {
      setDownloadingProformaFor(booking.id);
      const { blob, fileName } = await apiClient.getBlob(
        `/admin/events/current/bookings/${booking.id}/proforma-invoice/download`
      );
      triggerBlobDownload(blob, fileName ?? `ProformaInvoice_${booking.bookingRegistrationNumber}.pdf`);
    } catch (err: any) {
      console.error('DOWNLOAD PROFORMA ERROR', err);
      alert(err?.message || 'Failed to download proforma invoice.');
    } finally {
      setDownloadingProformaFor(null);
    }
  }

  async function handleDownloadPaymentReceipt(booking: ExtendedStallBooking) {
    try {
      setDownloadingReceiptFor(booking.id);
      const { blob, fileName } = await apiClient.getBlob(
        `/admin/events/current/bookings/${booking.id}/payment-receipt/download`
      );
      triggerBlobDownload(blob, fileName ?? `PaymentReceipt_${booking.bookingRegistrationNumber}.pdf`);
    } catch (err: any) {
      console.error('DOWNLOAD RECEIPT ERROR', err);
      alert(err?.message || 'Failed to download payment receipt.');
    } finally {
      setDownloadingReceiptFor(null);
    }
  }

  async function handleGenerateOrCopyLink(booking: ExtendedStallBooking) {
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
        setEditLinks((prev) => ({ ...prev, [booking.id]: response.editUrl }));
      }
    } catch (err: any) {
      console.error('GENERATE EDIT LINK ERROR', err);
      alert(err?.message || 'Failed to generate edit link.');
    } finally {
      setGeneratingLinkFor(null);
    }
  }

  // Load Initial Data
  useEffect(() => {
    if (initialBookings.length > 0) setBookings(initialBookings);
  }, [initialBookings]);

  useEffect(() => {
    if (initialStalls.length > 0) setStalls(initialStalls);
  }, [initialStalls]);

  useEffect(() => {
    if (initialStallSizes.length > 0) setStallSizes(initialStallSizes);
  }, [initialStallSizes]);

  useEffect(() => {
    if (bookingError || stallError || sizesError) {
      setError(getErrorMessage(bookingError || stallError || sizesError, 'Failed to load report data.'));
    }
  }, [bookingError, stallError, sizesError]);

  // Comprehensive size map resolving stallSizeId -> human size code/display name
  const sizeMapById = useMemo(() => {
    const map = new Map<string, string>();

    // 1. Populate from fetched Stall Size Master
    stallSizes.forEach((sz) => {
      if (sz.id) {
        //@ts-ignore

        map.set(sz.id, sz.code || sz.displayName || sz.name || sz.id);
      }
    });

    // 2. Fallback/Enrich from Bookings
    bookings.forEach((b) => {
      //@ts-ignore
      if (b.stallSizeId && (b.stallSizeCode || b.stallSizeName)) {
        //@ts-ignore

        if (!map.has(b.stallSizeId)) {
          //@ts-ignore

          map.set(b.stallSizeId, b.stallSizeCode || b.stallSizeName || '');
        }
      }
    });

    return map;
  }, [stallSizes, bookings]);

  // Lookup map for Stalls by stall number
  const stallMapByNumber = useMemo(() => {
    const map = new Map<string, Stall>();
    stalls.forEach((s) => {
      if (s.stallNumber) map.set(s.stallNumber, s);
    });
    return map;
  }, [stalls]);

  // Combine available sizes dynamically across both Stalls and Bookings
  const availableSizes = useMemo(() => {
    const sizeSet = new Set<string>();

    stalls.forEach((s) => {
      const sizeId = getStallSizeId(s);
      const resolvedSize = sizeMapById.get(sizeId);
      if (resolvedSize) sizeSet.add(resolvedSize);
    });

    bookings.forEach((b) => {
      const code = b.stallSizeCode || b.stallSizeName;
      if (code && code !== '-') sizeSet.add(code);
    });

    const sizes = Array.from(sizeSet).sort();
    return sizes.length > 0 ? sizes : ['Standard'];
  }, [stalls, bookings, sizeMapById]);

  // Filter Options & Metrics
  const statusOptions = useMemo(() => {
    //@ts-ignore

    const bookingStatuses = bookings.map((b) => b.bookingStatus).filter((s): s is string => Boolean(s));
    //@ts-ignore

    const stallStatuses = stalls.map((s) => s.currentStatus).filter((s): s is string => Boolean(s));
    return ['All', ...Array.from(new Set([...bookingStatuses]))];
  }, [bookings, stalls]);

  const districtOptions = useMemo(() => {
    const districts = bookings.map((b) => formatDistrict(b.district)).filter((d): d is string => Boolean(d));
    return ['All', ...Array.from(new Set(districts)).sort()];
  }, [bookings]);

  // Status metrics derived directly from stalls inventory
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    stalls.forEach((stall) => {
      const status = stall.currentStatus || 'Unknown';
      counts[status] = (counts[status] ?? 0) + 1;
    });
    return counts;
  }, [stalls]);

  const reservationCount = useMemo(() => {
    return stalls.filter((s) => s.currentStatus === 'Reservation').length;
  }, [stalls]);

  const sponsorCount = useMemo(() => {
    return stalls.filter((s) => s.isSponsor).length;
  }, [stalls]);

  const activeBlockCount = useMemo(() => {
    const now = Date.now();
    return bookings.filter((b) => b.blockExpiresAt && new Date(b.blockExpiresAt).getTime() >= now).length;
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const now = Date.now();

    return bookings.filter((booking) => {
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
          .some((field) => field!.toLowerCase().includes(normalizedSearch));

      const matchesStatus = statusFilter === 'All' || booking.bookingStatus === statusFilter;
      const expiryTime = booking.blockExpiresAt ? new Date(booking.blockExpiresAt).getTime() : null;

      const matchesExpiry =
        expiryFilter === 'All' ||
        (expiryFilter === 'Active' && expiryTime !== null && expiryTime >= now) ||
        (expiryFilter === 'Expired' && expiryTime !== null && expiryTime < now) ||
        (expiryFilter === 'No Expiry' && expiryTime === null) ||
        (expiryFilter === 'Confirmed' && booking.bookingStatus === 'Confirmed' && expiryTime !== null && expiryTime < now);

      const matchesDistrict = districtFilter === 'All' || formatDistrict(booking.district) === districtFilter;
      const matchesSize =
        sizeFilter === 'All' || booking.stallSizeCode === sizeFilter || booking.stallSizeName === sizeFilter;

      return matchesSearch && matchesStatus && matchesExpiry && matchesDistrict && matchesSize;
    });
  }, [bookings, searchTerm, statusFilter, expiryFilter, districtFilter, sizeFilter]);

  // STATUS X STALL SIZE MATRIX COMPUTATION
const statusMatrixData = useMemo(() => {
  const statusMap: Record<string, Record<string, number>> = {};

  // Standardize on 'Sponsor' (or 'Sponser', but keep it consistent everywhere)
  ['Blocked', 'Available', 'Reservation', 'Frozen', 'PaymentSubmitted', 'Sponsor'].forEach((st) => {
    statusMap[st] = {};
  });

  const blockedDebugRows: {
    stallNumber: string;
    stallCurrentStatus: string | null | undefined;
    matchedBookingStatus: string | null | undefined;
    matchedBookingRegNo: string | null | undefined;
    reason: string;
  }[] = [];

  stalls.forEach((stall) => {
    const sizeId = getStallSizeId(stall);
    const matchingBooking = bookings.find((b) => b.stallNumber === stall.stallNumber);

    const size =
      sizeMapById.get(sizeId) ||
      matchingBooking?.stallSizeCode ||
      matchingBooking?.stallSizeName ||
      'Standard';

    const effectiveStatus = getEffectiveStallStatus(stall, matchingBooking);

    // FIXED GUARD CLAUSE: Allow 'Sponsor' status through!
    if (stall.isSponsor) {
      const isCountableForSponsor =
        effectiveStatus === 'Sponsor' ||
        effectiveStatus === 'Blocked' ||
        effectiveStatus === 'Frozen' ||
        effectiveStatus === 'PaymentSubmitted';

      if (!isCountableForSponsor) {
        return; // Drops unassigned Available/Reservation sponsor stalls if desired
      }
    }

    if (!statusMap[effectiveStatus]) statusMap[effectiveStatus] = {};
    statusMap[effectiveStatus][size] = (statusMap[effectiveStatus][size] || 0) + 1;

    if (!stall.isSponsor && effectiveStatus === 'Blocked') {
      blockedDebugRows.push({
        stallNumber: stall.stallNumber,
        stallCurrentStatus: stall.currentStatus,
        matchedBookingStatus: matchingBooking?.bookingStatus,
        matchedBookingRegNo: matchingBooking?.bookingRegistrationNumber,
        reason: matchingBooking
          ? `booking status "${matchingBooking.bookingStatus}" -> Blocked`
          : `no matching booking, fell back to stall.currentStatus "${stall.currentStatus}"`
      });
    }
  });

  console.group('🔒 Status Matrix — Blocked bucket');
  console.log(`Total stalls in Blocked: ${blockedDebugRows.length}`);
  console.table(blockedDebugRows);
  console.groupEnd();

  const statuses = Object.keys(statusMap).sort();

  const rows = statuses.map((status) => {
    const sizeCounts = statusMap[status];
    let rowTotal = 0;

    const sizeMap: Record<string, number> = {};
    availableSizes.forEach((size) => {
      const count = sizeCounts[size] || 0;
      sizeMap[size] = count;
      rowTotal += count;
    });

    return { status, sizes: sizeMap, rowTotal };
  });

  const columnTotals: Record<string, number> = {};
  let grandTotal = 0;

  availableSizes.forEach((size) => {
    const colSum = rows.reduce((acc, row) => acc + (row.sizes[size] || 0), 0);
    columnTotals[size] = colSum;
    grandTotal += colSum;
  });

  return { rows, columnTotals, grandTotal };
}, [stalls, bookings, availableSizes, sizeMapById]);

  // DISTRICT X STALL SIZE MATRIX COMPUTATION
  const bookingsForDistrictMatrix = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const now = Date.now();

    return bookings.filter((booking) => {
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
          .some((field) => field!.toLowerCase().includes(normalizedSearch));

      const matchesStatus = statusFilter === 'All' || booking.bookingStatus === statusFilter;
      const expiryTime = booking.blockExpiresAt ? new Date(booking.blockExpiresAt).getTime() : null;

      const matchesExpiry =
        expiryFilter === 'All' ||
        (expiryFilter === 'Active' && expiryTime !== null && expiryTime >= now) ||
        (expiryFilter === 'Expired' && expiryTime !== null && expiryTime < now) ||
        (expiryFilter === 'No Expiry' && expiryTime === null) ||
        (expiryFilter === 'Confirmed' && booking.bookingStatus === 'Confirmed' && expiryTime !== null && expiryTime < now);

      // Deliberately NOT filtering by district here.
      const matchesSize =
        sizeFilter === 'All' || booking.stallSizeCode === sizeFilter || booking.stallSizeName === sizeFilter;

      return matchesSearch && matchesStatus && matchesExpiry && matchesSize;
    });
  }, [bookings, searchTerm, statusFilter, expiryFilter, sizeFilter]);
  const matrixData = useMemo(() => {
    const districtMap: Record<string, Record<string, number>> = {};

    const unspecifiedDebugRows: {
      bookingRegistrationNumber: string;
      stallNumber: string;
      rawDistrictValue: string | null | undefined;
      fasciaName: string;
      bookingStatus: string | null | undefined;
    }[] = [];

    bookingsForDistrictMatrix.forEach((booking) => {
      // Exclude Submitted bookings entirely from the District Matrix —
      // they haven't been allocated a stall yet, so they shouldn't be
      // counted in a stall-size-by-district breakdown.
      if (booking.bookingStatus === 'Submitted') return;

      const district = formatDistrict(booking.district);
      const size = booking.stallSizeCode || booking.stallSizeName || 'Standard';

      if (district === 'Unspecified') {
        unspecifiedDebugRows.push({
          bookingRegistrationNumber: booking.bookingRegistrationNumber || '—',
          stallNumber: booking.stallNumber || '—',
          rawDistrictValue: booking.district,
          fasciaName: booking.fasciaName || booking.companyName || '—',
          bookingStatus: booking.bookingStatus,
        });
      }

      if (!districtMap[district]) {
        districtMap[district] = {};
      }

      districtMap[district][size] = (districtMap[district][size] || 0) + 1;
    });

    console.group('📍 District Matrix — Unspecified bucket (excluding Submitted)');
    console.log(`Total non-Submitted bookings with Unspecified district: ${unspecifiedDebugRows.length}`);
    console.table(unspecifiedDebugRows);
    console.groupEnd();

    const districts = Object.keys(districtMap).sort((a, b) => {
      if (a === 'Unspecified') return 1;
      if (b === 'Unspecified') return -1;
      return a.localeCompare(b);
    });

    const rows = districts.map((district) => {
      const sizeCounts = districtMap[district];
      let rowTotal = 0;
      const sizeMap: Record<string, number> = {};
      availableSizes.forEach((size) => {
        const count = sizeCounts[size] || 0;
        sizeMap[size] = count;
        rowTotal += count;
      });
      return { district, sizes: sizeMap, rowTotal };
    });

    const columnTotals: Record<string, number> = {};
    let grandTotal = 0;
    availableSizes.forEach((size) => {
      const colSum = rows.reduce((acc, row) => acc + (row.sizes[size] || 0), 0);
      columnTotals[size] = colSum;
      grandTotal += colSum;
    });

    return { rows, columnTotals, grandTotal };
  }, [bookingsForDistrictMatrix, availableSizes]);
  function normalizeStatus(status: string | null | undefined) {
    return (status ?? '').trim().toLowerCase();
  }

function getEffectiveStallStatus(
  stall: Stall,
  matchingBooking: ExtendedStallBooking | undefined
) {
  // 1. Check if the stall or booking has sponsor flags
  const isSponsorStall =
    Boolean(stall.isSponsor) ||
    Boolean(matchingBooking?.isSponsor) ||
    Boolean(matchingBooking?.isSponser);

  // 2. Check if the stall is assigned to a real exhibitor booking
  const hasActiveExhibitorBooking = Boolean(
    matchingBooking &&
      (matchingBooking.bookingStatus === 'Confirmed' ||
        matchingBooking.bookingStatus === 'PaymentSubmitted' ||
        matchingBooking.bookingStatus === 'BlockedAwaitingPayment')
  );

  // 3. If it has a real active booking, evaluate that booking's status FIRST
  if (matchingBooking?.bookingStatus) {
    const bookingStatus = matchingBooking.bookingStatus;

    if (bookingStatus === 'Confirmed') {
      return 'Frozen';
    }

    if (bookingStatus === 'PaymentSubmitted') {
      return 'PaymentSubmitted';
    }

    if (bookingStatus === 'BlockedAwaitingPayment') {
      return 'Blocked';
    }
  }

  // 4. If it's a sponsor stall and NOT overridden by an active booking above,
  // count it as 'Sponsor'
  if (isSponsorStall && !hasActiveExhibitorBooking) {
    return 'Sponsor';
  }

  return stall.currentStatus || 'Unspecified';
}

  const sortedBookings = useMemo(() => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;

    return [...filteredBookings].sort((a, b) => {
      if (sortKey === 'stallNumber') {
        return naturalSortStalls(a.stallNumber || '', b.stallNumber || '') * multiplier;
      }
      if (sortKey === 'blockExpiresAt') {
        const aTime = a.blockExpiresAt ? new Date(a.blockExpiresAt).getTime() : null;
        const bTime = b.blockExpiresAt ? new Date(b.blockExpiresAt).getTime() : null;
        if (aTime === null && bTime === null) return 0;
        if (aTime === null) return 1;
        if (bTime === null) return -1;
        return (aTime - bTime) * multiplier;
      }

      const aVal = (a[sortKey] || '').toString().toLowerCase();
      const bVal = (b[sortKey] || '').toString().toLowerCase();
      return aVal.localeCompare(bVal) * multiplier;
    });
  }, [filteredBookings, sortKey, sortDirection]);

  // Handle Page Changes Reset
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, expiryFilter, districtFilter, sizeFilter, sortKey, sortDirection, pageSize, bookings.length]);

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
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  }, [safePage, totalPages]);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    statusFilter !== 'All' ||
    expiryFilter !== 'All' ||
    districtFilter !== 'All' ||
    sizeFilter !== 'All';

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setExpiryFilter('All');
    setDistrictFilter('All');
    setSizeFilter('All');
  };

  // Export Matrix CSV
  const handleExportCsv = () => {
    if (activeTab === 'status-matrix') {
      if (statusMatrixData.rows.length === 0) return alert('No status matrix data available to export.');

      const headers = ['S.No.', 'Booking Status', ...availableSizes, 'Total'];
      const csvRows = statusMatrixData.rows.map((row, index) => [
        index + 1,
        `"${row.status}"`,
        ...availableSizes.map((size) => row.sizes[size] || 0),
        row.rowTotal,
      ]);

      const totalsRow = [
        '',
        '"Total"',
        ...availableSizes.map((size) => statusMatrixData.columnTotals[size] || 0),
        statusMatrixData.grandTotal,
      ];

      const csvContent = [headers.join(','), ...csvRows.map((r) => r.join(',')), totalsRow.join(',')].join('\r\n');
      const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8;' });
      triggerBlobDownload(blob, `status-size-matrix-${new Date().toISOString().slice(0, 10)}.csv`);
    } else {
      if (matrixData.rows.length === 0) return alert('No size matrix data available to export.');

      const headers = ['S.No.', 'District', ...availableSizes, 'Total'];
      const csvRows = matrixData.rows.map((row, index) => [
        index + 1,
        `"${row.district}"`,
        ...availableSizes.map((size) => row.sizes[size] || 0),
        row.rowTotal,
      ]);

      const totalsRow = [
        '',
        '"Total"',
        ...availableSizes.map((size) => matrixData.columnTotals[size] || 0),
        matrixData.grandTotal,
      ];

      const csvContent = [headers.join(','), ...csvRows.map((r) => r.join(',')), totalsRow.join(',')].join('\r\n');
      const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8;' });
      triggerBlobDownload(blob, `district-stall-matrix-${new Date().toISOString().slice(0, 10)}.csv`);
    }
  };
  const getDisplayStatus = (status?: string | null): string | null | undefined => {
    if (status === 'PaymentSubmitted') {
      return 'Payment Verified';
    }
    return status;
  };

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Booking Management Report</h2>
          <p className="mt-1 text-sm text-slate-500">
            Monitor status distributions by stall dimensions, review status counts, and manage records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('status-matrix')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${activeTab === 'status-matrix'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Layers className="h-4 w-4" />
              Status Matrix
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${activeTab === 'matrix'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Grid className="h-4 w-4" />
              District Matrix
            </button>
            {/* <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'list'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-4 w-4" />
              Detailed List
            </button> */}
          </div>

          <RefreshListButton
            onRefresh={() => {
              queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
              queryClient.invalidateQueries({ queryKey: STALLS_KEY });
            }}
          />

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isLoading || (activeTab === 'list' && filteredBookings.length === 0)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      {/* <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Inventory" value={stalls.length || bookings.length} desc="All event stalls" icon={<FileText className="h-5 w-5 text-indigo-600" />} />
        <StatCard label="Active Blocks" value={activeBlockCount} desc="Stalls within hold window" icon={<Clock className="h-5 w-5 text-emerald-600" />} />
        <StatCard label="Reservations" value={reservationCount} desc="Held for admin allocation" icon={<Bookmark className="h-5 w-5 text-amber-600" />} />
        <StatCard label="Sponsor Stalls" value={sponsorCount} desc="Reserved for sponsors" icon={<Award className="h-5 w-5 text-purple-600" />} />
        <StatCard label="Filtered Results" value={filteredBookings.length} desc="Matching active filters" icon={<Search className="h-5 w-5 text-blue-600" />} />
      </div> */}

      {/* Filter and Search Controls */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Registration no, fascia, stall, company..."
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Booking Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              {statusOptions
                .filter(status => status !== 'Submitted')
                .map(status => (
                  <option key={status} value={status}>
                    {status === 'All'
                      ? `All Statuses (${bookings.length})`
                      : `${getDisplayStatus(status)}`}
                  </option>
                ))}
            </select>
          </div>

          {/* <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Hold Expiry</label>
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value as ExpiryFilter)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="All">All Blocks</option>
              <option value="Active">Active Holds</option>
              <option value="Expired">Expired Holds</option>
              <option value="No Expiry">No Expiry Date</option>
              <option value="Confirmed">Confirmed Stalls</option>
            </select>
          </div> */}

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">District Filter</label>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              {districtOptions.map((d) => (
                <option key={d} value={d}>
                  {d === 'All' ? 'All Districts' : d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-xs text-slate-500">Active filters are currently isolating results.</span>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* STATUS X STALL SIZE MATRIX VIEW */}
      {activeTab === 'status-matrix' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50/50 p-4">
            <h3 className="font-bold text-slate-900 text-base">Status vs Stall Size Matrix</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Summary count of allocated stalls grouped by Booking/Inventory Status (rows) and Stall Size Dimensions (columns).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3.5 w-12 text-center">#</th>
                  <th className="p-3.5 min-w-[180px]">Booking / Stall Status</th>
                  {availableSizes.map((size) => (
                    <th key={size} className="p-3.5 text-center font-mono">
                      {size}
                    </th>
                  ))}
                  <th className="p-3.5 text-right bg-slate-100/80 font-bold text-slate-700 w-28">Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={availableSizes.length + 3} className="p-8 text-center text-slate-500">
                      Generating status matrix counts...
                    </td>
                  </tr>
                ) : statusMatrixData.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={availableSizes.length + 3}
                      className="p-12 text-center text-xs text-slate-400"
                    >
                      No records match the selected filters.
                    </td>
                  </tr>
                ) : (
                  statusMatrixData.rows.map((row, index) => (
                    <tr key={row.status} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 text-center text-xs text-slate-400">{index + 1}</td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {row.status === 'Sponsor' ? (
                          <span className="inline-flex items-center gap-1 rounded bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700 border border-purple-200">
                            <Award className="h-3.5 w-3.5" /> SPONSOR ALLOCATIONS
                          </span>
                        ) : row.status === 'Reservation' ? (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                            <Bookmark className="h-3.5 w-3.5" /> RESERVATIONS
                          </span>
                        ) : row.status === 'PaymentSubmitted' ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                            <CreditCard className="h-3.5 w-3.5" /> PAYMENT VERIFIED
                          </span>
                        ) :
                          (
                            <StatusBadge value={row.status} />
                          )}
                      </td>
                      {availableSizes.map((size) => (
                        <td key={size} className="p-3.5 text-center font-mono text-slate-600">
                          {row.sizes[size] > 0 ? (
                            <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-0.5 text-xs font-bold border ${row.status === 'Sponsor'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : row.status === 'Reservation'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                              }`}>
                              {row.sizes[size]}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      ))}
                      <td className="p-3.5 text-right font-bold text-slate-900 bg-slate-50/50">
                        {row.rowTotal}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {!isLoading && statusMatrixData.rows.length > 0 && (
                <tfoot className="border-t-2 border-slate-200 bg-slate-100/80 text-xs font-bold text-slate-900">
                  <tr>
                    <td className="p-3.5 text-center"></td>
                    <td className="p-3.5 uppercase tracking-wider text-slate-600">Total Summary</td>
                    {availableSizes.map((size) => (
                      <td key={size} className="p-3.5 text-center font-mono text-indigo-900 text-sm">
                        {statusMatrixData.columnTotals[size]}
                      </td>
                    ))}
                    <td className="p-3.5 text-right text-sm font-extrabold text-indigo-700 bg-indigo-100/60">
                      {statusMatrixData.grandTotal}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* DISTRICT X STALL SIZE MATRIX VIEW */}
      {activeTab === 'matrix' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50/50 p-4">
            <h3 className="font-bold text-slate-900 text-base">District vs Stall Size Matrix</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Summary count of allocated stalls grouped by District (rows) and Stall Size Dimensions (columns).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3.5 w-12 text-center">#</th>
                  <th className="p-3.5 min-w-[160px]">District</th>
                  {availableSizes.map((size) => (
                    <th key={size} className="p-3.5 text-center font-mono">
                      {size}
                    </th>
                  ))}
                  <th className="p-3.5 text-right bg-slate-100/80 font-bold text-slate-700 w-24">Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={availableSizes.length + 3} className="p-8 text-center text-slate-500">
                      Generating matrix counts...
                    </td>
                  </tr>
                ) : matrixData.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={availableSizes.length + 3}
                      className="p-12 text-center text-xs text-slate-400"
                    >
                      No records match the selected filters.
                    </td>
                  </tr>
                ) : (
                  matrixData.rows.map((row, index) => (
                    <tr key={row.district} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 text-center text-xs text-slate-400">{index + 1}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{row.district}</td>
                      {availableSizes.map((size) => (
                        <td key={size} className="p-3.5 text-center font-mono text-slate-600">
                          {row.sizes[size] > 0 ? (
                            <span className="inline-flex items-center justify-center rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100">
                              {row.sizes[size]}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      ))}
                      <td className="p-3.5 text-right font-bold text-slate-900 bg-slate-50/50">
                        {row.rowTotal}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {!isLoading && matrixData.rows.length > 0 && (
                <tfoot className="border-t-2 border-slate-200 bg-slate-100/80 text-xs font-bold text-slate-900">
                  <tr>
                    <td className="p-3.5 text-center"></td>
                    <td className="p-3.5 uppercase tracking-wider text-slate-600">Total Count</td>
                    {availableSizes.map((size) => (
                      <td key={size} className="p-3.5 text-center font-mono text-indigo-900 text-sm">
                        {matrixData.columnTotals[size]}
                      </td>
                    ))}
                    <td className="p-3.5 text-right text-sm font-extrabold text-indigo-700 bg-indigo-100/60">
                      {matrixData.grandTotal}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* DETAILED BOOKING LIST VIEW */}
      {activeTab === 'list' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="p-4 w-12 text-center">#</th>
                  <th className="p-4 cursor-pointer hover:text-slate-700" onClick={() => toggleSort('bookingRegistrationNumber')}>
                    Booking No. {sortKey === 'bookingRegistrationNumber' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="p-4 cursor-pointer hover:text-slate-700" onClick={() => toggleSort('fasciaName')}>
                    Fascia Name {sortKey === 'fasciaName' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="p-4 cursor-pointer hover:text-slate-700" onClick={() => toggleSort('bookingStatus')}>
                    Status {sortKey === 'bookingStatus' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="p-4 cursor-pointer hover:text-slate-700" onClick={() => toggleSort('blockExpiresAt')}>
                    Block Expiry {sortKey === 'blockExpiresAt' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="p-4">Hold State</th>
                  <th className="p-4 cursor-pointer hover:text-slate-700" onClick={() => toggleSort('stallNumber')}>
                    Stall {sortKey === 'stallNumber' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="p-4">Size</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      Loading records...
                    </td>
                  </tr>
                )}

                {!isLoading && sortedBookings.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-12 text-center">
                      <p className="font-medium text-slate-700">No matching bookings found</p>
                      <p className="mt-1 text-xs text-slate-400">Try adjusting your filters or search terms.</p>
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  paginatedBookings.map((booking, idx) => {
                    const blockState = getBlockState(booking.blockExpiresAt, booking.bookingStatus);
                    const matchedStall = booking.stallNumber ? stallMapByNumber.get(booking.stallNumber) : undefined;
                    const isSponsorStall = booking.isSponsor || booking.isSponser || matchedStall?.isSponsor;

                    return (
                      <tr key={booking.id} className="transition hover:bg-slate-50/80">
                        <td className="p-4 text-center text-xs text-slate-400">
                          {(safePage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="p-4 font-medium text-slate-900">{booking.bookingRegistrationNumber || '—'}</td>
                        <td className="p-4 text-slate-700">
                          <div className="flex items-center gap-2">
                            <span>{booking.fasciaName || booking.companyName || '—'}</span>
                            {isSponsorStall && (
                              <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                                SPONSOR
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <StatusBadge value={booking.bookingStatus} />
                        </td>
                        <td className="p-4 text-xs text-slate-500">
                          {booking.blockExpiresAt ? new Date(booking.blockExpiresAt).toLocaleString('en-IN') : '—'}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${blockState.className}`}>
                            {blockState.label}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-700">{booking.stallNumber || '—'}</td>
                        <td className="p-4 text-xs text-slate-600">{booking.stallSizeCode || '—'}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setActionButtonModal(booking)}
                              title="Manage / Operations"
                              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                              <Info className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewBooking(booking)}
                              title="Quick View"
                              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {canViewBooking && (
                              <Link
                                to={`/app/bookings/${booking.id}`}
                                className="rounded-md px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
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

          {/* Pagination Bar */}
          {!isLoading && sortedBookings.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span>
                  Showing <strong className="text-slate-800">{rangeStart}</strong>–
                  <strong className="text-slate-800">{rangeEnd}</strong> of{' '}
                  <strong className="text-slate-800">{sortedBookings.length}</strong>
                </span>
                <div className="flex items-center gap-1">
                  <span>Per page</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-slate-800 focus:border-indigo-500"
                  >
                    {PAGE_SIZE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={safePage === 1}
                  className="rounded border border-slate-200 p-1 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="rounded border border-slate-200 p-1 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`rounded px-2.5 py-1 font-semibold ${p === safePage
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="rounded border border-slate-200 p-1 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safePage === totalPages}
                  className="rounded border border-slate-200 p-1 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Drawer Modal */}
      {actionButtonModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setActionButtonModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-semibold text-slate-900">Manage Booking Actions</h3>
                <p className="text-xs text-slate-500">{actionButtonModal.bookingRegistrationNumber}</p>
              </div>
              <button
                onClick={() => setActionButtonModal(null)}
                className="rounded p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {hasBookingManage && actionButtonModal.bookingStatus === 'Confirmed' && (
                <button
                  type="button"
                  disabled={!actionButtonModal.email || !actionButtonModal.stallNumber}
                  onClick={() => {
                    const target = actionButtonModal;
                    setActionButtonModal(null);
                    setEmailStallCardBooking({
                      id: target.id,
                      bookingRegistrationNumber: target.bookingRegistrationNumber,
                      stallNumber: target.stallNumber ?? null,
                      fasciaName: target.fasciaName ?? null,
                      companyName: target.companyName ?? '',
                      contactPerson: target.contactPerson ?? '',
                      email: target.email ?? '',
                      mobile: target.mobile ?? '',
                      industryCategory: target.industryCategory ?? null,
                      productKeywords: target.productKeywords ?? null,
                      companyLogo: target.companyLogo ?? null,
                    });
                  }}
                  className="w-full flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 disabled:opacity-40"
                >
                  <Send className="h-5 w-5 text-indigo-600" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Send Digital Stall E-Card</div>
                    <div className="text-xs text-slate-500">Dispatch stall allocation details to exhibitor email.</div>
                  </div>
                </button>
              )}

              {canSendInvoice && actionButtonModal.bookingStatus !== 'Submitted' && (
                <button
                  type="button"
                  disabled={sendingProformaFor === actionButtonModal.id}
                  onClick={() => handleSendProforma(actionButtonModal)}
                  className="w-full flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 disabled:opacity-40"
                >
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Send Proforma Invoice</div>
                    <div className="text-xs text-slate-500">Email system-generated proforma document.</div>
                  </div>
                </button>
              )}

              {canViewInvoice && actionButtonModal.bookingStatus !== 'Submitted' && (
                <button
                  type="button"
                  disabled={downloadingProformaFor === actionButtonModal.id}
                  onClick={() => handleDownloadProforma(actionButtonModal)}
                  className="w-full flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 disabled:opacity-40"
                >
                  <Download className="h-5 w-5 text-sky-600" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Download Proforma PDF</div>
                    <div className="text-xs text-slate-500">Save proforma copy directly to device.</div>
                  </div>
                </button>
              )}

              {canViewPayment &&
                (actionButtonModal.bookingStatus === 'Confirmed' || actionButtonModal.bookingStatus === 'PaymentSubmitted') && (
                  <button
                    type="button"
                    disabled={downloadingReceiptFor === actionButtonModal.id}
                    onClick={() => handleDownloadPaymentReceipt(actionButtonModal)}
                    className="w-full flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 disabled:opacity-40"
                  >
                    <CreditCard className="h-5 w-5 text-amber-600" />
                    <div>
                      <div className="text-sm font-semibold text-slate-800">Download Payment Receipt</div>
                      <div className="text-xs text-slate-500">Get verifiable confirmation receipt PDF.</div>
                    </div>
                  </button>
                )}

              {canReviewBooking && (
                <button
                  type="button"
                  disabled={generatingLinkFor === actionButtonModal.id}
                  onClick={() => handleGenerateOrCopyLink(actionButtonModal)}
                  className="w-full flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 disabled:opacity-40"
                >
                  <LinkIcon className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      {editLinks[actionButtonModal.id] ? 'Copy Exhibitor Link' : 'Generate Exhibitor Edit Access'}
                    </div>
                    <div className="text-xs text-slate-500">Allow client to update profile data remotely.</div>
                  </div>
                </button>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setActionButtonModal(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {viewBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setViewBooking(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-semibold text-slate-900">Booking Summary</h3>
                <p className="text-xs text-slate-500">{viewBooking.bookingRegistrationNumber}</p>
              </div>
              <button onClick={() => setViewBooking(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <DetailField label="Company Name" value={viewBooking.companyName} />
              <DetailField label="Fascia Name" value={viewBooking.fasciaName} />
              <DetailField label="Contact Person" value={viewBooking.contactPerson} />
              <DetailField label="Email" value={viewBooking.email} />
              <DetailField label="Mobile" value={viewBooking.mobile} />
              <DetailField label="Stall Number" value={viewBooking.stallNumber} />
              <DetailField label="Size Code" value={viewBooking.stallSizeCode} />
              <DetailField label="District" value={viewBooking.district} />
              <DetailField label="GSTIN" value={viewBooking.gstin} />
              <DetailField label="PAN Number" value={viewBooking.panNumber} />
              <DetailField
                label="Sponsor Status"
                value={
                  viewBooking.isSponsor || viewBooking.isSponser || (viewBooking.stallNumber && stallMapByNumber.get(viewBooking.stallNumber)?.isSponsor) ? (
                    <span className="text-purple-700 font-bold">Sponsor</span>
                  ) : (
                    'Regular Exhibitor'
                  )
                }
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setViewBooking(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* E-Card Modal Integration */}
      {emailStallCardBooking && (
        <EmailStallCardModal
          booking={emailStallCardBooking}
          onClose={() => {
            setEmailStallCardBooking(null);
            setActionButtonModal(null);
          }}
          disableSendEmail
        />
      )}
    </div>
  );
}

// Helper Components
function StatCard({ label, value, desc, icon }: { label: string; value: number; desc: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        <p className="mt-0.5 text-xs text-slate-400">{desc}</p>
      </div>
      <div className="rounded-lg bg-slate-50 p-2.5">{icon}</div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <span className="block font-semibold uppercase text-slate-400 text-[10px]">{label}</span>
      <span className="font-medium text-slate-800">{value || '—'}</span>
    </div>
  );
}

function getBlockState(blockExpiresAt?: string | null, bookingStatus?: string | null) {
  if (bookingStatus === 'Confirmed' || bookingStatus === 'Frozen') {
    return { label: 'Confirmed', className: 'bg-indigo-50 text-indigo-700 border border-indigo-200' };
  }
  if (!blockExpiresAt) {
    return { label: 'No Expiry', className: 'bg-slate-50 text-slate-600 border border-slate-200' };
  }
  const expiryTime = new Date(blockExpiresAt).getTime();
  if (Number.isNaN(expiryTime)) {
    return { label: 'Invalid Date', className: 'bg-amber-50 text-amber-700 border border-amber-200' };
  }
  return expiryTime < Date.now()
    ? { label: 'Expired', className: 'bg-rose-50 text-rose-700 border border-rose-200' }
    : { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
}