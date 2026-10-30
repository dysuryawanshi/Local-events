import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Chip, Dialog, Divider, List, Portal, Snackbar, Text, useTheme } from "react-native-paper";
import { api, ApiError } from "../../api";
import { useAuth } from "../../auth";
import { addToCalendar, CalendarPermissionError } from "../../calendar";
import { StateView } from "../../components/StateView";
import { formatLongDate, formatTimeRange, typeMeta } from "../../format";
import { useSaved } from "../../saved";
import { palette } from "../../theme";
import { useRequest } from "../../useRequest";

type Toast = { message: string; tone: "success" | "error"; action?: { label: string; onPress: () => void } } | null;

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { status: authStatus } = useAuth();
  const saved = useSaved();
  const { state, retry } = useRequest(() => api.getEvent(String(id)), [id]);
  const [toast, setToast] = useState<Toast>(null);
  const [calendarBusy, setCalendarBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [permissionDialog, setPermissionDialog] = useState(false);

  if (state.status === "loading") {
    return (
      <>
        <Stack.Screen options={{ title: "Event" }} />
        <StateView kind="loading" title="Loading event…" />
      </>
    );
  }
  if (state.status === "error") {
    const notFound = state.error === "Event not found";
    return (
      <>
        <Stack.Screen options={{ title: "Event" }} />
        <StateView
          kind={notFound ? "empty" : "error"}
          icon={notFound ? "calendar-question" : undefined}
          title={notFound ? "This event isn't listed any more" : "Couldn't load this event"}
          message={notFound ? "It may have been cancelled or removed by the organiser." : state.error}
          actionLabel={notFound ? "Browse events" : "Try again"}
          onAction={notFound ? () => router.replace("/") : retry}
        />
      </>
    );
  }

  const event = state.data;
  const meta = typeMeta(event.type);
  const isSaved = saved.isSaved(event.id);
  const isPast = new Date(event.endsAt) < new Date();

  const openTickets = async () => {
    try {
      await Linking.openURL(event.ticketUrl);
    } catch {
      setToast({ tone: "error", message: "Couldn't open the ticket link on this device." });
    }
  };

  const onAddToCalendar = async () => {
    setCalendarBusy(true);
    try {
      const result = await addToCalendar(event);
      setToast({
        tone: "success",
        message:
          result.kind === "downloaded"
            ? "Calendar file downloaded. Open it to add the event."
            : `Added to ${result.calendarTitle}`,
      });
    } catch (err) {
      if (err instanceof CalendarPermissionError) setPermissionDialog(true);
      else setToast({ tone: "error", message: err instanceof Error ? err.message : "Couldn't add to calendar" });
    } finally {
      setCalendarBusy(false);
    }
  };

  const onToggleSave = async () => {
    if (authStatus !== "signedIn") {
      setToast({
        tone: "error",
        message: "Sign in to save events",
        action: { label: "Sign in", onPress: () => router.push("/account") },
      });
      return;
    }
    setSaveBusy(true);
    try {
      const nowSaved = await saved.toggle(event);
      setToast({
        tone: "success",
        message: nowSaved ? "Saved to your list" : "Removed from your list",
        action: nowSaved ? { label: "View", onPress: () => router.push("/saved") } : undefined,
      });
    } catch (err) {
      setToast({ tone: "error", message: err instanceof ApiError ? err.message : "Couldn't update saved events" });
    } finally {
      setSaveBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: meta.label }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          {event.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          ) : null}
          <View style={styles.heroShade} />
          <View style={styles.heroText}>
            <Chip icon={meta.icon} compact style={styles.heroChip} textStyle={{ color: palette.navy }}>
              {meta.label}
            </Chip>
            <Text variant="headlineSmall" style={styles.heroTitle}>
              {event.title}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          {isPast ? (
            <Text variant="labelLarge" style={{ color: theme.colors.error }}>
              This event has finished.
            </Text>
          ) : null}

          <List.Item
            title={formatLongDate(event.startsAt)}
            description={formatTimeRange(event.startsAt, event.endsAt)}
            left={(p) => <List.Icon {...p} icon="calendar-clock" color={palette.navy} />}
          />
          <List.Item
            title={event.venue}
            description={`${event.address}, ${event.city}`}
            left={(p) => <List.Icon {...p} icon="map-marker-outline" color={palette.navy} />}
          />
          <List.Item
            title={event.priceLabel}
            description="Price"
            left={(p) => <List.Icon {...p} icon="ticket-outline" color={palette.navy} />}
          />
          <Divider style={styles.divider} />

          <Text variant="titleMedium" style={styles.sectionTitle}>
            About
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, lineHeight: 24, paddingHorizontal: 8 }}>
            {event.description}
          </Text>

          <View style={styles.actions}>
            <Button
              mode="contained"
              icon="open-in-new"
              onPress={openTickets}
              buttonColor={palette.gold}
              textColor={palette.navy}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              accessibilityHint="Opens the organiser's ticket page"
            >
              Get tickets
            </Button>
            <Button
              mode="contained"
              icon="calendar-plus"
              onPress={onAddToCalendar}
              loading={calendarBusy}
              disabled={calendarBusy || isPast}
              contentStyle={styles.buttonContent}
            >
              Add to calendar
            </Button>
            <Button
              mode="outlined"
              icon={isSaved ? "bookmark" : "bookmark-outline"}
              onPress={onToggleSave}
              loading={saveBusy}
              disabled={saveBusy}
              contentStyle={styles.buttonContent}
            >
              {isSaved ? "Saved" : "Save event"}
            </Button>
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }}>
            Tickets are sold by the organiser at {safeHost(event.ticketUrl)}.
          </Text>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={permissionDialog} onDismiss={() => setPermissionDialog(false)}>
          <Dialog.Icon icon="calendar-lock" />
          <Dialog.Title style={{ textAlign: "center" }}>Calendar access needed</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              To add this event, allow Local Events to use your calendar in your device settings, then try again.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPermissionDialog(false)}>Not now</Button>
            <Button
              onPress={() => {
                setPermissionDialog(false);
                Linking.openSettings().catch(() => {});
              }}
            >
              Open settings
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={toast !== null}
        onDismiss={() => setToast(null)}
        duration={3500}
        style={{ backgroundColor: toast?.tone === "error" ? theme.colors.error : palette.navy }}
        action={toast?.action ? { label: toast.action.label, onPress: toast.action.onPress, textColor: palette.gold } : undefined}
        icon={toast?.tone === "success" ? "check-circle" : undefined}
      >
        {toast?.message ?? ""}
      </Snackbar>
    </View>
  );
}

function safeHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  scroll: { paddingBottom: 40 },
  hero: { height: 240, backgroundColor: palette.navy, justifyContent: "flex-end" },
  heroShade: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(20,33,61,0.55)" },
  heroText: { padding: 16, gap: 8 },
  heroChip: { alignSelf: "flex-start", backgroundColor: palette.gold },
  heroTitle: { color: "#FFFFFF", fontWeight: "700" },
  body: { padding: 8, gap: 4, maxWidth: 720, width: "100%", alignSelf: "center" },
  divider: { marginVertical: 8 },
  sectionTitle: { paddingHorizontal: 8, marginBottom: 4 },
  actions: { gap: 10, marginTop: 20, marginBottom: 8, paddingHorizontal: 8 },
  buttonContent: { paddingVertical: 6 },
  buttonLabel: { fontWeight: "700" },
});
