# Contrato A2 — corrigir `prompt_extraction_stage1_user` na origem

Modo planejamento: nada foi alterado. A execução depende da aprovação deste cartão.

## 1. Backup: valor atual completo (1.306 caracteres, sem `{{TEXT_CONTENT}}`, atualizado em 10/12/2025)

````text
Analyze this scientific study and extract:

1. **ALL Nutraceuticals**: Every compound, extract, supplement mentioned
   - Include: scientific names, common names, synonyms, chemical compounds
   ⚠️ ONLY extract compounds that appear IN THIS DOCUMENT

2. **ALL Health Conditions**: Every disease, disorder, symptom mentioned
   - Species-specific conditions with severity levels if mentioned

3. **Study Population**: Species, breed, age group, sample size (N), sex distribution

📋 REQUIRED JSON OUTPUT FORMAT:
```json
{
  "nutraceuticals": [
    {"name": "Astaxanthin", "synonyms": ["AST", "3,3-dihydroxy-β-carotene-4,4-dione"], "chemical_compound": "C40H52O4", "species_tested": ["canine"]}
  ],
  "conditions": [
    {"name": "Osteoarthritis", "category": "musculoskeletal", "species": "canine", "severity": "moderate"}
  ],
  "study_population": {
    "species": "canine",
    "breed": "Labrador Retriever",
    "age_group": "adult",
    "sample_size": 24,
    "sex_distribution": "12M/12F",
    "health_status": "affected with osteoarthritis"
  }
}
```

⚠️ CRITICAL: Be EXHAUSTIVE but ONLY extract entities that are EXPLICITLY mentioned in this specific document. NEVER use template examples as actual data.
````

Na execução, este mesmo texto vai para o CHANGELOG como backup legível. Nenhuma chave de backup é criada na tabela.

## 2. Comparação com o padrão do código: corrigir o override, não removê-lo

O padrão (`getDefaultStage1UserPrompt`, `extract-study-entities/index.ts:1387-1394`) tem 4 linhas:

````text
Extract all nutraceuticals, conditions, mechanisms, and key findings from ONLY this study document.

IMPORTANT: Only include information explicitly stated in this text. If a compound, condition, or mechanism is not mentioned, do not include it.

Document to analyze:
{{TEXT_CONTENT}}
````

A diferença vai além do marcador e do exemplo. O override pede sinônimos, fórmula química, espécie testada, categoria e gravidade da condição, e a população do estudo (espécie, raça, idade, N, sexo, estado de saúde), com um formato JSON explícito. O padrão pede mecanismos e achados, mas não pede a população. Se o override fosse removido, o Stage 1 deixaria de extrair a população do estudo. Por isso, a proposta é **corrigir o override**.

## 3. Valor corrigido proposto

As regras aplicadas são as do escopo:
- A redação das instruções não muda.
- O marcador vai no mesmo lugar do padrão: no final, depois de `Document to analyze:`.
- Todo valor concreto de exemplo é removido, não só os quatro termos citados. Também saem AST, o nome químico, C40H52O4, canine, musculoskeletal, moderate, Labrador Retriever, adult, 24 e 12M/12F.
- As chaves do JSON continuam as mesmas. Cada valor vira um descritor de tipo entre `<...>`.

````text
Analyze this scientific study and extract:

1. **ALL Nutraceuticals**: Every compound, extract, supplement mentioned
   - Include: scientific names, common names, synonyms, chemical compounds
   ⚠️ ONLY extract compounds that appear IN THIS DOCUMENT

2. **ALL Health Conditions**: Every disease, disorder, symptom mentioned
   - Species-specific conditions with severity levels if mentioned

3. **Study Population**: Species, breed, age group, sample size (N), sex distribution

📋 REQUIRED JSON OUTPUT FORMAT:
```json
{
  "nutraceuticals": [
    {"name": "<string>", "synonyms": ["<string>"], "chemical_compound": "<string or null>", "species_tested": ["<string>"]}
  ],
  "conditions": [
    {"name": "<string>", "category": "<string>", "species": "<string>", "severity": "<string or null>"}
  ],
  "study_population": {
    "species": "<string>",
    "breed": "<string or null>",
    "age_group": "<string or null>",
    "sample_size": <integer or null>,
    "sex_distribution": "<string or null>",
    "health_status": "<string or null>"
  }
}
```

⚠️ CRITICAL: Be EXHAUSTIVE but ONLY extract entities that are EXPLICITLY mentioned in this specific document. NEVER use template examples as actual data.

Document to analyze:
{{TEXT_CONTENT}}
````

Os únicos acréscimos de texto são os descritores `<...>` e as 2 linhas finais, copiadas do padrão.

## 4. Auditoria só-leitura dos demais overrides `prompt_%` (nada será alterado)

A coluna "Rotina que consome" vem de uma busca no código. Só `extract-study-entities` lê as chaves `prompt_extraction%` (linha 274). As outras 5 chaves só aparecem em telas do painel e em migrações antigas.

| Chave | Rotina que consome | Marcador esperado | Marcador presente | Exemplo concreto | Difere do padrão |
|---|---|---|---|---|---|
| extraction_stage1_system | extract-study-entities | nenhum | n/a | não | sim |
| extraction_stage1_user | extract-study-entities | TEXT_CONTENT | **não** | **sim** (Astaxanthin, Osteoarthritis…) | sim |
| extraction_stage2_system | extract-study-entities | nenhum | n/a | não | sim |
| extraction_stage2_user | extract-study-entities | TEXT_CONTENT, STAGE1_NUTRACEUTICALS | sim | não | sim |
| extraction_stage3_system | extract-study-entities | nenhum | n/a | **sim** (Osteoarthritis) | sim |
| extraction_stage3_user | extract-study-entities | TEXT_CONTENT, STAGE1_*, STAGE2_* | sim | não | sim |
| triplet_extraction_system | nenhuma rotina | — | — | não | sem padrão no código |
| triplet_extraction_user | nenhuma rotina | — | 7 marcadores | **sim** (Astaxanthin, Osteoarthritis) | sem padrão no código |
| geroprotector_stack | nenhuma rotina | — | — | não | sem padrão no código |
| lab_driven_adjustment | nenhuma rotina | — | — | **sim** (curcumin) | sem padrão no código |
| treatment_proposal_12m | nenhuma rotina | — | — | não | sem padrão no código |
| relations_auditor_system | nenhuma rotina | — | — | não | sem padrão no código |

Resumo: `stage3_system` é o único outro prompt em uso com termo de exemplo. Fica como sugestão de um Contrato A3, não entra neste escopo. Na execução, faço antes a comparação linha a linha de cada override com o padrão do código.

## 5. Testes (tudo local, sem IA)

- Salvar uma cópia exata do valor final num arquivo de teste.
- Teste novo, que prova:
  - o marcador aparece exatamente 1 vez;
  - nenhum termo de exemplo aparece (sem diferenciar maiúsculas);
  - `buildStage1UserPrompt(valor, texto)` retorna `placeholderMissing: false` e coloca o texto do artigo no lugar do marcador.
- Antes do aceite, uma consulta SQL confere que o valor no banco é idêntico à cópia do teste (tamanho e md5).

## 6. Confirmação de `placeholder_missing: false` (por leitura, sem IA e sem reprocessar)

`extract-study-entities:278` carrega o override. `:292-293` passa esse valor para `buildStage1UserPrompt`, e `:328` grava a flag. Com o marcador presente, a flag vale `false`. A função no servidor não precisa de novo deploy, porque o prompt é lido do banco a cada execução.

## Execução (depois da aprovação)

1. Uma única alteração de dado: `UPDATE ai_configurations SET config_value = <valor da seção 3> WHERE config_key = 'prompt_extraction_stage1_user'`. Sem migração.
2. Consulta de verificação no banco: tamanho, md5, 1 marcador, 0 termos de exemplo, e as outras 11 chaves com `updated_at` inalterado.
3. Arquivo de teste, teste novo, Vitest completo e typecheck, com a saída real reportada.
4. Entrada no CHANGELOG com o backup e sincronização do changelog.
5. Nada publicado, nenhum estudo reprocessado, nenhuma chamada de IA.

## Argumento contra a própria proposta

- **Qualidade do formato:** trocar o exemplo por descritores de tipo pode deixar o JSON de saída menos consistente. Exemplos concretos costumam ancorar melhor o formato. O risco é mais `null` ou campos em formato diferente. O código já tolera campos ausentes, mas isso só se confirma na próxima extração real, que este contrato não faz.
- **Remover o override seria mais simples:** eliminaria de vez a divergência entre banco e código. Mas o Stage 1 perderia a extração da população do estudo sem ninguém perceber. Rejeitei essa opção por isso, mas ela é defensável se a população já vier de outra etapa.
- **A cópia no teste pode ficar desatualizada:** se alguém editar o prompt pelo painel, o teste continua verde. Só a consulta SQL do aceite pega isso. Uma validação permanente no editor do painel seria melhor, mas fica fora deste escopo.
- **"Osteoarthritis" continua em `stage3_system`,** que está em uso. Este contrato não fecha todo o risco de contaminação por exemplo.
