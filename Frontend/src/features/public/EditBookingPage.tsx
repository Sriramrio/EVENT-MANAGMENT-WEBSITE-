import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
// import { useNavigate, useParams } from 'react Reb-router-dom';
import { Form, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Download, FileSpreadsheet, CheckCircle2, Info, Mail, Phone, Upload, X } from 'lucide-react';
import { BRAND } from '../../config/brand';
import { appConfig } from '../../config/appConfig';
import { apiClient, ApiError } from '../../data/api/apiClient';
import { BrandHeader } from '../../shared/components/BrandHeader';
import { FloatingSupportFooter } from '../../components/BaseComponents/FloatingSupportFooter';
import pic from '../../assets/p2.jpeg';
import { StatusBanner } from '../../components/uicomponents/StatusBanner';
import { EmailStallCardBooking, EmailStallCardModal } from '../bookings/EmailStallCardModal';
// import { EmailStallCardModal, EmailStallCardBooking } from './EmailStallCardModal'; // Adjust import path if needed

type StallSizeOption = {
  id: string;
  code: string;
  displayName: string;
  baseAmount: number;
  gstPercentage: number;
  totalAmount: number;
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

type BookingDetailsResponse = {
  booking: {
    id: string;
    requestedStallSizeId: string;
    stallOption1Id?: string | null;
    stallOption2Id?: string | null;
    bookingRegistrationNumber: string;
    stallNumber: string;
    fasciaName: string;
    displayNotes?: string | null;
    electricalRequirement?: string | null;
    specialRequirement?: string | null;
    hazardousDemoDeclared: boolean;
    declarantName: string;
    declarantDesignation: string;
    declarationDate: string;
    termsAccepted: boolean;
    accuracyAccepted: boolean;
    paymentTimelineAccepted: boolean;
    cancellationPolicyAccepted: boolean;
    privacyConsentAccepted: boolean;
  };
  stall: {
    stallNumber: string,
    // currentStatu": 2,
    // "hallName": null,
    // "zoneName": null
  },
  payment: {
    paymentReferenceNumber: string
  },
  exhibitor: {
    legalName: string;
    tradeName?: string | null;
    registeredAddress: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    country: string;
    contactPersonName: string;
    contactPersonDesignation: string;
    mobile: string;
    alternateMobile?: string | null;
    email: string;
    website?: string | null;
    industryScale: string;
    businessType: string;
    companyConstitution: string;
    industryCategory: string;
    productServiceDescription: string;
    productKeywords: string;
    udyamNumber?: string | null;
    gstin?: string | null;
    pan?: string | null;
    tanNumber: string;
    lubMember: boolean;
    lubState?: string | null;
    lubChapter?: string | null;
    lubMembershipNumber?: string | null;
    companyLogo?: string | null;
    bankAccountName?: string | null;
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankIfscCode?: string | null;
  };
};

export const STATE_DISTRICT_MAP: Record<string, string[]> = {
  'Tamil Nadu': [
    'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul',
    'Erode', 'Hosur', 'Kallakurichi', 'Kanchipuram', 'Kanniyakumari', 'Karur', 'Krishnagiri',
    'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur',
    'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur',
    'Theni', 'Thoothukudi', 'Trichy', 'Tirunelveli', 'Tirupattur', 'Tiruppur', 'Tiruvallur',
    'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Villupuram', 'Virudhunagar'
  ],
  "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam"],
  Karnataka: [
    'Bagalkote', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 'Bidar',
    'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada',
    'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar',
    'Koppal', 'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga', 'Tumakuru',
    'Udupi', 'Uttara Kannada', 'Vijayapura', 'Yadgir'
  ],
  Kerala: [
    'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam', 'Kottayam',
    'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'
  ],
  'Andhra Pradesh': [
    'Alluri Sitharama Raju', 'Anakapalli', 'Anantapur', 'Annamayya', 'Bapatla', 'Chittoor',
    'Dr. B.R. Ambedkar Konaseema', 'East Godavari', 'Eluru', 'Guntur', 'Kakinada', 'Krishna',
    'Kurnool', 'Nandyal', 'NTR', 'Palnadu', 'Parvathipuram Manyam', 'Prakasam', 'Srikakulam',
    'Sri Sathya Sai', 'Tirupati', 'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'YSR Kadapa'
  ],
  Telangana: [
    'Adilabad', 'Bhadradri Kothagudem', 'Hanamkonda', 'Hyderabad', 'Jagtial', 'Jangaon',
    'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar', 'Khammam',
    'Komaram Bheem Asifabad', 'Mahabubabad', 'Mahabubnagar', 'Mancherial', 'Medak',
    'Medchal–Malkajgiri', 'Mulugu', 'Nagarkurnool', 'Nalgonda', 'Narayanpet', 'Nirmal',
    'Nizamabad', 'Peddapalli', 'Rajanna Sircilla', 'Ranga Reddy', 'Sangareddy', 'Siddipet',
    'Suryapet', 'Vikarabad', 'Wanaparthy', 'Warangal', 'Yadadri Bhuvanagiri'
  ],
  Maharashtra: [
    'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara', 'Buldhana',
    'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur',
    'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik',
    'Osmanabad', 'Palghar', 'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara',
    'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal'
  ]
};

const STATES = Object.keys(STATE_DISTRICT_MAP);

const STALL_SIZE_ID_MAP: Record<string, string> = {
  '3x2': 'bd5ac64d-2bea-4b27-9a1f-d8ecb33f26ba',
  '2x3': 'bd5ac64d-2bea-4b27-9a1f-d8ecb33f26ba',
  '3x3': 'ec65924e-e264-40ed-b5fc-afaa7dcc07a5',
  '2x2': 'fffb8810-ce4c-4cae-8688-17b37ac9ccbf',
};

const CSV_HEADERS = [
  'legalName', 'tradeName', 'registeredAddress', 'city', 'district', 'state', 'pincode',
  'country', 'contactPersonName', 'contactPersonDesignation', 'mobile', 'alternateMobile',
  'email', 'website', 'industryScale', 'businessType', 'companyConstitution', 'industryCategory',
  'productServiceDescription', 'productKeywords', 'udyamNumber', 'gstin', 'pan', 'lubMember',
  'lubState', 'lubChapter', 'lubMembershipNumber', 'requestedStallSize', 'fasciaName',
  'displayNotes', 'electricalRequirement', 'specialRequirement', 'termsAccepted',
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
  lubMember: false,
  lubState: 'Tamil Nadu',
  lubChapter: '',
  lubMembershipNumber: '',
  companyLogo: '',
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
  tanNumber: '',
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

function bookingDetailsToForm(details: BookingDetailsResponse): BookingFormState {
  const { booking, exhibitor, stall, payment } = details;

  return {
    ...initial,
    legalName: exhibitor.legalName ?? '',
    tradeName: exhibitor.tradeName ?? '',
    stallNumber: stall?.stallNumber,
    paymentReferenceNumber: payment?.paymentReferenceNumber,
    registeredAddress: exhibitor.registeredAddress ?? '',
    city: exhibitor.city ?? '',
    district: exhibitor.district ?? '',
    state: exhibitor.state ?? 'Tamil Nadu',
    pincode: exhibitor.pincode ?? '',
    country: exhibitor.country ?? 'India',
    contactPersonName: exhibitor.contactPersonName ?? '',
    contactPersonDesignation: exhibitor.contactPersonDesignation ?? '',
    mobile: exhibitor.mobile ?? '',
    alternateMobile: exhibitor.alternateMobile ?? '',
    email: exhibitor.email ?? '',
    website: exhibitor.website ?? '',
    industryScale: exhibitor.industryScale ?? '',
    businessType: exhibitor.businessType ?? '',
    companyConstitution: exhibitor.companyConstitution ?? '',
    industryCategory: exhibitor.industryCategory ?? '',
    productServiceDescription: exhibitor.productServiceDescription ?? '',
    productKeywords: exhibitor.productKeywords ?? '',
    udyamNumber: exhibitor.udyamNumber ?? '',
    gstin: exhibitor.gstin ?? '',
    pan: exhibitor.pan ?? '',
    tanNumber: exhibitor.tanNumber ?? '',
    lubMember: exhibitor.lubMember ?? false,
    lubState: exhibitor.lubState ?? 'Tamil Nadu',
    lubChapter: exhibitor.lubChapter ?? '',
    lubMembershipNumber: exhibitor.lubMembershipNumber ?? '',
    companyLogo: exhibitor.companyLogo ?? '',
    bankAccountName: exhibitor.bankAccountName ?? '',
    bankName: exhibitor.bankName ?? '',
    bankAccountNumber: exhibitor.bankAccountNumber ?? '',
    bankIfscCode: exhibitor.bankIfscCode ?? '',
    requestedStallSizeId: booking.requestedStallSizeId ?? '',
    stallOption1Id: booking.stallOption1Id ?? '',
    stallOption2Id: booking.stallOption2Id ?? '',
    fasciaName: booking.fasciaName ?? '',
    displayNotes: booking.displayNotes ?? '',
    electricalRequirement: booking.electricalRequirement ?? '',
    specialRequirement: booking.specialRequirement ?? '',
    hazardousDemoDeclared: booking.hazardousDemoDeclared ?? false,
    declarantName: booking.declarantName ?? '',
    declarantDesignation: booking.declarantDesignation ?? '',
    declarationDate: booking.declarationDate
      ? booking.declarationDate.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    termsAccepted: booking.termsAccepted ?? false,
    accuracyAccepted: booking.accuracyAccepted ?? false,
    paymentTimelineAccepted: booking.paymentTimelineAccepted ?? false,
    cancellationPolicyAccepted: booking.cancellationPolicyAccepted ?? false,
    privacyConsentAccepted: booking.privacyConsentAccepted ?? false,
    finalAllocationConsentAccepted: true,
  };
}

export function EditBookingPage() {
  const { bookingId } = useParams<{ bookingId?: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(bookingId);

  const [form, setForm] = useState<BookingFormState>(initial);
  const [stallSizes, setStallSizes] = useState<StallSizeOption[]>([]);
  const [stallOptions, setStallOptions] = useState<StallPreferenceOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(Boolean(bookingId));
  const [bookingNumber, setBookingNumber] = useState('');
  const [isPayment, setPayment] = useState('');

  const [error, setError] = useState('');
  const [companyLogoError, setCompanyLogoError] = useState('');
  const [success, setSuccess] = useState('');
  const [csvFileName, setCsvFileName] = useState('');
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
  const [showStallInfo, setShowStallInfo] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalEntered, setModalEntered] = useState(false);

  useEffect(() => {
    if (showSuccessModal) {
      const timer = requestAnimationFrame(() => setModalEntered(true));
      return () => cancelAnimationFrame(timer);
    }
    setModalEntered(false);
  }, [showSuccessModal]);

  useEffect(() => {
    if (!showStallInfo) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setShowStallInfo(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showStallInfo]);

  useEffect(() => {
    let active = true;

    async function loadPage() {
      setError('');

      try {
        const stallSizeResponse = await apiClient.get<StallSizeOption[]>(
          `/public/events/${appConfig.defaultEventCode}/stall-sizes`,
        );

        if (!active) return;
        setStallSizes(stallSizeResponse ?? []);

        if (!bookingId) {
          setLoadingBooking(false);
          return;
        }

        const bookingResponse = await apiClient.get<BookingDetailsResponse>(
          `/admin/events/current/bookings/${bookingId}`,
        );
        console.log("bookingResponse", bookingResponse);
        setPayment(bookingResponse.payment?.paymentReferenceNumber)

        if (!active) return;
        setBookingNumber(bookingResponse.booking.bookingRegistrationNumber);
        // setPayment(bookingResponse.payment.paymentReferenceNumber)
        setForm(bookingDetailsToForm(bookingResponse));
      } catch (caughtError) {
        if (!active) return;
        setError(
          caughtError instanceof ApiError
            ? caughtError.message
            : 'Unable to load booking information.',
        );
      } finally {
        if (active) setLoadingBooking(false);
      }
    }

    void loadPage();
    return () => {
      active = false;
    };
  }, [bookingId]);

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

  // Construct EmailStallCardBooking object dynamically from form state
  const currentStallCardBooking = useMemo<EmailStallCardBooking>(() => {
    const selectedStall = stallOptions.find(opt => opt.id === form.stallOption1Id); return {
      id: bookingId || 'preview-id',
      bookingRegistrationNumber: bookingNumber || 'DRAFT',
      stallNumber: text('stallNumber') || (selectedStall ? selectedStall.stallNumber : null), fasciaName: text('fasciaName') || null,
      companyName: text('legalName') || text('tradeName') || 'Exhibitor Company',
      contactPerson: text('contactPersonName'),
      email: text('email'),
      mobile: text('mobile'),
      industryCategory: text('industryCategory') || null,
      productKeywords: text('productKeywords') || null,
      companyLogo: text('companyLogo') || null,
      manufacturing: text('productServiceDescription') || null,
    };
  }, [bookingId, bookingNumber, form, stallOptions]);

  function set(name: string, value: string | boolean) {
    setForm(previous => ({ ...previous, [name]: value }));
  }

  function text(name: string): string {
    return String(form[name] ?? '');
  }

  function handleCompanyLogoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    setCompanyLogoError('');

    if (!file) {
      return;
    }

    const allowedTypes = [
      'image/png',
      'image/jpeg',
    ];

    if (!allowedTypes.includes(file.type)) {
      setCompanyLogoError(
        'Only PNG, JPG and JPEG company logos are allowed.'
      );

      event.target.value = '';
      return;
    }

    if (file.size > 1024 * 1024) {
      setCompanyLogoError(
        'Company logo must be 1 MB or smaller.'
      );

      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setCompanyLogoError(
          'Unable to read the selected company logo.'
        );

        return;
      }

      set('companyLogo', reader.result);
      setCompanyLogoError('');
    };

    reader.onerror = () => {
      setCompanyLogoError(
        'Unable to read the selected company logo.'
      );
    };

    reader.readAsDataURL(file);
  }

  function handleStallSizeChange(value: string) {
    setForm(previous => ({
      ...previous,
      requestedStallSizeId: value,
      stallOption1Id: '',
      stallOption2Id: '',
    }));
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

    const directId = Object.values(STALL_SIZE_ID_MAP)
      .find(id => id.toLowerCase() === normalized);

    if (directId) return directId;

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
        pan: optionalText(read('pan')).toUpperCase(),

        lubMember: readBoolean('lubMember'),
        lubState: optionalText(read('lubState')),
        lubChapter: optionalText(read('lubChapter')),
        lubMembershipNumber: optionalText(read('lubMembershipNumber')),

        // Bank details are optional — sent as empty strings when not provided.
        bankAccountName: optionalText(read('bankAccountName')),
        bankName: optionalText(read('bankName')),
        bankAccountNumber: optionalText(read('bankAccountNumber')),
        bankIfscCode: optionalText(read('bankIfscCode')).toUpperCase(),
      },

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

      termsAccepted: fromCsv ? true : readBoolean('termsAccepted'),
      accuracyAccepted: fromCsv ? true : readBoolean('accuracyAccepted'),
      paymentTimelineAccepted: fromCsv ? true : readBoolean('paymentTimelineAccepted'),
      cancellationPolicyAccepted: fromCsv ? true : readBoolean('cancellationPolicyAccepted'),
      privacyConsentAccepted: fromCsv ? true : readBoolean('privacyConsentAccepted'),
    };
  }

  function buildUpdatePayload(source: BookingFormState) {
    const read = (name: string): string => String(source[name] ?? '').trim();
    const readBoolean = (name: string): boolean => source[name] === true;

    return {
      requestedStallSizeId: read('requestedStallSizeId'),
      stallOption1Id: read('stallOption1Id') || null,
      stallOption2Id: read('stallOption2Id') || null,
      exhibitor: {
        legalName: read('legalName'),
        tradeName: read('tradeName'),
        registeredAddress: read('registeredAddress'),
        city: read('city'),
        district: read('district'),
        state: read('state'),
        pincode: read('pincode'),
        country: read('country') || 'India',
        contactPersonName: read('contactPersonName'),
        contactPersonDesignation: read('contactPersonDesignation'),
        mobile: read('mobile'),
        alternateMobile: read('alternateMobile'),
        email: read('email'),
        alternateEmail: '',
        website: read('website'),
        industryScale: read('industryScale'),
        businessType: read('businessType'),
        companyConstitution: read('companyConstitution'),
        industryCategory: read('industryCategory'),
        productServiceDescription: read('productServiceDescription'),
        productKeywords: read('productKeywords'),
        udyamNumber: read('udyamNumber').toUpperCase(),
        gstin: read('gstin').toUpperCase(),
        pan: read('pan').toUpperCase(),
        tanNumber: read('tanNumber'),
        lubMember: readBoolean('lubMember'),
        lubState: read('lubState'),
        lubChapter: read('lubChapter'),
        lubMembershipNumber: read('lubMembershipNumber'),
        companyLogo: read('companyLogo') || null,

        // Bank details are optional — kept null when the user leaves them blank
        // so the backend does not treat empty strings as an intentional clear.
        bankAccountName: read('bankAccountName') || null,
        bankName: read('bankName') || null,
        bankAccountNumber: read('bankAccountNumber') || null,
        bankIfscCode: read('bankIfscCode') ? read('bankIfscCode').toUpperCase() : null,
      },
      fasciaName: read('fasciaName').toUpperCase(),
      displayNotes: read('displayNotes'),
      electricalRequirement: read('electricalRequirement'),
      specialRequirement: read('specialRequirement'),
      hazardousDemoDeclared: readBoolean('hazardousDemoDeclared'),
      termsAccepted: readBoolean('termsAccepted'),
      accuracyAccepted: readBoolean('accuracyAccepted'),
      paymentTimelineAccepted: readBoolean('paymentTimelineAccepted'),
      cancellationPolicyAccepted: readBoolean('cancellationPolicyAccepted'),
      privacyConsentAccepted: readBoolean('privacyConsentAccepted'),
      declarantName: read('declarantName'),
      declarantDesignation: read('declarantDesignation'),
      declarationDate: read('declarationDate') || null,
    };
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (companyLogoError) {
      setError('Please resolve the company logo error before submitting.');
      return;
    }
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (bookingId) {
        await apiClient.put(
          `/admin/events/current/bookings/${bookingId}/application`,
          buildUpdatePayload(form),
        );

        setSuccess('Booking application updated successfully.');
        setShowSuccessModal(true);
        return;
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : bookingId
            ? 'Unable to update the booking application.'
            : 'Unable to submit booking application. Please check the entered values.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmitNew() {
    setShowSuccessModal(false);
    navigate('/stall-booking');
  }

  function handleBookSameDetails() {
    setShowSuccessModal(false);

    const sameDetailsForm: BookingFormState = {
      ...form,
      declarationDate: new Date().toISOString().slice(0, 10),
      termsAccepted: false,
      accuracyAccepted: false,
      paymentTimelineAccepted: false,
      cancellationPolicyAccepted: false,
      privacyConsentAccepted: false,
      finalAllocationConsentAccepted: false,
    };

    navigate('/stall-booking', { state: { prefillForm: sameDetailsForm } });
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
      lubMember: 'No',
      lubState: 'Tamil Nadu',
      lubChapter: 'Chennai',
      lubMembershipNumber: '',
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

  if (loadingBooking) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 text-center shadow">
          Loading booking application...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-6 sm:px-4 pb-28 sm:pb-24 md:pb-16">
      <form onSubmit={submit} className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl md:p-8">
        <BrandHeader />

        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-3xl bg-msme-blue p-6 text-white md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-100">{BRAND.portalName}</p>
            <h1 className="mt-2 text-3xl font-black">
              {isEditMode ? 'Edit Stall Booking Application' : 'Stall Booking Form'}
            </h1>
            {isEditMode && bookingNumber && (
              <p className="mt-2 text-sm font-semibold text-blue-100">
                Booking Number: {bookingNumber}
              </p>
            )}
            <p className="mt-2 text-sm text-blue-100">{BRAND.publicEventName}</p>
          </div>

          {/* Download & Email Stall Card Button */}
          {isEditMode && isPayment && (
            <button
              type="button"
              onClick={() => setShowEmailModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-extrabold text-white backdrop-blur-sm transition-all hover:bg-white hover:text-msme-blue"
            >
              <Mail className="h-5 w-5" />
              <span>Stall E-Card Options</span>
            </button>
          )}
        </div>

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

        <div className="mt-5">
          <StatusBanner
            success={success}
            error={error}
            onDismissSuccess={() => setSuccess('')}
            onDismissError={() => setError('')}
            autoHideMs={3000}
          />
        </div>

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
          <Field label="Mobile Number" name="mobile" value={text('mobile')} onChange={set} pattern="^(\\+91[-\\s]?)?[6-9][0-9]{9}$" required />
          <Field label="Landline / Alternate Number" name="alternateMobile" value={text('alternateMobile')} onChange={set} />
          <Field label="Email ID" name="email" value={text('email')} onChange={set} type="email" required />
          <Field label="Website" name="website" value={text('website')} onChange={set} />
          {isEditMode && (
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Company Logo
              </span>

              <input
                type="file"
                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                onChange={handleCompanyLogoChange}
                className={`input mt-1 block w-full cursor-pointer ${
                  companyLogoError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : ''
                }`}
              />

              {companyLogoError ? (
                <p className="mt-1 text-xs font-semibold text-red-600">
                  {companyLogoError}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  PNG, JPG or JPEG. Maximum size 1 MB.
                </p>
              )}

              {text('companyLogo') && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                  <p className="mb-2 text-xs font-semibold text-slate-600">
                    Company Logo Preview
                  </p>

                  <img
                    src={text('companyLogo')}
                    alt="Company logo preview"
                    className="h-24 w-full object-contain"
                  />
                </div>
              )}
            </label>
          )}
        </Section>

        <Section title="02. Compliance Details & LUB Membership">
          <RadioGroup label="Industry Scale" name="industryScale" value={text('industryScale')} options={['Micro', 'Small', 'Medium', 'Large Scale']} onChange={set} required />
          <RadioGroup label="Business Type" name="businessType" value={text('businessType')} options={['Manufacturer', 'Service Provider', 'Distributor']} onChange={set} required />
          <Select label="Company Constitution" name="companyConstitution" value={text('companyConstitution')} onChange={set} options={['Proprietorship', 'Partnership', 'Private Limited', 'Public Limited', 'LLP', 'Others']} />
          <Field label="PAN Number" name="pan" value={text('pan')} onChange={set} pattern="[A-Z]{5}[0-9]{4}[A-Z]" hint="ABCDE1234F" uppercase noSpaces required />
          <Field label="TAN Number" name="tanNumber" value={text('tanNumber')} onChange={set} pattern="[A-Z]{4}[0-9]{5}[A-Z]" hint="ABCD12345E" uppercase noSpaces required />

          <Field label="Udyam / UAM Number" name="udyamNumber" value={text('udyamNumber')} onChange={set} pattern="(UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}|UAM-[A-Z]{2}-[0-9]{2}-[0-9]{7})" hint="UDYAM-TN-02-1234567" uppercase noSpaces required />
          <Field label="GSTIN" name="gstin" value={text('gstin')} onChange={set} pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]" hint="33AAAAA0000A1Z5" uppercase noSpaces required />

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
              <Select label="LUB State / Region" name="lubState" value={text('lubState')} options={STATES} onChange={(name, value) => { set(name, value); set('lubChapter', ''); }} required />
              <Select label="LUB Chapter / District" name="lubChapter" value={text('lubChapter')} options={STATE_DISTRICT_MAP[text('lubState')] || []} onChange={set} required />
              <Field label="LUB Membership Number" name="lubMembershipNumber" value={text('lubMembershipNumber')} onChange={set} />
            </>
          )}
        </Section>

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
            <select className="input mt-1" value={text('requestedStallSizeId')} onChange={event => handleStallSizeChange(event.target.value)} disabled={!!bookingId}>
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
              <button
                type="button"
                onClick={() => setShowStallInfo(true)}
                className="ml-2 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-blue-600 hover:text-blue-800"
                aria-label="View stall layout information"
              >
                <Info className="h-5 w-5" />
              </button>
            </span>
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

          <Field label="Name on Fascia" name="fasciaName" value={text('fasciaName')} onChange={set} maxLength={60} required />
          <TextAreaField label="Display Notes" name="displayNotes" value={text('displayNotes')} onChange={set} />
          <TextAreaField label="Electrical Requirement" name="electricalRequirement" value={text('electricalRequirement')} onChange={set} />
          <TextAreaField label="Special Requirement" name="specialRequirement" value={text('specialRequirement')} onChange={set} />
        </Section>

        <Section title="04. Bank Details (Optional — for Refunds / Settlements)">
          <Field label="Bank Account Holder Name" name="bankAccountName" value={text('bankAccountName')} onChange={set} />
          <Field label="Bank Name" name="bankName" value={text('bankName')} onChange={set} />
          <Field label="Bank Account Number" name="bankAccountNumber" value={text('bankAccountNumber')} onChange={set} />
          <Field label="IFSC Code" name="bankIfscCode" value={text('bankIfscCode')} onChange={set} pattern="[A-Z]{4}0[A-Z0-9]{6}" hint="ABCD0123456" uppercase noSpaces />
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
              <h3 className="text-lg font-black text-slate-900">Digital Support Team</h3>
              <p className="mt-1 text-sm text-slate-600">
                For booking, payment or login assistance, contact our support team.
              </p>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <div className="flex-1 rounded-lg bg-blue-50 px-4 py-3">
                  <p className="font-bold text-slate-900">Sriram Hariharan</p>
                  <a
                    href="tel:+919840727309"
                    className="text-sm flex items-center gap-1 font-semibold text-blue-700 hover:underline"
                  >
                    <Phone className="h-4 w-4" />+91 98407 27309
                  </a>
                </div>

                {/* <div className="flex-1 rounded-lg bg-blue-50 px-4 py-3">
                  <p className="font-bold text-slate-900">Arun Vignesh P.B.</p>
                  <a
                    href="tel:+917092482244"
                    className="text-sm flex items-center gap-1 font-semibold text-blue-700 hover:underline"
                  >
                    <Phone className="h-4 w-4" />+91 70924 82244
                  </a>
                </div> */}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 px-4 py-3 text-center">
            <p className="text-xs font-bold text-white">
              MSME Sangamam Connect - Tamil Nadu Organising Team
            </p>
          </div>
        </section>

        <div className="mt-4 grid gap-3">
          <Check label="I accept the event terms and conditions" name="termsAccepted" checked={form.termsAccepted === true} onChange={set} />
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">All fields are optional. Blank values are sent as null.</p>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || bulkUploading || loadingBooking}
          >
            {submitting
              ? isEditMode
                ? 'Updating…'
                : 'Submitting…'
              : isEditMode
                ? 'Update Booking Application'
                : 'Submit Stall Booking Application'}
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
              Booking Updated Successfully
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Booking Registration Number
              <br />
              <span className="text-base font-bold text-slate-800">{bookingNumber}</span>
            </p>

            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Do you want to submit a completely new application, or book another
              stall using the same exhibitor details?
            </p>

            {/* Card download/email option — only if this booking has a payment */}
            {isPayment && (
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setShowEmailModal(true);
                }}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-msme-blue px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98]"
              >
                <Mail className="h-4 w-4" />
                Download / Email Stall Card
              </button>
            )}



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

      {/* Modal for Stall Layout Reference */}
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

      {/* Modal for Previewing, Downloading, and Emailing Stall Card */}
      {showEmailModal && (
        <EmailStallCardModal
          booking={currentStallCardBooking}
          onClose={() => {
            navigate('/*')
            setShowEmailModal(false)
          }
          }
          disableSendEmail
        />
      )}
    </main>
  );
}

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

function Check({
  label,
  name,
  checked,
  onChange,
}: {
  label: string;
  name: string;
  checked: boolean;
  onChange: (name: string, value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700">
      <input type="checkbox" className="mt-1" checked={checked} onChange={event => onChange(name, event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}