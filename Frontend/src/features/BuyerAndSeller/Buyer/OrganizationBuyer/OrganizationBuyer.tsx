import React, { useState } from 'react';

import { 
  Building2, 
  ShieldCheck, 
  Target, 
  Lock, 
  Phone, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { StepItem, Header, Stepper, SecurityFooter } from '../../../../components/BaseComponents/Header';

const ORG_STEPS: StepItem[] = [
  { id: 1, label: 'Land on Page', status: 'completed' },
  { id: 2, label: 'Role Selection', status: 'completed' },
  { id: 3, label: 'Buyer Org Registration', status: 'in-progress' },
  { id: 4, label: 'Buyer Contact Person', status: 'pending' },
  { id: 5, label: 'Buyer Dashboard Overview', status: 'pending' },
  { id: 6, label: 'My Requirements', status: 'pending' },
  { id: 7, label: 'Create Requirement - Basic Details', status: 'pending' },
  { id: 8, label: 'Create Requirement - Product Details', status: 'pending' },
  { id: 9, label: 'Create Requirement - Technical & Quality', status: 'pending' },
  { id: 10, label: 'Create Requirement - Commercial & Review', status: 'pending' },
];

export const ScreenOrgRegistration: React.FC = () => {
  const [formData, setFormData] = useState({
    legalName: 'Precision Mach Tech Pvt. Ltd.',
    gstin: '27AAGCP1234B1ZS',
    pan: 'AAGCP1234B',
    orgType: 'Private Limited Company',
    industry: 'Automotive',
    website: 'www.precisionmach.com',
    establishmentYear: '2012',
    employeeCount: '501 - 1000',
    annualTurnover: '10 - 50 Crore',
    registeredAddress: '123, Highgrowth Phase 2, Pune, Maharashtra - 411057',
    city: 'Pune',
    state: 'Maharashtra',
    pinCode: '411057'
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header
        screenTitle="Buyer Journey — Screen 3: Buyer Organisation Registration"
        screenSubtitle="Create your organisation profile to continue your buyer registration."
        stepBadgeText="Step 3 of 10"
      />

      <Stepper steps={ORG_STEPS} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Sidebar Info Card */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            
            {/* Banner Illustration Placeholder */}
            <div className="bg-indigo-50/60 rounded-2xl p-6 border border-indigo-100 flex flex-col items-center justify-center text-center">
              <Building2 className="w-16 h-16 text-indigo-600 mb-2" />
              <h3 className="text-base font-bold text-slate-900">Register Your Organisation</h3>
              <p className="text-xs text-slate-500 mt-1">
                Please provide accurate details about your organisation. This information will help us match you with the right MSME partners.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Why is this important?
              </h4>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 text-indigo-600 rounded-lg shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Build Trust</span>
                    <span className="text-[11px] text-slate-500">Verified organisation details build credibility with MSMEs.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 text-indigo-600 rounded-lg shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Better Matches</span>
                    <span className="text-[11px] text-slate-500">Helps us connect you with relevant and capable suppliers.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 text-indigo-600 rounded-lg shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Secure & Compliant</span>
                    <span className="text-[11px] text-slate-500">Your data is protected and used as per platform policies.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Need Help Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 flex items-start gap-3">
              <Phone className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-slate-800 block">Need Help?</span>
                <p className="text-slate-500">Call us at +91 88888 12345 or write to <span className="text-indigo-600 font-medium">support@msmesangamam.in</span></p>
              </div>
            </div>

          </div>

          {/* Right Main Form Section */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 lg:p-8 shadow-xs space-y-6">
            
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Create your Organisation Profile</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All fields marked with <span className="text-red-500 font-bold">*</span> are mandatory
              </p>
            </div>

            {/* Form Fields Grid */}
            <form className="space-y-5">
              
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Legal Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Legal Name of Organisation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                  <span className="text-[10px] text-slate-400 block">Enter the exact legal name as per PAN</span>
                </div>

                {/* GSTIN with Verified Badge */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    GSTIN <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                      className="w-full pl-3.5 pr-20 py-2 text-xs font-mono uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                    {/* <span className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded flex items-center gap-1">
                      Verified <CheckCircle2 className="w-3 h-3" />
                    </span> */}
                  </div>
                  <span className="text-[10px] text-slate-400 block">Verified with GST database</span>
                </div>

                {/* PAN */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    PAN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs font-mono uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                  <span className="text-[10px] text-slate-400 block">Enter 10-digit PAN</span>
                </div>

              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Org Type */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Organisation Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.orgType}
                    onChange={(e) => setFormData({ ...formData, orgType: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800"
                  >
                    <option value="Private Limited Company">Private Limited Company</option>
                    <option value="Public Limited">Public Limited</option>
                    <option value="Proprietorship">Proprietorship</option>
                  </select>
                </div>

                {/* Industry */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Industry <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800"
                  >
                    <option value="Automotive">Automotive</option>
                    <option value="Textiles">Textiles</option>
                    <option value="Electronics">Electronics</option>
                  </select>
                </div>

                {/* Website */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Company Website</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                  <span className="text-[10px] text-slate-400 block">Enter official website (if available)</span>
                </div>

              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Year of Establishment */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Year of Establishment <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.establishmentYear}
                    onChange={(e) => setFormData({ ...formData, establishmentYear: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800"
                  >
                    <option value="2012">2012</option>
                    <option value="2015">2015</option>
                    <option value="2020">2020</option>
                  </select>
                </div>

                {/* Employees */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Total Number of Employees <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.employeeCount}
                    onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800"
                  >
                    <option value="501 - 1000">501 - 1000</option>
                    <option value="101 - 500">101 - 500</option>
                    <option value="1 - 100">1 - 100</option>
                  </select>
                </div>

                {/* Annual Turnover */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Annual Turnover (₹) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.annualTurnover}
                    onChange={(e) => setFormData({ ...formData, annualTurnover: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800"
                  >
                    <option value="10 - 50 Crore">10 - 50 Crore</option>
                    <option value="50 - 100 Crore">50 - 100 Crore</option>
                  </select>
                </div>

              </div>

              {/* Address Full Width */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Registered Office Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.registeredAddress}
                  onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
                />
                <span className="text-[10px] text-slate-400 block">Address should match GST registration</span>
              </div>

              {/* City, State, PIN */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800"
                  >
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Karnataka">Karnataka</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    PIN Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
                  />
                </div>
              </div>

              {/* Form Actions Footer */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="px-5 py-2.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer"
                  >
                    Save as Draft
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    Save & Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </form>

          </div>

        </div>

        <SecurityFooter />
      </main>
    </div>
  );
};