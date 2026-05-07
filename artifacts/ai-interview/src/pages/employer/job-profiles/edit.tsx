import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
  useGetJobProfile, getGetJobProfileQueryKey,
  useUpdateJobProfile,
  getListJobProfilesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";

const PROFICIENCY_LEVELS = ["beginner", "intermediate", "advanced", "expert"];

interface SkillRow { skillName: string; proficiencyLevel: string; weightage: number; }

export default function JobProfileEdit() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const profileId = parseInt(id);

  const profile = useGetJobProfile(profileId, { query: { queryKey: getGetJobProfileQueryKey(profileId), enabled: !!profileId } });
  const updateProfile = useUpdateJobProfile();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<SkillRow[]>([]);

  useEffect(() => {
    if (profile.data) {
      const p = profile.data as any;
      setTitle(p.title ?? "");
      setDescription(p.description ?? "");
      setSkills(p.skills?.length ? p.skills.map((s: any) => ({ skillName: s.skillName, proficiencyLevel: s.proficiencyLevel, weightage: s.weightage })) : [{ skillName: "", proficiencyLevel: "intermediate", weightage: 0 }]);
    }
  }, [profile.data]);

  const addSkill = () => setSkills([...skills, { skillName: "", proficiencyLevel: "intermediate", weightage: 0 }]);
  const removeSkill = (i: number) => setSkills(skills.filter((_, idx) => idx !== i));
  const updateSkill = (i: number, field: keyof SkillRow, value: any) =>
    setSkills(skills.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validSkills = skills.filter((s) => s.skillName.trim());
    updateProfile.mutate(
      { params: { id: profileId }, data: { title, description: description || undefined, skills: validSkills } } as any,
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListJobProfilesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetJobProfileQueryKey(profileId) });
          toast({ title: "Profile updated" });
          setLocation("/employer/job-profiles");
        },
        onError: (err: any) => toast({ title: "Failed to update", description: err?.message, variant: "destructive" }),
      }
    );
  };

  if (profile.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="p-6 max-w-2xl">
      <button onClick={() => setLocation("/employer/job-profiles")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5 transition-colors">
        <ArrowLeft size={13} /> Back
      </button>
      <h1 className="text-xl font-bold text-foreground mb-6">Edit Job Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Job Title</label>
          <input data-testid="input-title" value={title} onChange={(e) => setTitle(e.target.value)} required
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Description</label>
          <textarea data-testid="textarea-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-foreground">Skills</label>
            <button type="button" onClick={addSkill} className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus size={12} /> Add</button>
          </div>
          <div className="space-y-2">
            {skills.map((skill, i) => (
              <div key={i} className="grid grid-cols-[1fr_140px_80px_32px] gap-2 items-center">
                <input data-testid={`input-skill-name-${i}`} value={skill.skillName} onChange={(e) => updateSkill(i, "skillName", e.target.value)} placeholder="Skill"
                  className="px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground" />
                <select data-testid={`select-proficiency-${i}`} value={skill.proficiencyLevel} onChange={(e) => updateSkill(i, "proficiencyLevel", e.target.value)}
                  className="px-2 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-ring text-foreground">
                  {PROFICIENCY_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <div className="relative">
                  <input data-testid={`input-weightage-${i}`} type="number" value={skill.weightage} onChange={(e) => updateSkill(i, "weightage", Number(e.target.value))} min={0} max={100}
                    className="w-full px-2 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-ring text-foreground pr-5" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
                <button type="button" onClick={() => removeSkill(i)} disabled={skills.length === 1}
                  className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <button data-testid="button-save" type="submit" disabled={updateProfile.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-60">
          {updateProfile.isPending ? <Loader2 size={15} className="animate-spin" /> : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
