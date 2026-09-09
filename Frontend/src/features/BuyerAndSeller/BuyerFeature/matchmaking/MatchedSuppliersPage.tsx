import { Link, useParams } from 'react-router';
import { Column, DataTable } from '../../../../components/data-display/DataTable';
import { MatchScore } from '../../../../components/domain/MatchScore';
import { LoadingState, ErrorState, EmptyState } from '../../../../components/ui/PageStates';
import { useRequirementMatches } from '../../../../services/buyer/hooks';
import { ScreenShell } from '../shared/ScreenShell';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Hint } from '../../../../components/ui/Hint';

const isValidGuid = (val?: string): val is string =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

// MatchingController.Run() writes one of these three explanation strings per match,
// based on whether requirement/capability ClassificationCode or MainCategoryCode line
// up. Turn that into a small colored "category match" tag next to the score.
function categoryMatchTag(reason: string): { label: string; className: string } {
  if (/exact classification/i.test(reason)) {
    return { label: 'Exact Classification Match', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  if (/main-category/i.test(reason)) {
    return { label: 'Main Category Match', className: 'bg-blue-50 text-blue-700 border-blue-200' };
  }
  return { label: 'Keyword & Capacity Match', className: 'bg-amber-50 text-amber-700 border-amber-200' };
}

export default function MatchedSuppliersPage() {
  const { id } = useParams<{ id: string }>();

  const isGuid = isValidGuid(id);
  const requirementId = isGuid ? id : '';

  const q = useRequirementMatches(requirementId);

  if (!isGuid) {
    return (
      <ScreenShell screen={12} title="AI Matchmaking Results" subtitle="Intelligent supplier recommendations based on your technical criteria.">
        <EmptyState
          title="Invalid Requirement"
          message="No valid requirement selected. Please open a requirement from your dashboard or requirements list."
        />
      </ScreenShell>
    );
  }

  if (q.isLoading) return <LoadingState />;
  if (q.isError) return <ErrorState error={q.error} />;

  // Using any/fallback record to catch both PascalCase and camelCase API properties
  const matchesData = (q.data ?? []) as any[];

  return (
    <ScreenShell
      screen={12}
      title="AI Matchmaking Results"
      subtitle="Intelligent supplier recommendations based on your technical criteria."
    >
      <div className="mb-8 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300 border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5" /> AI Matchmaking Complete
            </div>
            <Hint>
              Our AI engine automatically scores suppliers based on your exact requirement parameters. The score reflects technical, capacity, and geographical fit.
            </Hint>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">
            Found {matchesData.length} Highly Qualified Suppliers
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Our matchmaking engine has evaluated suppliers based on material grades, machine capacities, technical specifications, and geographical proximity.
          </p>
        </div>
      </div>

      {matchesData.length > 0 ? (
        <div className="grid gap-5">
          {matchesData.map((r, idx) => {
            const scoreVal = Number(r.score ?? r.Score ?? r.overallScore ?? 0);
            const supplierId = r.supplierId ?? r.SupplierId ?? r.id;
            const supplierName = r.supplierName ?? r.SupplierName ?? r.title ?? 'Supplier';
            const capabilityId = (r.capabilityId ?? r.CapabilityId ?? r.id ?? '').slice(0, 8);
            const reason = r.explanation ?? r.Explanation ?? r.reason ?? 'Score based on classification and capacity fit';
            const status = r.status ?? r.Status ?? 'Recommended';
            
            return (
              <div key={supplierId} className="group rounded-3xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex flex-col lg:flex-row gap-6 justify-between">
                  
                  {/* Left Column: Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">
                        #{r.rank ?? r.Rank ?? idx + 1}
                      </span>
                      <StatusBadge status={status} />
                      {(() => {
                        const tag = categoryMatchTag(reason);
                        return (
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${tag.className}`}>
                            {tag.label}
                          </span>
                        );
                      })()}
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-900 mb-1">{supplierName}</h3>
                    <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Capability Ref: {capabilityId}</p>
                    
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 mb-4">
                      <p className="text-sm font-medium text-slate-700 italic">"{reason}"</p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                        <ShieldCheck className="w-4 h-4" /> Verified Profile
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-500" /> Technical Match
                      </span>
                    </div>
                  </div>
                  
                  {/* Right Column: Score & Action */}
                  <div className="flex flex-col justify-center items-center lg:items-end lg:w-64 lg:border-l lg:border-slate-100 lg:pl-6">
                    <div className="text-center mb-6">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Overall Match Score</p>
                      <div className="flex justify-center items-center gap-3">
                        <MatchScore score={scoreVal} size="lg" />
                        <span className="text-3xl font-black text-emerald-600">{scoreVal}%</span>
                      </div>
                    </div>
                    
                    <Link to={`/buyer/requirements/${requirementId}/suppliers/${supplierId}/action`} className="w-full">
                      <Button className="w-full flex justify-between shadow-md shadow-blue-500/20 py-3 rounded-xl bg-blue-600 hover:bg-blue-700">
                        <span>Review Profile & Connect</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No Matches Found"
          message="No eligible supplier results are currently available for this requirement."
        />
      )}
    </ScreenShell>
  );
}