import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Avatar, Button, Text, useTheme } from "react-native-paper";

interface Props {
  kind: "loading" | "empty" | "error";
  title: string;
  message?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

/** Full-area loading / empty / error panel. */
export function StateView({ kind, title, message, icon, actionLabel, onAction, children }: Props) {
  const theme = useTheme();
  const isError = kind === "error";
  return (
    <View style={styles.wrap} accessibilityRole={isError ? "alert" : undefined} testID={`state-${kind}`}>
      {kind === "loading" ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.spinner} />
      ) : (
        <Avatar.Icon
          size={72}
          icon={icon ?? (isError ? "alert-circle-outline" : "calendar-blank-outline")}
          color={isError ? theme.colors.error : theme.colors.primary}
          style={{ backgroundColor: isError ? "#F9DEDC" : theme.colors.secondaryContainer }}
        />
      )}
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      {message ? (
        <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button mode={isError ? "contained" : "contained-tonal"} onPress={onAction} style={styles.action} icon={isError ? "refresh" : undefined}>
          {actionLabel}
        </Button>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 32, minHeight: 320, gap: 8 },
  spinner: { marginBottom: 8 },
  title: { textAlign: "center", marginTop: 8 },
  message: { textAlign: "center", maxWidth: 360 },
  action: { marginTop: 12 },
});
