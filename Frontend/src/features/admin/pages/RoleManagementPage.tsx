import { PageHeader } from '../../../shared/components/PageHeader';
import { rolePermissions } from '../../../config/permissions';

export function RoleManagementPage() {
  return <div><PageHeader title="Role Management" description="Role-to-permission mapping used by the route manifest, sidebar and action guards." />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Object.entries(rolePermissions).map(([role, permissions]) => <section key={role} className="card p-5"><h3 className="font-bold">{role}</h3><p className="mt-1 text-sm text-slate-500">{permissions.length} permissions</p><div className="mt-3 flex flex-wrap gap-1">{permissions.slice(0, 8).map(p => <span key={p} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{p}</span>)}{permissions.length > 8 && <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">+{permissions.length - 8}</span>}</div></section>)}</div>
  </div>;
}
