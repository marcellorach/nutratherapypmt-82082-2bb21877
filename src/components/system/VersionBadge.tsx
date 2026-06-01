import React from "react";
import { Badge } from "@/components/ui/badge";
import { SENEX_VERSION, SENEX_LAST_UPDATE } from "@/config/senex-version";
import { I18N_VERSION } from "@/i18n";
import { lastChangelogDate } from "@/data/projectChangelog.generated";
import { Layers } from "lucide-react";

/**
 * Versão única e canônica do sistema Senex AI.
 * Sempre lê das mesmas fontes (CHANGELOG marker → senex-version.ts, i18n.ts).
 * Use em headers de auditoria, compliance, organograma e about
 * para tornar impossível divergência silenciosa entre superfícies.
 */
export const VersionBadge: React.FC<{ compact?: boolean; className?: string }> = ({
  compact,
  className,
}) => {
  if (compact) {
    return (
      <Badge variant="outline" className={`gap-1 font-mono text-[11px] ${className ?? ""}`}>
        <Layers className="h-3 w-3" />
        v{SENEX_VERSION} · i18n {I18N_VERSION}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={`gap-1 font-mono text-[11px] ${className ?? ""}`}>
      <Layers className="h-3 w-3" />
      Senex AI v{SENEX_VERSION} · i18n {I18N_VERSION} · changelog {lastChangelogDate || SENEX_LAST_UPDATE}
    </Badge>
  );
};

export default VersionBadge;