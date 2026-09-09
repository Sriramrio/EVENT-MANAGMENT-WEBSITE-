import type { PropsWithChildren,ReactNode } from 'react'; 
import { PageHeader } from '../../../../components/navigation/PageHeader';
export function ScreenShell({screen,title,subtitle,actions,children}:PropsWithChildren<{screen:number;title:string;subtitle:string;actions?:ReactNode}>){return <><PageHeader screen={screen} title={title} subtitle={subtitle} actions={actions}/>{children}</>;}
export function SectionTitle({title,subtitle}:{title:string;subtitle?:string}){return <div className="mb-3"><h2 className="text-sm font-extrabold text-slate-900">{title}</h2>{subtitle&&<p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}</div>;}
