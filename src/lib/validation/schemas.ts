import { z } from 'zod';

// Base schemas
export const emailSchema = z
  .string()
  .email('Email inválido')
  .min(1, 'Email é obrigatório');

export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número');

export const nameSchema = z
  .string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(50, 'Nome deve ter no máximo 50 caracteres')
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços');

export const phoneSchema = z
  .string()
  .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato: (11) 99999-9999')
  .optional();

// Pet schemas
export const petNameSchema = z
  .string()
  .min(1, 'Nome do pet é obrigatório')
  .max(30, 'Nome deve ter no máximo 30 caracteres');

export const petBreedSchema = z
  .string()
  .min(1, 'Raça é obrigatória');

export const petAgeSchema = z
  .number()
  .min(0, 'Idade deve ser positiva')
  .max(30, 'Idade máxima é 30 anos');

export const petWeightSchema = z
  .number()
  .min(0.1, 'Peso deve ser maior que 0')
  .max(100, 'Peso máximo é 100kg');

export const petSchema = z.object({
  name: petNameSchema,
  breed: petBreedSchema,
  age: petAgeSchema,
  weight: petWeightSchema,
  gender: z.enum(['macho', 'fêmea'], {
    errorMap: () => ({ message: 'Selecione o sexo do pet' }),
  }),
  spayed: z.boolean().optional(),
  microchip: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  healthConditions: z.array(z.string()).optional(),
});

// User schemas
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Você deve aceitar os termos de uso',
  }),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const profileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional(),
  avatar: z.string().url('URL do avatar inválida').optional(),
});

// Nutraceutical schemas
export const nutraceuticalNameSchema = z
  .string()
  .min(1, 'Nome é obrigatório')
  .max(100, 'Nome deve ter no máximo 100 caracteres');

export const dosageSchema = z
  .number()
  .min(0.001, 'Dosagem deve ser maior que 0')
  .max(10000, 'Dosagem muito alta');

export const concentrationSchema = z
  .number()
  .min(0.1, 'Concentração deve ser maior que 0')
  .max(100, 'Concentração máxima é 100%');

export const efficacyScoreSchema = z
  .number()
  .min(0, 'Score mínimo é 0')
  .max(5, 'Score máximo é 5');

export const nutraceuticalSchema = z.object({
  name: nutraceuticalNameSchema,
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  activeIngredients: z.array(z.object({
    name: z.string().min(1, 'Nome do ingrediente é obrigatório'),
    concentration: concentrationSchema,
    unit: z.string().min(1, 'Unidade é obrigatória'),
  })).min(1, 'Pelo menos um ingrediente ativo é obrigatório'),
  dosage: z.object({
    amount: dosageSchema,
    unit: z.string().min(1, 'Unidade da dosagem é obrigatória'),
    frequency: z.string().min(1, 'Frequência é obrigatória'),
  }),
  contraindications: z.array(z.string()).optional(),
  sideEffects: z.array(z.string()).optional(),
  interactions: z.array(z.string()).optional(),
  storageConditions: z.string().optional(),
  manufacturerInfo: z.object({
    name: z.string().min(1, 'Nome do fabricante é obrigatório'),
    country: z.string().min(1, 'País é obrigatório'),
    certifications: z.array(z.string()).optional(),
  }),
});

// Condition schemas
export const conditionSchema = z.object({
  name: z.string().min(1, 'Nome da condição é obrigatório'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  severity: z.enum(['leve', 'moderada', 'grave'], {
    errorMap: () => ({ message: 'Selecione a severidade' }),
  }),
  prevalence: z.number().min(0).max(100).optional(),
  symptoms: z.array(z.string()).optional(),
  riskFactors: z.array(z.string()).optional(),
});

// Study schemas
export const studySchema = z.object({
  title: z.string().min(10, 'Título deve ter pelo menos 10 caracteres'),
  authors: z.array(z.string()).min(1, 'Pelo menos um autor é obrigatório'),
  journal: z.string().min(1, 'Journal é obrigatório'),
  year: z.number().min(1900).max(new Date().getFullYear()),
  doi: z.string().optional(),
  pmid: z.string().optional(),
  abstract: z.string().min(50, 'Resumo deve ter pelo menos 50 caracteres'),
  methodology: z.string().min(10, 'Metodologia é obrigatória'),
  sampleSize: z.number().min(1, 'Tamanho da amostra deve ser maior que 0'),
  duration: z.string().min(1, 'Duração é obrigatória'),
  results: z.string().min(10, 'Resultados são obrigatórios'),
  conclusions: z.string().min(10, 'Conclusões são obrigatórias'),
  evidenceLevel: z.enum(['1', '2', '3', '4', '5'], {
    errorMap: () => ({ message: 'Selecione o nível de evidência' }),
  }),
  qualityScore: efficacyScoreSchema,
});

// Relationship schemas
export const nutraceuticalConditionRelationSchema = z.object({
  nutraceuticalId: z.string().min(1, 'Nutracêutico é obrigatório'),
  conditionId: z.string().min(1, 'Condição é obrigatória'),
  relationshipType: z.enum(['prevention', 'treatment', 'support'], {
    errorMap: () => ({ message: 'Tipo de relação é obrigatório' }),
  }),
  efficacyScore: efficacyScoreSchema,
  notes: z.string().optional(),
});

export const studyNutraceuticalRelationSchema = z.object({
  studyId: z.string().min(1, 'Estudo é obrigatório'),
  nutraceuticalId: z.string().min(1, 'Nutracêutico é obrigatório'),
  relevanceScore: efficacyScoreSchema,
  notes: z.string().optional(),
});

// Form validation helpers
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type PetFormData = z.infer<typeof petSchema>;
export type NutraceuticalFormData = z.infer<typeof nutraceuticalSchema>;
export type ConditionFormData = z.infer<typeof conditionSchema>;
export type StudyFormData = z.infer<typeof studySchema>;
export type NutraceuticalConditionRelationFormData = z.infer<typeof nutraceuticalConditionRelationSchema>;
export type StudyNutraceuticalRelationFormData = z.infer<typeof studyNutraceuticalRelationSchema>;

// Custom validation functions
export const validateFileSize = (file: File, maxSizeMB: number = 5) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

export const validateFileType = (file: File, allowedTypes: string[]) => {
  return allowedTypes.includes(file.type);
};

export const validateImageFile = (file: File) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return validateFileType(file, allowedTypes) && validateFileSize(file, 5);
};

export const validateDocumentFile = (file: File) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  return validateFileType(file, allowedTypes) && validateFileSize(file, 10);
};