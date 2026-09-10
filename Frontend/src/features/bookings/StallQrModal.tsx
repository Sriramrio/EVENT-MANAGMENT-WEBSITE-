import { useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';
import { X, Download, Store } from 'lucide-react';
import { BRAND } from '../../config/brand';

export interface StallQrBooking {
  bookingRegistrationNumber: string;
  fasciaName?: string | null;
  companyName?: string | null;
  stallNumber?: string | null;
}

// Same public host pattern already used for the visitor-pass QR
// (see WorkflowServices.cs: visitorverification/{registrationNumber}).
const PUBLIC_BASE_URL = 'https://msmesangamam.lubtn.com/stall';

interface Props {
  booking: StallQrBooking;
  onClose: () => void;
}

export function StallQrModal({ booking, onClose }: Props) {
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const profileUrl = `${PUBLIC_BASE_URL}/${encodeURIComponent(booking.bookingRegistrationNumber)}`;
  const label = booking.companyName || booking.fasciaName || booking.bookingRegistrationNumber;

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
      link.download = `StallQR_${safeLabel}_${booking.bookingRegistrationNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export stall QR image:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-[9999]
        flex
        min-h-[100dvh]
        items-center
        justify-center
        overflow-y-auto
        bg-black/50
        px-4
        py-6
        backdrop-blur-sm
      "
      onClick={onClose}
    >
      <div
        className="
          relative
          w-full
          max-w-[380px]
          rounded-3xl
          bg-white
          shadow-[0_25px_70px_rgba(0,0,0,0.25)]
          overflow-hidden
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - Outside capture area */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="
            absolute
            right-4
            top-4
            z-10
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            bg-white/15
            text-white
            transition
            hover:bg-white/25
          "
        >
          <X className="h-5 w-5" />
        </button>

        {/* Capture Area */}
        <div ref={cardRef} className="bg-white">
          {/* Header */}
          <div className="bg-[#0B3B75] px-6 pb-8 pt-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white shadow-inner">
              <Store className="h-7 w-7" />
            </div>

            <h3 className="m-0 mt-4 text-xl font-extrabold text-white leading-tight">
              {label}
            </h3>

            {booking.fasciaName && booking.fasciaName.toLowerCase() !== (booking.companyName || '').toLowerCase() && (
              <p className="m-0 mt-1 text-xs text-blue-200 font-medium">
                Brand: {booking.fasciaName}
              </p>
            )}

            <p className="m-0 mt-1.5 text-sm text-blue-100 font-medium">
              {booking.stallNumber ? `Stall No. ${booking.stallNumber}` : 'Scan to view stall profile'}
            </p>
          </div>

          {/* QR Area */}
          <div className="px-6 py-8 text-center bg-white">
            <p className="m-0 text-[11px] font-bold uppercase tracking-widest text-[#0B3B75]">
              {BRAND.portalName}
            </p>

            <div className="mx-auto mt-4 flex w-fit items-center justify-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <QRCode value={profileUrl} size={210} level="H" />
            </div>

            <p className="m-0 mt-4 font-mono text-sm font-bold tracking-widest text-slate-600">
              {booking.bookingRegistrationNumber}
            </p>
          </div>

          {/* Bottom Card Footer Banner */}
          <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-center">
            <p className="m-0 text-xs font-bold text-[#0B3B75] leading-tight">
              Scan QR code to view stall profile &amp; connect
            </p>
            <p className="m-0 mt-1 text-[10px] font-medium text-slate-500">
              MSME Sangamam Connect • Place at stall front for visitors
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="px-6 pb-6 pt-3 bg-white">
          <p className="m-0 text-center text-sm leading-relaxed text-gray-600">
            Place this at the front of the stall. Visitors scan it to view your
            company profile and tap "I'm Interested".
          </p>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0B3B75] text-sm font-bold text-white shadow-md transition hover:bg-[#0B3B75]/90 disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {downloading ? 'Preparing…' : 'Download Image'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 transition hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}