import React, { useEffect, useState, useMemo } from 'react';
import {
    Users,
    Search,
    RefreshCw,
    Building2,
    Phone,
    MapPin,
    ChevronLeft,
    ChevronRight,
    Eye,
    X,
    FileSpreadsheet,
    Send,
    Calendar,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { apiClient } from '../../../data/api/apiClient';
import { ModalPortal } from '../../../shared/components/ModalPortal';

interface VisitorListProps {
    tenantId: string;
    eventId: string;
}

type SortDirection = 'asc' | 'desc';

type SortKey =
    | 'registrationNumber'
    | 'legalName'
    | 'contactPersonName'
    | 'mobile'
    | 'district'
    | 'industryCategory';

interface Visitor {
    id: string;
    registrationNumber: string;
    legalName: string;
    tradeName?: string;
    contactPersonName: string;
    contactPersonDesignation?: string;
    email: string;
    mobile: string;
    city: string;
    district?: string;
    state: string;
    industryCategory: string;
    businessType?: string;
    createdAt: string;
}

enum WarmupCountdownType {
    DaysToGo = 1,
    Today = 2
}

export const VisitorList: React.FC<VisitorListProps> = ({ tenantId, eventId }) => {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [filteredVisitors, setFilteredVisitors] = useState<Visitor[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Search & Filter state
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedIndustry, setSelectedIndustry] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');

    // Selected Visitor for View Modal
    const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

    // Send Invite Modal State (Supports both Bulk and Single)
    const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
    const [inviteTargetVisitor, setInviteTargetVisitor] = useState<Visitor | null>(null);
    const [countdownType, setCountdownType] = useState<WarmupCountdownType>(WarmupCountdownType.DaysToGo);
    const [daysRemaining, setDaysRemaining] = useState<number>(10);
    const [customMessage, setCustomMessage] = useState<string>('');
    const [sendingInvite, setSendingInvite] = useState<boolean>(false);
    const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);
    
    // Sort State
    const [sortKey, setSortKey] = useState<SortKey>('registrationNumber');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 10;

    const fetchVisitors = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await apiClient.get(`/visitors?tenantId=${tenantId}&eventId=${eventId}`);

            setVisitors(res as Visitor[]);
            setFilteredVisitors(res as Visitor[]);
        } catch (err: any) {
            setError(err.message || 'Error fetching visitor list');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId && eventId) {
            fetchVisitors();
        }
    }, [tenantId, eventId]);

    // Apply search, industry, and district filtering
    useEffect(() => {
        let result = visitors;

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (v) =>
                    v.registrationNumber?.toLowerCase().includes(q) ||
                    v.legalName?.toLowerCase().includes(q) ||
                    v.contactPersonName?.toLowerCase().includes(q) ||
                    v.mobile?.includes(q) ||
                    v.city?.toLowerCase().includes(q)
            );
        }

        if (selectedIndustry) {
            result = result.filter((v) => v.industryCategory === selectedIndustry);
        }

        if (selectedDistrict) {
            result = result.filter((v) => v.district === selectedDistrict);
        }

        setFilteredVisitors(result);
        setCurrentPage(1);
    }, [searchQuery, selectedIndustry, selectedDistrict, visitors]);

    // Sorting Logic
    const sortedVisitors = useMemo(() => {
        return [...filteredVisitors].sort((a, b) => {
            let valA = a[sortKey] ?? '';
            let valB = b[sortKey] ?? '';

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredVisitors, sortKey, sortDirection]);

    const uniqueIndustries = Array.from(
        new Set(visitors.map((v) => v.industryCategory).filter(Boolean))
    );

    const uniqueDistricts = Array.from(
        new Set(visitors.map((v) => v.district).filter(Boolean))
    );

    // CSV Export Handler
    const handleExportCSV = () => {
        if (sortedVisitors.length === 0) return;

        const headers = [
            'Registration Number', 'Company Name', 'Trade Name', 'Contact Person',
            'Designation', 'Mobile', 'Email', 'City', 'District', 'State',
            'Industry Category', 'Business Type', 'Created At'
        ];

        const rows = sortedVisitors.map((v) => [
            `"${v.registrationNumber || ''}"`, `"${v.legalName || ''}"`, `"${v.tradeName || ''}"`,
            `"${v.contactPersonName || ''}"`, `"${v.contactPersonDesignation || ''}"`, `"${v.mobile || ''}"`,
            `"${v.email || ''}"`, `"${v.city || ''}"`, `"${v.district || ''}"`, `"${v.state || ''}"`,
            `"${v.industryCategory || ''}"`, `"${v.businessType || ''}"`, `"${v.createdAt || ''}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Visitor_List_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Dispatch Invitation API Handler
    const handleSendInvite = async () => {
        try {
            setSendingInvite(true);
            setInviteSuccessMsg(null);

            if (inviteTargetVisitor) {
                await apiClient.post(`/visitors/${inviteTargetVisitor.id}/send-invite`, {
                    tenantId,
                    eventId,
                    visitorId: inviteTargetVisitor.id,
                    countdownType,
                    daysRemaining: countdownType === WarmupCountdownType.DaysToGo ? daysRemaining : null,
                    customMessage
                });
                setInviteSuccessMsg(`Warm-up email sent successfully to ${inviteTargetVisitor.contactPersonName || inviteTargetVisitor.legalName}!`);
            } else {
                const res: any = await apiClient.post('/visitors/send-bulk-invite', {
                    tenantId,
                    eventId,
                    countdownType,
                    daysRemaining: countdownType === WarmupCountdownType.DaysToGo ? daysRemaining : null,
                    customMessage
                });
                setInviteSuccessMsg(`Bulk warm-up broadcast completed! Targeted: ${res.totalTargeted}, Sent: ${res.successfullySent}, Failed: ${res.failed}`);
            }

            setTimeout(() => {
                setIsInviteModalOpen(false);
                setInviteTargetVisitor(null);
                setInviteSuccessMsg(null);
            }, 2500);
        } catch (err: any) {
            setError(err.message || 'Failed to dispatch invitations.');
        } finally {
            setSendingInvite(false);
        }
    };

    // Open Modal Helpers
    const openBulkInviteModal = () => {
        setInviteTargetVisitor(null);
        setInviteSuccessMsg(null);
        setIsInviteModalOpen(true);
    };

    const openSingleInviteModal = (visitor: Visitor) => {
        setInviteTargetVisitor(visitor);
        setInviteSuccessMsg(null);
        setIsInviteModalOpen(true);
    };

    function toggleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDirection(dir => (dir === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    }

    function SortIndicator({ column }: { column: SortKey }) {
        if (sortKey !== column) {
            return <span className="ml-1 text-slate-300">↕</span>;
        }

        return (
            <span className="ml-1 text-slate-700">
                {sortDirection === 'asc' ? '↑' : '↓'}
            </span>
        );
    }

    // Pagination logic applied to sortedVisitors
    const totalPages = Math.ceil(sortedVisitors.length / itemsPerPage) || 1;
    const paginatedVisitors = sortedVisitors.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="p-6 bg-slate-50 min-h-screen space-y-5">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" /> Registered Visitors
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Total {sortedVisitors.length} visitors found
                    </p>
                </div>

                {/* Action Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportCSV}
                        disabled={sortedVisitors.length === 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Export CSV
                    </button>

                    <button
                        onClick={fetchVisitors}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh List
                    </button>

                    <button
                        onClick={openBulkInviteModal}
                        disabled={loading || visitors.length === 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <Send className="w-3.5 h-3.5" />
                        Send Warm-up Broadcast
                    </button>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by reg #, name, company, mobile..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>

                <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-2">
                    <select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="w-full sm:w-44 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-700"
                    >
                        <option value="">All Districts</option>
                        {uniqueDistricts.map((dist) => (
                            <option key={dist} value={dist}>{dist}</option>
                        ))}
                    </select>

                    <select
                        value={selectedIndustry}
                        onChange={(e) => setSelectedIndustry(e.target.value)}
                        className="w-full sm:w-44 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-700"
                    >
                        <option value="">All Industries</option>
                        {uniqueIndustries.map((ind) => (
                            <option key={ind} value={ind}>{ind}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Error Message Banner */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            )}

            {/* Table Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider select-none">
                                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('registrationNumber')}>
                                    Reg No <SortIndicator column="registrationNumber" />
                                </th>
                                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('legalName')}>
                                    Company Name <SortIndicator column="legalName" />
                                </th>
                                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('contactPersonName')}>
                                    Contact Person <SortIndicator column="contactPersonName" />
                                </th>
                                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('mobile')}>
                                    Mobile <SortIndicator column="mobile" />
                                </th>
                                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('district')}>
                                    Location <SortIndicator column="district" />
                                </th>
                                <th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('industryCategory')}>
                                    Industry <SortIndicator column="industryCategory" />
                                </th>
                                <th className="py-3 px-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-400">Loading visitors list...</td>
                                </tr>
                            ) : paginatedVisitors.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-400">No visitor records found.</td>
                                </tr>
                            ) : (
                                paginatedVisitors.map((visitor) => (
                                    <tr key={visitor.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3 px-4 font-mono font-medium text-indigo-600">{visitor.registrationNumber}</td>
                                        <td className="py-3 px-4 font-semibold text-slate-900">{visitor.legalName}</td>
                                        <td className="py-3 px-4">{visitor.contactPersonName}</td>
                                        <td className="py-3 px-4 font-mono">{visitor.mobile}</td>
                                        <td className="py-3 px-4">{visitor.city}{visitor.district ? `, ${visitor.district}` : ''}</td>
                                        <td className="py-3 px-4">
                                            <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                                                {visitor.industryCategory || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => setSelectedVisitor(visitor)}
                                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => openSingleInviteModal(visitor)}
                                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                title="Send Single Warm-up Email"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <span className="text-xs text-slate-500">Page {currentPage} of {totalPages}</span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-1 rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-40"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-1 rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-40"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Send Warm-up Invite Modal */}
            {isInviteModalOpen && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-indigo-600" />
                                        {inviteTargetVisitor ? 'Send Single Invitation' : 'Send Bulk Warm-up Broadcast'}
                                    </h2>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        {inviteTargetVisitor
                                            ? `Recipient: ${inviteTargetVisitor.contactPersonName || inviteTargetVisitor.legalName}`
                                            : `Targeting all ${visitors.length} registered visitors`}
                                    </p>
                                </div>
                                <button onClick={() => setIsInviteModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-5 space-y-4 text-xs">
                                {inviteSuccessMsg ? (
                                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-center font-medium flex flex-col items-center gap-2">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                        {inviteSuccessMsg}
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-1.5">
                                            <label className="font-semibold text-slate-700">Event Warm-up Timing</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setCountdownType(WarmupCountdownType.DaysToGo)}
                                                    className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                                                        countdownType === WarmupCountdownType.DaysToGo
                                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                                    }`}
                                                >
                                                    Days To Go
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCountdownType(WarmupCountdownType.Today)}
                                                    className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                                                        countdownType === WarmupCountdownType.Today
                                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                                    }`}
                                                >
                                                    Event is Today 🎉
                                                </button>
                                            </div>
                                        </div>

                                        {countdownType === WarmupCountdownType.DaysToGo && (
                                            <div className="space-y-1.5">
                                                <label className="font-semibold text-slate-700">Days Remaining</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="60"
                                                    value={daysRemaining}
                                                    onChange={(e) => setDaysRemaining(parseInt(e.target.value) || 1)}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                                    placeholder="e.g. 10"
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <label className="font-semibold text-slate-700">Additional Announcement (Optional)</label>
                                            <textarea
                                                rows={3}
                                                value={customMessage}
                                                onChange={(e) => setCustomMessage(e.target.value)}
                                                placeholder="e.g. Gates open at 9 AM. Free parking available at Gate 2."
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-700"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {!inviteSuccessMsg && (
                                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsInviteModalOpen(false)}
                                        className="px-4 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSendInvite}
                                        disabled={sendingInvite}
                                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm disabled:opacity-50 cursor-pointer"
                                    >
                                        <Send className={`w-3.5 h-3.5 ${sendingInvite ? 'animate-spin' : ''}`} />
                                        {sendingInvite ? 'Sending...' : 'Dispatch Invitations'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* Visitor Detail Modal */}
            {selectedVisitor && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <div>
                                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                        {selectedVisitor.registrationNumber}
                                    </span>
                                    <h2 className="text-base font-bold text-slate-900 mt-1">{selectedVisitor.legalName}</h2>
                                </div>
                                <button onClick={() => setSelectedVisitor(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-5 space-y-4 text-xs text-slate-600">
                                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div>
                                        <span className="text-[10px] text-slate-400 uppercase font-medium">Contact Person</span>
                                        <p className="font-semibold text-slate-800 mt-0.5">{selectedVisitor.contactPersonName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 uppercase font-medium">Mobile</span>
                                        <p className="font-semibold text-slate-800 mt-0.5">{selectedVisitor.mobile || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 uppercase font-medium">Email</span>
                                        <p className="font-semibold text-slate-800 mt-0.5">{selectedVisitor.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 uppercase font-medium">Category</span>
                                        <p className="font-semibold text-slate-800 mt-0.5">{selectedVisitor.industryCategory || 'General'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-slate-500">
                                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span>
                                        {selectedVisitor.city ? `${selectedVisitor.city}, ` : ''}
                                        {selectedVisitor.district ? `${selectedVisitor.district}, ` : ''}
                                        {selectedVisitor.state}
                                    </span>
                                </div>
                            </div>

                            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={() => setSelectedVisitor(null)}
                                    className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
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
};