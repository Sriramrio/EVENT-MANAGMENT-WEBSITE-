import { useEffect, useState } from 'react';
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

export function StallProfilePage() {
  const { registrationNumber } =
    useParams<{ registrationNumber: string }>();

  const navigate = useNavigate();

  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showInterestForm, setShowInterestForm] = useState(false);
  const [interestName, setInterestName] = useState('');
  const [interestMobile, setInterestMobile] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [interestSent, setInterestSent] = useState(false);
  const [interestError, setInterestError] = useState('');

  // =========================
  // LOAD STALL PROFILE
  // =========================
  useEffect(() => {
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
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-white px-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#0B3B75]" />

          <p className="mt-4 text-sm font-semibold text-gray-600">
            Loading stall details…
          </p>
        </div>
      </div>
    );
  }

  // =========================
  // NOT FOUND / ERROR
  // =========================
  if (error || !company) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-white px-4">
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
            onClick={() => navigate('/')}
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
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // =========================
  // DERIVED DATA
  // =========================
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

    locationLine && {
      icon: MapPin,
      label: 'Location',
      href: `https://maps.google.com/?q=${encodeURIComponent(
        locationLine
      )}`,
      external: true,
    },
  ].filter(Boolean) as {
    icon: typeof Phone;
    label: string;
    href: string;
    external: boolean;
  }[];

  // =========================
  // MAIN UI
  // =========================
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-3 py-6 sm:px-4 lg:py-10">
      {/* =========================
          INTEREST FORM MODAL
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
                  So {company.companyName} can follow up with you.
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
      <div className="w-full max-w-[360px]">
        {/* Brand header */}
         <div className="mb-6 flex items-center justify-center gap-5 sm:mb-8 sm:gap-8">
                  <img
                    src={brandAsset('msme-sangamam-logo.png')}
                    alt={BRAND.eventName}
                    className="h-12 object-contain xs:h-14 sm:h-16 md:h-20"
                  />
                  <div className="h-8 w-px bg-slate-300 sm:h-10" />
                  <img
                    src={brandAsset('lub-logo.jpg')}
                    alt="Laghu Udyog Bharati"
                    className="h-12 object-contain xs:h-14 sm:h-16 md:h-20"
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
              HEADER — shorter, logo stays big
          ========================== */}
          <div className="relative h-[64px] bg-[#0B3B75]">
            {/* Background Decoration */}
            <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-14 -left-10 h-24 w-24 rounded-full bg-white/10" />

            {/* Company Icon / Logo — big, overlapping header */}
            <div
              className="
                absolute
                left-1/2
                top-[18px]
                z-10
                flex
                h-[96px]
                w-[96px]
                -translate-x-1/2
                items-center
                justify-center
                overflow-hidden
                rounded-[22px]
                border-4
                border-white
                bg-white
                shadow-[0_6px_18px_rgba(0,0,0,0.12)]
              "
            >
              {company.companyLogo ? (
                <img
                  src={company.companyLogo}
                  alt={company.companyName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xl font-black text-[#0B3B75]">
                  {initials(company.companyName)}
                </span>
              )}
            </div>
          </div>

          {/* =========================
              CONTENT — tightened spacing
          ========================== */}
          <div className="px-4 pb-4 pt-[54px]">
            {/* Company Name */}
            <div className="text-center">
              <h1 className="text-base font-bold leading-tight tracking-tight text-black">
                {company.companyName}
              </h1>

              {tagline && (
                <p className="mt-1 text-[11px] font-medium leading-snug text-[#0B3B75]">
                  {tagline}
                </p>
              )}
            </div>

            {/* Description */}
            {company.productServiceDescription && (
              <p className="mx-auto mt-2 max-w-[320px] text-center text-[11px] leading-4 text-gray-600">
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
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Contact Person
                    </p>

                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {company.contactPersonName}
                    </p>

                    {company.contactPersonDesignation && (
                      <p className="text-xs text-slate-500">
                        {company.contactPersonDesignation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* =========================
                CONTACT LINKS — clustered dead-center, not spread
            ========================== */}
            {contactLinks.length > 0 && (
              <div className="mt-3.5 flex items-start justify-center gap-6">
                {contactLinks.map(
                  ({ icon: Icon, label, href, external }, idx) => (
                    <a
                      key={idx}
                      href={href}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noreferrer' : undefined}
                      className="group flex flex-col items-center gap-1 no-underline"
                    >
                      <span
                        className="
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-full
                          bg-[#0B3B75]
                          text-white
                          transition
                          group-hover:bg-[#0B3B75]/85
                        "
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      <span className="text-center text-[10px] font-medium text-gray-700">
                        {label}
                      </span>
                    </a>
                  )
                )}
              </div>
            )}

            {/* =========================
                ACTION: INTEREST
            ========================== */}
            <div className="mt-4">
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
            </div>

            {/* =========================
                FOOTER
            ========================== */}
            <div className="mt-3 text-center">
              <p className="text-[11px] text-gray-500">
                Thank you for visiting us!
              </p>

              <p className="mt-1 text-[10px] text-gray-400">
                Are you the exhibitor?{' '}
                <a
                  href="/exhibitor/login"
                  className="font-semibold text-[#0B3B75] hover:underline"
                >
                  See who's interested
                </a>
              </p>
            </div>

            {/* =========================
                BACK
            ========================== */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="
                mx-auto
                mt-3
                flex
                items-center
                gap-1.5
                text-[11px]
                font-medium
                text-[#0B3B75]
                transition
                hover:text-[#0B3B75]/80
              "
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}