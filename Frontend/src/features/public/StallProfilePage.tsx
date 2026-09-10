import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Phone,
  Mail,
  Globe,
  MapPin,
  Check,
  ArrowLeft,
  Building2,
  Loader2,
  X,
  Eye,
} from 'lucide-react';

import { apiClient, ApiError } from '../../data/api/apiClient';
import { BRAND } from '../../config/brand';

function brandAsset(fileName: string) {
  return `${import.meta.env.BASE_URL}brand/${fileName}`;
}

type CompanyProfile = {
  registrationNumber: string;
  companyName: string;
  legalName: string;
  tradeName?: string | null;
  fasciaName?: string | null;
  stallNumber?: string | null;
  industryCategory?: string | null;
  businessType?: string | null;
  productServiceDescription?: string | null;
  contactPersonName?: string | null;
  contactPersonDesignation?: string | null;
  mobile?: string | null;
  email?: string | null;
  website?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  companyLogo?: string | null;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export interface StallProfileProps {
  registrationNumber?: string;
  isModal?: boolean;
  onClose?: () => void;
  isPreview?: boolean;
}

export function StallProfilePage({
  registrationNumber: propRegNumber,
  isModal = false,
  onClose,
  isPreview = false,
}: StallProfileProps = {}) {
  const params = useParams<{ registrationNumber: string }>();
  const registrationNumber = propRegNumber || params.registrationNumber;

  const navigate = useNavigate();

  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logoError, setLogoError] = useState(false);

  const [showInterestForm, setShowInterestForm] = useState(false);
  const [interestName, setInterestName] = useState('');
  const [interestMobile, setInterestMobile] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [interestSent, setInterestSent] = useState(false);
  const [interestError, setInterestError] = useState('');

  // Lock body scroll while modal is active to eliminate background scroll/overlay visual glitch
  useEffect(() => {
    if (isModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isModal]);

  // =========================
  // LOAD STALL PROFILE
  // =========================
  useEffect(() => {
    setLogoError(false);
    if (!registrationNumber) {
      setError('This QR code is missing a stall reference.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    apiClient
      .get<CompanyProfile>(
        `/public/stalls/${encodeURIComponent(registrationNumber)}`
      )
      .then((data) => {
        setCompany(data);
        setError('');
      })
      .catch(() => {
        setCompany(null);
        setError('This stall QR code could not be verified.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [registrationNumber]);

  // =========================
  // SUBMIT INTEREST
  // =========================
  const submitInterest = async () => {
    if (!registrationNumber) {
      return;
    }

    setSubmitting(true);
    setInterestError('');

    try {
      await apiClient.post(
        `/public/stalls/${encodeURIComponent(
          registrationNumber
        )}/interest`,
        {
          visitorName: interestName.trim() || undefined,
          visitorMobile: interestMobile.trim() || undefined,
        }
      );

      setInterestSent(true);
      setShowInterestForm(false);
      setInterestName('');
      setInterestMobile('');
    } catch (err) {
      setInterestError(
        err instanceof ApiError
          ? err.message
          : 'Could not send your interest. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const closeInterestForm = () => {
    setShowInterestForm(false);
    setInterestError('');
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    const loadingBlock = (
      <div className="text-center py-12">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#0B3B75]" />

        <p className="mt-4 text-sm font-semibold text-gray-600">
          Loading stall details…
        </p>
      </div>
    );

    if (isModal) {
      const modalLoading = (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <div
            className="relative w-full max-w-[360px] rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>
            {loadingBlock}
          </div>
        </div>
      );
      return typeof document !== 'undefined'
        ? createPortal(modalLoading, document.body)
        : modalLoading;
    }

    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-white px-4">
        {loadingBlock}
      </div>
    );
  }

  // =========================
  // NOT FOUND / ERROR
  // =========================
  if (error || !company) {
    const errorBlock = (
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#0B3B75]/10">
          <Building2 className="h-7 w-7 text-[#0B3B75]" />
        </div>

        <h2 className="text-lg font-semibold text-gray-900">
          Stall Not Found
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          {error || "Sorry, we couldn't find this stall's profile."}
        </p>

        <button
          type="button"
          onClick={isModal ? onClose : () => navigate('/')}
          className="
            mt-5
            rounded-xl
            bg-[#0B3B75]
            px-5
            py-2.5
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-[#0B3B75]/90
          "
        >
          {isModal ? 'Close' : 'Go Back'}
        </button>
      </div>
    );

    if (isModal) {
      const modalError = (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <div
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            {errorBlock}
          </div>
        </div>
      );
      return typeof document !== 'undefined'
        ? createPortal(modalError, document.body)
        : modalError;
    }

    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-white px-4">
        {errorBlock}
      </div>
    );
  }

  // =========================
  // DERIVED DATA
  // =========================
  const companyDisplayName = company.legalName || company.companyName;
  const brandDisplayName = company.tradeName || company.fasciaName;

  const tagline = [
    company.industryCategory,
    company.businessType,
  ]
    .filter(Boolean)
    .join(' • ');

  const locationLine = [
    company.city,
    company.district,
    company.state,
  ]
    .filter(Boolean)
    .join(', ');

  const contactLinks = [
    company.website && {
      icon: Globe,
      label: 'Website',
      href: company.website.startsWith('http')
        ? company.website
        : `https://${company.website}`,
      external: true,
    },

    company.mobile && {
      icon: Phone,
      label: 'Call Us',
      href: `tel:${company.mobile}`,
      external: false,
    },

    company.email && {
      icon: Mail,
      label: 'Email',
      href: `mailto:${company.email}`,
      external: false,
    },
  ].filter(Boolean) as {
    icon: typeof Phone;
    label: string;
    href: string;
    external: boolean;
  }[];

  // =========================
  // MAIN CARD CONTENT
  // =========================
  const cardContent = (
    <div className={`w-full ${isModal ? 'max-w-full' : 'max-w-[360px]'} mx-auto`}>
      {/* Brand header */}
      <div
        className={`${isModal ? 'mb-2.5 gap-4' : 'mb-5 gap-5 sm:mb-6 sm:gap-7'
          } flex items-center justify-center`}
      >
        <img
          src={brandAsset('msme-sangamam-logo.png')}
          alt={BRAND.eventName}
          className={`${isModal ? 'h-7 sm:h-8' : 'h-11 xs:h-13 sm:h-16'
            } object-contain`}
        />
        <div className={`${isModal ? 'h-5' : 'h-8 sm:h-9'} w-px bg-slate-300`} />
        <img
          src={brandAsset('lub-logo.jpg')}
          alt="Laghu Udyog Bharati"
          className={`${isModal ? 'h-7 sm:h-8' : 'h-11 xs:h-13 sm:h-16'
            } object-contain`}
        />
      </div>

      {/* =========================
          STALL CARD
      ========================== */}
      <div
        className="
          overflow-hidden
          rounded-[20px]
          bg-white
          shadow-[0_12px_36px_rgba(11,59,117,0.14)]
        "
      >
        {/* =========================
            HEADER — comfortable height & logo framing
        ========================== */}
        <div className={`relative ${isModal ? 'h-[62px]' : 'h-[72px]'} bg-[#0B3B75]`}>
          {/* Background Decoration */}
          <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-14 -left-10 h-24 w-24 rounded-full bg-white/10" />

          {/* Company Icon / Logo — object-contain + p-2 prevents stretching/distortion */}
          <div
            className={`
              absolute
              left-1/2
              ${isModal ? 'top-[16px] h-[76px] w-[76px]' : 'top-[20px] h-[88px] w-[88px]'}
              z-10
              flex
              -translate-x-1/2
              items-center
              justify-center
              overflow-hidden
              rounded-[20px]
              border-4
              border-white
              bg-white
              p-2
              shadow-[0_6px_18px_rgba(0,0,0,0.12)]
            `}
          >
            {company.companyLogo && !logoError ? (
              <img
                src={company.companyLogo}
                alt={companyDisplayName}
                onError={() => setLogoError(true)}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className={`${isModal ? 'text-lg' : 'text-xl'} font-black text-[#0B3B75]`}>
                {initials(companyDisplayName)}
              </span>
            )}
          </div>
        </div>

        {/* =========================
            CONTENT — comfortable clearance below logo badge
        ========================== */}
        <div className={`px-4 sm:px-6 pb-4 ${isModal ? 'pt-[36px]' : 'pt-[46px]'}`}>
          {/* Company Name */}
          <div className="text-center">
            <h1 className="text-base font-bold leading-tight tracking-tight text-black">
              {companyDisplayName}
            </h1>

            {brandDisplayName && brandDisplayName.toLowerCase() !== companyDisplayName.toLowerCase() && (
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                Brand: {brandDisplayName}
              </p>
            )}

            {tagline && (
              <p className="mt-1 text-[11px] font-medium leading-snug text-[#0B3B75]">
                {tagline}
              </p>
            )}
          </div>

          {/* Description */}
          {company.productServiceDescription && (
            <p className="mx-auto mt-2 max-w-[360px] text-center text-[11px] leading-4 text-gray-600">
              {company.productServiceDescription}
            </p>
          )}

          {/* Stall / Contact Person Info */}
          {(company.stallNumber ||
            company.fasciaName ||
            company.contactPersonName) && (
              <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                {/* Stall */}
                {(company.stallNumber || company.fasciaName) && (
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <Building2 className="h-3.5 w-3.5" />
                      Stall
                    </span>

                    <span className="text-xs font-bold text-slate-800">
                      {company.stallNumber
                        ? `No. ${company.stallNumber}`
                        : company.fasciaName}
                    </span>
                  </div>
                )}

                {/* Contact Person */}
                {company.contactPersonName && (
                  <div className="px-3 py-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Contact Person
                    </span>

                    <p className="text-xs font-semibold text-slate-800">
                      {company.contactPersonName}
                      {company.contactPersonDesignation && (
                        <span className="text-slate-500">
                          {' '}
                          • {company.contactPersonDesignation}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

          {/* Address Info */}
          {locationLine && (
            <div className="mt-3 rounded-xl border border-slate-200 p-2.5 flex items-start justify-between gap-2">
              <div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-[#0B3B75]" />
                  Location
                </span>
                <p className="mt-0.5 text-xs text-slate-700">
                  {locationLine}
                </p>
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(locationLine)}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-[#0B3B75] hover:underline shrink-0 mt-0.5 bg-blue-50 px-2 py-0.5 rounded-md"
              >
                Map ↗
              </a>
            </div>
          )}

          {/* Quick Contact Buttons */}
          {contactLinks.length > 0 && (
            <div
              className={`mt-3 grid gap-2 ${
                contactLinks.length === 3
                  ? 'grid-cols-3'
                  : contactLinks.length === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-1'
              }`}
            >
              {contactLinks.map((item) =>
                item.external ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50/70
                      px-2.5
                      py-2
                      text-xs
                      font-semibold
                      text-slate-700
                      transition
                      hover:bg-slate-100
                    "
                  >
                    <item.icon className="h-3.5 w-3.5 text-[#0B3B75]" />
                    <span className="truncate">
                      {item.label}
                    </span>
                  </a>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50/70
                      px-2.5
                      py-2
                      text-xs
                      font-semibold
                      text-slate-700
                      transition
                      hover:bg-slate-100
                    "
                  >
                    <item.icon className="h-3.5 w-3.5 text-[#0B3B75]" />
                    <span className="truncate">
                      {item.label}
                    </span>
                  </a>
                )
              )}
            </div>
          )}

          {/* =========================
              ACTION: INTEREST
          ========================== */}
          <div className={`${isModal ? 'mt-3' : 'mt-4'}`}>
            {isPreview ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-2 text-center">
                <p className="text-xs font-bold text-[#0B3B75]">
                  <Eye /> Exhibitor Preview Mode
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  "I'm Interested" button is active only for visiting visitors and other Exhibitors.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowInterestForm(true);
                  setInterestError('');
                }}
                className="
                  flex
                  h-10
                  w-full
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#0B3B75]
                  px-4
                  text-sm
                  font-semibold
                  text-white
                  shadow-[0_6px_16px_rgba(11,59,117,0.22)]
                  transition
                  hover:bg-[#0B3B75]/90
                  active:scale-[0.99]
                "
              >
                I'm Interested
              </button>
            )}
          </div>

          {/* =========================
              FOOTER
          ========================== */}
          <div className={`${isModal ? 'mt-2.5' : 'mt-3'} text-center`}>
            <p className="text-[11px] text-gray-500">
              Thank you for visiting us!
            </p>

            {!isPreview && (
              <p className="mt-1 text-[10px] text-gray-400">
                Are you the exhibitor?{' '}
                <a
                  href="/exhibitor/login"
                  className="font-semibold text-[#0B3B75] hover:underline"
                >
                  See who's interested
                </a>
              </p>
            )}
          </div>

          {/* =========================
              BACK / CLOSE
          ========================== */}
          <button
            type="button"
            onClick={isModal ? onClose : () => navigate('/')}
            className={`
              mx-auto
              ${isModal ? 'mt-2' : 'mt-3'}
              flex
              items-center
              gap-1.5
              text-[11px]
              font-medium
              text-[#0B3B75]
              transition
              hover:text-[#0B3B75]/80
            `}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Close
          </button>
        </div>
      </div>
    </div>
  );

  // Modal Render for Exhibitor Dashboard
  if (isModal) {
    const modalElement = (
      <div
        className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/70 p-3 sm:py-8 backdrop-blur-sm"
        onClick={onClose}
      >
        <div className="flex min-h-full items-center justify-center">
          <div
            className="relative w-full max-w-[440px] rounded-3xl bg-slate-50 p-3.5 sm:p-5 shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Bar */}
            <div className="mb-2.5 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-[#0B3B75]" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Stall Profile Preview
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/80 text-slate-600 transition hover:bg-slate-300 hover:text-slate-900 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {cardContent}
          </div>
        </div>
      </div>
    );

    return typeof document !== 'undefined'
      ? createPortal(modalElement, document.body)
      : modalElement;
  }

  // Full Page Render for Visitor QR Scan
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-3 py-6 sm:px-4 lg:py-10">
      {/* =========================
          INTEREST FORM MODAL (for visitors)
      ========================== */}
      {showInterestForm && (
        <div
          className="
            fixed
            inset-0
            z-[9999]
            flex
            items-center
            justify-center
            bg-black/40
            px-4
            backdrop-blur-sm
          "
          onClick={closeInterestForm}
        >
          <div
            className="
              w-full
              max-w-[340px]
              rounded-2xl
              bg-white
              p-5
              shadow-[0_20px_60px_rgba(0,0,0,0.2)]
            "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Share Your Details
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  So {companyDisplayName} can follow up with you.
                </p>
              </div>
              <button
                type="button"
                onClick={closeInterestForm}
                aria-label="Close"
                className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3.5 space-y-2">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={interestName}
                onChange={(e) => setInterestName(e.target.value)}
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-3.5
                  py-2.5
                  text-sm
                  text-slate-800
                  placeholder-slate-400
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#0B3B75]/40
                "
              />

              <input
                type="tel"
                placeholder="Your mobile number (optional)"
                value={interestMobile}
                onChange={(e) =>
                  setInterestMobile(e.target.value)
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-3.5
                  py-2.5
                  text-sm
                  text-slate-800
                  placeholder-slate-400
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#0B3B75]/40
                "
              />
            </div>

            {interestError && (
              <p className="mt-2 text-xs text-red-600">
                {interestError}
              </p>
            )}

            <div className="mt-3.5 flex gap-2">
              <button
                type="button"
                onClick={closeInterestForm}
                className="
                  flex-1
                  rounded-xl
                  border
                  border-slate-300
                  py-2.5
                  text-sm
                  font-semibold
                  text-slate-600
                  transition
                  hover:bg-slate-50
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitInterest}
                disabled={submitting}
                className="
                  flex
                  flex-[2]
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-[#0B3B75]
                  py-2.5
                  text-sm
                  font-bold
                  text-white
                  shadow-[0_6px_16px_rgba(11,59,117,0.22)]
                  transition
                  hover:bg-[#0B3B75]/90
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {submitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {submitting ? 'Sending…' : 'Send Interest'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          SUCCESS MODAL
      ========================== */}
      {interestSent && (
        <div
          className="
            fixed
            inset-0
            z-[9999]
            flex
            items-center
            justify-center
            bg-black/40
            px-4
            backdrop-blur-sm
          "
          onClick={() => setInterestSent(false)}
        >
          <div
            className="
              w-full
              max-w-[340px]
              rounded-2xl
              bg-white
              p-6
              text-center
              shadow-[0_20px_60px_rgba(0,0,0,0.2)]
            "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Check className="h-7 w-7" />
            </div>

            <h2 className="mt-3.5 text-lg font-bold text-gray-900">
              Thank You!
            </h2>

            <p className="mt-1.5 text-sm leading-5 text-gray-600">
              Thank you for submitting your interest.
              <br />
              We will get back to you soon.
            </p>

            <button
              type="button"
              onClick={() => setInterestSent(false)}
              className="
                mt-4
                w-full
                rounded-xl
                bg-green-600
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-green-700
              "
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* =========================
          PAGE CONTENT
      ========================== */}
      {cardContent}
    </div>
  );
}