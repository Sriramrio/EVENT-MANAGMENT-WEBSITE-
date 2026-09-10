import { useState } from 'react';
import { useSubmitQuotation } from '../../../../services/seller/hooks';
import { useSellerSession } from '../../../../services/seller/hooks';
import { toast } from 'react-hot-toast';
import { ModalPortal } from '../../../../shared/components/ModalPortal';

export function SellerSubmitQuotationModal({
  rfqId,
  isOpen,
  onClose,
}: {
  rfqId: string | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const session = useSellerSession();
  const submitQuotation = useSubmitQuotation();
  
  const [currency, setCurrency] = useState('INR');
  const [totalValue, setTotalValue] = useState('');

  if (!isOpen || !rfqId) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rfqId) {
      toast.error('Missing RFQ ID.');
      return;
    }

    if (!session.data?.sellerOrganisationId) {
      toast.error('Seller organization not found in session.');
      return;
    }

    const value = parseFloat(totalValue);
    if (isNaN(value) || value <= 0) {
      toast.error('Please enter a valid total quote value.');
      return;
    }

    try {
      await submitQuotation.mutateAsync({
        rfqId: rfqId, // now TS knows it's a string
        sellerOrganizationId: session.data.sellerOrganisationId,
        currency,
        lines: [
          {
            description: 'Complete Solution (Lump Sum)',
            quantity: 1,
            uomCode: 'LS',
            unitPrice: value,
          },
        ],
      });
      toast.success('Quotation submitted successfully.');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit quotation.');
    }
  }

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        onMouseDown={event => {
          if (event.target === event.currentTarget && !submitQuotation.isPending) {
            onClose();
          }
        }}
      >
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-xl font-bold text-slate-900">Submit Quotation</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <p className="text-sm text-slate-500">
            Enter the total value for this RFQ. You can itemize or revise this quote later from the Negotiations page.
          </p>

          <div className="grid gap-2">
            <label className="text-sm font-semibold text-slate-700">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="input"
            >
              <option value="INR">INR (Indian Rupee)</option>
              <option value="USD">USD (US Dollar)</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold text-slate-700">Total Quote Value</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={totalValue}
              onChange={(e) => setTotalValue(e.target.value)}
              className="input"
              placeholder="e.g. 50000"
            />
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitQuotation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitQuotation.isPending}
            >
              {submitQuotation.isPending ? 'Submitting...' : 'Submit Quotation'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
