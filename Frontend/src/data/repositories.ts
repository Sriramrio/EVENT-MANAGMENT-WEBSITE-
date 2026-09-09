import type { AuditLog, BookingStatus, EmailLog, Payment, ProformaInvoice, Stall, StallAllocation, StallBooking, User } from '../domain/models';

export interface LoginInput {
  email: string;
  password: string;
}

export interface BookingRepository {
  list(status?: BookingStatus | 'All'): Promise<StallBooking[]>;
  get(id: string): Promise<StallBooking | undefined>;
blockStall(bookingId: string, stallId: string, actorUserId: string, targetSponsorTotal?: number, isGstApplicable?: boolean, isTdsDeductable?: boolean): Promise<void>;}

export interface StallRepository {
  list(): Promise<Stall[]>;
  listAvailableForBooking(bookingId: string): Promise<Stall[]>;
}

export interface PaymentRepository {
  list(): Promise<Payment[]>;

  getById?(paymentId: string): Promise<Payment>;

 submitAndVerify(
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
  }
): Promise<void>;
}

export interface InvoiceRepository {
  list(): Promise<ProformaInvoice[]>;
  generate(bookingId: string, actorUserId: string): Promise<ProformaInvoice>;
  markSent(invoiceId: string, actorUserId: string): Promise<void>;
  sendProforma(bookingId: string, actorUserId: string): Promise<void>;
}

export interface AuthRepository {
  login(input: LoginInput): Promise<User>;
}

export interface DashboardRepository {
  summary(): Promise<Record<string, number>>;
}

export interface AuditRepository {
  list(): Promise<AuditLog[]>;
}

export interface EmailRepository {
  list(): Promise<EmailLog[]>;
}
