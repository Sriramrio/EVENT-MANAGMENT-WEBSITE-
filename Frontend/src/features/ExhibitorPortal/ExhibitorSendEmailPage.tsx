import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { toPng } from "html-to-image";
import {
  Mail,
  MailCheck,
  Send,
  User,
  Building,
  AtSign,
  FileText,
  Eye,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Clock,
  ShieldCheck,
  Store,
  Paperclip,
  Package,
  Building2,
  ArrowRight,
  Globe,
  ExternalLink,
} from "lucide-react";
import { exhibitorApiClient } from "../../data/api/exhibitorApiClient";
import { apiClient } from "../../data/api/apiClient";

function brandAsset(fileName: string) {
  return `${import.meta.env.BASE_URL}brand/${fileName}`;
}

export interface ExhibitorDetails {
  companyName: string;
  legalName?: string;
  registrationNumber: string | null;
  stallNumber: string | null;
  contactPersonName?: string;
  email: string;
  mobile?: string;
  fasciaName?: string | null;
  industryCategory?: string | null;
  productKeywords?: string | null;
  companyLogo?: string | null;
  manufacturing?: string | null;
}

interface SentEmailRecord {
  id: string;
  toEmail: string;
  visitorName: string;
  subject: string;
  sentAt: string;
  hasAttachment: boolean;
  copySent: boolean;
}

type TemplateKey =
  | "stall_invitation"
  | "b2b_sourcing"
  | "product_showcase"
  | "custom";

async function waitForCardImages(card: HTMLElement) {
  const images = Array.from(card.querySelectorAll("img"));
  await Promise.all(
    images.map(async (image) => {
      try {
        if (typeof image.decode === "function") {
          await image.decode();
        } else if (!image.complete) {
          await new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          });
        }
      } catch {
        // Continue even if one fails
      }
    }),
  );
}

/**
 * Parses raw text and converts any HTTP/HTTPS URLs into clickable <a> links.
 */
function renderMessageWithLinks(text: string) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline font-semibold hover:text-blue-800 break-all cursor-pointer transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export function ExhibitorSendEmailPage() {
  const cardRef = useRef<HTMLDivElement>(null);

  const [exhibitor, setExhibitor] = useState<ExhibitorDetails | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Form State
  const [toEmail, setToEmail] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateKey>("stall_invitation");
  const [attachECard, setAttachECard] = useState<boolean>(true);
  const [sendCopyToMe, setSendCopyToMe] = useState<boolean>(false);

  // UI state
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose");
  const [recentSent, setRecentSent] = useState<SentEmailRecord[]>([]);

  // Load and sync exhibitor email logs from localStorage & backend
  useEffect(() => {
    try {
      localStorage.removeItem("msme_exhibitor_email_logs_default");
    } catch {}

    if (!exhibitor?.registrationNumber) return;
    const storageKey = `msme_exhibitor_email_logs_${exhibitor.registrationNumber}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentSent(parsed);
        }
      }
    } catch {
      // ignore
    }

    exhibitorApiClient
      .get<
        Array<{
          id: string;
          toEmail: string;
          subject: string;
          status: string;
          sentAt: string;
        }>
      >("/exhibitor/email-logs")
      .then((logs) => {
        if (Array.isArray(logs)) {
          const apiItems: SentEmailRecord[] = logs.map((l) => ({
            id: l.id,
            toEmail: l.toEmail,
            visitorName: "",
            subject: l.subject,
            sentAt: new Date(l.sentAt).toLocaleString([], {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            hasAttachment: true,
            copySent: false,
          }));
          setRecentSent(apiItems);
          try {
            localStorage.setItem(storageKey, JSON.stringify(apiItems));
          } catch {}
        }
      })
      .catch(() => {
        // Backend fallback silently handled
      });
  }, [exhibitor?.registrationNumber]);

  const companyDisplayName = useMemo(() => {
    return exhibitor?.companyName || exhibitor?.legalName || "Our Company";
  }, [exhibitor]);

  const contactPerson = useMemo(() => {
    return exhibitor?.contactPersonName || "Exhibitor Representative";
  }, [exhibitor]);

  const stallNum = useMemo(() => {
    return exhibitor?.stallNumber || "Assigned Stall";
  }, [exhibitor]);

  const applyTemplate = (
    key: TemplateKey,
    details?: ExhibitorDetails | null,
  ) => {
    const prof = details ?? exhibitor;
    const comp = prof?.companyName || prof?.legalName || "Our Company";
    const sNum = prof?.stallNumber || "our stall";

    setSelectedTemplate(key);
    if (key === "stall_invitation") {
      setSubject(
        `Invitation to visit ${comp} (Stall ${sNum}) at MSME Sangamam Connect - Hosur 2026`,
      );
      setMessage(
        `We cordially invite you and your team to visit our stall at MSME Sangamam Connect - Hosur 2026.\n\nWe will be showcasing our latest products, engineering solutions, and manufacturing capabilities. Our leadership and technical experts will be available to discuss how we can partner together.\n\n📍 Venue: Hotel Hills Exhibition Arena, Sipcot Phase 1, Hosur, Tamil Nadu\n🗺️ Google Navigation: https://www.google.com/maps/dir/?api=1&destination=Hotel+Hills+Exhibition+Arena,+Sipcot+Phase+1,+Hosur,+Tamil+Nadu\n🌐 Official Expo Website: https://msmesangamam.lubtn.com\n\nWe look forward to meeting you in person at Stall ${sNum}!`,
      );
    } else if (key === "b2b_sourcing") {
      setSubject(
        `B2B Partnership & Sourcing Invitation from ${comp} (Stall ${sNum}) - MSME Sangamam Connect 2026`,
      );
      setMessage(
        `We are pleased to invite you and your procurement & engineering team to connect with us at MSME Sangamam Connect - Hosur 2026.\n\nWe would like to introduce our organization and explore potential vendor onboarding, supply, and subcontracting opportunities with your esteemed firm.\n\nWe welcome you to visit us at Stall ${sNum} for an introductory discussion on mutual business synergy. Please feel free to reply with your preferred date and time to schedule a dedicated discussion.\n\n📍 Venue: Hotel Hills Exhibition Arena, Hosur\n🗺️ Google Navigation: https://www.google.com/maps/dir/?api=1&destination=Hotel+Hills+Exhibition+Arena,+Sipcot+Phase+1,+Hosur,+Tamil+Nadu\n🌐 Official Expo Website: https://msmesangamam.lubtn.com\n\nWe look forward to welcoming you!`,
      );
    } else if (key === "product_showcase") {
      setSubject(
        `Product Innovation & Manufacturing Showcase - ${comp} (Stall ${sNum}) - MSME Sangamam Connect 2026`,
      );
      setMessage(
        `We are excited to invite you to experience our advanced product solutions and precision manufacturing capabilities at MSME Sangamam Connect - Hosur 2026 in Hosur.\n\nVisit us at Stall ${sNum} to experience live demonstrations, product samples, and discuss custom manufacturing requirements tailored to your needs.\n\n📍 Venue: Hotel Hills Exhibition Arena, Hosur\n🗺️ Google Navigation: https://www.google.com/maps/dir/?api=1&destination=Hotel+Hills+Exhibition+Arena,+Sipcot+Phase+1,+Hosur,+Tamil+Nadu\n🌐 Official Expo Website: https://msmesangamam.lubtn.com\n\nWe look forward to welcoming you!`,
      );
    } else {
      setSubject(`Message from ${comp} - MSME Sangamam Connect - Hosur 2026`);
      setMessage("");
    }
  };

  // Load exhibitor details and stall profile on mount
  useEffect(() => {
    const fetchExhibitorData = async () => {
      try {
        setIsLoadingProfile(true);

        // 1. Try dedicated stall-card endpoint first
        const cardRes = await exhibitorApiClient
          .get<any>("/exhibitor/stall-card")
          .catch(() => null);

        // 2. Fetch basic session
        const meRes = await exhibitorApiClient
          .get<any>("/exhibitor/me")
          .catch(() => null);

        const combined: ExhibitorDetails = {
          companyName:
            cardRes?.companyName || meRes?.companyName || "Exhibitor",
          legalName: cardRes?.legalName || meRes?.legalName,
          registrationNumber:
            cardRes?.bookingRegistrationNumber ||
            meRes?.registrationNumber ||
            null,
          stallNumber: cardRes?.stallNumber || meRes?.stallNumber || null,
          fasciaName: cardRes?.fasciaName || meRes?.fasciaName || null,
          contactPersonName:
            cardRes?.contactPerson || meRes?.contactPersonName || "",
          email: cardRes?.email || meRes?.email || "",
          mobile: cardRes?.mobile || meRes?.mobile || "",
          industryCategory:
            cardRes?.industryCategory || meRes?.industryCategory || null,
          productKeywords:
            cardRes?.productKeywords || meRes?.productKeywords || null,
          companyLogo: cardRes?.companyLogo || meRes?.companyLogo || null,
          manufacturing: cardRes?.manufacturing || meRes?.manufacturing || null,
        };

        // If stall details are missing, fetch public stall profile
        if (!combined.stallNumber && combined.registrationNumber) {
          const stallProfile = await apiClient
            .get<any>(
              `/public/stalls/${encodeURIComponent(combined.registrationNumber)}`,
            )
            .catch(() => null);
          if (stallProfile) {
            combined.stallNumber =
              stallProfile.stallNumber || combined.stallNumber;
            combined.fasciaName =
              stallProfile.fasciaName || combined.fasciaName;
            combined.companyLogo =
              stallProfile.companyLogo || combined.companyLogo;
          }
        }

        setExhibitor(combined);
        applyTemplate("stall_invitation", combined);
      } catch (err) {
        console.error("Failed to load exhibitor profile:", err);
        setErrorMessage("Unable to load exhibitor account details.");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchExhibitorData();
  }, []);

  const handleInsertTag = (tag: string) => {
    setMessage((prev) => `${prev} ${tag}`);
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const isFormValid = useMemo(() => {
    return (
      isValidEmail(toEmail) &&
      subject.trim().length > 0 &&
      message.trim().length > 0
    );
  }, [toEmail, subject, message]);

  // Generate high-resolution E-Card PNG data URL from rendered element
  // skipFonts: true and fontEmbedCSS: '' prevents reading external stylesheet rules (avoiding SecurityError)
  const generateCardPngDataUrl = async (): Promise<string | null> => {
    const card = cardRef.current;
    if (!card) return null;

    try {
      await waitForCardImages(card);
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const bounds = card.getBoundingClientRect();
      const captureWidth = Math.ceil(
        Math.max(bounds.width, card.scrollWidth, 640),
      );
      const captureHeight =
        Math.ceil(Math.max(bounds.height, card.scrollHeight)) + 8;

      const dataUrl = await toPng(card, {
        cacheBust: false,
        pixelRatio: 2,
        skipFonts: true,
        fontEmbedCSS: "",
        width: captureWidth,
        height: captureHeight,
        backgroundColor: "#ffffff",
        style: {
          boxSizing: "border-box",
          margin: "0",
        },
      });

      return dataUrl;
    } catch (err) {
      console.warn("Could not generate card image:", err);
      return null;
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSending) return;

    setIsSending(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      let cardImageBase64: string | null = null;
      if (attachECard) {
        cardImageBase64 = await generateCardPngDataUrl();
      }

      // Send standard JSON payload to prevent multipart/form-data 415 errors
      const payload = {
        toEmail: toEmail.trim(),
        visitorName: visitorName.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
        templateKey: selectedTemplate,
        attachECard,
        sendCopyToMe,
        cardImageBase64: cardImageBase64 || undefined,
      };

      const res = await exhibitorApiClient.post<{
        message: string;
        toEmail: string;
        replyToEmail: string;
        subject: string;
        sentAt: string;
        hasCardAttached?: boolean;
        copySent?: boolean;
      }>("/exhibitor/send-email", payload);

      const cardNotice = " Official stall card attached, please check!";
      const copyNotice =
        res.copySent || sendCopyToMe
          ? ` A copy was dispatched to ${res.replyToEmail}.`
          : "";
      setSuccessMessage(
        `Email successfully dispatched to ${res.toEmail}!${cardNotice}${copyNotice}`,
      );

      const newLogItem: SentEmailRecord = {
        id: crypto.randomUUID(),
        toEmail: res.toEmail,
        visitorName: visitorName.trim() || "Visitor",
        subject: res.subject,
        sentAt: new Date().toLocaleString([], {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        hasAttachment: true,
        copySent: Boolean(res.copySent || sendCopyToMe),
      };

      setRecentSent((prev) => {
        const next = [newLogItem, ...prev];
        try {
          if (exhibitor?.registrationNumber) {
            const storageKey = `msme_exhibitor_email_logs_${exhibitor.registrationNumber}`;
            localStorage.setItem(storageKey, JSON.stringify(next));
          }
          localStorage.removeItem("msme_exhibitor_email_logs_default");
        } catch {}
        return next;
      });

      // Reset recipient fields while keeping template subject
      setToEmail("");
      setVisitorName("");
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          "Failed to send email. Please check the recipient address and try again.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    setToEmail("");
    setVisitorName("");
    applyTemplate(selectedTemplate);
    setAttachECard(true);
    setSendCopyToMe(false);
    setSuccessMessage("");
    setErrorMessage("");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Send Email
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Compose personalized invitations and follow-ups with your
                official stall card attached.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <Link
            to="/exhibitorShell/EmailLogs"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-blue-600 transition"
          >
            <MailCheck className="h-4 w-4 text-blue-600" />
            Visitor Email Logs
            {recentSent.length > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                {recentSent.length}
              </span>
            )}
          </Link>

          {exhibitor?.email && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>
                Replies:{" "}
                <strong className="text-slate-900 font-semibold">
                  {exhibitor.email}
                </strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-800 shadow-sm transition-all">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-emerald-900">
              Delivery Dispatched
            </p>
            <p className="mt-0.5 text-emerald-700">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-rose-800 shadow-sm transition-all">
          <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-rose-900">Unable to Send</p>
            <p className="mt-0.5 text-rose-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Mobile Tab Switcher */}
      <div className="mt-6 flex border-b border-slate-200 lg:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("compose")}
          className={`flex-1 pb-3 text-center text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "compose"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Compose Form
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`flex-1 pb-3 text-center text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "preview"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Live Preview
        </button>
      </div>

      {/* Main Grid: Left Form, Right Preview */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Container */}
        <div
          className={`lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 ${activeTab === "compose" ? "block" : "hidden lg:block"}`}
        >
          {/* Sender Credentials Indicator Card */}
          <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 p-4 mb-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-800 mb-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Secure Delivery Protocol
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Sender (From):</span>
                <span className="font-semibold text-slate-800">
                  MSME Sangamam Server (System Verified)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Reply-To Address:</span>
                <span className="font-semibold text-blue-700 break-all">
                  {exhibitor?.email || "Your Registered Email"}
                </span>
              </div>
            </div>
          </div>

          {/* Template Selector */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">
              Choose Email Template
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => applyTemplate("stall_invitation")}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  selectedTemplate === "stall_invitation"
                    ? "border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                  <Store className="h-3.5 w-3.5 text-blue-600" />
                  Stall Invitation
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">
                  Invite visitors to your assigned stall
                </span>
              </button>

              <button
                type="button"
                onClick={() => applyTemplate("b2b_sourcing")}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  selectedTemplate === "b2b_sourcing"
                    ? "border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                  <Building className="h-3.5 w-3.5 text-blue-600" />
                  B2B Sourcing
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">
                  Explore supplier & vendor connect
                </span>
              </button>

              <button
                type="button"
                onClick={() => applyTemplate("product_showcase")}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  selectedTemplate === "product_showcase"
                    ? "border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                  <Package className="h-3.5 w-3.5 text-blue-600" />
                  Product Showcase
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">
                  Display innovations & machinery
                </span>
              </button>

              <button
                type="button"
                onClick={() => applyTemplate("custom")}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  selectedTemplate === "custom"
                    ? "border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  Custom
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">
                  Compose from scratch
                </span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            {/* Recipient To Email */}
            <div>
              <label
                htmlFor="toEmail"
                className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5"
              >
                To Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <AtSign className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  id="toEmail"
                  type="email"
                  required
                  placeholder="recipient@example.com"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              {toEmail && !isValidEmail(toEmail) && (
                <p className="mt-1 text-xs text-rose-500">
                  Please enter a valid email format (e.g. name@domain.com).
                </p>
              )}
            </div>

            {/* Visitor Name */}
            <div>
              <label
                htmlFor="visitorName"
                className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5"
              >
                Recipient / Visitor Name{" "}
                <span className="text-slate-400 font-normal lowercase">
                  (optional personalization)
                </span>
              </label>
              <div className="relative">
                <User className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  id="visitorName"
                  type="text"
                  placeholder="e.g. Ramesh Kumar or Acme Corp"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label
                htmlFor="subject"
                className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5"
              >
                Email Subject <span className="text-rose-500">*</span>
              </label>
              <input
                id="subject"
                type="text"
                required
                placeholder="Subject of the email"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
              />
            </div>

            {/* Message Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="message"
                  className="block text-xs font-bold uppercase tracking-wide text-slate-700"
                >
                  Message Content <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[11px] text-slate-400">Insert:</span>
                  <button
                    type="button"
                    onClick={() => handleInsertTag("{{visitorName}}")}
                    className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-200"
                  >
                    {selectedTemplate === "b2b_sourcing" ? "Recipient Name" : "Visitor Name"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTag("{{stallNumber}}")}
                    className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-200"
                  >
                    Stall No.
                  </button>
                  {selectedTemplate === "b2b_sourcing" ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          handleInsertTag(
                            "https://msmesangamam.lubtn.com/buyer/register",
                          )
                        }
                        className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-100 border border-blue-200"
                      >
                        + Buyer Link
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleInsertTag(
                            "https://msmesangamam.lubtn.com/seller/register",
                          )
                        }
                        className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                      >
                        + Seller Link
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        handleInsertTag(
                          "https://msmesangamam.lubtn.com/visitor",
                        )
                      }
                      className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-100 border border-blue-200"
                    >
                      + Visitor Link
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      handleInsertTag("https://msmesangamam.lubtn.com")
                    }
                    className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                  >
                    + Website Link
                  </button>
                </div>
              </div>
              <textarea
                id="message"
                required
                rows={6}
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
              />
            </div>

            {/* Attachment Options */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-slate-500" />
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
                    Attachment Details
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                  <CheckCircle2 className="h-3 w-3" /> Auto Attached
                </span>
              </div>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="attachECard"
                  checked={attachECard}
                  onChange={(e) => setAttachECard(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="attachECard"
                  className="text-xs text-slate-600 cursor-pointer select-none"
                >
                  <strong className="text-slate-800">
                    Attach Digital Stall E-Card (StallCard_{stallNum}.png)
                  </strong>
                  <br />A high-resolution image of your official exhibition
                  stall card with booth location & contact QR code will be
                  attached automatically.
                </label>
              </div>
            </div>

            {/* Delivery Settings */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="sendCopyToMe"
                  checked={sendCopyToMe}
                  onChange={(e) => setSendCopyToMe(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="sendCopyToMe"
                  className="text-xs text-slate-600 cursor-pointer select-none"
                >
                  <strong className="text-slate-800">
                    Send me a copy of this message
                  </strong>
                  <br />A duplicate copy with attachment will be delivered to{" "}
                  <span className="font-semibold text-blue-700">
                    {exhibitor?.email || "your registered email"}
                  </span>
                </label>
              </div>
            </div>

            {/* Dispatch Action Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[11px] text-slate-400">
                * Official system emails are digitally signed for high inbox
                deliverability.
              </p>
              <button
                type="submit"
                disabled={isSending || !isFormValid}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B3B75] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
              >
                {isSending ? (
                  <>
                    <RotateCcw className="h-4 w-4 animate-spin" />
                    Dispatching Email...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Official Invitation
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Container */}
        <div
          className={`lg:col-span-5 ${activeTab === "preview" ? "block" : "hidden lg:block"} lg:sticky lg:top-6`}
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Preview Box Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                <Eye className="h-4 w-4 text-blue-400" />
                Live Email Preview
              </div>
              <span className="text-[10px] font-medium bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30">
                WYSIWYG Mode
              </span>
            </div>

            {/* Simulated Email Client UI */}
            <div className="border-b border-slate-200 bg-slate-100 text-xs">
              {/* Email Headers Meta */}
              <div className="p-3.5 space-y-1.5 bg-white border-b border-slate-200 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium w-16">From:</span>
                  <span className="font-semibold text-slate-700">
                    MSME Sangamam Connect &lt;events@msmetn.org&gt;
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium w-16">
                    Reply-To:
                  </span>
                  <span className="font-semibold text-blue-600 truncate">
                    {contactPerson} &lt;
                    {exhibitor?.email || "exhibitor@email.com"}&gt;
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium w-16">To:</span>
                  <span className="font-semibold text-slate-800 truncate">
                    {toEmail || "recipient@example.com"}
                  </span>
                </div>
                {sendCopyToMe && exhibitor?.email && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="text-slate-400 font-medium w-16">
                      CC (Copy):
                    </span>
                    <span className="font-medium text-slate-700 truncate">
                      {exhibitor.email}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 pt-0.5 border-t border-slate-200/60">
                  <span className="text-slate-400 font-medium w-16">
                    Subject:
                  </span>
                  <span className="font-bold text-slate-900 truncate">
                    {subject || "No Subject Specified"}
                  </span>
                </div>
                {attachECard && (
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60 text-emerald-700 font-medium">
                    <Paperclip className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-[11px]">
                      Attachment: <b>StallCard_{stallNum}.png</b> (Stall Card
                      Attached)
                    </span>
                  </div>
                )}
              </div>

              {/* Rendered Email Body */}
              <div className="p-4 sm:p-5 bg-slate-50/50 text-slate-800">
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  {/* Event Header Banner */}
                  <div className="bg-gradient-to-r from-[#0B3B75] to-blue-800 p-4 text-white">
                    <h3 className="font-bold text-base m-0">
                      MSME Sangamam Connect - Hosur 2026
                    </h3>
                    <p className="text-[11px] text-blue-100 mt-0.5">
                      Hosur | Business & Industrial Expo
                    </p>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 text-xs sm:text-sm leading-relaxed space-y-3">
                    <p className="font-semibold text-slate-900">
                      Dear {visitorName.trim() || "Valued Partner"},
                    </p>

                    <div className="whitespace-pre-wrap text-slate-700 py-1 leading-relaxed">
                      {renderMessageWithLinks(
                        message ||
                          "Your composed message will appear here in real-time.",
                      )}
                    </div>

                    {/* B2B vs Visitor Registration Box */}
                    {selectedTemplate === "b2b_sourcing" ? (
                      /* B2B Buyer / Seller Registration & Expo Portal Links */
                      <div className="my-3.5 rounded-xl border border-blue-200 bg-gradient-to-b from-blue-50/90 to-indigo-50/70 p-4 text-center shadow-2xs space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#0B3B75]">
                          B2B Connect & Registration Portal
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md mx-auto">
                          {/* Buyer Register */}
                          <div className="rounded-lg bg-white border border-blue-200 p-2.5 flex flex-col items-center justify-between shadow-2xs">
                            <span className="text-[11px] font-bold text-slate-700 mb-1.5">
                              For Sourcing & Procurement
                            </span>
                            <a
                              href="https://msmesangamam.lubtn.com/buyer/register"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 rounded-md bg-[#0B3B75] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-900 transition w-full"
                            >
                              Register as Buyer &rarr;
                            </a>
                          </div>

                          {/* Seller Register */}
                          <div className="rounded-lg bg-white border border-blue-200 p-2.5 flex flex-col items-center justify-between shadow-2xs">
                            <span className="text-[11px] font-bold text-slate-700 mb-1.5">
                              For Vendors & Manufacturers
                            </span>
                            <a
                              href="https://msmesangamam.lubtn.com/seller/register"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition w-full"
                            >
                              Register as Seller &rarr;
                            </a>
                          </div>
                        </div>

                        {/* Official Website Link */}
                        <div className="pt-2 border-t border-blue-200/80 flex items-center justify-center gap-1.5 text-xs">
                          <Globe className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-slate-600 font-medium">
                            Official Website:
                          </span>
                          <a
                            href="https://msmesangamam.lubtn.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 font-bold underline hover:text-blue-900"
                          >
                            https://msmesangamam.lubtn.com
                          </a>
                        </div>
                      </div>
                    ) : (
                      /* Standard Visitor Registration Section */
                      <div className="my-3.5 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-center shadow-2xs space-y-2">
                        <p className="text-xs font-semibold text-blue-900 mb-1">
                          Please register as a visitor to attend the expo:
                        </p>
                        <a
                          href="https://msmesangamam.lubtn.com/visitor"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B3B75] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-900 transition-colors"
                        >
                          Register as Visitor &rarr;
                        </a>
                        <p className="mt-1 text-[11px] text-blue-600">
                          <a
                            href="https://msmesangamam.lubtn.com/visitor"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-800 font-medium break-all"
                          >
                            https://msmesangamam.lubtn.com/visitor
                          </a>
                        </p>
                        <div className="pt-2 border-t border-blue-200/60 flex items-center justify-center gap-1.5 text-xs">
                          <Globe className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-slate-600 font-medium">
                            Official Website:
                          </span>
                          <a
                            href="https://msmesangamam.lubtn.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 font-bold underline hover:text-blue-900"
                          >
                            https://msmesangamam.lubtn.com
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Permanent Default Stall Card Notice (Always attached by default) */}
                    <div className="my-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 flex items-center gap-2">
                      <Paperclip className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Stall card attached, please check.</strong>
                      </span>
                    </div>

                    {/* Exhibitor Info Box */}
                    <div className="mt-4 rounded-lg border-l-4 border-[#0B3B75] bg-slate-50 p-3 text-xs space-y-1">
                      <p className="font-bold uppercase tracking-wider text-[#0B3B75] text-[11px]">
                        Exhibitor Information
                      </p>
                      <div className="grid grid-cols-3 gap-1 pt-1">
                        <span className="text-slate-500">Company:</span>
                        <span className="col-span-2 font-semibold text-slate-900">
                          {companyDisplayName}
                        </span>
                        <span className="text-slate-500">Contact:</span>
                        <span className="col-span-2 text-slate-800">
                          {contactPerson}
                        </span>
                        <span className="text-slate-500">Stall Number:</span>
                        <span className="col-span-2 font-bold text-[#0B3B75]">
                          {stallNum}
                        </span>
                        <span className="text-slate-500">Reply-To:</span>
                        <span className="col-span-2 text-blue-600 truncate">
                          {exhibitor?.email || "exhibitor@domain.com"}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                      Clicking <b>Reply</b> on this email will deliver directly
                      to {contactPerson} at {exhibitor?.email || "your email"}.
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="bg-slate-100 px-4 py-2.5 text-center text-[11px] text-slate-500 border-t border-slate-200">
                    MSME Sangamam Connect - Hosur 2026 • Official Digital Stall
                    Card
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Link to Visitor Email Logs */}
            <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50/70 to-white p-4 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <MailCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Visitor Email Logs
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {recentSent.length > 0
                      ? `${recentSent.length} email${recentSent.length > 1 ? "s" : ""} sent from your exhibitor account.`
                      : "Audit and view all dispatched visitor emails."}
                  </p>
                </div>
              </div>
              <Link
                to="/exhibitorShell/EmailLogs"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 bg-white border border-blue-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-blue-50 transition shrink-0"
              >
                View Logs
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* OFFSCREEN HIGH-RESOLUTION E-CARD COMPONENT FOR ATTACHMENT CAPTURE */}
      {/* EXACT OFFICIAL E-CARD COMPONENT MATCHING ExhibitorECardPage */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: "672px",
          pointerEvents: "none",
          opacity: 1,
          zIndex: -1,
        }}
      >
        <div
          ref={cardRef}
          className="w-[672px] bg-white p-1 rounded-2xl shadow-xl transition-all"
          style={{
            boxSizing: "border-box",
            padding: "4px",
            width: "672px",
            backgroundColor: "#ffffff",
          }}
        >
          <div className="w-full overflow-hidden rounded-xl border-2 border-blue-800 bg-white">
            {/* Stall Number & Fascia Name */}
            <div className="grid grid-cols-2 border-b border-blue-200">
              <div className="flex min-h-[120px] flex-col items-center justify-center p-5 text-center bg-blue-50/20">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Stall Number
                </p>
                <p className="mt-2 break-words text-3xl font-black text-blue-900">
                  {exhibitor?.stallNumber || "Allocation in Progress"}
                </p>
              </div>

              <div className="border-l border-blue-200 flex min-h-[120px] flex-col items-center justify-center p-5 text-center bg-blue-50/20">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Fascia Name
                </p>
                <p className="mt-2 break-words text-xl font-extrabold text-blue-900">
                  {exhibitor?.fasciaName || companyDisplayName}
                </p>
              </div>
            </div>

            {/* Company Logo Section */}
            <div
              className="flex min-h-[160px] w-full items-center justify-center border-b border-blue-200 p-6"
              style={{ width: "100%" }}
            >
              {exhibitor?.companyLogo ? (
                <img
                  src={exhibitor.companyLogo}
                  alt="Company logo"
                  className="block h-28 w-full max-w-[280px] object-contain object-center"
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
                <div className="text-center py-4">
                  <Building2 className="mx-auto h-8 w-8 text-slate-300 mb-1" />
                  <p className="text-sm font-bold text-slate-500">
                    {companyDisplayName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">Company Logo</p>
                </div>
              )}
            </div>

            {/* Product Details Section */}
            <div className="border-b border-blue-200 bg-blue-50/30 p-6">
              <h3 className="text-center text-base font-extrabold text-blue-900 uppercase tracking-wide">
                Product Details
              </h3>

              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg bg-white p-2.5 border border-blue-100/70 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Industry Category
                  </p>
                  <p className="mt-1 font-bold text-sm text-slate-800 truncate">
                    {exhibitor?.industryCategory || "-"}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-2.5 border border-blue-100/70 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Product Keywords
                  </p>
                  <p className="mt-1 font-bold text-sm text-slate-800 truncate">
                    {exhibitor?.productKeywords || "-"}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-2.5 border border-blue-100/70 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Manufacturing / Description
                  </p>
                  <p className="mt-1 font-bold text-sm text-slate-800 truncate">
                    {exhibitor?.manufacturing || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Exhibitor Details Section */}
            <div className="p-6">
              <h3 className="text-center text-base font-extrabold text-blue-900 uppercase tracking-wide">
                Exhibitor Details
              </h3>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Company Name
                  </p>
                  <p className="mt-1 font-bold text-sm text-slate-900">
                    {companyDisplayName}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Contact Person
                  </p>
                  <p className="mt-1 font-bold text-sm text-slate-900">
                    {contactPerson || "-"}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Email
                  </p>
                  <p className="mt-1 font-bold text-sm text-slate-900 break-all">
                    {exhibitor?.email || "-"}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Mobile
                  </p>
                  <p className="mt-1 font-bold text-sm text-slate-900">
                    {exhibitor?.mobile || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Venue & Date Section */}
            <div className="grid grid-cols-2 border-y border-blue-200 bg-slate-50">
              <div className="flex min-h-[75px] items-center justify-center p-4 text-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Venue
                  </p>
                  <p className="font-extrabold text-sm text-slate-800 mt-0.5">
                    Hotel Hills, Hosur
                  </p>
                </div>
              </div>
              <div className="flex min-h-[75px] items-center justify-center border-l border-blue-200 p-4 text-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Date
                  </p>
                  <p className="font-extrabold text-sm text-slate-800 mt-0.5">
                    18 & 19 September 2026
                  </p>
                </div>
              </div>
            </div>

            {/* Brand Logos Footer */}
            <div className="flex flex-row min-h-[140px] w-full bg-white">
              <div className="flex w-1/2 items-center justify-center p-5 border-r border-blue-200">
                <img
                  src={brandAsset("msme-sangamam-logo.png")}
                  alt="MSME Sangamam"
                  className="block h-20 w-full max-w-[240px] object-contain object-center"
                />
              </div>

              <div className="flex w-1/2 items-center justify-center p-5">
                <img
                  src={brandAsset("lub-logo.jpg")}
                  alt="Laghu Udyog Bharati Tamil Nadu"
                  className="block h-20 w-full max-w-[200px] object-contain object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExhibitorSendEmailPage;
