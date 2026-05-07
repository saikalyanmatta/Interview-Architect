import { useParams, useLocation } from "wouter";
import { useGetSessionResults } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, Trophy, Code2, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 70 ? "text-green-500" : score >= 40 ? "text-amber-500" : "text-red-500";
  return (
    <div className={`text-5xl font-bold ${color}`}>
      {score}<span className="text-xl text-muted-foreground">/100</span>
    </div>
  );
}

export default function CandidateSessionResults() {
  const { id } = useParams<{ id: string }>();
  const sessionId = parseInt(id ?? "0", 10);
  const [, setLocation] = useLocation();
  const [expandedAnswers, setExpandedAnswers] = useState<Set<number>>(new Set());

  const { data, isLoading } = useGetSessionResults(sessionId);

  const toggleAnswer = (id: number) => {
    setExpandedAnswers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Results not found</h1>
        <p className="text-muted-foreground mb-6">Could not load session results.</p>
        <Button variant="outline" onClick={() => setLocation("/candidate")}>Back to Dashboard</Button>
      </div>
    );
  }

  const { session, answers, codingAnswers, skillScores, overallFeedback } = data;
  const overallScore = session.overallScore ?? (
    answers.length > 0
      ? Math.round(answers.reduce((sum, a) => sum + (a.score ?? 0), 0) / answers.length)
      : 0
  );

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold tracking-tight mb-1">Interview Complete</h1>
        <p className="text-muted-foreground">Here's your detailed performance report</p>
      </div>

      {/* Overall Score */}
      <Card className="border-primary/20">
        <CardContent className="flex flex-col items-center py-10 gap-4">
          <Trophy className="w-8 h-8 text-primary" />
          <ScoreCircle score={overallScore} />
          <p className="text-sm text-muted-foreground max-w-lg text-center">
            {overallScore >= 80 ? "Outstanding performance — you demonstrated strong mastery across multiple areas." :
             overallScore >= 60 ? "Good performance — you showed solid understanding with room to strengthen key areas." :
             "This session highlighted areas where focused practice will make a significant impact."}
          </p>
          {overallFeedback && (
            <div className="bg-muted/50 rounded-lg p-4 max-w-xl text-sm text-center leading-relaxed">
              {overallFeedback}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skill Scores */}
      {skillScores.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Skill Breakdown</h2>
          <div className="grid gap-3">
            {skillScores.map((skill) => (
              <div key={skill.skillName} className="flex items-center gap-4">
                <div className="w-36 text-sm font-medium truncate shrink-0">{skill.skillName}</div>
                <Progress value={skill.score} className="flex-1 h-2" />
                <div className={`text-sm font-bold w-10 text-right shrink-0 ${skill.score >= 70 ? "text-green-600" : skill.score >= 40 ? "text-amber-600" : "text-red-500"}`}>
                  {skill.score}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Q&A Answers */}
      {answers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Interview Q&A
          </h2>
          <div className="space-y-3">
            {answers.map((answer, i) => (
              <Card key={answer.id} className="overflow-hidden">
                <button
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-muted/40 transition-colors"
                  onClick={() => toggleAnswer(answer.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-muted-foreground shrink-0">Q{i + 1}</span>
                    <span className="text-sm font-medium truncate">Question {i + 1}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {answer.score !== null && (
                      <span className={`text-sm font-bold ${(answer.score ?? 0) >= 70 ? "text-green-600" : (answer.score ?? 0) >= 40 ? "text-amber-600" : "text-red-500"}`}>
                        {answer.score}/100
                      </span>
                    )}
                    {expandedAnswers.has(answer.id) ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>
                {expandedAnswers.has(answer.id) && (
                  <div className="px-5 pb-5 space-y-3 border-t pt-4 animate-in fade-in duration-300">
                    <div className="bg-muted/50 rounded-md p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Your Answer</p>
                      <p className="text-sm leading-relaxed">{answer.content}</p>
                    </div>
                    {answer.feedback && (
                      <div className="bg-primary/5 border border-primary/10 rounded-md p-3">
                        <p className="text-xs font-medium text-primary mb-1 uppercase tracking-wider">AI Feedback</p>
                        <p className="text-sm leading-relaxed">{answer.feedback}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Coding Answers */}
      {codingAnswers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Code2 className="w-5 h-5" /> Coding Solutions
          </h2>
          <div className="space-y-4">
            {codingAnswers.map((ca, i) => (
              <Card key={ca.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Coding Problem {i + 1}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">{ca.language}</Badge>
                      {ca.score !== null && (
                        <span className={`text-sm font-bold ${(ca.score ?? 0) >= 70 ? "text-green-600" : (ca.score ?? 0) >= 40 ? "text-amber-600" : "text-red-500"}`}>
                          {ca.score}/100
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <pre className="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto max-h-48">{ca.code}</pre>
                  {ca.feedback && (
                    <div className="bg-primary/5 border border-primary/10 rounded-md p-3">
                      <p className="text-xs font-medium text-primary mb-1 uppercase tracking-wider">AI Feedback</p>
                      <p className="text-sm leading-relaxed">{ca.feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 pt-4 pb-8">
        <Button variant="outline" onClick={() => setLocation("/candidate")} className="flex-1">
          Back to Dashboard
        </Button>
        <Button onClick={() => setLocation("/candidate/interviews")} className="flex-1">
          Start Another Interview
        </Button>
      </div>
    </div>
  );
}
