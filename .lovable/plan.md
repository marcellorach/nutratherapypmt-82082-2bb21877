

# Plano: Atualizar Métricas, Casos por Raça + Verificação de Segurança

## Resumo

3 mudanças principais + 1 verificação:

a) **Métricas da OutcomesSection**: Card 1 muda para "15-25%" (extensão de vida), Card 2 muda para "40-70%" (menos doenças degenerativas)
b) **Casos por raça**: Incluir drogas geroprotetoras reais (Rapamicina, Curcumina, Empagliflozina, Dapagliflozina, Apigenina)
c) **Idioma default**: Já está em inglês — nenhuma mudança necessária
d) **Políticas de acesso**: 2 alertas críticos encontrados (detalhes abaixo)

## Slogan

O slogan atual já está correto com as instruções anteriores:
- **EN:** "Extending Lives Through Precision Geroscience. 1.4 Million Dogs. Unlimited Discoveries."
- **PT:** "Estendendo Vidas Através da Gerociência de Precisão. 1,4 Milhão de Cães. Descobertas Ilimitadas."

Nenhuma mudança necessária no slogan.

## Idioma Default

O `src/i18n.ts` já usa `'en'` como fallback e default (`getSavedLanguage()` retorna `'en'` quando não há preferência salva). Nenhuma mudança necessária.

## Verificação de Políticas de Acesso

O linter de segurança encontrou **2 alertas críticos (ERROR)**:

1. **Security Definer View** — Existe uma view com `SECURITY DEFINER` que pode expor dados do criador da view ao invés do usuário que consulta
2. **RLS Desabilitada em tabela pública** — Existe uma tabela no schema público sem Row Level Security habilitada, permitindo acesso irrestrito

Esses alertas não serão corrigidos neste momento (para não afetar a apresentação), mas ficam registrados para correção posterior.

## Seção Técnica

### Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/components/landing/OutcomesSection.tsx` | Trocar ícones e valores dos 2 primeiros cards (TrendingUp 15-25%, TrendingDown 40-70%); remover import de Search, adicionar TrendingUp |
| `src/locales/en/translation.json` | Adicionar chave `lifeExtension`, remover `detection`; atualizar `approach` dos 3 breeds com drogas reais |
| `src/locales/pt/translation.json` | Mesmo em português |
| `src/i18n.ts` | Incrementar I18N_VERSION de 1.9.39 para 1.9.40 |

### Detalhes das Mudanças

**OutcomesSection.tsx — métricas:**
```text
Antes:                              Depois:
fewer    TrendingDown  20-30%  -->  lifeExtension  TrendingUp    15-25%
detection  Search      ~       -->  fewer          TrendingDown  40-70%
translational (inalterado)          translational (inalterado)
personalized (inalterado)           personalized (inalterado)
```

**Traduções EN — breeds.approach:**
- Golden: "Curcumin (anti-inflammatory) + Rapamycin (mTOR inhibitor for systemic geroprotection) — chondroprotective protocol starting at age 2."
- Cavalier: "Empagliflozin (SGLT2 cardioprotection) + Rapamycin (systemic geroprotection) with CoQ10 and taurine from early adulthood."
- Beagle: "Apigenin (GABAergic neuroprotection) + Dapagliflozin (SGLT2 neuroprotection) with continuous outcome monitoring."

**Traduções PT — breeds.approach:**
- Golden: "Curcumina (anti-inflamatório) + Rapamicina (inibidor mTOR para geroproteção sistêmica) — protocolo condroprotetor iniciando aos 2 anos."
- Cavalier: "Empagliflozina (cardioproteção SGLT2) + Rapamicina (geroproteção sistêmica) com CoQ10 e taurina desde a idade adulta."
- Beagle: "Apigenina (neuroproteção GABAérgica) + Dapagliflozina (neuroproteção SGLT2) com monitoramento contínuo de resultados."

