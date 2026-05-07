import { useAuth } from "@workspace/replit-auth-web";
import { useUpdateUserRole } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, User } from "lucide-react";
import { useEffect } from "react";

export default function SelectRole() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const updateRole = useUpdateUserRole();

  useEffect(() => {
    if (!user) {
      setLocation("/");
    } else if (user.role === "employer") {
      setLocation("/employer");
    } else if (user.role === "candidate") {
      setLocation("/candidate");
    }
  }, [user, setLocation]);

  const handleSelectRole = (role: "candidate" | "employer") => {
    updateRole.mutate({ data: { role } }, {
      onSuccess: () => {
        // useAuth will refetch and trigger useEffect above to redirect
        window.location.href = role === "employer" ? "/employer" : "/candidate";
      }
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to Interview Architect</h1>
          <p className="text-muted-foreground">How will you be using the platform?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover-elevate cursor-pointer border-2 hover:border-primary transition-all duration-200" onClick={() => handleSelectRole("candidate")}>
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <User className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl">Candidate</CardTitle>
              <CardDescription className="text-base mt-2">
                I want to practice interviews and improve my skills
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-0">
              <Button className="w-full" disabled={updateRole.isPending}>
                I'm a Candidate
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-elevate cursor-pointer border-2 hover:border-primary transition-all duration-200" onClick={() => handleSelectRole("employer")}>
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <Briefcase className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl">Employer</CardTitle>
              <CardDescription className="text-base mt-2">
                I want to evaluate candidates and run interviews
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-0">
              <Button className="w-full" disabled={updateRole.isPending}>
                I'm an Employer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
