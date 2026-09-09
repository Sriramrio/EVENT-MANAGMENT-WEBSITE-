import React, { useState } from 'react';

import {
    ShoppingBag,
    Store,
    Handshake,
    CheckCircle2,
    Info,
    ChevronLeft,
    ChevronRight,
    FileText,
    Users,
    Calendar,
    Building2,
    MessageSquare,
    TrendingUp,
    Maximize
} from 'lucide-react';
import { Header, StepItem, Stepper } from '../../../components/BaseComponents/Header';
import { useNavigate } from 'react-router-dom';

const ROLE_STEPS: StepItem[] = [
    { id: 1, label: 'Landing', status: 'completed' },
    { id: 2, label: 'Role Selection', status: 'in-progress' },
    { id: 3, label: 'Org. Registration', status: 'pending' },
    { id: 4, label: 'Contact Person', status: 'pending' },
    { id: 5, label: 'Requirements', status: 'pending' },
    { id: 6, label: 'Matching', status: 'pending' },
    { id: 7, label: 'Suppliers', status: 'pending' },
    { id: 8, label: 'Meetings', status: 'pending' },
    { id: 9, label: 'Post Meeting', status: 'pending' },
        { id: 10, label: 'Dashboard', status: 'pending' },

];

type RoleType = 'buyer' | 'seller' | 'both';

export const ScreenRoleSelection: React.FC = () => {
    const [selectedRole, setSelectedRole] = useState<RoleType>('buyer');
    const navigate = useNavigate()
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Header
                screenTitle="Buyer Journey — Screen 2: Role Selection"
                screenSubtitle="Choose how you want to participate in MSME Sangamam"
            />

            <Stepper steps={ROLE_STEPS} />

            <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-6">

                {/* Center Container Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-10 shadow-xs space-y-8">

                    {/* Header Title */}
                    <div className="text-center max-w-xl mx-auto space-y-2">
                        <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
                            Step 2 of 10
                        </span>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                            Choose how you want to participate
                        </h2>
                        <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                            Select the option that best describes your role on the platform. You can update this later from your profile settings.
                        </p>
                    </div>

                    {/* Role Cards Grid */}
                    <div className="grid grid-cols-1 md:flex flex-row justify-center gap-4">

                        {/* Card 1: Buyer */}
                        <div
                            onClick={() => setSelectedRole('buyer')}
                            className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-6 ${selectedRole === 'buyer'
                                ? 'border-indigo-600 bg-white shadow-lg ring-2 ring-indigo-600/10'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                        >
                            {/* Radio Circle */}
                            <div className="absolute top-4 right-4">
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedRole === 'buyer'
                                        ? 'border-indigo-600 bg-indigo-600 text-white'
                                        : 'border-slate-300'
                                        }`}
                                >
                                    {selectedRole === 'buyer' && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                            </div>

                            {/* Icon & Title */}
                            <div className="text-center space-y-3 pt-2">
                                <div className="w-16 h-16 rounded-full bg-blue-50 text-indigo-600 mx-auto flex items-center justify-center">
                                    <ShoppingBag className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">I am a Buyer</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    I want to discover, connect and do business with MSME suppliers.
                                </p>
                            </div>

                            <div className="h-px bg-slate-100" />

                            {/* Bullet Features */}
                            <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                                <li className="flex items-center gap-2.5">
                                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                                    Post requirements & discover matches
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                                    Evaluate & connect with suppliers
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                                    Manage meetings & follow-ups
                                </li>
                            </ul>
                        </div>

                        {/* Card 2: Seller */}
                        <div
                            onClick={() => setSelectedRole('seller')}
                            className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-6 ${selectedRole === 'seller'
                                ? 'border-indigo-600 bg-white shadow-lg ring-2 ring-indigo-600/10'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                        >
                            <div className="absolute top-4 right-4">
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedRole === 'seller'
                                        ? 'border-indigo-600 bg-indigo-600 text-white'
                                        : 'border-slate-300'
                                        }`}
                                >
                                    {selectedRole === 'seller' && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                            </div>

                            <div className="text-center space-y-3 pt-2">
                                <div className="w-16 h-16 rounded-full bg-blue-50 text-indigo-600 mx-auto flex items-center justify-center">
                                    <Store className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">I am a Seller</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    I represent an MSME and want to showcase our capabilities.
                                </p>
                            </div>

                            <div className="h-px bg-slate-100" />

                            <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                                <li className="flex items-center gap-2.5">
                                    <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                                    Create supplier profile & showcase
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                                    Receive & respond to requirements
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0" />
                                    Grow business & build relationships
                                </li>
                            </ul>
                        </div>

                        {/* Card 3: Both */}
                        {/* <div
              onClick={() => setSelectedRole('both')}
              className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-6 ${
                selectedRole === 'both'
                  ? 'border-indigo-600 bg-white shadow-lg ring-2 ring-indigo-600/10'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="absolute top-4 right-4">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedRole === 'both'
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300'
                  }`}
                >
                  {selectedRole === 'both' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>

              <div className="text-center space-y-3 pt-2">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-indigo-600 mx-auto flex items-center justify-center">
                  <Handshake className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Both Buyer & Seller</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  I want to do both - discover suppliers and showcase our own capabilities.
                </p>
              </div>

              <div className="h-px bg-slate-100" />

              <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                <li className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                  Access all buyer features
                </li>
                <li className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 text-indigo-600 shrink-0" />
                  Access all supplier features
                </li>
                <li className="flex items-center gap-2.5">
                  <Maximize className="w-4 h-4 text-indigo-600 shrink-0" />
                  Maximize opportunities on platform
                </li>
              </ul>
            </div> */}

                    </div>

                    {/* Info Banner */}
                    <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 flex items-center gap-3 text-xs text-indigo-800 font-medium">
                        <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>You can change your role anytime from your account settings.</span>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                        <button className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer">
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                        <button className="px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer" onClick={() => {
                            navigate('/organization')
                        }}>
                            Continue <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                </div>

            </main>
        </div>
    );
};