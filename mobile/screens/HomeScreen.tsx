import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from "react-native";
import { healthCheck } from "../lib/api";
import { getHistory } from "../lib/storage";
import { useSecurityStatus } from "../lib/security";

function GlowCard({ children, style }: any) {
  return (
    <View style={[styles.glowCard, style]}>
      <View style={styles.glowInner}>{children}</View>
    </View>
  );
}

function ScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const color = score >= 70 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#22c55e";
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: "rgba(255,255,255,0.05)",
          position: "absolute",
        }}
      />
      <View
        style={{
          width: size * 0.85,
          height: size * 0.85,
          borderRadius: (size * 0.85) / 2,
          borderWidth: strokeWidth * 0.8,
          borderColor: color,
          borderLeftColor: "transparent",
          borderBottomColor: "transparent",
          transform: [{ rotate: "-45deg" }],
          position: "absolute",
        }}
      />
      <Text style={{ fontSize: size * 0.22, fontWeight: "800", color: "#f8fafc" }}>
        {score}%
      </Text>
      <Text style={{ fontSize: size * 0.09, color: color, fontWeight: "600", marginTop: -2 }}>
        {score >= 70 ? "DANGER" : score >= 40 ? "WARNING" : "SAFE"}
      </Text>
    </View>
  );
}

export default function HomeScreen({ navigation }: any) {
  const [serverStatus, setServerStatus] = useState<string>("checking...");
  const [recentScans, setRecentScans] = useState(0);
  const [recentScores, setRecentScores] = useState<number[]>([]);
  const { isDeviceSecure, threats, allChecksDone } = useSecurityStatus();

  useEffect(() => {
    healthCheck()
      .then(() => setServerStatus("connected"))
      .catch(() => setServerStatus("offline"));
    getHistory().then((h) => {
      setRecentScans(h.length);
      setRecentScores(h.slice(0, 5).map((item) => item.risk_score));
    });
  }, []);

  const avgScore =
    recentScores.length > 0
      ? Math.round(recentScores.reduce((a, b) => a + b, 0) / recentScores.length)
      : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.headerSection}>
        <Text style={styles.badge}>LIVE PROTECTION</Text>
        <Text style={styles.title}>Threat{'\n'}Detector</Text>
        <Text style={styles.subtitle}>
          AI-powered cybersecurity threat analysis
        </Text>
      </View>

      <View style={styles.scoreSection}>
        <ScoreRing score={avgScore} size={120} />
        <View style={styles.scoreInfo}>
          <Text style={styles.scoreLabel}>Average Risk</Text>
          <Text style={styles.scoreDesc}>
            Based on your {recentScans} recent scan{recentScans !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <GlowCard style={{ flex: 1, marginRight: 6 }}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  serverStatus === "connected" ? "#22c55e" : "#ef4444",
              },
            ]}
          />
          <Text
            style={{
              color: "#cbd5e1",
              fontSize: 13,
              fontWeight: "500",
              marginTop: 8,
            }}
          >
            Server
          </Text>
          <Text style={{ color: "#f8fafc", fontSize: 15, fontWeight: "700" }}>
            {serverStatus === "connected" ? "Online" : "Offline"}
          </Text>
        </GlowCard>

        <GlowCard style={{ flex: 1, marginLeft: 6 }}>
          <Text style={{ fontSize: 24, marginBottom: 4 }}>
            {allChecksDone ? (isDeviceSecure ? "🛡️" : "⚠️") : "⏳"}
          </Text>
          <Text
            style={{
              color: "#cbd5e1",
              fontSize: 13,
              fontWeight: "500",
            }}
          >
            Device
          </Text>
          <Text
            style={{
              color: "#f8fafc",
              fontSize: 15,
              fontWeight: "700",
            }}
          >
            {allChecksDone
              ? isDeviceSecure
                ? "Secure"
                : `${threats.length} threat(s)`
              : "Checking..."}
          </Text>
        </GlowCard>

        <GlowCard style={{ flex: 1, marginLeft: 6 }}>
          <Text style={{ fontSize: 24, marginBottom: 4 }}>📊</Text>
          <Text
            style={{
              color: "#cbd5e1",
              fontSize: 13,
              fontWeight: "500",
            }}
          >
            Scans
          </Text>
          <Text style={{ color: "#f8fafc", fontSize: 15, fontWeight: "700" }}>
            {recentScans}
          </Text>
        </GlowCard>
      </View>

      <View style={styles.actionSection}>
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "rgba(129, 140, 248, 0.15)" }]}
            onPress={() => navigation.navigate("ScanURL")}
          >
            <Text style={styles.actionIcon}>⬡</Text>
            <Text style={styles.actionTitle}>Scan URL</Text>
            <Text style={styles.actionDesc}>Check any link</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "rgba(251, 191, 36, 0.15)" }]}
            onPress={() => navigation.navigate("ScanMessage")}
          >
            <Text style={styles.actionIcon}>⌨</Text>
            <Text style={styles.actionTitle}>Scan Message</Text>
            <Text style={styles.actionDesc}>Detect phishing</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "rgba(52, 211, 153, 0.15)" }]}
            onPress={() => navigation.navigate("Guides")}
          >
            <Text style={styles.actionIcon}>◆</Text>
            <Text style={styles.actionTitle}>Guides</Text>
            <Text style={styles.actionDesc}>Security tips</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "rgba(244, 114, 182, 0.15)" }]}
            onPress={() => navigation.navigate("Chatbot")}
          >
            <Text style={styles.actionIcon}>◎</Text>
            <Text style={styles.actionTitle}>AI Chat</Text>
            <Text style={styles.actionDesc}>Ask anything</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, styles.fullWidthButton]}
          onPress={() => navigation.navigate("History")}
        >
          <Text style={{ fontSize: 16, color: "#818cf8", fontWeight: "600" }}>
            View Scan History →
          </Text>
        </TouchableOpacity>
      </View>

      {threats.length > 0 && (
        <GlowCard style={styles.threatCard}>
          <Text style={styles.threatTitle}>🚨 Active Threats</Text>
          {threats.map((t, i) => (
            <Text key={i} style={styles.threatItem}>
              • {t}
            </Text>
          ))}
        </GlowCard>
      )}
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
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#f8fafc",
    lineHeight: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.1)",
  },
  scoreInfo: { marginLeft: 20, flex: 1 },
  scoreLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 4,
  },
  scoreDesc: { fontSize: 12, color: "#64748b", lineHeight: 18 },
  statusRow: { flexDirection: "row", marginBottom: 24 },
  glowCard: {
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.08)",
    padding: 14,
  },
  glowInner: { alignItems: "center" },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  actionSection: { marginBottom: 20 },
  sectionLabel: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  actionRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  fullWidthButton: {
    alignItems: "center",
    backgroundColor: "rgba(129, 140, 248, 0.08)",
    borderColor: "rgba(129, 140, 248, 0.15)",
  },
  actionIcon: { fontSize: 24, marginBottom: 8, color: "#f8fafc" },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 2,
  },
  actionDesc: { fontSize: 11, color: "#64748b" },
  threatCard: { padding: 16, borderColor: "rgba(239, 68, 68, 0.3)", borderWidth: 1 },
  threatTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ef4444",
    marginBottom: 8,
  },
  threatItem: { color: "#fca5a5", fontSize: 13, marginBottom: 4 },
});
