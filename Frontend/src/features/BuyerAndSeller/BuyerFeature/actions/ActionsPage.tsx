import { Plus } from 'lucide-react';
import { Column, DataTable } from '../../../../components/data-display/DataTable';
import { Button } from '../../../../components/ui/Button';
import { LoadingState, ErrorState } from '../../../../components/ui/PageStates';
import { useActions } from '../../../../services/buyer/hooks';
// import { StatusBadge } from '../../../../shared/StatusBadge';
import { ScreenShell } from '../shared/ScreenShell';
import { ActionItem } from '../../../../domain/models/buyer';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { RefreshListButton } from '../../../../shared/components/RefreshListButton';

export default function ActionsPage(){const q=useActions();if(q.isLoading)return <LoadingState/>;if(q.isError)return <ErrorState error={q.error}/>;const cols:Column<ActionItem>[]=[{key:'action',header:'Action',cell:r=><b>{r.action}</b>},{key:'related',header:'Related To',cell:r=>r.relatedTo},{key:'owner',header:'Owner',cell:r=>r.owner},{key:'due',header:'Due Date',cell:r=>r.dueDate},{key:'status',header:'Status',cell:r=><StatusBadge status={r.status}/>},{key:'priority',header:'Priority',cell:r=><StatusBadge status={r.priority==='High'?'Overdue':r.priority}/>}];return <ScreenShell screen={21} title="Post-Meeting Actions" subtitle="Track and manage actions from your meetings." actions={<div className="flex items-center gap-2"><RefreshListButton onRefresh={() => q.refetch()} /><Button><Plus className="h-4 w-4"/>Add New Action</Button></div>}><div className="mb-4 flex flex-wrap gap-2 text-xs">{[['Open',3],['In Progress',1],['Completed',12],['Overdue',2]].map(([l,n],i)=><button key={String(l)} className={`rounded-lg px-3 py-2 font-bold ${i===0?'bg-brand-600 text-white':'bg-white border border-slate-200 text-slate-600'}`}>{l} ({n})</button>)}</div><DataTable rows={q.data??[]} columns={cols} caption="Post-meeting action register"/></ScreenShell>;}
