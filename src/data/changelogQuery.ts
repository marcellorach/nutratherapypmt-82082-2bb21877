import { changelog, type ChangelogEntry, type ChangelogKind } from "./projectChangelog";
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

/** Mudanças de uma área com filtro opcional por tipo (added/changed/...). */
export function changesByAreaFiltered(
  area: OrganogramaAreaKey | "meta",
  opts: { sinceDays?: number; limit?: number; kinds?: ChangelogKind[] } = {},
): ChangelogEntry[] {
  const { sinceDays = 90, limit = 8, kinds } = opts;
  const cutoff = new Date(Date.now() - sinceDays * 86400e3).toISOString().slice(0, 10);
  const kindSet = kinds && kinds.length ? new Set(kinds) : null;
  return changelog
    .filter((e) => e.area === area && e.date >= cutoff)
    .filter((e) => (kindSet ? kindSet.has(e.kind) : true))
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