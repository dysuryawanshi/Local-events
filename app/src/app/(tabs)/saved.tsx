import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { Button, Snackbar, Text, useTheme } from "react-native-paper";
import type { LocalEvent } from "../../api";
import { useAuth } from "../../auth";
import { EventCard } from "../../components/EventCard";
import { StateView } from "../../components/StateView";
import { useSaved } from "../../saved";
import { palette } from "../../theme";

type Toast = { message: string; undo?: LocalEvent } | null;

export default function SavedScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { status: authStatus } = useAuth();
  const saved = useSaved();
  const [toast, setToast] = useState<Toast>(null);
  const [refreshing, setRefreshing] = useState(false);

  const remove = async (event: LocalEvent) => {
    try {
      await saved.toggle(event);
      setToast({ message: `Removed “${event.title}”`, undo: event });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Couldn't remove event" });
    }
  };

  const undo = async (event: LocalEvent) => {
    try {
      await saved.toggle(event);
      setToast({ message: "Restored to your list" });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Couldn't restore event" });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await saved.reload();
    setRefreshing(false);
  };

  let content;
  if (authStatus === "restoring") {
    content = <StateView kind="loading" title="Checking your account…" />;
  } else if (authStatus === "signedOut") {
    content = (
      <StateView
        kind="empty"
        icon="account-lock-outline"
        title="Sign in to see saved events"
        message="Saved events are kept on your account so they follow you to any device."
        actionLabel="Sign in"
        onAction={() => router.push("/account")}
      />
    );
  } else if (saved.status === "loading" && saved.events.length === 0) {
    content = <StateView kind="loading" title="Loading your saved events…" />;
  } else if (saved.status === "error" && saved.events.length === 0) {
    content = (
      <StateView
        kind="error"
        title="Couldn't load saved events"
        message={saved.error ?? undefined}
        actionLabel="Try again"
        onAction={saved.reload}
      />
    );
  } else if (saved.events.length === 0) {
    content = (
      <StateView
        kind="empty"
        icon="bookmark-outline"
        title="No saved events yet"
        message="Tap the bookmark on any event to keep it here."
        actionLabel="Browse events"
        onAction={() => router.push("/")}
      />
    );
  } else {
    content = (
      <FlatList
        data={saved.events}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.navy]} />}
        ListHeaderComponent={
          <View style={styles.countRow}>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {saved.events.length} saved {saved.events.length === 1 ? "event" : "events"}
            </Text>
            <Button compact icon="refresh" onPress={onRefresh} loading={refreshing} disabled={refreshing}>
              Refresh
            </Button>
          </View>
        }
        renderItem={({ item }) => (
          <EventCard
            event={item}
            saved
            saveIcon="delete"
            onPress={() => router.push({ pathname: "/event/[id]", params: { id: item.id } })}
            onToggleSave={() => remove(item)}
          />
        )}
      />
    );
  }

  return (
    <View style={styles.screen}>
      {saved.status === "error" && saved.events.length > 0 ? (
        <View style={styles.inlineError}>
          <Text variant="bodyMedium" style={{ color: theme.colors.error, flex: 1 }}>
            {saved.error}
          </Text>
          <Button compact onPress={saved.reload}>
            Retry
          </Button>
        </View>
      ) : null}
      <View style={styles.content}>{content}</View>
      <Snackbar
        visible={toast !== null}
        onDismiss={() => setToast(null)}
        duration={4000}
        action={
          toast?.undo
            ? { label: "Undo", onPress: () => toast.undo && undo(toast.undo), textColor: palette.gold }
            : undefined
        }
      >
        {toast?.message ?? ""}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { flex: 1 },
  list: { paddingVertical: 8 },
  countRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  inlineError: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 6, backgroundColor: "#F9DEDC" },
});
