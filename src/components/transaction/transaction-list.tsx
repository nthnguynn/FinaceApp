"use client";

import { useState } from "react";
import { useIsClient } from "@/hooks/use-is-client";
import { TransactionData, deleteTransactionAction } from "@/actions/transaction";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pencil, Trash2, Receipt, Clock } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons";
import { formatVND, formatNumberVN } from "@/lib/utils";

interface TransactionListProps {
  transactions: TransactionData[];
  onEdit: (transaction: TransactionData) => void;
  onRefresh: () => void;
}

const DAY_OF_WEEK_FULL = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const DAY_OF_WEEK_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export function TransactionList({ transactions, onEdit, onRefresh }: TransactionListProps) {
  const [transactionToDelete, setTransactionToDelete] = useState<TransactionData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const isMounted = useIsClient();

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-[1.75rem] bg-card/60 space-y-3">
        <div className="p-4 rounded-full bg-muted text-muted-foreground">
          <Receipt className="h-8 w-8" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Chưa có giao dịch nào</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Bấm “Thêm” để ghi khoản thu chi đầu tiên của tháng.
          </p>
        </div>
      </div>
    );
  }

  // Helper lấy key ngày YYYY-MM-DD theo giờ địa phương
  const getLocalDateKey = (dateInput: Date | string) => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Nhóm giao dịch theo Ngày địa phương (YYYY-MM-DD)
  const groupedTransactions: Record<string, TransactionData[]> = {};

  transactions.forEach((t) => {
    const dateKey = getLocalDateKey(t.date);
    if (!dateKey) return;
    if (!groupedTransactions[dateKey]) {
      groupedTransactions[dateKey] = [];
    }
    groupedTransactions[dateKey].push(t);
  });

  const formatDateHeader = (dateStr: string) => {
    if (!dateStr) return "";

    if (isMounted) {
      const todayStr = getLocalDateKey(new Date());

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getLocalDateKey(yesterday);

      if (dateStr === todayStr) return "Hôm nay";
      if (dateStr === yesterdayStr) return "Hôm qua";
    }

    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return dateStr;

    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = DAY_OF_WEEK_FULL[dateObj.getDay()] || "";

    const formattedDay = String(day).padStart(2, "0");
    const formattedMonth = String(month).padStart(2, "0");

    return `${dayOfWeek}, ${formattedDay}/${formattedMonth}/${year}`;
  };

  const formatFullDateTime = (dateInput: Date | string) => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";

    const weekday = DAY_OF_WEEK_SHORT[d.getDay()] || "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${weekday}, ${day}/${month}/${year} • ${hours}:${minutes}`;
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;

    setDeleting(true);
    try {
      const res = await deleteTransactionAction(transactionToDelete.id);
      if (!res.success) {
        toast.error(res.error || "Xóa giao dịch thất bại.");
      } else {
        toast.success(res.message || "Xóa giao dịch thành công!");
        setTransactionToDelete(null);
        onRefresh();
      }
    } catch {
      toast.error("Có lỗi xảy ra khi xóa giao dịch.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedTransactions).map(([dateKey, items]) => {
        let dayIncome = 0;
        let dayExpense = 0;
        items.forEach((item) => {
          if (item.type === "INCOME") dayIncome += item.amount;
          else dayExpense += item.amount;
        });

        return (
          <div key={dateKey} className="space-y-2.5">
            {/* Header ngày (Thêm suppressHydrationWarning chống đụng độ thời gian máy chủ/khách) */}
            <div className="flex items-center justify-between px-2 text-xs font-bold uppercase tracking-[0.12em]">
              <span suppressHydrationWarning className="text-muted-foreground">
                {formatDateHeader(dateKey)}
              </span>
              <div className="flex items-center gap-2.5 text-xs font-bold tracking-normal normal-case">
                {dayIncome > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    +{formatNumberVN(dayIncome)} ₫
                  </span>
                )}
                {dayExpense > 0 && (
                  <span className="text-rose-600 dark:text-rose-400">
                    -{formatNumberVN(dayExpense)} ₫
                  </span>
                )}
              </div>
            </div>

            {/* List giao dịch trong ngày */}
            <div className="divide-y divide-border/60 rounded-[1.75rem] bg-card border border-border shadow-xs overflow-hidden">
              {items.map((t) => {
                const IconComp = getCategoryIcon(t.category.icon);
                const isIncome = t.type === "INCOME";

                return (
                  <div
                    key={t.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3.5 gap-2 sm:gap-4 hover:bg-muted/40 transition-colors group"
                  >
                    {/* Tra trái: Icon + Tên danh mục + Ghi chú */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="flex size-10 items-center justify-center rounded-2xl shrink-0"
                        style={{ backgroundColor: `${t.category.color}1f`, color: t.category.color }}
                      >
                        <IconComp className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground truncate">{t.category.name}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs">
                          <span suppressHydrationWarning className="inline-flex items-center gap-1 font-medium text-muted-foreground whitespace-nowrap">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            {formatFullDateTime(t.date)}
                          </span>
                          {t.note && (
                            <>
                              <span className="text-muted-foreground/40 hidden sm:inline">•</span>
                              <span className="line-clamp-1 font-medium text-foreground/80">
                                {t.note}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Vế phải: Số tiền + Nút hành động */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/30">
                      <span
                        className={`text-base font-extrabold ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatVND(t.amount)}
                      </span>

                      {/* Action Buttons: Hiển thị trên mobile touch & desktop hover */}
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onEdit(t)}
                          title="Sửa giao dịch"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setTransactionToDelete(t)}
                          className="text-destructive hover:bg-destructive/10"
                          title="Xóa giao dịch"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <ConfirmDialog
        isOpen={!!transactionToDelete}
        title="Xóa giao dịch này?"
        description={`Bạn có chắc chắn muốn xóa giao dịch ${transactionToDelete?.type === "INCOME" ? "Thu nhập" : "Chi tiêu"
          } "${transactionToDelete?.category.name || ""}" (${transactionToDelete
            ? formatVND(transactionToDelete.amount)
            : ""
          }) không? Số dư Ví chính sẽ được tự động hoàn trả.`}
        confirmText="Xóa giao dịch"
        cancelText="Hủy"
        variant="destructive"
        loading={deleting}
        onClose={() => setTransactionToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
