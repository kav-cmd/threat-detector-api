import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { getGuides, Guide } from "../lib/api";

export default function GuidesScreen() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    getGuides().then(setGuides).catch(() => {});
  }, []);

  const activeGuide = guides.find((g) => g.id === selected);

  if (activeGuide) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => setSelected(null)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back to Guides</Text>
        </TouchableOpacity>

        <View style={styles.detailCard}>
          <Text style={styles.guideIcon}>{activeGuide.icon}</Text>
          <Text style={styles.guideTitle}>{activeGuide.title}</Text>
          <Text style={styles.guideSummary}>{activeGuide.summary}</Text>

          <Text style={styles.sectionTitle}>📋 Rules</Text>
          {activeGuide.rules.map((rule, i) => (
            <View key={i} style={styles.ruleItem}>
              <View style={styles.ruleNum}>
                <Text style={styles.ruleNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>🔍 Examples</Text>
          {activeGuide.examples.map((ex, i) => (
            <View key={i} style={styles.exampleItem}>
              <Text style={styles.exampleBullet}>→</Text>
              <Text style={styles.exampleText}>{ex}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerSection}>
        <Text style={styles.badge}>LEARN</Text>
        <Text style={styles.title}>Security Guides</Text>
        <Text style={styles.subtitle}>
          Learn how to protect yourself from cyber threats
        </Text>
      </View>

      {guides.length === 0 && (
        <Text style={styles.loading}>Loading guides...</Text>
      )}

      {guides.map((guide) => (
        <TouchableOpacity
          key={guide.id}
          style={styles.card}
          onPress={() => setSelected(guide.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.cardIcon}>{guide.icon}</Text>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{guide.title}</Text>
            <Text style={styles.cardSummary}>{guide.summary}</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0f1e" },
  content: { padding: 20 },
  headerSection: { marginTop: Platform.OS === "ios" ? 10 : 20, marginBottom: 20 },
  badge: {
    color: "#818cf8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: { fontSize: 28, fontWeight: "800", color: "#f8fafc", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#64748b", marginBottom: 20 },
  loading: { color: "#64748b", textAlign: "center", marginTop: 40 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.08)",
  },
  cardIcon: { fontSize: 28, marginRight: 14 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#f8fafc" },
  cardSummary: { fontSize: 12, color: "#64748b", marginTop: 2, lineHeight: 16 },
  arrow: { fontSize: 18, color: "#818cf8", fontWeight: "600" },
  backBtn: { marginBottom: 16, marginTop: Platform.OS === "ios" ? 10 : 20 },
  backText: { color: "#818cf8", fontSize: 15, fontWeight: "600" },
  detailCard: {
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.1)",
  },
  guideIcon: { fontSize: 48, textAlign: "center", marginBottom: 8 },
  guideTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#f8fafc",
    textAlign: "center",
  },
  guideSummary: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#cbd5e1",
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  ruleItem: { flexDirection: "row", marginBottom: 10, alignItems: "flex-start" },
  ruleNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(129, 140, 248, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 1,
  },
  ruleNumText: {
    color: "#818cf8",
    fontSize: 11,
    fontWeight: "700",
  },
  ruleText: {
    color: "#cbd5e1",
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  exampleItem: {
    flexDirection: "row",
    marginBottom: 8,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    padding: 10,
    borderRadius: 10,
  },
  exampleBullet: {
    color: "#f59e0b",
    fontSize: 14,
    marginRight: 8,
    fontWeight: "600",
  },
  exampleText: {
    color: "#94a3b8",
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    flex: 1,
    lineHeight: 18,
  },
});
