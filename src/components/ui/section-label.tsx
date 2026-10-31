import { cn } from "@/lib/utils";

interface SectionLabelProps {
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  as?: "h2" | "h3" | "p";
}

/** Nhãn khu vực nhỏ, in hoa giãn chữ (kiểu "LỊCH CHI TIÊU") */
export function SectionLabel({ icon: Icon, children, className, as: Tag = "h2" }: SectionLabelProps) {
  return (
    <Tag
      className={cn(
        "flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground",
        className
      )}
    >
      {Icon && <Icon className="size-4 text-primary" aria-hidden />}
      {children}
    </Tag>
  );
}
