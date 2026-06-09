import { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getHistory, clearHistory, HistoryItem } from "../lib/storage";

function getRiskColor(level: string): string {
  switch (level) {
    case "dangerous": return "#ef4444";
    case "suspicious": return "#f59e0b";
    default: return "#22c55e";
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
    Alert.alert("Clear History", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: async () => {
        await clearHistory();
        setHistory([]);
      }},
    ]);
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <View style={[styles.card, { borderLeftColor: getRiskColor(item.risk_level) }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardType}>{item.type.toUpperCase()}</Text>
        <Text style={[styles.cardRisk, { color: getRiskColor(item.risk_level) }]}>
          {item.risk_level} ({item.risk_score})
        </Text>
      </View>
      <Text style={styles.cardInput} numberOfLines={2}>
        {item.input}
      </Text>
      <Text style={styles.cardDate}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No scans yet</Text>
          <Text style={styles.emptySub}>Scan a URL or message to see history</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 0,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#f8fafc" },
  clearText: { color: "#ef4444", fontSize: 14, fontWeight: "600" },
  list: { padding: 20 },
  card: {
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 10,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardType: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  cardRisk: { fontSize: 12, fontWeight: "700" },
  cardInput: { fontSize: 14, color: "#cbd5e1", marginBottom: 6 },
  cardDate: { fontSize: 11, color: "#64748b" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 18, color: "#64748b", fontWeight: "600" },
  emptySub: { fontSize: 13, color: "#475569", marginTop: 4 },
});
