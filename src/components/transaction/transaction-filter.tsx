"use client";

import { useState, useRef, useEffect } from "react";
import { CategoryData } from "@/actions/category";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  CalendarDays,
  Tag,
  Check,
  X,
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Home,
  HeartPulse,
  Heart,
  Briefcase,
  Gift,
  TrendingUp,
  Coins,
  BookOpen,
  Plane,
  Music,
  Zap,
  Coffee,
  Shirt,
} from "lucide-react";
import { Badminton } from "@/components/icons/badminton";

interface TransactionFilterProps {
  categories: CategoryData[];
  typeFilter: "ALL" | "EXPENSE" | "INCOME";
  onTypeChange: (type: "ALL" | "EXPENSE" | "INCOME") => void;
  categoryFilter: string;
  onCategoryChange: (categoryId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  startDate?: string;
  endDate?: string;
  onDateRangeChange: (startDate?: string, endDate?: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Badminton,
  Home,
  HeartPulse,
  Heart,
  Tag,
  Briefcase,
  Gift,
  TrendingUp,
  Coins,
  Coffee,
  BookOpen,
  Plane,
  Music,
  Zap,
  Shirt,
};

// Helper định dạng YYYY-MM-DD -> DD/MM/YYYY cho hiển thị
const formatYYYYMMDDToDDMMYYYY = (str?: string) => {
  if (!str) return "";
  const parts = str.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return str;
};

// Helper định dạng Date -> YYYY-MM-DD theo giờ địa phương
const formatDateToYYYYMMDD = (d: Date) => {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper chuyển YYYY-MM-DD -> Date theo giờ địa phương
const parseYYYYMMDDToDate = (str?: string) => {
  if (!str) return new Date();
  const parts = str.split("-").map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date();
};

export function TransactionFilter({
  categories,
  typeFilter,
  onTypeChange,
  categoryFilter,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  startDate,
  endDate,
  onDateRangeChange,
}: TransactionFilterProps) {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [categoryTab, setCategoryTab] = useState<"EXPENSE" | "INCOME">("EXPENSE");

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  // Đóng Dropdowns khi click ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setIsDateOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");
  const incomeCategories = categories.filter((c) => c.type === "INCOME");

  const selectedCategoryObj = categories.find((c) => c.id === categoryFilter);

  // Xử lý các lựa chọn ngày nhanh
  const setQuickDateRange = (type: "ALL" | "THIS_MONTH" | "LAST_MONTH") => {
    const today = new Date();
    if (type === "ALL") {
      onDateRangeChange(undefined, undefined);
    } else if (type === "THIS_MONTH") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      onDateRangeChange(formatDateToYYYYMMDD(firstDay), formatDateToYYYYMMDD(lastDay));
    } else if (type === "LAST_MONTH") {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      onDateRangeChange(formatDateToYYYYMMDD(firstDay), formatDateToYYYYMMDD(lastDay));
    }
  };

  const hasDateFilter = !!startDate || !!endDate;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-card/95 border border-border/60 shadow-xs backdrop-blur relative">
      {/* 1. Ô tìm kiếm ghi chú & số tiền (Full width trên di động) */}
      <div className="relative flex-1 min-w-35 w-full sm:w-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm theo ghi chú, số tiền"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8.5 pr-7 bg-muted/40 border-border/60 rounded-xl focus-visible:ring-primary/20 text-xs font-medium h-8.5 w-full"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* 2. Nhóm bộ lọc (Layout lưới chuẩn 100% trên di động) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
        {/* Nút lọc Loại: Tất cả / Chi tiêu / Thu nhập (Lưới 3 cột trên di động) */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/40 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onTypeChange("ALL")}
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              typeFilter === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Tất cả
          </button>
          <button
            type="button"
            onClick={() => onTypeChange("EXPENSE")}
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              typeFilter === "EXPENSE"
                ? "bg-rose-500 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-300" /> Chi tiêu
          </button>
          <button
            type="button"
            onClick={() => onTypeChange("INCOME")}
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              typeFilter === "INCOME"
                ? "bg-emerald-500 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-300" /> Thu nhập
          </button>
        </div>

        {/* Hàng 2 Dropdown (Lưới 2 cột chia đôi 50-50 trên di động) */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
          {/* Custom Category Dropdown Popover */}
          <div className="relative w-full sm:w-auto" ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsCategoryOpen(!isCategoryOpen);
                setIsDateOpen(false);
              }}
              className="flex items-center justify-between gap-1.5 h-8.5 px-3 rounded-xl border border-border/60 bg-muted/40 hover:bg-muted/80 text-xs font-semibold transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:max-w-42.5"
            >
              <div className="flex items-center gap-1.5 truncate">
                {selectedCategoryObj ? (
                  <>
                    <div
                      className="h-3 w-3 rounded-full flex items-center justify-center text-[8px] text-white shrink-0"
                      style={{ backgroundColor: selectedCategoryObj.color }}
                    >
                      ●
                    </div>
                    <span className="truncate">{selectedCategoryObj.name}</span>
                  </>
                ) : (
                  <>
                    <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">Tất cả danh mục</span>
                  </>
                )}
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ${
                  isCategoryOpen ? "rotate-180 text-primary" : ""
                }`}
              />
            </button>

            {/* Category Dropdown Popover */}
            {isCategoryOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 max-w-[calc(100vw-32px)] rounded-2xl border border-border/60 bg-card text-card-foreground shadow-2xl backdrop-blur-md p-2.5 z-50 animate-in fade-in-0 zoom-in-95">
                <div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-xl mb-2">
                  <button
                    type="button"
                    onClick={() => setCategoryTab("EXPENSE")}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      categoryTab === "EXPENSE"
                        ? "bg-rose-500 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    🔴 Chi tiêu ({expenseCategories.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryTab("INCOME")}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      categoryTab === "INCOME"
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    🟢 Thu nhập ({incomeCategories.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onCategoryChange("ALL");
                    setIsCategoryOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    categoryFilter === "ALL"
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Tất cả danh mục</span>
                  </div>
                  {categoryFilter === "ALL" && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>

                <div className="border-t border-border/40 my-1.5" />

                <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                  {(categoryTab === "EXPENSE" ? expenseCategories : incomeCategories).length === 0 ? (
                    <p className="text-xs text-center py-4 text-muted-foreground">
                      Chưa có danh mục {categoryTab === "EXPENSE" ? "chi tiêu" : "thu nhập"} nào
                    </p>
                  ) : (
                    (categoryTab === "EXPENSE" ? expenseCategories : incomeCategories).map((c) => {
                      const IconComp = ICON_MAP[c.icon] || Tag;
                      const isSelected = categoryFilter === c.id;

                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            onCategoryChange(c.id);
                            setIsCategoryOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-primary/10 text-primary font-bold"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div
                              className="p-1 rounded-md text-white shrink-0"
                              style={{ backgroundColor: c.color }}
                            >
                              <IconComp className="h-3.5 w-3.5" />
                            </div>
                            <span className="truncate">{c.name}</span>
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Custom Date Range Filter Dropdown */}
          <div className="relative w-full sm:w-auto" ref={dateDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsDateOpen(!isDateOpen);
                setIsCategoryOpen(false);
              }}
              className={`flex items-center justify-between gap-1.5 h-8.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto ${
                hasDateFilter
                  ? "border-primary bg-primary/10 text-primary font-bold"
                  : "border-border/60 bg-muted/40 hover:bg-muted/80 text-foreground"
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {hasDateFilter
                    ? `${formatYYYYMMDDToDDMMYYYY(startDate)} ➔ ${formatYYYYMMDDToDDMMYYYY(endDate)}`
                    : "Lọc thời gian"}
                </span>
              </div>
              {hasDateFilter ? (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onDateRangeChange(undefined, undefined);
                  }}
                  className="p-0.5 rounded-md hover:bg-primary/20 text-primary cursor-pointer ml-1 shrink-0"
                  title="Xóa lọc thời gian"
                >
                  <X className="h-3 w-3" />
                </span>
              ) : (
                <ChevronDown
                  className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ${
                    isDateOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              )}
            </button>

            {/* Date Range Popover */}
            {isDateOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-32px)] rounded-2xl border border-border/60 bg-card text-card-foreground shadow-2xl backdrop-blur-md p-3.5 z-50 animate-in fade-in-0 zoom-in-95 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="text-xs font-bold text-foreground">Chọn khoảng thời gian</span>
                  {hasDateFilter && (
                    <button
                      type="button"
                      onClick={() => {
                        onDateRangeChange(undefined, undefined);
                        setIsDateOpen(false);
                      }}
                      className="text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer"
                    >
                      Bỏ lọc
                    </button>
                  )}
                </div>

                {/* Nút chọn nhanh */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickDateRange("ALL");
                      setIsDateOpen(false);
                    }}
                    className="flex-1 py-1.5 rounded-lg border border-border/60 bg-muted/40 text-[11px] font-bold hover:bg-muted cursor-pointer"
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickDateRange("THIS_MONTH");
                      setIsDateOpen(false);
                    }}
                    className="flex-1 py-1.5 rounded-lg border border-border/60 bg-muted/40 text-[11px] font-bold hover:bg-muted cursor-pointer"
                  >
                    Tháng này
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickDateRange("LAST_MONTH");
                      setIsDateOpen(false);
                    }}
                    className="flex-1 py-1.5 rounded-lg border border-border/60 bg-muted/40 text-[11px] font-bold hover:bg-muted cursor-pointer"
                  >
                    Tháng trước
                  </button>
                </div>

                {/* Từ ngày - Đến ngày DatePickers */}
                <div className="space-y-2 pt-1 border-t border-border/40">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">Từ ngày:</span>
                    <DatePicker
                      value={parseYYYYMMDDToDate(startDate)}
                      onChange={(d) => onDateRangeChange(formatDateToYYYYMMDD(d), endDate)}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">Đến ngày:</span>
                    <DatePicker
                      value={parseYYYYMMDDToDate(endDate)}
                      onChange={(d) => onDateRangeChange(startDate, formatDateToYYYYMMDD(d))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
