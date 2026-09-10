import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Edit3,
  Eye,
  RefreshCw,
  Copy,
  Check,
  Save,
  RotateCcw,
  Code,
  Sparkles,
  Smartphone,
  Monitor,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Bold,
  Italic,
  Underline,
  List,
  AlignLeft,
  AlignCenter,
  Key,
  Send,
  Plus,
  Trash2,
  Users,
  Building,
  Store,
  UserCheck,
  Crown,
  AtSign,
  Layers,
  Layers2
} from 'lucide-react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { RefreshListButton } from '../../../shared/components/RefreshListButton';
import {
  emailTemplateService,
  EmailTemplateDto,
  TemplatePlaceholderInfo,
  RecipientGroupSummary,
  RecipientSuggestion
} from '../../../services/emailTemplateService';

export interface EmailTemplatePageProps {
  mode?: 'all' | 'exhibitor';
}

const EXHIBITOR_TEMPLATE_CODES = [
  'EXHIBITOR_ADDITIONAL_REQUIREMENTS_SUBMITTED',
  'ADMIN_ADDITIONAL_REQUIREMENTS_ALERT',
  'EXHIBITOR_ADDITIONAL_REQUIREMENTS_STATUS_UPDATE',
  'EXHIBITOR_ACTION_REQUIRED'
];

const EMAIL_TEMPLATES_KEY = ['admin', 'email-templates'] as const;
const RECIPIENTS_SUMMARY_KEY = ['admin', 'email-recipients-summary'] as const;

export function EmailTemplatePage({ mode = 'all' }: EmailTemplatePageProps = {}) {
  const queryClient = useQueryClient();

  // Load Templates from Database
  const {
    data: initialTemplates = [],
    isLoading: queryLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: EMAIL_TEMPLATES_KEY,
    queryFn: () => emailTemplateService.getTemplates()
  });

  // Load Recipient Audience Stats
  const { data: recipientSummary, refetch: refetchRecipients } = useQuery<RecipientGroupSummary>({
    queryKey: RECIPIENTS_SUMMARY_KEY,
    queryFn: () => emailTemplateService.getRecipientSummary()
  });

  const fetchTemplates = () => {
    void refetch();
    void refetchRecipients();
  };

  const [templates, setTemplates] = useState<EmailTemplateDto[]>([]);
  const loading = queryLoading;
  const error = queryError ? (queryError as any)?.message || 'Failed to load email templates from server.' : null;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'credentials' | 'exhibitor' | 'custom'>('all');

  // Unified "Create / Edit / Send Email Template" Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'use'>('create');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Form Fields
  const [templateName, setTemplateName] = useState<string>('');
  const [templateCode, setTemplateCode] = useState<string>('');
  const [templateDescription, setTemplateDescription] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  // Recipient Dispatch Options
  const [sendOption, setSendOption] = useState<'save_only' | 'send_now'>('save_only');
  const [recipientType, setRecipientType] = useState<
    'all_exhibitors' | 'allocated_exhibitors' | 'all_visitors' | 'marketplace_buyers' | 'marketplace_sellers' | 'vips' | 'selected_recipients' | 'custom_list'
  >('all_exhibitors');
  const [customEmailsInput, setCustomEmailsInput] = useState<string>('');
  const [customEmailTags, setCustomEmailTags] = useState<string[]>([]);
  const [recipientSearchQuery, setRecipientSearchQuery] = useState<string>('');
  const [recipientSearchResults, setRecipientSearchResults] = useState<RecipientSuggestion[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<RecipientSuggestion[]>([]);

  // Editor Tabs & Live Preview
  const [activeTab, setActiveTab] = useState<'visual' | 'editor' | 'preview'>('visual');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [livePreviewSubject, setLivePreviewSubject] = useState<string>('');
  const [livePreviewHtml, setLivePreviewHtml] = useState<string>('');

  // Execution states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visualEditorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialTemplates.length > 0) {
      setTemplates(initialTemplates);
    }
  }, [initialTemplates]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  // Search recipients auto-suggest
  useEffect(() => {
    if (!recipientSearchQuery.trim()) {
      setRecipientSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await emailTemplateService.searchRecipients(recipientSearchQuery);
        setRecipientSearchResults(results);
      } catch (err) {
        console.error('Recipient search error', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [recipientSearchQuery]);

  // Open Unified Modal for New Template
  const openCreateModal = () => {
    setModalMode('create');
    setEditingTemplateId(null);
    setTemplateName('');
    setTemplateCode('');
    setTemplateDescription('');
    setSubject('');
    const defaultHtml = `<div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #1e293b; line-height: 1.6; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
  <div style="background: linear-gradient(135deg, #0B3B75 0%, #1e40af 100%); padding: 22px 28px; color: #ffffff;">
    <h2 style="margin: 0; font-size: 19px; font-weight: 700;">MSME Sangamam 2026</h2>
    <p style="margin: 4px 0 0 0; font-size: 13px; color: #e2e8f0;">Hosur | Business & Industrial Expo</p>
  </div>
  <div style="padding: 28px;">
    <p style="margin-top: 0; font-size: 16px; font-weight: 600; color: #0f172a;">
      Dear {{recipientName}},
    </p>
    <div style="font-size: 15px; color: #334155; line-height: 1.7; margin: 18px 0;">
      Write your personalized email content here. You can use dynamic tags like {{companyName}} and {{stallNumber}} which will automatically be replaced for each recipient.
    </div>
    <div style="margin-top: 24px; padding: 16px; background-color: #f8fafc; border-left: 4px solid #0B3B75; border-radius: 6px;">
      <p style="margin: 0; font-size: 13px; color: #475569;">
        <strong>Organization:</strong> {{companyName}}<br/>
        <strong>Stall Number:</strong> {{stallNumber}}
      </p>
    </div>
  </div>
</div>`;
    setHtmlContent(defaultHtml);
    setSendOption('save_only');
    setCustomEmailTags([]);
    setSelectedRecipients([]);
    setSuccessMessage('');
    setErrorMessage('');
    setActiveTab('visual');
    setShowModal(true);

    generateLivePreview('New Template Subject', defaultHtml);
    setTimeout(() => {
      if (visualEditorRef.current) {
        visualEditorRef.current.innerHTML = defaultHtml;
      }
    }, 50);
  };

  // Open Unified Modal for Existing Template (Use / Send / Edit)
  const openUseTemplateModal = (template: EmailTemplateDto, mode: 'use' | 'edit' = 'use') => {
    setModalMode(mode);
    setEditingTemplateId(template.id);
    setTemplateName(template.name);
    setTemplateCode(template.templateCode);
    setTemplateDescription(template.description);
    setSubject(template.subjectTemplate);
    setHtmlContent(template.bodyHtmlTemplate);
    setIsActive(template.isActive);
    setSendOption(mode === 'use' ? 'send_now' : 'save_only');
    setCustomEmailTags([]);
    setSelectedRecipients([]);
    setSuccessMessage('');
    setErrorMessage('');
    setActiveTab(mode === 'edit' ? 'visual' : 'visual');
    setShowModal(true);

    generateLivePreview(template.subjectTemplate, template.bodyHtmlTemplate);
    setTimeout(() => {
      if (visualEditorRef.current) {
        visualEditorRef.current.innerHTML = template.bodyHtmlTemplate;
      }
    }, 50);
  };

  const closeModal = () => {
    setShowModal(false);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const generateLivePreview = async (subj: string, html: string) => {
    try {
      const response = await emailTemplateService.previewTemplate({
        templateCode: templateCode || 'CUSTOM_PREVIEW',
        subjectTemplate: subj,
        bodyHtmlTemplate: html,
        sampleData: {
          recipientName: 'Ramesh Kumar',
          companyName: 'Acme Engineering Ltd',
          stallNumber: 'A-102',
          eventName: 'MSME Sangamam 2026',
          email: 'ramesh@example.com'
        }
      });
      setLivePreviewSubject(response.renderedSubject);
      setLivePreviewHtml(response.renderedHtml);
    } catch {
      let rSubject = subj
        .replace(/{{recipientName}}/gi, 'Ramesh Kumar')
        .replace(/{{companyName}}/gi, 'Acme Engineering Ltd')
        .replace(/{{stallNumber}}/gi, 'A-102')
        .replace(/{{eventName}}/gi, 'MSME Sangamam 2026');
      let rHtml = html
        .replace(/{{recipientName}}/gi, 'Ramesh Kumar')
        .replace(/{{companyName}}/gi, 'Acme Engineering Ltd')
        .replace(/{{stallNumber}}/gi, 'A-102')
        .replace(/{{eventName}}/gi, 'MSME Sangamam 2026');
      setLivePreviewSubject(rSubject);
      setLivePreviewHtml(rHtml);
    }
  };

  const handleInsertTag = (tag: string) => {
    if (activeTab === 'editor' && textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const newText = text.substring(0, start) + tag + text.substring(end);
      setHtmlContent(newText);
      generateLivePreview(subject, newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 50);
    } else if (activeTab === 'visual') {
      document.execCommand('insertText', false, tag);
      if (visualEditorRef.current) {
        const updatedHtml = visualEditorRef.current.innerHTML;
        setHtmlContent(updatedHtml);
        generateLivePreview(subject, updatedHtml);
      }
    } else {
      navigator.clipboard.writeText(tag);
      setCopiedTag(tag);
      setTimeout(() => setCopiedTag(null), 2000);
    }
  };

  const handleVisualFormat = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (visualEditorRef.current) {
      const updatedHtml = visualEditorRef.current.innerHTML;
      setHtmlContent(updatedHtml);
      generateLivePreview(subject, updatedHtml);
    }
  };

  const handleVisualInput = () => {
    if (visualEditorRef.current) {
      const updatedHtml = visualEditorRef.current.innerHTML;
      setHtmlContent(updatedHtml);
      generateLivePreview(subject, updatedHtml);
    }
  };

  const handleAddCustomEmailTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = customEmailsInput.trim().toLowerCase();
      if (val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        if (!customEmailTags.includes(val)) {
          setCustomEmailTags([...customEmailTags, val]);
        }
        setCustomEmailsInput('');
      }
    }
  };

  // 1. SAVE TO DATABASE ONLY
  const handleSaveTemplateToDb = async () => {
    if (!subject.trim()) {
      alert('Please enter an Email Subject.');
      return;
    }

    let finalHtml = htmlContent;
    if (activeTab === 'visual' && visualEditorRef.current) {
      finalHtml = visualEditorRef.current.innerHTML;
    }

    if (!finalHtml.trim()) {
      alert('Please enter Email Body content.');
      return;
    }

    const effectiveName = templateName.trim() || subject.trim();
    const effectiveCode = templateCode.trim() || effectiveName.replace(/[^a-zA-Z0-9_]+/g, '_').toUpperCase();

    try {
      setIsProcessing(true);
      setSuccessMessage('');
      setErrorMessage('');

      if (editingTemplateId && modalMode === 'edit') {
        // Update existing template
        const updated = await emailTemplateService.updateTemplate(editingTemplateId, {
          name: effectiveName,
          description: templateDescription.trim(),
          subjectTemplate: subject.trim(),
          bodyHtmlTemplate: finalHtml,
          isActive
        });
        setTemplates(prev => prev.map(t => (t.id === updated.id ? updated : t)));
        setSuccessMessage(`Template "${updated.name}" updated successfully in database!`);
      } else {
        // Create new template in DB
        const created = await emailTemplateService.createTemplate({
          templateCode: effectiveCode,
          name: effectiveName,
          description: templateDescription.trim() || 'Custom email template saved in database',
          subjectTemplate: subject.trim(),
          bodyHtmlTemplate: finalHtml,
          isActive: true
        });
        setTemplates(prev => [created, ...prev]);
        setSuccessMessage(`New Template "${created.name}" created and saved to database!`);
      }

      setTimeout(() => {
        setShowModal(false);
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save template to database.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. SAVE TO DB & DISPATCH EMAILS NOW
  const handleSaveAndSendEmail = async () => {
    if (!subject.trim()) {
      alert('Please enter an Email Subject.');
      return;
    }

    let finalHtml = htmlContent;
    if (activeTab === 'visual' && visualEditorRef.current) {
      finalHtml = visualEditorRef.current.innerHTML;
    }

    if (!finalHtml.trim()) {
      alert('Please enter Email Body content.');
      return;
    }

    // Verify recipient selection
    if (recipientType === 'custom_list' && customEmailTags.length === 0 && !customEmailsInput.trim()) {
      alert('Please enter at least one recipient email address.');
      return;
    }

    if (recipientType === 'selected_recipients' && selectedRecipients.length === 0) {
      alert('Please select at least one contact.');
      return;
    }

    let allCustomEmails = [...customEmailTags];
    if (customEmailsInput.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customEmailsInput.trim())) {
      allCustomEmails.push(customEmailsInput.trim().toLowerCase());
    }

    const effectiveName = templateName.trim() || subject.trim();
    const effectiveCode = templateCode.trim() || effectiveName.replace(/[^a-zA-Z0-9_]+/g, '_').toUpperCase();

    try {
      setIsProcessing(true);
      setSuccessMessage('');
      setErrorMessage('');

      const response = await emailTemplateService.sendCustomEmail({
        recipientType,
        customEmails: allCustomEmails,
        selectedRecipientEmails: selectedRecipients.map(r => r.email),
        subjectTemplate: subject.trim(),
        bodyHtmlTemplate: finalHtml,
        saveAsNewTemplate: true,
        newTemplateName: effectiveName,
        newTemplateCode: effectiveCode
      });

      setSuccessMessage(`${response.message} (Template saved to database).`);
      void refetch(); // refresh template list in UI

      setTimeout(() => {
        setShowModal(false);
      }, 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to dispatch email campaign.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteTemplate = async (template: EmailTemplateDto) => {
    if (!window.confirm(`Are you sure you want to delete template "${template.name}"?`)) {
      return;
    }

    try {
      await emailTemplateService.deleteTemplate(template.id);
      setTemplates(prev => prev.filter(t => t.id !== template.id));
      alert('Template deleted successfully.');
    } catch (err: any) {
      alert(err?.message || 'Failed to delete template.');
    }
  };

  const baseTemplates = useMemo(() => {
    if (mode === 'exhibitor') {
      return templates.filter(t =>
        EXHIBITOR_TEMPLATE_CODES.some(code => code.toLowerCase() === t.templateCode.toLowerCase())
      );
    }
    return templates;
  }, [templates, mode]);

  const filteredTemplates = useMemo(() => {
    let list = baseTemplates;
    if (categoryFilter === 'credentials') {
      list = list.filter(
        t => t.templateCode === 'MARKETPLACE_SEND_CREDENTIALS' || t.templateCode === 'MARKETPLACE_USER_WELCOME'
      );
    } else if (categoryFilter === 'exhibitor') {
      list = list.filter(t =>
        EXHIBITOR_TEMPLATE_CODES.some(code => code.toLowerCase() === t.templateCode.toLowerCase())
      );
    } else if (categoryFilter === 'custom') {
      list = list.filter(t => !t.isSystemTemplate);
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      t =>
        t.templateCode.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.subjectTemplate.toLowerCase().includes(q)
    );
  }, [baseTemplates, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={mode === 'exhibitor' ? 'Exhibitor Email Templates' : 'Email Templates Hub'}
          description="Create customized email templates, save them directly to database, customize recipients, and dispatch whenever needed."
        />

        <div className="flex items-center gap-3 shrink-0">
          <RefreshListButton onRefresh={fetchTemplates} loading={loading} />

          {/* MAIN SINGLE ACTION BUTTON */}
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={18} className="stroke-[2.5]" />
            Create Email Template
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-msme-blue">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Database Templates</p>
              <p className="text-xl font-bold text-slate-900">{baseTemplates.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Custom User Templates</p>
              <p className="text-xl font-bold text-slate-900">
                {baseTemplates.filter(t => !t.isSystemTemplate).length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates, subjects, names..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 transition focus:border-msme-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      {mode === 'all' && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${categoryFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
          >
            All Templates ({baseTemplates.length})
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('custom')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${categoryFilter === 'custom'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              }`}
          >
            <Sparkles size={13} />
            Custom Created Templates ({baseTemplates.filter(t => !t.isSystemTemplate).length})
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('credentials')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${categoryFilter === 'credentials'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100'
              }`}
          >
            <Key size={13} />
            Send Credentials
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('exhibitor')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${categoryFilter === 'exhibitor'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
          >
            Exhibitor Operations
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && baseTemplates.length === 0 && (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <RefreshCw size={32} className="animate-spin text-msme-blue mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading email templates from database...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 shadow-sm flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Failed to connect to database</h4>
            <p className="text-sm mt-1">{error}</p>
            <button onClick={fetchTemplates} className="mt-3 btn-secondary text-xs bg-white">
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Template Cards Grid */}
      {!loading && (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredTemplates.map(template => {
            const isCustom = !template.isSystemTemplate;
            return (
              <div
                key={template.id}
                className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${isCustom ? 'border-emerald-300 ring-2 ring-emerald-50' : 'border-slate-200'
                  }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold tracking-wide font-mono ${isCustom ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                          }`}
                      >
                        {template.templateCode}
                      </span>

                      {isCustom ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                          <Sparkles size={12} /> Custom Saved Template
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
                          <Layers size={12} /> System Template
                        </span>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${template.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${template.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {template.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-slate-900">{template.name}</h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{template.description}</p>

                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Subject Preview</p>
                    <p className="mt-1 text-xs font-medium text-slate-800 break-words font-mono line-clamp-2">
                      {template.subjectTemplate}
                    </p>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-[11px] text-slate-400">
                    Updated: {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString() : 'System'}
                  </span>

                  <div className="flex items-center gap-2">
                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(template)}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        title="Delete custom template"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}

                    <button
                      onClick={() => openUseTemplateModal(template, 'edit')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Edit3 size={13} /> Edit
                    </button>

                    <button
                      onClick={() => openUseTemplateModal(template, 'use')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-msme-blue px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      <Send size={13} /> Use & Send
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No results */}
      {!loading && filteredTemplates.length === 0 && (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Mail size={32} className="text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No email templates found</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Create your first custom email template with one click.</p>
          <button onClick={openCreateModal} className="btn-primary text-xs flex items-center gap-1.5">
            <Plus size={14} /> Create Email Template
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UNIFIED ALL-IN-ONE CREATE / EDIT / SEND TEMPLATE MODAL */}
      {/* ========================================================================= */}
      {showModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/80 p-3 sm:p-5 backdrop-blur-md overflow-hidden">
            <div className="flex h-[88vh] max-h-[820px] w-full max-w-6xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
              {/* Modal Header */}
              <div className="shrink-0 flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 px-6 py-3.5 text-white">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-md">
                    {modalMode === 'use' ? <Send size={20} /> : <Mail size={20} />}
                  </div>
                  <div>
                    <h2 className="text-base font-bold">
                      {modalMode === 'create'
                        ? 'Create New Email Template'
                        : modalMode === 'edit'
                          ? `Edit Template: ${templateName || templateCode}`
                          : `Use & Dispatch Template: ${templateName || templateCode}`}
                    </h2>
                    <p className="text-xs text-blue-200">
                      Compose email subject & content, customize recipients, and save into database for instant or future use.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body: Left Composer, Right Live Email Preview */}
              <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* LEFT COLUMN: Template Details, Content, Recipients (7 cols) */}
                  <div className="lg:col-span-7 space-y-4 min-w-0">
                    {/* Alerts */}
                    {successMessage && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 text-sm flex items-center gap-3 shadow-sm">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                        <span>{successMessage}</span>
                      </div>
                    )}
                    {errorMessage && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-sm flex items-center gap-3 shadow-sm">
                        <AlertCircle size={18} className="text-rose-600 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* 1. Template Metadata: Name & Subject */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Template Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Stall Allocation Welcome Note"
                            value={templateName}
                            onChange={e => setTemplateName(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-msme-blue focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Template Code (Unique DB Identifier)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. STALL_ALLOCATION_WELCOME"
                            value={templateCode}
                            onChange={e => setTemplateCode(e.target.value.toUpperCase())}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-mono font-semibold text-slate-900 focus:border-msme-blue focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Email Subject Line <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Welcome to MSME Sangamam 2026 - {{companyName}}"
                          value={subject}
                          onChange={e => {
                            setSubject(e.target.value);
                            generateLivePreview(e.target.value, htmlContent);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-msme-blue focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    {/* Dynamic Variables Pill Toolbar */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                          <Sparkles size={13} className="text-msme-blue" /> Dynamic Variables (Click to Insert)
                        </span>
                        <span className="text-[10px] text-slate-400">Auto-replaced per recipient</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {['{{recipientName}}', '{{companyName}}', '{{stallNumber}}', '{{eventName}}', '{{email}}', '{{date}}'].map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleInsertTag(tag)}
                            className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-mono font-semibold text-slate-700 hover:border-msme-blue hover:text-msme-blue transition shadow-2xs"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Content Editor Tabs (Visual / HTML) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('visual');
                              setTimeout(() => {
                                if (visualEditorRef.current) {
                                  visualEditorRef.current.innerHTML = htmlContent;
                                }
                              }, 50);
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${activeTab === 'visual' ? 'bg-msme-blue text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                              }`}
                          >
                            <FileText size={14} /> Visual Rich Editor
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (activeTab === 'visual' && visualEditorRef.current) {
                                setHtmlContent(visualEditorRef.current.innerHTML);
                              }
                              setActiveTab('editor');
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${activeTab === 'editor' ? 'bg-msme-blue text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                              }`}
                          >
                            <Code size={14} /> HTML Source Code
                          </button>
                        </div>
                      </div>

                      {activeTab === 'visual' && (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1.5 text-slate-700">
                            <button
                              type="button"
                              onClick={() => handleVisualFormat('bold')}
                              className="rounded-lg p-1.5 hover:bg-slate-200"
                              title="Bold"
                            >
                              <Bold size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVisualFormat('italic')}
                              className="rounded-lg p-1.5 hover:bg-slate-200"
                              title="Italic"
                            >
                              <Italic size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVisualFormat('underline')}
                              className="rounded-lg p-1.5 hover:bg-slate-200"
                              title="Underline"
                            >
                              <Underline size={14} />
                            </button>
                            <div className="h-4 w-[1px] bg-slate-300 mx-1" />
                            <button
                              type="button"
                              onClick={() => handleVisualFormat('insertUnorderedList')}
                              className="rounded-lg p-1.5 hover:bg-slate-200"
                              title="Bullet list"
                            >
                              <List size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVisualFormat('justifyLeft')}
                              className="rounded-lg p-1.5 hover:bg-slate-200"
                              title="Align Left"
                            >
                              <AlignLeft size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVisualFormat('justifyCenter')}
                              className="rounded-lg p-1.5 hover:bg-slate-200"
                              title="Align Center"
                            >
                              <AlignCenter size={14} />
                            </button>
                          </div>

                          <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-inner min-h-[180px] focus-within:ring-2 focus-within:ring-blue-100 transition">
                            <div
                              ref={visualEditorRef}
                              contentEditable
                              suppressContentEditableWarning
                              onInput={handleVisualInput}
                              onBlur={handleVisualInput}
                              className="prose max-w-none text-slate-900 outline-none text-sm"
                              style={{ minHeight: '150px' }}
                            />
                          </div>
                        </div>
                      )}

                      {activeTab === 'editor' && (
                        <textarea
                          ref={textareaRef}
                          value={htmlContent}
                          onChange={e => {
                            setHtmlContent(e.target.value);
                            generateLivePreview(subject, e.target.value);
                          }}
                          rows={8}
                          className="w-full rounded-2xl border border-slate-300 bg-slate-950 p-4 font-mono text-xs text-emerald-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          placeholder="<div>Type custom HTML email content here...</div>"
                        />
                      )}
                    </div>

                    {/* 3. Choose Action: Save to DB Only OR Save & Send to Audience */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Users size={14} className="text-msme-blue" />
                          Recipient Action
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSendOption('save_only')}
                          className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${sendOption === 'save_only'
                              ? 'border-emerald-600 bg-emerald-50/90 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold mb-1">
                            <Save size={14} className="text-emerald-600" />
                            Save to Database Only
                          </div>
                          <span className="text-[11px] text-slate-500 font-normal">
                            Save as reusable template in DB (do not send emails now)
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSendOption('send_now')}
                          className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${sendOption === 'send_now'
                              ? 'border-blue-600 bg-blue-50/90 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold mb-1">
                            <Send size={14} className="text-blue-600" />
                            Save to DB & Send to Recipients
                          </div>
                          <span className="text-[11px] text-slate-500 font-normal">
                            Save template and dispatch immediately to audience
                          </span>
                        </button>
                      </div>

                      {/* Recipient Audience Selector (if Send Now is chosen) */}
                      {sendOption === 'send_now' && (
                        <div className="pt-2 space-y-3 border-t border-slate-200 mt-2">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            Choose Recipient Target:
                          </label>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                              type="button"
                              onClick={() => setRecipientType('all_exhibitors')}
                              className={`p-2 rounded-xl border text-left text-xs font-semibold transition ${recipientType === 'all_exhibitors'
                                  ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                            >
                              <div className="flex items-center gap-1 mb-0.5">
                                <Store size={12} className="text-blue-600" />
                                Exhibitors
                              </div>
                              <span className="text-[10px] text-slate-500">
                                ({recipientSummary?.totalExhibitors || 0})
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setRecipientType('allocated_exhibitors')}
                              className={`p-2 rounded-xl border text-left text-xs font-semibold transition ${recipientType === 'allocated_exhibitors'
                                  ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                            >
                              <div className="flex items-center gap-1 mb-0.5">
                                <UserCheck size={12} className="text-emerald-600" />
                                Allocated Stalls
                              </div>
                              <span className="text-[10px] text-slate-500">
                                ({recipientSummary?.allocatedExhibitors || 0})
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setRecipientType('all_visitors')}
                              className={`p-2 rounded-xl border text-left text-xs font-semibold transition ${recipientType === 'all_visitors'
                                  ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                            >
                              <div className="flex items-center gap-1 mb-0.5">
                                <Users size={12} className="text-purple-600" />
                                All Visitors
                              </div>
                              <span className="text-[10px] text-slate-500">
                                ({recipientSummary?.totalVisitors || 0})
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setRecipientType('marketplace_buyers')}
                              className={`p-2 rounded-xl border text-left text-xs font-semibold transition ${recipientType === 'marketplace_buyers'
                                  ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                            >
                              <div className="flex items-center gap-1 mb-0.5">
                                <Building size={12} className="text-teal-600" />
                                Buyers
                              </div>
                              <span className="text-[10px] text-slate-500">
                                ({recipientSummary?.marketplaceBuyers || 0})
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setRecipientType('marketplace_sellers')}
                              className={`p-2 rounded-xl border text-left text-xs font-semibold transition ${recipientType === 'marketplace_sellers'
                                  ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                            >
                              <div className="flex items-center gap-1 mb-0.5">
                                <Building size={12} className="text-amber-600" />
                                Sellers
                              </div>
                              <span className="text-[10px] text-slate-500">
                                ({recipientSummary?.marketplaceSellers || 0})
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setRecipientType('vips')}
                              className={`p-2 rounded-xl border text-left text-xs font-semibold transition ${recipientType === 'vips'
                                  ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                            >
                              <div className="flex items-center gap-1 mb-0.5">
                                <Crown size={12} className="text-amber-500" />
                                VIPs
                              </div>
                              <span className="text-[10px] text-slate-500">
                                ({recipientSummary?.totalVips || 0})
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setRecipientType('selected_recipients')}
                              className={`p-2 rounded-xl border text-left text-xs font-semibold transition ${recipientType === 'selected_recipients'
                                  ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                            >
                              <div className="flex items-center gap-1 mb-0.5">
                                <Search size={12} className="text-indigo-600" />
                                Pick Contacts
                              </div>
                              <span className="text-[10px] text-slate-500">
                                ({selectedRecipients.length} chosen)
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setRecipientType('custom_list')}
                              className={`p-2 rounded-xl border text-left text-xs font-semibold transition ${recipientType === 'custom_list'
                                  ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                            >
                              <div className="flex items-center gap-1 mb-0.5">
                                <AtSign size={12} className="text-slate-600" />
                                Custom Emails
                              </div>
                              <span className="text-[10px] text-slate-500">
                                Manual input
                              </span>
                            </button>
                          </div>

                          {/* Search & Pick Individual Contacts */}
                          {recipientType === 'selected_recipients' && (
                            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                              <label className="text-xs font-bold text-slate-700">Search contacts by name or company:</label>
                              <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Type name, company, email..."
                                  value={recipientSearchQuery}
                                  onChange={e => setRecipientSearchQuery(e.target.value)}
                                  className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-msme-blue"
                                />
                              </div>

                              {/* Search Suggestions */}
                              {recipientSearchResults.length > 0 && (
                                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-lg bg-slate-50">
                                  {recipientSearchResults.map(res => {
                                    const isSelected = selectedRecipients.some(r => r.email === res.email);
                                    return (
                                      <div
                                        key={res.id + res.email}
                                        onClick={() => {
                                          if (isSelected) {
                                            setSelectedRecipients(selectedRecipients.filter(r => r.email !== res.email));
                                          } else {
                                            setSelectedRecipients([...selectedRecipients, res]);
                                          }
                                        }}
                                        className="flex items-center justify-between p-2 text-xs hover:bg-blue-50 cursor-pointer"
                                      >
                                        <div>
                                          <p className="font-semibold text-slate-800">{res.name} {res.company ? `(${res.company})` : ''}</p>
                                          <p className="text-[11px] text-slate-500">{res.email} • <span className="text-blue-600">{res.category}</span></p>
                                        </div>
                                        <input type="checkbox" checked={isSelected} readOnly className="rounded text-msme-blue" />
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Selected Badges */}
                              {selectedRecipients.length > 0 && (
                                <div className="pt-2">
                                  <p className="text-[11px] font-semibold text-slate-600 mb-1">Selected Contacts ({selectedRecipients.length}):</p>
                                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                    {selectedRecipients.map(r => (
                                      <span
                                        key={r.email}
                                        className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[11px]"
                                      >
                                        {r.name} &lt;{r.email}&gt;
                                        <button
                                          type="button"
                                          onClick={() => setSelectedRecipients(selectedRecipients.filter(x => x.email !== r.email))}
                                          className="text-blue-600 hover:text-blue-900"
                                        >
                                          <X size={12} />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Custom Direct Email Input Tags */}
                          {recipientType === 'custom_list' && (
                            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                              <label className="text-xs font-bold text-slate-700">Type email addresses and press Enter or comma:</label>
                              <input
                                type="email"
                                placeholder="e.g. director@company.com"
                                value={customEmailsInput}
                                onChange={e => setCustomEmailsInput(e.target.value)}
                                onKeyDown={handleAddCustomEmailTag}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-msme-blue"
                              />
                              {customEmailTags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1 max-h-24 overflow-y-auto">
                                  {customEmailTags.map(tag => (
                                    <span
                                      key={tag}
                                      className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-800 px-2.5 py-0.5 rounded-full text-xs font-mono"
                                    >
                                      {tag}
                                      <button
                                        type="button"
                                        onClick={() => setCustomEmailTags(customEmailTags.filter(t => t !== tag))}
                                        className="text-slate-400 hover:text-rose-600"
                                      >
                                        <X size={12} />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Live Real Email Preview (5 cols) */}
                  <div className="lg:col-span-5 space-y-3 min-w-0 lg:sticky lg:top-0">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <Eye size={14} className="text-msme-blue" />
                        Live Recipient Email Preview
                      </span>

                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setPreviewDevice('desktop')}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${previewDevice === 'desktop' ? 'bg-white text-msme-blue shadow-xs' : 'text-slate-500'
                            }`}
                        >
                          <Monitor size={12} /> Desktop
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewDevice('mobile')}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${previewDevice === 'mobile' ? 'bg-white text-msme-blue shadow-xs' : 'text-slate-500'
                            }`}
                        >
                          <Smartphone size={12} /> Mobile
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-100/60 p-3 flex justify-center">
                      <div
                        className={`bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden transition-all ${previewDevice === 'mobile' ? 'max-w-[340px] w-full' : 'w-full'
                          }`}
                      >
                        <div className="border-b border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
                          <div className="flex justify-between text-slate-400 text-[10px]">
                            <span>From: <strong>MSME Sangamam &lt;noreply@msmesangamam.com&gt;</strong></span>
                            <span>Today</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            To: <strong className="text-slate-700">Ramesh Kumar &lt;ramesh@example.com&gt;</strong>
                          </div>
                          <div className="font-bold text-slate-900 text-xs pt-1 truncate">
                            {livePreviewSubject || subject || 'No Subject Specified'}
                          </div>
                        </div>

                        <div
                          className="p-4 bg-white text-xs overflow-x-auto max-h-[420px] overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: livePreviewHtml || htmlContent }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="shrink-0 flex items-center justify-between border-t border-slate-200 bg-slate-50/95 px-6 py-3.5 shadow-xs">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-3">
                  {sendOption === 'save_only' ? (
                    <button
                      type="button"
                      onClick={handleSaveTemplateToDb}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      <Save size={15} className={isProcessing ? 'animate-spin' : ''} />
                      {isProcessing ? 'Saving Template...' : 'Save Template in Database'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveAndSendEmail}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50"
                    >
                      <Send size={15} className={isProcessing ? 'animate-spin' : ''} />
                      {isProcessing ? 'Dispatching & Saving...' : 'Save to DB & Send Email Now'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
