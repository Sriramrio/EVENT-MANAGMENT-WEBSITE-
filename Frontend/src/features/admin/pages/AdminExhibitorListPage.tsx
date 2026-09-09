import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Building2,
    Search,
    Phone,
    Mail,
    SlidersHorizontal,
    ChevronDown,
    X,
    RefreshCw,
    Eye,
    Download,
    MapPin,
    FileText,
    BadgeCheck,
    CreditCard,
    Briefcase,
    Store,
    Layers,
    Globe,
    Tag,
    ShieldCheck,
    ExternalLink,
    Users
} from 'lucide-react';
import { apiClient, ApiError } from '../../../data/api/apiClient';
import { PageHeader } from '../../../shared/components/PageHeader';
import { RefreshListButton } from '../../../shared/components/RefreshListButton';

export interface AdminExhibitor {
    id: string;
    legalName: string;
    tradeName: string | null;
    registeredAddress: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    country: string;
    contactPersonName: string;
    contactPersonDesignation: string;
    mobile: string;
    alternateMobile: string | null;
    email: string;
    alternateEmail: string | null;
    website: string | null;
    industryScale: string;
    businessType: string;
    companyConstitution: string;
    industryCategory: string;
    productServiceDescription: string;
    productKeywords: string;
    udyamNumber: string;
    tanNumber: string | null;
    gstin: string;
    pan: string;
    lubMember: boolean;
    lubState: string;
    lubChapter: string;
    lubMembershipNumber: string | null;
    companyLogo: string | null;
    bankAccountName: string | null;
    bankName: string | null;
    bankAccountNumber: string | null;
    bankIfscCode: string | null;
    createdAt: string;
    bookingId: string | null;
    bookingRegistrationNumber: string | null;
    bookingStatus: string | null;
    stallNumber: string | null;
    requestedStallSize: string | null;
    fasciaName: string | null;
    totalAmount: number | null;
    totalPaid: number | null;
    paymentStatus: string | null;
}

type SortKey =
    | 'sno'
    | 'legalName'
    | 'contactPersonName'
    | 'mobile'
    | 'city'
    | 'state'
    | 'industryCategory'
    | 'stallNumber'
    | 'gstin'
    | 'lubMember'
    | 'createdAt';

type SortDirection = 'asc' | 'desc';

const ADMIN_EXHIBITORS_QUERY_KEY = ['admin', 'exhibitors'] as const;

export function AdminExhibitorListPage() {
    const {
        data: exhibitors = [],
        isLoading: loading,
        isFetching,
        error: queryError,
        refetch,
    } = useQuery({
        queryKey: ADMIN_EXHIBITORS_QUERY_KEY,
        queryFn: () => apiClient.get<AdminExhibitor[]>('/admin/exhibitors'),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const error = queryError instanceof Error ? queryError.message : queryError ? 'Failed to load exhibitors.' : null;

    // Search & Filters State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedState, setSelectedState] = useState('ALL');
    const [lubFilter, setLubFilter] = useState<'ALL' | 'MEMBER' | 'NON_MEMBER'>('ALL');
    const [bookingFilter, setBookingFilter] = useState<'ALL' | 'BOOKED' | 'UNBOOKED'>('ALL');

    // Sorting State
    const [sortKey, setSortKey] = useState<SortKey>('legalName');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Pagination State
    const [pageSize, setPageSize] = useState<number>(10);
    const [page, setPage] = useState<number>(1);

    // View Details Modal State (Read-only)
    const [selectedExhibitor, setSelectedExhibitor] = useState<AdminExhibitor | null>(null);

    // Derived filter options
    const categories = useMemo(() => {
        const set = new Set<string>();
        exhibitors.forEach((e) => {
            if (e.industryCategory?.trim()) set.add(e.industryCategory.trim());
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [exhibitors]);

    const states = useMemo(() => {
        const set = new Set<string>();
        exhibitors.forEach((e) => {
            if (e.state?.trim()) set.add(e.state.trim());
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [exhibitors]);

    // Metrics
    const metrics = useMemo(() => {
        const total = exhibitors.length;
        const lubCount = exhibitors.filter((e) => e.lubMember).length;
        const withStalls = exhibitors.filter((e) => !!e.stallNumber).length;
        const bookedCount = exhibitors.filter((e) => !!e.bookingId).length;
        const uniqueCategories = categories.length;

        return { total, lubCount, withStalls, bookedCount, uniqueCategories };
    }, [exhibitors, categories]);

    // Filtering
    const filteredExhibitors = useMemo(() => {
        return exhibitors.filter((item) => {
            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matches =
                    (item.legalName || '').toLowerCase().includes(q) ||
                    (item.tradeName || '').toLowerCase().includes(q) ||
                    (item.contactPersonName || '').toLowerCase().includes(q) ||
                    (item.mobile || '').toLowerCase().includes(q) ||
                    (item.email || '').toLowerCase().includes(q) ||
                    (item.city || '').toLowerCase().includes(q) ||
                    (item.state || '').toLowerCase().includes(q) ||
                    (item.gstin || '').toLowerCase().includes(q) ||
                    (item.pan || '').toLowerCase().includes(q) ||
                    (item.udyamNumber || '').toLowerCase().includes(q) ||
                    (item.stallNumber || '').toLowerCase().includes(q) ||
                    (item.bookingRegistrationNumber || '').toLowerCase().includes(q) ||
                    (item.industryCategory || '').toLowerCase().includes(q);

                if (!matches) return false;
            }

            // Category filter
            if (selectedCategory !== 'ALL' && item.industryCategory !== selectedCategory) {
                return false;
            }

            // State filter
            if (selectedState !== 'ALL' && item.state !== selectedState) {
                return false;
            }

            // LUB Member filter
            if (lubFilter === 'MEMBER' && !item.lubMember) return false;
            if (lubFilter === 'NON_MEMBER' && item.lubMember) return false;

            // Booking filter
            if (bookingFilter === 'BOOKED' && !item.bookingId) return false;
            if (bookingFilter === 'UNBOOKED' && item.bookingId) return false;

            return true;
        });
    }, [exhibitors, searchQuery, selectedCategory, selectedState, lubFilter, bookingFilter]);

    // Sorting
    const sortedExhibitors = useMemo(() => {
        const list = [...filteredExhibitors];
        list.sort((a, b) => {
            let valA: any = a[sortKey as keyof AdminExhibitor] ?? '';
            let valB: any = b[sortKey as keyof AdminExhibitor] ?? '';

            if (sortKey === 'sno') {
                valA = a.legalName;
                valB = b.legalName;
            }

            if (typeof valA === 'boolean' && typeof valB === 'boolean') {
                valA = valA ? 1 : 0;
                valB = valB ? 1 : 0;
            }

            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortDirection === 'asc'
                    ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
                    : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
            }

            const numA = Number(valA);
            const numB = Number(valB);
            if (!isNaN(numA) && !isNaN(numB)) {
                return sortDirection === 'asc' ? numA - numB : numB - numA;
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [filteredExhibitors, sortKey, sortDirection]);

    // Pagination calculation
    const totalPages = Math.max(1, Math.ceil(sortedExhibitors.length / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const rangeStart = sortedExhibitors.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const rangeEnd = Math.min(safePage * pageSize, sortedExhibitors.length);
    const paginatedExhibitors = sortedExhibitors.slice(
        (safePage - 1) * pageSize,
        safePage * pageSize
    );

    const pageNumbers = useMemo(() => {
        const pages: number[] = [];
        const maxVisible = 5;
        let start = Math.max(1, safePage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    }, [safePage, totalPages]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
        setPage(1);
    };

    // Export to CSV
    const handleExportCsv = () => {
        if (sortedExhibitors.length === 0) return;

        const headers = [
            'Legal Name',
            'Trade Name',
            'Contact Person',
            'Designation',
            'Mobile',
            'Email',
            'City',
            'District',
            'State',
            'Pincode',
            'Industry Category',
            'Industry Scale',
            'Business Type',
            'Constitution',
            'GSTIN',
            'PAN',
            'Udyam Number',
            'LUB Member',
            'LUB Chapter',
            'LUB State',
            'Booking Reg Number',
            'Stall Number',
            'Stall Size',
            'Booking Status',
            'Total Amount',
            'Total Paid',
            'Payment Status',
            'Bank Name',
            'Account Number',
            'IFSC Code'
        ];

        const rows = sortedExhibitors.map((e) => [
            `"${(e.legalName || '').replace(/"/g, '""')}"`,
            `"${(e.tradeName || '').replace(/"/g, '""')}"`,
            `"${(e.contactPersonName || '').replace(/"/g, '""')}"`,
            `"${(e.contactPersonDesignation || '').replace(/"/g, '""')}"`,
            `"${e.mobile || ''}"`,
            `"${e.email || ''}"`,
            `"${(e.city || '').replace(/"/g, '""')}"`,
            `"${(e.district || '').replace(/"/g, '""')}"`,
            `"${(e.state || '').replace(/"/g, '""')}"`,
            `"${e.pincode || ''}"`,
            `"${(e.industryCategory || '').replace(/"/g, '""')}"`,
            `"${(e.industryScale || '').replace(/"/g, '""')}"`,
            `"${(e.businessType || '').replace(/"/g, '""')}"`,
            `"${(e.companyConstitution || '').replace(/"/g, '""')}"`,
            `"${e.gstin || ''}"`,
            `"${e.pan || ''}"`,
            `"${e.udyamNumber || ''}"`,
            `"${e.lubMember ? 'Yes' : 'No'}"`,
            `"${(e.lubChapter || '').replace(/"/g, '""')}"`,
            `"${(e.lubState || '').replace(/"/g, '""')}"`,
            `"${e.bookingRegistrationNumber || ''}"`,
            `"${e.stallNumber || ''}"`,
            `"${e.requestedStallSize || ''}"`,
            `"${e.bookingStatus || ''}"`,
            `"${e.totalAmount ?? ''}"`,
            `"${e.totalPaid ?? ''}"`,
            `"${e.paymentStatus || ''}"`,
            `"${(e.bankName || '').replace(/"/g, '""')}"`,
            `"${e.bankAccountNumber || ''}"`,
            `"${e.bankIfscCode || ''}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
        const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Exhibitors_List_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const hasActiveFilters =
        searchQuery.trim() !== '' ||
        selectedCategory !== 'ALL' ||
        selectedState !== 'ALL' ||
        lubFilter !== 'ALL' ||
        bookingFilter !== 'ALL';

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedCategory('ALL');
        setSelectedState('ALL');
        setLubFilter('ALL');
        setBookingFilter('ALL');
        setPage(1);
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Page Header */}
            <PageHeader
                title="Exhibitor Directory & Details"
                description="Comprehensive view of all registered exhibitors, company profiles, contact details, tax registrations, and stall allocations."
            />

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Total Exhibitors */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Total Exhibitors
                        </span>
                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-msme-blue flex items-center justify-center font-bold shadow-xs">
                            <Building2 size={20} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">
                            {metrics.total.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">registered</span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">
                        {metrics.bookedCount} with active stall bookings
                    </p>
                </div>

                {/* Card 2: LUB Members */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            LUB Members
                        </span>
                        <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-xs">
                            <BadgeCheck size={20} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">
                            {metrics.lubCount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                            {metrics.total > 0 ? Math.round((metrics.lubCount / metrics.total) * 100) : 0}% of total
                        </span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">
                        Laghu Udyog Bharati affiliated exhibitors
                    </p>
                </div>

                {/* Card 3: Stalls Allocated */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Stalls Allocated
                        </span>
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-xs">
                            <Store size={20} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-black text-emerald-700">
                            {metrics.withStalls.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">allocated</span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">
                        Exhibitors assigned confirmed stall numbers
                    </p>
                </div>

                {/* Card 4: Business Categories */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Industry Sectors
                        </span>
                        <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shadow-xs">
                            <Layers size={20} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-black text-purple-900">
                            {metrics.uniqueCategories}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">categories</span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">
                        Represented across {states.length} states
                    </p>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span>{error}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="rounded-lg bg-rose-600 px-3 py-1 text-white hover:bg-rose-700 cursor-pointer"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Filter and Search Bar Controls */}
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Real-Time Search Bar */}
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search by company, contact, mobile, email, GSTIN, stall..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-9 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-msme-blue focus:bg-white focus:ring-2 focus:ring-msme-blue/10"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setPage(1);
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Clear search"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleExportCsv}
                            disabled={sortedExhibitors.length === 0}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-msme-blue transition disabled:opacity-40 cursor-pointer"
                            title="Export filtered list to CSV"
                        >
                            <Download size={14} /> Export CSV ({sortedExhibitors.length})
                        </button>

                        <RefreshListButton
                            onRefresh={() => refetch()}
                            loading={isFetching}
                            label="Refresh"
                            title="Fetch latest exhibitors from database"
                        />
                    </div>
                </div>

                {/* Filter Dropdowns and Pills Row */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] flex items-center gap-1">
                        <SlidersHorizontal size={13} /> Filters:
                    </span>

                    {/* Category Dropdown */}
                    <div className="relative">
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setPage(1);
                            }}
                            className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-7 text-xs font-semibold text-slate-800 outline-none focus:border-msme-blue focus:bg-white transition cursor-pointer"
                        >
                            <option value="ALL">All Categories ({categories.length})</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    {/* State Dropdown */}
                    <div className="relative">
                        <select
                            value={selectedState}
                            onChange={(e) => {
                                setSelectedState(e.target.value);
                                setPage(1);
                            }}
                            className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-7 text-xs font-semibold text-slate-800 outline-none focus:border-msme-blue focus:bg-white transition cursor-pointer"
                        >
                            <option value="ALL">All States ({states.length})</option>
                            {states.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    {/* LUB Filter Pills */}
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
                        <button
                            type="button"
                            onClick={() => {
                                setLubFilter('ALL');
                                setPage(1);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${lubFilter === 'ALL'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            All LUB
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setLubFilter('MEMBER');
                                setPage(1);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${lubFilter === 'MEMBER'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'text-amber-800 hover:bg-amber-100/50'
                                }`}
                        >
                            LUB Members ({metrics.lubCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setLubFilter('NON_MEMBER');
                                setPage(1);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${lubFilter === 'NON_MEMBER'
                                    ? 'bg-slate-700 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            Non-Members
                        </button>
                    </div>

                    {/* Booking Filter Pills */}
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
                        <button
                            type="button"
                            onClick={() => {
                                setBookingFilter('ALL');
                                setPage(1);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${bookingFilter === 'ALL'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            All Bookings
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setBookingFilter('BOOKED');
                                setPage(1);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${bookingFilter === 'BOOKED'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-emerald-800 hover:bg-emerald-100/50'
                                }`}
                        >
                            Booked ({metrics.bookedCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setBookingFilter('UNBOOKED');
                                setPage(1);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${bookingFilter === 'UNBOOKED'
                                    ? 'bg-slate-700 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            No Booking
                        </button>
                    </div>

                    {/* Reset Filters */}
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 font-bold px-2 py-1 rounded-lg transition"
                        >
                            <X size={13} /> Reset Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Exhibitors Table */}
            {loading ? (
                <div className="card p-12 text-center text-slate-500">
                    <RefreshCw size={28} className="mx-auto animate-spin text-msme-blue" />
                    <p className="mt-3 text-sm font-medium">Loading exhibitor directory...</p>
                </div>
            ) : exhibitors.length === 0 ? (
                <div className="card p-12 text-center">
                    <Building2 size={44} className="mx-auto text-slate-300" />
                    <p className="mt-3 text-base font-bold text-slate-800">No exhibitors registered yet</p>
                    <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                        When exhibitors register for the expo or book stalls, their complete profile and company details will appear here.
                    </p>
                </div>
            ) : filteredExhibitors.length === 0 ? (
                <div className="card p-12 text-center">
                    <Search size={36} className="mx-auto text-slate-300" />
                    <p className="mt-3 text-base font-bold text-slate-800">No matching exhibitors found</p>
                    <p className="mt-1 text-xs text-slate-500">
                        Try adjusting your search terms or filter criteria.
                    </p>
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 select-none">
                                <tr>
                                    <th
                                        onClick={() => handleSort('sno')}
                                        className="p-3.5 cursor-pointer hover:bg-slate-100/80 transition"
                                    >
                                        <div className="inline-flex items-center gap-1">
                                            <span className={`font-semibold uppercase tracking-wider text-[11px] ${sortKey === 'sno' ? 'text-msme-blue font-bold' : 'text-slate-600'}`}>
                                                S.NO.
                                            </span>
                                            <span className={`text-[11px] ${sortKey === 'sno' ? 'text-msme-blue font-black' : 'text-slate-400 opacity-60'}`}>
                                                {sortKey === 'sno' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                                            </span>
                                        </div>
                                    </th>

                                    <th
                                        onClick={() => handleSort('legalName')}
                                        className="p-3.5 cursor-pointer hover:bg-slate-100/80 transition"
                                    >
                                        <div className="inline-flex items-center gap-1">
                                            <span className={`font-semibold uppercase tracking-wider text-[11px] ${sortKey === 'legalName' ? 'text-msme-blue font-bold' : 'text-slate-600'}`}>
                                                COMPANY NAME
                                            </span>
                                            <span className={`text-[11px] ${sortKey === 'legalName' ? 'text-msme-blue font-black' : 'text-slate-400 opacity-60'}`}>
                                                {sortKey === 'legalName' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                                            </span>
                                        </div>
                                    </th>

                                    <th
                                        onClick={() => handleSort('contactPersonName')}
                                        className="p-3.5 cursor-pointer hover:bg-slate-100/80 transition"
                                    >
                                        <div className="inline-flex items-center gap-1">
                                            <span className={`font-semibold uppercase tracking-wider text-[11px] ${sortKey === 'contactPersonName' ? 'text-msme-blue font-bold' : 'text-slate-600'}`}>
                                                CONTACT PERSON
                                            </span>
                                            <span className={`text-[11px] ${sortKey === 'contactPersonName' ? 'text-msme-blue font-black' : 'text-slate-400 opacity-60'}`}>
                                                {sortKey === 'contactPersonName' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                                            </span>
                                        </div>
                                    </th>

                                    <th
                                        onClick={() => handleSort('mobile')}
                                        className="p-3.5 cursor-pointer hover:bg-slate-100/80 transition"
                                    >
                                        <div className="inline-flex items-center gap-1">
                                            <span className={`font-semibold uppercase tracking-wider text-[11px] ${sortKey === 'mobile' ? 'text-msme-blue font-bold' : 'text-slate-600'}`}>
                                                CONTACT INFO
                                            </span>
                                            <span className={`text-[11px] ${sortKey === 'mobile' ? 'text-msme-blue font-black' : 'text-slate-400 opacity-60'}`}>
                                                {sortKey === 'mobile' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                                            </span>
                                        </div>
                                    </th>

                                    <th
                                        onClick={() => handleSort('city')}
                                        className="p-3.5 cursor-pointer hover:bg-slate-100/80 transition"
                                    >
                                        <div className="inline-flex items-center gap-1">
                                            <span className={`font-semibold uppercase tracking-wider text-[11px] ${sortKey === 'city' ? 'text-msme-blue font-bold' : 'text-slate-600'}`}>
                                                LOCATION
                                            </span>
                                            <span className={`text-[11px] ${sortKey === 'city' ? 'text-msme-blue font-black' : 'text-slate-400 opacity-60'}`}>
                                                {sortKey === 'city' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                                            </span>
                                        </div>
                                    </th>

                                    <th
                                        onClick={() => handleSort('industryCategory')}
                                        className="p-3.5 cursor-pointer hover:bg-slate-100/80 transition"
                                    >
                                        <div className="inline-flex items-center gap-1">
                                            <span className={`font-semibold uppercase tracking-wider text-[11px] ${sortKey === 'industryCategory' ? 'text-msme-blue font-bold' : 'text-slate-600'}`}>
                                                CATEGORY
                                            </span>
                                            <span className={`text-[11px] ${sortKey === 'industryCategory' ? 'text-msme-blue font-black' : 'text-slate-400 opacity-60'}`}>
                                                {sortKey === 'industryCategory' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                                            </span>
                                        </div>
                                    </th>

                                    <th
                                        onClick={() => handleSort('stallNumber')}
                                        className="p-3.5 cursor-pointer text-center hover:bg-slate-100/80 transition"
                                    >
                                        <div className="inline-flex items-center justify-center gap-1">
                                            <span className={`font-semibold uppercase tracking-wider text-[11px] ${sortKey === 'stallNumber' ? 'text-msme-blue font-bold' : 'text-slate-600'}`}>
                                                STALL / BOOKING
                                            </span>
                                            <span className={`text-[11px] ${sortKey === 'stallNumber' ? 'text-msme-blue font-black' : 'text-slate-400 opacity-60'}`}>
                                                {sortKey === 'stallNumber' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                                            </span>
                                        </div>
                                    </th>

                                    <th
                                        onClick={() => handleSort('gstin')}
                                        className="p-3.5 cursor-pointer hover:bg-slate-100/80 transition"
                                    >
                                        <div className="inline-flex items-center gap-1">
                                            <span className={`font-semibold uppercase tracking-wider text-[11px] ${sortKey === 'gstin' ? 'text-msme-blue font-bold' : 'text-slate-600'}`}>
                                                GSTIN / PAN
                                            </span>
                                            <span className={`text-[11px] ${sortKey === 'gstin' ? 'text-msme-blue font-black' : 'text-slate-400 opacity-60'}`}>
                                                {sortKey === 'gstin' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                                            </span>
                                        </div>
                                    </th>

                                    <th
                                        onClick={() => handleSort('lubMember')}
                                        className="p-3.5 cursor-pointer text-center hover:bg-slate-100/80 transition"
                                    >
                                        <div className="inline-flex items-center justify-center gap-1">
                                            <span className={`font-semibold uppercase tracking-wider text-[11px] ${sortKey === 'lubMember' ? 'text-msme-blue font-bold' : 'text-slate-600'}`}>
                                                LUB MEMBER
                                            </span>
                                            <span className={`text-[11px] ${sortKey === 'lubMember' ? 'text-msme-blue font-black' : 'text-slate-400 opacity-60'}`}>
                                                {sortKey === 'lubMember' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                                            </span>
                                        </div>
                                    </th>

                                    <th className="p-3.5 text-center text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                                        DETAILS
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedExhibitors.map((item, index) => {
                                    const itemIndex = (safePage - 1) * pageSize + index + 1;
                                    return (
                                        <tr
                                            key={item.id}
                                            onClick={() => setSelectedExhibitor(item)}
                                            className="hover:bg-blue-50/40 transition cursor-pointer group"
                                        >
                                            <td className="p-3.5 text-slate-500 font-medium">
                                                {itemIndex}
                                            </td>

                                            {/* Company Name & Logo */}
                                            <td className="p-3.5">
                                                <div className="flex items-center gap-2.5 min-w-[200px]">
                                                    {item.companyLogo ? (
                                                        <img
                                                            src={item.companyLogo}
                                                            alt={item.legalName}
                                                            className="h-9 w-9 rounded-lg object-contain border border-slate-200 bg-white p-0.5 shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="h-9 w-9 rounded-lg bg-blue-50 text-msme-blue border border-blue-100 flex items-center justify-center font-bold text-xs shrink-0">
                                                            {(item.legalName || 'EX').slice(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-900 group-hover:text-msme-blue transition truncate">
                                                            {item.legalName}
                                                        </p>
                                                        {item.tradeName && item.tradeName !== item.legalName && (
                                                            <p className="text-[11px] text-slate-500 truncate">
                                                                Trade: {item.tradeName}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contact Person */}
                                            <td className="p-3.5 min-w-[150px]">
                                                <p className="font-bold text-slate-800">{item.contactPersonName || '—'}</p>
                                                {item.contactPersonDesignation && (
                                                    <p className="text-[11px] text-slate-500 truncate">
                                                        {item.contactPersonDesignation}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Mobile & Email */}
                                            <td className="p-3.5 min-w-[170px]">
                                                <div className="space-y-0.5">
                                                    {item.mobile && (
                                                        <a
                                                            href={`tel:${item.mobile}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="inline-flex items-center gap-1 font-bold text-slate-800 hover:text-msme-blue"
                                                        >
                                                            <Phone size={11} className="text-slate-400" />
                                                            {item.mobile}
                                                        </a>
                                                    )}
                                                    {item.email && (
                                                        <a
                                                            href={`mailto:${item.email}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="block text-[11px] text-slate-500 hover:text-msme-blue truncate"
                                                            title={item.email}
                                                        >
                                                            <span className="inline-flex items-center gap-1">
                                                                <Mail size={11} className="text-slate-400 shrink-0" />
                                                                <span className="truncate">{item.email}</span>
                                                            </span>
                                                        </a>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Location */}
                                            <td className="p-3.5 min-w-[130px]">
                                                <p className="font-semibold text-slate-800">{item.city || '—'}</p>
                                                <p className="text-[11px] text-slate-500">{item.state || ''}</p>
                                            </td>

                                            {/* Category */}
                                            <td className="p-3.5 min-w-[140px]">
                                                <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 max-w-[150px] truncate">
                                                    {item.industryCategory || 'General'}
                                                </span>
                                                {item.industryScale && (
                                                    <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">
                                                        {item.industryScale}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Stall / Booking */}
                                            <td className="p-3.5 text-center min-w-[130px]">
                                                {item.stallNumber ? (
                                                    <div className="inline-flex flex-col items-center">
                                                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-extrabold text-emerald-700 border border-emerald-200">
                                                            Stall: {item.stallNumber}
                                                        </span>
                                                        {item.bookingRegistrationNumber && (
                                                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                                {item.bookingRegistrationNumber}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : item.bookingId ? (
                                                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-msme-blue border border-blue-200">
                                                        Booked ({item.bookingStatus || 'Pending'})
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-[11px] font-medium">
                                                        Not Booked
                                                    </span>
                                                )}
                                            </td>

                                            {/* GSTIN / PAN */}
                                            <td className="p-3.5 min-w-[140px] font-mono text-[11px]">
                                                {item.gstin ? (
                                                    <p className="font-bold text-slate-800">{item.gstin}</p>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                                {item.pan && (
                                                    <p className="text-[10px] text-slate-500">PAN: {item.pan}</p>
                                                )}
                                            </td>

                                            {/* LUB Member */}
                                            <td className="p-3.5 text-center">
                                                {item.lubMember ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                                                        <BadgeCheck size={12} className="text-amber-600" />
                                                        Member
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                                                        No
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="p-3.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedExhibitor(item);
                                                    }}
                                                    className="inline-flex items-center gap-1 rounded-xl bg-msme-blue/10 px-2.5 py-1.5 text-xs font-bold text-msme-blue hover:bg-msme-blue hover:text-white transition shadow-2xs"
                                                    title="View complete exhibitor details"
                                                >
                                                    <Eye size={13} /> View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3">
                        <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500">
                            <span>
                                Showing <span className="font-bold text-slate-900">{rangeStart}–{rangeEnd}</span> of{' '}
                                <span className="font-bold text-slate-900">{sortedExhibitors.length}</span>
                            </span>

                            <label htmlFor="exhibitor-page-size" className="flex items-center gap-1.5 ml-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    ROWS
                                </span>
                                <select
                                    id="exhibitor-page-size"
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition focus:border-msme-blue focus:ring-2 focus:ring-msme-blue/10"
                                >
                                    {[10, 25, 50, 100].map((sz) => (
                                        <option key={sz} value={sz}>
                                            {sz}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setPage(1)}
                                disabled={safePage === 1}
                                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-600 transition hover:border-msme-blue hover:text-msme-blue disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="First page"
                            >
                                «
                            </button>

                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={safePage === 1}
                                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-600 transition hover:border-msme-blue hover:text-msme-blue disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Previous page"
                            >
                                ‹
                            </button>

                            {pageNumbers[0] > 1 && (
                                <span className="px-1.5 text-xs text-slate-400">…</span>
                            )}

                            {pageNumbers.map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPage(p)}
                                    className={`rounded-lg px-3 py-1 text-xs sm:text-sm font-semibold transition ${p === safePage
                                            ? 'bg-msme-blue text-white'
                                            : 'border border-slate-200 text-slate-600 hover:border-msme-blue hover:text-msme-blue'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}

                            {pageNumbers[pageNumbers.length - 1] < totalPages && (
                                <span className="px-1.5 text-xs text-slate-400">…</span>
                            )}

                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={safePage === totalPages}
                                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-600 transition hover:border-msme-blue hover:text-msme-blue disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Next page"
                            >
                                ›
                            </button>

                            <button
                                type="button"
                                onClick={() => setPage(totalPages)}
                                disabled={safePage === totalPages}
                                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-600 transition hover:border-msme-blue hover:text-msme-blue disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Last page"
                            >
                                »
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW DETAILS MODAL (Read-Only) */}
            {selectedExhibitor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-200 my-8 overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-msme-blue via-blue-900 to-indigo-950 p-6 text-white relative">
                            <button
                                type="button"
                                onClick={() => setSelectedExhibitor(null)}
                                className="absolute right-5 top-5 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                                aria-label="Close dialog"
                            >
                                <X size={18} />
                            </button>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pr-8">
                                {selectedExhibitor.companyLogo ? (
                                    <img
                                        src={selectedExhibitor.companyLogo}
                                        alt={selectedExhibitor.legalName}
                                        className="h-16 w-16 rounded-2xl object-contain bg-white p-1 shadow-md shrink-0"
                                    />
                                ) : (
                                    <div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white text-xl font-black shrink-0">
                                        {(selectedExhibitor.legalName || 'EX').slice(0, 2).toUpperCase()}
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-xl font-black">{selectedExhibitor.legalName}</h2>
                                        {selectedExhibitor.lubMember && (
                                            <span className="rounded-full bg-amber-400 text-slate-950 px-2.5 py-0.5 text-xs font-black flex items-center gap-1 shadow-xs">
                                                <BadgeCheck size={14} /> LUB Member
                                            </span>
                                        )}
                                        {selectedExhibitor.stallNumber && (
                                            <span className="rounded-full bg-emerald-500 text-white px-2.5 py-0.5 text-xs font-black">
                                                Stall {selectedExhibitor.stallNumber}
                                            </span>
                                        )}
                                    </div>
                                    {selectedExhibitor.tradeName && selectedExhibitor.tradeName !== selectedExhibitor.legalName && (
                                        <p className="text-xs text-blue-200">Trade Name: {selectedExhibitor.tradeName}</p>
                                    )}
                                    <p className="text-xs text-blue-100 flex items-center gap-3 flex-wrap">
                                        <span className="flex items-center gap-1">
                                            <MapPin size={13} /> {selectedExhibitor.city}, {selectedExhibitor.state}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Tag size={13} /> {selectedExhibitor.industryCategory || 'General Industry'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Read-Only Notice Bar */}
                        <div className="bg-slate-100/90 border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs text-slate-600">
                            <span className="font-semibold flex items-center gap-1.5">
                                <ShieldCheck size={14} className="text-emerald-600" /> Read-Only Exhibitor Profile Record
                            </span>
                            <span className="text-[11px] text-slate-500">
                                Registered on {new Date(selectedExhibitor.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                            </span>
                        </div>

                        {/* Modal Body with Multi-Section View */}
                        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6 text-xs text-slate-800">
                            {/* Section 1: Company Profile */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-extrabold text-msme-blue uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-200">
                                    <Building2 size={16} /> Company & Business Profile
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Legal Company Name</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedExhibitor.legalName}</p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Trade / Brand Name</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedExhibitor.tradeName || '—'}</p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Company Constitution</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedExhibitor.companyConstitution || '—'}</p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Industry Scale</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedExhibitor.industryScale || '—'}</p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Business Type</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedExhibitor.businessType || '—'}</p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Industry Category</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedExhibitor.industryCategory || '—'}</p>
                                    </div>
                                </div>

                                {selectedExhibitor.website && (
                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase text-slate-500">Official Website</span>
                                            <p className="font-bold text-msme-blue mt-0.5">{selectedExhibitor.website}</p>
                                        </div>
                                        <a
                                            href={selectedExhibitor.website.startsWith('http') ? selectedExhibitor.website : `https://${selectedExhibitor.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-bold text-msme-blue hover:underline"
                                        >
                                            Visit <ExternalLink size={13} />
                                        </a>
                                    </div>
                                )}

                                {selectedExhibitor.productServiceDescription && (
                                    <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Products & Services Description</span>
                                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedExhibitor.productServiceDescription}</p>
                                    </div>
                                )}

                                {selectedExhibitor.productKeywords && (
                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 space-y-1">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Product Keywords / Tags</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {selectedExhibitor.productKeywords.split(',').map((kw, i) => (
                                                <span key={i} className="rounded-md bg-blue-100/70 text-msme-blue px-2 py-0.5 text-[11px] font-semibold">
                                                    {kw.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section 2: Contact Information */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-extrabold text-msme-blue uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-200">
                                    <Users size={16} /> Contact Person Details
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Primary Contact Person</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedExhibitor.contactPersonName || '—'}</p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Designation</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedExhibitor.contactPersonDesignation || '—'}</p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Primary Mobile</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1.5">
                                            <Phone size={13} className="text-slate-400" />
                                            {selectedExhibitor.mobile || '—'}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Alternate Mobile</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedExhibitor.alternateMobile || '—'}</p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Primary Email</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5 truncate flex items-center gap-1.5">
                                            <Mail size={13} className="text-slate-400 shrink-0" />
                                            <span className="truncate">{selectedExhibitor.email || '—'}</span>
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Alternate Email</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5 truncate">{selectedExhibitor.alternateEmail || '—'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Registered Address */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-extrabold text-msme-blue uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-200">
                                    <MapPin size={16} /> Registered Address & Location
                                </h3>

                                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-3">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Street / Factory Address</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedExhibitor.registeredAddress || '—'}</p>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase text-slate-500">City</span>
                                            <p className="font-bold text-slate-900 mt-0.5">{selectedExhibitor.city || '—'}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold uppercase text-slate-500">District</span>
                                            <p className="font-bold text-slate-900 mt-0.5">{selectedExhibitor.district || '—'}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold uppercase text-slate-500">State</span>
                                            <p className="font-bold text-slate-900 mt-0.5">{selectedExhibitor.state || '—'}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold uppercase text-slate-500">Pincode</span>
                                            <p className="font-bold text-slate-900 mt-0.5">{selectedExhibitor.pincode || '—'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Tax & Legal Identifiers */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-extrabold text-msme-blue uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-200">
                                    <FileText size={16} /> Tax & Government Identifiers
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 font-mono">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">GSTIN</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedExhibitor.gstin || '—'}</p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 font-mono">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">PAN</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedExhibitor.pan || '—'}</p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 font-mono">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Udyam Registration</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedExhibitor.udyamNumber || '—'}</p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 font-mono">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">TAN Number</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedExhibitor.tanNumber || '—'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 5: LUB Membership */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-extrabold text-msme-blue uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-200">
                                    <BadgeCheck size={16} /> Laghu Udyog Bharati (LUB) Affiliation
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">LUB Member</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">
                                            {selectedExhibitor.lubMember ? 'Yes (Active Member)' : 'No'}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">LUB State</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedExhibitor.lubState || '—'}</p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">LUB Chapter</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedExhibitor.lubChapter || '—'}</p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 font-mono">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Membership Number</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedExhibitor.lubMembershipNumber || '—'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 6: Banking Details */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-extrabold text-msme-blue uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-200">
                                    <CreditCard size={16} /> Bank Account Details
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Account Holder Name</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedExhibitor.bankAccountName || '—'}</p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Bank Name</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedExhibitor.bankName || '—'}</p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 font-mono">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Account Number</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedExhibitor.bankAccountNumber || '—'}</p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 font-mono">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">IFSC Code</span>
                                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedExhibitor.bankIfscCode || '—'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 7: Stall & Booking Overview */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-extrabold text-msme-blue uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-200">
                                    <Store size={16} /> Stall Booking & Financial Overview
                                </h3>

                                {selectedExhibitor.bookingId ? (
                                    <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase text-slate-500">Booking Reg Number</span>
                                                <p className="font-bold font-mono text-msme-blue text-sm mt-0.5">
                                                    {selectedExhibitor.bookingRegistrationNumber}
                                                </p>
                                            </div>

                                            <div>
                                                <span className="text-[10px] font-bold uppercase text-slate-500">Allocated Stall</span>
                                                <p className="font-black text-emerald-700 text-sm mt-0.5">
                                                    {selectedExhibitor.stallNumber ? `Stall ${selectedExhibitor.stallNumber}` : 'Not Allocated Yet'}
                                                </p>
                                            </div>

                                            <div>
                                                <span className="text-[10px] font-bold uppercase text-slate-500">Requested Size</span>
                                                <p className="font-bold text-slate-800 text-sm mt-0.5">
                                                    {selectedExhibitor.requestedStallSize || '—'}
                                                </p>
                                            </div>

                                            <div>
                                                <span className="text-[10px] font-bold uppercase text-slate-500">Booking Status</span>
                                                <p className="font-bold text-slate-900 text-sm mt-0.5">
                                                    {selectedExhibitor.bookingStatus}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-blue-200">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase text-slate-500">Fascia Board Name</span>
                                                <p className="font-bold text-slate-900 mt-0.5">{selectedExhibitor.fasciaName || '—'}</p>
                                            </div>

                                            <div>
                                                <span className="text-[10px] font-bold uppercase text-slate-500">Invoice Total Amount</span>
                                                <p className="font-extrabold text-msme-blue text-sm mt-0.5">
                                                    {selectedExhibitor.totalAmount != null ? `₹${selectedExhibitor.totalAmount.toLocaleString('en-IN')}` : '—'}
                                                </p>
                                            </div>

                                            <div>
                                                <span className="text-[10px] font-bold uppercase text-slate-500">Payment Status</span>
                                                <p className="mt-0.5">
                                                    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${selectedExhibitor.paymentStatus === 'Fully Paid' || selectedExhibitor.paymentStatus === 'Paid'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : selectedExhibitor.paymentStatus === 'Partially Paid'
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-rose-100 text-rose-800'
                                                        }`}>
                                                        {selectedExhibitor.paymentStatus || 'Unpaid'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-center text-slate-500">
                                        <p className="font-semibold">No active stall booking recorded for this exhibitor.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                                Record ID: <code className="font-mono text-[11px]">{selectedExhibitor.id}</code>
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedExhibitor(null)}
                                className="btn-secondary text-xs px-5 py-2 shadow-xs"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminExhibitorListPage;
