/**
 * @fileoverview Enhanced question form validation hook
 * @description Provides comprehensive form validation with user-friendly error messages
 * @author Quiz Question Management System
 * @version 1.0.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { validateQuestion } from '@/lib/quiz-validation';
import type { QuestionFormData } from '@/types/quiz';

interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface ValidationState {
  fieldErrors: Record<string, string[]>;
  fieldWarnings: Record<string, string[]>;
  fieldSuggestions: Record<string, string[]>;
  isValidating: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  isFormValid: boolean;
}

interface QuestionFormValidationOptions {
  /** Whether to validate on change */
  validateOnChange?: boolean;
  /** Whether to validate on blur */
  validateOnBlur?: boolean;
  /** Debounce delay for validation */
  debounceDelay?: number;
  /** Whether to show suggestions for improvement */
  showSuggestions?: boolean;
  /** Custom validation rules */
  customValidators?: Record<string, (value: any, formData: QuestionFormData) => FieldValidationResult>;
}

/**
 * Enhanced question form validation hook
 */
export const useQuestionFormValidation = (options: QuestionFormValidationOptions = {}) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceDelay = 500,
    showSuggestions = true,
    customValidators = {}
  } = options;

  const [validationState, setValidationState] = useState<ValidationState>({
    fieldErrors: {},
    fieldWarnings: {},
    fieldSuggestions: {},
    isValidating: false,
    hasErrors: false,
    hasWarnings: false,
    isFormValid: false
  });

  const debounceTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const lastValidatedData = useRef<string>('');

  /**
   * Update validation state for a specific field
   */
  const updateFieldValidation = useCallback((
    field: string,
    result: FieldValidationResult
  ) => {
    setValidationState(prev => {
      const newFieldErrors = { ...prev.fieldErrors };
      const newFieldWarnings = { ...prev.fieldWarnings };
      const newFieldSuggestions = { ...prev.fieldSuggestions };

      // Update field-specific validation results
      if (result.errors.length > 0) {
        newFieldErrors[field] = result.errors;
      } else {
        delete newFieldErrors[field];
      }

      if (result.warnings.length > 0) {
        newFieldWarnings[field] = result.warnings;
      } else {
        delete newFieldWarnings[field];
      }

      if (showSuggestions && result.suggestions.length > 0) {
        newFieldSuggestions[field] = result.suggestions;
      } else {
        delete newFieldSuggestions[field];
      }

      const hasErrors = Object.keys(newFieldErrors).length > 0;
      const hasWarnings = Object.keys(newFieldWarnings).length > 0;

      return {
        ...prev,
        fieldErrors: newFieldErrors,
        fieldWarnings: newFieldWarnings,
        fieldSuggestions: newFieldSuggestions,
        hasErrors,
        hasWarnings,
        isFormValid: !hasErrors
      };
    });
  }, [showSuggestions]);

  /**
   * Validate a specific field
   */
  const validateField = useCallback((
    field: string,
    value: any,
    formData: QuestionFormData,
    immediate = false
  ) => {
    const performValidation = () => {
      setValidationState(prev => ({ ...prev, isValidating: true }));

      const result: FieldValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      };

      // Run custom validator if available
      if (customValidators[field]) {
        const customResult = customValidators[field](value, formData);
        result.errors.push(...customResult.errors);
        result.warnings.push(...customResult.warnings);
        result.suggestions.push(...customResult.suggestions);
      }

      // Built-in field validations
      switch (field) {
        case 'question_text':
          validateQuestionText(value, result);
          break;
        case 'explanation':
          validateExplanation(value, result);
          break;
        case 'mcq_options':
          validateMCQOptions(value, result);
          break;
        case 'mcq_correct_answer':
          validateMCQCorrectAnswer(value, formData.question_data, result);
          break;
        case 'fill_blank_answers':
          validateFillBlankAnswers(value, result);
          break;
        case 'true_false_answer':
          validateTrueFalseAnswer(value, result);
          break;
        case 'match_left_items':
        case 'match_right_items':
          validateMatchItems(value, result);
          break;
        default:
          // No specific validation for this field
          break;
      }

      result.isValid = result.errors.length === 0;
      updateFieldValidation(field, result);

      setValidationState(prev => ({ ...prev, isValidating: false }));
    };

    if (immediate) {
      performValidation();
    } else {
      // Clear existing timeout
      if (debounceTimeouts.current[field]) {
        clearTimeout(debounceTimeouts.current[field]);
      }

      // Set new timeout
      debounceTimeouts.current[field] = setTimeout(performValidation, debounceDelay);
    }
  }, [customValidators, updateFieldValidation, debounceDelay]);

  /**
   * Validate the entire form
   */
  const validateForm = useCallback((formData: QuestionFormData): boolean => {
    const dataString = JSON.stringify(formData);

    // Skip validation if data hasn't changed
    if (lastValidatedData.current === dataString) {
      return validationState.isFormValid;
    }

    lastValidatedData.current = dataString;
    setValidationState(prev => ({ ...prev, isValidating: true }));

    try {
      // Use the existing validateQuestion function - it returns ValidationQuizError[]
      const validationErrors = validateQuestion(formData);

      if (validationErrors.length > 0) {
        // Convert validation errors to field-specific errors
        const fieldErrors: Record<string, string[]> = {};

        validationErrors.forEach((error: any) => {
          const field = getFieldFromError(error.message || error.toString());
          if (!fieldErrors[field]) {
            fieldErrors[field] = [];
          }
          fieldErrors[field].push(error.message || error.toString());
        });

        setValidationState(prev => ({
          ...prev,
          fieldErrors,
          hasErrors: true,
          isFormValid: false,
          isValidating: false
        }));

        return false;
      }

      // Clear all errors if validation passes
      setValidationState(prev => ({
        ...prev,
        fieldErrors: {},
        hasErrors: false,
        isFormValid: true,
        isValidating: false
      }));

      return true;
    } catch (error: any) {
      console.error('Form validation error:', error);

      setValidationState(prev => ({
        ...prev,
        fieldErrors: { general: ['Validation error occurred. Please check your input.'] },
        hasErrors: true,
        isFormValid: false,
        isValidating: false
      }));

      return false;
    }
  }, [validationState.isFormValid]);

  /**
   * Clear validation for a specific field
   */
  const clearFieldValidation = useCallback((field: string) => {
    setValidationState(prev => {
      const newFieldErrors = { ...prev.fieldErrors };
      const newFieldWarnings = { ...prev.fieldWarnings };
      const newFieldSuggestions = { ...prev.fieldSuggestions };

      delete newFieldErrors[field];
      delete newFieldWarnings[field];
      delete newFieldSuggestions[field];

      const hasErrors = Object.keys(newFieldErrors).length > 0;
      const hasWarnings = Object.keys(newFieldWarnings).length > 0;

      return {
        ...prev,
        fieldErrors: newFieldErrors,
        fieldWarnings: newFieldWarnings,
        fieldSuggestions: newFieldSuggestions,
        hasErrors,
        hasWarnings,
        isFormValid: !hasErrors
      };
    });
  }, []);

  /**
   * Clear all validation
   */
  const clearAllValidation = useCallback(() => {
    setValidationState({
      fieldErrors: {},
      fieldWarnings: {},
      fieldSuggestions: {},
      isValidating: false,
      hasErrors: false,
      hasWarnings: false,
      isFormValid: true
    });
    lastValidatedData.current = '';
  }, []);

  /**
   * Get validation state for a specific field
   */
  const getFieldValidation = useCallback((field: string) => ({
    errors: validationState.fieldErrors[field] || [],
    warnings: validationState.fieldWarnings[field] || [],
    suggestions: validationState.fieldSuggestions[field] || [],
    hasErrors: !!(validationState.fieldErrors[field]?.length),
    hasWarnings: !!(validationState.fieldWarnings[field]?.length),
    hasSuggestions: !!(validationState.fieldSuggestions[field]?.length)
  }), [validationState]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimeouts.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  return {
    // Validation state
    ...validationState,

    // Validation methods
    validateField,
    validateForm,
    clearFieldValidation,
    clearAllValidation,
    getFieldValidation
  };
};

// Helper validation functions
const validateQuestionText = (value: string, result: FieldValidationResult) => {
  if (!value || value.trim().length === 0) {
    result.errors.push('Question text is required');
    return;
  }

  if (value.trim().length < 10) {
    result.errors.push('Question text must be at least 10 characters long');
  }

  if (value.length > 500) {
    result.errors.push('Question text must not exceed 500 characters');
  }

  if (value.trim().length < 20) {
    result.suggestions.push('Consider adding more detail to make the question clearer');
  }

  if (!value.includes('?') && !value.includes(':')) {
    result.warnings.push('Question should typically end with a question mark or colon');
  }
};

const validateExplanation = (value: string, result: FieldValidationResult) => {
  if (value && value.length > 1000) {
    result.errors.push('Explanation must not exceed 1000 characters');
  }

  if (value && value.trim().length > 0 && value.trim().length < 20) {
    result.suggestions.push('Consider providing a more detailed explanation');
  }
};

const validateMCQOptions = (options: string[], result: FieldValidationResult) => {
  if (!options || options.length < 2) {
    result.errors.push('Multiple choice questions must have at least 2 options');
    return;
  }

  if (options.length > 6) {
    result.warnings.push('Consider reducing the number of options for better usability');
  }

  const emptyOptions = options.filter(opt => !opt || opt.trim().length === 0);
  if (emptyOptions.length > 0) {
    result.errors.push('All options must have text');
  }

  const duplicateOptions = options.filter((opt, index) =>
    options.findIndex(o => o.trim().toLowerCase() === opt.trim().toLowerCase()) !== index
  );
  if (duplicateOptions.length > 0) {
    result.errors.push('Options must be unique');
  }

  options.forEach((option, index) => {
    if (option && option.length > 200) {
      result.errors.push(`Option ${index + 1} is too long (max 200 characters)`);
    }
  });
};

const validateMCQCorrectAnswer = (correctAnswer: number, questionData: any, result: FieldValidationResult) => {
  if (correctAnswer === undefined || correctAnswer === null) {
    result.errors.push('Please select the correct answer');
    return;
  }

  const options = questionData?.options || [];
  if (correctAnswer < 0 || correctAnswer >= options.length) {
    result.errors.push('Selected correct answer is invalid');
  }
};

const validateFillBlankAnswers = (answers: string[], result: FieldValidationResult) => {
  if (!answers || answers.length === 0) {
    result.errors.push('At least one correct answer is required');
    return;
  }

  const validAnswers = answers.filter(answer => answer && answer.trim().length > 0);
  if (validAnswers.length === 0) {
    result.errors.push('At least one valid answer is required');
  }

  if (answers.length > 10) {
    result.warnings.push('Consider limiting the number of acceptable answers');
  }

  answers.forEach((answer, index) => {
    if (answer && answer.length > 100) {
      result.errors.push(`Answer ${index + 1} is too long (max 100 characters)`);
    }
  });
};

const validateTrueFalseAnswer = (answer: boolean | null, result: FieldValidationResult) => {
  if (answer === null || answer === undefined) {
    result.errors.push('Please select True or False as the correct answer');
  }
};

const validateMatchItems = (items: string[], result: FieldValidationResult) => {
  if (!items || items.length < 2) {
    result.errors.push('At least 2 items are required for matching questions');
    return;
  }

  const validItems = items.filter(item => item && item.trim().length > 0);
  if (validItems.length < 2) {
    result.errors.push('At least 2 valid items are required');
  }

  if (items.length > 10) {
    result.warnings.push('Consider reducing the number of items for better usability');
  }

  items.forEach((item, index) => {
    if (item && item.length > 150) {
      result.errors.push(`Item ${index + 1} is too long (max 150 characters)`);
    }
  });
};

/**
 * Map validation errors to specific fields
 */
const getFieldFromError = (error: string): string => {
  if (error.includes('question text') || error.includes('Question text')) {
    return 'question_text';
  }
  if (error.includes('explanation')) {
    return 'explanation';
  }
  if (error.includes('option') || error.includes('choice')) {
    return 'mcq_options';
  }
  if (error.includes('correct answer')) {
    return 'mcq_correct_answer';
  }
  if (error.includes('answer') && error.includes('blank')) {
    return 'fill_blank_answers';
  }
  if (error.includes('true') || error.includes('false')) {
    return 'true_false_answer';
  }
  if (error.includes('match') || error.includes('item')) {
    return 'match_left_items';
  }

  return 'general';
};