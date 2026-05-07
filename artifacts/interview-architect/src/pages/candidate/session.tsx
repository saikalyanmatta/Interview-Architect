import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetSession, useGetNextQuestion, useSubmitAnswer } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, ChevronRight, CheckCircle2, Code2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function CandidateSession() {
  const { id } = useParams<{ id: string }>();
  const sessionId = parseInt(id ?? "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: session, isLoading: sessionLoading } = useGetSession(sessionId);

  const getNextQuestion = useGetNextQuestion();
  const submitAnswer = useSubmitAnswer();

  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ score: number; feedback: string } | null>(null);
  const [phase, setPhase] = useState<string>("intro");
  const [questionNum, setQuestionNum] = useState(0);
  const [total, setTotal] = useState(0);
  const [started, setStarted] = useState(false);

  const fetchNext = () => {
    setFeedback(null);
    setAnswer("");
    getNextQuestion.mutate({ id: sessionId }, {
      onSuccess: (res: any) => {
        if (res.sessionComplete || res.phase === "completed") {
          setLocation(`/candidate/session/${sessionId}/results`);
          return;
        }
        if (res.phase === "coding") {
          setLocation(`/candidate/session/${sessionId}/coding`);
          return;
        }
        setCurrentQuestion(res.question);
        setPhase(res.phase ?? "behavioral");
        setQuestionNum(res.questionNumber ?? questionNum + 1);
        setTotal(res.totalQuestions ?? total);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to get next question.", variant: "destructive" });
      }
    });
  };

  const handleStart = () => {
    setStarted(true);
    fetchNext();
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !answer.trim()) return;
    submitAnswer.mutate(
      { id: sessionId, data: { questionId: currentQuestion.id, content: answer } },
      {
        onSuccess: (res: any) => {
          setFeedback({ score: res.score ?? 0, feedback: res.feedback ?? "" });
          queryClient.invalidateQueries({ queryKey: [`/api/candidate/sessions/${sessionId}`] });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to submit answer.", variant: "destructive" });
        }
      }
    );
  };

  const phaseLabel: Record<string, string> = {
    intro: "Introduction",
    behavioral: "Behavioral",
    technical: "Technical",
    coding: "Coding",
    completed: "Completed",
  };

  const phaseColorClass: Record<string, string> = {
    intro: "bg-blue-500/10 text-blue-700 border-blue-200",
    behavioral: "bg-purple-500/10 text-purple-700 border-purple-200",
    technical: "bg-amber-500/10 text-amber-700 border-amber-200",
    coding: "bg-green-500/10 text-green-700 border-green-200",
    completed: "bg-gray-500/10 text-gray-700 border-gray-200",
  };

  if (sessionLoading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Session not found</h1>
        <p className="text-muted-foreground">This interview session does not exist.</p>
      </div>
    );
  }

  if (session.status === "completed") {
    return (
      <div className="container mx-auto py-16 max-w-xl text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Interview Completed</h1>
        <p className="text-muted-foreground mb-6">You have already completed this session.</p>
        <Button onClick={() => setLocation(`/candidate/session/${sessionId}/results`)}>View Results</Button>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="container mx-auto py-16 max-w-2xl">
        <Card className="border-primary/20">
          <CardHeader>
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Code2 className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">Ready to Begin?</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground">
              This AI-driven interview will adapt to your answers in real time. Stay focused, be concise, and treat each question as you would in a real interview.
            </p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-muted rounded-lg p-4">
                <div className="font-bold text-2xl">{session.totalQuestions}</div>
                <div className="text-muted-foreground text-xs uppercase tracking-wider mt-1">Questions</div>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <div className="font-bold text-2xl capitalize">{session.difficulty}</div>
                <div className="text-muted-foreground text-xs uppercase tracking-wider mt-1">Difficulty</div>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <div className="font-bold text-2xl capitalize">{session.interviewerTone}</div>
                <div className="text-muted-foreground text-xs uppercase tracking-wider mt-1">Tone</div>
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/10 p-4 rounded-lg text-sm text-left space-y-1">
              <p className="font-semibold text-primary mb-2">Before you start</p>
              <p className="text-muted-foreground">• You'll receive AI feedback after each answer</p>
              <p className="text-muted-foreground">• Coding questions come last — have your preferred language ready</p>
              <p className="text-muted-foreground">• Answers are saved automatically; there's no time limit per question</p>
            </div>
          </CardContent>
          <CardFooter className="justify-center pb-8">
            <Button size="lg" onClick={handleStart} className="px-16">
              Start Interview
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-8 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${phaseColorClass[phase] ?? ""}`}>
            {phaseLabel[phase] ?? phase}
          </span>
          <span className="text-muted-foreground">
            {questionNum > 0 ? `${questionNum} / ${total}` : "Loading..."}
          </span>
        </div>
        {total > 0 && <Progress value={(questionNum / total) * 100} className="h-1.5" />}
      </div>

      {getNextQuestion.isPending ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Generating your next question...</p>
        </div>
      ) : currentQuestion ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-primary/20 shadow-sm">
            <CardContent className="pt-8 pb-6 px-8">
              <p className="text-lg font-medium leading-relaxed">{currentQuestion.content}</p>
              {currentQuestion.skillTag && (
                <Badge variant="outline" className="mt-4 text-xs">{currentQuestion.skillTag}</Badge>
              )}
            </CardContent>
          </Card>

          {!feedback ? (
            <div className="space-y-4">
              <Textarea
                placeholder="Type your answer here..."
                className="min-h-[220px] text-sm resize-none"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <Button
                onClick={handleSubmitAnswer}
                disabled={submitAnswer.isPending || !answer.trim()}
                className="w-full"
                size="lg"
              >
                {submitAnswer.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Evaluating your answer...</>
                ) : "Submit Answer"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-500">
              <Card className={`border ${feedback.score >= 70 ? "border-green-200 bg-green-50/50 dark:bg-green-950/20" : feedback.score >= 40 ? "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20" : "border-red-200 bg-red-50/50 dark:bg-red-950/20"}`}>
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-start gap-5">
                    <div className={`text-3xl font-bold shrink-0 ${feedback.score >= 70 ? "text-green-600" : feedback.score >= 40 ? "text-amber-600" : "text-red-500"}`}>
                      {feedback.score}<span className="text-sm font-normal text-muted-foreground">/100</span>
                    </div>
                    <p className="text-sm leading-relaxed pt-1">{feedback.feedback}</p>
                  </div>
                </CardContent>
              </Card>
              <Button onClick={fetchNext} className="w-full" size="lg" disabled={getNextQuestion.isPending}>
                <ChevronRight className="w-4 h-4 mr-2" />
                Continue
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
