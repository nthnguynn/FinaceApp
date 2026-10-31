import { z } from "zod";
import { transactionTypeEnum } from "./transaction";

export const pendingStatusEnum = z.enum(["PENDING", "APPROVED", "IGNORED"]);

export const simulatePendingTransactionSchema = z.object({
  amount: z
    .coerce
    .number({ invalid_type_error: "Số tiền phải là số hợp lệ" })
    .positive("Số tiền phải lớn hơn 0"),
  type: transactionTypeEnum,
  bankName: z.string().min(1, "Vui lòng chọn ngân hàng").default("MBBank"),
  bankAccount: z.string().optional(),
  content: z.string().min(1, "Vui lòng nhập nội dung chuyển khoản"),
});

export type SimulatePendingTransactionInput = z.infer<typeof simulatePendingTransactionSchema>;

export const approvePendingTransactionSchema = z.object({
  pendingId: z.string().min(1, "ID giao dịch chờ không hợp lệ"),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục Thu/Chi"),
  amount: z
    .coerce
    .number({ invalid_type_error: "Số tiền không hợp lệ" })
    .positive("Số tiền phải lớn hơn 0"),
  type: transactionTypeEnum,
  date: z.coerce.date().default(() => new Date()),
  note: z.string().max(255, "Ghi chú tối đa 255 ký tự").optional(),
});

export type ApprovePendingTransactionInput = z.infer<typeof approvePendingTransactionSchema>;
