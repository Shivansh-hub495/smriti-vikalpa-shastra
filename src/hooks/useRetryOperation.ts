/**
 * @fileoverview Hook for handling retry operations with exponential backoff
 * @description Provides retry functionality for failed operations with configurable strategies
 * @author Quiz Question Management System
 * @version 1.0.0
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { NetworkQuizError, getErrorHandler } from '@/lib/error-handling';

interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay between retries in milliseconds */
  initialDelay?: number;
  /** Whether to use exponential backoff */
  useExponentialBackoff?: boolean;
  /** Maximum delay between retries in milliseconds */
  maxDelay?: number;
  /** Function to determine if error is retryable */
  isRetryable?: (error: Error) => boolean;
  /** Callback when retry attempt is made */
  onRetry?: (attempt: number, error: Error) => void;
  /** Callback when all retries are exhausted */
  onMaxRetriesReached?: (error: Error) => void;
}

interface RetryState {
  isRetrying: boolean;
  currentAttempt: number;
  lastError: Error | null;
  totalAttempts: number;
}

/**
 * Hook for handling retry operations
 */
export const useRetryOperation = <T>(options: RetryOptions = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    useExponentialBackoff = true,
    maxDelay = 10000,
    isRetryable = (error) => error instanceof NetworkQuizError || error.message.includes('network'),
    onRetry,
    onMaxRetriesReached
  } = options;

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    currentAttempt: 0,
    lastError: null,
    totalAttempts: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const errorHandler = getErrorHandler();

  /**
   * Calculate delay for next retry attempt
   */
  const calculateDelay = useCallback((attempt: number): number => {
    if (!useExponentialBackoff) {
      return initialDelay;
    }

    const exponentialDelay = initialDelay * Math.pow(2, attempt - 1);
    return Math.min(exponentialDelay, maxDelay);
  }, [initialDelay, useExponentialBackoff, maxDelay]);

  /**
   * Execute operation with retry logic
   */
  const executeWithRetry = useCallback(async (
    operation: (signal?: AbortSignal) => Promise<T>,
    customOptions?: Partial<RetryOptions>
  ): Promise<T> => {
    const finalOptions = { ...options, ...customOptions };
    const finalMaxRetries = finalOptions.maxRetries || maxRetries;

    // Create abort controller for this operation
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setState(prev => ({
      ...prev,
      isRetrying: false,
      currentAttempt: 0,
      lastError: null,
      totalAttempts: 0
    }));

    let lastError: Error;

    for (let attempt = 1; attempt <= finalMaxRetries + 1; attempt++) {
      try {
        setState(prev => ({
          ...prev,
          currentAttempt: attempt,
          totalAttempts: prev.totalAttempts + 1,
          isRetrying: attempt > 1
        }));

        const result = await operation(signal);

        // Success - reset state
        setState(prev => ({
          ...prev,
          isRetrying: false,
          lastError: null
        }));

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        setState(prev => ({
          ...prev,
          lastError
        }));

        // Check if operation was aborted
        if (signal.aborted) {
          throw new Error('Operation was cancelled');
        }

        // Check if error is retryable
        if (!finalOptions.isRetryable?.(lastError) && !isRetryable(lastError)) {
          errorHandler.handleError(lastError, {
            customMessage: 'Operation failed and cannot be retried'
          });
          throw lastError;
        }

        // If this was the last attempt, don't retry
        if (attempt > finalMaxRetries) {
          break;
        }

        // Call retry callback
        if (finalOptions.onRetry || onRetry) {
          (finalOptions.onRetry || onRetry)?.(attempt, lastError);
        }

        // Show retry notification
        toast({
          title: `Attempt ${attempt} failed`,
          description: `Retrying in ${calculateDelay(attempt) / 1000} seconds...`,
          variant: "default"
        });

        // Wait before retry
        const delay = calculateDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Check if operation was aborted during delay
        if (signal.aborted) {
          throw new Error('Operation was cancelled');
        }
      }
    }

    // All retries exhausted
    setState(prev => ({
      ...prev,
      isRetrying: false
    }));

    if (finalOptions.onMaxRetriesReached || onMaxRetriesReached) {
      (finalOptions.onMaxRetriesReached || onMaxRetriesReached)?.(lastError);
    }

    errorHandler.handleError(lastError, {
      customMessage: `Operation failed after ${finalMaxRetries + 1} attempts`
    });

    throw lastError;
  }, [
    options,
    maxRetries,
    isRetryable,
    onRetry,
    onMaxRetriesReached,
    calculateDelay,
    errorHandler
  ]);

  /**
   * Cancel ongoing retry operation
   */
  const cancelRetry = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState(prev => ({
        ...prev,
        isRetrying: false
      }));
    }
  }, []);

  /**
   * Reset retry state
   */
  const resetRetryState = useCallback(() => {
    setState({
      isRetrying: false,
      currentAttempt: 0,
      lastError: null,
      totalAttempts: 0
    });
  }, []);

  /**
   * Get retry status text for UI
   */
  const getRetryStatusText = useCallback(() => {
    if (!state.isRetrying) return null;

    return `Retrying... (attempt ${state.currentAttempt} of ${maxRetries + 1})`;
  }, [state.isRetrying, state.currentAttempt, maxRetries]);

  return {
    // State
    isRetrying: state.isRetrying,
    currentAttempt: state.currentAttempt,
    lastError: state.lastError,
    totalAttempts: state.totalAttempts,
    
    // Methods
    executeWithRetry,
    cancelRetry,
    resetRetryState,
    getRetryStatusText
  };
};

/**
 * Hook for retrying specific operations with predefined configurations
 */
export const useQuestionSaveRetry = () => {
  return useRetryOperation({
    maxRetries: 3,
    initialDelay: 1000,
    useExponentialBackoff: true,
    isRetryable: (error) => {
      // Retry on network errors, timeout errors, and server errors
      return (
        error instanceof NetworkQuizError ||
        error.message.includes('network') ||
        error.message.includes('timeout') ||
        error.message.includes('500') ||
        error.message.includes('502') ||
        error.message.includes('503')
      );
    },
    onRetry: (attempt, error) => {
      console.log(`Retrying question save operation (attempt ${attempt}):`, error.message);
    },
    onMaxRetriesReached: (error) => {
      toast({
        title: "Save Failed",
        description: "Unable to save question after multiple attempts. Please check your connection and try again.",
        variant: "destructive"
      });
    }
  });
};

/**
 * Hook for retrying data loading operations
 */
export const useDataLoadRetry = () => {
  return useRetryOperation({
    maxRetries: 2,
    initialDelay: 500,
    useExponentialBackoff: false,
    isRetryable: (error) => {
      // Retry on network errors and loading failures
      return (
        error instanceof NetworkQuizError ||
        error.message.includes('network') ||
        error.message.includes('fetch') ||
        error.message.includes('load')
      );
    },
    onRetry: (attempt, error) => {
      console.log(`Retrying data load operation (attempt ${attempt}):`, error.message);
    }
  });
};

/**
 * Utility function to create a retryable operation
 */
export const createRetryableOperation = <T>(
  operation: () => Promise<T>,
  options?: RetryOptions
) => {
  const { executeWithRetry } = useRetryOperation(options);
  
  return () => executeWithRetry(operation);
};

/**
 * Higher-order function to wrap any async function with retry logic
 */
export const withRetry = <TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options?: RetryOptions
) => {
  return async (...args: TArgs): Promise<TReturn> => {
    const { executeWithRetry } = useRetryOperation(options);
    return executeWithRetry(() => fn(...args));
  };
};