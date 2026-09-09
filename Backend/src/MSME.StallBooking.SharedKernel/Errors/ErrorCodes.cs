namespace MSME.StallBooking.SharedKernel.Errors;

public static class ErrorCodes
{
    public const string ValidationFailed = "VALIDATION_FAILED";
    public const string Unauthorized = "UNAUTHORIZED";
    public const string Forbidden = "FORBIDDEN";
    public const string EntityNotFound = "ENTITY_NOT_FOUND";
    public const string BookingNotFound = "BOOKING_NOT_FOUND";
    public const string StallNotFound = "STALL_NOT_FOUND";
    public const string StallAlreadyBlocked = "STALL_ALREADY_BLOCKED";
    public const string StallAlreadyFrozen = "STALL_ALREADY_FROZEN";
    public const string BookingNotEligibleForBlocking = "BOOKING_NOT_ELIGIBLE_FOR_BLOCKING";
    public const string PaymentNotFound = "PAYMENT_NOT_FOUND";
    public const string PaymentAlreadyVerified = "PAYMENT_ALREADY_VERIFIED";
    public const string PaymentAmountMismatch = "PAYMENT_AMOUNT_MISMATCH";
    public const string BlockExpired = "BLOCK_EXPIRED";
    public const string InvoiceAlreadyGenerated = "INVOICE_ALREADY_GENERATED";
    public const string InvoiceNotAllowedBeforePayment = "INVOICE_NOT_ALLOWED_BEFORE_PAYMENT";
    public const string ConcurrencyConflict = "CONCURRENCY_CONFLICT";
    public const string DuplicateBookingNumber = "DUPLICATE_BOOKING_NUMBER";
    public const string DuplicateInvoiceNumber = "DUPLICATE_INVOICE_NUMBER";
    public const string EmailSendFailed = "EMAIL_SEND_FAILED";
    public const string FileUploadInvalid = "FILE_UPLOAD_INVALID";
    public const string DatabaseConstraintViolation = "DATABASE_CONSTRAINT_VIOLATION";
    public const string EmailAlreadyExists = "EMAIL_ALREADY_EXISTS";
}
