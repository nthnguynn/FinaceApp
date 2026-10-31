import { z } from "zod";

export const transactionTypeEnum = z.enum(["INCOME", "EXPENSE"]);

export const createTransactionSchema = z.object({
  type: transactionTypeEnum,
  amount: z
    .coerce
    .number({ invalid_type_error: "Số tiền phải là một số hợp lệ" })
    .positive("Số tiền phải lớn hơn 0"),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục Thu/Chi"),
  date: z.coerce.date({ invalid_type_error: "Ngày giao dịch không hợp lệ" }),
  note: z.string().max(200, "Ghi chú tối đa 200 ký tự").optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const updateTransactionSchema = createTransactionSchema.extend({
  id: z.string().min(1, "ID giao dịch không hợp lệ"),
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
