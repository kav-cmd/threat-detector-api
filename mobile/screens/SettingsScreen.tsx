import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView,
} from "react-native";
import { saveApiKey, getApiKey } from "../lib/storage";

export default function SettingsScreen() {
  const [vtKey, setVtKey] = useState("");
  const [gsbKey, setGsbKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getApiKey("virustotal_key").then((k) => { if (k) setVtKey(k); });
    getApiKey("google_safebrowsing_key").then((k) => { if (k) setGsbKey(k); });
  }, []);

  const handleSave = async () => {
    await saveApiKey("virustotal_key", vtKey);
    await saveApiKey("google_safebrowsing_key", gsbKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    Alert.alert("Saved", "API keys have been saved securely");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Configure API keys for enhanced detection</Text>

      <Text style={styles.label}>VirusTotal API Key</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your VirusTotal API key"
        placeholderTextColor="#64748b"
        value={vtKey}
        onChangeText={setVtKey}
        secureTextEntry
      />
      <Text style={styles.hint}>Get a free key at virustotal.com</Text>

      <Text style={styles.label}>Google Safe Browsing API Key</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Google Safe Browsing key"
        placeholderTextColor="#64748b"
        value={gsbKey}
        onChangeText={setGsbKey}
        secureTextEntry
      />
      <Text style={styles.hint}>Get a free key at console.cloud.google.com</Text>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>{saved ? "Saved!" : "Save Keys"}</Text>
      </TouchableOpacity>

      <View style={styles.aboutSection}>
        <Text style={styles.aboutTitle}>About</Text>
        <Text style={styles.aboutText}>
          Threat Detector v1.0.0{"\n"}
          Real-time cybersecurity threat detection{"\n"}
          Built with React Native + FastAPI
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#f8fafc" },
  subtitle: { fontSize: 14, color: "#94a3b8", marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", color: "#cbd5e1", marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: "#1e293b",
    color: "#f8fafc",
    padding: 14,
    borderRadius: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  hint: { fontSize: 11, color: "#64748b", marginTop: 4, marginBottom: 12 },
  saveButton: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  saveText: { color: "#f8fafc", fontSize: 16, fontWeight: "600" },
  aboutSection: {
    marginTop: 40,
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 12,
  },
  aboutTitle: { fontSize: 16, fontWeight: "600", color: "#cbd5e1", marginBottom: 8 },
  aboutText: { fontSize: 13, color: "#64748b", lineHeight: 20 },
});
