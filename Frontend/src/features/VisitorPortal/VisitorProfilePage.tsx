import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getVisitorProfile } from '../../data/api/visitorApiClient';
import { apiClient } from '../../data/api/apiClient';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';

type VisitorDetails = {
    id: string;
    registrationNumber: string;
    legalName: string;
    contactPersonName: string;
    email: string;
    mobile: string;
    designation?: string;
    city?: string;
    district?: string;
};

export function VisitorProfilePage() {
    const visitorSession = getVisitorProfile();
    const registrationNumber = visitorSession?.registrationNumber;
    const [searchParams] = useSearchParams();
    const tenantId = searchParams.get('tenantId') || '11111111-1111-1111-1111-111111111111';

    const [visitor, setVisitor] = useState<VisitorDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!registrationNumber) {
            setError(new Error('Visitor session not found.'));
            setLoading(false);
            return;
        }

        setLoading(true);
        apiClient
            .get<VisitorDetails>(`/visitors/${encodeURIComponent(registrationNumber)}?tenantId=${tenantId}`)
            .then(setVisitor)
            .catch(err => setError(new Error('Could not load profile details.')))
            .finally(() => setLoading(false));
    }, [registrationNumber, tenantId]);

    if (loading) return <LoadingState label="Loading profile..." />;
    if (error) return <ErrorState error={error} />;
    if (!visitor) return <ErrorState error={new Error('No profile data found.')} />;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Visitor Profile</p>
                <h1 className="mt-1 text-2xl font-extrabold text-slate-900">My Details</h1>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Legal Name / Company</p>
                        <p className="mt-1 font-semibold text-slate-900">{visitor.legalName || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Person</p>
                        <p className="mt-1 font-semibold text-slate-900">{visitor.contactPersonName || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Designation</p>
                        <p className="mt-1 font-semibold text-slate-900">{visitor.designation || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registration Number</p>
                        <p className="mt-1 font-semibold text-slate-900">{visitor.registrationNumber}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                        <p className="mt-1 font-semibold text-slate-900">{visitor.email || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mobile Number</p>
                        <p className="mt-1 font-semibold text-slate-900">{visitor.mobile || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">City</p>
                        <p className="mt-1 font-semibold text-slate-900">{visitor.city || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">District</p>
                        <p className="mt-1 font-semibold text-slate-900">{visitor.district || 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
