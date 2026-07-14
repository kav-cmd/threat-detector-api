import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getHistory, clearHistory, HistoryItem } from "../lib/storage";

function getRiskColor(level: string): string {
  switch (level) {
    case "dangerous":
      return "#ef4444";
    case "suspicious":
      return "#f59e0b";
    default:
      return "#22c55e";
  }
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      getHistory().then(setHistory);
    }, [])
  );

  const handleClear = () => {
    Alert.alert("Clear History", "Are you sure you want to delete all scan history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: async () => {
          await clearHistory();
          setHistory([]);
        },
      },
    ]);
  };

  const renderItem = ({ item, index }: { item: HistoryItem; index: number }) => (
    <View
      style={[
        styles.card,
        { borderLeftColor: getRiskColor(item.risk_level) },
      ]}
    >
      <View style={styles.cardIndex}>
        <Text style={styles.indexText}>{index + 1}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={styles.typeBadge}>
            <Text style={styles.cardType}>
              {item.type === "url" ? "⬡ URL" : "⌨ MSG"}
            </Text>
          </View>
          <Text
            style={[
              styles.cardRisk,
              { color: getRiskColor(item.risk_level) },
            ]}
          >
            {item.risk_level.toUpperCase()} ({item.risk_score})
          </Text>
        </View>
        <Text style={styles.cardInput} numberOfLines={2}>
          {item.input}
        </Text>
        <Text style={styles.cardDate}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.badge}>HISTORY</Text>
          <Text style={styles.title}>Scan Logs</Text>
        </View>
        {history.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No scans yet</Text>
          <Text style={styles.emptySub}>
            Scan a URL or message to see your history here
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0f1e" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    paddingBottom: 0,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
  },
  badge: {
    color: "#818cf8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: { fontSize: 28, fontWeight: "800", color: "#f8fafc" },
  clearBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  clearText: { color: "#ef4444", fontSize: 13, fontWeight: "700" },
  list: { padding: 20 },
  card: {
    flexDirection: "row",
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    padding: 14,
    borderRadius: 16,
    borderLeftWidth: 3,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.06)",
    borderLeftColor: "#818cf8",
  },
  cardIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(129, 140, 248, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  indexText: { color: "#818cf8", fontSize: 12, fontWeight: "700" },
  cardBody: { flex: 1 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  typeBadge: {
    backgroundColor: "rgba(129, 140, 248, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardType: { fontSize: 10, color: "#818cf8", fontWeight: "700" },
  cardRisk: { fontSize: 12, fontWeight: "800" },
  cardInput: { fontSize: 13, color: "#cbd5e1", marginBottom: 6, lineHeight: 18 },
  cardDate: { fontSize: 11, color: "#475569" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, color: "#64748b", fontWeight: "700" },
  emptySub: { fontSize: 13, color: "#475569", marginTop: 4, textAlign: "center" },
});
