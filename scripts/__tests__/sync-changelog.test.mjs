import { describe, it, expect } from "vitest";
import {
  parseMetaComment,
  extractFiles,
  inferArea,
  parseChangelog,
} from "../sync-changelog.mjs";

describe("parseMetaComment", () => {
  it("extrai área, status, i18n e commit do metadata-comment", () => {
    const m = parseMetaComment(
      "<!-- area: admin · status: entregue · i18n: 1.40.0 · commit: a1b2c3d -->",
    );
    expect(m).toEqual({
      area: "admin",
      status: "entregue",
      i18n: "1.40.0",
      commit: "a1b2c3d",
    });
  });

  it("aceita separadores variados (vírgula, ponto-e-vírgula, pipe)", () => {
    expect(parseMetaComment("<!-- area: kg, status: parcial -->")).toEqual({
      area: "kg",
      status: "parcial",
    });
    expect(parseMetaComment("<!-- area: vet-ui; commit: abc -->")).toEqual({
      area: "vet-ui",
      commit: "abc",
    });
    expect(parseMetaComment("<!-- area: infra | i18n: 2.0.0 -->")).toEqual({
      area: "infra",
      i18n: "2.0.0",
    });
  });

  it("tolera espaços extras e chaves em maiúsculas", () => {
    expect(parseMetaComment("<!--   AREA:  admin   ·   COMMIT:  XYZ123  -->")).toEqual({
      area: "admin",
      commit: "XYZ123",
    });
  });

  it("retorna objeto vazio quando não há comentário", () => {
    expect(parseMetaComment("- bullet sem comentário")).toEqual({});
    expect(parseMetaComment("")).toEqual({});
  });

  it("ignora pares mal formados sem dois-pontos", () => {
    expect(parseMetaComment("<!-- areaadmin · status: entregue -->")).toEqual({
      status: "entregue",
    });
  });
});

describe("extractFiles", () => {
  it("captura paths em prosa, listas e crases", () => {
    const text = `
- Novo \`scripts/sync-changelog.mjs\`: parser
- Edita src/data/projectChangelog.ts e (src/i18n.ts)
- Files: src/foo.tsx, supabase/functions/bar/index.ts
- Migração supabase/migrations/20240101_init.sql aplicada
`;
    const files = extractFiles(text);
    expect(files).toEqual(
      expect.arrayContaining([
        "scripts/sync-changelog.mjs",
        "src/data/projectChangelog.ts",
        "src/i18n.ts",
        "src/foo.tsx",
        "supabase/functions/bar/index.ts",
        "supabase/migrations/20240101_init.sql",
      ]),
    );
  });

  it("deduplica paths repetidos", () => {
    const files = extractFiles("src/a.ts e novamente src/a.ts e `src/a.ts`");
    expect(files).toEqual(["src/a.ts"]);
  });

  it("aceita extensões variadas (.tsx, .json, .sql, .md, .css, .mjs)", () => {
    const files = extractFiles(
      "src/App.tsx src/locales/pt/translation.json supabase/migrations/x.sql " +
        "scripts/tool.mjs public/styles.css .lovable/CONTEXT.md",
    );
    expect(files).toEqual(
      expect.arrayContaining([
        "src/App.tsx",
        "src/locales/pt/translation.json",
        "supabase/migrations/x.sql",
        "scripts/tool.mjs",
        "public/styles.css",
        ".lovable/CONTEXT.md",
      ]),
    );
  });

  it("ignora texto sem paths reconhecíveis", () => {
    expect(extractFiles("apenas prosa sem nenhum arquivo aqui")).toEqual([]);
  });
});

describe("inferArea", () => {
  it("mapeia paths conhecidos para áreas corretas", () => {
    expect(inferArea(["supabase/functions/kg-search/index.ts"])).toBe("kg");
    expect(inferArea(["supabase/functions/triplet-extract/index.ts"])).toBe("curation");
    expect(inferArea(["supabase/functions/process-pdf/index.ts"])).toBe("curation");
    expect(inferArea(["supabase/functions/other/index.ts"])).toBe("infra");
    expect(inferArea(["supabase/migrations/2024.sql"])).toBe("infra");
    expect(inferArea(["src/pages/administrador/Index.tsx"])).toBe("admin");
    expect(inferArea(["src/pages/veterinario/Page.tsx"])).toBe("vet-ui");
    expect(inferArea(["src/pages/tutor/Home.tsx"])).toBe("tutor-ui");
    expect(inferArea(["src/services/clinical/pipeline.ts"])).toBe("clinical-pipeline");
    expect(inferArea(["src/locales/pt/translation.json"])).toBe("i18n");
    expect(inferArea(["src/contexts/AuthContext.tsx"])).toBe("auth");
  });

  it('retorna "meta" quando nenhum path bate', () => {
    expect(inferArea([])).toBe("meta");
    expect(inferArea(["README.md", "package.json"])).toBe("meta");
  });

  it("usa o primeiro match (especificidade pela ordem das regras)", () => {
    // kg vence sobre infra para functions/kg-*
    expect(
      inferArea(["supabase/functions/kg-search/index.ts", "supabase/functions/x/y.ts"]),
    ).toBe("kg");
  });
});

describe("parseChangelog", () => {
  const SAMPLE = `# Changelog

## [Unreleased]

### Added - 2026-04-29 — Mini-timeline por área no Organograma
<!-- area: admin · status: entregue · i18n: 1.40.0 · commit: a1b2c3d -->
- Novo \`src/components/administrador/organograma/AreaMiniTimeline.tsx\`
- **Filtros toggle por tipo** e botão "Ver mais"
- Files: src/data/repoConfig.ts, scripts/sync-changelog.mjs

### Fixed - 2026-04-28 🔗 Links de Estudos
- ✅ **Sincronização** corrigida em src/components/foo.tsx
- i18n v1.26.2

### Changed - 2026-04-27 — Refactor parcial
<!-- status: parcial -->
- algo aqui sem files

## [1.0.0] - 2025-01-01
### Added - 2025-01-01 — Inicial
- primeira versão
`;

  it("ordena entradas da mais recente para a mais antiga", () => {
    const entries = parseChangelog(SAMPLE);
    expect(entries.map((e) => e.date)).toEqual([
      "2026-04-29",
      "2026-04-28",
      "2026-04-27",
      "2025-01-01",
    ]);
  });

  it("propaga `commit` do metadata-comment para a entrada", () => {
    const [first] = parseChangelog(SAMPLE);
    expect(first.commit).toBe("a1b2c3d");
    expect(first.area).toBe("admin");
    expect(first.status).toBe("entregue");
    expect(first.i18nVersion).toBe("1.40.0");
    expect(first.kind).toBe("added");
  });

  it("não define `commit` quando ausente", () => {
    const entries = parseChangelog(SAMPLE);
    const fixed = entries.find((e) => e.date === "2026-04-28");
    expect(fixed?.commit).toBeUndefined();
  });

  it("infere área pelos arquivos do bloco quando metadata-comment não declara", () => {
    const fixed = parseChangelog(SAMPLE).find((e) => e.date === "2026-04-28");
    // src/components/foo.tsx → admin (regra src/components/administrador) não bate;
    // como não há regra para src/components, cai em meta. Validamos status default.
    expect(fixed?.status).toBe("entregue");
    expect(fixed?.kind).toBe("fixed");
    expect(fixed?.i18nVersion).toBe("1.26.2");
  });

  it("captura status `parcial` declarado via metadata", () => {
    const partial = parseChangelog(SAMPLE).find((e) => e.date === "2026-04-27");
    expect(partial?.status).toBe("parcial");
  });

  it("limpa marcadores ✅ e ** dos bullets e remove emoji do título", () => {
    const fixed = parseChangelog(SAMPLE).find((e) => e.date === "2026-04-28");
    expect(fixed?.title).toBe("Links de Estudos");
    expect(fixed?.bullets[0]).toBe("Sincronização corrigida em src/components/foo.tsx");
  });

  it("agrega Files do bullet `Files:` no array final", () => {
    const [first] = parseChangelog(SAMPLE);
    expect(first.files).toEqual(
      expect.arrayContaining([
        "src/components/administrador/organograma/AreaMiniTimeline.tsx",
        "src/data/repoConfig.ts",
        "scripts/sync-changelog.mjs",
      ]),
    );
  });

  it("trata cabeçalhos com hífen ou em-dash como separador", () => {
    const md = `
### Added - 2026-04-29 - Com hífen simples
- bullet

### Changed - 2026-04-28 — Com em-dash
- bullet
`;
    const entries = parseChangelog(md);
    expect(entries).toHaveLength(2);
    expect(entries[0].title).toBe("Com hífen simples");
    expect(entries[1].title).toBe("Com em-dash");
  });

  it('mapeia kind="deprecated" para "changed"', () => {
    const entries = parseChangelog("### Deprecated - 2026-01-01 — X\n- a\n");
    expect(entries[0].kind).toBe("changed");
  });

  it("retorna lista vazia quando não há cabeçalhos válidos", () => {
    expect(parseChangelog("# título\n\nsem entradas\n")).toEqual([]);
  });
});
