import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Brain, Mic, ChevronRight, Loader2, LogIn, Briefcase, Star } from "lucide-react";

interface PublicInterview {
  id: number;
  title: string;
  jobProfileTitle: string;
  difficulty: string;
  interviewerTone: string;
  numBehavioralQuestions: number;
  numTechnicalQuestions: number;
  numCodingQuestions: number;
  skills: string[];
}

export default function CandidateLanding() {
  const [, setLocation] = useLocation();
  const { user, isLoading, isAuthenticated, login } = useAuth();
  const [interviews, setInterviews] = useState<PublicInterview[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLoadingInterviews(true);
      fetch("/api/candidate/interviews", { credentials: "include" })
        .then((r) => r.json())
        .then((data) => setInterviews(Array.isArray(data) ? data : []))
        .catch(() => setInterviews([]))
        .finally(() => setLoadingInterviews(false));
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border border-primary/20 rounded-xl mb-6">
            <Brain size={26} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">InterviewAI</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Practice real AI-powered interviews and get instant feedback to sharpen your skills.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: Brain, label: "Adaptive AI" },
              { icon: Mic, label: "Voice-Guided" },
              { icon: Star, label: "Instant Score" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="border border-border rounded-lg p-3 text-center bg-card">
                <Icon size={16} className="text-primary mx-auto mb-1.5" />
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-semibold transition-colors"
          >
            <LogIn size={16} />
            Sign in to start practicing
          </button>

          <p className="text-xs text-muted-foreground mt-4">
            Are you an employer?{" "}
            <button onClick={() => setLocation("/employer/dashboard")} className="text-primary hover:underline">
              Go to employer portal
            </button>
          </p>
        </div>
      </div>
    );
  }

  const firstName = user?.firstName ?? user?.email?.split("@")[0] ?? "there";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
            <Brain size={14} className="text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground text-sm">InterviewAI</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Hi, {firstName}</span>
          <button
            onClick={() => setLocation("/employer/dashboard")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-md"
          >
            Employer Portal
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground">Practice Interviews</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Choose an interview to practice and get AI-powered feedback on your answers.
          </p>
        </div>

        {loadingInterviews ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-primary" />
          </div>
        ) : interviews.length === 0 ? (
          <div className="border border-border rounded-xl p-10 text-center bg-card">
            <Briefcase size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">No interviews available yet</p>
            <p className="text-sm text-muted-foreground">
              Employers will publish interviews here. Check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {interviews.map((interview) => (
              <button
                key={interview.id}
                onClick={() => setLocation(`/interview/setup/${interview.id}`)}
                className="w-full border border-border rounded-xl p-5 bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground text-sm truncate">{interview.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${
                        interview.difficulty === "easy"
                          ? "border-green-500/30 text-green-400 bg-green-500/10"
                          : interview.difficulty === "hard"
                          ? "border-red-500/30 text-red-400 bg-red-500/10"
                          : "border-yellow-500/30 text-yellow-400 bg-yellow-500/10"
                      }`}>
                        {interview.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{interview.jobProfileTitle}</p>
                    {interview.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {interview.skills.slice(0, 5).map((s) => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground border border-border">
                            {s}
                          </span>
                        ))}
                        {interview.skills.length > 5 && (
                          <span className="text-xs text-muted-foreground">+{interview.skills.length - 5} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="text-xs text-muted-foreground">
                      {1 + interview.numBehavioralQuestions + interview.numTechnicalQuestions} questions
                    </div>
                    {interview.numCodingQuestions > 0 && (
                      <div className="text-xs text-muted-foreground">{interview.numCodingQuestions} coding</div>
                    )}
                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
