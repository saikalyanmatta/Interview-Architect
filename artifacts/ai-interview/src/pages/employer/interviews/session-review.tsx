import { useParams, useLocation } from "wouter";
import { useGetEmployerSession, getGetEmployerSessionQueryKey } from "@workspace/api-client-react";
import { Loader2, ArrowLeft, Code2 } from "lucide-react";

export default function SessionReview() {
  const { id, sessionId } = useParams<{ id: string; sessionId: string }>();
  const [, setLocation] = useLocation();

  const session = useGetEmployerSession(parseInt(sessionId), {
    query: { queryKey: getGetEmployerSessionQueryKey(parseInt(sessionId)) },
  });

  if (session.isLoading) {
    return <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>;
  }

  const data = session.data as any;

  return (
    <div className="p-6 max-w-4xl">
      <button
        onClick={() => setLocation(`/employer/interviews/${id}`)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft size={13} /> Back to interview
      </button>

      {data?.session && (
        <>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-foreground">{data.session.candidateName || "Candidate"}</h1>
              <p className="text-sm text-muted-foreground">{data.session.candidateEmail}</p>
            </div>
            {data.session.overallScore !== null && (
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground">{data.session.overallScore}</p>
                <p className="text-xs text-muted-foreground">/ 100</p>
              </div>
            )}
          </div>

          {/* Overall feedback */}
          {data.overallFeedback && (
            <div className="border border-border rounded-xl p-4 bg-card mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Overall Feedback</p>
              <p className="text-sm text-foreground leading-relaxed">{data.overallFeedback}</p>
            </div>
          )}

          {/* Skill scores */}
          {data.skillScores?.length > 0 && (
            <div className="border border-border rounded-xl p-4 bg-card mb-4">
              <p className="text-sm font-semibold text-foreground mb-3">Skill Breakdown</p>
              <div className="space-y-3">
                {data.skillScores.map((s: any) => (
                  <div key={s.skillName}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground">{s.skillName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{s.weightage}%</span>
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

          {/* Session info */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Difficulty", value: data.session.difficulty },
              { label: "Tone", value: data.session.interviewerTone },
              { label: "Language", value: data.session.codingLanguage },
            ].map(({ label, value }) => (
              <div key={label} className="border border-border rounded-lg p-3 bg-card">
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <p className="text-sm font-medium text-foreground capitalize">{value}</p>
              </div>
            ))}
          </div>

          {/* Answers */}
          {data.answers?.length > 0 && (
            <div className="border border-border rounded-xl bg-card overflow-hidden mb-4">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Interview Answers</h2>
              </div>
              <div className="divide-y divide-border">
                {data.answers.map((a: any, i: number) => (
                  <div key={a.id} data-testid={`row-answer-${a.id}`} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">Answer {i + 1}</span>
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
                      <p className="text-xs text-muted-foreground border-t border-border pt-2">{a.feedback}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coding answers */}
          {data.codingAnswers?.length > 0 && (
            <div className="border border-border rounded-xl bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Code2 size={14} className="text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Code Submissions</h2>
              </div>
              <div className="divide-y divide-border">
                {data.codingAnswers.map((a: any, i: number) => (
                  <div key={a.id} data-testid={`row-coding-answer-${a.id}`} className="p-4">
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
                    <pre className="text-xs font-mono bg-secondary/30 p-3 rounded overflow-x-auto text-foreground mb-2">{a.code}</pre>
                    {a.feedback && (
                      <p className="text-xs text-muted-foreground">{a.feedback}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
