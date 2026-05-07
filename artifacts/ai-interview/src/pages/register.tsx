import { useState, useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { useLocation } from "wouter";
import { Brain, Eye, EyeOff, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) setLocation("/");
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await register({ email, password, firstName, lastName });
    setSubmitting(false);
    if (result.error) { setError(result.error); return; }
    setLocation("/");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl mb-4">
            <Brain size={22} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">Create account</h1>
          <p className="text-xs text-muted-foreground">InterviewAI — Candidate and Employer Portal</p>
        </div>

        <div className="border border-border rounded-xl p-6 bg-card">
          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">First name</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name" placeholder="Jane"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Last name</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name" placeholder="Smith"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email" placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="new-password" placeholder="Choose any password"
                  className="w-full px-3 py-2 pr-9 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors" />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground rounded-lg text-sm font-medium transition-colors">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Create account
            </button>
          </form>
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Already have an account?{" "}
          <button onClick={() => setLocation("/login")} className="text-primary hover:underline">Sign in</button>
        </p>
      </div>
    </div>
  );
}
