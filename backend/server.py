import os
import re
import urllib.parse
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

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


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
