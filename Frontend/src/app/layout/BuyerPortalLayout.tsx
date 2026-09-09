import { Outlet } from 'react-router';
import { BrandHeader } from '../../components/navigation/BrandHeader';
import { BuyerSidebar } from '../../components/navigation/BuyerSidebar';

export function BuyerPortalLayout(){return <div className="min-h-screen bg-slate-50">
    <BrandHeader title="Buyer Portal" subtitle="Source, match, meet and convert supplier opportunities"/>
    <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]"><BuyerSidebar/>
    <main className="min-w-0 p-4 md:p-6 xl:p-7"><div className="mx-auto max-w-7xl"><Outlet/></div></main></div></div>;}
