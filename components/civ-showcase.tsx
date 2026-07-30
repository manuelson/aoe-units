"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CivBadge } from "@/components/civ-badge";
import type { LineSummary } from "@/lib/queries";
import { cn } from "@/lib/utils";

/** Below this the gesture is a click, so a card still opens on a shaky press. */
const DRAG_THRESHOLD = 6;
/** Per-frame velocity decay after release. Lower stops sooner. */
const FRICTION = 0.94;
/** Below this the glide is over; keeping it running just burns frames. */
const MIN_VELOCITY = 0.1;

/**
 * Full-bleed, drag-to-scroll carousel of civilizations with momentum on release.
 * Each card is a real link to the filtered browse page, so middle-click and
 * "open in new tab" behave normally.
 */
export function CivShowcase({ lines }: { lines: LineSummary[] }) {
  const t = useTranslations();
  const track = useRef<HTMLDivElement>(null);

  // Drag bookkeeping lives in refs: it changes every pointermove and would re-render
  // all 46 cards per frame as state.
  const drag = useRef({ down: false, startX: 0, lastX: 0, startScroll: 0, moved: 0, velocity: 0 });
  const glide = useRef<number | null>(null);

  // Only civs that actually have units, so a card never leads to an empty page.
  const civs = [...new Set(lines.map((l) => l.civ).filter((c): c is string => !!c))].sort(
    (a, b) => a.localeCompare(b)
  );

  const stopGlide = () => {
    if (glide.current !== null) cancelAnimationFrame(glide.current);
    glide.current = null;
  };

  // A pending animation frame after unmount would touch a detached node.
  useEffect(() => stopGlide, []);

  function onPointerDown(e: React.PointerEvent) {
    if (!track.current) return;
    stopGlide();
    drag.current = {
      down: true,
      startX: e.clientX,
      lastX: e.clientX,
      startScroll: track.current.scrollLeft,
      moved: 0,
      velocity: 0,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current.down || !track.current) return;
    const dx = e.clientX - drag.current.startX;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
    if (drag.current.moved <= DRAG_THRESHOLD) return;

    // Capture only once it is clearly a drag, so a plain click still lands on the link.
    track.current.setPointerCapture(e.pointerId);
    drag.current.velocity = drag.current.lastX - e.clientX;
    drag.current.lastX = e.clientX;
    track.current.scrollLeft = drag.current.startScroll - dx;
  }

  function endDrag(e: React.PointerEvent) {
    if (track.current?.hasPointerCapture(e.pointerId)) {
      track.current.releasePointerCapture(e.pointerId);
    }
    if (!drag.current.down) return;
    drag.current.down = false;

    let v = drag.current.velocity;
    const step = () => {
      const el = track.current;
      if (!el || Math.abs(v) < MIN_VELOCITY) return stopGlide();
      el.scrollLeft += v;
      v *= FRICTION;
      glide.current = requestAnimationFrame(step);
    };
    if (Math.abs(v) >= MIN_VELOCITY) glide.current = requestAnimationFrame(step);
  }

  return (
    <section className="py-14">
      <div className="mx-auto mb-8 max-w-6xl px-4">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("civs.title")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("civs.sub")}</p>
      </div>

      <div
        ref={track}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          // Full bleed, with the first card lined up under the heading.
          "flex gap-8 overflow-x-auto overscroll-x-contain px-4 pb-4 sm:gap-10",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "cursor-grab active:cursor-grabbing",
          // Fades the strip into the page edges so it reads as continuing, not cut off.
          "[mask-image:linear-gradient(to_right,transparent,black_3rem,black_calc(100%-3rem),transparent)]"
        )}
      >
        {civs.map((civ) => (
          <Link
            key={civ}
            href={`/units?civ=${encodeURIComponent(civ)}`}
            // A drag that happens to end over a card must not navigate.
            onClick={(e) => {
              if (drag.current.moved > DRAG_THRESHOLD) e.preventDefault();
            }}
            draggable={false}
            className={cn(
              "group flex w-28 shrink-0 flex-col items-center gap-3 rounded-lg py-2 sm:w-36",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <CivBadge
              civ={civ}
              size={112}
              className={cn(
                "pointer-events-none h-20 w-20 select-none transition-transform sm:h-28 sm:w-28",
                "group-hover:scale-105"
              )}
            />
            <span className="w-full truncate text-center text-sm font-medium sm:text-base">
              {civ}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
