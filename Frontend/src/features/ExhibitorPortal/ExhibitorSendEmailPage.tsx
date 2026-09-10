import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toPng } from 'html-to-image';
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
  ArrowRight
} from 'lucide-react';
import { exhibitorApiClient } from '../../data/api/exhibitorApiClient';
import { apiClient } from '../../data/api/apiClient';

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

type TemplateKey = 'stall_invitation' | 'b2b_sourcing' | 'product_showcase' | 'custom';

async function waitForCardImages(card: HTMLElement) {
  const images = Array.from(card.querySelectorAll('img'));
  await Promise.all(
    images.map(async (image) => {
      try {
        if (typeof image.decode === 'function') {
          await image.decode();
        } else if (!image.complete) {
          await new Promise<void>((resolve) => {
            image.addEventListener('load', () => resolve(), { once: true });
            image.addEventListener('error', () => resolve(), { once: true });
          });
        }
      } catch {
        // Continue even if one fails
      }
    })
  );
}

export function ExhibitorSendEmailPage() {
  const cardRef = useRef<HTMLDivElement>(null);

  const [exhibitor, setExhibitor] = useState<ExhibitorDetails | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Form State
  const [toEmail, setToEmail] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>('stall_invitation');
  const [attachECard, setAttachECard] = useState<boolean>(true);
  const [sendCopyToMe, setSendCopyToMe] = useState<boolean>(false);

  // UI state
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'compose' | 'preview'>('compose');
  const [recentSent, setRecentSent] = useState<SentEmailRecord[]>([]);

  // Load and sync exhibitor email logs from localStorage & backend
  useEffect(() => {
    const storageKey = `msme_exhibitor_email_logs_${exhibitor?.registrationNumber || 'default'}`;
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
      .get<Array<{ id: string; toEmail: string; subject: string; status: string; sentAt: string }>>('/exhibitor/email-logs')
      .then((logs) => {
        if (Array.isArray(logs) && logs.length > 0) {
          setRecentSent((prev) => {
            const apiItems: SentEmailRecord[] = logs.map((l) => ({
              id: l.id,
              toEmail: l.toEmail,
              visitorName: '',
              subject: l.subject,
              sentAt: new Date(l.sentAt).toLocaleString([], {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              hasAttachment: true,
              copySent: false,
            }));

            const existingIds = new Set(prev.map((p) => p.id));
            const newOnes = apiItems.filter((a) => !existingIds.has(a.id));
            const merged = [...prev, ...newOnes];
            try {
              localStorage.setItem(storageKey, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      })
      .catch(() => {
        // Backend fallback silently handled
      });
  }, [exhibitor?.registrationNumber]);

  const companyDisplayName = useMemo(() => {
    return exhibitor?.companyName || exhibitor?.legalName || 'Our Company';
  }, [exhibitor]);

  const contactPerson = useMemo(() => {
    return exhibitor?.contactPersonName || 'Exhibitor Representative';
  }, [exhibitor]);

  const stallNum = useMemo(() => {
    return exhibitor?.stallNumber || 'Assigned Stall';
  }, [exhibitor]);

  const applyTemplate = (key: TemplateKey, details?: ExhibitorDetails | null) => {
    const prof = details ?? exhibitor;
    const comp = prof?.companyName || prof?.legalName || 'Our Company';
    const sNum = prof?.stallNumber || 'our stall';

    setSelectedTemplate(key);
    if (key === 'stall_invitation') {
      setSubject(`Invitation to visit ${comp} (Stall ${sNum}) at MSME Sangamam Connect - Hosur 2026`);
      setMessage(
        `We cordially invite you to visit our stall at MSME Sangamam Connect - Hosur 2026 in Hosur.\n\nWe will be showcasing our latest products, engineering solutions, and manufacturing capabilities. Our leadership and technical team will be available to discuss how we can partner together.\n\nWe look forward to meeting you in person at Stall ${sNum}!`
      );
    } else if (key === 'b2b_sourcing') {
      setSubject(`Business Connect & Collaboration from ${comp} - MSME Sangamam Connect - Hosur 2026`);
      setMessage(
        `Thank you for connecting with us at MSME Sangamam Connect - Hosur 2026.\n\nWe would like to introduce our organization and explore potential supply, vendor, and subcontracting opportunities with your esteemed firm.\n\nPlease let us know a convenient date and time to schedule a brief discussion at Stall ${sNum}.`
      );
    } else if (key === 'product_showcase') {
      setSubject(`Product Innovation & Engineering Showcase - ${comp} (Stall ${sNum}) - MSME Sangamam Connect - Hosur 2026`);
      setMessage(
        `We are excited to showcase our advanced products and precision engineering capabilities at MSME Sangamam Connect - Hosur 2026 in Hosur.\n\nVisit us at Stall ${sNum} to experience live demonstrations, product samples, and discuss custom manufacturing requirements tailored to your needs.\n\nWe look forward to welcoming you!`
      );
    } else {
      setSubject(`Message from ${comp} - MSME Sangamam Connect - Hosur 2026`);
      setMessage('');
    }
  };

  // Load exhibitor details and stall profile on mount
  useEffect(() => {
    const fetchExhibitorData = async () => {
      try {
        setIsLoadingProfile(true);

        // 1. Try dedicated stall-card endpoint first
        const cardRes = await exhibitorApiClient.get<any>('/exhibitor/stall-card').catch(() => null);

        // 2. Fetch basic session
        const meRes = await exhibitorApiClient.get<any>('/exhibitor/me').catch(() => null);

        const combined: ExhibitorDetails = {
          companyName: cardRes?.companyName || meRes?.companyName || 'Exhibitor',
          legalName: cardRes?.legalName || meRes?.legalName,
          registrationNumber: cardRes?.bookingRegistrationNumber || meRes?.registrationNumber || null,
          stallNumber: cardRes?.stallNumber || meRes?.stallNumber || null,
          fasciaName: cardRes?.fasciaName || meRes?.fasciaName || null,
          contactPersonName: cardRes?.contactPerson || meRes?.contactPersonName || '',
          email: cardRes?.email || meRes?.email || '',
          mobile: cardRes?.mobile || meRes?.mobile || '',
          industryCategory: cardRes?.industryCategory || meRes?.industryCategory || null,
          productKeywords: cardRes?.productKeywords || meRes?.productKeywords || null,
          companyLogo: cardRes?.companyLogo || meRes?.companyLogo || null,
          manufacturing: cardRes?.manufacturing || meRes?.manufacturing || null,
        };

        // If stall details are missing, fetch public stall profile
        if (!combined.stallNumber && combined.registrationNumber) {
          const stallProfile = await apiClient.get<any>(`/public/stalls/${encodeURIComponent(combined.registrationNumber)}`).catch(() => null);
          if (stallProfile) {
            combined.stallNumber = stallProfile.stallNumber || combined.stallNumber;
            combined.fasciaName = stallProfile.fasciaName || combined.fasciaName;
            combined.companyLogo = stallProfile.companyLogo || combined.companyLogo;
          }
        }

        setExhibitor(combined);
        applyTemplate('stall_invitation', combined);
      } catch (err) {
        console.error('Failed to load exhibitor profile:', err);
        setErrorMessage('Unable to load exhibitor account details.');
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
    return isValidEmail(toEmail) && subject.trim().length > 0 && message.trim().length > 0;
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
      const captureWidth = Math.ceil(Math.max(bounds.width, card.scrollWidth, 640));
      const captureHeight = Math.ceil(Math.max(bounds.height, card.scrollHeight)) + 8;

      const dataUrl = await toPng(card, {
        cacheBust: false,
        pixelRatio: 2,
        skipFonts: true,
        fontEmbedCSS: '',
        width: captureWidth,
        height: captureHeight,
        backgroundColor: '#ffffff',
        style: {
          boxSizing: 'border-box',
          margin: '0',
        },
      });

      return dataUrl;
    } catch (err) {
      console.warn('Could not generate card image:', err);
      return null;
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSending) return;

    setIsSending(true);
    setSuccessMessage('');
    setErrorMessage('');

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
      }>('/exhibitor/send-email', payload);

      const cardNotice = (res.hasCardAttached || (attachECard && cardImageBase64)) ? ' Official E-Card pass was attached.' : '';
      const copyNotice = (res.copySent || sendCopyToMe) ? ` A copy was dispatched to ${res.replyToEmail}.` : '';
      setSuccessMessage(`Email successfully dispatched to ${res.toEmail}!${cardNotice}${copyNotice}`);

      const newLogItem: SentEmailRecord = {
        id: crypto.randomUUID(),
        toEmail: res.toEmail,
        visitorName: visitorName.trim() || 'Visitor',
        subject: res.subject,
        sentAt: new Date().toLocaleString([], {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        hasAttachment: Boolean(res.hasCardAttached || (attachECard && cardImageBase64)),
        copySent: Boolean(res.copySent || sendCopyToMe),
      };

      setRecentSent((prev) => {
        const next = [newLogItem, ...prev];
        try {
          const storageKey = `msme_exhibitor_email_logs_${exhibitor?.registrationNumber || 'default'}`;
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {}
        return next;
      });

      // Reset recipient fields while keeping template subject
      setToEmail('');
      setVisitorName('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send email. Please check the recipient address and try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    setToEmail('');
    setVisitorName('');
    applyTemplate(selectedTemplate);
    setAttachECard(true);
    setSendCopyToMe(false);
    setSuccessMessage('');
    setErrorMessage('');
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
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Send Email</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Compose personalized invitations and follow-ups with your official digital E-Card pass attached.
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
                Replies: <strong className="text-slate-900 font-semibold">{exhibitor.email}</strong>
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
            <p className="font-semibold text-emerald-900">Delivery Dispatched</p>
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
          onClick={() => setActiveTab('compose')}
          className={`flex-1 pb-3 text-center text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'compose' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Compose Form
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex-1 pb-3 text-center text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'preview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Live Preview
        </button>
      </div>

      {/* Main Grid: Left Form, Right Preview */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Container */}
        <div className={`lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 ${activeTab === 'compose' ? 'block' : 'hidden lg:block'}`}>
          {/* Sender Credentials Indicator Card */}
          <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 p-4 mb-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-800 mb-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Secure Delivery Protocol
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Sender (From):</span>
                <span className="font-semibold text-slate-800">MSME Sangamam Server (System Verified)</span>
              </div>
              <div>
                <span className="text-slate-500 block">Reply-To Address:</span>
                <span className="font-semibold text-blue-700 break-all">{exhibitor?.email || 'Your Registered Email'}</span>
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
                onClick={() => applyTemplate('stall_invitation')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  selectedTemplate === 'stall_invitation'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
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
                onClick={() => applyTemplate('b2b_sourcing')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  selectedTemplate === 'b2b_sourcing'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
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
                onClick={() => applyTemplate('product_showcase')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  selectedTemplate === 'product_showcase'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
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
                onClick={() => applyTemplate('custom')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  selectedTemplate === 'custom'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
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
              <label htmlFor="toEmail" className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5">
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
                <p className="mt-1 text-xs text-rose-500">Please enter a valid email format (e.g. name@domain.com).</p>
              )}
            </div>

            {/* Visitor Name */}
            <div>
              <label htmlFor="visitorName" className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5">
                Recipient / Visitor Name <span className="text-slate-400 font-normal lowercase">(optional personalization)</span>
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
              <label htmlFor="subject" className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5">
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
                <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wide text-slate-700">
                  Message Content <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400">Insert:</span>
                  <button
                    type="button"
                    onClick={() => handleInsertTag('{{visitorName}}')}
                    className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-200"
                  >
                    Visitor Name
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTag('{{stallNumber}}')}
                    className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-200"
                  >
                    Stall No.
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

            {/* Send copy to me option */}
            <div className="pt-1">
              <label
                htmlFor="sendCopyCheckbox"
                className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 hover:text-slate-900 select-none"
              >
                <input
                  type="checkbox"
                  id="sendCopyCheckbox"
                  checked={sendCopyToMe}
                  onChange={(e) => setSendCopyToMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span>
                  Send a copy to my registered email address (<strong>{exhibitor?.email || 'your email'}</strong>)
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary text-xs sm:text-sm py-2 px-4 flex items-center gap-1.5 text-slate-600"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Form
              </button>

              <button
                type="submit"
                disabled={!isFormValid || isSending}
                className="btn-primary py-2.5 px-6 flex items-center gap-2 font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Email Now
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Container */}
        <div className={`lg:col-span-5 ${activeTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
          <div className="sticky top-20 space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Eye className="h-4 w-4 text-blue-600" />
                Recipient Live Preview
              </div>
              <span className="text-[11px] rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 font-semibold">
                HTML Ready
              </span>
            </div>

            {/* Mock Email Card */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Email Client Header bar */}
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium w-16">From:</span>
                  <span className="font-semibold text-slate-700">MSME Sangamam Connect &lt;events@msmetn.org&gt;</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium w-16">Reply-To:</span>
                  <span className="font-semibold text-blue-600 truncate">{contactPerson} &lt;{exhibitor?.email || 'exhibitor@email.com'}&gt;</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium w-16">To:</span>
                  <span className="font-semibold text-slate-800 truncate">{toEmail || 'recipient@example.com'}</span>
                </div>
                {sendCopyToMe && exhibitor?.email && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="text-slate-400 font-medium w-16">CC (Copy):</span>
                    <span className="font-medium text-slate-700 truncate">{exhibitor.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 pt-0.5 border-t border-slate-200/60">
                  <span className="text-slate-400 font-medium w-16">Subject:</span>
                  <span className="font-bold text-slate-900 truncate">{subject || 'No Subject Specified'}</span>
                </div>
                {attachECard && (
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60 text-emerald-700 font-medium">
                    <Paperclip className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-[11px]">Attachment: <b>StallCard_{stallNum}.png</b> (High-Resolution Pass)</span>
                  </div>
                )}
              </div>

              {/* Rendered Email Body */}
              <div className="p-4 sm:p-5 bg-slate-50/50 text-slate-800">
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  {/* Event Header Banner */}
                  <div className="bg-gradient-to-r from-[#0B3B75] to-blue-800 p-4 text-white">
                    <h3 className="font-bold text-base m-0">MSME Sangamam Connect - Hosur 2026</h3>
                    <p className="text-[11px] text-blue-100 mt-0.5">Hosur | Business & Industrial Expo</p>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 text-xs sm:text-sm leading-relaxed space-y-3">
                    <p className="font-semibold text-slate-900">
                      Dear {visitorName.trim() || 'Valued Partner'},
                    </p>

                    <div className="whitespace-pre-wrap text-slate-700 py-1">
                      {message || 'Your composed message will appear here in real-time.'}
                    </div>

                    {/* Exhibitor Info Box */}
                    <div className="mt-4 rounded-lg border-l-4 border-[#0B3B75] bg-slate-50 p-3 text-xs space-y-1">
                      <p className="font-bold uppercase tracking-wider text-[#0B3B75] text-[11px]">
                        Exhibitor Information
                      </p>
                      <div className="grid grid-cols-3 gap-1 pt-1">
                        <span className="text-slate-500">Company:</span>
                        <span className="col-span-2 font-semibold text-slate-900">{companyDisplayName}</span>
                        <span className="text-slate-500">Contact:</span>
                        <span className="col-span-2 text-slate-800">{contactPerson}</span>
                        <span className="text-slate-500">Stall Number:</span>
                        <span className="col-span-2 font-bold text-[#0B3B75]">{stallNum}</span>
                        <span className="text-slate-500">Reply-To:</span>
                        <span className="col-span-2 text-blue-600 truncate">{exhibitor?.email || 'exhibitor@domain.com'}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                      Clicking <b>Reply</b> on this email will deliver directly to {contactPerson} at {exhibitor?.email || 'your email'}.
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="bg-slate-100 px-4 py-2.5 text-center text-[11px] text-slate-500 border-t border-slate-200">
                    MSME Sangamam Connect - Hosur 2026 • Official Digital Pass
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
                  <p className="text-xs font-bold text-slate-900">Visitor Email Logs</p>
                  <p className="text-[11px] text-slate-500">
                    {recentSent.length > 0
                      ? `${recentSent.length} email${recentSent.length > 1 ? 's' : ''} sent from your exhibitor account.`
                      : 'Audit and view all dispatched visitor emails.'}
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
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '672px',
          pointerEvents: 'none',
          opacity: 1,
          zIndex: -1,
        }}
      >
        <div
          ref={cardRef}
          className="w-[672px] bg-white p-1 rounded-2xl shadow-xl transition-all"
          style={{
            boxSizing: 'border-box',
            padding: '4px',
            width: '672px',
            backgroundColor: '#ffffff',
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
                  {exhibitor?.stallNumber || 'Allocation in Progress'}
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
              style={{ width: '100%' }}
            >
              {exhibitor?.companyLogo ? (
                <img
                  src={exhibitor.companyLogo}
                  alt="Company logo"
                  className="block h-28 w-full max-w-[280px] object-contain object-center"
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
                  <p className="text-sm font-bold text-slate-500">
                    {companyDisplayName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Company Logo
                  </p>
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
                    {exhibitor?.industryCategory || '-'}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-2.5 border border-blue-100/70 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Product Keywords
                  </p>
                  <p className="mt-1 font-bold text-sm text-slate-800 truncate">
                    {exhibitor?.productKeywords || '-'}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-2.5 border border-blue-100/70 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Manufacturing / Description
                  </p>
                  <p className="mt-1 font-bold text-sm text-slate-800 truncate">
                    {exhibitor?.manufacturing || '-'}
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
                    {contactPerson || '-'}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Email
                  </p>
                  <p className="mt-1 font-bold text-sm text-slate-900 break-all">
                    {exhibitor?.email || '-'}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Mobile
                  </p>
                  <p className="mt-1 font-bold text-sm text-slate-900">
                    {exhibitor?.mobile || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Venue & Date Section */}
            <div className="grid grid-cols-2 border-y border-blue-200 bg-slate-50">
              <div className="flex min-h-[75px] items-center justify-center p-4 text-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Venue</p>
                  <p className="font-extrabold text-sm text-slate-800 mt-0.5">Hotel Hills, Hosur</p>
                </div>
              </div>
              <div className="flex min-h-[75px] items-center justify-center border-l border-blue-200 p-4 text-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</p>
                  <p className="font-extrabold text-sm text-slate-800 mt-0.5">18 & 19 September 2026</p>
                </div>
              </div>
            </div>

            {/* Brand Logos Footer */}
            <div className="flex flex-row min-h-[140px] w-full bg-white">
              <div className="flex w-1/2 items-center justify-center p-5 border-r border-blue-200">
                <img
                  src={brandAsset('msme-sangamam-logo.png')}
                  alt="MSME Sangamam"
                  className="block h-20 w-full max-w-[240px] object-contain object-center"
                />
              </div>

              <div className="flex w-1/2 items-center justify-center p-5">
                <img
                  src={brandAsset('lub-logo.jpg')}
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
