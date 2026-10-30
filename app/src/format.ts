import type { EventType } from "./api";

export const EVENT_TYPES: { value: EventType; label: string; icon: string }[] = [
  { value: "MUSIC", label: "Music", icon: "music-note" },
  { value: "FOOD", label: "Food", icon: "silverware-fork-knife" },
  { value: "FAMILY", label: "Family", icon: "human-male-female-child" },
  { value: "SPORTS", label: "Sports", icon: "soccer" },
  { value: "ARTS", label: "Arts", icon: "palette" },
];

export const typeMeta = (type: EventType) => EVENT_TYPES.find((t) => t.value === type)!;

export interface DayOption {
  key: string;
  label: string;
  longLabel: string;
  from: string;
  to: string;
}

/** Today plus the next six days, as local-midnight windows. */
export function upcomingDays(count = 7, now = new Date()): DayOption[] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const from = new Date(start);
    from.setDate(start.getDate() + i);
    const to = new Date(from);
    to.setDate(from.getDate() + 1);
    const short = `${from.toLocaleDateString(undefined, { weekday: "short" })} ${from.getDate()}`;
    const long = from.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
    return {
      key: `${from.getFullYear()}-${from.getMonth() + 1}-${from.getDate()}`,
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : short,
      longLabel: i === 0 ? "today" : i === 1 ? "tomorrow" : long,
      from: from.toISOString(),
      to: to.toISOString(),
    };
  });
}

export function formatWhen(startsAt: string, endsAt: string) {
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  const day = s.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${day} · ${time(s)} – ${time(e)}`;
}

export function formatLongDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTimeRange(startsAt: string, endsAt: string) {
  const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${time(startsAt)} – ${time(endsAt)}`;
}
