import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { Stall, StallStatus } from '../../domain/models';
import { StatusBadge } from '../../shared/StatusBadge';
import { PageHeader } from '../../shared/components/PageHeader';
import { apiClient } from '../../data/api/apiClient';
import { appConfig } from '../../config/appConfig';
import { StallMaster } from '../../data/api/ApiRepositories';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshListButton } from '../../shared/components/RefreshListButton';
const STALLS_KEY = ['admin', 'stalls'] as const;
const STALL_SIZES_KEY = ['public', 'stall-sizes'] as const;
type ReleaseBlockResponse = {
  message: string;
  bookingId: string;
  bookingNumber: string;
  bookingStatus: string;
  stallId: string;
  stallNumber: string;
  stallStatus: StallStatus;
  releasedAt: string;
  releaseReason: string;
};

type SortDirection = 'asc' | 'desc';
type SortField = 'stallNumber' | 'stallSize' | 'status';
export interface StallSizeOption {
  id: string;
  code: string;
  name: string;
  displayName: string;
  baseAmount: number;
  gstPercentage?: number;
  totalAmount: number;
}
export type StallPreferenceOption = {
  id: string;
  stallNumber: string;
  stallSizeId: string;
  stallSizeCode: string;
  stallSizeName: string;
  currentStatus: StallStatus;
};

export type StallForm = {
  StallSizeId: string;
  StallNumber: string;
  HallName?: string;
  ZoneName?: string;
  RowLabel?: string;
  FloorLabel?: string;
  LayoutX?: number;
  LayoutY?: number;
  IsActive?: boolean;
};

type ReservationResponse = {
  message: string;
  stallId: string;
  stallNumber: string;
  status: StallStatus;
  currentBookingId: string | null;
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

const initialForm: StallForm = {
  StallNumber: '',
  HallName: '',
  StallSizeId: '',
  ZoneName: '',
  LayoutX: 0,
  LayoutY: 0,
  RowLabel: '',
  FloorLabel: '',
  IsActive: true,
};

export function StallMasterPage() {
  /*
   * Replace these temporary IDs with values from your
   * authenticated user/session store.
   */
  const tenantId =
    '11111111-1111-1111-1111-111111111111';

  const eventId =
    '22222222-2222-2222-2222-222222222222';

  const actorUserId =
    '40bb01d6-fa5d-4318-9775-e9d5792a222b';
  const queryClient = useQueryClient();
  const stallMaster = useMemo(
    () => new StallMaster(),
    []
  );
  const { data: stallsData = [] } = useQuery({
    queryKey: STALLS_KEY,
    queryFn: () => stallMaster.list(),
  });
  const { data: stallSizesData = [] } = useQuery({
    queryKey: STALL_SIZES_KEY,
    queryFn: () => apiClient.get<StallSizeOption[]>(`/public/events/${appConfig.defaultEventCode}/stall-sizes`),
    gcTime: 30 * 60_000,
  });
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [stallSizes, setStallSizes] = useState<StallSizeOption[]>([]);
  useEffect(() => {
    if (stallsData.length > 0) setStalls(stallsData);
  }, [stallsData]);
  useEffect(() => {
    if (stallSizesData.length > 0) setStallSizes(stallSizesData);
  }, [stallSizesData]);
  const [status, setStatus] = useState<'All' | StallStatus>('All');
  const [search, setSearch] = useState('');
  const [selectedStallSizeId, setSelectedStallSizeId] = useState('All');
  const [selectedStallNumber, setSelectedStallNumber] = useState('All');

  const [selectedStallId, setSelectedStallId] =
    useState('');
  const [availableStalls, setAvailableStalls] =
    useState<StallPreferenceOption[]>([]);
  const [form, setForm] =
    useState<StallForm>(initialForm);

  const [saving, setSaving] = useState(false);

  const [processingStallId, setProcessingStallId] =
    useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<'stallNumber' | 'stallSize' | 'status'>('stallNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  useEffect(() => {
    if (!selectedStallSizeId) {
      setAvailableStalls([]);
      setSelectedStallId('');
      return;
    }

    apiClient
      .get<StallPreferenceOption[]>(
        `/public/events/${appConfig.defaultEventCode}/stalls?stallSizeId=${encodeURIComponent(
          selectedStallSizeId
        )}`
      )
      .then(data => {
        setAvailableStalls(data ?? []);
        setSelectedStallId('');
      })
      .catch(() => {
        setAvailableStalls([]);
        setSelectedStallId('');
      });
  }, [selectedStallSizeId]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');



  const getErrorMessage = (
    currentError: unknown,
    fallback: string
  ): string => {
    const apiError = currentError as ApiError;

    return (
      apiError?.response?.data?.message ??
      apiError?.message ??
      fallback
    );
  };

  const loadStalls = async () => {
    try {
      setError('');

      const data = await stallMaster.list();

      setStalls(data);
      queryClient.setQueryData(STALLS_KEY, data);
      queryClient.invalidateQueries({ queryKey: ['stalls'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    } catch (currentError) {
      console.error(currentError);

      setError(
        getErrorMessage(
          currentError,
          'Unable to load stalls.'
        )
      );
    }
  };
  const unblockStall = async (
    stallId: string,
    bookingId: string | null
  ) => {
    if (!bookingId) {
      setError('This blocked stall is not linked to a booking.');
      return;
    }

    try {
      setProcessingStallId(stallId);
      setError('');
      setSuccess('');

      // Optimistic instant UI update
      setStalls(prev =>
        prev.map(s =>
          s.id === stallId
            ? { ...s, currentStatus: 'Available' as StallStatus, currentBookingId: null }
            : s
        )
      );

      const response =
        await apiClient.post<ReleaseBlockResponse>(
          `/admin/events/${eventId}/bookings/${bookingId}/stalls/${stallId}/release-block`,
          {
            tenantId,
            actorUserId,
            reason: 'Blocked stall manually released from Stall Master.',
          }
        );

      setSuccess(
        response?.message ??
        'Blocked stall released and booking moved to Submitted successfully.'
      );

      await loadStalls();
    } catch (currentError) {
      console.error(currentError);

      setError(
        getErrorMessage(
          currentError,
          'Unable to release blocked stall.'
        )
      );
      await loadStalls();
    } finally {
      setProcessingStallId(null);
    }
  };

  const loadStallSizes = async () => {
    try {
      const data = await apiClient.get<StallSizeOption[]>(
        `/public/events/${appConfig.defaultEventCode}/stall-sizes`
      );

      setStallSizes(data);
      queryClient.invalidateQueries({ queryKey: STALL_SIZES_KEY });
    } catch (currentError) {
      console.error(currentError);

      setError(
        getErrorMessage(
          currentError,
          'Unable to load stall sizes. Please try again or contact the organising team.'
        )
      );
    }
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

  const getStallSizeLabel = (stall: Stall): string => {
    const stallSizeId = getStallSizeId(stall);
    const size = stallSizes.find(item => item.id === stallSizeId);

    return size
      ? `${size.code} - ${size.displayName}`
      : '—';
  };

  // const stallNumberOptions = useMemo(() => {
  //   return [...stalls]
  //     .map(stall => stall.stallNumber)
  //     .filter((value, index, values) =>
  //       values.indexOf(value) === index
  //     )
  //     .sort((first, second) =>
  //       first.localeCompare(second, undefined, {
  //         numeric: true,
  //         sensitivity: 'base',
  //       })
  //     );
  // }, [stalls]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = [...stalls].filter(stall => {
      const matchesStatus =
        status === 'All' || stall.currentStatus === status;

      const matchesSearch =
        !normalizedSearch ||
        stall.stallNumber.toLowerCase().includes(normalizedSearch);

      const matchesStallSize =
        selectedStallSizeId === 'All' ||
        getStallSizeId(stall) === selectedStallSizeId;

      const matchesStallNumber =
        selectedStallNumber === 'All' ||
        stall.stallNumber === selectedStallNumber;

      return (
        matchesStatus &&
        matchesSearch &&
        matchesStallSize &&
        matchesStallNumber
      );
    });

    result.sort((first, second) => {
      let compareResult = 0;

      if (sortField === 'stallNumber') {
        compareResult = first.stallNumber.localeCompare(
          second.stallNumber,
          undefined,
          { numeric: true, sensitivity: 'base' }
        );
      } else if (sortField === 'stallSize') {
        compareResult = getStallSizeLabel(first).localeCompare(
          getStallSizeLabel(second),
          undefined,
          { numeric: true, sensitivity: 'base' }
        );
      } else if (sortField === 'status') {
        compareResult = first.currentStatus.localeCompare(second.currentStatus);
      }

      return sortDirection === 'asc' ? compareResult : -compareResult;
    });

    return result;
  }, [
    stalls,
    status,
    search,
    selectedStallSizeId,
    selectedStallNumber,
    stallSizes,
    sortField,
    sortDirection,
  ]);
  const stallNumberOptions = useMemo(() => {
    return [...stalls]
      .filter(stall => {
        return (
          selectedStallSizeId === 'All' ||
          getStallSizeId(stall) === selectedStallSizeId
        );
      })
      .map(stall => stall.stallNumber)
      .filter(
        (stallNumber, index, values) =>
          values.indexOf(stallNumber) === index
      )
      .sort((first, second) =>
        first.localeCompare(second, undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      );
  }, [stalls, selectedStallSizeId]);
  const clearFilters = () => {
    setSearch('');
    setStatus('All');
    setSelectedStallSizeId('All');
    setSelectedStallNumber('All');
  };
  const toggleSort = (field: 'stallNumber' | 'stallSize' | 'status') => {
    if (sortField === field) {
      setSortDirection(previous => (previous === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  useEffect(() => {
    setCurrentPage(1);
  }, [search, status, selectedStallSizeId, selectedStallNumber]);
  const setField = (
    name: keyof StallForm,
    value: string | number | boolean
  ) => {
    setForm(previous => ({
      ...previous,
      [name]: value,
    }));
  };

  const filteredCounts = useMemo(() => {
    return filtered.reduce(
      (counts, stall) => {
        counts.total += 1;

        switch (stall.currentStatus) {
          case 'Available':
            counts.available += 1;
            break;

          case 'Reservation':
            counts.reservation += 1;
            break;

          case 'Blocked':
            counts.blocked += 1;
            break;

          case 'Frozen':
            counts.frozen += 1;
            break;

          case 'Released':
            counts.released += 1;
            break;

          case 'Cancelled':
            counts.cancelled += 1;
            break;

          case 'Disabled':
            counts.disabled += 1;
            break;
        }

        return counts;
      },
      {
        total: 0,
        available: 0,
        reservation: 0,
        blocked: 0,
        frozen: 0,
        released: 0,
        cancelled: 0,
        disabled: 0,
      }
    );
  }, [filtered]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const paginatedStalls = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [filtered, currentPage]);
  const createStall = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!form.StallSizeId) {
      setError('Please select a stall size.');
      return;
    }

    if (!form.StallNumber.trim()) {
      setError('Please enter the stall number.');
      return;
    }

    const payload: StallForm = {
      StallSizeId: form.StallSizeId,
      StallNumber: form.StallNumber.trim(),
      HallName: form.HallName?.trim() || '',
      ZoneName: form.ZoneName?.trim() || '',
      RowLabel: form.RowLabel?.trim() || '',
      FloorLabel: form.FloorLabel?.trim() || '',
      LayoutX: form.LayoutX
        ? Number(form.LayoutX)
        : undefined,
      LayoutY: form.LayoutY
        ? Number(form.LayoutY)
        : undefined,
      IsActive: true,
    };

    try {
      setSaving(true);

      await stallMaster.create(payload);

      await loadStalls();

      setForm(initialForm);
      setSuccess('Stall created successfully.');
    } catch (currentError) {
      console.error(currentError);

      setError(
        getErrorMessage(
          currentError,
          'Unable to create stall.'
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const reserveStall = async (stallId: string) => {
    try {
      setProcessingStallId(stallId);
      setError('');
      setSuccess('');

      // Optimistic instant UI update
      setStalls(prev =>
        prev.map(s =>
          s.id === stallId
            ? { ...s, currentStatus: 'Reservation' as StallStatus }
            : s
        )
      );

      const response =
        await apiClient.post<ReservationResponse>(
          `/admin/events/${eventId}/stall-reservations/${stallId}/reserve`,
          {
            tenantId,
            actorUserId,
          }
        );

      setSuccess(
        response?.message ??
        'Stall reserved successfully.'
      );

      await loadStalls();
    } catch (currentError) {
      console.error(currentError);

      setError(
        getErrorMessage(
          currentError,
          'Unable to reserve stall.'
        )
      );
      await loadStalls();
    } finally {
      setProcessingStallId(null);
    }
  };
  const markSponsor = async (stallId: string) => {
    try {
      setProcessingStallId(stallId);
      setError('');
      setSuccess('');

      // Optimistic instant UI update
      setStalls(prev =>
        prev.map(s =>
          s.id === stallId
            ? { ...s, isSponsor: true }
            : s
        )
      );

      const response = await apiClient.post<{ message: string }>(
        `/admin/events/${eventId}/stalls/${stallId}/mark-sponsor`,
        {}
      );

      setSuccess(response?.message ?? 'Stall marked as sponsor.');
      await loadStalls();
    } catch (currentError) {
      console.error(currentError);
      setError(getErrorMessage(currentError, 'Unable to mark stall as sponsor.'));
      await loadStalls();
    } finally {
      setProcessingStallId(null);
    }
  };

  const unmarkSponsor = async (stallId: string) => {
    try {
      setProcessingStallId(stallId);
      setError('');
      setSuccess('');

      // Optimistic instant UI update
      setStalls(prev =>
        prev.map(s =>
          s.id === stallId
            ? { ...s, isSponsor: false }
            : s
        )
      );

      const response = await apiClient.post<{ message: string }>(
        `/admin/events/${eventId}/stalls/${stallId}/unmark-sponsor`,
        {}
      );

      setSuccess(response?.message ?? 'Stall unmarked as sponsor.');
      await loadStalls();
    } catch (currentError) {
      console.error(currentError);
      setError(getErrorMessage(currentError, 'Unable to unmark stall as sponsor.'));
      await loadStalls();
    } finally {
      setProcessingStallId(null);
    }
  };

  const releaseReservation = async (
    stallId: string
  ) => {
    try {
      setProcessingStallId(stallId);
      setError('');
      setSuccess('');

      // Optimistic instant UI update
      setStalls(prev =>
        prev.map(s =>
          s.id === stallId
            ? { ...s, currentStatus: 'Available' as StallStatus, currentBookingId: null }
            : s
        )
      );

      const response =
        await apiClient.post<ReservationResponse>(
          `/admin/events/${eventId}/stall-reservations/${stallId}/release`,
          {
            tenantId,
            actorUserId,
          }
        );

      setSuccess(
        response?.message ??
        'Reservation released successfully.'
      );

      await loadStalls();
    } catch (currentError) {
      console.error(currentError);

      setError(
        getErrorMessage(
          currentError,
          'Unable to release reservation.'
        )
      );
      await loadStalls();
    } finally {
      setProcessingStallId(null);
    }
  };

  // const totalCount = stalls.length;

  // const availableCount = stalls.filter(
  //   stall => stall.currentStatus === 'Available'
  // ).length;

  // const reservationCount = stalls.filter(
  //   stall => stall.currentStatus === 'Reservation'
  // ).length;

  // const blockedCount = stalls.filter(
  //   stall => stall.currentStatus === 'Blocked'
  // ).length;

  // const frozenCount = stalls.filter(
  //   stall => stall.currentStatus === 'Frozen'
  // ).length;


  const totalCount = filteredCounts.total;
  const availableCount = filteredCounts.available;
  const reservationCount = filteredCounts.reservation;
  const blockedCount = filteredCounts.blocked;
  const frozenCount = filteredCounts.frozen;
  return (
    <div>


      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      {/* <form
        onSubmit={createStall}
        className="card mb-4 space-y-6 p-6"
      >
        <h2 className="text-xl font-bold">
          Create Stall
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Stall Size{' '}
              <span className="text-red-500">*</span>
            </label>

            <select
              className="input"
              value={form.StallSizeId}
              onChange={event =>
                setField(
                  'StallSizeId',
                  event.target.value
                )
              }
              required
            >
              <option value="">
                Select Stall Size
              </option>

              {stallSizes.map(size => (
                <option
                  key={size.id}
                  value={size.id}
                >
                  {size.code} - {size.displayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Stall Number{' '}
              <span className="text-red-500">*</span>
            </label>

            <input
              className="input"
              placeholder="Ex: A-101"
              value={form.StallNumber}
              onChange={event =>
                setField(
                  'StallNumber',
                  event.target.value
                )
              }
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Hall Name
            </label>

            <input
              className="input"
              placeholder="Ex: Hall A"
              value={form.HallName}
              onChange={event =>
                setField(
                  'HallName',
                  event.target.value
                )
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Zone Name
            </label>

            <input
              className="input"
              placeholder="Ex: Zone 1"
              value={form.ZoneName}
              onChange={event =>
                setField(
                  'ZoneName',
                  event.target.value
                )
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Row Label
            </label>

            <input
              className="input"
              placeholder="Ex: Row B"
              value={form.RowLabel}
              onChange={event =>
                setField(
                  'RowLabel',
                  event.target.value
                )
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Floor Label
            </label>

            <input
              className="input"
              placeholder="Ex: Ground Floor"
              value={form.FloorLabel}
              onChange={event =>
                setField(
                  'FloorLabel',
                  event.target.value
                )
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Layout X
            </label>

            <input
              type="number"
              className="input"
              placeholder="Ex: 10"
              value={form.LayoutX}
              onChange={event =>
                setField(
                  'LayoutX',
                  Number(event.target.value)
                )
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Layout Y
            </label>

            <input
              type="number"
              className="input"
              placeholder="Ex: 20"
              value={form.LayoutY}
              onChange={event =>
                setField(
                  'LayoutY',
                  Number(event.target.value)
                )
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-xl border px-4 py-2 text-sm font-semibold"
            onClick={() => {
              setForm(initialForm);
              setError('');
              setSuccess('');
            }}
          >
            Clear
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? 'Creating...'
              : 'Create Stall'}
          </button>
        </div>
      </form> */}
      {/* <PageHeader
        title="Stall Master"
        description="Create, manage, reserve and control stall inventory."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="input w-48"
              placeholder="Search stall, hall or zone"
              value={search}
              onChange={event =>
                setSearch(event.target.value)
              }
            />

            <select
              className="input w-48"
              value={selectedStallSizeId}
              onChange={event =>
                setSelectedStallSizeId(event.target.value)
              }
            >
              <option value="All">All Stall Sizes</option>
              {[...stallSizes]
                .sort((first, second) =>
                  first.displayName.localeCompare(
                    second.displayName,
                    undefined,
                    {
                      numeric: true,
                      sensitivity: 'base',
                    }
                  )
                )
                .map(size => (
                  <option key={size.id} value={size.id}>
                    {size.code} - {size.displayName}
                  </option>
                ))}
            </select>

            <select
              className="input w-48"
              value={selectedStallNumber}
              onChange={event =>
                setSelectedStallNumber(event.target.value)
              }
            >
              <option value="All">All Stall Numbers</option>
              {stallNumberOptions.map(stallNumber => (
                <option key={stallNumber} value={stallNumber}>
                  {stallNumber}
                </option>
              ))}
            </select>

            <select
              className="input w-48"
              value={status}
              onChange={event =>
                setStatus(
                  event.target.value as
                  | 'All'
                  | StallStatus
                )
              }
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Reservation">Reservation</option>
              <option value="Blocked">Blocked</option>
              <option value="Frozen">Frozen</option>
              <option value="Released">Released</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Disabled">Disabled</option>
            </select>

            <button
              type="button"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        }
      /> */}

      <div className="mb-4 grid gap-3 md:grid-cols-5">
        <div className="card p-4">
          <p className="text-xs uppercase text-slate-500">
            Total
          </p>

          <p className="text-2xl font-extrabold">
            {totalCount}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs uppercase text-slate-500">
            Available
          </p>

          <p className="text-2xl font-extrabold">
            {availableCount}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs uppercase text-slate-500">
            Reservation
          </p>

          <p className="text-2xl font-extrabold">
            {reservationCount}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs uppercase text-slate-500">
            Blocked
          </p>

          <p className="text-2xl font-extrabold">
            {blockedCount}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs uppercase text-slate-500">
            Frozen
          </p>

          <p className="text-2xl font-extrabold">
            {frozenCount}
          </p>
        </div>
      </div>
      <div className="card mt-6 p-4">
        <div className="flex flex-col">
          <div className="grid grid-cols-4 gap-4">
            <input
              className="input w-full"
              placeholder="Search stall, hall or zone"
              value={search}
              onChange={event => setSearch(event.target.value)}
            />

            <select
              className="input w-full"
              value={selectedStallSizeId}
              onChange={event => {
                setSelectedStallSizeId(event.target.value);
                setSelectedStallNumber('All');
              }}
            >
              <option value="All">All Stall Sizes</option>
              {[...stallSizes]
                .sort((first, second) =>
                  first.displayName.localeCompare(second.displayName, undefined, {
                    numeric: true,
                    sensitivity: 'base',
                  })
                )
                .map(size => (
                  <option key={size.id} value={size.id}>
                    {size.code} - {size.displayName}
                  </option>
                ))}
            </select>

            <select
              className="input w-full"
              value={selectedStallNumber}
              disabled={stallNumberOptions.length === 0}
              onChange={event => setSelectedStallNumber(event.target.value)}
            >
              <option value="All">
                {selectedStallSizeId === 'All'
                  ? 'All Stall Names'
                  : stallNumberOptions.length === 0
                    ? 'No stalls found'
                    : 'All Stall Names'}
              </option>
              {stallNumberOptions.map(stallNumber => (
                <option key={stallNumber} value={stallNumber}>
                  {stallNumber}
                </option>
              ))}
            </select>

            <select
              className="input w-full"
              value={status}
              onChange={event =>
                setStatus(event.target.value as 'All' | StallStatus)
              }
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Reservation">Reservation</option>
              <option value="Blocked">Blocked</option>
              <option value="Frozen">Frozen</option>
              <option value="Released">Released</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Disabled">Disabled</option>
            </select>

          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="w-fit rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
            <RefreshListButton onRefresh={() => queryClient.invalidateQueries({ queryKey: STALLS_KEY })} />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-4">
                  <button
                    type="button"
                    onClick={() => toggleSort('stallNumber')}
                    className="flex items-center gap-1 font-semibold uppercase"
                  >
                    Stall
                    {sortField === 'stallNumber' && (
                      <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </button>
                </th>

                <th className="p-4">
                  <button
                    type="button"
                    onClick={() => toggleSort('stallSize')}
                    className="flex items-center gap-1 font-semibold uppercase"
                  >
                    Stall Size
                    {sortField === 'stallSize' && (
                      <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </button>
                </th>

                <th className="p-4">
                  <button
                    type="button"
                    onClick={() => toggleSort('status')}
                    className="flex items-center gap-1 font-semibold uppercase"
                  >
                    Status
                    {sortField === 'status' && (
                      <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </button>
                </th>

                <th className="p-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {paginatedStalls
                .map(stall => {
                  const isProcessing =
                    processingStallId === stall.id;

                  return (
                    <tr
                      key={stall.id}
                      className="border-t"
                    >
                      <td className="p-4 font-bold">
                        {stall.stallNumber}
                      </td>

                      <td className="p-4 text-slate-600">
                        {getStallSizeLabel(stall)}
                      </td>

                      {/* <td className="p-4 text-slate-600">
                        <div>
                          {stall.hallName ?? '—'}
                        </div>

                        <div className="text-xs text-slate-400">
                          {stall.zoneName ?? '—'}
                        </div>
                      </td> */}

                      <td className="p-4">
                        <StatusBadge
                          value={
                            stall.currentStatus
                          }
                        />
                      </td>

                      {/* <td className="p-4 text-slate-600">
                        {stall.currentBookingId ??
                          '—'}
                      </td> */}

                      {/* <td className="p-4 text-slate-500">
                        {stall.sourceRow ?? '—'}
                      </td> */}

                      <td className="p-4">
                        {stall.currentStatus ===
                          'Available' && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() =>
                                reserveStall(
                                  stall.id
                                )
                              }
                              className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isProcessing
                                ? 'Reserving...'
                                : 'Reserve'}
                            </button>
                          )}

                        {stall.currentStatus ===
                          'Reservation' && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() =>
                                releaseReservation(
                                  stall.id
                                )
                              }
                              className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isProcessing
                                ? 'Releasing...'
                                : 'Release'}
                            </button>
                          )}

                        {stall.currentStatus !==
                          'Available' &&
                          stall.currentStatus !==
                          'Reservation' &&
                          stall.currentStatus !==
                          'Blocked' && (
                            <span className="text-xs text-slate-400">
                              No action
                            </span>
                          )}
                        {stall.currentStatus === 'Blocked' && (
                          <button
                            type="button"
                            disabled={
                              isProcessing ||
                              !stall.currentBookingId
                            }
                            onClick={() =>
                              unblockStall(
                                stall.id,
                                stall.currentBookingId ?? null
                              )
                            }
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            title={
                              stall.currentBookingId
                                ? 'Release blocked stall'
                                : 'No booking linked to this stall'
                            }
                          >
                            {isProcessing
                              ? 'Unblocking...'
                              : 'Unblock'}
                          </button>
                        )}
                      </td>
                      <td>
                        {stall.isSponsor ? (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => unmarkSponsor(stall.id)}
                            className="rounded-lg bg-violet-700 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            title="Sponsor stall — proforma invoice uses HSN 998397. Click to unmark."
                          >
                            {isProcessing ? 'Updating...' : '★ Sponsor'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => markSponsor(stall.id)}
                            className="rounded-lg border border-violet-600 px-3 py-2 text-xs font-semibold text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Mark this stall as a Sponsor stall so its proforma invoice uses HSN 998397."
                          >
                            {isProcessing ? 'Updating...' : 'Mark Sponsor'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-6 text-center text-slate-500"
                  >
                    No stalls found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t p-4 text-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <span>
                Showing{' '}
                <span className="font-semibold text-slate-700">
                  {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, filtered.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-700">
                  {filtered.length}
                </span>
              </span>

              <span className="ml-4 flex items-center gap-2">
                ROWS
                <select
                  className="input w-auto py-1"
                  value={pageSize}
                  onChange={event => {
                    setPageSize(Number(event.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                «
              </button>

              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter(
                  pageNumber =>
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    Math.abs(pageNumber - currentPage) <= 1
                )
                .map((pageNumber, index, array) => (
                  <span key={pageNumber} className="flex items-center">
                    {index > 0 && pageNumber - array[index - 1] > 1 && (
                      <span className="px-1 text-slate-400">…</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={
                        pageNumber === currentPage
                          ? 'rounded-lg bg-blue-700 px-3 py-1 text-xs font-semibold text-white'
                          : 'rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50'
                      }
                    >
                      {pageNumber}
                    </button>
                  </span>
                ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage(page => Math.min(totalPages, page + 1))
                }
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ›
              </button>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
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