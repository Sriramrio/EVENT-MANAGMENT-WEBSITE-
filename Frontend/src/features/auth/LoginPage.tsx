import { FormEvent, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle2, X, ShoppingBag, Store, Presentation, Users, Shield, ArrowLeft, UserCheck, ShieldCheck, UserPlus, ArrowRight } from 'lucide-react';
import { repositories } from '../../data/repositoryFactory';
import { useSession } from '../../app/session';
import { exhibitorApiClient, setExhibitorToken, setExhibitorSession, ExhibitorApiError } from '../../data/api/exhibitorApiClient';
import { visitorApiClient, setVisitorSession, VisitorApiError } from '../../data/api/visitorApiClient';
import { BrandHeader } from '../../shared/components/BrandHeader';
import { FloatingSupportFooter } from '../../components/BaseComponents/FloatingSupportFooter';
import { BRAND } from '../../config/brand';
import { ModalPortal } from '../../shared/components/ModalPortal';

const TENANT_ID = '11111111-1111-1111-1111-111111111111';

interface PopupState {
  type: 'success' | 'error';
  title: string;
  message: string;
}

type LoginRole = 'BUYER' | 'SELLER' | 'EXHIBITOR' | 'VISITOR' | 'ADMIN' | 'EXHIBITOR_ADMIN' | null;

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [mobile, setMobile] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState<PopupState | null>(null);

  const resolveInitialRole = (): LoginRole => {
    const queryRole = searchParams.get('role')?.toUpperCase();
    if (queryRole === 'BUYER') return 'BUYER';
    if (queryRole === 'SELLER') return 'SELLER';
    if (queryRole === 'EXHIBITOR') return 'EXHIBITOR';
    if (queryRole === 'VISITOR') return 'VISITOR';
    if (queryRole === 'ADMIN') return 'ADMIN';

    const stateRole = ((location.state as any)?.role || (location.state as any)?.preselectRole)?.toUpperCase();
    if (stateRole === 'BUYER') return 'BUYER';
    if (stateRole === 'SELLER') return 'SELLER';
    return null;
  };

  const [selectedRole, setSelectedRole] = useState<LoginRole>(resolveInitialRole);
  const setUser = useSession((state) => state.setUser);
  const navigate = useNavigate();

  useEffect(() => {
    const queryRole = searchParams.get('role')?.toUpperCase();
    if (queryRole === 'BUYER') setSelectedRole('BUYER');
    else if (queryRole === 'SELLER') setSelectedRole('SELLER');
    else if (queryRole === 'EXHIBITOR') setSelectedRole('EXHIBITOR');
    else if (queryRole === 'VISITOR') setSelectedRole('VISITOR');
  }, [searchParams]);

  function validate(): string | null {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) return 'Email and password are required.';
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) return 'Please enter a valid email address.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  }

  function handleNavigation(user: any) {
    if (user.roleCode === 'BuyerAdmin') navigate('/app/admin/buyers');
    else if (user.roleCode === 'SellerAdmin') navigate('/app/admin/sellers');
    else if (selectedRole === 'EXHIBITOR_ADMIN' || user.roleCode === 'ExhibitorAdmin') navigate('/app/admin/exhibitor-requirements');
    else if (user.roleCode === 'StallAllocationAdmin') navigate('/app/stall-allocation');
    else if (user.roleCode === 'QRPortal') navigate('/qrshell');
    else if (user.roleCode === 'VisitorPortal') navigate('/visitorShell/Dashboard');
    else if (selectedRole === 'BUYER' || user.organizationType === 'BUYER') navigate('/buyer/dashboard');
    else if (selectedRole === 'SELLER' || user.organizationType === 'SELLER') navigate('/seller/dashboard');
    else if (user.roleCode === 'PaymentVerifier') navigate('/app/payments');
    else if (user.roleCode === 'VipPortal') navigate('/vipShell/Dashboard');
    else if (user.roleCode === 'ProformaInvoicePreparer') navigate('/app/invoices');
    else if (user.roleCode === 'MarketplaceUser') {
      const savedRole = sessionStorage.getItem('msme_marketplace_role') || localStorage.getItem('msme_marketplace_role');
      navigate(savedRole === 'SELLER' ? '/seller/dashboard' : '/buyer/dashboard');
    } else {
      navigate('/app/dashboard');
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPopup(null);
    setSubmitting(true);

    try {
      if (selectedRole === 'EXHIBITOR' || selectedRole === 'VISITOR') {
        if (!registrationNumber.trim() || !mobile.trim()) {
          setPopup({ type: 'error', title: 'Validation Failed', message: 'Registration number and mobile are required.' });
          setSubmitting(false);
          return;
        }

        if (selectedRole === 'EXHIBITOR') {
          const result = await exhibitorApiClient.post<{
            token: string;
            companyName?: string;
            tradeName?: string;
            legalName?: string;
            registrationNumber?: string;
            fasciaName?: string;
          }>('/public/exhibitor/login', {
            registrationNumber: registrationNumber.trim(),
            mobile: mobile.trim()
          });
          const compName = result.companyName || result.legalName || result.tradeName || 'Exhibitor';
          const regNum = result.registrationNumber || registrationNumber.trim();
          setExhibitorSession(result.token, {
            companyName: compName,
            registrationNumber: regNum,
            stallNumber: null
          });
          setPopup({ type: 'success', title: 'Login Successful', message: 'Redirecting to Exhibitor Portal...' });
          setTimeout(() => navigate('/exhibitorShell/Dashboard'), 1200);
        } else {
          const result = await visitorApiClient.post<{
            token: string;
            visitorId: string;
            registrationNumber: string;
            legalName: string;
            contactPersonName: string;
          }>('/visitors/public/login', {
            tenantId: TENANT_ID,
            registrationNumber: registrationNumber.trim(),
            mobile: mobile.trim()
          });
          setVisitorSession(result.token, {
            visitorId: result.visitorId,
            registrationNumber: result.registrationNumber,
            legalName: result.legalName,
            contactPersonName: result.contactPersonName
          });
          setPopup({ type: 'success', title: 'Login Successful', message: 'Redirecting to Visitor Portal...' });
          setTimeout(() => navigate('/visitorShell/Dashboard'), 1200);
        }
        return;
      }

      const validationError = validate();
      if (validationError) {
        setPopup({ type: 'error', title: 'Validation Failed', message: validationError });
        setSubmitting(false);
        return;
      }

      if (selectedRole === 'BUYER') {
        sessionStorage.setItem('msme_marketplace_role', 'BUYER');
        localStorage.removeItem('msme_marketplace_role');
      }
      if (selectedRole === 'SELLER') {
        sessionStorage.setItem('msme_marketplace_role', 'SELLER');
        localStorage.removeItem('msme_marketplace_role');
      }

      const user = await repositories.auth.login({ email, password });

      // Enforce role selection limits
      if (selectedRole === 'BUYER') {
        if (user.organizationType !== 'BUYER' && user.organizationType !== 'BOTH') {
          throw new Error("This account does not have Buyer access.");
        }
      } else if (selectedRole === 'SELLER') {
        if (user.organizationType !== 'SELLER' && user.organizationType !== 'BOTH') {
          throw new Error("This account does not have Seller access.");
        }
      } else if (selectedRole === 'ADMIN' || selectedRole === null) {
        if (user.roleCode === 'MarketplaceUser') {
          throw new Error("Marketplace regular users cannot access the Admin portal.");
        }
      }

      setUser(user);
      setPopup({ type: 'success', title: 'Login Successful', message: 'You have logged in successfully. Redirecting...' });
      setTimeout(() => handleNavigation(user), 1200);
    } catch (err: any) {
      console.error('Login error:', err);
      let serverMessage = 'Invalid credentials, Please try again.';
      if (typeof err === 'string') serverMessage = err;
      else if (err?.error) serverMessage = err.error;
      else if (err?.message) serverMessage = err.message;
      setPopup({ type: 'error', title: 'Login Error', message: serverMessage });
    } finally {
      setSubmitting(false);
    }
  }

  const roleOptions = [
    { id: 'BUYER', title: 'Buyer Login', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'SELLER', title: 'Seller Login', icon: Store, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    { id: 'EXHIBITOR', title: 'Exhibitor Login', icon: Presentation, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { id: 'VISITOR', title: 'Visitor Login', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' }
  ] as const;

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#eff6ff,#fff7ed)] p-4 pb-20 sm:p-6 sm:pb-6">
      {popup && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-md rounded-2xl border bg-white p-6 shadow-2xl transition-all ${popup.type === 'success' ? 'border-emerald-200' : 'border-red-200'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`grid h-10 w-10 place-items-center rounded-full ${popup.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {popup.type === 'success' ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{popup.title}</h3>
                    <p className="text-xs text-slate-500">System Notification</p>
                  </div>
                </div>
                {popup.type === 'error' && (
                  <button type="button" onClick={() => setPopup(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <p className={`mt-4 rounded-xl p-3 text-sm font-medium ${popup.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {popup.message}
              </p>
              {popup.type === 'error' && (
                <button type="button" onClick={() => setPopup(null)} className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition">
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </ModalPortal>
      )}

      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:grid-cols-2">
        {/* Left Side */}
        <section className="hidden bg-slate-950 p-10 text-white lg:block relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 opacity-10 blur-3xl rounded-full bg-orange-500 w-96 h-96 transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 p-32 opacity-10 blur-3xl rounded-full bg-blue-500 w-96 h-96 transform -translate-x-1/2 translate-y-1/2" />
          <div className="flex h-full flex-col justify-between relative z-10">
            <div className="rounded-3xl bg-white p-5 w-max">
              <BrandHeader />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-orange-300">
                {BRAND.portalName}
              </p>
              <h1 className="mt-4 text-5xl font-black leading-tight">
                Welcome to Sangamam
              </h1>
              <p className="mt-5 text-base text-slate-400 max-w-md">
                Connect, collaborate, and grow your business network through our comprehensive matchmaking and stall booking platform.
              </p>
              <button
                type="button"
                onClick={() => navigate('/stall-booking')}
                className="mt-8 rounded-2xl bg-white/10 px-6 py-3 font-bold text-white hover:bg-white/20 transition border border-white/20 backdrop-blur-sm"
              >
                Book Stall Now
              </button>
            </div>
          </div>
        </section>

        {/* Right Side */}
        <section className="p-8 lg:p-12 flex flex-col justify-center relative bg-slate-50/50">
          <div className="lg:hidden mb-8">
            <BrandHeader />
          </div>

          {!selectedRole ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Select your portal</h2>
                <p className="text-sm text-slate-500 mt-2">Choose how you want to interact with Sangamam.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roleOptions.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id as LoginRole)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group ${role.border}`}
                  >
                    <div className={`p-3 rounded-full transition-colors ${role.bg} ${role.color} group-hover:scale-110 duration-300`}>
                      <role.icon className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">{role.title}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setSelectedRole('ADMIN')}
                  className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition"
                >
                  <Shield className="w-4 h-4" />
                  Admin & Other Logins
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <button
                onClick={() => setSelectedRole(null)}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 mb-6 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to roles
              </button>

              <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  {selectedRole === 'ADMIN' ? 'Admin & Staff Portal' :
                    selectedRole ? selectedRole.charAt(0) + selectedRole.slice(1).toLowerCase() + ' Login' : 'Login'}
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  {selectedRole === 'ADMIN'
                    ? 'Enter your administrator credentials to access the management portal.'
                    : 'Enter your credentials to access your account.'}
                </p>
              </div>

              <form onSubmit={submit} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm" noValidate>
                {selectedRole === 'EXHIBITOR' || selectedRole === 'VISITOR' ? (
                  <>
                    <label className="block text-sm font-bold text-slate-700">
                      {selectedRole === 'EXHIBITOR'
                        ? 'Registration Number (or last 3 digits)'
                        : 'Registration Number (or last 4 digits)'}
                    </label>
                    <input
                      className="input mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all bg-slate-50 focus:bg-white"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder={selectedRole === 'EXHIBITOR' ? 'e.g. 123 or MSME-HOSUR-123' : 'e.g. 0089 or VISITOR-2026-0089'}
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      {selectedRole === 'EXHIBITOR'
                        ? 'Enter your booking registration number or last 3 digits.'
                        : 'Enter your visitor pass number or last 4 digits.'}
                    </p>

                    <label className="mt-4 block text-sm font-bold text-slate-700">Mobile Number</label>
                    <input
                      className="input mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all bg-slate-50 focus:bg-white"
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="Enter registered mobile number"
                    />
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-bold text-slate-700">Email address</label>
                    <input
                      className="input mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all bg-slate-50 focus:bg-white"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoComplete="username"
                    />

                    <label className="mt-4 block text-sm font-bold text-slate-700">Password</label>
                    <input
                      className="input mt-1.5 w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all bg-slate-50 focus:bg-white"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                  </>
                )}

                <button
                  className="btn-primary mt-8 w-full rounded-xl bg-orange-500 py-3.5 font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 disabled:opacity-50 hover:shadow-orange-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
                  disabled={submitting}
                >
                  {submitting ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              {/* Registration card for Buyer (exact card design from portal screen) */}
              {selectedRole === 'BUYER' && (
                <div className="mt-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-blue-50/70 p-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <UserPlus className="w-4 h-4 text-blue-600" />
                        <span>Not registered yet?</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Join MSME Sangamam to connect, procure, and grow.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to="/buyer/register"
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg border border-blue-200 bg-white text-blue-700 text-xs font-bold hover:bg-blue-50 transition shadow-2xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                        <span>Buyer Register</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Registration card for Seller (exact card design from portal screen) */}
              {selectedRole === 'SELLER' && (
                <div className="mt-4 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50/70 via-amber-50/40 to-orange-50/70 p-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <UserPlus className="w-4 h-4 text-orange-600" />
                        <span>Not registered yet?</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Join MSME Sangamam to connect, showcase, or sell.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to="/seller/register"
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg border border-orange-200 bg-white text-orange-700 text-xs font-bold hover:bg-orange-50 transition shadow-2xs"
                      >
                        <Store className="w-3.5 h-3.5 text-orange-600" />
                        <span>Seller Register</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 text-center text-xs font-medium text-slate-500">
            <p>
              Need to book a stall?{' '}
              <Link to="/stall-booking" className="font-bold text-orange-600 hover:text-orange-700 transition">
                Go to public booking
              </Link>
            </p>
          </div>
        </section>
      </div>

      <FloatingSupportFooter />
    </main>
  );
}