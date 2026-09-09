import { useEffect, useState, useRef } from 'react';
import {
    Download,
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { apiClient } from '../../../data/api/apiClient';

function brandAsset(fileName: string) {
    return `${import.meta.env.BASE_URL}brand/${fileName}`;
}

type VipPassDetails = {
    id: string;
    registrationNumber: string;
    name: string;
    organization?: string;
    designation?: string;
    email?: string;
    mobile?: string;
    city?: string;
};

/*
 * IMPORTANT
 * Keep this same size for:
 * - browser card
 * - html2canvas
 * - downloaded image
 */
const CARD_WIDTH = 350;
const CARD_HEIGHT = 550;

export function VipVerificationPage() {
    const { registrationNumber } =
        useParams<{ registrationNumber: string }>();

    const [searchParams] = useSearchParams();

    const tenantId =
        searchParams.get('tenantId') ||
        '11111111-1111-1111-1111-111111111111';

    const [vip, setVip] = useState<VipPassDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [downloadingFront, setDownloadingFront] = useState(false);
    const [downloadingBack, setDownloadingBack] = useState(false);

    const frontPassRef = useRef<HTMLDivElement>(null);
    const backPassRef = useRef<HTMLDivElement>(null);

    const navigate = useNavigate();

    /* =========================================================
       FETCH VIP DETAILS
    ========================================================= */

    useEffect(() => {
        if (!registrationNumber) {
            setError('Registration number is missing.');
            setLoading(false);
            return;
        }

        setLoading(true);

        apiClient
            .get<VipPassDetails>(
                `/vips/verify/${encodeURIComponent(
                    registrationNumber
                )}?tenantId=${tenantId}`
            )
            .then((data) => {
                setVip(data);
                setError('');
            })
            .catch(() => {
                setError(
                    'Invalid or expired VIP pass. Registration details could not be found.'
                );
            })
            .finally(() => {
                setLoading(false);
            });
    }, [registrationNumber, tenantId]);

    /* =========================================================
       WAIT FOR IMAGES
    ========================================================= */

    const waitForImages = async (element: HTMLElement) => {
        const images = Array.from(
            element.querySelectorAll('img')
        ) as HTMLImageElement[];

        await Promise.all(
            images.map(
                (img) =>
                    new Promise<void>((resolve) => {
                        if (img.complete) {
                            resolve();
                            return;
                        }

                        img.onload = () => resolve();
                        img.onerror = () => resolve();
                    })
            )
        );
    };

    /* =========================================================
       DOWNLOAD CARD

       IMPORTANT:
       - Same 350 x 550 size
       - No clip-path dependency
       - PNG
       - 4x quality
       - Images wait
       - No layout shifting
       - Decorative backgrounds remain
    ========================================================= */

    const downloadBadge = async (
        elementRef: React.RefObject<HTMLDivElement | null>,
        side: 'Front' | 'Back'
    ) => {
        if (!elementRef.current || !vip) return;

        if (side === 'Front') {
            setDownloadingFront(true);
        } else {
            setDownloadingBack(true);
        }

        try {
            const element = elementRef.current;

            /*
             * Make sure logos are loaded before capture.
             */
            await waitForImages(element);

            /*
             * Small delay for:
             * - QR
             * - fonts
             * - gradients
             * - images
             */
            await new Promise((resolve) =>
                setTimeout(resolve, 250)
            );

            const canvas = await html2canvas(element, {
                width: CARD_WIDTH,
                height: CARD_HEIGHT,

                /*
                 * High quality export
                 */
                scale: 4,

                useCORS: true,
                allowTaint: false,

                backgroundColor: '#ffffff',

                scrollX: 0,
                scrollY: 0,

                logging: false,

                imageTimeout: 15000,

                /*
                 * IMPORTANT:
                 * We don't use foreignObjectRendering.
                 * Normal CSS gradients / transforms render
                 * more consistently with html2canvas.
                 */
                foreignObjectRendering: false,

                onclone: (clonedDocument) => {
                    const clonedCard =
                        clonedDocument.querySelector(
                            `[data-pass-side="${side}"]`
                        ) as HTMLElement | null;

                    if (!clonedCard) return;

                    /*
                     * FORCE EXACT CARD SIZE
                     */
                    clonedCard.style.width = `${CARD_WIDTH}px`;
                    clonedCard.style.height = `${CARD_HEIGHT}px`;

                    clonedCard.style.minWidth = `${CARD_WIDTH}px`;
                    clonedCard.style.maxWidth = `${CARD_WIDTH}px`;

                    clonedCard.style.minHeight = `${CARD_HEIGHT}px`;
                    clonedCard.style.maxHeight = `${CARD_HEIGHT}px`;

                    /*
                     * Prevent layout shift.
                     */
                    clonedCard.style.transform = 'none';
                    clonedCard.style.margin = '0';

                    /*
                     * Don't export browser shadow.
                     */
                    clonedCard.style.boxShadow = 'none';

                    /*
                     * Keep all backgrounds,
                     * gradients and decorative elements.
                     *
                     * DO NOT set:
                     * background = none
                     * backgroundImage = none
                     */

                    clonedCard
                        .querySelectorAll('img')
                        .forEach((img) => {
                            img.style.objectFit = 'contain';
                            img.style.maxWidth = '100%';
                        });
                },
            });

            /*
             * PNG gives much sharper:
             * - text
             * - logos
             * - QR
             */
            const image = canvas.toDataURL('image/png');

            const link = document.createElement('a');

            link.href = image;

            link.download = `VIP_Pass_${side}_${vip.registrationNumber}.png`;

            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);
        } catch (err) {
            console.error(
                `Failed to generate ${side} VIP Pass:`,
                err
            );
        } finally {
            if (side === 'Front') {
                setDownloadingFront(false);
            } else {
                setDownloadingBack(false);
            }
        }
    };

    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />

                    <p className="mt-4 font-bold text-slate-700">
                        Verifying VIP Pass...
                    </p>
                </div>
            </div>
        );
    }

    /* =========================================================
       ERROR
    ========================================================= */

    if (error || !vip) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
                <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                        <AlertTriangle className="h-8 w-8" />
                    </div>

                    <h2 className="mt-4 text-xl font-black text-slate-900">
                        VIP Verification Failed
                    </h2>

                    <p className="mt-2 text-sm text-slate-600">
                        {error}
                    </p>

                    <button
                        onClick={() => navigate('/')}
                        className="mt-6 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Return to Homepage
                    </button>
                </div>
            </div>
        );
    }

    const pageQrUrl = window.location.href;

    const venueLocationMapsUrl =
        'https://maps.google.com/?q=Hotel+Hills+Hosur+Tamil+Nadu';

    return (
        <main className="min-h-screen bg-slate-100 px-4 py-8">
            {/* =====================================================
                ACTION BAR
            ===================================================== */}

            <div className="mx-auto mb-6 flex w-full max-w-4xl items-center justify-between gap-3">
                <button
                    onClick={() => navigate('/')}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                    <ArrowLeft className="h-4 w-4" />

                    Back
                </button>

                <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                        onClick={() =>
                            downloadBadge(
                                frontPassRef,
                                'Front'
                            )
                        }
                        disabled={downloadingFront}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Download className="h-4 w-4" />

                        {downloadingFront
                            ? 'Saving...'
                            : 'Download Front'}
                    </button>

                    <button
                        onClick={() =>
                            downloadBadge(
                                backPassRef,
                                'Back'
                            )
                        }
                        disabled={downloadingBack}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Download className="h-4 w-4" />

                        {downloadingBack
                            ? 'Saving...'
                            : 'Download Back'}
                    </button>
                </div>
            </div>

            {/* =====================================================
                VERIFIED STATUS
            ===================================================== */}

            <div
                className="mx-auto mb-6 flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-700"
                style={{
                    maxWidth: CARD_WIDTH,
                }}
            >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />

                <span>Verified VIP Delegate Pass</span>
            </div>

            {/* =====================================================
                CARD CONTAINER
            ===================================================== */}

            <div className="flex flex-wrap items-start justify-center gap-8">
                {/* =================================================
                    FRONT CARD
                ================================================= */}

                <div
                    ref={frontPassRef}
                    data-pass-side="Front"
                    className="relative box-border flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                    style={{
                        width: CARD_WIDTH,
                        height: CARD_HEIGHT,
                    }}
                >
                    {/* Lanyard slot */}

                    <div className="absolute left-1/2 top-2 z-30 h-2.5 w-14 -translate-x-1/2 rounded-full bg-slate-200" />

                    {/* =============================================
                        FRONT HEADER
                    ============================================= */}

                    <div className="relative shrink-0 overflow-hidden bg-white px-5 pb-4 pt-7">
                        {/* =========================================
                            DECORATIVE DESIGN

                            NO CLIP-PATH.
                            Uses rotated rectangles so
                            html2canvas captures them.
                        ========================================= */}

                        <div
                            className="pointer-events-none absolute -right-10 -top-9 h-28 w-40 rotate-[18deg] bg-gradient-to-br from-orange-400 via-red-500 to-red-600"
                            aria-hidden="true"
                        />

                        <div
                            className="pointer-events-none absolute right-7 -top-8 h-24 w-16 rotate-[18deg] bg-gradient-to-br from-amber-300 to-orange-500 opacity-90"
                            aria-hidden="true"
                        />

                        <div
                            className="pointer-events-none absolute -right-12 top-14 h-8 w-28 rotate-[18deg] bg-orange-200/70"
                            aria-hidden="true"
                        />

                        {/* =========================================
                            LOGOS
                        ========================================= */}

                        <div className="relative z-10 flex h-[52px] items-center justify-between gap-3">
                            {/* LUB */}

                            <div className="flex h-[48px] w-[82px] shrink-0 items-center justify-center rounded-lg bg-white/95">
                                <img
                                    src={brandAsset(
                                        'lub-logo.jpg'
                                    )}
                                    alt="Laghu Udyog Bharati"
                                    crossOrigin="anonymous"
                                    className="h-[46px] w-full object-contain"
                                />
                            </div>

                            {/* MSME CONNECT */}

                            <div className="flex h-[48px] min-w-0 flex-1 items-center justify-end rounded-lg bg-white/95 px-1">
                                <img
                                    src={brandAsset(
                                        'msme-sangamam-logo.png'
                                    )}
                                    alt="MSME Connect"
                                    crossOrigin="anonymous"
                                    className="h-[47px] max-w-[175px] object-contain"
                                />
                            </div>
                        </div>

                        {/* =========================================
                            EVENT TEXT
                        ========================================= */}

                        <div className="relative z-10 mt-3">
                            <h3 className="text-[15px] font-black leading-tight tracking-tight text-slate-900">
                                LUB MSME Connect Expo 2026
                            </h3>

                            <p className="mt-1 text-[12px] font-extrabold text-orange-600">
                                18 &amp; 19 September 2026
                            </p>

                            <p className="text-[10px] font-semibold text-slate-500">
                                Hotel Hills, Hosur, Tamil Nadu
                            </p>
                        </div>

                        {/* Orange line */}

                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-500 to-red-600" />
                    </div>

                    {/* =============================================
                        FRONT PERSON AREA
                    ============================================= */}

                    <div className="flex min-h-0 flex-1 flex-col items-center justify-center border-y border-slate-100 px-6 py-4 text-center">
                        {/* VIP */}

                        <span className="mb-2 rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
                            VIP Delegate
                        </span>

                        {/* NAME */}

                        <h1 className="max-w-[300px] break-words text-[25px] font-black leading-[1.06] tracking-tight text-slate-900">
                            {vip.name}
                        </h1>

                        {/* DESIGNATION */}

                        {vip.designation && (
                            <p className="mt-2 max-w-[285px] break-words text-[14px] font-bold leading-tight text-slate-600">
                                {vip.designation}
                            </p>
                        )}

                        {/* ORGANIZATION */}

                        {vip.organization && (
                            <p className="mt-1.5 max-w-[295px] break-words text-[16px] font-black leading-tight text-orange-700">
                                {vip.organization}
                            </p>
                        )}

                        {/* QR */}

                        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                            <QRCode
                                value={pageQrUrl}
                                size={120}
                                level="M"
                            />
                        </div>

                        {/* REGISTRATION */}

                        <p className="mt-2 rounded-md bg-slate-50 px-3 py-1 font-mono text-[11px] font-bold tracking-[0.16em] text-slate-500">
                            {vip.registrationNumber}
                        </p>
                    </div>

                    {/* =============================================
                        FRONT FOOTER
                    ============================================= */}

                    <div className="shrink-0 bg-gradient-to-r from-red-600 to-orange-600 py-3.5 text-center">
                        <p className="mb-0.5 text-[8px] font-bold uppercase tracking-[0.2em] text-orange-100">
                            Official Delegate Pass
                        </p>

                        <h2 className="text-2xl font-black uppercase leading-none tracking-[0.3em] text-white">
                            VIP
                        </h2>
                    </div>
                </div>

                {/* =================================================
                    BACK CARD
                ================================================= */}

                <div
                    ref={backPassRef}
                    data-pass-side="Back"
                    className="relative box-border flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                    style={{
                        width: CARD_WIDTH,
                        height: CARD_HEIGHT,
                    }}
                >
                    {/* Lanyard slot */}

                    <div className="absolute left-1/2 top-2 z-30 h-2.5 w-14 -translate-x-1/2 rounded-full bg-orange-200" />

                    {/* =============================================
                        BACK HEADER
                    ============================================= */}
<div className="relative h-[76px] shrink-0 overflow-hidden bg-gradient-to-r from-red-600 via-orange-500 to-orange-500">
                        {/* Orange background shapes */}
                        <div
                            className="pointer-events-none absolute -left-12 -top-10 h-32 w-52 rotate-[-10deg] bg-gradient-to-r from-red-600 to-orange-500"
                            aria-hidden="true"
                        />
                        <div
                            className="pointer-events-none absolute -right-10 -top-10 h-32 w-36 rotate-[14deg] bg-gradient-to-l from-orange-400 to-orange-500"
                            aria-hidden="true"
                        />
                        <div
                            className="pointer-events-none absolute left-24 top-6 h-16 w-16 rotate-[-10deg] rounded-full bg-orange-200/40 blur-md"
                            aria-hidden="true"
                        />
                    </div>

                    {/* =============================================
                        BACK BODY
                    ============================================= */}

                    <div className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden px-5 pb-3 pt-4 text-slate-700">
                        <div className="space-y-3.5">
                            {/* DATES */}

                            <div>
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-red-600" />

                                    <span className="text-[13px] font-extrabold leading-none text-slate-900">
                                        Dates &amp; Timing
                                    </span>
                                </div>

                                <div className="mt-1.5 space-y-1 pl-5 text-[11px] font-semibold leading-tight text-slate-600">
                                    <p>
                                        18 September 2026 :
                                        09:30 am to 06:00 pm
                                    </p>

                                    <p>
                                        19 September 2026 :
                                        09:30 am to 05:00 pm
                                    </p>
                                </div>
                            </div>

                            {/* VENUE */}

                            <div>
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-red-600" />

                                    <span className="text-[13px] font-extrabold leading-none text-slate-900">
                                        Venue
                                    </span>
                                </div>

                                <p className="mt-1.5 pl-5 text-[11px] font-semibold leading-tight text-slate-600">
                                    Hotel Hills, Hosur, Tamil
                                    Nadu, India.
                                </p>
                            </div>

                            {/* EVENT INFORMATION */}

                            <div>
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-red-600" />

                                    <span className="text-[13px] font-extrabold leading-none text-slate-900">
                                        Event Highlights
                                    </span>
                                </div>

                                <p className="mt-1.5 pl-5 text-[11px] font-semibold leading-relaxed text-slate-600">
                                    Connect with corporate buyers,
                                    industry leaders, government
                                    bodies, and manufacturing
                                    partners under one platform.
                                </p>
                            </div>

                            {/* VIP ACCESS */}

                            <div className="border-t border-slate-100 pt-3">
                                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.15em] text-orange-700">
                                    VIP Access
                                </p>

                                <div className="space-y-2">
                                    <div className="flex items-start gap-1.5">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

                                        <span className="text-[11px] font-semibold leading-tight text-slate-800">
                                            Express entry badge for
                                            VIP lounge access and
                                            concurrent B2B
                                            buyer-seller meetings.
                                        </span>
                                    </div>

                                    <div className="flex items-start gap-1.5">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

                                        <span className="text-[11px] font-semibold leading-tight text-slate-800">
                                            Non-transferable and
                                            valid for 18 &amp; 19
                                            September 2026.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* =============================================
                            BACK BOTTOM AREA
                        ============================================= */}

                        <div className="mt-3 flex items-end justify-between border-t border-slate-200 pt-3">
                            {/* LUB */}

                            <div className="flex min-w-0 items-center gap-2 pb-1">
                                <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg bg-white">
                                    <img
                                        src={brandAsset(
                                            'lub-logo.jpg'
                                        )}
                                        alt="Laghu Udyog Bharati"
                                        crossOrigin="anonymous"
                                        className="h-9 w-full object-contain"
                                    />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-[11px] font-extrabold leading-tight text-slate-900">
                                        LUB MSME Sangamam Connect Expo
                                    </p>

                                    <p className="mt-0.5 text-[9px] font-medium leading-tight text-slate-500">
                                        Hosur MSME Conclave
                                    </p>
                                </div>
                            </div>

                            {/* VENUE QR */}

                            <div className="flex shrink-0 flex-col items-center gap-1.5">
                                <span className="rounded-full bg-red-600 px-2.5 py-1 text-[8px] font-extrabold uppercase leading-none tracking-wider text-white">
                                    Venue Location
                                </span>

                                <div className="rounded-lg border border-slate-300 bg-white p-1.5 shadow-sm">
                                    <QRCode
                                        value={
                                            venueLocationMapsUrl
                                        }
                                        size={64}
                                        level="M"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* =============================================
                        BACK FOOTER
                    ============================================= */}

                    <div className="shrink-0 bg-gradient-to-r from-red-600 to-orange-600 px-4 py-2.5 text-center">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white">
                            Official VIP Delegate Pass
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}