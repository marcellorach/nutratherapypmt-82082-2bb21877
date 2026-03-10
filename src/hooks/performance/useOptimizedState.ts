import { useCallback, useMemo, useRef, useState } from 'react';

/**
 * Hook otimizado para estados complexos com debounce e memoização
 */
export const useOptimizedState = <T>(
  initialValue: T,
  options: {
    debounceMs?: number;
    compareFunction?: (prev: T, next: T) => boolean;
  } = {}
) => {
  const { debounceMs = 0, compareFunction } = options;
  const [state, setState] = useState<T>(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const prevValueRef = useRef<T>(initialValue);

  const optimizedSetState = useCallback((newValue: T | ((prev: T) => T)) => {
    const nextValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(prevValueRef.current)
      : newValue;

    // Verificar se o valor realmente mudou
    const hasChanged = compareFunction 
      ? !compareFunction(prevValueRef.current, nextValue)
      : prevValueRef.current !== nextValue;

    if (!hasChanged) return;

    if (debounceMs > 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        prevValueRef.current = nextValue;
        setState(nextValue);
      }, debounceMs);
    } else {
      prevValueRef.current = nextValue;
      setState(nextValue);
    }
  }, [debounceMs, compareFunction]);

  const memoizedState = useMemo(() => state, [state]);

  return [memoizedState, optimizedSetState] as const;
};

/**
 * Hook para gerenciar múltiplos estados com otimização
 */
export const useOptimizedMultiState = <T extends Record<string, any>>(
  initialState: T,
  debounceMs: number = 300
) => {
  const [state, setState] = useOptimizedState(initialState, { debounceMs });

  const updateField = useCallback((field: keyof T, value: T[keyof T]) => {
    setState(prev => ({ ...prev, [field]: value }));
  }, [setState]);

  const updateMultipleFields = useCallback((updates: Partial<T>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, [setState]);

  const resetState = useCallback(() => {
    setState(initialState);
  }, [setState, initialState]);

  return {
    state,
    setState,
    updateField,
    updateMultipleFields,
    resetState,
  };
};