import { Plus } from 'lucide-react';
import { Column, DataTable } from '../../../../components/data-display/DataTable';
import { Button } from '../../../../components/ui/Button';
import { LoadingState, ErrorState } from '../../../../components/ui/PageStates';
import { useOnboarding } from '../../../../services/buyer/hooks';
// import { StatusBadge } from '../../../../shared/StatusBadge';
import { ScreenShell } from '../shared/ScreenShell';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { Onboarding } from '../../../../domain/models/buyer';
export default function OnboardingPage() {
    const q = useOnboarding();
    if (q.isLoading) return <LoadingState />;
    if (q.isError) return <ErrorState error={q.error} />;
    const cols: Column<Onboarding>[] = [{ key: 'sup', header: 'Supplier', cell: r => <b>{r.supplier}</b> }, { key: 'req', header: 'Requirement', cell: r => r.requirement }, { key: 'stage', header: 'Registration Stage', cell: r => r.stage },
    { key: 'started', header: 'Started On', cell: r => r.startedOn },
    { key: 'status', header: 'Status', cell: r => <StatusBadge status={r.status} /> },
    { key: 'action', header: 'Action', cell: () => <button className="font-bold text-brand-600">View</button> }];
    return <ScreenShell screen={26} title="Vendor Registration"
        subtitle="Manage vendor registration & onboarding."
        actions={<Button><Plus className="h-4 w-4" />Invite New Supplier</Button>}>
        <DataTable rows={q.data ?? []} columns={cols} caption="Vendor onboarding register" />
    </ScreenShell>;
}
