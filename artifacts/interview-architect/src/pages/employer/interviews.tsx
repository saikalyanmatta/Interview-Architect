import { useState } from "react";
import { Link } from "wouter";
import {
  useListInterviews,
  useListJobProfiles,
  useCreateInterview,
  useDeleteInterview,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar, Trash2, ChevronRight, ClipboardList } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function EmployerInterviews() {
  const { data: interviews, isLoading } = useListInterviews();
  const { data: jobProfiles } = useListJobProfiles();
  const createInterview = useCreateInterview();
  const deleteInterview = useDeleteInterview();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    jobProfileId: "",
    difficulty: "medium",
    interviewerTone: "professional",
    numBehavioralQuestions: "3",
    numTechnicalQuestions: "3",
    numCodingQuestions: "2",
    allowedCodingLanguages: "javascript,python",
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createInterview.mutate(
      {
        data: {
          title: form.title,
          jobProfileId: parseInt(form.jobProfileId, 10),
          difficulty: form.difficulty as any,
          interviewerTone: form.interviewerTone as any,
          numBehavioralQuestions: parseInt(form.numBehavioralQuestions, 10),
          numTechnicalQuestions: parseInt(form.numTechnicalQuestions, 10),
          numCodingQuestions: parseInt(form.numCodingQuestions, 10),
          allowedCodingLanguages: form.allowedCodingLanguages,
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/employer/interviews"] });
          setIsOpen(false);
          setForm({ title: "", jobProfileId: "", difficulty: "medium", interviewerTone: "professional", numBehavioralQuestions: "3", numTechnicalQuestions: "3", numCodingQuestions: "2", allowedCodingLanguages: "javascript,python" });
          toast({ title: "Interview created" });
        }
      }
    );
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this interview?")) return;
    deleteInterview.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/employer/interviews"] });
        toast({ title: "Interview deleted" });
      }
    });
  };

  const statusColor: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    active: "bg-green-100 text-green-700",
    closed: "bg-red-100 text-red-700",
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interviews</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage your interview sessions</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> New Interview</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Interview</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Interview Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Frontend Engineer — Round 1" required />
              </div>
              <div className="space-y-2">
                <Label>Job Profile</Label>
                <Select value={form.jobProfileId} onValueChange={(v) => setForm({ ...form, jobProfileId: v })} required>
                  <SelectTrigger><SelectValue placeholder="Select a job profile" /></SelectTrigger>
                  <SelectContent>
                    {jobProfiles?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Interviewer Tone</Label>
                  <Select value={form.interviewerTone} onValueChange={(v) => setForm({ ...form, interviewerTone: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="strict">Strict</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Behavioral Qs</Label>
                  <Input type="number" min="0" max="10" value={form.numBehavioralQuestions} onChange={(e) => setForm({ ...form, numBehavioralQuestions: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Technical Qs</Label>
                  <Input type="number" min="0" max="10" value={form.numTechnicalQuestions} onChange={(e) => setForm({ ...form, numTechnicalQuestions: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Coding Qs</Label>
                  <Input type="number" min="0" max="5" value={form.numCodingQuestions} onChange={(e) => setForm({ ...form, numCodingQuestions: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Allowed Coding Languages</Label>
                <Input value={form.allowedCodingLanguages} onChange={(e) => setForm({ ...form, allowedCodingLanguages: e.target.value })} placeholder="javascript,python,java" />
                <p className="text-xs text-muted-foreground">Comma-separated list of languages</p>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={createInterview.isPending || !form.jobProfileId}>
                  {createInterview.isPending ? "Creating..." : "Create Interview"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">Loading interviews...</div>
      ) : !interviews?.length ? (
        <Card className="text-center py-12">
          <CardContent>
            <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">No interviews yet</h3>
            <p className="text-muted-foreground mb-4">Create your first interview and invite candidates.</p>
            <Button variant="outline" onClick={() => setIsOpen(true)}>Create Interview</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {interviews.map((interview) => (
            <Link key={interview.id} href={`/employer/interviews/${interview.id}`}>
              <Card className="hover:border-primary cursor-pointer transition-all group h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                      {interview.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-xs px-2 py-0 capitalize ${statusColor[interview.status] ?? ""}`}>
                        {interview.status}
                      </Badge>
                      <button
                        onClick={(e) => handleDelete(e, interview.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{interview.difficulty}</span>
                    <span>•</span>
                    <span className="capitalize">{interview.interviewerTone}</span>
                    <span>•</span>
                    <span>{interview.numBehavioralQuestions + interview.numTechnicalQuestions + interview.numCodingQuestions} questions</span>
                    {interview.scheduledAt && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(interview.scheduledAt), "MMM d, yyyy")}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex justify-end mt-3">
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
