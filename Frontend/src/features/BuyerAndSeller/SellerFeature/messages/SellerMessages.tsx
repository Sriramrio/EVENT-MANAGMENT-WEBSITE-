import { useState } from 'react'; import { MessageSquare, Send } from 'lucide-react';
import { useSellerSession, useSellerEngagements, useSellerEngagementMessages, useSendSellerEngagementMessage } from '../../../../services/seller/hooks';
import { ErrorState, LoadingState, EmptyState } from '../../../../components/ui/PageStates';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { Button } from '../../../../components/ui/Button';

export default function SellerMessagesPage(){
  const session = useSellerSession();
  const engagements = useSellerEngagements();
  const [selectedId, setSelectedId] = useState('');
  const activeId = selectedId || engagements.data?.[0]?.id || '';
  const thread = useSellerEngagementMessages(activeId);
  const sendMessage = useSendSellerEngagementMessage();
  const [draft, setDraft] = useState('');

  if (engagements.isLoading) return <LoadingState label="Loading conversations…" />;
  if (engagements.isError) return <ErrorState error={engagements.error} retry={() => engagements.refetch()} />;

  const active = engagements.data?.find(e => e.id === activeId);

  async function submit(){
    if (!draft.trim() || !activeId || !session.data?.sellerOrganisationId) return;
    await sendMessage.mutateAsync({ engagementId: activeId, senderOrganizationId: session.data.sellerOrganisationId, message: draft.trim() });
    setDraft('');
  }

  return <div>
    <p className="text-xs font-bold text-blue-600">Seller Journey</p>
    <h1 className="mt-1 text-2xl font-extrabold">Messages</h1>
    <p className="mt-1 text-sm text-slate-500">Threaded communication with buyers who shortlisted or invited your capability.</p>
    <div className="card mt-6 overflow-hidden">
      <div className="flex items-center gap-3 border-b p-5 text-blue-600"><MessageSquare /><strong className="text-sm text-slate-900">Buyer Conversations</strong></div>
      {!engagements.data || engagements.data.length === 0 ? (
        <div className="p-10"><EmptyState title="No Conversations Yet" message="Once a buyer shortlists or invites your capability, their messages will appear here." /></div>
      ) : (
        <div className="grid gap-0 md:grid-cols-[18rem_1fr]">
          <div className="max-h-[32rem] divide-y overflow-y-auto border-r border-slate-100">
            {engagements.data.map(e => (
              <button key={e.id} onClick={() => setSelectedId(e.id)} className={`block w-full p-4 text-left text-xs ${activeId === e.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                <b className="block text-slate-900">{e.buyerOrganizationName}</b>
                <span className="text-[10px] text-slate-400">{e.requirementNo} · {e.requirementTitle}</span>
                <div className="mt-1"><StatusBadge status={e.stage} /></div>
              </button>
            ))}
          </div>
          <div className="flex flex-col p-5">
            {!active ? <EmptyState title="Select a Conversation" message="Choose a buyer thread from the list to view messages." /> : <>
              <div className="border-b border-slate-100 pb-3"><b className="text-sm">{active.buyerOrganizationName}</b><div className="text-[10px] text-slate-400">{active.requirementNo} · {active.requirementTitle}</div></div>
              <div className="my-3 flex-1 space-y-3 overflow-y-auto" style={{ minHeight: '18rem', maxHeight: '24rem' }}>
                {thread.isLoading && <LoadingState />}
                {thread.data?.length === 0 && <p className="text-xs text-slate-400">No messages yet. Reply to start the conversation.</p>}
                {thread.data?.map(m => (
                  <div key={m.id} className={`max-w-[80%] rounded-xl p-3 text-xs ${m.senderOrganizationId === session.data?.sellerOrganisationId ? 'ml-auto bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                    {m.message}
                    <div className="mt-1 text-[9px] opacity-70">{new Date(m.sentAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <textarea className="input-base min-h-16 flex-1" placeholder="Type a reply…" value={draft} onChange={e => setDraft(e.target.value)} />
                <Button onClick={submit} loading={sendMessage.isPending} disabled={!draft.trim()}><Send className="h-4 w-4" /></Button>
              </div>
            </>}
          </div>
        </div>
      )}
    </div>
  </div>;
}