import { useState } from "react";
import { useParseResume } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CandidateResume() {
  const [resumeText, setResumeText] = useState("");
  const parseResume = useParseResume();
  const { toast } = useToast();
  
  const [result, setResult] = useState<{skills: string[], suggestedRole: string, summary?: string} | null>(null);

  const handleAnalyze = () => {
    if (!resumeText.trim()) return;
    parseResume.mutate(
      { data: { resumeText } },
      {
        onSuccess: (data) => {
          setResult(data);
          toast({ title: "Analysis complete", description: "Successfully extracted skills." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to parse resume.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Resume Analyzer</h1>
        <p className="text-muted-foreground mt-1">Paste your resume text to extract skills and get personalized role suggestions.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Paste Resume Content</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <Textarea 
                placeholder="Paste your plain-text resume here..."
                className="flex-1 min-h-[300px] mb-4 font-mono text-sm"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
              <Button onClick={handleAnalyze} disabled={parseResume.isPending || !resumeText.trim()} className="w-full">
                {parseResume.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : "Analyze Resume"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>Extracted profile details</CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Suggested Role</h3>
                    <div className="text-xl font-bold text-primary">{result.suggestedRole}</div>
                  </div>
                  
                  {result.summary && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Professional Summary</h3>
                      <p className="text-sm leading-relaxed">{result.summary}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Detected Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.skills.map((skill, i) => (
                        <Badge key={i} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mb-4 opacity-20" />
                  <p>Paste your resume and click Analyze to see your extracted skills and recommended roles.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}