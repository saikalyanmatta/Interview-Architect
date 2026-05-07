import { useAuth } from "@workspace/replit-auth-web";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Code, CheckCircle, BrainCircuit, Target } from "lucide-react";
import { useEffect } from "react";

export default function Home() {
  const { user, login } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      if (!user.role) {
        setLocation("/select-role");
      } else if (user.role === "employer") {
        setLocation("/employer");
      } else if (user.role === "candidate") {
        setLocation("/candidate");
      }
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <Code className="w-6 h-6" />
            Interview Architect
          </div>
          <Button onClick={() => login()}>Log In</Button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-24 lg:py-32 overflow-hidden relative">
          <div className="container mx-auto px-4 text-center relative z-10">
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-6">
              Precision tools for <br className="hidden lg:block" />
              <span className="text-primary">serious professionals.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              A full-stack AI-powered interview practice and hiring platform. 
              Sharpen your skills as a candidate, or run real hiring pipelines as an employer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-12 px-8 text-lg" onClick={() => login()}>
                Get Started
              </Button>
            </div>
          </div>
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        </section>

        {/* Features */}
        <section className="py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card p-8 rounded-xl border">
                <Target className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Targeted Practice</h3>
                <p className="text-muted-foreground">Tailor your practice sessions to specific job profiles and skill requirements.</p>
              </div>
              <div className="bg-card p-8 rounded-xl border">
                <BrainCircuit className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">AI-Powered Feedback</h3>
                <p className="text-muted-foreground">Get detailed, actionable feedback on behavioral and technical responses instantly.</p>
              </div>
              <div className="bg-card p-8 rounded-xl border">
                <CheckCircle className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Real Coding Tests</h3>
                <p className="text-muted-foreground">Built-in Monaco editor for authentic technical assessments and code evaluations.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Built by TechCrew</h2>
              <p className="text-muted-foreground">The team behind Interview Architect</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
              <div>
                <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center text-primary text-xl font-bold">A</div>
                <h4 className="font-bold">Alex</h4>
                <p className="text-sm text-muted-foreground">CEO</p>
              </div>
              <div>
                <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center text-primary text-xl font-bold">P</div>
                <h4 className="font-bold">Priya</h4>
                <p className="text-sm text-muted-foreground">AI Lead</p>
              </div>
              <div>
                <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center text-primary text-xl font-bold">S</div>
                <h4 className="font-bold">Sam</h4>
                <p className="text-sm text-muted-foreground">Backend</p>
              </div>
              <div>
                <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center text-primary text-xl font-bold">J</div>
                <h4 className="font-bold">Jordan</h4>
                <p className="text-sm text-muted-foreground">Frontend</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t text-center text-muted-foreground">
        <p>© {new Date().getFullYear()} Interview Architect. All rights reserved.</p>
      </footer>
    </div>
  );
}
