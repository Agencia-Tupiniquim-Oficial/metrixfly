import { supabase } from "@/integrations/supabase/client";

/**
 * Keeps the GEO/AEO crawl of the site being diagnosed, so that opening the
 * GEO/AEO page does not crawl the same site again. The diagnostic starts the
 * crawl in parallel; the GEO/AEO page reads it (or waits for it) by address.
 * The latest finished crawl is also kept in sessionStorage, like the saved
 * diagnostic, so a page reload does not lose it.
 */
type Entry = { promise: Promise<unknown>; result?: unknown };

const STORAGE_KEY = "geo-crawl:v1";
const entries = new Map<string, Entry>();
let lastKey: string | null = null;
let hydrated = false;

function persist(key: string, result: unknown): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ key, result }));
  } catch (error) {
    console.warn("Unable to save the GEO crawl result.", error);
  }
}

/** Restores the saved crawl once, before the first lookup. */
function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const { key, result } = JSON.parse(saved) as { key?: string; result?: unknown };
    if (typeof key === "string" && result != null && !entries.has(key)) {
      entries.set(key, { promise: Promise.resolve(result), result });
      lastKey ??= key;
    }
  } catch (error) {
    console.warn("Unable to restore the saved GEO crawl result.", error);
  }
}

export function geoCrawlKey(address: string): string {
  const trimmed = address.trim();
  try {
    const parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return parsed.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return trimmed.toLowerCase();
  }
}

function normalizedUrl(address: string): string {
  const trimmed = address.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Starts the crawl once per site; a repeated call returns the same work. */
export function startGeoCrawl(address: string): Promise<unknown> {
  hydrate();
  const key = geoCrawlKey(address);
  const existing = entries.get(key);
  if (existing) return existing.promise;

  const entry: Entry = {
    promise: Promise.resolve().then(async () => {
      const { data, error } = await supabase.functions.invoke("geo-aeo-crawl", {
        body: { url: normalizedUrl(address) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      entry.result = data;
      persist(key, data);
      return data;
    }),
  };
  entries.set(key, entry);
  lastKey = key;
  // A failed crawl is not cached, so the GEO/AEO page can try again.
  entry.promise.catch(() => {
    if (entries.get(key) === entry) entries.delete(key);
  });
  return entry.promise;
}

/** Stores a crawl made on the GEO/AEO page itself. */
export function rememberGeoCrawl(address: string, result: unknown): void {
  hydrate();
  const key = geoCrawlKey(address);
  entries.set(key, { promise: Promise.resolve(result), result });
  lastKey = key;
  persist(key, result);
}

export type GeoCrawlLookup =
  | { status: "none" }
  | { status: "pending"; promise: Promise<unknown> }
  | { status: "done"; result: unknown };

export function lookupGeoCrawl(address: string): GeoCrawlLookup {
  hydrate();
  const entry = entries.get(geoCrawlKey(address));
  if (!entry) return { status: "none" };
  return entry.result !== undefined
    ? { status: "done", result: entry.result }
    : { status: "pending", promise: entry.promise };
}

/** The most recently crawled site, for opening GEO/AEO with no address given. */
export function lastGeoCrawlKey(): string | null {
  hydrate();
  return lastKey;
}

export function resetGeoCrawlCacheForTests(): void {
  entries.clear();
  lastKey = null;
  hydrated = false;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to clear
  }
}
