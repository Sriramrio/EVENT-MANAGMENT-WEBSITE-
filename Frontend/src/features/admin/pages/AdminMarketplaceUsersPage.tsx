import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { LoadingState, ErrorState } from '../../../components/ui/PageStates';
import {
  Building2,
  Search,
  UserCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Mail,
  Phone,
  Power
} from 'lucide-react';
import { apiClient } from '../../../data/api/apiClient';

interface AdminOrgItem {
  id: string;
  legalName: string;
  tradeName?: string;
  gstin?: string;
  udyamNumber?: string;
  city: string;
  state: string;
  status: string;
  createdAt: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactDesignation?: string;
  passwordHint: string;
  userId?: string;
}

export function AdminMarketplaceUsersPage({ kind }: { kind?: 'BUYER' | 'SELLER' }) {
  const [data, setData] = useState<AdminOrgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  
  // Password visibility map (orgId -> boolean)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  // Copied feedback map (key -> boolean)
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  // In-flight action tracking
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  // Status banner/alert message
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const endpoint = kind === 'SELLER'
    ? '/marketplace/organizations/admin/sellers'
    : '/marketplace/organizations/admin/buyers';

  const loadData = () => {
    setLoading(true);
    setError(null);
    apiClient.get<AdminOrgItem[]>(endpoint)
      .then(res => setData(res || []))
      .catch(err => setError(err instanceof Error ? err : new Error('Failed to load organizations.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [kind]);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, key: string) => {
    if (!text || text === 'N/A') return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSendCredentials = async (org: AdminOrgItem) => {
    setSendingId(org.id);
    setBanner(null);
    try {
      const res = await apiClient.post<{ message?: string; email?: string; temporaryPassword?: string }>(
        `/marketplace/organizations/admin/${org.id}/send-credentials`,
        {}
      );
      if (res.temporaryPassword) {
        setData(prev => prev.map(item => item.id === org.id ? { ...item, passwordHint: res.temporaryPassword! } : item));
        setVisiblePasswords(prev => ({ ...prev, [org.id]: true }));
      }
      setBanner({
        type: 'success',
        message: res.message || `Credentials successfully sent to ${org.contactEmail}!`
      });
    } catch (err: any) {
      setBanner({
        type: 'error',
        message: err?.message || `Failed to send credentials to ${org.contactEmail}. Please try again.`
      });
    } finally {
      setSendingId(null);
    }
  };

  const handleToggleStatus = async (org: AdminOrgItem) => {
    setTogglingId(org.id);
    setBanner(null);
    try {
      const res = await apiClient.post<{ status: string; message?: string }>(
        `/marketplace/organizations/admin/${org.id}/toggle-status`,
        {}
      );
      const newStatus = res.status || (org.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
      setData(prev => prev.map(item => item.id === org.id ? { ...item, status: newStatus } : item));
      setBanner({
        type: 'success',
        message: `Organisation ${org.legalName} is now ${newStatus}.`
      });
    } catch (err: any) {
      setBanner({
        type: 'error',
        message: err?.message || 'Failed to update organization status.'
      });
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} retry={loadData} />;

  const filtered = data.filter(o => {
    const matchesStatus = statusFilter === 'ALL' || (o.status || 'ACTIVE').toUpperCase() === statusFilter;
    const q = search.toLowerCase().trim();
    if (!q) return matchesStatus;
    const matchesQuery =
      (o.legalName && o.legalName.toLowerCase().includes(q)) ||
      (o.tradeName && o.tradeName.toLowerCase().includes(q)) ||
      (o.contactName && o.contactName.toLowerCase().includes(q)) ||
      (o.contactEmail && o.contactEmail.toLowerCase().includes(q)) ||
      (o.contactPhone && o.contactPhone.toLowerCase().includes(q)) ||
      (o.gstin && o.gstin.toLowerCase().includes(q)) ||
      (o.udyamNumber && o.udyamNumber.toLowerCase().includes(q)) ||
      (o.city && o.city.toLowerCase().includes(q));
    return matchesStatus && matchesQuery;
  });

  const totalCount = data.length;
  const activeCount = data.filter(d => (d.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
  const inactiveCount = totalCount - activeCount;

  const entityTitle = kind === 'SELLER' ? 'Seller' : 'Buyer';

  return (
    <div className="space-y-6">
      {/* Banner / Toast */}
      {banner && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border animate-in fade-in duration-300 shadow-sm ${
            banner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <p className="text-sm font-semibold">{banner.message}</p>
          </div>
          <button
            onClick={() => setBanner(null)}
            className="text-xs font-bold px-2 py-1 rounded hover:bg-black/5 transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {kind === 'SELLER' ? (
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <ShieldCheck className="w-6 h-6" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                <UserCheck className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                {entityTitle} Details Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                View registered {entityTitle.toLowerCase()}s, manage account access, view credentials, and send login details on demand.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh List
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3.5 border-slate-200">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Registered {entityTitle}s
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
              Active Accounts
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{activeCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5 border-slate-200">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <Power className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Inactive Accounts
            </p>
            <p className="text-2xl font-black text-slate-600 mt-0.5">{inactiveCount}</p>
          </div>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={`Search by organisation name, contact person, email, mobile, GSTIN, city...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Status:</span>
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md transition ${
                  statusFilter === s
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-5 py-3.5">Organisation</th>
                <th className="px-5 py-3.5">Tax & Reg IDs</th>
                <th className="px-5 py-3.5">Contact Person</th>
                <th className="px-5 py-3.5">Login Email</th>
                <th className="px-5 py-3.5">Security</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(org => {
                const isPasswordVisible = !!visiblePasswords[org.id];
                const isSending = sendingId === org.id;
                const isToggling = togglingId === org.id;
                const isActive = (org.status || 'ACTIVE').toUpperCase() === 'ACTIVE';

                return (
                  <tr key={org.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Organisation */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-sm max-w-[220px] truncate" title={org.legalName}>
                        {org.legalName}
                      </div>
                      {org.tradeName && org.tradeName !== org.legalName && (
                        <div className="text-xs text-slate-500 italic max-w-[220px] truncate">{org.tradeName}</div>
                      )}
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        ID: {org.id.slice(0, 8)} • Joined: {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>

                    {/* Tax & Reg */}
                    <td className="px-5 py-4">
                      {org.gstin ? (
                        <div className="text-xs font-mono font-medium text-slate-800">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">GSTIN</span>
                          {org.gstin}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">GST: -</span>
                      )}
                      {org.udyamNumber && (
                        <div className="mt-1 text-xs font-mono font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 w-max">
                          {org.udyamNumber}
                        </div>
                      )}
                    </td>

                    {/* Contact Person */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{org.contactName || 'N/A'}</div>
                      {org.contactDesignation && (
                        <div className="text-xs text-slate-500">{org.contactDesignation}</div>
                      )}
                      {org.contactPhone && (
                        <a
                          href={`tel:${org.contactPhone}`}
                          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 mt-0.5 font-medium"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          {org.contactPhone}
                        </a>
                      )}
                    </td>

                    {/* Login Email */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-800 text-xs font-mono bg-slate-50 px-2 py-1 rounded border border-slate-200/80">
                          {org.contactEmail}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(org.contactEmail, `email-${org.id}`)}
                          title="Copy Email"
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition hover:bg-slate-100"
                        >
                          {copiedKey === `email-${org.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Password View & Copy */}
                    <td className="px-5 py-4">
                      {org.passwordHint && org.passwordHint !== 'Available on Send' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs bg-slate-50 px-2 py-1 rounded border border-slate-200/80 text-slate-800 font-medium">
                            {visiblePasswords[org.id] ? org.passwordHint : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(org.id)}
                            title={visiblePasswords[org.id] ? "Hide Password" : "View Password"}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition hover:bg-slate-100"
                          >
                            {visiblePasswords[org.id] ? (
                              <EyeOff className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(org.passwordHint, `pass-${org.id}`)}
                            title="Copy Password"
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition hover:bg-slate-100"
                          >
                            {copiedKey === `pass-${org.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5" title="No temporary password recorded yet. Click 'Send Credentials' to generate and email a fresh password.">
                          <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 font-medium">
                            Available on Send
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Location */}
                    <td className="px-5 py-4">
                      <div className="text-xs font-semibold text-slate-800">{org.city || 'N/A'}</div>
                      <div className="text-[11px] text-slate-500">{org.state}</div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
                        />
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Send Credentials Button */}
                        <button
                          type="button"
                          onClick={() => handleSendCredentials(org)}
                          disabled={isSending}
                          title="Send Email with Login Credentials"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition disabled:opacity-50"
                        >
                          {isSending ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Sending…
                            </>
                          ) : (
                            <>
                              <Mail className="w-3.5 h-3.5" />
                              Send Credentials
                            </>
                          )}
                        </button>

                        {/* Toggle Status Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(org)}
                          disabled={isToggling}
                          title={isActive ? 'Deactivate Organisation' : 'Activate Organisation'}
                          className={`p-1.5 rounded-lg border text-xs font-semibold transition ${
                            isActive
                              ? 'border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          } disabled:opacity-50`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Building2 className="w-10 h-10 text-slate-300 mb-2" />
                      <p className="font-bold text-slate-700">No {entityTitle.toLowerCase()}s found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {search ? `No records matching "${search}". Try adjusting your filters.` : `No ${entityTitle.toLowerCase()} organizations registered yet.`}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
