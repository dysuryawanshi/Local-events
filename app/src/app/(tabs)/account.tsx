import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Avatar, Button, Card, HelperText, List, Snackbar, Text, TextInput, useTheme } from "react-native-paper";
import { useAuth } from "../../auth";
import { StateView } from "../../components/StateView";
import { useSaved } from "../../saved";
import { palette } from "../../theme";

export default function AccountScreen() {
  const theme = useTheme();
  const { status, user, signIn, signOut } = useAuth();
  const saved = useSaved();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const u = await signIn(email, password);
      setPassword("");
      setToast(`Signed in as ${u.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign in");
    } finally {
      setSubmitting(false);
    }
  };

  const onSignOut = async () => {
    await signOut();
    setToast("Signed out");
  };

  let content;
  if (status === "restoring") {
    content = <StateView kind="loading" title="Checking your account…" />;
  } else if (status === "signedIn" && user) {
    content = (
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card mode="elevated" style={styles.card}>
          <Card.Content style={styles.profile}>
            <Avatar.Text
              size={64}
              label={user.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
              style={{ backgroundColor: palette.gold }}
              color={palette.navy}
            />
            <Text variant="titleLarge">{user.name}</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {user.email}
            </Text>
          </Card.Content>
        </Card>
        <Card mode="elevated" style={styles.card}>
          <List.Item
            title="Saved events"
            description={`${saved.events.length} on your list`}
            left={(p) => <List.Icon {...p} icon="bookmark-multiple" color={palette.navy} />}
          />
          <List.Item
            title="Role"
            description={user.role === "ADMIN" ? "Administrator" : "Member"}
            left={(p) => <List.Icon {...p} icon="shield-account-outline" color={palette.navy} />}
          />
        </Card>
        <Button mode="outlined" icon="logout" onPress={onSignOut} style={styles.signOut}>
          Sign out
        </Button>
      </ScrollView>
    );
  } else {
    content = (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card mode="elevated" style={styles.card}>
            <Card.Title
              title="Sign in"
              subtitle="Save events to your account"
              left={(p) => <Avatar.Icon {...p} icon="account" style={{ backgroundColor: palette.navy }} />}
            />
            <Card.Content style={styles.form}>
              <TextInput
                label="Email"
                mode="outlined"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                left={<TextInput.Icon icon="email-outline" />}
                error={!!error}
                disabled={submitting}
              />
              <TextInput
                label="Password"
                mode="outlined"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"
                onSubmitEditing={onSubmit}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword((s) => !s)}
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  />
                }
                error={!!error}
                disabled={submitting}
              />
              <HelperText type="error" visible={!!error}>
                {error ?? ""}
              </HelperText>
              <Button mode="contained" onPress={onSubmit} loading={submitting} disabled={!canSubmit} contentStyle={{ paddingVertical: 6 }}>
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </Card.Content>
          </Card>
          <Card mode="outlined" style={[styles.card, { backgroundColor: palette.goldSoft, borderColor: palette.gold }]}>
            <Card.Content style={{ gap: 4 }}>
              <Text variant="titleSmall">Demo accounts (local seed data)</Text>
              <Text variant="bodySmall">alex@example.com · password123</Text>
              <Text variant="bodySmall">admin@example.com · admin12345</Text>
              <Button
                compact
                mode="text"
                onPress={() => {
                  setEmail("alex@example.com");
                  setPassword("password123");
                  setError(null);
                }}
                style={{ alignSelf: "flex-start", marginTop: 4 }}
              >
                Fill in Alex's details
              </Button>
            </Card.Content>
          </Card>
          <Text variant="bodySmall" style={[styles.note, { color: theme.colors.onSurfaceVariant }]}>
            Browsing events and adding them to your calendar work without an account.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.screen}>
      {content}
      <Snackbar visible={toast !== null} onDismiss={() => setToast(null)} duration={2500} icon="check-circle">
        {toast ?? ""}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  scroll: { padding: 16, gap: 12, maxWidth: 560, width: "100%", alignSelf: "center" },
  card: { backgroundColor: palette.surface },
  profile: { alignItems: "center", gap: 6, paddingVertical: 12 },
  form: { gap: 8 },
  signOut: { marginTop: 4 },
  note: { textAlign: "center" },
});
