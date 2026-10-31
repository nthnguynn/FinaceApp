/**
 * Seed dữ liệu demo cho môi trường phát triển (KHÔNG chạy trên production).
 *
 *   bun scripts/seed-demo.ts
 *
 * Tài khoản mẫu: tên đăng nhập `admin` / mật khẩu `admin` (chỉ dùng cho môi trường dev).
 * Script idempotent: tạo user nếu chưa có (hoặc đặt lại mật khẩu mẫu), xóa giao dịch cũ của user rồi tạo lại bộ dữ liệu mẫu.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const DEMO = { username: "admin", email: "admin@myfinance.test", name: "Admin", password: "admin" };

if (process.env.NODE_ENV === "production") {
  throw new Error("Không chạy seed demo trên production.");
}
// Tài khoản admin/admin rất dễ đoán: chỉ cho seed vào DB ở chính máy này
const dbHost = new URL(process.env.DATABASE_URL ?? "postgresql://localhost").hostname;
if (!["localhost", "127.0.0.1", "::1"].includes(dbHost)) {
  throw new Error(`Seed demo chỉ chạy với DB local (đang trỏ tới ${dbHost}).`);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const password = await bcrypt.hash(DEMO.password, 10);
  const user = await prisma.user.upsert({
    where: { username: DEMO.username },
    update: { password },
    create: { username: DEMO.username, email: DEMO.email, name: DEMO.name, password },
  });

  // Danh mục hệ thống được seed tự động ở lần đầu mở trang Danh mục / Giao dịch
  const categories = await prisma.category.findMany({ where: { userId: null } });
  if (categories.length === 0) {
    throw new Error("Chưa có danh mục hệ thống — hãy đăng nhập và mở trang Giao dịch một lần trước.");
  }
  const cat = (name: string) => {
    const c = categories.find((x) => x.name === name);
    if (!c) throw new Error(`Thiếu danh mục ${name}`);
    return c.id;
  };

  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.pendingTransaction.deleteMany({ where: { userId: user.id } });

  const now = new Date();
  const day = (d: number, h = 12) => new Date(now.getFullYear(), now.getMonth(), Math.min(d, now.getDate()), h);

  const rows = [
    { c: "Lương", type: "INCOME", amount: 18_000_000, date: day(1, 9), note: "Lương tháng" },
    { c: "Thưởng", type: "INCOME", amount: 1_500_000, date: day(5, 10), note: "Thưởng dự án" },
    { c: "Ăn uống", type: "EXPENSE", amount: 85_000, date: day(2, 8), note: "Bánh mì + cà phê" },
    { c: "Ăn uống", type: "EXPENSE", amount: 420_000, date: day(6, 19), note: "Ăn tối cùng gia đình" },
    { c: "Ăn uống", type: "EXPENSE", amount: 1_250_000, date: day(12, 12), note: "Đi chợ tuần" },
    { c: "Nhà cửa & Hóa đơn", type: "EXPENSE", amount: 1_100_000, date: day(3, 20), note: "Tiền điện nước" },
    { c: "Nhà cửa & Hóa đơn", type: "EXPENSE", amount: 350_000, date: day(3, 20), note: "Internet" },
    { c: "Đi lại", type: "EXPENSE", amount: 640_000, date: day(8, 7), note: "Đổ xăng + gửi xe" },
    { c: "Mua sắm", type: "EXPENSE", amount: 990_000, date: day(10, 15), note: "Giày chạy bộ" },
    { c: "Giải trí", type: "EXPENSE", amount: 260_000, date: day(14, 21), note: "Xem phim" },
    { c: "Sức khỏe", type: "EXPENSE", amount: 450_000, date: day(15, 9), note: "Khám răng" },
  ] as const;

  const wallet = await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, color: "#EC4899" },
  });

  await prisma.transaction.createMany({
    data: rows.map((r) => ({
      userId: user.id,
      walletId: wallet.id,
      categoryId: cat(r.c),
      type: r.type,
      amount: r.amount,
      date: r.date,
      note: r.note,
    })),
  });

  const net = rows.reduce((s, r) => s + (r.type === "INCOME" ? r.amount : -r.amount), 0);
  await prisma.wallet.update({ where: { id: wallet.id }, data: { balance: 2_000_000 + net } });

  await prisma.pendingTransaction.createMany({
    data: [
      { userId: user.id, amount: 85_000, type: "EXPENSE", bankName: "Vietcombank", transactionCode: "FT26304A1", content: "MBVCB.1234.5678.Highlands Coffee" },
      { userId: user.id, amount: 2_000_000, type: "INCOME", bankName: "MBBank", transactionCode: "FT26304B2", content: "NGUYEN VAN A chuyen tien an trua" },
    ],
  });

  console.log(`Seed xong cho user "${user.username}": ${rows.length} giao dịch, 2 biến động chờ duyệt.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
