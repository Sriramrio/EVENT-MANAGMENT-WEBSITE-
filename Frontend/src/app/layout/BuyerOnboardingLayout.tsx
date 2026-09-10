import { Outlet, useLocation } from 'react-router';
import { BrandHeader } from '../../components/navigation/BrandHeader';
import { JourneyStepper } from '../../components/navigation/Stepper';
import { MaintainedByFooter } from '../../components/BaseComponents/MaintainedByfooter';

const stepFor = (p: string) => p.includes('/organisation') ? 3 : p.includes('/product') ? 6 : p.includes('/technical-quality') ? 7 : p.includes('/commercial-review') ? 8 : p.includes('/new/basic') ? 5 : 2;

export function BuyerOnboardingLayout() { 
  const loc = useLocation(); 
  const step = stepFor(loc.pathname); 
  const isRequirementFlow = loc.pathname.includes('/requirements');
  const isContactPage = loc.pathname.includes('/contact');
  const hideStepper = isRequirementFlow || isContactPage;

  return (
    <div className="min-h-screen bg-slate-50">
      <BrandHeader title="Buyer Registration & Requirement" subtitle="Structured onboarding and sourcing workflow" stepBadge={!hideStepper ? `Step ${step} of 10` : undefined} />
      {!hideStepper && <JourneyStepper current={step} />}
      <main className="mx-auto max-w-7xl p-4 md:p-6 pb-28 sm:pb-20">
        <Outlet />
        <MaintainedByFooter />
      </main>
    </div>
  ); 
}