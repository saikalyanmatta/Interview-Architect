import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useGetCodingQuestions, useSubmitCodingAnswer, useCompleteSession, useGetSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronRight, Terminal, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Editor from "@monaco-editor/react";

export default function CandidateSessionCoding() {
  const { id } = useParams<{ id: string }>();
  const sessionId = parseInt(id ?? "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: session } = useGetSession(sessionId);
  const { data: codingQuestions, isLoading } = useGetCodingQuestions(sessionId);
  const submitCodingAnswer = useSubmitCodingAnswer();
  const completeSession = useCompleteSession();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [code, setCode] = useState("// Write your solution here\n");
  const [language, setLanguage] = useState("javascript");
  const [feedback, setFeedback] = useState<{ score: number; feedback: string } | null>(null);
  const [submittedIndices, setSubmittedIndices] = useState<Set<number>>(new Set());

  const availableLanguages = session?.codingLanguage
    ? [session.codingLanguage]
    : ["javascript", "python", "java"];

  useEffect(() => {
    if (availableLanguages.length > 0) {
      setLanguage(availableLanguages[0]);
    }
  }, [session]);

  const monacoLanguageMap: Record<string, string> = {
    javascript: "javascript",
    python: "python",
    java: "java",
    typescript: "typescript",
    cpp: "cpp",
    go: "go",
  };

  const starterCode: Record<string, string> = {
    javascript: "// Write your JavaScript solution here\n\nfunction solution() {\n  \n}\n",
    python: "# Write your Python solution here\n\ndef solution():\n    pass\n",
    java: "// Write your Java solution here\n\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}\n",
    typescript: "// Write your TypeScript solution here\n\nfunction solution(): void {\n  \n}\n",
    cpp: "// Write your C++ solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}\n",
    go: "// Write your Go solution here\npackage main\n\nimport \"fmt\"\n\nfunc main() {\n    \n}\n",
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setCode(starterCode[lang] ?? "// Write your solution here\n");
  };

  const currentQuestion = codingQuestions?.[currentIndex];

  const handleSubmit = () => {
    if (!currentQuestion || !code.trim()) return;
    submitCodingAnswer.mutate(
      { id: sessionId, data: { codingQuestionId: currentQuestion.id, code, language } },
      {
        onSuccess: (res: any) => {
          setFeedback({ score: res.score ?? 0, feedback: res.feedback ?? "Submitted successfully." });
          setSubmittedIndices(prev => new Set([...prev, currentIndex]));
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to submit solution.", variant: "destructive" });
        }
      }
    );
  };

  const handleNext = () => {
    setFeedback(null);
    setCode(starterCode[language] ?? "// Write your solution here\n");
    if (currentIndex + 1 < (codingQuestions?.length ?? 0)) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    completeSession.mutate({ id: sessionId }, {
      onSuccess: () => {
        setLocation(`/candidate/session/${sessionId}/results`);
      },
      onError: () => {
        setLocation(`/candidate/session/${sessionId}/results`);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!codingQuestions?.length) {
    return (
      <div className="container mx-auto py-16 max-w-xl text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">No coding questions</h1>
        <p className="text-muted-foreground mb-6">No coding questions for this session.</p>
        <Button onClick={handleFinish}>Finish Interview</Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-primary" />
          <span className="font-semibold">Coding Challenge</span>
          <Badge variant="outline" className="text-xs">
            {currentIndex + 1} / {codingQuestions.length}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map((lang) => (
                <SelectItem key={lang} value={lang} className="text-xs capitalize">{lang}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {submittedIndices.has(currentIndex) && feedback ? (
            <Button size="sm" onClick={handleNext}>
              {currentIndex + 1 < codingQuestions.length ? (
                <><ChevronRight className="w-4 h-4 mr-1" /> Next</>
              ) : (
                "Finish Interview"
              )}
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} disabled={submitCodingAnswer.isPending}>
              {submitCodingAnswer.isPending ? (
                <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Submitting</>
              ) : "Submit Solution"}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Problem Panel */}
        <div className="w-2/5 border-r overflow-y-auto p-6 space-y-5 shrink-0">
          {currentQuestion && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs capitalize">{currentQuestion.difficulty}</Badge>
                  <Badge variant="outline" className="text-xs capitalize">{language}</Badge>
                </div>
                <h2 className="font-bold text-base mb-3">Problem Statement</h2>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{currentQuestion.problem}</p>
              </div>

              {(currentQuestion.exampleInput || currentQuestion.exampleOutput) && (
                <div className="space-y-3">
                  {currentQuestion.exampleInput && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Example Input</p>
                      <pre className="bg-muted text-xs p-3 rounded-md font-mono overflow-x-auto">{currentQuestion.exampleInput}</pre>
                    </div>
                  )}
                  {currentQuestion.exampleOutput && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Expected Output</p>
                      <pre className="bg-muted text-xs p-3 rounded-md font-mono overflow-x-auto">{currentQuestion.exampleOutput}</pre>
                    </div>
                  )}
                </div>
              )}

              {feedback && (
                <Card className={`border ${feedback.score >= 70 ? "border-green-200 bg-green-50/50" : feedback.score >= 40 ? "border-amber-200 bg-amber-50/50" : "border-red-200 bg-red-50/50"} animate-in fade-in duration-500`}>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>AI Evaluation</span>
                      <span className={`text-xl font-bold ${feedback.score >= 70 ? "text-green-600" : feedback.score >= 40 ? "text-amber-600" : "text-red-500"}`}>
                        {feedback.score}/100
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="text-xs leading-relaxed text-muted-foreground">{feedback.feedback}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Editor Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Editor
            height="100%"
            language={monacoLanguageMap[language] ?? "javascript"}
            value={code}
            onChange={(val) => setCode(val ?? "")}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: "on",
              tabSize: 2,
              wordWrap: "on",
              padding: { top: 16 },
            }}
          />
        </div>
      </div>
    </div>
  );
}
