"use client";

import { useState } from "react";
import { unstable_rethrow, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";

import { loginSchema, LoginInput } from "@/schemas/auth";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);
    setServerError(null);

    try {
      const result = await loginAction(data);
      if (result.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setServerError(result.error || "Đăng nhập thất bại");
      }
    } catch (err) {
      // loginAction gọi redirect() khi thành công: để Next tự xử lý điều hướng
      unstable_rethrow(err);
      console.error(err);
      setServerError("Đã xảy ra lỗi không xác định. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border border-border bg-card/85 backdrop-blur-xl shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)] rounded-3xl overflow-hidden">
      <CardHeader className="space-y-1.5 text-center border-b border-border/60 pb-6 pt-6">
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          Đăng nhập
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Chào mừng trở lại! Vui lòng nhập thông tin tài khoản.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {serverError && (
          <div className="mb-4 rounded-xl bg-rose-500/15 p-3 text-sm font-medium text-rose-400 border border-rose-500/20 animate-in fade-in-50">
            {serverError}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Username / Email Field */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/85 font-medium">Tên đăng nhập hoặc Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" aria-hidden />
                      <Input
                        placeholder="ten_dang_nhap hoặc email@example.com"
                        type="text"
                        className="pl-10 h-11 bg-background/60 border-border text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-ring/50 rounded-xl"
                        disabled={isLoading}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-rose-400" />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/85 font-medium">Mật khẩu</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" aria-hidden />
                      <Input
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        className="pl-10 pr-10 h-11 bg-background/60 border-border text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-ring/50 rounded-xl"
                        disabled={isLoading}
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-rose-400" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 border-0 rounded-xl transition-[background-color,transform] active:scale-[0.99]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
