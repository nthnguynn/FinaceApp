"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Delete, Loader2, Plus, X } from "lucide-react";
import { createTransactionSchema, CreateTransactionInput } from "@/schemas/transaction";
import { createTransactionAction, updateTransactionAction, TransactionData } from "@/actions/transaction";
import { CategoryData } from "@/actions/category";
import { CategoryDialog } from "@/components/category/category-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "@/components/ui/toast";
import { getCategoryIcon } from "@/lib/category-icons";
import { cn, formatNumberVN } from "@/lib/utils";

interface TransactionDialogProps {
  transaction?: TransactionData | null;
  categories: CategoryData[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onRefreshCategories?: () => void;
  /** Ngày mặc định khi thêm mới (VD: ngày đang chọn trên lịch) */
  defaultDate?: Date;
}

const MAX_DIGITS = 13;
const KEYPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "back"] as const;

const label = "text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground";

export function TransactionDialog({
  transaction,
  categories,
  isOpen,
  onClose,
  onSuccess,
  onRefreshCategories,
  defaultDate,
}: TransactionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [digits, setDigits] = useState("");
  const [showNote, setShowNote] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: { type: "EXPENSE", amount: 0, categoryId: "", date: new Date(), note: "" },
  });

  const selectedType = watch("type");
  const selectedCategory = watch("categoryId");
  const currentDate = watch("date");

  const setAmountDigits = (next: string) => {
    const clean = next.replace(/\D/g, "").replace(/^0+/, "").slice(0, MAX_DIGITS);
    setDigits(clean);
    setValue("amount", clean ? Number(clean) : 0, { shouldValidate: !!errors.amount });
  };

  const pressKey = (key: (typeof KEYPAD)[number]) => {
    if (key === "back") setAmountDigits(digits.slice(0, -1));
    else setAmountDigits(digits + key);
  };

  // Mở bảng: nạp dữ liệu giao dịch đang sửa hoặc đặt lại form trống
  useEffect(() => {
    if (!isOpen) return;
    if (transaction) {
      reset({
        type: transaction.type,
        amount: transaction.amount,
        categoryId: transaction.categoryId,
        date: new Date(transaction.date),
        note: transaction.note || "",
      });
    } else {
      reset({ type: "EXPENSE", amount: 0, categoryId: "", date: defaultDate ?? new Date(), note: "" });
    }
    // Đồng bộ state hiển thị theo dữ liệu vừa nạp (chạy sau khi mở, không phải mỗi lần render)
    const t = setTimeout(() => {
      setDigits(transaction ? String(Math.round(transaction.amount)) : "");
      setShowNote(!!transaction?.note);
    }, 0);
    return () => clearTimeout(t);
  }, [transaction, isOpen, reset, defaultDate]);

  // Khóa cuộn trang + Esc để đóng
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

  const isIncome = selectedType === "INCOME";
  const filteredCategories = categories.filter((c) => c.type === selectedType);
  const title = transaction ? "Sửa giao dịch" : isIncome ? "Thêm khoản thu" : "Thêm khoản chi";

  const onSubmit = async (data: CreateTransactionInput) => {
    setLoading(true);
    try {
      const res = transaction
        ? await updateTransactionAction({ id: transaction.id, ...data })
        : await createTransactionAction(data);

      if (!res.success) {
        toast.error(res.error || "Thao tác thất bại.");
      } else {
        toast.success(res.message || "Ghi nhận giao dịch thành công!");
        onSuccess();
        onClose();
      }
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
          aria-labelledby="transaction-sheet-title"
          className="relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[2rem] bg-card text-card-foreground shadow-2xl animate-sheet-up sm:max-h-[90dvh] sm:max-w-md sm:rounded-[2rem] sm:animate-in sm:fade-in-0 sm:zoom-in-95"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 pb-4 pt-5 short:space-y-3.5 short:pb-3 short:pt-4 sm:px-6">
              {/* Tiêu đề */}
              <div className="flex items-center justify-between gap-3">
                <h2 id="transaction-sheet-title" className="text-xl font-extrabold tracking-tight">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Đóng"
                  className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Chi / Thu */}
              <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1" role="radiogroup" aria-label="Loại giao dịch">
                {(["EXPENSE", "INCOME"] as const).map((type) => {
                  const active = selectedType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setValue("type", type);
                        setValue("categoryId", "");
                      }}
                      className={cn(
                        "rounded-xl py-2 text-sm font-bold transition-colors cursor-pointer",
                        active
                          ? type === "EXPENSE"
                            ? "bg-card text-rose-600 shadow-xs dark:text-rose-400"
                            : "bg-card text-emerald-600 shadow-xs dark:text-emerald-400"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {type === "EXPENSE" ? "Chi tiêu" : "Thu nhập"}
                    </button>
                  );
                })}
              </div>

              {/* Số tiền */}
              <div className="space-y-2">
                <label htmlFor="amount" className={label}>
                  Bao nhiêu?
                </label>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border-2 bg-background px-4 py-3 transition-colors focus-within:border-primary short:py-2",
                    errors.amount ? "border-destructive" : "border-foreground/70"
                  )}
                >
                  <input
                    id="amount"
                    // Ưu tiên bàn phím số bên dưới trên di động; máy tính vẫn gõ trực tiếp được
                    inputMode="none"
                    autoComplete="off"
                    placeholder="0"
                    value={digits ? formatNumberVN(Number(digits)) : ""}
                    onChange={(e) => setAmountDigits(e.target.value)}
                    disabled={loading}
                    className="min-w-0 flex-1 bg-transparent text-3xl font-extrabold tracking-tight outline-none placeholder:text-muted-foreground/50"
                  />
                  <span className="text-2xl font-extrabold text-muted-foreground" aria-hidden>
                    ₫
                  </span>
                </div>
                {errors.amount && <p className="text-xs font-medium text-destructive">{errors.amount.message}</p>}
              </div>

              {/* Danh mục */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={label}>{isIncome ? "Từ đâu?" : "Cho việc gì?"}</span>
                  <button
                    type="button"
                    onClick={() => setIsCategoryDialogOpen(true)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/15 cursor-pointer"
                  >
                    <Plus className="size-3.5" /> Danh mục
                  </button>
                </div>

                {filteredCategories.length === 0 ? (
                  <p className="rounded-2xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                    Chưa có danh mục nào — bấm “+ Danh mục” để tạo.
                  </p>
                ) : (
                  <div className="grid max-h-[11.5rem] grid-cols-4 gap-2 overflow-y-auto p-0.5" role="radiogroup" aria-label="Danh mục">
                    {filteredCategories.map((c) => {
                      const Icon = getCategoryIcon(c.icon);
                      const active = selectedCategory === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setValue("categoryId", c.id, { shouldValidate: !!errors.categoryId })}
                          className={cn(
                            "flex flex-col items-center gap-1.5 rounded-2xl border-2 px-1 py-2.5 text-[11px] font-semibold transition-colors cursor-pointer",
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-transparent bg-muted/70 text-foreground/80 hover:bg-muted"
                          )}
                        >
                          <span
                            className="flex size-9 items-center justify-center rounded-full bg-card"
                            style={{ color: c.color }}
                          >
                            <Icon className="size-[18px]" />
                          </span>
                          <span className="w-full truncate text-center">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {errors.categoryId && <p className="text-xs font-medium text-destructive">{errors.categoryId.message}</p>}
              </div>

              {/* Ngày + ghi chú */}
              <div className="flex flex-wrap items-center gap-3">
                <span className={label}>Ngày</span>
                <div className="w-44">
                  <DatePicker
                    id="transactionDate"
                    value={currentDate}
                    onChange={(d) => setValue("date", d)}
                    position="top"
                  />
                </div>
                {!showNote && (
                  <button
                    type="button"
                    onClick={() => setShowNote(true)}
                    className="ml-auto inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Plus className="size-3.5" /> Ghi chú
                  </button>
                )}
              </div>
              {showNote && (
                <input
                  {...register("note")}
                  placeholder="Ghi chú (không bắt buộc)"
                  disabled={loading}
                  className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-base outline-none focus:border-primary sm:text-sm"
                />
              )}
            </div>

            {/* Bàn phím số + Lưu */}
            <div className="shrink-0 space-y-3 rounded-t-[1.75rem] bg-muted/60 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 short:space-y-2 short:pb-[max(0.75rem,env(safe-area-inset-bottom))] short:pt-2.5 sm:px-6">
              <div className="grid grid-cols-3 gap-2 short:gap-1.5">
                {KEYPAD.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => pressKey(key)}
                    disabled={loading}
                    aria-label={key === "back" ? "Xóa số cuối" : undefined}
                    className="flex h-12 items-center justify-center rounded-xl bg-card text-lg font-bold shadow-xs transition-transform active:scale-95 short:h-10 cursor-pointer"
                  >
                    {key === "back" ? <Delete className="size-5 text-rose-500" /> : key}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-hero text-base font-bold text-hero-foreground shadow-lg transition-opacity hover:opacity-95 disabled:opacity-70 short:h-12 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Đang lưu...
                  </>
                ) : transaction ? (
                  "Lưu thay đổi"
                ) : (
                  "Lưu"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CategoryDialog
        defaultType={selectedType}
        isOpen={isCategoryDialogOpen}
        onClose={() => setIsCategoryDialogOpen(false)}
        onSuccess={async () => {
          if (onRefreshCategories) await onRefreshCategories();
        }}
      />
    </>
  );
}
