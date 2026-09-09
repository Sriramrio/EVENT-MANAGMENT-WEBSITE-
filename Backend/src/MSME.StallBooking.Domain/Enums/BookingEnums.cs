namespace MSME.StallBooking.Domain.Enums;

public enum EventStatus { Draft, Open, Closed, Completed, Cancelled }
public enum StallStatus { Available, Blocked, Frozen, Released, Cancelled, Disabled, Reservation }
public enum BookingStatus { Draft, Submitted, UnderReview, BlockedAwaitingPayment, PaymentSubmitted, PaymentVerified, PaymentRejected, Confirmed, ReleasedDueToNonPayment, Cancelled, Closed }
public enum AllocationStatus { Blocked, Frozen, Released, Cancelled, Changed, Allocated }
public enum PaymentMode { Neft, Rtgs, Imps, Upi, Cheque, Cash, Other }
public enum PaymentVerificationStatus { Pending, Submitted, Verified, Rejected, ClarificationRequired }
public enum InvoiceStatus { Draft, Generated, Sent, Cancelled, Revised }
public enum FileCategory { GSTCertificate, UdyamCertificate, PAN, PaymentProof, ProformaInvoicePdf, Other }
public enum FileScanStatus { Pending, Clean, Suspicious, Failed, NotRequired }
public enum EmailStatus { Pending, Sent, Failed, Retrying }
public enum SequenceResetFrequency { Never, Daily, Monthly, Yearly }

