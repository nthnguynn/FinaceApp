import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCategoriesAction } from "@/actions/category";
import { CategoryManager } from "@/components/category/category-manager";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description: "Quản lý danh mục phân loại thu nhập và chi tiêu cá nhân",
};

export default async function CategoriesPage() {
  const result = await getCategoriesAction();

  if (!result.success || !result.categories) {
    if (result.error?.includes("đăng nhập")) {
      redirect("/login");
    }
  }

  const categories = result.categories || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Danh mục thu chi" description="Danh mục của bạn và bộ danh mục hệ thống dùng chung." back={{ href: "/profile", label: "Tôi" }} />

      <CategoryManager initialCategories={categories} />
    </div>
  );
}
