
# Plano: Substituir Grafico Simples por Infografico de Vantagem Translacional com Nuances Estatisticas

## O Que Muda

Substituir as duas barras simples (dog lifespan / human research time) na VisionSection por um infografico rico que comunica visualmente:

1. **Timeline comparativa completa**: Lifespan de caes (10-13 anos) vs humanos (75-85 anos) com marcos etarios
2. **Janela de tratamento e verificacao**: Mostrando que ao iniciar tratamento em caes de 7-8 anos, resultados estatisticamente significativos surgem em 2-3 anos (vs 15-20 anos em humanos)
3. **Nuances estatisticas**: Nao e preciso esperar todos os caes morrerem -- analises interinas (Kaplan-Meier, Cox hazards) permitem detectar efeitos com ~50-60% dos eventos esperados

## Design do Infografico

Layout vertical com 3 camadas:

### Camada 1: Timelines de Vida Comparativas
- Barra horizontal escura = vida do cao (0-13 anos) com marcos: Filhote, Adulto, Senior, Geriatrico
- Barra horizontal clara = vida humana (0-85 anos) com marcos equivalentes
- Marcador visual mostrando a "janela de intervencao" (7-8 anos no cao = ~50 anos humanos)

### Camada 2: Tempo ate Resultados Clinicos
- Indicador visual: "Inicio do tratamento geroprotetor" no cao aos 7 anos
- Seta curta (2-3 anos) ate "Resultados estatisticamente significativos" no cao
- Seta longa (15-20 anos) para o equivalente humano
- Destaque: "7x mais rapido"

### Camada 3: Card com Nuances Estatisticas
- Icone de grafico + texto explicativo sobre analises interinas
- Pontos-chave:
  - "Nao e necessario aguardar desfecho final (morte) para todos os sujeitos"
  - "Analises de sobrevivencia (Kaplan-Meier) detectam diferencas com ~60% dos eventos"
  - "Endpoints compostos (funcao cognitiva, mobilidade, biomarcadores) fornecem sinais ainda mais rapidos"
  - Referencia ao TRIAD (Dog Aging Project) como validacao real

## Detalhes Tecnicos

### Arquivo modificado:
- `src/components/landing/VisionSection.tsx` -- substituir o bloco das linhas 53-71 (7x faster visual) pelo novo infografico

### Traducoes a adicionar:
Novas chaves em `landing.vision.translational.*`:
- `timelineTitle`, `dogTimeline`, `humanTimeline`
- `puppy`, `adult`, `senior`, `geriatric` (marcos)
- `interventionWindow`, `treatmentStart`
- `dogResults` ("Resultados em 2-3 anos")
- `humanResults` ("Equivalente humano: 15-20 anos")
- `statisticalTitle`
- `stat1` ("Analises interinas permitem conclusoes antes do desfecho final")
- `stat2` ("Curvas de sobrevivencia detectam efeitos com ~60% dos eventos")
- `stat3` ("Endpoints compostos aceleram ainda mais a deteccao")
- `reference` ("Baseado no design do TRIAD - Dog Aging Project, Nature 2022")

### Arquivos afetados:
1. `src/components/landing/VisionSection.tsx` -- novo infografico
2. `src/locales/pt/translation.json` -- chaves PT
3. `src/locales/en/translation.json` -- chaves EN
4. `src/i18n.ts` -- incrementar versao

### Implementacao visual:
- Puro CSS/Tailwind + Framer Motion (sem bibliotecas de chart)
- Barras proporcionais com gradientes sutis
- Badges para marcos etarios
- Cards com bordas finas e icones Lucide
- Mantendo o estilo clean/minimalista atual da landing page
