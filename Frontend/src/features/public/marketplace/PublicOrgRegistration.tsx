import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Building2, CheckCircle2, Lock, MailCheck, Phone, ShieldCheck, Target, ArrowRight, ShoppingBag, Store, UserCheck, X, Sparkles } from 'lucide-react';
import { BrandHeader } from '../../../components/navigation/BrandHeader';
import { TextInput, SelectInput } from '../../../components/forms/FormFields';
import { Button } from '../../../components/ui/Button';
import { httpClient } from '../../../services/api/httpClient';
import { AppError } from '../../../services/api/errors';

const STATES = ['Tamil Nadu', 'Karnataka', 'Maharashtra', 'Telangana', 'Andhra Pradesh', 'Kerala', 'Other'];

interface Props {
  role: 'BUYER' | 'SELLER';
}

interface FormState {
  legalName: string;
  orgEmail: string;
  orgPhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactName: string;
  contactDesignation: string;
  contactEmail: string;
  contactPhone: string;
  gstin: string;
  udyamNumber: string;
}

const empty: FormState = {
  legalName: '', orgEmail: '', orgPhone: '', address: '', city: '', state: '', pincode: '',
  contactName: '', contactDesignation: '', contactEmail: '', contactPhone: '',
  gstin: '', udyamNumber: '',
};

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in)$/i;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const PINCODE_REGEX = /^\d{6}$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

function validateField(field: keyof FormState, value: string, currentRole: 'BUYER' | 'SELLER'): string | undefined {
  const v = (value || '').trim();
  switch (field) {
    case 'legalName':
      if (!v) return 'Organisation legal name is required.';
      if (v.length < 2) return 'Legal name must be at least 2 characters.';
      return undefined;
    case 'orgEmail':
      if (v && !EMAIL_REGEX.test(v)) {
        return 'Organisation email must end with .com or .in (e.g. info@company.com or info@company.in).';
      }
      return undefined;
    case 'orgPhone':
      if (v && !PHONE_REGEX.test(v.replace(/\s+/g, ''))) {
        return 'Phone must be a valid 10-digit mobile number starting with 6-9.';
      }
      return undefined;
    case 'gstin':
      if (!v) return 'GSTIN is required.';
      if (!GSTIN_REGEX.test(v)) {
        return 'Enter a valid 15-character GSTIN (e.g. 33AAAAA0000A1Z5).';
      }
      return undefined;
    case 'udyamNumber':
      if (currentRole === 'SELLER' && !v) {
        return 'Udyam Registration Number is required for MSME sellers.';
      }
      return undefined;
    case 'address':
      if (!v) return 'Registered address is required.';
      if (v.length < 5) return 'Address must be at least 5 characters.';
      return undefined;
    case 'city':
      if (!v) return 'City is required.';
      return undefined;
    case 'state':
      if (!v) return 'Please select a state.';
      return undefined;
    case 'pincode':
      if (!v) return 'PIN code is required.';
      if (!PINCODE_REGEX.test(v)) return 'PIN code must be exactly 6 digits.';
      return undefined;
    case 'contactName':
      if (!v) return 'Contact person full name is required.';
      if (v.length < 2) return 'Name must be at least 2 characters.';
      return undefined;
    case 'contactEmail':
      if (!v) return 'Contact email (login ID) is required.';
      if (!EMAIL_REGEX.test(v)) {
        return 'Email must end with .com or .in (e.g. user@domain.com or user@domain.in).';
      }
      return undefined;
    case 'contactPhone':
      if (!v) return 'Mobile number is required.';
      if (!PHONE_REGEX.test(v.replace(/\s+/g, ''))) {
        return 'Enter a valid 10-digit mobile number starting with 6-9.';
      }
      return undefined;
    default:
      return undefined;
  }
}

interface RegisteredSummary {
  role: 'BUYER' | 'SELLER';
  legalName: string;
  contactName: string;
  email: string;
  phone?: string;
  gstin?: string;
}

export function PublicOrgRegistration({ role }: Props) {
  const nav = useNavigate();
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [successPopup, setSuccessPopup] = useState<RegisteredSummary | null>(null);
  const [countdown, setCountdown] = useState(8);
  const [timerRunning, setTimerRunning] = useState(true);

  const label = role === 'BUYER' ? 'Buyer' : 'Seller';

  useEffect(() => {
    if (!successPopup || !timerRunning) return;
    if (countdown <= 0) {
      nav(`/login?role=${role}`);
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [successPopup, timerRunning, countdown, nav, role]);
  
  const set = (k: keyof FormState) => (e: { target: { value: string } }) => {
    const val = e.target.value;
    setForm(f => ({ ...f, [k]: val }));
    if (touched[k]) {
      const err = validateField(k, val, role);
      setErrors(prev => ({ ...prev, [k]: err }));
    }
  };

  const handleBlur = (k: keyof FormState) => () => {
    setTouched(prev => ({ ...prev, [k]: true }));
    const err = validateField(k, form[k], role);
    setErrors(prev => ({ ...prev, [k]: err }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate all fields
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    const keys = Object.keys(form) as (keyof FormState)[];
    keys.forEach(k => {
      const err = validateField(k, form[k], role);
      if (err) newErrors[k] = err;
    });

    const allTouched: Partial<Record<keyof FormState, boolean>> = {};
    keys.forEach(k => { allTouched[k] = true; });
    setTouched(allTouched);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setError('Please resolve all validation errors below before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      await httpClient.post('/marketplace/organizations/register', {
        organizationType: role,
        legalName: form.legalName.trim(),
        orgEmail: form.orgEmail.trim() || undefined,
        orgPhone: form.orgPhone.trim() || undefined,
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        contactName: form.contactName.trim(),
        contactEmail: form.contactEmail.trim().toLowerCase(),
        contactPhone: form.contactPhone.trim() || undefined,
        contactDesignation: form.contactDesignation.trim() || undefined,
        gstin: form.gstin.trim().toUpperCase(),
        udyamNumber: form.udyamNumber.trim() || undefined,
      });
      // LoginPage uses this to route a first-time marketplace login to the right dashboard,
      // since the base "MarketplaceUser" role alone doesn't say whether it's Buyer or Seller.
      sessionStorage.setItem('msme_marketplace_role', role);
      setSuccessEmail(form.contactEmail.trim());
      setSuccessPopup({
        role,
        legalName: form.legalName.trim(),
        contactName: form.contactName.trim(),
        email: form.contactEmail.trim().toLowerCase(),
        phone: form.contactPhone.trim() || form.orgPhone.trim() || undefined,
        gstin: form.gstin.trim().toUpperCase() || undefined,
      });
      setCountdown(8);
      setTimerRunning(true);
    } catch (err) {
      if (err instanceof AppError) {
        const isEmailConflict =
          err.status === 409 ||
          err.problem?.code === 'EMAIL_ALREADY_EXISTS' ||
          err.problem?.errorCode === 'EMAIL_ALREADY_EXISTS' ||
          /already exists/i.test(err.message) ||
          /email.*exist/i.test(err.message) ||
          (err.status === 422 && /account.*exist|email/i.test(err.message));

        if (isEmailConflict) {
          setError('Email already exists. Please log in or use a different email address.');
          setErrors(prev => ({
            ...prev,
            contactEmail: 'Email already exists. Please log in instead.'
          }));
          return;
        }
        setError(err.message || 'Registration failed. Please check your details and try again.');
      } else {
        setError('Registration failed. Please check your details and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Render popup modal dialog whenever successPopup is active
  const renderSuccessPopupModal = () => {
    if (!successPopup) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="w-full max-w-lg rounded-3xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-2xl transition-all relative overflow-hidden animate-in zoom-in-95 duration-300">
          {/* Top Accent Gradient Bar */}
          <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${role === 'BUYER' ? 'from-blue-500 via-indigo-500 to-cyan-500' : 'from-orange-500 via-amber-500 to-rose-500'}`} />

          {/* Close / Dismiss Button */}
          <button
            type="button"
            onClick={() => {
              setTimerRunning(false);
              setSuccessPopup(null);
            }}
            className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            title="Dismiss popup"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header with celebratory icon */}
          <div className="text-center space-y-3">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50 shadow-inner">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${role === 'BUYER' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                {role === 'BUYER' ? <ShoppingBag className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
                {label} Registration Successful
              </span>
              <h2 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
                Account Created Successfully!
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Welcome to the MSME Sangamam Buyer & Seller Portal.
              </p>
            </div>
          </div>

          {/* Summary Box */}
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Organization</span>
              <span className="text-slate-900 font-bold text-right max-w-[240px] truncate">{successPopup.legalName}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Contact Person</span>
              <span className="text-slate-800 font-semibold">{successPopup.contactName}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Registered Email</span>
              <span className="text-slate-900 font-mono font-semibold">{successPopup.email}</span>
            </div>
            {successPopup.gstin && (
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">GSTIN</span>
                <span className="text-slate-700 font-mono font-medium">{successPopup.gstin}</span>
              </div>
            )}
          </div>

          {/* Email delivery note */}
          <div className="mt-4 flex items-start gap-3 rounded-xl bg-emerald-50/90 border border-emerald-200 p-3.5 text-xs text-emerald-900 font-medium">
            <MailCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Login Credentials Emailed</span>
              <span>We've dispatched your temporary login password to <b className="font-semibold">{successPopup.email}</b>. Please use them to sign in.</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={() => nav(`/login?role=${role}`)}
              className={`w-full py-3.5 px-5 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 ${role === 'BUYER' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'}`}
            >
              <span>Go to {label} Login Page</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between px-1 text-[11px] text-slate-400 font-medium">
              {timerRunning ? (
                <>
                  <span>Auto-redirecting in <strong className="text-slate-700 font-bold">{countdown}s</strong>...</span>
                  <button
                    type="button"
                    onClick={() => setTimerRunning(false)}
                    className="text-slate-500 hover:text-slate-800 underline transition"
                  >
                    Pause countdown
                  </button>
                </>
              ) : (
                <>
                  <span className="text-slate-500">Auto-redirect paused</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTimerRunning(false);
                      setSuccessPopup(null);
                    }}
                    className="text-slate-500 hover:text-slate-800 underline transition"
                  >
                    Stay on page
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (successEmail && !successPopup) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <BrandHeader title={`${label} Registration`} subtitle="MSME Sangamam Connect — Tamil Nadu" showSession={false} />
        <main className="flex-1 grid place-items-center p-6">
          <div className="card max-w-md w-full p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xl space-y-4">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <MailCheck className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">Registration Successful</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Your login credentials have been sent to <span className="font-semibold text-slate-800">{successEmail}</span>.
              Use them to sign in and access your {label.toLowerCase()} dashboard.
            </p>
            <Button className="mt-4 w-full" onClick={() => nav(`/login?role=${role}`)}>Go to {label} Login →</Button>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSuccessPopup({
                  role,
                  legalName: form.legalName,
                  contactName: form.contactName,
                  email: successEmail,
                  phone: form.contactPhone || form.orgPhone,
                  gstin: form.gstin,
                })}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
              >
                View Registration Details
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      {renderSuccessPopupModal()}
      <BrandHeader title={`${label} Registration`} subtitle="Create your organisation profile to get started — no login required." showSession={false} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="bg-indigo-50/60 rounded-2xl p-6 border border-indigo-100 flex flex-col items-center justify-center text-center">
              <Building2 className="w-16 h-16 text-indigo-600 mb-2" />
              <h3 className="text-base font-bold text-slate-900">Register as a {label}</h3>
              <p className="text-xs text-slate-500 mt-1">
                No account needed to fill this form. Once submitted, we'll email you a login so you can access your {label} dashboard.
              </p>
            </div>

            {/* Already Registered Navigator */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>Already registered as a {label}?</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                If you already have your credentials, you can sign in directly to your {label.toLowerCase()} dashboard.
              </p>
              <Link
                to={`/login?role=${role}`}
                className="mt-1 inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 text-xs font-bold transition shadow-2xs"
              >
                <span>Go to {label} Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-indigo-600 rounded-lg shrink-0"><ShieldCheck className="w-4 h-4" /></div>
                <div><span className="text-xs font-bold text-slate-800 block">Build Trust</span><span className="text-[11px] text-slate-500">Verified organisation details build credibility.</span></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-indigo-600 rounded-lg shrink-0"><Target className="w-4 h-4" /></div>
                <div><span className="text-xs font-bold text-slate-800 block">Better Matches</span><span className="text-[11px] text-slate-500">Helps us connect you with the right partners.</span></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-indigo-600 rounded-lg shrink-0"><Lock className="w-4 h-4" /></div>
                <div><span className="text-xs font-bold text-slate-800 block">Login sent by email</span><span className="text-[11px] text-slate-500">Your dashboard access arrives after you submit.</span></div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 flex items-start gap-3">
              <Phone className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-slate-800 block">Need Help?</span>
                <p className="text-slate-500">Call us at +91 98407 27309 or write to <span className="text-indigo-600 font-medium">lubchennai2025@gmail.com</span></p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 lg:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Create your {label} Organisation Profile</h2>
                <p className="text-xs text-slate-500 mt-0.5">All fields marked with <span className="text-red-500 font-bold">*</span> are mandatory</p>
              </div>
              <Link
                to={`/login?role=${role}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition shrink-0"
              >
                <span>Already registered? Sign in</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <form onSubmit={submit} className="space-y-5" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TextInput
                  label="Legal Name of Organisation"
                  required
                  value={form.legalName}
                  onChange={set('legalName')}
                  onBlur={handleBlur('legalName')}
                  error={errors.legalName}
                  placeholder="e.g. Acme Precision Pvt Ltd"
                />
                <TextInput
                  label="Organisation Email"
                  type="email"
                  value={form.orgEmail}
                  onChange={set('orgEmail')}
                  onBlur={handleBlur('orgEmail')}
                  error={errors.orgEmail}
                  placeholder="info@domain.com"
                  helperText="Optional (.com or .in) — leave blank to use contact email."
                />
                <TextInput
                  label="Organisation Phone"
                  value={form.orgPhone}
                  onChange={set('orgPhone')}
                  onBlur={handleBlur('orgPhone')}
                  error={errors.orgPhone}
                  placeholder="e.g. 9840123456"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  label="GSTIN"
                  required
                  value={form.gstin}
                  onChange={set('gstin')}
                  onBlur={handleBlur('gstin')}
                  error={errors.gstin}
                  placeholder="e.g. 33AAAAA0000A1Z5"
                  helperText="15-character GST Identification Number"
                />
                {role === 'SELLER' && (
                  <TextInput
                    label="Udyam Registration Number"
                    required
                    value={form.udyamNumber}
                    onChange={set('udyamNumber')}
                    onBlur={handleBlur('udyamNumber')}
                    error={errors.udyamNumber}
                    placeholder="e.g. UDYAM-TN-01-0000000"
                    helperText="Required for MSME Sellers"
                  />
                )}
              </div>

              <TextInput
                label="Registered Address"
                required
                value={form.address}
                onChange={set('address')}
                onBlur={handleBlur('address')}
                error={errors.address}
                placeholder="Door/Plot no, Industrial Estate, Street"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TextInput
                  label="City"
                  required
                  value={form.city}
                  onChange={set('city')}
                  onBlur={handleBlur('city')}
                  error={errors.city}
                  placeholder="e.g. Chennai, Coimbatore, Hosur"
                />
                <SelectInput
                  label="State"
                  required
                  value={form.state}
                  onChange={set('state')}
                  onBlur={handleBlur('state')}
                  error={errors.state}
                >
                  <option value="">Select State</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </SelectInput>
                <TextInput
                  label="PIN Code"
                  required
                  value={form.pincode}
                  onChange={set('pincode')}
                  onBlur={handleBlur('pincode')}
                  error={errors.pincode}
                  placeholder="e.g. 600001"
                  maxLength={6}
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 mt-4">Contact Person (used to log in)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextInput
                    label="Full Name"
                    required
                    value={form.contactName}
                    onChange={set('contactName')}
                    onBlur={handleBlur('contactName')}
                    error={errors.contactName}
                    placeholder="e.g. Ramesh Kumar"
                  />
                  <TextInput
                    label="Designation"
                    value={form.contactDesignation}
                    onChange={set('contactDesignation')}
                    onBlur={handleBlur('contactDesignation')}
                    error={errors.contactDesignation}
                    placeholder="e.g. Managing Director / Partner"
                  />
                  <TextInput
                    label="Email (login ID)"
                    type="email"
                    required
                    value={form.contactEmail}
                    onChange={set('contactEmail')}
                    onBlur={handleBlur('contactEmail')}
                    error={errors.contactEmail}
                    placeholder="e.g. ramesh@company.com or .in"
                    helperText="Must end with .com or .in. Credentials sent here."
                  />
                  <TextInput
                    label="Mobile"
                    required
                    value={form.contactPhone}
                    onChange={set('contactPhone')}
                    onBlur={handleBlur('contactPhone')}
                    error={errors.contactPhone}
                    placeholder="e.g. 9840123456"
                    maxLength={10}
                    helperText="10-digit mobile number starting with 6-9"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm font-medium text-red-700 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">{error}</p>
                    {error.toLowerCase().includes('email already exists') && (
                      <p className="text-xs text-red-600 mt-1">
                        Already registered with this email?{' '}
                        <button
                          type="button"
                          onClick={() => nav('/login')}
                          className="underline font-bold hover:text-red-800"
                        >
                          Click here to Sign In
                        </button>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
                <Button type="submit" loading={submitting}>
                  <CheckCircle2 className="w-4 h-4" /> Submit Registration
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export function BuyerPublicRegistration() { return <PublicOrgRegistration role="BUYER" />; }
export function SellerPublicRegistration() { return <PublicOrgRegistration role="SELLER" />; }
