import { z } from 'zod';
const optionalUrl = z.union([z.literal(''), z.url()]);
export const organisationSchema = z.object({
  legalName: z.string().trim().min(2, 'Legal organisation name is required.'),
  gstin: z.string().trim().regex(/^[0-9A-Z]{15}$/, 'Enter a valid 15-character GSTIN.').optional().or(z.literal('')),
  pan: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Enter a valid PAN.').optional().or(z.literal('')),
  organisationType: z.string().min(1, 'Select organisation type.'), industry: z.string().min(1, 'Select industry.'), website: optionalUrl,
  establishmentYear: z.coerce.number().int().min(1900).max(new Date().getFullYear()), employeeBand: z.string().min(1), turnoverBand: z.string().min(1),
  registeredAddress: z.string().trim().min(10, 'Registered address is required.'), city: z.string().trim().min(2), state: z.string().min(1), postalCode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code.'), country: z.string().min(1)
});
export type OrganisationForm = z.infer<typeof organisationSchema>;
export const contactSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters.'),
  designation: z.string().trim().min(2, 'Designation is required.'),
  department: z.string().min(1, 'Department is required.'),
  email: z.string().trim().email('Enter a valid email address.').regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in)$/i, 'Email must end with .com or .in (e.g. user@domain.com or user@domain.in)'),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number starting with 6-9.'),
  alternateMobile: z.string().optional(),
  decisionRole: z.string().min(1, 'Select a decision role.'),
  communication: z.array(z.string()).min(1, 'Select at least one communication preference.'),
  consent: z.literal(true)
});
export type ContactForm = z.infer<typeof contactSchema>;
export const multiContactSchema = z.object({ contacts: z.array(contactSchema).min(1, 'Add at least one contact person.') });
export type MultiContactForm = z.infer<typeof multiContactSchema>;
// ---- Buyer "New Requirement" wizard (5 steps: Basic → Classification & Quantity → Technical Criteria → Commercial & Delivery → Review & Publish) ----
export const requirementBasicSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Requirement title is mandatory')
    .max(240, 'Title cannot exceed 240 characters'),

  description: z
    .string()
    .trim()
    .min(1, 'Requirement description is mandatory')
    .max(3000, 'Description cannot exceed 3000 characters'),

  segment: z
    .string()
    .trim()
    .min(1, 'Segment selection is mandatory'),

codeType: z.enum(['ALL', 'HSN', 'SAC']),  mainCategory: z
    .string()
    .trim()
    .min(1, 'Main category is mandatory'),

  classification: z
    .string()
    .trim()
    .min(1, 'Classification / Sub-category is mandatory'),

  deliveryLocation: z
    .string()
    .trim()
    .min(1, 'Delivery location is mandatory')
    .max(600, 'Location is too long'),

  needByDate: z
    .string()
    .min(1, 'Need By Date is mandatory')
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }),
});
export type RequirementBasicForm = z.infer<typeof requirementBasicSchema>;

export const classificationQuantitySchema = z.object({
  hsnCode: z.string().min(1, 'Search and select a product/service HSN or SAC code.'),
  quantity: z.coerce.number().positive('Quantity must be greater than zero.'),
  uom: z.string().min(1),
  keywords: z.array(z.string()).min(1, 'Add at least one process / keyword.'),
});
export type ClassificationQuantityForm = z.infer<typeof classificationQuantitySchema>;

export const technicalCriteriaSchema = z.object({
  materialGrade: z.string().optional(),
  maxComponentSize: z.string().optional(),
  surfaceFinish: z.string().optional(),
  requiredProcesses: z.array(z.string()).min(1, 'Add at least one required process / capability.'),
  drawingAvailable: z.enum(['Yes', 'No']),
  certifications: z.array(z.string()),
  minMachineCapacity: z.coerce.number().nonnegative().optional(),
  minExperience: z.string().min(1),
});
export type TechnicalCriteriaForm = z.infer<typeof technicalCriteriaSchema>;

export const commercialDeliverySchema = z.object({
  needByDate: z.string().min(1, 'Need by date is required.'),
  deliveryLocation: z.string().trim().min(2, 'Delivery location is required.'),
  deliveryTerms: z.string().min(1),
  maxLeadTimeDays: z.coerce.number().positive('Max lead time must be greater than zero.'),
  preferredStates: z.string().optional(),
  considerOtherStates: z.enum(['Yes', 'No']),
  budgetRange: z.string().optional(),
  moqQuantity: z.coerce.number().positive().optional(),
  moqUom: z.string().min(1),
}).superRefine((v, ctx) => { if (v.needByDate && new Date(v.needByDate + 'T00:00:00') <= new Date()) { ctx.addIssue({ code: 'custom', path: ['needByDate'], message: 'Needed-by date must be in the future.' }); } });
export type CommercialDeliveryForm = z.infer<typeof commercialDeliverySchema>;
