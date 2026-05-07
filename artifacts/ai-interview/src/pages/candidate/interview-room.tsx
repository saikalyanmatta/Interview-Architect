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
import {
  Loader2, Volume2, VolumeX, ArrowRight, Mic, MicOff,
  Camera, CameraOff, RotateCcw,
} from "lucide-react";

const PHASE_LABELS: Record<string, string> = {
  intro: "Introduction",
  behavioral: "Behavioral",
  technical: "Technical",
  coding: "Coding",
  completed: "Completed",
};

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

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
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [speechStatus, setSpeechStatus] = useState("");
  const [answeredCount, setAnsweredCount] = useState(0);
  const [answerScores, setAnswerScores] = useState<number[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  const session = useGetSession(parseInt(sessionId), {
    query: { queryKey: getGetSessionQueryKey(parseInt(sessionId)) },
  });
  const getNextQuestion = useGetNextQuestion();
  const submitAnswer = useSubmitAnswer();
  const tts = useTextToSpeech();

  // Start webcam
  useEffect(() => {
    if (!isCameraOn) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch(() => {});
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [isCameraOn]);

  // Speech recognition
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast({ title: "Speech recognition not supported in this browser" });
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    let finalTranscript = answer;

    rec.onstart = () => {
      setIsListening(true);
      setSpeechStatus("Listening…");
    };
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + t;
        } else {
          interim = t;
        }
      }
      setAnswer(finalTranscript + (interim ? " " + interim : ""));
      setSpeechStatus("Speech patterns normal");
    };
    rec.onerror = () => {
      setIsListening(false);
      setSpeechStatus("");
    };
    rec.onend = () => {
      setIsListening(false);
      setSpeechStatus(finalTranscript ? "Speech patterns normal" : "");
    };

    recognitionRef.current = rec;
    rec.start();
  }, [answer, toast]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const speakQuestion = useCallback(
    (text: string, tone: string) => {
      if (isMuted) return;
      tts.mutate(
        { data: { text, interviewerTone: tone as any, voice: "alloy" as any } },
        {
          onSuccess: (data) => {
            if (audioRef.current) audioRef.current.pause();
            const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
            audioRef.current = audio;
            audio.play().catch(() => {});
          },
        }
      );
    },
    [isMuted, tts]
  );

  const replayAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  const loadNextQuestion = useCallback(() => {
    setIsLoadingQuestion(true);
    setAnswer("");
    setSpeechStatus("");
    stopListening();
    getNextQuestion.mutate(
      { id: parseInt(sessionId) },
      {
        onSuccess: (data: any) => {
          setIsLoadingQuestion(false);
          if (data.sessionComplete || data.phase === "completed") {
            setLocation(`/interview/${sessionId}/results`);
            return;
          }
          if (data.phase === "coding") {
            setLocation(`/interview/${sessionId}/coding`);
            return;
          }
          setCurrentQuestion(data.question);
          setPhase(data.phase ?? "intro");
          setQuestionMeta({
            questionNumber: data.questionNumber,
            totalQuestions: data.totalQuestions,
          });
          if (session.data && data.question) {
            speakQuestion(
              data.question.content,
              session.data.interviewerTone ?? "professional"
            );
          }
        },
        onError: () => {
          setIsLoadingQuestion(false);
          toast({ title: "Failed to load question", variant: "destructive" });
        },
      }
    );
  }, [sessionId, session.data, speakQuestion, stopListening]);

  useEffect(() => {
    if (session.data && !currentQuestion && !isLoadingQuestion) {
      loadNextQuestion();
    }
  }, [session.data]);

  const handleSubmit = () => {
    if (!answer.trim()) {
      toast({ title: "Please provide your answer", variant: "destructive" });
      return;
    }
    if (!currentQuestion) return;
    stopListening();

    submitAnswer.mutate(
      {
        id: parseInt(sessionId),
        data: { questionId: currentQuestion.id, content: answer },
      },
      {
        onSuccess: (data: any) => {
          queryClient.invalidateQueries({
            queryKey: getGetSessionQueryKey(parseInt(sessionId)),
          });
          setAnsweredCount((c) => c + 1);
          if (data?.score != null) {
            setAnswerScores((prev) => [...prev, data.score]);
          }
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">
            Question {currentQ}
          </span>
          <span className="text-xs text-muted-foreground">
            {phase === "intro" ? "Adaptive — length adjusts to your performance" : ""}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground capitalize">
            {PHASE_LABELS[phase] ?? phase}
            {currentQuestion?.skillTag ? ` • ${currentQuestion.skillTag}` : ""}
          </span>
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              if (!isMuted && audioRef.current) audioRef.current.pause();
            }}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-0.5 bg-border">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL — AI avatar + user camera */}
        <div className="w-56 shrink-0 flex flex-col gap-3 p-4 border-r border-border bg-card/30">
          {/* AI Avatar */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden flex flex-col items-center justify-center py-6 gap-3">
            <div className="relative w-20 h-20">
              {/* Pulsing orb */}
              <div
                className={`absolute inset-0 rounded-full bg-primary/20 ${
                  tts.isPending ? "animate-ping" : ""
                }`}
              />
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary/60 via-primary/30 to-primary/10 flex items-center justify-center border border-primary/30">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary text-lg font-bold">AI</span>
                </div>
              </div>
            </div>
            <button
              onClick={replayAudio}
              disabled={tts.isPending}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors disabled:opacity-50"
            >
              <RotateCcw size={11} />
              Replay
            </button>
          </div>

          {/* User camera */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden relative">
            {isCameraOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-video object-cover scale-x-[-1]"
              />
            ) : (
              <div className="w-full aspect-video flex items-center justify-center bg-secondary/30">
                <CameraOff size={20} className="text-muted-foreground" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] text-white font-medium drop-shadow">Live</span>
            </div>
            <button
              onClick={() => setIsCameraOn((v) => !v)}
              className="absolute top-2 right-2 p-1 rounded bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              {isCameraOn ? <Camera size={11} /> : <CameraOff size={11} />}
            </button>
          </div>

          {/* Next / Submit button */}
          <button
            onClick={handleSubmit}
            disabled={submitAnswer.isPending || isLoadingQuestion || !answer.trim()}
            className="mt-auto flex items-center justify-center gap-2 w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {submitAnswer.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <>
                <ArrowRight size={15} />
                Next Question
              </>
            )}
          </button>
        </div>

        {/* RIGHT PANEL — Question + Answer */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          {isLoadingQuestion ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 size={28} className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Preparing your question…</p>
            </div>
          ) : currentQuestion ? (
            <div className="flex flex-col gap-6 max-w-2xl">
              {/* Phase tags */}
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground border border-border capitalize">
                  {PHASE_LABELS[phase] ?? phase}
                </span>
                {currentQuestion.skillTag && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 capitalize">
                    {currentQuestion.skillTag}
                  </span>
                )}
                {currentQuestion.difficulty && (
                  <span className="text-xs text-muted-foreground capitalize">
                    {currentQuestion.difficulty}
                  </span>
                )}
              </div>

              {/* Question text */}
              <p className="text-lg font-semibold text-foreground leading-relaxed">
                {currentQuestion.content}
              </p>

              {/* Answer area */}
              <div className="border border-border rounded-xl bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary text-[9px]">✓</span>
                    </span>
                    Your answer:
                  </div>
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      isListening
                        ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                        : "bg-secondary border-border text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff size={12} />
                        Stop recording
                      </>
                    ) : (
                      <>
                        <Mic size={12} />
                        Speak answer
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={
                    isListening
                      ? "Speaking… your words appear here"
                      : "Type your answer or click 'Speak answer' to use your voice…"
                  }
                  rows={7}
                  className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 leading-relaxed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {answer.length} characters
                </p>

                {/* Speech status */}
                {speechStatus && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-green-400 border border-green-500/20 bg-green-500/5 rounded-lg px-3 py-2">
                    <span>✓</span>
                    {speechStatus}
                  </div>
                )}
              </div>

              {/* Progress dots */}
              {answeredCount > 0 && (
                <div className="border border-border rounded-xl bg-card p-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    Progress — {answeredCount} answer{answeredCount !== 1 ? "s" : ""} submitted
                  </p>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {answerScores.map((score, i) => (
                      <div
                        key={i}
                        className="w-8 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            score >= 75
                              ? "#22c55e"
                              : score >= 50
                              ? "#f59e0b"
                              : "#ef4444",
                        }}
                        title={`Q${i + 1}: ${score}/100`}
                      />
                    ))}
                    {Array.from({
                      length: Math.max(0, totalQ - answerScores.length - 1),
                    }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="w-8 h-2 rounded-full bg-border"
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Green = fluent · Amber = disfluency noted · Red = needs work
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
