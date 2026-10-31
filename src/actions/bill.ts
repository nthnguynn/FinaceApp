"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getOrCreateWallet } from "@/lib/wallet";
import {
  BillRepeat,
  isDateKey,
  keyToUTC,
  nextUnpaidOccurrence,
  occurrenceSeq,
  occurrencesInMonth,
  totalOccurrences,
  utcToKey,
} from "@/lib/bills";
import { toVNDate } from "@/lib/date-vn";
import { billSchema, BillInput } from "@/schemas/bill";

export interface ActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

interface BillBase {
  billId: string;
  name: string;
  amount: number;
  repeat: BillRepeat;
  note: string | null;
  startDate: string; // YYYY-MM-DD
  endMonth: string | null; // YYYY-MM
  /** Tổng số kỳ (null = không thời hạn) */
  total: number | null;
  category: { id: string; name: string; icon: string; color: string };
}

/** Một kỳ đến hạn của hóa đơn trong tháng đang xem */
export interface BillOccurrence extends BillBase {
  dueDate: string; // YYYY-MM-DD
  seq: number;
  paid: boolean;
}

/** Một hóa đơn (kế hoạch) kèm tiến độ */
export interface BillPlan extends BillBase {
  paidCount: number;
  paidAmount: number;
  nextDue: string | null;
}

const CATEGORY_SELECT = { select: { id: true, name: true, icon: true, color: true } } as const;

const SESSION_EXPIRED = "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.";

function revalidateBillPages() {
  revalidatePath("/bills");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/wallets");
}

/** Hóa đơn chỉ được gắn với danh mục CHI của hệ thống hoặc của chính user */
async function canUseExpenseCategory(userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, type: "EXPENSE", OR: [{ userId: null }, { userId }] },
    select: { id: true },
  });
  return !!category;
}

export async function getBillsForMonthAction(
  year: number,
  month: number
): Promise<{ success: boolean; bills?: BillOccurrence[]; error?: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: SESSION_EXPIRED };
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return { success: false, error: "Tháng không hợp lệ." };
  }

  try {
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const nextMonth = new Date(Date.UTC(year, month, 1));
    const bills = await prisma.bill.findMany({
      where: { userId: session.userId, startDate: { lt: nextMonth } },
      include: {
        category: CATEGORY_SELECT,
        payments: { where: { dueDate: { gte: monthStart, lt: nextMonth } }, select: { dueDate: true } },
      },
    });

    const occurrences: BillOccurrence[] = bills.flatMap((bill) => {
      const startDate = utcToKey(bill.startDate);
      const paidKeys = new Set(bill.payments.map((p) => utcToKey(p.dueDate)));
      const total = totalOccurrences(startDate, bill.repeat, bill.endMonth);
      return occurrencesInMonth(startDate, bill.repeat, year, month, bill.endMonth).map((dueDate) => ({
        billId: bill.id,
        name: bill.name,
        amount: bill.amount,
        repeat: bill.repeat,
        note: bill.note,
        startDate,
        endMonth: bill.endMonth,
        total,
        category: bill.category,
        dueDate,
        seq: occurrenceSeq(startDate, bill.repeat, dueDate),
        paid: paidKeys.has(dueDate),
      }));
    });

    occurrences.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name, "vi"));
    return { success: true, bills: occurrences };
  } catch (error) {
    console.error("Get Bills Error:", error);
    return { success: false, error: "Không tải được danh sách hóa đơn." };
  }
}

export async function getBillPlansAction(): Promise<{ success: boolean; plans?: BillPlan[]; error?: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: SESSION_EXPIRED };

  try {
    const bills = await prisma.bill.findMany({
      where: { userId: session.userId },
      include: {
        category: CATEGORY_SELECT,
        payments: { select: { dueDate: true, transaction: { select: { amount: true } } } },
      },
      orderBy: { createdAt: "asc" },
    });
    const today = toVNDate(new Date());

    const plans: BillPlan[] = bills.map((bill) => {
      const startDate = utcToKey(bill.startDate);
      const paidKeys = new Set(bill.payments.map((p) => utcToKey(p.dueDate)));
      return {
        billId: bill.id,
        name: bill.name,
        amount: bill.amount,
        repeat: bill.repeat,
        note: bill.note,
        startDate,
        endMonth: bill.endMonth,
        total: totalOccurrences(startDate, bill.repeat, bill.endMonth),
        category: bill.category,
        paidCount: bill.payments.length,
        paidAmount: bill.payments.reduce((sum, p) => sum + p.transaction.amount, 0),
        // Hóa đơn một lần: còn nhắc (kể cả đã quá hạn) cho tới khi được trả
        nextDue:
          bill.repeat === "NONE"
            ? paidKeys.has(startDate)
              ? null
              : startDate
            : nextUnpaidOccurrence(startDate, bill.repeat, bill.endMonth, paidKeys, today.year, today.month),
      };
    });

    // Hóa đơn sắp đến hạn lên trước, hóa đơn đã xong xuống cuối
    plans.sort((a, b) => (a.nextDue ?? "9999").localeCompare(b.nextDue ?? "9999") || a.name.localeCompare(b.name, "vi"));
    return { success: true, plans };
  } catch (error) {
    console.error("Get Bill Plans Error:", error);
    return { success: false, error: "Không tải được danh sách hóa đơn." };
  }
}

export async function saveBillAction(input: BillInput, id?: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: SESSION_EXPIRED };

  const validation = billSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message || "Thông tin hóa đơn không hợp lệ" };
  }
  const { name, amount, categoryId, startDate, repeat, endMonth, note } = validation.data;

  try {
    if (!(await canUseExpenseCategory(session.userId, categoryId))) {
      return { success: false, error: "Danh mục chi không tồn tại hoặc không có quyền sử dụng." };
    }
    const data = {
      name,
      amount,
      categoryId,
      startDate: keyToUTC(startDate),
      repeat,
      // Hóa đơn một lần không cần tháng kết thúc
      endMonth: repeat === "NONE" ? null : endMonth || null,
      note: note?.trim() || null,
    };

    if (id) {
      const { count } = await prisma.bill.updateMany({ where: { id, userId: session.userId }, data });
      if (count === 0) return { success: false, error: "Hóa đơn không tồn tại." };
    } else {
      await prisma.bill.create({ data: { ...data, userId: session.userId } });
    }

    revalidateBillPages();
    return { success: true, message: id ? "Đã cập nhật hóa đơn." : "Đã thêm hóa đơn." };
  } catch (error) {
    console.error("Save Bill Error:", error);
    return { success: false, error: "Không lưu được hóa đơn." };
  }
}

/** Xóa hóa đơn: các khoản chi đã trả trước đó vẫn được giữ trong lịch sử giao dịch */
export async function deleteBillAction(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: SESSION_EXPIRED };

  try {
    const { count } = await prisma.bill.deleteMany({ where: { id, userId: session.userId } });
    if (count === 0) return { success: false, error: "Hóa đơn không tồn tại." };
    revalidateBillPages();
    return { success: true, message: "Đã xóa hóa đơn." };
  } catch (error) {
    console.error("Delete Bill Error:", error);
    return { success: false, error: "Không xóa được hóa đơn." };
  }
}

/**
 * Trả một kỳ hóa đơn: ghi 1 khoản CHI (trừ vào Ví chính) và đánh dấu kỳ đó đã trả.
 * Không tạo khoản nợ nào; kỳ chưa trả chỉ là lời nhắc.
 */
export async function payBillAction(billId: string, dueDate: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: SESSION_EXPIRED };
  if (!isDateKey(dueDate)) return { success: false, error: "Kỳ hóa đơn không hợp lệ." };

  try {
    const [bill, wallet] = await Promise.all([
      prisma.bill.findFirst({ where: { id: billId, userId: session.userId } }),
      getOrCreateWallet(session.userId),
    ]);
    if (!bill) return { success: false, error: "Hóa đơn không tồn tại." };

    const year = Number(dueDate.slice(0, 4));
    const month = Number(dueDate.slice(5, 7));
    if (!occurrencesInMonth(utcToKey(bill.startDate), bill.repeat, year, month, bill.endMonth).includes(dueDate)) {
      return { success: false, error: "Hóa đơn không đến hạn vào ngày này." };
    }

    const paid = await prisma.$transaction(async (tx) => {
      // Khóa kỳ trước (unique billId + dueDate) để bấm 2 lần không bị trừ tiền 2 lần
      const already = await tx.billPayment.findUnique({
        where: { billId_dueDate: { billId, dueDate: keyToUTC(dueDate) } },
        select: { id: true },
      });
      if (already) return false;

      const transaction = await tx.transaction.create({
        data: {
          userId: session.userId,
          walletId: wallet.id,
          categoryId: bill.categoryId,
          type: "EXPENSE",
          amount: bill.amount,
          date: new Date(),
          note: `Hóa đơn: ${bill.name}`,
        },
      });
      await tx.billPayment.create({
        data: { billId, userId: session.userId, dueDate: keyToUTC(dueDate), transactionId: transaction.id },
      });
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: bill.amount } } });
      return true;
    });

    if (!paid) return { success: false, error: "Kỳ hóa đơn này đã được trả." };
    revalidateBillPages();
    return { success: true, message: `Đã trả “${bill.name}” và ghi vào chi tiêu.` };
  } catch (error) {
    // Trùng unique khi 2 yêu cầu trả cùng lúc
    if ((error as { code?: string })?.code === "P2002") {
      return { success: false, error: "Kỳ hóa đơn này đã được trả." };
    }
    console.error("Pay Bill Error:", error);
    return { success: false, error: "Không ghi được khoản trả hóa đơn." };
  }
}

/** Hoàn tác "đã trả": xóa khoản chi đã ghi và cộng lại tiền vào ví */
export async function unpayBillAction(billId: string, dueDate: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: SESSION_EXPIRED };
  if (!isDateKey(dueDate)) return { success: false, error: "Kỳ hóa đơn không hợp lệ." };

  try {
    const payment = await prisma.billPayment.findFirst({
      where: { billId, userId: session.userId, dueDate: keyToUTC(dueDate) },
      include: { transaction: { select: { id: true, amount: true, walletId: true } } },
    });
    if (!payment) return { success: false, error: "Kỳ hóa đơn này chưa được trả." };

    await prisma.$transaction([
      // Xóa giao dịch sẽ xóa luôn bản ghi BillPayment (onDelete: Cascade)
      prisma.transaction.delete({ where: { id: payment.transaction.id } }),
      prisma.wallet.update({
        where: { id: payment.transaction.walletId },
        data: { balance: { increment: payment.transaction.amount } },
      }),
    ]);

    revalidateBillPages();
    return { success: true, message: "Đã hoàn tác, khoản chi được xóa và tiền cộng lại vào ví." };
  } catch (error) {
    console.error("Unpay Bill Error:", error);
    return { success: false, error: "Không hoàn tác được." };
  }
}
