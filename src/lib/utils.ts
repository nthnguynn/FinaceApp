import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Tạo formatter 1 lần và dùng lại (khởi tạo Intl.NumberFormat khá tốn kém khi gọi trong vòng lặp render)
const vndCurrencyFormatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const vndNumberFormatter = new Intl.NumberFormat("vi-VN");

/** 1234567 -> "1.234.567 ₫" */
export function formatVND(amount: number): string {
  return vndCurrencyFormatter.format(amount);
}

/** 1234567 -> "1.234.567" */
export function formatNumberVN(amount: number): string {
  return vndNumberFormatter.format(amount);
}

/** Rút gọn số tiền cho ô lịch: 85000 -> "85k", 1250000 -> "1,25tr", 2000000000 -> "2 tỷ" */
export function formatCompactVND(amount: number): string {
  const abs = Math.abs(amount);
  const trim = (n: number) => String(Number(n.toFixed(n < 10 ? 2 : 1))).replace(".", ",");
  if (abs >= 1e9) return `${trim(abs / 1e9)} tỷ`;
  if (abs >= 999_500) return `${trim(abs / 1e6)}tr`;
  if (abs >= 1e3) return `${Math.round(abs / 1e3)}k`;
  return String(Math.round(abs));
}
