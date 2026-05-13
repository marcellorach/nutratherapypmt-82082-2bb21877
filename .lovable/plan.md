## Objetivo

Diferenciar claramente as duas vozes no card de consulta:

- **"Suspeita / Diagnóstico"** (`assessment`) → texto livre, coloquial, do veterinário. Em ~30% das consultas, **omite intencionalmente um diagnóstico** que aparecerá apenas na interpretação automática.
- **"Interpretação automática desta consulta"** (`machine_summary`) → leitura sintética porém **rica**, montada pela "máquina" (Senex AI), cruzando queixa + exame clínico + exames + condições + plano. Sempre cobre todos os achados, inclusive os que o vet esqueceu.

Isso reforça a proposta de valor: a IA captura o que o olhar humano deixa passar.

---

## Mudanças

### 1. `src/components/pet/GenerateSamplePetsButton.tsx`

#### 1.1 Reescrever campos `assessment` das consultas em SAMPLE_PETS

Tornar a redação mais livre, em primeira pessoa do veterinário, com hesitações e abreviações típicas. Em consultas selecionadas, **remover propositalmente** uma das condições do texto (mas mantê-la em `conditions[]` para o KG).

Exemplos de reescrita (resumo — aplico em todas as consultas):

- Buddy / check-up — atual: *"Pet hígido. Marcadores de estresse oxidativo discretamente elevados em painel preventivo."* → novo: *"Animal aparentemente bem, sem queixas. Painel mostrou alguma coisa no oxidativo, nada alarmante."* (omite "estresse oxidativo" como label — IA recupera)
- Rex / 3ª consulta — atual: *"Tríade confirmada: obesidade controlada, OA moderada, displasia coxofemoral grau 3 bilateral."* → novo: *"Confirmou displasia bilateral grau 3, OA já mexendo bastante. Peso vem caindo bem."* (omite "obesidade")
- Thor / 1ª consulta — atual: *"Osteoartrite incipiente associada à atividade física intensa."* → novo: *"Cão atlético, ainda sem queixa funcional, mas já apresenta rigidez pós-treino — provavelmente desgaste articular precoce de cão de trabalho."*
- Thor / 3ª — manter PCR/ferritina, mas escrever solto: *"Marcadores inflamatórios e oxidativos vieram acima do esperado pra idade. Vou pedir reavaliação geroprotetora."* (omite o termo "Inflammaging" — IA recupera)
- Luna / 5ª — atual cita CDS+HP. Nova versão: *"Tutor descreveu episódios de desorientação ao acordar, e o doppler mostrou pressão pulmonar elevada. Caso ficou bem complexo, vou somar suporte hepático e cardio."* (omite explicitamente "MMVD" como label, IA recupera)

Critério: omissão em **~1 a cada 3 consultas**, sempre uma condição que ainda assim está em `conditions[]` (o KG continua íntegro).

#### 1.2 Substituir geração trivial de `machine_summary`

Remover a lógica atual (linhas 479–481) que pega só a primeira frase do `assessment`. Em vez disso, montar 3–5 frases curtas a partir de:

1. Queixa principal traduzida em linguagem clínica.
2. Achados-chave do exame físico (`clinical_exam`).
3. Resultados anormais dos `exams` (usando `flags_abnormal` + `interpretation` quando presente).
4. Lista canônica das `conditions` desta visita (todas, mesmo as que o vet omitiu no texto livre).
5. Síntese do plano terapêutico em uma linha.

Função utilitária local `buildMachineSummary(c)` que retorna string PT-BR rica (~60–120 palavras), exemplo para Thor/1ª:

> "Cão de trabalho, 7a, em avaliação ortopédica preventiva. Exame revelou rigidez bilateral pós-exercício com massa muscular preservada. Avaliação articular registrou osteoartrite leve em quadris. Quadro compatível com OA incipiente induzida por atividade física intensa, classicamente descrita em Pastor Alemão de trabalho. Plano: suporte articular preventivo e reavaliação em 6 meses."

#### 1.3 Atualizar comentário (linhas 460–462)

Refletir nova lógica: "Interpretação determinística rica para demo: cobre achados que o vet pode ter omitido. Em produção real, a edge function `extract-pet-clinical-data` produz a mesma estrutura via LLM."

---

### 2. Sem mudanças em UI / banco / edge functions

- `ConsultationMachineSummary.tsx`: já renderiza `machineSummary` com `leading-relaxed` — texto longo cabe.
- `PetConsultationsTimeline.tsx`: já mostra `assessment` separado.
- Não toca em `i18n.ts` (não há chaves novas).
- Sem migração de DB.

---

### 3. Changelog

Adicionar entrada em `[Unreleased]` (`CHANGELOG.md`) com:

`<!-- area: pet-consultations · status: entregue · i18n: no -->`

E rodar `npm run sync:changelog` (regra core do projeto).

---

## Validação

1. Clicar "Gerar pets de exemplo" e abrir cada um dos 5 pets demo.
2. Em cada consulta verificar:
   - "Suspeita / Diagnóstico" soa como texto livre de veterinário.
   - "Interpretação automática" tem 3–5 frases e inclui pelo menos uma condição que NÃO está escrita no `assessment` (quando aplicável).
3. Confirmar que nada quebra na tabela `pet_consultations` (campos existentes, sem schema novo).