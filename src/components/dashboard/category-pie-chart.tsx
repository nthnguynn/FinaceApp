"use client";

import { useState } from "react";
import { Award, Leaf, PieChart as PieChartIcon, TrendingDown } from "lucide-react";
import { CategoryBreakdownItem } from "@/actions/analytics";
import { SectionLabel } from "@/components/ui/section-label";
import { getCategoryIcon } from "@/lib/category-icons";
import { cn, formatVND } from "@/lib/utils";

interface CategoryPieChartProps {
  categoryExpenses: CategoryBreakdownItem[];
  categoryIncomes: CategoryBreakdownItem[];
  totalExpense: number;
  totalIncome: number;
  /** Số ngày của kỳ đang xem (null = "Tất cả", không tính trung bình) */
  periodDays: number | null;
}

export function CategoryPieChart({
  categoryExpenses,
  categoryIncomes,
  totalExpense,
  totalIncome,
  periodDays,
}: CategoryPieChartProps) {
  const [activeType, setActiveType] = useState<"EXPENSE" | "INCOME">("EXPENSE");

  const isExpense = activeType === "EXPENSE";
  const items = isExpense ? categoryExpenses : categoryIncomes;
  const total = isExpense ? totalExpense : totalIncome;
  const top = items[0];
  const totalText = formatVND(total);
  // Số càng dài chữ càng nhỏ để vừa lòng donut (không cắt mất số)
  const totalSize = totalText.length > 14 ? "text-base" : totalText.length > 11 ? "text-lg" : "text-xl";

  // Donut bằng conic-gradient (không cần thư viện biểu đồ)
  let cumulative = 0;
  const stops = items.map((item) => {
    const start = cumulative;
    cumulative += item.percentage;
    return `${item.color} ${start}% ${cumulative}%`;
  });
  if (items.length > 0 && cumulative < 100) stops.push(`${items[items.length - 1].color} ${cumulative}% 100%`);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-5">
        {/* Donut + chuyển Chi/Thu */}
        <section aria-label="Biểu đồ cơ cấu" className="self-start rounded-[1.75rem] border border-border bg-card p-5 shadow-xs sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <SectionLabel icon={PieChartIcon} as="h2">
              Cơ cấu {isExpense ? "chi tiêu" : "thu nhập"}
            </SectionLabel>
            <div className="flex rounded-full bg-muted p-1 text-xs font-bold" role="radiogroup" aria-label="Loại">
              {(["EXPENSE", "INCOME"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={activeType === type}
                  onClick={() => setActiveType(type)}
                  className={cn(
                    "rounded-full px-3.5 py-2 transition-colors cursor-pointer sm:py-1.5",
                    activeType === type
                      ? type === "EXPENSE"
                        ? "bg-card text-rose-600 shadow-xs dark:text-rose-400"
                        : "bg-card text-emerald-600 shadow-xs dark:text-emerald-400"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {type === "EXPENSE" ? "Chi" : "Thu"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div
              className="relative flex size-56 items-center justify-center rounded-full sm:size-60"
              style={{ background: items.length ? `conic-gradient(${stops.join(", ")})` : "var(--muted)" }}
            >
              <div className="flex size-40 flex-col items-center justify-center rounded-full bg-card text-center sm:size-44">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Tổng {isExpense ? "chi" : "thu"}
                </span>
                <span className={cn("mt-1 whitespace-nowrap font-extrabold tracking-tight", totalSize)}>{totalText}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Thẻ nhỏ + danh sách */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
            <div className="rounded-3xl border border-border bg-muted/50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <span className="flex size-7 items-center justify-center rounded-lg bg-card text-primary">
                  <TrendingDown className="size-4" aria-hidden />
                </span>
                Trung bình / ngày
              </p>
              <p className="mt-2 truncate text-lg font-extrabold">
                {periodDays ? formatVND(Math.round(total / periodDays)) : "—"}
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-muted/50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <span className="flex size-7 items-center justify-center rounded-lg bg-card text-amber-500">
                  <Award className="size-4" aria-hidden />
                </span>
                {isExpense ? "Chi nhiều nhất" : "Thu nhiều nhất"}
              </p>
              <p className="mt-2 truncate text-lg font-extrabold">{top ? top.categoryName : "—"}</p>
            </div>
          </div>

          <section aria-label="Theo danh mục" className="rounded-[1.75rem] border border-border bg-card p-5 shadow-xs">
            <SectionLabel icon={Leaf} as="h2" className="mb-2">
              Theo danh mục
            </SectionLabel>
            {items.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Chưa có dữ liệu {isExpense ? "chi tiêu" : "thu nhập"} trong kỳ này.
              </p>
            ) : (
              <ul className="divide-y divide-border/70">
                {items.map((item) => {
                  const Icon = getCategoryIcon(item.icon);
                  return (
                    <li key={item.categoryId} className="space-y-2 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex size-10 shrink-0 items-center justify-center rounded-2xl"
                          style={{ backgroundColor: `${item.color}1f`, color: item.color }}
                        >
                          <Icon className="size-5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold">{item.categoryName}</span>
                          <span className="block text-xs text-muted-foreground">
                            {item.transactionCount} giao dịch
                            <span className="sm:hidden"> · {item.percentage}%</span>
                          </span>
                        </span>
                        <span className="shrink-0 whitespace-nowrap text-sm font-extrabold">{formatVND(item.totalAmount)}</span>
                        <span
                          className="hidden w-14 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-bold text-foreground/80 sm:block"
                          style={{ backgroundColor: `${item.color}24` }}
                        >
                          {item.percentage}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
