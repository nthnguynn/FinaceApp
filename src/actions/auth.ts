"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie, destroySessionCookie } from "@/lib/auth";
import { loginSchema, LoginInput } from "@/schemas/auth";

export interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action: Xử lý Đăng nhập
 */
export async function loginAction(data: LoginInput): Promise<ActionResult> {
  // 1. Validate dữ liệu đầu vào
  const validation = loginSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Dữ liệu đăng nhập không hợp lệ",
    };
  }

  const { username, password } = validation.data;

  try {
    // 2. Tìm User trong Database (hỗ trợ cả Tên đăng nhập hoặc Email)
    const identifier = username.toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
      },
    });

    if (!user) {
      return {
        success: false,
        error: "Tên đăng nhập / Email hoặc mật khẩu không chính xác.",
      };
    }

    // 3. So sánh mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return {
        success: false,
        error: "Tên đăng nhập / Email hoặc mật khẩu không chính xác.",
      };
    }

    // 4. Tạo Session Token và lưu vào Cookie
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      username: user.username || undefined,
      name: user.name,
    });

    await setSessionCookie(token);
  } catch (error) {
    console.error("Login Error:", error);
    return {
      success: false,
      error: "Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại sau.",
    };
  }

  redirect("/dashboard");
}

/**
 * Server Action: Xử lý Đăng xuất
 */
export async function logoutAction(): Promise<void> {
  await destroySessionCookie();
  redirect("/login");
}
