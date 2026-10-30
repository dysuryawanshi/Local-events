import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Button, Chip, Snackbar, Text, useTheme } from "react-native-paper";
import { api, type EventType, type LocalEvent } from "../../api";
import { useAuth } from "../../auth";
import { EventCard } from "../../components/EventCard";
import { StateView } from "../../components/StateView";
import { EVENT_TYPES, typeMeta, upcomingDays } from "../../format";
import { useSaved } from "../../saved";
import { palette } from "../../theme";
import { useRequest } from "../../useRequest";

type Toast = { message: string; action?: { label: string; onPress: () => void } } | null;

export default function EventListScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { status: authStatus } = useAuth();
  const saved = useSaved();
  const days = useMemo(() => upcomingDays(7), []);
  const [type, setType] = useState<EventType | null>(null);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const day = days.find((d) => d.key === dayKey) ?? null;
  const { state, refreshing, retry, refresh } = useRequest(
    () => api.listEvents({ type: type ?? undefined, from: day?.from, to: day?.to }),
    [type, day?.from, day?.to],
  );

  const onRefresh = async () => {
    const ok = await refresh();
    if (ok) setToast({ message: "Events updated" });
  };

  const onToggleSave = async (event: LocalEvent) => {
    if (authStatus !== "signedIn") {
      setToast({
        message: "Sign in to save events",
        action: { label: "Sign in", onPress: () => router.push("/account") },
      });
      return;
    }
    try {
      const nowSaved = await saved.toggle(event);
      setToast({
        message: nowSaved ? `Saved “${event.title}”` : `Removed “${event.title}”`,
        action: nowSaved ? { label: "View", onPress: () => router.push("/saved") } : undefined,
      });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Couldn't update saved events" });
    }
  };

  const events = state.data ?? [];
  const filterSummary = [type ? typeMeta(type).label.toLowerCase() : null, "events", day ? `on ${day.longLabel}` : null]
    .filter(Boolean)
    .join(" ");

  let content;
  if (state.status === "loading" && !state.data) {
    content = <StateView kind="loading" title="Finding events near you…" />;
  } else if (state.status === "error" && !state.data) {
    content = (
      <StateView kind="error" title="Couldn't load events" message={state.error} actionLabel="Try again" onAction={retry} />
    );
  } else if (events.length === 0) {
    content = (
      <StateView
        kind="empty"
        icon={day ? "calendar-remove-outline" : "magnify-close"}
        title={day && !type ? `Nothing on ${day.longLabel}` : `No ${filterSummary}`}
        message={
          day
            ? "Nothing is listed for this day yet. Try another day or browse everything coming up."
            : "Nothing matches this type right now. Try a different type."
        }
        actionLabel={day ? "Show all days" : "Show all types"}
        onAction={() => (day ? setDayKey(null) : setType(null))}
      />
    );
  } else {
    content = (
      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.navy]} />}
        ListHeaderComponent={
          <View style={styles.countRow}>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {events.length} {events.length === 1 ? "event" : "events"}
              {state.status === "loading" ? " · updating…" : ""}
            </Text>
            <Button compact icon="refresh" onPress={onRefresh} loading={refreshing} disabled={refreshing}>
              Refresh
            </Button>
          </View>
        }
        renderItem={({ item }) => (
          <EventCard
            event={item}
            saved={saved.isSaved(item.id)}
            onPress={() => router.push({ pathname: "/event/[id]", params: { id: item.id } })}
            onToggleSave={() => onToggleSave(item)}
          />
        )}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Chip selected={type === null} showSelectedCheck={false} onPress={() => setType(null)} style={chipStyle(type === null)} textStyle={chipText(type === null)}>
            All types
          </Chip>
          {EVENT_TYPES.map((t) => (
            <Chip
              key={t.value}
              icon={t.icon}
              selected={type === t.value}
              showSelectedCheck={false}
              onPress={() => setType(type === t.value ? null : t.value)}
              style={chipStyle(type === t.value)}
              textStyle={chipText(type === t.value)}
              selectedColor={type === t.value ? palette.navy : undefined}
            >
              {t.label}
            </Chip>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Chip selected={dayKey === null} showSelectedCheck={false} onPress={() => setDayKey(null)} style={chipStyle(dayKey === null)} textStyle={chipText(dayKey === null)}>
            Any day
          </Chip>
          {days.map((d) => (
            <Chip
              key={d.key}
              selected={dayKey === d.key}
              showSelectedCheck={false}
              onPress={() => setDayKey(dayKey === d.key ? null : d.key)}
              style={chipStyle(dayKey === d.key)}
              textStyle={chipText(dayKey === d.key)}
            >
              {d.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {state.status === "error" && state.data ? (
        <View style={styles.inlineError}>
          <Text variant="bodyMedium" style={{ color: theme.colors.error, flex: 1 }}>
            {state.error}
          </Text>
          <Button compact onPress={retry}>
            Retry
          </Button>
        </View>
      ) : null}

      <View style={styles.content}>{content}</View>

      <Snackbar
        visible={toast !== null}
        onDismiss={() => setToast(null)}
        duration={3000}
        action={toast?.action ? { label: toast.action.label, onPress: toast.action.onPress, textColor: palette.gold } : undefined}
      >
        {toast?.message ?? ""}
      </Snackbar>
    </View>
  );
}

const chipStyle = (selected: boolean) => ({
  backgroundColor: selected ? palette.gold : palette.surface,
  borderColor: selected ? palette.gold : palette.border,
  borderWidth: 1,
});
const chipText = (selected: boolean) => ({ color: palette.navy, fontWeight: selected ? ("700" as const) : ("400" as const) });

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  filters: { paddingVertical: 8, gap: 8, backgroundColor: palette.background, borderBottomWidth: 1, borderBottomColor: palette.border },
  chipRow: { paddingHorizontal: 16, gap: 8 },
  content: { flex: 1 },
  list: { paddingBottom: 24 },
  countRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8 },
  inlineError: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 6, backgroundColor: "#F9DEDC" },
});
