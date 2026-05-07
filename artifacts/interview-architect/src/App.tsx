import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@workspace/replit-auth-web";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import SelectRole from "@/pages/select-role";
import { AppLayout } from "@/components/layout";

// Imports
import CandidateDashboard from "@/pages/candidate/dashboard";
import CandidateResume from "@/pages/candidate/resume";
import CandidateInterviews from "@/pages/candidate/interviews";
import CandidateSession from "@/pages/candidate/session";
import CandidateSessionCoding from "@/pages/candidate/session-coding";
import CandidateSessionResults from "@/pages/candidate/session-results";

import EmployerDashboard from "@/pages/employer/dashboard";
import EmployerJobProfiles from "@/pages/employer/job-profiles";
import EmployerJobProfileDetail from "@/pages/employer/job-profile-detail";
import EmployerInterviews from "@/pages/employer/interviews";
import EmployerInterviewDetail from "@/pages/employer/interview-detail";
import EmployerSessionDetail from "@/pages/employer/session-detail";

const queryClient = new QueryClient();

// Auth Guard Wrapper
function ProtectedRoute({ component: Component, allowedRole }: { component: any, allowedRole?: "candidate" | "employer" }) {
  const { user, isLoading, login } = useAuth();
  
  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  
  if (!user) {
    login();
    return null;
  }

  if (!user.role) {
    window.location.href = "/select-role";
    return null;
  }

  if (allowedRole && user.role !== allowedRole) {
    window.location.href = user.role === "employer" ? "/employer" : "/candidate";
    return null;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/select-role" component={SelectRole} />
      
      {/* Candidate Routes */}
      <Route path="/candidate">
        {() => <ProtectedRoute component={CandidateDashboard} allowedRole="candidate" />}
      </Route>
      <Route path="/candidate/resume">
        {() => <ProtectedRoute component={CandidateResume} allowedRole="candidate" />}
      </Route>
      <Route path="/candidate/interviews">
        {() => <ProtectedRoute component={CandidateInterviews} allowedRole="candidate" />}
      </Route>
      <Route path="/candidate/session/:id">
        {() => <ProtectedRoute component={CandidateSession} allowedRole="candidate" />}
      </Route>
      <Route path="/candidate/session/:id/coding">
        {() => <ProtectedRoute component={CandidateSessionCoding} allowedRole="candidate" />}
      </Route>
      <Route path="/candidate/session/:id/results">
        {() => <ProtectedRoute component={CandidateSessionResults} allowedRole="candidate" />}
      </Route>

      {/* Employer Routes */}
      <Route path="/employer">
        {() => <ProtectedRoute component={EmployerDashboard} allowedRole="employer" />}
      </Route>
      <Route path="/employer/job-profiles">
        {() => <ProtectedRoute component={EmployerJobProfiles} allowedRole="employer" />}
      </Route>
      <Route path="/employer/job-profiles/:id">
        {() => <ProtectedRoute component={EmployerJobProfileDetail} allowedRole="employer" />}
      </Route>
      <Route path="/employer/interviews">
        {() => <ProtectedRoute component={EmployerInterviews} allowedRole="employer" />}
      </Route>
      <Route path="/employer/interviews/:id">
        {() => <ProtectedRoute component={EmployerInterviewDetail} allowedRole="employer" />}
      </Route>
      <Route path="/employer/sessions/:id">
        {() => <ProtectedRoute component={EmployerSessionDetail} allowedRole="employer" />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
