"use client";

import { useMemo, useState } from "react";
import { Loader2, SendHorizontal, Sparkles } from "lucide-react";
import { createTransactionAction } from "@/actions/transaction";
import { CategoryData } from "@/actions/category";
import { toast } from "@/components/ui/toast";
import { getCategoryIcon } from "@/lib/category-icons";
import { parseQuickEntries } from "@/lib/quick-entry";
import { cn, formatVND } from "@/lib/utils";

interface QuickTextEntryProps {
  categories: CategoryData[];
  /** Ngày ghi mặc định (có thể đổi bằng "hôm qua", "hôm kia" trong câu) */
  baseDate?: Date;
  /** VD: "hôm nay", "ngày 10/10" */
  baseLabel?: string;
  onCreated: () => void;
  className?: string;
}

/** Gõ "cà phê 35k, xăng 50k" rồi Enter là ghi sổ luôn */
export function QuickTextEntry({ categories, baseDate, baseLabel = "hôm nay", onCreated, className }: QuickTextEntryProps) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const entries = useMemo(
    () => parseQuickEntries(text, categories, baseDate ?? new Date()),
    [text, categories, baseDate]
  );
  const invalid = entries.filter((e) => !e.amount || !e.categoryId);
  const canSave = entries.length > 0 && invalid.length === 0 && !saving;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entries.length) return;
    if (invalid.length) {
      toast.error(`Thiếu số tiền ở: ${invalid.map((i) => `“${i.raw}”`).join(", ")}`);
      return;
    }

    setSaving(true);
    let saved = 0;
    try {
      // Ghi lần lượt để số dư ví được cộng/trừ đúng thứ tự
      for (const entry of entries) {
        const res = await createTransactionAction({
          type: entry.type,
          amount: entry.amount!,
          categoryId: entry.categoryId!,
          date: entry.date,
          note: entry.note || undefined,
        });
        if (!res.success) {
          toast.error(`“${entry.raw}”: ${res.error || "không ghi được"}`);
          break;
        }
        saved += 1;
      }
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }

    if (saved > 0) {
      toast.success(saved === 1 ? "Đã ghi 1 khoản." : `Đã ghi ${saved} khoản.`);
      // Giữ lại phần chưa ghi được (nếu có) để người dùng sửa
      setText(entries.slice(saved).map((e) => e.raw).join(", "));
      onCreated();
    }
  };

  return (
    <section className={cn("rounded-[1.75rem] border border-border bg-card p-4 shadow-xs sm:p-5", className)}>
      <form onSubmit={submit}>
        <label
          htmlFor="quick-text-entry"
          className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground"
        >
          <Sparkles className="size-4 text-primary" aria-hidden /> Ghi nhanh bằng chữ
        </label>
        <div className="flex items-center gap-2 rounded-2xl border-2 border-border bg-background py-1 pl-4 pr-1 transition-colors focus-within:border-primary">
          <input
            id="quick-text-entry"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="VD: cà phê 35k, xăng 50k"
            autoComplete="off"
            enterKeyHint="send"
            disabled={saving}
            aria-describedby="quick-text-hint"
            className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
          />
          <button
            type="submit"
            disabled={!canSave}
            aria-label="Ghi sổ"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40 cursor-pointer"
          >
            {saving ? <Loader2 className="size-5 animate-spin" /> : <SendHorizontal className="size-5" />}
          </button>
        </div>

        {entries.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2" aria-live="polite" aria-label="Sẽ ghi">
            {entries.map((entry, i) => {
              const cat = entry.categoryId ? categoryById.get(entry.categoryId) : undefined;
              const Icon = getCategoryIcon(cat?.icon ?? "Tag");
              const income = entry.type === "INCOME";
              if (!entry.amount) {
                return (
                  <li key={i} className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                    “{entry.raw}” · thiếu số tiền
                  </li>
                );
              }
              return (
                <li key={i} className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-muted/50 py-1 pl-1 pr-3 text-xs">
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-full bg-card"
                    style={{ color: cat?.color }}
                  >
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  <span className="truncate font-semibold">{cat?.name ?? "?"}</span>
                  <span className={cn("shrink-0 font-bold", income ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                    {income ? "+" : "-"}
                    {formatVND(entry.amount)}
                  </span>
                  {entry.note && <span className="hidden truncate text-muted-foreground sm:inline">· {entry.note}</span>}
                </li>
              );
            })}
          </ul>
        ) : null}

        <p id="quick-text-hint" className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
          Ghi vào {baseLabel}. Hiểu <b className="font-semibold text-foreground/80">35k</b>, <b className="font-semibold text-foreground/80">1tr2</b>,{" "}
          <b className="font-semibold text-foreground/80">1,5 triệu</b>; thêm “hôm qua” để đổi ngày; bắt đầu bằng “+” hoặc “lương” để ghi khoản thu.
        </p>
      </form>
    </section>
  );
}
