#!/usr/bin/env python3
"""Enrich bookmarks with titles from URLs and AI-based topic categorization."""

import json
import re
import urllib.request
import urllib.error
from urllib.parse import urlparse, unquote
from html.parser import HTMLParser
import ssl
import time

INPUT = "bookmarks-raw.json"
OUTPUT = "bookmarks-enriched.json"

# Topic keywords mapping (Hebrew + English)
TOPIC_RULES = [
    # AI & Tech
    (["ai", "artificial intelligence", "בינה מלאכותית", "chatgpt", "openai", "claude",
      "machine learning", "deep learning", "gpt", "llm", "copilot", "gemini", "midjourney",
      "stable diffusion", "prompt", "neural", "automation", "אוטומציה"], "AI & Tech"),
    # Programming & Dev
    (["code", "coding", "programming", "python", "javascript", "react", "github",
      "developer", "api", "nodejs", "typescript", "פיתוח", "תכנות", "קוד"], "Programming"),
    # DIY & Maker
    (["diy", "maker", "arduino", "3d print", "woodwork", "build", "craft",
      "עשה זאת בעצמך", "בניה", "יצירה", "esp32", "raspberry", "electronics"], "DIY & Maker"),
    # Funny & Entertainment
    (["funny", "meme", "humor", "comedy", "lol", "הומור", "מצחיק", "בדיחה",
      "reels", "tiktok", "viral", "ויראלי"], "Funny & Entertainment"),
    # Business & Finance
    (["business", "startup", "entrepreneur", "finance", "investment", "money",
      "עסק", "יזמות", "סטארטאפ", "כסף", "השקע", "פיננס", "marketing", "שיווק",
      "sales", "מכירות", "ecommerce"], "Business & Finance"),
    # Real Estate
    (["real estate", "נדלן", "דירה", "בית", "yad2", "מדלן", "משכנתא",
      "apartment", "property"], "Real Estate"),
    # Career & Professional
    (["linkedin", "career", "job", "resume", "cv", "קריירה", "עבודה",
      "interview", "salary", "משכורת", "ראיון"], "Career"),
    # Food & Cooking
    (["recipe", "cooking", "food", "restaurant", "מתכון", "בישול", "אוכל",
      "מסעדה", "שף"], "Food & Cooking"),
    # Health & Fitness
    (["health", "fitness", "workout", "gym", "diet", "בריאות", "כושר",
      "אימון", "דיאטה", "yoga", "יוגה", "meditation"], "Health & Fitness"),
    # Travel
    (["travel", "flight", "hotel", "trip", "vacation", "טיול", "חופשה",
      "טיסה", "מלון", "backpack"], "Travel"),
    # Music
    (["music", "song", "spotify", "playlist", "מוזיקה", "שיר", "concert",
      "album", "אלבום"], "Music"),
    # Design & Creative
    (["design", "figma", "canva", "photoshop", "ui", "ux", "עיצוב",
      "graphic", "logo", "branding", "typography"], "Design & Creative"),
    # Education & Learning
    (["course", "learn", "tutorial", "udemy", "coursera", "education",
      "קורס", "לימוד", "הדרכה", "webinar"], "Education"),
    # Gadgets & Products
    (["gadget", "product", "review", "unbox", "amazon", "aliexpress",
      "ksp", "zap", "מוצר", "ביקורת", "גאדג'ט"], "Gadgets & Products"),
    # Home & Living
    (["home", "decor", "furniture", "ikea", "בית", "עיצוב פנים",
      "רהיטים", "גינה", "garden"], "Home & Living"),
    # News & Current Events
    (["news", "politics", "חדשות", "פוליטיקה", "election", "בחירות",
      "war", "מלחמה", "כלכלה", "economy"], "News"),
    # Parenting & Family
    (["parent", "baby", "kids", "family", "הורות", "ילדים", "תינוק",
      "משפחה"], "Parenting & Family"),
    # Cars & Vehicles
    (["car", "auto", "tesla", "electric vehicle", "רכב", "מכונית",
      "חשמלי", "ev"], "Cars & Vehicles"),
]

class TitleParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_title = False
        self.title = ""
        self.og_title = ""
        self.og_desc = ""

    def handle_starttag(self, tag, attrs):
        if tag == "title":
            self.in_title = True
        if tag == "meta":
            attr_dict = dict(attrs)
            prop = attr_dict.get("property", attr_dict.get("name", ""))
            content = attr_dict.get("content", "")
            if prop == "og:title":
                self.og_title = content
            if prop in ("og:description", "description"):
                self.og_desc = content

    def handle_data(self, data):
        if self.in_title:
            self.title += data

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False


def fetch_title(url, timeout=5):
    """Fetch page title and description."""
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            # Only read HTML
            ct = resp.headers.get("Content-Type", "")
            if "html" not in ct.lower() and "text" not in ct.lower():
                return None, None
            html = resp.read(16000).decode("utf-8", errors="ignore")

        parser = TitleParser()
        parser.feed(html)
        title = parser.og_title or parser.title or None
        desc = parser.og_desc or None
        if title:
            title = title.strip()
        if desc:
            desc = desc.strip()[:200]
        return title, desc
    except:
        return None, None


def title_from_url(url):
    """Extract readable text from URL path."""
    path = urlparse(url).path
    parts = unquote(path).strip("/").split("/")
    if parts:
        last = parts[-1].replace("-", " ").replace("_", " ")
        # Remove file extensions
        last = re.sub(r'\.\w+$', '', last)
        if len(last) > 5:
            return last
    return None


def classify_topic(url, title, desc, context):
    """Classify into topic based on all available text."""
    search_text = " ".join(filter(None, [
        url.lower(),
        (title or "").lower(),
        (desc or "").lower(),
        (context or "").lower()
    ]))

    best_topic = None
    best_score = 0

    for keywords, topic in TOPIC_RULES:
        score = sum(1 for kw in keywords if kw.lower() in search_text)
        if score > best_score:
            best_score = score
            best_topic = topic

    return best_topic or "Uncategorized"


def main():
    with open(INPUT, "r", encoding="utf-8") as f:
        bookmarks = json.load(f)

    total = len(bookmarks)
    print(f"Enriching {total} bookmarks...")

    # Skip known non-fetchable domains
    skip_domains = {"quickshare.samsungcloud.com", "wa.me"}

    for i, bm in enumerate(bookmarks):
        url = bm["url"]
        domain = bm.get("domain", "")

        # Try to get title
        if domain not in skip_domains:
            title, desc = fetch_title(url, timeout=4)
        else:
            title, desc = None, None

        # Fallback: try URL-based title
        if not title:
            title = title_from_url(url)

        bm["title"] = title
        bm["description"] = desc

        # Classify topic
        bm["topic"] = classify_topic(url, title, desc, bm.get("context", ""))

        if (i + 1) % 25 == 0:
            print(f"  {i+1}/{total} processed...")

    # Save
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(bookmarks, f, ensure_ascii=False, indent=2)

    # Stats
    topics = {}
    for bm in bookmarks:
        t = bm["topic"]
        topics[t] = topics.get(t, 0) + 1

    print(f"\nDone! {total} bookmarks enriched.\n")
    print("Topics:")
    for topic, count in sorted(topics.items(), key=lambda x: -x[1]):
        print(f"  {topic}: {count}")
    print(f"\nSaved to {OUTPUT}")


if __name__ == "__main__":
    main()
