import { ClipboardList } from 'lucide-react';
import { useSellerMeetingOutcomes } from '../../../../services/seller/hooks';
import { LoadingState, ErrorState } from '../../../../components/ui/PageStates';

export default function SellerMeetingOutcomesPage() {
  const q = useSellerMeetingOutcomes();
  
  if (q.isLoading) return <LoadingState label="Loading meeting outcomes..." />;
  if (q.isError) return <ErrorState error={q.error} retry={() => q.refetch()} />;

  const outcomes = q.data || [];

  return (
    <div>
      <p className="text-xs font-bold text-blue-600">Seller Workspace</p>
      <h1 className="mt-1 text-2xl font-extrabold">Meeting Outcomes</h1>
      <p className="mt-1 text-sm text-slate-500">Track decisions and next actions from completed meetings.</p>

      <div className="mt-6 grid gap-4">
        {outcomes.length === 0 ? (
          <div className="card p-8 text-center text-slate-500 text-sm">
            No meeting outcomes found.
          </div>
        ) : (
          outcomes.map((o: any) => {
            const nextStep = o.actions?.find((a: any) => a.status !== 'COMPLETED');
            return (
              <div key={o.meetingId} className="card p-5">
                <div className="flex justify-between border-b pb-4 mb-4">
                  <div>
                    <h3 className="font-extrabold text-blue-700">{o.meetingNo}</h3>
                    <p className="text-xs text-slate-500">
                      {new Date(o.scheduledStart).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <div>
                      <span className="text-slate-400">Buyer: </span>
                      <strong className="text-slate-700">{o.buyerName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Seller: </span>
                      <strong className="text-slate-700">{o.sellerName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">RFQ / Req: </span>
                      <strong className="text-slate-700">{o.requirementNo || 'N/A'}</strong>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                      <ClipboardList className="w-4 h-4 text-emerald-600" />
                      Outcome Notes
                    </h4>
                    <p className="text-slate-600 whitespace-pre-wrap">{o.outcome}</p>
                    {o.notes && (
                      <p className="mt-2 text-xs text-slate-500 italic">{o.notes}</p>
                    )}
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="font-bold text-slate-900 mb-3">Action Plan</h4>
                    {o.actions?.length ? (
                      <ul className="space-y-3">
                        {o.actions.map((a: any, i: number) => (
                          <li key={i} className="text-xs">
                            <div className="flex justify-between mb-1">
                              <strong className={a.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-800'}>
                                {a.title}
                              </strong>
                              <span className="text-slate-400 font-medium">
                                {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No due date'}
                              </span>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              Owner: {a.ownerUserId ? "Assigned" : "Unassigned"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500">No action items captured.</p>
                    )}
                    
                    {nextStep && (
                      <div className="mt-4 pt-3 border-t border-slate-200">
                        <p className="text-xs">
                          <strong className="text-slate-800">Next Step: </strong>
                          <span className="text-slate-600">{nextStep.title}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
