/**
 * @fileoverview Comprehensive Error Handling Utilities for Quiz System
 * @description Centralized error handling, validation, and recovery mechanisms
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import { toast } from '@/hooks/use-toast';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error categories for better handling
 */
export type ErrorCategory = 
  | 'validation' 
  | 'network' 
  | 'permission' 
  | 'data' 
  | 'system' 
  | 'user_input';

/**
 * Enhanced error interface with additional context
 */
export interface QuizError {
  /** Error message for display */
  message: string;
  /** Error code for programmatic handling */
  code: string;
  /** Error category */
  category: ErrorCategory;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Additional error details */
  details?: any;
  /** Timestamp when error occurred */
  timestamp: Date;
  /** Suggested recovery actions */
  recoveryActions?: string[];
  /** Whether error should be reported to monitoring */
  shouldReport?: boolean;
}

/**
 * Network error with retry capabilities
 */
export interface NetworkError extends QuizError {
  category: 'network';
  /** Number of retry attempts made */
  retryCount: number;
  /** Maximum retry attempts allowed */
  maxRetries: number;
  /** Whether retry is possible */
  canRetry: boolean;
}

/**
 * Validation error with field-specific information
 */
export interface ValidationError extends QuizError {
  category: 'validation';
  /** Field that failed validation */
  field?: string;
  /** Expected value format/type */
  expected?: string;
  /** Actual value that failed */
  actual?: any;
}

/**
 * Enhanced error class for quiz operations
 */
export class EnhancedQuizError extends Error implements QuizError {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly details?: any;
  public readonly timestamp: Date;
  public readonly recoveryActions?: string[];
  public readonly shouldReport?: boolean;

  constructor(
    message: string,
    code: string,
    category: ErrorCategory,
    severity: ErrorSeverity = 'medium',
    details?: any,
    recoveryActions?: string[],
    shouldReport: boolean = true
  ) {
    super(message);
    this.name = 'EnhancedQuizError';
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.details = details;
    this.timestamp = new Date();
    this.recoveryActions = recoveryActions;
    this.shouldReport = shouldReport;
  }
}

/**
 * Network error with retry functionality
 */
export class NetworkQuizError extends EnhancedQuizError implements NetworkError {
  public retryCount: number = 0;
  public maxRetries: number = 3;
  public canRetry: boolean = true;

  constructor(
    message: string,
    code: string,
    details?: any,
    maxRetries: number = 3
  ) {
    super(
      message,
      code,
      'network',
      'high',
      details,
      ['Check your internet connection', 'Try again in a few moments'],
      true
    );
    this.maxRetries = maxRetries;
  }

  incrementRetry(): void {
    this.retryCount++;
    this.canRetry = this.retryCount < this.maxRetries;
  }
}

/**
 * Validation error with field information
 */
export class ValidationQuizError extends EnhancedQuizError implements ValidationError {
  public readonly field?: string;
  public readonly expected?: string;
  public readonly actual?: any;

  constructor(
    message: string,
    code: string,
    field?: string,
    expected?: string,
    actual?: any
  ) {
    super(
      message,
      code,
      'validation',
      'low',
      { field, expected, actual },
      ['Please correct the highlighted fields', 'Check the input format'],
      false
    );
    this.field = field;
    this.expected = expected;
    this.actual = actual;
  }
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  /** Whether to show toast notifications */
  showToast?: boolean;
  /** Whether to log errors to console */
  logToConsole?: boolean;
  /** Whether to report errors to monitoring service */
  reportErrors?: boolean;
  /** Custom error message override */
  customMessage?: string;
  /** Recovery callback function */
  onRecovery?: () => void;
}

/**
 * Centralized error handler
 */
export class QuizErrorHandler {
  private static instance: QuizErrorHandler;
  private errorLog: QuizError[] = [];
  private maxLogSize: number = 100;

  private constructor() {}

  public static getInstance(): QuizErrorHandler {
    if (!QuizErrorHandler.instance) {
      QuizErrorHandler.instance = new QuizErrorHandler();
    }
    return QuizErrorHandler.instance;
  }

  /**
   * Handle an error with comprehensive processing
   */
  public handleError(
    error: Error | QuizError,
    config: ErrorHandlerConfig = {}
  ): void {
    const {
      showToast = true,
      logToConsole = true,
      reportErrors = true,
      customMessage,
      onRecovery
    } = config;

    // Convert to QuizError if needed
    const quizError = this.normalizeError(error);

    // Log error
    if (logToConsole) {
      console.error('Quiz Error:', quizError);
    }

    // Add to error log
    this.addToErrorLog(quizError);

    // Show user notification
    if (showToast) {
      this.showErrorToast(quizError, customMessage);
    }

    // Report error if needed
    if (reportErrors && quizError.shouldReport) {
      this.reportError(quizError);
    }

    // Execute recovery callback
    if (onRecovery) {
      onRecovery();
    }
  }

  /**
   * Handle network errors with retry logic
   */
  public async handleNetworkError<T>(
    operation: () => Promise<T>,
    errorMessage: string = 'Network operation failed',
    maxRetries: number = 3
  ): Promise<T> {
    const networkError = new NetworkQuizError(errorMessage, 'NETWORK_ERROR', undefined, maxRetries);

    while (networkError.canRetry) {
      try {
        return await operation();
      } catch (error) {
        networkError.incrementRetry();
        
        if (!networkError.canRetry) {
          networkError.message = `${errorMessage} (after ${maxRetries} attempts)`;
          this.handleError(networkError);
          throw networkError;
        }

        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, networkError.retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw networkError;
  }

  /**
   * Validate data with comprehensive error reporting
   */
  public validateData<T>(
    data: T,
    validators: Array<(data: T) => ValidationError | null>
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const validator of validators) {
      const error = validator(data);
      if (error) {
        errors.push(error);
        this.addToErrorLog(error);
      }
    }

    return errors;
  }

  /**
   * Get recent errors for debugging
   */
  public getRecentErrors(count: number = 10): QuizError[] {
    return this.errorLog.slice(-count);
  }

  /**
   * Clear error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
  } {
    const stats = {
      total: this.errorLog.length,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>
    };

    // Initialize counters
    const categories: ErrorCategory[] = ['validation', 'network', 'permission', 'data', 'system', 'user_input'];
    const severities: ErrorSeverity[] = ['low', 'medium', 'high', 'critical'];

    categories.forEach(cat => stats.byCategory[cat] = 0);
    severities.forEach(sev => stats.bySeverity[sev] = 0);

    // Count errors
    this.errorLog.forEach(error => {
      stats.byCategory[error.category]++;
      stats.bySeverity[error.severity]++;
    });

    return stats;
  }

  private normalizeError(error: Error | QuizError): QuizError {
    if (this.isQuizError(error)) {
      return error;
    }

    // Convert regular Error to QuizError
    return new EnhancedQuizError(
      error.message || 'An unknown error occurred',
      'UNKNOWN_ERROR',
      'system',
      'medium',
      { originalError: error }
    );
  }

  private isQuizError(error: any): error is QuizError {
    return error && typeof error.code === 'string' && typeof error.category === 'string';
  }

  private addToErrorLog(error: QuizError): void {
    this.errorLog.push(error);
    
    // Maintain log size limit
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }
  }

  private showErrorToast(error: QuizError, customMessage?: string): void {
    const message = customMessage || error.message;
    const variant = this.getToastVariant(error.severity);

    toast({
      title: this.getErrorTitle(error),
      description: message,
      variant,
      action: error.recoveryActions ? {
        altText: "Recovery suggestions",
        onClick: () => this.showRecoveryActions(error)
      } : undefined
    });
  }

  private getErrorTitle(error: QuizError): string {
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

  private getToastVariant(severity: ErrorSeverity): 'default' | 'destructive' {
    return severity === 'high' || severity === 'critical' ? 'destructive' : 'default';
  }

  private showRecoveryActions(error: QuizError): void {
    if (error.recoveryActions && error.recoveryActions.length > 0) {
      toast({
        title: "Suggested Actions",
        description: error.recoveryActions.join('\n• '),
        variant: "default"
      });
    }
  }

  private reportError(error: QuizError): void {
    // In a real application, this would send to a monitoring service
    console.warn('Error reported to monitoring:', {
      code: error.code,
      category: error.category,
      severity: error.severity,
      timestamp: error.timestamp,
      message: error.message
    });
  }
}

/**
 * Convenience function to get error handler instance
 */
export const getErrorHandler = () => QuizErrorHandler.getInstance();

/**
 * Common validation functions
 */
export const validators = {
  required: (value: any, fieldName: string): ValidationError | null => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return new ValidationQuizError(
        `${fieldName} is required`,
        'REQUIRED_FIELD',
        fieldName,
        'non-empty value',
        value
      );
    }
    return null;
  },

  minLength: (value: string, min: number, fieldName: string): ValidationError | null => {
    if (value && value.length < min) {
      return new ValidationQuizError(
        `${fieldName} must be at least ${min} characters`,
        'MIN_LENGTH',
        fieldName,
        `minimum ${min} characters`,
        value.length
      );
    }
    return null;
  },

  maxLength: (value: string, max: number, fieldName: string): ValidationError | null => {
    if (value && value.length > max) {
      return new ValidationQuizError(
        `${fieldName} must be no more than ${max} characters`,
        'MAX_LENGTH',
        fieldName,
        `maximum ${max} characters`,
        value.length
      );
    }
    return null;
  },

  range: (value: number, min: number, max: number, fieldName: string): ValidationError | null => {
    if (value < min || value > max) {
      return new ValidationQuizError(
        `${fieldName} must be between ${min} and ${max}`,
        'OUT_OF_RANGE',
        fieldName,
        `${min} to ${max}`,
        value
      );
    }
    return null;
  },

  arrayMinLength: (value: any[], min: number, fieldName: string): ValidationError | null => {
    if (!Array.isArray(value) || value.length < min) {
      return new ValidationQuizError(
        `${fieldName} must have at least ${min} items`,
        'ARRAY_MIN_LENGTH',
        fieldName,
        `minimum ${min} items`,
        Array.isArray(value) ? value.length : 'not an array'
      );
    }
    return null;
  }
};

/**
 * Error boundary helper for React components
 */
export const createErrorBoundary = (fallbackComponent: React.ComponentType<{ error: Error }>) => {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error?: Error }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      getErrorHandler().handleError(
        new EnhancedQuizError(
          'React component error',
          'COMPONENT_ERROR',
          'system',
          'high',
          { error, errorInfo }
        )
      );
    }

    render() {
      if (this.state.hasError && this.state.error) {
        return React.createElement(fallbackComponent, { error: this.state.error });
      }

      return this.props.children;
    }
  };
};

export default QuizErrorHandler;