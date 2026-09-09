import { Plus } from 'lucide-react';
import { Column, DataTable } from '../../../../components/data-display/DataTable';
import { Button } from '../../../../components/ui/Button';
import { LoadingState, ErrorState } from '../../../../components/ui/PageStates';
import {Link} from 'react-router';
import { useRfqs } from '../../../../services/buyer/hooks';
import { ScreenShell } from '../shared/ScreenShell';
import { Rfq } from '../../../../domain/models/buyer';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { RefreshListButton } from '../../../../shared/components/RefreshListButton';

export default function RfqsPage(){const q=useRfqs();if(q.isLoading)return <LoadingState/>;if(q.isError)return <ErrorState error={q.error}/>;const cols:Column<Rfq>[]=[{key:'code',header:'RFQ No.',cell:r=><b className="text-brand-600">{r.code}</b>},{key:'req',header:'Requirement',cell:r=>r.requirement},{key:'sup',header:'Suppliers',cell:r=>r.suppliers},{key:'sent',header:'Sent On',cell:r=>r.sentDate},{key:'due',header:'Due',cell:r=>r.dueDate},{key:'resp',header:'Responses',cell:r=>r.responses},{key:'status',header:'Status',cell:r=><StatusBadge status={r.status}/>}];return <ScreenShell screen={22} title="RFQ Management" subtitle="Manage all RFQs and supplier responses." actions={<div className="flex items-center gap-2"><RefreshListButton onRefresh={() => q.refetch()} /><Link to="/buyer/rfqs/new"><Button><Plus className="h-4 w-4"/>Create RFQ</Button></Link></div>}><div className="mb-4 flex gap-2 overflow-auto text-xs">{['All RFQs','Draft','Sent','Responses','Closed'].map((x,i)=><button className={`whitespace-nowrap rounded-lg px-3 py-2 font-bold ${i===0?'bg-brand-50 text-brand-700 border border-brand-100':'text-slate-500'}`} key={x}>{x}</button>)}</div>
<DataTable rows={q.data??[]} columns={cols} caption="RFQ register"/><div className="mt-3 rounded-xl bg-blue-50 p-3 text-xs text-blue-800">RFQ send operations are idempotent in API mode; a retry must reuse the logical request key rather than create a duplicate commercial request.</div></ScreenShell>;}
