import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCheckCandidateAccess, useCreateSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, KeyRound } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";

export default function CandidateInterviews() {
  const [interviewId, setInterviewId] = useState("");
  const { user } = useAuth();
  const checkAccess = useCheckCandidateAccess();
  const createSession = useCreateSession();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleCheckAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewId || !user?.email) return;
    
    checkAccess.mutate(
      { data: { interviewId: parseInt(interviewId, 10), email: user.email } },
      {
        onError: () => {
          toast({ title: "Access Denied", description: "You don't have an invitation for this interview.", variant: "destructive" });
        }
      }
    );
  };

  const handleStartSession = () => {
    if (!checkAccess.data?.interview || !user?.email) return;
    const interview = checkAccess.data.interview;
    
    createSession.mutate(
      {
        data: {
          interviewId: interview.id,
          candidateEmail: user.email,
          candidateName: user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email,
          difficulty: interview.difficulty,
          interviewerTone: interview.interviewerTone,
          codingLanguage: interview.allowedCodingLanguages.split(',')[0] || "javascript"
        }
      },
      {
        onSuccess: (session) => {
          setLocation(`/candidate/session/${session.id}`);
        }
      }
    );
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Access Interview</h1>
        <p className="text-muted-foreground mt-2">Enter your interview ID to check your invitation and begin the session.</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Interview Verification</CardTitle>
          <CardDescription>You must be invited by the employer via your email ({user?.email}).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCheckAccess} className="flex gap-4">
            <div className="flex-1">
              <Input 
                placeholder="Enter Interview ID (e.g. 101)" 
                value={interviewId}
                onChange={(e) => setInterviewId(e.target.value)}
                type="number"
                required
              />
            </div>
            <Button type="submit" disabled={checkAccess.isPending}>
              {checkAccess.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
              Verify
            </Button>
          </form>
        </CardContent>
      </Card>

      {checkAccess.data?.hasAccess && checkAccess.data.interview && (
        <Card className="border-primary animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl mb-1">{checkAccess.data.interview.title}</CardTitle>
                <CardDescription>
                  {checkAccess.data.jobProfile?.title || "Professional Interview"}
                </CardDescription>
              </div>
              <Badge variant="outline" className="capitalize">{checkAccess.data.interview.difficulty}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-6">
              <div className="bg-muted p-3 rounded-md text-center">
                <div className="font-semibold text-lg">{checkAccess.data.interview.numBehavioralQuestions}</div>
                <div className="text-muted-foreground text-xs uppercase tracking-wider">Behavioral</div>
              </div>
              <div className="bg-muted p-3 rounded-md text-center">
                <div className="font-semibold text-lg">{checkAccess.data.interview.numTechnicalQuestions}</div>
                <div className="text-muted-foreground text-xs uppercase tracking-wider">Technical</div>
              </div>
              <div className="bg-muted p-3 rounded-md text-center">
                <div className="font-semibold text-lg">{checkAccess.data.interview.numCodingQuestions}</div>
                <div className="text-muted-foreground text-xs uppercase tracking-wider">Coding</div>
              </div>
              <div className="bg-muted p-3 rounded-md text-center">
                <div className="font-semibold text-lg capitalize">{checkAccess.data.interview.interviewerTone}</div>
                <div className="text-muted-foreground text-xs uppercase tracking-wider">Tone</div>
              </div>
            </div>
            
            <div className="bg-primary/5 p-4 rounded-lg text-sm mb-2">
              <h4 className="font-bold text-primary mb-2">Important Instructions</h4>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Once started, you cannot pause the interview session.</li>
                <li>Your responses will be evaluated by our AI evaluator instantly.</li>
                <li>Make sure you have a stable internet connection.</li>
                {checkAccess.data.interview.numCodingQuestions > 0 && (
                  <li>There will be a coding section at the end.</li>
                )}
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleStartSession} className="w-full" size="lg" disabled={createSession.isPending}>
              {createSession.isPending ? "Starting Session..." : "Start Interview Session"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}