import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshListButton } from '../../shared/components/RefreshListButton';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  Mail,
  Search,
  ShieldAlert,
  Store,
  User,
  Zap,
} from 'lucide-react';
import type { AuditLog, EmailLog, Stall, StallBooking } from '../../domain/models';
import { repositories } from '../../data/repositoryFactory';

const AUDIT_KEY = ['admin', 'audit-logs'] as const;
const EMAIL_LOGS_KEY = ['admin', 'email-logs'] as const;
const STALLS_KEY = ['admin', 'stalls'] as const;
const BOOKINGS_KEY = ['admin', 'bookings'] as const;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatEntityName(name: string): string {
  if (!name) return 'Activity Record';
  const entityMap: Record<string, string> = {
    RequirementSellerEngagement: 'Buyer–Seller Engagement',
    StallBooking: 'Stall Booking Application',
    StallAllocation: 'Stall Allocation',
    StallReservation: 'Stall Reservation',
    Stall: 'Event Stall Space',
    PaymentTracking: 'Payment Verification',
    ProformaInvoice: 'Proforma Invoice',
    Capability: 'Seller Capability',
    Requirement: 'Buyer Requirement',
    Meeting: 'B2B Meeting',
    MeetingOutcome: 'Meeting Outcome',
    AdminUser: 'Admin User Profile',
    Event: 'Event Setup',
  };
  return entityMap[name] || name.replace(/([A-Z])/g, ' $1').trim();
}

function getActionBadge(action: string) {
  const upper = (action || '').toUpperCase();
  if (upper.includes('CREATE') || upper.includes('ADD') || upper.includes('SUBMIT')) {
    return { label: 'Created', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  if (upper.includes('UPDATE') || upper.includes('EDIT') || upper.includes('MODIFY')) {
    return { label: 'Updated', color: 'bg-blue-50 text-blue-700 border-blue-200' };
  }
  if (upper.includes('DELETE') || upper.includes('REMOVE') || upper.includes('CANCEL')) {
    return { label: 'Deleted', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  }
  if (upper.includes('BLOCK') || upper.includes('FREEZE')) {
    return { label: 'Blocked / Frozen', color: 'bg-amber-50 text-amber-800 border-amber-200' };
  }
  if (upper.includes('RELEASE') || upper.includes('UNBLOCK')) {
    return { label: 'Released', color: 'bg-sky-50 text-sky-700 border-sky-200' };
  }
  if (upper.includes('VERIFY') || upper.includes('APPROVE')) {
    return { label: 'Verified', color: 'bg-teal-50 text-teal-700 border-teal-200' };
  }
  return { label: action, color: 'bg-slate-50 text-slate-700 border-slate-200' };
}

function formatEmailStatus(status: unknown): { label: string; color: string } {
  if (status === 1 || status === '1' || status === 'Sent') {
    return { label: 'Sent', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  if (status === 0 || status === '0' || status === 'Pending') {
    return { label: 'Pending', color: 'bg-amber-50 text-amber-800 border-amber-200' };
  }
  if (status === 2 || status === '2' || status === 'Failed') {
    return { label: 'Failed', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  }
  if (status === 3 || status === '3' || status === 'Retrying') {
    return { label: 'Retrying', color: 'bg-blue-50 text-blue-700 border-blue-200' };
  }
  return { label: String(status || 'Sent'), color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
}

function formatEmailTemplateCode(code: string): string {
  const map: Record<string, string> = {
    BOOKING_EDIT_REQUEST: 'Booking Edit Request',
    INVOICE_SENT: 'Invoice Dispatch',
    PAYMENT_VERIFIED_RECEIPT_SENT: 'Payment Receipt & Approval',
    BOOKING_RECEIVED_PAYMENT_REQUEST: 'Stall Block & Payment Request',
    BOOKING_SUBMITTED: 'Booking Submitted',
    BOOKING_CONFIRMED: 'Booking Confirmed',
    STALL_RELEASED: 'Stall Released',
  };
  return map[code] || code.replace(/_/g, ' ').trim();
}

function formatFieldName(key: string): string {
  const fieldMap: Record<string, string> = {
    Stage: 'Engagement Stage',
    CapabilityId: 'Seller Capability',
    RequirementId: 'Buyer Requirement',
    StallId: 'Allocated Stall',
    StallNumber: 'Stall Number',
    BookingId: 'Booking Application',
    BookingRegistrationNumber: 'Booking Number',
    RegistrationNumber: 'Registration Number',
    BookingStatus: 'Booking Status',
    PaymentStatus: 'Payment Status',
    PaymentAmount: 'Payment Amount',
    Amount: 'Total Amount',
    CompanyName: 'Company / Business Name',
    LegalName: 'Legal Business Name',
    ContactPerson: 'Contact Person',
    ContactPersonName: 'Contact Person Name',
    Email: 'Email Address',
    Mobile: 'Mobile Number',
    Status: 'Current Status',
    CurrentStatus: 'Current Status',
    Reason: 'Action Reason / Notes',
    Notes: 'Notes',
    ActorUserId: 'Action Performed By',
    CreatedAt: 'Creation Timestamp',
    UpdatedAt: 'Last Modified Timestamp',
    BlockedAt: 'Blocked Timestamp',
    BlockExpiresAt: 'Expiry Timestamp',
    IsActive: 'Active Status',
    IsSponsor: 'Sponsor Stall Flag',
    Outcome: 'Meeting Outcome',
    Title: 'Title',
    Quantity: 'Quantity',
    UomCode: 'Unit of Measure',
  };
  return fieldMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
}

function formatFieldValue(
  key: string,
  value: any,
  lookupMaps: {
    stalls: Map<string, string>;
    bookings: Map<string, string>;
  }
): { display: string; isBadge?: boolean; badgeColor?: string } {
  if (value === null || value === undefined || value === '') {
    return { display: '—' };
  }

  if (typeof value === 'boolean') {
    return {
      display: value ? 'Yes' : 'No',
      isBadge: true,
      badgeColor: value ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200',
    };
  }

  const strVal = String(value).trim();

  // If value is a UUID, look up or display friendly readable name
  if (UUID_REGEX.test(strVal)) {
    if (lookupMaps.stalls.has(strVal)) {
      return { display: `Stall #${lookupMaps.stalls.get(strVal)}`, isBadge: true, badgeColor: 'bg-blue-50 text-blue-800 border-blue-200 font-bold' };
    }
    if (lookupMaps.bookings.has(strVal)) {
      return { display: lookupMaps.bookings.get(strVal)!, isBadge: true, badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200 font-bold' };
    }

    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('capability')) {
      return { display: 'Published Capability Record', isBadge: true, badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200' };
    }
    if (lowerKey.includes('requirement')) {
      return { display: 'Buyer Requirement Record', isBadge: true, badgeColor: 'bg-purple-50 text-purple-800 border-purple-200' };
    }
    if (lowerKey.includes('stall')) {
      return { display: 'Event Stall Space', isBadge: true, badgeColor: 'bg-blue-50 text-blue-800 border-blue-200' };
    }
    if (lowerKey.includes('booking')) {
      return { display: 'Booking Application', isBadge: true, badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
    }
    if (lowerKey.includes('actor') || lowerKey.includes('user')) {
      return { display: 'System User', isBadge: true, badgeColor: 'bg-slate-100 text-slate-700 border-slate-200' };
    }

    return { display: 'Reference Record', isBadge: true, badgeColor: 'bg-slate-100 text-slate-600 border-slate-200' };
  }

  // Format Statuses / Stages nicely:
  const stageMap: Record<string, { label: string; color: string }> = {
    SHORTLISTED: { label: 'Shortlisted', color: 'bg-amber-50 text-amber-800 border-amber-200' },
    ENGAGED: { label: 'Engaged', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    MEETING_SCHEDULED: { label: 'Meeting Scheduled', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    RFQ_SENT: { label: 'RFQ Sent', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    AWARDED: { label: 'Awarded / PO', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    CLOSED: { label: 'Closed', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    PaymentSubmitted: { label: 'Payment Submitted', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    PaymentVerified: { label: 'Payment Verified', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Confirmed: { label: 'Confirmed / Frozen', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Frozen: { label: 'Frozen', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    Blocked: { label: 'Blocked', color: 'bg-amber-50 text-amber-800 border-amber-200' },
    Available: { label: 'Available', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Released: { label: 'Released', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    Reservation: { label: 'Reserved', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    Submitted: { label: 'Submitted', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  };

  if (stageMap[strVal]) {
    return {
      display: stageMap[strVal].label,
      isBadge: true,
      badgeColor: stageMap[strVal].color,
    };
  }

  // Format currency amounts
  if (typeof value === 'number' && (key.toLowerCase().includes('amount') || key.toLowerCase().includes('price') || key.toLowerCase().includes('total'))) {
    return { display: `₹${value.toLocaleString('en-IN')}` };
  }

  // Format ISO timestamps
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return {
        display: d.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
    }
  }

  return { display: strVal };
}

function parseObjectValues(data: unknown): Record<string, any> | null {
  if (!data) return null;
  if (typeof data === 'object') return data as Record<string, any>;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    } catch {
      return null;
    }
  }
  return null;
}

export function AuditLogPage() {
  const queryClient = useQueryClient();
  const { data: audit = [] } = useQuery<AuditLog[]>({
    queryKey: AUDIT_KEY,
    queryFn: () => repositories.audit.list(),
  });

  const { data: emails = [] } = useQuery<EmailLog[]>({
    queryKey: EMAIL_LOGS_KEY,
    queryFn: () => repositories.emails.list(),
  });

  const { data: stalls = [] } = useQuery<Stall[]>({
    queryKey: STALLS_KEY,
    queryFn: async () => (await repositories.stalls.list()) ?? [],
    staleTime: 5 * 60_000,
  });

  const { data: bookings = [] } = useQuery<StallBooking[]>({
    queryKey: BOOKINGS_KEY,
    queryFn: async () => (await repositories.bookings.list()) ?? [],
    staleTime: 5 * 60_000,
  });

  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'STALLS' | 'BOOKINGS' | 'MARKETPLACE' | 'INVOICES'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Lookup maps for resolving UUIDs to friendly names
  const lookupMaps = useMemo(() => {
    const stallMap = new Map<string, string>();
    stalls.forEach((s) => {
      if (s.id && s.stallNumber) stallMap.set(s.id, s.stallNumber);
    });

    const bookingMap = new Map<string, string>();
    bookings.forEach((b) => {
      if (b.id) {
        const text = b.bookingRegistrationNumber ? `Booking #${b.bookingRegistrationNumber} (${b.companyName || 'Exhibitor'})` : (b.companyName || 'Booking Application');
        bookingMap.set(b.id, text);
      }
    });

    return { stalls: stallMap, bookings: bookingMap };
  }, [stalls, bookings]);

  // Resolve clean display name for the entity
  const resolveEntityDisplay = (row: AuditLog) => {
    if (row.entityDisplayName && !UUID_REGEX.test(row.entityDisplayName)) {
      return row.entityDisplayName;
    }

    if (row.entityId) {
      if (lookupMaps.stalls.has(row.entityId)) {
        return `Stall #${lookupMaps.stalls.get(row.entityId)}`;
      }
      if (lookupMaps.bookings.has(row.entityId)) {
        return lookupMaps.bookings.get(row.entityId)!;
      }
    }

    return formatEntityName(row.entityName);
  };

  // Filtered audit logs
  const filteredAudit = useMemo(() => {
    return audit.filter((row) => {
      // Category filter
      if (activeFilter === 'STALLS' && !row.entityName?.toLowerCase().includes('stall')) return false;
      if (activeFilter === 'BOOKINGS' && !row.entityName?.toLowerCase().includes('booking')) return false;
      if (
        activeFilter === 'MARKETPLACE' &&
        !['RequirementSellerEngagement', 'Requirement', 'Capability', 'Meeting', 'MeetingOutcome'].includes(row.entityName)
      ) {
        return false;
      }
      if (activeFilter === 'INVOICES' && !['PaymentTracking', 'ProformaInvoice', 'Payment'].includes(row.entityName)) return false;

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const entityLabel = formatEntityName(row.entityName).toLowerCase();
        const actionLabel = row.action?.toLowerCase() || '';
        const actor = (row.actorName || row.actorUserId || '').toLowerCase();
        const display = resolveEntityDisplay(row).toLowerCase();
        return entityLabel.includes(q) || actionLabel.includes(q) || actor.includes(q) || display.includes(q);
      }

      return true;
    });
  }, [audit, activeFilter, searchQuery, lookupMaps]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Audit & System Logs</h2>
          <p className="text-sm text-slate-500">
            Complete action traceability, change records, and simulated email delivery logs.
          </p>
        </div>
        <RefreshListButton
          onRefresh={() => {
            queryClient.invalidateQueries({ queryKey: AUDIT_KEY });
            queryClient.invalidateQueries({ queryKey: EMAIL_LOGS_KEY });
          }}
        />
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4 flex items-center gap-3.5 border-l-4 border-l-blue-600">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Audit Logs</p>
            <p className="text-2xl font-black text-slate-900">{audit.length}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3.5 border-l-4 border-l-emerald-600">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Stall & Allocation Logs</p>
            <p className="text-2xl font-black text-slate-900">
              {audit.filter((a) => a.entityName?.toLowerCase().includes('stall')).length}
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3.5 border-l-4 border-l-purple-600">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Marketplace Activities</p>
            <p className="text-2xl font-black text-slate-900">
              {audit.filter((a) => ['RequirementSellerEngagement', 'Requirement', 'Capability', 'Meeting'].includes(a.entityName)).length}
            </p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3.5 border-l-4 border-l-amber-500">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Emails Sent</p>
            <p className="text-2xl font-black text-slate-900">{emails.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Left Column: Audit Timeline */}
        <section className="card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                Audit Trail Timeline
              </h3>
              <p className="text-xs text-slate-500">Real-time system events with human-readable parameters</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1">
              {(['ALL', 'STALLS', 'BOOKINGS', 'MARKETPLACE', 'INVOICES'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                    activeFilter === filter
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter === 'ALL' ? 'All' : filter === 'MARKETPLACE' ? 'Marketplace' : filter === 'INVOICES' ? 'Invoices/Pay' : filter}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by action, actor, entity, or details..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Timeline List */}
          <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredAudit.map((row) => {
              const isExpanded = expandedAuditId === row.id;
              const actionBadge = getActionBadge(row.action);
              const entityFriendlyName = formatEntityName(row.entityName);
              const entityDisplay = resolveEntityDisplay(row);
              const actorDisplay = row.actorName || (row.actorUserId ? 'Admin User' : 'System Automation');

              const oldObj = parseObjectValues(row.oldValues || row.oldValuesJson);
              const newObj = parseObjectValues(row.newValues || row.newValuesJson);

              return (
                <div
                  key={row.id}
                  className={`rounded-2xl border transition-all duration-200 p-3.5 ${
                    isExpanded ? 'border-blue-200 bg-blue-50/20 shadow-xs' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${actionBadge.color}`}
                        >
                          {actionBadge.label}
                        </span>

                        <span className="text-xs font-black text-slate-900 truncate">
                          {entityFriendlyName}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <User className="h-3 w-3 text-slate-400" />
                          {actorDisplay}
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {new Date(row.occurredAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                        isExpanded
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      onClick={() => setExpandedAuditId(isExpanded ? null : row.id)}
                    >
                      {isExpanded ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>

                  {/* Expanded Details Card */}
                  {isExpanded && (
                    <div className="mt-3.5 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs space-y-3 animate-fadeIn">
                      {/* Summary Entity Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200/70">
                        <div className="rounded-lg bg-white p-2.5 border border-slate-200/60">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Entity</p>
                          <p className="mt-0.5 font-extrabold text-slate-800">{entityDisplay}</p>
                        </div>

                        <div className="rounded-lg bg-white p-2.5 border border-slate-200/60">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Actor / Author</p>
                          <p className="mt-0.5 font-extrabold text-slate-800">{actorDisplay}</p>
                        </div>
                      </div>

                      {/* New Values Formatted Table */}
                      {newObj && Object.keys(newObj).length > 0 && (
                        <div>
                          <p className="font-extrabold text-slate-800 mb-1.5 flex items-center gap-1.5 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Updated / Recorded Details
                          </p>
                          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100">
                            {Object.entries(newObj).map(([key, val]) => {
                              const friendlyKey = formatFieldName(key);
                              const formattedVal = formatFieldValue(key, val, lookupMaps);
                              return (
                                <div
                                  key={key}
                                  className="grid grid-cols-1 sm:grid-cols-[11rem_minmax(0,1fr)] items-center gap-2 p-2.5 text-xs"
                                >
                                  <span className="font-bold text-slate-600">{friendlyKey}</span>
                                  <div>
                                    {formattedVal.isBadge ? (
                                      <span
                                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold ${
                                          formattedVal.badgeColor || 'bg-slate-100 text-slate-700'
                                        }`}
                                      >
                                        {formattedVal.display}
                                      </span>
                                    ) : (
                                      <span className="font-semibold text-slate-900 break-words">
                                        {formattedVal.display}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Old Values Formatted Table (for changes) */}
                      {oldObj && Object.keys(oldObj).length > 0 && (
                        <div>
                          <p className="font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5 text-xs">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            Previous Values
                          </p>
                          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100 opacity-80">
                            {Object.entries(oldObj).map(([key, val]) => {
                              const friendlyKey = formatFieldName(key);
                              const formattedVal = formatFieldValue(key, val, lookupMaps);
                              return (
                                <div
                                  key={key}
                                  className="grid grid-cols-1 sm:grid-cols-[11rem_minmax(0,1fr)] items-center gap-2 p-2.5 text-xs"
                                >
                                  <span className="font-medium text-slate-500">{friendlyKey}</span>
                                  <div>
                                    {formattedVal.isBadge ? (
                                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                        {formattedVal.display}
                                      </span>
                                    ) : (
                                      <span className="text-slate-600">{formattedVal.display}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredAudit.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <ShieldAlert className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm font-bold text-slate-700">No matching audit logs found</p>
                <p className="text-xs text-slate-400">Try adjusting your search query or category filter</p>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Email Delivery Logs */}
        <section className="card p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-amber-600" />
                Email Delivery Logs
              </h3>
              <p className="text-xs text-slate-500">Automated notification dispatch records & HTML snapshots</p>
            </div>
            <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-xs font-bold">
              {emails.length} Emails
            </span>
          </div>

          <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {emails.map((row) => {
              const isExpanded = expandedEmailId === row.id;
              return (
                <div
                  key={row.id}
                  className={`rounded-2xl border transition-all duration-200 p-3.5 ${
                    isExpanded ? 'border-amber-200 bg-amber-50/20 shadow-xs' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <p className="font-extrabold text-sm text-slate-900 truncate">{row.subject}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                          {formatEmailTemplateCode(row.templateCode)}
                        </span>
                        {(() => {
                          const statusInfo = formatEmailStatus(row.status);
                          return (
                            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-extrabold ${statusInfo.color}`}>
                              <CheckCircle2 className="h-3 w-3" />
                              {statusInfo.label}
                            </span>
                          );
                        })()}
                        {row.toEmail && (
                          <span className="text-slate-600">To: {row.toEmail}</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                        isExpanded
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      onClick={() => setExpandedEmailId(isExpanded ? null : row.id)}
                    >
                      {isExpanded ? 'Hide Preview' : 'View Preview'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3.5 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 text-xs shadow-inner max-h-96 overflow-y-auto">
                      <div
                        className="prose prose-sm max-w-none text-slate-800"
                        dangerouslySetInnerHTML={{ __html: row.bodySnapshot }}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {emails.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <Mail className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm font-bold text-slate-700">No email logs yet</p>
                <p className="text-xs text-slate-400">Sent emails will appear here automatically</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}