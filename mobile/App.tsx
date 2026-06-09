import { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";

import HomeScreen from "./screens/HomeScreen";
import ScanURLScreen from "./screens/ScanURLScreen";
import ScanMessageScreen from "./screens/ScanMessageScreen";
import HistoryScreen from "./screens/HistoryScreen";
import ChatbotScreen from "./screens/ChatbotScreen";
import GuidesScreen from "./screens/GuidesScreen";
import SettingsScreen from "./screens/SettingsScreen";
import { SecurityContext, SecurityStatus, initialSecurityStatus } from "./lib/security";

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Home: { active: "🏠", inactive: "🏠" },
  ScanURL: { active: "🔗", inactive: "🔗" },
  ScanMessage: { active: "💬", inactive: "💬" },
  Guides: { active: "📚", inactive: "📚" },
  Chatbot: { active: "🤖", inactive: "🤖" },
  History: { active: "📋", inactive: "📋" },
  Settings: { active: "⚙️", inactive: "⚙️" },
};

function TabIcon({ routeName, focused }: { routeName: string; focused: boolean }) {
  const icons = TAB_ICONS[routeName] || { active: "•", inactive: "•" };
  return (
    <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.5 }}>
      {focused ? icons.active : icons.inactive}
    </Text>
  );
}

export default function App() {
  const [secStatus, setSecStatus] = useState<SecurityStatus>(initialSecurityStatus);

  useEffect(() => {
    setSecStatus((prev) => ({ ...prev, allChecksDone: true }));
  }, []);

  return (
    <SecurityContext.Provider value={secStatus}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused }) => <TabIcon routeName={route.name} focused={focused} />,
            tabBarActiveTintColor: "#3b82f6",
            tabBarInactiveTintColor: "#64748b",
            tabBarStyle: {
              backgroundColor: "#0f172a",
              borderTopColor: "#1e293b",
              borderTopWidth: 1,
              paddingBottom: 2,
              paddingTop: 2,
              height: 56,
            },
            tabBarLabelStyle: { fontSize: 9, fontWeight: "600" },
            headerShown: false,
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="ScanURL" component={ScanURLScreen} options={{ tabBarLabel: "URL" }} />
          <Tab.Screen name="ScanMessage" component={ScanMessageScreen} options={{ tabBarLabel: "Message" }} />
          <Tab.Screen name="Guides" component={GuidesScreen} options={{ tabBarLabel: "Guides" }} />
          <Tab.Screen name="Chatbot" component={ChatbotScreen} options={{ tabBarLabel: "AI Chat" }} />
          <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: "History" }} />
          <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: "Settings" }} />
        </Tab.Navigator>
        <StatusBar style="light" />
      </NavigationContainer>
    </SecurityContext.Provider>
  );
}
