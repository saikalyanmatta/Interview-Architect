import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetSession, getGetSessionQueryKey,
  useGetNextQuestion,
  useSubmitAnswer,
  useTextToSpeech,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Volume2, VolumeX, ArrowRight, Mic, CheckCircle2 } from "lucide-react";

const PHASE_LABELS: Record<string, string> = {
  intro: "Introduction",
  behavioral: "Behavioral",
  technical: "Technical",
  coding: "Coding",
  completed: "Completed",
};

export default function InterviewRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionMeta, setQuestionMeta] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<string>("intro");
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const session = useGetSession(parseInt(sessionId), {
    query: { queryKey: getGetSessionQueryKey(parseInt(sessionId)) },
  });
  const getNextQuestion = useGetNextQuestion();
  const submitAnswer = useSubmitAnswer();
  const tts = useTextToSpeech();

  const speakQuestion = useCallback(
    async (text: string, tone: string) => {
      if (isMuted) return;
      tts.mutate(
        { data: { text, interviewerTone: tone as any, voice: "alloy" as any } },
        {
          onSuccess: (data) => {
            const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
            audioRef.current = audio;
            audio.play().catch(() => {});
          },
        }
      );
    },
    [isMuted]
  );

  const loadNextQuestion = useCallback(() => {
    setIsLoadingQuestion(true);
    setAnswer("");
    getNextQuestion.mutate(
      { params: { id: parseInt(sessionId) } } as any,
      {
        onSuccess: (data: any) => {
          setIsLoadingQuestion(false);
          if (data.sessionComplete || data.phase === "completed") {
            setSessionDone(true);
            setLocation(`/interview/${sessionId}/results`);
            return;
          }
          if (data.phase === "coding") {
            setLocation(`/interview/${sessionId}/coding`);
            return;
          }
          setCurrentQuestion(data.question);
          setPhase(data.phase ?? "intro");
          setQuestionMeta({ questionNumber: data.questionNumber, totalQuestions: data.totalQuestions });
          if (session.data && data.question) {
            speakQuestion(data.question.content, session.data.interviewerTone ?? "professional");
          }
        },
        onError: () => {
          setIsLoadingQuestion(false);
          toast({ title: "Failed to load question", variant: "destructive" });
        },
      }
    );
  }, [sessionId, session.data, speakQuestion]);

  useEffect(() => {
    if (session.data && !currentQuestion && !isLoadingQuestion) {
      loadNextQuestion();
    }
  }, [session.data]);

  const handleSubmit = () => {
    if (!answer.trim()) {
      toast({ title: "Please enter your answer", variant: "destructive" });
      return;
    }
    if (!currentQuestion) return;

    submitAnswer.mutate(
      {
        params: { id: parseInt(sessionId) },
        data: { questionId: currentQuestion.id, content: answer },
      } as any,
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey(parseInt(sessionId)) });
          loadNextQuestion();
        },
        onError: () => {
          toast({ title: "Failed to submit answer", variant: "destructive" });
        },
      }
    );
  };

  if (session.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalQ = questionMeta?.totalQuestions ?? session.data?.totalQuestions ?? 1;
  const currentQ = questionMeta?.questionNumber ?? 1;
  const progress = Math.min((currentQ / totalQ) * 100, 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">AI</span>
          </div>
          <div className="flex items-center gap-1.5">
            {["intro", "behavioral", "technical", "coding"].map((p, i, arr) => (
              <span key={p} className="flex items-center gap-1.5">
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    phase === p
                      ? "bg-primary/10 text-primary font-medium"
                      : ["intro", "behavioral", "technical"].indexOf(p) < ["intro", "behavioral", "technical", "coding"].indexOf(phase)
                      ? "text-muted-foreground line-through"
                      : "text-muted-foreground"
                  }`}
                >
                  {PHASE_LABELS[p]}
                </span>
                {i < arr.length - 1 && <span className="text-muted-foreground/30 text-xs">›</span>}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Q {currentQ} / {totalQ}
          </span>
          <button
            data-testid="button-toggle-mute"
            onClick={() => {
              setIsMuted(!isMuted);
              if (!isMuted && audioRef.current) audioRef.current.pause();
            }}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-0.5 bg-border">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6">
        <div className="w-full max-w-2xl">
          {isLoadingQuestion ? (
            <div className="text-center py-16">
              <Loader2 size={28} className="animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Preparing your question...</p>
            </div>
          ) : currentQuestion ? (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {PHASE_LABELS[phase] ?? phase}
                  </span>
                  {currentQuestion.difficulty && (
                    <span className="text-xs text-muted-foreground capitalize">{currentQuestion.difficulty}</span>
                  )}
                  {currentQuestion.skillTag && (
                    <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground border border-border">
                      {currentQuestion.skillTag}
                    </span>
                  )}
                </div>
                <p className="text-xl font-medium text-foreground leading-relaxed">
                  {currentQuestion.content}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-medium text-muted-foreground mb-2">Your Answer</label>
                <textarea
                  data-testid="textarea-answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={7}
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1.5">{answer.length} characters</p>
              </div>

              <button
                data-testid="button-submit-answer"
                onClick={handleSubmit}
                disabled={submitAnswer.isPending || isLoadingQuestion}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
              >
                {submitAnswer.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>Submit Answer <ArrowRight size={16} /></>
                )}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
