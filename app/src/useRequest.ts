import { useCallback, useEffect, useRef, useState } from "react";

export type RequestState<T> =
  | { status: "loading"; data: T | null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: T | null; error: string };

/** Runs `load` whenever `deps` change; keeps the last data while refreshing. */
export function useRequest<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<RequestState<T>>({ status: "loading", data: null, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const seq = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps);

  const execute = useCallback(
    async (mode: "initial" | "refresh") => {
      const id = ++seq.current;
      if (mode === "refresh") setRefreshing(true);
      else setState((s) => ({ status: "loading", data: s.data, error: null }));
      try {
        const data = await run();
        if (id === seq.current) setState({ status: "success", data, error: null });
        return true;
      } catch (err) {
        if (id === seq.current) {
          setState((s) => ({
            status: "error",
            data: s.data,
            error: err instanceof Error ? err.message : "Something went wrong",
          }));
        }
        return false;
      } finally {
        if (id === seq.current) setRefreshing(false);
      }
    },
    [run],
  );

  useEffect(() => {
    execute("initial");
  }, [execute]);

  return {
    state,
    refreshing,
    retry: () => execute("initial"),
    refresh: () => execute("refresh"),
  };
}
