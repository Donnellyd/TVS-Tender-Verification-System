import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Vendors from "@/pages/vendors";
import Tenders from "@/pages/tenders";
import Documents from "@/pages/documents";
import Compliance from "@/pages/compliance";
import Analytics from "@/pages/analytics";
import Municipalities from "@/pages/municipalities";
import Submissions from "@/pages/submissions";
import TenderRequirements from "@/pages/tender-requirements";
import EmailTemplates from "@/pages/email-templates";
import WhatsappTemplates from "@/pages/whatsapp-templates";
import Billing from "@/pages/billing";
import ComplianceRules from "@/pages/compliance-rules";
import ApiSettings from "@/pages/api-settings";
import Pricing from "@/pages/pricing";
import ComplianceExplorer from "@/pages/compliance-explorer";
import Help from "@/pages/help";
import CountryLaunch from "@/pages/country-launch";
import PurchaseSuccess from "@/pages/purchase-success";
import EmailSetup from "@/pages/email-setup";
import { Chatbot } from "@/components/Chatbot";
import { GlobalHelpSearch } from "@/components/GlobalHelpSearch";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { GuidedTour } from "@/components/GuidedTour";
import VendorMessages from "@/pages/vendor-messages";
import AwardManagement from "@/pages/award-management";
import Evaluation from "@/pages/evaluation";
import PanelSession from "@/pages/panel-session";
import VendorVault from "@/pages/vendor-vault";
import TenderClarifications from "@/pages/tender-clarifications";
import BidAnalysis from "@/pages/bid-analysis";
import TenderCalendar from "@/pages/tender-calendar";
import NotificationWorkflows from "@/pages/notification-workflows";
import SpendAnalytics from "@/pages/spend-analytics";
import VendorPerformance from "@/pages/vendor-performance";
import AuditExport from "@/pages/audit-export";
import ReportBuilder from "@/pages/report-builder";
import WhiteLabel from "@/pages/white-label";
import MobilePwa from "@/pages/mobile-pwa";
import PortalRegister from "@/pages/portal-register";
import PortalVerify from "@/pages/portal-verify";
import PortalDashboard from "@/pages/portal-dashboard";
import PortalSubmit from "@/pages/portal-submit";
import PortalSubmissions from "@/pages/portal-submissions";
import PortalMessages from "@/pages/portal-messages";
import PortalAwards from "@/pages/portal-awards";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <Skeleton className="h-12 w-12 rounded-lg mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
        <Skeleton className="h-3 w-48 mx-auto" />
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/vendors" component={Vendors} />
            <Route path="/tenders" component={Tenders} />
            <Route path="/tenders/:id/requirements" component={TenderRequirements} />
            <Route path="/submissions" component={Submissions} />
            <Route path="/documents" component={Documents} />
            <Route path="/compliance" component={Compliance} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/municipalities" component={Municipalities} />
            <Route path="/email-templates" component={EmailTemplates} />
            <Route path="/whatsapp-templates" component={WhatsappTemplates} />
            <Route path="/rules" component={ComplianceRules} />
            <Route path="/country-launch" component={CountryLaunch} />
            <Route path="/billing" component={Billing} />
            <Route path="/api-settings" component={ApiSettings} />
            <Route path="/email-setup" component={EmailSetup} />
            <Route path="/pricing" component={Pricing} />
            <Route path="/compliance-explorer" component={ComplianceExplorer} />
            <Route path="/help" component={Help} />
            <Route path="/vendor-messages" component={VendorMessages} />
            <Route path="/award-management" component={AwardManagement} />
            <Route path="/evaluation" component={Evaluation} />
            <Route path="/panel-sessions" component={PanelSession} />
            <Route path="/vendor-vault" component={VendorVault} />
            <Route path="/tender-clarifications" component={TenderClarifications} />
            <Route path="/bid-analysis" component={BidAnalysis} />
            <Route path="/tender-calendar" component={TenderCalendar} />
            <Route path="/notification-workflows" component={NotificationWorkflows} />
            <Route path="/spend-analytics" component={SpendAnalytics} />
            <Route path="/vendor-performance" component={VendorPerformance} />
            <Route path="/audit-export" component={AuditExport} />
            <Route path="/report-builder" component={ReportBuilder} />
            <Route path="/white-label" component={WhiteLabel} />
            <Route path="/mobile-pwa" component={MobilePwa} />
            <Route path="/notifications" component={Dashboard} />
            <Route path="/settings" component={Dashboard} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </SidebarProvider>
  );
}

function PortalRouter() {
  return (
    <Switch>
      <Route path="/portal" component={PortalRegister} />
      <Route path="/portal/verify" component={PortalVerify} />
      <Route path="/portal/dashboard" component={PortalDashboard} />
      <Route path="/portal/submit" component={PortalSubmit} />
      <Route path="/portal/submissions" component={PortalSubmissions} />
      <Route path="/portal/messages" component={PortalMessages} />
      <Route path="/portal/awards" component={PortalAwards} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (location.startsWith("/portal")) {
    return <PortalRouter />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/pricing" component={Pricing} />
        <Route path="/purchase-success" component={PurchaseSuccess} />
        <Route path="/compliance-explorer" component={ComplianceExplorer} />
        <Route path="/help" component={Help} />
        <Route component={Landing} />
      </Switch>
    );
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <Chatbot />
        <GlobalHelpSearch />
        <KeyboardShortcuts />
        <GuidedTour />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
