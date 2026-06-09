import { useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import { useFreeRasp } from "freerasp-react-native";
import type { ThreatEventActions, TalsecConfig } from "freerasp-react-native";

import HomeScreen from "./screens/HomeScreen";
import ScanURLScreen from "./screens/ScanURLScreen";
import ScanMessageScreen from "./screens/ScanMessageScreen";
import HistoryScreen from "./screens/HistoryScreen";
import SettingsScreen from "./screens/SettingsScreen";
import { SecurityContext, SecurityStatus, initialSecurityStatus } from "./lib/security";

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
  const [secStatus, setSecStatus] = useState<SecurityStatus>(initialSecurityStatus);

  const addThreat = useCallback((threatName: string) => {
    setSecStatus((prev) => ({
      ...prev,
      isDeviceSecure: false,
      threats: prev.threats.includes(threatName) ? prev.threats : [...prev.threats, threatName],
    }));
  }, []);

  const config: TalsecConfig = {
    androidConfig: {
      packageName: "com.threatdetector.app",
      certificateHashes: [],
      supportedAlternativeStores: [],
    },
    iosConfig: {
      appBundleId: "com.threatdetector.app",
      appTeamId: "",
    },
    watcherMail: "",
    isProd: false,
  };

  const threatActions: ThreatEventActions = {
    privilegedAccess: () => addThreat("Root/Jailbreak detected"),
    debug: () => addThreat("Debugger attached"),
    simulator: () => addThreat("Emulator/Simulator detected"),
    appIntegrity: () => addThreat("App tampering detected"),
    unofficialStore: () => addThreat("Unofficial store install"),
    hooks: () => addThreat("Hooking framework detected"),
    deviceBinding: () => addThreat("Device binding mismatch"),
    passcode: () => addThreat("No passcode set"),
    secureHardwareNotAvailable: () => addThreat("Secure hardware unavailable"),
    obfuscationIssues: () => addThreat("Obfuscation issues"),
    devMode: () => addThreat("Developer mode enabled"),
    systemVPN: () => addThreat("VPN detected"),
    malware: () => addThreat("Malware detected"),
    adbEnabled: () => addThreat("ADB enabled"),
    screenshot: () => addThreat("Screenshot detected"),
    screenRecording: () => addThreat("Screen recording detected"),
    timeSpoofing: () => addThreat("Time spoofing detected"),
    locationSpoofing: () => addThreat("Location spoofing detected"),
    unsecureWifi: () => addThreat("Unsecured WiFi"),
    automation: () => addThreat("Automation tool detected"),
  };

  useFreeRasp(config, threatActions, {
    allChecksFinished: () => {
      setSecStatus((prev) => ({ ...prev, allChecksDone: true }));
    },
  });

  return (
    <SecurityContext.Provider value={secStatus}>
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
    </SecurityContext.Provider>
  );
}
