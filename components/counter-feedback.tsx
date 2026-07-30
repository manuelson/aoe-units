"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ThumbsUp, ThumbsDown, Check, Loader2, Trash2 } from "lucide-react";
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
}: {
  lineId: string;
  lineName: string;
  allLines: LineSummary[];
  listed: LineSummary[];
  baseUnitId?: string;
  baseStats?: Stats | null;
  mode?: "ask" | "suggest";
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
    if (picked.length === 0 && toRemove.length === 0 && !hasStatChanges) {
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

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <AnimatePresence mode="wait" initial={false}>
        {state === "done" ? (
          <motion.p
            key="done"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <Check className="h-4 w-4 text-primary" strokeWidth={2} />
            {message}
          </motion.p>
        ) : state === "suggesting" ? (
          <motion.form
            key="form"
            onSubmit={submitSuggestion}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h3 className="font-medium">{t("feedback.suggestTitle", { name: lineName })}</h3>

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
          </motion.form>
        ) : (
          <motion.div key="ask" initial={false} className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium">{t("feedback.question")}</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={sending}
                onClick={voteYes}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm transition-colors hover:border-primary/60 active:scale-[0.97] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm transition-colors hover:border-primary/60 active:scale-[0.97] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ThumbsDown className="h-3.5 w-3.5" strokeWidth={1.75} />
                {t("feedback.no")}
              </button>
            </div>
            {state === "error" && <p className="w-full text-sm text-destructive">{message}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
