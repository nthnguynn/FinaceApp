import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getTransactionsAction } from "@/actions/transaction";
import { getWalletAction } from "@/actions/wallet";
import { getCategoriesAction } from "@/actions/category";
import { getBillsForMonthAction } from "@/actions/bill";
import { CalendarHome } from "@/components/calendar/calendar-home";
import { monthRange, toVNDate } from "@/lib/date-vn";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description: "Lịch chi tiêu theo ngày, số dư khả dụng và hạn mức chi an toàn mỗi ngày",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const today = toVNDate(new Date());
  const [tx, wallet, cats, bills] = await Promise.all([
    getTransactionsAction(monthRange(today.year, today.month)),
    getWalletAction(),
    getCategoriesAction(),
    getBillsForMonthAction(today.year, today.month),
  ]);

  return (
    <CalendarHome
      userName={session.name}
      today={today}
      initialData={{
        transactions: tx.transactions ?? [],
        totalIncome: tx.totalIncome ?? 0,
        totalExpense: tx.totalExpense ?? 0,
        balance: wallet.wallet?.balance ?? 0,
        bills: bills.bills ?? [],
      }}
      initialCategories={cats.categories ?? []}
    />
  );
}
