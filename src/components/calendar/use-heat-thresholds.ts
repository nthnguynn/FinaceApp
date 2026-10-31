"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

export interface HeatThresholds {
  /** Dưới mức này: chi ít (xanh) */
  low: number;
  /** Trên mức này: chi nhiều (đỏ); ở giữa: vừa phải (cam) */
  high: number;
}

export const DEFAULT_HEAT: HeatThresholds = { low: 100_000, high: 500_000 };

const STORAGE_KEY = "moniii:heat-thresholds";
const CHANGE_EVENT = "moniii:heat-thresholds";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

const getSnapshot = () => localStorage.getItem(STORAGE_KEY);
const getServerSnapshot = () => null;

function parse(raw: string | null): HeatThresholds {
  if (!raw) return DEFAULT_HEAT;
  try {
    const { low, high } = JSON.parse(raw);
    if (Number.isFinite(low) && Number.isFinite(high) && low > 0 && high > low) return { low, high };
  } catch {}
  return DEFAULT_HEAT;
}

/** Mốc tô màu lịch chi tiêu, lưu trên trình duyệt (server luôn render mốc mặc định) */
export function useHeatThresholds() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const thresholds = useMemo(() => parse(raw), [raw]);

  const setThresholds = useCallback((next: HeatThresholds) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [thresholds, setThresholds] as const;
}

export type HeatLevel = 0 | 1 | 2 | 3;

export function heatLevel(expense: number, t: HeatThresholds): HeatLevel {
  if (expense <= 0) return 0;
  if (expense < t.low) return 1;
  if (expense <= t.high) return 2;
  return 3;
}
