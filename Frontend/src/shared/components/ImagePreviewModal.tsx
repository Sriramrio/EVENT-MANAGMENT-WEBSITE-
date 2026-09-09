import { useEffect } from 'react';
import { X, ZoomIn } from 'lucide-react';

export interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  title?: string;
  subtitle?: string;
  onClose: () => void;
}

export function ImagePreviewModal({
  isOpen,
  imageUrl,
  title,
  subtitle,
  onClose
}: ImagePreviewModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full rounded-2xl bg-white p-5 shadow-2xl transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <ZoomIn size={18} />
            </div>
            <div>
              {title && <h3 className="text-base font-bold text-slate-900">{title}</h3>}
              {subtitle && <p className="text-xs font-mono font-medium text-slate-500 uppercase">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Center Image */}
        <div className="flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 p-2 overflow-hidden max-h-[70vh]">
          <img
            src={imageUrl}
            alt={title || 'Preview'}
            className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-sm transition-transform duration-200"
          />
        </div>
      </div>
    </div>
  );
}
