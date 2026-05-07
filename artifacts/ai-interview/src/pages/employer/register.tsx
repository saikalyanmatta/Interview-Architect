import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function EmployerRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const register = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate(
      { data: { name, email, password, role: "employer" } },
      {
        onSuccess: (data: any) => {
          localStorage.setItem("auth_token", data.token);
          setLocation("/employer/dashboard");
        },
        onError: (err: any) => {
          toast({ title: "Registration failed", description: err?.message ?? "Please try again.", variant: "destructive" });
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
          <h1 className="text-xl font-bold text-foreground">Create Employer Account</h1>
          <p className="text-xs text-muted-foreground mt-1">Start conducting AI-powered interviews</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 border border-border rounded-xl p-6 bg-card">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Full Name</label>
            <input
              data-testid="input-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
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
              placeholder="Min. 8 characters"
              minLength={8}
              required
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <button
            data-testid="button-register"
            type="submit"
            disabled={register.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            {register.isPending ? <Loader2 size={15} className="animate-spin" /> : "Create account"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link href="/employer/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
