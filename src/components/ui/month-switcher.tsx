"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthSwitcherProps {
  year: number;
  month: number; // 1-12
  onChange: (delta: -1 | 1) => void;
  disabled?: boolean;
  className?: string;
}

/** Viên thuốc "‹ Tháng 10, 2026 ›" */
export function MonthSwitcher({ year, month, onChange, disabled, className }: MonthSwitcherProps) {
  const btn =
    "flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 cursor-pointer";
  return (
    <div
      className={cn(
        "inline-flex h-11 items-center gap-0.5 rounded-full border border-border bg-card px-1 shadow-xs",
        className
      )}
    >
      <button type="button" className={btn} onClick={() => onChange(-1)} disabled={disabled} aria-label="Tháng trước">
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-[7.5rem] text-center text-sm font-bold" aria-live="polite">
        Tháng {month}, {year}
      </span>
      <button type="button" className={btn} onClick={() => onChange(1)} disabled={disabled} aria-label="Tháng sau">
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
