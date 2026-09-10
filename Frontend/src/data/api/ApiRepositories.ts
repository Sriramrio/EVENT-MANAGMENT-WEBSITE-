import type { AuthRepository, BookingRepository, DashboardRepository, InvoiceRepository, PaymentRepository, StallRepository, AuditRepository, EmailRepository, LoginInput } from '../repositories';
import type { AuditLog, BookingStatus, EmailLog, Payment, ProformaInvoice, Stall, StallBooking, User } from '../../domain/models';
import { apiClient, setAccessToken } from './apiClient';
import { StallForm } from '../../features/stalls/StallMasterPage';

const eventPath = '/admin/events/current';

export class ApiAuthRepository implements AuthRepository {
  async login(input: LoginInput): Promise<User> {
    const response = await apiClient.post<{ accessToken: string; user: User }>('/auth/login', input);
    setAccessToken(response.accessToken);
    return response.user;
  }
}

export class StallMaster {
  list(): Promise<Stall[]> {
    return apiClient.get<Stall[]>(`${eventPath}/stalls?_t=${Date.now()}`);

  }
  create(request: StallForm): Promise<StallForm> {
    return apiClient.post<StallForm>(
      `/admin/events/current/stalls`,
      request
    );
  }
}
export class ApiBookingRepository implements BookingRepository {
  async list(status: BookingStatus | 'All' = 'All'): Promise<StallBooking[]> {
    const query = status === 'All' ? '' : `?status=${encodeURIComponent(status)}`;

    const rows = await apiClient.get<any[]>(`${eventPath}/bookings${query}`);

    return rows.map(row => ({
      id: row.id ?? '',
      tenantId: row.tenantId ?? row.tenant_id ?? '',
      eventId: row.eventId ?? row.event_id ?? '',
      exhibitorId: row.exhibitorId ?? row.exhibitor_id ?? '',
      billingProfileId: row.billingProfileId ?? row.billing_profile_id ?? '',

      requestedStallSizeId:
        row.requestedStallSizeId ??
        row.requested_stall_size_id ??
        '',

      allocatedStallId:
        row.allocatedStallId ??
        row.allocated_stall_id ??
        null,

      bookingRegistrationNumber:
        row.bookingRegistrationNumber ??
        row.booking_registration_number ??
        '',

      bookingDate: row.bookingDate ?? row.booking_date ?? '',
      bookingStatus: (row.bookingStatus ?? row.booking_status ?? 'Submitted') as BookingStatus,

      fasciaName:
        row.fasciaName ??
        row.fascia_name ??
        row.companyName ??
        '',

      displayNotes: row.displayNotes ?? row.display_notes ?? null,
      blockExpiresAt: row.blockExpiresAt ?? row.block_expires_at ?? null,
      lastEmailSentAt: row.lastEmailSentAt ?? row.last_email_sent_at ?? null,
      confirmedAt: row.confirmedAt ?? row.confirmed_at ?? null,
      cancelledAt: row.cancelledAt ?? row.cancelled_at ?? null,
      cancellationReason: row.cancellationReason ?? row.cancellation_reason ?? null,

      companyName: row.companyName ?? row.company_name ?? row.fasciaName ?? '',
      contactPerson: row.contactPerson ?? row.contact_person ?? '',
      email: row.email ?? '',
      mobile: row.mobile ?? '',
      stallNumber: row.stallNumber ?? row.stall_number ?? null,
      stallSizeCode: row.stallSizeCode ?? row.stall_size_code ?? '',
      stallSizeName: row.stallSizeName ?? row.stall_size_name ?? '',
      expectedAmount: row.expectedAmount ?? row.expected_amount ?? 0,
      stallOption1Id: row.stallOption1Id ?? row.stall_option1_id ?? null,
      stallOption2Id: row.stallOption2Id ?? row.stall_option2_id ?? null,
      stallOption1Number: row.stallOption1Number ?? row.stall_option1_number ?? null,
      stallOption2Number: row.stallOption2Number ?? row.stall_option2_number ?? null,
      district: row.district ?? '',
      panNumber: row.panNumber ?? row.pan_number ?? '',
      udyamRegistrationNumber:
        row.udyamRegistrationNumber ??
        row.udyam_registration_number ??
        '',
      createAt: row.createAt ?? '',

      gstin: row.gstin ?? '',
      totalPaidAmount: row.totalPaidAmount ?? row.total_paid_amount ?? 0,
      balanceDueAmount: row.balanceDueAmount ?? row.balance_due_amount ?? 0,
      lubMember: row.lubMember ?? false,
      tanNumber: row.tanNumber ?? null,
    } as unknown as StallBooking & {
      companyName?: string;
      contactPerson?: string;
      email?: string;
      mobile?: string;
      stallNumber?: string | null;
      stallSizeCode?: string;
      stallSizeName?: string;
      expectedAmount?: number;
    }));
  }

  get(id: string): Promise<StallBooking | undefined> {
    return apiClient.get<StallBooking>(`${eventPath}/bookings/${id}`);
  }

  blockStall(
    bookingId: string,
    stallId: string,
    actorUserId: string,
    targetSponsorTotal?: number,
    isGstApplicable?: boolean,
    isTdsDeductable?: boolean,
    tdsPercentage?: number
  ): Promise<void> {
    return apiClient.post(
      `${eventPath}/bookings/${bookingId}/block-stall`,
      {
        stallId,
        actorUserId,
        targetSponsorTotal: targetSponsorTotal ?? null,
        isGstApplicable: isGstApplicable ?? false,
        isTdsDeductable: isTdsDeductable ?? false,
        tdsPercentage: tdsPercentage ?? null,
      }
    );
  }

  releaseStall(bookingId: string, actorUserId: string, reason: string): Promise<void> {
    return apiClient.post<void>(`${eventPath}/bookings/${bookingId}/release-stall`, {
      actorUserId,
      reason
    });
  }
}

export class ApiStallRepository implements StallRepository {
  list(): Promise<Stall[]> {
    return apiClient.get<Stall[]>(`${eventPath}/stalls`);
  }

  listAvailableForBooking(bookingId: string): Promise<Stall[]> {
    return apiClient.get<Stall[]>(
      `${eventPath}/bookings/${bookingId}/available-stalls`
    );
  }

  reserveForVip(stallId: string, actorUserId: string, note?: string): Promise<void> {
    return apiClient.post<void>(`${eventPath}/stalls/${stallId}/reserve`, {
      actorUserId,
      note: note ?? null
    });
  }

  cancelReservation(stallId: string, actorUserId: string): Promise<void> {
    return apiClient.post<void>(`${eventPath}/stalls/${stallId}/cancel-reservation`, {
      actorUserId
    });
  }
}

export class ApiPaymentRepository implements PaymentRepository {
  list(): Promise<Payment[]> {
    return apiClient.get<Payment[]>(`${eventPath}/payments`);
  }

  getById(paymentId: string): Promise<Payment> {
    return apiClient.get<Payment>(`${eventPath}/payments/${paymentId}`);
  }

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
      isTdsDeductable: boolean;
      tdsPercentage?: number;
      TargetSponsorTotal: number | null;
      isGstApplicable: boolean;
      gstType: string;
      gstAmount: string;
    }
  ): Promise<void> {
    return apiClient.post<void>(
      `${eventPath}/bookings/${bookingId}/payments`,
      payload
    );
  }
}
export class ApiInvoiceRepository implements InvoiceRepository {
  list(): Promise<ProformaInvoice[]> { return apiClient.get<ProformaInvoice[]>(`${eventPath}/invoices`); }
  generate(bookingId: string, actorUserId: string): Promise<ProformaInvoice> {
    return apiClient.post<ProformaInvoice>(`${eventPath}/bookings/${bookingId}/proforma-invoice/generate`, { actorUserId });
  }
  markSent(invoiceId: string, actorUserId: string): Promise<any> {
    return apiClient.post<any>(`${eventPath}/invoices/${invoiceId}/send-email`, { actorUserId });
  }
  sendProforma(bookingId: string, actorUserId: string): Promise<void> {
    return apiClient.post<void>(
      `${eventPath}/bookings/${bookingId}/proforma-invoice/send-email`,
      { actorUserId }
    );
  }
}

export class ApiDashboardRepository implements DashboardRepository {
  summary(): Promise<Record<string, number>> { return apiClient.get<Record<string, number>>(`${eventPath}/dashboard/summary`); }
}

export class ApiAuditRepository implements AuditRepository {
  list(): Promise<AuditLog[]> { return apiClient.get<AuditLog[]>(`${eventPath}/audit`); }
}

export class ApiEmailRepository implements EmailRepository {
  list(): Promise<EmailLog[]> { return apiClient.get<EmailLog[]>(`${eventPath}/email-logs`); }
}

export const apiRepositories = {
  auth: new ApiAuthRepository(),
  bookings: new ApiBookingRepository(),
  stalls: new ApiStallRepository(),
  payments: new ApiPaymentRepository(),
  invoices: new ApiInvoiceRepository(),
  dashboard: new ApiDashboardRepository(),
  audit: new ApiAuditRepository(),
  emails: new ApiEmailRepository()
};