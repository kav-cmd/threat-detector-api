import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { scanURL } from "../lib/api";
import { addHistory } from "../lib/storage";

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

function getRiskEmoji(level: string): string {
  switch (level) {
    case "dangerous":
      return "🚨";
    case "suspicious":
      return "⚠️";
    default:
      return "✅";
  }
}

function ScoreMeter({ score }: { score: number }) {
  const color = getRiskColor(
    score >= 70 ? "dangerous" : score >= 40 ? "suspicious" : "safe"
  );
  return (
    <View style={meterStyles.container}>
      <View style={meterStyles.track}>
        <View
          style={[
            meterStyles.fill,
            {
              width: `${score}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <View style={meterStyles.labels}>
        <Text style={[meterStyles.label, { color: "#22c55e" }]}>Safe</Text>
        <Text style={[meterStyles.label, { color: "#f59e0b" }]}>
          Suspicious
        </Text>
        <Text style={[meterStyles.label, { color: "#ef4444" }]}>Danger</Text>
      </View>
    </View>
  );
}

const meterStyles = StyleSheet.create({
  container: { marginVertical: 12 },
  track: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 4 },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  label: { fontSize: 10, fontWeight: "600" },
});

export default function ScanURLScreen() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setUrl(text);
  };

  const handleScan = async () => {
    if (!url.trim()) {
      Alert.alert("Error", "Please enter a URL to scan");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await scanURL(url.trim());
      setResult(data);
      await addHistory({
        type: "url",
        input: url.trim(),
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
      <View style={styles.headerSection}>
        <Text style={styles.badge}>SCAN TYPE</Text>
        <Text style={styles.title}>URL Scanner</Text>
        <Text style={styles.subtitle}>
          Check if a link is safe to open using heuristics + ML + external APIs
        </Text>
      </View>

      <View style={styles.inputCard}>
        <TextInput
          style={styles.input}
          placeholder="Paste a URL here..."
          placeholderTextColor="#475569"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.pasteButton} onPress={handlePaste}>
            <Text style={styles.pasteText}>📋 Paste</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleScan}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.scanText}>Scan Now</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {result && (
        <View
          style={[
            styles.resultCard,
            { borderColor: `${getRiskColor(result.risk_level)}40` },
          ]}
        >
          <View style={styles.resultHeader}>
            <Text style={styles.resultEmoji}>
              {getRiskEmoji(result.risk_level)}
            </Text>
            <Text
              style={[
                styles.riskLevel,
                { color: getRiskColor(result.risk_level) },
              ]}
            >
              {result.risk_level.toUpperCase()}
            </Text>
          </View>

          <ScoreMeter score={result.risk_score} />
          <Text style={styles.scoreText}>
            Risk Score: {result.risk_score}/100
          </Text>

          {result.ml_confidence !== null &&
            result.ml_confidence !== undefined && (
              <Text style={styles.mlBadge}>
                ML Confidence: {(result.ml_confidence * 100).toFixed(1)}%
              </Text>
            )}

          {result.flags.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🔍 Detection Flags</Text>
              {result.flags.map((f: string, i: number) => (
                <View key={i} style={styles.flagRow}>
                  <Text style={styles.flagBullet}>•</Text>
                  <Text style={styles.flagText}>{f}</Text>
                </View>
              ))}
            </>
          )}

          {(result.vt_malicious !== null || result.gsb_threat !== null) && (
            <>
              <Text style={styles.sectionTitle}>🌐 External Checks</Text>
              {result.vt_malicious !== null && (
                <View style={styles.flagRow}>
                  <Text style={styles.flagBullet}>•</Text>
                  <Text style={styles.flagText}>
                    VirusTotal: {result.vt_malicious} malicious /{" "}
                    {result.vt_suspicious} suspicious
                  </Text>
                </View>
              )}
              {result.gsb_threat !== null && (
                <View style={styles.flagRow}>
                  <Text style={styles.flagBullet}>•</Text>
                  <Text style={styles.flagText}>
                    Google Safe Browsing:{" "}
                    {result.gsb_threat ? "Threat detected ⚠️" : "Clean ✅"}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      )}
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
  title: { fontSize: 28, fontWeight: "800", color: "#f8fafc" },
  subtitle: { fontSize: 13, color: "#64748b", marginTop: 4, lineHeight: 18 },
  inputCard: {
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.1)",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    color: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.15)",
  },
  buttonRow: { flexDirection: "row", marginTop: 12, gap: 10 },
  pasteButton: {
    backgroundColor: "rgba(129, 140, 248, 0.1)",
    padding: 14,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.15)",
  },
  pasteText: { color: "#cbd5e1", fontSize: 14, fontWeight: "600" },
  scanButton: {
    backgroundColor: "#818cf8",
    padding: 14,
    borderRadius: 12,
    flex: 2,
    alignItems: "center",
    shadowColor: "#818cf8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scanText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  errorCard: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    marginBottom: 16,
  },
  errorText: { color: "#fca5a5", fontSize: 13 },
  resultCard: {
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  resultHeader: { alignItems: "center", marginBottom: 8 },
  resultEmoji: { fontSize: 36 },
  riskLevel: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 4,
  },
  scoreText: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    fontWeight: "500",
  },
  mlBadge: {
    fontSize: 12,
    color: "#818cf8",
    textAlign: "center",
    marginTop: 4,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#cbd5e1",
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  flagRow: { flexDirection: "row", marginBottom: 4, paddingLeft: 4 },
  flagBullet: { color: "#818cf8", fontSize: 13, marginRight: 6 },
  flagText: { fontSize: 13, color: "#94a3b8", flex: 1, lineHeight: 18 },
});
