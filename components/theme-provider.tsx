"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

export const THEME_KEY = "aoeunits:theme";

/**
 * Runs before first paint to set the class, so there is no light flash on a dark page.
 * Rendered by the server layout, never by a Client Component: React 19 refuses to
 * execute inline <script> during a client render and warns about it, which is exactly
 * what next-themes ran into here.
 */
export const themeScript = `(function(){try{
var s=localStorage.getItem(${JSON.stringify(THEME_KEY)});
var d=s==='dark'||(s!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.classList.toggle('dark',d);
document.documentElement.style.colorScheme=d?'dark':'light';
}catch(e){}})();`;

type Ctx = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<Ctx | undefined>(undefined);

const systemDark = () =>
  typeof window !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches;

function apply(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && systemDark());
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  return dark;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start at "system" on both server and client so the first client render matches the
  // server HTML. The real value is read from storage after mount; the inline script has
  // already put the correct class on <html> by then, so nothing visibly changes.
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolved] = useState<"light" | "dark">("dark");

  useEffect(() => {
    let stored: Theme = "system";
    try {
      const raw = localStorage.getItem(THEME_KEY);
      if (raw === "light" || raw === "dark" || raw === "system") stored = raw;
    } catch {
      // Storage blocked. Fall back to following the system.
    }
    // localStorage does not exist during SSR, so the stored theme can only be read
    // after mount. The inline script has already applied the class, so this sets no
    // visible pixels; it only syncs React state for the toggle. Runs once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(stored);
    setResolved(apply(stored) ? "dark" : "light");
  }, []);

  // Only follow the OS while the user has not pinned a theme.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(apply("system") ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    setResolved(apply(next) ? "dark" : "light");
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage blocked. The choice still applies for this page view.
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
