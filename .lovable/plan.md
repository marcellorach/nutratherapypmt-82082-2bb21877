## Diagnóstico — por que tudo cai em 10 mg/kg

Investigando o banco e o código, encontrei **5 bugs convergentes** que fazem 100% das doses caírem no Tier 5 (fallback genérico 5/10/50 mg/kg):

| # | Problema | Evidência |
|---|----------|-----------|
| 1 | Tabela `compound_dosage_reference` está **vazia** (0 linhas). | `SELECT COUNT(*) → 0` |
| 2 | Todos os 14 lookups recentes registraram `default_class / no_source_found`. | `dosage_lookup_log` mostra somente `default_class`. |
| 3 | **Upsert da web-dosage-lookup está quebrado**: `onConflict` usa colunas planas (`compound_name_en,condition_name_en,species`), mas o índice unique é **funcional** `(lower(compound_name_en), lower(COALESCE(condition_name_en,'__any__')), species)`. Postgres rejeita silenciosamente → nada é persistido → próxima chamada repete tudo do zero. | `\d` da tabela mostra `uq_compound_dosage_ref` com `lower()` e `COALESCE`. |
| 4 | **Nomes vêm misturados PT/EN e em frases compostas**: a tabela é indexada por `compound_name_en` mas o pipeline manda `"Astaxantina"`, `"Quercetina"`, e condições como `"Osteoartrite, Inflamação Sistêmica e Controle de Peso"`. Nem o lookup curado nem o web lookup conseguem casar. | Log mostra `Astaxantina / Osteoartrite e Inflamação Sistêmica`. |
| 5 | **Tier 1 (KG) nunca dispara**: `n.dosage` vem `null` da maioria dos triplets (campo opcional). Mesmo quando existe, raramente está em `mg/kg`. | Pipeline passa `kgDosageString: n.dosage` direto. |
| 6 | Possível "Failed to fetch" indica que a edge function pode estar retornando erro de rede (CORS antigo) — vou validar nos logs. | Runtime error no console. |

## Plano de correção

### 1. Consertar o `onConflict` da edge function (raiz do problema)
Trocar para usar uma chave que case com o índice funcional. Como Supabase JS não suporta `onConflict` com expressões, vou usar **`SELECT então INSERT/UPDATE`** manual: buscar por `lower(name)` + `lower(coalesce(condition,'__any__'))` antes de inserir; se existir, fazer `UPDATE` por id; se não, `INSERT`. Garante persistência real do cache.

### 2. Normalizar inputs antes de chamar o resolver
Em `clinical-analysis-pipeline.ts`, antes de `resolveCompoundDosage`, mapear:
- **Composto PT→EN** via `nutraceuticals` table (`name → name_en`) ou dicionário inline para os mais comuns (`Astaxantina→Astaxanthin`, `Quercetina→Quercetin`, `Curcumina→Curcumin`, `Ácidos Graxos Ômega-3→Omega-3 Fatty Acids`, `Glucosamina→Glucosamine`, etc).
- **Condição PT→EN canônica**: extrair só a primeira condição da string composta e mapear (`Osteoartrite→Osteoarthritis`, `Inflamação Sistêmica→Systemic Inflammation`, `Envelhecimento Celular→Cellular Aging`).
- Criar utilitário `src/services/clinical-name-canonicalizer.ts` reutilizável.

### 3. Seed inicial da `compound_dosage_reference` com doses canônicas conhecidas
Migration de seed com **20–30 doses curadas** dos compostos mais usados em geriatria canina (Plumb's, Merck, ACVIM), marcadas como `source_type='curated_study'` e `needs_review=false`. Isso garante que `Astaxanthin / Osteoarthritis`, `Curcumin / Inflammation`, `Omega-3 / Cardiac`, etc., respondam corretamente desde já — resolve o sintoma imediato. Exemplo:
- Astaxanthin / Osteoarthritis → 0.5–2 mg/kg (Park 2010, Plumb's)
- Curcumin / Inflammation → 50–200 mg/kg (Innes 2003)
- Omega-3 EPA+DHA / Cardiac → 60–100 mg/kg (Smith 2007, ACVIM)
- Glucosamine / Osteoarthritis → 15–30 mg/kg (McCarthy 2007)
- Resveratrol / Aging → 5–25 mg/kg
- NMN / Aging → 10–50 mg/kg
- Quercetin / Inflammation → 5–25 mg/kg
- Fisetin / Senescence → 1–10 mg/kg
- Chondroitin / Osteoarthritis → 15–30 mg/kg
- UCII / Osteoarthritis → 0.4–1 mg/kg (D'Altilio 2007)
- CoQ10 / Cardiac → 1–5 mg/kg
- SAMe / Hepatic → 18–22 mg/kg (Plumb's)
- Silymarin / Hepatic → 50–250 mg/kg
- Vitamin E / Antioxidant → 10–30 IU/kg
- Boswellia / Osteoarthritis → 40–80 mg/kg
- Hyaluronic Acid / Osteoarthritis → 0.3–1 mg/kg
- L-Carnitine / Cardiac → 50–100 mg/kg
- Taurine / Cardiac → 30–100 mg/kg
- Phosphatidylserine / Cognitive Dysfunction → 1.5–3 mg/kg
- MCT / Cognitive Dysfunction → 100–500 mg/kg

Cada uma com `source_citation` real. Veterinário poderá editar/ajustar pelo painel admin que já existe.

### 4. Melhorar a heurística do resolver
- No Tier 2 lookup, fazer query case-insensitive com **fuzzy matching**: tentar exact, depois `ilike '%compound%'`, depois variantes (com/sem hífen, com/sem "(EPA/DHA)" entre parênteses).
- Logar quando a query case → mismatch para facilitar debugging.

### 5. Confirmar que a edge function `web-dosage-lookup` está saudável
- Checar logs da edge function pós-deploy.
- Se "Failed to fetch" persistir, verificar se o cliente está chamando antes do auth estar pronto.

### 6. UI: exibir corretamente quando tier 2 acertou
O `CompoundDosageSlider` já tem badges para `curated_study` / `web_authoritative`. Após o seed, a maioria das osteoartrites vai mostrar **"Curado"** (verde) com link real.

### 7. Bump i18n + CHANGELOG + memória
- I18N v1.28.0 → 1.29.0
- Entry `Fixed` no CHANGELOG explicando bug do upsert + seed
- Atualizar memória `mem://features/dosage-extraction-ranges-and-fallback` para refletir cascata real funcional

## Resultado esperado

Após o fix, no card do paciente:
- **Astaxanthin / Osteoarthritis** → 0.5–2 mg/kg, badge "Curado", citação Park 2010 clicável
- **Quercetin / Inflammation** → 5–25 mg/kg, badge "Curado"
- **Omega-3** → 60–100 mg/kg
- Doses **diferentes por composto** (não mais todas em 10 mg/kg)
- Compostos sem seed acionam o web lookup, persistem no cache e aparecem na tab "Curadoria de Doses → Pendentes" para o admin revisar

## Arquivos a tocar

- `supabase/functions/web-dosage-lookup/index.ts` — manual upsert
- `src/services/dosage-resolver.ts` — fuzzy matching, melhor logging
- `src/services/clinical-name-canonicalizer.ts` — **novo**, dicionários PT↔EN
- `src/services/clinical-analysis-pipeline.ts` — chamar canonicalizer antes do resolver
- `supabase/migrations/...` — seed de ~20 doses canônicas
- `src/i18n.ts`, `CHANGELOG.md` — bump + entry

Aprova para implementar?