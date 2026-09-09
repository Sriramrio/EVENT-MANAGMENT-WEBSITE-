import Dexie, { Table } from 'dexie';
import type {
  AuditLog,
  BillingProfile,
  EmailLog,
  EventRecord,
  Exhibitor,
  Payment,
  ProformaInvoice,
  Stall,
  StallAllocation,
  StallBooking,
  StallSize,
  Tenant,
  User
} from '../../domain/models';

export class StallBookingDexie extends Dexie {
  tenants!: Table<Tenant, string>;
  events!: Table<EventRecord, string>;
  users!: Table<User, string>;
  stallSizes!: Table<StallSize, string>;
  stalls!: Table<Stall, string>;
  exhibitors!: Table<Exhibitor, string>;
  billingProfiles!: Table<BillingProfile, string>;
  bookings!: Table<StallBooking, string>;
  stallAllocations!: Table<StallAllocation, string>;
  payments!: Table<Payment, string>;
  proformaInvoices!: Table<ProformaInvoice, string>;
  emailLogs!: Table<EmailLog, string>;
  auditLogs!: Table<AuditLog, string>;

  constructor() {
    super('msme_sangamam_stall_booking_db');
    this.version(1).stores({
      tenants: 'id, code',
      events: 'id, tenantId, eventCode',
      users: 'id, tenantId, email, roleCode',
      stallSizes: 'id, tenantId, eventId, code',
      stalls: 'id, tenantId, eventId, stallNumber, stallSizeId, currentStatus, currentBookingId',
      exhibitors: 'id, tenantId, email, gstin, pan',
      billingProfiles: 'id, tenantId, exhibitorId, billingGstin',
      bookings: 'id, tenantId, eventId, bookingRegistrationNumber, exhibitorId, bookingStatus, allocatedStallId, blockExpiresAt',
      stallAllocations: 'id, tenantId, eventId, bookingId, stallId, allocationStatus, blockExpiresAt',
      payments: 'id, tenantId, eventId, bookingId, paymentReferenceNumber, verificationStatus, paymentDate',
      proformaInvoices: 'id, tenantId, eventId, bookingId, invoiceNumber, invoiceStatus',
      emailLogs: 'id, tenantId, eventId, bookingId, templateCode, status, sentAt',
      auditLogs: 'id, tenantId, eventId, actorUserId, entityName, entityId, action, occurredAt'
    });
  }
}

export const db = new StallBookingDexie();
