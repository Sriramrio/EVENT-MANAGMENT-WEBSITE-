import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Download, FileSpreadsheet, Info, Phone, Upload, X, EyeIcon, CheckCircle2 } from 'lucide-react'; import { BRAND } from '../../config/brand';
import { appConfig } from '../../config/appConfig';
import { apiClient, ApiError } from '../../data/api/apiClient';
import { BrandHeader } from '../../shared/components/BrandHeader';
import { FloatingSupportFooter } from '../../components/BaseComponents/FloatingSupportFooter';
import pic from '../../assets/p2.jpeg';
import { useQueryClient } from '@tanstack/react-query';
type StallSizeOption = {
  id: string;
  code: string;
  displayName: string;
  baseAmount: number;
  gstPercentage: number;
  totalAmount: number;
};
type AvailableStallSizeGroup = {
  stallSizeId: string;
  code: string;
  displayName: string;
  baseAmount: number;
  totalAmount: number;
  availableStalls: StallPreferenceOption[];
};

type StallPreferenceOption = {
  id: string;
  stallNumber: string;
  hallName?: string | null;
  zoneName?: string | null;
};

type BookingFormState = Record<string, string | boolean>;
type CsvRow = Record<string, string>;

type BulkResult = {
  rowNumber: number;
  companyName: string;
  success: boolean;
  registrationNumber?: string;
  error?: string;
};

export const STATE_DISTRICT_MAP: Record<string, string[]> = {
  'Tamil Nadu': [
    'Ariyalur',
    'Chengalpattu',
    'Chennai',
    'Coimbatore',
    'Cuddalore',
    'Dharmapuri',
    'Dindigul',
    'Erode',
    'Hosur',
    'Kallakurichi',
    'Kanchipuram',
    'Kanniyakumari',
    'Karur',
    'Krishnagiri',
    'Madurai',
    'Mayiladuthurai',
    'Nagapattinam',
    'Namakkal',
    'Nilgiris',
    'Perambalur',
    'Pudukkottai',
    'Ramanathapuram',
    'Ranipet',
    'Salem',
    'Sivaganga',
    'Tenkasi',
    'Thanjavur',
    'Theni',
    'Thoothukudi',
    'Trichy',
    'Tirunelveli',
    'Tirupattur',
    'Tiruppur',
    'Tiruvallur',
    'Tiruvannamalai',
    'Tiruvarur',
    'Vellore',
    'Villupuram',
    'Virudhunagar',
    'Other District',
  ],

  Puducherry: [
    'Puducherry',
    'Karaikal',
    'Mahe',
    'Yanam',
    'Other District',
  ],

  Karnataka: [
    'Bagalkote',
    'Ballari',
    'Belagavi',
    'Bengaluru Rural',
    'Bengaluru Urban',
    'Bidar',
    'Chamarajanagar',
    'Chikkaballapur',
    'Chikkamagaluru',
    'Chitradurga',
    'Dakshina Kannada',
    'Davanagere',
    'Dharwad',
    'Gadag',
    'Hassan',
    'Haveri',
    'Kalaburagi',
    'Kodagu',
    'Kolar',
    'Koppal',
    'Mandya',
    'Mysuru',
    'Raichur',
    'Ramanagara',
    'Shivamogga',
    'Tumakuru',
    'Udupi',
    'Uttara Kannada',
    'Vijayapura',
    'Yadgir',
    'Other District',
  ],

  Kerala: [
    'Alappuzha',
    'Ernakulam',
    'Idukki',
    'Kannur',
    'Kasaragod',
    'Kollam',
    'Kottayam',
    'Kozhikode',
    'Malappuram',
    'Palakkad',
    'Pathanamthitta',
    'Thiruvananthapuram',
    'Thrissur',
    'Wayanad',
    'Other District',
  ],

  'Andhra Pradesh': [
    'Alluri Sitharama Raju',
    'Anakapalli',
    'Anantapur',
    'Annamayya',
    'Bapatla',
    'Chittoor',
    'Dr. B.R. Ambedkar Konaseema',
    'East Godavari',
    'Eluru',
    'Guntur',
    'Kakinada',
    'Krishna',
    'Kurnool',
    'Nandyal',
    'NTR',
    'Palnadu',
    'Parvathipuram Manyam',
    'Prakasam',
    'Srikakulam',
    'Sri Sathya Sai',
    'Tirupati',
    'Visakhapatnam',
    'Vizianagaram',
    'West Godavari',
    'YSR Kadapa',
    'Other District',
  ],

  Telangana: [
    'Adilabad',
    'Bhadradri Kothagudem',
    'Hanamkonda',
    'Hyderabad',
    'Jagtial',
    'Jangaon',
    'Jayashankar Bhupalpally',
    'Jogulamba Gadwal',
    'Kamareddy',
    'Karimnagar',
    'Khammam',
    'Komaram Bheem Asifabad',
    'Mahabubabad',
    'Mahabubnagar',
    'Mancherial',
    'Medak',
    'Medchal–Malkajgiri',
    'Mulugu',
    'Nagarkurnool',
    'Nalgonda',
    'Narayanpet',
    'Nirmal',
    'Nizamabad',
    'Peddapalli',
    'Rajanna Sircilla',
    'Ranga Reddy',
    'Sangareddy',
    'Siddipet',
    'Suryapet',
    'Vikarabad',
    'Wanaparthy',
    'Warangal',
    'Yadadri Bhuvanagiri',
    'Other District',
  ],

  Maharashtra: [
    'Ahmednagar',
    'Akola',
    'Amravati',
    'Aurangabad',
    'Beed',
    'Bhandara',
    'Buldhana',
    'Chandrapur',
    'Dhule',
    'Gadchiroli',
    'Gondia',
    'Hingoli',
    'Jalgaon',
    'Jalna',
    'Kolhapur',
    'Latur',
    'Mumbai City',
    'Mumbai Suburban',
    'Nagpur',
    'Nanded',
    'Nandurbar',
    'Nashik',
    'Osmanabad',
    'Palghar',
    'Parbhani',
    'Pune',
    'Raigad',
    'Ratnagiri',
    'Sangli',
    'Satara',
    'Sindhudurg',
    'Solapur',
    'Thane',
    'Wardha',
    'Washim',
    'Yavatmal',
    'Other District',
  ],

  'Uttar Pradesh': [
    'Noida',
    'Other District',
  ],

  'Other State': [

    'Other District',
  ],
};

const STATES = Object.keys(STATE_DISTRICT_MAP);

const STALL_SIZE_ID_MAP: Record<string, string> = {
  '3x2': 'bd5ac64d-2bea-4b27-9a1f-d8ecb33f26ba',
  '2x3': 'bd5ac64d-2bea-4b27-9a1f-d8ecb33f26ba',
  '3x3': 'ec65924e-e264-40ed-b5fc-afaa7dcc07a5',
  '2x2': 'fffb8810-ce4c-4cae-8688-17b37ac9ccbf',
};

const CSV_HEADERS = [
  'legalName',
  'tradeName',
  'registeredAddress',
  'city',
  'district',
  'state',
  'pincode',
  'country',
  'contactPersonName',
  'contactPersonDesignation',
  'mobile',
  'alternateMobile',
  'email',
  'website',
  'industryScale',
  'businessType',
  'companyConstitution',
  'industryCategory',
  'productServiceDescription',
  'productKeywords',
  'udyamNumber',
  'gstin',
  'pan',
  'tanNumber',
  'lubMember',
  'lubState',
  'lubChapter',
  'lubMembershipNumber',
  'bankAccountName',
  'bankName',
  'bankAccountNumber',
  'bankIfscCode',
  'requestedStallSize',
  'fasciaName',
  'displayNotes',
  'electricalRequirement',
  'specialRequirement',
  'termsAccepted',
];

const initial: BookingFormState = {
  legalName: '',
  tradeName: '',
  registeredAddress: '',
  city: '',
  district: '',
  state: 'Tamil Nadu',
  pincode: '',
  country: 'India',
  contactPersonName: '',
  contactPersonDesignation: '',
  mobile: '',
  alternateMobile: '',
  email: '',
  website: '',
  industryScale: '',
  businessType: '',
  companyConstitution: '',
  industryCategory: '',
  productServiceDescription: '',
  productKeywords: '',
  udyamNumber: '',
  gstin: '',
  pan: '',
  tanNumber: '',
  lubMember: false,
  lubState: 'Tamil Nadu',
  lubChapter: '',
  lubMembershipNumber: '',
  bankAccountName: '',
  bankName: '',
  bankAccountNumber: '',
  bankIfscCode: '',
  billingLegalName: '',
  billingAddress: '',
  billingCity: '',
  billingState: 'Tamil Nadu',
  billingStateCode: '33',
  billingPincode: '',
  billingCountry: 'India',
  billingGstin: '',
  billingPan: '',
  placeOfSupply: 'Tamil Nadu',
  billingContactPerson: '',
  billingEmail: '',
  billingMobile: '',
  requestedStallSizeId: '',
  stallOption1Id: '',
  stallOption2Id: '',
  fasciaName: '',
  displayNotes: '',
  electricalRequirement: '',
  specialRequirement: '',
  hazardousDemoDeclared: false,
  declarantName: '',
  declarantDesignation: '',
  declarationDate: new Date().toISOString().slice(0, 10),
  finalAllocationConsentAccepted: false,
  termsAccepted: false,
  accuracyAccepted: false,
  paymentTimelineAccepted: false,
  cancellationPolicyAccepted: false,
  privacyConsentAccepted: false,
};

function optionalText(value: unknown): string {
  return String(value ?? '').trim();
}

function requiredFallback(value: unknown, fallback = '-'): string {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function normalizeStallSize(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace('mtrs', '')
    .replace('meters', '')
    .replace('meter', '');
}

function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const candidate = error as ApiError & {
      status?: number;
      details?: unknown;
      response?: unknown;
    };

    const details = candidate.details ?? candidate.response;

    if (details && typeof details === 'object') {
      try {
        return `${candidate.status ? `${candidate.status}: ` : ''}${JSON.stringify(details)}`;
      } catch {
        // Fall back to the message below.
      }
    }

    return `${candidate.status ? `${candidate.status}: ` : ''}${candidate.message || 'Bad Request'}`;
  }

  if (error instanceof Error) return error.message;
  return 'Upload failed.';
}

function toBoolean(value: unknown): boolean {
  return ['true', 'yes', '1', 'y'].includes(String(value ?? '').trim().toLowerCase());
}

function hasExtraSpaces(value: string): boolean {
  return value !== value.trim() || /\s{2,}/.test(value) || /\s/.test(value.trim());
}

function getFieldValidationError(
  value: string,
  pattern?: string,
  hint?: string,
  noSpaces?: boolean,
): string {
  if (!value) return '';

  if (noSpaces && hasExtraSpaces(value)) {
    return 'No spaces are allowed in this field.';
  }

  if (pattern && !new RegExp(`^${pattern}$`).test(value)) {
    return hint ? `Invalid format. Expected: ${hint}` : 'Invalid format.';
  }

  return '';
}

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function parseCsv(content: string): CsvRow[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    const nextCharacter = content[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        currentCell += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (character === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
      continue;
    }

    if ((character === '\n' || character === '\r') && !insideQuotes) {
      if (character === '\r' && nextCharacter === '\n') index += 1;
      currentRow.push(currentCell.trim());
      if (currentRow.some(cell => cell !== '')) rows.push(currentRow);
      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += character;
  }

  currentRow.push(currentCell.trim());
  if (currentRow.some(cell => cell !== '')) rows.push(currentRow);
  if (rows.length < 2) return [];

  const headers = rows[0].map(header => header.replace(/^\uFEFF/, '').trim());
  return rows.slice(1).map(row => {
    const record: CsvRow = {};
    headers.forEach((header, index) => {
      record[header] = row[index]?.trim() ?? '';
    });
    return record;
  });
}

export function PublicBookingPage() {
  const [form, setForm] = useState<BookingFormState>(initial);
  const [stallSizes, setStallSizes] = useState<StallSizeOption[]>([]);
  const [stallOptions, setStallOptions] = useState<StallPreferenceOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [csvFileName, setCsvFileName] = useState('');
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
  const [showStallInfo, setShowStallInfo] = useState(false);
  const [showAvailableStalls, setShowAvailableStalls] = useState(false);
  const queryClient = useQueryClient();

  const [allAvailableStalls, setAllAvailableStalls] =
    useState<AvailableStallSizeGroup[]>([]);

  const [allStallsLoading, setAllStallsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successRegNumber, setSuccessRegNumber] = useState('');
  const [modalEntered, setModalEntered] = useState(false);

  useEffect(() => {
    if (showSuccessModal) {
      const timer = requestAnimationFrame(() => setModalEntered(true));
      return () => cancelAnimationFrame(timer);
    }
    setModalEntered(false);
  }, [showSuccessModal]);
  console.log(stallOptions, 'stallOptions')
  useEffect(() => {
    if (!showStallInfo) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setShowStallInfo(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showStallInfo]);
  useEffect(() => {
    apiClient
      .get<StallSizeOption[]>(`/public/events/${appConfig.defaultEventCode}/stall-sizes`)
      .then(setStallSizes)
      .catch(() => setError('Unable to load stall sizes. Please try again or contact the organising team.'));

    // If navigated here from "Book With Same Details" (from EditBookingPage or this page's own popup),
    // prefill the form with the passed data.
    const prefill = (location.state as { prefillForm?: BookingFormState } | null)?.prefillForm;
    if (prefill) {
      setForm(prefill);
    }
  }, [location.state]);

  const requestedStallSizeId = String(form.requestedStallSizeId ?? '');

  useEffect(() => {
    if (!requestedStallSizeId) {
      setStallOptions([]);
      return;
    }

    apiClient
      .get<StallPreferenceOption[]>(
        `/public/events/${appConfig.defaultEventCode}/stalls?stallSizeId=${encodeURIComponent(requestedStallSizeId)}`,
      )
      .then(setStallOptions)
      .catch(() => setStallOptions([]));

    setForm(previous => ({ ...previous, stallOption1Id: '', stallOption2Id: '' }));
  }, [requestedStallSizeId]);
  const sortedStallOptions = useMemo(() => {
    return [...stallOptions].sort((a, b) =>
      a.stallNumber.localeCompare(b.stallNumber, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    );
  }, [stallOptions]);
  const successfulBulkCount = useMemo(
    () => bulkResults.filter(result => result.success).length,
    [bulkResults],
  );

  function set(name: string, value: string | boolean) {
    setForm(previous => ({ ...previous, [name]: value }));
  }

  function text(name: string): string {
    return String(form[name] ?? '');
  }
  async function loadAllAvailableStalls() {
    setShowAvailableStalls(true);

    if (allAvailableStalls.length > 0) {
      return;
    }

    setAllStallsLoading(true);
    setError('');

    try {
      const groups = await Promise.all(
        stallSizes.map(async size => {
          try {
            const availableStalls =
              await apiClient.get<StallPreferenceOption[]>(
                `/public/events/${appConfig.defaultEventCode}/stalls?stallSizeId=${encodeURIComponent(
                  size.id,
                )}`,
              );

            return {
              stallSizeId: size.id,
              code: size.code,
              displayName: size.displayName,
              baseAmount: size.baseAmount,
              totalAmount: size.totalAmount,
              availableStalls: [...availableStalls].sort((a, b) =>
                a.stallNumber.localeCompare(b.stallNumber, undefined, {
                  numeric: true,
                  sensitivity: 'base',
                }),
              ),
            };
          } catch {
            return {
              stallSizeId: size.id,
              code: size.code,
              displayName: size.displayName,
              baseAmount: size.baseAmount,
              totalAmount: size.totalAmount,
              availableStalls: [],
            };
          }
        }),
      );

      setAllAvailableStalls(groups);
    } catch {
      setAllAvailableStalls([]);
      setError('Unable to load available stalls.');
    } finally {
      setAllStallsLoading(false);
    }
  }

  function handleStateChange(name: string, value: string) {
    setForm(previous => ({
      ...previous,
      [name]: value,
      district: name === 'state' ? '' : previous.district,
      billingCity: name === 'billingState' ? '' : previous.billingCity,
    }));
  }

  function resolveStallSizeId(value: string): string {
    const normalized = normalizeStallSize(value);
    if (!normalized) return '';

    // CSV may already contain the database GUID.
    const directId = Object.values(STALL_SIZE_ID_MAP)
      .find(id => id.toLowerCase() === normalized);

    if (directId) return directId;

    // First use the values returned by the API.
    const apiMatch = stallSizes.find(size => {
      const id = size.id.trim().toLowerCase();
      const code = normalizeStallSize(size.code);
      const displayName = normalizeStallSize(size.displayName);

      return id === normalized
        || code === normalized
        || displayName === normalized
        || displayName.startsWith(normalized);
    });

    if (apiMatch) return apiMatch.id;

    // Static fallback makes CSV upload work even before stall sizes finish loading.
    return STALL_SIZE_ID_MAP[normalized] ?? '';
  }

  function buildPayload(source: BookingFormState | CsvRow, fromCsv = false) {
    const read = (name: string): string => String(source[name] ?? '').trim();
    const readBoolean = (name: string): boolean => (
      fromCsv ? toBoolean(source[name]) : source[name] === true
    );

    const legalName = requiredFallback(
      read('legalName') || read('tradeName') || read('contactPersonName'),
      'UNNAMED EXHIBITOR',
    );

    const tradeName = optionalText(read('tradeName')) || legalName;
    const contactPersonName = requiredFallback(read('contactPersonName'), legalName);
    const requestedStallSizeId = fromCsv
      ? resolveStallSizeId(read('requestedStallSize') || read('requestedStallSizeId'))
      : resolveStallSizeId(read('requestedStallSizeId'));

    const fasciaName = requiredFallback(
      read('fasciaName') || tradeName || legalName,
      'EXHIBITOR',
    ).toUpperCase().slice(0, 25);

    const declarationDate = read('declarationDate')
      || new Date().toISOString().slice(0, 10);

    return {
      tenantId: '11111111-1111-1111-1111-111111111111',
      eventId: '22222222-2222-2222-2222-222222222222',

      exhibitor: {
        legalName,
        tradeName,
        registeredAddress: requiredFallback(read('registeredAddress')),
        city: requiredFallback(read('city')),
        district: requiredFallback(read('district')),
        state: requiredFallback(read('state'), 'Tamil Nadu'),
        pincode: requiredFallback(read('pincode'), '600001'),
        country: requiredFallback(read('country'), 'India'),

        contactPersonName,
        contactPersonDesignation: requiredFallback(
          read('contactPersonDesignation'),
          'Representative',
        ),
        mobile: optionalText(read('mobile')),
        alternateMobile: optionalText(read('alternateMobile')),
        email: optionalText(read('email')),
        alternateEmail: '',
        website: optionalText(read('website')),

        industryScale: requiredFallback(read('industryScale'), 'Micro'),
        businessType: requiredFallback(read('businessType'), 'Manufacturer'),
        companyConstitution: requiredFallback(
          read('companyConstitution'),
          'Proprietorship',
        ),
        industryCategory: requiredFallback(read('industryCategory'), 'Others'),
        productServiceDescription: requiredFallback(
          read('productServiceDescription'),
          read('productKeywords') || 'Not provided',
        ).slice(0, 1000),
        productKeywords: requiredFallback(
          read('productKeywords'),
          read('productServiceDescription') || 'Not provided',
        ).slice(0, 250),

        udyamNumber: optionalText(read('udyamNumber')).toUpperCase(),
        gstin: optionalText(read('gstin')).toUpperCase(),
        tanNumber: optionalText(read('tanNumber')).toUpperCase(),
        pan: optionalText(read('pan')).toUpperCase(),

        lubMember: readBoolean('lubMember'),
        lubState: optionalText(read('lubState')),
        lubChapter: optionalText(read('lubChapter')),
        lubMembershipNumber: optionalText(read('lubMembershipNumber')),

        // Bank details are optional — left blank when the exhibitor does not provide them.
        bankAccountName: optionalText(read('bankAccountName')),
        bankName: optionalText(read('bankName')),
        bankAccountNumber: optionalText(read('bankAccountNumber')),
        bankIfscCode: optionalText(read('bankIfscCode')).toUpperCase(),
      },

      // Do not send an object containing null values.
      // The backend command already allows Billing to be absent.
      billing: null,

      requestedStallSizeId,
      stallOption1Id: optionalText(read('stallOption1Id')) || null,
      stallOption2Id: optionalText(read('stallOption2Id')) || null,
      fasciaName,
      displayNotes: optionalText(read('displayNotes')).slice(0, 1000),
      electricalRequirement: optionalText(read('electricalRequirement')).slice(0, 500),
      specialRequirement: optionalText(read('specialRequirement')).slice(0, 500),
      hazardousDemoDeclared: readBoolean('hazardousDemoDeclared'),

      finalAllocationConsentAccepted: true,
      declarantName: requiredFallback(read('declarantName'), contactPersonName).slice(0, 100),
      declarantDesignation: requiredFallback(
        read('declarantDesignation') || read('contactPersonDesignation'),
        'Representative',
      ).slice(0, 100),
      declarationDate,

      // CSV records are administrative imports, so these are explicitly accepted.
      termsAccepted: fromCsv ? true : readBoolean('termsAccepted'),
      accuracyAccepted: fromCsv ? true : readBoolean('accuracyAccepted'),
      paymentTimelineAccepted: fromCsv ? true : readBoolean('paymentTimelineAccepted'),
      cancellationPolicyAccepted: fromCsv ? true : readBoolean('cancellationPolicyAccepted'),
      privacyConsentAccepted: fromCsv ? true : readBoolean('privacyConsentAccepted'),
    };
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!text('requestedStallSizeId')) {
      setError('Please select a stall size.');
      return;
    }
    if (form.termsAccepted !== true) {
      setError('Please accept the Terms & Conditions to continue.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const result = await apiClient.post<{ bookingRegistrationNumber: string }>(
        `/public/events/${appConfig.defaultEventCode}/bookings`,
        buildPayload(form),
      );
      queryClient.invalidateQueries({ queryKey: ['bookings'] });

      setSuccessRegNumber(result.bookingRegistrationNumber);
      setShowSuccessModal(true);
    } catch (caughtError) {
      setError(caughtError instanceof ApiError
        ? caughtError.message
        : 'Unable to submit booking application. Please check the entered values.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmitNew() {
    setShowSuccessModal(false);
    setForm(initial);
    setStallOptions([]);
  }

  function handleBookSameDetails() {
    setShowSuccessModal(false);

    setForm(previous => ({
      ...previous,
      declarationDate: new Date().toISOString().slice(0, 10),
      termsAccepted: false,
      accuracyAccepted: false,
      paymentTimelineAccepted: false,
      cancellationPolicyAccepted: false,
      privacyConsentAccepted: false,
      finalAllocationConsentAccepted: false,
    }));
  }

  function downloadCsvTemplate() {
    const exampleRow: Record<string, string> = {
      legalName: 'ABC Industries',
      tradeName: 'ABC',
      registeredAddress: '12 Industrial Estate',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      country: 'India',
      contactPersonName: 'Mohammed Mubeen',
      contactPersonDesignation: 'Manager',
      mobile: '9876543210',
      alternateMobile: '',
      email: 'example@company.com',
      website: '',
      industryScale: 'Small',
      businessType: 'Manufacturer',
      companyConstitution: 'Private Limited',
      industryCategory: 'General Engineering & Fabrication',
      productServiceDescription: 'Industrial components',
      productKeywords: 'fabrication, components',
      udyamNumber: '',
      gstin: '',
      pan: '',
      tanNumber: '',
      lubMember: 'Yes',
      lubState: 'Tamil Nadu',
      lubChapter: 'Chennai',
      lubMembershipNumber: '',
      bankAccountName: '',
      bankName: '',
      bankAccountNumber: '',
      bankIfscCode: '',
      requestedStallSize: stallSizes[0]?.code ?? '3x3',
      fasciaName: 'ABC INDUSTRIES',
      displayNotes: '',
      electricalRequirement: '',
      specialRequirement: '',
      termsAccepted: 'Yes',
    };

    const csv = [
      CSV_HEADERS.map(escapeCsv).join(','),
      CSV_HEADERS.map(header => escapeCsv(exampleRow[header] ?? '')).join(','),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'stall-booking-bulk-upload-template.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function handleCsvFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setBulkResults([]);
    setError('');

    if (!file) {
      setCsvFileName('');
      setCsvRows([]);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a valid CSV file.');
      event.target.value = '';
      return;
    }

    const content = await file.text();
    const parsedRows = parseCsv(content);

    if (parsedRows.length === 0) {
      setError('The CSV file does not contain any data rows.');
      event.target.value = '';
      return;
    }

    setCsvFileName(file.name);
    setCsvRows(parsedRows);
  }

  async function uploadCsvRows() {
    if (csvRows.length === 0) {
      setError('Select a CSV file before starting the upload.');
      return;
    }

    setBulkUploading(true);
    setBulkResults([]);
    setError('');

    const results: BulkResult[] = [];

    for (let index = 0; index < csvRows.length; index += 1) {
      const row = csvRows[index];
      const companyName = row.legalName || row.tradeName || `Row ${index + 2}`;

      try {
        const payload = buildPayload(row, true);

        if (!payload.requestedStallSizeId) {
          throw new Error(
            `Invalid stall size "${row.requestedStallSize || row.requestedStallSizeId || ''}".`,
          );
        }

        console.log(`Bulk upload CSV row ${index + 2}`, payload);

        const response = await apiClient.post<{ bookingRegistrationNumber: string }>(
          `/public/events/${appConfig.defaultEventCode}/bookings`,
          payload,
        );

        results.push({
          rowNumber: index + 2,
          companyName,
          success: true,
          registrationNumber: response.bookingRegistrationNumber,
        });
      } catch (caughtError) {
        results.push({
          rowNumber: index + 2,
          companyName,
          success: false,
          error: getApiErrorMessage(caughtError),
        });
      }

      setBulkResults([...results]);
    }

    setBulkUploading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-6 sm:px-4 pb-28 sm:pb-24 md:pb-16">
      <form onSubmit={submit} className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl md:p-8">
        <BrandHeader />

        <div className="mt-6 rounded-3xl bg-msme-blue p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-100">{BRAND.portalName}</p>
          <h1 className="mt-2 text-3xl font-black">Stall Booking Form</h1>
          <p className="mt-2 text-sm text-blue-100">{BRAND.publicEventName}</p>
        </div>

        {/* <BulkUploadPanel
          csvFileName={csvFileName}
          rowCount={csvRows.length}
          uploading={bulkUploading}
          results={bulkResults}
          successfulCount={successfulBulkCount}
          onDownloadTemplate={downloadCsvTemplate}
          onSelectFile={handleCsvFile}
          onUpload={uploadCsvRows}
        /> */}

        <div className="mt-4 rounded-xl border-l-4 border-amber-600 bg-amber-100 p-4 shadow-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-700" />
            <div>
              <h4 className="font-bold text-amber-900">Important Notice</h4>
              <p className="mt-1 text-sm font-medium text-amber-800">
                Please keep your Udyam Registration Number, PAN, and GSTIN ready before proceeding with the application form.

              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-xl border-l-4 border-blue-600 bg-blue-50 p-4 shadow-md">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-6 w-6 flex-shrink-0 text-blue-700" />
            <div>
              <h4 className="font-bold text-blue-900">Exhibitor Eligibility Criteria</h4>
              <p className="mt-1 text-sm font-medium text-blue-800">
                This exhibition is strictly reserved for <strong>Manufacturing Enterprises</strong> and <strong>Allied Engineering / Industrial Service Providers</strong>. General traders and non-industrial retail entities are not eligible to book stalls.
              </p>
            </div>
          </div>
        </div>

        {error && <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

        <Section title="01. Exhibitor Name & Company Details">
          <Field label="Company / Exhibitor Name" name="legalName" value={text('legalName')} onChange={set} required />
          <Field label="Brand / Trade Name" name="tradeName" value={text('tradeName')} onChange={set} />
          <TextAreaField label="Address" name="registeredAddress" value={text('registeredAddress')} onChange={set} required />
          <Select label="State" name="state" value={text('state')} options={STATES} onChange={handleStateChange} required />
          <Field label="City" name="city" value={text('city')} onChange={set} required />
          <Select label="District" name="district" value={text('district')} options={STATE_DISTRICT_MAP[text('state')] || []} onChange={set} required />
          <Field label="PIN Code" name="pincode" value={text('pincode')} onChange={set} pattern="^[1-9][0-9]{5}$" required />
          <Field label="Contact Person Name" name="contactPersonName" value={text('contactPersonName')} onChange={set} required />
          <Field label="Designation" name="contactPersonDesignation" value={text('contactPersonDesignation')} onChange={set} required />
          <Field label="Mobile Number" name="mobile" value={text('mobile')} onChange={set} pattern="^(\+91[-\s]?)?[6-9][0-9]{9}$" required />          <Field label="Landline / Alternate Number" name="alternateMobile" value={text('alternateMobile')} onChange={set} />
          <Field label="Email ID" name="email" value={text('email')} onChange={set} type="email" required />
          <Field label="Website" name="website" value={text('website')} onChange={set} />
        </Section>

        <Section title="02. Compliance Details & LUB Membership">
          <RadioGroup label="Industry Scale" name="industryScale" value={text('industryScale')} options={['Micro', 'Small', 'Medium', 'Large Scale']} onChange={set} required />
          <RadioGroup label="Business Type" name="businessType" value={text('businessType')} options={['Manufacturer', 'Service Provider', 'Distributor']} onChange={set} required />
          <Select label="Company Constitution" name="companyConstitution" value={text('companyConstitution')} onChange={set} options={['Proprietorship', 'Partnership', 'Private Limited', 'Public Limited', 'LLP', 'Others']} />
          <Field
            label="PAN Number"
            name="pan"
            value={text('pan')}
            onChange={set}
            pattern="[A-Z]{5}[0-9]{4}[A-Z]"
            hint="ABCDE1234F"
            uppercase
            noSpaces
            required
          />
          <Field
            label="TAN Number"
            name="tanNumber"
            value={text('tanNumber')}
            onChange={set}
            pattern="[A-Z]{4}[0-9]{5}[A-Z]"
            hint="ABCD12345E"
            uppercase
            noSpaces
            required
          />
          <Field
            label="Udyam / UAM Number"
            name="udyamNumber"
            value={text('udyamNumber')}
            onChange={set}
            pattern="(UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}|UAM-[A-Z]{2}-[0-9]{2}-[0-9]{7})"
            hint="UDYAM-XX-00-0000000"
            uppercase
            noSpaces
            required
          />
          <Field
            label="GSTIN"
            name="gstin"
            value={text('gstin')}
            onChange={set}
            pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]"
            hint="22AAAAA0000A1Z5"
            uppercase
            noSpaces
            required
          />
          <RadioGroup
            label="LUB Member?"
            name="lubMemberText"
            value={form.lubMember === true ? 'Yes' : 'No'}
            options={['Yes', 'No']}
            onChange={(_, value) => {
              const isMember = value === 'Yes';
              set('lubMember', isMember);
              if (!isMember) {
                set('lubState', 'Tamil Nadu');
                set('lubChapter', '');
                set('lubMembershipNumber', '');
              }
            }}
          />
          {form.lubMember === true && (
            <>
              <Select label="LUB State / Region" name="lubState" value={text('lubState')} options={STATES} onChange={(name, value) => { set(name, value); set('lubChapter', ''); }} />
              <Select label="LUB Chapter / District" name="lubChapter" value={text('lubChapter')} options={STATE_DISTRICT_MAP[text('lubState')] || []} onChange={set} />
              <Field label="LUB Membership Number" name="lubMembershipNumber" value={text('lubMembershipNumber')} onChange={set} />
            </>
          )}        </Section>

        <Section title="03. Industry, Product / Service & Stall Size">
          <Select
            label="Main Industry Category"
            name="industryCategory"
            value={text('industryCategory')}
            onChange={set}
            options={[
              'Automotive & EV Components',
              'Aerospace, Defence & Precision Engineering',
              'General Engineering & Fabrication',
              'Machine Tools, CNC, VMC, HMC & Tooling',
              'Industrial Automation, Robotics & IoT',
              'Electrical, Electronics & EMS',
              'Metal Processing, Casting, Forging & Heat Treatment',
              'Plastics, Rubber, Moulds & Dies',
              'Pumps, Valves, Hydraulics & Pneumatics',
              'Packaging, Printing & Labelling',
              'Industrial Services, Testing, Calibration & Certification',
              'Renewable Energy, Solar & Green Manufacturing',
              'MSME Services: Finance, ERP, HR, Training, Consulting',
              'Others',
            ]}
            required
          />
          <Field label="Sub Category / Keywords" name="productKeywords" value={text('productKeywords')} onChange={set} required />
          <TextAreaField label="Manufacturing / Service of" name="productServiceDescription" value={text('productServiceDescription')} onChange={set} rows={4} maxLength={500} required />

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Stall Size Requested</span>
            <select className="input mt-1" value={text('requestedStallSizeId')} onChange={event => set('requestedStallSizeId', event.target.value)} required
            >
              <option value="">Select stall size</option>
              {stallSizes.map(size => (
                <option key={size.id} value={size.id}>
                  {size.displayName} · ₹{size.baseAmount.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">For CSV, use the stall-size code, display name or ID.</p>
          </label>

          <label className="block">
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Preferred Stall - Option 1</span>
              <div className='flex flex-row justify-end'>
                <button
                  type="button"
                  onClick={loadAllAvailableStalls}
                  disabled={stallSizes.length === 0}
                  className="ml-2 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-blue-600 hover:text-blue-800"
                >
                  <EyeIcon className="h-5 w-5" />
                  {/* View All Available Stalls */}
                </button>
                <button
                  type="button"
                  onClick={() => setShowStallInfo(true)}
                  className="ml-2 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-blue-600 hover:text-blue-800"
                  aria-label="View stall layout information"
                >
                  <Info className="h-5 w-5" />
                </button>
              </div>

            </span>
            <div className="md:col-span-2 lg:col-span-3">

            </div>
            <select
              className="input mt-1"
              value={text('stallOption1Id')}
              disabled={!requestedStallSizeId}
              onChange={event => set('stallOption1Id', event.target.value)}
            >
              <option value="">
                {requestedStallSizeId ? 'Select preferred stall (optional)' : 'Select stall size first'}
              </option>
              {sortedStallOptions
                .filter(option => option.id !== text('stallOption2Id'))
                .map(option => (
                  <option key={option.id} value={option.id}>
                    {option.stallNumber}
                    {option.hallName ? ` · ${option.hallName}` : ''}
                    {option.zoneName ? ` · ${option.zoneName}` : ''}
                  </option>
                ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">Your first choice of stall, subject to availability and organiser approval.</p>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Preferred Stall - Option 2</span>
            <select
              className="input mt-1"
              value={text('stallOption2Id')}
              disabled={!requestedStallSizeId}
              onChange={event => set('stallOption2Id', event.target.value)}
            >
              <option value="">
                {requestedStallSizeId ? 'Select preferred stall (optional)' : 'Select stall size first'}
              </option>
              {sortedStallOptions
                .filter(option => option.id !== text('stallOption1Id'))
                .map(option => (
                  <option key={option.id} value={option.id}>
                    {option.stallNumber}
                    {option.hallName ? ` · ${option.hallName}` : ''}
                    {option.zoneName ? ` · ${option.zoneName}` : ''}
                  </option>
                ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">Your backup choice, used if Option 1 is not available.</p>
          </label>

          <Field label="Name on Fascia" name="fasciaName" value={text('fasciaName')} onChange={set} maxLength={70} required />
          <TextAreaField label="Display Notes" name="displayNotes" value={text('displayNotes')} onChange={set} />
          <TextAreaField label="Electrical Requirement" name="electricalRequirement" value={text('electricalRequirement')} onChange={set} />
          <TextAreaField label="Special Requirement" name="specialRequirement" value={text('specialRequirement')} onChange={set} />
        </Section>

        <Section title="04. Bank Details">
          <Field
            label="Bank Account Holder Name"
            name="bankAccountName"
            value={text('bankAccountName')}
            onChange={set}
          />
          <Field
            label="Bank Name"
            name="bankName"
            value={text('bankName')}
            onChange={set}
          />
          <Field
            label="Bank Account Number"
            name="bankAccountNumber"
            value={text('bankAccountNumber')}
            onChange={set}
          />
          <Field
            label="IFSC Code"
            name="bankIfscCode"
            value={text('bankIfscCode')}
            onChange={set}
            pattern="[A-Z]{4}0[A-Z0-9]{6}"
            hint="ABCD0123456"
            uppercase
            noSpaces
          />
        </Section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-black text-slate-900">05. Terms & Conditions</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-700">
            <li>Stall allotment will be confirmed only after organiser review and formal approval.</li>
            <li>After approval, reduction or change of booked stall size is subject to organiser approval.</li>
            <li>Fascia name and outer stall format cannot be changed after final print and stall lock.</li>
            <li>Heavy machinery, hazardous materials and live demonstrations require organiser approval.</li>
            <li>Payment must be completed within the communicated timeline after approval.</li>
          </ol>
        </section>
        <section className="mt-6 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-md">

          <div className="flex items-start gap-4 border-l-4 border-blue-600 p-5">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <Info className="h-5 w-5 text-blue-700" />
            </div>


            <div className="flex-1">

              <h3 className="text-lg font-black text-slate-900">
                Digital Support Team
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                For booking, payment or login assistance, contact our support team.
              </p>


              <div className="mt-3 flex flex-col gap-2 sm:flex-row">

                <div className="flex-1 rounded-lg bg-blue-50 px-4 py-3">
                  <p className="font-bold text-slate-900">
                    Sriram Hariharan
                  </p>

                  <a
                    href="tel:+919840727309"
                    className="text-sm flex font-semibold text-blue-700 hover:underline"
                  >
                    <Phone className="h-4 w-4" />+91 98407 27309
                  </a>
                </div>


                {/* <div className="flex-1 rounded-lg bg-blue-50 px-4 py-3">
                  <p className="font-bold text-slate-900">
                    Arun Vignesh P.B.
                  </p>

                  <a
                    href="tel:+917092482244"
                    className="text-sm flex font-semibold text-blue-700 hover:underline"
                  >
                    <Phone className="h-4 w-4" />

                    +91 70924 82244
                  </a>
                </div> */}




              </div>


              {/* <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                Mention your Booking Registration Number while contacting support.
                <span className="ml-1 font-black text-blue-700">
                    Example: MSME-HOSUR-20260717-3487
                </span>
            </p> */}


            </div>

          </div>


          <div className="bg-slate-900 px-4 py-3 text-center">
            <p className="text-xs font-bold text-white">
              MSME Sangamam Connect - Tamil Nadu Organising Team
            </p>
          </div>

        </section>
        <div className="mt-4 grid gap-3">
          <Check label="I accept the event terms and conditions" name="termsAccepted" checked={form.termsAccepted === true} onChange={set} required />
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">All fields are optional. Blank values are sent as null.</p>
          <button type="submit" className="btn-primary" disabled={submitting || bulkUploading}>
            {submitting ? 'Submitting…' : 'Submit Stall Booking Application'}
          </button>
        </div>
      </form>

      <FloatingSupportFooter />
      {showSuccessModal && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 transition-opacity duration-300 ${modalEntered ? 'opacity-100' : 'opacity-0'
            }`}
        >
          <div
            className={`relative w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl transition-all duration-300 ease-out ${modalEntered ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-95 opacity-0'
              }`}
          >
            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                navigate('*');
              }}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" strokeWidth={2} />
            </div>

            <h3 className="mt-5 text-lg font-black text-slate-900">
              Booking Submitted Successfully
            </h3>

            {successRegNumber && (
              <p className="mt-2 text-sm text-slate-500">
                Booking Registration Number
                <br />
                <span className="text-base font-bold text-slate-800">{successRegNumber}</span>
              </p>
            )}

            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Do you want to submit a completely new application, or book another
              stall using the same exhibitor details?
            </p>

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={handleSubmitNew}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
              >
                Submit New Application
              </button>

              <button
                type="button"
                onClick={handleBookSameDetails}
                className="btn-primary flex-1 py-3 active:scale-[0.98]"
              >
                Book Another stall With Same Details
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                navigate('*');
              }}
              className="mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            >
              Home
            </button>
          </div>
        </div>
      )}

      {showStallInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowStallInfo(false)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl bg-white p-4 shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowStallInfo(false)}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
              aria-label="Close stall layout information"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="pr-8 text-lg font-black text-slate-900">Stall Layout Reference</h3>
            <img
              src={pic}
              alt="Stall layout reference"
              className="mt-3 max-h-[80vh] w-full rounded-xl border border-slate-200 object-contain"
            />
          </div>
        </div>
      )}
      {showAvailableStalls && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowAvailableStalls(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  All Available Stalls
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Available stalls grouped by stall size
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAvailableStalls(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                aria-label="Close available stalls"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-6">
              {allStallsLoading ? (
                <div className="py-16 text-center">
                  <p className="font-bold text-slate-700">
                    Loading available stalls...
                  </p>
                </div>
              ) : allAvailableStalls.length === 0 ? (
                <div className="rounded-2xl bg-amber-50 p-8 text-center">
                  <AlertTriangle className="mx-auto h-8 w-8 text-amber-600" />

                  <p className="mt-3 font-bold text-amber-900">
                    No stall availability information found.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {allAvailableStalls.map(group => (
                    <section
                      key={group.stallSizeId}
                      className="overflow-hidden rounded-2xl border border-slate-200"
                    >
                      <div className="flex flex-col justify-between gap-3 bg-slate-100 px-5 py-4 sm:flex-row sm:items-center">
                        <div>
                          <h4 className="text-lg font-black text-slate-900">
                            {group.displayName}
                          </h4>

                          <p className="mt-1 text-sm text-slate-600">
                            ₹{group.baseAmount.toLocaleString('en-IN')}
                            {' + GST · Total ₹'}
                            {group.totalAmount.toLocaleString('en-IN')}
                          </p>
                        </div>

                        <div
                          className={`rounded-full px-3 py-1 text-sm font-bold ${group.availableStalls.length > 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                            }`}
                        >
                          {group.availableStalls.length > 0
                            ? `${group.availableStalls.length} Available`
                            : 'Not Available'}
                        </div>
                      </div>

                      <div className="p-5">
                        {group.availableStalls.length === 0 ? (
                          <p className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                            No stalls are currently available for this size.
                          </p>
                        ) : (
                          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
                            {group.availableStalls.map(stall => (
                              <button
                                key={stall.id}
                                type="button"
                                onClick={() => {
                                  setForm(previous => ({
                                    ...previous,
                                    requestedStallSizeId: group.stallSizeId,
                                    stallOption1Id: stall.id,
                                    stallOption2Id: '',
                                  }));

                                  setStallOptions(group.availableStalls);
                                  setShowAvailableStalls(false);
                                }}
                                className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-left transition hover:border-emerald-500 hover:bg-emerald-100"
                              >
                                <p className="text-sm font-black text-slate-900">
                                  {stall.stallNumber}
                                </p>

                                {stall.hallName && (
                                  <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-600">
                                    {stall.hallName}
                                  </p>
                                )}

                                {stall.zoneName && (
                                  <p className="truncate text-[11px] text-slate-500">
                                    {stall.zoneName}
                                  </p>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

// function BulkUploadPanel({
//   csvFileName,
//   rowCount,
//   uploading,
//   results,
//   successfulCount,
//   onDownloadTemplate,
//   onSelectFile,
//   onUpload,
// }: {
//   csvFileName: string;
//   rowCount: number;
//   uploading: boolean;
//   results: BulkResult[];
//   successfulCount: number;
//   onDownloadTemplate: () => void;
//   onSelectFile: (event: ChangeEvent<HTMLInputElement>) => void;
//   onUpload: () => void;
// }) {
//   return (
//     <section className="mt-6 rounded-3xl border border-blue-200 bg-blue-50 p-5">
//       <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
//         <div>
//           <div className="flex items-center gap-2">
//             <FileSpreadsheet className="h-6 w-6 text-blue-700" />
//             <h2 className="text-xl font-black text-slate-900">Bulk CSV Upload</h2>
//           </div>
//           <p className="mt-1 text-sm text-slate-600">Download the template, enter one exhibitor per row, and upload the CSV.</p>
//         </div>
//         <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-700" onClick={onDownloadTemplate}>
//           <Download className="h-4 w-4" /> Download CSV Template
//         </button>
//       </div>

//       <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
//         <label className="block">
//           <span className="text-sm font-semibold text-slate-700">Choose CSV file</span>
//           <input type="file" accept=".csv,text/csv" className="mt-1 block w-full rounded-xl border border-slate-300 bg-white p-2 text-sm" onChange={onSelectFile} />
//           {csvFileName && <p className="mt-2 text-xs font-semibold text-slate-600">{csvFileName} · {rowCount} data row(s)</p>}
//         </label>
//         <button type="button" className="btn-primary inline-flex items-center justify-center gap-2" disabled={uploading || rowCount === 0} onClick={onUpload}>
//           <Upload className="h-4 w-4" /> {uploading ? `Uploading ${results.length}/${rowCount}…` : 'Upload CSV Records'}
//         </button>
//       </div>

//       {results.length > 0 && (
//         <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
//           <div className="border-b border-slate-200 p-4 text-sm font-bold text-slate-800">
//             Uploaded: {successfulCount} · Failed: {results.length - successfulCount} · Total processed: {results.length}
//           </div>
//           <div className="max-h-72 overflow-auto">
//             <table className="w-full text-left text-sm">
//               <thead className="sticky top-0 bg-slate-100 text-slate-700">
//                 <tr>
//                   <th className="px-3 py-2">CSV Row</th>
//                   <th className="px-3 py-2">Company</th>
//                   <th className="px-3 py-2">Status</th>
//                   <th className="px-3 py-2">Result</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {results.map(result => (
//                   <tr key={`${result.rowNumber}-${result.companyName}`} className="border-t border-slate-100">
//                     <td className="px-3 py-2">{result.rowNumber}</td>
//                     <td className="px-3 py-2">{result.companyName}</td>
//                     <td className={`px-3 py-2 font-bold ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
//                       {result.success ? 'Success' : 'Failed'}
//                     </td>
//                     <td className="px-3 py-2 text-slate-600">{result.registrationNumber || result.error}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}
//     </section>
//   );
// }

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-lg font-black text-slate-900">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  pattern,
  maxLength,
  required = false,
  hint,
  uppercase = false,
  noSpaces = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  type?: string;
  pattern?: string;
  maxLength?: number;
  required?: boolean;
  hint?: string;
  uppercase?: boolean;
  noSpaces?: boolean;
}) {
  const validationError = getFieldValidationError(value, pattern, hint, noSpaces);

  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </span>

      <input
        className={`input mt-1 ${uppercase ? 'uppercase' : ''} ${validationError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
        type={type}
        value={value}
        required={required}
        pattern={value ? pattern : undefined}
        maxLength={maxLength}
        onChange={event =>
          onChange(name, uppercase ? event.target.value.toUpperCase() : event.target.value)
        }
      />

      {validationError ? (
        <p className="mt-1 text-xs font-semibold text-red-600">{validationError}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">Format: {hint}</p>
      ) : null}
    </label>
  );
}

function TextAreaField({
  label,
  name,
  value,
  onChange,
  rows = 3,
  maxLength,
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  rows?: number;
  maxLength?: number;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </span>

      <textarea
        className="input mt-1"
        rows={rows}
        value={value}
        required={required}
        maxLength={maxLength}
        onChange={event => onChange(name, event.target.value)}
      />

      {maxLength && (
        <p className="mt-1 text-xs text-slate-500">
          {value.length}/{maxLength} characters
        </p>
      )}
    </label>
  );
}

function Select({
  label,
  name,
  value,
  options,
  onChange,
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
  onChange: (name: string, value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </span>

      <select
        className="input mt-1"
        value={value}
        required={required}
        onChange={event => onChange(name, event.target.value)}
      >
        <option value="">Select</option>
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function RadioGroup({
  label,
  name,
  value,
  options,
  onChange,
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
  onChange: (name: string, value: string) => void;
  required?: boolean;
}) {
  return (
    <fieldset className="rounded-2xl border border-slate-200 p-4">
      <legend className="text-sm font-bold text-slate-800">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </legend>

      <div className="mt-3 space-y-2">
        {options.map(option => (
          <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              required={required && !value}
              onChange={event => onChange(name, event.target.value)}
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Check({
  label,
  name,
  checked,
  onChange,
  required
}: {
  label: string;
  name: string;
  checked: boolean;
  onChange: (name: string, value: boolean) => void;
  required?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700">
      <input type="checkbox" className="mt-1" checked={checked} onChange={event => onChange(name, event.target.checked)} required={required} />
      <span>{label}</span>
    </label>
  );
}
