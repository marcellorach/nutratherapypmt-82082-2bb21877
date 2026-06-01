## Parte A — Relatórios de auditoria bilíngues

Os arquivos em `public/audits/v3/`, `v5.1.0/` e `v5.2.0/` são HTMLs estáticos (~200 KB no total) gerados manualmente em PT, sem nenhuma chave i18n. Vamos gerar uma versão paralela em EN e fazer o leitor escolher o arquivo conforme o idioma ativo.

### 1. DB — registrar o caminho EN
Migration adicionando coluna opcional em `public.technical_audits`:
```sql
ALTER TABLE public.technical_audits ADD COLUMN IF NOT EXISTS html_path_en text;
```
(seguimos com PDF/DOCX só em PT — a versão EN é HTML-only, suficiente para leitura no app; documento "oficial" continua sendo o PT.)

### 2. Geração dos HTMLs EN
Criar `scripts/translate-audit-html.mjs` que:
- recebe `--version v5.2.0` (ou roda em loop para as três versões);
- lê `public/audits/<v>/index.html`;
- envia o conteúdo em **chunks** (separando por `<h1|h2|h3>` para manter contexto) para o Lovable AI Gateway (`google/gemini-2.5-pro`) com instrução: "Traduza PT→EN preservando 100% das tags HTML, IDs, classes, atributos, code blocks, fórmulas e nomes próprios (Senex AI, PetMoreTime, service_role, RLS, etc.)";
- monta `public/audits/<v>/index.en.html` reaproveitando `style.css` e `media/` (mesmo `<base href>`);
- substitui o atributo `<html lang="pt-BR">` por `<html lang="en">`.

Reaproveita `LOVABLE_API_KEY` (já disponível para edge functions; o script roda local com `dotenv`). Rodar uma vez por versão, commitar os HTMLs gerados, e revisar visualmente.

Após geração, gravar os caminhos na base via SQL `UPDATE technical_audits SET html_path_en = '/audits/<v>/index.en.html' WHERE version = '<v>';`

### 3. Leitor (TechnicalAuditsTab + audit-pdf-generator)
- Tipar `TechnicalAudit.html_path_en?: string | null`.
- Selecionar dinamicamente: `const path = i18n.language.startsWith('en') && audit.html_path_en ? audit.html_path_en : audit.html_path;`
- Se EN selecionado mas `html_path_en` ausente → banner discreto "English translation not available for this audit — showing original Portuguese" + botão para abrir tradução automática do navegador.
- Botão "Download PDF/DOCX" continua apontando para os arquivos PT (com tooltip "Original document in Portuguese").
- `openAuditForPrint` recebe o path resolvido (mesma função, novo argumento).

### 4. i18n
- Novas chaves: `audits.englishUnavailable`, `audits.viewingEnglishTranslation`, `audits.originalInPortuguese`.
- Incrementar `I18N_VERSION` em `src/i18n.ts`.

---

## Parte B — Organograma 3x com scroll horizontal e vertical

Hoje `OrganogramaDiagram` e `OrganogramaForceGraph` usam pan/zoom dentro de um container de altura `calc(100vh - 230px)`. Substituir por **frame fixo com scroll nativo** e canvas interno 3000×2000.

### Aba "Diagrama" (Mermaid — principal afetada)
Em `src/components/administrador/organograma/OrganogramaDiagram.tsx`:
- Remover/desabilitar `useScrollPanZoom` ou mantê-lo apenas como zoom opcional.
- Trocar wrapper de `overflow-hidden` por `overflow-auto` com altura fixa (`h-[80vh]` ou `calc(100vh - 230px)`).
- Definir o div interno do SVG como `min-width: 3000px; min-height: 2000px` (ou 3x das dimensões intrínsecas calculadas a partir do `viewBox`, com `Math.max`).
- Manter botões "Centralizar" (faz scroll para o meio) e adicionar botão "Ajustar à tela" que volta para o modo zoom-to-fit.
- Aplicar `[&_svg]:!w-full [&_svg]:!h-full` dentro do canvas grande para o SVG preencher 3000×2000.

### Aba "Grafo" (ForceGraph)
ForceGraph desenha em canvas físico — scroll nativo não funciona. Aplicar a mesma ideia "canvas grande + scroll do wrapper":
- Wrapper externo `overflow-auto h-[calc(100vh-280px)]`.
- Canvas interno dimensionado em `3000×2000` (passados como `width`/`height` para `<ForceGraph2D>` em vez do `ResizeObserver`).
- Forças d3 já ajustadas; basta aumentar `linkDistance` proporcionalmente (+50%) para distribuir nós no novo espaço.
- Botão "Centralizar" agora também faz `scrollTo` para o centro do wrapper.

### CSS/UX
- Scrollbars finas via classes utilitárias existentes (`scrollbar-thin` se houver, ou inline `style={{scrollbarWidth:'thin'}}`).
- Indicador discreto "← arraste / use scroll →" abaixo do frame.

### Sem impacto fora do escopo
Nenhuma mudança em `projectOrganograma.ts`, área meta, ChangelogTimeline ou OrganogramaCards.

---

## Documentação
- `CHANGELOG.md` → entrada `[Unreleased]` com `<!-- area: admin · status: entregue · i18n: <nova versão> -->` cobrindo (a) auditorias EN e (b) organograma 3x.
- Rodar `npm run sync:changelog`.

## Ordem de execução
1. Migration `html_path_en`.
2. Script `translate-audit-html.mjs` + geração dos 3 arquivos EN.
3. Atualizar `TechnicalAuditsTab` + `audit-pdf-generator` + i18n.
4. Refatorar `OrganogramaDiagram` e `OrganogramaForceGraph` para canvas 3x com scroll.
5. CHANGELOG + sync.
