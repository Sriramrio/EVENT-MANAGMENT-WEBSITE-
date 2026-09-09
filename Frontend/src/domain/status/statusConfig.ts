import { StatusTone } from "../models/buyer";

export const statusTone = (status: string): StatusTone => {
  const s=status.toLowerCase();
  if (['active','approved','qualified','completed','issued','ready','checked in','response received'].some(x=>s.includes(x))) return 'success';
  if (['rejected','failed','cancelled','overdue','expired'].some(x=>s.includes(x))) return 'danger';
  if (['pending','draft','in progress','requested','partially','paused','generating'].some(x=>s.includes(x))) return 'warning';
  if (['sent','scheduled','confirmed','submitted'].some(x=>s.includes(x))) return 'info';
  return 'neutral';
};
