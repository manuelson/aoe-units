"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX = 2000;

/**
 * Catch-all for anything the structured forms have no field for. Deliberately just a
 * textarea: the moment this grows a category dropdown it stops catching the unexpected.
 */
export function ReportForm() {
  const t = useTranslations();
  const locale = useLocale();
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 3) {
      setError(t("report.tooShort"));
      return;
    }
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "report",
          message,
          locale,
          // Path only, never the query string: nothing personal should ride along.
          page: typeof window !== "undefined" ? window.location.pathname : null,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("sent");
    } catch {
      setError(t("feedback.error"));
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-border bg-card p-5 text-sm font-medium">
        <Check className="h-4 w-4 text-primary" strokeWidth={2} />
        {t("report.sent")}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <label htmlFor="report-msg" className="mb-1.5 block text-sm font-medium">
          {t("report.label")}
        </label>
        <p className="mb-2 text-xs text-muted-foreground">{t("report.help")}</p>
        <textarea
          id="report-msg"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={MAX}
          rows={7}
          required
          placeholder={t("report.placeholder")}
          className={cn(
            "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm",
            "text-foreground placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        />
        <div className="mt-1.5 flex items-center justify-between">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <span />
          )}
          <span className="font-mono text-[11px] text-muted-foreground">
            {message.length}/{MAX}
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={state === "sending"}
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5",
          "text-sm font-medium text-primary-foreground transition-opacity",
          "hover:opacity-90 active:scale-[0.98] disabled:opacity-60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        {state === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}
        {state === "sending" ? t("feedback.sending") : t("report.submit")}
      </button>
    </form>
  );
}
