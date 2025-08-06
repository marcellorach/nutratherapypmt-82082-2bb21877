// Export all validation schemas and utilities
export * from './schemas';

// Export validation utilities
export { useFormValidation } from '@/hooks/validation/useFormValidation';

// Common validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  cep: /^\d{5}-\d{3}$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphabetic: /^[a-zA-ZÀ-ÿ\s]+$/,
  numeric: /^\d+$/,
  decimal: /^\d+(\.\d{1,2})?$/,
} as const;

// Validation message templates
export const VALIDATION_MESSAGES = {
  required: (field: string) => `${field} é obrigatório`,
  email: 'Email inválido',
  minLength: (field: string, min: number) => `${field} deve ter pelo menos ${min} caracteres`,
  maxLength: (field: string, max: number) => `${field} deve ter no máximo ${max} caracteres`,
  min: (field: string, min: number) => `${field} deve ser maior que ${min}`,
  max: (field: string, max: number) => `${field} deve ser menor que ${max}`,
  pattern: (field: string) => `Formato de ${field} inválido`,
  passwordStrength: 'Senha deve conter ao menos: 8 caracteres, 1 maiúscula, 1 minúscula, 1 número',
  confirmPassword: 'Confirmação de senha não confere',
  fileSize: (maxSize: string) => `Arquivo deve ter no máximo ${maxSize}`,
  fileType: (types: string) => `Tipos permitidos: ${types}`,
} as const;