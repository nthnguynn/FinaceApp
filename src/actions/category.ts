"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  createCategorySchema,
  updateCategorySchema,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/schemas/category";

export interface ActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

export interface CategoryData {
  id: string;
  userId: string | null;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
  order: number;
  isDefault: boolean;
  createdAt: Date;
}

const DEFAULT_CATEGORIES = [
  // CHI TIÊU (EXPENSE)
  { name: "Ăn uống", type: "EXPENSE" as const, icon: "Utensils", color: "#EF4444", order: 1, isDefault: true },
  { name: "Đi lại", type: "EXPENSE" as const, icon: "Car", color: "#F59E0B", order: 2, isDefault: true },
  { name: "Mua sắm", type: "EXPENSE" as const, icon: "ShoppingBag", color: "#EC4899", order: 3, isDefault: true },
  { name: "Giải trí", type: "EXPENSE" as const, icon: "Gamepad2", color: "#8B5CF6", order: 4, isDefault: true },
  { name: "Nhà cửa & Hóa đơn", type: "EXPENSE" as const, icon: "Home", color: "#3B82F6", order: 5, isDefault: true },
  { name: "Sức khỏe", type: "EXPENSE" as const, icon: "HeartPulse", color: "#10B981", order: 6, isDefault: true },
  { name: "Khác", type: "EXPENSE" as const, icon: "Tag", color: "#6B7280", order: 7, isDefault: true },

  // THU NHẬP (INCOME)
  { name: "Lương", type: "INCOME" as const, icon: "Briefcase", color: "#10B981", order: 1, isDefault: true },
  { name: "Thưởng", type: "INCOME" as const, icon: "Gift", color: "#F59E0B", order: 2, isDefault: true },
  { name: "Đầu tư", type: "INCOME" as const, icon: "TrendingUp", color: "#3B82F6", order: 3, isDefault: true },
  { name: "Thu nhập khác", type: "INCOME" as const, icon: "Coins", color: "#8B5CF6", order: 4, isDefault: true },
];

/**
 * Server Action: Lấy tất cả danh mục Thu & Chi của người dùng
 * (Tự động khởi tạo bộ danh mục gợi ý ban đầu nếu chưa có)
 */
export async function getCategoriesAction(): Promise<{
  success: boolean;
  categories?: CategoryData[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
    }

    // Lấy danh mục hệ thống (userId null) + danh mục riêng của User, sắp xếp theo thứ tự order tăng dần
    const query = {
      where: { OR: [{ userId: null }, { userId: session.userId }] },
      orderBy: [{ order: "asc" as const }, { isDefault: "desc" as const }, { name: "asc" as const }],
    };

    let categories = await prisma.category.findMany(query);

    // Nếu CSDL hoàn toàn chưa có danh mục mặc định nào, tiến hành seed tự động
    if (categories.length === 0) {
      await prisma.category.createMany({
        data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: null })),
      });
      categories = await prisma.category.findMany(query);
    }

    return { success: true, categories };
  } catch (error) {
    console.error("Get Categories Error:", error);
    return { success: false, error: "Lỗi hệ thống khi tải danh mục Thu/Chi." };
  }
}

/**
 * Server Action: Thêm danh mục Thu/Chi cá nhân mới
 */
export async function createCategoryAction(data: CreateCategoryInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
  }

  const validation = createCategorySchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Thông tin danh mục không hợp lệ",
    };
  }

  const { name, type, icon, color, order } = validation.data;

  try {
    await prisma.category.create({
      data: {
        userId: session.userId,
        name,
        type,
        icon,
        color,
        order: order ?? 0,
        isDefault: false,
      },
    });

    revalidatePath("/categories");
    revalidatePath("/transactions");

    return {
      success: true,
      message: "Thêm danh mục mới thành công!",
    };
  } catch (error) {
    console.error("Create Category Error:", error);
    return { success: false, error: "Đã xảy ra lỗi trong quá trình tạo danh mục." };
  }
}

/**
 * Server Action: Cập nhật danh mục
 */
export async function updateCategoryAction(data: UpdateCategoryInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
  }

  const validation = updateCategorySchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Thông tin danh mục không hợp lệ",
    };
  }

  const { id, name, type, icon, color, order } = validation.data;

  try {
    // Chỉ được sửa danh mục do chính mình tạo (danh mục hệ thống dùng chung cho mọi tài khoản)
    const category = await prisma.category.findFirst({
      where: { id, userId: session.userId },
    });

    if (!category) {
      return { success: false, error: "Không tìm thấy danh mục hoặc đây là danh mục hệ thống không thể sửa." };
    }

    await prisma.category.update({
      where: { id },
      data: {
        name,
        type,
        icon,
        color,
        order: order ?? category.order,
      },
    });

    revalidatePath("/categories");
    revalidatePath("/transactions");

    return {
      success: true,
      message: "Cập nhật danh mục thành công!",
    };
  } catch (error) {
    console.error("Update Category Error:", error);
    return { success: false, error: "Đã xảy ra lỗi trong quá trình cập nhật danh mục." };
  }
}

/**
 * Server Action: Xóa danh mục
 */
export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
  }

  try {
    const category = await prisma.category.findFirst({
      where: { id, userId: session.userId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!category) {
      return { success: false, error: "Danh mục không tồn tại hoặc là danh mục hệ thống không thể xóa." };
    }

    if (category._count.transactions > 0) {
      return {
        success: false,
        error: `Không thể xóa danh mục này vì đang có ${category._count.transactions} giao dịch liên quan.`,
      };
    }

    await prisma.category.delete({
      where: { id },
    });

    revalidatePath("/categories");
    revalidatePath("/transactions");

    return {
      success: true,
      message: "Xóa danh mục thành công!",
    };
  } catch (error) {
    console.error("Delete Category Error:", error);
    return { success: false, error: "Đã xảy ra lỗi trong quá trình xóa danh mục." };
  }
}
