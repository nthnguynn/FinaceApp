"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, UpdateProfileInput } from "@/schemas/profile";
import { updateProfileAction, UserProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { User, Mail, AtSign, Loader2 } from "lucide-react";

interface ProfileFormProps {
  initialUser: UserProfile;
}

export function ProfileForm({ initialUser }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: initialUser.name || "",
      username: initialUser.username || "",
      email: initialUser.email || "",
    },
  });

  const onSubmit = async (data: UpdateProfileInput) => {
    setLoading(true);

    try {
      const res = await updateProfileAction(data);
      if (!res.success) {
        toast.error(res.error || "Cập nhật thất bại.");
      } else {
        toast.success(res.message || "Cập nhật thông tin thành công. Vui lòng đăng nhập lại!");
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
        {/* Họ và tên */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" /> Họ và tên
          </Label>
          <Input
            id="name"
            placeholder="Nguyễn Văn A"
            {...register("name")}
            disabled={loading}
            className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.name && (
            <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
          )}
        </div>

        {/* Tên đăng nhập */}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
            <AtSign className="h-4 w-4 text-muted-foreground" /> Tên đăng nhập (Username)
          </Label>
          <Input
            id="username"
            placeholder="nguyenvana"
            {...register("username")}
            disabled={loading}
            className={errors.username ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.username && (
            <p className="text-xs text-destructive font-medium">{errors.username.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" /> Địa chỉ Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="example@domain.com"
            {...register("email")}
            disabled={loading}
            className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.email && (
            <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full sm:w-auto font-semibold">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu thay đổi...
          </>
        ) : (
          "Lưu thay đổi thông tin"
        )}
      </Button>
    </form>
  );
}
