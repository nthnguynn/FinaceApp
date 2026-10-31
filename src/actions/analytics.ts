"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";

export type PeriodFilter =
  | "THIS_MONTH"
  | "LAST_MONTH"
  | "THIS_YEAR"
  | "ALL"
  | "SPECIFIC_MONTH"
  | "CUSTOM_RANGE";

export interface AnalyticsFilterParams {
  period: PeriodFilter;
  selectedMonth?: string; // Định dạng "YYYY-MM" (VD: "2026-08")
  startDate?: string;     // Định dạng "YYYY-MM-DD"
  endDate?: string;       // Định dạng "YYYY-MM-DD"
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  type: "INCOME" | "EXPENSE";
  totalAmount: number;
  percentage: number;
  transactionCount: number;
}

export interface AnalyticsSummary {
  period: PeriodFilter;
  selectedMonth?: string;
  startDate?: string;
  endDate?: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  walletBalance: number;
  totalTransactionsCount: number;
  categoryExpenses: CategoryBreakdownItem[];
  categoryIncomes: CategoryBreakdownItem[];
}

/**
 * Xác định khoảng thời gian lọc (StartDate, EndDate) theo bộ lọc kỳ báo cáo
 */
function resolveDateRange({ period, selectedMonth, startDate, endDate }: AnalyticsFilterParams) {
  const now = new Date();

  switch (period) {
    case "THIS_MONTH":
      return {
        gte: new Date(now.getFullYear(), now.getMonth(), 1),
        lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
      };
    case "LAST_MONTH":
      return {
        gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        lte: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
      };
    case "THIS_YEAR":
      return {
        gte: new Date(now.getFullYear(), 0, 1),
        lte: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
      };
    case "SPECIFIC_MONTH": {
      const [year, month] = (selectedMonth || "").split("-").map(Number);
      if (!year || !month) return undefined;
      return {
        gte: new Date(year, month - 1, 1),
        lte: new Date(year, month, 0, 23, 59, 59, 999),
      };
    }
    case "CUSTOM_RANGE": {
      const range: Prisma.DateTimeFilter = {};
      if (startDate) range.gte = new Date(startDate + "T00:00:00");
      if (endDate) range.lte = new Date(endDate + "T23:59:59.999");
      return startDate || endDate ? range : undefined;
    }
    default:
      return undefined;
  }
}

function toBreakdown(items: Omit<CategoryBreakdownItem, "percentage">[], total: number): CategoryBreakdownItem[] {
  return items
    .map((item) => ({
      ...item,
      percentage: total > 0 ? Number(((item.totalAmount / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

export async function getAnalyticsSummaryAction(
  params: AnalyticsFilterParams = { period: "THIS_MONTH" }
): Promise<{
  success: boolean;
  data?: AnalyticsSummary;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
    }

    const where: Prisma.TransactionWhereInput = { userId: session.userId };
    const dateRange = resolveDateRange(params);
    if (dateRange) where.date = dateRange;

    // Gom nhóm trực tiếp trong PostgreSQL thay vì tải toàn bộ giao dịch về server
    const [wallet, groups] = await Promise.all([
      prisma.wallet.findUnique({
        where: { userId: session.userId },
        select: { balance: true },
      }),
      prisma.transaction.groupBy({
        by: ["categoryId", "type"],
        where,
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    const categoryIds = [...new Set(groups.map((g) => g.categoryId))];
    const categories = categoryIds.length
      ? await prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true, icon: true, color: true },
        })
      : [];
    const categoryById = new Map(categories.map((c) => [c.id, c]));

    let totalIncome = 0;
    let totalExpense = 0;
    let totalTransactionsCount = 0;
    const incomeItems: Omit<CategoryBreakdownItem, "percentage">[] = [];
    const expenseItems: Omit<CategoryBreakdownItem, "percentage">[] = [];

    for (const g of groups) {
      const amount = g._sum.amount ?? 0;
      const category = categoryById.get(g.categoryId);
      totalTransactionsCount += g._count._all;

      const item = {
        categoryId: g.categoryId,
        categoryName: category?.name ?? "Không rõ",
        icon: category?.icon ?? "Tag",
        color: category?.color ?? "#6B7280",
        type: g.type,
        totalAmount: amount,
        transactionCount: g._count._all,
      };

      if (g.type === "INCOME") {
        totalIncome += amount;
        incomeItems.push(item);
      } else {
        totalExpense += amount;
        expenseItems.push(item);
      }
    }

    return {
      success: true,
      data: {
        period: params.period,
        selectedMonth: params.selectedMonth,
        startDate: params.startDate,
        endDate: params.endDate,
        totalIncome,
        totalExpense,
        netSavings: totalIncome - totalExpense,
        walletBalance: wallet?.balance ?? 0,
        totalTransactionsCount,
        categoryExpenses: toBreakdown(expenseItems, totalExpense),
        categoryIncomes: toBreakdown(incomeItems, totalIncome),
      },
    };
  } catch (error) {
    console.error("Get Analytics Summary Error:", error);
    return { success: false, error: "Lỗi hệ thống khi lấy báo cáo thống kê." };
  }
}
