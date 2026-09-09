import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import {
  Column,
  DataTable,
} from '../../../../components/data-display/DataTable';

import { Button } from '../../../../components/ui/Button';
import { RefreshListButton } from '../../../../shared/components/RefreshListButton';

import {
  LoadingState,
  ErrorState,
  EmptyState,
} from '../../../../components/ui/PageStates';

import { useRequirements } from '../../../../services/buyer/hooks';

import { ScreenShell } from '../shared/ScreenShell';

import { StatusBadge } from '../../../../components/ui/StatusBadge';

import { Requirement } from '../../../../domain/models/buyer';

import { useRequirementWizard } from './wizard/requirementWizardStore';

const ITEMS_PER_PAGE = 5;

/**
 * Normalize values before comparing them.
 *
 * Examples:
 * "PUBLISHED" -> "published"
 * "Published" -> "published"
 * " Published " -> "published"
 */
const normalize = (value?: string | null): string => {
  return (value ?? '').trim().toLowerCase();
};

export default function RequirementsPage() {
  const nav = useNavigate();

  const q = useRequirements();

  const [sp, setSp] = useSearchParams();

  const [currentPage, setCurrentPage] = useState(1);

  const resetWizard = useRequirementWizard(
    (state) => state.reset
  );

  /**
   * URL filters
   */
  const search = sp.get('search') ?? '';
  const status = sp.get('status') ?? '';
  const category = sp.get('category') ?? '';

  /**
   * Create new requirement
   */
  const handleCreateNew = () => {
    resetWizard();

    nav('/buyer/requirements/new/basic');
  };

  /**
   * Update URL filter and reset pagination.
   */
  const updateFilter = (
    key: string,
    value: string
  ) => {
    const updated = new URLSearchParams(sp);

    const trimmedValue = value.trim();

    if (trimmedValue) {
      updated.set(key, trimmedValue);
    } else {
      updated.delete(key);
    }

    setSp(updated);

    setCurrentPage(1);
  };

  /**
   * Extract all available categories from API data.
   *
   * We don't hard-code categories because your API can
   * contain many different categories.
   */
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();

    (q.data ?? []).forEach((r) => {
      if (r.category?.trim()) {
        uniqueCategories.add(r.category.trim());
      }
    });

    return Array.from(uniqueCategories).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [q.data]);

  /**
   * Filter requirements.
   */
  const filteredRows = useMemo(() => {
    const normalizedSearch = normalize(search);
    const normalizedStatus = normalize(status);
    const normalizedCategory = normalize(category);

    return (q.data ?? []).filter((r) => {
      /**
       * -------------------------
       * SEARCH
       * -------------------------
       *
       * Search across:
       * - Requirement code
       * - Title
       * - Category
       * - Subcategory
       * - Description
       */
      const searchableText = [
        r.code,
        r.title,
        r.category,
        r.subcategory,
        r.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(normalizedSearch);

      /**
       * -------------------------
       * STATUS
       * -------------------------
       *
       * API may return:
       * PUBLISHED
       * Published
       * published
       * ACTIVE
       *
       * Convert all to lowercase.
       *
       * Active is treated as Published.
       */
      let requirementStatus = normalize(r.status);

      if (requirementStatus === 'active') {
        requirementStatus = 'published';
      }

      const matchesStatus =
        !normalizedStatus ||
        requirementStatus === normalizedStatus;

      /**
       * -------------------------
       * CATEGORY
       * -------------------------
       */
      const requirementCategory =
        normalize(r.category);

      const matchesCategory =
        !normalizedCategory ||
        requirementCategory === normalizedCategory;

      /**
       * Requirement must satisfy ALL filters.
       */
      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory
      );
    });
  }, [
    q.data,
    search,
    status,
    category,
  ]);

  /**
   * -------------------------
   * PAGINATION
   * -------------------------
   */
  const totalItems = filteredRows.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / ITEMS_PER_PAGE)
  );

  /**
   * If filtering reduces the number of pages,
   * move the user back to the last valid page.
   */
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const startIndex =
    (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedRows = filteredRows.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  /**
   * -------------------------
   * LOADING / ERROR
   * -------------------------
   */
  if (q.isLoading) {
    return <LoadingState />;
  }

  if (q.isError) {
    return (
      <ErrorState
        error={q.error}
        retry={() => q.refetch()}
      />
    );
  }

  /**
   * -------------------------
   * TABLE COLUMNS
   * -------------------------
   */
  const cols: Column<Requirement>[] = [
    {
      key: 'code',
      header: 'Req ID',

      cell: (r) => (
        <Link
          className="font-extrabold text-brand-600"
          to={`/buyer/requirements/${r.id}/summary`}
        >
          {r.code}
        </Link>
      ),
    },

    {
      key: 'title',
      header: 'Title / Category',

      cell: (r) => (
        <div>
          <b>{r.title}</b>

          <div className="text-[10px] text-slate-400">
            {r.category}

            {r.subcategory
              ? ` · ${r.subcategory}`
              : ''}
          </div>
        </div>
      ),
    },

    {
      key: 'status',
      header: 'Status',

      cell: (r) => {
        const displayStatus =
          normalize(r.status) === 'active'
            ? 'Published'
            : r.status;

        return (
          <StatusBadge
            status={displayStatus}
          />
        );
      },
    },

    {
      key: 'matches',
      header: 'Matches',

      cell: (r) => (
        <Link
          className="font-bold text-brand-600"
          to={`/buyer/requirements/${r.id}/matches`}
        >
          {r.matchCount ?? 0} Matches
        </Link>
      ),
    },

    {
      key: 'updated',
      header: 'Updated',

      cell: (r) => r.updatedAt,
    },

    {
      key: 'action',
      header: 'Actions',

      cell: (r) => (
        <div className="flex items-center gap-2">
          <Link
            className="text-xs font-bold text-slate-700 hover:text-brand-600 transition"
            to={`/buyer/requirements/${r.id}/summary`}
          >
            View →
          </Link>
          <button
            type="button"
            onClick={() => {
              nav(`/buyer/requirements/${r.id}/basic`);
            }}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50/40 transition shadow-2xs"
          >
            Edit
          </button>
        </div>
      ),
    },
  ];

  /**
   * -------------------------
   * KPI COUNTS
   * -------------------------
   */
  const publishedCount =
    (q.data ?? []).filter((x) => {
      const value = normalize(x.status);

      return (
        value === 'published' ||
        value === 'active'
      );
    }).length;

  const draftCount =
    (q.data ?? []).filter(
      (x) =>
        normalize(x.status) === 'draft'
    ).length;

  const totalMatches =
    (q.data ?? []).reduce(
      (total, item) =>
        total + (item.matchCount ?? 0),
      0
    );

  /**
   * -------------------------
   * PAGE
   * -------------------------
   */
  return (
    <ScreenShell
      screen={6}
      title="My Requirements"
      subtitle="Create, track and manage all your purchasing requirements."
      actions={
        <div className="flex items-center gap-2">
          <RefreshListButton onRefresh={() => q.refetch()} />
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4" />

            Create New Requirement
          </Button>
        </div>
      }
    >
      {/* =========================================
          FILTERS
      ========================================== */}

      <div className="card mb-4 grid gap-3 p-3 md:grid-cols-[1fr_12rem_12rem]">

        {/* SEARCH */}

        <label className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />

          <input
            className="input-base pl-9"
            placeholder="Search requirements"
            value={search}
            onChange={(e) =>
              updateFilter(
                'search',
                e.target.value
              )
            }
            aria-label="Search requirements"
          />
        </label>

        {/* STATUS */}

        <select
          className="input-base"
          value={normalize(status)}
          onChange={(e) =>
            updateFilter(
              'status',
              e.target.value
            )
          }
          aria-label="Filter by status"
        >
          <option value="">
            All Statuses
          </option>

          <option value="published">
            Published
          </option>

          <option value="draft">
            Draft
          </option>
        </select>

        {/* CATEGORY */}

        <select
          className="input-base"
          value={category}
          onChange={(e) =>
            updateFilter(
              'category',
              e.target.value
            )
          }
          aria-label="Filter by category"
        >
          <option value="">
            All Categories
          </option>

          {categories.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>
      </div>

      {/* =========================================
          KPI STATS
      ========================================== */}

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">

        <div className="card p-3">
          <div className="text-xl font-extrabold">
            {q.data?.length ?? 0}
          </div>

          <div className="text-[10px] font-bold text-slate-500">
            Total
          </div>
        </div>

        <div className="card p-3">
          <div className="text-xl font-extrabold">
            {publishedCount}
          </div>

          <div className="text-[10px] font-bold text-slate-500">
            Published
          </div>
        </div>

        <div className="card p-3">
          <div className="text-xl font-extrabold">
            {draftCount}
          </div>

          <div className="text-[10px] font-bold text-slate-500">
            Draft
          </div>
        </div>

        <div className="card p-3">
          <div className="text-xl font-extrabold">
            {totalMatches}
          </div>

          <div className="text-[10px] font-bold text-slate-500">
            Total Matches
          </div>
        </div>
      </div>

      {/* =========================================
          FILTER RESULT INFO
      ========================================== */}

      {(search || status || category) && (
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {totalItems}{' '}
            {totalItems === 1
              ? 'requirement'
              : 'requirements'}{' '}
            found
          </div>

          <button
            type="button"
            className="text-xs font-bold text-brand-600 hover:underline"
            onClick={() => {
              setSp(new URLSearchParams());
              setCurrentPage(1);
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* =========================================
          TABLE
      ========================================== */}

      {paginatedRows.length > 0 ? (
        <div className="space-y-4">

          <DataTable
            rows={paginatedRows}
            columns={cols}
            caption="Buyer requirements"
          />

          {/* =====================================
              PAGINATION
          ====================================== */}

          {totalPages > 1 && (
            <div className="card flex items-center justify-between p-3">

              <span className="text-xs text-slate-500">
                Showing{' '}
                {startIndex + 1}
                –
                {Math.min(
                  startIndex +
                    ITEMS_PER_PAGE,
                  totalItems
                )}{' '}
                of {totalItems}
              </span>

              <div className="flex items-center gap-1.5">

                {/* PREVIOUS */}

                <button
                  type="button"
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(
                          page - 1,
                          1
                        )
                    )
                  }
                  className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* CURRENT PAGE */}

                <span className="px-2 text-xs font-semibold text-slate-700">
                  {currentPage} / {totalPages}
                </span>

                {/* NEXT */}

                <button
                  type="button"
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.min(
                          page + 1,
                          totalPages
                        )
                    )
                  }
                  className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          message={
            search ||
            status ||
            category
              ? 'No requirements match the selected filters. Try changing or clearing your filters.'
              : 'Create a new sourcing requirement to get started.'
          }
        />
      )}
    </ScreenShell>
  );
}