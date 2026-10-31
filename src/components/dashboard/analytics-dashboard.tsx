"use client";

import { useState, useEffect, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import {
  getAnalyticsSummaryAction,
  AnalyticsFilterParams,
  AnalyticsSummary,
  PeriodFilter,
} from "@/actions/analytics";
import { StatCards } from "@/components/dashboard/stat-cards";
import { CategoryPieChart } from "@/components/dashboard/category-pie-chart";
import { MonthPicker } from "@/components/ui/month-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "THIS_MONTH", label: "Tháng này" },
  { value: "LAST_MONTH", label: "Tháng trước" },
  { value: "THIS_YEAR", label: "Năm nay" },
  { value: "SPECIFIC_MONTH", label: "Chọn tháng" },
  { value: "CUSTOM_RANGE", label: "Khoảng ngày" },
  { value: "ALL", label: "Tất cả" },
];

const DAY_MS = 86_400_000;

// Date -> YYYY-MM-DD theo giờ địa phương
const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fromYMD = (str: string) => {
  const [y, m, d] = str.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : new Date();
};

/** Số ngày dùng để tính "trung bình / ngày" (chỉ tính phần đã trôi qua của kỳ hiện tại) */
function periodDays(period: PeriodFilter, selectedMonth: string, start: string, end: string): number | null {
  const now = new Date();
  const daysIn = (y: number, m: number) => new Date(y, m, 0).getDate();
  switch (period) {
    case "THIS_MONTH":
      return now.getDate();
    case "LAST_MONTH":
      return daysIn(now.getFullYear(), now.getMonth());
    case "THIS_YEAR":
      return Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / DAY_MS) + 1;
    case "SPECIFIC_MONTH": {
      const [y, m] = selectedMonth.split("-").map(Number);
      if (y === now.getFullYear() && m === now.getMonth() + 1) return now.getDate();
      return daysIn(y, m);
    }
    case "CUSTOM_RANGE":
      return Math.max(1, Math.round((fromYMD(end).getTime() - fromYMD(start).getTime()) / DAY_MS) + 1);
    default:
      return null;
  }
}

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<PeriodFilter>("THIS_MONTH");

  const todayObj = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}`
  );
  const [startDateStr, setStartDateStr] = useState(toYMD(new Date(todayObj.getFullYear(), todayObj.getMonth(), 1)));
  const [endDateStr, setEndDateStr] = useState(toYMD(todayObj));

  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<{ key: string; data: AnalyticsSummary | null } | null>(null);

  // Chỉ đưa vào request những tham số mà kỳ báo cáo hiện tại thực sự dùng
  const params = useMemo<AnalyticsFilterParams>(() => {
    if (period === "SPECIFIC_MONTH") return { period, selectedMonth };
    if (period === "CUSTOM_RANGE") return { period, startDate: startDateStr, endDate: endDateStr };
    return { period };
  }, [period, selectedMonth, startDateStr, endDateStr]);

  const requestKey = `${JSON.stringify(params)}#${reloadToken}`;
  const loading = result?.key !== requestKey;
  const analytics = result?.data ?? null;

  useEffect(() => {
    let cancelled = false;
    getAnalyticsSummaryAction(params)
      .then((res) => {
        // Bỏ qua response cũ nếu người dùng đã đổi bộ lọc trong lúc chờ
        if (cancelled) return;
        // Lỗi: giữ số liệu cũ nhưng vẫn kết thúc trạng thái loading
        setResult((prev) => ({ key: requestKey, data: res.success && res.data ? res.data : prev?.data ?? null }));
      })
      .catch((error) => {
        console.error("Failed to load analytics:", error);
        if (!cancelled) setResult((prev) => ({ key: requestKey, data: prev?.data ?? null }));
      });
    return () => {
      cancelled = true;
    };
  }, [params, requestKey]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thống kê"
        description="Tiền của bạn đã đi đâu, theo từng danh mục."
        actions={
          <button
            type="button"
            onClick={() => setReloadToken((t) => t + 1)}
            disabled={loading}
            aria-label="Làm mới"
            className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-xs hover:text-foreground cursor-pointer"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </button>
        }
      />

      {/* Chọn kỳ */}
      <div className="space-y-3">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0" role="radiogroup" aria-label="Kỳ báo cáo">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={period === opt.value}
              onClick={() => setPeriod(opt.value)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors cursor-pointer",
                period === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {period === "SPECIFIC_MONTH" && (
          <div className="w-56">
            <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          </div>
        )}

        {period === "CUSTOM_RANGE" && (
          <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              Từ
              <span className="w-44">
                <DatePicker value={fromYMD(startDateStr)} onChange={(d) => setStartDateStr(toYMD(d))} />
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              Đến
              <span className="w-44">
                <DatePicker value={fromYMD(endDateStr)} onChange={(d) => setEndDateStr(toYMD(d))} />
              </span>
            </label>
          </div>
        )}
      </div>

      <div className={cn("space-y-5 transition-opacity", loading && "opacity-60")} aria-busy={loading}>
        <StatCards
          walletBalance={analytics?.walletBalance ?? 0}
          totalIncome={analytics?.totalIncome ?? 0}
          totalExpense={analytics?.totalExpense ?? 0}
          netSavings={analytics?.netSavings ?? 0}
        />

        <CategoryPieChart
          categoryExpenses={analytics?.categoryExpenses ?? []}
          categoryIncomes={analytics?.categoryIncomes ?? []}
          totalExpense={analytics?.totalExpense ?? 0}
          totalIncome={analytics?.totalIncome ?? 0}
          periodDays={periodDays(period, selectedMonth, startDateStr, endDateStr)}
        />
      </div>
    </div>
  );
}
