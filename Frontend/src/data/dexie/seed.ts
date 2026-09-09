// import stallSeed from './stall_master_seed.json';
// import { rolePermissions } from '../../config/permissions';
// import type { Stall, StallBooking, StallSize, User } from '../../domain/models';
// import { db } from './db';
// import { ids } from './ids';

// const now = () => new Date().toISOString();
// const makeId = (prefix: string, index: number) => `${prefix}-${String(index).padStart(12, '0')}`.slice(0, 36);

// function sizeId(size: string): string {
//   const normalized = size.toLowerCase();
//   if (normalized === '3x3') return ids.size3x3;
//   if (normalized === '3x2') return ids.size3x2;
//   return ids.size2x2;
// }

// export async function ensureSeeded(): Promise<void> {
//   const count = await db.tenants.count();
//   if (count > 0) return;

//   const users: User[] = [
//     { id: ids.superAdmin, tenantId: ids.tenantId, fullName: 'Super Admin', email: 'superadmin@lubmsmehosur.org', roleCode: 'SuperAdmin', permissions: rolePermissions.SuperAdmin },
//     { id: ids.eventAdmin, tenantId: ids.tenantId, fullName: 'Event Admin', email: 'eventadmin@lubmsmehosur.org', roleCode: 'EventAdmin', permissions: rolePermissions.EventAdmin },
//     { id: ids.stallAdmin, tenantId: ids.tenantId, fullName: 'Stall Allocation Admin', email: 'stallallocation@lubmsmehosur.org', roleCode: 'StallAllocationAdmin', permissions: rolePermissions.StallAllocationAdmin },
//     { id: ids.paymentVerifier, tenantId: ids.tenantId, fullName: 'Payment Verifier', email: 'payment@lubmsmehosur.org', roleCode: 'PaymentVerifier', permissions: rolePermissions.PaymentVerifier },
//     { id: ids.invoicePreparer, tenantId: ids.tenantId, fullName: 'Proforma Invoice Preparer', email: 'invoice@lubmsmehosur.org', roleCode: 'ProformaInvoicePreparer', permissions: rolePermissions.ProformaInvoicePreparer },
//     { id: ids.committee, tenantId: ids.tenantId, fullName: 'Core Committee Member', email: 'committee@lubmsmehosur.org', roleCode: 'CoreCommitteeMember', permissions: rolePermissions.CoreCommitteeMember }
//   ];

//   const stallSizes: StallSize[] = [
//     { id: ids.size3x3, tenantId: ids.tenantId, eventId: ids.eventId, code: '3x3', displayName: '3x3 mtrs', widthM: 3, depthM: 3, baseAmount: 63000, gstPercentage: 18, totalAmount: 74340 },
//     { id: ids.size3x2, tenantId: ids.tenantId, eventId: ids.eventId, code: '3x2', displayName: '3x2 mtrs', widthM: 3, depthM: 2, baseAmount: 45000, gstPercentage: 18, totalAmount: 53100 },
//     { id: ids.size2x2, tenantId: ids.tenantId, eventId: ids.eventId, code: '2x2', displayName: '2x2 mtrs', widthM: 2, depthM: 2, baseAmount: 30000, gstPercentage: 18, totalAmount: 35400 }
//   ];

//   const stalls: Stall[] = stallSeed.map((row, index) => ({
//     id: makeId('stall-000000000000000000', index + 1),
//     tenantId: ids.tenantId,
//     eventId: ids.eventId,
//     stallSizeId: sizeId(row.size),
//     stallNumber: row.stallNumber,
//     currentStatus: row.blocked ? 'Blocked' : 'Available',
//     currentBookingId: row.blocked ? 'seed-booking-blocked-000000000001' : null,
//     sourceRow: row.sourceRow
//   }));

//   const exhibitorId = '55555555-5555-4555-8555-000000000001';
//   const billingId = '66666666-6666-4666-8666-000000000001';
//   const bookingId = '77777777-7777-4777-8777-000000000001';
//   const initialBlockedStall = stalls.find(s => s.currentStatus === 'Blocked') ?? stalls[0];
//   initialBlockedStall.currentStatus = 'Blocked';
//   initialBlockedStall.currentBookingId = bookingId;

//   const bookings: StallBooking[] = [
//     {
//       id: bookingId,
//       tenantId: ids.tenantId,
//       eventId: ids.eventId,
//       exhibitorId,
//       billingProfileId: billingId,
//       requestedStallSizeId: ids.size3x3,
//       allocatedStallId: initialBlockedStall.id,
//       bookingRegistrationNumber: 'MSME-HOSUR-20260619-0001',
//       bookingDate: now(),
//       bookingStatus: 'BlockedAwaitingPayment',
//       fasciaName: 'APEX PRECISION',
//       displayNotes: 'Seed booking from stall master blocked row.',
//       blockExpiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
//       lastEmailSentAt: now()
//     },
//     {
//       id: '77777777-7777-4777-8777-000000000002',
//       tenantId: ids.tenantId,
//       eventId: ids.eventId,
//       exhibitorId,
//       billingProfileId: billingId,
//       requestedStallSizeId: ids.size3x2,
//       allocatedStallId: null,
//       bookingRegistrationNumber: 'MSME-HOSUR-20260619-0002',
//       bookingDate: now(),
//       bookingStatus: 'Submitted',
//       fasciaName: 'NOVA VALVES',
//       displayNotes: 'Awaiting admin review.'
//     }
//   ];

//   await db.transaction('rw', [db.tenants, db.events, db.users, db.stallSizes, db.stalls, db.exhibitors, db.billingProfiles, db.bookings, db.stallAllocations, db.emailLogs, db.auditLogs], async () => {
//     await db.tenants.add({ id: ids.tenantId, code: 'LUB-TN', name: 'Laghu Udyog Bharati Tamil Nadu', legalName: 'Laghu Udyog Bharati Tamil Nadu' });
//     await db.events.add({ id: ids.eventId, tenantId: ids.tenantId, eventCode: 'MSME-HOSUR-2026', eventName: 'MSME Sangamam Connect - Tamil Nadu / Hosur', venueName: 'Hotel Hills, Hosur', stallBlockValidityDays: 3, defaultGstPercentage: 18 });
//     await db.users.bulkAdd(users);
//     await db.stallSizes.bulkAdd(stallSizes);
//     await db.stalls.bulkAdd(stalls);
//     await db.exhibitors.add({
//       id: exhibitorId,
//       tenantId: ids.tenantId,
//       legalName: 'Apex Precision Components Pvt Ltd',
//       tradeName: 'Apex Precision',
//       registeredAddress: 'Plot No. 18, SIPCOT Industrial Complex, Hosur',
//       city: 'Hosur',
//       district: 'Krishnagiri',
//       state: 'Tamil Nadu',
//       pincode: '635126',
//       country: 'India',
//       contactPersonName: 'R. Suresh Kumar',
//       contactPersonDesignation: 'Managing Director',
//       mobile: '9876543210',
//       email: 'info@apexprecision.in',
//       industryScale: 'Small',
//       businessType: 'Manufacturer',
//       companyConstitution: 'Pvt Ltd',
//       industryCategory: 'Automotive & EV Components',
//       productServiceDescription: 'CNC machined components and precision fixtures.',
//       productKeywords: 'CNC, EV brackets, fixtures',
//       udyamNumber: 'UDYAM-TN-12-1234567',
//       gstin: '33ABCDE1234F1Z5',
//       pan: 'ABCDE1234F',
//       lubMember: true,
//       lubState: 'Tamil Nadu',
//       lubChapter: 'Hosur',
//       lubMembershipNumber: 'LUB-HSR-001'
//     });
//     await db.billingProfiles.add({
//       id: billingId,
//       tenantId: ids.tenantId,
//       exhibitorId,
//       billingLegalName: 'Apex Precision Components Pvt Ltd',
//       billingAddress: 'Plot No. 18, SIPCOT Industrial Complex, Hosur',
//       billingState: 'Tamil Nadu',
//       billingStateCode: '33',
//       billingGstin: '33ABCDE1234F1Z5',
//       billingPan: 'ABCDE1234F',
//       placeOfSupply: 'Tamil Nadu',
//       billingEmail: 'accounts@apexprecision.in',
//       billingMobile: '9876543210',
//       isDefault: true
//     });
//     await db.bookings.bulkAdd(bookings);
//     await db.stallAllocations.add({
//       id: '88888888-8888-4888-8888-000000000001',
//       tenantId: ids.tenantId,
//       eventId: ids.eventId,
//       bookingId,
//       stallId: initialBlockedStall.id,
//       allocationStatus: 'Blocked',
//       blockedAt: now(),
//       blockedBy: ids.stallAdmin,
//       blockExpiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
//     });
//     await db.emailLogs.add({
//       id: '99999999-9999-4999-8999-000000000001',
//       tenantId: ids.tenantId,
//       eventId: ids.eventId,
//       bookingId,
//       toEmail: 'info@apexprecision.in',
//       subject: 'MSME Sangamam Stall Booking Interest Received - Registration No. MSME-HOSUR-20260619-0001',
//       bodySnapshot: 'Your stall has been blocked temporarily for 3 days. Payment details are included.',
//       templateCode: 'BOOKING_RECEIVED_PAYMENT_REQUEST',
//       status: 'Sent',
//       sentAt: now()
//     });
//   });
// }
