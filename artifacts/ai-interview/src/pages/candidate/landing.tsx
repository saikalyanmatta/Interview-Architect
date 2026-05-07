import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import {
  Cat,
  ChevronRight,
  Loader2,
  LogIn,
  Briefcase,
  ArrowRight,
  LayoutDashboard,
  History,
  LogOut,
  Building2,
  Moon,
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
    borderClass: "border-l-[#3b82f6]",
  },
  {
    name: "M.R.K.Murthy",
    rollNo: "22BCE9316",
    degree: "B. Tech CSE",
    university: "VIT-AP University",
    location: "Guntur, Andhra Pradesh, India",
    email: "kittumakkapati@gmail.com",
    borderClass: "border-l-[#eab308]",
  },
  {
    name: "K. Sai Deep",
    rollNo: "22BCE8821",
    degree: "B. Tech CSE",
    university: "VIT-AP University",
    location: "Guntur, Andhra Pradesh, India",
    email: "saideep254@gmail.com",
    borderClass: "border-l-[#22c55e]",
  },
];

function NavLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <Cat size={26} className="text-[#3b82f6]" strokeWidth={1.8} />
      <span className="font-bold text-[#3b82f6] text-base tracking-tight">
        Ai Interview Evaluation System
      </span>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="text-center py-14 px-6 bg-gradient-to-b from-[#0d1b2e] to-[#0d1117]">
      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .hero-gradient-text {
          background: linear-gradient(135deg, #60a5fa, #3b82f6, #93c5fd, #1d4ed8, #60a5fa);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 4s ease infinite;
        }
      `}</style>
      <p className="text-[#7a9cc4] text-2xl font-medium mb-2">Welcome to</p>
      <h1
        className="hero-gradient-text font-black leading-tight mb-2"
        style={{ fontSize: "3.6rem", lineHeight: 1.1 }}
      >
        Resume Based Personalised Multinomial
      </h1>
      <p className="text-white text-xl tracking-wide">
        Ai Interview Evaluation System
      </p>
    </section>
  );
}

function AboutCard() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 mt-10">
      <div
        className="rounded-2xl border border-[#1e3a5f] bg-[#0d1b2e] p-8 border-l-4 border-l-[#3b82f6]"
        style={{ boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
      >
        <h3 className="text-xl font-bold text-white mb-3">About the System</h3>
        <p className="text-[#7a9cc4] leading-relaxed" style={{ fontSize: "1.05rem" }}>
          The Resume Based Personalised Multinomial AI Interview Evaluation System is an intelligent
          platform designed to assess candidates through adaptive, data-driven interview analysis.
          Unlike traditional interview systems, this platform analyzes a candidate's resume
          and dynamically generates relevant technical and behavioral questions tailored
          to their skills, experience, and domain expertise.
        </p>
      </div>
    </section>
  );
}

function TeamSection() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 mt-10 mb-4">
      <h3 className="text-xl font-bold text-white text-center mb-6">Team</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {TEAM.map((member) => (
          <div
            key={member.rollNo}
            className={`rounded-2xl border border-[#1e3a5f] bg-[#0d1b2e] p-6 text-center border-l-4 ${member.borderClass}`}
            style={{ boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
          >
            <p className="font-bold text-white mb-1.5" style={{ fontSize: "1.05rem" }}>
              {member.name} - {member.rollNo}
            </p>
            <p className="text-[#7a9cc4] mb-1" style={{ fontSize: "0.95rem" }}>{member.degree}</p>
            <p className="text-[#7a9cc4] mb-1" style={{ fontSize: "0.95rem" }}>{member.university}</p>
            <p className="text-[#7a9cc4] mb-1" style={{ fontSize: "0.95rem" }}>{member.location}</p>
            <p className="text-[#7a9cc4] mt-2" style={{ fontSize: "0.9rem" }}>{member.email}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#1e3a5f]/60 bg-[#0d1b2e] px-6 py-5 text-center mt-10">
      <p className="text-xs text-[#7a9cc4]">
        &copy; {new Date().getFullYear()} Resume Based Personalised Multinomial Ai Interview Evaluation System. All rights reserved.
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
        <header className="bg-[#0d1b2e] border-b border-[#1e3a5f]/60 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <NavLogo />
          <button
            onClick={login}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors"
          >
            <LogIn size={14} />
            Sign In
          </button>
        </header>
        <HeroSection />
        <AboutCard />
        <TeamSection />
        <Footer />
      </div>
    );
  }

  /* ─── POST-LOGIN ─── */

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      <header className="bg-[#0d1b2e] border-b border-[#1e3a5f]/60 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <NavLogo />
        <nav className="flex items-center gap-2">
          <button className="p-1.5 rounded-md border border-[#1e3a5f] bg-[#0d1b2e] hover:bg-[#122440] text-sm text-foreground transition-colors">
            <Moon size={14} className="text-[#7a9cc4]" />
          </button>
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

      <HeroSection />
      <AboutCard />
      <TeamSection />

      {/* Employer Interviews */}
      <section id="employer-interviews" className="w-full max-w-5xl mx-auto px-6 mt-10">
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
            <p className="text-sm text-[#7a9cc4]">Go to Dashboard to start a self-practice interview.</p>
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
      <section className="w-full max-w-5xl mx-auto px-6 mt-8">
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
