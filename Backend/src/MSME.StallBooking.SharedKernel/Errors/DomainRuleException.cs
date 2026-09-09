namespace MSME.StallBooking.SharedKernel.Errors;

public sealed class DomainRuleException : Exception
{
    public string ErrorCode { get; }
    public IReadOnlyDictionary<string, string[]> Details { get; }

    public DomainRuleException(string errorCode, string message, IReadOnlyDictionary<string, string[]>? details = null)
        : base(message)
    {
        ErrorCode = errorCode;
        Details = details ?? new Dictionary<string, string[]>();
    }
}
