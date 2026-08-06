"use client";

import { Pause, Play } from "lucide-react";

import { cn } from "@/components/ui/utils";

/** Compact clock for inside the circular control (H:MM:SS or M:SS). */
export function formatDurationClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${m}:${ss}`;
}

type CircularTaskTimerProps = {
  /** Cumulative time: completed segments + current open segment (if running). */
  totalSeconds: number;
  running: boolean;
  onPause: () => void;
  onPlay: () => void;
  disabled?: boolean;
  /** `sm` for header chips, `md` for task rows */
  size?: "sm" | "md";
  "aria-label"?: string;
};

const sizePx: Record<NonNullable<CircularTaskTimerProps["size"]>, string> = {
  sm: "h-[3.25rem] w-[3.25rem]",
  md: "h-[4.75rem] w-[4.75rem]",
};

const textSize: Record<NonNullable<CircularTaskTimerProps["size"]>, string> = {
  sm: "text-[9px]",
  md: "text-[11px]",
};

const iconSize: Record<NonNullable<CircularTaskTimerProps["size"]>, string> = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
};

export function CircularTaskTimer({
  totalSeconds,
  running,
  onPause,
  onPlay,
  disabled,
  size = "md",
  "aria-label": ariaLabel,
}: CircularTaskTimerProps) {
  const label = ariaLabel ?? (running ? "Pause timer" : "Start timer");

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={running ? onPause : onPlay}
      aria-label={label}
      title={label}
      className={cn(
        "group relative flex shrink-0 items-center justify-center rounded-full border-2 bg-card text-foreground shadow-sm outline-none transition-all",
        "hover:scale-[1.02] hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-40",
        running
          ? "border-primary shadow-[0_0_0_3px_rgba(231,69,44,0.12)]"
          : "border-border hover:border-primary/60",
        sizePx[size],
      )}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full text-border"
        viewBox="0 0 100 100"
        aria-hidden
      >
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span className="relative z-[1] flex flex-col items-center justify-center gap-0.5 px-1">
        <span
          className={cn(
            "font-mono font-semibold tabular-nums leading-none tracking-tight text-foreground",
            textSize[size],
          )}
        >
          {formatDurationClock(totalSeconds)}
        </span>
        {running ? (
          <Pause className={cn(iconSize[size], "text-primary")} strokeWidth={2.5} />
        ) : (
          <Play className={cn(iconSize[size], "text-primary")} strokeWidth={2.5} />
        )}
      </span>
    </button>
  );
}
