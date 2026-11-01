"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryData, deleteCategoryAction } from "@/actions/category";
import { CategoryDialog } from "@/components/category/category-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import {
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Home,
  HeartPulse,
  Heart,
  Tag,
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
  Plus,
  Pencil,
  Trash2,
  Lock,
  FolderOpen,
} from "lucide-react";
import { Badminton } from "@/components/icons/badminton";

interface CategoryManagerProps {
  initialCategories: CategoryData[];
  onRefresh?: () => void;
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

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function CategoryManager({ initialCategories, onRefresh }: CategoryManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryData | null>(null);
  const [activeTab, setActiveTab] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleRefresh = () => {
    if (onRefresh) onRefresh();
    router.refresh();
  };

  const categories = initialCategories.filter((c) => c.type === activeTab);

  const handleCreate = () => {
    setSelectedCategory(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (category: CategoryData) => {
    setSelectedCategory(category);
    setIsDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setDeleting(true);
    try {
      const res = await deleteCategoryAction(categoryToDelete.id);
      if (!res.success) {
        toast.error(res.error || "Xóa danh mục thất bại.");
      } else {
        toast.success(res.message || "Xóa danh mục thành công!");
        setCategoryToDelete(null);
        handleRefresh();
      }
    } catch {
      toast.error("Có lỗi xảy ra khi xóa danh mục.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        {/* Tabs: Chi tiêu / Thu nhập */}
        <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl w-full sm:w-fit overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("EXPENSE")}
            className={`flex-1 sm:flex-none px-3.5 py-2.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "EXPENSE"
                ? "bg-rose-500 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🔴 Chi tiêu ({initialCategories.filter((c) => c.type === "EXPENSE").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("INCOME")}
            className={`flex-1 sm:flex-none px-3.5 py-2.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "INCOME"
                ? "bg-emerald-500 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🟢 Thu nhập ({initialCategories.filter((c) => c.type === "INCOME").length})
          </button>
        </div>

        <Button onClick={handleCreate} className="gap-2 font-bold shrink-0 w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Thêm danh mục mới
        </Button>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-2xl bg-card/40 space-y-3">
          <FolderOpen className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Chưa có danh mục nào thuộc nhóm này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((c) => {
            const IconComp = ICON_MAP[c.icon] || Tag;

            return (
              <Card key={c.id} className="border-border/60 hover:shadow-md transition-all group">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-3 rounded-xl text-white shadow-sm"
                      style={{ backgroundColor: c.color }}
                    >
                      <IconComp className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-foreground">{c.name}</h4>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/50"
                          title={`Thứ tự ưu tiên: ${c.order}`}
                        >
                          #{c.order}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {c.isDefault ? "Hệ thống mặc định" : "Cá nhân tự tạo"}
                      </p>
                    </div>
                  </div>

                  {c.userId === null ? (
                    <span
                      className="p-1.5 text-muted-foreground/70"
                      title="Danh mục hệ thống dùng chung, không thể sửa hoặc xóa"
                    >
                      <Lock className="h-3.5 w-3.5" aria-hidden />
                      <span className="sr-only">Danh mục hệ thống, không thể sửa hoặc xóa</span>
                    </span>
                  ) : (
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleEdit(c)}
                      title="Sửa danh mục"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setCategoryToDelete(c)}
                      className="text-destructive hover:bg-destructive/10"
                      title="Xóa danh mục"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CategoryDialog
        category={selectedCategory}
        defaultType={activeTab}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={handleRefresh}
      />

      <ConfirmDialog
        isOpen={!!categoryToDelete}
        title={`Xóa danh mục "${categoryToDelete?.name || ""}"?`}
        description="Bạn có chắc chắn muốn xóa danh mục này không? Hành động này không thể hoàn tác."
        confirmText="Xóa danh mục"
        cancelText="Hủy"
        variant="destructive"
        loading={deleting}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
