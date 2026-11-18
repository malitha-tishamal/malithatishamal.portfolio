"use client";

import React, { useEffect, useState } from "react";
import { formatRelativeTime, type DateLike } from "@/utils/relativeTime";

/**
 * The one pill used by every card section.
 *
 * The blue variant marks the six newest cards ("Latest · 3 days ago"); every
 * other card gets the quiet grey-blue variant ("3 weeks ago"). The label is
 * server-rendered and then refreshed once a minute from a single shared timer,
 * so it updates itself without one interval per card.
 */

export type RelativeVerb = "updated" | "issued" | "published";

interface RelativeTimePillProps {
  date: DateLike;
  latest?: boolean;
  /** Noun used in the aria label: "Updated 5 days ago". */
  verb?: RelativeVerb;
  /** Positioning classes from the card (`absolute top-2.5 right-2.5`, …). */
  className?: string;
}

const TICK_MS = 60_000;

const listeners = new Set<(now: Date) => void>();
let ticker: ReturnType<typeof setInterval> | undefined;

function subscribe(listener: (now: Date) => void): () => void {
  listeners.add(listener);
  if (ticker === undefined) {
    ticker = setInterval(() => {
      const now = new Date();
      listeners.forEach((notify) => notify(now));
    }, TICK_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && ticker !== undefined) {
      clearInterval(ticker);
      ticker = undefined;
    }
  };
}

const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const LATEST_CLASSES =
  "bg-[#2563EB] text-white shadow-md ring-black/10 dark:ring-white/15";
const QUIET_CLASSES =
  "bg-slate-100/95 text-slate-700 shadow-sm ring-slate-900/10 dark:bg-slate-800/90 dark:text-slate-100 dark:ring-white/10";

export const RelativeTimePill: React.FC<RelativeTimePillProps> = ({
  date,
  latest = false,
  verb = "updated",
  className = "",
}) => {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    setNow(new Date());
    return subscribe(setNow);
  }, []);

  const label = formatRelativeTime(date, now);
  if (!label) return null;

  return (
    <span
      suppressHydrationWarning
      aria-label={latest ? `Latest, ${verb} ${label}` : `${capitalise(verb)} ${label}`}
      className={`z-20 max-w-[60%] truncate rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ring-1 ${
        latest ? LATEST_CLASSES : QUIET_CLASSES
      } ${className}`}
    >
      {latest ? `Latest · ${label}` : label}
    </span>
  );
};

export default RelativeTimePill;
