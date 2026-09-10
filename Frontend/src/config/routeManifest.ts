import { PERMISSIONS } from './permissions';

export interface RouteManifestItem {
  path: string;
  label: string;
  permission?: string;
  menu?: boolean;
  group?: string;
  readOnlySafe?: boolean;
}

export const routeManifest: RouteManifestItem[] = [
  { path: '/app/dashboard', label: 'Dashboard', permission: PERMISSIONS.dashboardView, menu: true, readOnlySafe: true },
  { path: '/app/report', label: 'Report', permission: PERMISSIONS.dashboardView, menu: true, readOnlySafe: true },
  { path: '/app/Adminbulkuploadform', label: 'Stall Booking Form', permission: PERMISSIONS.adminPermissionsManage, menu: true, readOnlySafe: true },
  { path: '/app/bookings', label: 'Bookings', permission: PERMISSIONS.bookingView, menu: true, readOnlySafe: true },
  { path: '/app/stall-allocation', label: 'Stall Allocation', permission: PERMISSIONS.stallView, menu: true },
  { path: '/app/stall-reservation-allocation', label: 'Stall Reservation Allocation', permission: PERMISSIONS.stallView, menu: true },
  { path: '/app/stalls', label: 'Stall Master', permission: PERMISSIONS.stallView, menu: true, readOnlySafe: true },
  { path: '/app/sponsorstalls', label: 'Sponsor Stalls', permission: PERMISSIONS.stallView, menu: true, readOnlySafe: true },
  { path: '/app/stall-qr', label: 'QR Generater', permission: PERMISSIONS.stallView, menu: true, readOnlySafe: true },
  { path: '/app/payments', label: 'Payments', permission: PERMISSIONS.paymentView, menu: true, readOnlySafe: true },
  { path: '/app/paymentsummery', label: 'Payment Summary', permission: PERMISSIONS.paymentView, menu: true, readOnlySafe: true },
  { path: '/app/invoices', label: ' Invoices', permission: PERMISSIONS.invoiceView, menu: true, readOnlySafe: true },
  { path: '/app/audit', label: 'Audit Logs', permission: PERMISSIONS.auditView, menu: true, readOnlySafe: true },
  { path: '/app/admin/buyers', label: 'Buyer Details Management', permission: PERMISSIONS.buyerAdminManage, menu: true, group: 'Administration' },
  { path: '/app/admin/buyer-requirements', label: 'Buyer Requirements', permission: PERMISSIONS.buyerAdminManage, menu: true, group: 'Administration' },
  { path: '/app/admin/sellers', label: 'Seller Details Management', permission: PERMISSIONS.sellerAdminManage, menu: true, group: 'Administration' },
  { path: '/app/admin/seller-requirements', label: 'Seller Requirements', permission: PERMISSIONS.sellerAdminManage, menu: true, group: 'Administration' },
  { path: '/app/admin/users', label: 'Users', permission: PERMISSIONS.adminUsersManage, menu: true, group: 'Administration' },
  { path: '/app/admin/roles', label: 'Roles', permission: PERMISSIONS.adminRolesManage, menu: true, group: 'Administration' },
  { path: '/app/admin/permissions', label: 'Permissions', permission: PERMISSIONS.adminPermissionsManage, menu: true, group: 'Administration' },
  { path: '/app/admin/event-settings', label: 'Event Settings', permission: PERMISSIONS.adminUsersManage, menu: true, group: 'Administration' },
  { path: '/app/admin/email-templates', label: 'Email Templates', permission: PERMISSIONS.adminUsersManage, menu: true, group: 'Administration' },
  { path: '/app/admin/exhibitors', label: 'Exhibitor List', permission: PERMISSIONS.exhibitorRequirementsManage, menu: true, group: 'Exhibitor Management' },
  { path: '/app/admin/exhibitor-requirements', label: 'Exhibitor Requirements', permission: PERMISSIONS.exhibitorRequirementsManage, menu: true, group: 'Exhibitor Management' }, { path: '/app/admin/exhibitor-email-templates', label: 'Exhibitor Requirements Email Templates', permission: PERMISSIONS.exhibitorRequirementsManage, menu: true, group: 'Exhibitor Management' },
  { path: '/app/admin/logo-manager', label: 'Logo Manager', permission: PERMISSIONS.exhibitorRequirementsManage, menu: true, group: 'Exhibitor Management' },
];


export const QrPortalMainifest: RouteManifestItem[] = [
  { path: '/qrshell/voluntariar', label: 'Volunteer', permission: PERMISSIONS.qrPortalView, menu: true, readOnlySafe: true },
  // { path: '/qrshell/organizer', label: 'Organizer', permission: PERMISSIONS.qrPortalView, menu: true, readOnlySafe: true },
  // { path: '/qrshell/buyer', label: 'Buyer', permission: PERMISSIONS.qrPortalView, menu: true, readOnlySafe: true },
  { path: '/qrshell/Scanner', label: 'Scanner', permission: PERMISSIONS.qrPortalView, menu: true, readOnlySafe: true },
  { path: '/qrshell/Visitor', label: 'Checked In', permission: PERMISSIONS.qrPortalView, menu: true, readOnlySafe: true },

  // { path: '/qrshell/vip-visitor', label: 'VIP Visitor', permission: PERMISSIONS.qrPortalView, menu: true, readOnlySafe: true },


];

export const VisitorPortakMainifest: RouteManifestItem[] = [
  { path: '/visitorShell/Dashboard', label: 'Visitor Dashboard', permission: PERMISSIONS.visitorPortalView, menu: true, readOnlySafe: true },
  // { path: '/visitorShell/report', label: 'Report', permission: PERMISSIONS.visitorPortalView, menu: true, readOnlySafe: true },
  { path: '/visitorShell/VisitorList', label: 'Visitors', permission: PERMISSIONS.visitorPortalView, menu: true, readOnlySafe: true },

  // { path: '/qrshell/buyer', label: 'Buyer', permission: PERMISSIONS.qrPortalView, menu: true, readOnlySafe: true },
  // { path: '/qrshell/Scanner', label: 'Scanner', permission: PERMISSIONS.qrPortalView, menu: true, readOnlySafe: true },
  { path: '/qrshell/Visitor', label: 'Visitor Present List', permission: PERMISSIONS.qrPortalView, menu: true, readOnlySafe: true },
  { path: '/qrshell/vip-visitor', label: 'VIP Visitor', permission: PERMISSIONS.qrPortalView, menu: true, readOnlySafe: true },


];

export const VipPortakMainifest: RouteManifestItem[] = [
  { path: '/vipShell/Dashboard', label: 'VIP Dashboard', permission: PERMISSIONS.vipPortalView, menu: true, readOnlySafe: true },
  // { path: '/visitorShell/report', label: 'Report', permission: PERMISSIONS.visitorPortalView, menu: true, readOnlySafe: true },
  { path: '/vipShell/List', label: 'VIP List', permission: PERMISSIONS.vipPortalView, menu: true, readOnlySafe: true },
  { path: '/vipShell/VipForm', label: 'VIP Form', permission: PERMISSIONS.vipPortalView, menu: true, readOnlySafe: true },

  // { path: '/qrshell/buyer', label: 'Buyer', permission: PERMISSIONS.qrPortalView, menu: true, readOnlySafe: true },
  // { path: '/qrshell/Scanner', label: 'Scanner', permission: PERMISSIONS.qrPortalView, menu: true, readOnlySafe: true },

];


export interface RouteDefinition { screen: number; id: string; path: string; title: string; feature: string; permission?: string; navigation?: string; }
export const BuyerRoute: RouteDefinition[] = [
  { screen: 1, id: 'landing', path: '/', title: 'Landing Page', feature: 'landing' },
  { screen: 2, id: 'role-selection', path: '/role-selection', title: 'Role Selection', feature: 'role-selection' },
  { screen: 3, id: 'organisation', path: '/buyer/onboarding/organisation', title: 'Buyer Organisation Registration', feature: 'buyer-onboarding', permission: 'buyer.organisation.update' },
  { screen: 4, id: 'contact', path: '/buyer/onboarding/contact', title: 'Buyer Contact Person', feature: 'buyer-onboarding', permission: 'buyer.organisation.update' },
  { screen: 5, id: 'dashboard', path: '/buyer/dashboard', title: 'Buyer Dashboard Overview', feature: 'dashboard', permission: 'buyer.dashboard.view', navigation: 'Dashboard' },
  { screen: 6, id: 'requirements', path: '/buyer/requirements', title: 'My Requirements', feature: 'requirements', permission: 'buyer.requirement.create', navigation: 'Requirements' },
  { screen: 7, id: 'requirement-basic', path: '/buyer/requirements/new/basic', title: 'Create Requirement — Basic Details', feature: 'requirements', permission: 'buyer.requirement.create' },
  { screen: 8, id: 'requirement-product', path: '/buyer/requirements/:id/product', title: 'Create Requirement — Product Details', feature: 'requirements', permission: 'buyer.requirement.create' },
  { screen: 9, id: 'requirement-quality', path: '/buyer/requirements/:id/technical-quality', title: 'Create Requirement — Technical & Quality', feature: 'requirements', permission: 'buyer.requirement.create' },
  { screen: 10, id: 'requirement-commercial', path: '/buyer/requirements/:id/commercial-review', title: 'Create Requirement — Commercial & Review', feature: 'requirements', permission: 'buyer.requirement.submit' },
  { screen: 11, id: 'requirement-summary', path: '/buyer/requirements/:id/summary', title: 'Requirement Detail & Match Summary', feature: 'matchmaking', permission: 'buyer.matches.view' },
  { screen: 12, id: 'matches', path: '/buyer/requirements/:id/matches', title: 'Matched Suppliers List', feature: 'matchmaking', permission: 'buyer.matches.view', navigation: 'Matches' },
  { screen: 13, id: 'supplier-profile', path: '/buyer/suppliers/:supplierId', title: 'Supplier Profile View', feature: 'suppliers', permission: 'buyer.supplier.view' },
  { screen: 14, id: 'supplier-action', path: '/buyer/requirements/:id/suppliers/:supplierId/action', title: 'Shortlist / Express Interest / Request Meeting', feature: 'shortlist', permission: 'buyer.shortlist.manage' },
  { screen: 14.5, id: 'shortlisted-suppliers', path: '/buyer/shortlist', title: 'My Shortlisted Suppliers', feature: 'shortlist', permission: 'buyer.shortlist.manage', navigation: 'Shortlist' },
  { screen: 15, id: 'meetings', path: '/buyer/meetings', title: 'Buyer Meetings — Calendar', feature: 'meetings', permission: 'buyer.meeting.view', navigation: 'Meetings' },
  { screen: 16, id: 'schedule-meeting', path: '/buyer/meetings/new', title: 'Schedule Meeting', feature: 'meetings', permission: 'buyer.meeting.request' },
  { screen: 17, id: 'meeting-detail', path: '/buyer/meetings/:meetingId', title: 'Meeting Detail & Pre-Meeting Brief', feature: 'meetings', permission: 'buyer.meeting.view' },
  { screen: 18, id: 'meeting-checkin', path: '/buyer/meetings/:meetingId/check-in', title: 'QR Check-In & Start Meeting', feature: 'meetings', permission: 'buyer.meeting.checkin' },
  { screen: 19, id: 'meeting-live', path: '/buyer/meetings/:meetingId/live', title: 'Meeting in Progress — Notes & Feedback', feature: 'meetings', permission: 'buyer.meeting.notes' },
  { screen: 20, id: 'meeting-outcome', path: '/buyer/meetings/:meetingId/outcome', title: 'Post-Meeting Outcome & Next Actions', feature: 'meetings', permission: 'buyer.meeting.outcome' },
  { screen: 20.5, id: 'meeting-outcomes', path: '/buyer/meeting-outcomes', title: 'Meeting Outcomes', feature: 'meetings', permission: 'buyer.meeting.view', navigation: 'Meeting Outcomes' },
  { screen: 21, id: 'actions', path: '/buyer/actions', title: 'Post-Meeting Actions', feature: 'actions', permission: 'buyer.action.manage', navigation: 'Actions' },
  { screen: 22, id: 'rfqs', path: '/buyer/rfqs', title: 'RFQ Management', feature: 'rfqs', permission: 'buyer.rfq.view', navigation: 'RFQs' },
  { screen: 23, id: 'samples', path: '/buyer/samples', title: 'Sample / Prototype Track', feature: 'samples', permission: 'buyer.qualification.view' },
  { screen: 24, id: 'qualification', path: '/buyer/supplier-qualification', title: 'Supplier Qualification', feature: 'supplier-qualification', permission: 'buyer.qualification.view' },
  { screen: 25, id: 'evaluation', path: '/buyer/supplier-evaluations', title: 'Supplier Evaluation', feature: 'supplier-evaluation', permission: 'buyer.evaluation.create' },
  { screen: 26, id: 'onboarding', path: '/buyer/vendor-onboarding', title: 'Vendor Registration', feature: 'vendor-onboarding', permission: 'buyer.vendor_onboarding.view' },
  { screen: 27, id: 'audits', path: '/buyer/audits', title: 'Audit & Assessment', feature: 'audits', permission: 'buyer.audit.view' },
  { screen: 28, id: 'negotiations', path: '/buyer/negotiations', title: 'Commercial Negotiation', feature: 'negotiations', permission: 'buyer.negotiation.view' },
  { screen: 29, id: 'purchase-orders', path: '/buyer/purchase-orders', title: 'Purchase Orders', feature: 'purchase-orders', permission: 'buyer.purchase_order.view' },
  { screen: 30, id: 'impact', path: '/buyer/impact', title: 'Conversion & Business Impact', feature: 'business-impact', permission: 'buyer.report.view' },
  { screen: 31, id: 'reports', path: '/buyer/reports', title: 'Reports & Analytics', feature: 'reports', permission: 'buyer.report.view', navigation: 'Reports' },
  { screen: 32, id: 'settings', path: '/buyer/settings', title: 'Settings & Preferences', feature: 'settings', permission: 'buyer.settings.manage', navigation: 'Settings' }
];
export const screenRoute = (screen: number) => BuyerRoute.find(r => r.screen === screen);
export const SellerRoute: RouteDefinition[] = [
  { screen: 1, id: 'seller-dashboard', path: '/seller/dashboard', title: 'Seller Dashboard', feature: 'dashboard', permission: 'seller.dashboard.view', navigation: 'Dashboard' },
  { screen: 2, id: 'seller-capabilities', path: '/seller/capabilities', title: 'Seller Capabilities', feature: 'capabilities', permission: 'seller.capability.view', navigation: 'Capabilities' },
  { screen: 3, id: 'seller-basic-new', path: '/seller/capabilities/new/basic', title: 'Basic Information', feature: 'capabilities', permission: 'seller.capability.create' },
  { screen: 3.5, id: 'seller-basic-edit', path: '/seller/capabilities/:id/basic', title: 'Basic Information', feature: 'capabilities', permission: 'seller.capability.update' },
  { screen: 4, id: 'seller-classification', path: '/seller/capabilities/:id/classification', title: 'Classification', feature: 'capabilities', permission: 'seller.capability.update' },
  { screen: 5, id: 'seller-suggestions', path: '/seller/capabilities/:id/suggestions', title: 'Suggestions', feature: 'capabilities', permission: 'seller.capability.update' },
  { screen: 6, id: 'seller-technical', path: '/seller/capabilities/:id/technical', title: 'Technical Details', feature: 'capabilities', permission: 'seller.capability.update' },
  { screen: 7, id: 'seller-quality', path: '/seller/capabilities/:id/quality', title: 'Quality & Compliance', feature: 'capabilities', permission: 'seller.capability.update' },
  { screen: 8, id: 'seller-operations', path: '/seller/capabilities/:id/operations', title: 'Operations & Capacity', feature: 'capabilities', permission: 'seller.capability.update' },
  { screen: 9, id: 'seller-commercial', path: '/seller/capabilities/:id/commercial', title: 'Commercial & Service Area', feature: 'capabilities', permission: 'seller.capability.update' },
  { screen: 10, id: 'seller-review', path: '/seller/capabilities/:id/review', title: 'Review & Submit', feature: 'capabilities', permission: 'seller.capability.publish' },
  { screen: 8, id: 'seller-opportunities', path: '/seller/opportunities', title: 'Matching Opportunities', feature: 'opportunities', permission: 'seller.opportunity.view', navigation: 'Opportunities' },
  { screen: 9, id: 'seller-opportunity-detail', path: '/seller/opportunities/:id', title: 'Opportunity Detail & Express Interest', feature: 'opportunities', permission: 'seller.opportunity.view' },
  { screen: 10, id: 'seller-invitation', path: '/seller/opportunities/:id/invitation', title: 'Buyer Shortlist / Invitation', feature: 'engagements', permission: 'seller.engagement.respond' },
  { screen: 11, id: 'seller-meetings', path: '/seller/meetings', title: 'Meetings', feature: 'meetings', permission: 'seller.meeting.view', navigation: 'Meetings' },
  { screen: 111, id: 'seller-meeting-detail', path: '/seller/meetings/:meetingId', title: 'Meeting Detail & Pre-Meeting Brief', feature: 'meetings', permission: 'seller.meeting.view' },
  { screen: 112, id: 'seller-meeting-checkin', path: '/seller/meetings/:meetingId/check-in', title: 'QR Check-In & Start Meeting', feature: 'meetings', permission: 'seller.meeting.checkin' },
  { screen: 113, id: 'seller-meeting-live', path: '/seller/meetings/:meetingId/live', title: 'Meeting in Progress — Notes & Feedback', feature: 'meetings', permission: 'seller.meeting.manage' },
  { screen: 114, id: 'seller-meeting-outcome', path: '/seller/meetings/:meetingId/outcome', title: 'Post-Meeting Outcome & Next Actions', feature: 'meetings', permission: 'seller.meeting.outcome' },
  { screen: 114.5, id: 'seller-meeting-outcomes', path: '/seller/meeting-outcomes', title: 'Meeting Outcomes', feature: 'meetings', permission: 'seller.meeting.view', navigation: 'Meeting Outcomes' },
  { screen: 12, id: 'seller-rfqs', path: '/seller/rfqs', title: 'RFQ / Quotation Submission', feature: 'rfqs', permission: 'seller.rfq.view', navigation: 'RFQs' },
  { screen: 13, id: 'seller-negotiations', path: '/seller/negotiations', title: 'Negotiation & Follow-up', feature: 'negotiations', permission: 'seller.negotiation.view' },
  { screen: 14, id: 'seller-awards', path: '/seller/awards', title: 'Award / Closure', feature: 'awards', permission: 'seller.award.view', navigation: 'Awards' },
  { screen: 15, id: 'seller-reports', path: '/seller/reports', title: 'Reports & Analytics', feature: 'reports', permission: 'seller.report.view', navigation: 'Reports' },
  { screen: 16, id: 'seller-settings', path: '/seller/settings', title: 'Settings & Preferences', feature: 'settings', permission: 'seller.settings.manage', navigation: 'Settings' }
];