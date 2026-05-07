import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateInterview, useListJobProfiles, getListJobProfilesQueryKey, getListInterviewsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ChevronDown } from "lucide-react";

const CODING_LANGUAGES = ["javascript", "typescript", "python", "java", "c++", "go", "rust", "c#", "ruby", "php"];

export default function InterviewCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const jobProfiles = useListJobProfiles({ query: { queryKey: getListJobProfilesQueryKey() } });
  const createInterview = useCreateInterview();

  const [form, setForm] = useState({
    title: "",
    jobProfileId: "",
    difficulty: "medium",
    interviewerTone: "professional",
    numBehavioralQuestions: 3,
    numTechnicalQuestions: 3,
    numCodingQuestions: 1,
    scheduledAt: "",
  });
  const [selectedLangs, setSelectedLangs] = useState<string[]>(["javascript", "python"]);

  const set = (field: string, val: any) => setForm((f) => ({ ...f, [field]: val }));
  const toggleLang = (lang: string) => setSelectedLangs((l) => l.includes(lang) ? l.filter((x) => x !== lang) : [...l, lang]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jobProfileId) { toast({ title: "Select a job profile", variant: "destructive" }); return; }
    if (selectedLangs.length === 0) { toast({ title: "Select at least one coding language", variant: "destructive" }); return; }

    createInterview.mutate(
      {
        data: {
          title: form.title,
          jobProfileId: parseInt(form.jobProfileId),
          difficulty: form.difficulty,
          interviewerTone: form.interviewerTone,
          numBehavioralQuestions: Number(form.numBehavioralQuestions),
          numTechnicalQuestions: Number(form.numTechnicalQuestions),
          numCodingQuestions: Number(form.numCodingQuestions),
          allowedCodingLanguages: selectedLangs.join(","),
          scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
        },
      } as any,
      {
        onSuccess: (interview: any) => {
          queryClient.invalidateQueries({ queryKey: getListInterviewsQueryKey() });
          toast({ title: "Interview created" });
          setLocation(`/employer/interviews/${interview.id}`);
        },
        onError: (err: any) => toast({ title: "Failed to create", description: err?.message, variant: "destructive" }),
      }
    );
  };

  return (
    <div className="p-6 max-w-2xl">
      <button onClick={() => setLocation("/employer/interviews")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5 transition-colors">
        <ArrowLeft size={13} /> Back
      </button>
      <h1 className="text-xl font-bold text-foreground mb-6">New Interview</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Title</label>
          <input data-testid="input-title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Q4 Senior Engineer Interview" required
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Job Profile</label>
          {jobProfiles.isLoading ? <Loader2 size={14} className="animate-spin text-muted-foreground" /> : (
            <div className="relative">
              <select data-testid="select-job-profile" value={form.jobProfileId} onChange={(e) => set("jobProfileId", e.target.value)}
                className="w-full appearance-none px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring pr-8">
                <option value="">Select a profile</option>
                {(jobProfiles.data as any[])?.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Difficulty</label>
            <div className="relative">
              <select data-testid="select-difficulty" value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)}
                className="w-full appearance-none px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring pr-8">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Tone</label>
            <div className="relative">
              <select data-testid="select-tone" value={form.interviewerTone} onChange={(e) => set("interviewerTone", e.target.value)}
                className="w-full appearance-none px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring pr-8">
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="strict">Strict</option>
                <option value="casual">Casual</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { key: "numBehavioralQuestions", label: "Behavioral Qs" },
            { key: "numTechnicalQuestions", label: "Technical Qs" },
            { key: "numCodingQuestions", label: "Coding Qs" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-foreground mb-1.5">{label}</label>
              <input data-testid={`input-${key}`} type="number" min={0} max={10} value={(form as any)[key]}
                onChange={(e) => set(key, parseInt(e.target.value))}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-2">Allowed Coding Languages</label>
          <div className="flex flex-wrap gap-1.5">
            {CODING_LANGUAGES.map((lang) => (
              <button key={lang} type="button" data-testid={`button-lang-${lang}`} onClick={() => toggleLang(lang)}
                className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                  selectedLangs.includes(lang)
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                }`}>
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Schedule Date <span className="text-muted-foreground">(optional)</span></label>
          <input data-testid="input-scheduled-at" type="datetime-local" value={form.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)}
            className="px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>

        <button data-testid="button-create" type="submit" disabled={createInterview.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-60">
          {createInterview.isPending ? <Loader2 size={15} className="animate-spin" /> : "Create Interview"}
        </button>
      </form>
    </div>
  );
}
