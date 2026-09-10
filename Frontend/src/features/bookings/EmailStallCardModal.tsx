import { useEffect, useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { apiClient } from "../../data/api/apiClient";
import { ModalPortal } from "../../shared/components/ModalPortal";

export type EmailStallCardBooking = {
    id: string;
    bookingRegistrationNumber: string;
    stallNumber: string | null;
    fasciaName: string | null;
    companyName: string;
    contactPerson: string;
    email: string;
    mobile: string;
    industryCategory?: string | null;
    productKeywords?: string | null;
    companyLogo?: string | null;
    manufacturing?: string | null;
};

type Props = {
    booking: EmailStallCardBooking;
    onClose: () => void;
    disableSendEmail?: boolean;
};

type SendEmailResponse = {
    message: string;
    recipient: string;
    attachmentFileName: string;
};

function brandAsset(fileName: string) {
    return `${import.meta.env.BASE_URL}brand/${fileName}`;
}

async function waitForCardImages(card: HTMLElement) {
    const images = Array.from(card.querySelectorAll("img"));

    await Promise.all(
        images.map(async (image) => {
            try {
                if (typeof image.decode === "function") {
                    await image.decode();
                } else if (!image.complete) {
                    await new Promise<void>((resolve, reject) => {
                        image.addEventListener("load", () => resolve(), { once: true });
                        image.addEventListener(
                            "error",
                            () =>
                                reject(
                                    new Error(
                                        `Card image failed to load: ${image.currentSrc || image.src}`
                                    )
                                ),
                            { once: true }
                        );
                    });
                }
            } catch {
                throw new Error(
                    `Card image failed to load: ${image.currentSrc || image.src}`
                );
            }

            if (!image.complete || image.naturalWidth === 0) {
                throw new Error(
                    `Card image is unavailable: ${image.currentSrc || image.src}`
                );
            }
        })
    );
}

export function EmailStallCardModal({ booking, onClose, disableSendEmail }: Props) {
    const cardRef = useRef<HTMLDivElement>(null);

    const [companyLogo, setCompanyLogo] = useState<string>(
        booking.companyLogo ?? ""
    );
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        setCompanyLogo(booking.companyLogo ?? "");
    }, [booking.id, booking.companyLogo]);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleEscape);
        return () => {
            window.removeEventListener("keydown", handleEscape);
        };
    }, [onClose]);

    const generateCardBlob = async (): Promise<Blob> => {
        const card = cardRef.current;

        if (!card) {
            throw new Error("Stall card preview is unavailable.");
        }

        await waitForCardImages(card);

        if (document.fonts?.ready) {
            await document.fonts.ready;
        }

        const cardBounds = card.getBoundingClientRect();
        const captureWidth = Math.ceil(
            Math.max(cardBounds.width, card.scrollWidth)
        );
        const captureHeight = Math.ceil(
            Math.max(cardBounds.height, card.scrollHeight)
        ) + 8;

        const blob = await toBlob(card, {
            cacheBust: false,
            pixelRatio: 2,
            width: captureWidth,
            height: captureHeight,
            backgroundColor: "#ffffff",
            style: {
                boxSizing: "border-box",
                margin: "0",
            },
        });

        if (!blob) {
            throw new Error("Unable to generate stall card image.");
        }

        return blob;
    };

    const handleDownload = async () => {
        let objectUrl = "";

        try {
            setIsDownloading(true);
            setError("");
            setSuccess("");

            const cardBlob = await generateCardBlob();
            objectUrl = URL.createObjectURL(cardBlob);

            const link = document.createElement("a");
            link.href = objectUrl;
            link.download = `StallCard_${booking.stallNumber ?? "stall"}_${booking.bookingRegistrationNumber}.png`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            setSuccess("Stall card downloaded successfully.");
        } catch (downloadError: unknown) {
            console.error("DOWNLOAD STALL CARD ERROR", downloadError);
            const message =
                downloadError instanceof Error
                    ? downloadError.message
                    : String(downloadError);
            setError(message || "Unable to download stall card.");
        } finally {
            if (objectUrl) {
                window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
            }
            setIsDownloading(false);
        }
    };

    const handleSendEmail = async () => {
        try {
            setIsSending(true);
            setError("");
            setSuccess("");

            const cardBlob = await generateCardBlob();
            const formData = new FormData();

            formData.append(
                "cardImage",
                cardBlob,
                `StallCard_${booking.stallNumber ?? "stall"}_${booking.bookingRegistrationNumber}.png`
            );

            const response = await apiClient.postFormData<SendEmailResponse>(
                `/admin/events/current/bookings/${booking.id}/stall-card/send-email`,
                formData
            );

            setSuccess(
                response.message || `Email sent successfully to ${response.recipient}.`
            );
        } catch (sendError: unknown) {
            console.error("SEND STALL CARD EMAIL ERROR", sendError);
            const message =
                sendError instanceof Error ? sendError.message : String(sendError);
            setError(message || "Unable to send stall card email.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <ModalPortal>
            <div
                className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto"
                onMouseDown={(event) => {
                    if (event.target === event.currentTarget) {
                        onClose();
                    }
                }}
            >
            <div className="flex max-h-[95vh] my-auto w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-blue-600 text-lg sm:text-xl text-white shrink-0">
                            ✉
                        </div>

                        <div>
                            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                                E-Card
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500">
                                Review the exhibitor card before sending.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-slate-200 text-lg sm:text-xl text-slate-500 hover:bg-slate-100"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                {/* Body Content */}
                <div className="overflow-y-auto p-4 sm:p-6">
                    {/* <div className="grid gap-4">
                        <div>
                            <label className="text-xs sm:text-sm font-bold text-slate-700">
                                Send to
                            </label>
                            <input
                                readOnly
                                value={booking.email}
                                className="input mt-1 sm:mt-2 w-full text-xs sm:text-sm"
                            />
                        </div>
                    </div> */}

                    {/* Printable Stall Card Container */}
                    <div
                        ref={cardRef}
                        className="mt-4 sm:mt-5 w-full bg-white p-1"
                        style={{
                            boxSizing: "border-box",
                            padding: "4px",
                        }}
                    >
                        <div className="w-full overflow-hidden rounded-xl sm:rounded-2xl border-2 border-blue-800 bg-white">
                            {/* Stall Number & Company Name */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-blue-200">
                                <CardHeading label="Stall Number" value={booking.stallNumber} />
                                <div className="border-t sm:border-t-0 sm:border-l border-blue-200">
                                    <CardHeading label="Company Name" value={booking.companyName || booking.fasciaName} />
                                </div>
                            </div>

                            {/* Company Logo Section */}
                            <div
                                className="flex min-h-[140px] sm:min-h-[180px] w-full items-center justify-center border-b border-blue-200 p-4 sm:p-6"
                                style={{ width: "100%" }}
                            >
                                {companyLogo ? (
                                    <img
                                        src={companyLogo}
                                        alt="Company logo"
                                        className="block h-20 sm:h-28 w-full max-w-[240px] sm:max-w-[280px] object-contain object-center"
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            maxWidth: "280px",
                                            maxHeight: "112px",
                                            margin: "0 auto",
                                            objectFit: "contain",
                                            objectPosition: "center",
                                        }}
                                    />
                                ) : (
                                    <div className="text-center">
                                        <p className="text-xs sm:text-sm font-bold text-slate-500">
                                            Company Logo
                                        </p>
                                        <p className="mt-1 text-[10px] sm:text-xs text-slate-400">
                                            Logo not uploaded
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Product Details Section */}
                            <div className="border-b border-blue-200 bg-blue-50/30 p-4 sm:p-6">
                                <h3 className="text-center text-base sm:text-lg font-extrabold text-blue-900">
                                    Product Details
                                </h3>

                                <div className="mt-3 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-x-6 sm:gap-y-5">
                                    <CardField
                                        label="Industry Category"
                                        value={booking.industryCategory ?? null}
                                    />
                                    <CardField
                                        label="Product Keywords"
                                        value={booking.productKeywords ?? null}
                                    />
                                    <CardField
                                        label="Manufacturing / Service Description"
                                        value={booking.manufacturing ?? null}
                                    />
                                </div>
                            </div>

                            {/* Exhibitor Details Section */}
                            <div className="p-4 sm:p-6">
                                <h3 className="text-center text-base sm:text-lg font-extrabold text-blue-900">
                                    Exhibitor Details
                                </h3>

                                <div className="mt-3 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-10 sm:gap-y-5">
                                    <CardField label="Company Name" value={booking.companyName} />
                                    <CardField label="Contact Person" value={booking.contactPerson} />
                                    <CardField label="Email" value={booking.email} />
                                    <CardField label="Mobile" value={booking.mobile} />
                                </div>
                            </div>

                            {/* Venue & Date Section */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 border-y border-blue-200 bg-slate-50">
                                <div className="flex min-h-[70px] sm:min-h-[90px] items-center p-4 sm:p-5">
                                    <CardField label="Venue" value="Hotel Hills, Hosur" />
                                </div>
                                <div className="flex min-h-[70px] sm:min-h-[90px] items-center border-t sm:border-t-0 sm:border-l border-blue-200 p-4 sm:p-5">
                                    <CardField label="Date" value="18 & 19 September 2026" />
                                </div>
                            </div>

                            {/* Brand Logos Footer */}
                            <div className="flex flex-col sm:flex-row min-h-[140px] sm:min-h-[160px] w-full bg-white">
                                <div className="flex w-full sm:w-1/2 items-center justify-center p-4 sm:p-6 border-b sm:border-b-0 border-blue-200">
                                    <img
                                        src={brandAsset("msme-sangamam-logo.png")}
                                        alt="MSME Sangamam"
                                        className="block h-20 sm:h-24 w-full max-w-[220px] sm:max-w-[260px] object-contain object-center"
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            maxWidth: "260px",
                                            maxHeight: "96px",
                                            margin: "0 auto",
                                            objectFit: "contain",
                                            objectPosition: "center",
                                        }}
                                    />
                                </div>

                                <div className="flex w-full sm:w-1/2 items-center justify-center sm:border-l border-blue-200 p-4 sm:p-6">
                                    <img
                                        src={brandAsset("lub-logo.jpg")}
                                        alt="Laghu Udyog Bharati Tamil Nadu"
                                        className="block h-20 sm:h-24 w-full max-w-[180px] sm:max-w-[220px] object-contain object-center"
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            maxWidth: "220px",
                                            maxHeight: "96px",
                                            margin: "0 auto",
                                            objectFit: "contain",
                                            objectPosition: "center",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs sm:text-sm font-medium text-red-700">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-xs sm:text-sm font-medium text-green-700">
                            {success}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6 sm:py-4">
                    {/* <p className="text-center sm:text-left text-xs text-slate-500">
                        This card will be attached and sent to the exhibitor&apos;s email address.
                    </p> */}

                    <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2">
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={isDownloading || isSending}
                            className="w-full sm:w-auto rounded-lg border border-blue-300 bg-white px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                        >
                            {isDownloading ? "Downloading..." : "Download Card"}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSending || isDownloading}
                            className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        {!disableSendEmail && (
                            <button
                                type="button"
                                onClick={handleSendEmail}
                                disabled={isSending || isDownloading || !booking.email}
                                className="w-full sm:w-auto rounded-lg bg-blue-600 px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isSending ? "Sending Email..." : "Send Email"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            </div>
        </ModalPortal>
    );
}

function CardHeading({
    label,
    value,
}: {
    label: string;
    value: string | null;
}) {
    return (
        <div className="flex min-h-[90px] sm:min-h-[125px] flex-col items-center justify-center p-3 sm:p-5 text-center">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className="mt-1 sm:mt-3 break-words text-lg sm:text-2xl font-extrabold text-blue-900">
                {value || "-"}
            </p>
        </div>
    );
}

function CardField({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className="mt-0.5 sm:mt-1 break-words text-xs sm:text-sm font-bold text-slate-900">
                {value || "-"}
            </p>
        </div>
    );
}