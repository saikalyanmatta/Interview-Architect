import { useAuth } from "@workspace/replit-auth-web";
import { useGetEmployerStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, FileText, Activity, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function EmployerDashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useGetEmployerStats();

  if (isLoading) {
    return <div className="p-8 flex justify-center">Loading stats...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.firstName || user?.email}</p>
        </div>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link href="/employer/job-profiles">Manage Job Profiles</Link>
          </Button>
          <Button asChild>
            <Link href="/employer/interviews">Manage Interviews</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalInterviews || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.activeInterviews || 0} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.completedSessions || 0} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Profiles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalJobProfiles || 0}</div>
            <p className="text-xs text-muted-foreground">Configured roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Candidate Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgScore ? Math.round(stats.avgScore) : "—"}</div>
            <p className="text-xs text-muted-foreground">Across all completed sessions</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold tracking-tight mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/employer/job-profiles">
            <Card className="hover:border-primary cursor-pointer transition-all group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base group-hover:text-primary transition-colors">Create Job Profile</CardTitle>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm text-muted-foreground">Define a new role and its required skills</p>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/employer/interviews">
            <Card className="hover:border-primary cursor-pointer transition-all group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base group-hover:text-primary transition-colors">Launch Interview</CardTitle>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm text-muted-foreground">Set up a new interview and invite candidates</p>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
