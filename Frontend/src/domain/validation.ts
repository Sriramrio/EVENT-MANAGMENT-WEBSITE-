import { z } from 'zod';

const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const mobileRegex = /^(\+91[-\s]?)?[6-9][0-9]{9}$/;
const udyamRegex = /^(UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}|UAM-[A-Z]{2}-[0-9]{2}-[0-9]{7})$/;

export const exhibitorSchema = z.object({
  legalName: z.string().min(2).max(150),
  tradeName: z.string().max(150).optional(),
  registeredAddress: z.string().min(5).max(500),
  city: z.string().min(2),
  district: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
  country: z.string().min(2),
  contactPersonName: z.string().min(2).max(100),
  contactPersonDesignation: z.string().min(2).max(100),
  mobile: z.string().regex(mobileRegex),
  email: z.string().email(),
  industryScale: z.string().min(2),
  businessType: z.string().min(2),
  companyConstitution: z.string().min(2),
  industryCategory: z.string().min(2),
  productServiceDescription: z.string().min(5).max(1000),
  productKeywords: z.string().min(2).max(250),
  udyamNumber: z.string().transform(v => v.toUpperCase()).pipe(z.string().regex(udyamRegex)),
  gstin: z.string().transform(v => v.toUpperCase()).pipe(z.string().regex(gstRegex)),
  pan: z.string().transform(v => v.toUpperCase()).pipe(z.string().regex(panRegex)),
  lubMember: z.boolean(),
  lubState: z.string().min(2),
  lubChapter: z.string().min(2),
  lubMembershipNumber: z.string().optional().nullable()
});

export const bookingComplianceSchema = z.object({
  requestedStallSizeId: z.string().uuid(),
  fasciaName: z.string().min(1).max(25),
  termsAccepted: z.literal(true),
  accuracyAccepted: z.literal(true),
  paymentTimelineAccepted: z.literal(true),
  cancellationPolicyAccepted: z.literal(true),
  privacyConsentAccepted: z.literal(true)
});

export const paymentSchema = z.object({
  paymentReferenceNumber: z.string().min(4),
  paymentMode: z.enum(['NEFT', 'RTGS', 'IMPS', 'UPI', 'Cheque', 'Cash', 'Other']),
  payerName: z.string().min(2),
  amountPaid: z.number().positive(),
  paymentDate: z.string().min(10)
});
