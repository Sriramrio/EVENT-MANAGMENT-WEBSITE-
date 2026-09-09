import { Column, DataTable } from "../../../../components/data-display/DataTable";
import { ErrorState, LoadingState } from "../../../../components/ui/PageStates";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { Sample } from "../../../../domain/models/buyer";
import { useSamples } from "../../../../services/buyer/hooks";
import { ScreenShell } from "../shared/ScreenShell";

export default function SamplesPage() { const q = useSamples(); if (q.isLoading) return <LoadingState />; if (q.isError) return <ErrorState error={q.error} />; const cols: Column<Sample>[] = [{ key: 'id', header: 'Sample ID', cell: r => <b>{r.sampleCode}</b> }, { key: 'req', header: 'Requirement', cell: r => r.requirement }, { key: 'supplier', header: 'Supplier', cell: r => r.supplier }, { key: 'reqon', header: 'Requested On', cell: r => r.requestedOn }, { key: 'exp', header: 'Expected', cell: r => r.expectedOn }, { key: 'sub', header: 'Submitted', cell: r => r.submittedOn ?? '—' }, { key: 'status', header: 'Status', cell: r => <StatusBadge status={r.status} /> }]; return <ScreenShell screen={23} title="Sample / Prototype Track" subtitle="Track samples and prototype submissions."><div className="mb-4 flex gap-2 text-xs">{['All', 'Requested', 'In Progress', 'Submitted', 'Approved'].map((x, i) => <button key={x} className={`rounded-lg px-3 py-2 font-bold ${i === 0 ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200'}`}>{x}</button>)}</div><DataTable rows={q.data ?? []} columns={cols} caption="Sample and prototype tracking" /></ScreenShell>; }
