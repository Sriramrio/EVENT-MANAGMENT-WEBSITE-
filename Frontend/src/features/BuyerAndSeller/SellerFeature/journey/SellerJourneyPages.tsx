import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Award,
  CalendarDays,
  CheckCircle2,
  FileText,
  Handshake,
  MapPin,
  Target,
  ArrowRight,
  Sparkles,
  Layers,
  Clock,
  Package,
  Search,
  SlidersHorizontal,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ChevronDown
} from 'lucide-react';
import {
  useSellerAwards,
  useSellerMeetings,
  useSellerOpportunities,
  useSellerRfqs,
  useSellerReports
} from '../../../../services/seller/hooks';
import { ErrorState, LoadingState } from '../../../../components/ui/PageStates';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { DataTable, type Column } from '../../../../components/data-display/DataTable';
import { SellerNegotiationsPage } from '../negotiations/SellerNegotiationsPage';
import { RefreshListButton } from '../../../../shared/components/RefreshListButton';
import {
  ArrowUpDown,

  ChevronUp,
 
} from 'lucide-react';


const PAGE_SIZE_OPTIONS = [10, 20, 50];

// Mirrors MatchingController.Run()'s per-match explanation string (buyer side shows
// the same tag on MatchedSuppliersPage) — turns it into a small colored badge so
// sellers can see at a glance *why* a requirement matched their capability.
function categoryMatchTag(reason?: string): { label: string; className: string } {
  if (reason && /exact classification/i.test(reason)) {
    return { label: 'Exact Classification Match', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  if (reason && /main-category/i.test(reason)) {
    return { label: 'Main Category Match', className: 'bg-blue-50 text-blue-700 border-blue-200' };
  }
  return { label: 'Keyword & Capacity Match', className: 'bg-amber-50 text-amber-700 border-amber-200' };
}

type SortField = 'requirementNo' | 'title' | 'capabilityTitle' | 'quantity' | 'needByDate' | 'matchScore';
type SortOrder = 'asc' | 'desc';

export function OpportunitiesPage() {
  const q = useSellerOpportunities();
  const nav = useNavigate();

  // Search & Filters
  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState<number>(0);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('matchScore');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filter & Sort Data
  const filteredData = useMemo(() => {
    if (!q.data) return [];

    return q.data
      .filter((item) => {
        const matchesQuery =
          item.title?.toLowerCase().includes(search.toLowerCase()) ||
          item.requirementNo?.toLowerCase().includes(search.toLowerCase()) ||
          item.capabilityTitle?.toLowerCase().includes(search.toLowerCase());

        const matchesScore = (item.matchScore ?? 0) >= minScore;
        return matchesQuery && matchesScore;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'needByDate') {
          valA = new Date(valA || 0).getTime();
          valB = new Date(valB || 0).getTime();
        } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = (valB || '').toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [q.data, search, minScore, sortField, sortOrder]);

  // Pagination Calculations
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, safePage, pageSize]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  if (q.isLoading) return <LoadingState label="Loading matching opportunities…" />;
  if (q.isError) return <ErrorState error={q.error} retry={() => q.refetch()} />;

  return (
    <Page
      title="Matching Opportunities"
      subtitle="Explainable buyer requirements matched to your published capabilities"
    >
      {/* Search & Filter Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search requirements, codes, or capabilities…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold text-slate-500">Min Score:</span>
            <select
              value={minScore}
              onChange={(e) => {
                setMinScore(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-transparent font-bold text-slate-700 focus:outline-none"
            >
              <option value={0}>All Matches</option>
              <option value={50}>50% & Above</option>
              <option value={70}>70% & Above</option>
              <option value={85}>85% & Above</option>
            </select>
          </div>
          <RefreshListButton onRefresh={() => q.refetch()} />
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th
                  onClick={() => handleSort('requirementNo')}
                  className="cursor-pointer px-4 py-3 hover:text-slate-800"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Req No</span>
                    <SortIcon field="requirementNo" currentField={sortField} currentOrder={sortOrder} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('title')}
                  className="cursor-pointer px-4 py-3 hover:text-slate-800"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Requirement Title</span>
                    <SortIcon field="title" currentField={sortField} currentOrder={sortOrder} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('capabilityTitle')}
                  className="cursor-pointer px-4 py-3 hover:text-slate-800"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Matched Capability</span>
                    <SortIcon field="capabilityTitle" currentField={sortField} currentOrder={sortOrder} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('quantity')}
                  className="cursor-pointer px-4 py-3 hover:text-slate-800"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Quantity</span>
                    <SortIcon field="quantity" currentField={sortField} currentOrder={sortOrder} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('needByDate')}
                  className="cursor-pointer px-4 py-3 hover:text-slate-800"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Need By</span>
                    <SortIcon field="needByDate" currentField={sortField} currentOrder={sortOrder} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('matchScore')}
                  className="cursor-pointer px-4 py-3 hover:text-slate-800"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Match Score</span>
                    <SortIcon field="matchScore" currentField={sortField} currentOrder={sortOrder} />
                  </div>
                </th>
                <th className="px-4 py-3">Category Match</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 font-medium text-slate-600">No matching opportunities found</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((x) => (
                  <tr key={x.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-4 py-3.5 font-bold text-blue-600">
                      {x.requirementNo}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3.5 font-semibold text-slate-900">
                      {x.title}
                    </td>
                    <td className="max-w-[14rem] truncate px-4 py-3.5 text-slate-600 font-medium">
                      {x.capabilityTitle}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-700">
                      {x.quantity?.toLocaleString()} <span className="text-slate-400 font-normal">{x.uomCode}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                      {x.needByDate || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700">
                        <Sparkles className="h-3 w-3" />
                        {x.matchScore}%
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      {(() => {
                        const tag = categoryMatchTag(x.explanation);
                        return (
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${tag.className}`}>
                            {tag.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <button
                        onClick={() => nav(`/seller/opportunities/${x.id}`)}
                        className="btn btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold"
                      >
                        <span>View</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        {totalItems > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs sm:flex-row">
            <div className="flex items-center gap-4 text-slate-500">
              <span>
                Showing <strong className="font-bold text-slate-800">{(safePage - 1) * pageSize + 1}</strong> to{' '}
                <strong className="font-bold text-slate-800">{Math.min(safePage * pageSize, totalItems)}</strong> of{' '}
                <strong className="font-bold text-slate-800">{totalItems}</strong> entries
              </span>

              <div className="flex items-center gap-1.5">
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-bold text-slate-700 shadow-sm focus:outline-none"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={safePage === 1}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage === 1}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .map((page, idx, arr) => (
                    <React.Fragment key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && <span className="px-1 text-slate-400">…</span>}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`h-7 w-7 rounded-lg text-xs font-bold ${
                          safePage === page
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
              </div>

              <button
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage === totalPages}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={safePage === totalPages}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}

function SortIcon({
  field,
  currentField,
  currentOrder
}: {
  field: SortField;
  currentField: SortField;
  currentOrder: SortOrder;
}) {
  if (field !== currentField) {
    return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  }
  return currentOrder === 'asc' ? (
    <ChevronUp className="h-3.5 w-3.5 text-blue-600" />
  ) : (
    <ChevronDown className="h-3.5 w-3.5 text-blue-600" />
  );
}





export function OpportunityDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const q = useSellerOpportunities();
  const x = q.data?.find((v) => v.id === id);

  return (
    <Page
      title="Opportunity Detail & Express Interest"
      subtitle="Review the requirement, match explanation and buyer invitation state"
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <Panel title="1. Requirement Snapshot">
            <Grid
              rows={[
                ['Requirement', x?.requirementNo],
                ['Title', x?.title],
                ['Quantity', `${x?.quantity ?? 0} ${x?.uomCode ?? ''}`],
                ['Need By', x?.needByDate],
                ['Location', 'Chennai, Tamil Nadu'],
                ['Buyer', 'Visible after mutual interest']
              ]}
            />
          </Panel>

          <Panel title="2. Match Explanation">
            {x?.explanation && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {(() => {
                  const tag = categoryMatchTag(x.explanation);
                  return (
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${tag.className}`}>
                      {tag.label}
                    </span>
                  );
                })()}
                <span className="text-xs font-medium text-slate-500 italic">"{x.explanation}"</span>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-5">
              {[
                ['Classification', 95],
                ['Technical', 90],
                ['Quality', 85],
                ['Capacity', 80],
                ['Commercial', 75]
              ].map(([n, s]) => (
                <div key={n} className="rounded-xl bg-emerald-50 p-3 text-center">
                  <strong className="text-emerald-700">{s}%</strong>
                  <p className="text-[10px] font-medium text-slate-600">{n}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="3. Buyer Notes / Attachments">
            <p className="text-xs text-slate-600">
              Drawings and detailed specifications become available after NDA / mutual interest.
            </p>
          </Panel>
        </div>

        <div className="card h-fit p-5">
          <Target className="h-7 w-7 text-blue-600" />
          <h2 className="mt-3 text-sm font-extrabold">Seller Response</h2>
          <p className="mt-2 text-xs text-slate-500">
            Confirm interest to allow the buyer to shortlist your capability.
          </p>
          <button
            onClick={() => nav(`/seller/opportunities/${id}/invitation`)}
            className="btn btn-primary mt-5 w-full"
          >
            Express Interest
          </button>
          <button className="btn btn-secondary mt-2 w-full">Not Interested</button>
        </div>
      </div>
    </Page>
  );
}

export function InvitationPage() {
  const nav = useNavigate();

  return (
    <Page title="Buyer Shortlist / Invitation" subtitle="The buyer has shortlisted your capability">
      <div className="card p-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          ✓ Good news! You have been shortlisted by the buyer.
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Panel title="1. Invitation Summary">
            <Grid
              rows={[
                ['Buyer', 'ABC Machine Tools Pvt. Ltd.'],
                ['Requirement', 'CNC Machining Center'],
                ['Quantity', '120,000 parts'],
                ['Response Due', '25 Aug 2026']
              ]}
            />
          </Panel>
          <Panel title="2. Requirement Recap">
            <Grid
              rows={[
                ['Category', 'CNC / Precision Machining'],
                ['Location', 'Chennai, Tamil Nadu'],
                ['Match Score', '92%'],
                ['Status', 'SHORTLISTED']
              ]}
            />
          </Panel>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn btn-danger">Decline Invitation</button>
          <button className="btn btn-secondary">Ask Clarification</button>
          <button onClick={() => nav('/seller/meetings')} className="btn btn-primary">
            Accept Invitation
          </button>
        </div>
      </div>
    </Page>
  );
}

export function MeetingsPage() {
  const q = useSellerMeetings();
  return (
    <CollectionPage
      title="Meetings"
      subtitle="Availability, confirmation, briefing and outcomes"
      icon={<CalendarDays />}
      query={q}
      empty="No meetings scheduled yet."
    />
  );
}

const rfqCols: Column<any>[] = [
  { key: 'id', header: 'RFQ No', cell: (r) => <span className="font-bold text-blue-600">{r.rfqNo || r.id.slice(0, 8)}</span> },
  { key: 'deadline', header: 'Deadline', cell: (r) => r.submissionDeadline ? new Date(r.submissionDeadline).toLocaleDateString() : 'N/A' },
  { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status || 'DRAFT'} /> },
  { key: 'action', header: 'Action', className: 'text-right', cell: () => <button className="btn btn-secondary text-xs py-1 px-2">View</button> }
];

export function RfqsPage() {
  const q = useSellerRfqs();
  if (q.isLoading) return <LoadingState label="Loading RFQs…" />;
  if (q.isError) return <ErrorState error={q.error} retry={() => q.refetch()} />;

  return (
    <Page
      title="RFQ / Quotation Submission"
      subtitle="Review buyer RFQs, compliance checklist and quotation revisions"
      actions={<RefreshListButton onRefresh={() => q.refetch()} />}
    >
      <DataTable rows={q.data ?? []} columns={rfqCols} caption="RFQs" />
    </Page>
  );
}

const awardCols: Column<any>[] = [
  { key: 'id', header: 'Award No', cell: (r) => <span className="font-bold text-blue-600">{r.awardNo || r.id.slice(0, 8)}</span> },
  { key: 'value', header: 'Value', cell: (r) => <span className="font-semibold">{r.currency} {r.awardValue?.toLocaleString() ?? '—'}</span> },
  { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status || 'AWARDED'} /> },
  { key: 'action', header: 'Action', className: 'text-right', cell: () => <button className="btn btn-secondary text-xs py-1 px-2">View</button> }
];

export function AwardsPage() {
  const q = useSellerAwards();
  if (q.isLoading) return <LoadingState label="Loading awards…" />;
  if (q.isError) return <ErrorState error={q.error} retry={() => q.refetch()} />;

  return (
    <Page
      title="Award / Closure"
      subtitle="Purchase-order style award summary and milestones"
      actions={<RefreshListButton onRefresh={() => q.refetch()} />}
    >
      <DataTable rows={q.data ?? []} columns={awardCols} caption="Awards" />
    </Page>
  );
}

export function StaticJourneyPage({ kind }: { kind: 'negotiations' | 'reports' | 'settings' }) {
  if (kind === 'reports') {
    const reports = useSellerReports();
    const data = reports.data as any;
    const kpis = data?.kpis;
    const recentReports = data?.recentReports || [];
    
    return (
      <Page title="Reports & Analytics" subtitle="Capability performance, match conversion and award value">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <h3 className="text-xs font-bold text-slate-500 uppercase">Opportunities</h3>
            <p className="mt-2 text-2xl font-extrabold text-blue-600">{kpis?.opportunities ?? 0}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <h3 className="text-xs font-bold text-slate-500 uppercase">Meetings Completed</h3>
            <p className="mt-2 text-2xl font-extrabold text-blue-600">{kpis?.meetingsCompleted ?? 0}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <h3 className="text-xs font-bold text-slate-500 uppercase">Awards Won</h3>
            <p className="mt-2 text-2xl font-extrabold text-blue-600">{kpis?.awardsWon ?? 0}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <h3 className="text-xs font-bold text-slate-500 uppercase">Award Value</h3>
            <p className="mt-2 text-2xl font-extrabold text-blue-600">{kpis?.potentialValue ?? '₹0'}</p>
          </div>
        </div>
        
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-sm font-extrabold text-slate-900">Recent Reports</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recentReports.map((r: any) => (
              <div className="flex items-center justify-between gap-4 p-4" key={r.id}>
                <div>
                  <b className="text-xs text-slate-800">{r.name}</b>
                  <p className="text-[10px] text-slate-400">Generated on {r.generatedAt}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={r.status}/>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Page>
    );
  }

  if (kind === 'negotiations') {
    return <SellerNegotiationsPage />;
  }

  const content =
    kind === 'settings'
      ? ['Settings & Preferences', 'Notifications, profile visibility and communication preferences', MapPin]
      : ['Unknown', 'Unknown', MapPin];

  const Icon = content[2] as typeof Target;

  return (
    <Page title={String(content[0])} subtitle={String(content[1])}>
      <div className="card p-10 text-center">
        <Icon className="mx-auto h-10 w-10 text-blue-600" />
        <h2 className="mt-3 text-base font-extrabold">{String(content[0])}</h2>
        <p className="mt-2 text-sm text-slate-500">
          This screen uses the same seller workflow and server-authoritative data.
        </p>
      </div>
    </Page>
  );
}

function CollectionPage({
  title,
  subtitle,
  icon,
  query,
  empty
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  query: {
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => unknown;
    data?: unknown[];
  };
  empty: string;
}) {
  if (query.isLoading) return <LoadingState label={`Loading ${title.toLowerCase()}…`} />;
  if (query.isError) return <ErrorState error={query.error} retry={() => query.refetch()} />;

  return (
    <Page
      title={title}
      subtitle={subtitle}
      actions={<RefreshListButton onRefresh={() => { query.refetch(); }} />}
    >
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 border-b p-5 text-blue-600">
          {icon}
          <strong className="text-sm text-slate-900">{title}</strong>
        </div>
        {query.data?.length ? (
          query.data.map((row, index) => (
            <div
              className="grid grid-cols-[1fr_8rem] items-center gap-4 border-t p-4"
              key={String((row as { id?: string }).id ?? index)}
            >
              <pre className="overflow-hidden whitespace-pre-wrap text-xs text-slate-600">
                {JSON.stringify(row, null, 2)}
              </pre>
              <StatusBadge status={String((row as { status?: string }).status ?? 'ACTIVE')} />
            </div>
          ))
        ) : (
          <div className="p-10 text-center">
            <CheckCircle2 className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">{empty}</p>
          </div>
        )}
      </div>
    </Page>
  );
}

function Page({
  title,
  subtitle,
  actions,
  children
}: {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Seller Journey</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {actions}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Grid({ rows }: { rows: [string, unknown][] }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {rows.map(([a, b]) => (
        <div key={a}>
          <dt className="text-[10px] font-bold uppercase text-slate-400">{a}</dt>
          <dd className="mt-1 text-xs font-semibold text-slate-800">{String(b || '—')}</dd>
        </div>
      ))}
    </dl>
  );
}