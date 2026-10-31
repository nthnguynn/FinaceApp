"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  approvePendingTransactionSchema,
  ApprovePendingTransactionInput,
} from "@/schemas/pending-transaction";
import {
  PendingTransactionData,
  approvePendingTransactionAction,
  ignorePendingTransactionAction,
} from "@/actions/pending-transaction";
import { CategoryData } from "@/actions/category";
import { CategoryDialog } from "@/components/category/category-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import {
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Home,
  HeartPulse,
  Heart,
  Tag,
  Briefcase,
  Gift,
  TrendingUp,
  Coins,
  Coffee,
  BookOpen,
  Plane,
  Music,
  Zap,
  Shirt,
  DollarSign,
  FileText,
  CalendarDays,
  Plus,
  Loader2,
  X,
  Landmark,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { Badminton } from "@/components/icons/badminton";

interface QuickProcessModalProps {
  pendingTx: PendingTransactionData | null;
  categories: CategoryData[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onRefreshCategories?: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Badminton,
  Home,
  HeartPulse,
  Heart,
  Tag,
  Briefcase,
  Gift,
  TrendingUp,
  Coins,
  Coffee,
  BookOpen,
  Plane,
  Music,
  Zap,
  Shirt,
};

export function QuickProcessModal({
  pendingTx,
  categories,
  isOpen,
  onClose,
  onSuccess,
  onRefreshCategories,
}: QuickProcessModalProps) {
  const [loading, setLoading] = useState(false);
  const [ignoring, setIgnoring] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ApprovePendingTransactionInput>({
    resolver: zodResolver(approvePendingTransactionSchema),
    defaultValues: {
      pendingId: "",
      type: "EXPENSE",
      amount: 0,
      categoryId: "",
      date: new Date(),
      note: "",
    },
  });

  const selectedCategoryId = watch("categoryId");
  const currentType = pendingTx?.type || "EXPENSE";

  // Khi mở dialog hoặc pendingTx thay đổi, tự động điền form
  useEffect(() => {
    if (pendingTx && isOpen) {
      reset({
        pendingId: pendingTx.id,
        type: pendingTx.type,
        amount: pendingTx.amount,
        categoryId: "", // Người dùng tự chọn danh mục
        date: new Date(pendingTx.createdAt),
        note: "", // Người dùng tự nhập ghi chú
      });
    }
  }, [pendingTx, isOpen, categories, reset]);

  if (!isOpen || !pendingTx) return null;

  const filteredCategories = categories.filter((c) => c.type === currentType);

  const onSubmit = async (data: ApprovePendingTransactionInput) => {
    setLoading(true);
    try {
      const res = await approvePendingTransactionAction(data);
      if (!res.success) {
        toast.error(res.error || "Không thể duyệt giao dịch.");
      } else {
        toast.success(res.message || "Đã tạo giao dịch thành công!");
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi bất ngờ.");
    } finally {
      setLoading(false);
    }
  };

  const handleIgnore = async () => {
    if (!pendingTx) return;
    setIgnoring(true);
    try {
      const res = await ignorePendingTransactionAction(pendingTx.id);
      if (!res.success) {
        toast.error(res.error || "Bỏ qua giao dịch thất bại.");
      } else {
        toast.info("Đã bỏ qua giao dịch biến động số dư này.");
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi bỏ qua giao dịch.");
    } finally {
      setIgnoring(false);
    }
  };

  const isExpense = currentType === "EXPENSE";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in-0 duration-200">
        <div className="relative w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl border border-border/80 sm:p-7 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  isExpense
                    ? "bg-rose-500/10 text-rose-500"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {isExpense ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownLeft className="h-6 w-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      isExpense
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                    }`}
                  >
                    {isExpense ? "Biến động chi tiêu" : "Biến động thu nhập"}
                  </span>
                  {pendingTx.bankName && (
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Landmark className="h-3 w-3" />
                      {pendingTx.bankName}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold tracking-tight text-foreground mt-1">
                  {isExpense ? "Hoàn Tất Hóa Đơn Chi Tiêu" : "Xác Nhận Nguồn Thu Nhập"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Số tiền đã được tự động điền sẵn. Vui lòng chọn danh mục để lưu vào Ví.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full p-2 h-8 w-8 hover:bg-muted cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4.5 mt-5">
            {/* Banner hiển thị số tiền lớn tự động điền */}
            <div
              className={`p-4 rounded-2xl border text-center ${
                isExpense
                  ? "bg-rose-500/5 border-rose-500/20"
                  : "bg-emerald-500/5 border-emerald-500/20"
              }`}
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isExpense ? "Số tiền chuyển đi" : "Số tiền nhận được"}
              </p>
              <div
                className={`text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight ${
                  isExpense ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {isExpense ? "-" : "+"}
                {pendingTx.amount.toLocaleString("vi-VN")}{" "}
                <span className="text-sm font-semibold text-muted-foreground">VND</span>
              </div>
              {pendingTx.transactionCode && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Mã GD: <span className="font-mono">{pendingTx.transactionCode}</span>
                </p>
              )}
            </div>

            {/* Input số tiền (có thể tinh chỉnh nếu muốn) */}
            <div className="space-y-1.5">
              <Label htmlFor="approve-amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Số Tiền (VND)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="approve-amount"
                  type="number"
                  placeholder="0"
                  className="pl-10 font-bold text-base"
                  {...register("amount")}
                />
              </div>
              {errors.amount && (
                <p className="text-xs font-medium text-destructive">{errors.amount.message}</p>
              )}
            </div>

            {/* Chọn Danh Mục Thu / Chi (1-Chạm) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Chọn Danh Mục {isExpense ? "Chi Tiêu" : "Thu Nhập"} <span className="text-destructive">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => setIsCategoryDialogOpen(true)}
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Tạo danh mục mới
                </button>
              </div>

              {filteredCategories.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
                  Chưa có danh mục phù hợp. Vui lòng nhấn “Tạo danh mục mới”.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1">
                  {filteredCategories.map((cat) => {
                    const Icon = ICON_MAP[cat.icon] || Tag;
                    const isSelected = selectedCategoryId === cat.id;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setValue("categoryId", cat.id, { shouldValidate: true })}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-bold shadow-xs scale-[1.02]"
                            : "border-border/60 bg-card hover:bg-muted/50 text-foreground"
                        }`}
                      >
                        <div
                          className="p-1.5 rounded-lg shrink-0 text-white"
                          style={{ backgroundColor: cat.color }}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs truncate">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {errors.categoryId && (
                <p className="text-xs font-medium text-destructive">{errors.categoryId.message}</p>
              )}
            </div>

            {/* Ghi chú & Nội dung */}
            <div className="space-y-1.5">
              <Label htmlFor="approve-note" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Ghi Chú / Nội Dung
              </Label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="approve-note"
                  placeholder="Nhập ghi chú (Tùy chọn)"
                  className="pl-10 text-sm"
                  {...register("note")}
                />
              </div>
            </div>

            {/* Ngày giao dịch */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Ngày Giao Dịch
              </Label>
              <DatePicker
                value={watch("date")}
                onChange={(d) => setValue("date", d, { shouldValidate: true })}
              />
            </div>

            {/* Footer Buttons - Đồng bộ style giống Form Thêm Giao Dịch */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                disabled={ignoring || loading}
                onClick={handleIgnore}
                className="cursor-pointer"
              >
                {ignoring ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang bỏ qua...
                  </>
                ) : (
                  "Bỏ qua"
                )}
              </Button>

              <Button
                type="submit"
                disabled={loading || ignoring}
                className="font-bold cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...
                  </>
                ) : (
                  "Lưu giao dịch"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal tạo danh mục phụ */}
      <CategoryDialog
        isOpen={isCategoryDialogOpen}
        onClose={() => setIsCategoryDialogOpen(false)}
        onSuccess={() => {
          setIsCategoryDialogOpen(false);
          if (onRefreshCategories) onRefreshCategories();
        }}
        defaultType={currentType}
      />
    </>
  );
}
