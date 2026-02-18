
# Plano: Logos PetLove/PAMEC + Grafico TAM/SAM/SOM com imagem

## 2 Mudancas

### a) Substituir icones por logos reais (PetLove e PAMEC)

Na OpportunitySection, os cards PetLove e PAMEC usam icones genericos (Database e Shield do Lucide). Vamos:

1. Copiar o SVG do PetLove (`user-uploads://pet-love.svg`) para `src/assets/petlove-logo.svg`
2. Copiar a imagem do PAMEC (`user-uploads://Screenshot_2026-02-18_at_00.08.24.png`) para `src/assets/pamec-logo.png`
3. No `OpportunitySection.tsx`:
   - Importar ambos os logos como modulos ES6
   - Substituir `<Database>` por `<img src={petloveLogo}>` (altura ~28px)
   - Substituir `<Shield>` por `<img src={pamecLogo}>` (altura ~32px)
   - Remover imports de `Database` e `Shield` do lucide-react

### b) Substituir grafico TAM/SAM/SOM por imagem do usuario

O grafico atual em CSS puro tem problemas de sobreposicao. O usuario enviou uma versao melhor (foto 4 - Screenshot_2026-02-18_at_00.10.39.png) que mostra o layout ideal com circulos sobrepostos estilo Venn + metricas laterais com barras de segmentacao.

1. Copiar `user-uploads://Screenshot_2026-02-18_at_00.10.39.png` para `src/assets/tam-sam-som.png`
2. No `MarketSection.tsx`:
   - Importar a imagem
   - Substituir todo o bloco de circulos concentricos CSS (linhas 44-90) por uma unica `<img>` com a imagem importada
   - Manter max-width de ~500px e responsividade
   - Remover as metricas laterais (3rd, 14%+, US$12B, 33%) pois ja estao na imagem

---

## Secao Tecnica

### Arquivos a Criar/Copiar

| Origem | Destino |
|--------|---------|
| `user-uploads://pet-love.svg` | `src/assets/petlove-logo.svg` |
| `user-uploads://Screenshot_2026-02-18_at_00.08.24.png` | `src/assets/pamec-logo.png` |
| `user-uploads://Screenshot_2026-02-18_at_00.10.39.png` | `src/assets/tam-sam-som.png` |

### Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `src/components/landing/OpportunitySection.tsx` | Trocar icones Database/Shield por logos importados |
| `src/components/landing/MarketSection.tsx` | Trocar grafico CSS por imagem TAM/SAM/SOM |
| `src/i18n.ts` | Incrementar I18N_VERSION para 1.9.44 |

### OpportunitySection - Mudancas

```tsx
// Adicionar imports
import petloveLogo from '@/assets/petlove-logo.svg';
import pamecLogo from '@/assets/pamec-logo.png';

// PetLove card - trocar <Database> por:
<img src={petloveLogo} alt="PetLove" className="h-7 w-auto" />

// PAMEC card - trocar <Shield> por:
<img src={pamecLogo} alt="PAMEC" className="h-8 w-auto" />
```

### MarketSection - Mudancas

Substituir o bloco de circulos concentricos (div com width/height 420) e as metricas laterais por:

```tsx
import tamSamSomChart from '@/assets/tam-sam-som.png';

// Substituir todo o flex container com circulos + metricas por:
<motion.div variants={fadeUp} custom={0} className="flex justify-center">
  <img 
    src={tamSamSomChart} 
    alt="TAM 85M dogs / SAM 28M dogs / SOM 5.6M premium dogs" 
    className="w-full max-w-4xl rounded-2xl"
  />
</motion.div>
```

Isso remove ~60 linhas de CSS complexo e usa a imagem profissional do usuario.
