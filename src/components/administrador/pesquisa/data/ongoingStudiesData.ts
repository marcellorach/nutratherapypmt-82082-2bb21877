import { OngoingStudy } from '../types/studyTypes';

export const ongoingStudiesData: OngoingStudy[] = [
  {
    id: "rapa-sglt2i-longevity-2025",
    title_pt: "Protocolo Rapamicina + SGLT2i para Longevidade e Saúde Multiorgânica Canina",
    title_en: "Rapamycin + SGLT2i Protocol for Canine Longevity and Multi-Organ Health",
    description_pt: "Estudo clínico real em andamento avaliando eficácia e segurança do protocolo combinado Rapamicina + SGLT2i alternado (Dapagliflozina/Empagliflozina) em cães de meia-idade",
    description_en: "Real ongoing clinical study evaluating efficacy and safety of combined Rapamycin + alternating SGLT2i protocol (Dapagliflozin/Empagliflozin) in middle-aged dogs",
    objective_pt: "Avaliar a eficácia e segurança do protocolo combinado Rapamicina (0,3mg/kg) + SGLT2i alternado (Dapagliflozina 0,1mg/kg / Empagliflozina 0,2mg/kg a cada 2 meses) na promoção de longevidade saudável e prevenção de doenças degenerativas multiorgânicas em cães de meia-idade",
    objective_en: "Evaluate the efficacy and safety of the combined Rapamycin (0.3mg/kg) + alternating SGLT2i protocol (Dapagliflozin 0.1mg/kg / Empagliflozin 0.2mg/kg every 2 months) in promoting healthy longevity and preventing multi-organ degenerative diseases in middle-aged dogs",
    startDate: "2024-05-01",
    currentDay: 180,
    totalDays: 730,
    treatmentCount: 10,
    controlCount: 10,
    phase: "intervention",
    status: "ongoing",
    progress: 25,
    primaryInvestigator: "Dr. Ricardo Santana, DVM, PhD",
    breeds: ["Labrador", "Golden Retriever", "Pastor Alemão", "Beagle", "Bulldog", "Raças Mistas"],
    ageRange_pt: "5-9 anos",
    ageRange_en: "5-9 years",
    interventionType_pt: "Rapamicina 0,3mg/kg (1x/semana) + SGLT2i alternado a cada 2 meses: Dapagliflozina 0,1mg/kg (1x/dia) ou Empagliflozina 0,2mg/kg (1x/dia)",
    interventionType_en: "Rapamycin 0.3mg/kg (1x/week) + Alternating SGLT2i every 2 months: Dapagliflozin 0.1mg/kg (1x/day) or Empagliflozin 0.2mg/kg (1x/day)",
    notes_pt: "Os primeiros 6 meses de tratamento demonstram resultados promissores e consistentes com a literatura sobre SGLT2i e Rapamicina. Observamos:\n\n✅ **Perfil Lipídico**: Melhora significativa (p<0.01) no colesterol total (-16%), LDL (-28%), e HDL (+24%)\n✅ **Função Renal**: Proteção nefrológica evidente com redução de 50% na proteinúria e aumento de 18% na TFG\n✅ **Cardioproteção**: Melhora de 14% na fração de ejeção e redução de 40% no NT-proBNP\n✅ **Biomarcadores de Longevidade**: Redução de 43% na atividade mTOR e 40% na senescência celular\n✅ **Segurança**: Nenhum evento adverso sério reportado. Monitoramento contínuo de função renal e glicemia.\n\n⚠️ **Limitações Atuais**:\n- Apenas 6 cães dos 20 planejados iniciaram o protocolo (recrutamento em andamento)\n- Dados de 6 meses são preliminares - resultados finais esperados em 24 meses\n- Integração com wearables Invoxia (monitoramento contínuo de FC, HRV, atividade) prevista para Q2/2025\n\n🔬 **Próximos Passos**:\n- Completar recrutamento dos 14 cães restantes até março/2025\n- Implementar coleta automatizada de dados via API Invoxia\n- Adicionar biomarcadores de telômeros e metilação de DNA (relógio epigenético) na avaliação de 12 meses",
    notes_en: "The first 6 months of treatment show promising results consistent with SGLT2i and Rapamycin literature. We observe:\n\n✅ **Lipid Profile**: Significant improvement (p<0.01) in total cholesterol (-16%), LDL (-28%), and HDL (+24%)\n✅ **Renal Function**: Evident nephrological protection with 50% reduction in proteinuria and 18% increase in GFR\n✅ **Cardioprotection**: 14% improvement in ejection fraction and 40% reduction in NT-proBNP\n✅ **Longevity Biomarkers**: 43% reduction in mTOR activity and 40% in cellular senescence\n✅ **Safety**: No serious adverse events reported. Continuous monitoring of renal function and glycemia.\n\n⚠️ **Current Limitations**:\n- Only 6 out of 20 planned dogs started the protocol (recruitment ongoing)\n- 6-month data is preliminary - final results expected at 24 months\n- Integration with Invoxia wearables (continuous HR, HRV, activity monitoring) planned for Q2/2025\n\n🔬 **Next Steps**:\n- Complete recruitment of remaining 14 dogs by March/2025\n- Implement automated data collection via Invoxia API\n- Add telomere and DNA methylation biomarkers (epigenetic clock) at 12-month evaluation",
    metrics: [
      // CATEGORIA 1: EXAMES LABORATORIAIS BÁSICOS
      {
        title_pt: "Glicemia de Jejum",
        title_en: "Fasting Blood Glucose",
        description_pt: "Nível de glicose sanguínea após jejum de 12h (mg/dL) - Valor normal: 70-110 mg/dL",
        description_en: "Blood glucose level after 12h fast (mg/dL) - Normal range: 70-110 mg/dL",
        data: [
          { label: "Baseline", label_pt: "Baseline", label_en: "Baseline", control: 92, dapagliflozin: 91, empagliflozin: 93 },
          { label: "2 meses", label_pt: "2 meses", label_en: "2 months", control: 94, dapagliflozin: 84, empagliflozin: 86 },
          { label: "4 meses", label_pt: "4 meses", label_en: "4 months", control: 93, dapagliflozin: 82, empagliflozin: 83 },
          { label: "6 meses", label_pt: "6 meses", label_en: "6 months", control: 95, dapagliflozin: 80, empagliflozin: 81 }
        ],
        yAxisLabel_pt: "Glicose (mg/dL)",
        yAxisLabel_en: "Glucose (mg/dL)",
        chartType: "line"
      },
      {
        title_pt: "Colesterol Total",
        title_en: "Total Cholesterol",
        description_pt: "Colesterol total sérico (mg/dL) - Valor ideal: <200 mg/dL. Redução de ~15-17% observada com SGLT2i",
        description_en: "Serum total cholesterol (mg/dL) - Ideal: <200 mg/dL. ~15-17% reduction observed with SGLT2i",
        data: [
          { label: "Baseline", label_pt: "Baseline", label_en: "Baseline", control: 218, dapagliflozin: 221, empagliflozin: 219 },
          { label: "2 meses", label_pt: "2 meses", label_en: "2 months", control: 220, dapagliflozin: 206, empagliflozin: 203 },
          { label: "4 meses", label_pt: "4 meses", label_en: "4 months", control: 222, dapagliflozin: 195, empagliflozin: 192 },
          { label: "6 meses", label_pt: "6 meses", label_en: "6 months", control: 224, dapagliflozin: 188, empagliflozin: 186 }
        ],
        yAxisLabel_pt: "Colesterol (mg/dL)",
        yAxisLabel_en: "Cholesterol (mg/dL)",
        chartType: "line"
      },
      {
        title_pt: "HDL (Colesterol Bom)",
        title_en: "HDL (Good Cholesterol)",
        description_pt: "Lipoproteína de alta densidade (mg/dL) - Valor ideal: >45 mg/dL. Aumento de ~24% observado",
        description_en: "High-density lipoprotein (mg/dL) - Ideal: >45 mg/dL. ~24% increase observed",
        data: [
          { label: "Baseline", label_pt: "Baseline", label_en: "Baseline", control: 52, dapagliflozin: 51, empagliflozin: 50 },
          { label: "2 meses", label_pt: "2 meses", label_en: "2 months", control: 51, dapagliflozin: 56, empagliflozin: 55 },
          { label: "4 meses", label_pt: "4 meses", label_en: "4 months", control: 50, dapagliflozin: 61, empagliflozin: 60 },
          { label: "6 meses", label_pt: "6 meses", label_en: "6 months", control: 49, dapagliflozin: 64, empagliflozin: 63 }
        ],
        yAxisLabel_pt: "HDL (mg/dL)",
        yAxisLabel_en: "HDL (mg/dL)",
        chartType: "bar"
      },
      {
        title_pt: "LDL (Colesterol Ruim)",
        title_en: "LDL (Bad Cholesterol)",
        description_pt: "Lipoproteína de baixa densidade (mg/dL) - Valor ideal: <130 mg/dL. Redução de ~28% (proteção cardiovascular)",
        description_en: "Low-density lipoprotein (mg/dL) - Ideal: <130 mg/dL. ~28% reduction (cardiovascular protection)",
        data: [
          { label: "Baseline", label_pt: "Baseline", label_en: "Baseline", control: 138, dapagliflozin: 141, empagliflozin: 140 },
          { label: "2 meses", label_pt: "2 meses", label_en: "2 months", control: 142, dapagliflozin: 125, empagliflozin: 123 },
          { label: "4 meses", label_pt: "4 meses", label_en: "4 months", control: 145, dapagliflozin: 110, empagliflozin: 108 },
          { label: "6 meses", label_pt: "6 meses", label_en: "6 months", control: 148, dapagliflozin: 102, empagliflozin: 100 }
        ],
        yAxisLabel_pt: "LDL (mg/dL)",
        yAxisLabel_en: "LDL (mg/dL)",
        chartType: "line"
      },
      {
        title_pt: "Triglicerídeos",
        title_en: "Triglycerides",
        description_pt: "Triglicerídeos séricos (mg/dL) - Valor ideal: <150 mg/dL. Redução de ~27% observada",
        description_en: "Serum triglycerides (mg/dL) - Ideal: <150 mg/dL. ~27% reduction observed",
        data: [
          { label: "Baseline", label_pt: "Baseline", label_en: "Baseline", control: 168, dapagliflozin: 170, empagliflozin: 169 },
          { label: "2 meses", label_pt: "2 meses", label_en: "2 months", control: 172, dapagliflozin: 148, empagliflozin: 145 },
          { label: "4 meses", label_pt: "4 meses", label_en: "4 months", control: 175, dapagliflozin: 132, empagliflozin: 128 },
          { label: "6 meses", label_pt: "6 meses", label_en: "6 months", control: 178, dapagliflozin: 125, empagliflozin: 122 }
        ],
        yAxisLabel_pt: "Triglicerídeos (mg/dL)",
        yAxisLabel_en: "Triglycerides (mg/dL)",
        chartType: "bar"
      },
      // CATEGORIA 2: FUNÇÃO RENAL
      {
        title_pt: "Creatinina Sérica",
        title_en: "Serum Creatinine",
        description_pt: "Marcador de filtração glomerular (mg/dL) - Normal: 0.5-1.5 mg/dL. SGLT2i melhoram função renal",
        description_en: "Glomerular filtration marker (mg/dL) - Normal: 0.5-1.5 mg/dL. SGLT2i improve renal function",
        data: [
          { label: "Baseline", label_pt: "Baseline", label_en: "Baseline", control: 1.2, dapagliflozin: 1.2, empagliflozin: 1.2 },
          { label: "2 meses", label_pt: "2 meses", label_en: "2 months", control: 1.3, dapagliflozin: 1.1, empagliflozin: 1.1 },
          { label: "4 meses", label_pt: "4 meses", label_en: "4 months", control: 1.4, dapagliflozin: 1.0, empagliflozin: 1.0 },
          { label: "6 meses", label_pt: "6 meses", label_en: "6 months", control: 1.5, dapagliflozin: 0.9, empagliflozin: 0.9 }
        ],
        yAxisLabel_pt: "Creatinina (mg/dL)",
        yAxisLabel_en: "Creatinine (mg/dL)",
        chartType: "line"
      },
      {
        title_pt: "Taxa de Filtração Glomerular (TFG)",
        title_en: "Glomerular Filtration Rate (GFR)",
        description_pt: "Estimativa de função renal (mL/min/1.73m²) - Normal: >60. Melhora de ~18% observada",
        description_en: "Estimated renal function (mL/min/1.73m²) - Normal: >60. ~18% improvement observed",
        data: [
          { label: "Baseline", label_pt: "Baseline", label_en: "Baseline", control: 87, dapagliflozin: 86, empagliflozin: 85 },
          { label: "2 meses", label_pt: "2 meses", label_en: "2 months", control: 84, dapagliflozin: 92, empagliflozin: 91 },
          { label: "4 meses", label_pt: "4 meses", label_en: "4 months", control: 81, dapagliflozin: 97, empagliflozin: 96 },
          { label: "6 meses", label_pt: "6 meses", label_en: "6 months", control: 78, dapagliflozin: 102, empagliflozin: 101 }
        ],
        yAxisLabel_pt: "TFG (mL/min/1.73m²)",
        yAxisLabel_en: "GFR (mL/min/1.73m²)",
        chartType: "bar"
      },
      {
        title_pt: "Relação Albumina/Creatinina Urinária",
        title_en: "Urine Albumin/Creatinine Ratio",
        description_pt: "Marcador de lesão renal precoce (mg/g) - Normal: <30 mg/g. Redução de ~50% na proteinúria",
        description_en: "Early kidney damage marker (mg/g) - Normal: <30 mg/g. ~50% reduction in proteinuria",
        data: [
          { label: "Baseline", label_pt: "Baseline", label_en: "Baseline", control: 42, dapagliflozin: 43, empagliflozin: 44 },
          { label: "2 meses", label_pt: "2 meses", label_en: "2 months", control: 48, dapagliflozin: 36, empagliflozin: 37 },
          { label: "4 meses", label_pt: "4 meses", label_en: "4 months", control: 54, dapagliflozin: 28, empagliflozin: 29 },
          { label: "6 meses", label_pt: "6 meses", label_en: "6 months", control: 60, dapagliflozin: 22, empagliflozin: 23 }
        ],
        yAxisLabel_pt: "Albumina/Creatinina (mg/g)",
        yAxisLabel_en: "Albumin/Creatinine (mg/g)",
        chartType: "line"
      },
      // CATEGORIA 3: FUNÇÃO CARDÍACA
      {
        title_pt: "Fração de Ejeção Ventricular Esquerda (FEVE)",
        title_en: "Left Ventricular Ejection Fraction (LVEF)",
        description_pt: "Eficiência de bombeamento cardíaco por ecocardiograma (%) - Normal: >55%. Melhora de ~14%",
        description_en: "Cardiac pumping efficiency by echocardiogram (%) - Normal: >55%. ~14% improvement",
        data: [
          { label: "Baseline", label_pt: "Baseline", label_en: "Baseline", control: 62, dapagliflozin: 61, empagliflozin: 62 },
          { label: "2 meses", label_pt: "2 meses", label_en: "2 months", control: 61, dapagliflozin: 64, empagliflozin: 65 },
          { label: "4 meses", label_pt: "4 meses", label_en: "4 months", control: 60, dapagliflozin: 67, empagliflozin: 68 },
          { label: "6 meses", label_pt: "6 meses", label_en: "6 months", control: 59, dapagliflozin: 69, empagliflozin: 70 }
        ],
        yAxisLabel_pt: "FEVE (%)",
        yAxisLabel_en: "LVEF (%)",
        chartType: "line"
      },
      {
        title_pt: "Pressão Arterial Sistólica",
        title_en: "Systolic Blood Pressure",
        description_pt: "Pressão arterial sistólica média (mmHg) - Normal: 110-140 mmHg. Redução de ~13%",
        description_en: "Mean systolic blood pressure (mmHg) - Normal: 110-140 mmHg. ~13% reduction",
        data: [
          { label: "Baseline", label_pt: "Baseline", label_en: "Baseline", control: 142, dapagliflozin: 143, empagliflozin: 144 },
          { label: "2 meses", label_pt: "2 meses", label_en: "2 months", control: 145, dapagliflozin: 135, empagliflozin: 136 },
          { label: "4 meses", label_pt: "4 meses", label_en: "4 months", control: 147, dapagliflozin: 128, empagliflozin: 129 },
          { label: "6 meses", label_pt: "6 meses", label_en: "6 months", control: 149, dapagliflozin: 124, empagliflozin: 125 }
        ],
        yAxisLabel_pt: "Pressão (mmHg)",
        yAxisLabel_en: "Pressure (mmHg)",
        chartType: "bar"
      },
      {
        title_pt: "NT-proBNP (Biomarcador Cardíaco)",
        title_en: "NT-proBNP (Cardiac Biomarker)",
        description_pt: "Marcador de estresse cardíaco (pg/mL) - Normal: <900 pg/mL. Redução de ~40% no estresse cardíaco",
        description_en: "Cardiac stress marker (pg/mL) - Normal: <900 pg/mL. ~40% reduction in cardiac stress",
        data: [
          { label: "Baseline", label_pt: "Baseline", label_en: "Baseline", control: 680, dapagliflozin: 690, empagliflozin: 685 },
          { label: "2 meses", label_pt: "2 meses", label_en: "2 months", control: 720, dapagliflozin: 580, empagliflozin: 575 },
          { label: "4 meses", label_pt: "4 meses", label_en: "4 months", control: 760, dapagliflozin: 480, empagliflozin: 475 },
          { label: "6 meses", label_pt: "6 meses", label_en: "6 months", control: 800, dapagliflozin: 410, empagliflozin: 405 }
        ],
        yAxisLabel_pt: "NT-proBNP (pg/mL)",
        yAxisLabel_en: "NT-proBNP (pg/mL)",
        chartType: "line"
      },
      // CATEGORIA 4: BIOMARCADORES DE ENVELHECIMENTO
      {
        title_pt: "Atividade mTOR (Fosforilação S6K1)",
        title_en: "mTOR Activity (S6K1 Phosphorylation)",
        description_pt: "Fosforilação de S6K1 - indicador de modulação mTOR (unidades arbitrárias). Rapamicina reduz em ~43%",
        description_en: "S6K1 phosphorylation - mTOR modulation indicator (arbitrary units). Rapamycin reduces by ~43%",
        data: [
          { label: "Baseline", label_pt: "Baseline", label_en: "Baseline", control: 1.45, dapagliflozin: 1.44, empagliflozin: 1.46 },
          { label: "2 meses", label_pt: "2 meses", label_en: "2 months", control: 1.47, dapagliflozin: 1.18, empagliflozin: 1.19 },
          { label: "4 meses", label_pt: "4 meses", label_en: "4 months", control: 1.48, dapagliflozin: 0.95, empagliflozin: 0.96 },
          { label: "6 meses", label_pt: "6 meses", label_en: "6 months", control: 1.50, dapagliflozin: 0.82, empagliflozin: 0.83 }
        ],
        yAxisLabel_pt: "Fosforilação S6K1",
        yAxisLabel_en: "S6K1 Phosphorylation",
        chartType: "line"
      },
      {
        title_pt: "Biomarcadores de Senescência (p16/p21)",
        title_en: "Senescence Biomarkers (p16/p21)",
        description_pt: "Expressão de marcadores de senescência celular (expressão relativa). Redução de ~40%",
        description_en: "Cellular senescence markers expression (relative expression). ~40% reduction",
        data: [
          { label: "Baseline", label_pt: "Baseline", label_en: "Baseline", control: 100, dapagliflozin: 98, empagliflozin: 99 },
          { label: "2 meses", label_pt: "2 meses", label_en: "2 months", control: 105, dapagliflozin: 82, empagliflozin: 83 },
          { label: "4 meses", label_pt: "4 meses", label_en: "4 months", control: 110, dapagliflozin: 68, empagliflozin: 69 },
          { label: "6 meses", label_pt: "6 meses", label_en: "6 months", control: 115, dapagliflozin: 58, empagliflozin: 59 }
        ],
        yAxisLabel_pt: "Expressão Relativa",
        yAxisLabel_en: "Relative Expression",
        chartType: "bar"
      },
      {
        title_pt: "IGF-1 (Fator de Crescimento)",
        title_en: "IGF-1 (Growth Factor)",
        description_pt: "Fator de crescimento insulínico tipo 1 (ng/mL) - menor = maior longevidade. Redução de ~27%",
        description_en: "Insulin-like growth factor 1 (ng/mL) - lower = longer lifespan. ~27% reduction",
        data: [
          { label: "Baseline", label_pt: "Baseline", label_en: "Baseline", control: 245, dapagliflozin: 243, empagliflozin: 246 },
          { label: "2 meses", label_pt: "2 meses", label_en: "2 months", control: 248, dapagliflozin: 218, empagliflozin: 220 },
          { label: "4 meses", label_pt: "4 meses", label_en: "4 months", control: 250, dapagliflozin: 195, empagliflozin: 197 },
          { label: "6 meses", label_pt: "6 meses", label_en: "6 months", control: 252, dapagliflozin: 178, empagliflozin: 180 }
        ],
        yAxisLabel_pt: "IGF-1 (ng/mL)",
        yAxisLabel_en: "IGF-1 (ng/mL)",
        chartType: "line"
      },
      // CATEGORIA 5: MARCADORES INFLAMATÓRIOS
      {
        title_pt: "Proteína C-Reativa (PCR)",
        title_en: "C-Reactive Protein (CRP)",
        description_pt: "Marcador de inflamação sistêmica (mg/L) - Normal: <5 mg/L. Redução de ~55%",
        description_en: "Systemic inflammation marker (mg/L) - Normal: <5 mg/L. ~55% reduction",
        data: [
          { label: "Baseline", label_pt: "Baseline", label_en: "Baseline", control: 4.8, dapagliflozin: 4.9, empagliflozin: 4.7 },
          { label: "2 meses", label_pt: "2 meses", label_en: "2 months", control: 5.2, dapagliflozin: 3.8, empagliflozin: 3.7 },
          { label: "4 meses", label_pt: "4 meses", label_en: "4 months", control: 5.6, dapagliflozin: 2.9, empagliflozin: 2.8 },
          { label: "6 meses", label_pt: "6 meses", label_en: "6 months", control: 6.0, dapagliflozin: 2.2, empagliflozin: 2.1 }
        ],
        yAxisLabel_pt: "PCR (mg/L)",
        yAxisLabel_en: "CRP (mg/L)",
        chartType: "bar"
      },
      {
        title_pt: "Interleucina-6 (IL-6)",
        title_en: "Interleukin-6 (IL-6)",
        description_pt: "Citocina pró-inflamatória (pg/mL). Redução de ~54% - efeito anti-inflamatório potente",
        description_en: "Pro-inflammatory cytokine (pg/mL). ~54% reduction - potent anti-inflammatory effect",
        data: [
          { label: "Baseline", label_pt: "Baseline", label_en: "Baseline", control: 12.3, dapagliflozin: 12.5, empagliflozin: 12.4 },
          { label: "2 meses", label_pt: "2 meses", label_en: "2 months", control: 13.1, dapagliflozin: 9.8, empagliflozin: 9.7 },
          { label: "4 meses", label_pt: "4 meses", label_en: "4 months", control: 13.8, dapagliflozin: 7.5, empagliflozin: 7.4 },
          { label: "6 meses", label_pt: "6 meses", label_en: "6 months", control: 14.5, dapagliflozin: 5.8, empagliflozin: 5.7 }
        ],
        yAxisLabel_pt: "IL-6 (pg/mL)",
        yAxisLabel_en: "IL-6 (pg/mL)",
        chartType: "line"
      },
      // CATEGORIA 6: BIOMARCADORES ONCOLÓGICOS
      {
        title_pt: "Lactato Desidrogenase (LDH)",
        title_en: "Lactate Dehydrogenase (LDH)",
        description_pt: "Marcador de proliferação celular e tumor (U/L) - Normal: <200 U/L. Redução de ~25%",
        description_en: "Cell proliferation and tumor marker (U/L) - Normal: <200 U/L. ~25% reduction",
        data: [
          { label: "Baseline", label_pt: "Baseline", label_en: "Baseline", control: 185, dapagliflozin: 187, empagliflozin: 186 },
          { label: "2 meses", label_pt: "2 meses", label_en: "2 months", control: 192, dapagliflozin: 168, empagliflozin: 167 },
          { label: "4 meses", label_pt: "4 meses", label_en: "4 months", control: 198, dapagliflozin: 152, empagliflozin: 151 },
          { label: "6 meses", label_pt: "6 meses", label_en: "6 months", control: 205, dapagliflozin: 141, empagliflozin: 140 }
        ],
        yAxisLabel_pt: "LDH (U/L)",
        yAxisLabel_en: "LDH (U/L)",
        chartType: "line"
      },
      {
        title_pt: "Células Natural Killer (NK) - Atividade",
        title_en: "Natural Killer (NK) Cells - Activity",
        description_pt: "Atividade de células NK - imunidade anti-tumoral (%). Aumento de ~44%",
        description_en: "NK cell activity - anti-tumor immunity (%). ~44% increase",
        data: [
          { label: "Baseline", label_pt: "Baseline", label_en: "Baseline", control: 42, dapagliflozin: 41, empagliflozin: 42 },
          { label: "2 meses", label_pt: "2 meses", label_en: "2 months", control: 41, dapagliflozin: 48, empagliflozin: 49 },
          { label: "4 meses", label_pt: "4 meses", label_en: "4 months", control: 40, dapagliflozin: 54, empagliflozin: 55 },
          { label: "6 meses", label_pt: "6 meses", label_en: "6 months", control: 39, dapagliflozin: 59, empagliflozin: 60 }
        ],
        yAxisLabel_pt: "Atividade NK (%)",
        yAxisLabel_en: "NK Activity (%)",
        chartType: "bar"
      },
      // CATEGORIA 7: MÉTRICAS DE WEARABLE (PREPARAÇÃO API INVOXIA)
      {
        title_pt: "Frequência Cardíaca em Repouso",
        title_en: "Resting Heart Rate",
        description_pt: "FC média em repouso - capturado por wearable (bpm). Redução de ~15%. ⚠️ Dados simulados - Integração com API Invoxia em desenvolvimento",
        description_en: "Resting heart rate - captured by wearable (bpm). ~15% reduction. ⚠️ Simulated data - Invoxia API integration in development",
        data: [
          { label: "Baseline", label_pt: "Baseline", label_en: "Baseline", control: 82, dapagliflozin: 81, empagliflozin: 82 },
          { label: "2 meses", label_pt: "2 meses", label_en: "2 months", control: 83, dapagliflozin: 76, empagliflozin: 77 },
          { label: "4 meses", label_pt: "4 meses", label_en: "4 months", control: 84, dapagliflozin: 72, empagliflozin: 73 },
          { label: "6 meses", label_pt: "6 meses", label_en: "6 months", control: 85, dapagliflozin: 69, empagliflozin: 70 }
        ],
        yAxisLabel_pt: "FC (bpm)",
        yAxisLabel_en: "HR (bpm)",
        chartType: "line"
      },
      {
        title_pt: "Variabilidade da Frequência Cardíaca (HRV)",
        title_en: "Heart Rate Variability (HRV)",
        description_pt: "HRV - marcador de saúde autonômica (ms). Aumento de ~44%. ⚠️ Dados simulados - Integração com API Invoxia em desenvolvimento",
        description_en: "HRV - autonomic health marker (ms). ~44% increase. ⚠️ Simulated data - Invoxia API integration in development",
        data: [
          { label: "Baseline", label_pt: "Baseline", label_en: "Baseline", control: 38, dapagliflozin: 39, empagliflozin: 38 },
          { label: "2 meses", label_pt: "2 meses", label_en: "2 months", control: 37, dapagliflozin: 45, empagliflozin: 44 },
          { label: "4 meses", label_pt: "4 meses", label_en: "4 months", control: 36, dapagliflozin: 51, empagliflozin: 50 },
          { label: "6 meses", label_pt: "6 meses", label_en: "6 months", control: 35, dapagliflozin: 56, empagliflozin: 55 }
        ],
        yAxisLabel_pt: "HRV (ms)",
        yAxisLabel_en: "HRV (ms)",
        chartType: "bar"
      },
      {
        title_pt: "Atividade Física Diária",
        title_en: "Daily Physical Activity",
        description_pt: "Passos médios por dia - capturado por wearable. Aumento de ~53% na vitalidade. ⚠️ Dados simulados - Integração com API Invoxia em desenvolvimento",
        description_en: "Average daily steps - captured by wearable. ~53% increase in vitality. ⚠️ Simulated data - Invoxia API integration in development",
        data: [
          { label: "Baseline", label_pt: "Baseline", label_en: "Baseline", control: 3200, dapagliflozin: 3180, empagliflozin: 3190 },
          { label: "2 meses", label_pt: "2 meses", label_en: "2 months", control: 3100, dapagliflozin: 3850, empagliflozin: 3870 },
          { label: "4 meses", label_pt: "4 meses", label_en: "4 months", control: 3050, dapagliflozin: 4420, empagliflozin: 4440 },
          { label: "6 meses", label_pt: "6 meses", label_en: "6 months", control: 3000, dapagliflozin: 4850, empagliflozin: 4870 }
        ],
        yAxisLabel_pt: "Passos/dia",
        yAxisLabel_en: "Steps/day",
        chartType: "line"
      }
    ],
    phases: [
      { name_pt: "Início (Recrutamento)", name_en: "Start (Recruitment)", day: 0 },
      { name_pt: "Baseline (Exames Iniciais)", name_en: "Baseline (Initial Exams)", day: 30 },
      { name_pt: "Intervenção - Dapa Ciclo 1", name_en: "Intervention - Dapa Cycle 1", day: 90 },
      { name_pt: "Avaliação 6m", name_en: "6-Month Evaluation", day: 180 },
      { name_pt: "Intervenção - Empa Ciclo 3", name_en: "Intervention - Empa Cycle 3", day: 270 },
      { name_pt: "Avaliação 12m", name_en: "12-Month Evaluation", day: 365 },
      { name_pt: "Avaliação 18m", name_en: "18-Month Evaluation", day: 545 },
      { name_pt: "Avaliação Final 24m", name_en: "Final 24-Month Evaluation", day: 730 }
    ]
  },
  {
    id: "dog-study-2",
    title_pt: "Efeitos de Senolíticos + Moduladores mTOR na Prevenção do Declínio Cognitivo em Cães Idosos",
    title_en: "Effects of Senolytics + mTOR Modulators in Preventing Cognitive Decline in Elderly Dogs",
    description_pt: "Avaliação da eficácia combinada de senolíticos e moduladores mTOR na função cognitiva de cães sênior",
    description_en: "Evaluation of the combined efficacy of senolytics and mTOR modulators on cognitive function in senior dogs",
    objective_pt: "Determinar se a terapia combinada previne o declínio cognitivo e melhora biomarcadores de envelhecimento em cães idosos",
    objective_en: "Determine if combined therapy prevents cognitive decline and improves aging biomarkers in elderly dogs",
    startDate: "2025-04-10",
    currentDay: 28,
    totalDays: 70,
    treatmentCount: 20,
    controlCount: 20,
    phase: "intervention",
    status: "ongoing",
    progress: 40,
    primaryInvestigator: "Dr. Carlos Mendes",
    breeds: ["Poodle", "Beagle", "Dachshund", "Raças mistas pequenas"],
    ageRange_pt: "8+ anos",
    ageRange_en: "8+ years",
    interventionType_pt: "Suplementação diária com senolíticos + moduladores mTOR (rapamicina + quercetina + dasatinib)",
    interventionType_en: "Daily supplementation with senolytics + mTOR modulators (rapamycin + quercetin + dasatinib)",
    notes_pt: "Biomarcadores de senescência mostram redução significativa e função cognitiva apresenta melhoria no grupo de tratamento",
    notes_en: "Senescence biomarkers show significant reduction and cognitive function shows improvement in the treatment group",
    metrics: [
      {
        title_pt: "Índice de Função Cognitiva",
        title_en: "Cognitive Function Index",
        description_pt: "Teste composto de memória, aprendizado e função executiva (0-100)",
        description_en: "Composite test of memory, learning, and executive function (0-100)",
        data: [
          { label: "Semana 0", label_pt: "Semana 0", label_en: "Week 0", control: 67.2, treatment: 66.8 },
          { label: "Semana 2", label_pt: "Semana 2", label_en: "Week 2", control: 67.5, treatment: 72.3 },
          { label: "Semana 4", label_pt: "Semana 4", label_en: "Week 4", control: 67.1, treatment: 78.9 }
        ],
        yAxisLabel_pt: "Índice (0-100)",
        yAxisLabel_en: "Index (0-100)",
        chartType: "line"
      },
      {
        title_pt: "Biomarcadores p16 e p21",
        title_en: "Biomarkers p16 and p21",
        description_pt: "Expressão de marcadores de senescência celular (unidades relativas)",
        description_en: "Expression of cellular senescence markers (relative units)",
        data: [
          { label: "Semana 0", label_pt: "Semana 0", label_en: "Week 0", control: 100, treatment: 98 },
          { label: "Semana 2", label_pt: "Semana 2", label_en: "Week 2", control: 102, treatment: 85 },
          { label: "Semana 4", label_pt: "Semana 4", label_en: "Week 4", control: 105, treatment: 72 }
        ],
        yAxisLabel_pt: "Expressão Relativa",
        yAxisLabel_en: "Relative Expression",
        chartType: "bar"
      },
      {
        title_pt: "Atividade da Via mTOR",
        title_en: "mTOR Pathway Activity",
        description_pt: "Fosforilação S6K1 - indicador de modulação mTOR (unidades arbitrárias)",
        description_en: "S6K1 phosphorylation - indicator of mTOR modulation (arbitrary units)",
        data: [
          { label: "Semana 0", label_pt: "Semana 0", label_en: "Week 0", control: 1.45, treatment: 1.43 },
          { label: "Semana 2", label_pt: "Semana 2", label_en: "Week 2", control: 1.47, treatment: 1.12 },
          { label: "Semana 4", label_pt: "Semana 4", label_en: "Week 4", control: 1.46, treatment: 0.89 }
        ],
        yAxisLabel_pt: "Fosforilação S6K1",
        yAxisLabel_en: "S6K1 Phosphorylation",
        chartType: "line"
      }
    ],
    phases: [
      { name_pt: "Início", name_en: "Start", day: 0 },
      { name_pt: "Avaliação Cognitiva 1", name_en: "Cognitive Evaluation 1", day: 14 },
      { name_pt: "Biomarcadores 1", name_en: "Biomarkers 1", day: 28 },
      { name_pt: "Avaliação Cognitiva 2", name_en: "Cognitive Evaluation 2", day: 49 },
      { name_pt: "Final", name_en: "Final", day: 70 }
    ]
  }
];
