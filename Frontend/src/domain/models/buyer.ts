export type EntityId = string;
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';
export interface Money { amount: number; currency: 'INR' | 'USD' | 'EUR' | string; }
export interface BuyerSession {
  userId: EntityId;
  buyerOrganisationId: EntityId;
  displayName: string;
  role: 'Buyer' | 'BuyerAdmin';
  organisationName: string;
  eventId: EntityId;
  eventName: string;
  permissions: string[];
  unreadNotifications: number;
}
export interface BuyerOrganisation {
  id: EntityId;
  legalName: string;
  gstin?: string;
  pan?: string;
  organisationType: string;
  industry: string;
  website?: string;
  establishmentYear: number;
  employeeBand: string;
  turnoverBand: string;
  registeredAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  version: number;
}
export interface BuyerContact { id: EntityId; fullName: string; designation: string; department: string; email: string; mobile: string; communication: string[]; decisionRole: string; }
export interface Requirement {
  id: EntityId; code: string; title: string; sourcingType: 'Product'|'Service'|'Works'; category: string; subcategory: string;
  quantity: number; unit: string; neededBy: string; preferredLocation: string; description: string; status: string;
  matchCount: number; averageMatch: number; updatedAt: string; confidentiality: string; budget?: Money; version: number;
  detailsJson?: Record<string, any>;
}
export interface MatchDimension { dimensionCode: string; label: string; score: number; maxScore: number; weight: number; explanation: string; evidenceRefs: string[]; }
export interface SupplierMatch { id: EntityId; requirementId: EntityId; supplierId: EntityId; capabilityId?: EntityId; supplierName: string; overallScore: number; eligibility: 'Eligible'|'Partial'|'Excluded'; location: string; capability: string; strengths: string[]; verifiedCertifications: string[]; dimensions: MatchDimension[]; }
export interface Supplier { id: EntityId; name: string; location: string; industry: string; employees: string; certifications: string[]; capabilities: string[]; capabilityId?: EntityId; qualityScore: number; deliveryScore: number; technicalScore: number; responseScore: number; visibility: 'full'|'masked'; }
export interface Meeting { id: EntityId; engagementId: EntityId; meetingNo: string; supplierId: EntityId; supplierName: string; requirementId: EntityId; requirementCode: string; requirementTitle: string; date: string; startTime: string; endTime: string; timezone: string; status: string; mode: string; agenda: string; venue: string; version: number; }
export interface MeetingOutcomeRecord { outcome: string; notes: string; }
export interface MeetingActionItemRecord { id: EntityId; title: string; ownerUserId?: string; dueDate?: string; status: string; }
export interface ActionItem { id: EntityId; action: string; relatedTo: string; owner: string; dueDate: string; status: string; priority: string; }
export interface Rfq { id: EntityId; code: string; requirement: string; suppliers: number; sentDate: string; dueDate: string; responses: number; status: string; }
export interface Sample { id: EntityId; sampleCode: string; requirement: string; supplier: string; requestedOn: string; expectedOn: string; submittedOn?: string; status: string; }
export interface Qualification { id: EntityId; supplier: string; requirement: string; stage: string; status: string; updatedAt: string; }
export interface Evaluation { id: EntityId; supplier: string; requirement: string; totalScore: number; status: string; updatedAt: string; }
export interface Onboarding { id: EntityId; supplier: string; requirement: string; stage: string; startedOn: string; status: string; }
export interface Audit { id: EntityId; supplier: string; type: string; auditDate: string; auditor: string; status: string; report: boolean; }
export interface Negotiation { id: EntityId; supplier: string; requirement: string; stage: string; expectedValue: Money; owner: string; nextFollowUp: string; }
export interface PurchaseOrder { id: EntityId; code: string; supplier: string; requirement: string; poDate: string; value: Money; status: string; receiptState: string; sourceSystem: 'Portal'|'External ERP'; }
export interface Engagement { id: EntityId; requirementId: EntityId; requirementNo: string; requirementTitle: string; buyerOrganizationId: EntityId; buyerOrganizationName: string; capabilityId: EntityId; sellerOrganizationId: EntityId; sellerOrganizationName: string; stage: string; updatedAt: string; createdAt: string; }
export interface EngagementMessage { id: EntityId; engagementId: EntityId; senderOrganizationId: EntityId; message: string; sentAt: string; }
export interface Notification { id: EntityId; type: string; title: string; timestamp: string; read: boolean; href: string; }
export interface ReportItem { id: EntityId; name: string; generatedAt: string; status: 'Ready'|'Generating'|'Failed'; }