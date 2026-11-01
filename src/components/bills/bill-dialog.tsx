"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { saveBillAction, BillPlan } from "@/actions/bill";
import { CategoryData } from "@/actions/category";
import { DatePicker } from "@/components/ui/date-picker";
import { MonthPicker } from "@/components/ui/month-picker";
import { toast } from "@/components/ui/toast";
import { BillRepeat, localDateKey, monthKey, parseDateKey, REPEAT_LABELS, totalOccurrences } from "@/lib/bills";
import { getCategoryIcon } from "@/lib/category-icons";
import { shiftMonth } from "@/lib/date-vn";
import { normalizeVN } from "@/lib/quick-entry";
import { cn, formatNumberVN, formatVND } from "@/lib/utils";

interface BillDialogProps {
  isOpen: boolean;
  /** Có giá trị = sửa hóa đơn */
  bill: Pick<BillPlan, "billId" | "name" | "amount" | "repeat" | "note" | "startDate" | "endMonth" | "category"> | null;
  categories: CategoryData[];
  defaultDate: Date;
  onClose: () => void;
  onSaved: () => void;
}

const label = "text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground";
const field =
  "h-12 w-full rounded-2xl border border-border bg-background px-4 text-base font-semibold outline-none transition-colors focus:border-primary";
const REPEATS: BillRepeat[] = ["MONTHLY", "WEEKLY", "YEARLY", "NONE"];

export function BillDialog({ isOpen, bill, categories, defaultDate, onClose, onSaved }: BillDialogProps) {
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");
  const fallbackCategory =
    expenseCategories.find((c) => normalizeVN(c.name).includes("hoa don"))?.id ?? expenseCategories[0]?.id ?? "";

  const [name, setName] = useState("");
  const [digits, setDigits] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState<Date>(defaultDate);
  const [repeat, setRepeat] = useState<BillRepeat>("MONTHLY");
  const [endMonth, setEndMonth] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Nạp dữ liệu khi mở (setTimeout: không setState đồng bộ trong effect)
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      if (bill) {
        const { year, month, day } = parseDateKey(bill.startDate);
        setName(bill.name);
        setDigits(String(Math.round(bill.amount)));
        setCategoryId(bill.category.id);
        setDate(new Date(year, month - 1, day));
        setRepeat(bill.repeat);
        setEndMonth(bill.endMonth);
        setNote(bill.note ?? "");
      } else {
        setName("");
        setDigits("");
        setCategoryId(fallbackCategory);
        setDate(defaultDate);
        setRepeat("MONTHLY");
        setEndMonth(null);
        setNote("");
      }
    }, 0);
    return () => clearTimeout(t);
  }, [isOpen, bill, defaultDate, fallbackCategory]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const startKey = localDateKey(date);
  const term = repeat !== "NONE" && endMonth ? totalOccurrences(startKey, repeat, endMonth) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await saveBillAction(
        { name, amount: Number(digits || 0), categoryId, startDate: localDateKey(date), repeat, endMonth, note },
        bill?.billId
      );
      if (!res.success) {
        toast.error(res.error || "Không lưu được hóa đơn.");
        return;
      }
      toast.success(res.message || "Đã lưu hóa đơn.");
      onSaved();
      onClose();
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Đóng"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-in fade-in-0"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bill-dialog-title"
        className="relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[2rem] bg-card shadow-2xl animate-sheet-up sm:max-h-[90dvh] sm:max-w-md sm:rounded-[2rem] sm:animate-in sm:fade-in-0 sm:zoom-in-95"
      >
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 pb-4 pt-5 short:space-y-3.5 short:pt-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <h2 id="bill-dialog-title" className="text-xl font-extrabold tracking-tight">
                {bill ? "Sửa hóa đơn" : "Thêm hóa đơn"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng"
                className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="bill-name" className={label}>
                Tên hóa đơn
              </label>
              <input
                id="bill-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Tiền nhà, Netflix, Internet"
                maxLength={60}
                className={field}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="bill-amount" className={label}>
                Số tiền mỗi kỳ
              </label>
              <div className="flex items-center gap-2 rounded-2xl border-2 border-foreground/70 bg-background px-4 py-2 focus-within:border-primary">
                <input
                  id="bill-amount"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0"
                  value={digits ? formatNumberVN(Number(digits)) : ""}
                  onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 13))}
                  className="min-w-0 flex-1 bg-transparent text-2xl font-extrabold outline-none placeholder:text-muted-foreground/50"
                />
                <span className="text-xl font-extrabold text-muted-foreground" aria-hidden>
                  ₫
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className={label}>{repeat === "NONE" ? "Ngày đến hạn" : "Kỳ đầu tiên"}</span>
              <div className="w-64 max-w-full">
                <DatePicker id="bill-date" value={date} onChange={setDate} />
              </div>
            </div>

            <div className="space-y-2">
              <span className={label}>Lặp lại</span>
              <div className="grid grid-cols-4 gap-1 rounded-2xl bg-muted p-1" role="radiogroup" aria-label="Lặp lại">
                {REPEATS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={repeat === r}
                    onClick={() => setRepeat(r)}
                    className={cn(
                      "rounded-xl px-1 py-2 text-xs font-bold transition-colors sm:text-sm cursor-pointer",
                      repeat === r ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {REPEAT_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>

            {repeat !== "NONE" && (
              <div className="space-y-2">
                <span className={label}>Kết thúc</span>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1" role="radiogroup" aria-label="Kết thúc">
                    {[
                      { value: false, text: "Không thời hạn" },
                      { value: true, text: "Đến tháng" },
                    ].map((opt) => (
                      <button
                        key={opt.text}
                        type="button"
                        role="radio"
                        aria-checked={!!endMonth === opt.value}
                        onClick={() => {
                          if (!opt.value) return setEndMonth(null);
                          // Mặc định 12 kỳ tính từ tháng bắt đầu
                          if (!endMonth) {
                            const end = shiftMonth(date.getFullYear(), date.getMonth() + 1, 11);
                            setEndMonth(monthKey(end.year, end.month));
                          }
                        }}
                        className={cn(
                          "rounded-xl px-3 py-2 text-xs font-bold transition-colors sm:text-sm cursor-pointer",
                          !!endMonth === opt.value ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                  {endMonth && (
                    <div className="w-44">
                      <MonthPicker value={endMonth} onChange={setEndMonth} />
                    </div>
                  )}
                </div>
                {term !== null && (
                  <p className={cn("text-xs", term > 0 ? "text-muted-foreground" : "text-destructive")}>
                    {term > 0
                      ? `Tổng ${term} kỳ · ${formatVND(term * Number(digits || 0))}`
                      : "Tháng kết thúc phải từ kỳ đầu tiên trở đi."}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <span className={label}>Ghi vào danh mục chi</span>
              <div className="grid max-h-[9.5rem] grid-cols-4 gap-2 overflow-y-auto p-0.5" role="radiogroup" aria-label="Danh mục">
                {expenseCategories.map((c) => {
                  const Icon = getCategoryIcon(c.icon);
                  const active = categoryId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setCategoryId(c.id)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-2xl border-2 px-1 py-2 text-[11px] font-semibold transition-colors cursor-pointer",
                        active ? "border-primary bg-primary/10 text-primary" : "border-transparent bg-muted/70 text-foreground/80"
                      )}
                    >
                      <span className="flex size-8 items-center justify-center rounded-full bg-card" style={{ color: c.color }}>
                        <Icon className="size-4" />
                      </span>
                      <span className="w-full truncate text-center">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="bill-note" className={label}>
                Ghi chú
              </label>
              <input
                id="bill-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Không bắt buộc"
                maxLength={200}
                className={cn(field, "font-normal")}
              />
            </div>
          </div>

          <div className="shrink-0 border-t border-border/70 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
            <button
              type="submit"
              disabled={saving}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-hero text-base font-bold text-hero-foreground shadow-lg disabled:opacity-70 short:h-12 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Đang lưu...
                </>
              ) : (
                "Lưu hóa đơn"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
