import { PageHeader } from '../../../shared/components/PageHeader';
import { rolePermissions } from '../../../config/permissions';

const users = [
  ['superadmin@lubmsmehosur.org', 'SuperAdmin', 'Full control'],
  ['eventadmin@lubmsmehosur.org', 'EventAdmin', 'Event operations'],
  ['stallallocation@lubmsmehosur.org', 'StallAllocationAdmin', 'Stall blocking and release'],
  ['payment@lubmsmehosur.org', 'PaymentVerifier', 'Payment verification'],
  ['invoice@lubmsmehosur.org', 'ProformaInvoicePreparer', 'Invoice generation'],
  ['committee@lubmsmehosur.org', 'CoreCommitteeMember', 'Read-only dashboard'],
  ['auditor@lubmsmehosur.org', 'ViewerAuditor', 'Read-only audit']
];

export function UserManagementPage() {
  return <div><PageHeader title="User Management" description="Admin identities and role assignments for LUB MSME HOSUR." />
    <div className="card overflow-hidden"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Access</th></tr></thead><tbody>{users.map(([email, role, access]) => <tr key={email} className="border-t"><td className="p-4 font-semibold">{email}</td><td className="p-4">{role}</td><td className="p-4 text-slate-600">{access} · {rolePermissions[role]?.length ?? 0} permissions</td></tr>)}</tbody></table></div>
  </div>;
}
