import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export interface RefreshListButtonProps {
  onRefresh: () => void | Promise<unknown>;
  isRefreshing?: boolean;
  loading?: boolean;
  className?: string;
  label?: string;
  size?: 'xs' | 'sm' | 'md';
  title?: string;
}

export const RefreshListButton: React.FC<RefreshListButtonProps> = ({
  onRefresh,
  isRefreshing = false,
  loading: externalLoading,
  className = '',
  label = 'Refresh List',
  size = 'sm',
  title = 'Refresh list data',
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading !== undefined ? externalLoading : (isRefreshing || internalLoading);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (loading) return;
    try {
      setInternalLoading(true);
      await Promise.resolve(onRefresh());
    } finally {
      setInternalLoading(false);
    }
  };

  const sizeClasses =
    size === 'xs'
      ? 'px-2.5 py-1.5 text-[11px]'
      : size === 'md'
        ? 'px-4 py-2.5 text-sm'
        : 'px-3.5 py-2 text-xs';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 hover:text-msme-blue active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${sizeClasses} ${className}`}
      title={title}
    >
      <RefreshCw
        className={`h-3.5 w-3.5 text-slate-500 transition-transform ${
          loading ? 'animate-spin text-msme-blue' : ''
        }`}
      />
      <span>{label}</span>
    </button>
  );
};

export default RefreshListButton;
