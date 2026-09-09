import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ScreenShell } from '../shared/ScreenShell';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { LoadingState, ErrorState, EmptyState } from '../../../../components/ui/PageStates';
import { useRequirements, useRequirementMatches, useCreateRfq } from '../../../../services/buyer/hooks';

export default function CreateRfqPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const requirementsQuery = useRequirements();
  const [requirementId, setRequirementId] = useState(searchParams.get('requirement') ?? '');
  const matchesQuery = useRequirementMatches(requirementId);
  const [selectedCapabilityIds, setSelectedCapabilityIds] = useState<string[]>([]);
  const [deadline, setDeadline] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createRfq = useCreateRfq();

  const eligibleMatches = useMemo(() => (matchesQuery.data ?? []).filter(m => m.capabilityId), [matchesQuery.data]);

  function toggleCapability(id: string) {
    setSelectedCapabilityIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function submit() {
    setSubmitError(null);
    if (!requirementId) { setSubmitError('Select a requirement first.'); return; }
    if (selectedCapabilityIds.length === 0) { setSubmitError('Select at least one supplier to invite.'); return; }
    try {
      await createRfq.mutateAsync({ requirementId, capabilityIds: selectedCapabilityIds });
      nav('/buyer/rfqs');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not create the RFQ. Please retry.');
    }
  }

  if (requirementsQuery.isLoading) return <LoadingState />;
  if (requirementsQuery.isError) return <ErrorState error={requirementsQuery.error} retry={() => requirementsQuery.refetch()} />;

  return (
    <ScreenShell screen={23} title="Create RFQ" subtitle="Pick a requirement, choose matched suppliers to invite, and set a response deadline.">
      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <Card className="p-5">
          <h2 className="text-sm font-extrabold">1. Requirement</h2>
          <select
            className="input-base mt-3"
            value={requirementId}
            onChange={e => { setRequirementId(e.target.value); setSelectedCapabilityIds([]); }}
          >
            <option value="">Select a requirement…</option>
            {requirementsQuery.data?.map(r => (
              <option key={r.id} value={r.id}>{r.code} — {r.title}</option>
            ))}
          </select>

          <h2 className="mt-6 text-sm font-extrabold">2. Suppliers to Invite</h2>
          {!requirementId && <p className="mt-2 text-xs text-slate-500">Select a requirement above to see matched suppliers.</p>}
          {requirementId && matchesQuery.isLoading && <LoadingState />}
          {requirementId && matchesQuery.isError && <ErrorState error={matchesQuery.error} retry={() => matchesQuery.refetch()} />}
          {requirementId && !matchesQuery.isLoading && !matchesQuery.isError && eligibleMatches.length === 0 && (
            <EmptyState title="No matched suppliers yet" message="Run matching on this requirement before creating an RFQ." />
          )}
          {eligibleMatches.length > 0 && (
            <div className="mt-3 space-y-2">
              {eligibleMatches.map(m => (
                <label key={m.capabilityId} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3">
                  <input
                    type="checkbox"
                    checked={selectedCapabilityIds.includes(m.capabilityId!)}
                    onChange={() => toggleCapability(m.capabilityId!)}
                  />
                  <span className="text-xs">
                    <b className="block">{m.supplierName}</b>
                    <span className="text-slate-500">Compatibility {m.overallScore}%</span>
                  </span>
                </label>
              ))}
            </div>
          )}

          <h2 className="mt-6 text-sm font-extrabold">3. Response Deadline</h2>
          <input type="date" className="input-base mt-3" value={deadline} onChange={e => setDeadline(e.target.value)} />

          {submitError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">{submitError}</p>}

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => nav('/buyer/rfqs')}>Cancel</Button>
            <Button loading={createRfq.isPending} onClick={submit}>Send RFQ</Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-extrabold">Summary</h2>
          <dl className="mt-4 space-y-3 text-xs">
            <div><dt className="text-slate-400">Requirement</dt><dd className="font-bold">{requirementsQuery.data?.find(r => r.id === requirementId)?.title ?? '—'}</dd></div>
            <div><dt className="text-slate-400">Suppliers Selected</dt><dd className="font-bold">{selectedCapabilityIds.length}</dd></div>
            <div><dt className="text-slate-400">Deadline</dt><dd className="font-bold">{deadline}</dd></div>
          </dl>
        </Card>
      </div>
    </ScreenShell>
  );
}
