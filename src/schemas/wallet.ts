import { z } from "zod";

export const updateWalletSchema = z.object({
  name: z
    .string()
    .min(1, "Tên ví không được để trống")
    .max(50, "Tên ví tối đa 50 ký tự"),
  balance: z
    .coerce
    .number({ invalid_type_error: "Số dư phải là một số hợp lệ" })
    .min(0, "Số dư không được là số âm"),
  color: z
    .string()
    .min(1, "Vui lòng chọn màu nhận diện"),
  icon: z
    .string()
    .min(1, "Vui lòng chọn biểu tượng ví"),
});

export type UpdateWalletInput = z.infer<typeof updateWalletSchema>;
