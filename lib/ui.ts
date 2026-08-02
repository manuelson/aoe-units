import { cn } from "@/lib/utils";

/**
 * The one text-input look. It was copy-pasted into three forms before this existed, which
 * is how the admin sign-in ended up a shade different from every other field on the site.
 */
export const inputClass = cn(
  "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground",
  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
);
