import { useAuth } from "@workspace/replit-auth-web";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Play } from "lucide-react";

export default function CandidateDashboard() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.firstName || user?.email}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover-elevate transition-all border-2">
          <CardHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
              <Play className="w-6 h-6" />
            </div>
            <CardTitle>Join an Interview</CardTitle>
            <CardDescription>Have an access code from an employer?</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/candidate/interviews">Access Interview</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all border-2">
          <CardHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <CardTitle>Resume Analyzer</CardTitle>
            <CardDescription>Parse your resume and get practice recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/candidate/resume">Analyze Resume</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold tracking-tight mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No recent interview sessions found.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}