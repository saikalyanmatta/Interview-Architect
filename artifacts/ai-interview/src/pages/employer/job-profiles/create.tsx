import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateJobProfile } from "@workspace/api-client-react";
import { getListJobProfilesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";

const PROFICIENCY_LEVELS = ["beginner", "intermediate", "advanced", "expert"];

interface SkillRow {
  skillName: string;
  proficiencyLevel: string;
  weightage: number;
}

export default function JobProfileCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createProfile = useCreateJobProfile();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<SkillRow[]>([
    { skillName: "", proficiencyLevel: "intermediate", weightage: 25 },
  ]);

  const addSkill = () => setSkills([...skills, { skillName: "", proficiencyLevel: "intermediate", weightage: 0 }]);
  const removeSkill = (i: number) => setSkills(skills.filter((_, idx) => idx !== i));
  const updateSkill = (i: number, field: keyof SkillRow, value: any) => {
    setSkills(skills.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validSkills = skills.filter((s) => s.skillName.trim());
    createProfile.mutate(
      { data: { title, description: description || undefined, skills: validSkills } } as any,
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListJobProfilesQueryKey() });
          toast({ title: "Job profile created" });
          setLocation("/employer/job-profiles");
        },
        onError: (err: any) => {
          toast({ title: "Failed to create", description: err?.message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="p-6 max-w-2xl">
      <button
        data-testid="button-back"
        onClick={() => setLocation("/employer/job-profiles")}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft size={13} /> Back to profiles
      </button>

      <h1 className="text-xl font-bold text-foreground mb-6">New Job Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Job Title</label>
          <input
            data-testid="input-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
            required
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Description <span className="text-muted-foreground">(optional)</span></label>
          <textarea
            data-testid="textarea-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the role..."
            rows={3}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-foreground">Required Skills</label>
            <button type="button" data-testid="button-add-skill" onClick={addSkill} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Plus size={12} /> Add skill
            </button>
          </div>

          <div className="space-y-2">
            {skills.map((skill, i) => (
              <div key={i} className="grid grid-cols-[1fr_140px_80px_32px] gap-2 items-center">
                <input
                  data-testid={`input-skill-name-${i}`}
                  value={skill.skillName}
                  onChange={(e) => updateSkill(i, "skillName", e.target.value)}
                  placeholder="Skill name"
                  className="px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <select
                  data-testid={`select-proficiency-${i}`}
                  value={skill.proficiencyLevel}
                  onChange={(e) => updateSkill(i, "proficiencyLevel", e.target.value)}
                  className="px-2 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {PROFICIENCY_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <div className="relative">
                  <input
                    data-testid={`input-weightage-${i}`}
                    type="number"
                    value={skill.weightage}
                    onChange={(e) => updateSkill(i, "weightage", Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-full px-2 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring pr-5"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
                <button
                  type="button"
                  data-testid={`button-remove-skill-${i}`}
                  onClick={() => removeSkill(i)}
                  disabled={skills.length === 1}
                  className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          data-testid="button-create-profile"
          type="submit"
          disabled={createProfile.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
        >
          {createProfile.isPending ? <Loader2 size={15} className="animate-spin" /> : "Create Profile"}
        </button>
      </form>
    </div>
  );
}
