// expo-secure-store has no web implementation; the browser build keeps the
// session token in localStorage instead.
const KEY = "local-events.token";

export const tokenStorage = {
  get: async () => window.localStorage.getItem(KEY),
  set: async (token: string) => window.localStorage.setItem(KEY, token),
  clear: async () => window.localStorage.removeItem(KEY),
};
