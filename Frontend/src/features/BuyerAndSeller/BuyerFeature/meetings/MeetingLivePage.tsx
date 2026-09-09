import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Paperclip, Save, Star, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { ScreenShell } from '../shared/ScreenShell';
import { MeetingAttachmentsSection, type MeetingAttachment } from '../../shared/MeetingAttachmentsSection';
import { httpClient } from '../../../../services/api/httpClient';
import { toast } from 'react-hot-toast';

export default function MeetingLivePage() {
  const { meetingId = 'meet-001' } = useParams();
  const nav = useNavigate();
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<MeetingAttachment[]>([]);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [rating, setRating] = useState(4);
  const [potentialOutcome, setPotentialOutcome] = useState('RFQ Expected');

  const notesKey = `meeting-notes:${meetingId}`;
  const attachmentsKey = `meeting-attachments:${meetingId}`;

  // Load draft notes and attachments
  useEffect(() => {
    const savedNotes = sessionStorage.getItem(notesKey);
    if (savedNotes) setNotes(savedNotes);

    const savedAttachments = sessionStorage.getItem(attachmentsKey);
    if (savedAttachments) {
      try {
        const parsed = JSON.parse(savedAttachments);
        if (Array.isArray(parsed)) setAttachments(parsed);
      } catch {
        // ignore
      }
    }
  }, [meetingId, notesKey, attachmentsKey]);

  // Debounced autosave
  useEffect(() => {
    if (!notes) return;
    setSaveState('saving');
    const t = setTimeout(() => {
      sessionStorage.setItem(notesKey, notes);
      setSaveState('saved');
    }, 700);
    return () => clearTimeout(t);
  }, [notes, notesKey]);

  const handleManualSave = async () => {
    setSaveState('saving');
    sessionStorage.setItem(notesKey, notes);
    sessionStorage.setItem(attachmentsKey, JSON.stringify(attachments));

    // Try server-side sync if meetingId is a valid UUID
    try {
      if (meetingId && meetingId.length > 20) {
        await httpClient.post(`/buyer/meetings/${meetingId}/notes`, { notes });
      }
    } catch {
      // Offline / mock fallback - keep local draft
    }

    setSaveState('saved');
    toast.success('Notes & attachments saved successfully');
  };

  const handleEndMeeting = () => {
    // Save latest state before navigation
    sessionStorage.setItem(notesKey, notes);
    sessionStorage.setItem(attachmentsKey, JSON.stringify(attachments));
    nav(`/buyer/meetings/${meetingId}/outcome`);
  };

  return (
    <ScreenShell
      screen={19}
      title="Meeting in Progress — Notes & Feedback"
      subtitle="Capture recoverable notes and attach files without losing work during network interruption."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        {/* Left column: Notes and Attachments */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Meeting Notes</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Type discussion points, commercial agreements, and technical findings.
                </p>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  saveState === 'error'
                    ? 'text-red-700 bg-red-50 border border-red-200'
                    : saveState === 'saving'
                    ? 'text-amber-700 bg-amber-50 border border-amber-200'
                    : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                }`}
                role="status"
              >
                {saveState === 'saving'
                  ? 'Saving draft…'
                  : saveState === 'saved'
                  ? 'Draft saved locally'
                  : 'Autosave enabled'}
              </span>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-base mt-4 min-h-64 w-full resize-y font-sans text-sm leading-relaxed"
              placeholder="Capture technical discussion, commercial observations, decisions, risks and next actions…"
              aria-label="Meeting notes"
            />

            {/* Attachments Section */}
            <MeetingAttachmentsSection
              meetingId={meetingId}
              storageKey={attachmentsKey}
              accentColor="blue"
              onAttachmentsChange={setAttachments}
            />

            <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Local recovery protects notes & files across browser refreshes.</span>
              </div>
              <Button onClick={handleManualSave} className="gap-2">
                <Save className="h-4 w-4" /> Save Notes & Files
              </Button>
            </div>
          </Card>
        </div>

        {/* Right column: Quick Feedback & Actions */}
        <Card className="p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Quick Feedback</h2>
              <p className="text-xs text-slate-500 mt-0.5">Rate relevance and potential outcome</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Overall Relevance</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} star rating`}
                    onClick={() => setRating(n)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Potential Outcome</label>
              <div className="space-y-2 text-xs">
                {['Technical Discussion', 'RFQ Expected', 'Sample Required', 'Vendor Registration'].map((x) => (
                  <label
                    key={x}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      potentialOutcome === x
                        ? 'border-blue-500 bg-blue-50/50 font-bold text-blue-900 shadow-2xs'
                        : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="outcome"
                      value={x}
                      checked={potentialOutcome === x}
                      onChange={() => setPotentialOutcome(x)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    {x}
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 p-3 text-[11px] text-amber-900 border border-amber-200/70">
              <Clock className="h-4 w-4 text-amber-700 mb-1 inline mr-1" />
              Detailed outcome, RFQs, and action items are finalized after ending the meeting.
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <Button
              variant="danger"
              className="w-full py-3 text-sm font-bold shadow-md shadow-red-500/20"
              onClick={handleEndMeeting}
            >
              End Meeting →
            </Button>
          </div>
        </Card>
      </div>
    </ScreenShell>
  );
}
