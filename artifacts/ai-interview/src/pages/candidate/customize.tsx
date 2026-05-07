import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useToast } from "@/hooks/use-toast";
import {
  Brain, Upload, FileText, Loader2, ArrowRight, X, Plus,
  ChevronDown, LogIn, Sparkles, Code2, Mic, BarChart3,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const DIFFICULTIES = [
  { value: "easy", label: "Easy", desc: "Foundational, gentle pace" },
  { value: "medium", label: "Medium", desc: "Standard difficulty" },
  { value: "hard", label: "Hard", desc: "Senior-level challenge" },
];

const TONES = [
  { value: "friendly", label: "Friendly", desc: "Warm & encouraging" },
  { value: "professional", label: "Professional", desc: "Formal & structured" },
  { value: "strict", label: "Strict", desc: "Direct, high expectations" },
  { value: "casual", label: "Casual", desc: "Relaxed, conversational" },
];

const CODING_LANGUAGES = [
  "javascript", "python", "java", "typescript", "c++", "c#", "go", "rust", "swift", "kotlin",
];

export default function CustomizeInterview() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated, login } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resumeText, setResumeText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedSkills, setParsedSkills] = useState<string[]>([]);
  const [suggestedRole, setSuggestedRole] = useState("");
  const [resumeSummary, setResumeSummary] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [newSkill, setNewSkill] = useState("");

  const [targetRole, setTargetRole] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("medium");
  const [tone, setTone] = useState("professional");
  const [codingLanguage, setCodingLanguage] = useState("javascript");
  const [adaptive, setAdaptive] = useState(true);
  const [numBehavioral, setNumBehavioral] = useState(2);
  const [numTechnical, setNumTechnical] = useState(3);
  const [numCoding, setNumCoding] = useState(1);
  const [isStarting, setIsStarting] = useState(false);

  const extractPdfText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const textParts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => ("str" in item ? item.str : "")).join(" ");
      textParts.push(text);
    }
    return textParts.join("\n");
  };

  const parseResume = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setIsParsing(true);
    try {
      const res = await fetch("/api/candidate/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resumeText: text }),
      });
      if (!res.ok) throw new Error("Failed to parse resume");
      const data = await res.json();
      const skills: string[] = data.skills ?? [];
      setParsedSkills(skills);
      setSuggestedRole(data.suggestedRole ?? "");
      setResumeSummary(data.summary ?? "");
      setSelectedSkills(skills.slice(0, 12));
      if (data.suggestedRole) setTargetRole(data.suggestedRole);
      toast({ title: `Found ${skills.length} skills from your resume` });
    } catch {
      toast({ title: "Could not parse resume", description: "Skills extracted manually below.", variant: "destructive" });
    } finally {
      setIsParsing(false);
    }
  }, [toast]);

  const handleFile = useCallback(async (file: File) => {
    setUploadedFileName(file.name);
    let text = "";
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      try {
        text = await extractPdfText(file);
      } catch {
        toast({ title: "Could not read PDF", description: "Please paste your resume text instead.", variant: "destructive" });
        return;
      }
    } else {
      text = await file.text();
    }
    setResumeText(text);
    await parseResume(text);
  }, [parseResume, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills((prev) => [...prev, trimmed]);
      if (!parsedSkills.includes(trimmed)) setParsedSkills((prev) => [...prev, trimmed]);
    }
    setNewSkill("");
  };

  const handleStart = async () => {
    if (!targetRole.trim()) {
      toast({ title: "Please enter a target role", variant: "destructive" });
      return;
    }
    setIsStarting(true);
    try {
      const bNum = adaptive ? 2 : numBehavioral;
      const tNum = adaptive ? 3 : numTechnical;
      const cNum = numCoding;

      const res = await fetch("/api/candidate/practice-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          targetRole: targetRole.trim(),
          skills: selectedSkills,
          difficulty,
          interviewerTone: tone,
          numBehavioralQuestions: bNum,
          numTechnicalQuestions: tNum,
          numCodingQuestions: cNum,
          codingLanguage,
          adaptive,
        }),
      });
      if (!res.ok) throw new Error("Failed to start");
      const session = await res.json();
      setLocation(`/interview/${session.id}`);
    } catch {
      toast({ title: "Failed to start interview", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsStarting(false);
    }
  };

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
          <p className="text-foreground font-medium mb-4">Sign in to start an interview</p>
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
              <Brain size={14} className="text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground text-sm">InterviewAI</span>
          </button>
        </div>
        <span className="text-sm text-muted-foreground">
          Customize Your Interview
        </span>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">

        {/* Resume Upload */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground">Resume</h2>
            <span className="text-xs text-muted-foreground ml-1">(optional but recommended)</span>
          </div>

          {!uploadedFileName && !resumeText ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              <Upload size={24} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">Drop your resume here</p>
              <p className="text-xs text-muted-foreground">PDF or TXT · or click to browse</p>
            </div>
          ) : (
            <div className="border border-border rounded-xl p-4 bg-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {uploadedFileName || "Pasted resume"}
                  </span>
                  {isParsing && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
                  {!isParsing && parsedSkills.length > 0 && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <Sparkles size={10} /> Parsed
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { setUploadedFileName(""); setResumeText(""); setParsedSkills([]); setSuggestedRole(""); setResumeSummary(""); setSelectedSkills([]); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              {resumeSummary && (
                <p className="text-xs text-muted-foreground leading-relaxed">{resumeSummary}</p>
              )}
              {!isParsing && parsedSkills.length === 0 && (
                <button
                  onClick={() => parseResume(resumeText)}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  Re-parse resume
                </button>
              )}
            </div>
          )}

          {/* Paste fallback */}
          {!uploadedFileName && (
            <div className="mt-3">
              <details className="group">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
                  Or paste resume text
                </summary>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume content here..."
                  rows={6}
                  className="mt-2 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
                <button
                  onClick={() => parseResume(resumeText)}
                  disabled={isParsing || !resumeText.trim()}
                  className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {isParsing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  Extract Skills with AI
                </button>
              </details>
            </div>
          )}
        </section>

        {/* Skills */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground">Skills to Focus On</h2>
          </div>

          {parsedSkills.length > 0 && (
            <p className="text-xs text-muted-foreground mb-3">Click to toggle skills for your interview</p>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            {parsedSkills.map((skill) => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  selectedSkills.includes(skill)
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addCustomSkill(); }}
              placeholder="Add a skill..."
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={addCustomSkill}
              disabled={!newSkill.trim()}
              className="flex items-center gap-1 px-3 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Plus size={12} /> Add
            </button>
          </div>
        </section>

        {/* Target Role */}
        <section>
          <label className="block text-sm font-semibold text-foreground mb-2">Target Role</label>
          <input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </section>

        {/* Questions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-semibold text-foreground">Number of Questions</label>
            <button
              onClick={() => setAdaptive((v) => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                adaptive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              <Sparkles size={10} />
              {adaptive ? "Adaptive mode on" : "Adaptive mode off"}
            </button>
          </div>

          {adaptive ? (
            <div className="border border-border rounded-xl p-4 bg-card text-center">
              <Sparkles size={20} className="text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Adaptive Interview</p>
              <p className="text-xs text-muted-foreground mt-1">
                The AI will adaptively adjust question count and difficulty based on your performance.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted-foreground">Behavioral Questions</label>
                  <span className="text-xs font-medium text-foreground">{numBehavioral}</span>
                </div>
                <input
                  type="range" min={0} max={8} value={numBehavioral}
                  onChange={(e) => setNumBehavioral(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted-foreground">Technical Questions</label>
                  <span className="text-xs font-medium text-foreground">{numTechnical}</span>
                </div>
                <input
                  type="range" min={0} max={8} value={numTechnical}
                  onChange={(e) => setNumTechnical(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted-foreground">Coding Challenges</label>
                  <span className="text-xs font-medium text-foreground">{numCoding}</span>
                </div>
                <input
                  type="range" min={0} max={3} value={numCoding}
                  onChange={(e) => setNumCoding(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Total: {1 + numBehavioral + numTechnical} questions + {numCoding} coding challenge{numCoding !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </section>

        {/* Difficulty */}
        <section>
          <label className="block text-sm font-semibold text-foreground mb-3">Difficulty</label>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTIES.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setDifficulty(value)}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  difficulty === value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-muted-foreground"
                }`}
              >
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Tone */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Mic size={14} className="text-primary" />
            <label className="text-sm font-semibold text-foreground">Interviewer Tone</label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TONES.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setTone(value)}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  tone === value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-muted-foreground"
                }`}
              >
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Coding Language */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Code2 size={14} className="text-primary" />
            <label className="text-sm font-semibold text-foreground">Coding Language</label>
          </div>
          <div className="relative">
            <select
              value={codingLanguage}
              onChange={(e) => setCodingLanguage(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring pr-8"
            >
              {CODING_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </section>

        {/* Start Button */}
        <div className="pt-2 pb-10">
          <button
            onClick={handleStart}
            disabled={isStarting || !targetRole.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {isStarting ? (
              <><Loader2 size={16} className="animate-spin" /> Starting your interview...</>
            ) : (
              <><ArrowRight size={16} /> Start Interview</>
            )}
          </button>
          {!targetRole.trim() && (
            <p className="text-xs text-muted-foreground text-center mt-2">Enter a target role to continue</p>
          )}
        </div>
      </main>
    </div>
  );
}
