"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, CheckCircle2, Circle, ListOrdered, Pencil, Plus, ReceiptText, Trash2 } from "lucide-react";
import {
  BillOccurrence,
  BillPlan,
  deleteBillAction,
  getBillPlansAction,
  getBillsForMonthAction,
  payBillAction,
  unpayBillAction,
} from "@/actions/bill";
import { CategoryData } from "@/actions/category";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MonthSwitcher } from "@/components/ui/month-switcher";
import { PageHeader } from "@/components/ui/page-header";
import { SectionLabel } from "@/components/ui/section-label";
import { toast } from "@/components/ui/toast";
import { BillDialog } from "@/components/bills/bill-dialog";
import { keyToUTC, parseDateKey, REPEAT_LABELS } from "@/lib/bills";
import { getCategoryIcon } from "@/lib/category-icons";
import { daysInMonth, mondayIndex, shiftMonth, VNDate, WEEKDAY_SHORT, weekdayName } from "@/lib/date-vn";
import { cn, formatCompactVND, formatVND } from "@/lib/utils";

interface BillsManagerProps {
  today: VNDate;
  initialBills: BillOccurrence[];
  initialPlans: BillPlan[];
  categories: CategoryData[];
}

type Tab = "monthly" | "list";
type EditableBill = Pick<BillPlan, "billId" | "name" | "amount" | "repeat" | "note" | "startDate" | "endMonth" | "category">;

const DAY_MS = 86_400_000;
const keyOf = (y: number, m: number, token: number) => `${y}-${m}#${token}`;

function daysFromToday(dueKey: string, today: VNDate) {
  return Math.round((keyToUTC(dueKey).getTime() - Date.UTC(today.year, today.month - 1, today.day)) / DAY_MS);
}

const fmtMonth = (key: string) => {
  const [y, m] = key.split("-");
  return `${m}/${y}`;
};

/** Quy đổi về số tiền mỗi tháng để ước lượng nghĩa vụ hằng tháng */
function monthlyEquivalent(plan: BillPlan) {
  if (plan.repeat === "WEEKLY") return (plan.amount * 52) / 12;
  if (plan.repeat === "YEARLY") return plan.amount / 12;
  if (plan.repeat === "MONTHLY") return plan.amount;
  return 0;
}

export function BillsManager({ today, initialBills, initialPlans, categories }: BillsManagerProps) {
  const [tab, setTab] = useState<Tab>("monthly");
  const [view, setView] = useState({ year: today.year, month: today.month });
  const [reloadToken, setReloadToken] = useState(0);
  const [monthResult, setMonthResult] = useState({ key: keyOf(today.year, today.month, 0), bills: initialBills });
  const [plansResult, setPlansResult] = useState({ token: 0, plans: initialPlans });
  const [busy, setBusy] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; bill: EditableBill | null }>({ open: false, bill: null });
  const [confirm, setConfirm] = useState<{ kind: "delete"; bill: EditableBill } | { kind: "unpay"; bill: BillOccurrence } | null>(null);

  const requestKey = keyOf(view.year, view.month, reloadToken);
  const loadingMonth = monthResult.key !== requestKey;
  const bills = monthResult.bills;
  const plans = plansResult.plans;

  useEffect(() => {
    if (monthResult.key === requestKey) return;
    let cancelled = false;
    getBillsForMonthAction(view.year, view.month)
      .then((res) => {
        if (cancelled) return;
        if (!res.success) toast.error(res.error || "Không tải được hóa đơn.");
        setMonthResult((prev) => ({ key: requestKey, bills: res.success ? res.bills ?? [] : prev.bills }));
      })
      .catch(() => !cancelled && setMonthResult((prev) => ({ key: requestKey, bills: prev.bills })));
    return () => {
      cancelled = true;
    };
  }, [requestKey, monthResult.key, view.year, view.month]);

  useEffect(() => {
    if (plansResult.token === reloadToken) return;
    let cancelled = false;
    getBillPlansAction()
      .then((res) => !cancelled && setPlansResult((prev) => ({ token: reloadToken, plans: res.success ? res.plans ?? [] : prev.plans })))
      .catch(() => !cancelled && setPlansResult((prev) => ({ token: reloadToken, plans: prev.plans })));
    return () => {
      cancelled = true;
    };
  }, [reloadToken, plansResult.token]);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);
  const closeDialog = useCallback(() => setDialog((d) => ({ ...d, open: false })), []);
  const defaultDate = useMemo(
    () => new Date(view.year, view.month - 1, view.year === today.year && view.month === today.month ? today.day : 1),
    [view, today]
  );

  const togglePaid = async (bill: BillOccurrence) => {
    if (bill.paid) return setConfirm({ kind: "unpay", bill });
    const id = `${bill.billId}@${bill.dueDate}`;
    setBusy(id);
    try {
      const res = await payBillAction(bill.billId, bill.dueDate);
      if (res.success) toast.success(res.message || "Đã trả hóa đơn.");
      else toast.error(res.error || "Không ghi được.");
      reload();
    } finally {
      setBusy(null);
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setBusy("confirm");
    try {
      const res =
        confirm.kind === "delete"
          ? await deleteBillAction(confirm.bill.billId)
          : await unpayBillAction(confirm.bill.billId, confirm.bill.dueDate);
      if (res.success) toast.success(res.message || "Xong.");
      else toast.error(res.error || "Thao tác thất bại.");
      setConfirm(null);
      reload();
    } finally {
      setBusy(null);
    }
  };

  const openAdd = () => setDialog({ open: true, bill: null });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hóa đơn"
        description="Tiền nhà, điện nước, Netflix, trả góp… Trả 1 chạm là ghi luôn vào chi tiêu."
        actions={
          <button
            type="button"
            onClick={openAdd}
            className="hidden h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 md:inline-flex cursor-pointer"
          >
            <Plus className="size-4" /> Thêm hóa đơn
          </button>
        }
      />

      {/* 2 tab con */}
      <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1 sm:inline-grid" role="tablist" aria-label="Chế độ xem">
        {(
          [
            { id: "monthly", text: "Lịch trả", icon: CalendarDays },
            { id: "list", text: "Danh sách", icon: ListOrdered },
          ] as const
        ).map(({ id, text, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors cursor-pointer",
              tab === id ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{text}</span>
          </button>
        ))}
      </div>

      {tab === "monthly" ? (
        <MonthlyView
          today={today}
          view={view}
          bills={bills}
          loading={loadingMonth}
          busy={busy}
          onShift={(d) => setView((v) => shiftMonth(v.year, v.month, d))}
          onToggle={togglePaid}
          onAdd={openAdd}
        />
      ) : (
        <ListView
          today={today}
          plans={plans}
          onAdd={openAdd}
          onEdit={(bill) => setDialog({ open: true, bill })}
          onDelete={(bill) => setConfirm({ kind: "delete", bill })}
        />
      )}

      <p className="px-1 text-xs leading-relaxed text-muted-foreground">
        Hóa đơn chưa trả chỉ là lời nhắc, không được ghi thành khoản nợ. “Xác nhận đã trả” sẽ ghi một khoản chi và trừ vào
        Ví chính; “Bỏ trả” xóa khoản chi đó và cộng lại tiền.
      </p>

      {/* Nút thêm nổi trên di động */}
      <button
        type="button"
        onClick={openAdd}
        className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.5rem)] right-4 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-hero px-5 text-base font-bold text-hero-foreground shadow-xl md:hidden cursor-pointer"
      >
        <Plus className="size-5" /> Thêm hóa đơn
      </button>

      <BillDialog
        isOpen={dialog.open}
        bill={dialog.bill}
        categories={categories}
        defaultDate={defaultDate}
        onClose={closeDialog}
        onSaved={reload}
      />

      <ConfirmDialog
        isOpen={!!confirm}
        title={confirm?.kind === "delete" ? "Xóa hóa đơn này?" : "Bỏ đánh dấu đã trả?"}
        description={
          confirm?.kind === "delete"
            ? `“${confirm.bill.name}” sẽ không còn được nhắc nữa. Các khoản chi đã trả trước đó vẫn được giữ trong Giao dịch.`
            : `Khoản chi ${confirm ? formatVND(confirm.bill.amount) : ""} đã ghi cho kỳ này sẽ bị xóa và tiền được cộng lại vào ví.`
        }
        confirmText={confirm?.kind === "delete" ? "Xóa hóa đơn" : "Bỏ trả"}
        cancelText="Hủy"
        variant="destructive"
        loading={busy === "confirm"}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
      />
    </div>
  );
}

/* ---------------- Lịch trả theo tháng ---------------- */

interface MonthlyViewProps {
  today: VNDate;
  view: { year: number; month: number };
  bills: BillOccurrence[];
  loading: boolean;
  busy: string | null;
  onShift: (delta: -1 | 1) => void;
  onToggle: (bill: BillOccurrence) => void;
  onAdd: () => void;
}

function MonthlyView({ today, view, bills, loading, busy, onShift, onToggle, onAdd }: MonthlyViewProps) {
  const totalDue = bills.reduce((s, b) => s + b.amount, 0);
  const totalPaid = bills.reduce((s, b) => (b.paid ? s + b.amount : s), 0);
  const remaining = totalDue - totalPaid;

  const groups = useMemo(() => {
    const map = new Map<string, BillOccurrence[]>();
    for (const b of bills) map.set(b.dueDate, [...(map.get(b.dueDate) ?? []), b]);
    return [...map.entries()];
  }, [bills]);

  return (
    <div className={cn("space-y-5 transition-opacity", loading && "opacity-60")} aria-busy={loading}>
      <div className="flex justify-center sm:justify-start">
        <MonthSwitcher year={view.year} month={view.month} onChange={onShift} />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: "Cần trả", value: totalDue, tone: "text-foreground" },
          { label: "Đã trả", value: totalPaid, tone: "text-emerald-600 dark:text-emerald-400" },
          {
            label: "Còn lại",
            value: remaining,
            tone: remaining > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400",
          },
        ].map(({ label, value, tone }) => (
          <div key={label} className="min-w-0 rounded-3xl border border-border bg-card p-3 text-center shadow-xs sm:p-5">
            <p className="text-xs font-semibold text-muted-foreground sm:text-sm">{label}</p>
            <p className={cn("mt-1 truncate text-sm font-extrabold sm:text-xl", tone)}>{formatVND(value)}</p>
          </div>
        ))}
      </div>

      <BillCalendar today={today} view={view} groups={groups} />

      {groups.length === 0 ? (
        <EmptyState text={`Không có hóa đơn nào đến hạn trong tháng ${view.month}/${view.year}.`} onAdd={onAdd} />
      ) : (
        <div className="space-y-4">
          {groups.map(([dueKey, items]) => {
            const { year, month, day } = parseDateKey(dueKey);
            const diff = daysFromToday(dueKey, today);
            const overdue = diff < 0 && items.some((i) => !i.paid);
            return (
              <section
                key={dueKey}
                id={`bill-day-${dueKey}`}
                className="scroll-mt-24 overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-xs target:ring-2 target:ring-primary"
              >
                <header className="flex items-center justify-between gap-3 border-b border-border/70 bg-primary/5 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-extrabold text-primary-foreground">
                      {day}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold">
                        {weekdayName(year, month, day)}, {day}/{month}
                        {diff === 0 && <span className="ml-1.5 text-primary">· Hôm nay</span>}
                      </h3>
                      <p className="text-xs text-muted-foreground">{items.length} khoản cần trả</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold">{formatVND(items.reduce((s, i) => s + i.amount, 0))}</p>
                    {overdue && (
                      <p className="flex items-center justify-end gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                        <AlertCircle className="size-3" aria-hidden /> Quá hạn
                      </p>
                    )}
                  </div>
                </header>

                <ul className="divide-y divide-border/70">
                  {items.map((bill) => {
                    const id = `${bill.billId}@${bill.dueDate}`;
                    const late = !bill.paid && diff < 0;
                    const Icon = getCategoryIcon(bill.category.icon);
                    return (
                      <li key={id} className="flex gap-3 px-4 py-3.5">
                        <button
                          type="button"
                          disabled={busy === id}
                          onClick={() => onToggle(bill)}
                          aria-label={bill.paid ? `Bỏ đánh dấu đã trả ${bill.name}` : `Đánh dấu đã trả ${bill.name}`}
                          className="mt-0.5 shrink-0 self-start transition-transform active:scale-90 disabled:opacity-50 cursor-pointer"
                        >
                          {bill.paid ? (
                            <CheckCircle2 className="size-6 text-emerald-500" />
                          ) : (
                            <Circle className="size-6 text-muted-foreground hover:text-primary" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className={cn("truncate text-sm font-bold", bill.paid && "text-muted-foreground line-through")}>
                                {bill.name}{" "}
                                <span className="font-semibold text-muted-foreground no-underline">
                                  (Kỳ {bill.seq}
                                  {bill.total ? `/${bill.total}` : ""})
                                </span>
                              </p>
                              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                                <Icon className="size-3.5 shrink-0" style={{ color: bill.category.color }} aria-hidden />
                                <span className="truncate">
                                  {bill.category.name} · {REPEAT_LABELS[bill.repeat]}
                                </span>
                              </p>
                            </div>
                            <p
                              className={cn(
                                "shrink-0 text-base font-extrabold",
                                bill.paid ? "text-muted-foreground line-through" : late ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                              )}
                            >
                              {formatVND(bill.amount)}
                            </p>
                          </div>

                          <div className="mt-2.5 flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold">
                              {bill.paid ? (
                                <span className="text-emerald-600 dark:text-emerald-400">✓ Đã trả</span>
                              ) : late ? (
                                <span className="text-rose-600 dark:text-rose-400">Chưa trả (quá hạn)</span>
                              ) : (
                                <span className="text-muted-foreground">Hạn: {day}/{month}</span>
                              )}
                            </p>
                            <button
                              type="button"
                              disabled={busy === id}
                              onClick={() => onToggle(bill)}
                              className={cn(
                                "h-9 shrink-0 rounded-full px-4 text-xs font-bold transition-colors disabled:opacity-60 cursor-pointer",
                                bill.paid
                                  ? "border border-border text-muted-foreground hover:text-foreground"
                                  : "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                              )}
                            >
                              {bill.paid ? "Bỏ trả" : "Xác nhận đã trả"}
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- Lưới lịch trả trong tháng ---------------- */

const BILL_DAY_TONES = {
  paid: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/12 dark:text-emerald-300",
  due: "border-primary/30 bg-primary/10 text-primary",
  late: "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/35 dark:bg-rose-500/15 dark:text-rose-300",
} as const;

function BillCalendar({
  today,
  view,
  groups,
}: {
  today: VNDate;
  view: { year: number; month: number };
  groups: [string, BillOccurrence[]][];
}) {
  const byDay = new Map(groups.map(([key, items]) => [Number(key.slice(8, 10)), { key, items }]));
  const total = daysInMonth(view.year, view.month);
  const leading = mondayIndex(view.year, view.month, 1);
  const isCurrent = view.year === today.year && view.month === today.month;

  return (
    <section aria-label={`Lịch trả tháng ${view.month}/${view.year}`} className="rounded-[1.75rem] border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAY_SHORT.map((w) => (
          <div key={w} aria-hidden className="pb-1 text-center text-xs font-bold text-muted-foreground">
            {w}
          </div>
        ))}
        {Array.from({ length: leading }, (_, i) => (
          <div key={`e${i}`} aria-hidden />
        ))}
        {Array.from({ length: total }, (_, i) => {
          const day = i + 1;
          const entry = byDay.get(day);
          const isToday = isCurrent && day === today.day;
          const cellBase = "flex min-h-14 flex-col items-center gap-0.5 rounded-xl border px-0.5 pt-1.5 pb-1 sm:min-h-16 sm:rounded-2xl";

          if (!entry) {
            return (
              <div key={day} className={cn(cellBase, "border-transparent text-muted-foreground", isToday && "ring-2 ring-primary ring-offset-1 ring-offset-card")}>
                <span className="text-sm font-semibold leading-none">{day}</span>
              </div>
            );
          }

          const unpaid = entry.items.filter((b) => !b.paid);
          const late = unpaid.length > 0 && daysFromToday(entry.key, today) < 0;
          const tone = unpaid.length === 0 ? "paid" : late ? "late" : "due";
          const amount = (unpaid.length ? unpaid : entry.items).reduce((s, b) => s + b.amount, 0);
          return (
            // Liên kết neo: trình duyệt cuộn tới nhóm ngày đó và tô viền nhờ :target
            <a
              key={day}
              href={`#bill-day-${entry.key}`}
              aria-label={`Ngày ${day}: ${entry.items.length} hóa đơn, ${
                tone === "paid" ? "đã trả hết" : `còn ${formatVND(amount)}${late ? ", quá hạn" : ""}`
              }`}
              className={cn(
                cellBase,
                "transition-transform active:scale-95",
                BILL_DAY_TONES[tone],
                isToday && "ring-2 ring-primary ring-offset-1 ring-offset-card"
              )}
            >
              <span className="text-sm font-bold leading-none">{day}</span>
              <span className="text-[10px] font-bold leading-tight sm:text-xs">{formatCompactVND(amount)}</span>
              {entry.items.length > 1 && <span className="text-[9px] font-semibold opacity-80">{entry.items.length} khoản</span>}
            </a>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3 text-xs font-semibold">
        <span className="text-muted-foreground">Chú thích:</span>
        <span className={cn("rounded-full border px-2 py-0.5", BILL_DAY_TONES.due)}>Chưa trả</span>
        <span className={cn("rounded-full border px-2 py-0.5", BILL_DAY_TONES.late)}>Quá hạn</span>
        <span className={cn("rounded-full border px-2 py-0.5", BILL_DAY_TONES.paid)}>Đã trả</span>
        <span className="text-muted-foreground">· chạm vào ngày để xem chi tiết</span>
      </div>
    </section>
  );
}

/* ---------------- Danh sách hóa đơn ---------------- */

interface ListViewProps {
  today: VNDate;
  plans: BillPlan[];
  onAdd: () => void;
  onEdit: (bill: EditableBill) => void;
  onDelete: (bill: EditableBill) => void;
}

function ListView({ today, plans, onAdd, onEdit, onDelete }: ListViewProps) {
  const active = plans.filter((p) => p.nextDue !== null);
  const ended = plans.filter((p) => p.nextDue === null);
  const finished = (p: BillPlan) => p.total !== null && p.paidCount >= p.total;
  const monthly = active.reduce((s, p) => s + monthlyEquivalent(p), 0);

  if (plans.length === 0) return <EmptyState text="Chưa có hóa đơn nào." onAdd={onAdd} />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="col-span-2 rounded-3xl bg-hero p-5 text-hero-foreground shadow-lg lg:col-span-1">
          <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-80">Mỗi tháng cần trả khoảng</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight">{formatVND(Math.round(monthly))}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <p className="text-sm font-semibold text-muted-foreground">Đang theo dõi</p>
          <p className="mt-1 text-2xl font-extrabold">
            {active.length} <span className="text-sm font-semibold text-muted-foreground">hóa đơn</span>
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs">
          <p className="text-sm font-semibold text-muted-foreground">Đã kết thúc</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {ended.length} <span className="text-sm font-semibold text-muted-foreground">hóa đơn</span>
          </p>
        </div>
      </div>

      {[
        { title: `Đang theo dõi (${active.length})`, items: active },
        { title: `Đã kết thúc (${ended.length})`, items: ended },
      ]
        .filter((g) => g.items.length > 0)
        .map((group) => (
          <section key={group.title} className="space-y-3">
            <SectionLabel icon={ReceiptText} className="px-1">
              {group.title}
            </SectionLabel>
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {group.items.map((plan) => {
                const Icon = getCategoryIcon(plan.category.icon);
                const progress = plan.total ? Math.min(1, plan.paidCount / plan.total) : null;
                const next = plan.nextDue ? parseDateKey(plan.nextDue) : null;
                const nextDiff = plan.nextDue ? daysFromToday(plan.nextDue, today) : 0;
                const start = parseDateKey(plan.startDate);
                return (
                  <li key={plan.billId} className="rounded-[1.75rem] border border-border bg-card p-4 shadow-xs sm:p-5">
                    <div className="flex items-start gap-3">
                      <span
                        className="flex size-11 shrink-0 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: `${plan.category.color}1f`, color: plan.category.color }}
                      >
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {REPEAT_LABELS[plan.repeat]} · từ {start.day}/{start.month}/{start.year}
                          {plan.repeat !== "NONE" && (plan.endMonth ? ` → ${fmtMonth(plan.endMonth)}` : " · không thời hạn")}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center">
                        <button
                          type="button"
                          onClick={() => onEdit(plan)}
                          aria-label={`Sửa ${plan.name}`}
                          className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(plan)}
                          aria-label={`Xóa ${plan.name}`}
                          className="flex size-9 items-center justify-center rounded-full text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Mỗi kỳ</p>
                        <p className="text-lg font-extrabold">{formatVND(plan.amount)}</p>
                      </div>
                      <p className="text-right text-xs font-semibold">
                        {next ? (
                          <span className={nextDiff < 0 ? "text-rose-600 dark:text-rose-400" : nextDiff <= 3 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
                            Kỳ tới: {next.day}/{next.month}
                            {nextDiff < 0 ? ` · quá hạn ${-nextDiff} ngày` : nextDiff === 0 ? " · hôm nay" : nextDiff <= 3 ? ` · còn ${nextDiff} ngày` : ""}
                          </span>
                        ) : finished(plan) ? (
                          <span className="text-emerald-600 dark:text-emerald-400">✓ Đã trả xong</span>
                        ) : (
                          <span className="text-muted-foreground">Đã hết hạn</span>
                        )}
                      </p>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      {progress !== null && (
                        <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress * 100}%` }} />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Đã trả {plan.paidCount}
                        {plan.total ? `/${plan.total}` : ""} kỳ · {formatVND(plan.paidAmount)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
    </div>
  );
}

function EmptyState({ text, onAdd }: { text: string; onAdd: () => void }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-border bg-card/60 p-8 text-center">
      <ReceiptText className="mx-auto size-9 text-primary/50" aria-hidden />
      <p className="mt-2 font-bold">{text}</p>
      <p className="mt-1 text-sm text-muted-foreground">Thêm tiền nhà, điện nước, gói đăng ký hay trả góp để được nhắc đến hạn.</p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-primary/10 px-4 text-sm font-bold text-primary cursor-pointer"
      >
        <Plus className="size-4" /> Thêm hóa đơn
      </button>
    </div>
  );
}
