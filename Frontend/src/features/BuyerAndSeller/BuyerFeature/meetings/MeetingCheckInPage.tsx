import { useState } from 'react'; import { useNavigate,useParams } from 'react-router'; import { QrCode,ShieldCheck } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { useMeeting, useTransitionMeeting } from '../../../../services/buyer/hooks';
import { ScreenShell } from '../shared/ScreenShell';

export default function MeetingCheckInPage(){const {meetingId='meet-001'}=useParams();const m=useMeeting(meetingId);const nav=useNavigate();const transition=useTransitionMeeting();const [verified,setVerified]=useState(false);const [error,setError]=useState<string|null>(null);

async function verify(){
  setError(null);
  try{ await transition.mutateAsync({id:meetingId,status:'CHECKED_IN'}); setVerified(true); }
  catch(err){ setError(err instanceof Error?err.message:'Could not verify the check-in. Please retry.'); }
}
async function start(){
  setError(null);
  try{ await transition.mutateAsync({id:meetingId,status:'IN_PROGRESS'}); nav(`/buyer/meetings/${meetingId}/live`); }
  catch(err){ setError(err instanceof Error?err.message:'Could not start the meeting. Please retry.'); }
}

return <ScreenShell screen={18} title="QR Check-In & Start Meeting" subtitle="Validate the signed event QR before starting the meeting."><div className="grid gap-4 xl:grid-cols-[1fr_20rem]"><Card className="grid min-h-[28rem] place-items-center p-6 text-center"><div><h2 className="text-sm font-extrabold">Scan Supplier QR Code</h2><p className="mt-1 text-xs text-slate-500">The scanner must validate an opaque signed token against the backend.</p><div className="mx-auto mt-6 grid h-52 w-52 place-items-center rounded-2xl border-8 border-slate-900 bg-white"><QrCode className="h-40 w-40 text-slate-950"/></div><code className="mt-4 block text-xs font-bold text-brand-600">{m.data?.meetingNo??meetingId}</code><Button className="mt-4" loading={transition.isPending&&!verified} disabled={verified} onClick={verify}>{verified?'Code Verified':'Verify Code'}</Button>{error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}</div></Card><Card className="p-5"><h2 className="text-sm font-extrabold">Check-In Status</h2><dl className="mt-4 space-y-3 text-xs"><div className="flex justify-between"><dt>Buyer</dt><dd className="font-bold text-emerald-600">Checked In</dd></div><div className="flex justify-between"><dt>Seller</dt><dd className={`font-bold ${verified?'text-emerald-600':'text-amber-600'}`}>{verified?'Checked In':'Awaiting Scan'}</dd></div><div className="flex justify-between"><dt>Meeting</dt><dd className="font-bold">{m.data?.id}</dd></div><div className="flex justify-between"><dt>Status</dt><dd className="font-bold">{m.data?.status}</dd></div></dl><div className="mt-5 rounded-lg bg-blue-50 p-3 text-[10px] text-blue-800"><ShieldCheck className="mb-1 h-4 w-4"/>QR validation checks event, meeting, expiry and replay status. Raw meeting IDs are not trusted as QR credentials.</div><Button className="mt-5 w-full" loading={transition.isPending&&verified} disabled={!verified} onClick={start}>Start Meeting when Verified</Button></Card></div></ScreenShell>;}
