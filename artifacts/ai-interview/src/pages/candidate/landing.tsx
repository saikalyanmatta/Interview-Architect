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
  Mail,
  MapPin,
  GraduationCap,
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

const TEAM = [
  {
    name: "M Sai Kalyan",
    rollNo: "22BCE8262",
    degree: "B. Tech CSE",
    university: "VIT-AP University",
    location: "Guntur, Andhra Pradesh, India",
    email: "saikalyan.matta@gmail.com",
    borderColor: "border-[#3b82f6]",
    glowColor: "shadow-[#3b82f6]/20",
    nameColor: "text-[#60a5fa]",
  },
  {
    name: "M.R.K.Murthy",
    rollNo: "22BCE9316",
    degree: "B. Tech CSE",
    university: "VIT-AP University",
    location: "Guntur, Andhra Pradesh, India",
    email: "kittumakkapati@gmail.com",
    borderColor: "border-[#eab308]",
    glowColor: "shadow-[#eab308]/20",
    nameColor: "text-[#facc15]",
  },
  {
    name: "K. Sai Deep",
    rollNo: "22BCE8821",
    degree: "B. Tech CSE",
    university: "VIT-AP University",
    location: "Guntur, Andhra Pradesh, India",
    email: "saideep254@gmail.com",
    borderColor: "border-[#22c55e]",
    glowColor: "shadow-[#22c55e]/20",
    nameColor: "text-[#4ade80]",
  },
];

function SharedSections({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <>
      {/* About the System */}
      <section className="w-full max-w-4xl mx-auto px-6 mt-10">
        <div className="rounded-2xl border border-[#1e3a5f] bg-[#0d1b2e] p-7">
          <h2 className="text-lg font-bold text-white mb-3">About the System</h2>
          <p className="text-[#7a9cc4] text-sm leading-relaxed mb-5">
            The AI Interview Evaluation System is an intelligent platform designed to assess candidates through
            adaptive, data-driven interview analysis. Unlike traditional interview systems, this platform analyzes
            a candidate's resume and dynamically generates relevant technical and behavioral questions tailored to
            their skills, experience, and domain expertise.
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

      {/* Team */}
      <section className="w-full max-w-4xl mx-auto px-6 mt-10">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {TEAM.map((member) => (
            <div
              key={member.rollNo}
              className={`rounded-2xl border-2 ${member.borderColor} bg-[#0d1b2e] p-5 shadow-lg ${member.glowColor} flex flex-col gap-2`}
            >
              <div className="mb-1">
                <p className={`text-sm font-bold ${member.nameColor}`}>
                  {member.name} – {member.rollNo}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#7a9cc4]">
                <GraduationCap size={12} className="shrink-0" />
                {member.degree}
              </div>
              <div className="text-xs text-[#7a9cc4]">{member.university}</div>
              <div className="flex items-start gap-1.5 text-xs text-[#7a9cc4]">
                <MapPin size={12} className="shrink-0 mt-0.5" />
                {member.location}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#7a9cc4]">
                <Mail size={12} className="shrink-0" />
                {member.email}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#1e3a5f]/60 bg-[#0d1b2e] px-6 py-5 text-center mt-12">
      <p className="text-xs text-[#7a9cc4]">
        &copy; {new Date().getFullYear()} AI Interview Evaluation System. All rights reserved.
      </p>
    </footer>
  );
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
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  /* ─── PRE-LOGIN ─── */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col">
        {/* Nav */}
        <header className="bg-[#0d1b2e] border-b border-[#1e3a5f]/60 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <Brain size={16} className="text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-base tracking-tight">InterviewAI</span>
          </div>
          <button
            onClick={login}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors"
          >
            <LogIn size={14} />
            Sign In
          </button>
        </header>

        {/* Hero */}
        <section className="text-center py-16 px-6 bg-gradient-to-b from-[#0d1b2e] to-[#0d1117] border-b border-[#1e3a5f]/40">
          <p className="text-primary text-sm font-medium tracking-widest uppercase mb-3">Welcome to</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-3">
            AI Interview
            <br />
            <span className="text-primary">Evaluation System</span>
          </h1>
          <p className="text-[#7a9cc4] text-base max-w-xl mx-auto mb-8">
            Practice with adaptive AI interviews tailored to your skills. Get real-time voice guidance and instant scored feedback.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={login}
              className="inline-flex items-center gap-2 px-7 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-bold transition-colors shadow-xl shadow-primary/30"
            >
              <LogIn size={16} />
              Sign in to start practicing
            </button>
            <button
              onClick={() => setLocation("/employer/dashboard")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#c69a2a]/40 bg-[#c69a2a]/10 hover:bg-[#c69a2a]/20 text-[#e5b800] text-sm font-semibold transition-colors"
            >
              <Building2 size={15} />
              Employer Portal
            </button>
          </div>
        </section>

        {/* Shared: About + Team */}
        <SharedSections isAuthenticated={false} />
        <Footer />
      </div>
    );
  }

  /* ─── POST-LOGIN ─── */
  const firstName = user?.firstName ?? user?.email?.split("@")[0] ?? "there";

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      {/* Nav */}
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

      {/* Hero */}
      <section className="text-center py-16 px-6 bg-gradient-to-b from-[#0d1b2e] to-[#0d1117] border-b border-[#1e3a5f]/40">
        <p className="text-primary text-sm font-medium tracking-widest uppercase mb-3">Welcome, {firstName}</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-3">
          AI Interview
          <br />
          <span className="text-primary">Evaluation System</span>
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

      {/* Shared: About + Team */}
      <SharedSections isAuthenticated={true} />

      {/* Employer Interviews */}
      <section id="employer-interviews" className="w-full max-w-4xl mx-auto px-6 mt-10">
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
      <section className="w-full max-w-4xl mx-auto px-6 mt-8">
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

      <Footer />
    </div>
  );
}
