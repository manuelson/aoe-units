"use client";

import { Suggestion } from "@/components/search-bar";
import { createContext, useContext, useState, ReactNode } from "react";

interface SearchHistoryContextType {
  history: Suggestion[];
  addToHistory: (query: Suggestion) => void;
  clearHistory: () => void;
}

const SearchHistoryContext = createContext<
  SearchHistoryContextType | undefined
>(undefined);

export function SearchHistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<string[]>([]);

  const addToHistory = (query: string) => {
    setHistory((prev) => {
      // Remove if already exists to avoid duplicates
      const filtered = prev.filter((item) => item.name !== query.name);
      // Add to the beginning of the array
      return [query, ...filtered].slice(0, 10); // Keep only last 10 searches
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <SearchHistoryContext.Provider
      value={{ history, addToHistory, clearHistory }}
    >
      {children}
    </SearchHistoryContext.Provider>
  );
}

export function useSearchHistory() {
  const context = useContext(SearchHistoryContext);
  if (context === undefined) {
    throw new Error(
      "useSearchHistory must be used within a SearchHistoryProvider"
    );
  }
  return context;
}
