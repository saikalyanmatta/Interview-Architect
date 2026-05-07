import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import {
  useGetInterview, getGetInterviewQueryKey,
  useAddInvitations,
  useListInterviewSessions, getListInterviewSessionsQueryKey,
  getListInvitationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Plus, Users, Copy, ExternalLink } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  active: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function InterviewDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const interviewId = parseInt(id);

  const interview = useGetInterview(interviewId, { query: { queryKey: getGetInterviewQueryKey(interviewId) } });
  const sessions = useListInterviewSessions(interviewId, { query: { queryKey: getListInterviewSessionsQueryKey(interviewId) } });
  const addInvitations = useAddInvitations();

  const [emailsText, setEmailsText] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);

  const handleAddInvitations = () => {
    const emails = emailsText.split(/[\n,]+/).map((e) => e.trim()).filter(Boolean);
    if (emails.length === 0) { toast({ title: "No valid emails", variant: "destructive" }); return; }

    addInvitations.mutate(
      { params: { id: interviewId }, data: { emails } } as any,
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetInterviewQueryKey(interviewId) });
          queryClient.invalidateQueries({ queryKey: getListInvitationsQueryKey(interviewId) });
          setEmailsText("");
          setShowInviteForm(false);
          toast({ title: `${emails.length} invitation(s) sent` });
        },
        onError: () => toast({ title: "Failed to add invitations", variant: "destructive" }),
      }
    );
  };

  const copyInterviewId = () => {
    navigator.clipboard.writeText(String(interviewId));
    toast({ title: "Interview ID copied" });
  };

  if (interview.isLoading) {
    return <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>;
  }

  const data = interview.data as any;

  return (
    <div className="p-6 max-w-4xl">
      <button onClick={() => setLocation("/employer/interviews")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5 transition-colors">
        <ArrowLeft size={13} /> Back to interviews
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">{data?.title}</h1>
          {data?.jobProfile && <p className="text-sm text-muted-foreground mt-0.5">{data.jobProfile.title}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            data-testid="button-copy-id"
            onClick={copyInterviewId}
            className="flex items-center gap-1.5 text-xs px-3 py-2 bg-secondary hover:bg-secondary/80 border border-border text-secondary-foreground rounded-lg transition-colors"
          >
            <Copy size={12} /> ID: {interviewId}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Difficulty", value: data?.difficulty },
          { label: "Tone", value: data?.interviewerTone },
          { label: "Status", value: data?.status },
          { label: "Sessions", value: data?.sessionCount ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="border border-border rounded-lg p-3 bg-card">
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className="text-sm font-medium text-foreground capitalize">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Behavioral", value: data?.numBehavioralQuestions },
          { label: "Technical", value: data?.numTechnicalQuestions },
          { label: "Coding", value: data?.numCodingQuestions },
        ].map(({ label, value }) => (
          <div key={label} className="border border-border rounded-lg p-3 bg-card">
            <p className="text-xs text-muted-foreground mb-0.5">{label} Questions</p>
            <p className="text-2xl font-bold text-foreground">{value ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Skills */}
      {data?.jobProfile?.skills?.length > 0 && (
        <div className="border border-border rounded-xl p-4 bg-card mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">Skills Assessed</p>
          <div className="flex flex-wrap gap-2">
            {data.jobProfile.skills.map((s: any) => (
              <div key={s.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-background text-xs">
                <span className="text-foreground">{s.skillName}</span>
                <span className="text-muted-foreground">{s.weightage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invitations */}
      <div className="border border-border rounded-xl bg-card overflow-hidden mb-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Invited Candidates</h2>
            <span className="text-xs text-muted-foreground">({data?.invitations?.length ?? 0})</span>
          </div>
          <button
            data-testid="button-add-candidates"
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded transition-colors"
          >
            <Plus size={12} /> Add Candidates
          </button>
        </div>

        {showInviteForm && (
          <div className="p-4 border-b border-border bg-background">
            <label className="block text-xs font-medium text-foreground mb-1.5">Emails (one per line or comma-separated)</label>
            <textarea
              data-testid="textarea-emails"
              value={emailsText}
              onChange={(e) => setEmailsText(e.target.value)}
              rows={4}
              placeholder={"alice@example.com\nbob@example.com"}
              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
            <div className="flex gap-2 mt-2">
              <button
                data-testid="button-send-invitations"
                onClick={handleAddInvitations}
                disabled={addInvitations.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-xs font-medium disabled:opacity-60"
              >
                {addInvitations.isPending ? <Loader2 size={12} className="animate-spin" /> : "Send Invitations"}
              </button>
              <button onClick={() => setShowInviteForm(false)} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs">
                Cancel
              </button>
            </div>
          </div>
        )}

        {(data?.invitations?.length ?? 0) === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No candidates invited yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.invitations.map((inv: any) => (
              <div key={inv.id} data-testid={`row-invitation-${inv.id}`} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-foreground">{inv.email}</span>
                <span className={`text-xs px-2 py-0.5 rounded border capitalize ${STATUS_COLORS[inv.status] ?? STATUS_COLORS.pending}`}>
                  {inv.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sessions */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Interview Sessions</h2>
        </div>
        {sessions.isLoading ? (
          <div className="flex justify-center py-6"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
        ) : (sessions.data as any[])?.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No sessions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {(sessions.data as any[]).map((session: any) => (
              <Link key={session.id} href={`/employer/interviews/${interviewId}/sessions/${session.id}`}
                data-testid={`row-session-${session.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/20 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{session.candidateName || session.candidateEmail}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{session.candidateEmail}</p>
                </div>
                <div className="flex items-center gap-3">
                  {session.overallScore !== null && (
                    <span className="text-sm font-semibold text-foreground">{session.overallScore}/100</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded border capitalize ${STATUS_COLORS[session.status] ?? STATUS_COLORS.pending}`}>
                    {session.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
