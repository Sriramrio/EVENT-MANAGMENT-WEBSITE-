import { Award, CheckCircle2, Factory, MapPin, ShieldCheck } from 'lucide-react'; import { Link, useParams, useSearchParams } from 'react-router'; 
import { useRequirementMatches, useSupplier } from '../../../../services/buyer/hooks';
import { ErrorState, LoadingState } from '../../../../components/ui/PageStates';
import { ScreenShell } from '../shared/ScreenShell';
import { Card, CardHeader } from '../../../../components/ui/Card';
import { MatchScore } from '../../../../components/domain/MatchScore';
import { Button } from '../../../../components/ui/Button';

export default function SupplierProfilePage() {
    const { supplierId = 'sup-001' } = useParams();
    // The real requirementId travels via ?requirement=... on this route (there is no
    // requirementId path segment here). Falling back to a hardcoded fake id meant matches
    // never resolved and every score rendered as 0% — this reads the actual one instead.
    const [sp] = useSearchParams();
    const requirementId = sp.get('requirement') ?? '';
    const q = useSupplier(supplierId); const matches = useRequirementMatches(requirementId); if (q.isLoading) return <LoadingState />; if (q.isError) return <ErrorState error={q.error} />; const s = q.data!; const match = matches.data?.find(m => m.supplierId === supplierId) ?? matches.data?.[0]; return <ScreenShell screen={13} title="Supplier Profile View" subtitle="Review verified capability and explainable matching evidence."><div className="grid gap-4 xl:grid-cols-[1fr_22rem]"><Card className="p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div><h2 className="text-lg font-extrabold">{s.name}</h2>
            <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-500"
            ><span className="flex gap-1"><MapPin className="h-3.5 w-3.5" />{s.location}</span>
                <span className="flex gap-1"><Factory className="h-3.5 w-3.5" />{s.industry}</span>
            </div></div><div className="text-right">
            <MatchScore score={match?.overallScore ?? 0} size="lg" />
            <div className="text-[10px] font-bold text-slate-400">Requirement Match</div>
        </div></div><div className="mt-5 grid gap-4 md:grid-cols-2"><div><h3 className="text-xs font-extrabold">Highlights</h3><ul className="mt-3 space-y-2 text-xs text-slate-600">{s.capabilities.map(x => <li className="flex gap-2" key={x}><CheckCircle2 className="h-4 w-4 text-emerald-500" />{x}</li>)}</ul></div><div><h3 className="text-xs font-extrabold">Key Performance</h3>{[['Quality Score', s.qualityScore], ['On-time Delivery', s.deliveryScore], ['Technical Capability', s.technicalScore], ['Responsiveness', s.responseScore]].map(([l, v]) => <div className="mt-3" key={String(l)}><div className="flex justify-between text-xs"><span>{l}</span><b>{v}%</b></div><div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${v}%` }} /></div></div>)}</div></div><div className="mt-5"><h3 className="text-xs font-extrabold">Verified Certifications</h3><div className="mt-2 flex flex-wrap gap-2">{s.certifications.map(c => <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700" key={c}><ShieldCheck className="mr-1 inline h-3 w-3" />{c}</span>)}</div></div></Card><Card><CardHeader title="Match Explanation" /><div className="p-5">{match?.dimensions.map(d => <div className="mb-4" key={d.dimensionCode}><div className="flex justify-between text-xs"><b>{d.label}</b><span>{d.score}/{d.maxScore}</span></div><p className="mt-1 text-[10px] leading-4 text-slate-500">{d.explanation}</p></div>)}<div className="rounded-lg bg-amber-50 p-3 text-[10px] text-amber-800"><Award className="mb-1 h-4 w-4" />Scores are supplied by the matchmaking service and are not recomputed in the browser.</div><Link to={`/buyer/requirements/${requirementId}/suppliers/${supplierId}/action`}><Button className="mt-4 w-full">Supplier Actions</Button></Link></div></Card></div></ScreenShell>;
}
