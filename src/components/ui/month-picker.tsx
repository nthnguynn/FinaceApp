"use client";

import { useCallback, useState, useRef } from "react";
import { PickerPopover } from "@/components/ui/picker-popover";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

interface MonthPickerProps {
  value: string; // Định dạng "YYYY-MM" (Ví dụ: "2026-08")
  onChange: (value: string) => void;
}

const MONTH_LABELS = [
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

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Phân tích giá trị "YYYY-MM"
  const [valYearStr, valMonthStr] = (value || "").split("-");
  const selectedYear = parseInt(valYearStr, 10) || new Date().getFullYear();
  const selectedMonth = parseInt(valMonthStr, 10) || new Date().getMonth() + 1;

  const [viewYear, setViewYear] = useState<number>(selectedYear);

  // Mở popover: luôn hiển thị năm của tháng đang chọn
  const toggleOpen = () => {
    if (!isOpen) setViewYear(selectedYear);
    setIsOpen(!isOpen);
  };

  const close = useCallback(() => setIsOpen(false), []);

  const handleSelectMonth = (monthIndex: number) => {
    const mStr = String(monthIndex + 1).padStart(2, "0");
    onChange(`${viewYear}-${mStr}`);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Nút bấm Chọn Tháng đẹp mắt */}
      <button
        type="button"
        onClick={toggleOpen}
        className="flex items-center justify-between gap-2.5 h-10 px-3.5 rounded-xl border border-border/80 bg-background hover:bg-muted/50 text-xs font-bold text-foreground transition-all cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
          <span>
            {MONTH_LABELS[selectedMonth - 1]} / {selectedYear}
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      {/* Popover Bảng chọn Tháng & Năm */}
      <PickerPopover anchorRef={containerRef} open={isOpen} onClose={close} width={272} label="Chọn tháng">
          {/* Header chọn Năm */}
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <button
              type="button"
              onClick={() => setViewYear(viewYear - 1)}
              aria-label="Năm trước"
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-extrabold text-foreground font-mono">
              Năm {viewYear}
            </span>
            <button
              type="button"
              onClick={() => setViewYear(viewYear + 1)}
              aria-label="Năm sau"
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Lưới 12 Tháng */}
          <div className="grid grid-cols-3 gap-2 pt-3">
            {MONTH_LABELS.map((label, idx) => {
              const monthNum = idx + 1;
              const isSelected = selectedYear === viewYear && selectedMonth === monthNum;
              const isCurrentMonth =
                new Date().getFullYear() === viewYear && new Date().getMonth() + 1 === monthNum;

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleSelectMonth(idx)}
                  className={`h-10 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold shadow-md scale-105"
                      : isCurrentMonth
                      ? "border border-primary/60 text-primary font-bold hover:bg-primary/10"
                      : "text-foreground hover:bg-muted/70"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
      </PickerPopover>
    </div>
  );
}
