/**
 * Tạo tài khoản đăng nhập (ứng dụng không có trang đăng ký công khai).
 *
 *   Trên máy:        bun scripts/create-user.mjs <tên-đăng-nhập> <email> "<Họ và tên>"
 *   Trong Docker:    docker compose exec web node scripts/create-user.mjs <tên-đăng-nhập> <email> "<Họ và tên>"
 *
 * Mật khẩu được hỏi khi chạy (hoặc đọc từ stdin) để không lưu vào lịch sử shell.
 * Script chỉ dùng `pg` + `bcryptjs` (có sẵn trong image production), không cần Prisma CLI hay Bun.
 */
import { randomUUID } from "node:crypto";
import readline from "node:readline";
import bcrypt from "bcryptjs";
import pg from "pg";

const [usernameArg, emailArg, ...nameParts] = process.argv.slice(2);
const name = nameParts.join(" ").trim();

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!usernameArg || !emailArg || !name) {
  fail('Cách dùng: node scripts/create-user.mjs <tên-đăng-nhập> <email> "<Họ và tên>"');
}
if (!process.env.DATABASE_URL) fail("Thiếu biến môi trường DATABASE_URL.");

const username = usernameArg.toLowerCase();
const email = emailArg.toLowerCase();
if (!/^[a-z0-9_]{3,20}$/.test(username)) fail("Tên đăng nhập 3–20 ký tự, chỉ gồm chữ cái, số và dấu gạch dưới (_).");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Email không hợp lệ.");

async function askPassword() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
  if (process.stdin.isTTY) {
    // Ẩn ký tự khi gõ
    rl._writeToOutput = (s) => rl.output.write(s.includes("Mật khẩu") ? s : "");
  }
  const answer = await new Promise((resolve) => rl.question("Mật khẩu (≥ 6 ký tự): ", resolve));
  rl.close();
  if (process.stdin.isTTY) process.stdout.write("\n");
  return answer.trim();
}

const password = await askPassword();
if (password.length < 6) fail("Mật khẩu phải có ít nhất 6 ký tự.");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const { rows } = await client.query("SELECT username FROM users WHERE username = $1 OR email = $2 LIMIT 1", [username, email]);
  if (rows.length) fail(rows[0].username === username ? "Tên đăng nhập đã tồn tại." : "Email đã được sử dụng.");

  await client.query(
    `INSERT INTO users (id, username, email, name, password, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, now(), now())`,
    [randomUUID(), username, email, name, await bcrypt.hash(password, 10)]
  );
  console.log(`Đã tạo tài khoản "${username}" — đăng nhập tại /login.`);
} finally {
  await client.end();
}
