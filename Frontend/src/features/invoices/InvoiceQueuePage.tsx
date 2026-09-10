import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProformaInvoice, StallBooking } from '../../domain/models';
import { repositories } from '../../data/repositoryFactory';
import { apiClient } from '../../data/api/apiClient';
import { useSession } from '../../app/session';
import { PERMISSIONS } from '../../config/permissions';
import { StatusBadge } from '../../shared/StatusBadge';
const BOOKINGS_KEY = ['admin', 'bookings'] as const;
const INVOICES_KEY = ['admin', 'invoices'] as const;

const SPECIAL_TEN_PERCENT_TDS_BOOKING_IDS = new Set([
  '4ecd38a9-f92f-4adb-91e8-88811e2acddf',
  'e56f2543-0404-4c26-a858-3c694ea142b0',
  'fe3552d8-9ae6-4e34-98b0-b59bd07f5fc4',
  'e3552d8-9ae6-4e34-98b0-b59bd07f5fc4',
  'b9d1751b-b17d-401c-be0b-a8aacc1beacd',
  '3cc38899-cb26-4282-9cf9-9aa5fd04b46f',
  '40f09360-8694-4e6a-97ec-ee7c29a0b31f'
]);

const SPECIAL_TEN_PERCENT_TDS_REG_NUMBERS = new Set([
  'MSME-HOSUR-20260716-7695',
  'MSME-HOSUR-20260820-107',
  'MSME-HOSUR-20260731-043',
  'MSME-HOSUR-20260829-129',
  'MSME-HOSUR-20260829-130',
  'MSME-HOSUR-20260907-172'
]);

function isSpecialTenPercentTdsBooking(booking?: { id?: string; bookingRegistrationNumber?: string } | null): boolean {
  if (!booking) return false;
  if (booking.id && (SPECIAL_TEN_PERCENT_TDS_BOOKING_IDS.has(booking.id) || booking.id.includes('e3552d8'))) return true;
  if (booking.bookingRegistrationNumber && SPECIAL_TEN_PERCENT_TDS_REG_NUMBERS.has(booking.bookingRegistrationNumber)) return true;
  return false;
}

type InvoiceStage = 'none' | 'generated' | 'sent';

export function InvoiceQueuePage() {
  const queryClient = useQueryClient();
  const { data: initialBookings = [] } = useQuery({
    queryKey: BOOKINGS_KEY,
    queryFn: () => repositories.bookings.list('All'),
    staleTime: 0,
    gcTime: 10 * 60_000,
  });
  const { data: initialInvoices = [] } = useQuery({
    queryKey: INVOICES_KEY,
    queryFn: () => repositories.invoices.list(),
    staleTime: 0,
    gcTime: 10 * 60_000,
  });
  const [confirmed, setConfirmed] = useState<StallBooking[]>([]);
  const [invoices, setInvoices] = useState<ProformaInvoice[]>([]);
  useEffect(() => {
    if (initialBookings.length > 0) {
      setConfirmed(initialBookings.filter(b => b.bookingStatus === 'Confirmed' || isSpecialTenPercentTdsBooking(b)));
    }
  }, [initialBookings]);
  useEffect(() => {
    if (initialInvoices.length > 0) {
      setInvoices(initialInvoices);
    }
  }, [initialInvoices]);
  const [message, setMessage] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const user = useSession(s => s.user);
  const canGenerate = useSession(s => s.hasPermission(PERMISSIONS.invoiceGenerate));
  const canSend = useSession(s => s.hasPermission(PERMISSIONS.invoiceSend));
  const [justGeneratedId, setJustGeneratedId] = useState<string | null>(null);
  useEffect(() => {
    if (!justGeneratedId) return;

    const timer = setTimeout(() => {
      setJustGeneratedId(null);
    }, 60000);

    return () => clearTimeout(timer);
  }, [justGeneratedId]);
  async function refresh() {
    try {
      const [bookings, inv] = await Promise.all([
        repositories.bookings.list('All'),
        repositories.invoices.list(),
      ]);

      setConfirmed(bookings.filter(b => b.bookingStatus === 'Confirmed' || isSpecialTenPercentTdsBooking(b)));
      setInvoices(inv);

      queryClient.setQueryData(BOOKINGS_KEY, bookings);
      queryClient.setQueryData(INVOICES_KEY, inv);
    } catch (err) {
      console.warn('Could not refresh invoices:', err);
    }
  }

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [message]);

  function getInvoiceStage(invoice?: ProformaInvoice): InvoiceStage {
    if (!invoice) return 'none';

    const status = String(invoice.invoiceStatus || '').toLowerCase();

    if (status === 'sent' || Boolean(invoice.taxInvoiceNumber)) return 'sent';
    if (status === 'generated') return 'generated';

    return 'none';
  }

  async function generateTaxInvoice(invoiceId: string) {
    if (!user) return;

    try {
      setMessage(null);
      setGeneratingId(invoiceId);

      const result = await repositories.invoices.markSent(invoiceId, user.id);
      const generatedTaxNo = (result as any)?.taxInvoiceNumber || 'INV-GENERATED';

      // Immediately update local state so it reflects with 0 delay
      setInvoices(prev =>
        prev.map(inv =>
          inv.id === invoiceId
            ? {
              ...inv,
              taxInvoiceNumber: generatedTaxNo,
              invoiceStatus: 'Sent' as any,
              sentAt: new Date().toISOString(),
            }
            : inv
        )
      );

      // Immediately update React Query cache
      queryClient.setQueryData<ProformaInvoice[]>(INVOICES_KEY, old =>
        (old || []).map(inv =>
          inv.id === invoiceId
            ? {
              ...inv,
              taxInvoiceNumber: generatedTaxNo,
              invoiceStatus: 'Sent' as any,
              sentAt: new Date().toISOString(),
            }
            : inv
        )
      );

      setMessage('✓ Tax invoice generated successfully.');
      setJustGeneratedId(invoiceId);
      await refresh();
    } catch {
      setMessage('❌ Failed to generate tax invoice.');
    } finally {
      setGeneratingId(null);
    }
  }

  async function sendInvoice(invoiceId: string) {
    if (!user) return;

    try {
      setMessage(null);
      setSendingId(invoiceId);

      const result = await repositories.invoices.markSent(invoiceId, user.id);
      const generatedTaxNo = (result as any)?.taxInvoiceNumber;

      setInvoices(prev =>
        prev.map(inv =>
          inv.id === invoiceId
            ? {
              ...inv,
              taxInvoiceNumber: generatedTaxNo || inv.taxInvoiceNumber,
              invoiceStatus: 'Sent' as any,
              sentAt: new Date().toISOString(),
            }
            : inv
        )
      );

      queryClient.setQueryData<ProformaInvoice[]>(INVOICES_KEY, old =>
        (old || []).map(inv =>
          inv.id === invoiceId
            ? {
              ...inv,
              taxInvoiceNumber: generatedTaxNo || inv.taxInvoiceNumber,
              invoiceStatus: 'Sent' as any,
              sentAt: new Date().toISOString(),
            }
            : inv
        )
      );

      setMessage('✓ Invoice sent successfully.');
      await refresh();
    } catch {
      setMessage('❌ Failed to send invoice.');
    } finally {
      setSendingId(null);
    }
  }

  async function handleDownloadTaxInvoice(booking: StallBooking, invoice?: ProformaInvoice) {
    try {
      const { blob, fileName } = await apiClient.getBlob(
        `/admin/events/current/bookings/${booking.id}/tax-invoice/download`
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName ?? `TaxInvoice_${invoice?.taxInvoiceNumber || booking.bookingRegistrationNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.message || 'Failed to download tax invoice.');
    }
  }

  const filteredConfirmed = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return confirmed;

    return confirmed.filter(booking =>
      booking.companyName?.toLowerCase().includes(keyword) ||
      booking.bookingRegistrationNumber?.toLowerCase().includes(keyword)
    );
  }, [confirmed, search]);

  const queueRows = useMemo(() => {
    return filteredConfirmed
      .map(booking => ({
        booking,
        invoice: invoices.find(i => i.bookingId === booking.id),
      }))
      .sort((a, b) => {
        const aDate = a.invoice?.invoiceDate ? new Date(a.invoice.invoiceDate).getTime() : 0;
        const bDate = b.invoice?.invoiceDate ? new Date(b.invoice.invoiceDate).getTime() : 0;
        return bDate - aDate;
      });
  }, [filteredConfirmed, invoices]);

  return (
    <div>
      <h2 className="text-2xl font-extrabold">Invoice Queue</h2>
      <p className="text-sm text-slate-500">
        Generate tax invoice after payment verification and frozen stall.
      </p>

      <div className="mt-6">
        <section className="card p-5">
          <h3 className="font-bold">Ready for Invoice</h3>

          <div className="mt-4">
            <input
              type="text"
              placeholder="Search by Company Name or Registration No..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {message && (
            <div
              className={`mt-4 rounded-xl p-3 text-sm font-semibold ${message.includes('Failed')
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
                }`}
            >
              {message}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {queueRows.map(({ booking, invoice }) => {
              const stage = getInvoiceStage(invoice);
              const generating = invoice ? generatingId === invoice.id : false;
              const sending = invoice ? sendingId === invoice.id : false;
              const baseAmount = Number(invoice?.totalAmount ?? 0) - Number(invoice?.gstAmount ?? 0);
              const isTenPercentTds = isSpecialTenPercentTdsBooking(booking);
              const hasTds = Boolean(invoice?.isTdsDeductable || (invoice?.tdsPercentage != null && invoice.tdsPercentage > 0) || isTenPercentTds);
              const tdsPercent = (invoice?.tdsPercentage != null && invoice.tdsPercentage > 0)
                ? invoice.tdsPercentage
                : (isTenPercentTds ? 10 : 2);
              const tdsRate = tdsPercent / 100;
              const tdsAmount = Math.round(baseAmount * tdsRate);

              return (
                <div
                  key={booking.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{booking.bookingRegistrationNumber}</p>
                      <p className="font-semibold p-1">{booking.companyName}</p>
                      <StatusBadge value={booking.bookingStatus} />
                    </div>
                  </div>

                  {invoice && stage !== 'none' && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-slate-500">Buyer</p>
                          <p className="font-semibold">
                            {invoice.buyerLegalName || booking.companyName}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Invoice No</p>
                          <p className="font-semibold">
                            {invoice.taxInvoiceNumber || invoice.invoiceNumber || '-'}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Stall Number</p>
                          <p className="font-semibold">{invoice.stallNumber ?? '-'}</p>
                        </div>

                        <div>
                          <p className="text-slate-500">Stall Size</p>
                          <p className="font-semibold">{invoice.stallSizeDisplay ?? '-'}</p>
                        </div>

                        <div>
                          <p className="text-slate-500">GST Amount</p>
                          <p className="font-semibold text-orange-600">
                            ₹{Number(invoice.gstAmount ?? 0).toLocaleString('en-IN')}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-500">Total Amount</p>
                          <p className="text-lg font-bold text-green-600">
                            ₹{Number(invoice.totalAmount ?? 0).toLocaleString('en-IN')}
                          </p>
                        </div>

                        {hasTds && (
                          <>
                            <div>
                              <p className="text-slate-500">TDS Deducted ({tdsPercent}%)</p>
                              <p className="font-semibold text-red-600">
                                - ₹{tdsAmount.toLocaleString('en-IN')}
                              </p>
                            </div>

                            <div>
                              <p className="text-slate-500">Net Receivable</p>
                              <p className="font-semibold text-slate-700">
                                ₹{(Number(invoice.totalAmount ?? 0) - tdsAmount).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {invoice && justGeneratedId === invoice.id && (
                    <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs font-medium text-blue-700">
                      ✓ Invoice generated & emailed. Want to resend it? Use{' '}
                      <span className="font-semibold">Send Again</span> below.
                    </div>
                  )}
                  <div className="mt-4">
                    {stage === 'none' && (
                      <button
                        className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!canGenerate || !invoice || generating}
                        onClick={() => invoice && generateTaxInvoice(invoice.id)}
                      >
                        {generating ? 'Generating...' : 'Generate Invoice'}
                      </button>
                    )}

                    {stage === 'generated' && (
                      <button
                        className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!canSend || !invoice || sending}
                        onClick={() => invoice && sendInvoice(invoice.id)}
                      >
                        {sending ? 'Sending...' : 'Send Invoice'}
                      </button>
                    )}

                    {stage === 'sent' && (
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 shadow-xs">
                          ✓ Sent
                        </span>
                        <button
                          className="btn-secondary text-xs px-4 py-2 font-semibold shadow-xs disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={!canSend || !invoice || sending}
                          onClick={() => invoice && sendInvoice(invoice.id)}
                          title="Resend Tax Invoice email to exhibitor"
                        >
                          {sending ? 'Sending...' : 'Send Again'}
                        </button>
                        <button
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
                          onClick={() => handleDownloadTaxInvoice(booking, invoice)}
                          title="Download Tax Invoice PDF"
                        >
                          📥 Download PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {queueRows.length === 0 && (
              <p className="text-sm text-slate-500">
                No matching bookings found.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}