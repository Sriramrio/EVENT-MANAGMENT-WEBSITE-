import { CheckCircle2, XCircle, X } from 'lucide-react';
import { useEffect } from 'react';

type StatusBannerProps = {
  success?: string | null;
  error?: string | null;
  onDismissSuccess?: () => void;
  onDismissError?: () => void;
  autoHideMs?: number; // optional: auto-hide success after N ms
};

export function StatusBanner({
  success,
  error,
  onDismissSuccess,
  onDismissError,
  autoHideMs,
}: StatusBannerProps) {
  useEffect(() => {
    if (success && autoHideMs && onDismissSuccess) {
      const timer = setTimeout(onDismissSuccess, autoHideMs);
      return () => clearTimeout(timer);
    }
  }, [success, autoHideMs, onDismissSuccess]);

  if (!success && !error) return null;

  return (
    <div className="space-y-3">
      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p className="flex-1">{success}</p>
          {onDismissSuccess && (
            <button
              type="button"
              onClick={onDismissSuccess}
              className="flex-shrink-0 text-emerald-600 hover:text-emerald-800"
              aria-label="Dismiss success message"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p className="flex-1">{error}</p>
          {onDismissError && (
            <button
              type="button"
              onClick={onDismissError}
              className="flex-shrink-0 text-red-600 hover:text-red-800"
              aria-label="Dismiss error message"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}