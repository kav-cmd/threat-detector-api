import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { healthCheck } from "../lib/api";
import { getHistory } from "../lib/storage";
import { useSecurityStatus } from "../lib/security";

export default function HomeScreen({ navigation }: any) {
  const [serverStatus, setServerStatus] = useState<string>("checking...");
  const [recentScans, setRecentScans] = useState(0);
  const { isDeviceSecure, threats, allChecksDone } = useSecurityStatus();

  useEffect(() => {
    healthCheck()
      .then(() => setServerStatus("connected"))
      .catch(() => setServerStatus("offline"));
    getHistory().then((h) => setRecentScans(h.length));
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Threat Detector</Text>
      <Text style={styles.subtitle}>Real-time cybersecurity protection</Text>

      <View style={styles.statusCard}>
        <View style={[styles.dot, { backgroundColor: serverStatus === "connected" ? "#22c55e" : "#ef4444" }]} />
        <Text style={styles.statusText}>Server: {serverStatus}</Text>
      </View>

      <View style={[styles.statusCard, { borderLeftColor: isDeviceSecure ? "#22c55e" : "#ef4444", borderLeftWidth: 4 }]}>
        <Text style={[styles.statusText, { fontWeight: "600" }]}>
          {allChecksDone
            ? isDeviceSecure
              ? "Device: Secure ✅"
              : `Device: ${threats.length} threat(s) 🚨`
            : "Checking device security..."}
        </Text>
        {threats.length > 0 && (
          <View style={styles.threatList}>
            {threats.map((t, i) => (
              <Text key={i} style={styles.threatItem}>• {t}</Text>
            ))}
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{recentScans}</Text>
          <Text style={styles.statLabel}>Total Scans</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("ScanURL")}>
        <Text style={styles.buttonText}>Scan URL</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("ScanMessage")}>
        <Text style={styles.buttonText}>Scan Message</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.historyButton]} onPress={() => navigation.navigate("History")}>
        <Text style={styles.buttonText}>View History</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 20, alignItems: "center" },
  title: { fontSize: 28, fontWeight: "bold", color: "#f8fafc", marginTop: 20 },
  subtitle: { fontSize: 14, color: "#94a3b8", marginBottom: 24 },
  statusCard: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    marginBottom: 16,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8, position: "absolute", left: 16, top: 20 },
  statusText: { color: "#cbd5e1", fontSize: 16, marginLeft: 18 },
  threatList: { marginTop: 8, marginLeft: 18 },
  threatItem: { color: "#ef4444", fontSize: 12, marginBottom: 2 },
  statsRow: { flexDirection: "row", marginBottom: 24, width: "100%" },
  statBox: {
    flex: 1,
    backgroundColor: "#1e293b",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  statNumber: { fontSize: 32, fontWeight: "bold", color: "#3b82f6" },
  statLabel: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
  button: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  historyButton: { backgroundColor: "#1e293b", borderWidth: 1, borderColor: "#334155" },
  buttonText: { color: "#f8fafc", fontSize: 16, fontWeight: "600" },
});
