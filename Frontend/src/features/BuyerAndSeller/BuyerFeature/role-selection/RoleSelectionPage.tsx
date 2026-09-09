import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Store, Check } from 'lucide-react';
import { JourneyStepper } from '../../../../components/navigation/Stepper';
import { Button } from '../../../../components/ui/Button';
import { BrandHeader } from '../../../../components/navigation/BrandHeader';

interface RoleOption {
  id: 'buyer' | 'seller';
  title: string;
  icon: typeof ShoppingCart;
  body: string;
  bullets: string[];
}

const ROLES: RoleOption[] = [
  {
    id: 'buyer',
    title: 'I am a Buyer',
    icon: ShoppingCart,
    body: 'Discover, connect and do business with verified MSME suppliers.',
    bullets: [
      'Post requirements & discover matches',
      'Evaluate & connect with suppliers',
      'Manage meetings & follow-ups',
    ],
  },
  {
    id: 'seller',
    title: 'I am a Seller',
    icon: Store,
    body: 'Represent an MSME and showcase capabilities to relevant buyers.',
    bullets: [
      'Create seller profile',
      'Receive matched requirements',
      'Grow business through connections',
    ],
  },
];

export default function RoleSelectionPage() {
  const [selected, setSelected] = useState<'buyer' | 'seller'>('buyer');
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate(selected === 'seller' ? '/seller/register' : '/buyer/register');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <BrandHeader
        title="Buyer Journey — Screen 2: Role Selection"
        subtitle="Choose how you want to participate"
        stepBadge="Step 2 of 10"
        showSession={false}
      />
      <JourneyStepper current={2} />

      <main className="mx-auto max-w-5xl p-5 md:p-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-600">
            Step 2 of 10
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
            Choose how you want to participate
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Your choice controls the workspace and permission context. It can only be changed later where policy allows.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selected === role.id;

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelected(role.id)}
                aria-pressed={isSelected}
                className={`min-h-72 rounded-xl border bg-white p-6 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                  isSelected
                    ? 'border-brand-600 bg-brand-50/20 shadow-md ring-2 ring-brand-600'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {/* Header Icon + Radio Indicator */}
                <div className="flex items-start justify-between">
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-full transition-colors ${
                      isSelected
                        ? 'bg-brand-600 text-white'
                        : 'bg-brand-50 text-brand-600'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </span>

                  {/* Radio Indicator */}
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                      isSelected
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>
                </div>

                {/* Role Details */}
                <h2 className="mt-5 text-base font-extrabold text-slate-900">
                  {role.title}
                </h2>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {role.body}
                </p>

                {/* Feature Bullets */}
                <ul className="mt-5 space-y-2 text-xs text-slate-600">
                  {role.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-brand-600" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button variant="secondary" onClick={() => navigate('/login')}>
            ← Back to Login
          </Button>
          <div className="text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700 underline">
              Sign in to Portal
            </Link>
          </div>
          <Button onClick={handleContinue}>
            Continue as {selected === 'buyer' ? 'Buyer' : 'Seller'} →
          </Button>
        </div>
      </main>
    </div>
  );
}