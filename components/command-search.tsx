"use client";

import { Command } from "cmdk";
import { Search, CornerDownLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { rank } from "@/lib/search/rank";
import { useSearchHistory } from "@/context/search-history";
import { Portrait } from "@/components/portrait";
import { CivBadge } from "@/components/civ-badge";
import type { LineSummary } from "@/lib/queries";
import { cn } from "@/lib/utils";

/**
 * Search over the whole catalog. cmdk supplies the combobox roles, arrow-key
 * navigation and Enter/Escape handling that the old hand-rolled dropdown lacked.
 */
export function CommandSearch({
  lines,
  variant = "inline",
  /** Replaces the trigger's placeholder, e.g. the unit you are currently reading.
   *  The dialog's own input keeps the generic prompt: that one is empty and typed into. */
  label,
}: {
  lines: LineSummary[];
  variant?: "inline" | "compact";
  label?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const { addToHistory } = useSearchHistory();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Cmd/Ctrl+K from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Our own ranking beats cmdk's built-in scorer here: it has to match any tier of a
  // line, not just the label we render.
  const results = useMemo(() => rank(query, lines).slice(0, 60), [query, lines]);
  const generic = results.filter((l) => !l.isUnique);
  const unique = results.filter((l) => l.isUnique);

  function go(line: LineSummary) {
    addToHistory({ id: line.id, name: line.name, avatar: line.id });
    setOpen(false);
    setQuery("");
    router.push(`/unit/${line.id.toLowerCase()}`);
  }

  const Row = ({ line }: { line: LineSummary }) => (
    <Command.Item
      key={line.id}
      value={line.id}
      onSelect={() => go(line)}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5",
        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
      )}
    >
      <Portrait id={line.id} name={line.name} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          {line.civ && <CivBadge civ={line.civ} size={14} />}
          <span className="truncate font-medium">{line.name}</span>
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {line.units.length > 1
            ? line.units.map((u) => u.name).join(" · ")
            : (line.civ ?? t(`class.${line.unitClass}`))}
        </span>
      </span>
      <span className="shrink-0 font-mono text-xs text-muted-foreground">
        {line.counterCount}
      </span>
    </Command.Item>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group flex items-center gap-3 rounded-xl border border-border bg-card",
          "text-left text-muted-foreground transition-colors hover:border-primary/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.995]",
          variant === "inline"
            ? "w-full px-4 py-4 text-base sm:text-lg"
            : // A full input plus the logo plus both toggles does not fit a phone bar, so
              // the compact trigger collapses to its icon and expands from sm up.
              "h-9 w-9 justify-center px-0 text-sm sm:w-full sm:justify-start sm:px-3"
        )}
      >
        <Search
          className={variant === "inline" ? "h-5 w-5" : "h-4 w-4 shrink-0"}
          strokeWidth={1.75}
        />
        <span
          className={cn(
            "flex-1 truncate",
            variant === "compact" && "hidden sm:block",
            label && "text-foreground"
          )}
        >
          {label ?? t("searchPlaceholder")}
        </span>
        <kbd
          className={cn(
            "hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5",
            "font-mono text-[11px] text-muted-foreground sm:block"
          )}
        >
          ⌘K
        </kbd>
      </button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label={t("searchPlaceholder")}
        shouldFilter={false}
        className={cn(
          "fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2",
          "overflow-hidden rounded-xl border border-border bg-popover shadow-2xl",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        )}
        overlayClassName="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder={t("searchPlaceholder")}
            className="h-12 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
        </div>

        <Command.List className="max-h-[55vh] overflow-y-auto overscroll-contain p-2">
          <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
            {t("search.empty", { query })}
          </Command.Empty>

          {generic.length > 0 && (
            <Command.Group
              heading={t("search.generic")}
              className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
            >
              {generic.map((line) => (
                <Row key={line.id} line={line} />
              ))}
            </Command.Group>
          )}

          {unique.length > 0 && (
            <Command.Group
              heading={t("search.unique")}
              className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
            >
              {unique.map((line) => (
                <Row key={line.id} line={line} />
              ))}
            </Command.Group>
          )}
        </Command.List>

        <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" strokeWidth={1.75} />
            {t("search.hintOpen")}
          </span>
          <span className="hidden sm:inline">↑↓ {t("search.hintMove")}</span>
          <span className="ml-auto font-mono">{results.length}</span>
        </div>
      </Command.Dialog>
    </>
  );
}
