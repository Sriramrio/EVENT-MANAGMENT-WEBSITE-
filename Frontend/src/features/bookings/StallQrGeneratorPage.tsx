import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';
import { Search, Download, Printer, QrCode as QrCodeIcon, Loader2, CheckSquare, Square } from 'lucide-react';
import { apiClient } from '../../data/api/apiClient';
import { StallBooking } from '../../domain/models';
import { BRAND } from '../../config/brand';

const BOOKINGS_KEY = ['admin', 'bookings'] as const;
const PUBLIC_BASE_URL = 'https://msmesangamam.lubtn.com/stall';

function eligibleForQr(b: StallBooking) {
  // Only exhibitors with a confirmed/allocated stall need a printable QR.
  return b.bookingStatus !== 'Cancelled' && b.bookingStatus !== 'Draft';
}

export function StallQrGeneratorPage() {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: BOOKINGS_KEY,
    queryFn: () => apiClient.get<StallBooking[]>('/admin/events/current/bookings'),
  });

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloadingAll, setDownloadingAll] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings
      .filter(eligibleForQr)
      .filter((b) =>
        !q ||
        b.companyName?.toLowerCase().includes(q) ||
        b.fasciaName?.toLowerCase().includes(q) ||
        b.bookingRegistrationNumber.toLowerCase().includes(q) ||
        b.stallNumber?.toLowerCase().includes(q)
      );
  }, [bookings, search]);

  const allSelected = filtered.length > 0 && filtered.every((b) => selected.has(b.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((b) => b.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handlePrintSelected = () => {
    window.print();
  };

  const handleDownloadOne = async (booking: StallBooking) => {
    const originalNode = document.getElementById(`qr-card-${booking.id}`);
    if (!originalNode) return;

    try {
      const dataUrl = await toPng(originalNode, {
        quality: 1.0,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        filter: (node: HTMLElement) => {
          // exclude buttons (select and download icons)
          return node.tagName !== 'BUTTON';
        },
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          border: 'none', // remove the border for the downloaded image if desired, or keep it
        }
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      const label = booking.fasciaName || booking.companyName || booking.bookingRegistrationNumber;
      const safeLabel = label.replace(/[^a-zA-Z0-9 -]/g, '').trim().replace(/\s+/g, '_');
      link.download = `StallQR_${safeLabel}_${booking.bookingRegistrationNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export stall QR image:', err);
    }
  };

  const handleDownloadAll = async () => {
    const targets = filtered.filter((b) => selected.size === 0 || selected.has(b.id));
    setDownloadingAll(true);
    try {
      for (const booking of targets) {
        // eslint-disable-next-line no-await-in-loop
        await handleDownloadOne(booking);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 150));
      }
    } finally {
      setDownloadingAll(false);
    }
  };

  const printSet = selected.size > 0 ? filtered.filter((b) => selected.has(b.id)) : filtered;

  return (
    <div className="p-6">
      {/* Screen-only header/controls */}
      <div className="print:hidden">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <QrCodeIcon className="w-5 h-5 text-indigo-600" /> Stall QR Codes
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Generate one QR per company. Print or download the sheet and place each QR at the front of the corresponding stall —
              visitors scan it to view the company profile and tap "I'm Interested".
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintSelected}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
            >
              <Printer className="w-4 h-4" /> Print {selected.size > 0 ? `(${selected.size})` : 'All'}
            </button>
            <button
              onClick={handleDownloadAll}
              disabled={downloadingAll || filtered.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-100 transition disabled:opacity-60"
            >
              {downloadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloadingAll ? 'Downloading…' : `Download ${selected.size > 0 ? `(${selected.size})` : 'All'} PNG`}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company, stall no, registration no…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <button
            onClick={toggleAll}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
          >
            {allSelected ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4" />}
            Select all ({filtered.length})
          </button>
        </div>

        {isLoading && (
          <div className="mt-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="mt-10 text-center text-sm text-slate-400">No companies found.</div>
        )}
      </div>

      {/* QR grid — shown both on screen and in print */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-2 print:gap-6">
        {printSet.map((booking) => {
          const profileUrl = `${PUBLIC_BASE_URL}/${encodeURIComponent(booking.bookingRegistrationNumber)}`;
          const label = booking.fasciaName || booking.companyName || booking.bookingRegistrationNumber;
          const isSelected = selected.has(booking.id);

          return (
            <div
              key={booking.id}
              id={`qr-card-${booking.id}`}
              className={`relative bg-white rounded-2xl border p-4 text-center print:break-inside-avoid print:border-slate-300 ${isSelected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
                }`}
            >
              <button
                onClick={() => toggleOne(booking.id)}
                className="absolute top-2.5 left-2.5 print:hidden text-slate-400 hover:text-indigo-600"
                aria-label="Select"
              >
                {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleDownloadOne(booking)}
                className="absolute top-2.5 right-2.5 print:hidden text-slate-400 hover:text-indigo-600"
                aria-label="Download"
              >
                <Download className="w-4 h-4" />
              </button>

              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mt-1">{BRAND.portalName}</p>
              <h3 className="mt-1 text-sm font-black text-slate-900 leading-tight min-h-[2.2em]">{label}</h3>
              {booking.stallNumber && <p className="text-xs text-slate-500 mt-0.5">Stall No. {booking.stallNumber}</p>}

              <div className="mt-3 inline-flex bg-white p-2.5 rounded-lg border border-slate-200">
                <QRCode value={profileUrl} size={120} level="M" />
              </div>

              <p className="mt-2 font-mono text-[11px] font-bold text-slate-600 tracking-wide break-all">
                {booking.bookingRegistrationNumber}
              </p>
            </div>
          );
        })}
      </div>

    </div>
  );
}
