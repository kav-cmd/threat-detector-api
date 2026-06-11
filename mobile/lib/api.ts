const API_BASE = "https://threat-detector-api.onrender.com";

export interface URLScanResult {
  url: string;
  risk_score: number;
  risk_level: "safe" | "suspicious" | "dangerous";
  flags: string[];
  ml_confidence?: number | null;
  vt_malicious: number | null;
  vt_suspicious: number | null;
  gsb_threat: boolean | null;
}

export interface MessageScanResult {
  message: string;
  risk_score: number;
  risk_level: "safe" | "suspicious" | "dangerous";
  flags: string[];
  phishing_indicators: string[];
  ml_phishing_probability?: number | null;
  ml_safe_probability?: number | null;
}

export interface HealthCheck {
  status: string;
  version: string;
  uptime: number;
}

export interface Guide {
  id: string;
  title: string;
  icon: string;
  summary: string;
  rules: string[];
  examples: string[];
}

export interface ChatResponse {
  reply: string;
}

async function request<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }
  return response.json();
}

export async function scanURL(url: string): Promise<URLScanResult> {
  return request<URLScanResult>("/api/scan-url", { url });
}

export async function scanMessage(message: string): Promise<MessageScanResult> {
  return request<MessageScanResult>("/api/scan-message", { message });
}

export async function healthCheck(): Promise<HealthCheck> {
  const response = await fetch(`${API_BASE}/api/health`);
  if (!response.ok) throw new Error("Health check failed");
  return response.json();
}

export async function getGuides(): Promise<Guide[]> {
  const response = await fetch(`${API_BASE}/api/guides`);
  if (!response.ok) throw new Error("Failed to load guides");
  const data = await response.json();
  return data.guides;
}

export async function chatWithGemini(
  message: string,
  history: { role: string; parts: { text: string }[] }[]
): Promise<ChatResponse> {
  return request<ChatResponse>("/api/chat", { message, history });
}
