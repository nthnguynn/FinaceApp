"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateWalletSchema, UpdateWalletInput } from "@/schemas/wallet";
import { WalletData, updateWalletAction } from "@/actions/wallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import {
  Wallet,
  CreditCard,
  PiggyBank,
  Coins,
  Landmark,
  Banknote,
  Vault,
  Loader2,
  X,
  DollarSign,
} from "lucide-react";
import { formatVND } from "@/lib/utils";

interface EditWalletDialogProps {
  wallet: WalletData;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_ICONS = [
  { id: "Wallet", Icon: Wallet, label: "Ví tiền" },
  { id: "CreditCard", Icon: CreditCard, label: "Thẻ ngân hàng" },
  { id: "PiggyBank", Icon: PiggyBank, label: "Heo đất" },
  { id: "Coins", Icon: Coins, label: "Tiền xu" },
  { id: "Landmark", Icon: Landmark, label: "Tài khoản" },
  { id: "Banknote", Icon: Banknote, label: "Tiền mặt" },
  { id: "Vault", Icon: Vault, label: "Két sắt" },
];

const PRESET_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#64748B",
];

export function EditWalletDialog({
  wallet,
  isOpen,
  onClose,
  onSuccess,
}: EditWalletDialogProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateWalletInput>({
    resolver: zodResolver(updateWalletSchema),
    defaultValues: {
      name: wallet.name,
      balance: wallet.balance,
      color: wallet.color,
      icon: wallet.icon,
    },
  });

  const selectedColor = watch("color");
  const selectedIcon = watch("icon");
  const currentBalance = watch("balance");

  useEffect(() => {
    if (wallet) {
      setValue("name", wallet.name);
      setValue("balance", wallet.balance);
      setValue("color", wallet.color);
      setValue("icon", wallet.icon);
    }
  }, [wallet, isOpen, setValue]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data: UpdateWalletInput) => {
    setLoading(true);

    try {
      const res = await updateWalletAction(data);

      if (!res.success) {
        toast.error(res.error || "Cập nhật ví thất bại.");
      } else {
        toast.success(res.message || "Cập nhật ví chính thành công!");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 pb-20 sm:p-4 animate-in fade-in-0">
      <div className="bg-card text-card-foreground border border-border/60 shadow-2xl rounded-2xl max-w-lg w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Header Cố định trên cùng */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/40 shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Cấu hình Ví chính</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Thay đổi tên ví, số dư ban đầu và giao diện nhận diện
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form bọc toàn bộ với Body cuộn và Footer cố định */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col min-h-0 flex-1">
          {/* Body cuộn độc lập */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
            {/* Tên ví */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Tên ví
              </Label>
              <Input
                id="name"
                placeholder="Ví chính"
                {...register("name")}
                disabled={loading}
                className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
              )}
            </div>

            {/* Số dư (VND) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="balance" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-muted-foreground" /> Số dư ban đầu (VND)
                </Label>
                <span className="text-base font-extrabold font-mono text-primary">
                  {formatVND(
                    Number(currentBalance) || 0
                  )}
                </span>
              </div>
              <Input
                id="balance"
                type="number"
                step="1000"
                placeholder="VD: 5000000"
                {...register("balance")}
                disabled={loading}
                className={`text-lg font-semibold ${
                  errors.balance ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
              />
              {errors.balance && (
                <p className="text-xs text-destructive font-medium">{errors.balance.message}</p>
              )}
            </div>

            {/* Biểu tượng ví */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Biểu tượng ví</Label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 p-1 border border-border/50 rounded-xl">
                {PRESET_ICONS.map((item) => {
                  const IconComp = item.Icon;
                  const isSelected = selectedIcon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setValue("icon", item.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 scale-105"
                          : "border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                      title={item.label}
                    >
                      <IconComp className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Màu sắc thẻ ví */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Màu sắc chủ đạo</Label>
              <div className="flex flex-wrap gap-2.5">
                {PRESET_COLORS.map((c) => {
                  const isSelected = selectedColor === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setValue("color", c)}
                      className={`h-8 w-8 rounded-full transition-all cursor-pointer ${
                        isSelected ? "ring-4 ring-offset-2 ring-offset-background ring-primary scale-110" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Cố định dưới cùng */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-border/40 bg-card shrink-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="cursor-pointer">
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="font-bold cursor-pointer">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
