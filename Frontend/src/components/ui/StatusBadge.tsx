import { Circle } from 'lucide-react';
import { statusTone } from '../../domain/status/statusConfig';
const tones={success:'bg-emerald-50 text-emerald-700 border-emerald-200',warning:'bg-amber-50 text-amber-700 border-amber-200',danger:'bg-red-50 text-red-700 border-red-200',info:'bg-sky-50 text-sky-700 border-sky-200',neutral:'bg-slate-50 text-slate-600 border-slate-200',brand:'bg-brand-50 text-brand-700 border-brand-100'} as const;
//@ts-ignore
export function StatusBadge({status}:{status:string}){const tone=statusTone(status);return <span className={`status-pill border ${tones[tone]}`}><Circle className="h-2 w-2 fill-current" aria-hidden="true"/>{status}</span>;}
