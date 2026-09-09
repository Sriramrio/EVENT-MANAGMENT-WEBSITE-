import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export function ChipInput({ label, values, onChange, placeholder = 'Type and press Enter' }: { label?: string; values: string[]; onChange: (next: string[]) => void; placeholder?: string }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const commit = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft('');
    setAdding(false);
  };

  return (
    <div>
      {label && <p className="mb-2 text-xs font-bold text-slate-700">{label}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`Remove ${v}`}>
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        {adding ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') { setAdding(false); setDraft(''); } }}
            onBlur={commit}
            placeholder={placeholder}
            className="w-40 rounded-full border border-blue-300 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
          />
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1 rounded-full border border-dashed border-blue-300 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50">
            <Plus className="h-3.5 w-3.5" /> Add {values.length > 0 ? 'more' : ''}
          </button>
        )}
      </div>
    </div>
  );
}
