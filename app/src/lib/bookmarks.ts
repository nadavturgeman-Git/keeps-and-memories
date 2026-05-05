import data from "@/data/bookmarks.json";

export interface Bookmark {
  url: string;
  domain: string;
  category: string;
  date_shared: string;
  time_shared: string;
  context: string;
  title: string | null;
  description: string | null;
  topic: string;
  thumbnail: string | null;
  tags: string[];
}

export const bookmarks: Bookmark[] = data as Bookmark[];

export function getTopics(): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const bm of bookmarks) {
    map.set(bm.topic, (map.get(bm.topic) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getAllTags(): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const bm of bookmarks) {
    for (const tag of bm.tags || []) {
      map.set(tag, (map.get(tag) || 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getBookmarksByTopic(topic: string): Bookmark[] {
  return bookmarks
    .filter((bm) => bm.topic === topic)
    .sort((a, b) => b.date_shared.localeCompare(a.date_shared));
}

export function searchBookmarks(query: string): Bookmark[] {
  const q = query.toLowerCase();
  return bookmarks.filter(
    (bm) =>
      bm.title?.toLowerCase().includes(q) ||
      bm.description?.toLowerCase().includes(q) ||
      bm.url.toLowerCase().includes(q) ||
      bm.context.toLowerCase().includes(q) ||
      bm.domain.toLowerCase().includes(q) ||
      bm.tags?.some((t) => t.toLowerCase().includes(q))
  );
}

export function updateBookmarkTopic(url: string, newTopic: string): Bookmark[] {
  return bookmarks.map((bm) =>
    bm.url === url ? { ...bm, topic: newTopic } : bm
  );
}
