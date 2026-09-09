import React, { useEffect, useMemo, useState } from 'react';
import {
    Users,
    Building2,
    Briefcase,
    Clock,
    TrendingUp,
    UserCheck,
    UserX,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight
} from 'lucide-react';
import { apiClient } from '../../../data/api/apiClient';

interface Props {
    tenantId: string;
    eventId: string;
}

interface RecentVip {
    id: string;
    registrationNumber: string;
    name: string;
    designation?: string;
    organization?: string;
    mobile?: string;
    createdAt: string;
}

interface VipDashboardSummary {
    totalVips: number;
    checkedInCount: number;
    pendingCheckInCount: number;
    vipsByOrganization: Record<string, number>;
    vipsByDesignation: Record<string, number>;
    recentVips: RecentVip[];
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

export const VipDashboard: React.FC<Props> = ({ tenantId, eventId }) => {
    const [data, setData] = useState<VipDashboardSummary | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination state for the Recent VIP Registrations table
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(5);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                // Calls your C# VIP endpoint: [HttpGet("dashboard")] -> /api/v1/vips/dashboard
                const res = await apiClient.get(
                    `/vips/dashboard?tenantId=${tenantId}&eventId=${eventId}`
                );

                if (!res) throw new Error('Failed to load VIP dashboard metrics');
                setData(res as VipDashboardSummary);
            } catch (err: any) {
                setError(err.message || 'Error loading VIP dashboard');
            }  finally {
                setLoading(false);
            }
        };

        if (tenantId && eventId) {
            fetchDashboard();
        }
    }, [tenantId, eventId]);

    // Reset to page 1 whenever the dataset or page size changes
    useEffect(() => {
        setCurrentPage(1);
    }, [data, pageSize]);

    const recentVips = data?.recentVips ?? [];
    const totalItems = recentVips.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const paginatedRecentVips = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return recentVips.slice(start, start + pageSize);
    }, [recentVips, currentPage, pageSize]);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm">
                {error || 'No VIP data found.'}
            </div>
        );
    }

    // Attendance conversion rate
    const checkInRate = data.totalVips > 0 
        ? Math.round((data.checkedInCount / data.totalVips) * 100) 
        : 0;

    return (
        <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-indigo-600" />
                        VIP Analytics & Overview
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Real-time VIP registration metrics and event check-in breakdown.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live VIP Metrics
                    </span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Registered VIPs */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">Total VIP Registrations</span>
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between">
                        <span className="text-3xl font-bold text-slate-900">{data.totalVips}</span>
                        <span className="inline-flex items-center text-xs font-medium text-indigo-600">
                            Delegations
                        </span>
                    </div>
                </div>

                {/* Checked In */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">Checked-In VIPs</span>
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                            <UserCheck className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between">
                        <span className="text-3xl font-bold text-slate-900">{data.checkedInCount}</span>
                        <span className="inline-flex items-center text-xs font-medium text-emerald-600">
                            <TrendingUp className="w-3.5 h-3.5 mr-1" /> {checkInRate}% Present
                        </span>
                    </div>
                </div>

                {/* Pending Check-Ins */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">Pending Arrival</span>
                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                            <UserX className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="text-3xl font-bold text-slate-900">{data.pendingCheckInCount}</span>
                        <p className="text-xs text-slate-500 mt-1">Awaiting Check-in</p>
                    </div>
                </div>

                {/* Turnout Rate */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">Turnout Rate</span>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                            {checkInRate}%
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                style={{ width: `${checkInRate}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Target: 100% Attendance</p>
                    </div>
                </div>
            </div>

            {/* Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Organization Breakdown */}
                {/* <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-4">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        VIPs by Organization
                    </h2>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {Object.keys(data.vipsByOrganization || {}).length === 0 ? (
                            <p className="text-xs text-slate-400 py-4 text-center">No organization data</p>
                        ) : (
                            Object.entries(data.vipsByOrganization).map(([org, count]) => {
                                const percentage = data.totalVips > 0 ? Math.round((count / data.totalVips) * 100) : 0;
                                return (
                                    <div key={org} className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium text-slate-700">
                                            <span className="truncate max-w-[200px]">{org}</span>
                                            <span className="text-slate-500">{count} ({percentage}%)</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div> */}

                {/* Designation Breakdown */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-4">
                        <Briefcase className="w-4 h-4 text-cyan-600" />
                        VIP by Designation
                    </h2>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {Object.keys(data.vipsByDesignation || {}).length === 0 ? (
                            <p className="text-xs text-slate-400 py-4 text-center">No designation data</p>
                        ) : (
                            Object.entries(data.vipsByDesignation).map(([designation, count]) => {
                                const percentage = data.totalVips > 0 ? Math.round((count / data.totalVips) * 100) : 0;
                                return (
                                    <div key={designation} className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium text-slate-700">
                                            <span className="truncate max-w-[200px]">{designation}</span>
                                            <span className="text-slate-500">{count} ({percentage}%)</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-cyan-600 rounded-full transition-all duration-300"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Recent VIP Registrations Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        Recent VIP Registrations
                    </h2>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-500">
                            {totalItems} total
                        </span>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
                        >
                            {PAGE_SIZE_OPTIONS.map((size) => (
                                <option key={size} value={size}>
                                    {size} / page
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider">
                                <th className="py-3 px-4">Reg No.</th>
                                <th className="py-3 px-4">VIP Name</th>
                                <th className="py-3 px-4">Designation</th>
                                {/* <th className="py-3 px-4">Organization</th> */}
                                <th className="py-3 px-4">Mobile</th>
                                <th className="py-3 px-4 text-right">Registered At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {paginatedRecentVips.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-6 text-center text-slate-400">
                                        No VIP registrations recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                paginatedRecentVips.map((v) => (
                                    <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-3 px-4 font-mono font-medium text-indigo-600">
                                            {v.registrationNumber}
                                        </td>
                                        <td className="py-3 px-4 font-semibold text-slate-900">{v.name}</td>
                                        <td className="py-3 px-4">{v.designation || '-'}</td>
                                        {/* <td className="py-3 px-4">{v.organization || '-'}</td> */}
                                        <td className="py-3 px-4 font-mono">{v.mobile || '-'}</td>
                                        <td className="py-3 px-4 text-right text-slate-500">
                                            {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))
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
                            <span className="font-semibold text-slate-700">{totalItems}</span> registrations
                        </p>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                                aria-label="First page"
                            >
                                <ChevronsLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
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
                                        className={`min-w-[28px] px-2 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${
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
                                className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                                aria-label="Next page"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
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