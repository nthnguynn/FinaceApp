/**
 * Ngày theo giờ Việt Nam (GMT+7) — khớp với cách server lọc giao dịch theo ngày,
 * nên kết quả giống nhau dù render ở server (UTC) hay trình duyệt.
 */
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

export interface VNDate {
  year: number;
  month: number; // 1-12
  day: number;
}

export function toVNDate(input: Date | string): VNDate {
  const d = new Date(new Date(input).getTime() + VN_OFFSET_MS);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Khoảng YYYY-MM-DD đầu/cuối tháng — định dạng getTransactionsAction nhận */
export function monthRange(year: number, month: number) {
  const mm = String(month).padStart(2, "0");
  return {
    startDate: `${year}-${mm}-01`,
    endDate: `${year}-${mm}-${String(daysInMonth(year, month)).padStart(2, "0")}`,
  };
}

export function shiftMonth(year: number, month: number, delta: number) {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const WEEKDAY_FULL = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

/** Thứ trong tuần, tính từ Thứ Hai = 0 */
export function mondayIndex(year: number, month: number, day: number): number {
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

export function weekdayName(year: number, month: number, day: number): string {
  return WEEKDAY_FULL[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}
