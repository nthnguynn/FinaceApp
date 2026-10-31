"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

type ToastListener = (toasts: ToastMessage[]) => void;

let toasts: ToastMessage[] = [];
const listeners: Set<ToastListener> = new Set();

function notify() {
  listeners.forEach((listener) => listener([...toasts]));
}

export const toast = {
  success: (message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    toasts = [...toasts, { id, type: "success", message }];
    notify();
    setTimeout(() => {
      toast.dismiss(id);
    }, 4000);
  },
  error: (message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    toasts = [...toasts, { id, type: "error", message }];
    notify();
    setTimeout(() => {
      toast.dismiss(id);
    }, 4000);
  },
  info: (message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    toasts = [...toasts, { id, type: "info", message }];
    notify();
    setTimeout(() => {
      toast.dismiss(id);
    }, 4000);
  },
  dismiss: (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  },
};

export function Toaster() {
  const [activeToasts, setActiveToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToasts = (newToasts: ToastMessage[]) => {
      setActiveToasts(newToasts);
    };
    listeners.add(handleToasts);
    return () => {
      listeners.delete(handleToasts);
    };
  }, []);

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center gap-3 max-w-md w-full px-4 pointer-events-none">
      {activeToasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl shadow-xl border backdrop-blur-lg transition-all duration-300 transform animate-in fade-in-0 slide-in-from-top-6 w-full ${
            t.type === "success"
              ? "bg-emerald-50/95 text-emerald-950 border-emerald-200 shadow-emerald-500/10 dark:bg-emerald-950/90 dark:text-emerald-100 dark:border-emerald-800/80"
              : t.type === "error"
              ? "bg-rose-50/95 text-rose-950 border-rose-200 shadow-rose-500/10 dark:bg-rose-950/90 dark:text-rose-100 dark:border-rose-800/80"
              : "bg-sky-50/95 text-sky-950 border-sky-200 shadow-sky-500/10 dark:bg-sky-950/90 dark:text-sky-100 dark:border-sky-800/80"
          }`}
        >
          <div className="flex items-center gap-3">
            {t.type === "success" && (
              <div className="p-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              </div>
            )}
            {t.type === "error" && (
              <div className="p-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
              </div>
            )}
            {t.type === "info" && (
              <div className="p-1 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400">
                <Info className="h-5 w-5 shrink-0" />
              </div>
            )}
            <span className="text-sm font-medium tracking-tight">{t.message}</span>
          </div>
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 opacity-60 hover:opacity-100 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
