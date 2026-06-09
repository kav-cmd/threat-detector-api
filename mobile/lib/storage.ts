import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "scan_history";

export interface HistoryItem {
  id: string;
  type: "url" | "message";
  input: string;
  risk_score: number;
  risk_level: string;
  flags: string[];
  timestamp: number;
}

export async function saveApiKey(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function getApiKey(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function addHistory(item: Omit<HistoryItem, "id" | "timestamp">): Promise<void> {
  const history = await getHistory();
  history.unshift({
    ...item,
    id: Date.now().toString(),
    timestamp: Date.now(),
  });
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
}

export async function getHistory(): Promise<HistoryItem[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}
