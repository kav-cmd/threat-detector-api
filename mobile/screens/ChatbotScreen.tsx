import { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { chatWithGemini } from "../lib/api";
import { getApiKey, saveApiKey } from "../lib/storage";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "0", role: "assistant", text: "👋 Hi! I'm your cybersecurity assistant. Ask me anything about online safety, phishing, malware, passwords, or any security concern." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [geminiKey, setGeminiKey] = useState("");
  const [needsKey, setNeedsKey] = useState(true);
  const flatList = useRef<FlatList>(null);

  useEffect(() => {
    getApiKey("gemini_key").then((k) => {
      if (k) { setGeminiKey(k); setNeedsKey(false); }
    });
  }, []);

  const saveKey = async () => {
    if (geminiKey.trim()) {
      await saveApiKey("gemini_key", geminiKey.trim());
      setNeedsKey(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const history = messages.slice(1).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    try {
      const res = await chatWithGemini(userMsg.text, history);
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", text: res.reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      const errMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", text: "⚠️ Error: " + (e.message || "Could not reach the AI. Check your connection.") };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (needsKey) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.keySetup}>
          <Text style={styles.keyTitle}>🔐 Gemini AI Setup</Text>
          <Text style={styles.keySub}>Enter your Gemini API key to use the cybersecurity chatbot</Text>
          <TextInput
            style={styles.keyInput}
            placeholder="Paste your Gemini API key"
            placeholderTextColor="#64748b"
            value={geminiKey}
            onChangeText={setGeminiKey}
            secureTextEntry
          />
          <TouchableOpacity style={styles.saveBtn} onPress={saveKey}>
            <Text style={styles.saveBtnText}>Save & Start Chat</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>
            Get a free key at https://aistudio.google.com/apikey
          </Text>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🤖 Security AI</Text>
      </View>

      <FlatList
        ref={flatList}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => flatList.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.botBubble]}>
            <Text style={[styles.bubbleText, item.role === "user" ? styles.userText : styles.botText]}>
              {item.text}
            </Text>
          </View>
        )}
      />

      {loading && (
        <View style={styles.typing}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.typingText}>AI is thinking...</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.chatInput}
          placeholder="Ask about cybersecurity..."
          placeholderTextColor="#64748b"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={loading || !input.trim()}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#f8fafc" },
  chatList: { flex: 1 },
  chatContent: { padding: 16 },
  bubble: { maxWidth: "85%", padding: 12, borderRadius: 16, marginBottom: 10 },
  userBubble: { backgroundColor: "#3b82f6", alignSelf: "flex-end", borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: "#1e293b", alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  userText: { color: "#fff" },
  botText: { color: "#cbd5e1" },
  typing: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 4 },
  typingText: { color: "#64748b", fontSize: 12, marginLeft: 6 },
  inputRow: { flexDirection: "row", padding: 12, borderTopWidth: 1, borderTopColor: "#1e293b", gap: 8 },
  chatInput: {
    flex: 1,
    backgroundColor: "#1e293b",
    color: "#f8fafc",
    padding: 12,
    borderRadius: 20,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#334155",
  },
  sendBtn: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    borderRadius: 20,
    justifyContent: "center",
  },
  sendText: { color: "#fff", fontWeight: "600" },
  keySetup: { flex: 1, justifyContent: "center", padding: 24 },
  keyTitle: { fontSize: 22, fontWeight: "bold", color: "#f8fafc", textAlign: "center", marginBottom: 8 },
  keySub: { fontSize: 14, color: "#94a3b8", textAlign: "center", marginBottom: 24 },
  keyInput: {
    backgroundColor: "#1e293b",
    color: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 16,
  },
  saveBtn: { backgroundColor: "#3b82f6", padding: 16, borderRadius: 12, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  hint: { fontSize: 12, color: "#64748b", textAlign: "center", marginTop: 12 },
});
