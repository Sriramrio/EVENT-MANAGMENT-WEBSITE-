import { useEffect, useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';
import { Download, Store, Copy, Check, ArrowLeft, Loader2, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { exhibitorApiClient, getExhibitorToken } from '../../data/api/exhibitorApiClient';
import { BRAND } from '../../config/brand';

interface MeResponse {
  companyName: string;
  registrationNumber: string | null;
  stallNumber: string | null;
}

const PUBLIC_BASE_URL = 'https://msmesangamam.lubtn.com/stall';

export function ExhibitorStallQrPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    exhibitorApiClient
      .get<MeResponse>('/exhibitor/me')
      .then((data) => setMe(data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const regNum = me?.registrationNumber || 'MSME-STALL';
  const profileUrl = `${PUBLIC_BASE_URL}/${encodeURIComponent(regNum)}`;
  const label = me?.companyName || 'Stall Exhibitor';

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      const safeLabel = label.replace(/[^a-zA-Z0-9 -]/g, '').trim().replace(/\s+/g, '_');
      link.download = `StallQR_${safeLabel}_${regNum}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export stall QR image:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0B3B75]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/exhibitorShell/Dashboard"
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Stall QR</h1>
          <p className="text-sm text-slate-500">
            For visitors to scan
          </p>
        </div>
      </div>

      {/* QR Card Frame */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        {/* We place cardRef here so the entire visual card is captured seamlessly */}
        <div ref={cardRef} className="bg-white">
          {/* Header */}
          <div className="bg-[#0B3B75] px-6 py-8 text-center">
            {/* Logo area */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 shadow-inner">
              <QrCode className="h-7 w-7 text-white" />
            </div>

            <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-blue-200">
              {BRAND.portalName}
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-white px-2 leading-tight">
              {label}
            </h2>
            <p className="mt-1.5 text-xs text-blue-100 font-medium">
              {me?.stallNumber ? `Stall No. ${me.stallNumber}` : 'Scan to view stall profile'}
            </p>
          </div>

          {/* QR Area */}
          <div className="px-6 py-8 text-center">
            <div className="mx-auto flex w-fit items-center justify-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <QRCode value={profileUrl} size={210} level="H" />
            </div>

            <p className="mt-4 font-mono text-xs font-bold tracking-widest text-slate-500">
              {regNum}
            </p>
          </div>
        </div>

        {/* Action Controls (Not included in download) */}
        <div className="border-t border-slate-100 bg-slate-50 p-6">
          <p className="text-center text-xs text-slate-500 leading-relaxed mb-4">
            Place this at the front of your stall. Visitors scan it to view your company profile and tap "I'm Interested" to share their contact details with you.
          </p>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0B3B75] py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#0B3B75]/90 disabled:opacity-60"
          >
            <Download size={18} />
            {downloading ? 'Preparing...' : 'Download QR Image'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExhibitorStallQrPage;
