import { Link } from 'react-router-dom';

export function PaymentDetailPage() {
  return (
    <section className="card p-6"><p className="text-sm text-slate-600">Use the payment queue to record transaction reference, match amount and verify payment before freezing the stall.</p><Link to="/app/payments" className="btn-primary mt-4 inline-flex">Back to queue</Link></section>
  );
}
