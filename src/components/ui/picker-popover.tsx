"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface PickerPopoverProps {
  /** Nút mở popup — dùng để tính vị trí và bỏ qua khi bấm vào chính nó */
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  /** Chiều rộng mong muốn (px); tự thu nhỏ trên màn hẹp */
  width: number;
  /** Hướng ưu tiên; tự đổi hướng nếu phía đó không đủ chỗ */
  prefer?: "top" | "bottom";
  label?: string;
  className?: string;
  children: React.ReactNode;
}

const GAP = 8;
const MARGIN = 8;

/** Đánh dấu nội dung popup render ra ngoài (portal) để popover cha không coi là "bấm ra ngoài" */
export const POPOVER_PORTAL_ATTR = "data-popover-portal";

export function isInsidePopoverPortal(target: EventTarget | null) {
  return target instanceof Element && !!target.closest(`[${POPOVER_PORTAL_ATTR}]`);
}

/**
 * Popup chọn ngày/tháng render vào <body> với position: fixed, nên không bị khung cuộn
 * (bảng nhập, hộp thoại) cắt mất. Luôn nằm trong màn hình: canh ngang theo nút nhưng kẹp trong
 * viewport, tự chọn mở lên/xuống theo chỗ trống và đi theo nút khi cuộn.
 */
export function PickerPopover({ anchorRef, open, onClose, width, prefer = "bottom", label, className, children }: PickerPopoverProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const anchor = anchorRef.current;
      const popup = popupRef.current;
      if (!anchor || !popup) return;
      const a = anchor.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      const w = Math.min(width, vw - MARGIN * 2);
      popup.style.width = `${w}px`;
      popup.style.maxHeight = `${vh - MARGIN * 2}px`;
      const h = popup.offsetHeight;

      const below = vh - a.bottom - GAP - MARGIN;
      const above = a.top - GAP - MARGIN;
      const fitsBelow = h <= below;
      const fitsAbove = h <= above;
      const openUp = prefer === "top" ? fitsAbove || (!fitsBelow && above > below) : !fitsBelow && (fitsAbove || above > below);

      const left = Math.min(Math.max(a.left, MARGIN), vw - MARGIN - w);
      const top = Math.min(Math.max(openUp ? a.top - GAP - h : a.bottom + GAP, MARGIN), vh - MARGIN - h);
      popup.style.left = `${left}px`;
      popup.style.top = `${top}px`;
    };

    place();
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [open, anchorRef, width, prefer]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (popupRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    };
    // Esc chỉ đóng popup, không đóng luôn bảng nhập phía sau
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={popupRef}
      {...{ [POPOVER_PORTAL_ATTR]: "" }}
      role="dialog"
      aria-label={label}
      // Vị trí thật được đặt trong useLayoutEffect trước khi vẽ
      style={{ left: -9999, top: 0 }}
      className={cn(
        "fixed z-[100] overflow-y-auto overscroll-contain rounded-2xl border border-border/60 bg-card p-4 text-card-foreground shadow-2xl animate-in fade-in-0 zoom-in-95",
        className
      )}
    >
      {children}
    </div>,
    document.body
  );
}
