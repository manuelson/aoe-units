"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { px: 40, cls: "h-10 w-10 text-[11px]" },
  md: { px: 56, cls: "h-14 w-14 text-sm" },
  lg: { px: 88, cls: "h-22 w-22 text-lg" },
  xl: { px: 128, cls: "h-32 w-32 text-2xl" },
} as const;

/** First letter of each word: "Hand Cannoneer" -> "HC". */
function monogram(name: string) {
  return name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/**
 * Unit portrait. 21 of the 209 units have no PNG in public/units (3 were deleted, the
 * rest never shipped), so a missing image falls back to a monogram rather than a
 * broken image or the overflowing full-name fallback the old AvatarUi rendered.
 */
export function Portrait({
  id,
  name,
  size = "md",
  className,
  priority,
  alt = "",
}: {
  id: string;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
  priority?: boolean;
  /** Defaults to empty: in lists and grids the unit name is already next to the image.
   *  Pass real text where the portrait is the page's subject, e.g. a unit page header. */
  alt?: string;
}) {
  const [broken, setBroken] = useState(false);
  const { px, cls } = SIZES[size];

  return (
    <span
      className={cn(
        "portrait-plate relative inline-flex shrink-0 items-center justify-center",
        "overflow-hidden rounded-lg ring-1 ring-border",
        cls,
        className
      )}
    >
      {broken ? (
        <span className="font-mono font-semibold tracking-tight text-primary" aria-hidden>
          {monogram(name)}
        </span>
      ) : (
        <Image
          src={`/units/${id}.png`}
          alt={alt}
          width={px}
          height={px}
          priority={priority}
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      )}
    </span>
  );
}
