import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, FolderKanban, KeyRound, Landmark, LogOut, Palette, UserRound, Wallet } from "lucide-react";
import { getUserProfileAction } from "@/actions/profile";
import { getWalletAction } from "@/actions/wallet";
import { logoutAction } from "@/actions/auth";
import { ProfileForm } from "@/components/profile/profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PageHeader } from "@/components/ui/page-header";
import { SectionLabel } from "@/components/ui/section-label";
import { formatVND } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description: "Hồ sơ, ví, danh mục và cài đặt tài khoản",
};

const rowClass = "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50";
const tileClass = "flex size-10 shrink-0 items-center justify-center rounded-2xl";

export default async function ProfilePage() {
  const [result, walletResult] = await Promise.all([getUserProfileAction(), getWalletAction()]);

  if (!result.success || !result.user) {
    redirect("/login");
  }

  const { user } = result;
  const links = [
    {
      href: "/wallets",
      icon: Wallet,
      title: "Ví cá nhân",
      sub: walletResult.wallet ? `Số dư ${formatVND(walletResult.wallet.balance)}` : "Số dư và màu ví",
      tile: "bg-primary/12 text-primary",
    },
    { href: "/categories", icon: FolderKanban, title: "Danh mục thu chi", sub: "Thêm, sửa icon và màu", tile: "bg-violet-500/12 text-violet-600 dark:text-violet-400" },
    { href: "/bank-sync", icon: Landmark, title: "Đồng bộ ngân hàng", sub: "Webhook SePay, Casso", tile: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Tôi & Cài đặt" description="Tùy chỉnh moniii của bạn." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-6">
        <div className="space-y-5">
          {/* Thẻ người dùng */}
          <section className="flex items-center gap-4 rounded-[1.75rem] bg-hero p-5 text-hero-foreground shadow-lg">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl font-extrabold">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold">{user.name}</p>
              <p className="truncate text-sm opacity-80">
                {user.username ? `@${user.username} · ` : ""}
                {user.email}
              </p>
            </div>
          </section>

          {/* Lối tắt cài đặt */}
          <nav aria-label="Cài đặt" className="divide-y divide-border/70 overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-xs">
            {links.map(({ href, icon: Icon, title, sub, tile }) => (
              <Link key={href} href={href} className={rowClass}>
                <span className={`${tileClass} ${tile}`}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{sub}</span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            ))}
            <div className={rowClass}>
              <span className={`${tileClass} bg-sky-500/12 text-sky-600 dark:text-sky-400`}>
                <Palette className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">Giao diện</span>
                <span className="block text-xs text-muted-foreground">Chuyển sáng / tối</span>
              </span>
              <ThemeToggle />
            </div>
            <form action={logoutAction}>
              <button type="submit" className={`${rowClass} cursor-pointer`}>
                <span className={`${tileClass} bg-rose-500/12 text-rose-600 dark:text-rose-400`}>
                  <LogOut className="size-5" aria-hidden />
                </span>
                <span className="flex-1 text-sm font-bold text-rose-600 dark:text-rose-400">Đăng xuất</span>
              </button>
            </form>
          </nav>
        </div>

        <div className="space-y-5">
          <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-xs sm:p-6">
            <SectionLabel icon={UserRound} className="mb-5">
              Thông tin tài khoản
            </SectionLabel>
            <ProfileForm initialUser={user} />
          </section>

          <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-xs sm:p-6">
            <SectionLabel icon={KeyRound} className="mb-5">
              Đổi mật khẩu
            </SectionLabel>
            <ChangePasswordForm />
          </section>
        </div>
      </div>
    </div>
  );
}
