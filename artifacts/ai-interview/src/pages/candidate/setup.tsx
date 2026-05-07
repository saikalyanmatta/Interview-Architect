import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useCreateSession } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, ChevronDown, LogIn } from "lucide-react";

const DIFFICULTIES = [
  { value: "easy", label: "Easy", desc: "Foundational questions, gentle pace" },
  { value: "medium", label: "Medium", desc: "Standard interview difficulty" },
  { value: "hard", label: "Hard", desc: "Senior-level, challenging questions" },
];

const TONES = [
  { value: "friendly", label: "Friendly", desc: "Warm and encouraging" },
  { value: "professional", label: "Professional", desc: "Formal and structured" },
  { value: "strict", label: "Strict", desc: "Direct and high-expectations" },
  { value: "casual", label: "Casual", desc: "Relaxed, conversational" },
];

export default function CandidateSetup() {
  const { interviewId } = useParams<{ interviewId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated, login } = useAuth();

  const [difficulty, setDifficulty] = useState("medium");
  const [tone, setTone] = useState("professional");
  const [language, setLanguage] = useState("javascript");

  const [interviewData, setInterviewData] = useState<any>(null);
  const [loadingInterview, setLoadingInterview] = useState(false);
  const createSession = useCreateSession();

  useEffect(() => {
    if (interviewId && isAuthenticated) {
      setLoadingInterview(true);
      fetch(`/api/candidate/interviews/${interviewId}`, { credentials: "include" })
        .then((r) => {
          if (!r.ok) throw new Error("Not found");
          return r.json();
        })
        .then((data) => {
          setInterviewData(data);
          const langs = data.interview?.allowedCodingLanguages?.split(",") ?? ["javascript"];
          setLanguage(langs[0] ?? "javascript");
        })
        .catch(() => {
          toast({ title: "Interview not found", variant: "destructive" });
          setLocation("/");
        })
        .finally(() => setLoadingInterview(false));
    }
  }, [interviewId, isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-foreground font-medium mb-4">Sign in to start practicing</p>
          <button
            onClick={login}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors mx-auto"
          >
            <LogIn size={16} />
            Sign in with Replit
          </button>
        </div>
      </div>
    );
  }

  const candidateEmail = user?.email ?? "";
  const candidateName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email?.split("@")[0] || "Candidate";

  const handleStart = () => {
    createSession.mutate(
      {
        data: {
          interviewId: parseInt(interviewId),
          candidateEmail,
          candidateName,
          difficulty: difficulty as any,
          interviewerTone: tone as any,
          codingLanguage: language,
        },
      },
      {
        onSuccess: (session) => {
          setLocation(`/interview/${session.id}`);
        },
        onError: (err: any) => {
          toast({ title: "Failed to start", description: err?.message ?? "Please try again.", variant: "destructive" });
        },
      }
    );
  };

  const interview = interviewData?.interview;
  const jobProfile = interviewData?.jobProfile;
  const langs = interview?.allowedCodingLanguages?.split(",").map((l: string) => l.trim()).filter(Boolean) ?? ["javascript"];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Interview Setup</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure your preferences before starting</p>
        </div>

        {interview && (
          <div className="border border-border rounded-xl p-4 bg-card mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Position</p>
                <h2 className="font-semibold text-foreground">{interview.title}</h2>
                {jobProfile && (
                  <p className="text-sm text-muted-foreground mt-0.5">{jobProfile.title}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">Questions</p>
                <p className="text-sm font-medium text-foreground">
                  {(interview.numBehavioralQuestions || 0) + (interview.numTechnicalQuestions || 0) + 1} Q
                </p>
              </div>
            </div>
            {jobProfile?.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
                {jobProfile.skills.map((s: any) => (
                  <span key={s.id} className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground border border-border">
                    {s.skillName}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-5">
          {/* Identity from Replit auth */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-secondary/30">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="text-sm font-medium text-foreground">{candidateName}</p>
              {candidateEmail && <p className="text-xs text-muted-foreground">{candidateEmail}</p>}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">Difficulty Level</label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  data-testid={`button-difficulty-${value}`}
                  onClick={() => setDifficulty(value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    difficulty === value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs mt-0.5 opacity-70">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">Interviewer Tone</label>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  data-testid={`button-tone-${value}`}
                  onClick={() => setTone(value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    tone === value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs mt-0.5 opacity-70">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Coding Language */}
          {langs.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Coding Language</label>
              <div className="relative">
                <select
                  data-testid="select-coding-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring pr-8"
                >
                  {langs.map((l: string) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}

          <button
            data-testid="button-start-interview"
            onClick={handleStart}
            disabled={createSession.isPending || loadingInterview}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            {createSession.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>Start Interview <ArrowRight size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
