import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "scan_history";

let webFallback: Record<string, string> = {};

async function secureSet(key: string, value: string): Promise<void> {
  try {
    const SecureStore = require("expo-secure-store");
    await SecureStore.setItemAsync(key, value);
  } catch {
    webFallback[key] = value;
  }
}

async function secureGet(key: string): Promise<string | null> {
  try {
    const SecureStore = require("expo-secure-store");
    return await SecureStore.getItemAsync(key);
  } catch {
    return webFallback[key] ?? null;
  }
}

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
  await secureSet(key, value);
}

export async function getApiKey(key: string): Promise<string | null> {
  return secureGet(key);
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
