"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, ChangePasswordInput } from "@/schemas/profile";
import { changePasswordAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { KeyRound, Lock, Loader2, Eye, EyeOff } from "lucide-react";

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // States toggle ẩn/hiện mật khẩu cho từng ô input
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    setLoading(true);

    try {
      const res = await changePasswordAction(data);
      if (!res.success) {
        toast.error(res.error || "Đổi mật khẩu thất bại.");
      } else {
        toast.success(res.message || "Đổi mật khẩu thành công. Vui lòng đăng nhập lại!");
        reset();
        setTimeout(() => {
          router.push("/login");
          router.refresh();
        }, 1500);
      }
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Mật khẩu hiện tại */}
        <div className="space-y-2">
          <Label htmlFor="currentPassword" className="text-sm font-medium flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-muted-foreground" /> Mật khẩu hiện tại
          </Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("currentPassword")}
              disabled={loading}
              className={`pr-10 ${
                errors.currentPassword ? "border-destructive focus-visible:ring-destructive" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              tabIndex={-1}
              title={showCurrentPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-xs text-destructive font-medium">{errors.currentPassword.message}</p>
          )}
        </div>

        {/* Mật khẩu mới */}
        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-sm font-medium flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" /> Mật khẩu mới
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("newPassword")}
              disabled={loading}
              className={`pr-10 ${
                errors.newPassword ? "border-destructive focus-visible:ring-destructive" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              tabIndex={-1}
              title={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-xs text-destructive font-medium">{errors.newPassword.message}</p>
          )}
        </div>

        {/* Xác nhận mật khẩu mới */}
        <div className="space-y-2">
          <Label htmlFor="confirmNewPassword" className="text-sm font-medium flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" /> Xác nhận mật khẩu mới
          </Label>
          <div className="relative">
            <Input
              id="confirmNewPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("confirmNewPassword")}
              disabled={loading}
              className={`pr-10 ${
                errors.confirmNewPassword ? "border-destructive focus-visible:ring-destructive" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              tabIndex={-1}
              title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmNewPassword && (
            <p className="text-xs text-destructive font-medium">{errors.confirmNewPassword.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={loading} variant="default" className="w-full sm:w-auto font-semibold">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang cập nhật mật khẩu...
          </>
        ) : (
          "Đổi mật khẩu"
        )}
      </Button>
    </form>
  );
}
