/**
 * @fileoverview Network Retry Utilities for Quiz System
 * @description Robust network error handling with exponential backoff and retry logic
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import { NetworkQuizError, getErrorHandler } from '@/lib/error-handling';
import { toast } from '@/hooks/use-toast';

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Backoff multiplier */
  backoffMultiplier?: number;
  /** Whether to use exponential backoff */
  exponentialBackoff?: boolean;
  /** Custom retry condition function */
  shouldRetry?: (error: Error, attempt: number) => boolean;
  /** Callback for each retry attempt */
  onRetry?: (error: Error, attempt: number) => void;
  /** Callback when all retries are exhausted */
  onMaxRetriesReached?: (error: Error) => void;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  exponentialBackoff: true,
  shouldRetry: (error: Error, attempt: number) => {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return true;
    }
    
    // Check for HTTP status codes that should be retried
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    const statusMatch = error.message.match(/status (\d+)/);
    if (statusMatch) {
      const status = parseInt(statusMatch[1]);
      return retryableStatuses.includes(status);
    }
    
    return false;
  },
  onRetry: () => {},
  onMaxRetriesReached: () => {}
};

/**
 * Network operation result
 */
export type NetworkResult<T> = {
  success: true;
  data: T;
  attempts: number;
} | {
  success: false;
  error: NetworkQuizError;
  attempts: number;
};

/**
 * Enhanced retry utility with comprehensive error handling
 */
export class NetworkRetryManager {
  private static instance: NetworkRetryManager;
  private activeRequests = new Map<string, AbortController>();
  private requestStats = new Map<string, { attempts: number; lastAttempt: Date }>();

  private constructor() {}

  public static getInstance(): NetworkRetryManager {
    if (!NetworkRetryManager.instance) {
      NetworkRetryManager.instance = new NetworkRetryManager();
    }
    return NetworkRetryManager.instance;
  }

  /**
   * Execute operation with retry logic
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = {},
    operationId?: string
  ): Promise<NetworkResult<T>> {
    const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error;
    let attempts = 0;

    // Cancel any existing request with the same ID
    if (operationId && this.activeRequests.has(operationId)) {
      this.activeRequests.get(operationId)?.abort();
    }

    // Create abort controller for this request
    const abortController = new AbortController();
    if (operationId) {
      this.activeRequests.set(operationId, abortController);
    }

    try {
      while (attempts <= finalConfig.maxRetries) {
        attempts++;

        try {
          // Check if operation was cancelled
          if (abortController.signal.aborted) {
            throw new Error('Operation cancelled');
          }

          const result = await operation();
          
          // Success - clean up and return
          if (operationId) {
            this.activeRequests.delete(operationId);
            this.updateRequestStats(operationId, attempts);
          }

          return {
            success: true,
            data: result,
            attempts
          };

        } catch (error) {
          lastError = error as Error;

          // Don't retry if this is the last attempt
          if (attempts > finalConfig.maxRetries) {
            break;
          }

          // Check if we should retry this error
          if (!finalConfig.shouldRetry(lastError, attempts)) {
            break;
          }

          // Calculate delay for next attempt
          const delay = this.calculateDelay(
            attempts,
            finalConfig.initialDelay,
            finalConfig.maxDelay,
            finalConfig.backoffMultiplier,
            finalConfig.exponentialBackoff
          );

          // Notify about retry attempt
          finalConfig.onRetry(lastError, attempts);
          
          // Show user-friendly retry notification
          if (attempts === 1) {
            toast({
              title: "Connection Issue",
              description: "Retrying operation...",
              variant: "default"
            });
          }

          // Wait before retry
          await this.delay(delay);
        }
      }

      // All retries exhausted
      const networkError = new NetworkQuizError(
        `Operation failed after ${attempts} attempts: ${lastError.message}`,
        'MAX_RETRIES_EXCEEDED',
        { originalError: lastError, attempts },
        finalConfig.maxRetries
      );

      finalConfig.onMaxRetriesReached(networkError);

      // Clean up
      if (operationId) {
        this.activeRequests.delete(operationId);
        this.updateRequestStats(operationId, attempts);
      }

      return {
        success: false,
        error: networkError,
        attempts
      };

    } catch (error) {
      // Unexpected error in retry logic
      const networkError = new NetworkQuizError(
        `Retry logic error: ${(error as Error).message}`,
        'RETRY_LOGIC_ERROR',
        { originalError: error, attempts }
      );

      if (operationId) {
        this.activeRequests.delete(operationId);
      }

      return {
        success: false,
        error: networkError,
        attempts
      };
    }
  }

  /**
   * Cancel operation by ID
   */
  public cancelOperation(operationId: string): boolean {
    const controller = this.activeRequests.get(operationId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(operationId);
      return true;
    }
    return false;
  }

  /**
   * Cancel all active operations
   */
  public cancelAllOperations(): void {
    this.activeRequests.forEach(controller => controller.abort());
    this.activeRequests.clear();
  }

  /**
   * Get request statistics
   */
  public getRequestStats(operationId: string): { attempts: number; lastAttempt: Date } | null {
    return this.requestStats.get(operationId) || null;
  }

  /**
   * Clear request statistics
   */
  public clearStats(): void {
    this.requestStats.clear();
  }

  private calculateDelay(
    attempt: number,
    initialDelay: number,
    maxDelay: number,
    multiplier: number,
    exponential: boolean
  ): number {
    if (!exponential) {
      return Math.min(initialDelay, maxDelay);
    }

    const delay = initialDelay * Math.pow(multiplier, attempt - 1);
    return Math.min(delay, maxDelay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateRequestStats(operationId: string, attempts: number): void {
    this.requestStats.set(operationId, {
      attempts,
      lastAttempt: new Date()
    });
  }
}

/**
 * Convenience function to get retry manager instance
 */
export const getRetryManager = () => NetworkRetryManager.getInstance();

/**
 * Higher-order function to wrap async operations with retry logic
 */
export function withRetry<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  config: RetryConfig = {}
) {
  return async (...args: T): Promise<R> => {
    const result = await getRetryManager().executeWithRetry(
      () => fn(...args),
      config
    );

    if (result.success) {
      return result.data;
    } else {
      throw result.error;
    }
  };
}

/**
 * Specialized retry configurations for different operation types
 */
export const retryConfigs = {
  /** Configuration for quiz data operations */
  quizData: {
    maxRetries: 3,
    initialDelay: 1000,
    exponentialBackoff: true,
    onRetry: (error: Error, attempt: number) => {
      console.log(`Retrying quiz data operation (attempt ${attempt}):`, error.message);
    }
  } as RetryConfig,

  /** Configuration for file uploads */
  fileUpload: {
    maxRetries: 2,
    initialDelay: 2000,
    maxDelay: 8000,
    exponentialBackoff: true,
    shouldRetry: (error: Error) => {
      // Don't retry on client errors (4xx), only server errors
      const statusMatch = error.message.match(/status (\d+)/);
      if (statusMatch) {
        const status = parseInt(statusMatch[1]);
        return status >= 500;
      }
      return true;
    }
  } as RetryConfig,

  /** Configuration for real-time operations */
  realtime: {
    maxRetries: 5,
    initialDelay: 500,
    maxDelay: 5000,
    exponentialBackoff: true,
    onRetry: (error: Error, attempt: number) => {
      if (attempt === 1) {
        toast({
          title: "Connection Lost",
          description: "Attempting to reconnect...",
          variant: "default"
        });
      }
    },
    onMaxRetriesReached: () => {
      toast({
        title: "Connection Failed",
        description: "Please check your internet connection and refresh the page.",
        variant: "destructive"
      });
    }
  } as RetryConfig,

  /** Configuration for critical operations */
  critical: {
    maxRetries: 5,
    initialDelay: 1000,
    maxDelay: 15000,
    exponentialBackoff: true,
    onRetry: (error: Error, attempt: number) => {
      toast({
        title: `Retry Attempt ${attempt}`,
        description: "Retrying critical operation...",
        variant: "default"
      });
    }
  } as RetryConfig
};

/**
 * Network health checker
 */
export class NetworkHealthChecker {
  private static instance: NetworkHealthChecker;
  private isOnline = navigator.onLine;
  private listeners: Array<(online: boolean) => void> = [];

  private constructor() {
    window.addEventListener('online', () => this.setOnlineStatus(true));
    window.addEventListener('offline', () => this.setOnlineStatus(false));
  }

  public static getInstance(): NetworkHealthChecker {
    if (!NetworkHealthChecker.instance) {
      NetworkHealthChecker.instance = new NetworkHealthChecker();
    }
    return NetworkHealthChecker.instance;
  }

  public isNetworkOnline(): boolean {
    return this.isOnline;
  }

  public addListener(callback: (online: boolean) => void): void {
    this.listeners.push(callback);
  }

  public removeListener(callback: (online: boolean) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private setOnlineStatus(online: boolean): void {
    if (this.isOnline !== online) {
      this.isOnline = online;
      this.listeners.forEach(listener => listener(online));

      // Show network status toast
      toast({
        title: online ? "Connection Restored" : "Connection Lost",
        description: online 
          ? "You're back online!" 
          : "Please check your internet connection.",
        variant: online ? "default" : "destructive"
      });
    }
  }
}

/**
 * Hook for network status
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  
  React.useEffect(() => {
    const healthChecker = NetworkHealthChecker.getInstance();
    
    const handleStatusChange = (online: boolean) => {
      setIsOnline(online);
    };
    
    healthChecker.addListener(handleStatusChange);
    
    return () => {
      healthChecker.removeListener(handleStatusChange);
    };
  }, []);
  
  return isOnline;
}

/**
 * Hook for retry operations
 */
export function useRetryOperation() {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);

  const executeWithRetry = React.useCallback(async <T>(
    operation: () => Promise<T>,
    config: RetryConfig = {}
  ): Promise<T> => {
    setIsRetrying(true);
    setRetryCount(0);

    const enhancedConfig: RetryConfig = {
      ...config,
      onRetry: (error, attempt) => {
        setRetryCount(attempt);
        config.onRetry?.(error, attempt);
      }
    };

    try {
      const result = await getRetryManager().executeWithRetry(
        operation,
        enhancedConfig
      );

      if (result.success) {
        return result.data;
      } else {
        throw result.error;
      }
    } finally {
      setIsRetrying(false);
      setRetryCount(0);
    }
  }, []);

  return {
    executeWithRetry,
    isRetrying,
    retryCount
  };
}

export default NetworkRetryManager;