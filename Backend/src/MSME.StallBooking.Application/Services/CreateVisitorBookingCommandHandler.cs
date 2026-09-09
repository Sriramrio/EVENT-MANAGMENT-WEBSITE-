using MediatR;
using MSME.StallBooking.Application.Contracts;
using MSME.StallBooking.Application.Services;

public sealed class CreateVisitorBookingCommandHandler : IRequestHandler<CreateVisitorCommand, CreateVisitorResult>
{
    private readonly VisitorWorkflowService _visitorWorkflowService;

    public CreateVisitorBookingCommandHandler(VisitorWorkflowService visitorWorkflowService)
        => _visitorWorkflowService = visitorWorkflowService;

    public Task<CreateVisitorResult> Handle(CreateVisitorCommand request, CancellationToken cancellationToken)
        => _visitorWorkflowService.SubmitVisitorRegistrationAsync(request, cancellationToken);
}