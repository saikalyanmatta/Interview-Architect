import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetSession, getGetSessionQueryKey,
  useGetCodingQuestions, getGetCodingQuestionsQueryKey,
  useGenerateCodingQuestions,
  useSubmitCodingAnswer,
  useCompleteSession,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronRight, CheckCircle2, Terminal } from "lucide-react";
import Editor from "@monaco-editor/react";

const LANGUAGE_MAP: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  "c++": "cpp",
  "c#": "csharp",
  go: "go",
  rust: "rust",
  ruby: "ruby",
  php: "php",
  swift: "swift",
  kotlin: "kotlin",
};

export default function CodingChallenge() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState<Set<number>>(new Set());
  const [generating, setGenerating] = useState(false);

  const session = useGetSession(parseInt(sessionId), {
    query: { queryKey: getGetSessionQueryKey(parseInt(sessionId)) },
  });
  const codingQuestions = useGetCodingQuestions(parseInt(sessionId), {
    query: { queryKey: getGetCodingQuestionsQueryKey(parseInt(sessionId)) },
  });
  const generateQuestions = useGenerateCodingQuestions();
  const submitCodingAnswer = useSubmitCodingAnswer();
  const completeSession = useCompleteSession();

  useEffect(() => {
    if (session.data && codingQuestions.data !== undefined && !codingQuestions.isLoading) {
      if ((codingQuestions.data as any[]).length === 0 && !generating) {
        setGenerating(true);
        generateQuestions.mutate(
          {
            data: {
              sessionId: parseInt(sessionId),
              language: session.data.codingLanguage,
              count: 1,
            },
          } as any,
          {
            onSuccess: () => {
              setGenerating(false);
              queryClient.invalidateQueries({ queryKey: getGetCodingQuestionsQueryKey(parseInt(sessionId)) });
            },
            onError: () => {
              setGenerating(false);
              toast({ title: "Failed to generate coding questions", variant: "destructive" });
            },
          }
        );
      }
    }
  }, [session.data, codingQuestions.data, codingQuestions.isLoading]);

  const questions = (codingQuestions.data as any[]) ?? [];
  const currentQuestion = questions[currentIdx];
  const lang = session.data?.codingLanguage ?? "javascript";
  const monacoLang = LANGUAGE_MAP[lang.toLowerCase()] ?? "javascript";

  const handleSubmitCode = () => {
    if (!code.trim()) {
      toast({ title: "Write some code first", variant: "destructive" });
      return;
    }
    if (!currentQuestion) return;

    submitCodingAnswer.mutate(
      {
        id: parseInt(sessionId),
        data: {
          codingQuestionId: currentQuestion.id,
          code,
          language: lang,
        },
      },
      {
        onSuccess: () => {
          setSubmitted((s) => new Set([...s, currentIdx]));
          toast({ title: "Code submitted" });
        },
        onError: () => {
          toast({ title: "Failed to submit code", variant: "destructive" });
        },
      }
    );
  };

  const handleFinish = () => {
    completeSession.mutate(
      { id: parseInt(sessionId) },
      {
        onSuccess: () => {
          setLocation(`/interview/${sessionId}/results`);
        },
        onError: () => {
          toast({ title: "Failed to complete session", variant: "destructive" });
        },
      }
    );
  };

  if (session.isLoading || codingQuestions.isLoading || generating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={28} className="animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {generating ? "Generating coding questions..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">AI</span>
          </div>
          <span className="text-sm font-medium text-foreground">Coding Challenge</span>
          <span className="text-xs text-muted-foreground border border-border px-2 py-0.5 rounded">
            {lang}
          </span>
        </div>
        {questions.length > 1 && (
          <div className="flex items-center gap-1">
            {questions.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => { setCurrentIdx(i); setCode(""); }}
                className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                  i === currentIdx
                    ? "bg-primary text-primary-foreground"
                    : submitted.has(i)
                    ? "bg-green-500/10 text-green-400 border border-green-500/30"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {submitted.has(i) ? "✓" : i + 1}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Problem panel */}
        <div className="w-96 border-r border-border overflow-y-auto p-5 shrink-0">
          {currentQuestion ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Terminal size={14} className="text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground capitalize">{currentQuestion.difficulty}</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{currentQuestion.problem}</p>

              {(currentQuestion.exampleInput || currentQuestion.exampleOutput) && (
                <div className="mt-4 space-y-2">
                  {currentQuestion.exampleInput && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Example Input:</p>
                      <pre className="text-xs bg-secondary/50 border border-border p-2.5 rounded font-mono text-foreground overflow-x-auto">
                        {currentQuestion.exampleInput}
                      </pre>
                    </div>
                  )}
                  {currentQuestion.exampleOutput && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Expected Output:</p>
                      <pre className="text-xs bg-secondary/50 border border-border p-2.5 rounded font-mono text-foreground overflow-x-auto">
                        {currentQuestion.exampleOutput}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No coding questions available.</p>
          )}
        </div>

        {/* Monaco Code editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={monacoLang}
              value={code}
              onChange={(val) => setCode(val ?? "")}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
                autoClosingBrackets: "always",
                autoClosingQuotes: "always",
                autoIndent: "full",
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                parameterHints: { enabled: true },
                formatOnPaste: true,
                formatOnType: true,
                lineNumbers: "on",
                renderLineHighlight: "line",
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>
          <div className="border-t border-border p-4 flex items-center gap-3 bg-background">
            {submitted.has(currentIdx) ? (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 size={16} />
                <span>Submitted</span>
              </div>
            ) : (
              <button
                data-testid="button-submit-code"
                onClick={handleSubmitCode}
                disabled={submitCodingAnswer.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
              >
                {submitCodingAnswer.isPending ? <Loader2 size={14} className="animate-spin" /> : "Submit Code"}
              </button>
            )}
            <button
              data-testid="button-finish-interview"
              onClick={handleFinish}
              disabled={completeSession.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ml-auto"
            >
              {completeSession.isPending ? <Loader2 size={14} className="animate-spin" /> : <>Finish Interview <ChevronRight size={14} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
