import * as Haptics from "expo-haptics";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import { api, type LocalEvent } from "./api";
import { useAuth } from "./auth";

type LoadState = "idle" | "loading" | "ready" | "error";

interface SavedState {
  events: LocalEvent[];
  status: LoadState;
  error: string | null;
  isSaved: (id: string) => boolean;
  /** Returns true when the event is now saved, false when it was removed. */
  toggle: (event: LocalEvent) => Promise<boolean>;
  reload: () => Promise<void>;
}

const SavedContext = createContext<SavedState | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const { token, status: authStatus } = useAuth();
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    setStatus("loading");
    setError(null);
    try {
      setEvents(await api.listSaved(token));
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load saved events");
      setStatus("error");
    }
  }, [token]);

  useEffect(() => {
    if (authStatus === "signedIn") {
      reload();
    } else {
      setEvents([]);
      setStatus("idle");
      setError(null);
    }
  }, [authStatus, reload]);

  const savedIds = useMemo(() => new Set(events.map((e) => e.id)), [events]);
  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds]);

  const toggle = useCallback(
    async (event: LocalEvent) => {
      if (!token) throw new Error("Sign in to save events");
      const wasSaved = savedIds.has(event.id);
      // Optimistic update, rolled back if the request fails.
      setEvents((prev) =>
        wasSaved
          ? prev.filter((e) => e.id !== event.id)
          : [...prev, event].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
      );
      try {
        if (wasSaved) await api.unsave(token, event.id);
        else await api.save(token, event.id);
        if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
        return !wasSaved;
      } catch (err) {
        setEvents((prev) =>
          wasSaved
            ? [...prev, event].sort((a, b) => a.startsAt.localeCompare(b.startsAt))
            : prev.filter((e) => e.id !== event.id),
        );
        throw err;
      }
    },
    [token, savedIds],
  );

  const value = useMemo(
    () => ({ events, status, error, isSaved, toggle, reload }),
    [events, status, error, isSaved, toggle, reload],
  );
  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used inside SavedProvider");
  return ctx;
}
