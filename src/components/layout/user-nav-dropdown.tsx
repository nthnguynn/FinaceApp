"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LogOut, ChevronDown, FolderKanban, Wallet } from "lucide-react";
import { logoutAction } from "@/actions/auth";

interface UserNavDropdownProps {
  userName?: string;
}

export function UserNavDropdown({ userName = "Người dùng" }: UserNavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initialLetter = userName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button: User Avatar + Name + Chevron */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-border/60 bg-muted/40 hover:bg-muted/80 transition-all cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <div className="h-8 w-8 rounded-full bg-primary/20 text-primary font-bold text-sm flex items-center justify-center border border-primary/30">
          {initialLetter}
        </div>
        <span className="text-sm font-semibold text-foreground max-w-30 truncate hidden sm:inline-block">
          {userName}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Modal Popup */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border/60 bg-card/95 text-card-foreground shadow-2xl backdrop-blur-md p-1.5 z-50 animate-in fade-in-0 zoom-in-95">
          {/* User Info Header */}
          <div className="px-3 py-2.5 border-b border-border/40">
            <p className="text-xs text-muted-foreground font-medium">Tài khoản cá nhân</p>
            <p className="text-sm font-bold text-foreground truncate mt-0.5">{userName}</p>
          </div>

          {/* Menu Items */}
          <div className="py-1 space-y-0.5">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <User className="h-4 w-4 text-primary" />
              <span>Hồ sơ cá nhân</span>
            </Link>

            <Link
              href="/wallets"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Wallet className="h-4 w-4 text-primary" />
              <span>Ví cá nhân</span>
            </Link>

            <Link
              href="/categories"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <FolderKanban className="h-4 w-4 text-primary" />
              <span>Danh mục Thu / Chi</span>
            </Link>
          </div>

          <div className="border-t border-border/40 pt-1">
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
              >
                <LogOut className="h-4 w-4" />
                <span>Đăng xuất</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
