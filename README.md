# Threat Detector API 🛡️

**Live demo:** https://threat-detector-api-1.onrender.com/

An AI-powered threat detection service that scans URLs and messages for phishing, scams, and other cyber threats. A FastAPI backend combines a machine-learning classifier with Gemini-assisted analysis, exposed through a REST API with a bundled web client and a mobile app.

> Free-tier Render instances sleep when idle — the first request may take ~30s to wake up.

## Features

- **URL scanning** — heuristics + ML classification of suspicious links
- **Message scanning** — detects phishing/scam patterns in SMS and chat text
- **AI security chat** — ask security questions, get Gemini-powered answers
- **Safety guides** — practical hardening tips (router, passwords, and more)
- **Production touches** — rate limiting (30 req/min), audit logging, trusted-host and CORS middleware

## API

Base URL: `https://threat-detector-api-1.onrender.com`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Service health check |
| POST | `/api/scan-url` | Analyze a URL for threats |
| POST | `/api/scan-message` | Analyze message text for phishing/scams |
| GET | `/api/guides` | Security hardening guides |
| POST | `/api/chat` | AI security assistant |

Example:

```bash
curl -X POST https://threat-detector-api-1.onrender.com/api/scan-url \
  -H "Content-Type: application/json" \
  -d '{"url": "http://paypa1-secure-login.example.com"}'
```

## Tech stack

Python · FastAPI · scikit-learn (ML classifier) · Gemini API · httpx · Render (deployment) · mobile client under `mobile/`

## Project structure

```
threat-detector-api/
├── backend/
│   ├── server.py          # FastAPI app: scanning, chat, guides, rate limiting
│   ├── ml_model.py        # ML threat classifier
│   ├── web-dist/          # Built web client (served as static files)
│   └── requirements.txt
├── mobile/                # Mobile application
└── render.yaml            # One-click Render deployment config
```

## Run locally

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # add GEMINI_API_KEY
python server.py            # or: uvicorn server:app --reload
```

Interactive API docs at `http://localhost:8000/docs`.

## Roadmap

- Real-time threat monitoring and history dashboard
- User authentication
- Improved ML models with periodic retraining
- Docker support

## License

MIT
