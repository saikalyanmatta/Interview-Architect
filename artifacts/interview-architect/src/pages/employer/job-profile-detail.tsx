import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetJobProfile, useUpdateJobProfile, useDeleteJobProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Plus, Trash2, Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const proficiencyLevels = ["beginner", "intermediate", "advanced", "expert"] as const;
const proficiencyColor: Record<string, string> = {
  beginner: "bg-blue-100 text-blue-700",
  intermediate: "bg-purple-100 text-purple-700",
  advanced: "bg-amber-100 text-amber-700",
  expert: "bg-green-100 text-green-700",
};

export default function EmployerJobProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const profileId = parseInt(id ?? "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: profile, isLoading } = useGetJobProfile(profileId);
  const updateProfile = useUpdateJobProfile();
  const deleteProfile = useDeleteJobProfile();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<Array<{ skillName: string; proficiencyLevel: string; weightage: number }>>([]);
  const [initialized, setInitialized] = useState(false);

  if (profile && !initialized) {
    setTitle(profile.title);
    setDescription(profile.description);
    setSkills((profile as any).skills?.map((s: any) => ({
      skillName: s.skillName,
      proficiencyLevel: s.proficiencyLevel,
      weightage: s.weightage,
    })) ?? []);
    setInitialized(true);
  }

  const addSkill = () => {
    setSkills([...skills, { skillName: "", proficiencyLevel: "intermediate", weightage: 10 }]);
  };

  const removeSkill = (i: number) => {
    setSkills(skills.filter((_, idx) => idx !== i));
  };

  const updateSkill = (i: number, field: string, value: any) => {
    setSkills(skills.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      { id: profileId, data: { title, description, skills: skills.filter(s => s.skillName.trim()) as any } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [`/api/employer/job-profiles/${profileId}`] });
          queryClient.invalidateQueries({ queryKey: ["/api/employer/job-profiles"] });
          toast({ title: "Profile saved" });
        }
      }
    );
  };

  const handleDelete = () => {
    if (!confirm("Delete this job profile? This will also delete any linked interviews.")) return;
    deleteProfile.mutate({ id: profileId }, {
      onSuccess: () => {
        setLocation("/employer/job-profiles");
        toast({ title: "Profile deleted" });
      }
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-16 text-center">
        <p className="text-muted-foreground mb-4">Job profile not found.</p>
        <Button variant="outline" onClick={() => setLocation("/employer/job-profiles")}>Back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <button onClick={() => setLocation("/employer/job-profiles")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Job Profiles
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{profile.title}</h1>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="w-4 h-4 mr-1" /> Delete
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <Card>
          <CardHeader><CardTitle className="text-base">Profile Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[100px]" required />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Required Skills</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addSkill} className="gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Skill
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {skills.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No skills added. Click "Add Skill" to define required competencies.
              </div>
            ) : (
              <div className="space-y-3">
                {skills.map((skill, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <Input
                      placeholder="Skill name"
                      value={skill.skillName}
                      onChange={(e) => updateSkill(i, "skillName", e.target.value)}
                      className="flex-1 h-8 text-sm"
                    />
                    <Select value={skill.proficiencyLevel} onValueChange={(v) => updateSkill(i, "proficiencyLevel", v)}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {proficiencyLevels.map(l => (
                          <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={skill.weightage}
                        onChange={(e) => updateSkill(i, "weightage", parseInt(e.target.value, 10))}
                        className="w-16 h-8 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <button type="button" onClick={() => removeSkill(i)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateProfile.isPending} className="gap-2">
            {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
