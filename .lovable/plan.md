## Ajustes nos relatórios de auditoria (HTML para download/print)

Tudo concentrado em `src/components/administrador/audits/audit-pdf-generator.ts` (função `injectConfidentialMarks` + copy bilíngue). Nenhum arquivo `.html` em `public/audits/...` é editado — a injeção continua sendo runtime, então vale para todas as versões (técnico e showcase, PT e EN).

### 1. Consertar o encavalamento da tag "CONFIDENCIAL"
Causa: o `::before` é posicionado em `left:8px` por cima do texto, mas o `padding-left:56px` atual não está sendo suficiente porque a tag tem largura variável dependendo do idioma/fonte. Trocar a abordagem de "pseudo-elemento sobreposto" por **layout flex real**:

- Banner vira `display:flex; align-items:center; gap:12px`
- Tag CONFIDENCIAL passa a ser um `<span class="senex-confidential-tag">` real (não `::before`), com `flex-shrink:0`
- Texto do banner num `<span>` que ocupa o restante

Resultado: zero sobreposição em qualquer largura/idioma.

### 2. Tag discreta no header da 1ª página + em todos os footers
- **Header da 1ª página**: manter o banner amarelo só na primeira página (atual) — apenas corrigido.
- **Footers de todas as páginas**: o `.senex-confidential-footer` atual já é injetado uma vez no fim do `<body>`. Para garantir presença em *todas as páginas impressas*, adicionar um `@media print` com `position: fixed; bottom: 0` no rodapé — assim ele se repete em cada página do PDF, de forma discreta (fonte 9px, cinza, italic, com a palavra "CONFIDENCIAL" em vermelho sóbrio inline).
- Em tela (sem print), o footer continua aparecendo uma vez no fim do documento.

### 3. Reforçar propriedade PetMoreTime (sem ambiguidade)
Atualizar `CONFIDENTIAL_COPY` (PT/EN) para conter:

- **Banner (1ª página)** — PT: "Documento confidencial — Plataforma **Senex AI** · Engine **Senex AI v7** · © PetMoreTime. Todos os direitos reservados. Uso interno e parceiros sob NDA; não redistribuir."
  EN: "Confidential document — Platform **Senex AI** · Engine **Senex AI v7** · © PetMoreTime. All rights reserved. Internal use and NDA partners only; do not redistribute."
- **Footer de cada página** — PT: "CONFIDENCIAL · Senex AI v7 · © PetMoreTime — todos os direitos reservados. Tecnologia, modelos e conteúdo são propriedade exclusiva da PetMoreTime."
  EN: equivalente.
- Marca d'água diagonal mantida (`CONFIDENCIAL` / `CONFIDENTIAL`).

### 4. Versão / changelog / i18n
- Não há strings novas em `.json` de UI (o copy do relatório é interno ao gerador), então **não** precisa bumpar `I18N_VERSION`.
- Bump de patch da versão Senex (`src/config/senex-version.ts`) + entrada no `CHANGELOG.md` em `[Unreleased]` (área: audits, status: fixed, i18n: none) + `npm run sync:changelog`.

### Arquivos tocados
- `src/components/administrador/audits/audit-pdf-generator.ts` (core)
- `src/config/senex-version.ts` (patch bump)
- `CHANGELOG.md` (entrada estruturada)
- regenerados por script: `src/data/projectChangelog.generated.ts`, `.lovable/CONTEXT.md`

### Fora de escopo
Não toco em PDFs gerados via `@react-pdf/renderer` (`src/services/pdf-export.ts` — protocolo do tutor) porque seu pedido se refere especificamente aos relatórios de auditoria técnica/showcase. Se quiser também aplicar lá, me avise.
