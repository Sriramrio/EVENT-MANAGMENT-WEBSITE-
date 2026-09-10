import { useEffect, useRef, useState } from 'react';
import {
  IdCard,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Download,
  Loader2,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import { apiClient } from '../../data/api/apiClient';
import { getVisitorProfile } from '../../data/api/visitorApiClient';
import { BRAND } from '../../config/brand';

function brandAsset(fileName: string) {
  return `${import.meta.env.BASE_URL}brand/${fileName}`;
}

const TENANT_ID = '11111111-1111-1111-1111-111111111111';

type VisitorDetails = {
  registrationNumber: string;
  legalName: string;
  contactPersonName: string;
  mobile?: string;
  email?: string;
};

export function VisitorPassPage() {
  const profile = getVisitorProfile();

  const [visitor, setVisitor] = useState<VisitorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const passRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile?.registrationNumber) {
      setError('Visitor session not found. Please login again.');
      setLoading(false);
      return;
    }

    apiClient
      .get<VisitorDetails>(
        `/visitors/${encodeURIComponent(
          profile.registrationNumber
        )}?tenantId=${TENANT_ID}`
      )
      .then((data) => {
        setVisitor(data);
        setError('');
      })
      .catch(() => {
        // Fall back to what login already gave us, so the pass still
        // renders (with a QR code) even if the details lookup fails.
        setVisitor({
          registrationNumber: profile.registrationNumber,
          legalName: profile.legalName,
          contactPersonName: profile.contactPersonName,
        });
      })
      .finally(() => setLoading(false));
  }, [profile?.registrationNumber]);

  const handleDownload = async () => {
    if (!passRef.current) return;
    setDownloading(true);

    try {
      const element = passRef.current;
      const images = Array.from(element.querySelectorAll('img'));
      await Promise.all(
        images.map(img => img.complete ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res; }))
      );

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        logging: false,
      });

      const image = canvas.toDataURL('image/jpeg', 0.98);

      const link = document.createElement('a');
      link.href = image;
      link.download = `VisitorPass_${visitor?.registrationNumber ?? 'pass'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to generate pass image:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#0B3B75]" />
      </div>
    );
  }

  if (error || !visitor) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
        <p className="mt-3 font-semibold text-red-700">{error || 'Could not load your pass.'}</p>
        <Link
          to="/visitor/login"
          className="mt-4 inline-block rounded-xl bg-[#0B3B75] px-4 py-2 text-sm font-bold text-white"
        >
          Login again
        </Link>
      </div>
    );
  }

  const name =
    visitor.contactPersonName || visitor.legalName || 'Visitor';

  const qrValue = `${window.location.origin}/visitorverification/${visitor.registrationNumber}`;

  return (
    <div className="mx-auto max-w-4xl">

      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0B3B75]">
            <IdCard size={23} />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              My Pass
            </h2>

            <p className="text-sm text-slate-500">
              Your MSME Sangamam visitor pass
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0B3B75] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0B3B75]/90 disabled:opacity-60"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {downloading ? 'Generating…' : 'Download Pass'}
        </button>
      </div>

      <div
        ref={passRef}
        className="overflow-hidden rounded-3xl bg-[#0B3B75] shadow-xl"
      >

        {/* HEADER */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-6 text-white sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
              {BRAND.portalName}
            </p>

            <h1 className="mt-2 text-2xl font-extrabold">
              Visitor Pass
            </h1>
          </div>

          <img
            src={brandAsset('msme-sangamam-logo.png')}
            alt={BRAND.eventName}
            className="h-10 object-contain"
          />
        </div>

        {/* BODY */}
        <div className="bg-white p-6 sm:p-8">

          <div className="grid gap-8 md:grid-cols-[1fr_180px]">

            <div>
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-[#0B3B75]">
                <User size={40} />
              </div>

              <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
                {name}
              </h2>

              {visitor.legalName && (
                <div className="mt-1.5 flex items-center gap-2 text-sm sm:text-base font-bold text-slate-700">
                  <Building2 size={17} className="text-[#0B3B75] shrink-0" />
                  <span>{visitor.legalName}</span>
                </div>
              )}

              <p className="mt-1.5 text-sm font-semibold text-[#0B3B75]">
                Visitor ID: {visitor.registrationNumber}
              </p>

              <div className="mt-7 space-y-3">

                {visitor.mobile && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone
                      size={17}
                      className="text-[#0B3B75]"
                    />
                    {visitor.mobile}
                  </div>
                )}

                {visitor.email && (
                  <div className="flex items-center gap-3 break-all text-sm text-slate-600">
                    <Mail
                      size={17}
                      className="text-[#0B3B75]"
                    />
                    {visitor.email}
                  </div>
                )}

                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Calendar
                    size={17}
                    className="text-[#0B3B75]"
                  />
                  18 & 19 September 2026
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <MapPin
                    size={17}
                    className="text-[#0B3B75]"
                  />
                  Hotel Hills, Hosur
                </div>
              </div>
            </div>

            {/* QR CODE */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <QRCode
                  value={qrValue}
                  size={130}
                />
              </div>

              <p className="mt-3 text-center text-xs font-semibold text-slate-500">
                Visitor QR
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-xl bg-blue-50 px-4 py-3 text-center text-sm font-medium text-[#0B3B75]">
            Please show this pass at the event entrance.
          </div>
        </div>

        <div className="bg-[#0B3B75] py-2.5 text-center text-[10px] font-bold uppercase tracking-widest text-white border-t border-white/10">
          MSME Sangamam Connect • Official Visitor Pass
        </div>
      </div>
    </div>
  );
}

export default VisitorPassPage;
