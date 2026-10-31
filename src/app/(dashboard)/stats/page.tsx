import { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/dashboard/analytics-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description: "Thống kê thu chi theo danh mục và theo kỳ",
};

export default function StatsPage() {
  return <AnalyticsDashboard />;
}
