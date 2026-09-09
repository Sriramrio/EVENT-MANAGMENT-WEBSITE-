import { useEffect, useMemo, useState } from 'react';
import type { Stall, StallBooking } from '../../domain/models';
import { repositories } from '../../data/repositoryFactory';
import { useSession } from '../../app/session';
import { PERMISSIONS } from '../../config/permissions';
import { StatusBadge } from '../../shared/StatusBadge';
import { SponsorTargetAmountModal } from './SponsorTargetAmountModal';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const BOOKINGS_KEY = ['admin', 'bookings'] as const;
const STALLS_KEY = ['admin', 'stalls'] as const;
type BookingView = StallBooking & {
  companyName?: string;
  contactPerson?: string;
  email?: string;
  mobile?: string;
  stallNumber?: string | null;
  stallSizeCode?: string;
  stallSizeName?: string;
  expectedAmount?: number;
  stallOption1Number?: string | null;
  stallOption2Number?: string | null;

};

type BookingStatusFilter =
  | 'All'
  | 'Submitted'
  | 'UnderReview'
  | 'BlockedAwaitingPayment'
  | 'PaymentVerified'
  | 'Allocated';

type StallStatusFilter =
  | 'All'
  | 'Available'
  | 'Blocked'
  | 'Allocated';

function formatMoney(value?: number) {
  if (value === undefined || value === null) return '-';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function StallAllocationPage() {
  const queryClient = useQueryClient();
  const { data: initialBookings = [] } = useQuery({
    queryKey: BOOKINGS_KEY,
    queryFn: () => repositories.bookings.list('All') as Promise<BookingView[]>,
  });
  const { data: initialStalls = [] } = useQuery({
    queryKey: STALLS_KEY,
    queryFn: () => repositories.stalls.list(),
  });
  const [allStalls, setAllStalls] = useState<Stall[]>([]);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [bookings, setBookings] = useState<BookingView[]>([]);
  useEffect(() => {
    if (initialBookings.length > 0) {
      setBookings(initialBookings);
    }
  }, [initialBookings]);
  useEffect(() => {
    if (initialStalls.length > 0) {
      setAllStalls(initialStalls);
    }
  }, [initialStalls]);

  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [selectedStallId, setSelectedStallId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sponsorDialogStall, setSponsorDialogStall] = useState<Stall | null>(
    null
  );

  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] =
    useState<BookingStatusFilter>('All');

  const [stallSearch, setStallSearch] = useState('');
  const [stallStatusFilter, setStallStatusFilter] =
    useState<StallStatusFilter>('All');

  const user = useSession(state => state.user);

  const canBlock = useSession(state =>
    state.hasPermission(PERMISSIONS.stallBlock)
  );

  const selectedBooking = useMemo(
    () => bookings.find(booking => booking.id === selectedBookingId),
    [bookings, selectedBookingId]
  );
  useEffect(() => {
    if (bookings.length > 0 && !selectedBookingId) {
      const firstBookingId =
        bookings.find(
          booking =>
            booking.bookingStatus === 'Submitted' ||
            booking.bookingStatus === 'UnderReview' ||
            booking.bookingStatus === 'BlockedAwaitingPayment'
        )?.id || bookings[0]?.id || '';
      setSelectedBookingId(firstBookingId);
    }
  }, [bookings, selectedBookingId]);
  useEffect(() => {
    filterStallsForBooking(selectedBooking, allStalls);
  }, [selectedBooking, allStalls]);

  const bookingStatuses = useMemo(() => {
    return Array.from(
      new Set(
        bookings
          .map(booking => booking.bookingStatus)
          //@ts-ignore
          .filter((status): status is string => Boolean(status))
      )
    );
  }, [bookings]);

  const bookingStatusCounts = useMemo(() => {
    return bookings.reduce<Record<string, number>>((result, booking) => {
      const status = booking.bookingStatus || 'Unknown';

      result[status] = (result[status] ?? 0) + 1;

      return result;
    }, {});
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const search = bookingSearch.trim().toLowerCase();

    return bookings.filter(booking => {
      const matchesSearch =
        !search ||
        booking.bookingRegistrationNumber
          ?.toLowerCase()
          .includes(search) ||
        booking.companyName?.toLowerCase().includes(search) ||
        booking.fasciaName?.toLowerCase().includes(search) ||
        booking.email?.toLowerCase().includes(search) ||
        booking.mobile?.toLowerCase().includes(search);

      const matchesStatus =
        bookingStatusFilter === 'All' ||
        booking.bookingStatus === bookingStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, bookingSearch, bookingStatusFilter]);

  const filteredStalls = useMemo(() => {
    const search = stallSearch.trim().toLowerCase();

    return stalls.filter(stall => {
      const matchesSearch =
        !search ||
        stall.stallNumber?.toLowerCase().includes(search);

      const matchesStatus =
        stallStatusFilter === 'All' ||
        stall.currentStatus === stallStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [stalls, stallSearch, stallStatusFilter]);

  const stallCounts = useMemo(() => {
    return stalls.reduce<Record<string, number>>((result, stall) => {
      const status = stall.currentStatus || 'Unknown';

      result[status] = (result[status] ?? 0) + 1;

      return result;
    }, {});
  }, [stalls]);

  function filterStallsForBooking(
    booking: BookingView | undefined,
    stallRows: Stall[]
  ) {
    if (!booking?.requestedStallSizeId) {
      setStalls([]);
      return;
    }

    const filtered = stallRows.filter(
      stall =>
        stall.stallSizeId === booking.requestedStallSizeId &&
        (
          stall.currentStatus === 'Available' ||
          stall.currentBookingId === booking.id ||
          stall.id === booking.allocatedStallId
        )
    );

    setStalls(filtered);
  }

  async function refresh() {
    const [bookingRows, stallRows] = await Promise.all([
      repositories.bookings.list('All') as Promise<BookingView[]>,
      repositories.stalls.list()
    ]);

    queryClient.setQueryData(BOOKINGS_KEY, bookingRows ?? []);
    queryClient.setQueryData(STALLS_KEY, stallRows ?? []);

    setBookings(bookingRows ?? []);
    setAllStalls(stallRows ?? []);

    const firstBookingId =
      selectedBookingId ||
      bookingRows.find(
        booking =>
          booking.bookingStatus === 'Submitted' ||
          booking.bookingStatus === 'UnderReview' ||
          booking.bookingStatus === 'BlockedAwaitingPayment'
      )?.id ||
      '';

    setSelectedBookingId(firstBookingId);

    const booking = bookingRows.find(
      bookingRow => bookingRow.id === firstBookingId
    );

    filterStallsForBooking(booking, stallRows);
  }

  function handleBookingChange(bookingId: string) {
    setSelectedBookingId(bookingId);
    setMessage('');
    setStallSearch('');
    setStallStatusFilter('All');

    const booking = bookings.find(
      bookingRow => bookingRow.id === bookingId
    );

    filterStallsForBooking(booking, allStalls);
  }

  function clearBookingFilters() {
    setBookingSearch('');
    setBookingStatusFilter('All');
  }

  function clearStallFilters() {
    setStallSearch('');
    setStallStatusFilter('All');
  }

  async function block(
    stallId: string,
    targetSponsorTotal?: number,
    isGstApplicable?: boolean,
    isTdsDeductable?: boolean
  ) {
    setMessage('');

    if (!selectedBookingId || !user) return;

    try {
      setSelectedStallId(stallId);

      await repositories.bookings.blockStall(
        selectedBookingId,
        stallId,
        user.id,
        targetSponsorTotal,
        isGstApplicable,
        isTdsDeductable
      );

      setMessage(
        'Stall blocked and payment request email simulated.'
      );

      await refresh();
    } catch (error) {
      console.error('Failed to block stall:', error);

      setMessage('Unable to block the selected stall.');
    } finally {
      setSelectedStallId(null);
    }
  }

  function handleStallSelect(stall: Stall) {
    // Sponsor stalls don't follow the standard price list — collect the
    // agreed "open" amount before allocating so it flows through to the
    // proforma invoice and payment receipt.
    if (stall.isSponsor) {
      setSponsorDialogStall(stall);
      return;
    }

    block(stall.id);
  }

  async function handleSponsorTargetConfirm(
    targetAmount: number,
    isGstApplicable: boolean,
    isTdsDeductable: boolean
  ) {
    if (!sponsorDialogStall) return;

    const stallId = sponsorDialogStall.id;
    setSponsorDialogStall(null);

    await block(stallId, targetAmount, isGstApplicable, isTdsDeductable);
  }

  return (
    <div>
      <h2 className="text-2xl font-extrabold text-slate-900">
        Stall Allocation
      </h2>

      <p className="text-sm text-slate-500">
        Select a submitted booking, then block an available stall.
        Block is valid for 3 days.
      </p>

      {message && (
        <div className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-700">
          {message}
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
        {/* Booking Queue */}
        <section className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold">Booking Queue</h3>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {filteredBookings.length} / {bookings.length}
            </span>
          </div>

          {/* Booking filters */}
          <div className="mt-4 space-y-3">
            <input
              type="search"
              className="input"
              value={bookingSearch}
              onChange={event =>
                setBookingSearch(event.target.value)
              }
              placeholder="Search booking, company, email..."
            />

            <select
              className="input"
              value={bookingStatusFilter}
              onChange={event =>
                setBookingStatusFilter(
                  event.target.value as BookingStatusFilter
                )
              }
            >
              <option value="All">
                All statuses ({bookings.length})
              </option>

              {bookingStatuses.map(status => (
                <option key={status} value={status}>
                  {status} ({bookingStatusCounts[status] ?? 0})
                </option>
              ))}
            </select>

            {(bookingSearch ||
              bookingStatusFilter !== 'All') && (
                <button
                  type="button"
                  onClick={clearBookingFilters}
                  className="text-xs font-bold text-red-600 hover:text-red-700"
                >
                  Clear booking filters
                </button>
              )}
          </div>

          {/* Booking selection */}
          <select
            className="input mt-4"
            value={selectedBookingId}
            onChange={event =>
              handleBookingChange(event.target.value)
            }
          >
            <option value="">Select booking</option>

            {filteredBookings.map(booking => (
              <option key={booking.id} value={booking.id}>
                {booking.bookingRegistrationNumber} ·{' '}
                {booking.companyName ||
                  booking.fasciaName ||
                  'Unknown Company'}{' '}
                · {booking.bookingStatus}
              </option>
            ))}
          </select>

          {filteredBookings.length === 0 && (
            <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
              No bookings match the selected filters.
            </div>
          )}

          {selectedBooking && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Booking No
                  </p>

                  <p className="font-extrabold text-slate-900">
                    {selectedBooking.bookingRegistrationNumber}
                  </p>
                </div>

                <StatusBadge
                  value={selectedBooking.bookingStatus}
                />
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <DetailRow
                  label="Company"
                  value={
                    selectedBooking.companyName ||
                    selectedBooking.fasciaName ||
                    '-'
                  }
                />

                <DetailRow
                  label="Email"
                  value={selectedBooking.email || '-'}
                  breakText
                />

                <DetailRow
                  label="Mobile"
                  value={selectedBooking.mobile || '-'}
                />

                <DetailRow
                  label="Stall Size"
                  value={
                    selectedBooking.stallSizeName ||
                    selectedBooking.stallSizeCode ||
                    selectedBooking.requestedStallSizeId ||
                    '-'
                  }
                />

                <DetailRow
                  label="Allocated Stall"
                  value={selectedBooking.stallNumber || '-'}
                />
                <DetailRow
                  label="Preferred Option 1"
                  value={selectedBooking.stallOption1Number || '-'}
                />

                <DetailRow
                  label="Preferred Option 2"
                  value={selectedBooking.stallOption2Number || '-'}
                />

                <div className="grid grid-cols-[130px_1fr] gap-2">
                  <span className="font-semibold text-slate-500">
                    Amount
                  </span>

                  <span className="font-extrabold text-green-700">
                    {formatMoney(selectedBooking.expectedAmount)}
                  </span>
                </div>

                <DetailRow
                  label="Block Expires"
                  value={formatDate(
                    selectedBooking.blockExpiresAt
                  )}
                />
              </div>
            </div>
          )}
        </section>

        {/* Stall section */}
        <section className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-bold">Stalls</h3>

            <p className="text-xs text-slate-500">
              Showing {filteredStalls.length} of {stalls.length} stalls
            </p>
          </div>

          {/* Stall count cards */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StallCountCard
              label="Total"
              value={stalls.length}
              active={stallStatusFilter === 'All'}
              onClick={() => setStallStatusFilter('All')}
            />

            <StallCountCard
              label="Available"
              value={stallCounts.Available ?? 0}
              active={stallStatusFilter === 'Available'}
              onClick={() =>
                setStallStatusFilter('Available')
              }
            />

            <StallCountCard
              label="Blocked"
              value={stallCounts.Blocked ?? 0}
              active={stallStatusFilter === 'Blocked'}
              onClick={() =>
                setStallStatusFilter('Blocked')
              }
            />

            <StallCountCard
              label="Allocated"
              value={stallCounts.Allocated ?? 0}
              active={stallStatusFilter === 'Allocated'}
              onClick={() =>
                setStallStatusFilter('Allocated')
              }
            />
          </div>

          {/* Stall filters */}
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_200px_auto]">
            <input
              type="search"
              className="input"
              value={stallSearch}
              onChange={event =>
                setStallSearch(event.target.value)
              }
              placeholder="Search stall number..."
            />

            <select
              className="input"
              value={stallStatusFilter}
              onChange={event =>
                setStallStatusFilter(
                  event.target.value as StallStatusFilter
                )
              }
            >
              <option value="All">All statuses</option>
              <option value="Available">Available</option>
              <option value="Blocked">Blocked</option>
              <option value="Allocated">Allocated</option>
            </select>

            {(stallSearch || stallStatusFilter !== 'All') && (
              <button
                type="button"
                onClick={clearStallFilters}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Clear
              </button>
            )}
          </div>

          {selectedBookingId && filteredStalls.length === 0 && (
            <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              No stalls found for the selected booking and filters.
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
            {filteredStalls.map(stall => {
              const isCurrentBookingStall =
                stall.currentBookingId === selectedBooking?.id ||
                stall.id === selectedBooking?.allocatedStallId;

              const canBlockThisStall =
                canBlock &&
                stall.currentStatus === 'Available' &&
                Boolean(selectedBookingId) &&
                ['Submitted', 'UnderReview'].includes(
                  selectedBooking?.bookingStatus ?? ''
                );

              return (
                <button
                  key={stall.id}
                  type="button"
                  disabled={!canBlockThisStall}
                  onClick={() => handleStallSelect(stall)}
                  className={`relative rounded-xl border p-3 text-left text-xs transition-all duration-300 ${selectedStallId === stall.id
                    ? 'scale-105 border-emerald-500 bg-emerald-100 shadow-xl ring-2 ring-emerald-300'
                    : stall.currentStatus === 'Available'
                      ? 'border-green-200 bg-green-50 hover:scale-105 hover:bg-green-100'
                      : stall.currentStatus === 'Blocked'
                        ? 'border-orange-200 bg-orange-50'
                        : 'border-blue-200 bg-blue-50'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {selectedStallId === stall.id && (
                    <div className="absolute -right-2 -top-2 animate-pulse rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white">
                      ✓ Blocking...
                    </div>
                  )}

                  {stall.isSponsor && (
                    <div className="absolute -left-2 -top-2 rounded-full bg-amber-500 px-2 py-1 text-[10px] font-bold text-white">
                      ★ Sponsor
                    </div>
                  )}

                  <span className="block text-sm font-extrabold">
                    {stall.stallNumber}
                  </span>

                  <span>
                    {stall.currentStatus}

                    {isCurrentBookingStall
                      ? ' · Current Booking'
                      : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {sponsorDialogStall && (
        <SponsorTargetAmountModal
          stallNumber={sponsorDialogStall.stallNumber}
          isSubmitting={selectedStallId === sponsorDialogStall.id}
          onCancel={() => setSponsorDialogStall(null)}
          onConfirm={handleSponsorTargetConfirm}
        />
      )}
    </div>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
  breakText?: boolean;
};

function DetailRow({
  label,
  value,
  breakText = false
}: DetailRowProps) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-2">
      <span className="font-semibold text-slate-500">
        {label}
      </span>

      <span
        className={`font-bold text-slate-800 ${breakText ? 'break-all' : ''
          }`}
      >
        {value}
      </span>
    </div>
  );
}

type StallCountCardProps = {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
};

function StallCountCard({
  label,
  value,
  active,
  onClick
}: StallCountCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition ${active
        ? 'border-msme-blue bg-blue-50 ring-1 ring-msme-blue'
        : 'border-slate-200 bg-white hover:bg-slate-50'
        }`}
    >
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-extrabold text-slate-900">
        {value}
      </p>
    </button>
  );
}