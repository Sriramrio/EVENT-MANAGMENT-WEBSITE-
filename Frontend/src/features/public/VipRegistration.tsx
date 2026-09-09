import { ChangeEvent, FormEvent, ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, X } from 'lucide-react';
import { BRAND } from '../../config/brand';
import { apiClient, ApiError } from '../../data/api/apiClient';
import { BrandHeader } from '../../shared/components/BrandHeader';
import { STATE_DISTRICT_MAP } from './BuyerRegistration';

type VipFormState = Record<string, string>;

const STATES = Object.keys(STATE_DISTRICT_MAP);

const initial: VipFormState = {
    legalName: '',
    tradeName: '',
    Organization:'',
    registeredAddress: '',
    city: '',
    district: '',
    state: 'Tamil Nadu',
    pincode: '',
    contactPersonName: '',
    contactPersonDesignation: '',
    mobile: '',
    alternateMobile: '',
    email: '',
    alternateEmail: '',
    website: ''
};

function optionalText(value: unknown): string {
    return String(value ?? '').trim();
}

function requiredFallback(value: unknown, fallback = '-'): string {
    const text = String(value ?? '').trim();
    return text || fallback;
}

export function VipVisitorRegistration() {
    const [form, setForm] = useState<VipFormState>(initial);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successRegNumber, setSuccessRegNumber] = useState('');

    function set(name: string, value: string) {
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

    function buildPayload(source: VipFormState) {
        const read = (name: string): string => String(source[name] ?? '').trim();

        const legalName = requiredFallback(read('legalName'), 'UNNAMED VIP VISITOR');
        const contactPersonName = requiredFallback(read('contactPersonName'), requiredFallback(read('legalName'), 'UNNAMED VIP VISITOR'));
        const contactPersonDesignation = requiredFallback(read('contactPersonDesignation'), 'Representative');

        return {
            tenantId: '11111111-1111-1111-1111-111111111111',
            eventId: '22222222-2222-2222-2222-222222222222',
            visitorType: 'VIP',
            isVip: true,
            legalName,
            Organization:optionalText(read('Organization')),
            tradeName: optionalText(read('tradeName')) || legalName,
            registeredAddress: requiredFallback(read('registeredAddress')),
            city: requiredFallback(read('city')),
            district: requiredFallback(read('district')),
            state: requiredFallback(read('state'), 'Tamil Nadu'),
            pincode: requiredFallback(read('pincode'), '600001'),
            country: 'India',
            contactPersonName,
            contactPersonDesignation,
            mobile: requiredFallback(read('mobile')),
            alternateMobile: optionalText(read('alternateMobile')),
            email: requiredFallback(read('email')),
            alternateEmail: optionalText(read('alternateEmail')),
            website: optionalText(read('website')),
        };
    }

    async function submit(event: FormEvent) {
        event.preventDefault();

        setError('');
        setSubmitting(true);

        try {
            const payload = buildPayload(form);

            const result = await apiClient.post<{ registrationNumber: string }>(
               `/vips`,
                payload
            );

+            setSuccessRegNumber(result.registrationNumber);
            setShowSuccessModal(true);
        } catch (caughtError) {
            setError(
                caughtError instanceof ApiError
                    ? caughtError.message
                    : 'Unable to submit VIP visitor registration. Please check the entered values.'
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
        <main className="min-h-screen bg-slate-50 px-4 py-6">
            <form onSubmit={submit} className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl md:p-8">
                <BrandHeader />

                <div className="mt-6 rounded-3xl bg-msme-blue p-6 text-white">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-100">{BRAND.portalName}</p>
                    <h1 className="mt-2 text-3xl font-black">VIP Visitor Registration Form</h1>
                    <p className="mt-2 text-sm text-blue-100">{BRAND.publicEventName}</p>
                </div>

                {error && <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

                <Section title="VIP Details">
                    <Field label="Company / Vip Name" name="legalName" value={text('legalName')} onChange={set} required />
                    <Field label="Brand / Trade Name" name="tradeName" value={text('tradeName')} onChange={set} />
                                        <Field label="Organization" name="Organization" value={text('Organization')} onChange={set} required />

                    <TextAreaField label="Address" name="registeredAddress" value={text('registeredAddress')} onChange={set} required />
                    <Select label="State" name="state" value={text('state')} options={STATES} onChange={handleStateChange} required />
                    <Field label="City" name="city" value={text('city')} onChange={set} required />
                    <Select label="District" name="district" value={text('district')} options={STATE_DISTRICT_MAP[text('state')] || []} onChange={set} required />
                    <Field label="PIN Code" name="pincode" value={text('pincode')} onChange={set} pattern="^[1-9][0-9]{5}$" required />
                    <Field label="Contact Person Name" name="contactPersonName" value={text('contactPersonName')} onChange={set} required />
                    <Field label="Designation" name="contactPersonDesignation" value={text('contactPersonDesignation')} onChange={set} required />
                    <Field label="Mobile Number" name="mobile" value={text('mobile')} onChange={set} pattern="^(\+91[-\s]?)?[6-9][0-9]{9}$" required />
                    <Field label="Alternate Mobile" name="alternateMobile" value={text('alternateMobile')} onChange={set} />
                    <Field label="Email ID" name="email" value={text('email')} onChange={set} type="email" required />
                    <Field label="Alternate Email" name="alternateEmail" value={text('alternateEmail')} onChange={set} type="email" />
                    <Field label="Website" name="website" value={text('website')} onChange={set} />
                </Section>

                <div className="mt-8 flex flex-col gap-3 border-t pt-6 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-slate-500">Upon submission, the VIP visitor's QR code pass will be emailed to the registered address.</p>
                    <button type="submit" className="btn-primary" disabled={submitting}>
                        {submitting ? 'Submitting…' : 'Submit VIP Visitor'}
                    </button>
                </div>
            </form>

            {showSuccessModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl">
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

                        <h3 className="mt-5 text-lg font-black text-slate-900">VIP Visitor Registered Successfully</h3>

                        {successRegNumber && (
                            <p className="mt-2 text-sm text-slate-500">
                                Visitor Registration Number
                                <br />
                                <span className="text-base font-bold text-slate-800">{successRegNumber}</span>
                            </p>
                        )}

                        <p className="mt-4 text-sm leading-relaxed text-slate-600">
                            The VIP visitor pass and QR entry code have been emailed to the registered address.
                        </p>

                        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                            <button
                                type="button"
                                onClick={handleSubmitNew}
                                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
                            >
                                Register Another VIP Visitor
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
}: {
    label: string;
    name: string;
    value: string;
    onChange: (name: string, value: string) => void;
    type?: string;
    pattern?: string;
    maxLength?: number;
    required?: boolean;
}) {
    return (
        <label className="block">
            <span className="text-sm font-semibold text-slate-700">
                {label}
                {required && <span className="ml-1 text-red-600">*</span>}
            </span>

            <input
                className="input mt-1"
                type={type}
                value={value}
                required={required}
                pattern={value ? pattern : undefined}
                maxLength={maxLength}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(name, event.target.value)}
            />
        </label>
    );
}

function TextAreaField({
    label,
    name,
    value,
    onChange,
    rows = 3,
    required = false,
}: {
    label: string;
    name: string;
    value: string;
    onChange: (name: string, value: string) => void;
    rows?: number;
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
                onChange={event => onChange(name, event.target.value)}
            />
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
