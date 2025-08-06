import { useCallback, useState } from 'react';
import { useNotifications } from '@/components/feedback/NotificationSystem';

export interface AppError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  context?: Record<string, any>;
  stack?: string;
  userId?: string;
  action?: string;
}

interface UseErrorHandlerOptions {
  enableLogging?: boolean;
  enableNotifications?: boolean;
  defaultSeverity?: AppError['severity'];
  onError?: (error: AppError) => void;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const {
    enableLogging = true,
    enableNotifications = true,
    defaultSeverity = 'medium',
    onError,
  } = options;

  const { addNotification } = useNotifications();
  const [errors, setErrors] = useState<AppError[]>([]);

  const createError = useCallback(
    (
      error: Error | string,
      context?: {
        code?: string;
        severity?: AppError['severity'];
        context?: Record<string, any>;
        action?: string;
      }
    ): AppError => {
      const isErrorObject = error instanceof Error;
      const message = isErrorObject ? error.message : error;
      const stack = isErrorObject ? error.stack : undefined;

      return {
        code: context?.code || 'GENERIC_ERROR',
        message,
        severity: context?.severity || defaultSeverity,
        timestamp: new Date(),
        context: context?.context,
        stack,
        action: context?.action,
      };
    },
    [defaultSeverity]
  );

  const logError = useCallback((appError: AppError) => {
    if (!enableLogging) return;

    // Log to console based on severity
    const logMethod = {
      low: console.info,
      medium: console.warn,
      high: console.error,
      critical: console.error,
    }[appError.severity];

    logMethod('Application Error:', {
      code: appError.code,
      message: appError.message,
      severity: appError.severity,
      timestamp: appError.timestamp,
      context: appError.context,
      action: appError.action,
      stack: appError.stack,
    });

    // In production, you would send this to your error reporting service
    // Example: Sentry.captureException(appError);
  }, [enableLogging]);

  const showErrorNotification = useCallback(
    (appError: AppError) => {
      if (!enableNotifications) return;

      const notificationMessage = getUserFriendlyMessage(appError);

      switch (appError.severity) {
        case 'low':
        case 'medium':
          addNotification({
            type: 'warning',
            title: notificationMessage,
            duration: 5000,
          });
          break;
        case 'high':
        case 'critical':
          addNotification({
            type: 'error',
            title: notificationMessage,
            duration: 7000,
          });
          break;
      }
    },
    [enableNotifications, addNotification]
  );

  const handleError = useCallback(
    (
      error: Error | string,
      context?: {
        code?: string;
        severity?: AppError['severity'];
        context?: Record<string, any>;
        action?: string;
        showNotification?: boolean;
      }
    ) => {
      const appError = createError(error, context);

      // Store error
      setErrors(prev => [appError, ...prev.slice(0, 99)]); // Keep last 100 errors

      // Log error
      logError(appError);

      // Show notification
      if (context?.showNotification !== false) {
        showErrorNotification(appError);
      }

      // Call custom error handler
      onError?.(appError);

      return appError;
    },
    [createError, logError, showErrorNotification, onError]
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const removeError = useCallback((timestamp: Date) => {
    setErrors(prev => prev.filter(error => error.timestamp !== timestamp));
  }, []);

  // Predefined error handlers for common scenarios
  const handleApiError = useCallback(
    (error: any, action: string) => {
      const severity: AppError['severity'] = 
        error.status >= 500 ? 'high' : 
        error.status >= 400 ? 'medium' : 'low';

      return handleError(error.message || 'Erro na API', {
        code: `API_ERROR_${error.status || 'UNKNOWN'}`,
        severity,
        context: {
          status: error.status,
          url: error.url,
          method: error.method,
        },
        action,
      });
    },
    [handleError]
  );

  const handleValidationError = useCallback(
    (errors: Record<string, string>, action: string) => {
      const errorMessage = Object.values(errors).join(', ');
      return handleError(errorMessage, {
        code: 'VALIDATION_ERROR',
        severity: 'low',
        context: { validationErrors: errors },
        action,
      });
    },
    [handleError]
  );

  const handleNetworkError = useCallback(
    (error: Error, action: string) => {
      return handleError(error, {
        code: 'NETWORK_ERROR',
        severity: 'high',
        action,
        context: {
          online: navigator.onLine,
          userAgent: navigator.userAgent,
        },
      });
    },
    [handleError]
  );

  const handleAuthenticationError = useCallback(
    (error: Error | string, action: string) => {
      return handleError(error, {
        code: 'AUTH_ERROR',
        severity: 'high',
        action,
        showNotification: true,
      });
    },
    [handleError]
  );

  return {
    errors,
    handleError,
    handleApiError,
    handleValidationError,
    handleNetworkError,
    handleAuthenticationError,
    clearErrors,
    removeError,
  };
};

// Helper function to convert technical errors to user-friendly messages
const getUserFriendlyMessage = (error: AppError): string => {
  const errorMessages: Record<string, string> = {
    NETWORK_ERROR: 'Problema de conexão. Verifique sua internet.',
    API_ERROR_500: 'Erro interno do servidor. Tente novamente em alguns minutos.',
    API_ERROR_404: 'Recurso não encontrado.',
    API_ERROR_403: 'Acesso negado. Verifique suas permissões.',
    API_ERROR_401: 'Sessão expirada. Faça login novamente.',
    AUTH_ERROR: 'Erro de autenticação. Faça login novamente.',
    VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
    GENERIC_ERROR: 'Ocorreu um erro inesperado.',
  };

  return errorMessages[error.code] || error.message || 'Erro desconhecido';
};

// Hook for retry logic
export const useRetry = (maxAttempts: number = 3, delay: number = 1000) => {
  const [attempts, setAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      setIsRetrying(true);
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          setAttempts(attempt + 1);
          const result = await fn();
          setIsRetrying(false);
          setAttempts(0);
          return result;
        } catch (error) {
          lastError = error as Error;
          
          if (attempt < maxAttempts - 1) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => 
              setTimeout(resolve, delay * Math.pow(2, attempt))
            );
          }
        }
      }

      setIsRetrying(false);
      setAttempts(0);
      throw lastError;
    },
    [maxAttempts, delay]
  );

  const reset = useCallback(() => {
    setAttempts(0);
    setIsRetrying(false);
  }, []);

  return {
    retry,
    attempts,
    isRetrying,
    reset,
  };
};