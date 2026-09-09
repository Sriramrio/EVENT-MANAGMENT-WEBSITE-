import { useState } from 'react'; 
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { ScreenShell } from '../shared/ScreenShell';

const criteria=[['Technical Capability',20,5],['Quality Systems & Certifications',20,5],['Manufacturing Capacity',20,4],['Delivery Performance',15,4],['Commercial',15,4],['Service & Support',10,5]] as const;
export default function EvaluationPage(){
    const [scores,setScores]=useState<Record<string,number>>(()=>Object.fromEntries(criteria.map(([c,,s])=>[c,s])));
    const weightTotal=criteria.reduce((a,[,w])=>a+w,0);
    const normalized=criteria.reduce((a,[c,w])=>a+(scores[c]??0)*w,0)/(weightTotal||1);
    return <ScreenShell screen={25} title="Supplier Evaluation" subtitle="Evaluate suppliers against configured weighted criteria.">
        <Card className="p-5"><div className="grid gap-4 md:grid-cols-2"><label className="text-xs font-bold">Supplier<select className="input-base mt-1">
            <option>Precision Mach Tech Pvt. Ltd.</option></select></label>
            <label className="text-xs font-bold">Requirement<select className="input-base mt-1">
                <option>REQ-0001 · CNC Machined Shaft</option></select></label>
                </div>{weightTotal!==120&&<div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Evaluation template weight total is {weightTotal}%. Production configuration must be validated before authoritative submission. This mock deliberately demonstrates the validation gate.</div>}
                <div className="mt-5 table-wrap"><table className="data-table"><thead><tr><th>Evaluation Criteria</th><th>Weightage</th><th>Score (1–5)</th>
                <th>Weighted Score</th></tr></thead><tbody>{criteria.map(([c,w])=><tr key={c}><td className="font-bold">{c}</td><td>{w}%</td><td><select className="input-base !w-20 !py-1" value={scores[c]} onChange={e=>setScores(s=>({...s,[c]:Number(e.target.value)}))}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}
                </select></td><td>{(((scores[c]??0)*w)/100).toFixed(2)}</td></tr>)}</tbody><tfoot><tr><td className="font-extrabold">Total Score</td><td>{weightTotal}%</td><td></td><td className="font-extrabold text-emerald-600">{normalized.toFixed(2)} / 5.00</td></tr></tfoot></table></div><div className="mt-5 flex justify-end gap-2"><Button variant="secondary">Save Evaluation</Button><Button disabled={weightTotal!==100}>Submit Evaluation</Button></div></Card></ScreenShell>;}
