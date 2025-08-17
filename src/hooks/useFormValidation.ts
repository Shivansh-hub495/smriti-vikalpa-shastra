/**
 * @fileoverview Enhanced form validation hook
 * @description Provides real-time form validation with field-specific error highlighting
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import { useState, useCallback, useRef } from 'react';
import { ValidationQuizError } from '@/lib/error-handling';
import { validateQuestion } from '@/lib/quiz-validation';
import type { QuestionFormData } from '@/types/quiz';

interface FieldError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface ValidationState {
  errors: Record<string, FieldError[]>;
  warnings: Record<string, FieldError[]>;
  isValidating: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
}

interface FormValidationOptions {
  /** Whether to validate on change */
  validateOnChange?: boolean;
  /** Whether to validate on blur */
  validateOnBlur?: boolean;
  /** Debounce delay for validation */
  debounceDelay?: number;
  /** Custom validation functions */
  customValidators?: Record<string, (value: any, formData?: any) => FieldError[]>;
}

/**
 * Enhanced form validation hook with field-specific error highlighting
 */
export const useFormValidation = (options: FormValidationOptions = {}) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceDelay = 300,
    customValidators = {}
  } = options;

  const [validationState, setValidationState] = useState<ValidationState>({
    errors: {},
    warnings: {},
    isValidating: false,
    hasErrors: false,
    hasWarnings: false
  });

  const debounceTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  const updateValidationState = useCallback((
    field: string,
    errors: FieldError[],
    warnings: FieldError[]
  ) => {
    setValidationState(prev => {
      const newErrors = { ...prev.errors };
      const newWarnings = { ...prev.warnings };

      if (errors.length > 0) {
        newErrors[field] = errors;
      } else {
        delete newErrors[field];
      }

      if (warnings.length > 0) {
        newWarnings[field] = warnings;
      } else {
        delete newWarnings[field];
      }

      return {
        ...prev,
        errors: newErrors,
        warnings: newWarnings,
        hasErrors: Object.keys(newErrors).length > 0,
        hasWarnings: Object.keys(newWarnings).length > 0
      };
    });
  }, []);

  const validateField = useCallback((
    field: string,
    value: any,
    formData?: any,
    immediate = false
  ) => {
    const performValidation = () => {
      setValidationState(prev => ({ ...prev, isValidating: true }));

      const errors: FieldError[] = [];
      const warnings: FieldError[] = [];

      // Run custom validator if available
      if (customValidators[field]) {
        const customErrors = customValidators[field](value, formData);
        customErrors.forEach(error => {
          if (error.severity === 'error') {
            errors.push(error);
          } else if (error.severity === 'warning') {
            warnings.push(error);
          }
        });
      }

      // Built-in field validations
      switch (field) {
        case 'question_text':
          if (!value || value.trim().length === 0) {
            errors.push({
              field,
              message: 'Question text is required',
              severity: 'error'
            });
          } else if (value.trim().length < 10) {
            errors.push({
              field,
              message: 'Question text must be at least 10 characters',
              severity: 'error'
            });
          } else if (value.trim().length > 2000) {
            errors.push({
              field,
              message: 'Question text must be 2000 characters or less',
              severity: 'error'
            });
          }

          // Check for placeholder content
          const placeholderPatterns = [
            /\b(test|example|placeholder|lorem ipsum)\b/i,
            /^(question \d+|q\d+)$/i
          ];

          placeholderPatterns.forEach(pattern => {
            if (pattern.test(value)) {
              warnings.push({
                field,
                message: 'Question text appears to be placeholder content',
                severity: 'warning'
              });
            }
          });
          break;

        case 'explanation':
          if (value && value.trim().length > 0 && value.trim().length < 10) {
            warnings.push({
              field,
              message: 'Explanation should be at least 10 characters if provided',
              severity: 'warning'
            });
          } else if (value && value.trim().length > 1000) {
            errors.push({
              field,
              message: 'Explanation must be 1000 characters or less',
              severity: 'error'
            });
          }
          break;

        case 'mcq_options':
          if (Array.isArray(value)) {
            if (value.length < 2) {
              errors.push({
                field,
                message: 'MCQ must have at least 2 options',
                severity: 'error'
              });
            } else if (value.length > 6) {
              errors.push({
                field,
                message: 'MCQ cannot have more than 6 options',
                severity: 'error'
              });
            }

            // Check for empty options
            const emptyOptions = value.filter(opt => !opt || opt.trim().length === 0);
            if (emptyOptions.length > 0) {
              errors.push({
                field,
                message: 'All options must have content',
                severity: 'error'
              });
            }

            // Check for duplicate options
            const nonEmptyOptions = value.filter(opt => opt && opt.trim().length > 0);
            const uniqueOptions = new Set(nonEmptyOptions.map(opt => opt.trim().toLowerCase()));
            if (uniqueOptions.size !== nonEmptyOptions.length) {
              errors.push({
                field,
                message: 'Options must be unique',
                severity: 'error'
              });
            }

            // Check for very short options
            const shortOptions = nonEmptyOptions.filter(opt => opt.trim().length < 2);
            if (shortOptions.length > 0) {
              warnings.push({
                field,
                message: 'Options should be at least 2 characters for clarity',
                severity: 'warning'
              });
            }
          }
          break;

        case 'fill_blank_answers':
          if (Array.isArray(value)) {
            if (value.length === 0) {
              errors.push({
                field,
                message: 'Must have at least one correct answer',
                severity: 'error'
              });
            } else if (value.length > 10) {
              errors.push({
                field,
                message: 'Cannot have more than 10 correct answers',
                severity: 'error'
              });
            }

            // Check for empty answers
            const emptyAnswers = value.filter(ans => !ans || ans.trim().length === 0);
            if (emptyAnswers.length > 0) {
              errors.push({
                field,
                message: 'All answers must have content',
                severity: 'error'
              });
            }

            // Check for duplicate answers
            const nonEmptyAnswers = value.filter(ans => ans && ans.trim().length > 0);
            const uniqueAnswers = new Set(nonEmptyAnswers.map(ans => ans.trim().toLowerCase()));
            if (uniqueAnswers.size !== nonEmptyAnswers.length) {
              errors.push({
                field,
                message: 'Correct answers must be unique',
                severity: 'error'
              });
            }

            // Check for very short answers
            const shortAnswers = nonEmptyAnswers.filter(ans => ans.trim().length < 2);
            if (shortAnswers.length > 0) {
              warnings.push({
                field,
                message: 'Answers should be at least 2 characters',
                severity: 'warning'
              });
            }
          }
          break;

        case 'match_left_items':
        case 'match_right_items':
          if (Array.isArray(value)) {
            if (value.length < 2) {
              errors.push({
                field,
                message: 'Must have at least 2 items to match',
                severity: 'error'
              });
            } else if (value.length > 10) {
              errors.push({
                field,
                message: 'Cannot have more than 10 items',
                severity: 'error'
              });
            }

            // Check for empty items
            const emptyItems = value.filter(item => !item || item.trim().length === 0);
            if (emptyItems.length > 0) {
              errors.push({
                field,
                message: 'All items must have content',
                severity: 'error'
              });
            }

            // Check for duplicate items
            const nonEmptyItems = value.filter(item => item && item.trim().length > 0);
            const uniqueItems = new Set(nonEmptyItems.map(item => item.trim().toLowerCase()));
            if (uniqueItems.size !== nonEmptyItems.length) {
              errors.push({
                field,
                message: 'Items must be unique',
                severity: 'error'
              });
            }

            // Check for very short items
            const shortItems = nonEmptyItems.filter(item => item.trim().length < 2);
            if (shortItems.length > 0) {
              warnings.push({
                field,
                message: 'Items should be at least 2 characters for clarity',
                severity: 'warning'
              });
            }
          }
          break;
      }

      updateValidationState(field, errors, warnings);
      setValidationState(prev => ({ ...prev, isValidating: false }));

      return { errors, warnings };
    };

    if (immediate) {
      return performValidation();
    } else {
      // Clear existing timeout for this field
      if (debounceTimeouts.current[field]) {
        clearTimeout(debounceTimeouts.current[field]);
      }

      // Set new timeout
      debounceTimeouts.current[field] = setTimeout(performValidation, debounceDelay);
    }
  }, [customValidators, debounceDelay, updateValidationState]);

  const validateQuestion = useCallback((questionData: QuestionFormData) => {
    setValidationState(prev => ({ ...prev, isValidating: true }));

    try {
      const validationErrors = validateQuestion(questionData);
      const errors: Record<string, FieldError[]> = {};
      const warnings: Record<string, FieldError[]> = {};

      validationErrors.forEach(error => {
        const fieldError: FieldError = {
          field: error.field,
          message: error.message,
          severity: error.severity === 'low' ? 'warning' : 'error'
        };

        if (fieldError.severity === 'error') {
          if (!errors[error.field]) errors[error.field] = [];
          errors[error.field].push(fieldError);
        } else {
          if (!warnings[error.field]) warnings[error.field] = [];
          warnings[error.field].push(fieldError);
        }
      });

      setValidationState({
        errors,
        warnings,
        isValidating: false,
        hasErrors: Object.keys(errors).length > 0,
        hasWarnings: Object.keys(warnings).length > 0
      });

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
        warnings
      };
    } catch (error) {
      console.error('Question validation failed:', error);
      setValidationState(prev => ({ ...prev, isValidating: false }));
      return {
        isValid: false,
        errors: { general: [{ field: 'general', message: 'Validation failed', severity: 'error' as const }] },
        warnings: {}
      };
    }
  }, []);

  const clearFieldErrors = useCallback((field: string) => {
    setValidationState(prev => {
      const newErrors = { ...prev.errors };
      const newWarnings = { ...prev.warnings };
      
      delete newErrors[field];
      delete newWarnings[field];

      return {
        ...prev,
        errors: newErrors,
        warnings: newWarnings,
        hasErrors: Object.keys(newErrors).length > 0,
        hasWarnings: Object.keys(newWarnings).length > 0
      };
    });

    // Clear any pending validation for this field
    if (debounceTimeouts.current[field]) {
      clearTimeout(debounceTimeouts.current[field]);
      delete debounceTimeouts.current[field];
    }
  }, []);

  const clearAllErrors = useCallback(() => {
    setValidationState({
      errors: {},
      warnings: {},
      isValidating: false,
      hasErrors: false,
      hasWarnings: false
    });

    // Clear all pending validations
    Object.values(debounceTimeouts.current).forEach(timeout => {
      clearTimeout(timeout);
    });
    debounceTimeouts.current = {};
  }, []);

  const getFieldError = useCallback((field: string): FieldError | null => {
    const errors = validationState.errors[field];
    return errors && errors.length > 0 ? errors[0] : null;
  }, [validationState.errors]);

  const getFieldWarning = useCallback((field: string): FieldError | null => {
    const warnings = validationState.warnings[field];
    return warnings && warnings.length > 0 ? warnings[0] : null;
  }, [validationState.warnings]);

  const hasFieldError = useCallback((field: string): boolean => {
    return !!(validationState.errors[field] && validationState.errors[field].length > 0);
  }, [validationState.errors]);

  const hasFieldWarning = useCallback((field: string): boolean => {
    return !!(validationState.warnings[field] && validationState.warnings[field].length > 0);
  }, [validationState.warnings]);

  return {
    ...validationState,
    validateField,
    validateQuestion,
    clearFieldErrors,
    clearAllErrors,
    getFieldError,
    getFieldWarning,
    hasFieldError,
    hasFieldWarning
  };
};

export default useFormValidation;