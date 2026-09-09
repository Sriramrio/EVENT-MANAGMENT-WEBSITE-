import {
  Building2,
  QrCode,
  Users,
  IdCard,
  ArrowRight,
  ScanLine,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { appConfig } from '../../../config/appConfig';
import { getVisitorProfile } from '../../../data/api/visitorApiClient';
import { useSession } from '../../../app/session';
import { VisitorAdminDashboard } from './VisitorAdminDashboard';

interface VisitorDashboardProps {
  tenantId: string;
  eventId: string;
}

interface Connection {
  exhibitorId: string;
  companyName: string;
  companyLogo?: string | null;
  industryCategory?: string | null;
  contactPersonName?: string | null;
  mobile?: string | null;
  email?: string | null;
  stallNumber?: string | null;
  fasciaName?: string | null;
  registrationNumber?: string | null;
  connectedAt: string;
}

const API_BASE_URL = appConfig.apiBaseUrl;

export function VisitorDashboard({
  tenantId,
  eventId,
}: VisitorDashboardProps) {
  const { user } = useSession();
  const isAdmin = user !== null;

  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(!isAdmin);

  const getVisitorId = () => getVisitorProfile()?.visitorId ?? null;


  useEffect(() => {
    const loadConnections = async () => {
      const visitorId = getVisitorId();

      if (!visitorId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/public/visitors/${visitorId}/connections`
        );

        if (!response.ok) {
          throw new Error('Failed to load connections');
        }

        const data = await response.json();

        setConnections(Array.isArray(data) ? data : (data?.connectedExhibitors || []));
      } catch (error) {
        console.error('Visitor connections error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConnections();
  }, []);

  const totalConnections = connections.length;

  const todayConnections = connections.filter((connection) => {
    const date = new Date(connection.connectedAt);
    const today = new Date();

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }).length;

  if (isAdmin) {
    return <VisitorAdminDashboard tenantId={tenantId} eventId={eventId} />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">

      {/* Welcome */}
      <section className="rounded-2xl bg-[#0B3B75] p-6 text-white shadow-lg sm:p-8">
        <div className="max-w-2xl">
          <p className="mb-2 text-sm font-semibold text-blue-100">
            Welcome to MSME Sangamam
          </p>

          <h2 className="text-2xl font-extrabold sm:text-3xl">
            Discover exhibitors and build valuable connections
          </h2>

          <p className="mt-3 text-sm leading-6 text-blue-100 sm:text-base">
            Scan exhibitor QR codes, connect with companies and save
            their contact details for future communication.
          </p>

          <Link
            to="/visitor/scan"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0B3B75] shadow-sm transition hover:bg-blue-50"
          >
            <QrCode size={18} />
            Scan Exhibitor QR
          </Link>
        </div>
      </section>

      {/* COUNTS */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <StatCard
          title="My Connections"
          value={loading ? '—' : totalConnections}
          subtitle="Companies connected"
          icon={<Users size={22} />}
        />

        <StatCard
          title="Today's Connections"
          value={loading ? '—' : todayConnections}
          subtitle="Connected today"
          icon={<Building2 size={22} />}
        />

        <StatCard
          title="QR Scanner"
          value="Scan"
          subtitle="Discover exhibitors"
          icon={<ScanLine size={22} />}
        />

        <StatCard
          title="My Pass"
          value="View"
          subtitle="Event pass"
          icon={<IdCard size={22} />}
        />

      </section>

      {/* QUICK ACTIONS */}
      <section>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-900">
            Quick Actions
          </h3>

          <p className="text-sm text-slate-500">
            Access the most useful visitor features
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">

          <QuickAction
            href="/visitor/scan"
            icon={<QrCode size={24} />}
            title="QR Scanner"
            description="Scan an exhibitor QR code and view company details."
          />

          <QuickAction
            href="/visitorShell/Connections"
            icon={<Users size={24} />}
            title="My Connections"
            description="View all companies you have connected with."
            count={totalConnections}
          />

          <QuickAction
            href="/visitorShell/Pass"
            icon={<IdCard size={24} />}
            title="My Pass"
            description="Open your visitor event pass."
          />

        </div>
      </section>

      {/* RECENT CONNECTIONS */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h3 className="font-bold text-slate-900">
              Recent Connections
            </h3>

            <p className="text-xs text-slate-500">
              Your latest exhibitor connections
            </p>
          </div>

          <Link
            to="/visitorShell/Connections"
            className="inline-flex items-center gap-1 text-sm font-bold text-[#0B3B75] hover:underline"
          >
            View all
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {!loading && connections.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Users
                size={38}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 font-semibold text-slate-700">
                No connections yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Scan an exhibitor QR code to make your first connection.
              </p>
            </div>
          )}

          {connections.slice(0, 5).map((connection) => (
            <div
              key={`${connection.exhibitorId}-${connection.connectedAt}`}
              className="flex items-center gap-4 px-5 py-4 sm:px-6"
            >
              <CompanyAvatar connection={connection} />

              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-900">
                  {connection.companyName}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {connection.stallNumber
                    ? `Stall ${connection.stallNumber}`
                    : 'Exhibitor'}
                </p>
              </div>

              <span className="hidden text-xs text-slate-400 sm:block">
                {formatDate(connection.connectedAt)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {subtitle}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0B3B75]">
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
  count,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  count?: number;
}) {
  return (
    <Link
      to={href}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0B3B75]">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-slate-900">
              {title}
            </h4>

            {typeof count === 'number' && (
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-[#0B3B75]">
                {count}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}

function CompanyAvatar({
  connection,
}: {
  connection: Connection;
}) {
  if (connection.companyLogo) {
    return (
      <img
        src={connection.companyLogo}
        alt={connection.companyName}
        className="h-11 w-11 rounded-xl border border-slate-200 object-contain bg-white"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0B3B75]">
      <Building2 size={21} />
    </div>
  );
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default VisitorDashboard;