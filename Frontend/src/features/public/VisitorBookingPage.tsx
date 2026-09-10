import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Info, Phone, X } from 'lucide-react';
import { BRAND } from '../../config/brand';
import { apiClient, ApiError } from '../../data/api/apiClient';
import { visitorApiClient, setVisitorSession } from '../../data/api/visitorApiClient';
import { BrandHeader } from '../../shared/components/BrandHeader';
import { FloatingSupportFooter } from '../../components/BaseComponents/FloatingSupportFooter';

type BookingFormState = Record<string, string | boolean>;

export const STATE_DISTRICT_MAP: Record<string, string[]> = {
    'Tamil Nadu': [
        'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri',
        'Dindigul', 'Erode', 'Hosur', 'Kallakurichi', 'Kanchipuram', 'Kanniyakumari',
        'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal',
        'Nilgiris', 'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem',
        'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Trichy',
        'Tirunelveli', 'Tirupattur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai',
        'Tiruvarur', 'Vellore', 'Villupuram', 'Virudhunagar', 'Other District'
    ],
    'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam', 'Other District'],
    'Karnataka': [
        'Bagalkote', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 'Bidar',
        'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada',
        'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar',
        'Koppal', 'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga', 'Tumakuru',
        'Udupi', 'Uttara Kannada', 'Vijayapura', 'Yadgir', 'Other District'
    ],
    'Kerala': [
        'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam', 'Kottayam',
        'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram',
        'Thrissur', 'Wayanad', 'Other District'
    ],
    'Andhra Pradesh': [
        'Alluri Sitharama Raju', 'Anakapalli', 'Anantapur', 'Annamayya', 'Bapatla',
        'Chittoor', 'Dr. B.R. Ambedkar Konaseema', 'East Godavari', 'Eluru', 'Guntur',
        'Kakinada', 'Krishna', 'Kurnool', 'Nandyal', 'NTR', 'Palnadu',
        'Parvathipuram Manyam', 'Prakasam', 'Srikakulam', 'Sri Sathya Sai', 'Tirupati',
        'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'YSR Kadapa', 'Other District'
    ],
    'Telangana': [
        'Adilabad', 'Bhadradri Kothagudem', 'Hanamkonda', 'Hyderabad', 'Jagtial', 'Jangaon',
        'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar', 'Khammam',
        'Komaram Bheem Asifabad', 'Mahabubabad', 'Mahabubnagar', 'Mancherial', 'Medak',
        'Medchal–Malkajgiri', 'Mulugu', 'Nagarkurnool', 'Nalgonda', 'Narayanpet', 'Nirmal',
        'Nizamabad', 'Peddapalli', 'Rajanna Sircilla', 'Ranga Reddy', 'Sangareddy',
        'Siddipet', 'Suryapet', 'Vikarabad', 'Wanaparthy', 'Warangal', 'Yadadri Bhuvanagiri', 'Other District'
    ],
    'Maharashtra': [
        'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara', 'Buldhana',
        'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna',
        'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nanded',
        'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar', 'Parbhani', 'Pune', 'Raigad',
        'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha',
        'Washim', 'Yavatmal', 'Other District'
    ],
    'Other State': [
        'Other District'
    ]
};

const STATES = Object.keys(STATE_DISTRICT_MAP);

const initial: BookingFormState = {
    legalName: '',
    tradeName: '',
    registeredAddress: '',
    city: '',
    district: '',
    state: 'Tamil Nadu',
    pincode: '',
    country: 'India',
    pan: '',
    contactPersonName: '',
    contactPersonDesignation: '',
    mobile: '',
    alternateMobile: '',
    email: '',
    alternateEmail: '',
    website: '',
    industryScale: 'Micro',
    businessType: 'Manufacturer',
    companyConstitution: 'Proprietorship',
    industryCategory: 'Others',
    productServiceDescription: '',
    productKeywords: '',
    declarantName: '',
    declarantDesignation: '',
    declarationDate: new Date().toISOString().slice(0, 10),
    termsAccepted: false,
    accuracyAccepted: true,
    paymentTimelineAccepted: true,
    lubMember: false,
    interestedInLub: false
};

function optionalText(value: unknown): string {
    return String(value ?? '').trim();
}

function requiredFallback(value: unknown, fallback = '-'): string {
    const text = String(value ?? '').trim();
    return text || fallback;
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

export function VisitorBookingPage() {
    const [form, setForm] = useState<BookingFormState>(initial);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
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

    useEffect(() => {
        const prefill = (location.state as { prefillForm?: BookingFormState } | null)?.prefillForm;
        if (prefill) {
            setForm(prefill);
        }
    }, [location.state]);

    function set(name: string, value: string | boolean) {
        setForm(previous => ({ ...previous, [name]: value }));
    }

    function text(name: string): string {
        return String(form[name] ?? '');
    }

    function handleStateChange(name: string, value: string) {
        setForm(previous => ({
            ...previous,
            [name]: value,
            district: name === 'state' ? '' : previous.district,
        }));
    }

    // Builds flat payload object matching backend contract
    function buildPayload(source: BookingFormState) {
        const read = (name: string): string => String(source[name] ?? '').trim();

        const legalName = requiredFallback(read('legalName'), 'UNNAMED VISITOR');
        const contactPersonName = requiredFallback(read('contactPersonName'), legalName);
        const contactPersonDesignation = requiredFallback(read('contactPersonDesignation'), 'Representative');

        return {
            tenantId: '11111111-1111-1111-1111-111111111111',
            eventId: '22222222-2222-2222-2222-222222222222',
            legalName,
            tradeName: optionalText(read('tradeName')) || legalName,
            registeredAddress: requiredFallback(read('registeredAddress')),
            city: requiredFallback(read('city')),
            district: requiredFallback(read('district')),
            state: requiredFallback(read('state'), 'Tamil Nadu'),
            pincode: requiredFallback(read('pincode'), '600001'),
            country: requiredFallback(read('country'), 'India'),
            pan: optionalText(read('pan')),
            contactPersonName,
            contactPersonDesignation,
            mobile: requiredFallback(read('mobile')),
            alternateMobile: optionalText(read('alternateMobile')),
            email: requiredFallback(read('email')),
            alternateEmail: optionalText(read('alternateEmail')),
            website: optionalText(read('website')),
            industryScale: requiredFallback(read('industryScale'), 'Micro'),
            businessType: requiredFallback(read('businessType'), 'Manufacturer'),
            companyConstitution: requiredFallback(read('companyConstitution'), 'Proprietorship'),
            industryCategory: requiredFallback(read('industryCategory'), 'Others'),
            productServiceDescription: requiredFallback(read('productServiceDescription')).slice(0, 500),
            productKeywords: requiredFallback(read('productKeywords')).slice(0, 250),
            declarantName: requiredFallback(read('declarantName'), contactPersonName),
            declarantDesignation: requiredFallback(read('declarantDesignation'), contactPersonDesignation),
            declarationDate: read('declarationDate') || new Date().toISOString().slice(0, 10),
            termsAccepted: source['termsAccepted'] === true,
            accuracyAccepted: source['accuracyAccepted'] !== false,
            paymentTimelineAccepted: source['paymentTimelineAccepted'] !== false,
            lubMember: source['lubMember'] === true,
            interestedInLub: source['lubMember'] === true ? false : source['interestedInLub'] === true,
        };
    }

    async function submit(event: FormEvent) {
        event.preventDefault();

        // Check terms acceptance
        if (form.termsAccepted !== true) {
            setError('Please accept the Terms and Conditions to submit registration.');
            return;
        }

        // Validate PIN Code
        const pincode = text('pincode');
        if (pincode && !/^[1-9][0-9]{5}$/.test(pincode)) {
            setError('Invalid PIN Code format. Expected 6 digits (e.g. 600001).');
            return;
        }

        // Validate Mobile
        const mobile = text('mobile');
        if (mobile && !/^(\+91[-\s]?)?[6-9][0-9]{9}$/.test(mobile)) {
            setError('Invalid Mobile number format. Expected 10 digits (e.g. 9876543210).');
            return;
        }

        // Validate PAN if entered
        const pan = text('pan');
        if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
            setError('Invalid PAN format. Expected format: ABCDE1234F');
            return;
        }

        // Validate Email
        const email = text('email');
        if (email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            setError('Invalid Email format. Expected format: name@company.com');
            return;
        }

        setError('');
        setSubmitting(true);

        try {
            const payload = buildPayload(form);

            const result = await apiClient.post<{ bookingRegistrationNumber: string }>(
                `/visitors`,
                payload
            );

            setSuccessRegNumber(result.bookingRegistrationNumber);
            setShowSuccessModal(true);

            // Auto sign-in on this device
            try {
                const loginResult = await visitorApiClient.post<{
                    token: string;
                    visitorId: string;
                    registrationNumber: string;
                    legalName: string;
                    contactPersonName: string;
                }>('/visitors/public/login', {
                    tenantId: payload.tenantId,
                    registrationNumber: result.bookingRegistrationNumber,
                    mobile: payload.mobile
                });
                setVisitorSession(loginResult.token, {
                    visitorId: loginResult.visitorId,
                    registrationNumber: loginResult.registrationNumber,
                    legalName: loginResult.legalName,
                    contactPersonName: loginResult.contactPersonName
                });
            } catch {
                // Not fatal
            }
        } catch (caughtError) {
            setError(
                caughtError instanceof ApiError
                    ? caughtError.message
                    : 'Unable to submit visitor registration. Please check the entered values.'
            );
        } finally {
            setSubmitting(false);
        }
    }

    function handleSubmitNew() {
        setShowSuccessModal(false);
        setForm(initial);
    }

    return (
        <main className="min-h-screen bg-slate-50 px-3 py-6 sm:px-4 pb-28 sm:pb-24 md:pb-16">
            <form onSubmit={submit} className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl md:p-8">
                <BrandHeader />

                <div className="mt-6 rounded-3xl bg-msme-blue p-6 text-white">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-100">{BRAND.portalName}</p>
                    <h1 className="mt-2 text-3xl font-black">Visitor Registration Form</h1>
                    <p className="mt-2 text-sm text-blue-100">{BRAND.publicEventName}</p>
                </div>

                {error && <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

                <Section title="01. Visitor & Company Details">
                    <Field label="Company / Visitor Name" name="legalName" value={text('legalName')} onChange={set} required />
                    <Field label="Brand / Trade Name" name="tradeName" value={text('tradeName')} onChange={set} />
                    <TextAreaField label="Address" name="registeredAddress" value={text('registeredAddress')} onChange={set} required />
                    <Select label="State" name="state" value={text('state')} options={STATES} onChange={handleStateChange} required />
                    <Field label="City" name="city" value={text('city')} onChange={set} required />
                    <Select label="District" name="district" value={text('district')} options={STATE_DISTRICT_MAP[text('state')] || []} onChange={set} required />
                    
                    {/* PIN Code with format & typing validation */}
                    <Field
                        label="PIN Code"
                        name="pincode"
                        value={text('pincode')}
                        onChange={set}
                        pattern="^[1-9][0-9]{5}$"
                        hint="600001"
                        noSpaces={true}
                        maxLength={6}
                        required
                    />

                    {/* PAN Number with format & typing validation */}
                    <Field
                        label="PAN"
                        name="pan"
                        value={text('pan')}
                        onChange={set}
                        pattern="^[A-Z]{5}[0-9]{4}[A-Z]$"
                        hint="ABCDE1234F"
                        uppercase={true}
                        noSpaces={true}
                        maxLength={10}
                    />

                    <Field label="Contact Person Name" name="contactPersonName" value={text('contactPersonName')} onChange={set} required />
                    <Field label="Designation" name="contactPersonDesignation" value={text('contactPersonDesignation')} onChange={set} />
                    
                    {/* Phone Number with format & typing validation */}
                    <Field
                        label="Mobile Number"
                        name="mobile"
                        value={text('mobile')}
                        onChange={set}
                        pattern="^(\+91[-\s]?)?[6-9][0-9]{9}$"
                        hint="9876543210"
                        maxLength={15}
                        required
                    />

                    {/* Alternate Mobile with format & typing validation */}
                    <Field
                        label="Alternate Mobile"
                        name="alternateMobile"
                        value={text('alternateMobile')}
                        onChange={set}
                        pattern="^(\+91[-\s]?)?[6-9][0-9]{9}$"
                        hint="9876543210"
                        maxLength={15}
                    />

                    {/* Email ID with format & typing validation */}
                    <Field
                        label="Email ID"
                        name="email"
                        value={text('email')}
                        onChange={set}
                        type="email"
                        pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                        hint="name@company.com"
                        noSpaces={true}
                        required
                    />

                    {/* Alternate Email with format & typing validation */}
                    <Field
                        label="Alternate Email"
                        name="alternateEmail"
                        value={text('alternateEmail')}
                        onChange={set}
                        type="email"
                        pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                        hint="backup@company.com"
                        noSpaces={true}
                    />

                    <Field label="Website" name="website" value={text('website')} onChange={set} />
                </Section>

                <Section title="02. Industry Scale & Classification">
                    <RadioGroup label="Industry Scale" name="industryScale" value={text('industryScale')} options={['Micro', 'Small', 'Medium', 'Large Scale']} onChange={set} required />
                    <RadioGroup label="Business Type" name="businessType" value={text('businessType')} options={['Manufacturer', 'Service Provider', 'Distributor']} onChange={set} required />
                    <Select label="Company Constitution" name="companyConstitution" value={text('companyConstitution')} onChange={set} options={['Proprietorship', 'Partnership', 'Private Limited', 'Public Limited', 'LLP', 'Others']} />
                </Section>

                <Section title="03. Industry Category & Products">
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
                            'Information Technology',
                            'MSME Services: Finance, ERP, HR, Training, Consulting',
                            'Others',
                        ]}
                        required
                    />
                    <Field label="Sub Category / Product Keywords" name="productKeywords" value={text('productKeywords')} onChange={set} />
                    <TextAreaField label="Product / Service Description" name="productServiceDescription" value={text('productServiceDescription')} onChange={set} rows={3} maxLength={500} />
                    <Field label="Declarant Name" name="declarantName" value={text('declarantName')} onChange={set} />
                    <Field label="Declarant Designation" name="declarantDesignation" value={text('declarantDesignation')} onChange={set} />
                </Section>

                <section className="mt-6 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-md">
                    <div className="flex items-start gap-4 border-l-4 border-blue-600 p-5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                            <Info className="h-5 w-5 text-blue-700" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-black text-slate-900">Digital Support Team</h3>
                            <p className="mt-1 text-sm text-slate-600">For registration pass or venue entry assistance, contact our support team.</p>
                            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                <div className="flex-1 rounded-lg bg-blue-50 px-4 py-3">
                                    <p className="font-bold text-slate-900">Sriram Hariharan</p>
                                    <a href="tel:+919840727309" className="text-sm flex font-semibold text-blue-700 hover:underline">
                                        <Phone className="mr-1 h-4 w-4" />+91 98407 27309
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-900 px-4 py-3 text-center">
                        <p className="text-xs font-bold text-white">MSME Sangamam Connect - Tamil Nadu Organising Team</p>
                    </div>
                </section>

                <div className="mt-4 grid gap-3">
                    <RadioGroup
                        label="Are you a LUB Member?"
                        name="lubMemberText"
                        value={form.lubMember === true ? 'Yes' : 'No'}
                        options={['Yes', 'No']}
                        onChange={(_, value) => {
                            const isMember = value === 'Yes';
                            set('lubMember', isMember);
                            if (isMember) {
                                set('interestedInLub', false);
                            }
                        }}
                    />
                    {form.lubMember !== true && (
                        <Check
                            label="I am interested in becoming a LUB member"
                            name="interestedInLub"
                            checked={form.interestedInLub === true}
                            onChange={set}
                        />
                    )}
                    <div className="mt-4 mb-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-red-800">
                            Note: Admission will be closed half-an-hour before the closing time of the show. Children below 18 years not allowed.
                        </p>
                    </div>
                    <div className="mb-2">
                        <p className="text-base font-bold text-blue-600">
                            The personal data you provide will be used to register you for this event. By completing this registration form, you accept the below condition.
                        </p>
                    </div>
                    <Check
                        label={
                            <span className="font-medium text-slate-700 leading-relaxed">
                                Yes, I accept the Visitor Terms &amp; Conditions and Privacy Policy. By
                                continuing with registration, I agree that the MSME Sangamam Connect Hosur
                                - 2026 team may contact me with event updates, relevant promotions, and
                                information about future events organised by{" "}
                                <b className="text-orange-600 font-bold">
                                    Laghu Udyog Bharati - Tamil Nadu
                                </b>
                                .
                            </span>
                        }
                        name="termsAccepted"
                        checked={form.termsAccepted === true}
                        onChange={set}
                        required
                    />
                </div>

                <div className="mt-8 flex flex-col gap-3 border-t pt-6 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-slate-500">Upon submission, your QR code pass will be emailed to your email address.</p>
                    <button type="submit" className="btn-primary" disabled={submitting}>
                        {submitting ? 'Submitting…' : 'Submit Visitor Registration'}
                    </button>
                </div>
            </form>

            <FloatingSupportFooter />

            {showSuccessModal && (
                <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 transition-opacity duration-300 ${modalEntered ? 'opacity-100' : 'opacity-0'}`}>
                    <div className={`relative w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl transition-all duration-300 ease-out ${modalEntered ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-95 opacity-0'}`}>
                        <button
                            type="button"
                            onClick={() => {
                                setShowSuccessModal(false);
                                navigate('/');
                            }}
                            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                            <CheckCircle2 className="h-7 w-7 text-emerald-600" strokeWidth={2} />
                        </div>

                        <h3 className="mt-5 text-lg font-black text-slate-900">Registration Submitted Successfully</h3>

                        {successRegNumber && (
                            <p className="mt-2 text-sm text-slate-500">
                                Visitor Registration Number
                                <br />
                                <span className="text-base font-bold text-slate-800">{successRegNumber}</span>
                            </p>
                        )}

                        <p className="mt-4 text-sm leading-relaxed text-slate-600">
                            Your visitor pass and QR entry code have been emailed to your registered address.
                        </p>

                        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                            <button
                                type="button"
                                onClick={handleSubmitNew}
                                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
                            >
                                Register Another Visitor
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    navigate('/');
                                }}
                                className="btn-primary flex-1 py-3 active:scale-[0.98]"
                            >
                                Go to Homepage
                            </button>
                        </div>
                    </div>
                </div>
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
    required
}: {
    label: ReactNode;
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