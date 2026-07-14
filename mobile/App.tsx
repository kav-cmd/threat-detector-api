import { useState, useEffect, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, StyleSheet, Platform } from "react-native";

import HomeScreen from "./screens/HomeScreen";
import ScanURLScreen from "./screens/ScanURLScreen";
import ScanMessageScreen from "./screens/ScanMessageScreen";
import HistoryScreen from "./screens/HistoryScreen";
import ChatbotScreen from "./screens/ChatbotScreen";
import GuidesScreen from "./screens/GuidesScreen";
import SettingsScreen from "./screens/SettingsScreen";
import {
  SecurityContext,
  SecurityStatus,
  initialSecurityStatus,
} from "./lib/security";
import { getHistory } from "./lib/storage";

const Tab = createBottomTabNavigator();

const TAB_CONFIG: Record<
  string,
  { label: string; icon: string; iconFocused: string }
> = {
  Home: { label: "Home", icon: "◯", iconFocused: "●" },
  ScanURL: { label: "URL", icon: "⊘", iconFocused: "⬡" },
  ScanMessage: { label: "Message", icon: "⌨", iconFocused: "⌨" },
  Guides: { label: "Guides", icon: "◈", iconFocused: "◆" },
  Chatbot: { label: "AI", icon: "◉", iconFocused: "◎" },
  History: { label: "Logs", icon: "☰", iconFocused: "≡" },
  Settings: { label: "Settings", icon: "⚙", iconFocused: "⚙" },
};

function TabIcon({
  routeName,
  focused,
  color,
}: {
  routeName: string;
  focused: boolean;
  color: string;
}) {
  const config = TAB_CONFIG[routeName] || { icon: "•", iconFocused: "•" };
  return (
    <Text style={{ fontSize: focused ? 20 : 16, color, lineHeight: 24 }}>
      {focused ? config.iconFocused : config.icon}
    </Text>
  );
}

export default function App() {
  const [secStatus, setSecStatus] = useState<SecurityStatus>({
    ...initialSecurityStatus,
    allChecksDone: true,
  });

  const checkClipboard = useCallback(async () => {
    try {
      const Clipboard = require("expo-clipboard");
      const text = await Clipboard.getStringAsync();
      if (text && text.length > 20 && secStatus.autoScanEnabled) {
        const now = Date.now();
        if (!secStatus.lastAutoScan || now - secStatus.lastAutoScan > 30000) {
          setSecStatus((prev) => ({ ...prev, lastAutoScan: now }));
        }
      }
    } catch {}
  }, [secStatus.autoScanEnabled, secStatus.lastAutoScan]);

  useEffect(() => {
    const interval = setInterval(checkClipboard, 15000);
    return () => clearInterval(interval);
  }, [checkClipboard]);

  return (
    <SecurityContext.Provider value={secStatus}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color }) => (
              <TabIcon routeName={route.name} focused={focused} color={color} />
            ),
            tabBarActiveTintColor: "#818cf8",
            tabBarInactiveTintColor: "#475569",
            tabBarStyle: styles.tabBar,
            tabBarLabelStyle: styles.tabLabel,
            headerShown: false,
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen
            name="ScanURL"
            component={ScanURLScreen}
            options={{ tabBarLabel: "URL" }}
          />
          <Tab.Screen
            name="ScanMessage"
            component={ScanMessageScreen}
            options={{ tabBarLabel: "Message" }}
          />
          <Tab.Screen
            name="Guides"
            component={GuidesScreen}
            options={{ tabBarLabel: "Guides" }}
          />
          <Tab.Screen
            name="Chatbot"
            component={ChatbotScreen}
            options={{ tabBarLabel: "AI" }}
          />
          <Tab.Screen
            name="History"
            component={HistoryScreen}
            options={{ tabBarLabel: "Logs" }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ tabBarLabel: "Settings" }}
          />
        </Tab.Navigator>
        <StatusBar style="light" />
      </NavigationContainer>
    </SecurityContext.Provider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderTopColor: "rgba(129, 140, 248, 0.15)",
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 20 : 4,
    paddingTop: 4,
    height: Platform.OS === "ios" ? 80 : 56,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: -2,
  },
});
