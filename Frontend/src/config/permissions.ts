export const PERMISSIONS = {
  bookingView: 'booking.view',
  bookingReview: 'booking.review',
  bookingCancel: 'booking.cancel',
  stallView: 'stall.view',
  stallCreate: 'stall.create',
  stallUpdate: 'stall.update',
  stallImport: 'stall.import',
  stallBlock: 'stall.block',
  stallRelease: 'stall.release',
  stallChange: 'stall.change',
  stallFreeze: 'stall.freeze',
  paymentView: 'payment.view',
  paymentCreate: 'payment.create',
  paymentVerify: 'payment.verify',
  paymentReject: 'payment.reject',
  invoiceView: 'invoice.view',
  invoiceGenerate: 'invoice.generate',
  invoiceSend: 'invoice.send',
  invoiceCancel: 'invoice.cancel',
  dashboardView: 'dashboard.view',
  reportExport: 'report.export',
  adminUsersManage: 'admin.users.manage',
  adminRolesManage: 'admin.roles.manage',
  adminPermissionsManage: 'admin.permissions.manage',
  auditView: 'audit.view',
  qrPortalView: 'qrportal.view',
  visitorPortalView:'visitorportal.view',
  vipPortalView:'vipportal.view',
  buyerDashboardView:'buyer.dashboard.view',
  buyerOrganisationUpdate:'buyer.organisation.update',
  buyerRequirementCreate:'buyer.requirement.create',
  buyerRequirementSubmit:'buyer.requirement.submit',
  buyerMatchesView:'buyer.matches.view',
  sellerDashboardView:'seller.dashboard.view',
  sellerOrganisationUpdate:'seller.organisation.update',
  sellerCapabilityView:'seller.capability.view',
  sellerCapabilityCreate:'seller.capability.create',
  sellerCapabilityUpdate:'seller.capability.update',
  sellerCapabilityPublish:'seller.capability.publish',
  sellerOpportunityView:'seller.opportunity.view',
  sellerMeetingView:'seller.meeting.view',
  sellerRfqView:'seller.rfq.view',
  sellerQuotationSubmit:'seller.quotation.submit',
  sellerAwardView:'seller.award.view',
  exhibitorRequirementsManage: 'exhibitor.requirements.manage',
  buyerAdminManage: 'buyer.admin.manage',
  sellerAdminManage: 'seller.admin.manage',
} as const;

export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const rolePermissions: Record<string, PermissionCode[]> = {
  SuperAdmin: Object.values(PERMISSIONS),
  BuyerAdmin: [
    PERMISSIONS.buyerAdminManage,
  ],
  SellerAdmin: [
    PERMISSIONS.sellerAdminManage,
  ],
  ExhibitorAdmin: [
    PERMISSIONS.exhibitorRequirementsManage
  ],
  EventAdmin: [
    PERMISSIONS.dashboardView, PERMISSIONS.bookingView, PERMISSIONS.bookingReview, PERMISSIONS.bookingCancel,
    PERMISSIONS.stallView, PERMISSIONS.stallBlock, PERMISSIONS.stallRelease, PERMISSIONS.stallChange,
    PERMISSIONS.paymentView, PERMISSIONS.paymentCreate, PERMISSIONS.paymentVerify, PERMISSIONS.paymentReject,
    PERMISSIONS.invoiceView, PERMISSIONS.invoiceGenerate, PERMISSIONS.invoiceSend, PERMISSIONS.auditView, PERMISSIONS.reportExport
  ],
  StallAllocationAdmin: [
    PERMISSIONS.dashboardView, PERMISSIONS.bookingView, PERMISSIONS.stallView, PERMISSIONS.stallBlock, PERMISSIONS.stallRelease, PERMISSIONS.stallChange
  ],
  PaymentVerifier: [
    PERMISSIONS.dashboardView, PERMISSIONS.bookingView, PERMISSIONS.stallView, PERMISSIONS.paymentView, PERMISSIONS.paymentCreate, PERMISSIONS.paymentVerify, PERMISSIONS.paymentReject
  ],
  ProformaInvoicePreparer: [
    PERMISSIONS.dashboardView, PERMISSIONS.bookingView, PERMISSIONS.stallView, PERMISSIONS.paymentView, PERMISSIONS.invoiceView, PERMISSIONS.invoiceGenerate, PERMISSIONS.invoiceSend
  ],
  CoreCommitteeMember: [
    PERMISSIONS.dashboardView, PERMISSIONS.bookingView, PERMISSIONS.stallView, PERMISSIONS.paymentView, PERMISSIONS.invoiceView, PERMISSIONS.reportExport
  ],
  ViewerAuditor: [
    PERMISSIONS.dashboardView, PERMISSIONS.bookingView, PERMISSIONS.stallView, PERMISSIONS.paymentView, PERMISSIONS.invoiceView, PERMISSIONS.auditView
  ]
};
