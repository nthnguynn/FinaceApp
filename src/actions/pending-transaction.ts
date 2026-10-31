"use server";

import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getOrCreateWallet } from "@/lib/wallet";
import type { Prisma } from "@/generated/prisma/client";
import {
  simulatePendingTransactionSchema,
  approvePendingTransactionSchema,
  SimulatePendingTransactionInput,
  ApprovePendingTransactionInput,
} from "@/schemas/pending-transaction";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PendingTransactionData {
  id: string;
  userId: string;
  walletId: string | null;
  amount: number;
  type: "INCOME" | "EXPENSE";
  bankName: string | null;
  bankAccount: string | null;
  transactionCode: string | null;
  content: string | null;
  status: "PENDING" | "APPROVED" | "IGNORED";
  transactionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Server Action: Lấy danh sách giao dịch ngân hàng chờ xử lý
 */
export async function getPendingTransactionsAction(status?: "PENDING" | "APPROVED" | "IGNORED" | "ALL"): Promise<{
  success: boolean;
  transactions?: PendingTransactionData[];
  pendingCount?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
    }

    const whereClause: Prisma.PendingTransactionWhereInput = { userId: session.userId };
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    const listQuery = prisma.pendingTransaction.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    // Khi đang lọc PENDING thì số lượng chính là độ dài danh sách, không cần thêm truy vấn COUNT
    if (status === "PENDING") {
      const transactions = await listQuery;
      return { success: true, transactions, pendingCount: transactions.length };
    }

    const [transactions, pendingCount] = await Promise.all([
      listQuery,
      prisma.pendingTransaction.count({
        where: { userId: session.userId, status: "PENDING" },
      }),
    ]);

    return { success: true, transactions, pendingCount };
  } catch (error) {
    console.error("Get Pending Transactions Error:", error);
    return { success: false, error: "Lỗi hệ thống khi tải danh sách giao dịch ngân hàng." };
  }
}

/**
 * Server Action: Lấy số lượng giao dịch PENDING cho thông báo / badge
 */
export async function getPendingCountAction(): Promise<number> {
  try {
    const session = await getSession();
    if (!session) return 0;

    return await prisma.pendingTransaction.count({
      where: { userId: session.userId, status: "PENDING" },
    });
  } catch (error) {
    console.error("Get Pending Count Error:", error);
    return 0;
  }
}

/**
 * Server Action: Giả lập biến động số dư ngân hàng (Simulator)
 */
export async function simulateBankTransactionAction(
  data: SimulatePendingTransactionInput
): Promise<ActionResult<PendingTransactionData>> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
  }

  const validation = simulatePendingTransactionSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Thông tin giả lập không hợp lệ",
    };
  }

  const { amount, type, bankName, bankAccount, content } = validation.data;

  try {
    const randomCode = `MB${Date.now().toString().slice(-6)}`;

    const pending = await prisma.pendingTransaction.create({
      data: {
        userId: session.userId,
        amount,
        type,
        bankName,
        bankAccount: bankAccount || "9999999999",
        transactionCode: randomCode,
        content,
        status: "PENDING",
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/transactions");

    return {
      success: true,
      data: pending,
      message: `Giả lập thành công: ${type === "INCOME" ? "+" : "-"}${amount.toLocaleString("vi-VN")} đ từ ${bankName}`,
    };
  } catch (error) {
    console.error("Simulate Bank Transaction Error:", error);
    return { success: false, error: "Lỗi hệ thống khi tạo giao dịch giả lập." };
  }
}

/**
 * Server Action: Duyệt giao dịch chờ & Tạo Transaction chính thức (1-Chạm)
 */
export async function approvePendingTransactionAction(
  data: ApprovePendingTransactionInput
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
  }

  const validation = approvePendingTransactionSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Thông tin duyệt không hợp lệ",
    };
  }

  const { pendingId, categoryId, amount, type, date, note } = validation.data;

  try {
    const [pending, category, wallet] = await Promise.all([
      prisma.pendingTransaction.findUnique({ where: { id: pendingId } }),
      prisma.category.findFirst({
        where: { id: categoryId, OR: [{ userId: null }, { userId: session.userId }] },
        select: { id: true },
      }),
      getOrCreateWallet(session.userId),
    ]);

    if (!pending || pending.userId !== session.userId) {
      return { success: false, error: "Giao dịch chờ không tồn tại hoặc không có quyền duyệt." };
    }

    if (pending.status === "APPROVED") {
      return { success: false, error: "Giao dịch này đã được duyệt trước đó." };
    }

    if (!category) {
      return { success: false, error: "Danh mục không tồn tại hoặc không có quyền sử dụng." };
    }

    const balanceChange = type === "INCOME" ? amount : -amount;

    const approved = await prisma.$transaction(async (tx) => {
      // 0. Khóa trạng thái trước để tránh duyệt trùng khi bấm 2 lần liên tiếp
      const claimed = await tx.pendingTransaction.updateMany({
        where: { id: pendingId, status: { not: "APPROVED" } },
        data: { status: "APPROVED", walletId: wallet.id },
      });
      if (claimed.count === 0) return false;

      // 1. Tạo Transaction chính thức
      const createdTx = await tx.transaction.create({
        data: {
          userId: session.userId,
          walletId: wallet.id,
          categoryId,
          amount,
          type,
          date,
          note: note || pending.content || null,
        },
      });

      // 2. Cập nhật số dư Ví
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: balanceChange,
          },
        },
      });

      // 3. Liên kết PendingTransaction với giao dịch vừa tạo
      await tx.pendingTransaction.update({
        where: { id: pendingId },
        data: { transactionId: createdTx.id },
      });

      return true;
    });

    if (!approved) {
      return { success: false, error: "Giao dịch này đã được duyệt trước đó." };
    }

    revalidatePath("/dashboard");
    revalidatePath("/wallets");
    revalidatePath("/transactions");

    return {
      success: true,
      message: type === "INCOME" ? "Đã ghi nhận nguồn thu thành công!" : "Đã lưu hóa đơn chi tiêu thành công!",
    };
  } catch (error) {
    console.error("Approve Pending Transaction Error:", error);
    return { success: false, error: "Đã xảy ra lỗi trong quá trình duyệt giao dịch." };
  }
}

/**
 * Server Action: Bỏ qua biến động số dư (Không tạo hóa đơn)
 */
export async function ignorePendingTransactionAction(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Phiên làm việc đã hết hạn." };
  }

  try {
    // Lọc theo userId ngay trong câu lệnh: 1 truy vấn thay vì find + update
    const { count } = await prisma.pendingTransaction.updateMany({
      where: { id, userId: session.userId },
      data: { status: "IGNORED" },
    });

    if (count === 0) {
      return { success: false, error: "Giao dịch không tồn tại." };
    }

    revalidatePath("/dashboard");
    revalidatePath("/transactions");

    return { success: true, message: "Đã bỏ qua giao dịch này." };
  } catch (error) {
    console.error("Ignore Pending Transaction Error:", error);
    return { success: false, error: "Lỗi khi cập nhật trạng thái." };
  }
}

/**
 * Server Action: Xóa vĩnh viễn biến động số dư chờ
 */
export async function deletePendingTransactionAction(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Phiên làm việc đã hết hạn." };
  }

  try {
    const { count } = await prisma.pendingTransaction.deleteMany({
      where: { id, userId: session.userId },
    });

    if (count === 0) {
      return { success: false, error: "Giao dịch không tồn tại." };
    }

    revalidatePath("/dashboard");
    revalidatePath("/transactions");

    return { success: true, message: "Đã xóa bản ghi biến động số dư." };
  } catch (error) {
    console.error("Delete Pending Transaction Error:", error);
    return { success: false, error: "Lỗi khi xóa bản ghi." };
  }
}

/**
 * Server Action: Lấy thông tin Webhook Secret của User (Tạo mới nếu chưa có)
 */
export async function getWebhookSettingsAction(): Promise<{
  success: boolean;
  webhookSecret?: string;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Chưa đăng nhập." };
    }

    let user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { webhookSecret: true },
    });

    if (!user?.webhookSecret) {
      const newSecret = `wh_sec_${crypto.randomBytes(16).toString("hex")}`;
      user = await prisma.user.update({
        where: { id: session.userId },
        data: { webhookSecret: newSecret },
        select: { webhookSecret: true },
      });
    }

    return { success: true, webhookSecret: user?.webhookSecret || undefined };
  } catch (error) {
    console.error("Get Webhook Settings Error:", error);
    return { success: false, error: "Lỗi khi tải cài đặt Webhook." };
  }
}

/**
 * Server Action: Tạo lại Webhook Secret mới
 */
export async function regenerateWebhookSecretAction(): Promise<ActionResult<{ webhookSecret: string }>> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Chưa đăng nhập." };
    }

    const newSecret = `wh_sec_${crypto.randomBytes(16).toString("hex")}`;
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { webhookSecret: newSecret },
      select: { webhookSecret: true },
    });

    return {
      success: true,
      data: { webhookSecret: user.webhookSecret! },
      message: "Đã tạo mã Secret Token mới thành công!",
    };
  } catch (error) {
    console.error("Regenerate Webhook Secret Error:", error);
    return { success: false, error: "Lỗi khi tạo lại Secret Token." };
  }
}
