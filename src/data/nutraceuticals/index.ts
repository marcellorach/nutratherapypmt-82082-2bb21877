
import { Nutraceutical } from "../../types";
import { omega3Nutraceuticals } from "./omega3";
import { jointHealthNutraceuticals } from "./joint-health";
import { immuneSupportNutraceuticals } from "./immune-support";
import { cardiacNutraceuticals } from "./cardiac";
import { hepaticNutraceuticals } from "./hepatic";
import { experimentalNutraceuticals } from "./experimental";

export const nutraceuticals: Nutraceutical[] = [
  ...omega3Nutraceuticals,
  ...jointHealthNutraceuticals,
  ...immuneSupportNutraceuticals,
  ...cardiacNutraceuticals,
  ...hepaticNutraceuticals,
  ...experimentalNutraceuticals
];
