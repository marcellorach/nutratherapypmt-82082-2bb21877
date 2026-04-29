import { changelog, type ChangelogEntry } from "./projectChangelog";
import type { OrganogramaAreaKey } from "./projectOrganograma";

/** Mudanças recentes em uma área (default: últimos 30 dias). */
export function recentChangesByArea(
  area: OrganogramaAreaKey | "meta",
  sinceDays = 30,
  limit = 5,
): ChangelogEntry[] {
  const cutoff = new Date(Date.now() - sinceDays * 86400e3).toISOString().slice(0, 10);
  return changelog
    .filter((e) => e.area === area && e.date >= cutoff)
    .slice(0, limit);
}

/** Mudanças que tocaram um arquivo específico (match por substring). */
export function findChangesTouching(filePath: string, limit = 10): ChangelogEntry[] {
  const needle = filePath.toLowerCase();
  return changelog
    .filter((e) => e.files?.some((f) => f.toLowerCase().includes(needle)))
    .slice(0, limit);
}

/** Última versão de i18n registrada no changelog. */
export function lastI18nVersion(): string | undefined {
  return changelog.find((e) => e.i18nVersion)?.i18nVersion;
}

/** Top N entradas mais recentes (qualquer área). */
export function recentChanges(limit = 10): ChangelogEntry[] {
  return changelog.slice(0, limit);
}