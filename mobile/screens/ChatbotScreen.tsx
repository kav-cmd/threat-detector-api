import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { chatWithGemini } from "../lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const WELCOME_MESSAGE: Message = {
  id: "0",
  role: "assistant",
  text: "👋 Hi! I'm your cybersecurity assistant. Ask me anything about online safety, phishing, malware, passwords, or any security concern. The AI is automatically configured — just start chatting!",
};

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatList = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const history = messages.slice(1).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    try {
      const res = await chatWithGemini(userMsg.text, history);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: res.reply,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text:
          "⚠️ " +
          (e.message || "Could not reach the AI. The server API key may not be configured."),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.badge}>AI ASSISTANT</Text>
        <Text style={styles.headerTitle}>Security AI</Text>
      </View>

      <FlatList
        ref={flatList}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => flatList.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === "user" ? styles.userBubble : styles.botBubble,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                item.role === "user" ? styles.userText : styles.botText,
              ]}
            >
              {item.text}
            </Text>
          </View>
        )}
      />

      {loading && (
        <View style={styles.typing}>
          <ActivityIndicator size="small" color="#818cf8" />
          <Text style={styles.typingText}>AI is thinking...</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.chatInput}
          placeholder="Ask about cybersecurity..."
          placeholderTextColor="#475569"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={sendMessage}
          disabled={loading || !input.trim()}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0f1e" },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(129, 140, 248, 0.1)",
  },
  badge: {
    color: "#818cf8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#f8fafc" },
  chatList: { flex: 1 },
  chatContent: { padding: 16 },
  bubble: {
    maxWidth: "85%",
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
  },
  userBubble: {
    backgroundColor: "#818cf8",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
    shadowColor: "#818cf8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  botBubble: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.1)",
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: "#fff" },
  botText: { color: "#cbd5e1" },
  typing: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  typingText: { color: "#64748b", fontSize: 12, marginLeft: 6 },
  inputRow: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(129, 140, 248, 0.1)",
    gap: 8,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    color: "#f8fafc",
    padding: 14,
    borderRadius: 24,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.15)",
  },
  sendBtn: {
    backgroundColor: "#818cf8",
    paddingHorizontal: 22,
    borderRadius: 24,
    justifyContent: "center",
    shadowColor: "#818cf8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
