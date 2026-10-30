import { Tabs } from "expo-router/tabs";
import { Icon } from "react-native-paper";
import { useSaved } from "../../saved";
import { palette } from "../../theme";

export default function TabsLayout() {
  const { events } = useSaved();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: palette.navy },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "700" },
        tabBarActiveTintColor: palette.navy,
        tabBarInactiveTintColor: palette.muted,
        tabBarActiveBackgroundColor: palette.goldSoft,
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.border },
        sceneStyle: { backgroundColor: palette.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Events",
          headerTitle: "Local Events",
          tabBarIcon: ({ color, size }) => <Icon source="calendar-search" color={String(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarBadge: events.length > 0 ? events.length : undefined,
          tabBarBadgeStyle: { backgroundColor: palette.gold, color: palette.navy },
          tabBarIcon: ({ color, size }) => <Icon source="bookmark-multiple" color={String(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => <Icon source="account-circle" color={String(color)} size={size} />,
        }}
      />
    </Tabs>
  );
}
