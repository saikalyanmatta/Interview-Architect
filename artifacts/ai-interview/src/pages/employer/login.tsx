import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function EmployerLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { data: { email, password } },
      {
        onSuccess: (data: any) => {
          localStorage.setItem("auth_token", data.token);
          setLocation("/employer/dashboard");
        },
        onError: (err: any) => {
          toast({ title: "Login failed", description: err?.message ?? "Invalid credentials.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg mb-4">
            <span className="text-primary font-bold text-sm">AI</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Employer Sign In</h1>
          <p className="text-xs text-muted-foreground mt-1">InterviewAI Employer Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 border border-border rounded-xl p-6 bg-card">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Email</label>
            <input
              data-testid="input-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Password</label>
            <input
              data-testid="input-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <button
            data-testid="button-login"
            type="submit"
            disabled={login.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            {login.isPending ? <Loader2 size={15} className="animate-spin" /> : "Sign in"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-4">
          No account?{" "}
          <Link href="/employer/register" className="text-primary hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
