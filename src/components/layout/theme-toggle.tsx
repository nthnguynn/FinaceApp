"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

// Đọc trực tiếp class "dark" trên <html> (đã được script trong RootLayout gắn trước khi paint)
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const getSnapshot = () => document.documentElement.classList.contains("dark");
const getServerSnapshot = () => null;

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  if (isDark === null) {
    return <div className="h-9 w-9 rounded-full bg-muted/40 border border-border/40" />;
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="h-9 w-9 rounded-full border border-border/60 bg-muted/40 hover:bg-muted/80 flex items-center justify-center text-foreground hover:text-primary transition-colors cursor-pointer shadow-sm active:scale-90"
      title={isDark ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
      aria-label="Đổi giao diện Sáng / Tối"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 hover:rotate-90" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 transition-transform duration-300 hover:-rotate-45" />
      )}
    </button>
  );
}
