export type EventType = "MUSIC" | "FOOD" | "FAMILY" | "SPORTS" | "ARTS";

export interface LocalEvent {
  id: string;
  title: string;
  type: EventType;
  description: string;
  venue: string;
  address: string;
  city: string;
  startsAt: string;
  endsAt: string;
  priceLabel: string;
  ticketUrl: string;
  imageUrl: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

async function request<T>(path: string, init: RequestInit & { token?: string | null } = {}): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError("EXPO_PUBLIC_API_URL is not set. Add it to app/.env and restart Expo.", 0);
  }
  const { token, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: {
        Accept: "application/json",
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError("Can't reach the events service. Check your connection and try again.", 0);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = body && typeof body.error === "string" ? body.error : `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return body as T;
}

export const api = {
  listEvents(params: { type?: EventType; from?: string; to?: string }) {
    const qs = new URLSearchParams();
    if (params.type) qs.set("type", params.type);
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    const query = qs.toString();
    return request<{ events: LocalEvent[] }>(`/events${query ? `?${query}` : ""}`).then((r) => r.events);
  },
  getEvent(id: string) {
    return request<{ event: LocalEvent }>(`/events/${encodeURIComponent(id)}`).then((r) => r.event);
  },
  login(email: string, password: string) {
    return request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  me(token: string) {
    return request<{ user: User }>("/auth/me", { token }).then((r) => r.user);
  },
  listSaved(token: string) {
    return request<{ events: LocalEvent[] }>("/me/saved", { token }).then((r) => r.events);
  },
  save(token: string, id: string) {
    return request<void>(`/me/saved/${encodeURIComponent(id)}`, { method: "PUT", token });
  },
  unsave(token: string, id: string) {
    return request<void>(`/me/saved/${encodeURIComponent(id)}`, { method: "DELETE", token });
  },
};
