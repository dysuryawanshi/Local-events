import { getCalendars, getDefaultCalendarSync, requestCalendarPermissions } from "expo-calendar";
import { Platform } from "react-native";
import type { LocalEvent } from "./api";

export class CalendarPermissionError extends Error {}

export type CalendarResult = { kind: "created" | "downloaded"; calendarTitle: string };

/** Writes the event into the device calendar. */
export async function addToCalendar(event: LocalEvent): Promise<CalendarResult> {
  const permission = await requestCalendarPermissions(Platform.OS === "ios");
  if (!permission.granted) {
    throw new CalendarPermissionError("Calendar access was not allowed.");
  }

  let calendar;
  if (Platform.OS === "ios") {
    calendar = getDefaultCalendarSync();
  } else {
    const calendars = await getCalendars();
    const writable = calendars.filter((c) => c.allowsModifications);
    calendar = writable.find((c) => c.isPrimary) ?? writable[0];
  }
  if (!calendar) {
    throw new Error("No writable calendar was found on this device. Add a calendar account and try again.");
  }

  await calendar.createEvent({
    title: event.title,
    startDate: new Date(event.startsAt),
    endDate: new Date(event.endsAt),
    location: `${event.venue}, ${event.address}, ${event.city}`,
    notes: `${event.description}\n\nTickets: ${event.ticketUrl}`,
    url: event.ticketUrl,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  return { kind: "created", calendarTitle: calendar.title ?? "your calendar" };
}
