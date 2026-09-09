import React from 'react';
import {
    HelpCircle,
    ChevronDown,
    Bell,
    User,
    Check,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    Lock
} from 'lucide-react';
import { BRAND } from '../../config/brand';
import lubLogo from '../../assets/images/lub-logo.jpg';
import msmeSangamam from '../../assets/images/msme-sangamam.png';
const ASSETS = {
    lubLogo,
    msmeSangamam,

} as const;
// ============================================================================
// 1. HEADER COMPONENT
// ============================================================================
interface HeaderProps {
    screenTitle: string;
    screenSubtitle: string;
    userName?: string;
    userRole?: string;
    stepBadgeText?: string;
}

export const Header: React.FC<HeaderProps> = ({
    screenTitle,
    screenSubtitle,
    userName = "Rahul Deshmukh",
    userRole = "Buyer",
    stepBadgeText
}) => {
    return (
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
            {/* Logos */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    {/* LUB Emblem Placeholder */}
                    <div className="flex flex-col items-center">
                        <img src={ASSETS.lubLogo} alt="Laghu Udyog Bharati Official Logo" className="h-16 sm:h-14 w-auto object-contain" />

                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-1" />

                    {/* MSME Sangamam Logo */}
                    <div className="flex items-center gap-2">

                        <div>
                            <img src={BRAND.msmeLogoUrl} alt="Laghu Udyog Bharati Official Logo" className="h-16 sm:h-14 w-auto object-contain" />

                        </div>
                    </div>
                </div>

                <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block" />

                {/* Dynamic Screen Title */}
                <div className="hidden md:block">
                    <h1 className="text-base font-bold text-slate-900 leading-tight">
                        {screenTitle}
                    </h1>
                    <p className="text-xs text-slate-500">{screenSubtitle}</p>
                </div>
            </div>

            {/* Right User Actions */}
            <div className="flex items-center gap-4">
                {stepBadgeText && (
                    <span className="hidden sm:inline-flex px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-100">
                        {stepBadgeText}
                    </span>
                )}

                <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 relative">
                    <HelpCircle className="w-5 h-5" />
                </button>

                <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        3
                    </span>
                </button>

                <div className="h-6 w-px bg-slate-200" />

                {/* User Profile Dropdown */}
                <div className="flex items-center gap-2.5 cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                        {userName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="hidden lg:block text-left">
                        <span className="text-xs font-bold text-slate-800 block leading-none">
                            {userName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                            {userRole}
                        </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
            </div>
        </header>
    );
};

// ============================================================================
// 2. STEPPER PROGRESS BAR COMPONENT
// ============================================================================
export interface StepItem {
    id: number;
    label: string;
    status: 'completed' | 'in-progress' | 'pending';
}

interface StepperProps {
    steps: StepItem[];
}

export const Stepper: React.FC<StepperProps> = ({ steps }) => {
    return (
        <div className="bg-white border-b border-slate-200 px-6 py-4 overflow-x-auto">
            <div className="max-w-6xl mx-auto flex items-center justify-between min-w-[760px] relative">
                {/* Continuous Connecting Line Background */}
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

                {steps.map((step) => {
                    const isCompleted = step.status === 'completed';
                    const isInProgress = step.status === 'in-progress';

                    return (
                        <div key={step.id} className="flex flex-col items-center relative z-10 group">
                            {/* Step Circle Icon */}
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${isCompleted
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : isInProgress
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                                            : 'bg-white border-slate-300 text-slate-500'
                                    }`}
                            >
                                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.id}
                            </div>

                            {/* Step Label */}
                            <span
                                className={`text-[11px] font-semibold mt-1.5 text-center whitespace-nowrap max-w-[90px] ${isInProgress
                                        ? 'text-indigo-600 font-bold'
                                        : isCompleted
                                            ? 'text-slate-700'
                                            : 'text-slate-400'
                                    }`}
                            >
                                {step.label}
                            </span>

                            {/* Status Tag for Active Step */}
                            {isInProgress && (
                                <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider mt-0.5">
                                    In Progress
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ============================================================================
// 3. SECURE FOOTER COMPONENT
// ============================================================================
export const SecurityFooter: React.FC = () => (
    <div className="mt-8 py-3 px-4 bg-slate-100/70 border border-slate-200 rounded-xl flex items-center justify-center gap-2 text-xs text-slate-600 font-medium">
        <Lock className="w-4 h-4 text-emerald-600" />
        <span>Your information is secure with us. We use industry-standard encryption to protect your data.</span>
    </div>
);