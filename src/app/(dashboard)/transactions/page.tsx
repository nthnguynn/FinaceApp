import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTransactionsAction } from "@/actions/transaction";
import { getCategoriesAction } from "@/actions/category";
import { TransactionManager } from "@/components/transaction/transaction-manager";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description: "Quản lý ghi nhận thu nhập và chi tiêu cá nhân",
};

export default async function TransactionsPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const lastDay = new Date(currentYear, currentMonth, 0).getDate();
  const startDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
  const endDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const [transResult, catResult] = await Promise.all([
    getTransactionsAction({ startDate, endDate }),
    getCategoriesAction(),
  ]);

  if (!transResult.success || !transResult.transactions) {
    if (transResult.error?.includes("đăng nhập")) {
      redirect("/login");
    }
  }

  const transactions = transResult.transactions || [];
  const categories = catResult.categories || [];
  const totalIncome = transResult.totalIncome || 0;
  const totalExpense = transResult.totalExpense || 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Giao dịch" description="Mọi khoản thu chi, nhóm theo ngày. Số dư Ví chính tự cập nhật." />

      <TransactionManager
        initialTransactions={transactions}
        initialCategories={categories}
        initialTotalIncome={totalIncome}
        initialTotalExpense={totalExpense}
        initialYear={currentYear}
        initialMonth={currentMonth}
      />
    </div>
  );
}
