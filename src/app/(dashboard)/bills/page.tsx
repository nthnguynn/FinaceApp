import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getBillPlansAction, getBillsForMonthAction } from "@/actions/bill";
import { getCategoriesAction } from "@/actions/category";
import { BillsManager } from "@/components/bills/bills-manager";
import { toVNDate } from "@/lib/date-vn";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description: "Hóa đơn định kỳ: nhắc đến hạn, trả 1 chạm là ghi vào chi tiêu",
};

export default async function BillsPage() {
  const today = toVNDate(new Date());
  const [month, plans, cats] = await Promise.all([
    getBillsForMonthAction(today.year, today.month),
    getBillPlansAction(),
    getCategoriesAction(),
  ]);

  if (!month.success && month.error?.includes("đăng nhập")) {
    redirect("/login");
  }

  return (
    <BillsManager
      today={today}
      initialBills={month.bills ?? []}
      initialPlans={plans.plans ?? []}
      categories={cats.categories ?? []}
    />
  );
}
