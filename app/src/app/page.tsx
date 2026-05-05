"use client";

import { useState, useMemo, useCallback } from "react";
import {
  bookmarks as initialBookmarks,
  getTopics,
  getAllTags,
  searchBookmarks,
  type Bookmark,
} from "@/lib/bookmarks";

// ─── Theme Toggle ──────────────────────────────────────
function ThemeToggle({
  dark,
  onToggle,
}: {
  dark: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="rounded-lg p-2 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}

// ─── Bookmark Card ─────────────────────────────────────
function BookmarkCard({
  bookmark,
  onDragStart,
  topics,
  onMoveTo,
  onDelete,
}: {
  bookmark: Bookmark;
  onDragStart: (e: React.DragEvent, bm: Bookmark) => void;
  topics: string[];
  onMoveTo: (url: string, topic: string) => void;
  onDelete: (url: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const displayTitle =
    bookmark.title || bookmark.context?.slice(0, 80) || bookmark.domain;
  const date = bookmark.date_shared
    ? new Date(bookmark.date_shared).toLocaleDateString("he-IL", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, bookmark)}
      className="group relative rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:shadow-lg cursor-grab active:cursor-grabbing overflow-hidden"
    >
      {/* Thumbnail */}
      {bookmark.thumbnail ? (
        <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
          <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
            <img
              src={bookmark.thumbnail}
              alt=""
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </a>
      ) : (
        <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
          <div className="flex aspect-[3/1] w-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
            <span className="text-2xl font-bold text-zinc-300 dark:text-zinc-700 select-none">
              {bookmark.domain.replace("www.", "").split(".")[0].slice(0, 2).toUpperCase()}
            </span>
          </div>
        </a>
      )}

      {/* Content */}
      <div className="p-3">
        <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {displayTitle}
          </h3>
        </a>
        {bookmark.description && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500 line-clamp-2">
            {bookmark.description}
          </p>
        )}

        {/* Tags */}
        {bookmark.tags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {bookmark.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-600">
          <span className="truncate max-w-[120px]">
            {bookmark.domain.replace("www.", "")}
          </span>
          <span>{date}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.preventDefault();
            if (confirm("למחוק את הקישור הזה?")) {
              onDelete(bookmark.url);
            }
          }}
          className="rounded-lg bg-red-600/80 p-1.5 text-white backdrop-blur-sm hover:bg-red-600 transition-colors"
          title="מחיקה"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            setShowMenu(!showMenu);
          }}
          className="rounded-lg bg-black/60 p-1.5 text-white backdrop-blur-sm hover:bg-black/80 transition-colors"
          title="העבר ל..."
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 9l4-4 4 4"/><path d="M9 5v12"/><path d="M19 15l-4 4-4-4"/><path d="M15 19V7"/>
          </svg>
        </button>
        {showMenu && (
          <div className="absolute top-8 left-0 z-50 w-48 rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-800 max-h-64 overflow-y-auto">
            {topics.map((t) => (
              <button
                key={t}
                onClick={() => {
                  onMoveTo(bookmark.url, t);
                  setShowMenu(false);
                }}
                className={`block w-full text-right px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors ${
                  t === bookmark.topic
                    ? "text-indigo-600 font-medium"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────
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

  const handleDragStart = useCallback((e: React.DragEvent, bm: Bookmark) => {
    e.dataTransfer.setData("text/plain", bm.url);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetTopic: string) => {
      e.preventDefault();
      const url = e.dataTransfer.getData("text/plain");
      setAllBookmarks((prev) =>
        prev.map((bm) => (bm.url === url ? { ...bm, topic: targetTopic } : bm))
      );
    },
    []
  );

  const handleMoveTo = useCallback((url: string, topic: string) => {
    setAllBookmarks((prev) =>
      prev.map((bm) => (bm.url === url ? { ...bm, topic: topic } : bm))
    );
  }, []);

  const handleDelete = useCallback((url: string) => {
    setAllBookmarks((prev) => prev.filter((bm) => bm.url !== url));
  }, []);

  const topicNames = useMemo(
    () => topics.filter((t) => t.name !== "Dead Link").map((t) => t.name),
    [topics]
  );

  const toggleTheme = useCallback(() => {
    setDark((d) => !d);
  }, []);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm">
                  K
                </div>
                <div>
                  <h1 className="text-lg font-bold">Keeps & Memories</h1>
                  <p className="text-[11px] text-zinc-400">
                    {allBookmarks.length} קישורים &middot;{" "}
                    {topics.length} נושאים
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="חיפוש לפי שם, תיוג, תוכן..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      if (e.target.value.length >= 2) {
                        setActiveTopic(null);
                        setActiveTag(null);
                      }
                    }}
                    className="w-64 rounded-lg border border-zinc-200 bg-zinc-50 pr-9 pl-3 py-2 text-sm placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder-zinc-600"
                  />
                </div>
                <button
                  onClick={() => setSortNewestFirst((v) => !v)}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  title={sortNewestFirst ? "חדש → ישן" : "ישן → חדש"}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {sortNewestFirst ? (
                      <><path d="M12 5v14"/><path d="M5 12l7 7 7-7"/></>
                    ) : (
                      <><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></>
                    )}
                  </svg>
                  <span className="hidden sm:inline">{sortNewestFirst ? "חדש → ישן" : "ישן → חדש"}</span>
                </button>
                <ThemeToggle dark={dark} onToggle={toggleTheme} />
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl flex">
          {/* Sidebar - Topics */}
          <aside className="sticky top-[73px] hidden h-[calc(100vh-73px)] w-56 shrink-0 overflow-y-auto border-l border-zinc-200 bg-white/50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50 md:block">
            <p className="mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              נושאים
            </p>
            <button
              onClick={() => {
                setActiveTopic(null);
                setSearch("");
                setActiveTag(null);
              }}
              onDragOver={(e) => e.preventDefault()}
              className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                !activeTopic && search.length < 2
                  ? "bg-indigo-50 text-indigo-700 font-medium dark:bg-indigo-950 dark:text-indigo-300"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <span>הכל</span>
              <span className="text-xs text-zinc-400">{allBookmarks.length}</span>
            </button>
            {topics
              .filter((t) => t.name !== "Dead Link")
              .map((topic) => (
                <button
                  key={topic.name}
                  onClick={() => {
                    setActiveTopic(topic.name);
                    setSearch("");
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, topic.name)}
                  className={`mb-0.5 flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    activeTopic === topic.name
                      ? "bg-indigo-50 text-indigo-700 font-medium dark:bg-indigo-950 dark:text-indigo-300"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="truncate">{topic.name}</span>
                  <span className="text-xs text-zinc-400 mr-1">{topic.count}</span>
                </button>
              ))}

            {/* Tags section */}
            <p className="mt-4 mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              תיוגים
            </p>
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 20).map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => {
                    setActiveTag(activeTag === tag.name ? null : tag.name);
                    setSearch("");
                  }}
                  className={`rounded-md px-2 py-0.5 text-[11px] transition-colors ${
                    activeTag === tag.name
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-4">
            {/* Mobile topic pills */}
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2 md:hidden">
              <button
                onClick={() => {
                  setActiveTopic(null);
                  setSearch("");
                }}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
                  !activeTopic
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                הכל
              </button>
              {topics
                .filter((t) => t.name !== "Dead Link")
                .map((t) => (
                  <button
                    key={t.name}
                    onClick={() => {
                      setActiveTopic(t.name);
                      setSearch("");
                    }}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap ${
                      activeTopic === t.name
                        ? "bg-indigo-600 text-white"
                        : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {t.name} ({t.count})
                  </button>
                ))}
            </div>

            {/* Status */}
            {(search.length >= 2 || activeTag) && (
              <div className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
                <span>{filtered.length} תוצאות</span>
                {activeTag && (
                  <button
                    onClick={() => setActiveTag(null)}
                    className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                  >
                    {activeTag} &times;
                  </button>
                )}
                {search.length >= 2 && (
                  <button
                    onClick={() => setSearch("")}
                    className="rounded-md bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                  >
                    &ldquo;{search}&rdquo; &times;
                  </button>
                )}
              </div>
            )}

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="py-20 text-center text-zinc-400">
                <p className="text-lg">לא נמצאו קישורים</p>
                <p className="text-sm mt-1">נסו חיפוש אחר או נושא אחר</p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((bm, i) => (
                  <BookmarkCard
                    key={`${bm.url}-${i}`}
                    bookmark={bm}
                    onDragStart={handleDragStart}
                    topics={topicNames}
                    onMoveTo={handleMoveTo}
                    onDelete={handleDelete}
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
