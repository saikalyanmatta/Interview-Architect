import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetEmployerSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, ChevronDown, ChevronUp, Code2, MessageSquare, Trophy } from "lucide-react";
import { format } from "date-fns";

export default function EmployerSessionDetail() {
  const { id } = useParams<{ id: string }>();
  const sessionId = parseInt(id ?? "0", 10);
  const [, setLocation] = useLocation();
  const [expandedAnswers, setExpandedAnswers] = useState<Set<number>>(new Set());

  const { data, isLoading } = useGetEmployerSession(sessionId);

  const toggleAnswer = (id: number) => {
    setExpandedAnswers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!data) {
    return (
      <div className="container mx-auto py-16 text-center">
        <p className="text-muted-foreground mb-4">Session not found.</p>
        <Button variant="outline" onClick={() => history.back()}>Back</Button>
      </div>
    );
  }

  const { session, answers, codingAnswers, skillScores, overallFeedback } = data;

  const overallScore = session.overallScore ?? (
    answers.length > 0
      ? Math.round(answers.reduce((s, a) => s + (a.score ?? 0), 0) / answers.length)
      : 0
  );

  const scoreColor = overallScore >= 70 ? "text-green-600" : overallScore >= 40 ? "text-amber-600" : "text-red-500";

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <button
        onClick={() => history.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Candidate Header */}
      <Card className="mb-8 border-primary/20">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{session.candidateName}</h1>
              <p className="text-muted-foreground text-sm mt-1">{session.candidateEmail}</p>
              <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                <span className="capitalize">{session.difficulty}</span>
                <span>•</span>
                <span className="capitalize">{session.interviewerTone} tone</span>
                <span>•</span>
                <span>{format(new Date(session.startedAt), "MMM d, yyyy HH:mm")}</span>
              </div>
            </div>
            <div className="text-center shrink-0">
              <div className={`text-4xl font-bold ${scoreColor}`}>
                {overallScore}<span className="text-lg font-normal text-muted-foreground">/100</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Overall Score</div>
              <Badge
                className={`mt-2 text-xs capitalize ${session.status === "completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
              >
                {session.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill Scores */}
      {skillScores.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" /> Skill Assessment
          </h2>
          <div className="grid gap-3">
            {skillScores.map((skill) => (
              <div key={skill.skillName} className="flex items-center gap-4">
                <div className="w-40 text-sm font-medium truncate shrink-0">{skill.skillName}</div>
                <Progress value={skill.score} className="flex-1 h-2" />
                <div className={`text-sm font-bold w-10 text-right shrink-0 ${skill.score >= 70 ? "text-green-600" : skill.score >= 40 ? "text-amber-600" : "text-red-500"}`}>
                  {skill.score}%
                </div>
                <div className="text-xs text-muted-foreground w-16 shrink-0">wt: {skill.weightage}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Feedback */}
      {overallFeedback && (
        <Card className="mb-8 bg-primary/5 border-primary/20">
          <CardContent className="pt-5">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">AI Evaluation Summary</p>
            <p className="text-sm leading-relaxed">{overallFeedback}</p>
          </CardContent>
        </Card>
      )}

      {/* Q&A Answers */}
      {answers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Interview Responses ({answers.length})
          </h2>
          <div className="space-y-2">
            {answers.map((answer, i) => (
              <Card key={answer.id} className="overflow-hidden">
                <button
                  className="w-full text-left px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-muted/40 transition-colors"
                  onClick={() => toggleAnswer(answer.id)}
                >
                  <span className="text-sm font-medium">Response {i + 1}</span>
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
                  <div className="px-5 pb-5 border-t pt-4 space-y-3 animate-in fade-in duration-200">
                    <div className="bg-muted/50 rounded-md p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Candidate's Answer</p>
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
            <Code2 className="w-5 h-5" /> Code Submissions ({codingAnswers.length})
          </h2>
          <div className="space-y-4">
            {codingAnswers.map((ca, i) => (
              <Card key={ca.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Solution {i + 1}</CardTitle>
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
                  <pre className="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto max-h-60 leading-relaxed">{ca.code}</pre>
                  {ca.feedback && (
                    <div className="bg-primary/5 border border-primary/10 rounded-md p-3">
                      <p className="text-xs font-medium text-primary mb-1 uppercase tracking-wider">AI Code Review</p>
                      <p className="text-sm leading-relaxed">{ca.feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
