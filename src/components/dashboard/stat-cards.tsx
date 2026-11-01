"use client";

import { PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { StatList } from "@/components/ui/stat-list";
import { formatVND } from "@/lib/utils";

interface StatCardsProps {
  walletBalance: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
}

export function StatCards({ walletBalance, totalIncome, totalExpense, netSavings }: StatCardsProps) {
  const saving = netSavings >= 0;
  const savingRate = saving && totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : null;

  return (
    <StatList
      columns={4}
      items={[
        { label: "Số dư ví", value: formatVND(walletBalance), icon: Wallet, iconTone: "bg-primary/12 text-primary" },
        {
          label: "Thu nhập",
          value: `+${formatVND(totalIncome)}`,
          tone: "text-emerald-600 dark:text-emerald-400",
          icon: TrendingUp,
          iconTone: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
        },
        {
          label: "Chi tiêu",
          value: `-${formatVND(totalExpense)}`,
          tone: "text-rose-600 dark:text-rose-400",
          icon: TrendingDown,
          iconTone: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
        },
        {
          // Chi nhiều hơn thu: nói thẳng "chi vượt thu" thay vì tỉ lệ để dành âm
          label: saving ? (savingRate !== null ? `Để dành được · ${savingRate}%` : "Để dành được") : "Chi vượt thu",
          value: `${saving ? "+" : "-"}${formatVND(Math.abs(netSavings))}`,
          tone: saving ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
          icon: PiggyBank,
          iconTone: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        },
      ]}
    />
  );
}
