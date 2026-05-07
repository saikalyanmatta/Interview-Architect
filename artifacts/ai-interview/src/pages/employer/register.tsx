import { useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { useLocation } from "wouter";
import { Loader2, Brain } from "lucide-react";

export default function EmployerRegister() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, login } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/employer/dashboard");
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl mb-6">
          <Brain size={22} className="text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-1">Employer Portal</h1>
        <p className="text-xs text-muted-foreground mb-8">InterviewAI — Create and manage AI-powered interviews</p>

        <div className="border border-border rounded-xl p-6 bg-card">
          <p className="text-sm text-muted-foreground mb-5">
            Sign in with your Replit account to create and manage interviews.
          </p>
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors"
          >
            Sign in with Replit
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Practicing for an interview?{" "}
          <button onClick={() => setLocation("/")} className="text-primary hover:underline">
            Go to candidate portal
          </button>
        </p>
      </div>
    </div>
  );
}
