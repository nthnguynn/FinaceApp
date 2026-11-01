import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  FolderKanban,
  Landmark,
  ListFilter,
  PieChart,
  Smartphone,
  Wallet,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { BrandLogo } from "@/components/ui/brand-logo";

export const metadata: Metadata = {
  title: "moniii — Quản lý thu chi cá nhân",
};

const FEATURES = [
  {
    icon: Wallet,
    title: "Ghi thu chi, số dư tự cập nhật",
    text: "Mỗi khoản thu hoặc chi được cộng trừ thẳng vào Ví chính. Sửa hay xóa giao dịch, số dư được hoàn lại chính xác.",
  },
  {
    icon: Landmark,
    title: "Hộp thư biến động ngân hàng",
    text: "Nhận biến động số dư qua webhook SePay, Casso hoặc ứng dụng chuyển tiếp thông báo trên Android.",
  },
  {
    icon: BellRing,
    title: "Duyệt 1 chạm",
    text: "Số tiền, nội dung chuyển khoản được điền sẵn. Bạn chỉ chọn danh mục rồi lưu, hoặc bỏ qua.",
  },
  {
    icon: PieChart,
    title: "Báo cáo theo danh mục",
    text: "Xem cơ cấu thu chi theo tháng này, tháng trước, cả năm hoặc một khoảng ngày bất kỳ.",
  },
  {
    icon: FolderKanban,
    title: "Danh mục của riêng bạn",
    text: "Bắt đầu với bộ danh mục gợi ý, rồi thêm danh mục mới với biểu tượng và màu sắc tùy chọn.",
  },
  {
    icon: ListFilter,
    title: "Tìm kiếm và lọc nhanh",
    text: "Lọc giao dịch theo loại, danh mục, khoảng thời gian và tìm theo ghi chú.",
  },
];

const STEPS = [
  {
    title: "Lấy địa chỉ Webhook",
    text: "Vào mục Biến động NH → Cài đặt kết nối để sao chép URL kèm mã bí mật của riêng bạn.",
  },
  {
    title: "Dán vào SePay hoặc Casso",
    text: "Tạo webhook mới trỏ về URL đó. Có thể bấm “Gửi test” để kiểm tra kết nối.",
  },
  {
    title: "Xác nhận khi có biến động",
    text: "Giao dịch mới hiện thông báo trong ứng dụng. Chọn danh mục, bấm lưu — xong.",
  },
];

// Dữ liệu minh họa cho khung xem trước (không phải số liệu thật)
const PREVIEW_CATEGORIES = [
  { name: "Ăn uống", color: "#EF4444", pct: 38 },
  { name: "Nhà cửa & Hóa đơn", color: "#3B82F6", pct: 27 },
  { name: "Đi lại", color: "#F59E0B", pct: 15 },
  { name: "Mua sắm", color: "#EC4899", pct: 20 },
];

function donutGradient() {
  let acc = 0;
  const stops = PREVIEW_CATEGORIES.map((c) => {
    const from = acc;
    acc += c.pct;
    return `${c.color} ${from}% ${acc}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

function ProductPreview() {
  return (
    <figure className="relative">
      <div className="rounded-3xl border border-border bg-card p-4 pb-16 shadow-[0_30px_80px_-30px_color-mix(in_oklch,var(--primary)_45%,transparent)] sm:p-6 sm:pb-16">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Tổng quan tháng này</p>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Tháng này</span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-xs sm:gap-3 sm:text-sm">
          <div>
            <p className="text-muted-foreground">Số dư</p>
            <p className="mt-1 whitespace-nowrap font-bold">12.450.000</p>
          </div>
          <div>
            <p className="text-muted-foreground">Thu</p>
            <p className="mt-1 whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400">+18.000.000</p>
          </div>
          <div>
            <p className="text-muted-foreground">Chi</p>
            <p className="mt-1 whitespace-nowrap font-bold text-rose-600 dark:text-rose-400">−5.550.000</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4 border-t border-border/70 pt-6 min-[380px]:gap-6">
          <div
            aria-hidden
            className="relative size-24 shrink-0 rounded-full min-[380px]:size-28"
            style={{ background: donutGradient() }}
          >
            <div className="absolute inset-4 rounded-full bg-card" />
          </div>
          <ul className="min-w-0 flex-1 space-y-2 text-sm">
            {PREVIEW_CATEGORIES.map((c) => (
              <li key={c.name} className="flex items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="truncate text-foreground/85">{c.name}</span>
                <span className="ml-auto font-semibold">{c.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Thông báo biến động nổi */}
      <div className="absolute -bottom-6 left-4 right-4 flex items-center gap-3 rounded-2xl border border-border bg-background/95 p-3.5 shadow-xl backdrop-blur sm:-left-6 sm:right-auto sm:w-80">
        <span className="rounded-xl bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 text-sm">
          <p className="font-semibold">−85.000 ₫ · Vietcombank</p>
          <p className="truncate text-muted-foreground">Bấm để tạo hóa đơn 1 chạm</p>
        </div>
      </div>

      <figcaption className="sr-only">Ví dụ minh họa giao diện tổng quan của moniii</figcaption>
    </figure>
  );
}

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-dvh bg-background text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[44rem] bg-pink-wash" />

      {/* Header */}
      <header className="relative z-10 mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <BrandLogo href="/" size="md" />
        <nav className="flex items-center gap-1 sm:gap-2">
          <a href="#tinh-nang" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:block">
            Tính năng
          </a>
          <a href="#dong-bo" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:block">
            Đồng bộ ngân hàng
          </a>
          <Link
            href="/login"
            className="whitespace-nowrap rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Đăng nhập
          </Link>
        </nav>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-4 pb-24 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16 lg:pb-32 lg:pt-20">
          <div className="animate-rise-in">
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-[-0.02em] text-balance sm:text-5xl lg:text-[3.5rem]">
              Quản lý thu chi gọn gàng, đồng bộ cùng tài khoản ngân hàng.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
              moniii ghi lại từng khoản thu chi, gom biến động số dư ngân hàng về một hộp thư và cho bạn thấy tiền
              đang đi đâu — theo từng danh mục, từng tháng.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90"
              >
                Đăng nhập <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a
                href="#tinh-nang"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card px-6 text-base font-semibold transition-colors hover:bg-muted"
              >
                Xem tính năng
              </a>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Smartphone className="size-4 shrink-0" aria-hidden />
              Cài lên màn hình chính điện thoại như một ứng dụng · Có giao diện tối
            </p>
          </div>

          <div className="animate-rise-in [animation-delay:120ms] lg:pl-4">
            <ProductPreview />
          </div>
        </section>

        {/* Tính năng */}
        <section id="tinh-nang" className="scroll-mt-8 border-t border-border/70 bg-card/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
            <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              Mọi thứ cần cho sổ thu chi hằng ngày
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Không cần bảng tính. Ghi tay khi cần, để ngân hàng tự báo khi có thể.
            </p>

            <ul className="mt-14 grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="border-t border-border pt-6">
                  <Icon className="size-5 text-primary" aria-hidden />
                  <h3 className="mt-4 text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Đồng bộ ngân hàng */}
        <section id="dong-bo" className="scroll-mt-8">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-20 lg:py-24">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
                Đồng bộ ngân hàng trong ba bước
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Mỗi tài khoản có một mã bí mật webhook riêng. Biến động mới vào hộp thư chờ duyệt — không giao dịch nào
                được ghi sổ khi bạn chưa xác nhận.
              </p>
              <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-border bg-card p-3 pr-5 text-sm">
                <span className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                  <ArrowDownLeft className="size-4" aria-hidden />
                </span>
                <span>
                  <span className="font-semibold">Nhận tiền</span>
                  <span className="text-muted-foreground"> → chọn danh mục thu → cộng vào ví</span>
                </span>
              </div>
            </div>

            <ol className="space-y-4">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-bold">{step.title}</h3>
                    <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted-foreground">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA cuối trang */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl bg-primary px-6 py-10 text-primary-foreground sm:flex-row sm:items-center sm:px-10 sm:py-12">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Tiếp tục ghi sổ hôm nay</h2>
              <p className="mt-2 max-w-xl text-primary-foreground/85">
                Đăng nhập để xem số dư Ví chính, duyệt biến động ngân hàng và ghi khoản chi mới.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-background px-6 font-semibold text-foreground transition-colors hover:bg-background/90"
            >
              Đăng nhập <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <BrandLogo size="sm" />
          <p>© {new Date().getFullYear()} moniii · Quản lý tài chính cá nhân</p>
        </div>
      </footer>
    </div>
  );
}
