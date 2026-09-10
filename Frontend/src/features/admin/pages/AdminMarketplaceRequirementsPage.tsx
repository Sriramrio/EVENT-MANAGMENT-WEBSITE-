import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { LoadingState, ErrorState } from '../../../components/ui/PageStates';
import { ModalPortal } from '../../../shared/components/ModalPortal';
import {
  ClipboardList,
  Search,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  MapPin,
  Mail,
  Phone,
  Tag,
  CheckCircle2,
  Clock,
  ExternalLink,
  X,
  FileText,
  BadgePercent,
  Copy,
  Check,
  ChevronRight,
  Filter,
  User,
  Factory
} from 'lucide-react';
import { apiClient } from '../../../data/api/apiClient';

interface BuyerRequirementItem {
  id: string;
  requirementNo: string;
  title: string;
  description: string;
  sourcingType: string;
  segmentCode?: string;
  mainCategoryCode?: string;
  classificationCode?: string;
  quantity: number;
  uomCode: string;
  requirementDate?: string;
  needByDate?: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  detailsJson?: string;
  organizationId: string;
  organizationName: string;
  organizationCity: string;
  organizationState: string;
  organizationGstin: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  matchCount: number;
  averageMatchScore: number;
}

interface SellerRequirementItem {
  id: string;
  capabilityNo: string;
  title: string;
  description: string;
  businessType: string;
  capabilityType: string;
  plantLocation: string;
  contactPerson: string;
  contactEmail: string;
  mobileCode?: string;
  mobileNumber: string;
  designation?: string;
  segmentCode?: string;
  mainCategoryCode?: string;
  classificationCode?: string;
  uomCode?: string;
  status: string;
  technicalJson?: string;
  commercialJson?: string;
  createdAt: string;
  updatedAt?: string;
  organizationId: string;
  organizationName: string;
  organizationCity: string;
  organizationState: string;
  organizationGstin: string;
  udyamNumber?: string;
}

export function AdminMarketplaceRequirementsPage({ kind = 'BUYER' }: { kind?: 'BUYER' | 'SELLER' }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const endpoint = kind === 'SELLER'
    ? '/marketplace/organizations/admin/seller-requirements'
    : '/marketplace/organizations/admin/buyer-requirements';

  const loadData = () => {
    setLoading(true);
    setError(null);
    apiClient.get<any[]>(endpoint)
      .then(res => setData(res || []))
      .catch(err => setError(err instanceof Error ? err : new Error('Failed to load requirements.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    setSelectedItem(null);
  }, [kind]);

  const copyToClipboard = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} retry={loadData} />;

  const isBuyer = kind === 'BUYER';
  const pageTitle = isBuyer ? 'Buyer Requirements' : 'Seller Requirements & Capabilities';
  const pageDescription = isBuyer
    ? 'View and review all product and service requirements posted by registered buyers.'
    : 'View and review all capabilities, manufacturing offerings, and requirements posted by sellers.';

  // Filters
  const filtered = data.filter(item => {
    const status = (item.status || 'ACTIVE').toUpperCase();
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

    const q = search.toLowerCase().trim();
    if (!q) return matchesStatus;

    const code = isBuyer ? item.requirementNo : item.capabilityNo;
    const matchesQuery =
      (code && code.toLowerCase().includes(q)) ||
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.organizationName && item.organizationName.toLowerCase().includes(q)) ||
      (item.organizationCity && item.organizationCity.toLowerCase().includes(q)) ||
      (item.contactPerson && item.contactPerson.toLowerCase().includes(q)) ||
      (item.contactEmail && item.contactEmail.toLowerCase().includes(q)) ||
      (item.mainCategoryCode && item.mainCategoryCode.toLowerCase().includes(q)) ||
      (item.classificationCode && item.classificationCode.toLowerCase().includes(q));

    return matchesStatus && matchesQuery;
  });

  // Metrics
  const totalCount = data.length;
  const publishedCount = data.filter(d => {
    const s = (d.status || '').toUpperCase();
    return s === 'PUBLISHED' || s === 'ACTIVE';
  }).length;
  const draftCount = data.filter(d => (d.status || '').toUpperCase() === 'DRAFT').length;
  const uniqueOrgs = new Set(data.map(d => d.organizationId)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            isBuyer
              ? 'bg-blue-50 text-blue-600 border-blue-200'
              : 'bg-emerald-50 text-emerald-600 border-emerald-200'
          }`}>
            {isBuyer ? <ClipboardList className="w-6 h-6" /> : <Factory className="w-6 h-6" />}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{pageTitle}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{pageDescription}</p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh List
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3.5 border-slate-200">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isBuyer ? 'Total Requirements' : 'Total Capabilities'}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5 border-slate-200">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active / Published
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{publishedCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5 border-slate-200">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Draft / Pending
            </p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">{draftCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5 border-slate-200">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Participating Orgs
            </p>
            <p className="text-2xl font-black text-indigo-600 mt-0.5">{uniqueOrgs}</p>
          </div>
        </Card>
      </div>

      {/* Controls Bar: Search & Status Tabs */}
      <Card className="p-4 border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search by code, title, ${isBuyer ? 'buyer' : 'seller'} company, category...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'PUBLISHED', 'ACTIVE', 'DRAFT'].map(status => {
              const count = status === 'ALL'
                ? data.length
                : data.filter(d => (d.status || '').toUpperCase() === status).length;
              const isActive = statusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{status === 'ALL' ? 'All' : status}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Main Listing Table */}
      <Card className="overflow-hidden border-slate-200 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Code & Title</th>
                <th className="px-5 py-3.5">Posted By Company</th>
                <th className="px-5 py-3.5">{isBuyer ? 'Sourcing & Category' : 'Business & Offering'}</th>
                <th className="px-5 py-3.5">{isBuyer ? 'Quantity & Budget' : 'Contact Person'}</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <p className="text-base font-semibold">No requirements found</p>
                    <p className="text-xs mt-1">Try adjusting your search query or status filter.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const code = isBuyer ? item.requirementNo : item.capabilityNo;
                  const status = (item.status || 'ACTIVE').toUpperCase();
                  const isPublished = status === 'PUBLISHED' || status === 'ACTIVE';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      {/* Code & Title */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {code || 'N/A'}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(code, item.id)}
                            title="Copy code"
                            className="text-slate-400 hover:text-slate-600 transition"
                          >
                            {copiedCode === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="font-bold text-slate-900 mt-1 line-clamp-1" title={item.title}>
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5" title={item.description}>
                          {item.description}
                        </p>
                      </td>

                      {/* Organization Details */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-800 line-clamp-1" title={item.organizationName}>
                            {item.organizationName || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          {item.organizationCity && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {item.organizationCity}{item.organizationState ? `, ${item.organizationState}` : ''}
                            </span>
                          )}
                          {item.organizationGstin && (
                            <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                              GST: {item.organizationGstin}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sourcing / Business Type & Category */}
                      <td className="px-5 py-4">
                        {isBuyer ? (
                          <div>
                            <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-purple-50 text-purple-700 border border-purple-100">
                              {item.sourcingType || 'PRODUCT'}
                            </span>
                            <p className="text-xs text-slate-600 mt-1 font-medium">
                              {item.mainCategoryCode || item.classificationCode || 'General'}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-amber-50 text-amber-700 border border-amber-100">
                              {item.businessType || 'MANUFACTURER'}
                            </span>
                            {item.plantLocation && (
                              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {item.plantLocation}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Quantity & Budget (Buyer) OR Contact Person (Seller) */}
                      <td className="px-5 py-4">
                        {isBuyer ? (
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {item.quantity ? `${item.quantity} ${item.uomCode || 'NOS'}` : 'N/A'}
                            </p>
                            {(item.budgetMin || item.budgetMax) && (
                              <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                                ₹{item.budgetMin ? item.budgetMin.toLocaleString() : '0'} - ₹{item.budgetMax ? item.budgetMax.toLocaleString() : 'Open'}
                              </p>
                            )}
                            {item.needByDate && (
                              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                Need by: {item.needByDate}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {item.contactPerson || 'N/A'}
                            </p>
                            {item.contactEmail && (
                              <p className="text-xs text-slate-500 truncate max-w-[180px]">
                                {item.contactEmail}
                              </p>
                            )}
                            {item.mobileNumber && (
                              <p className="text-xs text-slate-500">
                                {item.mobileCode || '+91'} {item.mobileNumber}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isPublished
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                          {status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition inline-flex items-center gap-1"
                        >
                          View Details
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Requirement Details Modal / Drawer */}
      {selectedItem && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
                    {isBuyer ? selectedItem.requirementNo : selectedItem.capabilityNo}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    (selectedItem.status || '').toUpperCase() === 'PUBLISHED' || (selectedItem.status || '').toUpperCase() === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {selectedItem.status || 'ACTIVE'}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-2">{selectedItem.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Posted on: {new Date(selectedItem.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description</h3>
              <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                {selectedItem.description || 'No detailed description provided.'}
              </p>
            </div>

            {/* Organization & Contact Card */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isBuyer ? 'Buyer Organization Details' : 'Seller Organization Details'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Company Name</p>
                  <p className="font-bold text-slate-800">{selectedItem.organizationName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Location</p>
                  <p className="font-bold text-slate-800">
                    {selectedItem.organizationCity ? `${selectedItem.organizationCity}, ${selectedItem.organizationState}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">GSTIN</p>
                  <p className="font-mono text-xs font-bold text-slate-800">{selectedItem.organizationGstin || 'Not provided'}</p>
                </div>
                {!isBuyer && selectedItem.udyamNumber && (
                  <div>
                    <p className="text-xs text-slate-400">Udyam Registration</p>
                    <p className="font-mono text-xs font-bold text-slate-800">{selectedItem.udyamNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-400">Contact Representative</p>
                  <p className="font-bold text-slate-800">{selectedItem.contactPerson || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Email & Phone</p>
                  <p className="text-xs font-semibold text-slate-700">
                    {selectedItem.contactEmail || 'N/A'}
                    {selectedItem.contactPhone || selectedItem.mobileNumber ? ` • ${selectedItem.contactPhone || selectedItem.mobileNumber}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Specifications & Commercials (Buyer) */}
            {isBuyer && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Requirement Specifications</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[11px] text-slate-400">Sourcing Type</p>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedItem.sourcingType || 'PRODUCT'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[11px] text-slate-400">Quantity Needed</p>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {selectedItem.quantity ? `${selectedItem.quantity} ${selectedItem.uomCode || 'NOS'}` : 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[11px] text-slate-400">Budget Range</p>
                    <p className="font-bold text-emerald-700 mt-0.5">
                      {selectedItem.budgetMin || selectedItem.budgetMax
                        ? `₹${selectedItem.budgetMin?.toLocaleString() || '0'} - ₹${selectedItem.budgetMax?.toLocaleString() || 'Open'}`
                        : 'Not disclosed'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[11px] text-slate-400">Need by Date</p>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedItem.needByDate || 'Flexible'}</p>
                  </div>
                </div>

                {(selectedItem.mainCategoryCode || selectedItem.classificationCode) && (
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500">Classification:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedItem.mainCategoryCode} {selectedItem.classificationCode ? `• ${selectedItem.classificationCode}` : ''}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Specifications (Seller) */}
            {!isBuyer && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Capability Specifications</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[11px] text-slate-400">Business Type</p>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedItem.businessType || 'MANUFACTURER'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[11px] text-slate-400">Capability Type</p>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedItem.capabilityType || 'Both'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[11px] text-slate-400">Plant Location</p>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedItem.plantLocation || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-400">
                {isBuyer && selectedItem.matchCount > 0 && (
                  <span className="text-emerald-700 font-semibold">
                    🎯 {selectedItem.matchCount} matched suppliers found
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedItem.contactEmail && (
                  <a
                    href={`mailto:${selectedItem.contactEmail}`}
                    className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition inline-flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email Contact
                  </a>
                )}
                {selectedItem.contactPhone || selectedItem.mobileNumber ? (
                  <a
                    href={`tel:${selectedItem.contactPhone || selectedItem.mobileNumber}`}
                    className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition inline-flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call Contact
                  </a>
                ) : null}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}
