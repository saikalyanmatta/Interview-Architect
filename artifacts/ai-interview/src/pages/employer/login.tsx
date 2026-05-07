import { useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function EmployerLogin() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, login } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/employer/dashboard");
    } else if (!isLoading && !isAuthenticated) {
      login();
    }
  }, [isAuthenticated, isLoading]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-primary" />
    </div>
  );
}
