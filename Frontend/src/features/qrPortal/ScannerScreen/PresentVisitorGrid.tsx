import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  Users,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { apiClient } from '../../../data/api/apiClient';

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const EVENT_ID = '22222222-2222-2222-2222-222222222222';

interface PresentVisitor {
  id: string;
  registrationNumber: string;
  legalName: string;
  contactPersonName: string;
  city: string;
  district: string;
  checkedInAt: string | null;
}

type SortField = 'registrationNumber' | 'legalName' | 'contactPersonName' | 'city' | 'district' | 'checkedInAt';
type SortOrder = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function formatTime(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

interface Props {
  refreshSignal?: number;
}

export default function PresentVisitorsGrid({ refreshSignal }: Props) {
  const [visitors, setVisitors] = useState<PresentVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('checkedInAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const load = useCallback(() => {
    setLoading(true);
    apiClient
      .get<any[]>(`/visitors/present?tenantId=${TENANT_ID}&eventId=${EVENT_ID}`)
      .then((rows) => {
        const mapped: PresentVisitor[] = rows.map((r) => ({
          id: r.id ?? r.Id,
          registrationNumber: r.registrationNumber ?? r.RegistrationNumber,
          legalName: r.legalName ?? r.LegalName,
          contactPersonName: r.contactPersonName ?? r.ContactPersonName,
          city: r.city ?? r.City,
          district: r.district ?? r.District,
          checkedInAt: r.checkedInAt ?? r.CheckedInAt ?? null
        }));
        setVisitors(mapped);
        setError(null);
      })
      .catch(() => setError('Unable to load present list.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshSignal]);

  // Light polling so the grid stays current while it's open
  useEffect(() => {
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  // Handle Header Click for Sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter & Sort Logic
  const processedVisitors = useMemo(() => {
    const q = query.trim().toLowerCase();
    
    // 1. Filter
    const filtered = visitors.filter((v) => {
      if (!q) return true;
      return (
        v.registrationNumber?.toLowerCase().includes(q) ||
        v.legalName?.toLowerCase().includes(q) ||
        v.contactPersonName?.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q) ||
        v.district?.toLowerCase().includes(q)
      );
    });

    // 2. Sort
    return filtered.sort((a, b) => {
      let aVal = a[sortField] ?? '';
      let bVal = b[sortField] ?? '';

      // Handle Date sorting specifically
      if (sortField === 'checkedInAt') {
        const aTime = aVal ? new Date(aVal as string).getTime() : 0;
        const bTime = bVal ? new Date(bVal as string).getTime() : 0;
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      }

      // Handle string sorting
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [visitors, query, sortField, sortOrder]);

  // ---------------------------------------------------------
  // PAGINATION LOGIC
  // ---------------------------------------------------------
  const totalItems = processedVisitors.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Reset to page 1 whenever search/sort/page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query, sortField, sortOrder, pageSize]);

  // Clamp current page if a poll/refresh shrinks the result set
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedVisitors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedVisitors.slice(start, start + pageSize);
  }, [processedVisitors, currentPage, pageSize]);

  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalItems);

  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    const delta = 1;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== 'ellipsis') {
        pages.push('ellipsis');
      }
    }
    return pages;
  }, [totalPages, currentPage]);

  // Helper for rendering column header sort icons
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 ml-1 inline-block" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-slate-800 ml-1 inline-block" />
    ) : (
      <ArrowDown className="w-3 h-3 text-slate-800 ml-1 inline-block" />
    );
  };

  return (
    <div className="flex flex-col h-full border border-slate-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 text-slate-700">
          <Users className="w-4 h-4" />
          <span className="text-sm font-semibold">Present</span>
          <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
            {query ? `${processedVisitors.length} / ${visitors.length}` : visitors.length}
          </span>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded text-slate-700 bg-white border border-slate-200 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs"
          title="Refresh List"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      <div className="px-3 pt-3 pb-2 bg-white border-b border-slate-200 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, reg no, contact, city..."
            className="w-full pl-8 pr-8 py-2 text-xs bg-white border border-slate-300 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="px-2 py-2 text-xs bg-white border border-slate-300 rounded text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-auto">
        {error && (
          <p className="text-xs text-slate-500 text-center py-4">{error}</p>
        )}

        {!error && !loading && visitors.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16 text-slate-400">
            <Users className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs">No one checked in yet. Scan a visitor QR to mark them present.</p>
          </div>
        )}

        {!error && !loading && visitors.length > 0 && processedVisitors.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16 text-slate-400">
            <Search className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs">No match for "{query}".</p>
          </div>
        )}

        {paginatedVisitors.length > 0 && (
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th 
                  onClick={() => handleSort('registrationNumber')}
                  className="px-3 py-2 font-medium cursor-pointer hover:bg-slate-100 select-none transition group"
                >
                  <div className="flex items-center">
                    <span>Reg No</span>
                    {renderSortIcon('registrationNumber')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('legalName')}
                  className="px-3 py-2 font-medium cursor-pointer hover:bg-slate-100 select-none transition group"
                >
                  <div className="flex items-center">
                    <span>Legal Name</span>
                    {renderSortIcon('legalName')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('contactPersonName')}
                  className="px-3 py-2 font-medium cursor-pointer hover:bg-slate-100 select-none transition group"
                >
                  <div className="flex items-center">
                    <span>Contact Person</span>
                    {renderSortIcon('contactPersonName')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('city')}
                  className="px-3 py-2 font-medium cursor-pointer hover:bg-slate-100 select-none transition group"
                >
                  <div className="flex items-center">
                    <span>City</span>
                    {renderSortIcon('city')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('district')}
                  className="px-3 py-2 font-medium cursor-pointer hover:bg-slate-100 select-none transition group"
                >
                  <div className="flex items-center">
                    <span>District</span>
                    {renderSortIcon('district')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('checkedInAt')}
                  className="px-3 py-2 font-medium cursor-pointer hover:bg-slate-100 select-none transition group"
                >
                  <div className="flex items-center">
                    <span>Checked In</span>
                    {renderSortIcon('checkedInAt')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedVisitors.map((v, idx) => (
                <tr
                  key={v.id}
                  className={`border-b border-slate-100 ${idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'} hover:bg-slate-100`}
                >
                  <td className="px-3 py-2 font-semibold text-slate-700 whitespace-nowrap">
                    {v.registrationNumber}
                  </td>
                  <td className="px-3 py-2 text-slate-800">{v.legalName}</td>
                  <td className="px-3 py-2 text-slate-600">{v.contactPersonName}</td>
                  <td className="px-3 py-2 text-slate-600">{v.city}</td>
                  <td className="px-3 py-2 text-slate-600">{v.district}</td>
                  <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                    {formatTime(v.checkedInAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-3 py-2 bg-white">
          <p className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
            {rangeStart}–{rangeEnd} of {totalItems}
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              aria-label="First page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {pageNumbers.map((p, i) =>
              p === 'ellipsis' ? (
                <span key={`ellipsis-${i}`} className="px-1 text-slate-400 text-[11px]">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`min-w-[24px] px-1.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                    p === currentPage
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              aria-label="Last page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}