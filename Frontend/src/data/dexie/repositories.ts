import { db } from './db';
import { ids } from './ids';
import type { BookingStatus, Payment, ProformaInvoice, Stall, StallAllocation, StallBooking, User } from '../../domain/models';
import type { AuthRepository, BookingRepository, DashboardRepository, InvoiceRepository, PaymentRepository, StallRepository, AuditRepository, EmailRepository } from '../repositories';

const now = () => new Date().toISOString();
const newId = () => crypto.randomUUID();

async function audit(actorUserId: string, entityName: string, entityId: string, action: string, oldValues?: unknown, newValues?: unknown) {
  await db.auditLogs.add({
    id: newId(),
    tenantId: ids.tenantId,
    eventId: ids.eventId,
    actorUserId,
    entityName,
    entityId,
    action,
    oldValues,
    newValues,
    occurredAt: now()
  });
}

export class DexieAuthRepository implements AuthRepository {
  async login(input: { email: string; password: string }): Promise<User> {
    const user = await db.users.where('email').equals(input.email.toLowerCase()).first();
    if (!user) throw new Error('Invalid login. Please use an authorised organiser account.');
    await audit(user.id, 'User', user.id, 'LOGIN');
    return user;
  }
}

export class DexieStallRepository implements StallRepository {
  async list(): Promise<Stall[]> {
    return db.stalls.orderBy('stallNumber').toArray();
  }

  async listAvailableForBooking(bookingId: string): Promise<Stall[]> {
    const booking = await db.bookings.get(bookingId);

    if (!booking) {
      return [];
    }

    return db.stalls
      .where('stallSizeId')
      .equals(booking.requestedStallSizeId)
      .filter(stall => stall.currentStatus === 'Available')
      .sortBy('stallNumber');
  }
}

export class DexieBookingRepository implements BookingRepository {
  async list(status: BookingStatus | 'All' = 'All'): Promise<StallBooking[]> {
    const all = await db.bookings.orderBy('bookingDate').reverse().toArray();
    return status === 'All' ? all : all.filter(b => b.bookingStatus === status);
  }

  async get(id: string): Promise<StallBooking | undefined> {
    return db.bookings.get(id);
  }

  async blockStall(
    bookingId: string,
    stallId: string,
    actorUserId: string,
    targetSponsorTotal?: number,
    isGstApplicable?: boolean,
    isTdsDeductable?: boolean,
    tdsPercentage?: number
  ): Promise<void> {
    await db.transaction('rw', db.bookings, db.stalls, db.stallAllocations, db.emailLogs, db.auditLogs, async () => {
      const booking = await db.bookings.get(bookingId);
      const stall = await db.stalls.get(stallId);
      if (!booking) throw new Error('BOOKING_NOT_FOUND');
      if (!stall) throw new Error('STALL_NOT_FOUND');
      if (!['Submitted', 'UnderReview'].includes(booking.bookingStatus)) throw new Error('BOOKING_NOT_ELIGIBLE_FOR_BLOCKING');
      if (stall.currentStatus !== 'Available') throw new Error('STALL_ALREADY_BLOCKED');

      const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const oldBooking = { ...booking };
      const oldStall = { ...stall };

      const updatedBooking: StallBooking = {
        ...booking,
        allocatedStallId: stall.id,
        bookingStatus: 'BlockedAwaitingPayment',
        blockExpiresAt: expiresAt,
        lastEmailSentAt: now()
      };
      const updatedStall: Stall = { ...stall, currentStatus: 'Blocked', currentBookingId: booking.id };
      const allocation: StallAllocation = {
        id: newId(),
        tenantId: booking.tenantId,
        eventId: booking.eventId,
        bookingId: booking.id,
        stallId: stall.id,
        allocationStatus: 'Blocked',
        blockedAt: now(),
        blockedBy: actorUserId,
        blockExpiresAt: expiresAt
      };

      await db.bookings.put(updatedBooking);
      await db.stalls.put(updatedStall);
      await db.stallAllocations.add(allocation);
      await db.emailLogs.add({
        id: newId(),
        tenantId: booking.tenantId,
        eventId: booking.eventId,
        bookingId: booking.id,
        toEmail: 'info@exhibitor.local',
        subject: `MSME Sangamam Stall Booking Interest Received - Registration No. ${booking.bookingRegistrationNumber}`,
        bodySnapshot: `We received your interest. Stall ${stall.stallNumber} has been blocked temporarily. Please complete payment and share details within 3 days. If payment is not received, the stall will be released.`,
        templateCode: 'BOOKING_RECEIVED_PAYMENT_REQUEST',
        status: 'Sent',
        sentAt: now()
      });
      await audit(actorUserId, 'StallBooking', booking.id, 'STALL_BLOCKED', oldBooking, updatedBooking);
      await audit(actorUserId, 'Stall', stall.id, 'STATUS_BLOCKED', oldStall, updatedStall);
    });
  }

  async releaseStall(bookingId: string, actorUserId: string, reason: string): Promise<void> {
    await db.transaction('rw', db.bookings, db.stalls, db.stallAllocations, db.auditLogs, async () => {
      const booking = await db.bookings.get(bookingId);
      if (!booking?.allocatedStallId) throw new Error('NO_ACTIVE_STALL');
      const stall = await db.stalls.get(booking.allocatedStallId);
      const allocation = await db.stallAllocations.where('bookingId').equals(bookingId).last();
      if (!stall || !allocation) throw new Error('NO_ACTIVE_ALLOCATION');

      const releasedBooking = { ...booking, bookingStatus: 'ReleasedDueToNonPayment' as const, allocatedStallId: null, blockExpiresAt: null, cancellationReason: reason };
      const releasedStall = { ...stall, currentStatus: 'Available' as const, currentBookingId: null };
      await db.bookings.put(releasedBooking);
      await db.stalls.put(releasedStall);
      await db.stallAllocations.put({ ...allocation, allocationStatus: 'Released', releasedAt: now(), releasedBy: actorUserId, releaseReason: reason });
      await audit(actorUserId, 'StallBooking', booking.id, 'STALL_RELEASED', booking, releasedBooking);
    });
  }
}

export class DexiePaymentRepository implements PaymentRepository {
  async list(): Promise<Payment[]> {
    return db.payments.toArray();
  }

  async submitAndVerify(
    bookingId: string,
    payload: {
      actorUserId: string;
      paymentReferenceNumber: string;
      paymentDate: string;
      payerName: string;
      payerBank: string;
      amountPaid: number;
      remarks: string;
      overrideExpiredBlock: boolean;
      isTdsDeductable?: boolean;
      tdsPercentage?: number;
      TargetSponsorTotal?: number | null;
      isGstApplicable?: boolean;
      gstType?: string;
      gstAmount?: string;
    }
  ): Promise<void> {
    await db.transaction('rw', db.bookings, db.stalls, db.stallAllocations, db.payments, db.auditLogs, async () => {
      const booking = await db.bookings.get(bookingId);

      if (!booking || !booking.allocatedStallId) {
        throw new Error('BOOKING_NOT_FOUND_OR_NO_STALL');
      }

      if (!['BlockedAwaitingPayment', 'PaymentSubmitted', 'Confirmed'].includes(booking.bookingStatus)) {
        throw new Error('PAYMENT_NOT_ALLOWED');
      }

      const stall = await db.stalls.get(booking.allocatedStallId);
      const allocation = await db.stallAllocations.where('bookingId').equals(bookingId).last();

      if (!stall || !allocation) {
        throw new Error('ALLOCATION_NOT_FOUND');
      }

      const payment: Payment = {
        id: newId(),
        tenantId: booking.tenantId,
        eventId: booking.eventId,
        bookingId: booking.id,
        paymentReferenceNumber: payload.paymentReferenceNumber,
        paymentMode: 'NEFT',
        payerName: payload.payerName || 'Exhibitor',
        payerBank: payload.payerBank || null,
        amountPaid: payload.amountPaid,
        paymentDate: payload.paymentDate,
        paymentReceivedDate: now(),
        bankAccountMatched: true,
        verificationStatus: 'Verified',
        verifiedBy: payload.actorUserId,
        verifiedAt: now(),
        remarks: payload.remarks || null,
      };

      await db.payments.add(payment);

      await db.bookings.put({
        ...booking,
        bookingStatus: 'Confirmed',
        confirmedAt: now(),
      });

      await db.stalls.put({
        ...stall,
        currentStatus: 'Frozen',
      });

      await db.stallAllocations.put({
        ...allocation,
        allocationStatus: 'Frozen',
        frozenAt: now(),
        frozenBy: payload.actorUserId,
      });

      await audit(
        payload.actorUserId,
        'Payment',
        payment.id,
        'PAYMENT_VERIFIED',
        undefined,
        payment
      );
    });
  }
}

export class DexieInvoiceRepository implements InvoiceRepository {
  async list(): Promise<ProformaInvoice[]> {
    return db.proformaInvoices.toArray();
  }
  async sendProforma(bookingId: string, actorUserId: string): Promise<void> {
    const booking = await db.bookings.get(bookingId);
    if (!booking) throw new Error('BOOKING_NOT_FOUND');
    if (!booking.allocatedStallId) throw new Error('VALIDATION_FAILED');

    let invoice = await db.proformaInvoices.where('bookingId').equals(bookingId).first();

    if (!invoice || invoice.invoiceStatus === 'Cancelled') {
      const stall = await db.stalls.get(booking.allocatedStallId);
      const size = await db.stallSizes.get(booking.requestedStallSizeId);
      const billing = await db.billingProfiles.get(booking.billingProfileId);
      if (!stall || !size || !billing) throw new Error('INVOICE_SOURCE_DATA_MISSING');

      const gst = Math.round(size.baseAmount * size.gstPercentage) / 100;
      invoice = {
        id: newId(),
        tenantId: booking.tenantId,
        eventId: booking.eventId,
        bookingId,
        invoiceNumber: `PI-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(Date.now()).slice(-4)}`,
        invoiceDate: new Date().toISOString().slice(0, 10),
        invoiceStatus: 'Generated',
        sellerLegalName: 'Laghu Udyog Bharati Tamil Nadu',
        sellerAddress: 'Plot No 63A, First Floor, 9th Street, Sidco Industrial Estate, Ambattur, Chennai - 600058',
        sellerGstin: '33AAATL0575H1ZT',
        sellerPan: 'AAATL0575H',
        buyerLegalName: billing.billingLegalName,
        buyerAddress: billing.billingAddress,
        buyerGstin: billing.billingGstin,
        buyerPan: billing.billingPan,
        placeOfSupply: billing.placeOfSupply,
        stallNumber: stall.stallNumber,
        stallSizeDisplay: size.displayName,
        hsnSac: '998397',
        description: 'MSME SANGAMAM EXPO TAMILNADU - Hotel Hills, Hosur',
        baseAmount: size.baseAmount,
        gstPercentage: size.gstPercentage,
        gstAmount: gst,
        totalAmount: size.baseAmount + gst,
        amountInWords: 'Amount in words will be generated by backend PDF service',
        taxAmountInWords: 'Tax amount in words will be generated by backend PDF service',
        notes: 'Payment request for temporarily blocked stall. Please complete payment to confirm stall allocation.',
        bankAccountName: 'LAGHU UDOYOG BHARATI',
        bankName: 'Canara Bank',
        bankAccountNumber: '0908201005559',
        ifscCode: 'CNRB0000936',
        branchName: 'Ambattur Branch, Chennai 600053',
        generatedAt: now()
      };

      await db.proformaInvoices.add(invoice);
      await audit(actorUserId, 'ProformaInvoice', invoice.id, 'INVOICE_GENERATED', undefined, invoice);
    }

    await db.emailLogs.add({
      id: newId(),
      tenantId: invoice.tenantId,
      eventId: invoice.eventId,
      bookingId: invoice.bookingId,
      toEmail: 'info@exhibitor.local',
      subject: `Proforma Invoice ${invoice.invoiceNumber}`,
      bodySnapshot: `Please find attached the proforma invoice ${invoice.invoiceNumber} for booking ${booking.bookingRegistrationNumber}.`,
      templateCode: 'PROFORMA_SENT',
      status: 'Sent',
      sentAt: now()
    });

    await audit(actorUserId, 'StallBooking', bookingId, 'PROFORMA_EMAILED', undefined, { invoiceNumber: invoice.invoiceNumber });
  }

  async generate(bookingId: string, actorUserId: string): Promise<ProformaInvoice> {
    let invoice!: ProformaInvoice;
    await db.transaction('rw', [db.bookings, db.stalls, db.stallSizes, db.billingProfiles, db.proformaInvoices, db.emailLogs, db.auditLogs], async () => {
      const existing = await db.proformaInvoices.where('bookingId').equals(bookingId).first();
      if (existing && existing.invoiceStatus !== 'Cancelled') throw new Error('INVOICE_ALREADY_GENERATED');
      const booking = await db.bookings.get(bookingId);
      if (!booking || booking.bookingStatus !== 'Confirmed' || !booking.allocatedStallId) throw new Error('INVOICE_NOT_ALLOWED_BEFORE_PAYMENT');
      const stall = await db.stalls.get(booking.allocatedStallId);
      const size = await db.stallSizes.get(booking.requestedStallSizeId);
      const billing = await db.billingProfiles.get(booking.billingProfileId);
      if (!stall || !size || !billing) throw new Error('INVOICE_SOURCE_DATA_MISSING');

      const gst = Math.round(size.baseAmount * size.gstPercentage) / 100;
      invoice = {
        id: newId(),
        tenantId: booking.tenantId,
        eventId: booking.eventId,
        bookingId,
        invoiceNumber: `PI-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(Date.now()).slice(-4)}`,
        invoiceDate: new Date().toISOString().slice(0, 10),
        invoiceStatus: 'Generated',
        sellerLegalName: 'Laghu Udyog Bharati Tamil Nadu',
        sellerAddress: 'Plot No 63A, First Floor, 9th Street, Sidco Industrial Estate, Ambattur, Chennai - 600058',
        sellerGstin: '33AAATL0575H1ZT',
        sellerPan: 'AAATL0575H',
        buyerLegalName: billing.billingLegalName,
        buyerAddress: billing.billingAddress,
        buyerGstin: billing.billingGstin,
        buyerPan: billing.billingPan,
        placeOfSupply: billing.placeOfSupply,
        stallNumber: stall.stallNumber,
        stallSizeDisplay: size.displayName,
        hsnSac: '998397',
        description: 'MSME SANGAMAM EXPO TAMILNADU - Hotel Hills, Hosur',
        baseAmount: size.baseAmount,
        gstPercentage: size.gstPercentage,
        gstAmount: gst,
        totalAmount: size.baseAmount + gst,
        amountInWords: 'Amount in words will be generated by backend PDF service',
        taxAmountInWords: 'Tax amount in words will be generated by backend PDF service',
        notes: 'Payment verified and stall allocation confirmed.',
        bankAccountName: 'LAGHU UDOYOG BHARATI',
        bankName: 'Canara Bank',
        bankAccountNumber: '0908201005559',
        ifscCode: 'CNRB0000936',
        branchName: 'Ambattur Branch, Chennai 600053',
        generatedAt: now()
      };

      await db.proformaInvoices.add(invoice);

      // NOTE (FIX): No email is sent here at generation time anymore.
      // The email is sent only when the invoice is explicitly marked as sent
      // via markSent() below (i.e. the "Mark Sent" button in the UI).

      await audit(actorUserId, 'ProformaInvoice', invoice.id, 'INVOICE_GENERATED', undefined, invoice);
    });
    return invoice;
  }

  async markSent(invoiceId: string, actorUserId: string): Promise<void> {
    const invoice = await db.proformaInvoices.get(invoiceId);
    if (!invoice) throw new Error('INVOICE_NOT_FOUND');

    await db.proformaInvoices.put({ ...invoice, invoiceStatus: 'Sent', sentAt: now() });

    // NOTE (FIX): Email log is now created here, at "Mark Sent" time,
    // instead of at generate() time. This is the single point where the
    // final invoice email is considered sent to the exhibitor.
    await db.emailLogs.add({
      id: newId(),
      tenantId: invoice.tenantId,
      eventId: invoice.eventId,
      bookingId: invoice.bookingId,
      toEmail: 'info@exhibitor.local',
      subject: `Tax Invoice ${invoice.invoiceNumber} - MSME Sangamam Connect Tamil Nadu`,
      bodySnapshot: `Please find attached your final invoice ${invoice.invoiceNumber} for stall ${invoice.stallNumber}. Total amount: ₹${invoice.totalAmount}.`,
      templateCode: 'INVOICE_SENT',
      status: 'Sent',
      sentAt: now()
    });

    await audit(actorUserId, 'ProformaInvoice', invoiceId, 'INVOICE_SENT', invoice, { ...invoice, invoiceStatus: 'Sent' });
  }
}

export class DexieDashboardRepository implements DashboardRepository {
  async summary(): Promise<Record<string, number>> {
    const [bookings, stalls, payments, invoices] = await Promise.all([
      db.bookings.toArray(), db.stalls.toArray(), db.payments.toArray(), db.proformaInvoices.toArray()
    ]);
    const count = (rows: unknown[], key: string, value: string) =>
      rows.filter(row => typeof row === 'object' && row !== null && (row as Record<string, unknown>)[key] === value).length;
    return {
      totalRegistrations: bookings.length,
      submittedBookings: count(bookings, 'bookingStatus', 'Submitted'),
      blockedAwaitingPayment: count(bookings, 'bookingStatus', 'BlockedAwaitingPayment'),
      confirmedBookings: count(bookings, 'bookingStatus', 'Confirmed'),
      releasedDueToNonPayment: count(bookings, 'bookingStatus', 'ReleasedDueToNonPayment'),
      totalStalls: stalls.length,
      availableStalls: count(stalls, 'currentStatus', 'Available'),
      blockedStalls: count(stalls, 'currentStatus', 'Blocked'),
      frozenStalls: count(stalls, 'currentStatus', 'Frozen'),
      paymentVerified: count(payments, 'verificationStatus', 'Verified'),
      invoiceGenerated: count(invoices, 'invoiceStatus', 'Generated'),
      invoiceSent: count(invoices, 'invoiceStatus', 'Sent')
    };
  }
}

export class DexieAuditRepository implements AuditRepository {
  async list() {
    return db.auditLogs.orderBy('occurredAt').reverse().toArray();
  }
}

export class DexieEmailRepository implements EmailRepository {
  async list() {
    return db.emailLogs.orderBy('sentAt').reverse().toArray();
  }
}

export const repositories = {
  auth: new DexieAuthRepository(),
  bookings: new DexieBookingRepository(),
  stalls: new DexieStallRepository(),
  payments: new DexiePaymentRepository(),
  invoices: new DexieInvoiceRepository(),
  dashboard: new DexieDashboardRepository(),
  audit: new DexieAuditRepository(),
  emails: new DexieEmailRepository()
};
