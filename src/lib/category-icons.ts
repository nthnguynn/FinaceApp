import {
  BookOpen,
  Briefcase,
  Car,
  Coffee,
  Coins,
  Gamepad2,
  Gift,
  Heart,
  HeartPulse,
  Home,
  Music,
  Plane,
  Shirt,
  ShoppingBag,
  Tag,
  TrendingUp,
  Utensils,
  Zap,
} from "lucide-react";
import { Badminton } from "@/components/icons/badminton";

/** Tên icon lưu trong DB (Category.icon) -> component icon */
const CATEGORY_ICONS: Record<string, React.ElementType> = {
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

export function getCategoryIcon(name: string): React.ElementType {
  return CATEGORY_ICONS[name] ?? Tag;
}
