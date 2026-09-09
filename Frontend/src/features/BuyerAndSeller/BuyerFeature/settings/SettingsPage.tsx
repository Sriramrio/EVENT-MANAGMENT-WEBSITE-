import { Activity,Building2,KeyRound,Lock,MapPin,Shield,Tags,Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ScreenShell } from '../shared/ScreenShell';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { TextInput } from '../../../../components/forms/FormFields';
import { useChangePassword } from '../../../../services/buyer/hooks';

// Items that navigate to a real screen elsewhere in the app.
const navigableItems: Record<string, string> = {
  'Organisation Profile': '/buyer/onboarding/organisation',
  'Contact Management': '/buyer/contacts?from=settings',
  'Activity Log': '/buyer/audits',
};

// Items that don't have a backend concept yet (unlike Change Password, wired below). Kept
// visible but disabled with a clear reason, rather than silently doing nothing when clicked.
const comingSoonItems = new Set(['Preferred Categories', 'Preferred Locations', 'Quality Preferences', 'Users & Access', 'Data & Privacy']);

const groups = [
  { title: 'Profile & Organisation', items: [['Organisation Profile', Building2], ['Contact Management', Users]] },
  { title: 'Sourcing Preferences', items: [['Preferred Categories', Tags], ['Preferred Locations', MapPin], ['Quality Preferences', Shield]] },
  { title: 'Account Preferences', items: [['Users & Access', Users], ['Data & Privacy', Lock], ['Activity Log', Activity]] },
] as const;

function ChangePasswordCard() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const change = useChangePassword();

  async function submit() {
    setFormError(null);
    if (newPassword.length < 8) { setFormError('New password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setFormError('New password and confirmation do not match.'); return; }
    try {
      await change.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not change password. Please retry.');
    }
  }

  return (
    <Card className="p-5">
      <button className="flex w-full items-center justify-between rounded-xl border border-slate-100 p-3 text-left text-xs font-bold hover:border-brand-100 hover:bg-brand-50/30" onClick={() => setOpen(o => !o)}>
        <span className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-50 text-brand-600"><KeyRound className="h-4 w-4" /></span>Change Password</span>
        <span className="text-slate-300">{open ? '▾' : '→'}</span>
      </button>
      {open && (
        <div className="mt-4 grid gap-3">
          <TextInput label="Current Password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" />
          <TextInput label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" helperText="At least 8 characters." />
          <TextInput label="Confirm New Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" />
          {formError && <p className="text-xs font-semibold text-red-600">{formError}</p>}
          {change.isSuccess && !formError && <p className="text-xs font-semibold text-emerald-600">Password updated.</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" loading={change.isPending} onClick={submit}>Update Password</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function SettingsPage() {
  const nav = useNavigate();
  return (
    <ScreenShell screen={32} title="Settings & Preferences" subtitle="Manage your profile and preferences.">
      <div className="grid gap-4 md:grid-cols-2">
        <ChangePasswordCard />
        {groups.map(g => (
          <Card className="p-5" key={g.title}>
            <h2 className="text-sm font-extrabold">{g.title}</h2>
            <div className="mt-4 space-y-2">
              {g.items.map(([label, Icon]) => {
                const to = navigableItems[label];
                const disabled = comingSoonItems.has(label);
                return (
                  <button
                    key={label}
                    disabled={disabled}
                    title={disabled ? 'Coming soon' : undefined}
                    className={`flex w-full items-center justify-between rounded-xl border border-slate-100 p-3 text-left text-xs font-bold ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-brand-100 hover:bg-brand-50/30'}`}
                    onClick={() => { if (to) nav(to + '?from=settings'); }}
                  >
                    <span className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-50 text-brand-600"><Icon className="h-4 w-4" /></span>{label}</span>
                    <span className="text-slate-300">{disabled ? 'Soon' : '→'}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </ScreenShell>
  );
}