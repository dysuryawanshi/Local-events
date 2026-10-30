import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { Card, Chip, IconButton, Text, useTheme } from "react-native-paper";
import type { LocalEvent } from "../api";
import { formatWhen, typeMeta } from "../format";
import { palette } from "../theme";

interface Props {
  event: LocalEvent;
  onPress: () => void;
  saved?: boolean;
  onToggleSave?: () => void;
  saveIcon?: "bookmark" | "delete";
}

export function EventCard({ event, onPress, saved, onToggleSave, saveIcon = "bookmark" }: Props) {
  const theme = useTheme();
  const meta = typeMeta(event.type);
  return (
    <Card mode="elevated" onPress={onPress} style={styles.card} accessibilityLabel={`${event.title}, ${meta.label}`}>
      <View style={styles.row}>
        <View style={styles.thumbWrap}>
          {event.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={styles.thumb} contentFit="cover" transition={150} />
          ) : null}
        </View>
        <View style={styles.body}>
          <Chip compact icon={meta.icon} style={styles.chip} textStyle={styles.chipText}>
            {meta.label}
          </Chip>
          <Text variant="titleMedium" numberOfLines={2}>
            {event.title}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {formatWhen(event.startsAt, event.endsAt)}
          </Text>
          <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
            {event.venue} · {event.priceLabel}
          </Text>
        </View>
        {onToggleSave ? (
          <IconButton
            icon={saveIcon === "delete" ? "bookmark-remove-outline" : saved ? "bookmark" : "bookmark-outline"}
            iconColor={saved || saveIcon === "delete" ? palette.gold : theme.colors.onSurfaceVariant}
            accessibilityLabel={saveIcon === "delete" ? "Remove from saved" : saved ? "Unsave event" : "Save event"}
            onPress={onToggleSave}
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 6, backgroundColor: palette.surface },
  row: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  thumbWrap: { width: 84, height: 84, borderRadius: 12, overflow: "hidden", backgroundColor: palette.navy },
  thumb: { width: "100%", height: "100%" },
  body: { flex: 1, gap: 3 },
  chip: { alignSelf: "flex-start", backgroundColor: palette.goldSoft, marginBottom: 2 },
  chipText: { fontSize: 12, color: palette.navy },
});
