import { useEffect, useMemo, useState } from 'react';
import type { Stall, StallBooking } from '../../domain/models';
import { repositories } from '../../data/repositoryFactory';
import { useSession } from '../../app/session';
import { PERMISSIONS } from '../../config/permissions';
import { StatusBadge } from '../../shared/StatusBadge';
import { apiClient } from '../../data/api/apiClient';
import { appConfig } from '../../config/appConfig';
import { useQuery, useQueryClient } from '@tanstack/react-query';
const BOOKINGS_KEY = ['admin', 'bookings'] as const;
const STALL_RESERVATIONS_KEY = ['admin', 'stall-reservations'] as const;
type BookingView = StallBooking & {
  companyName?: string;
  contactPerson?: string;
  email?: string;
  mobile?: string;
  stallNumber?: string | null;
  stallSizeCode?: string;
  stallSizeName?: string;
  expectedAmount?: number;
};

type BookingStatusFilter =
  | 'All'
  | 'Submitted'
  | 'UnderReview'
  | 'BlockedAwaitingPayment'
  | 'PaymentVerified'
  | 'Allocated';

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

function formatMoney(value?: number) {
  if (value === undefined || value === null) {
    return '-';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  const apiError = error as ApiError;

  return (
    apiError?.response?.data?.message ??
    apiError?.message ??
    fallbackMessage
  );
}

export function StallReservationAllactionPage() {
  const tenantId = '11111111-1111-1111-1111-111111111111';
  const eventId = '22222222-2222-2222-2222-222222222222';
  const queryClient = useQueryClient();
  const { data: initialBookings = [] } = useQuery({
    queryKey: BOOKINGS_KEY,
    queryFn: () => repositories.bookings.list('All') as Promise<BookingView[]>,
  });
  const { data: initialReservations = [] } = useQuery({
    queryKey: STALL_RESERVATIONS_KEY,
    queryFn: () => apiClient.get<Stall[]>(`/admin/events/${eventId}/stall-reservations?tenantId=${tenantId}`),
  });
  const [allReservedStalls, setAllReservedStalls] = useState<Stall[]>([]);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [bookings, setBookings] = useState<BookingView[]>([]);
  useEffect(() => {
    if (initialBookings.length > 0) {
      setBookings(initialBookings);
    }
  }, [initialBookings]);
  useEffect(() => {
    if (initialReservations.length > 0) {
      const safeReservations = (initialReservations ?? []).filter(
        stall => stall.currentStatus === 'Reservation' && !stall.currentBookingId
      );
      setAllReservedStalls(safeReservations);
    }
  }, [initialReservations]);

  const [selectedBookingId, setSelectedBookingId] =
    useState('');

  const [selectedStallId, setSelectedStallId] = useState<
    string | null
  >(null);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<
    'success' | 'error'
  >('success');

  const [bookingSearch, setBookingSearch] = useState('');
  const [stallSearch, setStallSearch] = useState('');

  const [bookingStatusFilter, setBookingStatusFilter] =
    useState<BookingStatusFilter>('All');

  const user = useSession(state => state.user);

  const canMapReservation = useSession(state =>
    state.hasPermission(PERMISSIONS.stallBlock)
  );


  const selectedBooking = useMemo(() => {
    return bookings.find(
      booking => booking.id === selectedBookingId
    );
  }, [bookings, selectedBookingId]);
  useEffect(() => {
    if (bookings.length > 0 && !selectedBookingId) {
      const firstBookingId =
        bookings.find(
          booking =>
            booking.bookingStatus === 'Submitted' ||
            booking.bookingStatus === 'UnderReview'
        )?.id || bookings[0]?.id || '';
      setSelectedBookingId(firstBookingId);
    }
  }, [bookings, selectedBookingId]);

  const bookingStatuses = useMemo(() => {
    return Array.from(
      new Set(
        bookings
          .map(booking => booking.bookingStatus)
          //@ts-ignore
          .filter((status): status is NonNullable<typeof status> => Boolean(status))
      )
    );
  }, [bookings]);

  const bookingStatusCounts = useMemo(() => {
    return bookings.reduce<Record<string, number>>(
      (result, booking) => {
        const status =
          booking.bookingStatus || 'Unknown';

        result[status] = (result[status] ?? 0) + 1;

        return result;
      },
      {}
    );
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const normalizedSearch = bookingSearch
      .trim()
      .toLowerCase();

    return bookings.filter(booking => {
      const matchesSearch =
        !normalizedSearch ||
        booking.bookingRegistrationNumber
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        booking.companyName
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        booking.fasciaName
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        booking.email
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        booking.mobile
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        bookingStatusFilter === 'All' ||
        booking.bookingStatus === bookingStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    bookings,
    bookingSearch,
    bookingStatusFilter,
  ]);
  // async function block(stallId: string) {
  //     setMessage('');

  //     if (!selectedBookingId || !user) return;

  //     try {
  //       setSelectedStallId(stallId);

  //       await repositories.bookings.blockStall(
  //         selectedBookingId,
  //         stallId,
  //         user.id
  //       );

  //       setMessage(
  //         'Stall blocked and payment request email simulated.'
  //       );

  //       await refresh();
  //     } catch (error) {
  //       console.error('Failed to block stall:', error);

  //       setMessage('Unable to block the selected stall.');
  //     } finally {
  //       setSelectedStallId(null);
  //     }
  //   }
  const filteredStalls = useMemo(() => {
    const normalizedSearch = stallSearch
      .trim()
      .toLowerCase();

    return stalls.filter(stall => {
      return (
        !normalizedSearch ||
        stall.stallNumber
          ?.toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [stalls, stallSearch]);

  function filterReservedStallsForBooking(
    booking: BookingView | undefined,
    reservedStallRows: Stall[]
  ) {
    if (!booking?.requestedStallSizeId) {
      setStalls([]);
      return;
    }

    const matchingReservedStalls =
      reservedStallRows.filter(stall => {
        const matchesSize =
          stall.stallSizeId ===
          booking.requestedStallSizeId;

        const isUnmappedReservation =
          stall.currentStatus === 'Reservation' &&
          !stall.currentBookingId;

        return matchesSize && isUnmappedReservation;
      });

    setStalls(matchingReservedStalls);
  }

  async function loadReservedStalls(): Promise<Stall[]> {
    const response = await apiClient.get<Stall[]>(
      `/admin/events/${eventId}/stall-reservations?tenantId=${tenantId}`
    );

    return response ?? [];
  }

  async function refresh() {
    try {
      setMessage('');

      const [bookingRows, reservationRows] =
        await Promise.all([
          repositories.bookings.list(
            'All'
          ) as Promise<BookingView[]>,

          loadReservedStalls(),
        ]);

      const safeBookings = bookingRows ?? [];

      const safeReservations = (
        reservationRows ?? []
      ).filter(
        stall =>
          stall.currentStatus === 'Reservation' &&
          !stall.currentBookingId
      );

      setBookings(safeBookings);
      setAllReservedStalls(safeReservations);

      const selectedBookingStillExists =
        Boolean(selectedBookingId) &&
        safeBookings.some(
          booking =>
            booking.id === selectedBookingId
        );

      const firstBookingId =
        selectedBookingStillExists
          ? selectedBookingId
          : safeBookings.find(
            booking =>
              booking.bookingStatus ===
              'Submitted' ||
              booking.bookingStatus ===
              'UnderReview'
          )?.id ?? '';

      setSelectedBookingId(firstBookingId);

      const booking = safeBookings.find(
        bookingRow =>
          bookingRow.id === firstBookingId
      );

      filterReservedStallsForBooking(
        booking,
        safeReservations
      );
      queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
      queryClient.invalidateQueries({ queryKey: STALL_RESERVATIONS_KEY });
    } catch (error) {
      console.error(
        'Failed to load reservation allocation data:',
        error
      );

      setMessageType('error');

      setMessage(
        getErrorMessage(
          error,
          'Unable to load bookings and reserved stalls.'
        )
      );
    }
  }



  function handleBookingChange(bookingId: string) {
    setSelectedBookingId(bookingId);
    setMessage('');
    setStallSearch('');

    const booking = bookings.find(
      bookingRow => bookingRow.id === bookingId
    );

    filterReservedStallsForBooking(
      booking,
      allReservedStalls
    );
  }

  function clearBookingFilters() {
    setBookingSearch('');
    setBookingStatusFilter('All');
  }
  async function block(stall: Stall) {
    setMessage('');

    if (!selectedBookingId) {
      setMessageType('error');
      setMessage('Please select a booking.');
      return;
    }

    if (!user) {
      setMessageType('error');
      setMessage('User session was not found.');
      return;
    }

    try {
      setSelectedStallId(stall.id);

      await repositories.bookings.blockStall(
        selectedBookingId,
        stall.id,
        user.id
      );

      setMessageType('success');

      setMessage(
        stall.currentStatus === 'Reservation'
          ? 'Reserved stall mapped and blocked for the selected booking.'
          : 'Stall blocked for the selected booking.'
      );

      await refresh();
    } catch (error) {
      console.error('Failed to block stall:', error);

      setMessageType('error');
      setMessage(
        getErrorMessage(
          error,
          'Unable to block the selected stall.'
        )
      );
    } finally {
      setSelectedStallId(null);
    }
  }
  async function mapReservedStall(stallId: string) {
    setMessage('');

    if (!selectedBookingId) {
      setMessageType('error');
      setMessage('Please select a booking.');
      return;
    }

    if (!user) {
      setMessageType('error');
      setMessage('User session was not found.');
      return;
    }

    if (!canMapReservation) {
      setMessageType('error');

      setMessage(
        'You do not have permission to map reserved stalls.'
      );

      return;
    }

    const bookingStatus =
      selectedBooking?.bookingStatus ?? '';

    if (
      !['Submitted', 'UnderReview'].includes(
        bookingStatus
      )
    ) {
      setMessageType('error');

      setMessage(
        'Only Submitted or Under Review bookings can receive a reserved stall.'
      );

      return;
    }

    try {
      setSelectedStallId(stallId);

      await apiClient.post(
        `/admin/events/${eventId}/bookings/${selectedBookingId}/map-reserved-stall`,
        {
          tenantId,
          stallId,
          actorUserId: user.id,
          blockValidityDays: 3,
        }
      );

      setMessageType('success');

      setMessage(
        'Reserved stall mapped and blocked for the selected booking.'
      );

      await refresh();
    } catch (error) {
      console.error(
        'Failed to map reserved stall:',
        error
      );

      setMessageType('error');

      setMessage(
        getErrorMessage(
          error,
          'Unable to map the reserved stall.'
        )
      );
    } finally {
      setSelectedStallId(null);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-extrabold text-slate-900">
        Reserved Stall Allocation
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Select a booking and map one of the reserved
        stalls. After mapping, the stall status changes
        from Reservation to Blocked.
      </p>

      {message && (
        <div
          className={`mt-4 rounded-xl p-3 text-sm font-semibold ${messageType === 'success'
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700'
            }`}
        >
          {message}
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
        {/* Booking Queue */}
        <section className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold">
              Booking Queue
            </h3>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {filteredBookings.length} /{' '}
              {bookings.length}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <input
              type="search"
              className="input"
              value={bookingSearch}
              onChange={event =>
                setBookingSearch(
                  event.target.value
                )
              }
              placeholder="Search booking, company, email..."
            />

            <select
              className="input"
              value={bookingStatusFilter}
              onChange={event =>
                setBookingStatusFilter(
                  event.target
                    .value as BookingStatusFilter
                )
              }
            >
              <option value="All">
                All statuses ({bookings.length})
              </option>

              {bookingStatuses.map(status => (
                <option
                  key={status}
                  value={status}
                >
                  {status} (
                  {bookingStatusCounts[status] ??
                    0}
                  )
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

          <select
            className="input mt-4"
            value={selectedBookingId}
            onChange={event =>
              handleBookingChange(
                event.target.value
              )
            }
          >
            <option value="">
              Select booking
            </option>

            {filteredBookings.map(booking => (
              <option
                key={booking.id}
                value={booking.id}
              >
                {
                  booking.bookingRegistrationNumber
                }{' '}
                ·{' '}
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
                    {
                      selectedBooking.bookingRegistrationNumber
                    }
                  </p>
                </div>

                <StatusBadge
                  value={
                    selectedBooking.bookingStatus
                  }
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
                  label="Contact"
                  value={
                    selectedBooking.contactPerson ||
                    '-'
                  }
                />

                <DetailRow
                  label="Email"
                  value={
                    selectedBooking.email || '-'
                  }
                  breakText
                />

                <DetailRow
                  label="Mobile"
                  value={
                    selectedBooking.mobile || '-'
                  }
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
                  value={
                    selectedBooking.stallNumber ||
                    '-'
                  }
                />

                <div className="grid grid-cols-[130px_1fr] gap-2">
                  <span className="font-semibold text-slate-500">
                    Amount
                  </span>

                  <span className="font-extrabold text-green-700">
                    {formatMoney(
                      selectedBooking.expectedAmount
                    )}
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

        {/* Reserved Stall Section */}
        <section className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">
                Reserved Stalls
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Only unmapped Reservation stalls matching
                the booking size are displayed.
              </p>
            </div>

            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
              {filteredStalls.length} reserved
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="search"
              className="input"
              value={stallSearch}
              onChange={event =>
                setStallSearch(
                  event.target.value
                )
              }
              placeholder="Search reserved stall number..."
            />

            {stallSearch && (
              <button
                type="button"
                onClick={() => setStallSearch('')}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Clear
              </button>
            )}
          </div>

          {!selectedBookingId && (
            <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
              Select a booking to view reserved stalls
              matching its requested stall size.
            </div>
          )}

          {selectedBookingId &&
            filteredStalls.length === 0 && (
              <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                No unmapped reserved stalls were found for
                the selected booking size.
              </div>
            )}

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
            {filteredStalls.map(stall => {
              const isProcessing =
                selectedStallId === stall.id;

              const bookingCanReceiveStall =
                ['Submitted', 'UnderReview'].includes(
                  selectedBooking
                    ?.bookingStatus ?? ''
                );

              const canMapThisStall =
                canMapReservation &&
                Boolean(selectedBookingId) &&
                bookingCanReceiveStall &&
                stall.currentStatus ===
                'Reservation' &&
                !stall.currentBookingId &&
                !selectedStallId;

              return (
                <button
                  key={stall.id}
                  type="button"
                  disabled={!canMapThisStall}
                  onClick={() => void block(stall)}
                  className={`relative rounded-xl border p-3 text-left text-xs transition-all duration-300 ${isProcessing
                    ? 'scale-105 border-emerald-500 bg-emerald-100 shadow-xl ring-2 ring-emerald-300'
                    : 'border-violet-200 bg-violet-50 hover:scale-105 hover:border-violet-300 hover:bg-violet-100'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {isProcessing && (
                    <div className="absolute -right-2 -top-2 animate-pulse rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white">
                      Blocking...
                    </div>
                  )}

                  <span className="block text-sm font-extrabold text-slate-900">
                    {stall.stallNumber}
                  </span>

                  <span className="mt-1 block font-semibold text-violet-700">
                    Reservation
                  </span>

                  <span className="mt-2 block font-bold text-violet-700">
                    Click to block
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
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
  breakText = false,
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