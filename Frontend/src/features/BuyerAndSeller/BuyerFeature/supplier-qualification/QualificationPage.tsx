// import { useQualifications } from '@/services/buyer/hooks'; 
// import { DataTable, type Column } from '@/components/data-display/DataTable'; 
// import { StatusBadge } from '@/components/ui/StatusBadge'; 
// import { LoadingState, ErrorState } from '@/components/ui/PageStates'; 
// import { ScreenShell } from '@/features/shared/ScreenShell'; 

import { Column, DataTable } from "../../../../components/data-display/DataTable";
import { LoadingState, ErrorState } from "../../../../components/ui/PageStates";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { Qualification } from "../../../../domain/models/buyer";
import { useQualifications } from "../../../../services/buyer/hooks";
// import { StatusBadge } from "../../../../shared/StatusBadge";
import { ScreenShell } from "../shared/ScreenShell";

// import type { Qualification } from '@/domain/models/buyer';
export default function QualificationPage() {
    const q = useQualifications();
    if (q.isLoading) return <LoadingState />;
    if (q.isError) return <ErrorState error={q.error} />;
    const cols: Column<Qualification>[] = [{ key: 'sup', header: 'Supplier', cell: r => <b>{r.supplier}</b> },
    { key: 'req', header: 'Requirement', cell: r => r.requirement }, { key: 'stage', header: 'Qualification Stage', cell: r => r.stage },
    { key: 'status', header: 'Status', cell: r => <StatusBadge status={r.status} /> },
    { key: 'updated', header: 'Last Updated', cell: r => r.updatedAt }];
    return <ScreenShell screen={24} title="Supplier Qualification" subtitle="Track qualification status of suppliers.">
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">{[['Requested', 3], ['In Progress', 4], ['Qualified', 5], ['Rejected', 1]].map(([l, v]) => <div className="card p-4" key={String(l)}><div className="text-2xl font-extrabold text-brand-600">{v}</div><div className="text-xs font-bold text-slate-500">{l}</div></div>)}</div><DataTable rows={q.data ?? []} columns={cols} caption="Supplier qualification register" /></ScreenShell>;
}
