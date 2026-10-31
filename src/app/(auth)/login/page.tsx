import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  description: "Trang đăng nhập hệ thống quản lý tài chính",
};

export default function LoginPage() {
  return <LoginForm />;
}
