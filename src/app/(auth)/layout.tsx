import React from "react";
import { Landmark, PieChart, ShieldCheck, Zap } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";

// Chỉ nêu những gì ứng dụng thực sự làm được — không dùng số liệu minh họa giả
const HIGHLIGHTS = [
  { icon: Landmark, title: "Đồng bộ ngân hàng", text: "Nhận biến động số dư qua webhook SePay, Casso" },
  { icon: Zap, title: "Ghi sổ 1 chạm", text: "Số tiền và nội dung được điền sẵn, chỉ cần chọn danh mục" },
  { icon: PieChart, title: "Báo cáo theo danh mục", text: "Xem cơ cấu thu chi theo tháng, năm hoặc khoảng ngày" },
  { icon: ShieldCheck, title: "Phiên đăng nhập an toàn", text: "Mật khẩu băm bcrypt, cookie HTTP-only" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark relative flex min-h-dvh w-full bg-background text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-pink-wash" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-grid opacity-40" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-10 md:px-8 lg:grid-cols-[1fr_28rem]">
        {/* Cột giới thiệu (màn hình lớn) */}
        <section className="hidden lg:block">
          <BrandLogo href="/" size="lg" />
          <h2 className="mt-10 max-w-md text-4xl font-extrabold leading-tight tracking-tight text-balance">
            Biết rõ tiền đi đâu, mỗi ngày.
          </h2>
          <p className="mt-4 max-w-md text-base text-muted-foreground leading-relaxed">
            moniii ghi lại thu chi, gom biến động ngân hàng về một hộp thư và cho bạn thấy bức tranh tài chính
            theo từng danh mục.
          </p>

          <ul className="mt-10 grid max-w-lg grid-cols-2 gap-x-8 gap-y-6">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground leading-snug">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Form */}
        <div className="flex w-full flex-col items-center gap-6">
          <BrandLogo href="/" size="lg" className="lg:hidden" />
          <div className="w-full animate-rise-in">{children}</div>
          <p className="text-xs text-muted-foreground font-medium">
            © {new Date().getFullYear()} moniii
          </p>
        </div>
      </div>
    </div>
  );
}
