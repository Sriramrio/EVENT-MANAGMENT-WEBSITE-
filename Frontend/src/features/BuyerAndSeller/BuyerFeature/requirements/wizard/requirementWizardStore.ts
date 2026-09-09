import { create } from 'zustand';
import type { HsnEntry } from '../../../../../services/referenceData/hooks';

export type RequirementType = 'Goods' | 'Services' | 'Consulting';
export type CodeType = 'ALL' | 'HSN' | 'SAC';

export interface ProcessItem {
  id: string;
  name: string;
  mandatory: 'Yes' | 'No';
  preference: '—' | 'Preferred' | 'Optional';
  notes: string;
  selected: boolean;
}

export interface TechnicalAttributeItem {
  id: string;
  name: string;
  operator: '=' | '>=' | '<=' | 'Between' | '>';
  value: string;
  unit: string;
  mandatory: 'Yes' | 'Preferred' | 'No';
}

export interface MaterialItem {
  id: string;
  material: string;
  grade: string;
  mandatory: 'Yes' | 'Preferred' | 'Optional';
}

export interface QualityComplianceItem {
  id: string;
  standard: string;
  mandatory: 'Yes' | 'Preferred' | 'Conditional';
  notes: 'Certification' | 'Document' | 'Report' | string;
}

export interface OperationItem {
  id: string;
  seq: number;
  operation: string;
  mandatory: 'Yes' | 'Preferred' | 'Optional';
  notes: string;
}

export interface AttachmentItem {
  id: string;
  name: string;
  size: string;
  type: string;
  dataBase64?: string;
}

export interface RequirementWizardState {
  requirementId: string | null;
  requirementCode: string | null;
  status: string;

  // Screen 01 — Step 1: Create New Requirement / Basic Info
  requirementType: RequirementType;
  title: string;
  internalRef: string;
  description: string;

  // Screen 02 — Step 2: Classification Selection
  segment: string;
  codeType: CodeType;
  mainCategory: string;
  mainCategoryCode: string;
  classification: string;
  classificationCode: string;
  hsnCode: string;
  hsnDescription: string;
  codeSystem: 'HSN' | 'SAC';
  recordId: string;
  hsn: (HsnEntry & { bestMatch?: boolean }) | null;

  // Screen 03 — Step 3: Intelligent Suggestions
  suggestionFilter: 'All' | 'Auto' | 'Recommended' | 'Optional' | 'Conditional' | 'Matching Only';
  selectedTagIds: string[];

  // Screen 04 — Step 4.1: Processes & Technical Attributes
  processes: ProcessItem[];
  technicalAttributes: TechnicalAttributeItem[];

  // Screen 05 — Step 4.2: Materials, Quality & Compliance
  materials: MaterialItem[];
  qualityCompliance: QualityComplianceItem[];

  // Screen 06 — Step 4.3: Operations, Quantity & UOM
  operations: OperationItem[];
  quantity: number;
  uom: string;

  // Screen 07 — Step 4.4: Delivery, Commercial & Additional
  deliveryLocation: string;
  needByDate: string;
  deliveryTerms: string;
  paymentTerms: string;
  closeDays: string;
  expectedRates: string;
  incoterms: string;
  attachments: AttachmentItem[];
  specialInstructions: string;

  // Screen 08 — Step 5: Review & Submit
  confirmedAccurate: boolean;

  // Legacy compatibility fields
  materialGrade?: string;
  maxComponentSize?: string;
  surfaceFinish?: string;
  requiredProcesses?: string[];
  drawingAvailable?: 'Yes' | 'No';
  certifications?: string[];
  minMachineCapacity?: number;
  minExperience?: string;
  considerOtherStates?: 'Yes' | 'No';
  moqQuantity?: number;
  moqUom?: string;
  keywords: string[];
  maxLeadTimeDays?: number;
  preferredStates?: string;
  budgetRange?: string;

  set: (patch: Partial<RequirementWizardState>) => void;
  reset: () => void;

  // Helpers for table row management
  addProcess: (item: Omit<ProcessItem, 'id'>) => void;
  updateProcess: (id: string, patch: Partial<ProcessItem>) => void;
  removeProcess: (id: string) => void;

  addAttribute: (item: Omit<TechnicalAttributeItem, 'id'>) => void;
  updateAttribute: (id: string, patch: Partial<TechnicalAttributeItem>) => void;
  removeAttribute: (id: string) => void;

  addMaterial: (item: Omit<MaterialItem, 'id'>) => void;
  updateMaterial: (id: string, patch: Partial<MaterialItem>) => void;
  removeMaterial: (id: string) => void;

  addQuality: (item: Omit<QualityComplianceItem, 'id'>) => void;
  updateQuality: (id: string, patch: Partial<QualityComplianceItem>) => void;
  removeQuality: (id: string) => void;

  addOperation: (item: Omit<OperationItem, 'id'>) => void;
  updateOperation: (id: string, patch: Partial<OperationItem>) => void;
  removeOperation: (id: string) => void;

  addAttachment: (item: AttachmentItem) => void;
  removeAttachment: (id: string) => void;
  setAttachments: (attachments: AttachmentItem[]) => void;
}

const initialValues = {
  requirementId: null,
  requirementCode: null,
  status: 'DRAFT',

  // Screen 01
  requirementType: 'Goods' as RequirementType,
  title: 'CNC Machining Components',
  internalRef: 'PR-2025-0001',
  description: 'We are looking to procure high precision CNC Machining components for automotive production expansion. The parts must meet tight dimensional tolerances and require VMC/HMC milling, turning, surface treatment, and complete inspection reports.',

  // Screen 02
  segment: 'Machine Tools & Production Equipment',
  codeType: 'HSN' as CodeType,
  mainCategory: 'Machine Tools & Metalworking Equipment',
  mainCategoryCode: 'MTE',
  classification: 'Machining Centres',
  classificationCode: 'MTE-MC',
  hsnCode: '84571000',
  hsnDescription: 'Machining centres',
  codeSystem: 'HSN' as const,
  recordId: 'MTL-0578',
  hsn: null,

  // Screen 03
  suggestionFilter: 'All' as const,
  selectedTagIds: [] as string[],

  // Screen 04
  processes: [] as ProcessItem[],
  technicalAttributes: [] as TechnicalAttributeItem[],

  // Screen 05
  materials: [] as MaterialItem[],
  qualityCompliance: [] as QualityComplianceItem[],

  // Screen 06
  operations: [] as OperationItem[],
  quantity: 100,
  uom: 'NOS',

  // Screen 07
  deliveryLocation: '',
  needByDate: '',
  deliveryTerms: 'EXW',
  paymentTerms: '',
  closeDays: '5 Days',
  expectedRates: '',
  incoterms: 'EXW',
  attachments: [] as AttachmentItem[],
  specialInstructions: '',

  // Screen 08
  confirmedAccurate: true,

  // Legacy
  materialGrade: '',
  maxComponentSize: '',
  surfaceFinish: '',
  requiredProcesses: ['CNC Machining', 'VMC', 'HMC', '5-Axis Machining'],
  drawingAvailable: 'Yes' as const,
  certifications: ['ISO 9001:2015', 'IATF 16949:2016'],
  minMachineCapacity: 2,
  minExperience: '3-5 Years',
  considerOtherStates: 'Yes' as const,
  moqQuantity: 1,
  moqUom: 'NOS',
  keywords: ['CNC', 'VMC', 'HMC', 'Automation', 'High Precision'],
  maxLeadTimeDays: 45,
  preferredStates: 'Tamil Nadu, Karnataka, Andhra Pradesh',
  budgetRange: '₹ 10 - 20 Lakhs',
};

export const useRequirementWizard = create<RequirementWizardState>((set) => ({
  ...initialValues,
  set: (patch) => set((state) => ({ ...state, ...patch })),
  reset: () => set({ ...initialValues, requirementId: null, requirementCode: null, status: 'DRAFT' }),

  addProcess: (item) =>
    set((state) => ({
      ...state,
      processes: [...state.processes, { ...item, id: `proc-${Date.now()}` }],
    })),

  updateProcess: (id, patch) =>
    set((state) => ({
      ...state,
      processes: state.processes.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),

  removeProcess: (id) =>
    set((state) => ({
      ...state,
      processes: state.processes.filter((p) => p.id !== id),
    })),

  addAttribute: (item) =>
    set((state) => ({
      ...state,
      technicalAttributes: [...state.technicalAttributes, { ...item, id: `attr-${Date.now()}` }],
    })),

  updateAttribute: (id, patch) =>
    set((state) => ({
      ...state,
      technicalAttributes: state.technicalAttributes.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    })),

  removeAttribute: (id) =>
    set((state) => ({
      ...state,
      technicalAttributes: state.technicalAttributes.filter((a) => a.id !== id),
    })),

  addMaterial: (item) =>
    set((state) => ({
      ...state,
      materials: [...state.materials, { ...item, id: `mat-${Date.now()}` }],
    })),

  updateMaterial: (id, patch) =>
    set((state) => ({
      ...state,
      materials: state.materials.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),

  removeMaterial: (id) =>
    set((state) => ({
      ...state,
      materials: state.materials.filter((m) => m.id !== id),
    })),

  addQuality: (item) =>
    set((state) => ({
      ...state,
      qualityCompliance: [...state.qualityCompliance, { ...item, id: `qual-${Date.now()}` }],
    })),

  updateQuality: (id, patch) =>
    set((state) => ({
      ...state,
      qualityCompliance: state.qualityCompliance.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    })),

  removeQuality: (id) =>
    set((state) => ({
      ...state,
      qualityCompliance: state.qualityCompliance.filter((q) => q.id !== id),
    })),

  addOperation: (item) =>
    set((state) => ({
      ...state,
      operations: [...state.operations, { ...item, id: `op-${Date.now()}` }],
    })),

  updateOperation: (id, patch) =>
    set((state) => ({
      ...state,
      operations: state.operations.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    })),

  removeOperation: (id) =>
    set((state) => ({
      ...state,
      operations: state.operations.filter((o) => o.id !== id),
    })),

  addAttachment: (item) =>
    set((state) => ({
      ...state,
      attachments: [...state.attachments, item],
    })),

  removeAttachment: (id) =>
    set((state) => ({
      ...state,
      attachments: state.attachments.filter((a) => a.id !== id),
    })),

  setAttachments: (attachments) =>
    set((state) => ({
      ...state,
      attachments,
    })),
}));