import type { PropsWithChildren, ReactNode } from 'react';
import { Check } from 'lucide-react';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { useNavigate, useParams } from 'react-router-dom';

const steps = [
  'Basic Information',
  'Classification & HSN/SAC',
  'Intelligent Suggestions',
  'Technical Capabilities',
  'Quality & Compliance',
  'Operations & Machinery',
  'Commercial Terms',
  'Review & Submit',
];

const stepPaths = [
  'basic',
  'classification',
  'suggestions',
  'technical',
  'quality',
  'operations',
  'commercial',
  'review',
];

export function SellerWizard({
  step,
  title,
  actions,
  children,
}: PropsWithChildren<{ step: number; title: string; actions?: ReactNode }>) {
  const { id } = useParams();
  const nav = useNavigate();

  const handleStepClick = (index: number) => {
    const targetStep = index + 1;
    if (targetStep === step) return;
    if (id && id !== 'new' && id !== 'undefined') {
      nav(`/seller/capabilities/${id}/${stepPaths[index]}`);
    } else if (targetStep === 1) {
      nav('/seller/capabilities/new/basic');
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-blue-600">
            Seller / Capabilities / {id && id !== 'new' ? 'Edit Capability' : 'New Capability'} / {steps[step - 1] ?? title}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">{step}. {title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status="DRAFT" />
          {actions}
        </div>
      </div>

      <div className="card mb-5 overflow-x-auto p-5">
        <div className="relative flex min-w-[720px] justify-between">
          <div className="absolute left-8 right-8 top-4 h-0.5 bg-slate-200" />
          {steps.map((label, index) => {
            const n = index + 1;
            const done = n < step;
            const active = n === step;
            const isClickable = (done || n <= step) && (Boolean(id && id !== 'new' && id !== 'undefined') || n === 1);

            return (
              <div
                key={label}
                onClick={isClickable ? () => handleStepClick(index) : undefined}
                className={`relative z-10 flex w-32 flex-col items-center text-center ${
                  isClickable ? 'cursor-pointer group' : 'cursor-not-allowed opacity-75'
                }`}
                title={isClickable ? `Go to Step ${n}: ${label}` : undefined}
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-extrabold transition ${
                    done || active
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 bg-white text-slate-400'
                  } ${isClickable ? 'group-hover:scale-110 group-hover:shadow-md' : ''}`}
                >
                  {done ? <Check className="h-4 w-4" /> : n}
                </span>
                <span
                  className={`mt-2 text-[10px] font-bold transition-colors ${
                    active
                      ? 'text-blue-700 font-extrabold'
                      : done
                      ? 'text-slate-700 group-hover:text-blue-600'
                      : 'text-slate-400'
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <section className="card p-6">{children}</section>
    </div>
  );
}

export function Field({
  label,
  required,
  children,
  className = '',
}: PropsWithChildren<{ label: ReactNode; required?: boolean; className?: string }>) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export function Footer({
  back,
  onSave,
  onContinue,
  loading,
  continueLabel = 'Continue',
}: {
  back?: () => void;
  onSave?: () => void;
  onContinue: () => void;
  loading?: boolean;
  continueLabel?: string;
}) {
  return (
    <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5">
      <button type="button" onClick={back} className="btn btn-secondary" disabled={!back}>
        ← Back
      </button>
      <div className="flex gap-2">
        <button type="button" onClick={onSave} className="btn btn-secondary">
          Save as Draft
        </button>
        <button type="button" onClick={onContinue} className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : continueLabel} →
        </button>
      </div>
    </div>
  );
}
