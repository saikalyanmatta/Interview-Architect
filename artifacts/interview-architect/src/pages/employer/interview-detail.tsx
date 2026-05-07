import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import {
  useGetInterview,
  useUpdateInterview,
  useDeleteInterview,
  useAddInvitations,
  useListInterviewSessions,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, UserPlus, ExternalLink, Pencil, Trash2, Users, ClipboardCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function EmployerInterviewDetail() {
  const { id } = useParams<{ id: string }>();
  const interviewId = parseInt(id ?? "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: interview, isLoading } = useGetInterview(interviewId);
  const { data: sessions } = useListInterviewSessions(interviewId);
  const addInvitations = useAddInvitations();
  const updateInterview = useUpdateInterview();
  const deleteInterview = useDeleteInterview();

  const [emailsText, setEmailsText] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const handleAddInvitations = (e: React.FormEvent) => {
    e.preventDefault();
    const emails = emailsText.split(/[\n,]/).map(e => e.trim()).filter(Boolean);
    if (!emails.length) return;
    addInvitations.mutate(
      { id: interviewId, data: { emails } },
      {
        onSuccess: (added) => {
          queryClient.invalidateQueries({ queryKey: [`/api/employer/interviews/${interviewId}`] });
          setEmailsText("");
          toast({ title: `${added.length} invitation(s) added` });
        }
      }
    );
  };

  const handleUpdateStatus = (status: string) => {
    updateInterview.mutate({ id: interviewId, data: { status: status as any } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/employer/interviews/${interviewId}`] });
        toast({ title: "Interview updated" });
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this interview and all its data?")) return;
    deleteInterview.mutate({ id: interviewId }, {
      onSuccess: () => {
        setLocation("/employer/interviews");
        toast({ title: "Interview deleted" });
      }
    });
  };

  const statusColor: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    active: "bg-green-100 text-green-700",
    closed: "bg-red-100 text-red-700",
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!interview) {
    return (
      <div className="container mx-auto py-16 text-center">
        <p className="text-muted-foreground mb-4">Interview not found.</p>
        <Button variant="outline" onClick={() => setLocation("/employer/interviews")}>Back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-6">
        <button onClick={() => setLocation("/employer/interviews")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Interviews
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{interview.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge className={`text-xs capitalize ${statusColor[interview.status] ?? ""}`}>{interview.status}</Badge>
              <span className="text-sm text-muted-foreground capitalize">{interview.difficulty} difficulty</span>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground capitalize">{interview.interviewerTone} tone</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={interview.status} onValueChange={handleUpdateStatus}>
              <SelectTrigger className="w-[120px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Behavioral", value: interview.numBehavioralQuestions },
          { label: "Technical", value: interview.numTechnicalQuestions },
          { label: "Coding", value: interview.numCodingQuestions },
          { label: "Invitations", value: interview.invitations?.length ?? 0 },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="invitations">
        <TabsList className="mb-6">
          <TabsTrigger value="invitations" className="gap-2"><Users className="w-4 h-4" /> Invitations ({interview.invitations?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2"><ClipboardCheck className="w-4 h-4" /> Sessions ({interview.sessionCount ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="invitations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><UserPlus className="w-4 h-4" /> Add Candidates</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddInvitations} className="space-y-3">
                <div>
                  <Label className="text-sm">Email Addresses</Label>
                  <Textarea
                    value={emailsText}
                    onChange={(e) => setEmailsText(e.target.value)}
                    placeholder="Enter emails, one per line or comma-separated&#10;alice@example.com&#10;bob@example.com"
                    className="mt-1.5 min-h-[100px] text-sm"
                  />
                </div>
                <Button type="submit" disabled={addInvitations.isPending || !emailsText.trim()} size="sm">
                  {addInvitations.isPending ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Adding...</> : "Add Invitations"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {interview.invitations && interview.invitations.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">Invited Candidates</h3>
              <div className="space-y-2">
                {interview.invitations.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between px-4 py-3 rounded-lg border bg-card">
                    <span className="text-sm">{inv.email}</span>
                    <Badge variant={inv.status === "completed" ? "default" : "secondary"} className="text-xs capitalize">
                      {inv.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions">
          {!sessions?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No sessions yet. Sessions appear here once candidates start the interview.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session: any) => (
                <Link key={session.id} href={`/employer/sessions/${session.id}`}>
                  <div className="flex items-center justify-between px-4 py-4 rounded-lg border bg-card hover:border-primary cursor-pointer transition-all group">
                    <div>
                      <div className="font-medium text-sm">{session.candidateName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{session.candidateEmail}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {session.overallScore !== null && (
                          <div className={`text-lg font-bold ${session.overallScore >= 70 ? "text-green-600" : session.overallScore >= 40 ? "text-amber-600" : "text-red-500"}`}>
                            {session.overallScore}/100
                          </div>
                        )}
                        <Badge variant={session.status === "completed" ? "default" : "secondary"} className="text-xs capitalize">
                          {session.status}
                        </Badge>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
