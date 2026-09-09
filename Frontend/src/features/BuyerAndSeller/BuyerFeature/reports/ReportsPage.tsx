import { BarChart3,CalendarCheck,Download,FileText,Target } from 'lucide-react'; 
import { KpiCard } from '../../../../components/data-display/KpiCard';
import { Button } from '../../../../components/ui/Button';
import { Card, CardHeader } from '../../../../components/ui/Card';
import { useReports, useRequirements, useMeetings } from '../../../../services/buyer/hooks';
// import { StatusBadge } from '../../../../shared/StatusBadge';
import { ScreenShell } from '../shared/ScreenShell';
import { StatusBadge } from '../../../../components/ui/StatusBadge';

export default function ReportsPage(){
    const reports = useReports();
    const req = useRequirements();
    const data = reports.data as any;
    const kpis = data?.kpis;
    const recentReports = data?.recentReports || [];
    
    return (
        <ScreenShell screen={31} title="Reports & Analytics" subtitle="Insights and reports for your sourcing activities.">
            <div className="mb-4 flex gap-2 text-xs">
                <button className="rounded-lg bg-blue-50 px-3 py-2 font-bold text-blue-700">Dashboard</button>
                <button className="rounded-lg px-3 py-2 font-bold text-slate-500">Reports Library</button>
                <button className="rounded-lg px-3 py-2 font-bold text-slate-500">Custom Reports</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
                <KpiCard label="Active Requirements" value={req.data?.filter(x => x.status === 'Active').length ?? 0} icon={FileText}/>
                <KpiCard label="Matched Suppliers" value={kpis?.matchedSuppliers ?? 0} icon={Target}/>
                <KpiCard label="Meetings Completed" value={kpis?.meetingsCompleted ?? 0} icon={CalendarCheck}/>
                <KpiCard label="Avg Match Score" value={kpis?.avgScore ?? '0%'} icon={BarChart3}/>
                <KpiCard label="On-time Delivery" value="95%" icon={BarChart3}/>
                <KpiCard label="Potential Value" value={kpis?.potentialValue ?? '₹0'} icon={BarChart3}/>
            </div>
            <Card className="mt-4">
                <CardHeader title="Recent Reports" subtitle="Large exports should be server-generated jobs."/>
                <div className="divide-y divide-slate-100">
                    {recentReports.map((r: any) => (
                        <div className="flex items-center justify-between gap-4 p-4" key={r.id}>
                            <div>
                                <b className="text-xs">{r.name}</b>
                                <p className="text-[10px] text-slate-400">Generated on {r.generatedAt}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusBadge status={r.status}/>
                                <Button variant="ghost" className="!p-2" disabled={r.status !== 'Ready'} aria-label={`Download ${r.name}`}>
                                    <Download className="h-4 w-4"/>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </ScreenShell>
    );
}
