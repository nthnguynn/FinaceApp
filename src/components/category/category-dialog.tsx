"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCategorySchema, CreateCategoryInput } from "@/schemas/category";
import { createCategoryAction, updateCategoryAction, CategoryData } from "@/actions/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import {
  Loader2,
  X,
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
  Coins,
  BookOpen,
  Plane,
  Music,
  Zap,
  Coffee,
  Shirt,
} from "lucide-react";
import { Badminton } from "@/components/icons/badminton";

interface CategoryDialogProps {
  category?: CategoryData | null;
  defaultType?: "INCOME" | "EXPENSE";
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_ICONS = [
  { id: "Utensils", Icon: Utensils, label: "Ăn uống" },
  { id: "Car", Icon: Car, label: "Di chuyển" },
  { id: "ShoppingBag", Icon: ShoppingBag, label: "Mua sắm" },
  { id: "Gamepad2", Icon: Gamepad2, label: "Giải trí" },
  { id: "Badminton", Icon: Badminton, label: "Cầu lông" },
  { id: "Home", Icon: Home, label: "Nhà cửa" },
  { id: "HeartPulse", Icon: HeartPulse, label: "Sức khỏe" },
  { id: "Heart", Icon: Heart, label: "Tình yêu" },
  { id: "Tag", Icon: Tag, label: "Khác" },
  { id: "Briefcase", Icon: Briefcase, label: "Lương" },
  { id: "Gift", Icon: Gift, label: "Thưởng" },
  { id: "Coins", Icon: Coins, label: "Tiết kiệm" },
  { id: "Coffee", Icon: Coffee, label: "Cà phê" },
  { id: "BookOpen", Icon: BookOpen, label: "Học tập" },
  { id: "Plane", Icon: Plane, label: "Du lịch" },
  { id: "Music", Icon: Music, label: "Âm nhạc" },
  { id: "Zap", Icon: Zap, label: "Hóa đơn" },
  { id: "Shirt", Icon: Shirt, label: "Quần áo" },
];

const PRESET_COLORS = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#10B981",
  "#06B6D4",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#64748B",
];

export function CategoryDialog({
  category,
  defaultType = "EXPENSE",
  isOpen,
  onClose,
  onSuccess,
}: CategoryDialogProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      type: defaultType,
      color: defaultType === "INCOME" ? "#10B981" : "#EF4444",
      icon: defaultType === "INCOME" ? "Briefcase" : "Utensils",
      order: 0,
    },
  });

  const selectedType = watch("type");
  const selectedColor = watch("color");
  const selectedIcon = watch("icon");

  useEffect(() => {
    if (category) {
      setValue("name", category.name);
      setValue("type", category.type);
      setValue("color", category.color);
      setValue("icon", category.icon);
      setValue("order", category.order ?? 0);
    } else {
      reset({
        name: "",
        type: defaultType,
        color: defaultType === "INCOME" ? "#10B981" : "#EF4444",
        icon: defaultType === "INCOME" ? "Briefcase" : "Utensils",
        order: 0,
      });
    }
  }, [category, defaultType, isOpen, reset, setValue]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data: CreateCategoryInput) => {
    setLoading(true);

    try {
      let res;
      if (category) {
        res = await updateCategoryAction({ id: category.id, ...data });
      } else {
        res = await createCategoryAction(data);
      }

      if (!res.success) {
        toast.error(res.error || "Xử lý danh mục thất bại.");
      } else {
        toast.success(res.message || "Lưu danh mục thành công!");
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 pb-20 sm:p-4 animate-in fade-in-0">
      <div className="bg-card text-card-foreground border border-border/60 shadow-2xl rounded-2xl max-w-md w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Header Cố định trên cùng */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/40 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            {category ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
          </h2>
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
            {/* Loại danh mục: Thu nhập / Chi tiêu */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Loại danh mục</Label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/60">
                <button
                  type="button"
                  onClick={() => {
                    setValue("type", "EXPENSE");
                    if (!category) setValue("color", "#EF4444");
                  }}
                  className={`py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    selectedType === "EXPENSE"
                      ? "bg-rose-500 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🔴 Chi tiêu (Expense)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue("type", "INCOME");
                    if (!category) setValue("color", "#10B981");
                  }}
                  className={`py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    selectedType === "INCOME"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🟢 Thu nhập (Income)
                </button>
              </div>
            </div>

            {/* Tên danh mục & Thứ tự hiển thị */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Tên danh mục
                </Label>
                <Input
                  id="name"
                  placeholder="Nhập tên danh mục"
                  {...register("name")}
                  disabled={loading}
                  className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
                )}
              </div>

              <div className="col-span-1 space-y-1.5">
                <Label htmlFor="order" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Thứ tự
                </Label>
                <Input
                  id="order"
                  type="number"
                  min={0}
                  placeholder="0"
                  {...register("order")}
                  disabled={loading}
                  className={errors.order ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.order && (
                  <p className="text-xs text-destructive font-medium">{errors.order.message}</p>
                )}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground -mt-2">
              💡 Số nhỏ hơn sẽ hiển thị trước (VD: 0, 1, 2, 3...)
            </p>

            {/* Chọn Biểu tượng */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Biểu tượng</Label>
              <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 border border-border/50 rounded-xl">
                {PRESET_ICONS.map((item) => {
                  const IconComp = item.Icon;
                  const isSelected = selectedIcon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setValue("icon", item.id)}
                      className={`p-2 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 scale-105"
                          : "border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                      title={item.label}
                    >
                      <IconComp className="h-4.5 w-4.5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chọn Màu sắc */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Màu sắc nhận diện</Label>
              <div className="flex flex-wrap gap-2.5">
                {PRESET_COLORS.map((c) => {
                  const isSelected = selectedColor === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setValue("color", c)}
                      className={`h-7 w-7 rounded-full transition-all cursor-pointer ${
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
                "Lưu danh mục"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
