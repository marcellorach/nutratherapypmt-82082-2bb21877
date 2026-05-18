// Versão pública do motor Senex AI (exibida no header, footer e modais).
// Fonte única: CHANGELOG.md → marker `<!-- senex: x.y.z -->` em [Unreleased].
// Atualizado automaticamente por `npm run sync:changelog`.
import { lastChangelogDate, senexVersion } from '@/data/projectChangelog.generated';

export const SENEX_VERSION = senexVersion;
export const SENEX_LAST_UPDATE = lastChangelogDate;
