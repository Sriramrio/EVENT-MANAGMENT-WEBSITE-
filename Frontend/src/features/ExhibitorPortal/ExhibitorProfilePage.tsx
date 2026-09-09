import React, { useEffect, useState } from 'react';
import { exhibitorApiClient } from '../../data/api/exhibitorApiClient';
import { apiClient } from '../../data/api/apiClient';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';
import { Building2, Store, User, MapPin, Briefcase, Mail, Phone, Globe, Fingerprint, BadgeCheck } from 'lucide-react';

type CompanyProfile = {
  registrationNumber: string;
  companyName: string;
  legalName: string;
  fasciaName?: string | null;
  stallNumber?: string | null;
  industryCategory?: string | null;
  businessType?: string | null;
  productServiceDescription?: string | null;
  contactPersonName?: string | null;
  contactPersonDesignation?: string | null;
  mobile?: string | null;
  email?: string | null;
  website?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  companyLogo?: string | null;
};

export function ExhibitorProfilePage() {
    const [company, setCompany] = useState<CompanyProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // First get the basic me payload to find the registration number
        exhibitorApiClient
            .get<{registrationNumber: string}>('/exhibitor/me')
            .then((data) => {
                if (!data.registrationNumber) {
                    throw new Error('Registration number not found.');
                }
                return apiClient.get<CompanyProfile>(`/public/stalls/${encodeURIComponent(data.registrationNumber)}`);
            })
            .then(setCompany)
            .catch(err => setError(new Error('Could not load profile details.')))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingState label="Loading profile..." />;
    if (error) return <ErrorState error={error} />;
    if (!company) return <ErrorState error={new Error('No profile data found.')} />;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            {/* Page Header */}
            <div>
                <p className="text-xs font-bold text-[#0B3B75] uppercase tracking-wider mb-1">Exhibitor Profile</p>
                <h1 className="text-3xl font-black text-slate-900">My Details</h1>
                <p className="mt-2 text-sm text-slate-500">
                    Manage and review your registered company details.
                </p>
            </div>

            {/* Hero Card */}
            <div className="relative overflow-hidden rounded-3xl bg-[#0B3B75] text-white shadow-xl">
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-blue-800/50 to-transparent"></div>
                <div className="relative p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-inner backdrop-blur-md border border-white/10">
                        <Building2 className="h-10 w-10 text-blue-100" />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl md:text-3xl font-extrabold">{company.companyName}</h2>
                            {company.stallNumber && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-100 border border-emerald-500/30">
                                    <BadgeCheck size={14} /> Allocated
                                </span>
                            )}
                        </div>
                        <p className="mt-2 text-blue-200 font-medium">{company.legalName}</p>
                        <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-blue-100">
                            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg">
                                <Fingerprint size={16} className="text-blue-300" />
                                {company.registrationNumber}
                            </span>
                            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg">
                                <Store size={16} className="text-blue-300" />
                                Stall: {company.stallNumber || 'Pending Allocation'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid layout for detailed cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Business Information */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                            <Briefcase size={22} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">Business Details</h3>
                    </div>
                    
                    <div className="space-y-6">
                        <DetailRow label="Industry Category" value={company.industryCategory} />
                        <DetailRow label="Business Type" value={company.businessType} />
                        <DetailRow label="Fascia Name" value={company.fasciaName} />
                        {company.productServiceDescription && (
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Products / Services</p>
                                <p className="text-sm font-semibold text-slate-900 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    {company.productServiceDescription}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Contact Information */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                            <User size={22} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">Contact Person</h3>
                    </div>
                    
                    <div className="space-y-6">
                        <DetailRow label="Name" value={company.contactPersonName} />
                        <DetailRow label="Designation" value={company.contactPersonDesignation} />
                        
                        <div className="pt-2 space-y-4">
                            <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                    <Phone size={16} />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mobile</p>
                                    <p className="font-bold text-slate-900">{company.mobile || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                    <Mail size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                                    <p className="font-bold text-slate-900 truncate">{company.email || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Location Information */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm md:col-span-2">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <MapPin size={22} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">Location & Web</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <DetailRow label="City" value={company.city} />
                        <DetailRow label="District" value={company.district} />
                        <DetailRow label="State" value={company.state} />
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Website</p>
                            {company.website && company.website !== 'N/A' && company.website.trim() !== '' ? (
                                <a 
                                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="inline-flex items-center gap-2 font-bold text-[#0B3B75] bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition"
                                >
                                    <Globe size={16} />
                                    Visit Website
                                </a>
                            ) : (
                                <p className="font-bold text-slate-900 mt-2">N/A</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</p>
            <p className="font-bold text-slate-900 text-[15px]">{value || 'N/A'}</p>
        </div>
    );
}
