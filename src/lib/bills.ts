import { daysInMonth } from "@/lib/date-vn";

export type BillRepeat = "NONE" | "WEEKLY" | "MONTHLY" | "YEARLY";

export const REPEAT_LABELS: Record<BillRepeat, string> = {
  NONE: "Một lần",
  WEEKLY: "Hàng tuần",
  MONTHLY: "Hàng tháng",
  YEARLY: "Hàng năm",
};

/**
 * Ngày theo lịch được lưu dưới dạng 00:00 UTC (không phụ thuộc múi giờ máy chủ)
 * và trao đổi giữa client/server bằng chuỗi "YYYY-MM-DD".
 */
export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month, day };
}

export function isDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const { year, month, day } = parseDateKey(key);
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

export function keyToUTC(key: string): Date {
  const { year, month, day } = parseDateKey(key);
  return new Date(Date.UTC(year, month - 1, day));
}

export function utcToKey(date: Date): string {
  return dateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/** Date (giờ địa phương, VD từ DatePicker) -> "YYYY-MM-DD" */
export function localDateKey(date: Date): string {
  return dateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

const WEEK_MS = 7 * 86_400_000;

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function isMonthKey(key: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(key);
}

/** Các ngày đến hạn của một hóa đơn trong tháng (year, month 1-12), dạng "YYYY-MM-DD" */
export function occurrencesInMonth(
  startKey: string,
  repeat: BillRepeat,
  year: number,
  month: number,
  endMonth?: string | null
): string[] {
  const start = parseDateKey(startKey);
  const monthIndex = year * 12 + month;
  const startIndex = start.year * 12 + start.month;
  if (monthIndex < startIndex) return [];
  if (endMonth && monthKey(year, month) > endMonth) return [];
  const lastDay = daysInMonth(year, month);

  switch (repeat) {
    case "NONE":
      return monthIndex === startIndex ? [startKey] : [];
    case "MONTHLY":
      // Ngày 31 ở tháng ngắn hơn -> ngày cuối tháng
      return [dateKey(year, month, Math.min(start.day, lastDay))];
    case "YEARLY":
      return month === start.month ? [dateKey(year, month, Math.min(start.day, lastDay))] : [];
    case "WEEKLY": {
      const startMs = keyToUTC(startKey).getTime();
      const monthStart = Date.UTC(year, month - 1, 1);
      const monthEnd = Date.UTC(year, month - 1, lastDay);
      let t = startMs + Math.max(0, Math.ceil((monthStart - startMs) / WEEK_MS)) * WEEK_MS;
      const keys: string[] = [];
      for (; t <= monthEnd; t += WEEK_MS) keys.push(utcToKey(new Date(t)));
      return keys;
    }
  }
}

/** Thứ tự kỳ (1-based) của một ngày đến hạn */
export function occurrenceSeq(startKey: string, repeat: BillRepeat, dueKey: string): number {
  const s = parseDateKey(startKey);
  const d = parseDateKey(dueKey);
  switch (repeat) {
    case "NONE":
      return 1;
    case "MONTHLY":
      return d.year * 12 + d.month - (s.year * 12 + s.month) + 1;
    case "YEARLY":
      return d.year - s.year + 1;
    case "WEEKLY":
      return Math.round((keyToUTC(dueKey).getTime() - keyToUTC(startKey).getTime()) / WEEK_MS) + 1;
  }
}

/** Tổng số kỳ nếu có tháng kết thúc (null = không thời hạn) */
export function totalOccurrences(startKey: string, repeat: BillRepeat, endMonth: string | null): number | null {
  if (repeat === "NONE") return 1;
  if (!endMonth) return null;
  const s = parseDateKey(startKey);
  const [ey, em] = endMonth.split("-").map(Number);
  switch (repeat) {
    case "MONTHLY":
      return Math.max(0, ey * 12 + em - (s.year * 12 + s.month) + 1);
    case "YEARLY":
      return Math.max(0, ey - s.year + (em >= s.month ? 1 : 0));
    case "WEEKLY": {
      const last = Date.UTC(ey, em - 1, daysInMonth(ey, em));
      const startMs = keyToUTC(startKey).getTime();
      return last < startMs ? 0 : Math.floor((last - startMs) / WEEK_MS) + 1;
    }
  }
}

/** Kỳ chưa trả gần nhất, tính từ tháng `fromYear/fromMonth` trở đi (tối đa 3 năm) */
export function nextUnpaidOccurrence(
  startKey: string,
  repeat: BillRepeat,
  endMonth: string | null,
  paidKeys: Set<string>,
  fromYear: number,
  fromMonth: number
): string | null {
  for (let i = 0; i < 36; i++) {
    const index = fromYear * 12 + (fromMonth - 1) + i;
    const year = Math.floor(index / 12);
    const month = (index % 12) + 1;
    if (endMonth && monthKey(year, month) > endMonth) return null;
    const hit = occurrencesInMonth(startKey, repeat, year, month, endMonth).find((k) => !paidKeys.has(k));
    if (hit) return hit;
  }
  return null;
}
