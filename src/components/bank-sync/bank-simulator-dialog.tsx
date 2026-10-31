"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  simulatePendingTransactionSchema,
  SimulatePendingTransactionInput,
} from "@/schemas/pending-transaction";
import { simulateBankTransactionAction } from "@/actions/pending-transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import {
  Landmark,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  FileText,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";

interface BankSimulatorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const POPULAR_BANKS = [
  { id: "MBBank", name: "MB Bank", color: "bg-blue-600" },
  { id: "Vietcombank", name: "Vietcombank", color: "bg-emerald-600" },
  { id: "Techcombank", name: "Techcombank", color: "bg-red-600" },
  { id: "ACB", name: "ACB", color: "bg-sky-600" },
  { id: "TPBank", name: "TPBank", color: "bg-purple-600" },
  { id: "VPBank", name: "VPBank", color: "bg-green-600" },
  { id: "MoMo", name: "Ví MoMo", color: "bg-pink-600" },
];

const PRESET_EXPENSES = [
  { amount: 45000, content: "Cơm trưa văn phòng" },
  { amount: 65000, content: "Highlands Coffee" },
  { amount: 150000, content: "Shopee Đơn hàng #7829" },
  { amount: 350000, content: "Đổ xăng & Grab di chuyển" },
  { amount: 1200000, content: "Thanh toán tiền điện & Internet" },
];

const PRESET_INCOMES = [
  { amount: 20000000, content: "Luong cong ty T08/2026" },
  { amount: 2500000, content: "Thuong KPI du an" },
  { amount: 500000, content: "Ban hang online - Thanh toan QR" },
  { amount: 1500000, content: "Ban be chuyen khoan tra tien an" },
];

export function BankSimulatorDialog({ isOpen, onClose, onSuccess }: BankSimulatorDialogProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SimulatePendingTransactionInput>({
    resolver: zodResolver(simulatePendingTransactionSchema),
    defaultValues: {
      type: "EXPENSE",
      amount: 65000,
      bankName: "MBBank",
      bankAccount: "0988776655",
      content: "Highlands Coffee - Thanh toan QR",
    },
  });

  const currentType = watch("type");
  const currentBank = watch("bankName");

  if (!isOpen) return null;

  const handleApplyPreset = (amount: number, content: string) => {
    setValue("amount", amount, { shouldValidate: true });
    setValue("content", content, { shouldValidate: true });
  };

  const onSubmit = async (data: SimulatePendingTransactionInput) => {
    setLoading(true);
    try {
      const res = await simulateBankTransactionAction(data);
      if (!res.success) {
        toast.error(res.error || "Giả lập giao dịch thất bại.");
      } else {
        toast.success(res.message || "Tạo biến động số dư thành công!");
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi bất ngờ khi giả lập.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl border border-border/80 sm:p-7 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                Giả Lập Biến Động Ngân Hàng
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                  Simulator
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mô phỏng tức thì biến động tiền ra/vào từ Vietcombank, MB, Techcombank...
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-5">
          {/* Loại giao dịch: Chuyển đi (EXPENSE) vs Nhận tiền (INCOME) */}
          <div className="grid grid-cols-2 gap-2.5 p-1 rounded-xl bg-muted/60 border border-border/40">
            <button
              type="button"
              onClick={() => {
                setValue("type", "EXPENSE");
                setValue("amount", 65000);
                setValue("content", "Highlands Coffee - Thanh toan QR");
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                currentType === "EXPENSE"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
              Tiền Chuyển Đi (Chi tiêu)
            </button>
            <button
              type="button"
              onClick={() => {
                setValue("type", "INCOME");
                setValue("amount", 20000000);
                setValue("content", "Luong cong ty T08/2026");
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                currentType === "INCOME"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowDownLeft className="h-4 w-4" />
              Tiền Nhận Đến (Thu nhập)
            </button>
          </div>

          {/* Chọn ngân hàng */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Chọn Ngân Hàng Mô Phỏng
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_BANKS.map((b) => {
                const isSelected = currentBank === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setValue("bankName", b.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                        : "bg-card border-border hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Số tiền */}
          <div className="space-y-1.5">
            <Label htmlFor="sim-amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Số Tiền Giao Dịch (VND)
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="sim-amount"
                type="number"
                placeholder="VD: 50000"
                className="pl-10 font-bold text-base text-foreground"
                {...register("amount")}
              />
            </div>
            {errors.amount && (
              <p className="text-xs font-medium text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Mẫu nhanh (Quick Presets) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>Gợi ý kịch bản nhanh:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(currentType === "EXPENSE" ? PRESET_EXPENSES : PRESET_INCOMES).map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p.amount, p.content)}
                  className="text-xs px-2.5 py-1 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40 transition-all text-left"
                >
                  <span className="font-bold">{p.amount.toLocaleString("vi-VN")} đ</span> - {p.content}
                </button>
              ))}
            </div>
          </div>

          {/* Nội dung chuyển khoản */}
          <div className="space-y-1.5">
            <Label htmlFor="sim-content" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Nội Dung Chuyển Khoản / SMS
            </Label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="sim-content"
                placeholder="VD: Chuyen khoan tien an trua..."
                className="pl-10 text-sm"
                {...register("content")}
              />
            </div>
            {errors.content && (
              <p className="text-xs font-medium text-destructive">{errors.content.message}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-sm font-semibold rounded-xl"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={`text-sm font-bold rounded-xl shadow-xs ${
                currentType === "EXPENSE"
                  ? "bg-rose-500 hover:bg-rose-600 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi biến động...
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Bắn Biến Động Số Dư
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
