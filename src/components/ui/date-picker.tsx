"use client";

import { useState, useRef, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  id?: string;
  placeholder?: string;
  position?: "top" | "bottom";
}

const MONTH_NAMES = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

const WEEKDAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export function DatePicker({
  value,
  onChange,
  id = "date-picker",
  placeholder,
  position = "bottom",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value || new Date();

  // State xem tháng/năm trên Lịch
  const [viewDate, setViewDate] = useState<Date>(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  // Mở lịch: luôn nhảy về tháng của ngày đang chọn
  // (đồng bộ trong handler thay vì useEffect([value]) — value là Date mới ở mỗi lần render của cha)
  const toggleOpen = () => {
    if (!isOpen) {
      setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
    setIsOpen(!isOpen);
  };

  // Click ra ngoài tự đóng Lịch (chỉ lắng nghe khi đang mở)
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const selectDay = (day: number) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(selected);
    setIsOpen(false);
  };

  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfWeek = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1
  ).getDay();

  const today = new Date();
  const isCurrentMonthToday =
    today.getMonth() === viewDate.getMonth() &&
    today.getFullYear() === viewDate.getFullYear();

  const isCurrentMonthSelected =
    Boolean(value) &&
    value?.getMonth() === viewDate.getMonth() &&
    value?.getFullYear() === viewDate.getFullYear();

  return (
    <div className="relative w-full" ref={containerRef} id={id}>
      {/* Nút bấm Chọn ngày duy nhất (Chỉ cần click chọn) */}
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full flex items-center justify-between h-10 px-3.5 rounded-xl border border-border/80 bg-background hover:bg-muted/50 text-sm font-semibold transition-all cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <div className="flex items-center gap-2.5 text-foreground">
          <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
          <span className={value ? "text-foreground" : "text-muted-foreground font-normal"}>
            {value
              ? value.toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
              : placeholder || "Chọn ngày"}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180 text-primary" : ""
            }`}
        />
      </button>

      {/* Popover Lịch Bật lên Phía dưới / Trên tùy chọn */}
      {isOpen && (
        <div
          className={`absolute right-0 sm:left-0 ${position === "top" ? "bottom-full mb-2" : "top-full mt-2"
            } w-72 rounded-2xl border border-border/60 bg-card text-card-foreground shadow-2xl backdrop-blur-md p-4 z-50 animate-in fade-in-0 zoom-in-95`}
        >
          {/* Header Tháng / Năm & Nút điều hướng */}
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-foreground">
              {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Hàng tên thứ (CN, T2, T3...) */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground py-2 border-b border-border/20">
            {WEEKDAY_NAMES.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>

          {/* Lưới các ngày trong tháng */}
          <div className="grid grid-cols-7 gap-1 pt-2">
            {/* Các ô trống trước ngày mùng 1 */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Các ngày trong tháng */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = isCurrentMonthToday && today.getDate() === day;
              const isSelected = isCurrentMonthSelected && value?.getDate() === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`h-8 w-8 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${isSelected
                      ? "bg-primary text-primary-foreground font-bold shadow-md scale-105"
                      : isToday
                        ? "border border-primary text-primary font-bold hover:bg-primary/10"
                        : "text-foreground hover:bg-muted"
                    }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
