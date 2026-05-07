import { Link } from "wouter";
import { useListJobProfiles, getListJobProfilesQueryKey, useDeleteJobProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Briefcase, Trash2, Pencil } from "lucide-react";

export default function JobProfilesList() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const profiles = useListJobProfiles({ query: { queryKey: getListJobProfilesQueryKey() } });
  const deleteProfile = useDeleteJobProfile();

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    deleteProfile.mutate(
      { params: { id } } as any,
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListJobProfilesQueryKey() });
          toast({ title: "Profile deleted" });
        },
        onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Job Profiles</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Define role requirements and skills</p>
        </div>
        <Link
          href="/employer/job-profiles/new"
          data-testid="link-new-profile"
          className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium transition-colors"
        >
          <Plus size={13} /> New Profile
        </Link>
      </div>

      {profiles.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : (profiles.data as any[])?.length === 0 ? (
        <div className="border border-border rounded-xl py-16 text-center bg-card">
          <Briefcase size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No job profiles yet</p>
          <Link href="/employer/job-profiles/new" className="text-xs text-primary hover:underline mt-1 inline-block">
            Create your first profile
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {(profiles.data as any[]).map((profile: any) => (
            <div key={profile.id} data-testid={`card-profile-${profile.id}`} className="border border-border rounded-xl p-4 bg-card flex items-start justify-between gap-4 hover:border-muted-foreground/30 transition-colors">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground">{profile.title}</h3>
                {profile.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{profile.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/employer/job-profiles/${profile.id}`}
                  data-testid={`link-edit-profile-${profile.id}`}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <Pencil size={14} />
                </Link>
                <button
                  data-testid={`button-delete-profile-${profile.id}`}
                  onClick={() => handleDelete(profile.id, profile.title)}
                  className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
