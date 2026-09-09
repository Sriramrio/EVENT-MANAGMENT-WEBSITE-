import { useState } from 'react';
import { SellerSubmitQuotationModal } from './SellerSubmitQuotationModal';
import { FileText, Send } from 'lucide-react';
import { useSellerRfqs } from '../../../../services/seller/hooks';
import { ErrorState, LoadingState } from '../../../../components/ui/PageStates';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { RefreshListButton } from '../../../../shared/components/RefreshListButton';

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function SellerRfqsPage() {
  const q = useSellerRfqs();
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);

  if (q.isLoading) return <LoadingState label="Loading RFQs…" />;
  if (q.isError) return <ErrorState error={q.error} retry={() => q.refetch()} />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-600">Seller Journey</p>
          <h1 className="mt-1 text-2xl font-extrabold">RFQ / Quotation Submission</h1>
          <p className="mt-1 text-sm text-slate-500">Review buyer RFQs, compliance checklist and quotation revisions</p>
        </div>
        <RefreshListButton onRefresh={() => q.refetch()} />
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="flex items-center gap-3 border-b p-5 text-blue-600">
          <FileText />
          <strong className="text-sm text-slate-900">RFQs Received</strong>
        </div>

        {q.data?.length ? (
          <div className="divide-y">
            {q.data.map(rfq => (
              <div key={rfq.id} className="grid grid-cols-[1.4fr_1fr_8rem_7rem_10rem] items-center gap-3 p-4 hover:bg-slate-50">
                <div>
                  <strong className="text-sm">{rfq.rfqNo}</strong>
                  <p className="text-xs text-slate-500">
                    {rfq.requirementNo ? `${rfq.requirementNo} · ${rfq.requirementTitle}` : `Requirement ${rfq.requirementId.slice(0, 8)}…`}
                  </p>
                </div>
                <span className="text-xs text-slate-500">Received {formatDate(rfq.createdAt)}</span>
                <span className="text-xs text-slate-500">Due {formatDate(rfq.submissionDeadline)}</span>
                <StatusBadge status={rfq.status} />
                <div className="flex justify-end">
                  <button 
                    onClick={() => setSelectedRfqId(rfq.id)}
                    className="btn-secondary whitespace-nowrap text-xs gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit Quote
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-sm text-slate-500">No RFQs received yet.</div>
        )}
      </div>

      <SellerSubmitQuotationModal
        rfqId={selectedRfqId}
        isOpen={Boolean(selectedRfqId)}
        onClose={() => setSelectedRfqId(null)}
      />
    </div>
  );
}
