"use client";

import { useState, useMemo, useCallback } from "react";
import {
  bookmarks as initialBookmarks,
  getAllTags,
  type Bookmark,
} from "@/lib/bookmarks";

const TOPIC_COLORS: Record<string, { bar: string; badge: string; text: string }> = {
  "AI וטכנולוגיה": { bar: "bg-blue-500", badge: "bg-blue-500/10 dark:bg-blue-500/20", text: "text-blue-700 dark:text-blue-300" },
  "בידור וצחוקים": { bar: "bg-amber-500", badge: "bg-amber-500/10 dark:bg-amber-500/20", text: "text-amber-700 dark:text-amber-300" },
  "מוזיקה": { bar: "bg-purple-500", badge: "bg-purple-500/10 dark:bg-purple-500/20", text: "text-purple-700 dark:text-purple-300" },
  "עסקים וכלכלה": { bar: "bg-green-600", badge: "bg-green-600/10 dark:bg-green-600/20", text: "text-green-700 dark:text-green-300" },
  "עיצוב ויצירתיות": { bar: "bg-pink-500", badge: "bg-pink-500/10 dark:bg-pink-500/20", text: "text-pink-700 dark:text-pink-300" },
  "בריאות וכושר": { bar: "bg-emerald-500", badge: "bg-emerald-500/10 dark:bg-emerald-500/20", text: "text-emerald-700 dark:text-emerald-300" },
  "נדל\"ן": { bar: "bg-orange-500", badge: "bg-orange-500/10 dark:bg-orange-500/20", text: "text-orange-700 dark:text-orange-300" },
  "אוכל ובישול": { bar: "bg-red-500", badge: "bg-red-500/10 dark:bg-red-500/20", text: "text-red-700 dark:text-red-300" },
  "חדשות": { bar: "bg-slate-500", badge: "bg-slate-500/10 dark:bg-slate-500/20", text: "text-slate-700 dark:text-slate-300" },
  "לימודים": { bar: "bg-cyan-500", badge: "bg-cyan-500/10 dark:bg-cyan-500/20", text: "text-cyan-700 dark:text-cyan-300" },
  "טיולים": { bar: "bg-teal-500", badge: "bg-teal-500/10 dark:bg-teal-500/20", text: "text-teal-700 dark:text-teal-300" },
  "תכנות": { bar: "bg-indigo-500", badge: "bg-indigo-500/10 dark:bg-indigo-500/20", text: "text-indigo-700 dark:text-indigo-300" },
  "גאדג'טים ומוצרים": { bar: "bg-violet-500", badge: "bg-violet-500/10 dark:bg-violet-500/20", text: "text-violet-700 dark:text-violet-300" },
  "DIY ויצירה": { bar: "bg-rose-500", badge: "bg-rose-500/10 dark:bg-rose-500/20", text: "text-rose-700 dark:text-rose-300" },
  "הורות ומשפחה": { bar: "bg-sky-500", badge: "bg-sky-500/10 dark:bg-sky-500/20", text: "text-sky-700 dark:text-sky-300" },
  "קריירה": { bar: "bg-lime-600", badge: "bg-lime-600/10 dark:bg-lime-600/20", text: "text-lime-700 dark:text-lime-300" },
  "מבצעים וקניות": { bar: "bg-fuchsia-500", badge: "bg-fuchsia-500/10 dark:bg-fuchsia-500/20", text: "text-fuchsia-700 dark:text-fuchsia-300" },
  "רכב": { bar: "bg-stone-500", badge: "bg-stone-500/10 dark:bg-stone-500/20", text: "text-stone-700 dark:text-stone-300" },
  "מדע": { bar: "bg-cyan-600", badge: "bg-cyan-600/10 dark:bg-cyan-600/20", text: "text-cyan-700 dark:text-cyan-300" },
  "השראה ומוטיבציה": { bar: "bg-yellow-500", badge: "bg-yellow-500/10 dark:bg-yellow-500/20", text: "text-yellow-700 dark:text-yellow-300" },
  "גיימינג": { bar: "bg-red-600", badge: "bg-red-600/10 dark:bg-red-600/20", text: "text-red-700 dark:text-red-300" },
};

const DEFAULT_COLOR = { bar: "bg-zinc-400", badge: "bg-zinc-400/10 dark:bg-zinc-400/20", text: "text-zinc-600 dark:text-zinc-400" };

const CATEGORY_ICONS: Record<string, string> = {
  video: "▶",
  social: "💬",
  news: "📰",
  article: "📄",
  tool: "🔧",
  "file-share": "📎",
  "real-estate": "🏠",
  music: "🎵",
  app: "📱",
  podcast: "🎙",
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "היום";
  if (diffDays === 1) return "אתמול";
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  if (diffDays < 30) return `לפני ${Math.floor(diffDays / 7)} שבועות`;

  return d.toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" });
}

function BookmarkRow({
  bookmark,
  onTagClick,
}: {
  bookmark: Bookmark;
  onTagClick: (tag: string) => void;
}) {
  const colors = TOPIC_COLORS[bookmark.topic] || DEFAULT_COLOR;
  const displayTitle = bookmark.title || bookmark.context?.slice(0, 100) || bookmark.url;
  const catIcon = CATEGORY_ICONS[bookmark.category] || "🔗";
  const cleanDomain = bookmark.domain.replace("www.", "");

  return (
    <div className="group relative flex items-stretch transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
      <div className={`w-1 shrink-0 rounded-full ${colors.bar}`} />

      <div className="flex-1 min-w-0 py-2.5 sm:py-3 px-3 sm:px-4 overflow-hidden">
        <div className="flex items-start gap-2 sm:gap-3">
          <span className="mt-0.5 text-sm sm:text-base shrink-0" title={bookmark.category}>{catIcon}</span>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-1.5 sm:gap-2">
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2 sm:line-clamp-1 min-w-0 flex-1"
              >
                {displayTitle}
              </a>
              <span className={`shrink-0 rounded-full px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium whitespace-nowrap ${colors.badge} ${colors.text}`}>
                {bookmark.topic}
              </span>
            </div>

            {bookmark.description && (
              <p className="mt-0.5 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-500 line-clamp-1">
                {bookmark.description}
              </p>
            )}

            <div className="mt-1 sm:mt-1.5 flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-600 truncate max-w-[100px] sm:max-w-none">{cleanDomain}</span>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <span className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-600">{formatDate(bookmark.date_shared)}</span>

              {bookmark.tags?.length > 0 && (
                <>
                  <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">·</span>
                  {bookmark.tags.slice(0, 3).map((tag, idx) => (
                    <button
                      key={tag}
                      onClick={() => onTagClick(tag)}
                      className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] sm:text-[10px] text-zinc-500 hover:bg-indigo-100 hover:text-indigo-600 dark:bg-zinc-800 dark:text-zinc-500 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [allBookmarks, setAllBookmarks] = useState(initialBookmarks);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(true);
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  const topics = useMemo(() => {
    const map = new Map<string, number>();
    for (const bm of allBookmarks) {
      map.set(bm.topic, (map.get(bm.topic) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [allBookmarks]);

  const tags = useMemo(() => getAllTags(), []);

  const filtered = useMemo(() => {
    let results = allBookmarks;

    if (search.length >= 2) {
      const q = search.toLowerCase();
      results = results.filter(
        (bm) =>
          bm.title?.toLowerCase().includes(q) ||
          bm.description?.toLowerCase().includes(q) ||
          bm.url.toLowerCase().includes(q) ||
          bm.context.toLowerCase().includes(q) ||
          bm.domain.toLowerCase().includes(q) ||
          bm.topic.toLowerCase().includes(q) ||
          bm.tags?.some((t) => t.toLowerCase().includes(q))
      );
    } else if (activeTopic) {
      results = results.filter((bm) => bm.topic === activeTopic);
    }

    if (activeTag) {
      results = results.filter((bm) => bm.tags?.includes(activeTag));
    }

    return [...results].sort((a, b) =>
      sortNewestFirst
        ? b.date_shared.localeCompare(a.date_shared)
        : a.date_shared.localeCompare(b.date_shared)
    );
  }, [allBookmarks, activeTopic, activeTag, search, sortNewestFirst]);

  const handleTagClick = useCallback((tag: string) => {
    setActiveTag((prev) => (prev === tag ? null : tag));
    setSearch("");
  }, []);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen overflow-x-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors" dir="rtl">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80">
          <div className="mx-auto max-w-5xl px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-xs sm:text-sm">
                  K
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold">Keeps & Memories</h1>
                  <p className="text-[11px] text-zinc-400">
                    {allBookmarks.length} קישורים · {topics.length} נושאים
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-none justify-end">
                <div className="relative flex-1 sm:flex-none">
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="חיפוש..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      if (e.target.value.length >= 2) {
                        setActiveTopic(null);
                        setActiveTag(null);
                      }
                    }}
                    className="w-full sm:w-64 rounded-lg border border-zinc-200 bg-zinc-50 pr-9 pl-3 py-1.5 sm:py-2 text-sm placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder-zinc-600"
                  />
                </div>
                <button
                  onClick={() => setSortNewestFirst((v) => !v)}
                  className="flex shrink-0 items-center rounded-lg border border-zinc-200 bg-zinc-50 p-1.5 sm:px-2.5 sm:py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  title={sortNewestFirst ? "חדש → ישן" : "ישן → חדש"}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {sortNewestFirst ? (
                      <><path d="M12 5v14"/><path d="M5 12l7 7 7-7"/></>
                    ) : (
                      <><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></>
                    )}
                  </svg>
                </button>
                <button
                  onClick={() => setDark((d) => !d)}
                  className="shrink-0 rounded-lg p-1.5 sm:p-2 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                >
                  {dark ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-5xl flex">
          {/* Sidebar */}
          <aside className="sticky top-[73px] hidden h-[calc(100vh-73px)] w-52 shrink-0 overflow-y-auto border-l border-zinc-100 p-3 dark:border-zinc-800/50 md:block">
            <p className="mb-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">נושאים</p>
            <button
              onClick={() => { setActiveTopic(null); setSearch(""); setActiveTag(null); }}
              className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-colors ${
                !activeTopic && search.length < 2
                  ? "bg-indigo-50 text-indigo-700 font-medium dark:bg-indigo-950 dark:text-indigo-300"
                  : "text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              <span>הכל</span>
              <span className="text-[11px] text-zinc-400">{allBookmarks.length}</span>
            </button>
            {topics
              .filter((t) => t.name !== "Dead Link")
              .map((topic) => {
                const colors = TOPIC_COLORS[topic.name] || DEFAULT_COLOR;
                return (
                  <button
                    key={topic.name}
                    onClick={() => { setActiveTopic(topic.name); setSearch(""); }}
                    className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      activeTopic === topic.name
                        ? "bg-indigo-50 text-indigo-700 font-medium dark:bg-indigo-950 dark:text-indigo-300"
                        : "text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full shrink-0 ${colors.bar}`} />
                    <span className="truncate flex-1 text-right">{topic.name}</span>
                    <span className="text-[11px] text-zinc-400">{topic.count}</span>
                  </button>
                );
              })}

            <p className="mt-5 mb-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">תגיות</p>
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 25).map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => handleTagClick(tag.name)}
                  className={`rounded-md px-2 py-0.5 text-[10px] transition-colors ${
                    activeTag === tag.name
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-700"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Mobile filters */}
            <div className="flex gap-2 overflow-x-auto p-3 pb-1 md:hidden">
              <button
                onClick={() => { setActiveTopic(null); setSearch(""); }}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  !activeTopic ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                הכל
              </button>
              {topics.filter((t) => t.name !== "Dead Link").map((t) => {
                const colors = TOPIC_COLORS[t.name] || DEFAULT_COLOR;
                return (
                  <button
                    key={t.name}
                    onClick={() => { setActiveTopic(t.name); setSearch(""); }}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap flex items-center gap-1.5 ${
                      activeTopic === t.name
                        ? "bg-indigo-600 text-white"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${colors.bar}`} />
                    {t.name}
                  </button>
                );
              })}
            </div>

            {/* Active filters bar */}
            {(search.length >= 2 || activeTag) && (
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-500 border-b border-zinc-100 dark:border-zinc-800/50">
                <span>{filtered.length} תוצאות</span>
                {activeTag && (
                  <button onClick={() => setActiveTag(null)} className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                    {activeTag} ×
                  </button>
                )}
                {search.length >= 2 && (
                  <button onClick={() => setSearch("")} className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                    "{search}" ×
                  </button>
                )}
              </div>
            )}

            {/* List */}
            {filtered.length === 0 ? (
              <div className="py-20 text-center text-zinc-400">
                <p className="text-lg">לא נמצאו קישורים</p>
                <p className="text-sm mt-1">נסו חיפוש אחר או נושא אחר</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {filtered.map((bm, i) => (
                  <BookmarkRow
                    key={`${bm.url}-${i}`}
                    bookmark={bm}
                    onTagClick={handleTagClick}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
