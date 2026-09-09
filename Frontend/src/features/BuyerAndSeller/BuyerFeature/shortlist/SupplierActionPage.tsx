import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { CalendarPlus, CheckCircle2, Lock, MessageSquare, Star } from 'lucide-react';
import {
  useSupplier,
  useCreateEngagement,
  useRequirement,
  useBuyerSession,
  useSendEngagementMessage,
  useEngagements,
} from '../../../../services/buyer/hooks';
import { ScreenShell } from '../shared/ScreenShell';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { EmptyState } from '../../../../components/ui/PageStates';

const DEFAULT_MESSAGE = 'We are interested in your capability for this requirement and would like to discuss technical fit and next steps.';
const STAGE_BY_ACTION: Record<string, string> = { shortlist: 'SHORTLISTED', interest: 'INTERESTED', meeting: 'MEETING_REQUESTED' };
const isValidGuid = (val?: string): val is string =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

export default function SupplierActionPage(){
  const {id,supplierId}=useParams();
  const idsValid = isValidGuid(id) && isValidGuid(supplierId);
  const q=useSupplier(idsValid ? supplierId! : '');
  const req=useRequirement(idsValid ? id! : '');
  const session=useBuyerSession();
  const engagements=useEngagements();
  const nav=useNavigate();

  // A supplier is "already shortlisted" for this requirement once an engagement row exists
  // for the (requirement, capability) pair. Request Meeting / Express Chat stay locked until then.
  const existingEngagement = engagements.data?.find(
    e => e.requirementId === id && (e.capabilityId === q.data?.capabilityId || e.sellerOrganizationId === supplierId)
  );
  const isShortlisted = Boolean(existingEngagement);

  const [action,setAction]=useState('shortlist');
  const [message,setMessage]=useState(DEFAULT_MESSAGE);
  const [submitError,setSubmitError]=useState<string|null>(null);
  const createEngagement=useCreateEngagement();
  const sendMessage=useSendEngagementMessage();

  // Once we learn the supplier is already shortlisted, move the selection off the
  // (now locked/complete) Shortlist option onto the next controlled action.
  useEffect(()=>{ if(isShortlisted && action==='shortlist') setAction('meeting'); },[isShortlisted]); // eslint-disable-line react-hooks/exhaustive-deps

  if(!idsValid){
    return <ScreenShell screen={14} title="Shortlist / Express Interest / Request Meeting" subtitle="Select the next controlled action for this supplier.">
      <EmptyState title="Invalid Supplier or Requirement" message="No valid requirement/supplier selected. Please open a supplier from the Matched Suppliers list." />
    </ScreenShell>;
  }

  async function submit(){
    setSubmitError(null);

    // Express Chat, once unlocked, reuses the existing engagement thread instead of
    // creating a fresh engagement — it drops the buyer straight into Messages.
    if(action==='interest' && existingEngagement){
      try{
        if(message.trim() && session.data){
          await sendMessage.mutateAsync({ engagementId: existingEngagement.id, senderOrganizationId: session.data.buyerOrganisationId, message: message.trim() });
        }
        nav('/buyer/messages');
      }catch(err){
        setSubmitError(err instanceof Error ? err.message : 'Could not open the conversation. Please retry.');
      }
      return;
    }

    const capabilityId = q.data?.capabilityId;
    if(!capabilityId){ setSubmitError('This supplier has no published capability yet, so an engagement cannot be created.'); return; }
    try{
      const engagement = await createEngagement.mutateAsync({ requirementId: id!, capabilityId, stage: STAGE_BY_ACTION[action] ?? 'SHORTLISTED' });
      // The "Message to Supplier" box was previously a static defaultValue textarea whose
      // text was never read — nothing was ever sent. Now it actually posts into the
      // engagement's message thread once the engagement exists.
      if(message.trim() && session.data){
        await sendMessage.mutateAsync({ engagementId: engagement.id, senderOrganizationId: session.data.buyerOrganisationId, message: message.trim() });
      }
      if(action==='meeting') nav(`/buyer/meetings/new?requirement=${id}&supplier=${supplierId}`);
      else nav(`/buyer/suppliers/${supplierId}?requirement=${id}`);
    }catch(err){
      setSubmitError(err instanceof Error ? err.message : 'Could not submit this action. Please retry.');
    }
  }

  const actionOptions: Array<{value:string;title:string;desc:string;icon:typeof Star;locked:boolean;done:boolean}> = [
    { value:'shortlist', title:'Shortlist Supplier', desc:'Save supplier for comparison and later review.', icon:Star, locked:false, done:isShortlisted },
    { value:'meeting', title:'Request Meeting', desc: isShortlisted ? 'Ask supplier for a buyer-seller meeting against this requirement.' : 'Unlocks after you shortlist this supplier.', icon:CalendarPlus, locked:!isShortlisted, done:false },
    { value:'interest', title:'Express Chat', desc: isShortlisted ? 'Jump straight into the conversation thread with this supplier.' : 'Unlocks after you shortlist this supplier.', icon:MessageSquare, locked:!isShortlisted, done:false },
  ];

  return <ScreenShell screen={14} title="Shortlist / Express Interest / Request Meeting" subtitle="Select the next controlled action for this supplier.">
    <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
      <Card className="p-5">
        <h2 className="text-sm font-extrabold">Select Action</h2>

        {isShortlisted && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Supplier shortlisted — Request Meeting and Express Chat are now available.
          </div>
        )}

        <div className="mt-4 space-y-3">
          {actionOptions.map(({value,title,desc,icon:Icon,locked,done})=>{
            const selected = action===value;
            return (
              <label
                key={value}
                className={`flex gap-4 rounded-xl border p-4 ${locked ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60' : 'cursor-pointer border-slate-200'} ${selected && !locked ? 'border-brand-600 bg-brand-50/50' : ''}`}
              >
                <input type="radio" name="action" value={value} checked={selected} disabled={locked} onChange={()=>!locked && setAction(value)} />
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-brand-600">
                  {locked ? <Lock className="h-4 w-4 text-slate-400" /> : <Icon className="h-4 w-4" />}
                </span>
                <span>
                  <b className="flex items-center gap-2 text-sm">
                    {title}
                    {done && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">Done</span>}
                    {locked && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-500">Locked</span>}
                  </b>
                  <span className="text-xs text-slate-500">{desc}</span>
                </span>
              </label>
            );
          })}
        </div>

        <label className="mt-4 block text-xs font-bold">Message to Supplier (optional)
          <textarea className="input-base mt-1 min-h-24" value={message} onChange={e=>setMessage(e.target.value)}/>
        </label>

        {submitError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{submitError}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={()=>nav(`/buyer/suppliers/${supplierId}?requirement=${id}`)}>Cancel</Button>
          <Button loading={createEngagement.isPending||sendMessage.isPending} onClick={submit}>
            {action==='interest' ? 'Open Chat' : 'Submit Action'}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-extrabold">Requirement Context</h2>
        <dl className="mt-4 space-y-3 text-xs">
          <div><dt className="text-slate-400">Supplier</dt><dd className="font-bold">{q.data?.name ?? '—'}</dd></div>
          <div><dt className="text-slate-400">Requirement</dt><dd className="font-bold">{req.data?.code ?? '—'}</dd></div>
          <div><dt className="text-slate-400">Product</dt><dd className="font-bold">{req.data?.title ?? '—'}</dd></div>
          <div><dt className="text-slate-400">Timeline</dt><dd className="font-bold">{req.data?.neededBy ?? '—'}</dd></div>
        </dl>
        <div className="mt-5 rounded-lg bg-blue-50 p-3 text-[10px] text-blue-800">Contact details and confidential documents remain subject to backend visibility policy and supplier consent.</div>
      </Card>
    </div>
  </ScreenShell>;
}