import { useState } from 'react'; import { Send } from 'lucide-react';
import { useBuyerSession, useEngagements, useEngagementMessages, useSendEngagementMessage } from '../../../../services/buyer/hooks';
import { LoadingState, ErrorState, EmptyState } from '../../../../components/ui/PageStates';
import { ScreenShell } from '../shared/ScreenShell';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { StatusBadge } from '../../../../components/ui/StatusBadge';

export default function MessagesPage() {
  const session = useBuyerSession();
  const engagements = useEngagements();
  const [selectedId, setSelectedId] = useState<string>('');
  const activeId = selectedId || engagements.data?.[0]?.id || '';
  const thread = useEngagementMessages(activeId);
  const sendMessage = useSendEngagementMessage();
  const [draft, setDraft] = useState('');

  if (engagements.isLoading) return <LoadingState />;
  if (engagements.isError) return <ErrorState error={engagements.error} />;

  const active = engagements.data?.find(e => e.id === activeId);

  async function submit() {
    if (!draft.trim() || !activeId || !session.data?.buyerOrganisationId) return;
    try {
      await sendMessage.mutateAsync({ engagementId: activeId, senderOrganizationId: session.data.buyerOrganisationId, message: draft.trim() });
      setDraft('');
    } catch {
      // Send failed (e.g. transient network/session issue) — leave the draft text in the box
      // instead of silently discarding it, and surface it below the thread so the buyer isn't
      // left wondering why the message never appeared.
    }
  }

  return <ScreenShell screen={21} title="Messages" subtitle="Threaded communication with shortlisted, interested and meeting-requested suppliers.">
    {!engagements.data || engagements.data.length === 0 ? (
      <EmptyState title="No Conversations Yet" message="Shortlist a supplier or express interest from the Matches screen to start a conversation." />
    ) : (
      <div className="grid gap-4 xl:grid-cols-[18rem_1fr]">
        <Card className="p-2">
          <div className="max-h-[32rem] space-y-1 overflow-y-auto">
            {engagements.data.map(e => (
              <button key={e.id} onClick={() => setSelectedId(e.id)} className={`block w-full rounded-lg p-3 text-left text-xs ${activeId === e.id ? 'bg-brand-50 border border-brand-200' : 'hover:bg-slate-50'}`}>
                <b className="block text-slate-900">{e.sellerOrganizationName}</b>
                <span className="text-[10px] text-slate-400">{e.requirementNo} · {e.requirementTitle}</span>
                <div className="mt-1"><StatusBadge status={e.stage} /></div>
              </button>
            ))}
          </div>
        </Card>
        <Card className="flex flex-col p-4">
          {!active ? <EmptyState title="Select a Conversation" message="Choose a supplier thread from the list to view messages." /> : <>
            <div className="border-b border-slate-100 pb-3"><b className="text-sm">{active.sellerOrganizationName}</b><div className="text-[10px] text-slate-400">{active.requirementNo} · {active.requirementTitle}</div></div>
            <div className="my-3 flex-1 space-y-3 overflow-y-auto" style={{ minHeight: '18rem', maxHeight: '24rem' }}>
              {thread.isLoading && <LoadingState />}
              {thread.data?.length === 0 && <p className="text-xs text-slate-400">No messages yet. Say hello below.</p>}
              {thread.data?.map(m => (
                <div key={m.id} className={`max-w-[80%] rounded-xl p-3 text-xs ${m.senderOrganizationId === session.data?.buyerOrganisationId ? 'ml-auto bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                  {m.message}
                  <div className="mt-1 text-[9px] opacity-70">{new Date(m.sentAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <textarea className="input-base min-h-16 flex-1" placeholder="Type a message…" value={draft} onChange={e => setDraft(e.target.value)} />
              <Button onClick={submit} loading={sendMessage.isPending} disabled={!draft.trim()}><Send className="h-4 w-4" /></Button>
            </div>
            {sendMessage.isError && <p className="mt-1 text-[11px] font-semibold text-red-600">Message could not be sent. Please retry.</p>}
          </>}
        </Card>
      </div>
    )}
  </ScreenShell>;
}