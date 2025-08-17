/**
 * @fileoverview Error recovery component for handling and recovering from errors
 * @description Provides UI for error display, recovery actions, and retry functionality
 * @author Quiz Question Management System
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';
import { AlertTriangle, RefreshCw, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { QuizError, ValidationError } from '@/lib/error-handling';

interface ErrorRecoveryProps {
  /** The error to display and handle */
  error: QuizError | Error | null;
  /** Whether to show detailed error information */
  showDetails?: boolean;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Whether to show save draft button */
  showSaveDraft?: boolean;
  /** Whether the component is in a loading/retrying state */
  isRetrying?: boolean;
  /** Callback for retry action */
  onRetry?: () => void | Promise<void>;
  /** Callback for save draft action */
  onSaveDraft?: () => void | Promise<void>;
  /** Callback for dismiss error */
  onDismiss?: () => void;
  /** Custom recovery actions */
  customActions?: Array<{
    label: string;
    action: () => void | Promise<void>;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    icon?: React.ReactNode;
  }>;
  /** Additional context information */
  context?: {
    operation?: string;
    timestamp?: Date;
    userAction?: string;
  };
}

/**
 * Error recovery component
 */
export const ErrorRecovery: React.FC<ErrorRecoveryProps> = ({
  error,
  showDetails = false,
  showRetry = true,
  showSaveDraft = false,
  isRetrying = false,
  onRetry,
  onSaveDraft,
  onDismiss,
  customActions = [],
  context
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState<string | null>(null);

  if (!error) return null;

  const isQuizError = (err: any): err is QuizError => {
    return err && typeof err.code === 'string' && typeof err.category === 'string';
  };

  const isValidationError = (err: any): err is ValidationError => {
    return isQuizError(err) && err.category === 'validation';
  };

  const quizError = isQuizError(error) ? error : null;
  const validationError = isValidationError(error) ? error : null;

  const handleAction = useCallback(async (
    actionFn: () => void | Promise<void>,
    actionKey: string
  ) => {
    setIsExecutingAction(actionKey);
    try {
      await actionFn();
    } catch (err) {
      console.error(`Error executing action ${actionKey}:`, err);
    } finally {
      setIsExecutingAction(null);
    }
  }, []);

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2">
            {getSeverityIcon(quizError?.severity)}
            <div>
              <CardTitle className="text-red-800 dark:text-red-200">
                {quizError?.severity === 'critical' ? 'Critical Error' :
                 quizError?.severity === 'high' ? 'Error' :
                 quizError?.severity === 'medium' ? 'Warning' :
                 'Notice'}
              </CardTitle>
              {quizError && (
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={getSeverityColor(quizError.severity)}>
                    {quizError.category}
                  </Badge>
                  <Badge variant="outline">
                    {quizError.code}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Message */}
        <Alert>
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error.message}
          </AlertDescription>
        </Alert>

        {/* Validation Error Details */}
        {validationError && validationError.field && (
          <div className="bg-red-100 dark:bg-red-900 p-3 rounded-md">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Field: {validationError.field}
            </p>
            {validationError.expected && (
              <p className="text-sm text-red-700 dark:text-red-300">
                Expected: {validationError.expected}
              </p>
            )}
            {validationError.actual !== undefined && (
              <p className="text-sm text-red-700 dark:text-red-300">
                Actual: {String(validationError.actual)}
              </p>
            )}
          </div>
        )}

        {/* Recovery Actions */}
        {quizError?.recoveryActions && quizError.recoveryActions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              Suggested Actions:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
              {quizError.recoveryActions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {showRetry && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction(onRetry, 'retry')}
              disabled={isRetrying || isExecutingAction === 'retry'}
              className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
            >
              {isRetrying || isExecutingAction === 'retry' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {isRetrying ? 'Retrying...' : 'Retry'}
            </Button>
          )}

          {showSaveDraft && onSaveDraft && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction(onSaveDraft, 'saveDraft')}
              disabled={isExecutingAction === 'saveDraft'}
              className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
            >
              {isExecutingAction === 'saveDraft' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Draft
            </Button>
          )}

          {customActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={() => handleAction(action.action, `custom-${index}`)}
              disabled={isExecutingAction === `custom-${index}`}
              className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
            >
              {isExecutingAction === `custom-${index}` ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                action.icon && <span className="mr-2">{action.icon}</span>
              )}
              {action.label}
            </Button>
          ))}
        </div>

        {/* Context Information */}
        {context && (
          <div className="text-xs text-red-600 dark:text-red-400 space-y-1">
            {context.operation && (
              <p>Operation: {context.operation}</p>
            )}
            {context.userAction && (
              <p>User Action: {context.userAction}</p>
            )}
            {context.timestamp && (
              <p>Time: {context.timestamp.toLocaleString()}</p>
            )}
          </div>
        )}

        {/* Detailed Error Information */}
        {showDetails && (
          <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-red-700 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
              >
                <span>Error Details</span>
                {isDetailsOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              <Separator />
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded-md">
                <pre className="text-xs text-red-800 dark:text-red-200 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(
                    {
                      message: error.message,
                      ...(quizError && {
                        code: quizError.code,
                        category: quizError.category,
                        severity: quizError.severity,
                        timestamp: quizError.timestamp,
                        details: quizError.details
                      }),
                      stack: error.stack
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Simplified error display component for inline errors
 */
export const InlineErrorDisplay: React.FC<{
  error: string | Error | null;
  onRetry?: () => void;
  className?: string;
}> = ({ error, onRetry, className = '' }) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <Alert className={`border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 ${className}`}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="text-red-800 dark:text-red-200 flex items-center justify-between">
        <span>{errorMessage}</span>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 ml-2"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default ErrorRecovery;