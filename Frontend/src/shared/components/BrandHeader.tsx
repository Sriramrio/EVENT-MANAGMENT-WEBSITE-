import { BRAND } from '../../config/brand';

export function BrandHeader({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? '' : 'justify-center'}`}>
      <img src={BRAND.lubLogoUrl} alt="Laghu Udyog Bharati logo" className={compact ? 'h-12 w-12 object-contain' : 'h-20 w-20 object-contain'} />
      <div className="h-10 w-px bg-slate-200" />
      <img src={BRAND.msmeLogoUrl} alt="MSME Sangamam Connect Tamil Nadu logo" className={compact ? 'h-12 max-w-[190px] object-contain' : 'h-20 max-w-[310px] object-contain'} />
    </div>
  );
}
