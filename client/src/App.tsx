import { Switch, Route } from "wouter";
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
            <Route path="/rules" component={Compliance} />
            <Route path="/notifications" component={Dashboard} />
            <Route path="/settings" component={Dashboard} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Landing />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
