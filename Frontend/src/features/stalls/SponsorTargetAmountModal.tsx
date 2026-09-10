import { useState } from 'react';

type Props = {
  stallNumber: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onConfirm: (targetAmount: number, isGstApplicable: boolean, isTdsDeductable: boolean, tdsPercentage?: number) => void;
};

export function SponsorTargetAmountModal({
  stallNumber,
  isSubmitting,
  onCancel,
  onConfirm
}: Props) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isGstApplicable, setIsGstApplicable] = useState(true);
  const [isTdsDeductable, setIsTdsDeductable] = useState(false);
  const [tdsPercentage, setTdsPercentage] = useState<number>(2);

  function handleConfirm() {
    const parsed = Number(amount);

    if (!amount.trim() || Number.isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid Sponor Amount greater than 0.');
      return;
    }

    setError('');
    onConfirm(parsed, isGstApplicable, isTdsDeductable, isTdsDeductable ? tdsPercentage : undefined);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500 text-xl text-white">
              ★
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Sponsor Stall — Sponor Amount
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Stall <span className="font-semibold">{stallNumber}</span> is
                a sponsor stall. Enter the agreed (open) amount to allocate
                it.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-xl text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <label className="text-sm font-bold text-slate-700">
            Sponor Amount (₹, inclusive of GST)
          </label>

          <input
            type="number"
            min={1}
            step="0.01"
            autoFocus
            value={amount}
            onChange={event => {
              setAmount(event.target.value);
              if (error) setError('');
            }}
            onKeyDown={event => {
              if (event.key === 'Enter') handleConfirm();
            }}
            placeholder="e.g. 50000"
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />

          {error && (
            <p className="mt-2 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}

          <p className="mt-3 text-xs text-slate-500">
            This amount will be used on the proforma invoice and will show
            as the expected total on the payment receipt for this booking.
          </p>

          <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={isGstApplicable}
                onChange={event => setIsGstApplicable(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span>
                <span className="font-semibold text-slate-700">GST Applicable</span>
                <span className="block text-xs text-slate-500">
                  Ticked: amount above is treated as GST-inclusive. Unticked:
                  amount above is treated as the base amount (no GST split).
                </span>
              </span>
            </label>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={isTdsDeductable}
                onChange={event => setIsTdsDeductable(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span>
                <span className="font-semibold text-slate-700">TDS Deductable</span>
                <span className="block text-xs text-slate-500">
                  Ticked: sponsor is expected to deduct {tdsPercentage}% TDS before
                  transferring. This is a preview only — the invoice total
                  stays at the Sponor Amount above.
                </span>
              </span>
            </label>

            {isTdsDeductable && (
              <div className="ml-6 mt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  TDS Deduction Percentage (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0.1}
                    max={100}
                    step="0.01"
                    value={tdsPercentage}
                    onChange={e => setTdsPercentage(parseFloat(e.target.value) || 0)}
                    className="w-28 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                  <span className="text-xs text-slate-500">%</span>
                  <div className="flex gap-1.5 ml-2">
                    {[2, 10, 1].map(rate => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setTdsPercentage(rate)}
                        className={`px-2 py-0.5 text-xs rounded border transition-colors ${tdsPercentage === rate
                            ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                          }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Allocating…' : 'Confirm & Allocate'}
          </button>
        </div>
      </div>
    </div>
  );
}
