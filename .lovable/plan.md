## Objetivo

Transformar a auditoria técnica (hoje só .docx/.pdf em `/mnt/documents/`) em um artefato versionado, navegável e re-executável dentro do admin — ao lado do Changelog/Organograma, com vínculo explícito à versão do sistema auditada.

## Arquitetura proposta

### 1. Conteúdo HTML da auditoria (estático, versionado em git)

- Converter o `.docx` v3 em **HTML semântico** (via `pandoc --extract-media`) e salvar em:
  - `public/audits/v3/index.html` (corpo do relatório, com TOC, headings, tabelas)
  - `public/audits/v3/media/*` (os 9 infográficos preservados)
- Criar um índice tipado em `src/data/technicalAudits.ts`:
  ```ts
  export interface TechnicalAudit {
    id: string;              // "v3"
    version: string;         // "3.0.0"
    date: string;            // "2026-05-10"
    systemVersion: string;   // i18n version + último commit do CHANGELOG
    systemDate: string;      // lastChangelogDate
    scope: string;           // descrição editável do que foi auditado
    htmlPath: string;        // "/audits/v3/index.html"
    docxPath?: string; pdfPath?: string;
    summary: { strengths: number; gaps: number; risks: number };
  }
  ```
- O vínculo "auditoria ↔ versão do sistema" usa `lastChangelogDate` de `projectChangelog.generated.ts` + `I18N_VERSION` de `src/i18n.ts` no momento da geração (registrados manualmente no entry).

### 2. Nova aba admin: "Auditorias Técnicas"

- Novo item no `ConfigurationGroup` (sidebar), ícone `FileSearch`, logo abaixo de "Organograma" e "Conformidade".
- Registrado em `src/config/admin-tabs.ts` como `technical-audits`.
- Componente `src/components/administrador/audits/TechnicalAuditsTab.tsx` com layout em 2 colunas:
  - **Esquerda (lista)**: cards de cada auditoria (v1, v2, v3…) mostrando: versão da auditoria, data, versão do sistema correspondente, badge de status, contagens (forças/gaps/riscos), botões "Abrir HTML", "Baixar PDF", "Baixar DOCX".
  - **Direita (visualizador)**: `<iframe src={htmlPath}>` em tela cheia com TOC sticky lateral, ou `react-markdown`/HTML sanitizado se preferirmos render nativo. Iframe é mais simples e isola estilos do documento.

### 3. Botão "Fazer nova auditoria"

- Card destacado no topo da aba com:
  - **Descrição editável** (textarea) do escopo: o que a auditoria deve cobrir (ex.: "Conformidade FDA/EMA, pipeline de curadoria, KG, RLS, i18n, 9 infográficos…"). Texto-padrão pré-preenchido com o escopo da v3.
  - Campos auto-preenchidos: versão do sistema atual (lida de i18n + changelog), data, próxima versão da auditoria sugerida (`v4`).
  - Botão **"Solicitar nova auditoria"** que:
    - Salva o pedido em uma tabela `audit_requests` (Lovable Cloud) com `scope`, `system_version`, `system_date`, `requested_at`, `status: 'pending'`, `requested_by`.
    - Mostra toast: "Auditoria solicitada — será gerada na próxima sessão pelo agente Lovable a partir deste escopo."
  - **Importante**: a geração efetiva do .docx/.pdf/.html continua sendo feita por mim (Lovable) em sessão dedicada lendo `audit_requests`. O botão não dispara LLM — ele formaliza e versiona o pedido. Isso evita custo/instabilidade de gerar relatório de 27 páginas em runtime.

### 4. Edição da descrição de auditorias passadas

- Cada card tem botão "Editar escopo" que abre dialog com textarea — atualiza `scope` na DB (auditorias passadas migradas via seed inicial).
- Histórico de edições do escopo fica em `audit_requests.scope_history` (jsonb).

## Schema (Lovable Cloud)

```sql
CREATE TABLE public.technical_audits (
  id text PRIMARY KEY,              -- 'v3'
  version text NOT NULL,
  audit_date date NOT NULL,
  system_version text NOT NULL,     -- ex: 'i18n 1.42.0 · 2026-05-09'
  system_changelog_date date,
  scope text NOT NULL,
  scope_history jsonb DEFAULT '[]',
  html_path text, pdf_path text, docx_path text,
  summary jsonb,                    -- {strengths, gaps, risks}
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.audit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  system_version text NOT NULL,
  system_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | in_progress | done
  fulfilled_audit_id text REFERENCES public.technical_audits(id),
  requested_by uuid,
  requested_at timestamptz DEFAULT now()
);
```

RLS: leitura para usuários autenticados com role `admin` (via `has_role`); escrita idem.

Seed: 1 linha em `technical_audits` para a v3 atual, apontando para `/audits/v3/index.html`, `/audits/v3/...pdf`, `...docx` (cópias dos arquivos de `/mnt/documents/` para `public/audits/v3/`).

## Entregáveis

1. `public/audits/v3/index.html` + media (conversão do v3.docx).
2. Cópia do PDF e DOCX para `public/audits/v3/` (download direto pelo app).
3. Migração SQL com as 2 tabelas + RLS + seed da v3.
4. `src/components/administrador/audits/TechnicalAuditsTab.tsx` (lista + iframe + dialog "nova auditoria" + dialog "editar escopo").
5. Registro no `admin-tabs.ts` + ícone na sidebar (`ConfigurationGroup`).
6. Strings PT/EN + bump de `I18N_VERSION`.
7. Entrada no `CHANGELOG.md` (`area: admin`, `i18n: x.y.z`) + `npm run sync:changelog`.

## Pontos a confirmar

- **OK usar iframe** para renderizar o HTML da auditoria (isolamento de estilos, TOC nativo do documento)? Alternativa: render via `react-markdown` com sanitização — mais integrado visualmente, mas precisa reestilizar tabelas/infográficos.
- **Botão "nova auditoria"** apenas registra o pedido (eu gero o relatório na sessão seguinte) — confirma essa abordagem? Alternativa cara: chamar Lovable AI Gateway com `gemini-2.5-pro` para gerar markdown em runtime (~ $0.30-1.00 por execução, sem infográficos).
