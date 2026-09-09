import { useNavigate } from 'react-router-dom';
import { useSellerCapabilities } from '../../../../services/seller/hooks';
import { ErrorState, LoadingState } from '../../../../components/ui/PageStates';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { Edit2, Eye } from 'lucide-react';

export default function CapabilitiesPage() {
  const q = useSellerCapabilities();
  const nav = useNavigate();

  if (q.isLoading) return <LoadingState label="Loading capabilities…" />;
  if (q.isError) return <ErrorState error={q.error} retry={() => q.refetch()} />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-blue-600">Seller / Capabilities</p>
          <h1 className="mt-1 text-2xl font-extrabold">Capabilities</h1>
        </div>
        <button
          onClick={() => nav('/seller/capabilities/new/basic')}
          className="btn btn-primary"
        >
          + New Capability
        </button>
      </div>

      <div className="card mt-5 overflow-hidden">
        <div className="grid grid-cols-[1.4fr_1fr_8rem_12rem] gap-3 bg-slate-50 px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
          <span>Capability</span>
          <span>Classification</span>
          <span>Status</span>
          <span className="text-right pr-2">Action</span>
        </div>
        {q.data?.items.map((x) => (
          <div
            key={x.id}
            className="grid grid-cols-[1.4fr_1fr_8rem_12rem] items-center gap-3 border-t px-5 py-4 hover:bg-slate-50/50 transition"
          >
            <div>
              <strong className="text-sm text-slate-900">{x.title}</strong>
              <p className="text-xs text-slate-500">{x.capabilityNo}</p>
            </div>
            <span className="text-xs text-slate-700">
              {x.mainCategoryCode || 'Not selected'} / {x.uomCode}
            </span>
            <div>
              <StatusBadge status={x.status} />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50/40 transition shadow-2xs"
                onClick={() => nav(`/seller/capabilities/${x.id}/basic`)}
              >
                <Edit2 className="h-3 w-3" /> Edit
              </button>
              <button
                className="btn btn-secondary text-xs py-1.5 px-3"
                onClick={() => nav(`/seller/capabilities/${x.id}/review`)}
              >
                Open
              </button>
            </div>
          </div>
        ))}
        {(!q.data?.items || q.data.items.length === 0) && (
          <div className="p-8 text-center text-sm text-slate-500">
            No capabilities found. Click &quot;+ New Capability&quot; to create your first capability.
          </div>
        )}
      </div>
    </div>
  );
}
