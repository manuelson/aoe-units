"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useLocale, useTranslations } from "next-intl";
import { useAoeData } from "@/data/useAoeData";
import { useSearchHistory } from "@/context/search-history";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  placeholder?: string;
  suggestions?: string[];
}

export interface Suggestion {
  name: string;
  units: string[];
  avatar: string;
  counters: string[];
  id: string;
}

// Function to normalize text by removing accents
const normalizeText = (text: string): string => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

export function SearchBar({ placeholder = "Search units..." }: SearchBarProps) {
  const locale = useLocale();
  // take only with counters
  const suggestions = useAoeData(locale)
    .filter(
      (suggestion) => suggestion.counters && suggestion.counters.length > 0
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const { addToHistory } = useSearchHistory();

  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const t = useTranslations();
  const router = useRouter();

  const filteredSuggestions = useCallback(() => {
    if (query.length === 0) return suggestions;

    const normalizedQuery = normalizeText(query);

    // First, find exact matches
    const exactMatches = suggestions.filter((suggestion) =>
      suggestion.units.some(
        (unit: string) => normalizeText(unit) === normalizedQuery
      )
    );

    // Then, find partial matches (excluding exact matches)
    const partialMatches = suggestions.filter((suggestion) =>
      suggestion.units.some(
        (unit: string) =>
          normalizeText(unit).includes(normalizedQuery) &&
          normalizeText(unit) !== normalizedQuery
      )
    );

    // remove duplicates
    const uniqueSuggestions = [...exactMatches, ...partialMatches].filter(
      (suggestion, index, self) =>
        index === self.findIndex((t) => t.name === suggestion.name)
    );

    return uniqueSuggestions;
  }, [query, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    router.push(`/unit/${suggestion.id}`);
    addToHistory(suggestion);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
  };

  return (
    <div className="relative flex flex-col w-full" ref={searchBarRef}>
      <div className="flex items-center w-full">
        <Input
          type="search"
          placeholder={placeholder}
          className="h-14 text-lg pl-12 pr-4"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            setShowSuggestions(true);
          }}
        />
        <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
      </div>
      {showSuggestions && filteredSuggestions().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {filteredSuggestions().map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 cursor-pointer flex items-center gap-3 transition-colors duration-150"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <Avatar className="h-10 w-10 ring-2 ring-gray-100 dark:ring-gray-800">
                <AvatarImage
                  src={`/units/${suggestion.avatar}.png`}
                  alt={suggestion.name}
                  className="bg-black"
                />
                <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {suggestion.name}
                </AvatarFallback>
              </Avatar>
              <ul className="text-left">
                <li className="text-md text-gray-900 dark:text-gray-100">
                  {suggestion.units.length > 1
                    ? suggestion.name + " (" + t("line") + ")"
                    : suggestion.name}
                </li>
                <li className="text-sm text-gray-500 dark:text-gray-400">
                  {suggestion.units.join(", ")}
                </li>
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
