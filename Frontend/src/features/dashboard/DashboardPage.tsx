import {
  useEffect,
  useMemo,
  useState
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { repositories } from '../../data/repositoryFactory';
import { apiClient } from '../../data/api/apiClient';
import type { Stall, StallBooking } from '../../domain/models';
import {
  getStallStatusStyle,
  stallStatusOrder
} from '../../config/statusConfig';
import { object } from 'zod';
import { ModalPortal } from '../../shared/components/ModalPortal';

const labels: Record<string, string> = {
  totalRegistrations: 'Total Registrations',
  submittedBookings: 'Submitted',
  reservation: 'Reserved',
  blockedStalls: 'Blocked Stalls',
  confirmedBookings: 'Confirmed/Frozen',
  releasedDueToNonPayment: 'Released',
  totalStalls: 'Total Stalls',
  availableStalls: 'Available Stalls',
  frozenStalls: 'Frozen Stalls',
  paymentVerified: 'Payment Verified'
};

type StallAllocationDetails = {
  stallId: string;
  stallNumber: string;
  stallStatus: string;

  bookingRegistrationNumber: string;
  bookingStatus: string;

  companyName: string;
  contactPerson: string;
  email: string;
  mobile: string;

  blockedAt: string | null;
  blockExpiresAt: string | null;

  actionByUserId: string | null;
  actionByName: string | null;
  actionAt: string | null;
};
type MarketplaceSummary = { buyerOrganizations: number; sellerOrganizations: number; requirements: number; capabilities: number; matches: number; meetings: number; awardValue: number };

export function DashboardPage() {
  const { data: summary = {} } = useQuery<Record<string, number>>({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => repositories.dashboard.summary(),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });

  const { data: stalls = [] } = useQuery<Stall[]>({
    queryKey: ['admin', 'stalls'],
    queryFn: async () => (await repositories.stalls.list()) ?? [],
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });

  const { data: bookings = [] } = useQuery<StallBooking[]>({
    queryKey: ['admin', 'bookings'],
    queryFn: async () => (await repositories.bookings.list()) ?? [],
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });

  const { data: marketplaceSummary = null } = useQuery<MarketplaceSummary | null>({
    queryKey: ['admin', 'marketplace-summary'],
    queryFn: () =>
      apiClient
        .get<MarketplaceSummary>('/marketplace/dashboard/admin-summary')
        .catch(() => null),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });

  const [statusFilter, setStatusFilter] =
    useState<string>('All');
  // Popup states
  const [selectedStall, setSelectedStall] =
    useState<Stall | null>(null);

  const [allocationDetails, setAllocationDetails] =
    useState<StallAllocationDetails | null>(null);

  const [isDetailsLoading, setIsDetailsLoading] =
    useState(false);

  const [detailsError, setDetailsError] =
    useState('');
  const paymentVerifiedCount = useMemo(
    () => bookings.filter(b => b.bookingStatus === 'PaymentSubmitted').length,
    [bookings]
  );

  useEffect(() => {
    if (!selectedStall) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === 'Escape') {
        setSelectedStall(null);
        setAllocationDetails(null);
        setDetailsError('');
        setIsDetailsLoading(false);
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [selectedStall]);

  function naturalStallSort(
    first: Stall,
    second: Stall
  ) {
    return (
      first.stallNumber ?? ''
    ).localeCompare(
      second.stallNumber ?? '',
      undefined,
      {
        numeric: true,
        sensitivity: 'base'
      }
    );
  }

  function normalizeStatus(
    status: string | null | undefined
  ) {
    return (
      status ?? ''
    )
      .trim()
      .toLowerCase();
  }

  function canOpenStallDetails(
    stall: Stall
  ) {
    const normalizedStatus =
      normalizeStatus(
        stall.currentStatus
      );

    return (
      normalizedStatus === 'blocked' ||
      normalizedStatus === 'frozen'
    );
  }

  function formatDateTime(
    value: string | null | undefined
  ) {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // const sponsorCount = useMemo(
  //   () =>
  //     stalls.filter(
  //       stall => stall.isSponsor
  //     ).length,
  //   [stalls]
  // );

  const nonSponsorStalls = useMemo(
    () =>
      stalls.filter(
        stall => !stall.isSponsor
      ),
    [stalls]
  );

  const stallNumberToBookingStatus = useMemo(() => {
    const map: Record<string, string> = {};
    bookings.forEach(booking => {
      if (booking.stallNumber) {
        map[booking.stallNumber] = booking.bookingStatus ?? '';
      }
    });
    return map;
  }, [bookings]);

  // 1. Calculate effective status for a stall
  const getEffectiveStallStatus = (stall: Stall) => {
    const bookingStatus = stallNumberToBookingStatus[stall.stallNumber];

    if (normalizeStatus(stall.currentStatus) === 'blocked' && bookingStatus === 'PaymentSubmitted') {
      return 'PaymentSubmitted';
    }

    return stall.currentStatus || 'Unknown';
  };

  // 2. Pure sponsor stalls = Sponsor flag IS TRUE AND it is NOT Blocked/Frozen/PaymentSubmitted
  const pureSponsorStalls = useMemo(() => {
    return stalls.filter((stall) => {
      if (!stall.isSponsor) return false;

      const effectiveStatus = normalizeStatus(getEffectiveStallStatus(stall));
      const isAllocatedOrBlocked =
        effectiveStatus === 'blocked' ||
        effectiveStatus === 'frozen' ||
        effectiveStatus === 'paymentsubmitted';

      return !isAllocatedOrBlocked; // Only count as 'Pure Sponsor' if unallocated
    });
  }, [stalls, stallNumberToBookingStatus]);

  const sponsorCount = useMemo(() => pureSponsorStalls.length, [pureSponsorStalls]);

  // 3. Status count breakdown
  const stallStatusCounts = useMemo(() => {
    return stalls.reduce<Record<string, number>>((result, stall) => {
      const effectiveStatus = getEffectiveStallStatus(stall);

      // If it's a sponsor stall AND not allocated, group under 'Sponsor'
      if (stall.isSponsor) {
        const normalized = normalizeStatus(effectiveStatus);
        const isAllocated =
          normalized === 'blocked' ||
          normalized === 'frozen' ||
          normalized === 'paymentsubmitted';

        if (!isAllocated) {
          result['Sponsor'] = (result['Sponsor'] ?? 0) + 1;
          return result;
        }
      }

      // Otherwise, increment its real status (Blocked, Frozen, etc.)
      result[effectiveStatus] = (result[effectiveStatus] ?? 0) + 1;
      return result;
    }, {});
  }, [stalls, stallNumberToBookingStatus]);
  // const stallStatusCounts = useMemo(() => {
  //   return nonSponsorStalls.reduce<
  //     Record<string, number>
  //   >((result, stall) => {
  //     const status =
  //       stall.currentStatus || 'Unknown';

  //     result[status] =
  //       (result[status] ?? 0) + 1;
  //       console.log(result,'result')

  //     return result;
  //   }, {});
  // }, [nonSponsorStalls]);

  const displaySummary = useMemo<Record<string, number>>(
    () => ({
      ...summary,
      totalStalls: stalls.length,
      availableStalls: stallStatusCounts['Available'] ?? 0,
      frozenStalls: stallStatusCounts['Frozen'] ?? 0,
      blockedStalls: stallStatusCounts['Blocked'] ?? 0,
      reservation: stallStatusCounts['Reservation'] ?? 0,
      releasedDueToNonPayment: stallStatusCounts['Released'] ?? 0,
      paymentVerified: bookings.length > 0 ? paymentVerifiedCount : (summary.paymentVerified ?? paymentVerifiedCount ?? 0),
    }),
    [summary, stalls, stallStatusCounts, paymentVerifiedCount, bookings.length]
  );

  const visibleStalls = useMemo(() => {
    let filtered: Stall[] = [];

    if (statusFilter === 'All') {
      filtered = stalls;
    } else if (statusFilter === 'Sponsor') {
      // Show ONLY pure/unallocated sponsor stalls
      filtered = pureSponsorStalls;
    } else if (statusFilter === 'Reservation') {
      // Show only non-sponsor stalls that are in Reservation status
      filtered = stalls.filter(
        (stall) => !stall.isSponsor && getEffectiveStallStatus(stall) === 'Reservation'
      );
    } else {
      // Show ALL stalls matching this status (whether sponsor or non-sponsor)
      filtered = stalls.filter((stall) => {
        const effectiveStatus = getEffectiveStallStatus(stall);
        return effectiveStatus === statusFilter;
      });
    }


    return [...filtered].sort(naturalStallSort);
  }, [stalls, statusFilter, pureSponsorStalls, stallNumberToBookingStatus]);
  // const visibleStallss= useMemo(() => {
  //   let filtered: Stall[] = [];

  //   if (statusFilter === 'All') {
  //     filtered = stalls;
  //   } else if (statusFilter === 'Sponsor') {
  //     // Show ONLY pure/unallocated sponsor stalls
  //     filtered = pureSponsorStalls;
  //   } else {
  //     // Show non-sponsor stalls matching the selected status (excludes stalls where isSponsor is true)
  //     filtered = stalls.filter((stall) => {
  //       if (stall.isSponsor) return false;

  //       const effectiveStatus = getEffectiveStallStatus(stall);
  //       return effectiveStatus === statusFilter;
  //     });
  //   }

  //   return [...filtered].sort(naturalStallSort);
  // }, [stalls, statusFilter, pureSponsorStalls, stallNumberToBookingStatus]);

  const closeStallDetailsModal = () => {
    setSelectedStall(null);
    setAllocationDetails(null);
    setDetailsError('');
    setIsDetailsLoading(false);
  };
  const openStallDetailsModal = async (stall: Stall) => {
    if (!canOpenStallDetails(stall)) {
      return;
    }

    setSelectedStall(stall);
    setAllocationDetails(null);
    setDetailsError('');
    setIsDetailsLoading(true);

    try {
      const details =
        await apiClient.get<StallAllocationDetails>(
          `/admin/events/current/stalls/${stall.id}/block-details`
        );

      setAllocationDetails(details);

      // --- CONSOLE LOG STALL DETAILS HERE ---
      console.group(`🔍 Stall Allocation Details — Stall #${stall.stallNumber}`);
      console.log('Stall Object:', stall);
      console.log('Allocation Details:', details);
      console.table({
        'Stall Number': details.stallNumber,
        'Stall Status': details.stallStatus,
        'Booking Reg No': details.bookingRegistrationNumber,
        'Booking Status': details.bookingStatus,
        'Company Name': details.companyName,
        'Contact Person': details.contactPerson,
        'Email': details.email,
        'Mobile': details.mobile,
        'Blocked At': details.blockedAt,
        'Block Expires At': details.blockExpiresAt,
        'Action By': details.actionByName || details.actionByUserId || 'N/A',
        'Action At': details.actionAt,
      });
      console.groupEnd();

    } catch (error: any) {
      console.error(
        'LOAD STALL ALLOCATION DETAILS ERROR',
        error
      );

      setDetailsError(
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        error?.message ||
        'Unable to load stall allocation details.'
      );
    } finally {
      setIsDetailsLoading(false);
    }
  };


  const selectedStatus =
    normalizeStatus(
      allocationDetails?.stallStatus ??
      selectedStall?.currentStatus
    );

  const isSelectedFrozen =
    selectedStatus === 'frozen';

  const mapData = Object.entries(labels).map(
    ([key, label]) => {
      { displaySummary[key] ?? 0 }
    }

  )
  console.log(mapData, 'MapData')


  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900">
          Core Committee Dashboard
        </h2>

        <p className="text-sm text-slate-500">
          Stall blocking, payment, freeze and
          invoice status across the event.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Object.entries(labels).map(
          ([key, label]) => (
            <div
              key={key}
              className="card p-5"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
              </p>

              <p className="mt-3 text-3xl font-extrabold text-msme-blue">
                {displaySummary[key] ?? 0}
              </p>
            </div>
          )
        )}
      </div>

      <section className="card mt-6 p-5">
        <div><h3 className="font-bold text-slate-900">Buyer–Seller Marketplace Activity</h3><p className="mt-1 text-xs text-slate-500">Live marketplace KPIs alongside stall-booking operations.</p></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {([['Buyers', 'buyerOrganizations'], ['Sellers', 'sellerOrganizations'], ['Requirements', 'requirements'], ['Capabilities', 'capabilities'], ['Matches', 'matches'], ['Meetings', 'meetings'], ['Award Value', 'awardValue']] as const).map(([label, key]) => {
            const rawVal = displaySummary[key] ?? marketplaceSummary?.[key] ?? 0;
            const numVal = Number(rawVal) || 0;
            return (
              <div key={key} className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-[10px] font-bold uppercase text-blue-600">{label}</p>
                <p className="mt-2 text-xl font-extrabold text-blue-950">
                  {key === 'awardValue' ? `₹${numVal.toLocaleString('en-IN')}` : numVal.toLocaleString('en-IN')}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stall Status Map */}
      <div className="card mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900">
              Stall Status Map
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Every stall is colour-coded by its
              current status. Click a blocked or
              frozen stall to view booking and
              exhibitor details.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {visibleStalls.length} of{' '}
            {stalls.length} stalls
          </span>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              setStatusFilter('All')
            }
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${statusFilter === 'All'
              ? 'border-msme-blue bg-blue-50 text-msme-blue'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />

            All ({stalls.length})
          </button>

          <button
            type="button"
            onClick={() =>
              setStatusFilter('Sponsor')
            }
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${statusFilter === 'Sponsor'
              ? 'border-msme-blue bg-blue-50 text-msme-blue'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-msme-blue" />

            Sponsor ({sponsorCount})
          </button>

          {stallStatusOrder.map(status => {
            const style =
              getStallStatusStyle(status);

            const count =
              stallStatusCounts[status] ?? 0;

            return (
              <button
                key={status}
                type="button"
                onClick={() =>
                  setStatusFilter(status)
                }
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${statusFilter === status
                  ? `border-current ${style.text} bg-white ring-1 ring-current`
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${style.dot}`}
                />

                {style.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Stall Grid */}
        {stalls.length === 0 ? (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            No stalls to display yet.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 xl:grid-cols-12">
            {visibleStalls.map(stall => {
              const style =
                getStallStatusStyle(
                  stall.currentStatus
                );

              const isClickable =
                canOpenStallDetails(stall);

              const title = isClickable
                ? `${stall.stallNumber} · ${style.label} · Click to view allocation details`
                : `${stall.stallNumber} · ${style.label}${stall.isSponsor
                  ? ' · Sponsor'
                  : ''
                }`;


              if (isClickable) {
                return (
                  <button
                    key={stall.id}
                    type="button"
                    title={title}
                    onClick={() =>
                      void openStallDetailsModal(
                        stall
                      )
                    }
                    className={`rounded-lg border p-2 text-center text-[11px] font-bold transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 ${style.box} ${style.text}`}
                  >
                    {stall.stallNumber}
                  </button>
                );
              }

              return (
                <div
                  key={stall.id}
                  title={title}
                  className={`rounded-lg border p-2 text-center text-[11px] font-bold transition ${style.box} ${style.text}`}
                >
                  {stall.stallNumber}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Information Cards */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h3 className="font-bold text-slate-900">
            Payment Pending Focus
          </h3>

          <p className="mt-2 text-sm text-slate-600">
            Blocked stalls must be paid within
            3 days. Expired blocks are released
            by workflow.
          </p>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-slate-900">
            Invoice Discipline
          </h3>

          <p className="mt-2 text-sm text-slate-600">
            Proforma invoice generation is
            permitted only after payment
            verification and stall freeze.
          </p>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-slate-900">
            Audit Control
          </h3>

          <p className="mt-2 text-sm text-slate-600">
            Every block, release, payment
            verification and invoice generation
            creates an audit trail.
          </p>
        </div>
      </div>

      {/* Blocked/Frozen Stall Details Modal */}
      {selectedStall && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
            onMouseDown={event => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeStallDetailsModal();
              }
            }}
          >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="stall-allocation-title"
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Modal Header */}
            <div
              className={`flex items-start justify-between border-b border-slate-200 bg-gradient-to-r px-6 py-5 ${isSelectedFrozen
                ? 'from-blue-50 to-sky-50'
                : 'from-orange-50 to-amber-50'
                }`}
            >
              <div>
                <p
                  className={`text-xs font-bold uppercase tracking-wide ${isSelectedFrozen
                    ? 'text-blue-600'
                    : 'text-orange-600'
                    }`}
                >
                  {isSelectedFrozen
                    ? 'Frozen Stall'
                    : 'Blocked Stall'}
                </p>

                <h3
                  id="stall-allocation-title"
                  className="mt-1 text-xl font-extrabold text-slate-900"
                >
                  Stall{' '}
                  {selectedStall.stallNumber}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Booking and exhibitor details
                  for this{' '}
                  {isSelectedFrozen
                    ? 'frozen'
                    : 'blocked'}{' '}
                  stall.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeStallDetailsModal
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[70vh] overflow-y-auto p-6">
              {isDetailsLoading && (
                <div className="flex min-h-48 items-center justify-center">
                  <div className="text-center">
                    <div
                      className={`mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 ${isSelectedFrozen
                        ? 'border-t-blue-500'
                        : 'border-t-orange-500'
                        }`}
                    />

                    <p className="mt-3 text-sm font-medium text-slate-500">
                      Loading{' '}
                      {isSelectedFrozen
                        ? 'frozen'
                        : 'blocked'}{' '}
                      stall details...
                    </p>
                  </div>
                </div>
              )}

              {!isDetailsLoading &&
                detailsError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                    {detailsError}
                  </div>
                )}

              {!isDetailsLoading &&
                allocationDetails && (
                  <div className="space-y-5">
                    {/* Primary Information */}
                    <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                      <DetailItem
                        label="Stall Number"
                        value={
                          allocationDetails.stallNumber
                        }
                      />

                      <DetailItem
                        label="Booking Registration No."
                        value={
                          allocationDetails.bookingRegistrationNumber
                        }
                      />

                      <DetailItem
                        label="Booking Status"
                        value={
                          allocationDetails.bookingStatus
                        }
                      />

                      <DetailItem
                        label="Stall Status"
                        value={
                          allocationDetails.stallStatus
                        }
                      />
                    </div>

                    {/* Exhibitor Information */}
                    <div>
                      <h4 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-slate-700">
                        {isSelectedFrozen
                          ? 'Frozen For / Exhibitor'
                          : 'Blocked For / Exhibitor'}
                      </h4>

                      <div className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
                        <DetailItem
                          label="Company Name"
                          value={
                            allocationDetails.companyName
                          }
                        />

                        <DetailItem
                          label="Contact Person"
                          value={
                            allocationDetails.contactPerson
                          }
                        />

                        <DetailItem
                          label="Email"
                          value={
                            allocationDetails.email
                          }
                        />

                        <DetailItem
                          label="Mobile"
                          value={
                            allocationDetails.mobile
                          }
                        />
                      </div>
                    </div>

                    {/* Action Information */}
                    <div>
                      <h4 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-slate-700">
                        {isSelectedFrozen
                          ? 'Freezing Information'
                          : 'Blocking Information'}
                      </h4>

                      <div
                        className={`grid gap-4 rounded-xl border p-4 sm:grid-cols-2 ${isSelectedFrozen
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-orange-200 bg-orange-50'
                          }`}
                      >
                        <DetailItem
                          label={
                            isSelectedFrozen
                              ? 'Frozen By'
                              : 'Blocked By'
                          }
                          value={
                            allocationDetails.actionByName ||
                            allocationDetails.actionByUserId ||
                            '-'
                          }
                        />

                        <DetailItem
                          label={
                            isSelectedFrozen
                              ? 'Frozen At'
                              : 'Blocked At'
                          }
                          value={formatDateTime(
                            allocationDetails.actionAt
                          )}
                        />

                        {isSelectedFrozen && (
                          <DetailItem
                            label="Originally Blocked At"
                            value={formatDateTime(
                              allocationDetails.blockedAt
                            )}
                          />
                        )}

                        <DetailItem
                          label={
                            isSelectedFrozen
                              ? 'Original Block Expiry'
                              : 'Block Expires At'
                          }
                          value={formatDateTime(
                            allocationDetails.blockExpiresAt
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={
                  closeStallDetailsModal
                }
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}

type DetailItemProps = {
  label: string;
  value:
  | string
  | number
  | null
  | undefined;
};

function DetailItem({
  label,
  value
}: DetailItemProps) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value === null ||
          value === undefined ||
          value === ''
          ? '-'
          : value}
      </p>
    </div>
  );
}
