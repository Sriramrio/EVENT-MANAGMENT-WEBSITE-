import { Column, DataTable } from "../../../../components/data-display/DataTable";
import { LoadingState, ErrorState } from "../../../../components/ui/PageStates";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { Audit } from "../../../../domain/models/buyer";
// import { Audit } from "../../../../domain/models/buyer";
import { useAudits } from "../../../../services/buyer/hooks";
// import { StatusBadge } from "../../../../shared/StatusBadge";
import { ScreenShell } from "../shared/ScreenShell";

export default function AuditsPage(){const q=useAudits();if(q.isLoading)return <LoadingState/>;if(q.isError)return <ErrorState error={q.error}/>;const cols:Column<Audit>[]=[{key:'sup',header:'Supplier',cell:r=><b>{r.supplier}</b>},{key:'type',header:'Audit Type',cell:r=>r.type},{key:'date',header:'Audit Date',cell:r=>r.auditDate},{key:'auditor',header:'Auditor',cell:r=>r.auditor},{key:'status',header:'Status',cell:r=><StatusBadge status={r.status}/>},{key:'report',header:'Report',cell:r=>r.report?<button className="font-bold text-brand-600">View</button>:'—'}];return <ScreenShell screen={27} title="Audit & Assessment" subtitle="Track factory audits and assessments."><div className="mb-4 flex gap-2 text-xs">{['All','Planned','In Progress','Completed'].map((x,i)=><button key={x} className={`rounded-lg px-3 py-2 font-bold ${i===0?'bg-brand-600 text-white':'bg-white border border-slate-200'}`}>{x}</button>)}</div><DataTable rows={q.data??[]} columns={cols} caption="Supplier audit register"/></ScreenShell>;}
