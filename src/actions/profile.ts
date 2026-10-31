"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession, destroySessionCookie } from "@/lib/auth";
import {
  updateProfileSchema,
  changePasswordSchema,
  UpdateProfileInput,
  ChangePasswordInput,
} from "@/schemas/profile";

export interface ActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string | null;
  email: string;
  createdAt: Date;
}

/**
 * Server Action: Lấy thông tin chi tiết của người dùng hiện tại
 */
export async function getUserProfileAction(): Promise<{
  success: boolean;
  user?: UserProfile;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return { success: false, error: "Không tìm thấy thông tin tài khoản." };
    }

    return { success: true, user };
  } catch (error) {
    console.error("Get Profile Error:", error);
    return { success: false, error: "Lỗi hệ thống khi tải thông tin tài khoản." };
  }
}

/**
 * Server Action: Cập nhật Thông tin cá nhân (Họ tên, Tên đăng nhập, Email)
 * Sau khi cập nhật thành công, hủy session cookie và yêu cầu người dùng đăng nhập lại.
 */
export async function updateProfileAction(data: UpdateProfileInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
  }

  // 1. Validate dữ liệu đầu vào
  const validation = updateProfileSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Dữ liệu thông tin không hợp lệ",
    };
  }

  const { name, username, email } = validation.data;
  const normalizedEmail = email.toLowerCase();
  const normalizedUsername = username.toLowerCase();

  try {
    // 2. Kiểm tra Email hoặc Username đã bị trùng bởi tài khoản khác hay chưa
    const existingUser = await prisma.user.findFirst({
      where: {
        AND: [
          { id: { not: session.userId } },
          {
            OR: [
              { email: normalizedEmail },
              { username: normalizedUsername },
            ],
          },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === normalizedEmail) {
        return {
          success: false,
          error: "Email này đã được sử dụng bởi một tài khoản khác.",
        };
      }
      return {
        success: false,
        error: "Tên đăng nhập này đã tồn tại. Vui lòng chọn tên khác.",
      };
    }

    // 3. Cập nhật cơ sở dữ liệu
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        name,
        username: normalizedUsername,
        email: normalizedEmail,
      },
    });

    // 4. Hủy Session Cookie để yêu cầu đăng nhập lại
    await destroySessionCookie();

    return {
      success: true,
      message: "Cập nhật thông tin cá nhân thành công. Vui lòng đăng nhập lại!",
    };
  } catch (error) {
    console.error("Update Profile Error:", error);
    return {
      success: false,
      error: "Đã xảy ra lỗi trong quá trình cập nhật thông tin.",
    };
  }
}

/**
 * Server Action: Đổi mật khẩu
 * Sau khi đổi mật khẩu thành công, hủy session cookie và yêu cầu người dùng đăng nhập lại.
 */
export async function changePasswordAction(data: ChangePasswordInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
  }

  // 1. Validate dữ liệu đầu vào
  const validation = changePasswordSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Dữ liệu mật khẩu không hợp lệ",
    };
  }

  const { currentPassword, newPassword } = validation.data;

  try {
    // 2. Tìm người dùng trong DB
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return { success: false, error: "Tài khoản không tồn tại." };
    }

    // 3. Kiểm tra mật khẩu hiện tại
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return {
        success: false,
        error: "Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại.",
      };
    }

    if (currentPassword === newPassword) {
      return {
        success: false,
        error: "Mật khẩu mới không được trùng với mật khẩu hiện tại.",
      };
    }

    // 4. Hash mật khẩu mới và lưu vào DB
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.userId },
      data: { password: hashedPassword },
    });

    // 5. Hủy Session Cookie để yêu cầu đăng nhập lại
    await destroySessionCookie();

    return {
      success: true,
      message: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới!",
    };
  } catch (error) {
    console.error("Change Password Error:", error);
    return {
      success: false,
      error: "Đã xảy ra lỗi trong quá trình đổi mật khẩu.",
    };
  }
}
