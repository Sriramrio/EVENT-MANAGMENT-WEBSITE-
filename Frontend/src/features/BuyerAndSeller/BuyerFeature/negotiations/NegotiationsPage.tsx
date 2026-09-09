import { Column, DataTable } from "../../../../components/data-display/DataTable";
import { LoadingState, ErrorState } from "../../../../components/ui/PageStates";
import { Negotiation } from "../../../../domain/models/buyer";
import { useNegotiations } from "../../../../services/buyer/hooks";
import { ScreenShell } from "../shared/ScreenShell";

const money=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
export default function NegotiationsPage(){const q=useNegotiations();if(q.isLoading)return <LoadingState/>;if(q.isError)return <ErrorState error={q.error}/>;const cols:Column<Negotiation>[]=[{key:'sup',header:'Supplier',cell:r=><b>{r.supplier}</b>},{key:'req',header:'Requirement',cell:r=>r.requirement},{key:'stage',header:'Stage',cell:r=>r.stage},{key:'value',header:'Expected Value',cell:r=><span className="font-bold">{money(r.expectedValue.amount)}</span>},{key:'owner',header:'Owner',cell:r=>r.owner},{key:'follow',header:'Next Follow-up',cell:r=>r.nextFollowUp}];return <ScreenShell screen={28} title="Commercial Negotiation" subtitle="Track commercial discussions and negotiations."><div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Commercial values shown here are mock-mode data. In API mode this screen must be guarded by commercial permissions and backend visibility rules.</div><DataTable rows={q.data??[]} columns={cols} caption="Commercial negotiation register"/></ScreenShell>;}
