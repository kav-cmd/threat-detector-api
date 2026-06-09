import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
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

        <Text style={styles.guideIcon}>{activeGuide.icon}</Text>
        <Text style={styles.guideTitle}>{activeGuide.title}</Text>
        <Text style={styles.guideSummary}>{activeGuide.summary}</Text>

        <Text style={styles.sectionTitle}>📋 Rules</Text>
        {activeGuide.rules.map((rule, i) => (
          <View key={i} style={styles.ruleItem}>
            <Text style={styles.ruleNum}>{i + 1}.</Text>
            <Text style={styles.ruleText}>{rule}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>🔍 Examples</Text>
        {activeGuide.examples.map((ex, i) => (
          <View key={i} style={styles.exampleItem}>
            <Text style={styles.exampleBullet}>•</Text>
            <Text style={styles.exampleText}>{ex}</Text>
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🛡️ Security Guides</Text>
      <Text style={styles.subtitle}>Learn how to protect yourself from cyber threats</Text>

      {guides.length === 0 && (
        <Text style={styles.loading}>Loading guides...</Text>
      )}

      {guides.map((guide) => (
        <TouchableOpacity key={guide.id} style={styles.card} onPress={() => setSelected(guide.id)}>
          <Text style={styles.cardIcon}>{guide.icon}</Text>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{guide.title}</Text>
            <Text style={styles.cardSummary}>{guide.summary}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#f8fafc", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#94a3b8", marginBottom: 20 },
  loading: { color: "#64748b", textAlign: "center", marginTop: 40 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardIcon: { fontSize: 28, marginRight: 14 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#f8fafc" },
  cardSummary: { fontSize: 13, color: "#94a3b8", marginTop: 2 },
  arrow: { fontSize: 22, color: "#64748b" },
  backBtn: { marginBottom: 16 },
  backText: { color: "#3b82f6", fontSize: 15, fontWeight: "600" },
  guideIcon: { fontSize: 48, textAlign: "center", marginBottom: 8 },
  guideTitle: { fontSize: 22, fontWeight: "bold", color: "#f8fafc", textAlign: "center" },
  guideSummary: { fontSize: 14, color: "#94a3b8", textAlign: "center", marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#cbd5e1", marginTop: 20, marginBottom: 10 },
  ruleItem: { flexDirection: "row", marginBottom: 8 },
  ruleNum: { color: "#3b82f6", fontSize: 14, fontWeight: "600", width: 22 },
  ruleText: { color: "#cbd5e1", fontSize: 14, flex: 1, lineHeight: 20 },
  exampleItem: { flexDirection: "row", marginBottom: 6 },
  exampleBullet: { color: "#f59e0b", fontSize: 14, marginRight: 6 },
  exampleText: { color: "#94a3b8", fontSize: 13, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", flex: 1 },
});
