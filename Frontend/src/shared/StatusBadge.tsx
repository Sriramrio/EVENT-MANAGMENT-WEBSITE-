import { statusClass, statusLabels } from '../config/statusConfig';

export function StatusBadge({ value }: { value: unknown }) {
  const status = String(value ?? '');
  return <span className={`status-pill ring-1 ${statusClass(status)}`}>{statusLabels[status] ?? status}</span>;
}
