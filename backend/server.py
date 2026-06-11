import os
import re
import urllib.parse
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import httpx
import google.generativeai as genai

load_dotenv()

app = FastAPI(title="Threat Detector API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY", "")
GOOGLE_SAFE_BROWSING_KEY = os.getenv("GOOGLE_SAFE_BROWSING_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

SUSPICIOUS_TLDS = {
    ".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".work",
    ".date", ".loan", ".men", ".click", ".download", ".review",
    ".stream", ".trade", ".webcam", ".bid", ".win", ".science",
    ".party", ".racing", ".pw", ".country", ".faith", ".lol",
}

BRAND_KEYWORDS = [
    "paypal", "google", "facebook", "microsoft", "apple", "amazon",
    "netflix", "instagram", "whatsapp", "linkedin", "twitter", "x.com",
    "bank", "chase", "wellsfargo", "hsbc", "amex", "visa", "mastercard",
]

SENSITIVE_PATHS = [
    "/login", "/signin", "/verify", "/secure", "/account",
    "/update", "/confirm", "/password", "/reset", "/auth",
]

PHISHING_KEYWORDS = {
    "critical": [
        "social security number", "credit card number", "ssn",
        "bank account number", "atm pin", "cvv", "card number",
    ],
    "high": [
        "verify your account", "confirm your identity", "verify your identity",
        "suspended", "unusual activity", "security alert", "account locked",
        "unauthorized access", "update your payment",
        "your account has been", "click here to verify",
    ],
    "medium": [
        "wire transfer", "western union", "money gram",
        "inheritance", "lottery winner", "you won",
        "tax refund", "government grant",
    ],
    "low": [
        "limited time", "act now", "urgent", "immediate action",
        "click here", "dear customer", "dear user", "congratulations",
        "free", "prize", "selected",
    ],
}

SCORE_WEIGHTS = {
    "critical": 35,
    "high": 25,
    "medium": 15,
    "low": 8,
}


class ScanURLRequest(BaseModel):
    url: str


class ScanMessageRequest(BaseModel):
    message: str


class URLScanResult(BaseModel):
    url: str
    risk_score: int
    risk_level: str
    flags: list[str]
    vt_malicious: Optional[int] = None
    vt_suspicious: Optional[int] = None
    gsb_threat: Optional[bool] = None


class MessageScanResult(BaseModel):
    message: str
    risk_score: int
    risk_level: str
    flags: list[str]
    phishing_indicators: list[str]


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    gemini_key: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str


class GuidesResponse(BaseModel):
    guides: list[dict]


class HealthResponse(BaseModel):
    status: str
    version: str


def normalize_url(url: str) -> str:
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url


def extract_domain(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    return parsed.netloc.lower()


def get_risk_label(score: int) -> str:
    if score >= 70:
        return "dangerous"
    elif score >= 40:
        return "suspicious"
    else:
        return "safe"


def heuristic_url_scan(url: str) -> tuple[int, list[str]]:
    score = 0
    flags = []
    domain = extract_domain(url)
    parsed = urllib.parse.urlparse(url)

    for tld in SUSPICIOUS_TLDS:
        if domain.endswith(tld):
            score += 30
            flags.append(f"Suspicious TLD: {tld}")
            break

    for brand in BRAND_KEYWORDS:
        if brand in domain:
            score += 30
            flags.append(f"Brand keyword '{brand}' in domain")
            break

    if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", domain):
        score += 30
        flags.append("IP address used instead of domain name")

    if "@" in url:
        score += 25
        flags.append("URL contains '@' character")

    if "%" in parsed.path or "%" in parsed.query:
        score += 20
        flags.append("URL-encoded characters detected")

    for path in SENSITIVE_PATHS:
        if path in parsed.path.lower():
            score += 20
            flags.append(f"Sensitive path segment: {path}")
            break

    subdomain_count = domain.count(".") - 1
    if subdomain_count >= 3:
        score += 15
        flags.append(f"Deep subdomains ({subdomain_count} levels)")

    shorteners = ["bit.ly", "tinyurl", "tiny.cc", "shorter.me", "rb.gy",
                  "shorturl", "t.co", "ow.ly", "is.gd", "buff.ly", "gg.gg"]
    for s in shorteners:
        if s in domain:
            score += 15
            flags.append("URL shortener detected")
            break

    if not url.startswith("https://"):
        score += 10
        flags.append("No HTTPS encryption")

    homoglyph_pattern = r'[аеіоуАЕІОУ]'
    if re.search(homoglyph_pattern, domain):
        score += 35
        flags.append("Possible homoglyph/IDN spoofing detected")

    return min(score, 100), flags


def heuristic_message_scan(message: str) -> tuple[int, list[str]]:
    score = 0
    flags = []
    msg_lower = message.lower()

    for severity, keywords in PHISHING_KEYWORDS.items():
        for kw in keywords:
            if kw in msg_lower:
                weight = SCORE_WEIGHTS[severity]
                score += weight
                flags.append(f"{severity}: '{kw}'")
                break

    url_count = len(re.findall(r'https?://\S+', message))
    if url_count > 2:
        score += 10
        flags.append(f"Multiple URLs ({url_count}) in message")

    if re.search(r'\+\d{7,15}', message):
        score += 10
        flags.append("Phone number in message")

    if re.search(r'\b\d{13,19}\b', message):
        score += 15
        flags.append("Possible credit card or account number detected")

    return min(score, 100), flags


async def check_virustotal(url: str) -> tuple[Optional[int], Optional[int]]:
    if not VIRUSTOTAL_API_KEY:
        return None, None
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            encoded = urllib.parse.quote(url, safe='')
            resp = await client.post(
                f"https://www.virustotal.com/api/v3/urls",
                headers={"x-apikey": VIRUSTOTAL_API_KEY},
                data=f"url={encoded}",
            )
            if resp.status_code != 200:
                return None, None
            analysis_id = resp.json().get("data", {}).get("id", "")
            if not analysis_id:
                return None, None
            import asyncio
            await asyncio.sleep(3)
            report = await client.get(
                f"https://www.virustotal.com/api/v3/analyses/{analysis_id}",
                headers={"x-apikey": VIRUSTOTAL_API_KEY},
            )
            if report.status_code != 200:
                return None, None
            stats = report.json().get("data", {}).get("attributes", {}).get("stats", {})
            return stats.get("malicious", 0), stats.get("suspicious", 0)
    except Exception:
        return None, None


async def check_google_safe_browsing(url: str) -> Optional[bool]:
    if not GOOGLE_SAFE_BROWSING_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={GOOGLE_SAFE_BROWSING_KEY}",
                json={
                    "client": {"clientId": "threat-detector", "clientVersion": "1.0.0"},
                    "threatInfo": {
                        "threatTypes": [
                            "MALWARE", "SOCIAL_ENGINEERING",
                            "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION",
                        ],
                        "platformTypes": ["ANY_PLATFORM"],
                        "threatEntryTypes": ["URL"],
                        "threatEntries": [{"url": url}],
                    },
                },
            )
            if resp.status_code != 200:
                return None
            data = resp.json()
            return len(data.get("matches", [])) > 0
    except Exception:
        return None


@app.get("/api/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", version="1.0.0")


@app.post("/api/scan-url", response_model=URLScanResult)
async def scan_url(request: ScanURLRequest):
    url = normalize_url(request.url)
    heuristic_score, heuristic_flags = heuristic_url_scan(url)

    vt_malicious, vt_suspicious = await check_virustotal(url)
    if vt_malicious is not None:
        vt_score = min(vt_malicious * 10, 40)
        if vt_malicious > 0:
            heuristic_flags.append(f"VirusTotal: {vt_malicious} malicious detections")
        total_score = min(heuristic_score + vt_score, 100)
    else:
        total_score = heuristic_score

    gsb_threat = await check_google_safe_browsing(url)
    if gsb_threat:
        total_score = max(total_score, 80)
        heuristic_flags.append("Google Safe Browsing: threat detected")

    return URLScanResult(
        url=url,
        risk_score=total_score,
        risk_level=get_risk_label(total_score),
        flags=heuristic_flags,
        vt_malicious=vt_malicious,
        vt_suspicious=vt_suspicious,
        gsb_threat=gsb_threat,
    )


@app.post("/api/scan-message", response_model=MessageScanResult)
async def scan_message(request: ScanMessageRequest):
    msg = request.message.strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    score, flags = heuristic_message_scan(msg)

    phishing_indicators = []
    if score >= 40:
        for severity in ["critical", "high"]:
            for kw in PHISHING_KEYWORDS[severity]:
                if kw in msg.lower():
                    phishing_indicators.append(kw)

    return MessageScanResult(
        message=msg[:500],
        risk_score=score,
        risk_level=get_risk_label(score),
        flags=flags,
        phishing_indicators=phishing_indicators,
    )


CYBER_GUIDES = [
    {
        "id": "phishing",
        "title": "Phishing Detection",
        "icon": "🎣",
        "summary": "How to spot phishing emails, messages, and websites",
        "rules": [
            "Check the sender's email address carefully — look for misspellings",
            "Hover over links before clicking to see the real URL",
            "Never share passwords, OTPs, or card details via email/SMS",
            "Urgent language like 'act now' or 'account suspended' is a red flag",
            "Legitimate companies never ask for sensitive info via email",
            "Verify suspicious messages by contacting the company directly",
            "Watch for generic greetings like 'Dear Customer' instead of your name",
        ],
        "examples": [
            "fake-support@paypa1.com",
            "http://secure-login.xyz/verify",
            "URGENT: Your account will be closed",
        ],
    },
    {
        "id": "safe-browsing",
        "title": "Safe Browsing",
        "icon": "🌐",
        "summary": "Best practices for staying safe online",
        "rules": [
            "Always look for HTTPS (lock icon) before entering data",
            "Don't download files from untrusted sources",
            "Use a password manager to generate unique passwords",
            "Enable two-factor authentication (2FA) everywhere",
            "Keep your browser and OS updated",
            "Avoid using public WiFi for banking transactions",
            "Clear cookies and cache regularly",
        ],
        "examples": [
            "Check for https:// before entering passwords",
            "Use VPN on public WiFi",
            "Never save passwords in browser",
        ],
    },
    {
        "id": "password-security",
        "title": "Password Security",
        "icon": "🔑",
        "summary": "Create and manage strong passwords",
        "rules": [
            "Use at least 12 characters with mix of letters, numbers, symbols",
            "Never reuse passwords across different sites",
            "Use a password manager (Bitwarden, 1Password, etc.)",
            "Enable 2FA on all accounts that support it",
            "Change passwords immediately if a service is breached",
            "Avoid using personal info (birthdays, names) in passwords",
            "Use passphrases: 'correct-horse-battery-staple' style",
        ],
        "examples": [
            "Weak: password123",
            "Better: MyD0g!sFluffy2024",
            "Best: correct-horse-battery-staple",
        ],
    },
    {
        "id": "social-engineering",
        "title": "Social Engineering",
        "icon": "🧠",
        "summary": "Recognize manipulation tactics used by scammers",
        "rules": [
            "Be skeptical of unsolicited calls asking for personal info",
            "Scammers create false urgency to pressure you",
            "Verify identity through official channels, not contact info provided",
            "Beware of 'too good to be true' offers and prizes",
            "Never let remote access to your computer from strangers",
            "Romance scammers build trust before asking for money",
            "CEO fraud: verify wire transfer requests via phone call",
        ],
        "examples": [
            "Fake IRS call threatening arrest",
            "Nigerian prince inheritance scam",
            "Fake tech support asking for remote access",
        ],
    },
    {
        "id": "mobile-security",
        "title": "Mobile Security",
        "icon": "📱",
        "summary": "Protect your phone from threats",
        "rules": [
            "Only install apps from official app stores",
            "Review app permissions regularly",
            "Keep your phone OS and apps updated",
            "Use biometric lock (fingerprint/face) plus PIN",
            "Don't jailbreak or root your device",
            "Beware of SMS phishing (smishing)",
            "Turn off Bluetooth and WiFi when not in use",
        ],
        "examples": [
            "Check app permissions in Settings",
            "Enable Find My Device (Android) / Find My (iOS)",
            "Don't click links in SMS from unknown numbers",
        ],
    },
    {
        "id": "network-security",
        "title": "Network Security",
        "icon": "🔒",
        "summary": "Secure your home and public network usage",
        "rules": [
            "Change your router's default admin password",
            "Use WPA3 (or WPA2) encryption on WiFi",
            "Disable WPS on your router",
            "Use a firewall on your devices",
            "Consider a VPN for public WiFi",
            "Regularly update router firmware",
            "Segment IoT devices on a separate network",
        ],
        "examples": [
            "Router admin: change from 'admin/admin'",
            "Use VPN on coffee shop WiFi",
            "Smart lights on separate guest network",
        ],
    },
]


@app.get("/api/guides", response_model=GuidesResponse)
async def get_guides():
    return GuidesResponse(guides=CYBER_GUIDES)


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    api_key = request.gemini_key or GEMINI_API_KEY
    if not api_key:
        return ChatResponse(reply="⚠️ Gemini API key not configured. Add it in Settings tab or ask the app owner to set GEMINI_API_KEY.")

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            "gemini-2.0-flash",
            system_instruction=(
                "You are a cybersecurity expert assistant. Answer questions about "
                "phishing, malware, online safety, password security, social engineering, "
                "and general cybersecurity threats. Keep answers clear, practical, and "
                "actionable. If asked about something outside cybersecurity, politely "
                "redirect back to security topics. Be concise — 2-3 paragraphs max."
            ),
        )

        chat_session = model.start_chat(history=request.history)
        response = chat_session.send_message(request.message)
        return ChatResponse(reply=response.text)
    except Exception as e:
        err = str(e)
        if "quota" in err.lower() or "resource_exhausted" in err.lower():
            return ChatResponse(reply="⚠️ Gemini API rate limit reached. The free daily quota for this API key is exhausted. Go to aistudio.google.com/apikey to create a new key, then paste it in Settings tab.")
        return ChatResponse(reply=f"⚠️ AI error: {err[:200]}")


WEB_DIST = os.path.join(os.path.dirname(__file__), "web-dist")
if os.path.isdir(WEB_DIST):
    expo_dir = os.path.join(WEB_DIST, "_expo")
    if os.path.isdir(expo_dir):
        app.mount("/_expo", StaticFiles(directory=expo_dir), name="expo-assets")
    assets_dir = os.path.join(WEB_DIST, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="web-assets")

    favicon_path = os.path.join(WEB_DIST, "favicon.ico")
    index_path = os.path.join(WEB_DIST, "index.html")

    @app.get("/favicon.ico", include_in_schema=False)
    async def favicon():
        if os.path.isfile(favicon_path):
            return HTMLResponse(open(favicon_path, "rb").read(), media_type="image/x-icon")
        return HTMLResponse("", status_code=404)

    @app.api_route("/{path:path}", include_in_schema=False)
    async def serve_web(path: str):
        if path.startswith("api/"):
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        if os.path.isfile(index_path):
            return HTMLResponse(open(index_path, encoding="utf-8").read())
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=404, content={"detail": "Web app not built"})

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
