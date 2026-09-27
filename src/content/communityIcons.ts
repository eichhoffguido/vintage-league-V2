// Feste Icon-Auswahl für Community-Kategorien (CC-C4). Der Name wird in forum_categories.icon gespeichert.
import { BookOpen, Camera, MessageSquare, Search, Shield, ShieldCheck, Shirt, Star, Tag, TrendingUp, Trophy, Wrench, type LucideIcon } from "lucide-react";

export const COMMUNITY_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  Wrench: { icon: Wrench, label: "Werkzeug" },
  Shield: { icon: Shield, label: "Schild" },
  ShieldCheck: { icon: ShieldCheck, label: "Schild mit Haken" },
  Search: { icon: Search, label: "Lupe" },
  TrendingUp: { icon: TrendingUp, label: "Kurve" },
  Trophy: { icon: Trophy, label: "Pokal" },
  Shirt: { icon: Shirt, label: "Trikot" },
  Camera: { icon: Camera, label: "Kamera" },
  MessageSquare: { icon: MessageSquare, label: "Sprechblase" },
  BookOpen: { icon: BookOpen, label: "Buch" },
  Star: { icon: Star, label: "Stern" },
  Tag: { icon: Tag, label: "Etikett" },
};

/** Kategorie sichtbar? (Spalte is_active kommt mit CC-C4; ältere Zeilen gelten als sichtbar.) */
export const isCategoryVisible = (c: object) => (c as { is_active?: boolean }).is_active !== false;
