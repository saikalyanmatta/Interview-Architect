import { useState, useEffect, useCallback } from "react";
import type { AuthUser } from "@workspace/api-client-react";

export type { AuthUser };

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (opts: { email: string; password: string; firstName?: string; lastName?: string }) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/user", { credentials: "include" })
      .then((r) => { if (!r.ok) throw new Error(); return r.json() as Promise<{ user: AuthUser | null }>; })
      .then((d) => { if (!cancelled) { setUser(d.user ?? null); setIsLoading(false); } })
      .catch(() => { if (!cancelled) { setUser(null); setIsLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Login failed" };
    setUser(data.user ?? null);
    return {};
  }, []);

  const register = useCallback(async (opts: { email: string; password: string; firstName?: string; lastName?: string }) => {
    const res = await fetch("/api/auth/register", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || "Registration failed" };
    setUser(data.user ?? null);
    return {};
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
  }, []);

  return { user, isLoading, isAuthenticated: !!user, login, register, logout };
}
