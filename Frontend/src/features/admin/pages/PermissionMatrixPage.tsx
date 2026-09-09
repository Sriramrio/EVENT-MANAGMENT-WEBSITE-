import { PageHeader } from '../../../shared/components/PageHeader';
import { PERMISSIONS, rolePermissions } from '../../../config/permissions';

export function PermissionMatrixPage() {
  const permissions = Object.values(PERMISSIONS);
  const roles = Object.keys(rolePermissions);
  return <div><PageHeader title="Permission Matrix" description="Role and permission matrix aligned with backend security enforcement." />
    <div className="card overflow-x-auto"><table className="min-w-[980px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Permission</th>{roles.map(role => <th key={role} className="p-3">{role}</th>)}</tr></thead><tbody>{permissions.map(permission => <tr key={permission} className="border-t"><td className="p-3 font-semibold">{permission}</td>{roles.map(role => <td key={role} className="p-3">{rolePermissions[role]?.includes(permission) ? '✓' : '—'}</td>)}</tr>)}</tbody></table></div>
  </div>;
}
