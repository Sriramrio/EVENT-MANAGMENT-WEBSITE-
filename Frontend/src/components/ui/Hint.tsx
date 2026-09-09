import React, { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';

export function Hint({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className={`relative inline-block ${className}`}>
      <button 
        onClick={() => setOpen(!open)}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${open ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-500'}`}
        aria-label="Show hint"
        type="button"
      >
        <Lightbulb className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute left-10 top-0 z-50 w-64 rounded-xl border border-amber-200 bg-amber-50 p-3 shadow-lg animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="text-xs font-medium text-amber-900 leading-relaxed">
              {children}
            </div>
            <button 
              onClick={() => setDismissed(true)}
              className="text-amber-700/50 hover:text-amber-900 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
