
import { pets, owners } from "./index";
import { examResults } from "./examResults";
import { nutraceuticals } from "./nutraceuticals";
import { recommendations } from "./recommendations";
import { treatmentPlans } from "./treatmentPlans";

// Função para gerar dados aleatórios de exemplo
export const generateRandomData = () => {
  alert("Dados de exemplo gerados com sucesso!");
  return {
    pets,
    owners,
    examResults,
    nutraceuticals,
    recommendations,
    treatmentPlans
  };
};
