import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  fieldErrors: Record<string, string[]>;
}

interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  initialValues?: Partial<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

export const useFormValidation = <T>({
  schema,
  initialValues = {},
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300,
}: UseFormValidationOptions<T>) => {
  const [values, setValues] = useState<Partial<T>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);

  // Debounced validation
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);

  const validateField = useCallback(
    (fieldName: string, value: any): string | null => {
      try {
        // Create a partial schema for single field validation
        const fieldSchema = (schema as any).shape?.[fieldName];
        if (fieldSchema) {
          fieldSchema.parse(value);
        }
        return null;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return error.errors[0]?.message || 'Campo inválido';
        }
        return 'Erro de validação';
      }
    },
    [schema]
  );

  const validateForm = useCallback(
    async (data: Partial<T>): Promise<ValidationResult> => {
      setIsValidating(true);
      
      try {
        await schema.parseAsync(data);
        setIsValidating(false);
        return {
          isValid: true,
          errors: {},
          fieldErrors: {},
        };
      } catch (error) {
        setIsValidating(false);
        
        if (error instanceof z.ZodError) {
          const formattedErrors: Record<string, string> = {};
          const fieldErrors: Record<string, string[]> = {};

          error.errors.forEach((err) => {
            const path = err.path.join('.');
            formattedErrors[path] = err.message;
            
            if (!fieldErrors[path]) {
              fieldErrors[path] = [];
            }
            fieldErrors[path].push(err.message);
          });

          return {
            isValid: false,
            errors: formattedErrors,
            fieldErrors,
          };
        }

        return {
          isValid: false,
          errors: { general: 'Erro de validação' },
          fieldErrors: {},
        };
      }
    },
    [schema]
  );

  const debouncedValidate = useCallback(
    (data: Partial<T>) => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }

      const timeout = setTimeout(async () => {
        const result = await validateForm(data);
        setErrors(result.errors);
      }, debounceMs);

      setValidationTimeout(timeout);
    },
    [validateForm, validationTimeout, debounceMs]
  );

  const setValue = useCallback(
    (fieldName: keyof T, value: any) => {
      const newValues = { ...values, [fieldName]: value };
      setValues(newValues);

      if (validateOnChange) {
        if (debounceMs > 0) {
          debouncedValidate(newValues);
        } else {
          const fieldError = validateField(String(fieldName), value);
          setErrors(prev => ({
            ...prev,
            [String(fieldName)]: fieldError || '',
          }));
        }
      }
    },
    [values, validateOnChange, validateField, debouncedValidate, debounceMs]
  );

  const setFieldTouched = useCallback(
    (fieldName: keyof T, isTouched = true) => {
      setTouched(prev => ({
        ...prev,
        [String(fieldName)]: isTouched,
      }));

      if (validateOnBlur && isTouched) {
        const value = values[fieldName];
        const fieldError = validateField(String(fieldName), value);
        setErrors(prev => ({
          ...prev,
          [String(fieldName)]: fieldError || '',
        }));
      }
    },
    [values, validateOnBlur, validateField]
  );

  const handleSubmit = useCallback(
    async (onSubmit: (data: T) => void | Promise<void>) => {
      // Mark all fields as touched
      const allTouched = Object.keys((schema as any)._def?.shape?.() || {}).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      );
      setTouched(allTouched);

      const result = await validateForm(values);
      setErrors(result.errors);

      if (result.isValid) {
        await onSubmit(values as T);
      }

      return result.isValid;
    },
    [values, validateForm, schema]
  );

  const reset = useCallback(
    (newValues: Partial<T> = initialValues) => {
      setValues(newValues);
      setErrors({});
      setTouched({});
      if (validationTimeout) {
        clearTimeout(validationTimeout);
        setValidationTimeout(null);
      }
    },
    [initialValues, validationTimeout]
  );

  const getFieldProps = useCallback(
    (fieldName: keyof T) => ({
      value: values[fieldName] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
        setValue(fieldName, e.target.value),
      onBlur: () => setFieldTouched(fieldName),
      error: touched[String(fieldName)] ? errors[String(fieldName)] : undefined,
      isInvalid: touched[String(fieldName)] && !!errors[String(fieldName)],
    }),
    [values, errors, touched, setValue, setFieldTouched]
  );

  const getSelectFieldProps = useCallback(
    (fieldName: keyof T) => ({
      value: values[fieldName] || '',
      onValueChange: (value: string) => setValue(fieldName, value),
      onBlur: () => setFieldTouched(fieldName),
      error: touched[String(fieldName)] ? errors[String(fieldName)] : undefined,
      isInvalid: touched[String(fieldName)] && !!errors[String(fieldName)],
    }),
    [values, errors, touched, setValue, setFieldTouched]
  );

  const isValid = useMemo(
    () => Object.keys(errors).length === 0 || Object.values(errors).every(error => !error),
    [errors]
  );

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialValues),
    [values, initialValues]
  );

  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    isValidating,
    setValue,
    setFieldTouched,
    validateForm,
    handleSubmit,
    reset,
    getFieldProps,
    getSelectFieldProps,
  };
};