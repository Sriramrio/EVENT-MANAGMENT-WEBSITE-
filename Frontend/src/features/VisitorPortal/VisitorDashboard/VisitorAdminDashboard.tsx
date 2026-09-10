import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertCircle, RefreshCw, Briefcase, MapPin, Building2, Calendar, ChevronRight } from 'lucide-react';
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
  const navigate = useNavigate();

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

      {/* KPI Cards - Clickable Navigation */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Total Visitors Card -> Navigates to normal Visitor List */}
        <button
          type="button"
          onClick={() => navigate('/visitorShell/VisitorList')}
          className="text-left rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          title="Click to view all registered visitors"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <Users size={28} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 group-hover:text-indigo-600 transition-colors">Total Visitors</p>
              <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {loading ? '...' : summary?.totalVisitors ?? 0}
            </p>
          </div>
        </button>
        
        {/* 2. Industries Card -> Navigates to Visitor List with Industry focus/filter */}
        <button
          type="button"
          onClick={() => navigate('/visitorShell/VisitorList?focus=industry')}
          className="text-left rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          title="Click to view and filter by industries"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <Briefcase size={28} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 group-hover:text-emerald-600 transition-colors">Industries</p>
              <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {loading ? '...' : Object.keys(summary?.visitorsByIndustryCategory ?? {}).length}
            </p>
          </div>
        </button>

        {/* 3. States/Districts Card -> Navigates to Visitor List with District/Location focus/filter */}
        <button
          type="button"
          onClick={() => navigate('/visitorShell/VisitorList?focus=district')}
          className="text-left rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          title="Click to view and filter by state/district"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
            <MapPin size={28} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 group-hover:text-amber-600 transition-colors">States/Districts</p>
              <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {loading ? '...' : Object.keys(summary?.visitorsByState ?? {}).length}
            </p>
          </div>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Visitors by Industry */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Visitors by Industry
            </h3>
            <button
              type="button"
              onClick={() => navigate('/visitorShell/VisitorList?focus=industry')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 hover:underline"
            >
              View Filter <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-4">
            {loading ? (
              <p className="text-slate-500">Loading...</p>
            ) : Object.entries(summary?.visitorsByIndustryCategory ?? {}).length === 0 ? (
              <p className="text-slate-500 text-sm">No data available.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {Object.entries(summary?.visitorsByIndustryCategory ?? {}).map(([industry, count]) => (
                  <li
                    key={industry}
                    onClick={() => navigate(`/visitorShell/VisitorList?industry=${encodeURIComponent(industry)}`)}
                    className="py-3 px-2.5 -mx-2 rounded-xl flex justify-between items-center hover:bg-slate-50 cursor-pointer transition-colors group"
                    title={`Filter visitors by ${industry}`}
                  >
                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                      {industry}
                    </span>
                    <span className="text-sm font-bold bg-slate-100 text-slate-800 group-hover:bg-indigo-50 group-hover:text-indigo-700 px-2.5 py-1 rounded-lg transition-colors">
                      {count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Visitors by State/District */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Visitors by Location
            </h3>
            <button
              type="button"
              onClick={() => navigate('/visitorShell/VisitorList?focus=district')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 hover:underline"
            >
              View Filter <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-4">
            {loading ? (
              <p className="text-slate-500">Loading...</p>
            ) : Object.entries(summary?.visitorsByState ?? {}).length === 0 ? (
              <p className="text-slate-500 text-sm">No data available.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {Object.entries(summary?.visitorsByState ?? {}).map(([state, count]) => (
                  <li
                    key={state}
                    onClick={() => navigate(`/visitorShell/VisitorList?district=${encodeURIComponent(state)}`)}
                    className="py-3 px-2.5 -mx-2 rounded-xl flex justify-between items-center hover:bg-slate-50 cursor-pointer transition-colors group"
                    title={`Filter visitors from ${state}`}
                  >
                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                      {state}
                    </span>
                    <span className="text-sm font-bold bg-slate-100 text-slate-800 group-hover:bg-indigo-50 group-hover:text-indigo-700 px-2.5 py-1 rounded-lg transition-colors">
                      {count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Recent Visitors */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Recent Registrations
          </h3>
          <button
            type="button"
            onClick={() => navigate('/visitorShell/VisitorList')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 hover:underline"
          >
            View All Visitors <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
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
                  <tr
                    key={visitor.id}
                    onClick={() => navigate(`/visitorShell/VisitorList?search=${encodeURIComponent(visitor.registrationNumber)}`)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    title={`View details for ${visitor.registrationNumber}`}
                  >
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
