#!/usr/bin/env python3
"""Merge enriched + classified bookmarks into final dataset."""
import json

with open("bookmarks-enriched.json", "r", encoding="utf-8") as f:
    enriched = json.load(f)

with open("classified.json", "r", encoding="utf-8") as f:
    classified = json.load(f)

# Build lookup from classified
classified_map = {b["url"]: b.get("topic", "Uncategorized") for b in classified}

# Merge
for bm in enriched:
    if bm["topic"] == "Uncategorized" and bm["url"] in classified_map:
        bm["topic"] = classified_map[bm["url"]]

with open("bookmarks-final.json", "w", encoding="utf-8") as f:
    json.dump(enriched, f, ensure_ascii=False, indent=2)

topics = {}
for bm in enriched:
    t = bm["topic"]
    topics[t] = topics.get(t, 0) + 1

print(f"Total: {len(enriched)}")
for t, c in sorted(topics.items(), key=lambda x: -x[1]):
    print(f"  {t}: {c}")
