import React, { useEffect, useRef, useState } from 'react';
import { toBlob } from 'html-to-image';
import {
  Download,
  Mail,
  Printer,
  Store,
  Building2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  FileText,
  Upload,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { appConfig } from '../../config/appConfig';
import { exhibitorApiClient, getExhibitorToken } from '../../data/api/exhibitorApiClient';
import { apiClient } from '../../data/api/apiClient';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';

export type ExhibitorStallCardData = {
  id: string;
  bookingRegistrationNumber: string;
  stallNumber: string | null;
  fasciaName: string | null;
  companyName: string;
  legalName?: string | null;
  contactPerson: string;
  email: string;
  mobile: string;
  industryCategory?: string | null;
  productKeywords?: string | null;
  companyLogo?: string | null;
  manufacturing?: string | null;
};

function brandAsset(fileName: string) {
  return `${import.meta.env.BASE_URL}brand/${fileName}`;
}

async function waitForCardImages(card: HTMLElement) {
  const images = Array.from(card.querySelectorAll('img'));

  await Promise.all(
    images.map(async (image) => {
      try {
        if (typeof image.decode === 'function') {
          await image.decode();
        } else if (!image.complete) {
          await new Promise<void>((resolve, reject) => {
            image.addEventListener('load', () => resolve(), { once: true });
            image.addEventListener('error', () => reject(new Error(`Failed to load: ${image.currentSrc || image.src}`)), { once: true });
          });
        }
      } catch {
        // Continue even if one fails
      }
    })
  );
}

export function ExhibitorECardPage() {
  const cardRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [cardData, setCardData] = useState<ExhibitorStallCardData | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setStatusMessage(null);

    try {
      // 1. First try dedicated stall-card endpoint
      const res = await exhibitorApiClient.get<ExhibitorStallCardData>('/exhibitor/stall-card').catch(() => null);
      if (res && res.bookingRegistrationNumber) {
        setCardData(res);
        setCompanyLogo(res.companyLogo ?? '');
        setLoading(false);
        return;
      }

      // 2. Fallback to /exhibitor/me + public stall profile
      const me = await exhibitorApiClient.get<any>('/exhibitor/me');
      if (!me?.registrationNumber) {
        throw new Error('Registration number not found for current exhibitor session.');
      }

      const stallProfile = await apiClient.get<any>(`/public/stalls/${encodeURIComponent(me.registrationNumber)}`).catch(() => null);

      const combined: ExhibitorStallCardData = {
        id: me.id || me.bookingId || '',
        bookingRegistrationNumber: me.registrationNumber || me.bookingRegistrationNumber || '',
        stallNumber: me.stallNumber || stallProfile?.stallNumber || null,
        fasciaName: me.fasciaName || stallProfile?.fasciaName || null,
        companyName: me.companyName || stallProfile?.companyName || 'Exhibitor',
        legalName: me.legalName || stallProfile?.legalName || null,
        contactPerson: me.contactPerson || stallProfile?.contactPersonName || '',
        email: me.email || stallProfile?.email || '',
        mobile: me.mobile || stallProfile?.mobile || '',
        industryCategory: me.industryCategory || stallProfile?.industryCategory || null,
        productKeywords: me.productKeywords || stallProfile?.productServiceDescription || null,
        companyLogo: me.companyLogo || stallProfile?.companyLogo || null,
        manufacturing: me.manufacturing || stallProfile?.productServiceDescription || null,
      };

      setCardData(combined);
      setCompanyLogo(combined.companyLogo ?? '');
    } catch (err) {
      console.error('Failed to load exhibitor E-Card data:', err);
      setError(err instanceof Error ? err.message : 'Could not load your E-Card details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const generateCardBlob = async (): Promise<Blob> => {
    const card = cardRef.current;
    if (!card) throw new Error('Stall card element not available.');

    await waitForCardImages(card);
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const bounds = card.getBoundingClientRect();
    const captureWidth = Math.ceil(Math.max(bounds.width, card.scrollWidth));
    const captureHeight = Math.ceil(Math.max(bounds.height, card.scrollHeight)) + 8;

    const blob = await toBlob(card, {
      cacheBust: false,
      pixelRatio: 2,
      width: captureWidth,
      height: captureHeight,
      backgroundColor: '#ffffff',
      style: {
        boxSizing: 'border-box',
        margin: '0',
      },
    });

    if (!blob) throw new Error('Failed to generate high-resolution stall card image.');
    return blob;
  };

  const handleDownload = async () => {
    if (!cardData) return;
    let objectUrl = '';

    try {
      setIsDownloading(true);
      setStatusMessage(null);

      const cardBlob = await generateCardBlob();
      objectUrl = URL.createObjectURL(cardBlob);

      const link = document.createElement('a');
      link.href = objectUrl;
      const cleanStall = (cardData.stallNumber || 'stall').replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanReg = cardData.bookingRegistrationNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `StallCard_${cleanStall}_${cleanReg}.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setStatusMessage({ type: 'success', text: 'E-Card downloaded successfully.' });
      toast.success('E-Card downloaded successfully!');
    } catch (err) {
      console.error('Download error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to download E-Card.';
      setStatusMessage({ type: 'error', text: msg });
      toast.error(msg);
    } finally {
      if (objectUrl) {
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      }
      setIsDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!cardData) return;

    try {
      setIsSending(true);
      setStatusMessage(null);

      const cardBlob = await generateCardBlob();
      const formData = new FormData();
      const cleanStall = (cardData.stallNumber || 'stall').replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanReg = cardData.bookingRegistrationNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
      formData.append('cardImage', cardBlob, `StallCard_${cleanStall}_${cleanReg}.png`);

      const token = getExhibitorToken();
      const response = await fetch(`${appConfig.apiBaseUrl}/exhibitor/stall-card/send-email`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to send E-Card email.');
      }

      const data = await response.json().catch(() => null);
      const recipient = data?.recipient || cardData.email;
      const successMsg = `E-Card sent successfully to ${recipient}!`;
      setStatusMessage({ type: 'success', text: successMsg });
      toast.success(successMsg);
    } catch (err) {
      console.error('Email error:', err);
      const msg = err instanceof Error ? err.message : 'Could not send E-Card email.';
      setStatusMessage({ type: 'error', text: msg });
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCompanyLogo(reader.result as string);
        toast.success('Custom company logo applied to E-Card preview!');
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <LoadingState label="Loading your official E-Card..." />;
  if (error || !cardData) return <ErrorState error={new Error(error || 'No E-Card data available.')} retry={loadData} />;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0B3B75] uppercase tracking-wider">
              Exhibitor Portal
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={12} /> Official Stall Pass
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            E-Card Download
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Download or email your high-resolution event identification card & stall pass.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading || isSending}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0B3B75] hover:bg-[#082a54] active:scale-95 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-900/20 transition disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating PNG...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download E-Card
              </>
            )}
          </button>

          {cardData.email && (
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={isSending || isDownloading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-xs transition disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 text-blue-600" />
                  Send to Email
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-700 shadow-xs transition"
            title="Print E-Card"
          >
            <Printer className="h-4 w-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMessage && (
        <div
          className={`flex items-center gap-3 rounded-xl p-4 text-sm font-medium border ${statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
            }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          )}
          <span className="flex-1">{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Info Highlight */}
      <div className="rounded-2xl bg-blue-50/70 border border-blue-100 p-4 text-xs text-blue-900 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <p className="font-bold">Ready for Digital Pass & High-Resolution Print</p>
          <p className="text-blue-700/90 leading-relaxed">
            This card is formatted in high resolution (2x Retina). You can keep this image on your phone to present at the entrance, print it on photo paper or card stock for stall fascia badges, or share it with team members attending the stall.
          </p>
        </div>
      </div>

      {/* Optional Logo Customizer */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-slate-500" />
          <div>
            <p className="text-xs font-bold text-slate-800">Company Logo on E-Card</p>
            <p className="text-[11px] text-slate-400">
              {companyLogo ? 'Custom logo applied' : 'No logo uploaded yet. You can upload one below.'}
            </p>
          </div>
        </div>
        <div>
          <input
            type="file"
            ref={logoInputRef}
            onChange={handleLogoUpload}
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition"
          >
            <Upload className="h-3.5 w-3.5" />
            {companyLogo ? 'Change Logo' : 'Upload Logo'}
          </button>
        </div>
      </div>

      {/* Printable E-Card Container */}
      <div className="flex justify-center p-2 sm:p-4 bg-slate-100/70 rounded-3xl border border-slate-200/70 shadow-inner">
        <div
          ref={cardRef}
          className="w-full max-w-2xl bg-white p-1 rounded-2xl shadow-xl transition-all"
          style={{
            boxSizing: 'border-box',
            padding: '4px',
          }}
        >
          <div className="w-full overflow-hidden rounded-xl border-2 border-blue-800 bg-white">
            {/* Stall Number & Fascia Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-blue-200">
              <div className="flex min-h-[90px] sm:min-h-[120px] flex-col items-center justify-center p-3 sm:p-5 text-center bg-blue-50/20">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-slate-500">
                  Stall Number
                </p>
                <p className="mt-1 sm:mt-2 break-words text-xl sm:text-3xl font-black text-blue-900">
                  {cardData.stallNumber || 'Allocation in Progress'}
                </p>
              </div>

              <div className="border-t sm:border-t-0 sm:border-l border-blue-200 flex min-h-[90px] sm:min-h-[120px] flex-col items-center justify-center p-3 sm:p-5 text-center bg-blue-50/20">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-slate-500">
                  Company Name
                </p>
                <p className="mt-1 sm:mt-2 break-words text-base sm:text-xl font-extrabold text-blue-900">
                  {cardData.legalName || cardData.companyName}
                </p>
                {cardData.fasciaName && cardData.fasciaName.toLowerCase() !== (cardData.legalName || cardData.companyName).toLowerCase() && (
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                    Fascia: {cardData.fasciaName}
                  </p>
                )}
              </div>
            </div>

            {/* Company Logo Section */}
            <div
              className="flex min-h-[130px] sm:min-h-[160px] w-full items-center justify-center border-b border-blue-200 p-4 sm:p-6"
              style={{ width: '100%' }}
            >
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt="Company logo"
                  className="block h-20 sm:h-28 w-full max-w-[240px] sm:max-w-[280px] object-contain object-center"
                  style={{
                    display: 'block',
                    width: '100%',
                    maxWidth: '280px',
                    maxHeight: '112px',
                    margin: '0 auto',
                    objectFit: 'contain',
                    objectPosition: 'center',
                  }}
                />
              ) : (
                <div className="text-center py-4">
                  <Building2 className="mx-auto h-8 w-8 text-slate-300 mb-1" />
                  <p className="text-xs sm:text-sm font-bold text-slate-500">
                    {cardData.legalName || cardData.companyName}
                  </p>
                  <p className="mt-0.5 text-[10px] sm:text-xs text-slate-400">
                    Company Logo
                  </p>
                </div>
              )}
            </div>

            {/* Product Details Section */}
            <div className="border-b border-blue-200 bg-blue-50/30 p-4 sm:p-6">
              <h3 className="text-center text-sm sm:text-base font-extrabold text-blue-900 uppercase tracking-wide">
                Product Details
              </h3>

              <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
                <div className="rounded-lg bg-white p-2.5 border border-blue-100/70 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Industry Category
                  </p>
                  <p className="mt-1 font-bold text-xs sm:text-sm text-slate-800 truncate">
                    {cardData.industryCategory || '-'}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-2.5 border border-blue-100/70 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Product Keywords
                  </p>
                  <p className="mt-1 font-bold text-xs sm:text-sm text-slate-800 truncate">
                    {cardData.productKeywords || '-'}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-2.5 border border-blue-100/70 shadow-2xs sm:col-span-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Manufacturing / Description
                  </p>
                  <p className="mt-1 font-bold text-xs sm:text-sm text-slate-800 truncate">
                    {cardData.manufacturing || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Exhibitor Details Section */}
            <div className="p-4 sm:p-6">
              <h3 className="text-center text-sm sm:text-base font-extrabold text-blue-900 uppercase tracking-wide">
                Exhibitor Details
              </h3>

              <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Company Name
                  </p>
                  <p className="mt-1 font-bold text-xs sm:text-sm text-slate-900">
                    {cardData.legalName || cardData.companyName}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Contact Person
                  </p>
                  <p className="mt-1 font-bold text-xs sm:text-sm text-slate-900">
                    {cardData.contactPerson || '-'}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Email
                  </p>
                  <p className="mt-1 font-bold text-xs sm:text-sm text-slate-900 break-all">
                    {cardData.email || '-'}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Mobile
                  </p>
                  <p className="mt-1 font-bold text-xs sm:text-sm text-slate-900">
                    {cardData.mobile || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Venue & Date Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border-y border-blue-200 bg-slate-50">
              <div className="flex min-h-[60px] sm:min-h-[75px] items-center justify-center p-3 sm:p-4 text-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Venue</p>
                  <p className="font-extrabold text-xs sm:text-sm text-slate-800 mt-0.5">Hotel Hills, Hosur</p>
                </div>
              </div>
              <div className="flex min-h-[60px] sm:min-h-[75px] items-center justify-center border-t sm:border-t-0 sm:border-l border-blue-200 p-3 sm:p-4 text-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</p>
                  <p className="font-extrabold text-xs sm:text-sm text-slate-800 mt-0.5">18 & 19 September 2026</p>
                </div>
              </div>
            </div>

            {/* Brand Logos Footer */}
            <div className="flex flex-col sm:flex-row min-h-[120px] sm:min-h-[140px] w-full bg-white">
              <div className="flex w-full sm:w-1/2 items-center justify-center p-4 sm:p-5 border-b sm:border-b-0 border-blue-200">
                <img
                  src={brandAsset('msme-sangamam-logo.png')}
                  alt="MSME Sangamam"
                  className="block h-16 sm:h-20 w-full max-w-[200px] sm:max-w-[240px] object-contain object-center"
                />
              </div>

              <div className="flex w-full sm:w-1/2 items-center justify-center sm:border-l border-blue-200 p-4 sm:p-5">
                <img
                  src={brandAsset('lub-logo.jpg')}
                  alt="Laghu Udyog Bharati Tamil Nadu"
                  className="block h-16 sm:h-20 w-full max-w-[160px] sm:max-w-[200px] object-contain object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Download CTA Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Download Stall Card Image</h4>
            <p className="text-xs text-slate-500">Instant PNG image export to your computer or phone</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B3B75] hover:bg-[#082a54] px-6 py-2.5 text-sm font-bold text-white shadow-md transition"
        >
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download PNG
        </button>
      </div>
    </div>
  );
}

export default ExhibitorECardPage;
