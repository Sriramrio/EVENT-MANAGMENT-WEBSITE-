import { useState } from 'react'; 
import { useNavigate, useParams } from 'react-router-dom'; 
import { CheckCircle2, Download } from 'lucide-react';
import { useSellerMeeting, useSellerTransitionMeeting } from '../../../../services/seller/hooks';
import { ErrorState, LoadingState } from '../../../../components/ui/PageStates';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { Button } from '../../../../components/ui/Button';

export default function SellerMeetingDetailPage() {
  const { meetingId = '' } = useParams();
  const m = useSellerMeeting(meetingId);
  const nav = useNavigate();
  const transition = useSellerTransitionMeeting();
  const [error, setError] = useState<string | null>(null);

  const customAttachments: Array<{ id: string; name: string; size: string; dataBase64: string }> = (() => {
    try {
      const raw = sessionStorage.getItem(`seller-meeting-attachments:${meetingId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })();

  if (m.isLoading) return <LoadingState label="Loading meeting…" />;
  if (m.isError) return <ErrorState error={m.error} retry={() => m.refetch()} />;
  const v = m.data!;
  const canAct = !['COMPLETED', 'CANCELLED'].includes(v.status);

  async function decline() {
    setError(null);
    try {
      await transition.mutateAsync({ id: meetingId, status: 'CANCELLED' });
      nav('/seller/meetings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not decline this meeting. Please retry.');
    }
  }

  return (
    <div>
      <p className="text-xs font-bold text-blue-600">Seller Journey</p>
      <h1 className="mt-1 text-2xl font-extrabold">Meeting Detail & Pre-Meeting Brief</h1>
      <p className="mt-1 text-sm text-slate-500">Review the buyer's requirement before the discussion.</p>
      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_20rem]">
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-extrabold">Meeting with {v.buyerOrganizationName}</h2>
              <p className="text-xs text-slate-500">{v.requirementCode} · {v.requirementTitle}</p>
            </div>
            <StatusBadge status={v.status} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <dl className="space-y-2 text-xs">
              {[
                ['Meeting No', v.meetingNo],
                ['Date', v.date],
                ['Time', `${v.startTime} – ${v.endTime}`],
                ['Mode', v.mode],
                ['Location', v.venue],
                ['Timezone', v.timezone]
              ].map(([l, val]) => (
                <div className="flex justify-between gap-4" key={l}>
                  <dt className="text-slate-400">{l}</dt>
                  <dd className="text-right font-bold">{val}</dd>
                </div>
              ))}
            </dl>
            <div>
              <h3 className="text-xs font-extrabold">Pre-Meeting Brief</h3>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                {[
                  'Confirm plant capacity against buyer volume',
                  'Bring quality-system and certification evidence',
                  'Review target lead time and logistics',
                  'Clarify pricing basis and payment terms',
                  'Agree next technical/commercial actions'
                ].map(x => (
                  <li className="flex gap-2" key={x}>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />{x}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-xs font-extrabold text-slate-800">Documents & Catalogs Shared</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {['Company_Profile_2026.pdf', 'ISO_9001_Certificate.pdf', 'Machinery_Capacity_Matrix.xlsx'].map(f => (
                <button className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-orange-600 hover:bg-slate-50" key={f}>
                  <Download className="mr-1 inline h-3 w-3" />{f}
                </button>
              ))}
              {customAttachments.map(att => (
                <a 
                  key={att.id} 
                  href={att.dataBase64} 
                  download={att.name} 
                  className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-[10px] font-bold text-orange-700 hover:bg-orange-100 flex items-center gap-1"
                >
                  <Download className="h-3 w-3 inline" />
                  <span>{att.name}</span>
                  <span className="text-[9px] text-orange-500">({att.size})</span>
                </a>
              ))}
            </div>
          </div>

          {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="danger" loading={transition.isPending} disabled={!canAct} onClick={decline}>
              Decline
            </Button>
            <Button disabled={!canAct} onClick={() => nav(`/seller/meetings/${meetingId}/check-in`)}>
              Start / Check-In
            </Button>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-extrabold">Buyer Snapshot</h2>
          <dl className="mt-4 space-y-3 text-xs">
            <div>
              <dt className="text-slate-400">Organisation</dt>
              <dd className="font-bold">{v.buyerOrganizationName}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Requirement</dt>
              <dd className="font-bold">{v.requirementTitle}</dd>
            </div>
          </dl>
          <div className="mt-5 rounded-lg bg-emerald-50 p-3 text-[10px] text-emerald-800">
            Buyer and seller registrations are confirmed and available for this event.
          </div>
        </div>
      </div>
    </div>
  );
}
