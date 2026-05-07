import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import {
  Brain,
  Mic,
  ChevronRight,
  Loader2,
  LogIn,
  Briefcase,
  Star,
  ArrowRight,
  Sparkles,
  FileText,
  LayoutDashboard,
  History,
  LogOut,
  Building2,
} from "lucide-react";

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
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
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
    <div className="min-h-screen bg-[#0d1117] flex flex-col">

      {/* ── Top Nav ── */}
      <header className="bg-[#0d1b2e] border-b border-[#1e3a5f]/60 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <Brain size={16} className="text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground text-base tracking-tight">InterviewAI</span>
        </div>

        <nav className="flex items-center gap-2">
          <button
            onClick={() => setLocation("/interview/customize")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-[#1e3a5f] bg-[#0d1b2e] hover:bg-[#122440] text-sm text-foreground transition-colors"
          >
            <LayoutDashboard size={14} className="text-primary" />
            Dashboard
          </button>
          <button
            onClick={() => {
              const el = document.getElementById("employer-interviews");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-[#1e3a5f] bg-[#0d1b2e] hover:bg-[#122440] text-sm text-foreground transition-colors"
          >
            <History size={14} className="text-primary" />
            History
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors shadow-lg shadow-primary/20"
          >
            <LogOut size={14} />
            Logout
          </button>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="text-center py-16 px-6 bg-gradient-to-b from-[#0d1b2e] to-[#0d1117] border-b border-[#1e3a5f]/40">
        <p className="text-primary text-sm font-medium tracking-widest uppercase mb-3">
          Welcome, {firstName}
        </p>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-3">
          AI-Powered Interview
          <br />
          <span className="text-primary">Evaluation Platform</span>
        </h1>
        <p className="text-[#7a9cc4] text-base max-w-xl mx-auto mb-8">
          Practice with adaptive AI interviews tailored to your skills. Get real-time voice guidance and instant scored feedback.
        </p>
        <button
          onClick={() => setLocation("/interview/customize")}
          className="inline-flex items-center gap-2 px-7 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-bold transition-colors shadow-xl shadow-primary/30"
        >
          <ArrowRight size={16} />
          Start Interview
        </button>
      </section>

      {/* ── Main content ── */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* About the System */}
        <section>
          <div className="rounded-2xl border border-[#1e3a5f] bg-[#0d1b2e] p-7">
            <h2 className="text-lg font-bold text-white mb-3">About the System</h2>
            <p className="text-[#7a9cc4] text-sm leading-relaxed mb-5">
              InterviewAI is an intelligent platform designed to assess candidates through adaptive, data-driven interview analysis.
              The platform generates relevant technical and behavioral questions tailored to your skills, experience, and domain expertise —
              with voice playback, a live coding challenge, and a full scored breakdown at the end.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: FileText, label: "Resume Parsing", desc: "Upload your resume for a personalised question set." },
                { icon: Sparkles, label: "Adaptive AI", desc: "Difficulty adjusts in real-time based on your answers." },
                { icon: Star, label: "Instant Scoring", desc: "Detailed per-answer scores with feedback on completion." },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="rounded-xl border border-[#1e3a5f]/60 bg-[#0d1117]/60 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                      <Icon size={14} className="text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{label}</span>
                  </div>
                  <p className="text-xs text-[#7a9cc4] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Employer Interviews */}
        <section id="employer-interviews">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Employer Interviews</h2>
              <p className="text-[#7a9cc4] text-sm mt-0.5">Interviews published by employers that you can join.</p>
            </div>
          </div>

          {loadingInterviews ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin text-primary" />
            </div>
          ) : interviews.length === 0 ? (
            <div className="rounded-2xl border border-[#1e3a5f] bg-[#0d1b2e] p-10 text-center">
              <Briefcase size={32} className="text-[#7a9cc4] mx-auto mb-3" />
              <p className="text-foreground font-medium mb-1">No employer interviews available yet</p>
              <p className="text-sm text-[#7a9cc4]">Use the "Start Interview" button above to practice on your own.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {interviews.map((interview) => (
                <button
                  key={interview.id}
                  onClick={() => setLocation(`/interview/setup/${interview.id}`)}
                  className="w-full border border-[#1e3a5f] rounded-xl p-5 bg-[#0d1b2e] hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
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
                      <p className="text-xs text-[#7a9cc4] mb-2">{interview.jobProfileTitle}</p>
                      {interview.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {interview.skills.slice(0, 5).map((s) => (
                            <span key={s} className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground border border-border">
                              {s}
                            </span>
                          ))}
                          {interview.skills.length > 5 && (
                            <span className="text-xs text-[#7a9cc4]">+{interview.skills.length - 5} more</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="text-xs text-[#7a9cc4]">
                        {1 + interview.numBehavioralQuestions + interview.numTechnicalQuestions} questions
                      </div>
                      {interview.numCodingQuestions > 0 && (
                        <div className="text-xs text-[#7a9cc4]">{interview.numCodingQuestions} coding</div>
                      )}
                      <ChevronRight size={16} className="text-[#7a9cc4] group-hover:text-primary transition-colors mt-1" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Employer Portal CTA */}
        <section>
          <div className="rounded-2xl border border-[#c69a2a]/30 bg-gradient-to-r from-[#1a1200]/60 to-[#0d1b2e]/60 p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={18} className="text-[#e5b800]" />
                <h2 className="text-base font-bold text-white">Employer Portal</h2>
              </div>
              <p className="text-[#7a9cc4] text-sm max-w-sm">
                Create job profiles, schedule interviews, invite candidates, and monitor session results — all in one place.
              </p>
            </div>
            <button
              onClick={() => setLocation("/employer/dashboard")}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#c69a2a]/40 bg-[#c69a2a]/10 hover:bg-[#c69a2a]/20 text-[#e5b800] text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <ArrowRight size={15} />
              Go to Employer Portal
            </button>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[#1e3a5f]/60 bg-[#0d1b2e] px-6 py-5 text-center">
        <p className="text-xs text-[#7a9cc4]">
          &copy; {new Date().getFullYear()} InterviewAI — AI-Powered Interview Evaluation Platform. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
