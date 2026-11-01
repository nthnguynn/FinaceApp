"use client";

import { useState, useRef, useEffect } from "react";
import { TransactionData, getTransactionsAction } from "@/actions/transaction";
import { CategoryData, getCategoriesAction } from "@/actions/category";
import { TransactionFilter } from "@/components/transaction/transaction-filter";
import { TransactionList } from "@/components/transaction/transaction-list";
import { TransactionDialog } from "@/components/transaction/transaction-dialog";
import { QuickTextEntry } from "@/components/transaction/quick-text-entry";
import { StatList } from "@/components/ui/stat-list";
import { Button } from "@/components/ui/button";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { formatVND } from "@/lib/utils";

interface TransactionManagerProps {
  initialTransactions: TransactionData[];
  initialCategories: CategoryData[];
  initialTotalIncome: number;
  initialTotalExpense: number;
  initialYear?: number;
  initialMonth?: number;
}

// Helper tính khoảng ngày bắt đầu - kết thúc của tháng (YYYY-MM-01 -> YYYY-MM-lastDay)
function getMonthRange(year: number, month: number) {
  const lastDay = new Date(year, month, 0).getDate();
  const startStr = `${year}-${String(month).padStart(2, "0")}-01`;
  const endStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { startStr, endStr };
}

export function TransactionManager({
  initialTransactions,
  initialCategories,
  initialTotalIncome,
  initialTotalExpense,
  initialYear,
  initialMonth,
}: TransactionManagerProps) {
  const now = new Date();

  const [selectedYear, setSelectedYear] = useState<number>(initialYear || now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth || now.getMonth() + 1);
  const [viewMode, setViewMode] = useState<"MONTH" | "ALL">("MONTH");

  // State cho Popover chọn Tháng / Năm
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(initialYear || now.getFullYear());
  const monthPickerRef = useRef<HTMLDivElement>(null);

  const defaultMonthRange = getMonthRange(initialYear || now.getFullYear(), initialMonth || now.getMonth() + 1);

  const [transactions, setTransactions] = useState<TransactionData[]>(initialTransactions);
  const [categories, setCategories] = useState<CategoryData[]>(initialCategories);
  const [totalIncome, setTotalIncome] = useState<number>(initialTotalIncome);
  const [totalExpense, setTotalExpense] = useState<number>(initialTotalExpense);

  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<string | undefined>(defaultMonthRange.startStr);
  const [endDate, setEndDate] = useState<string | undefined>(defaultMonthRange.endStr);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionData | null>(null);

  // Đóng popover chọn tháng khi bấm ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    const res = await getCategoriesAction();
    if (res.success && res.categories) {
      setCategories(res.categories);
    }
  };

  const fetchTransactions = async (sDate = startDate, eDate = endDate) => {
    const res = await getTransactionsAction({
      type: typeFilter,
      categoryId: categoryFilter,
      searchQuery,
      startDate: sDate,
      endDate: eDate,
    });
    if (res.success && res.transactions) {
      setTransactions(res.transactions);
      setTotalIncome(res.totalIncome || 0);
      setTotalExpense(res.totalExpense || 0);
    }
  };

  // Chọn trực tiếp Tháng & Năm từ popover picker
  const handleSelectMonthYear = async (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setViewMode("MONTH");
    setIsMonthPickerOpen(false);
    const { startStr, endStr } = getMonthRange(year, month);
    setStartDate(startStr);
    setEndDate(endStr);
    fetchTransactions(startStr, endStr);
  };

  // Chuyển về tháng trước
  const handlePrevMonth = async () => {
    let nextM = selectedMonth - 1;
    let nextY = selectedYear;
    if (nextM < 1) {
      nextM = 12;
      nextY -= 1;
    }
    setSelectedMonth(nextM);
    setSelectedYear(nextY);
    setPickerYear(nextY);
    setViewMode("MONTH");
    const { startStr, endStr } = getMonthRange(nextY, nextM);
    setStartDate(startStr);
    setEndDate(endStr);
    fetchTransactions(startStr, endStr);
  };

  // Chuyển sang tháng sau
  const handleNextMonth = async () => {
    let nextM = selectedMonth + 1;
    let nextY = selectedYear;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    setSelectedMonth(nextM);
    setSelectedYear(nextY);
    setPickerYear(nextY);
    setViewMode("MONTH");
    const { startStr, endStr } = getMonthRange(nextY, nextM);
    setStartDate(startStr);
    setEndDate(endStr);
    fetchTransactions(startStr, endStr);
  };

  // Đổi chế độ xem (Theo Tháng / Tất Cả)
  const handleChangeViewMode = async (mode: "MONTH" | "ALL") => {
    setViewMode(mode);
    let sDate: string | undefined;
    let eDate: string | undefined;
    if (mode === "MONTH") {
      const range = getMonthRange(selectedYear, selectedMonth);
      sDate = range.startStr;
      eDate = range.endStr;
    } else {
      sDate = undefined;
      eDate = undefined;
    }
    setStartDate(sDate);
    setEndDate(eDate);
    fetchTransactions(sDate, eDate);
  };

  const handleTypeChange = async (type: "ALL" | "INCOME" | "EXPENSE") => {
    setTypeFilter(type);
    const res = await getTransactionsAction({
      type,
      categoryId: categoryFilter,
      searchQuery,
      startDate,
      endDate,
    });
    if (res.success && res.transactions) {
      setTransactions(res.transactions);
      setTotalIncome(res.totalIncome || 0);
      setTotalExpense(res.totalExpense || 0);
    }
  };

  const handleCategoryChange = async (catId: string) => {
    setCategoryFilter(catId);
    const res = await getTransactionsAction({
      type: typeFilter,
      categoryId: catId,
      searchQuery,
      startDate,
      endDate,
    });
    if (res.success && res.transactions) {
      setTransactions(res.transactions);
      setTotalIncome(res.totalIncome || 0);
      setTotalExpense(res.totalExpense || 0);
    }
  };

  const handleSearchChange = async (query: string) => {
    setSearchQuery(query);
    const res = await getTransactionsAction({
      type: typeFilter,
      categoryId: categoryFilter,
      searchQuery: query,
      startDate,
      endDate,
    });
    if (res.success && res.transactions) {
      setTransactions(res.transactions);
      setTotalIncome(res.totalIncome || 0);
      setTotalExpense(res.totalExpense || 0);
    }
  };

  const handleDateRangeChange = async (sDate?: string, eDate?: string) => {
    setStartDate(sDate);
    setEndDate(eDate);
    if (!sDate && !eDate) {
      // Nếu xóa lọc ngày, quay về theo tháng đang chọn
      const range = getMonthRange(selectedYear, selectedMonth);
      setStartDate(range.startStr);
      setEndDate(range.endStr);
      fetchTransactions(range.startStr, range.endStr);
    } else {
      fetchTransactions(sDate, eDate);
    }
  };

  const handleCreate = () => {
    setSelectedTransaction(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (transaction: TransactionData) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 1. Thanh Điều Hướng Quản Lý Theo Tháng - Chuẩn 1 hàng ngang tinh tế trên điện thoại */}
      <div className="relative flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {/* Left: Cụm điều hướng Tháng / Năm */}
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
          {viewMode === "MONTH" ? (
            <>
              {/* Nút Tháng Trước */}
              <button
                type="button"
                onClick={handlePrevMonth}
                className="size-10 rounded-full border border-border bg-card hover:bg-muted text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
                title="Tháng trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Nút Bấm Mở Popover Chọn Tháng / Năm */}
              <div className="sm:relative" ref={monthPickerRef}>
                <button
                  type="button"
                  onClick={() => {
                    setPickerYear(selectedYear);
                    setIsMonthPickerOpen(!isMonthPickerOpen);
                  }}
                  className="flex items-center gap-2 h-10 px-4 rounded-full bg-card hover:bg-muted border border-border shadow-xs transition-colors cursor-pointer select-none shrink-0"
                  title="Bấm để chọn tháng / năm"
                >
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                  <span className="text-sm font-bold text-foreground whitespace-nowrap">
                    Tháng {String(selectedMonth).padStart(2, "0")}/{selectedYear}
                  </span>
                  <ChevronDown
                    className={`h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary transition-transform duration-200 shrink-0 ${
                      isMonthPickerOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Popover chọn Tháng / Năm */}
                {isMonthPickerOpen && (
                  <div className="absolute inset-x-0 top-full mt-2 z-50 rounded-3xl sm:inset-x-auto sm:left-0 sm:w-72 bg-card border border-border/80 p-3.5 shadow-2xl animate-in fade-in-0 zoom-in-95">
                    {/* Header chọn Năm */}
                    <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border/50">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPickerYear((prev) => prev - 1)}
                        className="h-7 w-7 p-0 rounded-lg cursor-pointer"
                        title="Năm trước"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-black text-foreground">
                        Năm {pickerYear}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPickerYear((prev) => prev + 1)}
                        className="h-7 w-7 p-0 rounded-lg cursor-pointer"
                        title="Năm sau"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Grid 12 Tháng */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                        const isSelected = m === selectedMonth && pickerYear === selectedYear;
                        const isCurrent = m === now.getMonth() + 1 && pickerYear === now.getFullYear();

                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleSelectMonthYear(m, pickerYear)}
                            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : isCurrent
                                ? "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            }`}
                          >
                            Tháng {m}
                            {isCurrent && !isSelected && (
                              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick Action */}
                    <div className="pt-2.5 mt-2.5 border-t border-border/50 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          const curY = now.getFullYear();
                          const curM = now.getMonth() + 1;
                          handleSelectMonthYear(curM, curY);
                        }}
                        className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        Tháng hiện tại ({now.getMonth() + 1}/{now.getFullYear()})
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMonthPickerOpen(false)}
                        className="text-[11px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Nút Tháng Sau */}
              <button
                type="button"
                onClick={handleNextMonth}
                className="size-10 rounded-full border border-border bg-card hover:bg-muted text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
                title="Tháng sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 h-10 px-4 rounded-full bg-card border border-border shadow-xs">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                Tất cả thời gian
              </span>
            </div>
          )}
        </div>

        {/* Right: Chuyển đổi chế độ (Theo Tháng / Tất Cả) */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-full shrink-0">
          <button
            type="button"
            onClick={() => handleChangeViewMode("MONTH")}
            className={`px-3.5 py-2 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
              viewMode === "MONTH"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Theo tháng
          </button>
          <button
            type="button"
            onClick={() => handleChangeViewMode("ALL")}
            className={`px-3.5 py-2 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
              viewMode === "ALL"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tất cả
          </button>
        </div>
      </div>

      {/* 2. Tổng thu / chi / chênh lệch */}
      <StatList
        columns={3}
        items={[
          { label: "Thu", value: `+${formatVND(totalIncome)}`, tone: "text-emerald-600 dark:text-emerald-400", icon: TrendingUp, iconTone: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" },
          { label: "Chi", value: `-${formatVND(totalExpense)}`, tone: "text-rose-600 dark:text-rose-400", icon: TrendingDown, iconTone: "bg-rose-500/12 text-rose-600 dark:text-rose-400" },
          {
            label: "Chênh lệch",
            value: `${totalIncome - totalExpense >= 0 ? "+" : "-"}${formatVND(Math.abs(totalIncome - totalExpense))}`,
            tone: totalIncome - totalExpense >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
            icon: ArrowUpDown,
            iconTone: "bg-primary/12 text-primary",
          },
        ]}
      />

      <QuickTextEntry categories={categories} onCreated={() => fetchTransactions()} />

      {/* 3. Action Buttons & Filter */}
      <div className="space-y-3">
        <div className="hidden justify-end lg:flex">
          <Button onClick={handleCreate} className="h-11 gap-2 rounded-full px-5 text-sm font-bold shadow-md shadow-primary/25 cursor-pointer">
            <Plus className="size-4" /> Thêm giao dịch
          </Button>
        </div>

        {/* Thanh lọc full-width 100% */}
        <div className="w-full">
          <TransactionFilter
            categories={categories}
            typeFilter={typeFilter}
            onTypeChange={handleTypeChange}
            categoryFilter={categoryFilter}
            onCategoryChange={handleCategoryChange}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>
      </div>

      {/* Transaction List */}
      <TransactionList
        transactions={transactions}
        onEdit={handleEdit}
        onRefresh={fetchTransactions}
      />

      {/* Nút thêm nổi trên di động */}
      <button
        type="button"
        onClick={handleCreate}
        className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.5rem)] right-4 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-hero px-5 text-base font-bold text-hero-foreground shadow-xl lg:hidden cursor-pointer"
      >
        <Plus className="size-5" /> Thêm
      </button>

      <TransactionDialog
        transaction={selectedTransaction}
        categories={categories}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={fetchTransactions}
        onRefreshCategories={fetchCategories}
      />
    </div>
  );
}
