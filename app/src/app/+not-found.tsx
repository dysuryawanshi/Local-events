import { useRouter } from "expo-router";
import { View } from "react-native";
import { StateView } from "../components/StateView";
import { palette } from "../theme";

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <StateView
        kind="empty"
        icon="map-marker-question-outline"
        title="This page doesn't exist"
        actionLabel="Go to events"
        onAction={() => router.replace("/")}
      />
    </View>
  );
}
