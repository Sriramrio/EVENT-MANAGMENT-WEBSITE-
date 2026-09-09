import React from 'react';
import {
    Users,
    Building2,
    Handshake,
    Calendar,
    Award,
    ArrowRight,
    MapPin,
    Settings,
    Cpu,
    Truck,
    Factory
} from 'lucide-react';
import { BRAND } from '../../config/brand';

import lubLogo from '../../assets/images/lub-logo.jpg';
import msmeSangamam from '../../assets/images/msme-sangamam.png';
const ASSETS = {
    lubLogo,
    msmeSangamam,

} as const;
export const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">


            <nav className="bg-white border-b border-slate-100 px-6 lg:px-12 py-3 flex items-center justify-between sticky top-0 z-50">

                <div className="flex items-center gap-6">
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
                </div>

                {/* Center Nav Links */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                    <a href="#home" className="text-indigo-600 font-semibold border-b-2 border-indigo-600 pb-1">
                        Home
                    </a>
                    <a href="#about" className="hover:text-slate-900 transition-colors">
                        About
                    </a>
                    <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
                        How It Works
                    </a>
                    <a href="#events" className="hover:text-slate-900 transition-colors">
                        Events
                    </a>
                    <a href="#resources" className="hover:text-slate-900 transition-colors">
                        Resources
                    </a>
                </div>

                {/* Auth Buttons */}
                <div className="flex items-center gap-3">
                    <button className="px-5 py-2 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-all cursor-pointer">
                        Login
                    </button>
                    <button className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-all cursor-pointer">
                        Register
                    </button>
                </div>
            </nav>

            <section className="px-6 lg:px-12 py-12 lg:py-16 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                    {/* Left Column Text */}
                    <div className="lg:col-span-5 space-y-6">

                        {/* Step Badge */}
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-indigo-600 text-white text-[11px] font-semibold rounded-full shadow-xs">
                                Step 1 of 10
                            </span>
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[11px] font-medium rounded-full border border-slate-200">
                                Buyer Journey
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
                            Stronger Together.<br />
                            Smarter Supply Chains.
                        </h1>

                        {/* Description */}
                        <p className="text-sm lg:text-base text-slate-600 leading-relaxed max-w-lg">
                            MSME Sangamam connects Buyers with verified MSME Sellers to create opportunities,
                            drive growth, and build a resilient Bharat.
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <button className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer">
                                I am a Buyer <ArrowRight className="w-4 h-4" />
                            </button>
                            <button className="px-6 py-3.5 bg-[#E54228] hover:bg-[#D1351D] text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer">
                                I am a Seller <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Right Column Illustration Banner */}
                    <div className="lg:col-span-7 relative">
                        <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/60 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <img
                                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=1200"
                                alt="Business Meeting & Supply Chain Network"
                                className="w-full h-[380px] object-cover object-center mix-blend-multiply opacity-90"
                            />

                            {/* Overlay Graphical Network Badges */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent flex items-end p-6">
                                <div className="w-full flex justify-around text-white/90 text-[11px] font-semibold backdrop-blur-md bg-white/10 p-3 rounded-2xl border border-white/20">
                                    <div className="text-center">
                                        <span className="block font-bold text-white text-sm">Trusted Connections</span>
                                        Verified Partners
                                    </div>
                                    <div className="text-center border-x border-white/20 px-4">
                                        <span className="block font-bold text-white text-sm">Transparent Process</span>
                                        Direct Negotiations
                                    </div>
                                    <div className="text-center">
                                        <span className="block font-bold text-white text-sm">Growth Together</span>
                                        Resilient Ecosystem
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* --------------------------------------------------------- */}
            {/* METRICS & METRIC CARDS                                   */}
            {/* --------------------------------------------------------- */}
            <section className="px-6 lg:px-12 max-w-7xl mx-auto -mt-2">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

                    {/* Registered MSMEs */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-2xl font-extrabold text-slate-900 block leading-none">
                                25,840+
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                                Registered MSMEs
                            </span>
                        </div>
                    </div>

                    {/* Buyers */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-2xl font-extrabold text-slate-900 block leading-none">
                                3,620+
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                                Buyers
                            </span>
                        </div>
                    </div>

                    {/* Matches Made */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Handshake className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-2xl font-extrabold text-slate-900 block leading-none">
                                12,450+
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                                Matches Made
                            </span>
                        </div>
                    </div>

                    {/* Events Conducted */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-2xl font-extrabold text-slate-900 block leading-none">
                                820+
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                                Events Conducted
                            </span>
                        </div>
                    </div>

                    {/* Buyer Satisfaction */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 col-span-2 md:col-span-1">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-2xl font-extrabold text-slate-900 block leading-none">
                                98%
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                                Buyer Satisfaction
                            </span>
                        </div>
                    </div>

                </div>
            </section>

            {/* --------------------------------------------------------- */}
            {/* UPCOMING & ONGOING EVENTS                                 */}
            {/* --------------------------------------------------------- */}
            <section className="px-6 lg:px-12 py-12 max-w-7xl mx-auto">
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 lg:p-8 shadow-xs space-y-6">

                    {/* Section Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-base lg:text-lg font-bold text-slate-900 tracking-tight">
                                Upcoming & Ongoing Events
                            </h2>
                        </div>
                        <a
                            href="#all-events"
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                        >
                            View All Events <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                    </div>

                    {/* Event Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                        {/* Event Card 1 */}
                        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/70 hover:border-indigo-300 transition-all space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100/60 text-blue-600 flex items-center justify-center">
                                <Settings className="w-6 h-6" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                    Auto Components Meet 2025
                                </h3>
                                <div className="space-y-1 text-xs text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Pune, Maharashtra</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        <span>23 May 2025</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Event Card 2 */}
                        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/70 hover:border-indigo-300 transition-all space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-100/60 text-indigo-600 flex items-center justify-center">
                                <Cpu className="w-6 h-6" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                    Engineering Sourcing Conclave
                                </h3>
                                <div className="space-y-1 text-xs text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Bengaluru, Karnataka</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        <span>10 Jun 2025</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Event Card 3 */}
                        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/70 hover:border-indigo-300 transition-all space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-sky-100/60 text-sky-600 flex items-center justify-center">
                                <Truck className="w-6 h-6" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                    Agri & EV Supply Chain Meet
                                </h3>
                                <div className="space-y-1 text-xs text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Chennai, Tamil Nadu</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        <span>18 Jun 2025</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Event Card 4 */}
                        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/70 hover:border-indigo-300 transition-all space-y-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-100/60 text-purple-600 flex items-center justify-center">
                                <Factory className="w-6 h-6" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                    MSME Export Connect Summit
                                </h3>
                                <div className="space-y-1 text-xs text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Mumbai, Maharashtra</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        <span>02 Jul 2025</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </section>

        </div>
    );
};