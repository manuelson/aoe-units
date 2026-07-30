"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Two shields in public/civilizations/de are named in the singular, so a plain
 * lowercase of the civ id would 404 on them.
 */
const FILENAME_OVERRIDES: Record<string, string> = {
  Berbers: "berber",
  Incas: "inca",
};

export function civIconSrc(civ: string) {
  return `/civilizations/de/${FILENAME_OVERRIDES[civ] ?? civ.toLowerCase()}.png`;
}

/**
 * Civilization shield beside the civ name. Falls back to the generic shield rather
 * than a gap, so a civ added later never renders as a broken image.
 */
export function CivBadge({
  civ,
  size = 20,
  className,
}: {
  civ: string;
  size?: number;
  className?: string;
}) {
  const [src, setSrc] = useState(civIconSrc(civ));

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      onError={() => setSrc("/civilizations/generic.png")}
      className={cn("shrink-0 object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
