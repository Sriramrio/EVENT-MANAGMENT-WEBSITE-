import React, { useEffect, useState } from 'react';
import { Users, AlertCircle, RefreshCw, Briefcase, MapPin, Building2, Calendar, Phone } from 'lucide-react';
import { apiClient } from '../../../data/api/apiClient';

interface VisitorAdminDashboardProps {
  tenantId: string;
  eventId: string;
}

interface RecentVisitorDto {
  id: string;
  registrationNumber: string;
  legalName: string;
  contactPersonName: string;
  mobile: string;
  city: string;
  createdAt: string;
}

interface VisitorDashboardSummaryDto {
  totalVisitors: number;
  visitorsByIndustryCategory: Record<string, number>;
  visitorsByState: Record<string, number>;
  recentVisitors: RecentVisitorDto[];
}

export function VisitorAdminDashboard({ tenantId, eventId }: VisitorAdminDashboardProps) {
  const [summary, setSummary] = useState<VisitorDashboardSummaryDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await apiClient.get(`/visitors/dashboard?tenantId=${tenantId}&eventId=${eventId}`);
      
      setSummary(res);
    } catch (err: any) {
      setError(err.message || 'Error fetching visitor dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId && eventId) {
      fetchDashboard();
    }
  }, [tenantId, eventId]);

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             Visitor Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
             Overview of visitor metrics and statistics
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Visitors</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {loading ? '...' : summary?.totalVisitors ?? 0}
            </p>
          </div>
        </div>
        
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Briefcase size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Industries</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {loading ? '...' : Object.keys(summary?.visitorsByIndustryCategory ?? {}).length}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <MapPin size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">States/Districts</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {loading ? '...' : Object.keys(summary?.visitorsByState ?? {}).length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Visitors by Industry */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Visitors by Industry
          </h3>
          <div className="space-y-4">
            {loading ? (
              <p className="text-slate-500">Loading...</p>
            ) : Object.entries(summary?.visitorsByIndustryCategory ?? {}).length === 0 ? (
              <p className="text-slate-500 text-sm">No data available.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {Object.entries(summary?.visitorsByIndustryCategory ?? {}).map(([industry, count]) => (
                  <li key={industry} className="py-3 flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">{industry}</span>
                    <span className="text-sm font-bold bg-slate-100 text-slate-800 px-2 py-1 rounded-lg">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Visitors by State/District */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-indigo-600" />
            Visitors by Location
          </h3>
          <div className="space-y-4">
            {loading ? (
              <p className="text-slate-500">Loading...</p>
            ) : Object.entries(summary?.visitorsByState ?? {}).length === 0 ? (
              <p className="text-slate-500 text-sm">No data available.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {Object.entries(summary?.visitorsByState ?? {}).map(([state, count]) => (
                  <li key={state} className="py-3 flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">{state}</span>
                    <span className="text-sm font-bold bg-slate-100 text-slate-800 px-2 py-1 rounded-lg">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Recent Visitors */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Recent Registrations
        </h3>
        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : !summary?.recentVisitors?.length ? (
          <p className="text-slate-500 text-sm">No recent visitors.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-xs">
                  <th className="py-3 px-4">Reg No</th>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.recentVisitors.map((visitor) => (
                  <tr key={visitor.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-indigo-600">
                      {visitor.registrationNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {visitor.legalName}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {visitor.contactPersonName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {visitor.mobile}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {visitor.city}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-right">
                      {new Date(visitor.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
