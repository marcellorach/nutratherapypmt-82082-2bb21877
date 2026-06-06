## Plano: bump Senex AI v7.0.1 → v7.1.0

Operação curta, de 2 passos, para destravar o botão de re-auditoria.

### 1. Editar `CHANGELOG.md`
No topo de `## [Unreleased]`, trocar o marker:

```
<!-- senex: 7.0.1 -->
```
por:
```
<!-- senex: 7.1.0 -->
```

Justificativa do MINOR (entrará como nota técnica embaixo do marker, sem bullet novo separado a menos que você peça): desde a v7.0.1 entraram `drift-guard`, painel **Preview vs Publicado**, edge function `compare-snapshots` e infra de verificação do Bloco 2 (`scripts/verify-deploy-chunks.mjs`).

### 2. Rodar `npm run sync:changelog`
Isso regenera:
- `src/data/projectChangelog.generated.ts` → exporta `senexVersion = "7.1.0"`
- `src/config/senex-version.ts` (re-export) → `SENEX_VERSION = "7.1.0"`
- `.lovable/CONTEXT.md` (briefing)
- `organogramaLastUpdated` (data da última entrada)

Header, footer e `VersionBadge` passam a mostrar `v7.1.0` automaticamente (todos leem da mesma fonte).

### 3. Efeito no botão de auditoria
O guard `alreadyAuditedThisVersion` em `TechnicalAuditsTab.tsx` compara `SENEX_VERSION` com o campo `version` das linhas existentes em `technical_audits`. Como `v7.1.0` ainda não foi auditada, o botão **"Gerar auditoria"** volta a ficar habilitado assim que o preview recarregar o bundle.

### Fora de escopo
- Não vou criar o fluxo de re-auditoria com sufixo `-rN` discutido antes (isso fica para outra rodada se você quiser).
- Não vou tocar em edge functions, schema, nem no painel Preview vs Publicado.
- Não adiciono entrada nova no `[Unreleased]` (você pediu só o bump); se quiser uma linha "Bump Senex AI v7.1.0" registrando o motivo, me avise que incluo.

### Confirmação ao final
Depois do `sync:changelog` eu confirmo no chat:
- nova `senexVersion` no `projectChangelog.generated.ts`,
- e que o botão está habilitado (verifico via leitura do componente + estado esperado).
