
import { ExamResult } from "../types";

// Mock Exam Results
export const examResults: ExamResult[] = [
  {
    id: "exm1",
    petId: "pet1",
    date: "2025-03-15",
    type: "Sangue",
    results: {
      hemoglobina: 14.5,
      leucócitos: 8500,
      plaquetas: 250000,
      vitamina_d: 25.3,
      cálcio: 8.9,
    },
    notes: "Níveis ligeiramente baixos de vitamina D."
  },
  {
    id: "exm2",
    petId: "pet2",
    date: "2025-04-01",
    type: "Sangue",
    results: {
      hemoglobina: 13.8,
      leucócitos: 9200,
      plaquetas: 200000,
      vitamina_d: 32.0,
      cálcio: 9.5,
    },
    notes: "Resultados normais."
  }
];
