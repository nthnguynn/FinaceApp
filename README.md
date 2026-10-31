<p align="center">
  <img src="public/icon-192.png" width="96" height="96" alt="" />
</p>

<h1 align="center">moniii</h1>

<p align="center">Sổ thu chi cá nhân: lịch chi tiêu theo ngày, hóa đơn định kỳ và đồng bộ biến động ngân hàng.</p>

## Tính năng

- **Lịch chi tiêu**: mỗi ngày tô màu theo mức chi, số dư khả dụng và hạn mức chi an toàn mỗi ngày.
- **Ghi nhanh**: bảng nhập có bàn phím số, hoặc gõ chữ kiểu `cà phê 35k, xăng 50k` rồi Enter.
- **Hóa đơn**: tiền nhà, điện nước, gói đăng ký, trả góp… có lịch trả theo tháng. “Xác nhận đã trả” ghi một
  khoản chi và trừ vào ví (không ghi thành khoản nợ).
- **Thống kê** theo danh mục và theo kỳ.
- **Đồng bộ ngân hàng** qua webhook SePay / Casso (V1) vào hộp thư chờ duyệt.
- Giao diện sáng/tối, cài lên màn hình chính như ứng dụng (PWA).

Danh sách đầy đủ: [FEATURES.md](FEATURES.md) · Hệ thống thiết kế: [DESIGN.md](DESIGN.md)

## Công nghệ

Next.js 16 (App Router, Server Actions) · React 19 · Tailwind CSS 4 · Prisma 7 + PostgreSQL · Bun

## Chạy trên máy

Cần Bun và PostgreSQL.

```bash
bun install
cp .env.example .env          # điền DATABASE_URL và JWT_SECRET (openssl rand -hex 32)
bunx prisma generate
bunx prisma db push           # tạo bảng
bun run dev                   # http://localhost:3005
```

Ứng dụng không có trang đăng ký công khai. Tạo tài khoản bằng:

```bash
bun scripts/create-user.ts <tên-đăng-nhập> <email> "<Họ và tên>"
```

Dữ liệu mẫu cho môi trường dev (không chạy được trên production): `bun scripts/seed-demo.ts`.
Sinh lại bộ icon: `bun scripts/generate-favicons.ts`.

## Ghi công

Phát triển tiếp từ mã nguồn gốc của [ducmannh](https://github.com/ducmannh).
