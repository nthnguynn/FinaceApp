/**
 * Tạo tài khoản đăng nhập (ứng dụng không có trang đăng ký công khai).
 *
 *   bun scripts/create-user.ts <tên-đăng-nhập> <email> "<Họ và tên>"
 *
 * Mật khẩu được hỏi khi chạy để không lưu vào lịch sử shell.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const [usernameArg, emailArg, ...nameParts] = process.argv.slice(2);
const name = nameParts.join(" ").trim();

if (!usernameArg || !emailArg || !name) {
  console.error('Cách dùng: bun scripts/create-user.ts <tên-đăng-nhập> <email> "<Họ và tên>"');
  process.exit(1);
}

const username = usernameArg.toLowerCase();
const email = emailArg.toLowerCase();

if (!/^[a-z0-9_]{3,20}$/.test(username)) {
  console.error("Tên đăng nhập 3–20 ký tự, chỉ gồm chữ cái, số và dấu gạch dưới (_).");
  process.exit(1);
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Email không hợp lệ.");
  process.exit(1);
}

const password = prompt("Mật khẩu (≥ 6 ký tự):") ?? "";
if (password.length < 6) {
  console.error("Mật khẩu phải có ít nhất 6 ký tự.");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const existing = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
  if (existing) {
    throw new Error(existing.username === username ? "Tên đăng nhập đã tồn tại." : "Email đã được sử dụng.");
  }

  const user = await prisma.user.create({
    data: { username, email, name, password: await bcrypt.hash(password, 10) },
  });
  console.log(`Đã tạo tài khoản "${user.username}" — đăng nhập tại /login.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
