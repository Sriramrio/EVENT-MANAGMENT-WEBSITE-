import { useState, useEffect, useMemo } from 'react';
import {
  Mail,
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
  Store
} from 'lucide-react';
import { exhibitorApiClient } from '../../data/api/exhibitorApiClient';

interface ExhibitorDetails {
  companyName: string;
  legalName?: string;
  registrationNumber: string | null;
  stallNumber: string | null;
  contactPersonName?: string;
  email: string;
  mobile?: string;
}

interface SentEmailRecord {
  id: string;
  toEmail: string;
  visitorName: string;
  subject: string;
  sentAt: string;
}

type TemplateKey = 'stall_invitation' | 'business_connect' | 'custom';

export function ExhibitorSendEmailPage() {
  const [exhibitor, setExhibitor] = useState<ExhibitorDetails | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Form State
  const [toEmail, setToEmail] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>('stall_invitation');

  // UI state
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'compose' | 'preview'>('compose');
  const [recentSent, setRecentSent] = useState<SentEmailRecord[]>([]);

  const applyTemplate = (key: TemplateKey, details?: ExhibitorDetails | null) => {
    const prof = details ?? exhibitor;
    const comp = prof?.companyName || prof?.legalName || 'Our Company';
    const sNum = prof?.stallNumber || 'our stall';

    setSelectedTemplate(key);
    if (key === 'stall_invitation') {
      setSubject(`Invitation to visit ${comp} (Stall ${sNum}) at MSME Sangamam 2026`);
      setMessage(
        `We cordially invite you to visit our stall at MSME Sangamam 2026 in Hosur.\n\nWe will be showcasing our latest products, engineering solutions, and manufacturing capabilities. Our leadership and technical team will be available to discuss how we can partner together.\n\nWe look forward to meeting you in person at Stall ${sNum}!`
      );
    } else if (key === 'business_connect') {
      setSubject(`Business Connect & Collaboration from ${comp} - MSME Sangamam 2026`);
      setMessage(
        `Thank you for connecting with us at MSME Sangamam 2026.\n\nWe would like to introduce our organization and explore potential supply, vendor, and subcontracting opportunities with your esteemed firm.\n\nPlease let us know a convenient date and time to schedule a brief follow-up call or meeting.`
      );
    } else {
      setSubject(`Message from ${comp} - MSME Sangamam 2026`);
      setMessage('');
    }
  };

  // Load exhibitor profile on mount
  useEffect(() => {
    exhibitorApiClient
      .get<ExhibitorDetails>('/exhibitor/me')
      .then((data) => {
        setExhibitor(data);
        setIsLoadingProfile(false);
        applyTemplate('stall_invitation', data);
      })
      .catch(() => {
        setIsLoadingProfile(false);
        setErrorMessage('Unable to load exhibitor account details.');
      });
  }, []);

  const companyDisplayName = useMemo(() => {
    return exhibitor?.companyName || exhibitor?.legalName || 'Our Company';
  }, [exhibitor]);

  const contactPerson = useMemo(() => {
    return exhibitor?.contactPersonName || 'Exhibitor Representative';
  }, [exhibitor]);

  const stallNum = useMemo(() => {
    return exhibitor?.stallNumber || 'Assigned Stall';
  }, [exhibitor]);

  const handleInsertTag = (tag: string) => {
    setMessage((prev) => `${prev} ${tag}`);
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const isFormValid = useMemo(() => {
    return isValidEmail(toEmail) && subject.trim().length > 0 && message.trim().length > 0;
  }, [toEmail, subject, message]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSending) return;

    setIsSending(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const payload = {
        toEmail: toEmail.trim(),
        visitorName: visitorName.trim() || undefined,
        subject: subject.trim(),
        message: message.trim()
      };

      const res = await exhibitorApiClient.post<{
        message: string;
        toEmail: string;
        replyToEmail: string;
        subject: string;
        sentAt: string;
      }>('/exhibitor/send-email', payload);

      setSuccessMessage(`Email successfully dispatched to ${res.toEmail}! Any replies will be delivered directly to your inbox (${res.replyToEmail}).`);
      
      setRecentSent((prev) => [
        {
          id: crypto.randomUUID(),
          toEmail: res.toEmail,
          visitorName: visitorName.trim() || 'Visitor',
          subject: res.subject,
          sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...prev
      ]);

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
                Compose and send personalized invitations and follow-ups directly to visitors and clients.
              </p>
            </div>
          </div>
        </div>

        {exhibitor?.email && (
          <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Replies directed to: <strong className="text-slate-900 font-semibold">{exhibitor.email}</strong></span>
          </div>
        )}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                <span className="text-[11px] text-slate-500 leading-tight">
                  Invite visitors to your assigned stall
                </span>
              </button>

              <button
                type="button"
                onClick={() => applyTemplate('business_connect')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  selectedTemplate === 'business_connect'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                  <Building className="h-3.5 w-3.5 text-blue-600" />
                  Business Connect
                </div>
                <span className="text-[11px] text-slate-500 leading-tight">
                  B2B partnership follow-up
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
                  Custom Message
                </div>
                <span className="text-[11px] text-slate-500 leading-tight">
                  Write freely from scratch
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
                  <span className="text-[11px] text-slate-400">Quick Tags:</span>
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

            {/* Action Buttons */}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary text-xs sm:text-sm py-2 px-4 flex items-center gap-1.5 text-slate-600"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
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
                  <span className="text-slate-400 font-medium w-12">From:</span>
                  <span className="font-semibold text-slate-700">MSME Sangamam Connect &lt;eventBookMail&gt;</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium w-12">Reply-To:</span>
                  <span className="font-semibold text-blue-600">{contactPerson} &lt;{exhibitor?.email || 'exhibitor@email.com'}&gt;</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium w-12">To:</span>
                  <span className="font-semibold text-slate-800">{toEmail || 'recipient@example.com'}</span>
                </div>
                <div className="flex items-center gap-1.5 pt-0.5 border-t border-slate-200/60">
                  <span className="text-slate-400 font-medium w-12">Subject:</span>
                  <span className="font-bold text-slate-900 truncate">{subject || 'No Subject Specified'}</span>
                </div>
              </div>

              {/* Rendered Email Body */}
              <div className="p-5 sm:p-6 bg-slate-50/50 text-slate-800">
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  {/* Event Header Banner */}
                  <div className="bg-gradient-to-r from-[#0B3B75] to-blue-800 p-4 text-white">
                    <h3 className="font-bold text-base m-0">MSME Sangamam 2026</h3>
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
                    Digital supported by Atribs
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Sent Session List */}
            {recentSent.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  Sent This Session ({recentSent.length})
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {recentSent.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <div className="truncate">
                        <span className="font-semibold text-slate-800 block truncate">{item.toEmail}</span>
                        <span className="text-slate-400 text-[11px] block truncate">{item.subject}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">{item.sentAt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExhibitorSendEmailPage;
