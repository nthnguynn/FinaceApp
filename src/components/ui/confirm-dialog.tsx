"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  isOpen,
  title = "Xác nhận hành động",
  description = "Bạn có chắc chắn muốn thực hiện thao tác này không?",
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "destructive",
  loading = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 pb-20 sm:p-4 animate-in fade-in-0">
      <div className="bg-card text-card-foreground border border-border/60 shadow-2xl rounded-2xl max-w-md w-full overflow-hidden p-6 space-y-5 animate-in zoom-in-95">
        {/* Header with Alert Icon */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl flex items-center justify-center ${
                variant === "destructive"
                  ? "bg-rose-500/10 text-rose-500 dark:bg-rose-950/40"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
            className="font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
