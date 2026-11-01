import { cn } from "@/lib/utils";

export interface StatItem {
  label: React.ReactNode;
  value: string;
  /** Lớp màu cho con số, VD text-emerald-600 */
  tone?: string;
  icon?: React.ElementType;
  /** Lớp nền/màu cho ô icon */
  iconTone?: string;
}

const COLS = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" } as const;

/**
 * Điện thoại: 1 thẻ, mỗi chỉ số 1 hàng (nhãn trái, số tiền đầy đủ bên phải — không bị cắt).
 * Từ sm: lưới thẻ riêng như cũ.
 */
export function StatList({ items, columns = 3, className }: { items: StatItem[]; columns?: 2 | 3 | 4; className?: string }) {
  return (
    <div
      className={cn(
        "divide-y divide-border/70 overflow-hidden rounded-3xl border border-border bg-card shadow-xs",
        "sm:grid sm:gap-4 sm:divide-y-0 sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent sm:shadow-none",
        COLS[columns],
        className
      )}
    >
      {items.map(({ label, value, tone, icon: Icon, iconTone }, i) => (
        <div
          key={i}
          className="flex min-w-0 items-center justify-between gap-3 px-4 py-3 sm:block sm:rounded-3xl sm:border sm:border-border sm:bg-card sm:p-5 sm:shadow-xs"
        >
          <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-muted-foreground">
            {Icon && (
              <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg sm:size-8 sm:rounded-xl", iconTone ?? "bg-muted")}>
                <Icon className="size-4" aria-hidden />
              </span>
            )}
            <span className="truncate">{label}</span>
          </p>
          <p
            className={cn(
              "shrink-0 whitespace-nowrap text-base font-extrabold tracking-tight sm:mt-2 sm:truncate sm:text-[clamp(1rem,1.6vw,1.25rem)]",
              tone
            )}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
