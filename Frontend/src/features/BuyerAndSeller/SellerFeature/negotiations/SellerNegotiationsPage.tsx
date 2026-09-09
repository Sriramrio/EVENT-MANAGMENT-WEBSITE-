import { useState } from 'react';
import { Handshake, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';

import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { EmptyState } from '../../../../components/ui/PageStates';
import { useSellerRfqs } from '../../../../services/seller/hooks';
import { httpClient } from '../../../../services/api/httpClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { RefreshListButton } from '../../../../shared/components/RefreshListButton';

export function SellerNegotiationsPage() {
  const rfqs = useSellerRfqs();
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);

  const activeRfq = rfqs.data?.find(r => r.id === selectedRfqId);
  const qc = useQueryClient();

  const quotesQuery = useQuery({
    queryKey: ['seller', 'rfq', selectedRfqId, 'quotations'],
    queryFn: () => httpClient.get(`/marketplace/rfqs/${selectedRfqId}/quotations/me`),
    enabled: Boolean(selectedRfqId),
  });

  const reviseMutation = useMutation({
    mutationFn: async ({ rfqId, quotationId, newTotal }: { rfqId: string; quotationId: string; newTotal: number }) => {
      // Mocked lines
      const lines = [
        { description: 'Revised Item', quantity: 1, uomCode: 'NOS', unitPrice: newTotal }
      ];
      return httpClient.post(`/marketplace/rfqs/${rfqId}/quotations/${quotationId}/revise`, {
        sellerOrganizationId: 'mock', // Ignored on backend since it uses actor
        currency: 'INR',
        lines
      }, crypto.randomUUID());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller', 'rfq', selectedRfqId, 'quotations'] });
    }
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Seller Journey</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Commercial Negotiation</h1>
          <p className="mt-1 text-sm text-slate-500">Track commercial revisions and submit revised quotations.</p>
        </div>
        <RefreshListButton onRefresh={() => rfqs.refetch()} />
      </div>
      <div className="mt-6">
      <div className="grid gap-4 xl:grid-cols-[20rem_1fr]">
        <Card className="flex flex-col overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Your RFQs</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {rfqs.data?.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRfqId(r.id)}
                className={`w-full text-left flex flex-col gap-1 rounded-xl p-3 transition ${
                  selectedRfqId === r.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">{r.rfqNo}</span>
                  <StatusBadge status={r.status} />
                </div>
                <span className="text-[10px] font-medium text-slate-500 line-clamp-1">{r.requirementTitle}</span>
              </button>
            ))}
            {rfqs.data?.length === 0 && (
              <p className="p-4 text-center text-xs text-slate-400">No RFQs available for negotiation.</p>
            )}
          </div>
        </Card>

        <Card className="min-h-[32rem]">
          {!selectedRfqId ? (
            <EmptyState title="Select an RFQ" message="Choose an RFQ from the list to view quotation revisions." />
          ) : (
            <div className="p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">{activeRfq?.rfqNo}</h2>
                  <p className="text-sm text-slate-500">{activeRfq?.requirementTitle}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" /> Quotation Revisions
                  </h3>
                  
                  {quotesQuery.isLoading && <p className="text-xs text-slate-400">Loading revisions...</p>}
                  
                  {Array.isArray(quotesQuery.data) && quotesQuery.data.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                      <p className="text-sm text-slate-500">No quotations submitted yet for this RFQ.</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {(quotesQuery.data as any[])?.map((q: any, i: number) => (
                      <div key={q.id} className={`rounded-xl border p-4 ${i === 0 ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                              v{q.revision}
                            </span>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{q.quotationNo}</p>
                              <p className="text-[10px] text-slate-500">Submitted on {new Date(q.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-slate-900">{q.currency} {q.grandTotal.toLocaleString()}</p>
                            {i === 0 && <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 uppercase tracking-widest"><CheckCircle2 className="w-3 h-3" /> Latest</span>}
                          </div>
                        </div>
                        
                        {i === 0 && (
                          <div className="mt-4 flex justify-end border-t border-blue-100 pt-4">
                            <Button 
                              onClick={() => {
                                const newTotal = parseFloat(window.prompt(`Enter revised total for ${q.quotationNo}:`, q.grandTotal.toString()) || '0');
                                if (newTotal > 0) {
                                  reviseMutation.mutate({ rfqId: selectedRfqId, quotationId: q.id, newTotal });
                                }
                              }}
                              loading={reviseMutation.isPending}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" /> Revise Quotation
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
    </div>
  );
}
