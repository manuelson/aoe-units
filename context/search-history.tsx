"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type RecentUnit = { id: string; name: string; avatar: string };

const KEY = "aoeunits:recent";
const MAX = 8;

type Ctx = {
  history: RecentUnit[];
  addToHistory: (unit: RecentUnit) => void;
  clearHistory: () => void;
  /** False until localStorage has been read, so the UI can avoid a hydration flash. */
  ready: boolean;
};

const SearchHistoryContext = createContext<Ctx | undefined>(undefined);

export function SearchHistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<RecentUnit[]>([]);
  const [ready, setReady] = useState(false);

  // Read after mount: localStorage does not exist during SSR, and reading it in the
  // initial state would desync server and client markup.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Same reason as theme-provider: localStorage is client-only, so this is a
          // one-shot read after mount. Reading it during render would desync the
          // server and client HTML.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setHistory(
            parsed
              .filter(
                (u): u is RecentUnit =>
                  !!u && typeof u.id === "string" && typeof u.name === "string"
              )
              .slice(0, MAX)
          );
        }
      }
    } catch {
      // Corrupt or blocked storage is not worth breaking the page over.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(history));
    } catch {
      // Private mode / quota. Recents just stay in memory.
    }
  }, [history, ready]);

  const addToHistory = (unit: RecentUnit) =>
    setHistory((prev) => [unit, ...prev.filter((u) => u.id !== unit.id)].slice(0, MAX));

  const clearHistory = () => setHistory([]);

  return (
    <SearchHistoryContext.Provider value={{ history, addToHistory, clearHistory, ready }}>
      {children}
    </SearchHistoryContext.Provider>
  );
}

export function useSearchHistory() {
  const ctx = useContext(SearchHistoryContext);
  if (!ctx) throw new Error("useSearchHistory must be used within a SearchHistoryProvider");
  return ctx;
}
