import { Link } from "wouter";
import { useListInterviews, getListInterviewsQueryKey, useDeleteInterview } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Calendar, Trash2, Pencil } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  draft: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  closed: "bg-secondary text-muted-foreground border-border",
};

export default function InterviewsList() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const interviews = useListInterviews({ query: { queryKey: getListInterviewsQueryKey() } });
  const deleteInterview = useDeleteInterview();

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    deleteInterview.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListInterviewsQueryKey() });
          toast({ title: "Interview deleted" });
        },
        onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Interviews</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Schedule and manage candidate interviews</p>
        </div>
        <Link
          href="/employer/interviews/new"
          data-testid="link-new-interview"
          className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-medium transition-colors"
        >
          <Plus size={13} /> New Interview
        </Link>
      </div>

      {interviews.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      ) : (interviews.data as any[])?.length === 0 ? (
        <div className="border border-border rounded-xl py-16 text-center bg-card">
          <Calendar size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No interviews yet</p>
          <Link href="/employer/interviews/new" className="text-xs text-primary hover:underline mt-1 inline-block">
            Schedule your first interview
          </Link>
        </div>
      ) : (
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_120px_80px_64px] gap-0 text-xs font-medium text-muted-foreground border-b border-border px-4 py-2.5">
            <span>Title</span>
            <span>Difficulty</span>
            <span>Tone</span>
            <span>Status</span>
            <span />
          </div>
          <div className="divide-y divide-border">
            {(interviews.data as any[]).map((interview: any) => (
              <div key={interview.id} data-testid={`row-interview-${interview.id}`} className="grid grid-cols-[1fr_120px_120px_80px_64px] items-center px-4 py-3 hover:bg-secondary/20 transition-colors">
                <Link href={`/employer/interviews/${interview.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate">
                  {interview.title}
                </Link>
                <span className="text-xs text-muted-foreground capitalize">{interview.difficulty}</span>
                <span className="text-xs text-muted-foreground capitalize">{interview.interviewerTone}</span>
                <span className={`text-xs px-2 py-0.5 rounded border capitalize w-fit ${STATUS_COLORS[interview.status] ?? STATUS_COLORS.draft}`}>
                  {interview.status}
                </span>
                <div className="flex items-center gap-0.5">
                  <Link
                    href={`/employer/interviews/${interview.id}/edit`}
                    data-testid={`button-edit-interview-${interview.id}`}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                  >
                    <Pencil size={13} />
                  </Link>
                  <button
                    data-testid={`button-delete-interview-${interview.id}`}
                    onClick={() => handleDelete(interview.id, interview.title)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
