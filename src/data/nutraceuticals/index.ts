
import { Nutraceutical } from "../../types";
import { omega3Nutraceuticals } from "./omega3";
import { jointHealthNutraceuticals } from "./joint-health";
import { immuneSupportNutraceuticals } from "./immune-support";
import { cardiacNutraceuticals } from "./cardiac";
import { hepaticNutraceuticals } from "./hepatic";
import { experimentalNutraceuticals } from "./experimental";
import { longevityNutraceuticals } from "./longevity";
import { renalNutraceuticals } from "./renal";
import { antioxidantNutraceuticals } from "./antioxidants";
import { plantCompoundNutraceuticals } from "./plant-compounds";
import { immuneModulatorNutraceuticals } from "./immune-modulators";

export const nutraceuticals: Nutraceutical[] = [
  ...omega3Nutraceuticals,
  ...jointHealthNutraceuticals,
  ...immuneSupportNutraceuticals,
  ...cardiacNutraceuticals,
  ...hepaticNutraceuticals,
  ...experimentalNutraceuticals,
  ...longevityNutraceuticals,
  ...renalNutraceuticals,
  ...antioxidantNutraceuticals,
  ...plantCompoundNutraceuticals,
  ...immuneModulatorNutraceuticals
];
