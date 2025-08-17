/**
 * @fileoverview Enhanced error handling hook for question management
 * @description Provides comprehensive error handling, retry logic, and recovery mechanisms
 * @author Quiz Question Management System
 * @version 1.0.0
 */

import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  EnhancedQuizError, 
  NetworkQuizError, 
  ValidationQuizError,
  getErrorHandler 
} from '@/lib/error-handling';
import type { QuestionFormData } from '@/types/quiz';

interface RetryOperation {
  id: string;
  operation: () => Promise<any>;
  description: string;
  maxRetries: number;
  currentRetry: number;
  lastError?: Error;
}

interface ErrorRecoveryState {
  hasError: boolean;
  error?: EnhancedQuizError;
  isRecovering: boolean;
  recoveryData?: any;
  canRetry: boolean;
  retryCount: number;
  maxRetries: number;
}

interface UseQuestionErrorHandlingOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Whether to auto-save form data on errors */
  enableAutoSave?: boolean;
  /** Auto-save key for localStorage */
  autoSaveKey?: string;
  /** Custom error recovery callback */
  onErrorRecovery?: (error: EnhancedQuizError, recoveryData?: any) => void;
}

/**
 * Enhanced error handling hook for question management operations
 */
export const useQuestionErrorHandling = (options: UseQuestionErrorHandlingOptions = {}) => {
  const {
    maxRetries = 3,
    enableAutoSave = true,
    autoSaveKey,
    onErrorRecovery
  } = options;

  const { toast } = useToast();
  const errorHandler = getErrorHandler();
  
  const [errorState, setErrorState] = useState<ErrorRecoveryState>({
    hasError: false,
    isRecovering: false,
    canRetry: false,
    retryCount: 0,
    maxRetries
  });

  const [retryOperations, setRetryOperations] = useState<Map<string, RetryOperation>>(new Map());
  const operationIdCounter = useRef(0);

  /**
   * Handle errors with comprehensive recovery options
   */
  const handleError = useCallback((
    error: Error,
    context?: {
      operation?: string;
      formData?: QuestionFormData;
      canRetry?: boolean;
      customMessage?: string;
    }
  ) => {
    const enhancedError = error instanceof EnhancedQuizError 
      ? error 
      : new EnhancedQuizError(
          error.message || 'An unexpected error occurred',
          'QUESTION_ERROR',
          'system',
          'medium',
          { originalError: error, context }
        );

    // Auto-save form data if enabled and available
    if (enableAutoSave && autoSaveKey && context?.formData) {
      try {
        localStorage.setItem(autoSaveKey, JSON.stringify({
          data: context.formData,
          timestamp: Date.now(),
          error: enhancedError.message
        }));
      } catch (saveError) {
        console.warn('Failed to auto-save form data:', saveError);
      }
    }

    // Update error state
    setErrorState(prev => ({
      ...prev,
      hasError: true,
      error: enhancedError,
      canRetry: context?.canRetry ?? (enhancedError instanceof NetworkQuizError),
      recoveryData: context?.formData
    }));

    // Show user-friendly error message
    const userMessage = context?.customMessage || getUserFriendlyErrorMessage(enhancedError);
    
    toast({
      title: getErrorTitle(enhancedError),
      description: userMessage,
      variant: enhancedError.severity === 'high' || enhancedError.severity === 'critical' 
        ? 'destructive' 
        : 'default',
      duration: enhancedError.severity === 'critical' ? 0 : 5000, // Critical errors don't auto-dismiss
      action: enhancedError.recoveryActions ? {
        altText: "Show recovery options",
        onClick: () => showRecoveryOptions(enhancedError)
      } : undefined
    });

    // Log error for debugging
    errorHandler.handleError(enhancedError, {
      showToast: false, // We handle toast above
      logToConsole: true,
      reportErrors: true
    });

    return enhancedError;
  }, [enableAutoSave, autoSaveKey, toast, errorHandler]);

  /**
   * Execute operation with retry logic and error handling
   */
  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      description: string;
      formData?: QuestionFormData;
      customErrorMessage?: string;
      onSuccess?: (result: T) => void;
      onFailure?: (error: EnhancedQuizError) => void;
    }
  ): Promise<T | null> => {
    const operationId = `op_${++operationIdCounter.current}`;
    
    const retryOp: RetryOperation = {
      id: operationId,
      operation,
      description: options.description,
      maxRetries,
      currentRetry: 0
    };

    setRetryOperations(prev => new Map(prev).set(operationId, retryOp));

    const attemptOperation = async (attemptNumber: number): Promise<T | null> => {
      try {
        setErrorState(prev => ({ ...prev, isRecovering: attemptNumber > 0 }));
        
        const result = await operation();
        
        // Success - clear error state and retry operations
        setErrorState({
          hasError: false,
          isRecovering: false,
          canRetry: false,
          retryCount: 0,
          maxRetries
        });
        
        setRetryOperations(prev => {
          const newMap = new Map(prev);
          newMap.delete(operationId);
          return newMap;
        });

        options.onSuccess?.(result);
        
        if (attemptNumber > 0) {
          toast({
            title: "Operation Successful",
            description: `${options.description} completed successfully after ${attemptNumber} ${attemptNumber === 1 ? 'retry' : 'retries'}.`,
            variant: "default"
          });
        }

        return result;
      } catch (error) {
        const enhancedError = handleError(error as Error, {
          operation: options.description,
          formData: options.formData,
          canRetry: attemptNumber < maxRetries,
          customMessage: options.customErrorMessage
        });

        // Update retry operation
        retryOp.currentRetry = attemptNumber;
        retryOp.lastError = error as Error;
        setRetryOperations(prev => new Map(prev).set(operationId, retryOp));

        if (attemptNumber < maxRetries) {
          // Wait before retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attemptNumber), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return attemptOperation(attemptNumber + 1);
        } else {
          // Max retries reached
          setErrorState(prev => ({
            ...prev,
            retryCount: attemptNumber,
            canRetry: false
          }));

          options.onFailure?.(enhancedError);
          
          toast({
            title: "Operation Failed",
            description: `${options.description} failed after ${maxRetries} attempts. Your data has been preserved.`,
            variant: "destructive",
            duration: 0, // Don't auto-dismiss
            action: {
              altText: "Try again",
              onClick: () => retryOperation(operationId)
            }
          });

          return null;
        }
      }
    };

    return attemptOperation(0);
  }, [maxRetries, handleError, toast]);

  /**
   * Retry a failed operation
   */
  const retryOperation = useCallback(async (operationId: string) => {
    const operation = retryOperations.get(operationId);
    if (!operation) return;

    // Reset retry count and attempt again
    const newOperation = { ...operation, currentRetry: 0 };
    setRetryOperations(prev => new Map(prev).set(operationId, newOperation));

    try {
      const result = await operation.operation();
      
      // Success
      setRetryOperations(prev => {
        const newMap = new Map(prev);
        newMap.delete(operationId);
        return newMap;
      });

      setErrorState({
        hasError: false,
        isRecovering: false,
        canRetry: false,
        retryCount: 0,
        maxRetries
      });

      toast({
        title: "Retry Successful",
        description: `${operation.description} completed successfully.`,
        variant: "default"
      });

      return result;
    } catch (error) {
      handleError(error as Error, {
        operation: operation.description,
        canRetry: true
      });
    }
  }, [retryOperations, handleError, toast, maxRetries]);

  /**
   * Recover from error using saved data
   */
  const recoverFromError = useCallback((recoveryData?: any) => {
    if (errorState.error && onErrorRecovery) {
      onErrorRecovery(errorState.error, recoveryData || errorState.recoveryData);
    }

    setErrorState({
      hasError: false,
      isRecovering: false,
      canRetry: false,
      retryCount: 0,
      maxRetries
    });

    toast({
      title: "Recovery Initiated",
      description: "Attempting to recover your work...",
      variant: "default"
    });
  }, [errorState, onErrorRecovery, toast, maxRetries]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      isRecovering: false,
      canRetry: false,
      retryCount: 0,
      maxRetries
    });
    setRetryOperations(new Map());
  }, [maxRetries]);

  /**
   * Load recovery data from localStorage
   */
  const loadRecoveryData = useCallback((): QuestionFormData | null => {
    if (!autoSaveKey) return null;

    try {
      const saved = localStorage.getItem(autoSaveKey);
      if (!saved) return null;

      const parsed = JSON.parse(saved);
      
      // Check if data is not too old (1 hour)
      const maxAge = 60 * 60 * 1000; // 1 hour
      if (Date.now() - parsed.timestamp > maxAge) {
        localStorage.removeItem(autoSaveKey);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.warn('Failed to load recovery data:', error);
      return null;
    }
  }, [autoSaveKey]);

  /**
   * Clear recovery data
   */
  const clearRecoveryData = useCallback(() => {
    if (autoSaveKey) {
      localStorage.removeItem(autoSaveKey);
    }
  }, [autoSaveKey]);

  return {
    // Error state
    ...errorState,
    
    // Error handling functions
    handleError,
    executeWithRetry,
    retryOperation,
    recoverFromError,
    clearError,
    
    // Recovery data functions
    loadRecoveryData,
    clearRecoveryData,
    
    // Utility functions
    hasRecoveryData: useCallback(() => {
      return autoSaveKey ? !!localStorage.getItem(autoSaveKey) : false;
    }, [autoSaveKey]),
    
    // Active operations
    activeOperations: Array.from(retryOperations.values())
  };
};

/**
 * Get user-friendly error message
 */
function getUserFriendlyErrorMessage(error: EnhancedQuizError): string {
  switch (error.category) {
    case 'network':
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    case 'validation':
      return error.message; // Validation messages are already user-friendly
    case 'permission':
      return 'You don\'t have permission to perform this action.';
    case 'data':
      return 'There was an issue with the data. Please check your input and try again.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Get error title based on severity
 */
function getErrorTitle(error: EnhancedQuizError): string {
  switch (error.severity) {
    case 'critical':
      return 'Critical Error';
    case 'high':
      return 'Error';
    case 'medium':
      return 'Warning';
    case 'low':
      return 'Notice';
    default:
      return 'Error';
  }
}

/**
 * Show recovery options to user
 */
function showRecoveryOptions(error: EnhancedQuizError): void {
  if (error.recoveryActions && error.recoveryActions.length > 0) {
    // This could be enhanced with a modal or detailed recovery UI
    alert(`Recovery suggestions:\n\n${error.recoveryActions.map(action => `• ${action}`).join('\n')}`);
  }
}

export default useQuestionErrorHandling;