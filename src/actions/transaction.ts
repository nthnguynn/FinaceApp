"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getOrCreateWallet } from "@/lib/wallet";
import type { Prisma } from "@/generated/prisma/client";
import {
  createTransactionSchema,
  updateTransactionSchema,
  CreateTransactionInput,
  UpdateTransactionInput,
} from "@/schemas/transaction";

export interface ActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

export interface TransactionData {
  id: string;
  userId: string;
  walletId: string;
  categoryId: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  date: Date;
  note: string | null;
  createdAt: Date;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: "INCOME" | "EXPENSE";
  };
}

const CATEGORY_SELECT = {
  id: true,
  name: true,
  icon: true,
  color: true,
  type: true,
} as const;

function revalidateFinancePages() {
  revalidatePath("/dashboard");
  revalidatePath("/wallets");
  revalidatePath("/transactions");
}

/**
 * Chỉ cho phép dùng danh mục hệ thống (userId = null) hoặc danh mục của chính user
 */
async function canUseCategory(userId: string, categoryId: string): Promise<boolean> {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, OR: [{ userId: null }, { userId }] },
    select: { id: true },
  });
  return !!category;
}

export interface TransactionFilters {
  type?: "INCOME" | "EXPENSE" | "ALL";
  categoryId?: string;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Server Action: Lấy danh sách giao dịch Thu - Chi kèm bộ lọc và thống kê tổng thu/chi
 */
export async function getTransactionsAction(filters?: TransactionFilters): Promise<{
  success: boolean;
  transactions?: TransactionData[];
  totalIncome?: number;
  totalExpense?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
    }

    const whereCondition: Prisma.TransactionWhereInput = {
      userId: session.userId,
    };

    if (filters?.type && filters.type !== "ALL") {
      whereCondition.type = filters.type;
    }

    if (filters?.categoryId && filters.categoryId !== "ALL") {
      whereCondition.categoryId = filters.categoryId;
    }

    if (filters?.searchQuery && filters.searchQuery.trim() !== "") {
      whereCondition.note = {
        contains: filters.searchQuery.trim(),
        mode: "insensitive",
      };
    }

    if (filters?.startDate || filters?.endDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      whereCondition.date = dateFilter;
      if (filters.startDate) {
        const parts = filters.startDate.split("-").map(Number);
        if (parts.length === 3) {
          // Bắt đầu ngày ở GMT+7 (00:00:00.000 GMT+7 = 17:00:00 UTC ngày hôm trước)
          dateFilter.gte = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], -7, 0, 0, 0));
        } else {
          dateFilter.gte = new Date(filters.startDate);
        }
      }
      if (filters.endDate) {
        const parts = filters.endDate.split("-").map(Number);
        if (parts.length === 3) {
          // Kết thúc ngày ở GMT+7 (23:59:59.999 GMT+7 = 16:59:59.999 UTC)
          dateFilter.lte = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 16, 59, 59, 999));
        } else {
          const endDateObj = new Date(filters.endDate);
          endDateObj.setHours(23, 59, 59, 999);
          dateFilter.lte = endDateObj;
        }
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: whereCondition,
      include: { category: { select: CATEGORY_SELECT } },
      orderBy: { date: "desc" },
    });

    // Tính tổng thu nhập và tổng chi tiêu trong danh sách lọc
    let totalIncome = 0;
    let totalExpense = 0;
    for (const t of transactions) {
      if (t.type === "INCOME") totalIncome += t.amount;
      else totalExpense += t.amount;
    }

    return {
      success: true,
      transactions,
      totalIncome,
      totalExpense,
    };
  } catch (error) {
    console.error("Get Transactions Error:", error);
    return { success: false, error: "Lỗi hệ thống khi tải danh sách giao dịch." };
  }
}

/**
 * Server Action: Tạo giao dịch mới và tự động cập nhật số dư Ví chính trong atomic transaction
 */
export async function createTransactionAction(data: CreateTransactionInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
  }

  const validation = createTransactionSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Thông tin giao dịch không hợp lệ",
    };
  }

  const { type, amount, categoryId, date, note } = validation.data;

  try {
    const [allowed, wallet] = await Promise.all([
      canUseCategory(session.userId, categoryId),
      getOrCreateWallet(session.userId),
    ]);

    if (!allowed) {
      return { success: false, error: "Danh mục không tồn tại hoặc không có quyền sử dụng." };
    }

    // Thực hiện atomic transaction: Tạo giao dịch + Cập nhật số dư Ví
    const balanceAdjustment = type === "INCOME" ? amount : -amount;

    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: session.userId,
          walletId: wallet.id,
          categoryId,
          type,
          amount,
          date,
          note: note || null,
        },
      }),
      prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: balanceAdjustment,
          },
        },
      }),
    ]);

    revalidateFinancePages();

    return {
      success: true,
      message: type === "INCOME" ? "Thêm giao dịch Thu nhập thành công!" : "Thêm giao dịch Chi tiêu thành công!",
    };
  } catch (error) {
    console.error("Create Transaction Error:", error);
    return { success: false, error: "Đã xảy ra lỗi trong quá trình ghi nhận giao dịch." };
  }
}

/**
 * Server Action: Cập nhật giao dịch và điều chỉnh chênh lệch số dư Ví chính
 */
export async function updateTransactionAction(data: UpdateTransactionInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
  }

  const validation = updateTransactionSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Thông tin giao dịch không hợp lệ",
    };
  }

  const { id, type, amount, categoryId, date, note } = validation.data;

  try {
    const [oldTransaction, allowed] = await Promise.all([
      prisma.transaction.findUnique({ where: { id } }),
      canUseCategory(session.userId, categoryId),
    ]);

    if (!oldTransaction || oldTransaction.userId !== session.userId) {
      return { success: false, error: "Giao dịch không tồn tại hoặc không có quyền sửa." };
    }

    if (!allowed) {
      return { success: false, error: "Danh mục không tồn tại hoặc không có quyền sử dụng." };
    }

    // Hoàn trả biến động cũ & Áp dụng biến động mới cho Ví
    const oldImpact = oldTransaction.type === "INCOME" ? oldTransaction.amount : -oldTransaction.amount;
    const newImpact = type === "INCOME" ? amount : -amount;
    const netBalanceChange = newImpact - oldImpact;

    await prisma.$transaction([
      prisma.transaction.update({
        where: { id },
        data: {
          type,
          amount,
          categoryId,
          date,
          note: note || null,
        },
      }),
      prisma.wallet.update({
        where: { id: oldTransaction.walletId },
        data: {
          balance: {
            increment: netBalanceChange,
          },
        },
      }),
    ]);

    revalidateFinancePages();

    return {
      success: true,
      message: "Cập nhật giao dịch thành công!",
    };
  } catch (error) {
    console.error("Update Transaction Error:", error);
    return { success: false, error: "Đã xảy ra lỗi trong quá trình cập nhật giao dịch." };
  }
}

/**
 * Server Action: Xóa giao dịch và hoàn trả số dư Ví chính
 */
export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
  }

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction || transaction.userId !== session.userId) {
      return { success: false, error: "Giao dịch không tồn tại hoặc không có quyền xóa." };
    }

    // Hoàn trả số dư Ví: Chi tiêu -> cộng lại ví; Thu nhập -> trừ đi khỏi ví
    const revertAmount = transaction.type === "INCOME" ? -transaction.amount : transaction.amount;

    await prisma.$transaction([
      prisma.transaction.delete({
        where: { id },
      }),
      prisma.wallet.update({
        where: { id: transaction.walletId },
        data: {
          balance: {
            increment: revertAmount,
          },
        },
      }),
    ]);

    revalidateFinancePages();

    return {
      success: true,
      message: "Xóa giao dịch thành công!",
    };
  } catch (error) {
    console.error("Delete Transaction Error:", error);
    return { success: false, error: "Đã xảy ra lỗi trong quá trình xóa giao dịch." };
  }
}
