"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, CalendarDays, Landmark, PieChart, ReceiptText, UserRound } from "lucide-react";
import { UserNavDropdown } from "@/components/layout/user-nav-dropdown";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { usePendingTransactions } from "@/components/bank-sync/pending-transactions-provider";
import { BrandLogo } from "@/components/ui/brand-logo";
import { cn } from "@/lib/utils";

interface NavbarProps {
  userName?: string;
}

interface NavTab {
  href: string;
  label: string;
  icon: React.ElementType;
  /** Các trang con được coi là thuộc tab này */
  match?: string[];
  badge?: number;
}

function isActiveTab(pathname: string, tab: NavTab) {
  return [tab.href, ...(tab.match ?? [])].some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function Badge({ count, className }: { count: number; className?: string }) {
  return (
    <span
      className={cn(
        "flex min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-4.5 text-white",
        className
      )}
    >
      {count > 99 ? "99+" : count}
      <span className="sr-only"> biến động chờ duyệt</span>
    </span>
  );
}

export function Navbar({ userName }: NavbarProps) {
  const pathname = usePathname();
  const { pendingCount } = usePendingTransactions();

  const tabs: NavTab[] = [
    { href: "/dashboard", label: "Lịch", icon: CalendarDays },
    { href: "/transactions", label: "Giao dịch", icon: ArrowLeftRight },
    { href: "/bills", label: "Hóa đơn", icon: ReceiptText },
    { href: "/stats", label: "Thống kê", icon: PieChart },
    { href: "/bank-sync", label: "Ngân hàng", icon: Landmark, badge: pendingCount || undefined },
    { href: "/profile", label: "Tôi", icon: UserRound, match: ["/wallets", "/categories"] },
  ];

  return (
    <>
      <header className="relative z-40 w-full md:sticky md:top-0 md:border-b md:border-border/60 md:bg-background/85 md:backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <BrandLogo href="/dashboard" size="md" />

          {/* Máy tính: tab dạng viên thuốc */}
          <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 rounded-full border border-border bg-card p-1 shadow-xs md:flex">
            {tabs.map((tab) => {
              const active = isActiveTab(pathname, tab);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors",
                    active ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {tab.label}
                  {tab.badge && <Badge count={tab.badge} />}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden md:block">
              <UserNavDropdown userName={userName} />
            </div>
          </div>
        </div>
      </header>

      {/* Điện thoại: thanh tab nổi ở đáy */}
      <nav
        aria-label="Điều hướng chính"
        className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 rounded-[1.75rem] border border-border bg-card/95 p-1.5 shadow-[0_10px_40px_-12px_rgb(0_0_0/0.28)] backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-6 gap-0.5">
          {tabs.map((tab) => {
            const active = isActiveTab(pathname, tab);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-[1.25rem] py-2 text-[10.5px] font-semibold tracking-tight transition-colors",
                  active ? "bg-primary/12 text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span className="max-w-full truncate px-0.5">{tab.label}</span>
                {tab.badge && <Badge count={tab.badge} className="absolute right-[12%] top-1" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
