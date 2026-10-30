import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError, type User } from "./api";
import { tokenStorage } from "./tokenStorage";

interface AuthState {
  status: "restoring" | "signedOut" | "signedIn";
  user: User | null;
  token: string | null;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState["status"]>("restoring");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await tokenStorage.get().catch(() => null);
      if (!stored) {
        if (!cancelled) setStatus("signedOut");
        return;
      }
      try {
        const me = await api.me(stored);
        if (cancelled) return;
        setToken(stored);
        setUser(me);
        setStatus("signedIn");
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) await tokenStorage.clear().catch(() => {});
        if (!cancelled) setStatus("signedOut");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await api.login(email.trim(), password);
    await tokenStorage.set(result.token);
    setToken(result.token);
    setUser(result.user);
    setStatus("signedIn");
    return result.user;
  }, []);

  const signOut = useCallback(async () => {
    await tokenStorage.clear().catch(() => {});
    setToken(null);
    setUser(null);
    setStatus("signedOut");
  }, []);

  const value = useMemo(() => ({ status, user, token, signIn, signOut }), [status, user, token, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
