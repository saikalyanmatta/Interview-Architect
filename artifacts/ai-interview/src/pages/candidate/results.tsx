import { useParams, useLocation } from "wouter";
import { useGetSessionResults, getGetSessionResultsQueryKey } from "@workspace/api-client-react";
import { Loader2, Award, CheckCircle2, XCircle, Code2, ArrowRight } from "lucide-react";

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={6} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle"
        fill="currentColor" fontSize={size / 4} fontWeight="600"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}>
        {score}
      </text>
    </svg>
  );
}

export default function InterviewResults() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [, setLocation] = useLocation();

  const results = useGetSessionResults(parseInt(sessionId), {
    query: { queryKey: getGetSessionResultsQueryKey(parseInt(sessionId)) },
  });

  if (results.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (results.isError || !results.data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load results.</p>
      </div>
    );
  }

  const { session, answers, codingAnswers, skillScores, overallFeedback } = results.data as any;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-3 flex items-center gap-3">
        <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-bold">AI</span>
        </div>
        <span className="text-sm font-medium text-foreground">Interview Results</span>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Score hero */}
        <div className="border border-border rounded-xl p-6 bg-card mb-6 flex items-center gap-8">
          <div className="shrink-0 text-foreground">
            <ScoreRing score={session.overallScore ?? 0} size={96} />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground mb-1">
              {session.overallScore >= 75 ? "Strong performance" : session.overallScore >= 50 ? "Good effort" : "Keep practicing"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {overallFeedback ?? "Thank you for completing the interview."}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-xs text-muted-foreground">{answers?.length ?? 0} answers</span>
              {codingAnswers?.length > 0 && <span className="text-xs text-muted-foreground">{codingAnswers.length} coding</span>}
            </div>
          </div>
        </div>

        {/* Skill breakdown */}
        {skillScores?.length > 0 && (
          <div className="border border-border rounded-xl p-5 bg-card mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Skill Breakdown</h2>
            <div className="space-y-3">
              {skillScores.map((s: any) => (
                <div key={s.skillName}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">{s.skillName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Weight: {s.weightage}%</span>
                      <span className="text-sm font-medium text-foreground">{s.score}/100</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${s.score}%`,
                        backgroundColor: s.score >= 75 ? "#22c55e" : s.score >= 50 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Answers */}
        {answers?.length > 0 && (
          <div className="border border-border rounded-xl p-5 bg-card mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Answer Review</h2>
            <div className="space-y-4">
              {answers.map((a: any, i: number) => (
                <div key={a.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-muted-foreground">Q{i + 1}</span>
                    {a.score !== null && (
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        a.score >= 75 ? "bg-green-500/10 text-green-400" :
                        a.score >= 50 ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-red-500/10 text-red-400"
                      }`}>{a.score}/100</span>
                    )}
                  </div>
                  <p className="text-sm text-foreground mb-2">{a.content}</p>
                  {a.feedback && (
                    <p className="text-xs text-muted-foreground border-t border-border pt-2 mt-2">{a.feedback}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coding answers */}
        {codingAnswers?.length > 0 && (
          <div className="border border-border rounded-xl p-5 bg-card mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Code2 size={14} /> Coding Review
            </h2>
            <div className="space-y-4">
              {codingAnswers.map((a: any, i: number) => (
                <div key={a.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-muted-foreground">{a.language}</span>
                    {a.score !== null && (
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        a.score >= 75 ? "bg-green-500/10 text-green-400" :
                        a.score >= 50 ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-red-500/10 text-red-400"
                      }`}>{a.score}/100</span>
                    )}
                  </div>
                  <pre className="text-xs font-mono bg-secondary/30 p-3 rounded overflow-x-auto text-foreground mb-2">
                    {a.code}
                  </pre>
                  {a.feedback && (
                    <p className="text-xs text-muted-foreground">{a.feedback}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <button
            data-testid="button-done"
            onClick={() => setLocation("/")}
            className="px-6 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
