import { useState } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { scanMessage } from "../lib/api";
import { addHistory } from "../lib/storage";

function getRiskColor(level: string): string {
  switch (level) {
    case "dangerous": return "#ef4444";
    case "suspicious": return "#f59e0b";
    default: return "#22c55e";
  }
}

function getRiskEmoji(level: string): string {
  switch (level) {
    case "dangerous": return "🚨";
    case "suspicious": return "⚠️";
    default: return "✅";
  }
}

export default function ScanMessageScreen() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setMessage(text);
  };

  const handleScan = async () => {
    if (!message.trim()) {
      Alert.alert("Error", "Please enter a message to scan");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await scanMessage(message.trim());
      setResult(data);
      await addHistory({
        type: "message",
        input: message.trim().slice(0, 200),
        risk_score: data.risk_score,
        risk_level: data.risk_level,
        flags: data.flags,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Message Scanner</Text>
      <Text style={styles.subtitle}>Analyze messages for phishing or scams</Text>

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Paste an email, SMS, or message here..."
        placeholderTextColor="#64748b"
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.pasteButton} onPress={handlePaste}>
          <Text style={styles.pasteText}>Paste</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.scanButton} onPress={handleScan} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.scanText}>Scan Message</Text>}
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {result && (
        <View style={[styles.resultCard, { borderColor: getRiskColor(result.risk_level) }]}>
          <Text style={styles.resultEmoji}>{getRiskEmoji(result.risk_level)}</Text>
          <Text style={[styles.riskLevel, { color: getRiskColor(result.risk_level) }]}>
            {result.risk_level.toUpperCase()}
          </Text>
          <Text style={styles.scoreText}>Risk Score: {result.risk_score}/100</Text>

          {result.phishing_indicators.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Phishing Indicators Found</Text>
              {result.phishing_indicators.map((pi: string, i: number) => (
                <Text key={i} style={styles.indicator}>• {pi}</Text>
              ))}
            </>
          )}

          <Text style={styles.sectionTitle}>Signals</Text>
          {result.flags.length === 0 ? (
            <Text style={styles.flagText}>No suspicious signals detected</Text>
          ) : (
            result.flags.map((f: string, i: number) => (
              <Text key={i} style={styles.flagText}>• {f}</Text>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#f8fafc" },
  subtitle: { fontSize: 14, color: "#94a3b8", marginBottom: 20 },
  input: {
    backgroundColor: "#1e293b",
    color: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  textArea: { minHeight: 150 },
  buttonRow: { flexDirection: "row", marginTop: 12, gap: 10 },
  pasteButton: {
    backgroundColor: "#334155",
    padding: 14,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
  },
  pasteText: { color: "#f8fafc", fontSize: 15, fontWeight: "600" },
  scanButton: {
    backgroundColor: "#3b82f6",
    padding: 14,
    borderRadius: 10,
    flex: 2,
    alignItems: "center",
  },
  scanText: { color: "#f8fafc", fontSize: 15, fontWeight: "600" },
  error: { color: "#ef4444", marginTop: 12 },
  resultCard: {
    backgroundColor: "#1e293b",
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 20,
  },
  resultEmoji: { fontSize: 40, textAlign: "center" },
  riskLevel: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginTop: 8 },
  scoreText: { fontSize: 14, color: "#94a3b8", textAlign: "center", marginTop: 4 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#cbd5e1",
    marginTop: 16,
    marginBottom: 6,
  },
  indicator: { fontSize: 13, color: "#ef4444", marginBottom: 3, fontWeight: "500" },
  flagText: { fontSize: 13, color: "#94a3b8", marginBottom: 3 },
});
