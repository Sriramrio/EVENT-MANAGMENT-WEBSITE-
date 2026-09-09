import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '../../shared/StatusBadge';
import { apiClient } from '../../data/api/apiClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshListButton } from '../../shared/components/RefreshListButton';
export type SponsorStall = {
  id: string;
  tenantId: string;
  eventId: string;
  stallSizeId: string;
  stallNumber: string;
  stallSizeCode: string;
  stallSizeName: string;
  currentStatus: string;
  currentBookingId: string | null;
  isSponsor: boolean;
};

type SortField =
  | 'stallNumber'
  | 'stallSizeName'
  | 'currentStatus';

type SortDirection = 'asc' | 'desc';

type StallSizeOption = {
  id: string;
  code: string;
  name: string;
};
const SPONSOR_STALLS_KEY = ['admin', 'sponsor-stalls'] as const;
export function SponsorStallsPage() {
  const queryClient = useQueryClient();
  const { data: stalls = [], isLoading, error: queryError } = useQuery({
    queryKey: SPONSOR_STALLS_KEY,
    queryFn: () => apiClient.get<SponsorStall[]>('/admin/events/current/sponsor-stalls'),
  });
  const error = queryError ? (queryError as any)?.message || 'Unable to load sponsor stalls.' : '';

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedStallSizeId, setSelectedStallSizeId] =
    useState('');
  const [selectedStallNumber, setSelectedStallNumber] =
    useState('');
  const [selectedStatus, setSelectedStatus] =
    useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting states
  const [sortField, setSortField] =
    useState<SortField>('stallNumber');

  const [sortDirection, setSortDirection] =
    useState<SortDirection>('asc');

  // useEffect(() => {
  //   let isMounted = true;

  //   const load = async () => {
  //     try {
  //       setIsLoading(true);
  //       setError('');

  //       const data = await apiClient.get<SponsorStall[]>(
  //         '/admin/events/current/sponsor-stalls'
  //       );

  //       if (isMounted) {
  //         setStalls(data ?? []);
  //       }
  //     } catch (err: any) {
  //       console.error('LOAD SPONSOR STALLS ERROR', err);

  //       if (isMounted) {
  //         setError(
  //           err?.message || 'Unable to load sponsor stalls.'
  //         );

  //         setStalls([]);
  //       }
  //     } finally {
  //       if (isMounted) {
  //         setIsLoading(false);
  //       }
  //     }
  //   };

  //   void load();

  //   return () => {
  //     isMounted = false;
  //   };
  // }, []);

  /*
   * Natural sorting:
   * B1, B2, B3, B10 என்ற சரியான order-ல் காட்டும்.
   */
  const collator = useMemo(
    () =>
      new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: 'base'
      }),
    []
  );

  // Unique Stall Size options
  const stallSizeOptions = useMemo(() => {
    const sizeMap = new Map<string, StallSizeOption>();

    stalls.forEach(stall => {
      if (!sizeMap.has(stall.stallSizeId)) {
        sizeMap.set(stall.stallSizeId, {
          id: stall.stallSizeId,
          code: stall.stallSizeCode,
          name: stall.stallSizeName
        });
      }
    });

    return Array.from(sizeMap.values()).sort(
      (first, second) =>
        collator.compare(first.name, second.name)
    );
  }, [stalls, collator]);

  // Unique Stall Number/Name options
  const stallNumberOptions = useMemo(() => {
    return Array.from(
      new Set(
        stalls
          .map(stall => stall.stallNumber)
          .filter(Boolean)
      )
    ).sort((first, second) =>
      collator.compare(first, second)
    );
  }, [stalls, collator]);

  // Unique Status options
  const statusOptions = useMemo(() => {
    return Array.from(
      new Set(
        stalls
          .map(stall => stall.currentStatus)
          .filter(Boolean)
      )
    ).sort((first, second) =>
      collator.compare(first, second)
    );
  }, [stalls, collator]);

  // Search + Dropdown filters
  const filteredStalls = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return stalls.filter(stall => {
      const matchesSearch =
        !normalizedSearch ||
        [
          stall.stallNumber,
          stall.stallSizeCode,
          stall.stallSizeName,
          stall.currentStatus
        ]
          .filter(Boolean)
          .some(value =>
            value
              .toLowerCase()
              .includes(normalizedSearch)
          );

      const matchesStallSize =
        !selectedStallSizeId ||
        stall.stallSizeId === selectedStallSizeId;

      const matchesStallNumber =
        !selectedStallNumber ||
        stall.stallNumber === selectedStallNumber;

      const matchesStatus =
        !selectedStatus ||
        stall.currentStatus === selectedStatus;

      return (
        matchesSearch &&
        matchesStallSize &&
        matchesStallNumber &&
        matchesStatus
      );
    });
  }, [
    stalls,
    search,
    selectedStallSizeId,
    selectedStallNumber,
    selectedStatus
  ]);

  // Sort filtered records
  const sortedStalls = useMemo(() => {
    return [...filteredStalls].sort((first, second) => {
      const firstValue = first[sortField] ?? '';
      const secondValue = second[sortField] ?? '';

      const comparison = collator.compare(
        String(firstValue),
        String(secondValue)
      );

      return sortDirection === 'asc'
        ? comparison
        : -comparison;
    });
  }, [
    filteredStalls,
    sortField,
    sortDirection,
    collator
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedStalls.length / rowsPerPage)
  );

  /*
   * Filter, search அல்லது rows count change ஆனால்
   * pagination first page-க்கு வரும்.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    selectedStallSizeId,
    selectedStallNumber,
    selectedStatus,
    rowsPerPage
  ]);

  // Records குறைந்தால் current page correct செய்யும்
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Current page records
  const paginatedStalls = useMemo(() => {
    const startIndex =
      (currentPage - 1) * rowsPerPage;

    const endIndex = startIndex + rowsPerPage;

    return sortedStalls.slice(
      startIndex,
      endIndex
    );
  }, [
    sortedStalls,
    currentPage,
    rowsPerPage
  ]);

  const startRecord =
    sortedStalls.length === 0
      ? 0
      : (currentPage - 1) * rowsPerPage + 1;

  const endRecord = Math.min(
    currentPage * rowsPerPage,
    sortedStalls.length
  );

  // Limited pagination numbers with ellipsis
  const paginationItems = useMemo(() => {
    const pages = new Set<number>();

    pages.add(1);
    pages.add(totalPages);
    pages.add(currentPage);
    pages.add(currentPage - 1);
    pages.add(currentPage + 1);

    return Array.from(pages)
      .filter(
        page => page >= 1 && page <= totalPages
      )
      .sort(
        (first, second) => first - second
      );
  }, [currentPage, totalPages]);

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedStallSizeId !== '' ||
    selectedStallNumber !== '' ||
    selectedStatus !== '';

  const clearFilters = () => {
    setSearch('');
    setSelectedStallSizeId('');
    setSelectedStallNumber('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    const safePage = Math.min(
      Math.max(page, 1),
      totalPages
    );

    setCurrentPage(safePage);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(previous =>
        previous === 'asc' ? 'desc' : 'asc'
      );
    } else {
      setSortField(field);
      setSortDirection('asc');
    }

    setCurrentPage(1);
  };

  const getSortIcon = (
    field: SortField
  ) => {
    if (sortField !== field) {
      return '↕';
    }

    return sortDirection === 'asc'
      ? '▲'
      : '▼';
  };

  const getSortIconClass = (
    field: SortField
  ) => {
    return sortField === field
      ? 'text-blue-600'
      : 'text-slate-400';
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Sponsor Stalls
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Stalls marked as Sponsor — proforma
            invoices for these use HSN 998397.
          </p>
        </div>
        <RefreshListButton onRefresh={() => queryClient.invalidateQueries({ queryKey: SPONSOR_STALLS_KEY })} />
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs uppercase text-slate-500">
            Total Sponsor Stalls
          </p>

          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {stalls.length}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs uppercase text-slate-500">
            Filtered Results
          </p>

          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {filteredStalls.length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mt-6 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <input
            className="input w-full"
            placeholder="Search stall, size or status"
            value={search}
            onChange={event =>
              setSearch(event.target.value)
            }
          />

          {/* Stall Size filter */}
          <select
            className="input w-full"
            value={selectedStallSizeId}
            onChange={event =>
              setSelectedStallSizeId(
                event.target.value
              )
            }
          >
            <option value="">
              All Stall Sizes
            </option>

            {stallSizeOptions.map(size => (
              <option
                key={size.id}
                value={size.id}
              >
                {size.name}
              </option>
            ))}
          </select>

          {/* Stall Name/Number filter */}
          <select
            className="input w-full"
            value={selectedStallNumber}
            onChange={event =>
              setSelectedStallNumber(
                event.target.value
              )
            }
          >
            <option value="">
              All Stall Names
            </option>

            {stallNumberOptions.map(
              stallNumber => (
                <option
                  key={stallNumber}
                  value={stallNumber}
                >
                  {stallNumber}
                </option>
              )
            )}
          </select>

          {/* Status filter */}
          <select
            className="input w-full"
            value={selectedStatus}
            onChange={event =>
              setSelectedStatus(
                event.target.value
              )
            }
          >
            <option value="">
              All Statuses
            </option>

            {statusOptions.map(status => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className="mt-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear Filters
        </button>
      </div>

      {/* Table */}
      <div className="card mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-4">
                  <button
                    type="button"
                    onClick={() =>
                      handleSort('stallNumber')
                    }
                    className="flex cursor-pointer items-center gap-1 font-semibold uppercase transition hover:text-blue-600"
                  >
                    Stall Number

                    <span
                      className={getSortIconClass(
                        'stallNumber'
                      )}
                    >
                      {getSortIcon(
                        'stallNumber'
                      )}
                    </span>
                  </button>
                </th>

                <th className="p-4">
                  <button
                    type="button"
                    onClick={() =>
                      handleSort(
                        'stallSizeName'
                      )
                    }
                    className="flex cursor-pointer items-center gap-1 font-semibold uppercase transition hover:text-blue-600"
                  >
                    Stall Size

                    <span
                      className={getSortIconClass(
                        'stallSizeName'
                      )}
                    >
                      {getSortIcon(
                        'stallSizeName'
                      )}
                    </span>
                  </button>
                </th>

                <th className="p-4">
                  <button
                    type="button"
                    onClick={() =>
                      handleSort(
                        'currentStatus'
                      )
                    }
                    className="flex cursor-pointer items-center gap-1 font-semibold uppercase transition hover:text-blue-600"
                  >
                    Status

                    <span
                      className={getSortIconClass(
                        'currentStatus'
                      )}
                    >
                      {getSortIcon(
                        'currentStatus'
                      )}
                    </span>
                  </button>
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={3}
                    className="p-10 text-center text-sm text-slate-500"
                  >
                    Loading sponsor stalls...
                  </td>
                </tr>
              )}

              {!isLoading &&
                paginatedStalls.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-10 text-center text-sm text-slate-500"
                    >
                      No sponsor stalls found.
                    </td>
                  </tr>
                )}

              {!isLoading &&
                paginatedStalls.map(stall => (
                  <tr
                    key={stall.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="p-4 font-bold text-slate-900">
                      {stall.stallNumber}
                    </td>

                    <td className="p-4 text-slate-600">
                      {stall.stallSizeName}
                    </td>

                    <td className="p-4">
                      <StatusBadge
                        value={
                          stall.currentStatus
                        }
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading &&
          filteredStalls.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span>
                  Showing{' '}
                  <strong>
                    {startRecord}–{endRecord}
                  </strong>{' '}
                  of{' '}
                  <strong>
                    {filteredStalls.length}
                  </strong>
                </span>

                <label className="flex items-center gap-2">
                  <span className="uppercase">
                    Rows
                  </span>

                  <select
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500"
                    value={rowsPerPage}
                    onChange={event =>
                      setRowsPerPage(
                        Number(
                          event.target.value
                        )
                      )
                    }
                  >
                    <option value={5}>5</option>
                    <option value={10}>
                      10
                    </option>
                    <option value={20}>
                      20
                    </option>
                    <option value={50}>
                      50
                    </option>
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-1">
                {/* First page */}
                <button
                  type="button"
                  className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-slate-200 px-2 text-sm text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={currentPage === 1}
                  onClick={() =>
                    goToPage(1)
                  }
                  title="First page"
                >
                  «
                </button>

                {/* Previous page */}
                <button
                  type="button"
                  className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-slate-200 px-2 text-sm text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={currentPage === 1}
                  onClick={() =>
                    goToPage(
                      currentPage - 1
                    )
                  }
                  title="Previous page"
                >
                  ‹
                </button>

                {paginationItems.map(
                  (page, index) => {
                    const previousPage =
                      paginationItems[
                      index - 1
                      ];

                    const showEllipsis =
                      index > 0 &&
                      page -
                      previousPage >
                      1;

                    return (
                      <div
                        key={page}
                        className="flex items-center gap-1"
                      >
                        {showEllipsis && (
                          <span className="px-1 text-slate-400">
                            ...
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            goToPage(page)
                          }
                          className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-semibold ${currentPage ===
                              page
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                          {page}
                        </button>
                      </div>
                    );
                  }
                )}

                {/* Next page */}
                <button
                  type="button"
                  className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-slate-200 px-2 text-sm text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={
                    currentPage === totalPages
                  }
                  onClick={() =>
                    goToPage(
                      currentPage + 1
                    )
                  }
                  title="Next page"
                >
                  ›
                </button>
                a
                {/* Last page */}
                <button
                  type="button"
                  className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-slate-200 px-2 text-sm text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={
                    currentPage === totalPages
                  }
                  onClick={() =>
                    goToPage(totalPages)
                  }
                  title="Last page"
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