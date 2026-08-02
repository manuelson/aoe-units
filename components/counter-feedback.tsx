"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { ThumbsUp, ThumbsDown, Check, Loader2, Trash2, ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Portrait } from "@/components/portrait";
import { StatsEditor } from "@/components/stats-editor";
import { rank } from "@/lib/search/rank";
import { toFlat, changedOnly, type FlatStats } from "@/lib/stats-fields";
import type { LineSummary, Stats } from "@/lib/queries";
import { cn } from "@/lib/utils";

/**
 * `sending` is deliberately separate from `state`: folding it in made a thumbs-up
 * flash the whole suggestion form on its way to the success message.
 */
type State = "idle" | "suggesting" | "done" | "error";

export function CounterFeedback({
  lineId,
  lineName,
  allLines,
  /** Counters currently shown for this line, offered for removal. */
  listed,
  /** Base unit of the line, so a stat correction targets a concrete unit row. */
  baseUnitId,
  baseStats,
  /** "ask" shows the thumbs first; "suggest" opens straight into the picker. */
  mode = "ask",
  /** Docks the whole thing to the bottom of the viewport as a glass bar. */
  floating = false,
}: {
  lineId: string;
  lineName: string;
  allLines: LineSummary[];
  listed: LineSummary[];
  baseUnitId?: string;
  baseStats?: Stats | null;
  mode?: "ask" | "suggest";
  floating?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const reduce = useReducedMotion();
  const [state, setState] = useState<State>(mode === "suggest" ? "suggesting" : "idle");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [toRemove, setToRemove] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [query, setQuery] = useState("");

  const currentStats: FlatStats = toFlat(baseStats);
  const [stats, setStats] = useState<FlatStats>(currentStats);
  const statDiff = changedOnly(currentStats, stats);
  const hasStatChanges = Object.keys(statDiff).length > 0;

  // Never offer a unit that is already listed, and never the unit itself.
  const listedIds = new Set([...listed.map((l) => l.id), lineId]);
  const options = rank(
    query,
    allLines.filter((l) => !listedIds.has(l.id))
  ).slice(0, 24);

  async function send(payload: Record<string, unknown>) {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineId, locale, ...payload }),
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  }

  async function voteYes() {
    setSending(true);
    try {
      const json = await send({ kind: "vote", accurate: true });
      setMessage(json.duplicate ? t("feedback.alreadyVoted") : t("feedback.thanks"));
      setState("done");
    } catch {
      setMessage(t("feedback.error"));
      setState("error");
    } finally {
      setSending(false);
    }
  }

  async function submitSuggestion(e: React.FormEvent) {
    e.preventDefault();
    const note = comment.trim();
    if (picked.length === 0 && toRemove.length === 0 && !hasStatChanges && note.length < 3) {
      setMessage(t("feedback.pickSomething"));
      return;
    }
    setSending(true);
    setMessage("");
    try {
      // Record the thumbs-down alongside the suggestion so the signal is not lost.
      // Not on /contribute: adding a missing counter is not a vote against the page.
      if (mode === "ask") await send({ kind: "vote", accurate: false }).catch(() => null);
      if (picked.length > 0 || toRemove.length > 0) {
        await send({
          kind: "suggestion",
          counters: picked,
          removeCounters: toRemove,
          comment,
        });
      }
      if (hasStatChanges && baseUnitId) {
        await send({ kind: "stats", unitId: baseUnitId, stats: statDiff, comment });
      }
      // Nothing structured to attach the note to, so it goes in as a site report:
      // "this is wrong but I cannot express it with the checkboxes" is worth keeping.
      if (picked.length === 0 && toRemove.length === 0 && !hasStatChanges) {
        await send({ kind: "report", message: note, page: window.location.pathname });
      }
      setMessage(t("feedback.sent"));
      setState("done");
    } catch {
      setMessage(t("feedback.error"));
      setState("error");
    } finally {
      setSending(false);
    }
  }

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  // Sheet manners: Escape closes, page behind stays put.
  const sheetOpen = floating && mode === "ask" && state === "suggesting";
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setState("idle");
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  // Water wobble: scroll velocity, springed, squashes the bar as it lags behind.
  const { scrollY } = useScroll();
  const wobble = useSpring(useVelocity(scrollY), {
    stiffness: 220,
    damping: 20,
    mass: 0.7,
  });
  const scaleY = useTransform(wobble, [-2500, 0, 2500], [1.07, 1, 0.93], { clamp: true });
  const scaleX = useTransform(wobble, [-2500, 0, 2500], [0.97, 1, 1.03], { clamp: true });
  const y = useTransform(wobble, [-2500, 0, 2500], [10, 0, -10], { clamp: true });

  const doneRow = (
    <p className="flex items-center gap-2 text-sm font-medium text-foreground">
      <Check className="h-4 w-4 text-primary" strokeWidth={2} />
      {message}
    </p>
  );

  const form = (
          <form onSubmit={submitSuggestion} className="space-y-6">
            <div className="flex items-center gap-2">
              {mode === "ask" && (
                <button
                  type="button"
                  onClick={() => setState("idle")}
                  aria-label={t("feedback.back")}
                  className="-ml-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border transition-colors hover:border-primary/60 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
                </button>
              )}
              <h3 className="font-medium">{t("feedback.suggestTitle", { name: lineName })}</h3>
            </div>

            <div className="space-y-3">
              <label htmlFor="fb-search" className="block text-sm text-muted-foreground">
                {t("feedback.suggestLabel")}
              </label>
              <input
                id="fb-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("browse.filterPlaceholder")}
                className={cn(
                  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              />

              <ul className="grid max-h-64 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
                {options.map((line) => {
                  const on = picked.includes(line.id);
                  return (
                    <li key={line.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-lg border p-2 transition-colors",
                          on
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/40"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggle(picked, setPicked, line.id)}
                          className="h-4 w-4 accent-[var(--primary)]"
                        />
                        <Portrait id={line.id} name={line.name} size="sm" />
                        <span className="min-w-0 flex-1 truncate text-sm">{line.name}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>

            {listed.length > 0 && (
              <div className="border-t border-border pt-5">
                <p className="mb-1 text-sm font-medium">{t("feedback.removeTitle")}</p>
                <p className="mb-3 text-xs text-muted-foreground">
                  {t("feedback.removeHelp")}
                </p>
                <ul className="grid max-h-56 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
                  {listed.map((line) => {
                    const on = toRemove.includes(line.id);
                    return (
                      <li key={line.id}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-center gap-2.5 rounded-lg border p-2 transition-colors",
                            on
                              ? "border-destructive bg-destructive/10"
                              : "border-border hover:border-destructive/40"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => toggle(toRemove, setToRemove, line.id)}
                            className="h-4 w-4 accent-[var(--destructive)]"
                          />
                          <Portrait id={line.id} name={line.name} size="sm" />
                          <span
                            className={cn(
                              "min-w-0 flex-1 truncate text-sm",
                              on && "text-muted-foreground line-through"
                            )}
                          >
                            {line.name}
                          </span>
                          {on && (
                            <Trash2
                              className="h-3.5 w-3.5 shrink-0 text-destructive"
                              strokeWidth={1.75}
                            />
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {baseUnitId && (
              <div className="border-t border-border pt-5">
                <p className="mb-1 text-sm font-medium">{t("feedback.statsTitle")}</p>
                <p className="mb-4 text-xs text-muted-foreground">{t("feedback.statsHelp")}</p>
                <StatsEditor current={currentStats} value={stats} onChange={setStats} />
              </div>
            )}

            <div>
              <label
                htmlFor="fb-comment"
                className="mb-1.5 block text-sm text-muted-foreground"
              >
                {t("feedback.commentLabel")}
              </label>
              <textarea
                id="fb-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder={t("feedback.commentPlaceholder")}
                className={cn(
                  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              />
            </div>

            {message && <p className="text-sm text-destructive">{message}</p>}

            <button
              type="submit"
              disabled={sending}
              className={cn(
                "inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5",
                "text-sm font-medium text-primary-foreground transition-opacity",
                "hover:opacity-90 active:scale-[0.98] disabled:opacity-60",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              {sending && <Loader2 className="h-4 w-4 animate-spin" />}
              {sending ? t("feedback.sending") : t("feedback.submit")}
            </button>
          </form>
  );

  const askRow = (
          <div className="flex flex-wrap items-center gap-3">
            <p className={cn("text-sm font-medium", floating && "hidden sm:block")}>
              {t("feedback.question")}
            </p>
            <div className={cn("flex gap-2", floating && "w-full sm:w-auto")}>
              <button
                type="button"
                disabled={sending}
                onClick={voteYes}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm transition-colors hover:border-primary/60 active:scale-[0.97] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  floating && "flex-1 sm:flex-none"
                )}
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ThumbsUp className="h-3.5 w-3.5" strokeWidth={1.75} />
                )}
                {t("feedback.yes")}
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={() => setState("suggesting")}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm transition-colors hover:border-primary/60 active:scale-[0.97] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  floating && "flex-1 sm:flex-none"
                )}
              >
                <ThumbsDown className="h-3.5 w-3.5" strokeWidth={1.75} />
                {t("feedback.no")}
              </button>
            </div>
            {state === "error" && <p className="w-full text-sm text-destructive">{message}</p>}
          </div>
  );

  if (!floating) {
    return (
      <section className="rounded-xl border border-border bg-card p-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={state === "done" ? "done" : state === "suggesting" ? "form" : "ask"}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {state === "done" ? doneRow : state === "suggesting" ? form : askRow}
          </motion.div>
        </AnimatePresence>
      </section>
    );
  }

  const open = state === "suggesting";
  const spring = { type: "spring" as const, stiffness: 320, damping: 34 };

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <AnimatePresence>
          {!open && (
            <motion.section
              style={reduce ? undefined : { scaleX, scaleY, y }}
              initial={reduce ? false : { opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 80 }}
              transition={spring}
              className={cn(
                "pointer-events-auto relative mx-auto w-full max-w-3xl overflow-hidden px-3 py-2",
                "rounded-[24px] border border-white/20 bg-background/60 shadow-2xl",
                "backdrop-blur-2xl backdrop-saturate-150"
              )}
            >
              {/* Specular top edge: the bit that sells the glass. */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              {state === "done" ? doneRow : askRow}
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => mode === "ask" && setState("idle")}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <motion.section
              key="sheet"
              initial={reduce ? { opacity: 0 } : { y: "100%" }}
              animate={reduce ? { opacity: 1 } : { y: 0 }}
              exit={reduce ? { opacity: 0 } : { y: "100%" }}
              transition={spring}
              className={cn(
                "fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[85vh] w-full max-w-3xl overflow-y-auto",
                "border border-white/20 bg-background/80 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl",
                "backdrop-blur-2xl backdrop-saturate-150",
                "rounded-t-[28px] sm:bottom-4 sm:rounded-[28px]"
              )}
            >
              {form}
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
