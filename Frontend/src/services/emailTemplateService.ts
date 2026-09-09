import { apiClient } from '../data/api/apiClient';

export interface TemplatePlaceholderInfo {
  tag: string;
  label: string;
  description: string;
  exampleValue: string;
}

export interface EmailTemplateDto {
  id: string;
  templateCode: string;
  name: string;
  description: string;
  subjectTemplate: string;
  bodyHtmlTemplate: string;
  bodyTextTemplate: string;
  isActive: boolean;
  isSystemTemplate?: boolean;
  updatedAt?: string;
  placeholders: TemplatePlaceholderInfo[];
}

export interface CreateEmailTemplateRequest {
  templateCode: string;
  name: string;
  description: string;
  subjectTemplate: string;
  bodyHtmlTemplate: string;
  bodyTextTemplate?: string;
  isActive?: boolean;
}

export interface UpdateEmailTemplateRequest {
  name?: string;
  description?: string;
  subjectTemplate: string;
  bodyHtmlTemplate: string;
  bodyTextTemplate?: string;
  isActive?: boolean;
}

export interface PreviewEmailTemplateRequest {
  templateCode: string;
  subjectTemplate: string;
  bodyHtmlTemplate: string;
  sampleData?: Record<string, string>;
}

export interface PreviewEmailTemplateResponse {
  renderedSubject: string;
  renderedHtml: string;
}

export interface RecipientGroupSummary {
  totalExhibitors: number;
  allocatedExhibitors: number;
  totalVisitors: number;
  marketplaceBuyers: number;
  marketplaceSellers: number;
  totalVips: number;
}

export interface RecipientSuggestion {
  id: string;
  name: string;
  email: string;
  category: string;
  company?: string;
  extraInfo?: string;
}

export interface SendCustomEmailRequest {
  recipientType: 'custom_list' | 'all_exhibitors' | 'allocated_exhibitors' | 'all_visitors' | 'marketplace_buyers' | 'marketplace_sellers' | 'vips' | 'selected_recipients';
  customEmails: string[];
  selectedRecipientEmails: string[];
  subjectTemplate: string;
  bodyHtmlTemplate: string;
  replyToEmail?: string;
  replyToName?: string;
  templateCode?: string;
  saveAsNewTemplate?: boolean;
  newTemplateCode?: string;
  newTemplateName?: string;
  newTemplateDescription?: string;
}

export interface SendCustomEmailResponse {
  totalTargeted: number;
  totalSent: number;
  totalFailed: number;
  errors: string[];
  message: string;
  sentAt: string;
}

export const emailTemplateService = {
  getTemplates: (): Promise<EmailTemplateDto[]> => {
    return apiClient.get<EmailTemplateDto[]>('/admin/email-templates');
  },

  getTemplateById: (id: string): Promise<EmailTemplateDto> => {
    return apiClient.get<EmailTemplateDto>(`/admin/email-templates/${id}`);
  },

  createTemplate: (data: CreateEmailTemplateRequest): Promise<EmailTemplateDto> => {
    return apiClient.post<EmailTemplateDto>('/admin/email-templates', data);
  },

  updateTemplate: (id: string, data: UpdateEmailTemplateRequest): Promise<EmailTemplateDto> => {
    return apiClient.put<EmailTemplateDto>(`/admin/email-templates/${id}`, data);
  },

  deleteTemplate: (id: string): Promise<void> => {
    return apiClient.delete<void>(`/admin/email-templates/${id}`);
  },

  previewTemplate: (data: PreviewEmailTemplateRequest): Promise<PreviewEmailTemplateResponse> => {
    return apiClient.post<PreviewEmailTemplateResponse>('/admin/email-templates/preview', data);
  },

  resetTemplate: (id: string): Promise<EmailTemplateDto> => {
    return apiClient.post<EmailTemplateDto>(`/admin/email-templates/${id}/reset`);
  },

  getRecipientSummary: (): Promise<RecipientGroupSummary> => {
    return apiClient.get<RecipientGroupSummary>('/admin/email-templates/recipients/summary');
  },

  searchRecipients: (query: string = '', category: string = ''): Promise<RecipientSuggestion[]> => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (category) params.append('category', category);
    const queryString = params.toString();
    return apiClient.get<RecipientSuggestion[]>(`/admin/email-templates/recipients/search${queryString ? `?${queryString}` : ''}`);
  },

  sendCustomEmail: (data: SendCustomEmailRequest): Promise<SendCustomEmailResponse> => {
    return apiClient.post<SendCustomEmailResponse>('/admin/email-templates/send-custom', data);
  }
};
