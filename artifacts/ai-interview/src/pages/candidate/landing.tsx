import { useState } from "react";
import { useLocation } from "wouter";
import { useCheckCandidateAccess } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, Shield, Mic, Brain } from "lucide-react";

export default function CandidateLanding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [interviewId, setInterviewId] = useState("");
  const [email, setEmail] = useState("");
  const checkAccess = useCheckCandidateAccess();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(interviewId);
    if (isNaN(id)) {
      toast({ title: "Invalid interview ID", variant: "destructive" });
      return;
    }
    checkAccess.mutate(
      { data: { interviewId: id, email } },
      {
        onSuccess: (data) => {
          if (!data.hasAccess) {
            toast({ title: "Access denied", description: "No invitation found for this email address.", variant: "destructive" });
            return;
          }
          setLocation(`/interview/setup/${id}?email=${encodeURIComponent(email)}`);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to verify access. Please try again.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 border border-primary/20 rounded-lg mb-4">
            <Brain size={22} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">InterviewAI</h1>
          <p className="text-muted-foreground mt-1 text-sm">AI-powered interview platform</p>
        </div>

        {/* Features row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Brain, label: "Adaptive Questions" },
            { icon: Mic, label: "Voice-Guided" },
            { icon: Shield, label: "Invite Only" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="border border-border rounded-lg p-3 text-center">
              <Icon size={16} className="text-muted-foreground mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="border border-border rounded-xl p-6 bg-card">
          <h2 className="font-semibold text-foreground mb-1">Enter your interview</h2>
          <p className="text-xs text-muted-foreground mb-5">You need an invitation from the employer to proceed.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Interview ID</label>
              <input
                data-testid="input-interview-id"
                type="number"
                value={interviewId}
                onChange={(e) => setInterviewId(e.target.value)}
                placeholder="e.g. 42"
                required
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Your Email</label>
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

            <button
              data-testid="button-check-access"
              type="submit"
              disabled={checkAccess.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            >
              {checkAccess.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>Continue <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Are you an employer?{" "}
          <a href="/employer/login" className="text-primary hover:underline">Sign in here</a>
        </p>
      </div>
    </div>
  );
}
