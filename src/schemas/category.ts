import { z } from "zod";

export const categoryTypeEnum = z.enum(["INCOME", "EXPENSE"]);

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Tên danh mục không được để trống")
    .max(50, "Tên danh mục tối đa 50 ký tự"),
  type: categoryTypeEnum,
  icon: z.string().min(1, "Vui lòng chọn biểu tượng"),
  color: z.string().min(1, "Vui lòng chọn màu sắc"),
  order: z.coerce.number().int().min(0, "Thứ tự phải lớn hơn hoặc bằng 0").default(0),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.extend({
  id: z.string().min(1, "ID danh mục không hợp lệ"),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
