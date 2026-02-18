

# Plano: Melhorar Market Section + B2C + Monetização

## 3 Mudanças

### a) Corrigir Gráfico TAM/SAM/SOM

O gráfico atual tem problemas: os valores 85M e 28M ficam sobrepostos/cortados nos círculos concêntricos. A referência mostra círculos bem proporcionados com labels claros.

**Solução:** Redesenhar completamente o infográfico com:
- Círculos maiores (w-96 h-96 ao invés de w-80 h-80) para dar espaço
- Labels TAM/SAM posicionadas **fora** dos círculos (acima e ao lado) para não sobrepor
- Proporcionalidade visual correta entre TAM (externo, claro), SAM (meio, médio), SOM (centro, escuro)
- Valores e descrições bem espaçados dentro de cada anel
- Sombras sutis para dar profundidade como na referência

### b) Incluir petmoretime.com.br como Usuário Atual

Adicionar uma nova subseção abaixo do gráfico TAM/SAM/SOM mostrando que já existe um produto B2C ativo:
- Card com destaque: "Already in Market" / "Já no Mercado"
- Link para www.petmoretime.com.br
- Contexto: plataforma B2C de venda de tratamentos geroprotetores personalizados para tutores de pets, validando o modelo de negócio

### c) Monetização: Venda em Massa de Tratamentos

Adicionar subseção "Business Model" explicando:
- Monetização via venda em massa de tratamentos geroprotetores para os integrantes do plano de saúde PetLove
- Ganha-ganha: PetLove reduz custos com doenças degenerativas, tutores têm pets mais saudáveis, plataforma monetiza em escala, ciência avança com dados longitudinais
- Modelo: tratamentos preventivos em escala a preço acessível, habilitado pela parceria de dados

## Seção Técnica

### Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/components/landing/MarketSection.tsx` | Redesenhar gráfico TAM/SAM/SOM com proporções corretas; adicionar subseção B2C (petmoretime.com.br) e subseção Business Model (monetização ganha-ganha) |
| `src/locales/en/translation.json` | Adicionar chaves `landing.market.b2c*`, `landing.market.monetization*` |
| `src/locales/pt/translation.json` | Mesmo em português |
| `src/i18n.ts` | Incrementar I18N_VERSION de 1.9.40 para 1.9.41 |

### Detalhes do Gráfico Corrigido

O novo gráfico terá:
- Container maior (400x400px) com posicionamento absoluto proporcional
- TAM: círculo externo bg-gray-100 com borda fina, label "TAM" + "85M" posicionados no topo do anel (pt-8) com texto "Companion dogs in Brazil"
- SAM: círculo médio (inset ~20%) bg-gray-200, label "SAM" + "28M" + "Adults + seniors (33%)"
- SOM: círculo interno (inset ~40%) bg-gray-800 (escuro), "SOM" + "5.6M" + "Premium segment (20%)" em branco
- Shadow sutil nos círculos para profundidade

### Traduções Novas (EN)

```
landing.market.b2cTitle: "Already in Market"
landing.market.b2cDesc: "Our B2C platform petmoretime.com.br is already selling personalized geroprotective treatments directly to pet owners, validating the business model and generating real-world outcome data."
landing.market.b2cLink: "Visit petmoretime.com.br"
landing.market.monetizationTitle: "Win-Win Business Model"
landing.market.monetizationDesc: "Monetization through mass-scale sale of preventive geroprotective treatments to PetLove's 1.4M plan members — creating value for everyone."
landing.market.winPetlove: "PetLove reduces long-term costs by preventing expensive degenerative diseases in plan members."
landing.market.winTutors: "Pet owners get healthier, longer-lived companions through accessible preventive treatments."
landing.market.winScience: "Longitudinal outcome data from 1.4M dogs accelerates translational discoveries for human geroscience."
landing.market.winPlatform: "Platform monetizes at scale through the largest accessible veterinary cohort in Latin America."
```

### Traduções Novas (PT)

```
landing.market.b2cTitle: "Já no Mercado"
landing.market.b2cDesc: "Nossa plataforma B2C petmoretime.com.br já vende tratamentos geroprotetores personalizados diretamente para tutores de pets, validando o modelo de negócio e gerando dados reais de resultados."
landing.market.b2cLink: "Visite petmoretime.com.br"
landing.market.monetizationTitle: "Modelo de Negócio Ganha-Ganha"
landing.market.monetizationDesc: "Monetização através da venda em massa de tratamentos geroprotetores preventivos para os 1,4M de integrantes do plano PetLove — criando valor para todos."
landing.market.winPetlove: "PetLove reduz custos de longo prazo prevenindo doenças degenerativas caras nos integrantes do plano."
landing.market.winTutors: "Tutores têm companheiros mais saudáveis e longevos através de tratamentos preventivos acessíveis."
landing.market.winScience: "Dados longitudinais de resultados de 1,4M de cães aceleram descobertas translacionais para gerociência humana."
landing.market.winPlatform: "Plataforma monetiza em escala através do maior coorte veterinário acessível da América Latina."
```

### Estrutura Visual Final da Seção Market

```text
MARKET OPPORTUNITY
Brazil's Pet Market

[Gráfico TAM/SAM/SOM corrigido]    [4 métricas laterais]
  85M / 28M / 5.6M                   3rd, 14%+, US$12B, 33%

--- Already in Market ---
[Card] petmoretime.com.br - B2C já operando
       [Botão: Visit petmoretime.com.br →]

--- Win-Win Business Model ---
[4 cards em grid 2x2]
  PetLove wins | Tutors win | Science wins | Platform wins
```
