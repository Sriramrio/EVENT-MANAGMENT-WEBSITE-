import { Link } from 'react-router-dom';
import { MessageSquare, Star, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useEngagements } from '../../../../services/buyer/hooks';
import { ScreenShell } from '../shared/ScreenShell';
import { LoadingState, ErrorState, EmptyState } from '../../../../components/ui/PageStates';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { Hint } from '../../../../components/ui/Hint';
import type { Engagement } from '../../../../domain/models/buyer';
import { Button } from '../../../../components/ui/Button';

// Multiple engagement rows can exist for the same (requirement, supplier) pair —
// e.g. a SHORTLISTED row plus a later MEETING_REQUESTED row created when the buyer
// asked for a meeting. This page shows one card per supplier/requirement pair, using
// the most recently updated row so the badge reflects the furthest stage reached.
function dedupeBySupplierAndRequirement(rows: Engagement[]): Engagement[] {
  const bySupplierAndRequirement = new Map<string, Engagement>();
  for (const row of rows) {
    const key = `${row.requirementId}::${row.sellerOrganizationId || row.capabilityId}`;
    const current = bySupplierAndRequirement.get(key);
    if (!current || new Date(row.updatedAt || row.createdAt) > new Date(current.updatedAt || current.createdAt)) {
      bySupplierAndRequirement.set(key, row);
    }
  }
  return Array.from(bySupplierAndRequirement.values());
}

export default function ShortlistedSuppliersPage() {
  const engagements = useEngagements();

  if (engagements.isLoading) return <LoadingState />;
  if (engagements.isError) return <ErrorState error={engagements.error} />;

  const rows = dedupeBySupplierAndRequirement(engagements.data ?? []);

  return (
    <ScreenShell
      screen={14.5}
      title="Shortlisted Suppliers"
      subtitle="Track and manage opportunities with suppliers you have shown interest in."
    >
      <div className="mb-8 rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-900 p-8 text-white shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300 border border-blue-500/30">
              <Star className="w-3.5 h-3.5 fill-blue-300" /> My Shortlist
            </div>
            <Hint>
              Suppliers in your shortlist are ones you've verified interest in. Keep track of them here and move them toward RFQ or Meeting requests.
            </Hint>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">
            {rows.length} Active Engagements
          </h1>
          <p className="text-sm text-blue-100 max-w-xl">
            You have initiated contact or shortlisted these suppliers. Manage your pipeline and advance the discussions from here.
          </p>
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r, i) => (
            <div key={i} className="group rounded-3xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                  <div className="inline-flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Star className="w-4 h-4 fill-blue-600" />
                    </span>
                  </div>
                  <StatusBadge status={r.stage} />
                </div>
                
                <h3 className="text-xl font-black text-slate-900 mb-1">{r.sellerOrganizationName || 'Supplier'}</h3>
                
                <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Matched Requirement</p>
                  <p className="font-bold text-slate-800">{r.requirementNo}</p>
                  <p className="text-sm text-slate-600 line-clamp-1">{r.requirementTitle}</p>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-4">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Verified</span>
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                
                <Link to={`/buyer/requirements/${r.requirementId}/suppliers/${r.sellerOrganizationId}/action`} className="block w-full">
                  <Button className="w-full justify-between bg-white text-slate-800 border border-slate-200 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-all rounded-xl py-3">
                    <span>Manage Engagement</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                
                <Link to="/buyer/messages" className="block w-full">
                  <Button variant="secondary" className="w-full justify-center gap-2 rounded-xl py-3 text-slate-600 bg-slate-50 border-transparent hover:bg-slate-100">
                    <MessageSquare className="w-4 h-4" /> Message Supplier
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Shortlisted Suppliers Yet"
          message="Shortlist a supplier from a requirement's Matched Suppliers list to see them here."
          action={
            <Link className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 shadow-md shadow-blue-500/20" to="/buyer/requirements">
              <Zap className="h-4 w-4" /> Discover Suppliers
            </Link>
          }
        />
      )}
    </ScreenShell>
  );
}