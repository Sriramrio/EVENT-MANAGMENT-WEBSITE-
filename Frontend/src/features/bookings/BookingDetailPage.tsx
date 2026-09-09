import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';
import { Pencil, Save, X } from 'lucide-react';
import { apiClient, ApiError } from '../../data/api/apiClient';
import { StatusBadge } from '../../shared/StatusBadge';

type StallSizeOption = {
  id: string;
  code: string;
  displayName: string;
  baseAmount: number;
  gstPercentage: number;
  totalAmount: number;
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
    'Virudhunagar'
  ],
  "Puducherry": [
    "Puducherry",
    "Karaikal",
    "Mahe",
    "Yanam"
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
    'Yadgir'
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
    'Wayanad'
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
    'YSR Kadapa'
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
    'Yadadri Bhuvanagiri'
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
    'Yavatmal'
  ]
};

const STATES = Object.keys(STATE_DISTRICT_MAP);
type StallInfo = {
  id: string;
  stallNumber: string;
  stallSizeId: string;
  currentStatus: string;
} | null;
type BookingDetailsResponse = {
  booking: {
    id: string;
    tenantId: string;
    eventId: string;
    exhibitorId: string;
    billingProfileId: string;
    requestedStallSizeId: string;
    allocatedStallId: string | null;
    bookingRegistrationNumber: string;
    bookingDate: string;
    bookingStatus: number | string;
    fasciaName: string;
    displayNotes: string | null;
    electricalRequirement: string | null;
    specialRequirement: string | null;
    hazardousDemoDeclared: boolean;
    termsAccepted: boolean;
    accuracyAccepted: boolean;
    paymentTimelineAccepted: boolean;
    cancellationPolicyAccepted: boolean;
    privacyConsentAccepted: boolean;
    declarantName: string;
    declarantDesignation: string;
    declarationDate: string;
    blockExpiresAt: string | null;
    lastEmailSentAt: string | null;
    confirmedAt: string | null;
    cancelledAt: string | null;
    cancellationReason: string | null;
  };

  exhibitor: {
    id: string;
    tenantId: string;

    legalName: string;
    tradeName: string | null;
    registeredAddress: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    country: string;

    contactPersonName: string;
    contactPersonDesignation: string;
    mobile: string;
    alternateMobile: string | null;
    email: string;
    alternateEmail: string | null;
    website: string | null;

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
    lubMembershipNumber: string | null;
    bankAccountName: string | null;
    bankName: string | null;
    bankAccountNumber: string | null;
    bankIfscCode: string | null;
  };

  billing: unknown;
  stall: StallInfo;

  stallSize: StallSizeOption | null;
  proformaInvoice: unknown;
  payment: unknown;
};

type ApplicationForm = {
  legalName: string;
  tradeName: string;
  registeredAddress: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  country: string;

  contactPersonName: string;
  contactPersonDesignation: string;
  mobile: string;
  alternateMobile: string;
  email: string;
  alternateEmail: string;
  website: string;

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
  lubMembershipNumber: string;
 bankAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfscCode: string;

  requestedStallSizeId: string;
  fasciaName: string;
  displayNotes: string;
  electricalRequirement: string;
  specialRequirement: string;
  hazardousDemoDeclared: boolean;

  termsAccepted: boolean;

  declarantName: string;
  declarantDesignation: string;
  declarationDate: string;
};

const emptyForm: ApplicationForm = {
  legalName: '',
  tradeName: '',
  registeredAddress: '',
  city: '',
  district: '',
  state: '',
  pincode: '',
  country: 'India',

  contactPersonName: '',
  contactPersonDesignation: '',
  mobile: '',
  alternateMobile: '',
  email: '',
  alternateEmail: '',
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
  lubState: '',
  lubChapter: '',
  lubMembershipNumber: '',
  bankAccountName: '',
  bankName: '',
  bankAccountNumber: '',
  bankIfscCode: '',
  requestedStallSizeId: '',
  fasciaName: '',
  displayNotes: '',
  electricalRequirement: '',
  specialRequirement: '',
  hazardousDemoDeclared: false,

  termsAccepted: false,

  declarantName: '',
  declarantDesignation: '',
  declarationDate: '',
};

function detailsToForm(
  details: BookingDetailsResponse,
): ApplicationForm {
  return {
    legalName: details.exhibitor.legalName ?? '',
    tradeName: details.exhibitor.tradeName ?? '',
    registeredAddress:
      details.exhibitor.registeredAddress ?? '',
    city: details.exhibitor.city ?? '',
    district: details.exhibitor.district ?? '',
    state: details.exhibitor.state ?? '',
    pincode: details.exhibitor.pincode ?? '',
    country: details.exhibitor.country ?? 'India',

    contactPersonName:
      details.exhibitor.contactPersonName ?? '',
    contactPersonDesignation:
      details.exhibitor.contactPersonDesignation ?? '',
    mobile: details.exhibitor.mobile ?? '',
    alternateMobile:
      details.exhibitor.alternateMobile ?? '',
    email: details.exhibitor.email ?? '',
    alternateEmail:
      details.exhibitor.alternateEmail ?? '',
    website: details.exhibitor.website ?? '',

    industryScale:
      details.exhibitor.industryScale ?? '',
    businessType:
      details.exhibitor.businessType ?? '',
    companyConstitution:
      details.exhibitor.companyConstitution ?? '',
    industryCategory:
      details.exhibitor.industryCategory ?? '',
    productServiceDescription:
      details.exhibitor.productServiceDescription ?? '',
    productKeywords:
      details.exhibitor.productKeywords ?? '',

    udyamNumber:
      details.exhibitor.udyamNumber ?? '',
    gstin: details.exhibitor.gstin ?? '',
    pan: details.exhibitor.pan ?? '',

    lubMember: details.exhibitor.lubMember ?? false,
    lubState: details.exhibitor.lubState ?? '',
    lubChapter: details.exhibitor.lubChapter ?? '',
    lubMembershipNumber:
      details.exhibitor.lubMembershipNumber ?? '',
 bankAccountName: details.exhibitor.bankAccountName ?? '',
    bankName: details.exhibitor.bankName ?? '',
    bankAccountNumber: details.exhibitor.bankAccountNumber ?? '',
    bankIfscCode: details.exhibitor.bankIfscCode ?? '',
    requestedStallSizeId:
      details.booking.requestedStallSizeId ?? '',
    fasciaName: details.booking.fasciaName ?? '',
    displayNotes:
      details.booking.displayNotes ?? '',
    electricalRequirement:
      details.booking.electricalRequirement ?? '',
    specialRequirement:
      details.booking.specialRequirement ?? '',
    hazardousDemoDeclared:
      details.booking.hazardousDemoDeclared ?? false,

    termsAccepted:
      details.booking.termsAccepted ?? false,

    declarantName:
      details.booking.declarantName ?? '',
    declarantDesignation:
      details.booking.declarantDesignation ?? '',
    declarationDate:
      details.booking.declarationDate ?? '',
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong.';
}

export function BookingDetailPage() {
  const { bookingId } = useParams();

  const [details, setDetails] =
    useState<BookingDetailsResponse | null>(null);

  const [form, setForm] =
    useState<ApplicationForm>(emptyForm);

  const [stallSizes, setStallSizes] = useState<
    StallSizeOption[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedStallSize = useMemo(
    () =>
      stallSizes.find(
        size => size.id === form.requestedStallSizeId,
      ) ??
      details?.stallSize ??
      null,
    [
      stallSizes,
      form.requestedStallSizeId,
      details?.stallSize,
    ],
  );

  useEffect(() => {
    if (!bookingId) {
      setError('Booking ID was not found.');
      setLoading(false);
      return;
    }

    void loadPage(bookingId);
  }, [bookingId]);

  async function loadPage(id: string) {
    setLoading(true);
    setError('');

    try {
      const [bookingResponse, stallSizeResponse] =
        await Promise.all([
          apiClient.get<BookingDetailsResponse>(
            `/admin/events/current/bookings/${id}`,
          ),

          apiClient.get<StallSizeOption[]>(
            '/public/events/MSME-HOSUR-2026/stall-sizes',
          ),
        ]);

      setDetails(bookingResponse);
      setForm(detailsToForm(bookingResponse));
      setStallSizes(stallSizeResponse);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setLoading(false);
    }
  }

  function updateText(
    event: ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;

    setForm(previous => {
      const updated = {
        ...previous,
        [name]: value,
      };

      // Reset district when state changes
      if (name === 'state') {
        updated.district = '';
      }

      return updated;
    });
  }

  function updateCheckbox(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const { name, checked } = event.target;

    setForm(previous => ({
      ...previous,
      [name]: checked,
    }));
  }
  const districts = useMemo(
    () => STATE_DISTRICT_MAP[form.state] ?? [],
    [form.state]
  );

  function startEditing() {
    if (details) {
      setForm(detailsToForm(details));
    }

    setError('');
    setSuccess('');
    setEditing(true);
  }

  function cancelEditing() {
    if (details) {
      setForm(detailsToForm(details));
    }

    setEditing(false);
    setError('');
    setSuccess('');
  }

  async function saveApplication(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!bookingId) {
      setError('Booking ID was not found.');
      return;
    }

    if (!form.requestedStallSizeId) {
      setError('Please select a stall size.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      requestedStallSizeId:
        form.requestedStallSizeId,

      exhibitor: {
        legalName: form.legalName,
        tradeName: form.tradeName,
        registeredAddress:
          form.registeredAddress,
        city: form.city,
        district: form.district,
        state: form.state,
        pincode: form.pincode,
        country: form.country,

        contactPersonName:
          form.contactPersonName,
        contactPersonDesignation:
          form.contactPersonDesignation,
        mobile: form.mobile,
        alternateMobile:
          form.alternateMobile,
        email: form.email,
        alternateEmail:
          form.alternateEmail,
        website: form.website,

        industryScale:
          form.industryScale,
        businessType:
          form.businessType,
        companyConstitution:
          form.companyConstitution,
        industryCategory:
          form.industryCategory,
        productServiceDescription:
          form.productServiceDescription,
        productKeywords:
          form.productKeywords,

        udyamNumber:
          form.udyamNumber.toUpperCase(),
        gstin: form.gstin.toUpperCase(),
        pan: form.pan.toUpperCase(),

        lubMember: form.lubMember,
        lubState: form.lubState,
        lubChapter: form.lubChapter,
        lubMembershipNumber:
          form.lubMembershipNumber,
          bankAccountName: form.bankAccountName,
        bankName: form.bankName,
        bankAccountNumber: form.bankAccountNumber,
        bankIfscCode: form.bankIfscCode.toUpperCase(),
      },

      fasciaName:
        form.fasciaName.toUpperCase(),
      displayNotes: form.displayNotes,
      electricalRequirement:
        form.electricalRequirement,
      specialRequirement:
        form.specialRequirement,
      hazardousDemoDeclared:
        form.hazardousDemoDeclared,

      termsAccepted: form.termsAccepted,

      declarantName: form.declarantName,
      declarantDesignation:
        form.declarantDesignation,
      declarationDate:
        form.declarationDate || null,
    };

    try {
      await apiClient.put(
        `/admin/events/current/bookings/${bookingId}/application`,
        payload,
      );

      const refreshed =
        await apiClient.get<BookingDetailsResponse>(
          `/admin/events/current/bookings/${bookingId}`,
        );

      setDetails(refreshed);
      setForm(detailsToForm(refreshed));
      setEditing(false);

      setSuccess(
        'Application information updated successfully.',
      );
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="card p-6">
        Loading booking application...
      </div>
    );
  }

  if (!details) {
    return (
      <div className="card p-6">
        {error || 'Booking not found.'}
      </div>
    );
  }

  const { booking } = details;

  return (
    <form onSubmit={saveApplication}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            {booking.bookingRegistrationNumber}
          </h2>

          <div className="mt-2">
            <StatusBadge value={booking.bookingStatus} />
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Submitted on{' '}
            {new Date(
              booking.bookingDate,
            ).toLocaleString()}
          </p>
        </div>

        <div className="flex gap-2">
          {!editing ? (
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-2"
              onClick={startEditing}
            >
              <Pencil className="h-4 w-4" />
              Edit Application
            </button>
          ) : (
            <>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700"
                disabled={saving}
                onClick={cancelEditing}
              >
                <X className="h-4 w-4" />
                Cancel
              </button>

              <button
                type="submit"
                className="btn-primary inline-flex items-center gap-2"
                disabled={saving}
              >
                <Save className="h-4 w-4" />
                {saving
                  ? 'Saving...'
                  : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      )}

      <FormSection title="01. Exhibitor and Company Details">
        <FormField
          label="Company / Exhibitor Name"
          name="legalName"
          value={form.legalName}
          editing={editing}
          onChange={updateText}
        />

        <FormField
          label="Brand / Trade Name"
          name="tradeName"
          value={form.tradeName}
          editing={editing}
          onChange={updateText}
        />

        <FormTextArea
          label="Registered Address"
          name="registeredAddress"
          value={form.registeredAddress}
          editing={editing}
          onChange={updateText}
        />

        <FormField
          label="City"
          name="city"
          value={form.city}
          editing={editing}
          onChange={updateText}
        />

        <FormSelect
          label="District"
          name="district"
          value={form.district}
          editing={editing}
          onChange={updateText}
          options={districts}
        />

        <FormSelect
          label="State"
          name="state"
          value={form.state}
          editing={editing}
          onChange={updateText}
          options={STATES}
        />

        <FormField
          label="PIN Code"
          name="pincode"
          value={form.pincode}
          editing={editing}
          onChange={updateText}
        />

        <FormField
          label="Country"
          name="country"
          value={form.country}
          editing={editing}
          onChange={updateText}
        />

        <FormField
          label="Contact Person"
          name="contactPersonName"
          value={form.contactPersonName}
          editing={editing}
          onChange={updateText}
        />

        <FormField
          label="Designation"
          name="contactPersonDesignation"
          value={form.contactPersonDesignation}
          editing={editing}
          onChange={updateText}
        />

        <FormField
          label="Mobile Number"
          name="mobile"
          value={form.mobile}
          editing={editing}
          onChange={updateText}
        />

        <FormField
          label="Alternate Mobile"
          name="alternateMobile"
          value={form.alternateMobile}
          editing={editing}
          onChange={updateText}
        />

        <FormField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          editing={editing}
          onChange={updateText}
        />

        <FormField
          label="Alternate Email"
          name="alternateEmail"
          type="email"
          value={form.alternateEmail}
          editing={editing}
          onChange={updateText}
        />

        <FormField
          label="Website"
          name="website"
          value={form.website}
          editing={editing}
          onChange={updateText}
        />
      </FormSection>

      <FormSection title="02. Compliance and LUB Membership">
        <FormSelect
          label="Industry Scale"
          name="industryScale"
          value={form.industryScale}
          editing={editing}
          onChange={updateText}
          options={[
            'Micro',
            'Small',
            'Medium',
            'Large Scale',
          ]}
        />

        <FormSelect
          label="Business Type"
          name="businessType"
          value={form.businessType}
          editing={editing}
          onChange={updateText}
          options={[
            'Manufacturer',
            'Service Provider',
            'Distributor',
          ]}
        />

        <FormSelect
          label="Company Constitution"
          name="companyConstitution"
          value={form.companyConstitution}
          editing={editing}
          onChange={updateText}
          options={[
            'Proprietorship',
            'Partnership',
            'Private Limited',
            'Public Limited',
            'LLP',
            'Others',
          ]}
        />

        <FormField
          label="Udyam / UAM Number"
          name="udyamNumber"
          value={form.udyamNumber}
          editing={editing}
          onChange={updateText}
        />

        <FormField
          label="GSTIN"
          name="gstin"
          value={form.gstin}
          editing={editing}
          onChange={updateText}
        />

        <FormField
          label="PAN"
          name="pan"
          value={form.pan}
          editing={editing}
          onChange={updateText}
        />

        <FormCheckbox
          label="LUB Member"
          name="lubMember"
          checked={form.lubMember}
          editing={editing}
          onChange={updateCheckbox}
        />

        <FormField
          label="LUB State / Region"
          name="lubState"
          value={form.lubState}
          editing={editing}
          onChange={updateText}
        />

        <FormField
          label="LUB Chapter / District"
          name="lubChapter"
          value={form.lubChapter}
          editing={editing}
          onChange={updateText}
        />

        <FormField
          label="LUB Membership Number"
          name="lubMembershipNumber"
          value={form.lubMembershipNumber}
          editing={editing}
          onChange={updateText}
        />
      </FormSection>

      <FormSection title="03. Product, Service and Stall Details">
        <FormSelect
          label="Industry Category"
          name="industryCategory"
          value={form.industryCategory}
          editing={editing}
          onChange={updateText}
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
        />

        <FormField
          label="Product Keywords"
          name="productKeywords"
          value={form.productKeywords}
          editing={editing}
          onChange={updateText}
        />

        <FormTextArea
          label="Manufacturing / Service Description"
          name="productServiceDescription"
          value={form.productServiceDescription}
          editing={editing}
          onChange={updateText}
        />

        <FormSelect
          label="Requested Stall Size"
          name="requestedStallSizeId"
          value={form.requestedStallSizeId}
          editing={editing}
          onChange={updateText}
          options={stallSizes.map(size => ({
            value: size.id,
            label:
              `${size.displayName} · ₹` +
              size.totalAmount.toLocaleString('en-IN'),
          }))}
        />

        <FormField
          label="Name on Fascia"
          name="fasciaName"
          value={form.fasciaName}
          editing={editing}
          onChange={updateText}
        />

        <FormTextArea
          label="Display Notes"
          name="displayNotes"
          value={form.displayNotes}
          editing={editing}
          onChange={updateText}
        />

        <FormTextArea
          label="Electrical Requirement"
          name="electricalRequirement"
          value={form.electricalRequirement}
          editing={editing}
          onChange={updateText}
        />

        <FormTextArea
          label="Special Requirement"
          name="specialRequirement"
          value={form.specialRequirement}
          editing={editing}
          onChange={updateText}
        />

        <FormCheckbox
          label="Hazardous / Live Equipment Declared"
          name="hazardousDemoDeclared"
          checked={form.hazardousDemoDeclared}
          editing={editing}
          onChange={updateCheckbox}
        />
      </FormSection>
  

      <FormSection title="04. Bank Details (Optional)">
        <FormField
          label="Bank Account Holder Name"
          name="bankAccountName"
          value={form.bankAccountName}
          editing={editing}
          onChange={updateText}
        />

        <FormField
          label="Bank Name"
          name="bankName"
          value={form.bankName}
          editing={editing}
          onChange={updateText}
        />

        <FormField
          label="Bank Account Number"
          name="bankAccountNumber"
          value={form.bankAccountNumber}
          editing={editing}
          onChange={updateText}
        />

        <FormField
          label="IFSC Code"
          name="bankIfscCode"
          value={form.bankIfscCode}
          editing={editing}
          onChange={updateText}
        />
      </FormSection>
      <FormSection title="05. Declaration and Terms">
        <FormField
          label="Declarant Name"
          name="declarantName"
          value={form.declarantName}
          editing={editing}
          onChange={updateText}
        />

        <FormField
          label="Declarant Designation"
          name="declarantDesignation"
          value={form.declarantDesignation}
          editing={editing}
          onChange={updateText}
        />

        <FormField
          label="Declaration Date"
          name="declarationDate"
          type="date"
          value={form.declarationDate}
          editing={editing}
          onChange={updateText}
        />

        <FormCheckbox
          label="Terms and Conditions Accepted"
          name="termsAccepted"
          checked={form.termsAccepted}
          editing={editing}
          onChange={updateCheckbox}
        />
      </FormSection>

      <section className="card mt-6 p-5">
        <h3 className="font-bold text-slate-900">
          Current Stall Price
        </h3>

        {selectedStallSize ? (
          <dl className="mt-4 grid gap-4 text-sm md:grid-cols-4">
            <Info
              label="Size"
              value={selectedStallSize.displayName}
            />

            <Info
              label="Base Amount"
              value={`₹${selectedStallSize.baseAmount.toLocaleString(
                'en-IN',
              )}`}
            />

            <Info
              label="GST"
              value={`${selectedStallSize.gstPercentage}%`}
            />

            <Info
              label="Total Amount"
              value={`₹${selectedStallSize.totalAmount.toLocaleString(
                'en-IN',
              )}`}
            />
          </dl>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            Stall-size information is unavailable.
          </p>
        )}
      </section>

      <section className="card mt-6 p-5">
        <h3 className="font-bold text-slate-900">
          Booking Lifecycle
        </h3>

        <dl className="mt-4 grid gap-4 text-sm md:grid-cols-3">
          <Info
            label="Allocated Stall"
            value={
              booking.allocatedStallId
                ? (details.stall?.stallNumber ?? booking.allocatedStallId)
                : 'Not allocated'
            }
          />

          <Info
            label="Block Expires"
            value={
              booking.blockExpiresAt
                ? new Date(
                  booking.blockExpiresAt,
                ).toLocaleString()
                : '—'
            }
          />

          <Info
            label="Confirmed At"
            value={
              booking.confirmedAt
                ? new Date(
                  booking.confirmedAt,
                ).toLocaleString()
                : '—'
            }
          />
        </dl>
      </section>

      {editing && (
        <div className="sticky bottom-4 mt-6 flex justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <button
            type="button"
            className="rounded-xl border border-slate-300 px-5 py-2 font-semibold text-slate-700"
            disabled={saving}
            onClick={cancelEditing}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
          >
            {saving
              ? 'Saving Changes...'
              : 'Save Application'}
          </button>
        </div>
      )}
    </form>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card mt-6 p-5">
      <h3 className="text-lg font-bold text-slate-900">
        {title}
      </h3>

      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function FormField({
  label,
  name,
  value,
  editing,
  onChange,
  type = 'text',
}: {
  label: string;
  name: keyof ApplicationForm;
  value: string;
  editing: boolean;
  onChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  type?: string;
}) {
  if (!editing) {
    return <Info label={label} value={value || '—'} />;
  }

  return (
    <label>
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        className="input mt-1"
        name={name}
        type={type}
        value={value}
        onChange={onChange}
      />
    </label>
  );
}

function FormTextArea({
  label,
  name,
  value,
  editing,
  onChange,
}: {
  label: string;
  name: keyof ApplicationForm;
  value: string;
  editing: boolean;
  onChange: (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => void;
}) {
  if (!editing) {
    return <Info label={label} value={value || '—'} />;
  }

  return (
    <label>
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <textarea
        className="input mt-1"
        name={name}
        rows={3}
        value={value}
        onChange={onChange}
      />
    </label>
  );
}

type SelectOption =
  | string
  | {
    value: string;
    label: string;
  };

function FormSelect({
  label,
  name,
  value,
  options,
  editing,
  onChange,
}: {
  label: string;
  name: keyof ApplicationForm;
  value: string;
  options: SelectOption[];
  editing: boolean;
  onChange: (
    event: ChangeEvent<HTMLSelectElement>,
  ) => void;
}) {
  const selectedLabel =
    options
      .map(option =>
        typeof option === 'string'
          ? {
            value: option,
            label: option,
          }
          : option,
      )
      .find(option => option.value === value)
      ?.label ?? value;

  if (!editing) {
    return (
      <Info
        label={label}
        value={selectedLabel || '—'}
      />
    );
  }

  return (
    <label>
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <select
        className="input mt-1"
        name={name}
        value={value}
        onChange={onChange}
      >
        <option value="">Select</option>

        {options.map(option => {
          const normalized =
            typeof option === 'string'
              ? {
                value: option,
                label: option,
              }
              : option;

          return (
            <option
              key={normalized.value}
              value={normalized.value}
            >
              {normalized.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function FormCheckbox({
  label,
  name,
  checked,
  editing,
  onChange,
}: {
  label: string;
  name: keyof ApplicationForm;
  checked: boolean;
  editing: boolean;
  onChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
}) {
  if (!editing) {
    return (
      <Info
        label={label}
        value={checked ? 'Yes' : 'No'}
      />
    );
  }

  return (
    <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
      />

      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>
    </label>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>

      <dd className="mt-1 break-words font-semibold text-slate-800">
        {value}
      </dd>
    </div>
  );
}