import { prisma } from "@/lib/prisma";

export const DEFAULT_WALLET_COLOR = "#EC4899";

/**
 * Lấy Ví chính của user, tự khởi tạo nếu chưa có (1 truy vấn upsert thay vì find + create)
 */
export function getOrCreateWallet(userId: string) {
  return prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      name: "Ví chính",
      balance: 0,
      currency: "VND",
      color: DEFAULT_WALLET_COLOR,
      icon: "Wallet",
    },
  });
}
