import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  Switch,
} from "react-native";
import { saveApiKey, getApiKey } from "../lib/storage";

export default function SettingsScreen() {
  const [vtKey, setVtKey] = useState("");
  const [gsbKey, setGsbKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [autoScan, setAutoScan] = useState(true);

  useEffect(() => {
    getApiKey("virustotal_key").then((k) => {
      if (k) setVtKey(k);
    });
    getApiKey("google_safebrowsing_key").then((k) => {
      if (k) setGsbKey(k);
    });
    getApiKey("auto_scan").then((k) => {
      if (k !== null) setAutoScan(k === "true");
    });
  }, []);

  const handleSave = async () => {
    await saveApiKey("virustotal_key", vtKey);
    await saveApiKey("google_safebrowsing_key", gsbKey);
    await saveApiKey("auto_scan", autoScan ? "true" : "false");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    Alert.alert("Saved", "Settings have been saved successfully");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerSection}>
        <Text style={styles.badge}>CONFIGURATION</Text>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Configure API keys and app preferences
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 API Keys</Text>
        <Text style={styles.sectionDesc}>
          API keys are stored securely on your device. The Gemini AI key is
          configured server-side and works automatically.
        </Text>

        <Text style={styles.label}>VirusTotal API Key</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your VirusTotal API key"
          placeholderTextColor="#475569"
          value={vtKey}
          onChangeText={setVtKey}
          secureTextEntry
        />
        <Text style={styles.hint}>
          Get a free key at virustotal.com (500 req/day)
        </Text>

        <Text style={styles.label}>Google Safe Browsing API Key</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Google Safe Browsing key"
          placeholderTextColor="#475569"
          value={gsbKey}
          onChangeText={setGsbKey}
          secureTextEntry
        />
        <Text style={styles.hint}>
          Get a free key at console.cloud.google.com
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Preferences</Text>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Auto-Scan Clipboard</Text>
            <Text style={styles.switchDesc}>
              Periodically check clipboard for suspicious content
            </Text>
          </View>
          <Switch
            value={autoScan}
            onValueChange={setAutoScan}
            trackColor={{ false: "#334155", true: "rgba(129, 140, 248, 0.4)" }}
            thumbColor={autoScan ? "#818cf8" : "#64748b"}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        activeOpacity={0.8}
      >
        <Text style={styles.saveText}>
          {saved ? "✓ Saved!" : "Save Settings"}
        </Text>
      </TouchableOpacity>

      <View style={styles.aboutSection}>
        <Text style={styles.aboutTitle}>About</Text>
        <Text style={styles.aboutText}>
          Threat Detector v2.0.0{"\n"}
          AI-powered cybersecurity threat detection{"\n"}
          Built with React Native + FastAPI + scikit-learn
        </Text>
        <Text style={styles.version}>ML Model: TF-IDF + Logistic Regression</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0f1e" },
  content: { padding: 20, paddingBottom: 40 },
  headerSection: { marginTop: Platform.OS === "ios" ? 10 : 20, marginBottom: 24 },
  badge: {
    color: "#818cf8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: { fontSize: 28, fontWeight: "800", color: "#f8fafc" },
  subtitle: { fontSize: 13, color: "#64748b", marginTop: 4 },
  section: {
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.08)",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 16,
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#cbd5e1",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    color: "#f8fafc",
    padding: 14,
    borderRadius: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.15)",
  },
  hint: {
    fontSize: 11,
    color: "#475569",
    marginTop: 4,
    marginBottom: 4,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  switchInfo: { flex: 1, marginRight: 16 },
  switchLabel: { fontSize: 15, fontWeight: "600", color: "#f8fafc" },
  switchDesc: { fontSize: 12, color: "#64748b", marginTop: 2 },
  saveButton: {
    backgroundColor: "#818cf8",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#818cf8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  aboutSection: {
    marginTop: 24,
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.06)",
  },
  aboutTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#cbd5e1",
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 20,
  },
  version: {
    fontSize: 11,
    color: "#475569",
    marginTop: 8,
    fontWeight: "500",
  },
});
