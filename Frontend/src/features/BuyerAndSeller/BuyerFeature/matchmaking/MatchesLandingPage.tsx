import { Navigate, Link } from 'react-router';
import { Target } from 'lucide-react';
import { useRequirements } from '../../../../services/buyer/hooks';
import { LoadingState, ErrorState, EmptyState } from '../../../../components/ui/PageStates';
import { Card } from '../../../../components/ui/Card';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { ScreenShell } from '../shared/ScreenShell';

// The sidebar "Matches" link has no single requirement to jump to on its own — matches only
// exist per requirement (see MatchedSuppliersPage, route /buyer/requirements/:id/matches).
// This used to be hardcoded to a fake id ("req-001"), which always showed "Invalid
// Requirement". This page resolves it properly: one published requirement → go straight to
// its matches; several → let the buyer pick which one; none → explain why there's nothing yet.
export default function MatchesLandingPage() {
  const q = useRequirements();

  if (q.isLoading) return <LoadingState label="Loading your requirements…" />;
  if (q.isError) return <ErrorState error={q.error} retry={() => q.refetch()} />;

  const requirements = q.data ?? [];
  const withMatches = requirements.filter(r => (r.matchCount ?? 0) > 0);
  const candidates = withMatches.length > 0 ? withMatches : requirements;

  if (candidates.length === 0) {
    return (
      <ScreenShell screen={12} title="Matches" subtitle="AI-assisted supplier matches.">
        <EmptyState
          title="No Requirements Yet"
          message="Publish a requirement first — supplier matches are generated per requirement."
          action={<Link to="/buyer/requirements/new/basic" className="text-xs font-bold text-brand-600 hover:underline">Create a requirement →</Link>}
        />
      </ScreenShell>
    );
  }

  if (candidates.length === 1) {
    return <Navigate to={`/buyer/requirements/${candidates[0].id}/matches`} replace />;
  }

  return (
    <ScreenShell screen={12} title="Matches" subtitle="Choose a requirement to view its AI-assisted supplier matches.">
      <div className="grid gap-3 md:grid-cols-2">
        {candidates.map(r => (
          <Link key={r.id} to={`/buyer/requirements/${r.id}/matches`}>
            <Card className="flex items-center justify-between gap-3 p-4 transition hover:border-brand-200 hover:bg-brand-50/30">
              <div>
                <b className="text-sm text-slate-900">{r.title}</b>
                <div className="mt-0.5 text-[11px] text-slate-400">{r.code} · Updated {r.updatedAt}</div>
                <div className="mt-2"><StatusBadge status={r.status} /></div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-brand-600">
                <Target className="h-5 w-5" />
                <span className="text-xs font-extrabold">{r.matchCount ?? 0}</span>
                <span className="text-[10px] text-slate-400">matches</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </ScreenShell>
  );
}