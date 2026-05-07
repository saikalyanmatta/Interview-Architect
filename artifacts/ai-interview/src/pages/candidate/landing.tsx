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

/* ─── exact dark-mode CSS vars from original base.html ─── */
const C = {
  primary:    "#6C8AFF",
  secondary:  "#2ED3F9",
  accent:     "#FFA94D",
  textDark:   "#E2E8F0",
  textLight:  "#94A3B8",
  bgGrad:     "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
  cardBg:     "rgba(30, 41, 59, 0.92)",
  navBg:      "rgba(15, 23, 42, 0.95)",
  footerBg:   "rgba(15, 23, 42, 0.90)",
  border:     "rgba(51, 65, 85, 0.8)",
  shadow:     "rgba(0, 0, 0, 0.2)",
  borderWarn: "#FFC107",
  borderOk:   "#198754",
};

const CARD_STYLE: React.CSSProperties = {
  background: C.cardBg,
  backdropFilter: "blur(20px)",
  borderRadius: 20,
  border: `1px solid ${C.border}`,
  boxShadow: `0 20px 40px ${C.shadow}`,
};

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
    name: "M Sai Kalyan", rollNo: "22BCE8262",
    degree: "B. Tech CSE", university: "VIT-AP University",
    location: "Guntur, Andhra Pradesh, India", email: "saikalyan.matta@gmail.com",
    borderColor: C.primary,
  },
  {
    name: "M.R.K.Murthy", rollNo: "22BCE9316",
    degree: "B. Tech CSE", university: "VIT-AP University",
    location: "Guntur, Andhra Pradesh, India", email: "kittumakkapati@gmail.com",
    borderColor: C.borderWarn,
  },
  {
    name: "K. Sai Deep", rollNo: "22BCE8821",
    degree: "B. Tech CSE", university: "VIT-AP University",
    location: "Guntur, Andhra Pradesh, India", email: "saideep254@gmail.com",
    borderColor: C.borderOk,
  },
];

function GlobalStyles() {
  return (
    <style>{`
      @keyframes gradientShift {
        0%, 100% { background-position: 0% 50%; }
        50%       { background-position: 100% 50%; }
      }
      .hero-gradient-text {
        background: linear-gradient(135deg, ${C.primary}, ${C.secondary}, ${C.accent});
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: gradientShift 3s ease infinite;
        font-weight: 900;
        font-size: 3.6rem;
        line-height: 1.1;
        display: block;
      }
      @media (max-width: 640px) {
        .hero-gradient-text { font-size: 2.4rem; }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .fade-in { animation: fadeIn 0.8s ease-out; }
    `}</style>
  );
}

function NavBar({ right }: { right: React.ReactNode }) {
  return (
    <nav
      className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
      style={{
        background: C.navBg,
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.border}`,
        boxShadow: `0 1px 3px ${C.shadow}`,
      }}
    >
      <div className="flex items-center gap-2.5">
        <Cat size={28} style={{ color: C.primary }} strokeWidth={1.8} />
        <span
          className="font-bold text-lg"
          style={{
            background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Ai Interview Evaluation System
        </span>
      </div>
      {right}
    </nav>
  );
}

function HeroText() {
  return (
    <div className="text-center pt-2 pb-10 px-4 fade-in">
      <h3 style={{ lineHeight: 1.1 }} className="mb-10">
        <span className="block" style={{ fontSize: "1.5rem", color: C.textLight }}>
          Welcome to
        </span>
        <span className="hero-gradient-text">Resume Based Personalised Multinomial </span>
        <span className="block" style={{ fontSize: "1.25rem", color: C.textDark, fontWeight: 400 }}>
          Ai Interview Evaluation System
        </span>
      </h3>
    </div>
  );
}

function AboutCard() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 mb-10">
      <div
        style={{
          ...CARD_STYLE,
          borderLeft: `4px solid ${C.primary}`,
          padding: "2.5rem 3rem",
        }}
      >
        <h3 className="fw-bold mb-3" style={{ fontSize: "1.25rem", fontWeight: 700, color: C.textDark, marginBottom: "0.75rem" }}>
          About the System
        </h3>
        <p style={{ color: C.textLight, fontSize: "1.05rem", lineHeight: 1.75, margin: 0 }}>
          The Resume Based Personalised Multinomial AI Interview Evaluation System is an intelligent
          platform designed to assess candidates through adaptive, data-driven interview analysis.
          Unlike traditional interview systems, this platform analyzes a candidate's resume
          and dynamically generates relevant technical and behavioral questions tailored
          to their skills, experience, and domain expertise.
        </p>
      </div>
    </div>
  );
}

function TeamSection() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 mb-10">
      <div className="text-center mb-6">
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: C.textDark }}>Team</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TEAM.map((m) => (
          <div
            key={m.rollNo}
            className="text-center"
            style={{
              ...CARD_STYLE,
              borderLeft: `4px solid ${m.borderColor}`,
              padding: "1.5rem",
            }}
          >
            <p style={{ fontWeight: 700, fontSize: "1.05rem", color: C.textDark, marginBottom: 6 }}>
              {m.name} - {m.rollNo}
            </p>
            <p style={{ fontSize: "0.95rem", color: C.textLight, marginBottom: 2 }}>{m.degree}</p>
            <p style={{ fontSize: "0.95rem", color: C.textLight, marginBottom: 2 }}>{m.university}</p>
            <p style={{ fontSize: "0.95rem", color: C.textLight, marginBottom: 2 }}>{m.location}</p>
            <p style={{ fontSize: "0.9rem",  color: C.textLight, marginTop: 6 }}>{m.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer
      className="mt-10 border-t px-6 py-5 text-center"
      style={{ background: C.footerBg, borderColor: C.border }}
    >
      <p style={{ fontSize: "0.9rem", color: C.textLight }}>
        &copy; {new Date().getFullYear()} Resume Based Personalised Multinomial Ai Interview Evaluation System.
        All rights reserved.
      </p>
    </footer>
  );
}

export default function CandidateLanding() {
  const [, setLocation] = useLocation();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
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

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: C.bgGrad,
    display: "flex",
    flexDirection: "column",
  };

  if (isLoading) {
    return (
      <div style={{ ...pageStyle, alignItems: "center", justifyContent: "center" }}>
        <GlobalStyles />
        <Loader2 size={24} className="animate-spin" style={{ color: C.primary }} />
      </div>
    );
  }

  /* ─── PRE-LOGIN ─── */
  if (!isAuthenticated) {
    return (
      <div style={pageStyle}>
        <GlobalStyles />
        <NavBar
          right={
            <button
              onClick={() => setLocation("/employer/login")}
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                color: "#fff",
                border: "none",
                boxShadow: `0 4px 12px rgba(108,138,255,0.25)`,
              }}
            >
              <LogIn size={15} />
              Login
            </button>
          }
        />
        <div className="flex-1 w-full">
          <HeroText />
          <AboutCard />
          <TeamSection />
        </div>
        <Footer />
      </div>
    );
  }

  /* ─── POST-LOGIN ─── */
  return (
    <div style={pageStyle}>
      <GlobalStyles />
      <NavBar
        right={
          <div className="flex items-center gap-2">
            <button
              className="flex items-center justify-center rounded-full transition-all"
              style={{
                width: 44, height: 44,
                background: "transparent",
                border: `1px solid ${C.border}`,
                color: C.textLight,
                cursor: "pointer",
              }}
            >
              <Moon size={18} />
            </button>
            <button
              onClick={() => setLocation("/interview/customize")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ border: `1px solid ${C.border}`, color: C.textLight, background: "transparent" }}
            >
              <LayoutDashboard size={14} style={{ color: C.primary }} />
              Dashboard
            </button>
            <button
              onClick={() => setLocation("/history")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ border: `1px solid ${C.border}`, color: C.textLight, background: "transparent" }}
            >
              <History size={14} style={{ color: C.primary }} />
              History
            </button>
            <button
              onClick={async () => { await logout(); }}
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                color: "#fff",
                border: "none",
                boxShadow: `0 4px 12px rgba(108,138,255,0.25)`,
              }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        }
      />

      <div className="flex-1 w-full">
        <HeroText />
        <AboutCard />
        <TeamSection />

        {/* Employer Interviews */}
        <section id="employer-interviews" className="w-full max-w-5xl mx-auto px-4 mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold" style={{ color: C.textDark }}>Employer Interviews</h2>
              <p className="text-sm mt-0.5" style={{ color: C.textLight }}>Interviews published by employers that you can join.</p>
            </div>
          </div>

          {loadingInterviews ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin" style={{ color: C.primary }} />
            </div>
          ) : interviews.length === 0 ? (
            <div className="p-10 text-center" style={CARD_STYLE}>
              <Briefcase size={32} className="mx-auto mb-3" style={{ color: C.textLight }} />
              <p className="font-medium mb-1" style={{ color: C.textDark }}>No employer interviews available yet</p>
              <p className="text-sm" style={{ color: C.textLight }}>Go to Dashboard to start a self-practice interview.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {interviews.map((interview) => (
                <button
                  key={interview.id}
                  onClick={() => setLocation(`/interview/setup/${interview.id}`)}
                  className="w-full p-5 text-left group transition-all"
                  style={{ ...CARD_STYLE, display: "block" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate" style={{ color: C.textDark }}>{interview.title}</h3>
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
                      <p className="text-xs mb-2" style={{ color: C.textLight }}>{interview.jobProfileTitle}</p>
                      {interview.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {interview.skills.slice(0, 5).map((s) => (
                            <span
                              key={s}
                              className="text-xs px-2 py-0.5 rounded"
                              style={{ background: "rgba(51,65,85,0.5)", color: C.textLight, border: `1px solid ${C.border}` }}
                            >
                              {s}
                            </span>
                          ))}
                          {interview.skills.length > 5 && (
                            <span className="text-xs" style={{ color: C.textLight }}>+{interview.skills.length - 5} more</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="text-xs" style={{ color: C.textLight }}>
                        {1 + interview.numBehavioralQuestions + interview.numTechnicalQuestions} questions
                      </div>
                      {interview.numCodingQuestions > 0 && (
                        <div className="text-xs" style={{ color: C.textLight }}>{interview.numCodingQuestions} coding</div>
                      )}
                      <ChevronRight size={16} style={{ color: C.textLight, marginTop: 4 }} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Employer Portal CTA */}
        <section className="w-full max-w-5xl mx-auto px-4 mb-10">
          <div
            className="p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
            style={{ ...CARD_STYLE, borderLeft: `4px solid ${C.accent}` }}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={18} style={{ color: C.accent }} />
                <h2 className="text-base font-bold" style={{ color: C.textDark }}>Employer Portal</h2>
              </div>
              <p className="text-sm max-w-sm" style={{ color: C.textLight }}>
                Create job profiles, schedule interviews, invite candidates, and monitor session results — all in one place.
              </p>
            </div>
            <button
              onClick={() => setLocation("/employer/dashboard")}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
              style={{
                border: `1px solid rgba(255,169,77,0.4)`,
                background: "rgba(255,169,77,0.1)",
                color: C.accent,
              }}
            >
              <ArrowRight size={15} />
              Go to Employer Portal
            </button>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
