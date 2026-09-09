export type UUID = string;

export type BookingStatus =
  | 'Draft'
  | 'Submitted'
  | 'UnderReview'
  | 'BlockedAwaitingPayment'
  | 'PaymentSubmitted'
  | 'PaymentVerified'
  | 'PaymentRejected'
  | 'Confirmed'
  | 'ReleasedDueToNonPayment'
  | 'Cancelled'
  | 'Closed';

export type StallStatus = 'Available' | 'Blocked' | 'Frozen' | 'Released' | 'Cancelled' | 'Disabled' | 'Reservation';
export type AllocationStatus = 'Blocked' | 'Frozen' | 'Released' | 'Cancelled' | 'Changed';
export type PaymentStatus = 'Pending' | 'Submitted' | 'Verified' | 'Rejected' | 'ClarificationRequired';
export type InvoiceStatus = 'Draft' | 'Generated' | 'Sent' | 'Cancelled' | 'Revised';

export interface Tenant {
  id: UUID;
  code: string;
  name: string;
  legalName: string;
}

export interface EventRecord {
  id: UUID;
  tenantId: UUID;
  eventCode: string;
  eventName: string;
  venueName: string;
  stallBlockValidityDays: number;
  defaultGstPercentage: number;
}

export interface StallSize {
  id: UUID;
  tenantId: UUID;
  eventId: UUID;
  code: string;
  displayName: string;
  widthM: number;
  depthM: number;
  baseAmount: number;
  gstPercentage: number;
  totalAmount: number;
}

export interface Stall {
  id: UUID;
  tenantId: UUID;
  eventId: UUID;
  stallSizeId: UUID;
  stallNumber: string;
  currentStatus: StallStatus;
  currentBookingId?: UUID | null;
  sourceRow?: number;
  isSponsor?: boolean;

}

export interface Exhibitor {
  id: UUID;
  tenantId: UUID;
  legalName: string;
  tradeName?: string;
  registeredAddress: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  country: string;
  contactPersonName: string;
  contactPersonDesignation: string;
  mobile: string;
  email: string;
  industryScale: string;
  businessType: string;
  companyConstitution: string;
  industryCategory: string;
  productServiceDescription: string;
  productKeywords: string;
  udyamNumber: string;
  gstin: string;
  pan: string;
  lubMember: boolean;
  lubState: string;
  lubChapter: string;
  lubMembershipNumber?: string | null;
}

export interface BillingProfile {
  id: UUID;
  tenantId: UUID;
  exhibitorId: UUID;
  billingLegalName: string;
  billingAddress: string;
  billingState: string;
  billingStateCode: string;
  billingGstin: string;
  billingPan: string;
  placeOfSupply: string;
  billingEmail: string;
  billingMobile: string;
  isDefault: boolean;
}

export interface StallBooking {
  id: UUID;
  tenantId: UUID;
  eventId: UUID;
  exhibitorId: UUID;
  billingProfileId: UUID;
  requestedStallSizeId: UUID;
  allocatedStallId?: UUID | null;
  bookingRegistrationNumber: string;
  bookingDate: string;
  bookingStatus: BookingStatus;
  district?: string;
  fasciaName: string;
  displayNotes?: string | null;
  blockExpiresAt?: string | null;
  lastEmailSentAt?: string | null;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  companyName?: string;
  contactPerson?: string;
  email?: string;
  mobile?: string;
  panNumber?: string | null;
  udyamRegistrationNumber?: string | null;
  gstin?: string | null;
  registeredAddress?: string | null;
  city?: string | null;
  industryCategory?: string | null;
  productKeywords?: string | null;
  businessType?: string | null;
  stallNumber?: string | null;
  stallSizeCode?: string;
  stallSizeName?: string;
  expectedAmount?: number;
  stallOption1Id?: UUID | null;
  stallOption2Id?: UUID | null;
  stallOption1Number?: string | null;
  stallOption2Number?: string | null;
  companyLogo?:string;
  totalPaidAmount?: number;
  balanceDueAmount?: number;  
  lubMember?: boolean;
  tanNumber?: string | null;
}


export interface StallAllocation {
  id: UUID;
  tenantId: UUID;
  eventId: UUID;
  bookingId: UUID;
  stallId: UUID;
  allocationStatus: AllocationStatus;
  blockedAt: string;
  blockedBy: UUID;
  blockExpiresAt: string;
  frozenAt?: string | null;
  frozenBy?: UUID | null;
  releasedAt?: string | null;
  releasedBy?: UUID | null;
  releaseReason?: string | null;
}

export interface Payment {
  id: UUID;
  tenantId: UUID;
  eventId: UUID;
  bookingId: UUID;
  paymentReferenceNumber: string;
  paymentMode: string;
  payerName: string;
  payerBank?: string | null;
  amountPaid: number;
  paymentDate: string;
  paymentReceivedDate?: string | null;
  bankAccountMatched: boolean;
  verificationStatus: PaymentStatus;
  verifiedBy?: UUID | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  remarks?: string | null;
   isTdsDeductable?: boolean;
}

export interface ProformaInvoice {
  id: UUID;
  tenantId: UUID;
  eventId: UUID;
  bookingId: UUID;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceStatus: InvoiceStatus;
  sellerLegalName: string;
  sellerAddress: string;
  sellerGstin: string;
  sellerPan: string;
  buyerLegalName: string;
  buyerAddress: string;
  buyerGstin: string;
  buyerPan: string;
  placeOfSupply: string;
  stallNumber: string;
  stallSizeDisplay: string;
  hsnSac: string;
  description: string;
  baseAmount: number;
  gstPercentage: number;
  gstAmount: number;
  totalAmount: number;
  amountInWords: string;
  taxAmountInWords: string;
  notes: string;
  bankAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  ifscCode: string;
  branchName: string;
  generatedAt: string;
  sentAt?: string | null;
  taxInvoiceNumber?: string;
isTdsDeductable?:boolean;

}

export interface EmailLog {
  id: UUID;
  tenantId: UUID;
  eventId: UUID;
  bookingId?: UUID | null;
  toEmail: string;
  subject: string;
  bodySnapshot: string;
  templateCode: string;
  status: 'Pending' | 'Sent' | 'Failed' | 'Retrying';
  sentAt?: string | null;
}

export interface AuditLog {
  id: UUID;
  tenantId: UUID;
  eventId?: UUID | null;
  actorUserId?: UUID | null;
  entityName: string;
  entityId: UUID;
  entityDisplayName?: string;
  action: string;
  actorName?: string;
  oldValues?: unknown;
  newValues?: unknown;
  oldValuesJson?: unknown;
  newValuesJson?: unknown;
  occurredAt: string;
}

export interface User {
  id: UUID;
  tenantId: UUID;
  fullName: string;
  email: string;
  roleCode: string;
  permissions: string[];
  organizationType?:string;
}
