import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Vui lòng nhập Tên đăng nhập hoặc Email"),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu"),
});

export type LoginInput = z.infer<typeof loginSchema>;
