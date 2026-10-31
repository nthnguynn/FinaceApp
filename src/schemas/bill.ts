import { z } from "zod";
import { isDateKey, isMonthKey } from "@/lib/bills";

export const billSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên hóa đơn").max(60, "Tên tối đa 60 ký tự"),
  amount: z.coerce.number({ invalid_type_error: "Số tiền không hợp lệ" }).positive("Số tiền phải lớn hơn 0"),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
  startDate: z.string().refine(isDateKey, "Ngày đến hạn không hợp lệ"),
  repeat: z.enum(["NONE", "WEEKLY", "MONTHLY", "YEARLY"]),
  /** "YYYY-MM" tháng của kỳ cuối; bỏ trống = không thời hạn */
  endMonth: z
    .string()
    .nullable()
    .optional()
    .refine((v) => !v || isMonthKey(v), "Tháng kết thúc không hợp lệ"),
  note: z.string().max(200, "Ghi chú tối đa 200 ký tự").optional(),
})
  .refine((d) => !d.endMonth || d.endMonth >= d.startDate.slice(0, 7), {
    message: "Tháng kết thúc phải từ tháng bắt đầu trở đi",
    path: ["endMonth"],
  });

export type BillInput = z.infer<typeof billSchema>;
