"use client";

import { PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { cn, formatVND } from "@/lib/utils";

interface StatCardsProps {
  walletBalance: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
}

export function StatCards({ walletBalance, totalIncome, totalExpense, netSavings }: StatCardsProps) {
  const savingRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : null;

  const items = [
    { label: "Số dư ví", value: formatVND(walletBalance), icon: Wallet, tone: "text-foreground", tile: "bg-primary/12 text-primary" },
    {
      label: "Thu nhập",
      value: `+${formatVND(totalIncome)}`,
      icon: TrendingUp,
      tone: "text-emerald-600 dark:text-emerald-400",
      tile: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Chi tiêu",
      value: `-${formatVND(totalExpense)}`,
      icon: TrendingDown,
      tone: "text-rose-600 dark:text-rose-400",
      tile: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
    },
    {
      label: savingRate !== null ? `Để dành được · ${savingRate}%` : "Để dành được",
      value: `${netSavings >= 0 ? "+" : ""}${formatVND(netSavings)}`,
      icon: PiggyBank,
      tone: netSavings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
      tile: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {items.map(({ label, value, icon: Icon, tone, tile }) => (
        <div key={label} className="rounded-3xl border border-border bg-card p-4 shadow-xs sm:p-5">
          <div className="flex items-center gap-2">
            <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl", tile)}>
              <Icon className="size-4" aria-hidden />
            </span>
            <p className="truncate text-sm font-semibold text-muted-foreground">{label}</p>
          </div>
          <p className={cn("mt-3 truncate text-lg font-extrabold tracking-tight sm:text-xl", tone)}>{value}</p>
        </div>
      ))}
    </div>
  );
}
