import { useState } from 'react'; 
import { useNavigate, useParams } from 'react-router-dom'; 
import { Star, CheckCircle2, MessageSquare, Briefcase, Calendar, ChevronRight } from 'lucide-react';
import { ScreenShell } from '../shared/ScreenShell';
import { Button } from '../../../../components/ui/Button';
import { useMeetingOutcome } from '../../../../services/buyer/hooks';
import { Hint } from '../../../../components/ui/Hint';
import { MeetingAttachmentsSection } from '../../shared/MeetingAttachmentsSection';

const OUTCOMES = [
  ['Qualified Opportunity', 'QUALIFIED_OPPORTUNITY', 'bg-emerald-100 text-emerald-800 border-emerald-200'],
  ['Follow-up Required', 'FOLLOW_UP_REQUIRED', 'bg-blue-100 text-blue-800 border-blue-200'],
  ['Not a Fit', 'NOT_A_FIT', 'bg-red-100 text-red-800 border-red-200']
] as const;

const NEXT_ACTIONS = ['Share RFQ', 'Request Sample', 'Technical Review', 'Commercial Negotiation', 'Close Deal'];

export default function MeetingOutcomePage() {
  const { meetingId = 'meet-001' } = useParams();
  const nav = useNavigate();
  const outcomeMutation = useMeetingOutcome();
  
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<typeof OUTCOMES[number][1]>('QUALIFIED_OPPORTUNITY');
  const [nextAction, setNextAction] = useState(NEXT_ACTIONS[0]);
  const [rating, setRating] = useState(4);
  const draft = sessionStorage.getItem(`meeting-notes:${meetingId}`) ?? '';
  const [notes, setNotes] = useState(draft || 'Supplier appears technically suitable and has required quality-system coverage.');

  async function save() {
    setError(null);
    try {
      let attachmentsSummary = '';
      try {
        const storedAtts = sessionStorage.getItem(`meeting-attachments:${meetingId}`);
        if (storedAtts) {
          const parsed = JSON.parse(storedAtts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            attachmentsSummary = `\n\nAttached Documents (${parsed.length}):\n` + 
              parsed.map((a: any) => `• ${a.name} (${a.size})`).join('\n');
          }
        }
      } catch {
        // ignore
      }

      await outcomeMutation.mutateAsync({
        id: meetingId,
        outcome,
        notes: `${notes}\n\nRating: ${rating}/5\nNext action: ${nextAction}${attachmentsSummary}`,
        actionItems: [{ title: nextAction }]
      });
      sessionStorage.removeItem(`meeting-notes:${meetingId}`);
      nav('/buyer/actions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this outcome. Please retry.');
    }
  }

  return (
    <ScreenShell screen={20} title="Post-Meeting Outcome" subtitle="Record the outcome, follow-up ownership and conversion path.">
      
      {/* Flow Steps Header */}
      <div className="mb-8 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
        <div className="flex w-full items-center justify-center space-x-2 md:space-x-4 text-xs font-bold text-slate-400">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Matchmaking</span>
          <ChevronRight className="w-4 h-4" />
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Met Supplier</span>
          <ChevronRight className="w-4 h-4" />
          <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full"><MessageSquare className="w-4 h-4" /> Meeting Outcome</span>
          <ChevronRight className="w-4 h-4" />
          <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> Deal / RFQ</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        {/* Left Side: Outcome Form */}
        <div className="rounded-3xl bg-white p-6 md:p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-slate-800">Meeting Summary</h2>
              <Hint>
                Record the outcome of the meeting to unlock the next steps in the deal flow, like requesting an RFQ or closing the deal.
              </Hint>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} className="focus:outline-none transition-transform hover:scale-110">
                  <Star className={`h-7 w-7 transition-colors ${n <= rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-bold text-slate-700 mb-3 block">Overall Outcome</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {OUTCOMES.map(([label, value, colors]) => (
                  <button
                    key={value}
                    onClick={() => setOutcome(value)}
                    className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                      outcome === value ? `${colors} shadow-sm ring-2 ring-offset-1 ring-${colors.split('-')[1]}-400` : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block">Meeting Notes</label>
              <textarea 
                className="w-full rounded-2xl border border-slate-200 p-4 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[160px] resize-none"
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                placeholder="Write your observations, agreements, and next steps..."
              />
              <MeetingAttachmentsSection
                meetingId={meetingId}
                storageKey={`meeting-attachments:${meetingId}`}
                accentColor="blue"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">Next Action Step</label>
                <select 
                  className="w-full rounded-xl border border-slate-200 p-3.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-800" 
                  value={nextAction} 
                  onChange={e => setNextAction(e.target.value)}
                >
                  {NEXT_ACTIONS.map(x => <option key={x}>{x}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">Follow-up Date</label>
                <div className="relative">
                  <input 
                    className="w-full rounded-xl border border-slate-200 p-3.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-800 pl-10" 
                    type="date" 
                    defaultValue="2026-08-19"
                  />
                  <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
          
          {error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700 border border-red-100">{error}</p>}
          
          <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button variant="secondary" onClick={() => sessionStorage.setItem(`meeting-notes:${meetingId}`, notes)} className="px-6 py-2.5 rounded-xl">Save Draft</Button>
            <Button loading={outcomeMutation.isPending} onClick={save} className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30">Submit Outcome</Button>
          </div>
        </div>

        {/* Right Side: What happens next */}
        <div className="space-y-4">
          <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
            <h2 className="text-lg font-black flex items-center gap-2 mb-6">
              <Star className="text-amber-400 fill-amber-400" /> Action Items
            </h2>
            <div className="space-y-3">
              {[
                ['Submit RFQ to shortlisted suppliers', 'Buyer', '22 Aug', 'bg-blue-500/20 text-blue-300'],
                ['Supplier capacity statement', 'Supplier', '27 Aug', 'bg-amber-500/20 text-amber-300'],
                ['Commercial clarification', 'Buyer + Seller', '02 Sep', 'bg-purple-500/20 text-purple-300']
              ].map(([a, o, d, color]) => (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:bg-white/10" key={a}>
                  <b className="text-sm tracking-wide">{a}</b>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-400">{o}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-slate-400">{d}</span>
                      <span className={`px-2 py-0.5 rounded-md ${color}`}>Open</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-emerald-900 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-200">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Status Update</div>
                <div className="text-base font-black">Meeting → COMPLETED</div>
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold text-emerald-700/80 leading-relaxed">
              Upon saving, this status is shared with the supplier and automatically creates follow-up actions in your dashboard.
            </p>
          </div>
          
          <button 
            onClick={() => nav('/buyer/rfqs')}
            className="w-full rounded-2xl bg-white border border-slate-200 p-4 text-sm font-bold text-slate-700 shadow-sm hover:shadow-md hover:border-blue-200 hover:text-blue-600 transition-all text-center flex items-center justify-center gap-2"
          >
            Create RFQ Now <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </ScreenShell>
  );
}
