"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarHeart, Gauge, Landmark, Lightbulb, Pencil, Plus, ReceiptText, Wallet } from "lucide-react";
import { BillOccurrence, getBillsForMonthAction } from "@/actions/bill";
import { getTransactionsAction, TransactionData } from "@/actions/transaction";
import { getWalletAction } from "@/actions/wallet";
import { CategoryData, getCategoriesAction } from "@/actions/category";
import { TransactionDialog } from "@/components/transaction/transaction-dialog";
import { QuickTextEntry } from "@/components/transaction/quick-text-entry";
import { usePendingTransactions } from "@/components/bank-sync/pending-transactions-provider";
import { MonthSwitcher } from "@/components/ui/month-switcher";
import { PageHeader } from "@/components/ui/page-header";
import { SectionLabel } from "@/components/ui/section-label";
import { getCategoryIcon } from "@/lib/category-icons";
import { daysInMonth, monthRange, shiftMonth, toVNDate, VNDate, weekdayName } from "@/lib/date-vn";
import { cn, formatVND } from "@/lib/utils";
import { DayTotals, MoneyCalendar } from "./money-calendar";

interface MonthData {
  transactions: TransactionData[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
  bills: BillOccurrence[];
}

interface CalendarHomeProps {
  userName: string;
  today: VNDate;
  initialData: MonthData;
  initialCategories: CategoryData[];
}

const keyOf = (year: number, month: number, token: number) => `${year}-${month}#${token}`;

function spendingTip(income: number, expense: number) {
  if (income <= 0) {
    return expense > 0
      ? "Tháng này chưa có khoản thu nào — hãy ghi lại lương hoặc tiền nhận về."
      : "Chưa có giao dịch nào trong tháng này.";
  }
  const pct = Math.round((expense / income) * 100);
  if (pct <= 50) return `Nhịp chi tiêu ổn! Bạn đã chi ${pct}% thu nhập tháng này.`;
  if (pct <= 90) return `Cân nhắc nhé, bạn đã chi ${pct}% thu nhập tháng này.`;
  return `Bạn đã chi ${pct}% thu nhập tháng này — nên chậm lại.`;
}

export function CalendarHome({ userName, today, initialData, initialCategories }: CalendarHomeProps) {
  const { pendingCount } = usePendingTransactions();
  const [view, setView] = useState({ year: today.year, month: today.month });
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<{ key: string; data: MonthData }>({
    key: keyOf(today.year, today.month, 0),
    data: initialData,
  });
  const [categories, setCategories] = useState(initialCategories);
  const [selected, setSelected] = useState<{ key: string; day: number } | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; transaction: TransactionData | null; date?: Date }>({
    open: false,
    transaction: null,
  });

  const requestKey = keyOf(view.year, view.month, reloadToken);
  const loading = result.key !== requestKey;
  const { transactions, totalIncome, totalExpense, balance, bills } = result.data;
  const unpaidBills = bills.filter((b) => !b.paid);

  useEffect(() => {
    if (result.key === requestKey) return;
    let cancelled = false;
    Promise.all([
      getTransactionsAction(monthRange(view.year, view.month)),
      getWalletAction(),
      getBillsForMonthAction(view.year, view.month),
    ])
      .then(([tx, wallet, bills]) => {
        if (cancelled) return;
        setResult((prev) => ({
          key: requestKey,
          data: tx.success
            ? {
                transactions: tx.transactions ?? [],
                totalIncome: tx.totalIncome ?? 0,
                totalExpense: tx.totalExpense ?? 0,
                balance: wallet.wallet?.balance ?? prev.data.balance,
                bills: bills.bills ?? [],
              }
            : prev.data,
        }));
      })
      .catch(() => {
        if (!cancelled) setResult((prev) => ({ key: requestKey, data: prev.data }));
      });
    return () => {
      cancelled = true;
    };
  }, [requestKey, result.key, view.year, view.month]);

  const isCurrentMonth = view.year === today.year && view.month === today.month;
  const monthKey = `${view.year}-${view.month}`;
  // Ngày đang chọn chỉ có hiệu lực trong tháng đã chọn nó; mặc định là hôm nay
  const selectedDay = selected?.key === monthKey ? selected.day : isCurrentMonth ? today.day : null;

  const days = useMemo(() => {
    const map = new Map<number, DayTotals>();
    for (const t of transactions) {
      const { day } = toVNDate(t.date);
      const entry = map.get(day) ?? { income: 0, expense: 0, count: 0 };
      if (t.type === "INCOME") entry.income += t.amount;
      else entry.expense += t.amount;
      entry.count += 1;
      map.set(day, entry);
    }
    return map;
  }, [transactions]);

  const dayTransactions = useMemo(
    () => (selectedDay ? transactions.filter((t) => toVNDate(t.date).day === selectedDay) : []),
    [transactions, selectedDay]
  );

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);
  const refreshCategories = useCallback(async () => {
    const res = await getCategoriesAction();
    if (res.success && res.categories) setCategories(res.categories);
  }, []);

  const dateForDay = useCallback(
    (day: number) => {
      const now = new Date();
      return new Date(view.year, view.month - 1, day, now.getHours(), now.getMinutes());
    },
    [view.year, view.month]
  );
  // Ô gõ nhanh ghi vào ngày đang chọn trên lịch
  const quickBaseDate = useMemo(() => (selectedDay ? dateForDay(selectedDay) : undefined), [selectedDay, dateForDay]);
  const quickBaseLabel =
    !selectedDay || (isCurrentMonth && selectedDay === today.day) ? "hôm nay" : `ngày ${selectedDay}/${view.month}`;
  const openAdd = (day?: number | null) =>
    setDialog({ open: true, transaction: null, date: day ? dateForDay(day) : undefined });
  const closeDialog = useCallback(() => setDialog((d) => ({ ...d, open: false })), []);

  // Hạn mức an toàn: số dư chia đều cho số ngày còn lại của tháng (tính cả hôm nay)
  const totalDays = daysInMonth(view.year, view.month);
  const daysLeft = isCurrentMonth ? totalDays - today.day + 1 : 0;
  const safeDaily = isCurrentMonth ? Math.max(0, balance) / daysLeft : 0;
  const todaySpent = isCurrentMonth ? days.get(today.day)?.expense ?? 0 : 0;
  const elapsedDays = isCurrentMonth ? today.day : totalDays;
  const dailyAverage = totalExpense / Math.max(1, elapsedDays);
  const todayRatio = safeDaily > 0 ? Math.min(1, todaySpent / safeDaily) : todaySpent > 0 ? 1 : 0;
  const overToday = isCurrentMonth && todaySpent > safeDaily;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch chi tiêu"
        description={`Chào ${userName}, đây là bức tranh tháng ${view.month} của bạn.`}
        actions={
          <>
            <MonthSwitcher
              year={view.year}
              month={view.month}
              onChange={(delta) => setView((v) => shiftMonth(v.year, v.month, delta))}
            />
            <button
              type="button"
              onClick={() => openAdd(selectedDay)}
              className="hidden h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 md:inline-flex cursor-pointer"
            >
              <Plus className="size-4" /> Thêm giao dịch
            </button>
          </>
        }
      />

      <div className={cn("grid grid-cols-1 gap-5 transition-opacity lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-6", loading && "opacity-60")} aria-busy={loading}>
        {/* Cột trái: số dư + lịch */}
        <div className="space-y-5">
          <section aria-label="Số dư khả dụng" className="relative overflow-hidden rounded-[1.75rem] bg-hero p-5 text-hero-foreground shadow-lg sm:p-6">
            {/* Hình trang trí góc phải (không đè lên nội dung) */}
            <div aria-hidden className="pointer-events-none absolute right-4 top-4 sm:right-6 sm:top-5">
              <div className="flex size-20 rotate-6 items-center justify-center rounded-3xl bg-white/10 sm:size-24">
                <CalendarHeart className="size-10 text-pink-200 sm:size-12" strokeWidth={1.5} />
              </div>
              <div className="absolute -bottom-2 -left-3 flex size-9 items-center justify-center rounded-full bg-amber-400 text-base font-black text-amber-900 shadow-md">
                ₫
              </div>
            </div>

            <div className="relative flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em]">
                <Wallet className="size-3.5" aria-hidden /> Khả dụng
              </span>
              <Link
                href="/wallets"
                aria-label="Chỉnh ví"
                className="flex size-8 items-center justify-center rounded-full bg-white/12 hover:bg-white/20"
              >
                <Pencil className="size-3.5" />
              </Link>
            </div>
            <p className="relative mt-3 pr-24 text-3xl font-extrabold tracking-tight sm:pr-28 sm:text-4xl">{formatVND(balance)}</p>
            <p className="relative mt-5 flex items-start gap-2 rounded-2xl bg-black/20 px-3 py-2 text-sm leading-snug">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden />
              {spendingTip(totalIncome, totalExpense)}
            </p>
          </section>

          <QuickTextEntry
            categories={categories}
            baseDate={quickBaseDate}
            baseLabel={quickBaseLabel}
            onCreated={reload}
          />

          <MoneyCalendar
            year={view.year}
            month={view.month}
            days={days}
            today={isCurrentMonth ? today.day : null}
            selectedDay={selectedDay}
            onSelectDay={(day) => setSelected({ key: monthKey, day })}
            onQuickAdd={(day) => {
              setSelected({ key: monthKey, day });
              openAdd(day);
            }}
          />
          <p className="-mt-2 px-1 text-xs text-muted-foreground">Mẹo: chạm đúp vào một ngày để ghi nhanh khoản chi cho ngày đó.</p>
        </div>

        {/* Cột phải: hạn mức + tổng tháng + chi tiết ngày */}
        <div className="space-y-5">
          <section aria-label="Hạn mức chi" className="rounded-[1.75rem] border border-border bg-card p-5 shadow-xs">
            <SectionLabel icon={Gauge} as="h2">
              {isCurrentMonth ? "Hạn mức an toàn / ngày" : "Trung bình chi / ngày"}
            </SectionLabel>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatVND(Math.round(isCurrentMonth ? safeDaily : dailyAverage))}
            </p>
            {isCurrentMonth ? (
              <>
                <p className="mt-1 text-sm text-muted-foreground">
                  Số dư chia đều cho {daysLeft} ngày còn lại của tháng.
                </p>
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">Hôm nay đã chi</span>
                    <span className={cn("font-bold", overToday ? "text-rose-600 dark:text-rose-400" : "text-foreground")}>
                      {formatVND(todaySpent)}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div
                      className={cn("h-full rounded-full transition-[width] duration-500", overToday ? "bg-rose-500" : "bg-emerald-500")}
                      style={{ width: `${todayRatio * 100}%` }}
                    />
                  </div>
                  {overToday && <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">Hôm nay đã vượt hạn mức an toàn.</p>}
                </div>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Tổng chi tháng {view.month} chia cho {totalDays} ngày.</p>
            )}
          </section>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-border bg-card p-4 shadow-xs">
              <p className="text-sm font-semibold text-muted-foreground">Thu tháng {view.month}</p>
              <p className="mt-1 truncate text-lg font-extrabold text-emerald-600 dark:text-emerald-400">+{formatVND(totalIncome)}</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-4 shadow-xs">
              <p className="text-sm font-semibold text-muted-foreground">Chi tháng {view.month}</p>
              <p className="mt-1 truncate text-lg font-extrabold text-rose-600 dark:text-rose-400">-{formatVND(totalExpense)}</p>
            </div>
          </div>

          {pendingCount > 0 && (
            <Link
              href="/bank-sync"
              className="flex items-center gap-3 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 transition-colors hover:bg-amber-500/15"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
                <Landmark className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{pendingCount} biến động ngân hàng chờ duyệt</span>
                <span className="block text-xs text-muted-foreground">Chạm để ghi sổ chỉ với 1 lần bấm</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          )}

          <section aria-labelledby="upcoming-bills-title" className="rounded-[1.75rem] border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <SectionLabel icon={ReceiptText} as="h2">
                <span id="upcoming-bills-title">Hóa đơn chưa trả</span>
              </SectionLabel>
              <Link href="/bills" className="text-sm font-bold text-primary hover:underline">
                Xem tất cả
              </Link>
            </div>
            {unpaidBills.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-border px-4 py-3 text-center text-sm text-muted-foreground">
                {bills.length ? "Đã trả hết hóa đơn tháng này." : "Chưa có hóa đơn nào đến hạn tháng này."}
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {unpaidBills.slice(0, 4).map((bill) => {
                  const day = Number(bill.dueDate.slice(8, 10));
                  const late = isCurrentMonth ? day < today.day : view.year * 12 + view.month < today.year * 12 + today.month;
                  return (
                    <li key={`${bill.billId}@${bill.dueDate}`} className="flex items-center gap-3 rounded-2xl bg-muted/50 px-3 py-2.5">
                      <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-xl bg-card text-sm font-extrabold leading-none">
                        {day}
                        <span className="mt-0.5 text-[9px] font-bold uppercase text-muted-foreground">Thg {view.month}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{bill.name}</span>
                        <span className={cn("block text-xs", late ? "font-semibold text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>
                          {late ? "Quá hạn" : isCurrentMonth && day === today.day ? "Đến hạn hôm nay" : `Hạn ${day}/${view.month}`}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-extrabold">{formatVND(bill.amount)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <DayDetail
            year={view.year}
            month={view.month}
            day={selectedDay}
            transactions={dayTransactions}
            totals={selectedDay ? days.get(selectedDay) : undefined}
            onAdd={() => openAdd(selectedDay)}
            onEdit={(t) => setDialog({ open: true, transaction: t })}
          />
        </div>
      </div>

      {/* Nút thêm nổi trên di động */}
      <button
        type="button"
        onClick={() => openAdd(selectedDay)}
        className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.5rem)] right-4 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-hero px-5 text-base font-bold text-hero-foreground shadow-xl md:hidden cursor-pointer"
      >
        <Plus className="size-5" /> Thêm
      </button>

      <TransactionDialog
        transaction={dialog.transaction}
        categories={categories}
        isOpen={dialog.open}
        defaultDate={dialog.date}
        onClose={closeDialog}
        onSuccess={reload}
        onRefreshCategories={refreshCategories}
      />
    </div>
  );
}

interface DayDetailProps {
  year: number;
  month: number;
  day: number | null;
  transactions: TransactionData[];
  totals?: DayTotals;
  onAdd: () => void;
  onEdit: (t: TransactionData) => void;
}

function DayDetail({ year, month, day, transactions, totals, onAdd, onEdit }: DayDetailProps) {
  if (!day) {
    return (
      <section className="rounded-[1.75rem] border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
        Chọn một ngày trên lịch để xem các khoản thu chi.
      </section>
    );
  }

  return (
    <section aria-labelledby="day-detail-title" className="rounded-[1.75rem] border border-border bg-card p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="day-detail-title" className="text-lg font-extrabold">
            {weekdayName(year, month, day)}, {day}/{month}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totals?.count ? (
              <>
                {totals.expense > 0 && <span className="font-semibold text-rose-600 dark:text-rose-400">-{formatVND(totals.expense)}</span>}
                {totals.expense > 0 && totals.income > 0 && " · "}
                {totals.income > 0 && <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{formatVND(totals.income)}</span>}
              </>
            ) : (
              "Chưa có giao dịch"
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3.5 text-sm font-bold text-primary hover:bg-primary/15 cursor-pointer"
        >
          <Plus className="size-4" /> Thêm
        </button>
      </div>

      {transactions.length > 0 && (
        <ul className="mt-4 divide-y divide-border/70">
          {transactions.map((t) => {
            const Icon = getCategoryIcon(t.category.icon);
            const income = t.type === "INCOME";
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onEdit(t)}
                  className="flex w-full items-center gap-3 rounded-xl py-3 text-left transition-colors hover:bg-muted/50 cursor-pointer"
                >
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${t.category.color}1f`, color: t.category.color }}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{t.category.name}</span>
                    {t.note && <span className="block truncate text-xs text-muted-foreground">{t.note}</span>}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-extrabold",
                      income ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {income ? "+" : "-"}
                    {formatVND(t.amount)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
