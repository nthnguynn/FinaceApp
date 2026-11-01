import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Liên kết quay lại (VD: các trang con của "Tôi") */
  back?: { href: string; label: string };
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, back, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-4 gap-y-3", className)}>
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="-ml-1.5 mb-1 inline-flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4" aria-hidden />
            {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
