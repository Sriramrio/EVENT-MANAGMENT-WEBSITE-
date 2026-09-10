import { createBrowserRouter, Navigate } from "react-router-dom";
import { PERMISSIONS } from "../config/permissions";
import { LoginPage } from "../features/auth/LoginPage";
import { PublicBookingPage } from "../features/public/PublicBookingPage";
import { PublicBookingSuccessPage } from "../features/public/PublicBookingSuccessPage";
import { AdminShell } from "./layout/AdminShell";
import { AuthGuard } from "./guards/AuthGuard";
import { PermissionGuard } from "./guards/PermissionGuard";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { BookingListPage } from "../features/bookings/BookingListPage";
import { BookingDetailPage } from "../features/bookings/BookingDetailPage";
import { StallAllocationPage } from "../features/stalls/StallAllocationPage";
import { StallMasterPage } from "../features/stalls/StallMasterPage";
import { PaymentQueuePage } from "../features/payments/PaymentQueuePage";
import { PaymentDetailPage } from "../features/payments/PaymentDetailPage";
import { InvoiceQueuePage } from "../features/invoices/InvoiceQueuePage";
import { InvoiceDetailPage } from "../features/invoices/InvoiceDetailPage";
import { ProformaInvoicePreviewPage } from "../features/invoices/ProformaInvoicePreviewPage";
import { AuditLogPage } from "../features/audit/AuditLogPage";
import { UserManagementPage } from "../features/admin/pages/UserManagementPage";
import { RoleManagementPage } from "../features/admin/pages/RoleManagementPage";
import { PermissionMatrixPage } from "../features/admin/pages/PermissionMatrixPage";
import { EventSettingsPage } from "../features/admin/pages/EventSettingsPage";
import { EmailTemplatePage } from "../features/admin/pages/EmailTemplatePage";
import { AdminMarketplaceUsersPage } from "../features/admin/pages/AdminMarketplaceUsersPage";
import { AdminMarketplaceRequirementsPage } from "../features/admin/pages/AdminMarketplaceRequirementsPage";
import { ForbiddenPage } from "./errors/ForbiddenPage";
import { NotFoundPage } from "./errors/NotFoundPage";
import { RouteErrorBoundary } from "./errors/RouteErrorBoundary";
import { StallReservationAllactionPage } from "../features/stalls/StallReservationMap";
import { AdminBulkBookingPage } from "../features/public/AdminBulkUploadBooking";
import { EditBookingPage } from "../features/public/EditBookingPage";
import { SponsorStallsPage } from "../features/stalls/SponsorstallPage";
import { VisitorBookingPage } from "../features/public/VisitorBookingPage";
import { VisitorVerificationPage } from "../features/public/VisitorVerificationScreen";
import { BookingReport } from "../features/bookings/BookingReport";
import { PaymentSummaryPage } from "../features/payments/PaymentTracking";
import { QrShell } from "./layout/QrPortalShell";
import { VoluntariarRegistration } from "../features/public/voluntariarForm";
import { OrganizerRegistration } from "../features/public/OrganizerRegistration";
import { BuyerRegistration } from "../features/public/BuyerRegistration";
import ScannerScreen from "../features/qrPortal/ScannerScreen/ScannerScreen";
import { SellerRegistration } from "../features/public/SellerRegistration";
import {
  BuyerPublicRegistration,
  SellerPublicRegistration,
} from "../features/public/marketplace/PublicOrgRegistration";
import { VisitorShell } from "./layout/VisitorShell";
import { VisitorDashboard } from "../features/VisitorPortal/VisitorDashboard/VisitorDashboard";
import { VisitorList } from "../features/VisitorPortal/VisitorReport/Visitors";
import PresentVisitorsGrid from "../features/qrPortal/ScannerScreen/PresentVisitorGrid";
import { VipVisitorRegistration } from "../features/public/VipRegistration";
import { VipShell } from "./layout/VipShell";
import { VipDashboard } from "../features/VipPortal/VipDashboard/VipDashboard";
import { VipListScreen } from "../features/VipPortal/VipList/VipList";
// import { LandingPage } from '../features/BuyerAndSeller/LandingScreen';
import { ScreenRoleSelection } from "../features/BuyerAndSeller/RoleSelection/RoleSelection";
import { ScreenOrgRegistration } from "../features/BuyerAndSeller/Buyer/OrganizationBuyer/OrganizationBuyer";
import RoleSelectionPage from "../features/BuyerAndSeller/BuyerFeature/role-selection/RoleSelectionPage";
import OrganisationPage from "../features/BuyerAndSeller/BuyerFeature/buyer-onboarding/OrganisationPage";
import ContactPage from "../features/BuyerAndSeller/BuyerFeature/buyer-onboarding/ContactPage";
import RequirementBasicPage from "../features/BuyerAndSeller/BuyerFeature/requirements/RequirementBasicPage";
import RequirementClassificationPage from "../features/BuyerAndSeller/BuyerFeature/requirements/RequirementClassificationPage";
import RequirementSuggestionsPage from "../features/BuyerAndSeller/BuyerFeature/requirements/RequirementSuggestionsPage";
import RequirementProcessesPage from "../features/BuyerAndSeller/BuyerFeature/requirements/RequirementProcessesPage";
import RequirementMaterialsQualityPage from "../features/BuyerAndSeller/BuyerFeature/requirements/RequirementMaterialsQualityPage";
import RequirementOperationsQuantityPage from "../features/BuyerAndSeller/BuyerFeature/requirements/RequirementOperationsQuantityPage";
import RequirementDeliveryCommercialPage from "../features/BuyerAndSeller/BuyerFeature/requirements/RequirementDeliveryCommercialPage";
import ProductDetailsPage from "../features/BuyerAndSeller/BuyerFeature/requirements/ProductDetailsPage";
import TechnicalQualityPage from "../features/BuyerAndSeller/BuyerFeature/requirements/TechnicalQualityPage";
import CommercialReviewPage from "../features/BuyerAndSeller/BuyerFeature/requirements/CommercialReviewPage";
import ReviewPublishPage from "../features/BuyerAndSeller/BuyerFeature/requirements/ReviewPublishPage";
import { BuyerPortalLayout } from "./layout/BuyerPortalLayout";
import DashboardPageBuyer from "../features/BuyerAndSeller/BuyerFeature/dashboard/DashboardPage";
import RequirementsPage from "../features/BuyerAndSeller/BuyerFeature/requirements/RequirementsPage";
import RequirementSummaryPage from "../features/BuyerAndSeller/BuyerFeature/matchmaking/RequirementSummaryPage";
import MatchedSuppliersPage from "../features/BuyerAndSeller/BuyerFeature/matchmaking/MatchedSuppliersPage";
import SupplierProfilePage from "../features/BuyerAndSeller/BuyerFeature/suppliers/SupplierProfilePage";
import SupplierActionPage from "../features/BuyerAndSeller/BuyerFeature/shortlist/SupplierActionPage";
import MessagesPage from "../features/BuyerAndSeller/BuyerFeature/messages/MessagesPage";
import MeetingsPage from "../features/BuyerAndSeller/BuyerFeature/meetings/MeetingsPage";
import ScheduleMeetingPage from "../features/BuyerAndSeller/BuyerFeature/meetings/ScheduleMeetingPage";
import MeetingDetailPage from "../features/BuyerAndSeller/BuyerFeature/meetings/MeetingDetailPage";
import MeetingCheckInPage from "../features/BuyerAndSeller/BuyerFeature/meetings/MeetingCheckInPage";
import MeetingLivePage from "../features/BuyerAndSeller/BuyerFeature/meetings/MeetingLivePage";
import MeetingOutcomePage from "../features/BuyerAndSeller/BuyerFeature/meetings/MeetingOutcomePage";
import MeetingOutcomesPage from "../features/BuyerAndSeller/BuyerFeature/meetings/MeetingOutcomesPage";
import ActionsPage from "../features/BuyerAndSeller/BuyerFeature/actions/ActionsPage";
import RfqsPage from "../features/BuyerAndSeller/BuyerFeature/rfqs/RfqsPage";
import CreateRfqPage from "../features/BuyerAndSeller/BuyerFeature/rfqs/CreateRfqPage";
import SamplesPage from "../features/BuyerAndSeller/BuyerFeature/samples/SamplesPage";
import QualificationPage from "../features/BuyerAndSeller/BuyerFeature/supplier-qualification/QualificationPage";
import EvaluationPage from "../features/BuyerAndSeller/BuyerFeature/supplier-evaluation/EvaluationPage";
import OnboardingPage from "../features/BuyerAndSeller/BuyerFeature/vendor-onboarding/OnboardingPage";
import AuditsPage from "../features/BuyerAndSeller/BuyerFeature/audits/AuditsPage";
import NegotiationsPage from "../features/BuyerAndSeller/BuyerFeature/negotiations/NegotiationsPage";
import PurchaseOrdersPage from "../features/BuyerAndSeller/BuyerFeature/purchase-orders/PurchaseOrdersPage";
import BusinessImpactPage from "../features/BuyerAndSeller/BuyerFeature/business-impact/BusinessImpactPage";
import ReportsPage from "../features/BuyerAndSeller/BuyerFeature/reports/ReportsPage";
import SettingsPage from "../features/BuyerAndSeller/BuyerFeature/settings/SettingsPage";
import LandingPage from "../features/BuyerAndSeller/BuyerFeature/landing/LandingPage";
import { PropsWithChildren } from "react";
import { useBuyerSession } from "../services/buyer/hooks";
import { ErrorState, LoadingState } from "../components/ui/PageStates";
import { ShieldX } from "lucide-react";
import { BuyerOnboardingLayout } from "./layout/BuyerOnboardingLayout";

import { ExhibitorDashboardPage } from "../features/ExhibitorPortal/ExhibitorDashboardPage";
import { StallProfilePage } from "../features/public/StallProfilePage";
import { StallQrGeneratorPage } from "../features/bookings/StallQrGeneratorPage";
import { SellerPortalLayout } from "./layout/SellerPortalLayout";
import SellerDashboardPage from "../features/BuyerAndSeller/SellerFeature/dashboard/SellerDashboardPage";
import CapabilitiesPage from "../features/BuyerAndSeller/SellerFeature/capabilities/CapabilitiesPage";
import {
  CapabilityBasicPage,
  CapabilityClassificationPage,
  CapabilitySuggestionsPage,
  CapabilityCommercialPage,
  CapabilityReviewPage,
  CapabilityTechnicalPage,
  CapabilityQualityPage,
  CapabilityOperationsPage,
} from "../features/BuyerAndSeller/SellerFeature/capabilities/CapabilityWizardPages";
import {
  AwardsPage as SellerAwardsPage,
  InvitationPage as SellerInvitationPage,
  OpportunitiesPage as SellerOpportunitiesPage,
  OpportunityDetailPage as SellerOpportunityDetailPage,
  StaticJourneyPage as SellerStaticJourneyPage,
} from "../features/BuyerAndSeller/SellerFeature/journey/SellerJourneyPages";
import SellerRfqsPage from "../features/BuyerAndSeller/SellerFeature/rfqs/SellerRfqsPage";
import SellerMeetingsPage from "../features/BuyerAndSeller/SellerFeature/meetings/SellerMeetingsPage";
import SellerMeetingDetailPage from "../features/BuyerAndSeller/SellerFeature/meetings/SellerMeetingDetailPage";
import SellerMeetingCheckInPage from "../features/BuyerAndSeller/SellerFeature/meetings/SellerMeetingCheckInPage";
import SellerMeetingLivePage from "../features/BuyerAndSeller/SellerFeature/meetings/SellerMeetingLivePage";
import SellerMeetingOutcomePage from "../features/BuyerAndSeller/SellerFeature/meetings/SellerMeetingOutcomePage";
import SellerMeetingOutcomesPage from "../features/BuyerAndSeller/SellerFeature/meetings/SellerMeetingOutcomesPage";
import { VipVerificationPage } from "../features/VipPortal/VipVerfication/VipVerification";
import SellerMessagesPage from "../features/BuyerAndSeller/SellerFeature/messages/SellerMessages";
import ShortlistedSuppliersPage from "../features/BuyerAndSeller/BuyerFeature/shortlist/ShortlistedSupplierPage";
import SellerSettingsPage from "../features/BuyerAndSeller/SellerFeature/settings/SettingsPage";
import { ExhibitorAuthGuard } from "./guards/ExhibitorAuthGuard";
import { ExhibitorProfilePage } from "../features/ExhibitorPortal/ExhibitorProfilePage";
import { VisitorProfilePage } from "../features/VisitorPortal/VisitorProfilePage";
import { ExhibitorShell } from "./layout/ExhibitorShell";
import { ExhibitorDashboard } from "../features/ExhibitorPortal/ExhibitorDashboard";
import { ExhibitorInterestsPage } from "../features/ExhibitorPortal/ExhibitorInterestsPage";
import { ExhibitorStallQrPage } from "../features/ExhibitorPortal/ExhibitorStallQrPage";
import { ExhibitorECardPage } from "../features/ExhibitorPortal/ExhibitorECardPage";
import { ExhibitorSendEmailPage } from "../features/ExhibitorPortal/ExhibitorSendEmailPage";
import { ExhibitorEmailLogsPage } from "../features/ExhibitorPortal/ExhibitorEmailLogsPage";
import { VisitorAuthGuard } from "./guards/VisitorAuthGuard";
import VisitorPassPage from "../features/public/VisitorPassPage";
import { VisitorScannerPage } from "../features/public/VisitorScannerPage";
import { VisitorConnectionsPage } from "../features/public/VisitorConnectionsPage";
import ClickablePosterCard from "../features/public/VisitorBanner";
import { ExhibitorAdditionalRequirementsPage } from "../features/ExhibitorPortal/ExhibitorAdditionalRequirementsPage";
import { ExhibitorMyRequirementRequestsPage } from "../features/ExhibitorPortal/ExhibitorMyRequirementRequestsPage";
import { ExhibitorScannerPage } from "../features/ExhibitorPortal/ExhibitorScannerPage";
import { ExhibitorConnectionsPage } from "../features/ExhibitorPortal/ExhibitorConnectionsPage";
import { ExhibitorRequirementsPage } from "../features/admin/pages/ExhibitorRequirementsPage";
import { useSession } from "./session";
import AdminExhibitorListPage from "../features/admin/pages/AdminExhibitorListPage";
import LogoManagerPage from "../features/admin/pages/LogoManagerPage";

const TENANTID = "11111111-1111-1111-1111-111111111111";
const EVENTID = "22222222-2222-2222-2222-222222222222";

function AdminIndexRedirect() {
  const user = useSession((state) => state.user);
  if (user?.roleCode === "BuyerAdmin") {
    return <Navigate to="/app/admin/buyers" replace />;
  }
  if (user?.roleCode === "SellerAdmin") {
    return <Navigate to="/app/admin/sellers" replace />;
  }
  if (user?.roleCode === "ExhibitorAdmin") {
    return <Navigate to="/app/admin/exhibitor-requirements" replace />;
  }
  if (user?.roleCode === "StallAllocationAdmin") {
    return <Navigate to="/app/stall-allocation" replace />;
  }
  if (user?.roleCode === "PaymentVerifier") {
    return <Navigate to="/app/payments" replace />;
  }
  if (user?.roleCode === "ProformaInvoicePreparer") {
    return <Navigate to="/app/invoices" replace />;
  }
  return <Navigate to="/app/dashboard" replace />;
}
export function PermissionBoundary({
  children,
}: PropsWithChildren<{ permission?: string }>) {
  const q = useBuyerSession();
  if (q.isLoading)
    return <LoadingState label="Checking Buyer workspace permissions…" />;
  if (q.isError)
    return <ErrorState error={q.error} retry={() => q.refetch()} />;
  return children;
}

const P = ({
  permission,
  children,
}: {
  permission?: string;
  children: React.ReactNode;
}) => (
  //@ts-ignore
  <PermissionBoundary permission={permission}>{children}</PermissionBoundary>
);
export const router = createBrowserRouter([
  //{ path: '/', element: <Navigate to="/login" replace /> },
  //   <Route
  //   path="/stall-booking/:bookingId"
  //   element={<PublicBookingPage />}
  // />
  {
    path: "/stall-booking",
    element: <PublicBookingPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/stall-booking/success/:bookingRegistrationNumber",
    element: <PublicBookingSuccessPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <RouteErrorBoundary />,
  },
  { path: "/forbidden", element: <ForbiddenPage /> },
  { path: "/stall-booking/:bookingId", element: <EditBookingPage /> },
  { path: "/visitorbanner", element: <ClickablePosterCard /> },
  {
    path: "/stall/:registrationNumber",
    element: <StallProfilePage />,
    errorElement: <RouteErrorBoundary />,
  },

  {
    path: "/exhibitor/dashboard",
    element: <ExhibitorDashboardPage />,
    errorElement: <RouteErrorBoundary />,
  },
  { path: "/visitor", element: <VisitorBookingPage /> },
  {
    path: "/visitorverification/:registrationNumber",
    element: <VisitorVerificationPage />,
  },
  {
    path: "/vipverification/:registrationNumber",
    element: <VipVerificationPage />,
    errorElement: <RouteErrorBoundary />,
  },
  { path: "/vip-visitor", element: <VipVisitorRegistration /> },
  { path: "/landing", element: <LandingPage /> },
  { path: "/role-selection", element: <RoleSelectionPage /> },
  { path: "/organization", element: <ScreenOrgRegistration /> },

  // Public, unauthenticated Buyer/Seller self-registration — no login/permission needed to fill
  // these. On success the backend emails login credentials so the user can sign in afterwards.
  {
    path: "/buyer/register",
    element: <BuyerPublicRegistration />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/seller/register",
    element: <SellerPublicRegistration />,
    errorElement: <RouteErrorBoundary />,
  },

  { path: "/role-selection", element: <RoleSelectionPage /> },
  // { element:<BuyerOnboardingLayout/>},
  // {
  //   path: "/buyer/onboarding/organisation", element: <P permission="buyer.organisation.update">
  //     <OrganisationPage /></P>
  // },
  {
    path: "/buyer/onboarding",
    element: <BuyerOnboardingLayout />, // Uncomment if using layout
    children: [
      {
        path: "organisation",
        element: (
          <P permission="buyer.organisation.update">
            <OrganisationPage />
          </P>
        ),
      },
      {
        path: "contact",
        element: (
          <P permission="buyer.organisation.update">
            <ContactPage />
          </P>
        ),
      },
    ],
  },
  {
    path: "/buyer",
    element: <BuyerPortalLayout />,
    children: [
      {
        path: "requirements",
        children: [
          {
            index: true,
            element: (
              <P permission="buyer.requirement.create">
                <RequirementsPage />
              </P>
            ),
          },
          {
            path: "new/basic",
            element: (
              <P permission="buyer.requirement.create">
                <RequirementBasicPage />
              </P>
            ),
          },
          {
            path: ":id/basic",
            element: (
              <P permission="buyer.requirement.create">
                <RequirementBasicPage />
              </P>
            ),
          },
          {
            path: ":id/classification",
            element: (
              <P permission="buyer.requirement.create">
                <RequirementClassificationPage />
              </P>
            ),
          },
          {
            path: ":id/suggestions",
            element: (
              <P permission="buyer.requirement.create">
                <RequirementSuggestionsPage />
              </P>
            ),
          },
          {
            path: ":id/processes",
            element: (
              <P permission="buyer.requirement.create">
                <RequirementProcessesPage />
              </P>
            ),
          },
          {
            path: ":id/materials-quality",
            element: (
              <P permission="buyer.requirement.create">
                <RequirementMaterialsQualityPage />
              </P>
            ),
          },
          {
            path: ":id/operations-quantity",
            element: (
              <P permission="buyer.requirement.create">
                <RequirementOperationsQuantityPage />
              </P>
            ),
          },
          {
            path: ":id/delivery-commercial",
            element: (
              <P permission="buyer.requirement.create">
                <RequirementDeliveryCommercialPage />
              </P>
            ),
          },
          {
            path: ":id/review",
            element: (
              <P permission="buyer.requirement.submit">
                <ReviewPublishPage />
              </P>
            ),
          },
          {
            path: ":id/summary",
            element: (
              <P permission="buyer.matches.view">
                <RequirementSummaryPage />
              </P>
            ),
          },
          {
            path: ":id/matches",
            element: (
              <P permission="buyer.matches.view">
                <MatchedSuppliersPage />
              </P>
            ),
          },
        ],
      },
      {
        path: "contacts",
        element: (
          <P permission="buyer.organisation.update">
            <ContactPage />
          </P>
        ),
      },
      {
        path: "dashboard",
        element: (
          <P permission="buyer.dashboard.view">
            <DashboardPageBuyer />
          </P>
        ),
      },
      {
        path: "meetings",
        element: (
          <P permission="buyer.meeting.view">
            <MeetingsPage />
          </P>
        ),
      },
      {
        path: "meetings/new",
        element: (
          <P permission="buyer.meeting.request">
            <ScheduleMeetingPage />
          </P>
        ),
      },
      {
        path: "meetings/:meetingId",
        element: (
          <P permission="buyer.meeting.view">
            <MeetingDetailPage />
          </P>
        ),
      },
      {
        path: "meetings/:meetingId/check-in",
        element: (
          <P permission="buyer.meeting.checkin">
            <MeetingCheckInPage />
          </P>
        ),
      },
      {
        path: "meetings/:meetingId/live",
        element: (
          <P permission="buyer.meeting.notes">
            <MeetingLivePage />
          </P>
        ),
      },
      {
        path: "meetings/:meetingId/outcome",
        element: (
          <P permission="buyer.meeting.outcome">
            <MeetingOutcomePage />
          </P>
        ),
      },
      {
        path: "meeting-outcomes",
        element: (
          <P permission="buyer.meeting.view">
            <MeetingOutcomesPage />
          </P>
        ),
      },
      {
        path: "actions",
        element: (
          <P permission="buyer.action.manage">
            <ActionsPage />
          </P>
        ),
      },
      {
        path: "rfqs/new",
        element: (
          <P permission="buyer.rfq.create">
            <CreateRfqPage />
          </P>
        ),
      },
      {
        path: "rfqs",
        element: (
          <P permission="buyer.rfq.view">
            <RfqsPage />
          </P>
        ),
      },
      {
        path: "samples",
        element: (
          <P permission="buyer.qualification.view">
            <SamplesPage />
          </P>
        ),
      },
      {
        path: "supplier-qualification",
        element: (
          <P permission="buyer.qualification.view">
            <QualificationPage />
          </P>
        ),
      },
      {
        path: "supplier-evaluations",
        element: (
          <P permission="buyer.evaluation.create">
            <EvaluationPage />
          </P>
        ),
      },
      {
        path: "vendor-onboarding",
        element: (
          <P permission="buyer.vendor_onboarding.view">
            <OnboardingPage />
          </P>
        ),
      },
      {
        path: "audits",
        element: (
          <P permission="buyer.audit.view">
            <AuditsPage />
          </P>
        ),
      },
      {
        path: "negotiations",
        element: (
          <P permission="buyer.negotiation.view">
            <NegotiationsPage />
          </P>
        ),
      },
      {
        path: "purchase-orders",
        element: (
          <P permission="buyer.purchase_order.view">
            <PurchaseOrdersPage />
          </P>
        ),
      },
      {
        path: "impact",
        element: (
          <P permission="buyer.report.view">
            <BusinessImpactPage />
          </P>
        ),
      },
      {
        path: "reports",
        element: (
          <P permission="buyer.report.view">
            <ReportsPage />
          </P>
        ),
      },
      {
        path: "settings",
        element: (
          <P permission="buyer.settings.manage">
            <SettingsPage />
          </P>
        ),
      },
      {
        path: "requirements/:id/matches",
        element: (
          <P permission="buyer.matches.view">
            <MatchedSuppliersPage />
          </P>
        ),
      },
      {
        path: "suppliers/:supplierId",
        element: (
          <P permission="buyer.supplier.view">
            <SupplierProfilePage />
          </P>
        ),
      },
      {
        path: "requirements/:id/suppliers/:supplierId/action",
        element: (
          <P permission="buyer.shortlist.manage">
            <SupplierActionPage />
          </P>
        ),
      },
      {
        path: "shortlist",
        element: (
          <P permission="buyer.shortlist.manage">
            <ShortlistedSuppliersPage />
          </P>
        ),
      },
      {
        path: "messages",
        element: (
          <P permission="buyer.engagement.view">
            <MessagesPage />
          </P>
        ),
      },
      // ... remaining /buyer routes (meetings, suppliers, rfqs, etc.)
    ],
  },

  // --- Buyer Portal Routes ---
  // {
  //   path: '/buyer',
  //   element: <BuyerPortalLayout />,
  //   children: [
  //     {
  //       path: 'dashboard',
  //       element: (
  //         <P permission="buyer.dashboard.view">
  //           <DashboardPageBuyer />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'requirements',
  //       element: (
  //         <P permission="buyer.requirement.create">
  //           <RequirementsPage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'requirements/:id/summary',
  //       element: (
  //         <P permission="buyer.matches.view">
  //           <RequirementSummaryPage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'requirements/:id/matches',
  //       element: (
  //         <P permission="buyer.matches.view">
  //           <MatchedSuppliersPage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'suppliers/:supplierId',
  //       element: (
  //         <P permission="buyer.supplier.view">
  //           <SupplierProfilePage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'requirements/:id/suppliers/:supplierId/action',
  //       element: (
  //         <P permission="buyer.shortlist.manage">
  //           <SupplierActionPage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'meetings',
  //       element: (
  //         <P permission="buyer.meeting.view">
  //           <MeetingsPage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'meetings/new',
  //       element: (
  //         <P permission="buyer.meeting.request">
  //           <ScheduleMeetingPage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'meetings/:meetingId',
  //       element: (
  //         <P permission="buyer.meeting.view">
  //           <MeetingDetailPage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'meetings/:meetingId/check-in',
  //       element: (
  //         <P permission="buyer.meeting.checkin">
  //           <MeetingCheckInPage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'meetings/:meetingId/live',
  //       element: (
  //         <P permission="buyer.meeting.notes">
  //           <MeetingLivePage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'meetings/:meetingId/outcome',
  //       element: (
  //         <P permission="buyer.meeting.outcome">
  //           <MeetingOutcomePage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'actions',
  //       element: (
  //         <P permission="buyer.action.manage">
  //           <ActionsPage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'rfqs',
  //       element: (
  //         <P permission="buyer.rfq.view">
  //           <RfqsPage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'samples',
  //       element: (
  //         <P permission="buyer.qualification.view">
  //           <SamplesPage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'supplier-qualification',
  //       element: (
  //         <P permission="buyer.qualification.view">
  //           <QualificationPage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'supplier-evaluations',
  //       element: (
  //         <P permission="buyer.evaluation.create">
  //           <EvaluationPage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'vendor-onboarding',
  //       element: (
  //         <P permission="buyer.vendor_onboarding.view">
  //           <OnboardingPage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'audits',
  //       element: (
  //         <P permission="buyer.audit.view">
  //           <AuditsPage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'negotiations',
  //       element: (
  //         <P permission="buyer.negotiation.view">
  //           <NegotiationsPage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'purchase-orders',
  //       element: (
  //         <P permission="buyer.purchase_order.view">
  //           <PurchaseOrdersPage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'impact',
  //       element: (
  //         <P permission="buyer.report.view">
  //           <BusinessImpactPage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'reports',
  //       element: (
  //         <P permission="buyer.report.view">
  //           <ReportsPage />
  //         </P>
  //       ),
  //     },
  //     {
  //       path: 'settings',
  //       element: (
  //         <P permission="buyer.settings.manage">
  //           <SettingsPage />
  //         </P>
  //       ),
  //     },
  //   ],
  // },

  {
    path: "/seller",
    element: <SellerPortalLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/seller/dashboard" replace /> },
      { path: "dashboard", element: <SellerDashboardPage /> },
      {
        path: "onboarding/organisation",
        element: (
          <P permission="seller.organisation.update">
            <OrganisationPage />
          </P>
        ),
      },
      {
        path: "contacts",
        element: (
          <P permission="seller.organisation.update">
            <ContactPage />
          </P>
        ),
      },
      { path: "capabilities", element: <CapabilitiesPage /> },
      {
        path: "capabilities/new",
        element: <Navigate to="/seller/capabilities/new/basic" replace />,
      },
      { path: "capabilities/new/basic", element: <CapabilityBasicPage /> },
      { path: "capabilities/:id/basic", element: <CapabilityBasicPage /> },
      { path: "capabilities/:id", element: <Navigate to="review" replace /> },
      {
        path: "capabilities/:id/classification",
        element: <CapabilityClassificationPage />,
      },
      {
        path: "capabilities/:id/suggestions",
        element: <CapabilitySuggestionsPage />,
      },
      {
        path: "capabilities/:id/technical",
        element: <CapabilityTechnicalPage />,
      },
      {
        path: "capabilities/:id/quality",
        element: <CapabilityQualityPage />,
      },
      {
        path: "capabilities/:id/operations",
        element: <CapabilityOperationsPage />,
      },
      {
        path: "capabilities/:id/commercial",
        element: <CapabilityCommercialPage />,
      },
      { path: "capabilities/:id/review", element: <CapabilityReviewPage /> },
      { path: "opportunities", element: <SellerOpportunitiesPage /> },
      { path: "opportunities/:id", element: <SellerOpportunityDetailPage /> },
      {
        path: "opportunities/:id/invitation",
        element: <SellerInvitationPage />,
      },
      { path: "meetings", element: <SellerMeetingsPage /> },
      { path: "meetings/:meetingId", element: <SellerMeetingDetailPage /> },
      {
        path: "meetings/:meetingId/check-in",
        element: <SellerMeetingCheckInPage />,
      },
      { path: "meetings/:meetingId/live", element: <SellerMeetingLivePage /> },
      {
        path: "meetings/:meetingId/outcome",
        element: <SellerMeetingOutcomePage />,
      },
      { path: "meeting-outcomes", element: <SellerMeetingOutcomesPage /> },
      { path: "messages", element: <SellerMessagesPage /> },
      { path: "rfqs", element: <SellerRfqsPage /> },
      {
        path: "negotiations",
        element: <SellerStaticJourneyPage kind="negotiations" />,
      },
      { path: "awards", element: <SellerAwardsPage /> },
      { path: "reports", element: <SellerStaticJourneyPage kind="reports" /> },
      {
        path: "settings",
        element: (
          <P permission="seller.settings.manage">
            <SellerSettingsPage />
          </P>
        ),
      },
    ],
  },
  {
    path: "/app",
    element: <AuthGuard />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AdminShell />,
        children: [
          { index: true, element: <AdminIndexRedirect /> },
          {
            path: "Adminbulkuploadform",
            element: (
              <PermissionGuard
                permission={PERMISSIONS.adminPermissionsManage}
              />
            ),
            children: [{ index: true, element: <AdminBulkBookingPage /> }],
          },
          {
            path: "dashboard",
            element: <PermissionGuard permission={PERMISSIONS.dashboardView} />,
            children: [{ index: true, element: <DashboardPage /> }],
          },
          { path: "paymentsummery", element: <PaymentSummaryPage /> },
          {
            path: "report",
            element: <PermissionGuard permission={PERMISSIONS.dashboardView} />,
            children: [{ index: true, element: <BookingReport /> }],
          },

          {
            path: "bookings",
            element: <PermissionGuard permission={PERMISSIONS.bookingView} />,
            children: [
              { index: true, element: <BookingListPage /> },
              { path: ":bookingId", element: <BookingDetailPage /> },
              { path: ":bookingId/review", element: <BookingDetailPage /> },
            ],
          },
          {
            path: "stall-allocation",
            element: <PermissionGuard permission={PERMISSIONS.stallView} />,
            children: [{ index: true, element: <StallAllocationPage /> }],
          },
          {
            path: "stall-reservation-allocation",
            element: <PermissionGuard permission={PERMISSIONS.stallView} />,
            children: [
              { index: true, element: <StallReservationAllactionPage /> },
            ],
          },
          {
            path: "stalls",
            element: <PermissionGuard permission={PERMISSIONS.stallView} />,
            children: [{ index: true, element: <StallMasterPage /> }],
          },
          {
            path: "sponsorstalls",
            element: <PermissionGuard permission={PERMISSIONS.stallView} />,
            children: [{ index: true, element: <SponsorStallsPage /> }],
          },
          {
            path: "stall-qr",
            element: <PermissionGuard permission={PERMISSIONS.stallView} />,
            children: [{ index: true, element: <StallQrGeneratorPage /> }],
          },
          {
            path: "payments",
            element: <PermissionGuard permission={PERMISSIONS.paymentView} />,
            children: [
              { index: true, element: <PaymentQueuePage /> },
              { path: ":paymentId", element: <PaymentDetailPage /> },
            ],
          },
          {
            path: "invoices",
            element: <PermissionGuard permission={PERMISSIONS.invoiceView} />,
            children: [
              { index: true, element: <InvoiceQueuePage /> },
              { path: ":invoiceId", element: <InvoiceDetailPage /> },
              {
                path: ":invoiceId/preview",
                element: <ProformaInvoicePreviewPage />,
              },
            ],
          },
          {
            path: "audit",
            element: <PermissionGuard permission={PERMISSIONS.auditView} />,
            children: [{ index: true, element: <AuditLogPage /> }],
          },
          {
            path: "admin/users",
            element: (
              <PermissionGuard permission={PERMISSIONS.adminUsersManage} />
            ),
            children: [{ index: true, element: <UserManagementPage /> }],
          },
          {
            path: "admin/roles",
            element: (
              <PermissionGuard permission={PERMISSIONS.adminRolesManage} />
            ),
            children: [{ index: true, element: <RoleManagementPage /> }],
          },
          {
            path: "admin/permissions",
            element: (
              <PermissionGuard
                permission={PERMISSIONS.adminPermissionsManage}
              />
            ),
            children: [{ index: true, element: <PermissionMatrixPage /> }],
          },
          {
            path: "admin/event-settings",
            element: (
              <PermissionGuard permission={PERMISSIONS.adminUsersManage} />
            ),
            children: [{ index: true, element: <EventSettingsPage /> }],
          },
          {
            path: "admin/email-templates",
            element: (
              <PermissionGuard permission={PERMISSIONS.adminUsersManage} />
            ),
            children: [{ index: true, element: <EmailTemplatePage /> }],
          },
          {
            path: "admin/exhibitors",
            element: (
              <PermissionGuard
                permission={PERMISSIONS.exhibitorRequirementsManage}
              />
            ),
            children: [{ index: true, element: <AdminExhibitorListPage /> }],
          },
          {
            path: "admin/logo-manager",
            element: (
              <PermissionGuard
                permission={PERMISSIONS.exhibitorRequirementsManage}
              />
            ),
            children: [{ index: true, element: <LogoManagerPage /> }],
          },
          {
            path: "exhibitors",
            element: (
              <PermissionGuard
                permission={PERMISSIONS.exhibitorRequirementsManage}
              />
            ),
            children: [{ index: true, element: <AdminExhibitorListPage /> }],
          },
          {
            path: "admin/exhibitor-requirements",
            element: (
              <PermissionGuard
                permission={PERMISSIONS.exhibitorRequirementsManage}
              />
            ),
            children: [{ index: true, element: <ExhibitorRequirementsPage /> }],
          },
          {
            path: "exhibitor-requirements",
            element: (
              <PermissionGuard
                permission={PERMISSIONS.exhibitorRequirementsManage}
              />
            ),
            children: [{ index: true, element: <ExhibitorRequirementsPage /> }],
          },
          {
            path: "admin/exhibitor-email-templates",
            element: (
              <PermissionGuard
                permission={PERMISSIONS.exhibitorRequirementsManage}
              />
            ),
            children: [
              { index: true, element: <EmailTemplatePage mode="exhibitor" /> },
            ],
          },
          {
            path: "exhibitor-email-templates",
            element: (
              <PermissionGuard
                permission={PERMISSIONS.exhibitorRequirementsManage}
              />
            ),
            children: [
              { index: true, element: <EmailTemplatePage mode="exhibitor" /> },
            ],
          },
          {
            path: "admin/buyers",
            element: (
              <PermissionGuard permission={PERMISSIONS.buyerAdminManage} />
            ),
            children: [
              {
                index: true,
                element: <AdminMarketplaceUsersPage kind="BUYER" />,
              },
            ],
          },
          {
            path: "admin/buyer-requirements",
            element: (
              <PermissionGuard permission={PERMISSIONS.buyerAdminManage} />
            ),
            children: [
              {
                index: true,
                element: <AdminMarketplaceRequirementsPage kind="BUYER" />,
              },
            ],
          },
          {
            path: "admin/sellers",
            element: (
              <PermissionGuard permission={PERMISSIONS.sellerAdminManage} />
            ),
            children: [
              {
                index: true,
                element: <AdminMarketplaceUsersPage kind="SELLER" />,
              },
            ],
          },
          {
            path: "admin/seller-requirements",
            element: (
              <PermissionGuard permission={PERMISSIONS.sellerAdminManage} />
            ),
            children: [
              {
                index: true,
                element: <AdminMarketplaceRequirementsPage kind="SELLER" />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "/qrshell",
    element: <AuthGuard />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <QrShell />,
        children: [
          { index: true, element: <Navigate to="/QrShell/Visitor" replace /> },
          {
            path: "Scanner",
            element: <PermissionGuard permission={PERMISSIONS.qrPortalView} />,
            children: [{ index: true, element: <ScannerScreen /> }],
          },

          {
            path: "voluntariar",
            element: <PermissionGuard permission={PERMISSIONS.qrPortalView} />,
            children: [{ index: true, element: <VoluntariarRegistration /> }],
          },
          {
            path: "organizer",
            element: <PermissionGuard permission={PERMISSIONS.qrPortalView} />,
            children: [{ index: true, element: <OrganizerRegistration /> }],
          },
          {
            path: "buyer",
            element: <PermissionGuard permission={PERMISSIONS.qrPortalView} />,
            children: [{ index: true, element: <BuyerRegistration /> }],
          },
          {
            path: "seller",
            element: <PermissionGuard permission={PERMISSIONS.qrPortalView} />,
            children: [{ index: true, element: <SellerRegistration /> }],
          },
          {
            path: "Visitor",
            element: <PermissionGuard permission={PERMISSIONS.qrPortalView} />,
            children: [{ index: true, element: <PresentVisitorsGrid /> }],
          },
          {
            path: "vip-visitor",
            element: <PermissionGuard permission={PERMISSIONS.qrPortalView} />,
            children: [{ index: true, element: <VipVisitorRegistration /> }],
          },

          // { path: 'dashboard', element: <PermissionGuard permission={PERMISSIONS.dashboardView} />, children: [{ index: true, element: <DashboardPage /> }] },
        ],
      },
    ],
  },
  {
    path: "/exhibitorShell",
    element: <ExhibitorAuthGuard />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <ExhibitorShell />,
        children: [
          {
            index: true,
            element: <Navigate to="/exhibitorShell/Dashboard" replace />,
          },
          { path: "Dashboard", element: <ExhibitorDashboard /> },
          { path: "Scanner", element: <ExhibitorScannerPage /> },
          { path: "Connections", element: <ExhibitorConnectionsPage /> },
          {
            path: "AdditionalRequirements",
            element: <ExhibitorAdditionalRequirementsPage />,
          },
          {
            path: "MyRequirementRequests",
            element: (
              <Navigate
                to="/exhibitorShell/AdditionalRequirements?tab=history"
                replace
              />
            ),
          },
          { path: "Interests", element: <ExhibitorInterestsPage /> },
          { path: "StallQr", element: <ExhibitorStallQrPage /> },
          { path: "ECard", element: <ExhibitorECardPage /> },
          { path: "ecard", element: <ExhibitorECardPage /> },
          { path: "SendEmail", element: <ExhibitorSendEmailPage /> },
          { path: "send-email", element: <ExhibitorSendEmailPage /> },
          { path: "EmailLogs", element: <ExhibitorEmailLogsPage /> },
          { path: "email-logs", element: <ExhibitorEmailLogsPage /> },
          { path: "Profile", element: <ExhibitorProfilePage /> },
        ],
      },
    ],
  },
  {
    path: "/visitorShell",
    element: <VisitorAuthGuard />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <VisitorShell />,
        children: [
          {
            index: true,
            element: <Navigate to="/visitorShell/Dashboard" replace />,
          },
          {
            path: "Dashboard",
            element: <VisitorDashboard tenantId={TENANTID} eventId={EVENTID} />,
          },
          { path: "Scanner", element: <VisitorScannerPage /> },
          { path: "Connections", element: <VisitorConnectionsPage /> },
          { path: "Pass", element: <VisitorPassPage /> },
          { path: "Profile", element: <VisitorProfilePage /> },
          {
            path: "VisitorList",
            element: (
              <PermissionGuard permission={PERMISSIONS.visitorPortalView} />
            ),
            children: [
              {
                index: true,
                element: <VisitorList tenantId={TENANTID} eventId={EVENTID} />,
              },
            ],
          },
          {
            path: "organizer",
            element: <PermissionGuard permission={PERMISSIONS.qrPortalView} />,
            children: [{ index: true, element: <OrganizerRegistration /> }],
          },
          {
            path: "buyer",
            element: <PermissionGuard permission={PERMISSIONS.qrPortalView} />,
            children: [{ index: true, element: <BuyerRegistration /> }],
          },
          {
            path: "seller",
            element: <PermissionGuard permission={PERMISSIONS.qrPortalView} />,
            children: [{ index: true, element: <SellerRegistration /> }],
          },
        ],
      },
    ],
  },
  {
    path: "/vipShell",
    element: <AuthGuard />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <VipShell />,
        children: [
          {
            index: true,
            element: <Navigate to="/vipShell/Dashboard" replace />,
          },
          {
            path: "Dashboard",
            element: <PermissionGuard permission={PERMISSIONS.vipPortalView} />,
            children: [
              {
                index: true,
                element: <VipDashboard tenantId={TENANTID} eventId={EVENTID} />,
              },
            ],
          },
          {
            path: "list",
            element: <PermissionGuard permission={PERMISSIONS.vipPortalView} />,
            children: [
              {
                index: true,
                element: (
                  <VipListScreen tenantId={TENANTID} eventId={EVENTID} />
                ),
              },
            ],
          },
          {
            path: "VipForm",
            element: <PermissionGuard permission={PERMISSIONS.vipPortalView} />,
            children: [{ index: true, element: <VipVisitorRegistration /> }],
          },

          // { path: 'dashboard', element: <PermissionGuard permission={PERMISSIONS.dashboardView} />, children: [{ index: true, element: <DashboardPage /> }] },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
