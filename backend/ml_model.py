import os
import re
import json
import pickle
import numpy as np
from typing import Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

MODEL_PATH = os.path.join(os.path.dirname(__file__), "phishing_model.pkl")

TRAINING_DATA = [
    ("verify your account now click here to confirm your identity", 1),
    ("your account has been suspended click here to reactivate", 1),
    ("urgent action required your account will be closed", 1),
    ("congratulations you won a prize click here to claim", 1),
    ("dear customer update your payment information immediately", 1),
    ("social security number required for verification", 1),
    ("credit card number needed to process your refund", 1),
    ("unusual activity detected on your account login now", 1),
    ("click here to verify your identity and avoid suspension", 1),
    ("wire transfer western union money gram inheritance", 1),
    ("hello your invoice is attached please review", 0),
    ("meeting tomorrow at 3pm please confirm attendance", 0),
    ("your order has been shipped tracking number below", 0),
    ("thank you for your purchase receipt attached", 0),
    ("please find the quarterly report attached", 0),
    ("your appointment is confirmed for next monday", 0),
    ("team standup at 10am tomorrow bring your updates", 0),
    ("the deployment completed successfully all tests passed", 0),
    ("can you review the pull request when you get a chance", 0),
    ("your subscription has been renewed successfully", 0),
    ("account locked due to multiple failed attempts reset now", 1),
    ("confirm your identity to prevent account deletion", 1),
    ("you have been selected for a free gift card", 1),
    ("tax refund available claim your refund now", 1),
    ("government grant program you are eligible apply now", 1),
    ("reset your password immediately unauthorized access detected", 1),
    ("fake irs call threatening arrest pay immediately", 1),
    ("nigerian prince inheritance scam send bank details", 1),
    ("fake tech support remote access scam computer virus", 1),
    ("romance scammer asks for money to visit you", 1),
    ("ceo fraud wire transfer request urgent approval needed", 1),
    ("fake lottery winner you won 1 million dollars", 1),
    ("phishing email claiming your package could not be delivered", 1),
    ("fake amazon order confirmation click here to cancel", 1),
    ("netflix account suspended update payment method", 1),
    ("your apple id has been disabled verify now", 1),
    ("paypal account limited resolve the issue now", 1),
    ("your email storage is full upgrade now", 1),
    ("please find attached the document you requested", 0),
    ("your timesheet has been approved for this week", 0),
    ("the build pipeline is green all checks passed", 0),
    ("here is the agenda for tomorrows board meeting", 0),
    ("your leave request has been approved enjoy your time off", 0),
    ("the quarterly earnings report is ready for review", 0),
    ("please update the jira tickets before end of day", 0),
    ("the client approved the proposal we can proceed", 0),
    ("here are the mockups for the new landing page", 0),
    ("the database migration is scheduled for this weekend", 0),
    ("your password has been changed successfully", 0),
    ("welcome to the team we are excited to have you", 0),
    ("the sprint retrospective is scheduled for friday", 0),
    ("your feedback is requested on the new feature design", 0),
    ("the system will be down for maintenance at 2am", 0),
    ("here is the link to the onboarding documentation", 0),
]

class PhishingDetector:
    def __init__(self):
        self.pipeline: Optional[Pipeline] = None
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.classifier: Optional[LogisticRegression] = None

    def _extract_url_features(self, url: str) -> list:
        features = []
        domain = self._extract_domain(url)
        parsed = re.match(r"https?://([^/]+)", url)

        features.append(len(url))
        features.append(url.count("."))
        features.append(url.count("-"))
        features.append(url.count("@"))
        features.append(url.count("%"))
        features.append(url.count("?"))
        features.append(url.count("="))
        features.append(url.count("&"))
        features.append(1 if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", domain) else 0)
        features.append(domain.count("."))
        features.append(1 if any(tld in domain for tld in [".tk",".ml",".ga",".cf",".gq",".xyz",".top",".work",".date",".loan",".men",".click",".download",".review",".stream",".trade",".webcam",".bid",".win",".science",".party",".racing",".pw",".country",".faith",".lol"]) else 0)
        features.append(1 if any(brand in domain for brand in ["paypal","google","facebook","microsoft","apple","amazon","netflix","instagram","whatsapp","linkedin","twitter","bank","chase","wellsfargo","hsbc","amex","visa","mastercard"]) else 0)
        features.append(1 if not url.startswith("https://") else 0)
        features.append(1 if any(short in domain for short in ["bit.ly","tinyurl","tiny.cc","shorter.me","rb.gy","shorturl","t.co","ow.ly","is.gd","buff.ly","gg.gg"]) else 0)
        features.append(1 if re.search(r'[аеіоуАЕІОУ]', domain) else 0)
        features.append(len(re.findall(r'[/]', url)))
        features.append(sum(c.isdigit() for c in url) / max(len(url), 1))

        return features

    def _extract_domain(self, url: str) -> str:
        m = re.match(r"https?://([^/?#]+)", url)
        return m.group(1).lower() if m else url.lower()

    def train(self):
        texts = [item[0] for item in TRAINING_DATA]
        labels = [item[1] for item in TRAINING_DATA]

        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 3),
            analyzer="char_wb",
            min_df=1,
            sublinear_tf=True,
        )

        X = self.vectorizer.fit_transform(texts)
        self.classifier = LogisticRegression(C=10.0, max_iter=1000, class_weight="balanced", random_state=42)
        self.classifier.fit(X, labels)

        self.pipeline = Pipeline([
            ("vectorizer", self.vectorizer),
            ("classifier", self.classifier),
        ])
        self.pipeline.fit(texts, labels)

    def predict_message(self, message: str) -> tuple[float, float]:
        if self.pipeline is None:
            self._load_or_train()
        proba = self.pipeline.predict_proba([message])[0]
        phishing_prob = float(proba[1]) if len(proba) > 1 else 0.0
        safe_prob = float(proba[0]) if len(proba) > 0 else 1.0
        return safe_prob, phishing_prob

    def predict_url(self, url: str) -> tuple[float, list[str]]:
        features = self._extract_url_features(url)
        if self.classifier is None:
            self._load_or_train()

        domain = self._extract_domain(url)
        flags = []
        score = 0

        if features[10] > 0:
            score += 25
            flags.append("Suspicious TLD detected")
        if features[11] > 0:
            score += 25
            flags.append("Brand name in domain")
        if features[8] > 0:
            score += 25
            flags.append("IP address used instead of domain")
        if features[3] > 0:
            score += 20
            flags.append("URL contains @ character")
        if features[4] > 0:
            score += 15
            flags.append("URL-encoded characters")
        if features[12] > 0:
            score += 10
            flags.append("No HTTPS encryption")
        if features[13] > 0:
            score += 15
            flags.append("URL shortener detected")
        if features[14] > 0:
            score += 30
            flags.append("Possible homoglyph/IDN spoofing")
        if domain.count(".") >= 3:
            score += 10
            flags.append(f"Deep subdomains ({domain.count('.') - 1} levels)")
        if len(url) > 100:
            score += 10
            flags.append("Unusually long URL")

        for path in ["/login", "/signin", "/verify", "/secure", "/account", "/update", "/confirm", "/password", "/reset", "/auth"]:
            if path in url.lower():
                score += 15
                flags.append(f"Sensitive path: {path}")
                break

        safe_prob = max(0, 1 - score / 100)
        return safe_prob, flags

    def _load_or_train(self):
        if os.path.exists(MODEL_PATH):
            try:
                with open(MODEL_PATH, "rb") as f:
                    data = pickle.load(f)
                    self.vectorizer = data["vectorizer"]
                    self.classifier = data["classifier"]
                    self.pipeline = data["pipeline"]
                return
            except Exception:
                pass
        self.train()
        try:
            os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
            with open(MODEL_PATH, "wb") as f:
                pickle.dump({
                    "vectorizer": self.vectorizer,
                    "classifier": self.classifier,
                    "pipeline": self.pipeline,
                }, f)
        except Exception:
            pass


detector = PhishingDetector()
