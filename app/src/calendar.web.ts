import type { LocalEvent } from "./api";

// Browsers have no device-calendar API. The web build downloads a standard
// .ics file, which the browser hands to the system calendar app.
export class CalendarPermissionError extends Error {}

export type CalendarResult = { kind: "created" | "downloaded"; calendarTitle: string };

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

export async function addToCalendar(event: LocalEvent): Promise<CalendarResult> {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Local Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id}@local-events`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(event.startsAt)}`,
    `DTEND:${stamp(event.endsAt)}`,
    `SUMMARY:${escape(event.title)}`,
    `LOCATION:${escape(`${event.venue}, ${event.address}, ${event.city}`)}`,
    `DESCRIPTION:${escape(`${event.description}\n\nTickets: ${event.ticketUrl}`)}`,
    `URL:${event.ticketUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { kind: "downloaded", calendarTitle: "your calendar" };
}
