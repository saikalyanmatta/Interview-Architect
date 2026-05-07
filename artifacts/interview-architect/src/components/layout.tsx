import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { LogOut, User, Briefcase, Code, LayoutDashboard } from "lucide-react";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isEmployer = user?.role === "employer";
  const isCandidate = user?.role === "candidate";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <Code className="w-6 h-6" />
            Interview Architect
          </Link>
          
          <nav className="flex items-center gap-6">
            {user ? (
              <>
                {isEmployer && (
                  <>
                    <Link href="/employer" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/employer" ? "text-primary" : "text-muted-foreground"}`}>
                      Dashboard
                    </Link>
                    <Link href="/employer/job-profiles" className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith("/employer/job-profiles") ? "text-primary" : "text-muted-foreground"}`}>
                      Job Profiles
                    </Link>
                    <Link href="/employer/interviews" className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith("/employer/interviews") ? "text-primary" : "text-muted-foreground"}`}>
                      Interviews
                    </Link>
                  </>
                )}
                
                {isCandidate && (
                  <>
                    <Link href="/candidate" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/candidate" ? "text-primary" : "text-muted-foreground"}`}>
                      Dashboard
                    </Link>
                    <Link href="/candidate/interviews" className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith("/candidate/interviews") ? "text-primary" : "text-muted-foreground"}`}>
                      Interviews
                    </Link>
                  </>
                )}

                <div className="flex items-center gap-4 ml-4 pl-4 border-l">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <User className="w-4 h-4" />
                    {user.firstName || user.email?.split("@")[0]}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => logout()} className="gap-2">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <Button asChild>
                <Link href="/login">Login</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
