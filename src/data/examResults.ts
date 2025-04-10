
import { ExamResult } from "../types";

// Função para formatar data no padrão YYYY-MM-DD
const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};

// Gera datas para exames retroativos
const getExamDates = (count: number, treatmentStart: string): string[] => {
  const startDate = new Date(treatmentStart);
  const dates: string[] = [];
  
  // Adicionar a data de início do tratamento
  dates.push(formatDate(startDate));
  
  // Adicionar exames anteriores (retroativos)
  for (let i = 1; i <= Math.floor(count/2); i++) {
    const previousDate = new Date(startDate);
    previousDate.setDate(previousDate.getDate() - (30 * i));
    dates.push(formatDate(previousDate));
  }
  
  // Adicionar exames posteriores (acompanhamento)
  for (let i = 1; i <= Math.ceil(count/2) - 1; i++) {
    const followupDate = new Date(startDate);
    followupDate.setDate(followupDate.getDate() + (30 * i));
    dates.push(formatDate(followupDate));
  }
  
  // Ordenar datas do mais antigo ao mais recente
  return dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
};

// Mock Exam Results
export const examResults: ExamResult[] = [
  // Pet 1 (série completa de exames)
  {
    id: "exm1_1",
    petId: "pet1",
    date: "2025-01-15",
    type: "Hemograma completo",
    results: {
      "Hemoglobina": "13.2 g/dL",
      "Hematócrito": "40%",
      "Leucócitos": 9200,
      "Plaquetas": 240000,
      "Vitamina D": "22.1 ng/mL",
      "Cálcio": "8.7 mg/dL",
      "Proteínas totais": "6.1 g/dL",
      "ALT": 45
    },
    notes: "Níveis de vitamina D ligeiramente abaixo do ideal. Hemograma estável, sem alterações significativas."
  },
  {
    id: "exm1_2",
    petId: "pet1",
    date: "2025-02-15",
    type: "Hemograma completo",
    results: {
      "Hemoglobina": "12.9 g/dL",
      "Hematócrito": "39%",
      "Leucócitos": 9800,
      "Plaquetas": 235000,
      "Vitamina D": "21.5 ng/mL",
      "Cálcio": "8.5 mg/dL",
      "Proteínas totais": "6.0 g/dL",
      "ALT": 48
    },
    notes: "Pequena redução nos níveis de hemoglobina e vitamina D. Recomendo monitoramento."
  },
  {
    id: "exm1_3",
    petId: "pet1",
    date: "2025-03-15",
    type: "Hemograma completo",
    results: {
      "Hemoglobina": "12.5 g/dL",
      "Hematócrito": "38%",
      "Leucócitos": 10200,
      "Plaquetas": 228000,
      "Vitamina D": "20.8 ng/mL",
      "Cálcio": "8.4 mg/dL",
      "Proteínas totais": "5.9 g/dL",
      "ALT": 52
    },
    notes: "Tendência decrescente nos parâmetros hematológicos. Indicação de suplementação nutracêutica para corrigir deficiências."
  },
  {
    id: "exm1_4",
    petId: "pet1",
    date: "2025-04-15", // Data de início do tratamento
    type: "Hemograma completo",
    results: {
      "Hemoglobina": "12.3 g/dL",
      "Hematócrito": "37%",
      "Leucócitos": 10500,
      "Plaquetas": 220000,
      "Vitamina D": "19.5 ng/mL",
      "Cálcio": "8.2 mg/dL",
      "Proteínas totais": "5.8 g/dL",
      "ALT": 55
    },
    notes: "Início do tratamento com DermaVit Omega. Exames mostram deficiência vitamínica e inflamação leve."
  },
  {
    id: "exm1_5",
    petId: "pet1",
    date: "2025-05-15",
    type: "Hemograma completo",
    results: {
      "Hemoglobina": "13.0 g/dL",
      "Hematócrito": "39%",
      "Leucócitos": 9800,
      "Plaquetas": 230000,
      "Vitamina D": "23.2 ng/mL",
      "Cálcio": "8.6 mg/dL",
      "Proteínas totais": "6.0 g/dL",
      "ALT": 48
    },
    notes: "Melhora nos parâmetros após um mês de tratamento. Vitamina D retornando aos níveis normais."
  },
  {
    id: "exm1_6",
    petId: "pet1",
    date: "2025-06-15",
    type: "Hemograma completo",
    results: {
      "Hemoglobina": "13.8 g/dL",
      "Hematócrito": "42%",
      "Leucócitos": 8900,
      "Plaquetas": 245000,
      "Vitamina D": "27.5 ng/mL",
      "Cálcio": "9.0 mg/dL",
      "Proteínas totais": "6.3 g/dL",
      "ALT": 42
    },
    notes: "Excelente resposta ao tratamento. Todos os parâmetros estão voltando aos níveis normais. Continuar com o protocolo atual."
  },
  
  // Pet 2 (menos exames, mas com alterações importantes)
  {
    id: "exm2_1",
    petId: "pet2",
    date: "2025-02-10",
    type: "Perfil articular",
    results: {
      "Fator Reumatoide": "12 UI/mL",
      "Cálcio": "8.9 mg/dL",
      "Fósforo": "4.2 mg/dL",
      "PCR": "3.8 mg/L",
      "Sulfato de Condroitina": "180 μg/mL",
      "Vitamina D": "24.5 ng/mL",
      "ALT": 38
    },
    notes: "Níveis adequados de minerais, com leve inflamação indicada pela PCR. Sulfato de condroitina no limite inferior do normal."
  },
  {
    id: "exm2_2",
    petId: "pet2",
    date: "2025-03-10",
    type: "Perfil articular",
    results: {
      "Fator Reumatoide": "15 UI/mL",
      "Cálcio": "8.7 mg/dL",
      "Fósforo": "4.5 mg/dL",
      "PCR": "5.2 mg/L",
      "Sulfato de Condroitina": "165 μg/mL",
      "Vitamina D": "22.8 ng/mL",
      "ALT": 42
    },
    notes: "Aumento na PCR indica progressão do processo inflamatório. Redução no sulfato de condroitina sugerindo desgaste articular."
  },
  {
    id: "exm2_3",
    petId: "pet2",
    date: "2025-04-10", // Início do tratamento
    type: "Perfil articular",
    results: {
      "Fator Reumatoide": "18 UI/mL",
      "Cálcio": "8.5 mg/dL",
      "Fósforo": "4.7 mg/dL",
      "PCR": "6.8 mg/L",
      "Sulfato de Condroitina": "152 μg/mL",
      "Vitamina D": "21.2 ng/mL",
      "ALT": 45
    },
    notes: "Progressão dos marcadores inflamatórios. Necessária intervenção com nutracêuticos específicos para saúde articular."
  },
  
  // Pet 6 (mais exames com foco em parâmetros cardíacos)
  {
    id: "exm6_1",
    petId: "pet6",
    date: "2025-01-01",
    type: "Avaliação cardíaca",
    results: {
      "CK-MB": "180 U/L",
      "Troponina": "0.06 ng/mL",
      "BNP": "75 pg/mL",
      "Potássio": "4.3 mEq/L",
      "Sódio": "144 mEq/L",
      "Colesterol": "240 mg/dL",
      "Triglicerídeos": "95 mg/dL",
      "ALT": 36
    },
    notes: "Parâmetros cardíacos dentro da normalidade. Colesterol ligeiramente elevado."
  },
  {
    id: "exm6_2",
    petId: "pet6",
    date: "2025-02-15",
    type: "Avaliação cardíaca",
    results: {
      "CK-MB": "192 U/L",
      "Troponina": "0.09 ng/mL",
      "BNP": "95 pg/mL",
      "Potássio": "4.2 mEq/L",
      "Sódio": "145 mEq/L",
      "Colesterol": "255 mg/dL",
      "Triglicerídeos": "110 mg/dL",
      "ALT": 38
    },
    notes: "Elevação discreta nos marcadores cardíacos e lipídicos. Considerar intervenção preventiva."
  },
  {
    id: "exm6_3",
    petId: "pet6",
    date: "2025-03-15",
    type: "Avaliação cardíaca",
    results: {
      "CK-MB": "210 U/L",
      "Troponina": "0.12 ng/mL",
      "BNP": "125 pg/mL",
      "Potássio": "4.1 mEq/L",
      "Sódio": "146 mEq/L",
      "Colesterol": "268 mg/dL",
      "Triglicerídeos": "125 mg/dL",
      "ALT": 42
    },
    notes: "Tendência preocupante nos marcadores cardíacos, especialmente BNP e troponina. Perfil lipídico comprometido."
  },
  {
    id: "exm6_4",
    petId: "pet6",
    date: "2025-04-01", // Início do tratamento
    type: "Avaliação cardíaca",
    results: {
      "CK-MB": "225 U/L",
      "Troponina": "0.15 ng/mL",
      "BNP": "142 pg/mL",
      "Potássio": "4.0 mEq/L",
      "Sódio": "147 mEq/L",
      "Colesterol": "275 mg/dL",
      "Triglicerídeos": "135 mg/dL",
      "ALT": 45
    },
    notes: "Resultados indicam comprometimento da função cardíaca. Início de suplementação com CardioSupport. Repetir exames em 30 dias."
  },
  {
    id: "exm6_5",
    petId: "pet6",
    date: "2025-05-01",
    type: "Avaliação cardíaca",
    results: {
      "CK-MB": "205 U/L",
      "Troponina": "0.11 ng/mL",
      "BNP": "120 pg/mL",
      "Potássio": "4.2 mEq/L",
      "Sódio": "145 mEq/L",
      "Colesterol": "252 mg/dL",
      "Triglicerídeos": "118 mg/dL",
      "ALT": 40
    },
    notes: "Melhora discreta com 30 dias de tratamento. Todos os parâmetros em tendência favorável."
  },
  
  // Pet 7 (exames com foco em saúde oral)
  {
    id: "exm7_1",
    petId: "pet7",
    date: "2025-02-15",
    type: "Avaliação oral",
    results: {
      "pH Salivar": "7.8",
      "Cálcio Salivar": "6.2 mg/dL",
      "Proteínas Salivares": "2.8 g/L",
      "Leucócitos": "8500 /µL",
      "ALT": 32,
      "Creatinina": "0.9 mg/dL",
      "Glicose": "92 mg/dL"
    },
    notes: "pH salivar elevado, favorecendo formação de tártaro."
  },
  {
    id: "exm7_2",
    petId: "pet7",
    date: "2025-03-15", // Início do tratamento
    type: "Avaliação oral",
    results: {
      "pH Salivar": "8.0",
      "Cálcio Salivar": "6.5 mg/dL",
      "Proteínas Salivares": "2.6 g/L",
      "Leucócitos": "9200 /µL",
      "ALT": 34,
      "Creatinina": "0.9 mg/dL",
      "Glicose": "94 mg/dL"
    },
    notes: "Progressão de alterações salivares. Iniciado protocolo de suplementação para saúde oral."
  }
];
