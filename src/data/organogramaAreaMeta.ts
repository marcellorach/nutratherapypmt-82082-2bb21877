import {
  Shield,
  FlaskConical,
  Network,
  BookOpen,
  Workflow,
  Stethoscope,
  Heart,
  Settings2,
  Languages,
  Server,
  type LucideIcon,
} from "lucide-react";
import type { OrganogramaAreaKey } from "@/data/projectOrganograma";

export interface AreaMeta {
  icon: LucideIcon;
  /** Tailwind text token (semantic-friendly). */
  tone: string;
  /** Tailwind border-l accent for cards. */
  ring: string;
  /** Badge composition (bg + text + border). */
  badge: string;
  /** Hex used by the force-graph (no DOM tokens at runtime). */
  hex: string;
  label: string;
}

export type AreaKey = OrganogramaAreaKey | "meta";

export const AREA_META: Record<AreaKey, AreaMeta> = {
  auth: {
    icon: Shield,
    tone: "text-blue-500",
    ring: "border-l-blue-500/60",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    hex: "#3b82f6",
    label: "Auth",
  },
  curation: {
    icon: FlaskConical,
    tone: "text-amber-500",
    ring: "border-l-amber-500/60",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    hex: "#f59e0b",
    label: "Curadoria",
  },
  kg: {
    icon: Network,
    tone: "text-emerald-500",
    ring: "border-l-emerald-500/60",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    hex: "#10b981",
    label: "Knowledge Graph",
  },
  "base-knowledge": {
    icon: BookOpen,
    tone: "text-orange-500",
    ring: "border-l-orange-500/60",
    badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
    hex: "#f97316",
    label: "Base de Conhecimento",
  },
  "clinical-pipeline": {
    icon: Workflow,
    tone: "text-cyan-500",
    ring: "border-l-cyan-500/60",
    badge: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
    hex: "#06b6d4",
    label: "Pipeline Clínico",
  },
  "vet-ui": {
    icon: Stethoscope,
    tone: "text-indigo-500",
    ring: "border-l-indigo-500/60",
    badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    hex: "#6366f1",
    label: "UI Veterinário",
  },
  "tutor-ui": {
    icon: Heart,
    tone: "text-rose-500",
    ring: "border-l-rose-500/60",
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
    hex: "#f43f5e",
    label: "UI Tutor",
  },
  admin: {
    icon: Settings2,
    tone: "text-violet-500",
    ring: "border-l-violet-500/60",
    badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30",
    hex: "#8b5cf6",
    label: "Admin",
  },
  i18n: {
    icon: Languages,
    tone: "text-teal-500",
    ring: "border-l-teal-500/60",
    badge: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
    hex: "#14b8a6",
    label: "i18n",
  },
  infra: {
    icon: Server,
    tone: "text-slate-500",
    ring: "border-l-slate-500/60",
    badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30",
    hex: "#64748b",
    label: "Infra",
  },
  meta: {
    icon: Settings2,
    tone: "text-muted-foreground",
    ring: "border-l-border",
    badge: "bg-muted text-muted-foreground border-border",
    hex: "#94a3b8",
    label: "Meta",
  },
};

export function getAreaMeta(area: string): AreaMeta {
  return (AREA_META as Record<string, AreaMeta>)[area] ?? AREA_META.meta;
}
