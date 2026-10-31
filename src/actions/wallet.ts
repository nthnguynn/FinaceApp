"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getOrCreateWallet } from "@/lib/wallet";
import { updateWalletSchema, UpdateWalletInput } from "@/schemas/wallet";

export interface ActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

export interface WalletData {
  id: string;
  userId: string;
  name: string;
  balance: number;
  currency: string;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Server Action: Lấy thông tin Ví chính của người dùng hiện tại
 * (Tự động khởi tạo Ví chính mặc định 0đ nếu chưa tồn tại)
 */
export async function getWalletAction(): Promise<{
  success: boolean;
  wallet?: WalletData;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
    }

    // Nếu người dùng chưa có ví, tự động khởi tạo "Ví chính"
    const wallet = await getOrCreateWallet(session.userId);

    return { success: true, wallet };
  } catch (error) {
    console.error("Get Wallet Error:", error);
    return { success: false, error: "Lỗi hệ thống khi tải thông tin ví cá nhân." };
  }
}

/**
 * Server Action: Cập nhật Ví chính (Số dư VND, Tên ví, Màu sắc, Icon)
 */
export async function updateWalletAction(data: UpdateWalletInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
  }

  // 1. Validate dữ liệu đầu vào
  const validation = updateWalletSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Thông tin ví không hợp lệ",
    };
  }

  const { name, balance, color, icon } = validation.data;

  try {
    // 2. Cập nhật Ví chính trong DB
    await prisma.wallet.upsert({
      where: { userId: session.userId },
      update: {
        name,
        balance,
        color,
        icon,
      },
      create: {
        userId: session.userId,
        name,
        balance,
        currency: "VND",
        color,
        icon,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/wallets");

    return {
      success: true,
      message: "Cập nhật thông tin Ví chính thành công!",
    };
  } catch (error) {
    console.error("Update Wallet Error:", error);
    return {
      success: false,
      error: "Đã xảy ra lỗi trong quá trình cập nhật ví.",
    };
  }
}
