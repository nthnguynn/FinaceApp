"use client";

import { useState } from "react";
import { Flame, Settings2 } from "lucide-react";
import { SectionLabel } from "@/components/ui/section-label";
import { daysInMonth, mondayIndex, WEEKDAY_SHORT } from "@/lib/date-vn";
import { cn, formatCompactVND, formatVND } from "@/lib/utils";
import { HeatLevel, HeatThresholds, heatLevel, useHeatThresholds } from "./use-heat-thresholds";

export interface DayTotals {
  income: number;
  expense: number;
  count: number;
}

interface MoneyCalendarProps {
  year: number;
  month: number;
  /** Tổng theo ngày (key = ngày trong tháng) */
  days: Map<number, DayTotals>;
  today: number | null;
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
  /** Chạm đúp vào ngày: thêm nhanh giao dịch cho ngày đó */
  onQuickAdd: (day: number) => void;
}

const HEAT_CLASSES: Record<HeatLevel, string> = {
  0: "border-border/70 bg-card",
  1: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/12 dark:text-emerald-300",
  2: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/25 dark:bg-orange-500/12 dark:text-orange-300",
  3: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300",
};

export function MoneyCalendar({ year, month, days, today, selectedDay, onSelectDay, onQuickAdd }: MoneyCalendarProps) {
  const [thresholds, setThresholds] = useHeatThresholds();
  const [editing, setEditing] = useState(false);

  const total = daysInMonth(year, month);
  const leading = mondayIndex(year, month, 1);

  return (
    <section aria-labelledby="money-calendar-title" className="rounded-[1.75rem] border border-border bg-card p-4 shadow-xs sm:p-5">
      <SectionLabel icon={Flame} className="mb-4" as="h2">
        <span id="money-calendar-title">Lịch chi tiêu</span>
      </SectionLabel>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAY_SHORT.map((w) => (
          <div key={w} aria-hidden className="pb-1 text-center text-xs font-bold text-muted-foreground">
            {w}
          </div>
        ))}

        {Array.from({ length: leading }, (_, i) => (
          <div key={`empty-${i}`} aria-hidden />
        ))}

        {Array.from({ length: total }, (_, i) => {
          const day = i + 1;
          const totals = days.get(day);
          const level = heatLevel(totals?.expense ?? 0, thresholds);
          const isToday = day === today;
          const isSelected = day === selectedDay;
          const label = [
            `Ngày ${day}`,
            totals?.expense ? `chi ${formatVND(totals.expense)}` : null,
            totals?.income ? `thu ${formatVND(totals.income)}` : null,
            isToday ? "hôm nay" : null,
          ]
            .filter(Boolean)
            .join(", ");

          return (
            <button
              key={day}
              type="button"
              aria-label={label}
              aria-pressed={isSelected}
              onClick={() => onSelectDay(day)}
              onDoubleClick={() => onQuickAdd(day)}
              className={cn(
                "relative flex min-h-14 touch-manipulation flex-col items-center justify-start gap-0.5 rounded-xl border px-0.5 pb-1.5 pt-1.5 transition-[transform,box-shadow] active:scale-95 sm:min-h-16 sm:rounded-2xl lg:min-h-[4.75rem] cursor-pointer",
                HEAT_CLASSES[level],
                isToday && !isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-card",
                isSelected && "ring-2 ring-foreground ring-offset-1 ring-offset-card"
              )}
            >
              <span className={cn("text-sm font-bold leading-none", level === 0 && "text-foreground/80", isToday && "text-primary")}>
                {day}
              </span>
              {totals?.expense ? (
                <span className="text-[10px] font-bold leading-tight sm:text-xs">{formatCompactVND(totals.expense)}</span>
              ) : null}
              {totals?.income ? (
                <span className="absolute bottom-1 size-1.5 rounded-full bg-emerald-500" aria-hidden />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Chú thích mức chi */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3 text-xs">
        <span className="font-semibold text-muted-foreground">Mức chi:</span>
        <LegendPill level={1}>&lt; {formatCompactVND(thresholds.low)}</LegendPill>
        <LegendPill level={2}>
          {formatCompactVND(thresholds.low)}–{formatCompactVND(thresholds.high)}
        </LegendPill>
        <LegendPill level={3}>&gt; {formatCompactVND(thresholds.high)}</LegendPill>
        <span className="flex items-center gap-1 text-muted-foreground">
          <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden /> có thu
        </span>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          aria-expanded={editing}
          aria-label="Chỉnh mốc màu"
          className="ml-auto flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Settings2 className="size-4" />
        </button>
      </div>

      {editing && (
        <ThresholdEditor
          value={thresholds}
          onSave={(next) => {
            setThresholds(next);
            setEditing(false);
          }}
        />
      )}
    </section>
  );
}

function LegendPill({ level, children }: { level: HeatLevel; children: React.ReactNode }) {
  return <span className={cn("rounded-full border px-2 py-0.5 font-semibold", HEAT_CLASSES[level])}>{children}</span>;
}

function ThresholdEditor({ value, onSave }: { value: HeatThresholds; onSave: (t: HeatThresholds) => void }) {
  const [low, setLow] = useState(String(value.low / 1000));
  const [high, setHigh] = useState(String(value.high / 1000));
  const lowK = Number(low);
  const highK = Number(high);
  const valid = lowK > 0 && highK > lowK;

  const field = "h-10 w-24 rounded-xl border border-border bg-background px-3 text-base font-semibold outline-none focus:border-primary sm:text-sm";

  return (
    <form
      className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl bg-muted/60 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave({ low: lowK * 1000, high: highK * 1000 });
      }}
    >
      <label className="space-y-1 text-xs font-semibold text-muted-foreground">
        <span className="block">Chi ít dưới (nghìn ₫)</span>
        <input inputMode="numeric" value={low} onChange={(e) => setLow(e.target.value.replace(/\D/g, ""))} className={field} />
      </label>
      <label className="space-y-1 text-xs font-semibold text-muted-foreground">
        <span className="block">Chi nhiều trên (nghìn ₫)</span>
        <input inputMode="numeric" value={high} onChange={(e) => setHigh(e.target.value.replace(/\D/g, ""))} className={field} />
      </label>
      <button
        type="submit"
        disabled={!valid}
        className="h-10 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50 cursor-pointer"
      >
        Lưu mốc
      </button>
      {!valid && <p className="w-full text-xs text-destructive">Mốc “chi nhiều” phải lớn hơn mốc “chi ít”.</p>}
    </form>
  );
}
