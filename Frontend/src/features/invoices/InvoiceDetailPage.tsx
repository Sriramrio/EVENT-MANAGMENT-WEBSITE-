import { Link } from 'react-router-dom';

export function InvoiceDetailPage() {
  return (
    <section className="card p-6"><p className="text-sm text-slate-600">Use the invoice queue to generate, review and mark proforma invoices as sent after payment verification.</p><Link to="/app/invoices" className="btn-primary mt-4 inline-flex">Back to invoice queue</Link></section>
  );
}
