import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import CandidateLanding from "@/pages/candidate/landing";
import CandidateSetup from "@/pages/candidate/setup";
import CustomizeInterview from "@/pages/candidate/customize";
import InterviewRoom from "@/pages/candidate/interview-room";
import CodingChallenge from "@/pages/candidate/coding-challenge";
import InterviewResults from "@/pages/candidate/results";
import CandidateHistory from "@/pages/candidate/history";

import EmployerLogin from "@/pages/employer/login";
import EmployerRegister from "@/pages/employer/register";
import EmployerDashboard from "@/pages/employer/dashboard";
import JobProfilesList from "@/pages/employer/job-profiles/list";
import JobProfileCreate from "@/pages/employer/job-profiles/create";
import JobProfileEdit from "@/pages/employer/job-profiles/edit";
import InterviewsList from "@/pages/employer/interviews/list";
import InterviewCreate from "@/pages/employer/interviews/create";
import InterviewDetail from "@/pages/employer/interviews/detail";
import InterviewEdit from "@/pages/employer/interviews/edit";
import SessionReview from "@/pages/employer/interviews/session-review";

import { EmployerLayout } from "@/components/employer-layout";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* CANDIDATE PORTAL */}
      <Route path="/" component={CandidateLanding} />
      <Route path="/interview/customize" component={CustomizeInterview} />
      <Route path="/interview/setup/:interviewId" component={CandidateSetup} />
      <Route path="/interview/:sessionId" component={InterviewRoom} />
      <Route path="/interview/:sessionId/coding" component={CodingChallenge} />
      <Route path="/interview/:sessionId/results" component={InterviewResults} />
      <Route path="/history" component={CandidateHistory} />

      {/* EMPLOYER PORTAL AUTH */}
      <Route path="/employer">
        <Redirect to="/employer/dashboard" />
      </Route>
      <Route path="/employer/login" component={EmployerLogin} />
      <Route path="/employer/register" component={EmployerRegister} />

      {/* EMPLOYER PORTAL PROTECTED */}
      <Route path="/employer/*">
        <EmployerLayout>
          <Switch>
            <Route path="/employer/dashboard" component={EmployerDashboard} />
            <Route path="/employer/job-profiles" component={JobProfilesList} />
            <Route path="/employer/job-profiles/new" component={JobProfileCreate} />
            <Route path="/employer/job-profiles/:id" component={JobProfileEdit} />
            <Route path="/employer/interviews" component={InterviewsList} />
            <Route path="/employer/interviews/new" component={InterviewCreate} />
            <Route path="/employer/interviews/:id/edit" component={InterviewEdit} />
            <Route path="/employer/interviews/:id" component={InterviewDetail} />
            <Route path="/employer/interviews/:id/sessions/:sessionId" component={SessionReview} />
            <Route component={NotFound} />
          </Switch>
        </EmployerLayout>
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
