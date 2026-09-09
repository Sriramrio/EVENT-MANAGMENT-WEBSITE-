export const statusLabels: Record<string, string> = {
  Draft: 'Draft',
  Submitted: 'Submitted',
  UnderReview: 'Under Review',
  BlockedAwaitingPayment: 'Blocked / Payment Pending',
  PaymentSubmitted: 'Payment Submitted',
  PaymentVerified: 'Payment Verified',
  PaymentRejected: 'Payment Rejected',
  Confirmed: 'Confirmed / Frozen',
  ReleasedDueToNonPayment: 'Released due to Non-Payment',
  Cancelled: 'Cancelled',
  Closed: 'Closed',
  Available: 'Available',
  Blocked: 'Blocked',
  Frozen: 'Frozen / Finalized',
  Disabled: 'Disabled',
  Generated: 'Generated',
  Sent: 'Sent',
  Rejected: 'Rejected',
  ClarificationRequired: 'Clarification Required'
};

export const statusClass = (value: unknown) => {
  const status = String(value ?? '');

  return status.includes('Reservation') ? 'bg-violet-50 text-violet-700 ring-violet-200' :
    status.includes('Available') ? 'bg-green-50 text-green-700 ring-green-200' :
    status.includes('Blocked') || status.includes('Pending') || status.includes('Submitted') ? 'bg-orange-50 text-orange-700 ring-orange-200' :
    status.includes('Frozen') || status.includes('Confirmed') || status.includes('Verified') || status.includes('Generated') || status.includes('Sent') ? 'bg-blue-50 text-blue-700 ring-blue-200' :
    status.includes('Disabled') ? 'bg-slate-200 text-slate-600 ring-slate-300' :
    status.includes('Released') || status.includes('Rejected') || status.includes('Cancelled') ? 'bg-red-50 text-red-700 ring-red-200' :
    'bg-slate-100 text-slate-700 ring-slate-200';
};

/**
 * Dedicated, non-overlapping colour palette for STALL statuses only
 * (Available | Reservation | Blocked | Frozen | Released | Cancelled | Disabled).
 * Used to colour-code stall grids/maps across the admin dashboard so every
 * status is instantly recognisable by colour, not just by text.
 */
export type StallStatusStyle = {
  label: string;
  dot: string; // small colour swatch used in legends
  box: string; // background + border classes for grid/map cells
  text: string; // text colour used on the cell
};

export const stallStatusStyles: Record<string, StallStatusStyle> = {
  Available: {
    label: 'Available',
    dot: 'bg-green-500',
    box: 'bg-green-50 border-green-300 hover:bg-green-100',
    text: 'text-green-700'
  },
  Reservation: {
    label: 'Reserved',
    dot: 'bg-violet-500',
    box: 'bg-violet-50 border-violet-300 hover:bg-violet-100',
    text: 'text-violet-700'
  },
  Blocked: {
    label: 'Blocked',
    dot: 'bg-orange-500',
    box: 'bg-orange-50 border-orange-300 hover:bg-orange-100',
    text: 'text-orange-700'
  },
  Frozen: {
    label: 'Frozen',
    dot: 'bg-blue-500',
    box: 'bg-blue-50 border-blue-300 hover:bg-blue-100',
    text: 'text-blue-700'
  },
  Released: {
    label: 'Released',
    dot: 'bg-teal-500',
    box: 'bg-teal-50 border-teal-300 hover:bg-teal-100',
    text: 'text-teal-700'
  },
  Cancelled: {
    label: 'Cancelled',
    dot: 'bg-red-500',
    box: 'bg-red-50 border-red-300 hover:bg-red-100',
    text: 'text-red-700'
  },
  Disabled: {
    label: 'Disabled',
    dot: 'bg-slate-400',
    box: 'bg-slate-100 border-slate-300 hover:bg-slate-200',
    text: 'text-slate-500'
  }
};

export const stallStatusOrder = [
  'Available',
  'Reservation',
  'Blocked',
  'Frozen',
  'Released',
  'Cancelled',
  'Disabled'
];

export const getStallStatusStyle = (value: unknown): StallStatusStyle => {
  const status = String(value ?? '');

  return (
    stallStatusStyles[status] ?? {
      label: status || 'Unknown',
      dot: 'bg-slate-400',
      box: 'bg-slate-100 border-slate-300 hover:bg-slate-200',
      text: 'text-slate-500'
    }
  );
};