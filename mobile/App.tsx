import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";

import HomeScreen from "./screens/HomeScreen";
import ScanURLScreen from "./screens/ScanURLScreen";
import ScanMessageScreen from "./screens/ScanMessageScreen";
import HistoryScreen from "./screens/HistoryScreen";
import SettingsScreen from "./screens/SettingsScreen";

const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: "🏠",
    ScanURL: "🔗",
    ScanMessage: "💬",
    History: "📋",
    Settings: "⚙️",
  };
  return (
    <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.6 }}>
      {icons[label] || "•"}
    </Text>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
          tabBarActiveTintColor: "#3b82f6",
          tabBarInactiveTintColor: "#64748b",
          tabBarStyle: {
            backgroundColor: "#0f172a",
            borderTopColor: "#1e293b",
            borderTopWidth: 1,
            paddingBottom: 4,
            paddingTop: 4,
            height: 60,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="ScanURL" component={ScanURLScreen} options={{ tabBarLabel: "Scan URL" }} />
        <Tab.Screen name="ScanMessage" component={ScanMessageScreen} options={{ tabBarLabel: "Message" }} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}
