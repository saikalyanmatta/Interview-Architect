import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import {
  Cat,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  FileText,
  Trophy,
} from "lucide-react";

const C = {
  primary:   "#6C8AFF",
  secondary: "#2ED3F9",
  textDark:  "#E2E8F0",
  textLight: "#94A3B8",
  bgGrad:    "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
  cardBg:    "rgba(30, 41, 59, 0.92)",
  navBg:     "rgba(15, 23, 42, 0.95)",
  border:    "rgba(51, 65, 85, 0.8)",
  shadow:    "rgba(0, 0, 0, 0.2)",
};

const CARD: React.CSSProperties = {
  background: C.cardBg,
  backdropFilter: "blur(20px)",
  borderRadius: 16,
  border: `1px solid ${C.border}`,
  boxShadow: `0 8px 24px ${C.shadow}`,
};

interface PastSession {
  id: number;
  interviewTitle: string;
  status: "in_progress" | "completed" | "abandoned";
  difficulty: "easy" | "medium" | "hard";
  interviewerTone: string;
  overallScore: number | null;
  overallFeedback: string | null;
  phase: string;
  totalQuestions: number;
  currentQuestionIndex: number;
  startedAt: string;
  completedAt: string | null;
  candidateName: string;
}

function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(51,65,85,0.6)" strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={5} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size / 4.5} fontWeight="700"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}
      >
        {score}
      </text>
    </svg>
  );
}

function StatusBadge({ status }: { status: PastSession["status"] }) {
  const config = {
    completed: { icon: CheckCircle2, label: "Completed", color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)" },
    in_progress: { icon: Clock, label: "In Progress", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
    abandoned: { icon: XCircle, label: "Abandoned", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
  }[status];
  const Icon = config.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ color: config.color, background: config.bg, border: `1px solid ${config.border}` }}
    >
      <Icon size={11} />
      {config.label}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: PastSession["difficulty"] }) {
  const config = {
    easy:   { color: "#22c55e", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.25)" },
    medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)" },
    hard:   { color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)" },
  }[difficulty];
  return (
    <span
      className="text-xs px-2 py-0.5 rounded font-medium capitalize"
      style={{ color: config.color, background: config.bg, border: `1px solid ${config.border}` }}
    >
      {difficulty}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function CandidateHistory() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [sessions, setSessions] = useState<PastSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
      return;
    }
    if (!isAuthenticated) return;

    fetch("/api/candidate/my-sessions", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [isAuthenticated, isLoading]);

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: C.bgGrad,
    display: "flex",
    flexDirection: "column",
  };

  if (isLoading || loading) {
    return (
      <div style={{ ...pageStyle, alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={24} className="animate-spin" style={{ color: C.primary }} />
      </div>
    );
  }

  const completed = sessions.filter((s) => s.status === "completed");
  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((sum, s) => sum + (s.overallScore ?? 0), 0) / completed.length)
    : null;

  return (
    <div style={pageStyle}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
        style={{ background: C.navBg, backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: C.textLight }}
          >
            <ArrowLeft size={15} />
            Back
          </button>
          <div style={{ width: 1, height: 16, background: C.border }} />
          <div className="flex items-center gap-2">
            <Cat size={22} style={{ color: C.primary }} strokeWidth={1.8} />
            <span
              className="font-bold text-base"
              style={{
                background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Interview History
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm" style={{ color: C.textLight }}>
          <span>{sessions.length} session{sessions.length !== 1 ? "s" : ""}</span>
          {avgScore !== null && (
            <span>
              Avg score:{" "}
              <span style={{ color: avgScore >= 75 ? "#22c55e" : avgScore >= 50 ? "#f59e0b" : "#ef4444", fontWeight: 600 }}>
                {avgScore}
              </span>
            </span>
          )}
        </div>
      </nav>

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        {error ? (
          <div className="text-center py-20" style={{ color: C.textLight }}>
            Failed to load your interview history.
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-24" style={CARD}>
            <FileText size={40} className="mx-auto mb-4" style={{ color: C.textLight }} />
            <p className="font-semibold text-base mb-2" style={{ color: C.textDark }}>No interviews yet</p>
            <p className="text-sm mb-6" style={{ color: C.textLight }}>
              Complete your first interview and it will appear here.
            </p>
            <button
              onClick={() => setLocation("/interview/customize")}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                color: "#fff",
                border: "none",
              }}
            >
              Start a practice interview
            </button>
          </div>
        ) : (
          <>
            {/* Summary strip */}
            {completed.length > 0 && (
              <div
                className="flex items-center gap-6 mb-6 px-6 py-4 rounded-2xl"
                style={{ ...CARD, borderLeft: `4px solid ${C.primary}` }}
              >
                <Trophy size={28} style={{ color: C.primary, flexShrink: 0 }} />
                <div className="flex gap-8 flex-wrap">
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: C.textLight }}>Completed</p>
                    <p className="text-lg font-bold" style={{ color: C.textDark }}>{completed.length}</p>
                  </div>
                  {avgScore !== null && (
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: C.textLight }}>Average Score</p>
                      <p
                        className="text-lg font-bold"
                        style={{ color: avgScore >= 75 ? "#22c55e" : avgScore >= 50 ? "#f59e0b" : "#ef4444" }}
                      >
                        {avgScore}/100
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: C.textLight }}>Total Sessions</p>
                    <p className="text-lg font-bold" style={{ color: C.textDark }}>{sessions.length}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Session list */}
            <div className="space-y-3">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() =>
                    session.status === "completed"
                      ? setLocation(`/interview/${session.id}/results`)
                      : session.status === "in_progress"
                      ? setLocation(`/interview/${session.id}`)
                      : undefined
                  }
                  disabled={session.status === "abandoned"}
                  className="w-full text-left transition-all"
                  style={{
                    ...CARD,
                    display: "block",
                    padding: "1.25rem 1.5rem",
                    cursor: session.status === "abandoned" ? "default" : "pointer",
                    opacity: session.status === "abandoned" ? 0.65 : 1,
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Score ring or placeholder */}
                    <div className="shrink-0 flex items-center justify-center" style={{ width: 64, height: 64 }}>
                      {session.status === "completed" && session.overallScore !== null ? (
                        <ScoreRing score={session.overallScore} />
                      ) : (
                        <div
                          className="flex items-center justify-center rounded-full"
                          style={{ width: 56, height: 56, background: "rgba(51,65,85,0.4)", border: `1px solid ${C.border}` }}
                        >
                          {session.status === "in_progress" ? (
                            <Clock size={20} style={{ color: "#f59e0b" }} />
                          ) : (
                            <XCircle size={20} style={{ color: "#ef4444" }} />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-sm truncate" style={{ color: C.textDark }}>
                          {session.interviewTitle}
                        </h3>
                        <StatusBadge status={session.status} />
                        <DifficultyBadge difficulty={session.difficulty} />
                      </div>

                      <p className="text-xs mb-2" style={{ color: C.textLight }}>
                        {formatDate(session.startedAt)}
                        {session.completedAt && (
                          <> · Completed {formatDate(session.completedAt)}</>
                        )}
                      </p>

                      {session.status === "completed" && session.overallFeedback && (
                        <p
                          className="text-xs leading-relaxed line-clamp-2"
                          style={{ color: C.textLight }}
                        >
                          {session.overallFeedback}
                        </p>
                      )}

                      {session.status === "in_progress" && (
                        <p className="text-xs" style={{ color: "#f59e0b" }}>
                          Question {session.currentQuestionIndex} of {session.totalQuestions} · Phase: {session.phase}
                        </p>
                      )}
                    </div>

                    {/* Arrow */}
                    {session.status !== "abandoned" && (
                      <ChevronRight size={16} style={{ color: C.textLight, flexShrink: 0, marginTop: 4 }} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
