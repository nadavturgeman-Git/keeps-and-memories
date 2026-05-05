#!/usr/bin/env python3
"""Parse WhatsApp export and extract all links with dates and context."""

import re
import json
from datetime import datetime
from urllib.parse import urlparse

INPUT = "whatsapp-export.txt"
OUTPUT = "bookmarks-raw.json"

# WhatsApp message pattern: date, time - sender: message
MSG_PATTERN = re.compile(
    r'^(\d{1,2}\.\d{1,2}\.\d{4}),\s(\d{1,2}:\d{2})\s-\s([^:]+):\s(.+)',
    re.UNICODE
)
URL_PATTERN = re.compile(r'https?://[^\s<>]+')

def categorize_url(url, context=""):
    """Auto-categorize based on domain and context."""
    domain = urlparse(url).netloc.lower()

    if any(d in domain for d in ['youtube.com', 'youtu.be']):
        return 'video'
    if any(d in domain for d in ['facebook.com', 'fb.com', 'instagram.com', 'twitter.com', 'x.com', 'tiktok.com', 'threads.net']):
        if 'reel' in url.lower() or 'reel' in context.lower():
            return 'video'
        return 'social'
    if any(d in domain for d in ['github.com', 'gitlab.com', 'stackoverflow.com', 'npmjs.com']):
        return 'dev'
    if any(d in domain for d in ['yad2.co.il', 'madlan.co.il']):
        return 'real-estate'
    if any(d in domain for d in ['walla.co.il', 'ynet.co.il', 'haaretz.co.il', 'mako.co.il', 'dailybuzz.co.il', 'calcalist.co.il', 'globes.co.il']):
        return 'news'
    if any(d in domain for d in ['spotify.com', 'soundcloud.com', 'apple.com/music']):
        return 'music'
    if any(d in domain for d in ['amazon.com', 'aliexpress.com', 'ebay.com', 'ksp.co.il', 'zap.co.il']):
        return 'shopping'
    if any(d in domain for d in ['linkedin.com']):
        return 'professional'
    if any(d in domain for d in ['medium.com', 'substack.com', 'dev.to']):
        return 'article'
    if any(d in domain for d in ['docs.google.com', 'drive.google.com', 'sheets.google.com']):
        return 'google-docs'
    if 'samsungcloud' in domain or 'quickshare' in domain:
        return 'file-share'

    # Context-based
    ctx = context.lower()
    if any(w in ctx for w in ['סרטון', 'reels', 'video', 'צפה']):
        return 'video'
    if any(w in ctx for w in ['פוסט', 'post', 'שיתף']):
        return 'social'
    if any(w in ctx for w in ['כתבה', 'מאמר', 'article']):
        return 'article'

    return 'other'

def parse_export(filepath):
    bookmarks = []
    current_date = None
    current_time = None
    current_context = ""

    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue

        msg_match = MSG_PATTERN.match(line)
        if msg_match:
            current_date = msg_match.group(1)
            current_time = msg_match.group(2)
            text = msg_match.group(4)
            current_context = text
        else:
            # Continuation line
            text = line
            current_context += " " + text

        # Find URLs
        urls = URL_PATTERN.findall(text)
        for url in urls:
            # Clean trailing punctuation
            url = url.rstrip('.,;:!?)>')

            # Build context from surrounding lines
            context_lines = []
            for j in range(max(0, i-1), min(len(lines), i+3)):
                context_lines.append(lines[j].strip())
            full_context = " ".join(context_lines)

            # Parse date
            date_str = current_date or ""
            try:
                dt = datetime.strptime(date_str, "%d.%m.%Y")
                iso_date = dt.strftime("%Y-%m-%d")
            except:
                iso_date = date_str

            bookmark = {
                "url": url,
                "domain": urlparse(url).netloc,
                "category": categorize_url(url, full_context),
                "date_shared": iso_date,
                "time_shared": current_time or "",
                "context": current_context.strip()[:200],
            }

            # Avoid duplicates
            if not any(b["url"] == url for b in bookmarks):
                bookmarks.append(bookmark)

    return bookmarks

if __name__ == "__main__":
    bookmarks = parse_export(INPUT)

    # Sort by date
    bookmarks.sort(key=lambda x: x.get("date_shared", ""))

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(bookmarks, f, ensure_ascii=False, indent=2)

    # Stats
    categories = {}
    for b in bookmarks:
        cat = b["category"]
        categories[cat] = categories.get(cat, 0) + 1

    print(f"\nParsed {len(bookmarks)} unique links")
    print(f"\nCategories:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}")
    print(f"\nSaved to {OUTPUT}")
