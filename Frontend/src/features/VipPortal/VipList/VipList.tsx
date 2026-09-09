import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Crown,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  UserX,
  BadgeCheck,
  RefreshCw,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink
} from 'lucide-react';
import { apiClient } from '../../../data/api/apiClient';

// ==========================================
// TYPES
// ==========================================
export interface Props {
  tenantId: string;
  eventId: string;
}

export interface VipRecord {
  id?: string;
  tenantId: string;
  eventId: string;
  registrationNumber: string;
  legalName: string;
  organization: string;
  tradeName?: string;
  registeredAddress: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  country: string;
  contactPersonName: string;
  contactPersonDesignation: string;
  mobile: string;
  alternateMobile?: string;
  email: string;
  alternateEmail?: string;
  website?: string;
  industryScale: string;
  businessType: string;
  companyConstitution: string;
  industryCategory: string;
  productServiceDescription: string;
  productKeywords: string;
  declarantName: string;
  declarantDesignation: string;
  declarationDate: string;
  termsAccepted: boolean;
  accuracyAccepted: boolean;
  paymentTimelineAccepted: boolean;
  isPresent?: boolean;
  checkedInAt?: string;
}

type SortField = 'registrationNumber' | 'contactPersonName' | 'organization' | 'city' | 'isPresent';
type SortOrder = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ==========================================
// COMPONENT
// ==========================================
export const VipListScreen: React.FC<Props> = ({ tenantId, eventId }) => {
  const navigate = useNavigate();
  const [vips, setVips] = useState<VipRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('registrationNumber');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // ---------------------------------------------------------
  // API FETCH
  // ---------------------------------------------------------
  const fetchVipList = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(
        `/vips?tenantId=${tenantId}&eventId=${eventId}`
      );

      if (!res) throw new Error('Failed to load VIP records');
      setVips(res as VipRecord[]);
    } catch (err: any) {
      setError(err.message || 'Error fetching VIP list from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId && eventId) {
      fetchVipList();
    }
  }, [tenantId, eventId]);

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ---------------------------------------------------------
  // NAVIGATION HANDLER
  // ---------------------------------------------------------
  const handleSelectVip = (item: VipRecord) => {
    if (item.registrationNumber) {
      navigate(`/vipverification/${encodeURIComponent(item.registrationNumber)}`);
    }
  };

  // ---------------------------------------------------------
  // SORT HANDLER
  // ---------------------------------------------------------
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // ---------------------------------------------------------
  // SEARCH, FILTER & SORT LOGIC
  // ---------------------------------------------------------
  const processedVips = useMemo(() => {
    const filtered = vips.filter((item) => {
      const matchesSearch =
        (item.contactPersonName && item.contactPersonName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.legalName && item.legalName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.registrationNumber && item.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.city && item.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.contactPersonDesignation && item.contactPersonDesignation.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'CHECKED_IN' && item.isPresent) ||
        (statusFilter === 'PENDING' && !item.isPresent);

      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      let aVal = a[sortField] ?? '';
      let bVal = b[sortField] ?? '';

      //@ts-ignore
      if (typeof aVal === 'boolean') aVal = aVal ? 1 : 0;
      //@ts-ignore
      if (typeof bVal === 'boolean') bVal = bVal ? 1 : 0;

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [vips, searchTerm, statusFilter, sortField, sortOrder]);

  // ---------------------------------------------------------
  // PAGINATION LOGIC
  // ---------------------------------------------------------
  const totalItems = processedVips.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortField, sortOrder, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedVips = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedVips.slice(start, start + pageSize);
  }, [processedVips, currentPage, pageSize]);

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

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 ml-1 inline-block" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-indigo-600 ml-1 inline-block" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-600 ml-1 inline-block" />
    );
  };

  // ---------------------------------------------------------
  // RENDER STATES
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Fetching VIP Directory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 m-6 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchVipList}
          className="px-3 py-1 bg-white border border-red-200 rounded-md font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6 text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" />
            VIP Directory & Pass Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Click on any VIP record to view and download their badge pass.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchVipList}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh List
          </button>
          <span className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
            {processedVips.length} VIP Records
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search VIP name, reg no, company, designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium cursor-pointer"
          >
            <option value="ALL">All Attendance Status</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="PENDING">Pending Arrival</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-10"></th>
                
                <th 
                  onClick={() => handleSort('registrationNumber')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 select-none transition-colors group"
                >
                  <div className="flex items-center">
                    <span>Pass / Reg No.</span>
                    {renderSortIcon('registrationNumber')}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('contactPersonName')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 select-none transition-colors group"
                >
                  <div className="flex items-center">
                    <span>VIP Details</span>
                    {renderSortIcon('contactPersonName')}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('organization')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 select-none transition-colors group"
                >
                  <div className="flex items-center">
                    <span>Organization</span>
                    {renderSortIcon('organization')}
                  </div>
                </th>

                <th 
                  onClick={() => handleSort('city')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 select-none transition-colors group"
                >
                  <div className="flex items-center">
                    <span>Location</span>
                    {renderSortIcon('city')}
                  </div>
                </th>

                <th className="py-3 px-4">Category</th>

                <th 
                  onClick={() => handleSort('isPresent')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 select-none transition-colors group text-center"
                >
                  <div className="flex items-center justify-center">
                    <span>Check-In Status</span>
                    {renderSortIcon('isPresent')}
                  </div>
                </th>

                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedVips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No VIP records found.
                  </td>
                </tr>
              ) : (
                paginatedVips.map((item, index) => {
                  const rowId = item.id || `${item.registrationNumber}-${index}`;
                  const isExpanded = !!expandedRows[rowId];

                  return (
                    <React.Fragment key={rowId}>
                      <tr 
                        onClick={() => handleSelectVip(item)}
                        className={`hover:bg-slate-50/90 transition-colors cursor-pointer group ${
                          isExpanded ? 'bg-indigo-50/30' : ''
                        }`}
                      >
                        <td 
                          className="py-3.5 px-4 text-slate-400"
                          onClick={(e) => toggleRow(rowId, e)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                          )}
                        </td>

                        {/* Registration Number */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 group-hover:bg-indigo-100/70 transition-colors">
                            {item.registrationNumber || 'PENDING'}
                          </span>
                        </td>

                        {/* VIP Details */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {item.contactPersonName}
                            <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
                          </div>
                          <div className="text-[11px] text-slate-500">{item.contactPersonDesignation}</div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">{item.mobile}</div>
                        </td>

                        {/* Organization */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{item.organization || item.legalName}</div>
                          {item.tradeName && (
                            <div className="text-[11px] text-slate-500">DBA: {item.tradeName}</div>
                          )}
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800">{item.city}, {item.state}</div>
                          <div className="text-[11px] text-slate-400">{item.pincode}</div>
                        </td>

                        {/* Category Tag */}
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                            {item.industryScale || 'VIP'}
                          </span>
                        </td>

                        {/* Check-In Status */}
                        <td className="py-3.5 px-4 text-center">
                          {item.isPresent ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                              <UserX className="w-3.5 h-3.5" /> Pending
                            </span>
                          )}
                        </td>

                        {/* View Pass Action */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectVip(item);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                          >
                            <span>Pass</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-indigo-50/20">
                          <td colSpan={8} className="p-4 border-t border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              <div>
                                <p className="font-semibold text-slate-500 uppercase text-[10px]">Full Address</p>
                                <p className="text-slate-800 mt-0.5">{item.registeredAddress || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-slate-500 uppercase text-[10px]">Email Address</p>
                                <p className="text-slate-800 mt-0.5">{item.email || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-slate-500 uppercase text-[10px]">Business Type & Industry</p>
                                <p className="text-slate-800 mt-0.5">{item.businessType || 'N/A'} - {item.industryCategory || 'N/A'}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 bg-slate-50">
            <p className="text-[11px] text-slate-500 font-medium">
              Showing <span className="font-semibold text-slate-700">{rangeStart}</span>–
              <span className="font-semibold text-slate-700">{rangeEnd}</span> of{' '}
              <span className="font-semibold text-slate-700">{totalItems}</span> records
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="First page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {pageNumbers.map((p, i) =>
                p === 'ellipsis' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-[11px]">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`min-w-[28px] px-2 py-1.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      p === currentPage
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Last page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
