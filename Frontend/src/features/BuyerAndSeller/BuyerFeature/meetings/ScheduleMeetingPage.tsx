import { useState } from 'react'; import { useNavigate,useSearchParams } from 'react-router';
import { TextInput, SelectInput, TextAreaInput } from '../../../../components/forms/FormFields';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { useSupplier, useRequirement, useCreateEngagement, useScheduleMeeting } from '../../../../services/buyer/hooks';
import { ScreenShell } from '../shared/ScreenShell';

const SLOTS=['09:30-10:00','11:45-12:15','15:30-16:00'];
const DURATIONS=['30 Minutes','45 Minutes'] as const;

export default function ScheduleMeetingPage(){const [sp]=useSearchParams();const supplierId=sp.get('supplier')??'sup-001';const requirementId=sp.get('requirement')??'req-001';const s=useSupplier(supplierId);const r=useRequirement(requirementId);const nav=useNavigate();const [slot,setSlot]=useState(SLOTS[0]);const [date,setDate]=useState('2026-09-18');const [duration,setDuration]=useState<typeof DURATIONS[number]>('30 Minutes');const [mode,setMode]=useState<'IN_PERSON'|'ONLINE'>('IN_PERSON');const [agenda,setAgenda]=useState('Review CNC machined shaft, available capacity, PPAP readiness, quality controls, target lead time and next commercial steps.');const [error,setError]=useState<string|null>(null);const createEngagement=useCreateEngagement();const scheduleMeeting=useScheduleMeeting();const pending=createEngagement.isPending||scheduleMeeting.isPending;

function toIso(clockTime:string){const [h,m]=clockTime.split(':').map(Number);const d=new Date(`${date}T00:00:00+05:30`);d.setHours(h,m,0,0);return d.toISOString();}

async function send(){
  setError(null);
  const capabilityId=s.data?.capabilityId;
  if(!capabilityId){setError('This supplier has no published capability yet, so a meeting cannot be scheduled.');return;}
  const [startClock,endClock]=slot.split('-');
  try{
    const engagement=await createEngagement.mutateAsync({requirementId,capabilityId,stage:'MEETING_REQUESTED'});
    const alternativeSlots=SLOTS.filter(x=>x!==slot).map(x=>{const [as,ae]=x.split('-');return {start:toIso(as),end:toIso(ae)};});
    const meeting=await scheduleMeeting.mutateAsync({engagementId:engagement.id,start:toIso(startClock),end:toIso(endClock),mode,venueOrLink:mode==='IN_PERSON'?'MSME Sangamam — Meeting Zone':'Online / Video Call',alternativeSlots});
    nav(`/buyer/meetings/${meeting.id}`);
  }catch(err){
    setError(err instanceof Error?err.message:'Could not schedule this meeting. Please retry.');
  }
}

return <ScreenShell screen={16} title="Schedule Meeting" subtitle="Request a Buyer-Seller meeting using server-confirmed availability."><div className="grid gap-4 xl:grid-cols-[1fr_18rem]"><Card className="p-5"><h2 className="mb-4 text-sm font-extrabold">Meeting Request</h2><div className="grid gap-4 md:grid-cols-2"><TextInput label="Matched Requirement" value={`${r.data?.code??''} · ${r.data?.title??''}`} readOnly/><SelectInput label="Meeting Mode" value={mode} onChange={e=>setMode(e.target.value as 'IN_PERSON'|'ONLINE')}><option value="IN_PERSON">In-Person at Event</option><option value="ONLINE">Online / Video Call</option></SelectInput><TextInput label="Preferred Date" type="date" value={date} onChange={e=>setDate(e.target.value)}/><TextInput label="Preferred Time" value={slot} readOnly/><TextInput label="Supplier" value={s.data?.name??''} readOnly/><SelectInput label="Duration" value={duration} onChange={e=>setDuration(e.target.value as typeof DURATIONS[number])}>{DURATIONS.map(d=><option key={d}>{d}</option>)}</SelectInput></div><div className="mt-4"><TextAreaInput label="Agenda / Message" rows={5} value={agenda} onChange={e=>setAgenda(e.target.value)}/></div>{error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}<div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={()=>nav(-1)}>Cancel</Button><Button loading={pending} onClick={send}>Send Request</Button></div></Card><Card className="p-5"><h2 className="text-sm font-extrabold">Recommended Available Slots</h2><div className="mt-4 space-y-3">{SLOTS.map(x=><button key={x} onClick={()=>setSlot(x)} className={`w-full rounded-xl border p-3 text-left text-sm font-extrabold ${slot===x?'border-emerald-400 bg-emerald-50 text-emerald-800':'border-slate-200'}`}>{x}<span className="mt-1 block text-[10px] font-medium">Available</span></button>)}</div><div className="mt-4 rounded-lg bg-emerald-50 p-3 text-[10px] text-emerald-800">Final availability is confirmed by the scheduler when the request is submitted. A 409 response refreshes slots without losing your agenda.</div></Card></div></ScreenShell>;}
