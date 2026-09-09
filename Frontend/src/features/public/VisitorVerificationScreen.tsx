import { useEffect, useState, useRef } from 'react';
import { Download, CheckCircle2, AlertTriangle, Building2, Mail, Phone, Calendar, MapPin, User, ArrowLeft, QrCode, Users } from 'lucide-react';
import QRCode from 'react-qr-code';
import { apiClient } from '../../data/api/apiClient';
import { BRAND } from '../../config/brand';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { getVisitorProfile } from '../../data/api/visitorApiClient';

function brandAsset(fileName: string) {
    return `${import.meta.env.BASE_URL}brand/${fileName}`;
}

type VisitorDetails = {
    id: string;
    registrationNumber: string;
    legalName: string;
    contactPersonName: string;
    email: string;
    mobile: string;
    designation?: string;
    city?: string;
    district?: string;
};

export function VisitorVerificationPage() {
    const { registrationNumber: paramRegistrationNumber } = useParams<{ registrationNumber: string }>();
    const registrationNumber = paramRegistrationNumber || getVisitorProfile()?.registrationNumber;
    const [searchParams] = useSearchParams();
    const tenantId = searchParams.get('tenantId') || '11111111-1111-1111-1111-111111111111';

    const [visitor, setVisitor] = useState<VisitorDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [downloading, setDownloading] = useState(false);

    const passRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!registrationNumber) {
            setError('Visitor session not found. Please login again.');
            setLoading(false);
            return;
        }

        setLoading(true);
        apiClient
            .get<VisitorDetails>(`/visitors/${encodeURIComponent(registrationNumber)}?tenantId=${tenantId}`)
            .then(data => {
                setVisitor(data);
                setError('');
            })
            .catch(() => {
                setError('Invalid or expired visitor pass. Registration details could not be found.');
            })
            .finally(() => setLoading(false));
    }, [registrationNumber, tenantId]);

    const handleDownloadPdf = async () => {
        if (!passRef.current) return;
        setDownloading(true);

        try {
            const element = passRef.current;

            // Force scroll to top left before capturing to prevent header clipping
            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                scrollX: 0,
                scrollY: -window.scrollY, // Corrects scroll offset
                windowWidth: 1200,
                windowHeight: element.scrollHeight + 100,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.querySelector('[data-pass-card="true"]') as HTMLElement;
                    if (clonedElement) {
                        clonedElement.style.width = '420px';
                        clonedElement.style.maxWidth = '420px';
                        clonedElement.style.margin = '0 auto';
                        clonedElement.style.transform = 'none';
                        clonedElement.style.position = 'relative';
                        clonedElement.style.top = '0';
                    }
                }
            });

            const image = canvas.toDataURL('image/jpeg', 0.98);

            const link = document.createElement('a');
            link.href = image;
            link.download = `VisitorPass_${visitor?.registrationNumber || 'Pass'}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Failed to generate JPG image pass:', err);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    <p className="mt-4 font-bold text-slate-700">Verifying Visitor Pass...</p>
                </div>
            </div>
        );
    }

    if (error || !visitor) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
                <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl border border-slate-200">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                        <AlertTriangle className="h-8 w-8" />
                    </div>
                    <h2 className="mt-4 text-xl font-black text-slate-900">Verification Failed</h2>
                    <p className="mt-2 text-sm text-slate-600">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                    >
                        <ArrowLeft className="h-4 w-4" /> Return to Homepage
                    </button>
                </div>
            </div>
        );
    }

    const pageQrUrl = window.location.href;

    return (
        <main className="min-h-screen bg-slate-100 px-4 py-8 flex flex-col items-center justify-center">
            {/* Action Bar */}
            <div className="mb-6 flex w-full max-w-[420px] items-center justify-between gap-3">
                <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                    <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50"
                >
                    <Download className="h-4 w-4" />
                    {downloading ? 'Generating Pass...' : 'Download Pass Image'}
                </button>
            </div>

            {/* Verification Status Banner */}
            <div className="mb-4 flex w-full max-w-[420px] items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 py-2.5 px-4 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <span>Verified Official Visitor Pass</span>
            </div>

            {/* Printable Pass Badge Card */}
            <div
                ref={passRef}
                data-pass-card="true"
                className="w-[420px] max-w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl box-border"
            >
                {/* Brand Logos Header Section */}
                <div className="flex w-full items-center justify-between bg-white px-6 py-4 border-b border-slate-100 min-h-[90px] box-border">
                    <div className="flex h-14 w-1/2 items-center justify-center pe-2">
                        <img
                            src={brandAsset("msme-sangamam-logo.png")}
                            alt="MSME Sangamam"
                            className="max-h-14 max-w-full object-contain"
                        />
                    </div>
                    <div className="flex h-14 w-1/2 items-center justify-center ps-2">
                        <img
                            src={brandAsset("lub-logo.jpg")}
                            alt="Laghu Udyog Bharati"
                            className="max-h-14 max-w-full object-contain"
                        />
                    </div>
                </div>

                {/* Event Name & Venue Sub-Header */}
                <div className="bg-orange-500 p-6 text-white text-center">
                    <div className="inline-block rounded-full bg-white/20 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white">
                        {BRAND.portalName}
                    </div>
                    <h2 className="mt-2.5 text-lg font-black tracking-tight leading-snug">{BRAND.publicEventName}</h2>

                    {/* Date & Venue details */}
                    <div className="mt-4 flex items-center justify-center gap-4 text-xs font-medium text-orange-50 border-t border-orange-400/50 pt-3">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-white shrink-0" />
                            <span>18 & 19 September 2026</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-white shrink-0" />
                            <span>Hotel Hills, Hosur</span>
                        </div>
                    </div>
                </div>

                {/* Badge Body */}
                <div className="p-6">
                    {/* QR Section */}
                    <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-5 border border-slate-200">
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                            <QRCode
                                value={pageQrUrl}
                                size={140}
                                level="M"
                            />
                        </div>
                        <span className="mt-3.5 font-mono text-sm font-black tracking-wider text-blue-700">
                            {visitor.registrationNumber}
                        </span>
                    </div>

                    {/* Visitor Personal Details (Uniform 4-Row Grid with Perfect Icon Alignments) */}
                    <div className="mt-6 space-y-3.5">
                        {/* Name */}
                        <div className="flex items-center gap-3">
                            <div className="w-5 flex justify-center shrink-0">
                                <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">Visitor Name</p>
                                <p className="text-base font-bold text-slate-900 leading-tight mt-1">{visitor.contactPersonName}</p>
                            </div>
                        </div>

                        {/* Company */}
                        <div className="flex items-center gap-3">
                            <div className="w-5 flex justify-center shrink-0">
                                <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">Company / Entity</p>
                                <p className="text-sm font-bold text-slate-800 leading-tight mt-1">{visitor.legalName}</p>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-3.5 space-y-3">
                            {/* Mobile */}
                            <div className="flex items-center gap-3">
                                <div className="w-5 flex justify-center shrink-0">
                                    <Phone className="h-4 w-4 text-slate-400" />
                                </div>
                                <span className="text-xs font-semibold text-slate-700">{visitor.mobile}</span>
                            </div>

                            {/* Email */}
                            <div className="flex items-center gap-3">
                                <div className="w-5 flex justify-center shrink-0">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                </div>
                                <span className="text-xs font-semibold text-slate-700 break-all" title={visitor.email}>
                                    {visitor.email}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Entry Gate Instructions */}
                    <div className="mt-6 rounded-xl bg-slate-100 p-3 text-center text-[11px] font-medium text-slate-500 leading-normal">
                        Please display this pass at the venue entry gate for barcode scanning.
                    </div>
                </div>

                <div className="bg-blue-600 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-white">
                    MSME Sangamam Connect • Visitor Entry Pass
                </div>
            </div>
        </main>
    );
}