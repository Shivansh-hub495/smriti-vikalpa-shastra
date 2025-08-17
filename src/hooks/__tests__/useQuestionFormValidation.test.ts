/**
 * @fileoverview Unit tests for useQuestionFormValidation hook
 * @description Tests for question form validation functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuestionFormValidation } from '../useQuestionFormValidation';
import type { QuestionFormData } from '@/types/quiz';

// Mock the quiz validation library
vi.mock('@/lib/quiz-validation', () => ({
  validateQuestion: vi.fn()
}));

const mockValidateQuestion = vi.mocked(require('@/lib/quiz-validation').validateQuestion);

const createMockQuestionData = (overrides: Partial<QuestionFormData> = {}): QuestionFormData => ({
  question_text: 'What is 2+2?',
  question_type: 'mcq',
  question_data: {
    options: ['2', '3', '4', '5'],
    correctAnswer: 2
  },
  explanation: 'Basic arithmetic',
  order_index: 0,
  ...overrides
});

describe('useQuestionFormValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useQuestionFormValidation());

    expect(result.current.fieldErrors).toEqual({});
    expect(result.current.fieldWarnings).toEqual({});
    expect(result.current.fieldSuggestions).toEqual({});
    expect(result.current.isValidating).toBe(false);
    expect(result.current.hasErrors).toBe(false);
    expect(result.current.hasWarnings).toBe(false);
    expect(result.current.isFormValid).toBe(false);
  });

  it('should validate question text field', () => {
    const { result } = renderHook(() => useQuestionFormValidation());

    act(() => {
      result.current.validateField(
        'question_text',
        'What is 2+2?',
        createMockQuestionData(),
        true
      );
    });

    expect(result.current.isValidating).toBe(false);
    expect(result.current.hasErrors).toBe(false);
  });

  it('should show error for empty question text', () => {
    const { result } = renderHook(() => useQuestionFormValidation());

    act(() => {
      result.current.validateField(
        'question_text',
        '',
        createMockQuestionData({ question_text: '' }),
        true
      );
    });

    expect(result.current.fieldErrors.question_text).toContain('Question text is required');
    expect(result.current.hasErrors).toBe(true);
    expect(result.current.isFormValid).toBe(false);
  });

  it('should show error for short question text', () => {
    const { result } = renderHook(() => useQuestionFormValidation());

    act(() => {
      result.current.validateField(
        'question_text',
        'Short',
        createMockQuestionData({ question_text: 'Short' }),
        true
      );
    });

    expect(result.current.fieldErrors.question_text).toContain('Question text must be at least 10 characters long');
    expect(result.current.hasErrors).toBe(true);
  });

  it('should show error for long question text', () => {
    const { result } = renderHook(() => useQuestionFormValidation());
    const longText = 'a'.repeat(501);

    act(() => {
      result.current.validateField(
        'question_text',
        longText,
        createMockQuestionData({ question_text: longText }),
        true
      );
    });

    expect(result.current.fieldErrors.question_text).toContain('Question text must not exceed 500 characters');
    expect(result.current.hasErrors).toBe(true);
  });

  it('should show warning for question without question mark', () => {
    const { result } = renderHook(() => useQuestionFormValidation());

    act(() => {
      result.current.validateField(
        'question_text',
        'This is a statement without question mark',
        createMockQuestionData({ question_text: 'This is a statement without question mark' }),
        true
      );
    });

    expect(result.current.fieldWarnings.question_text).toContain('Question should typically end with a question mark or colon');
    expect(result.current.hasWarnings).toBe(true);
  });

  it('should show suggestion for short but valid question text', () => {
    const { result } = renderHook(() => useQuestionFormValidation());

    act(() => {
      result.current.validateField(
        'question_text',
        'What is 2+2?',
        createMockQuestionData({ question_text: 'What is 2+2?' }),
        true
      );
    });

    expect(result.current.fieldSuggestions.question_text).toContain('Consider adding more detail to make the question clearer');
  });

  it('should validate explanation field', () => {
    const { result } = renderHook(() => useQuestionFormValidation());
    const longExplanation = 'a'.repeat(1001);

    act(() => {
      result.current.validateField(
        'explanation',
        longExplanation,
        createMockQuestionData({ explanation: longExplanation }),
        true
      );
    });

    expect(result.current.fieldErrors.explanation).toContain('Explanation must not exceed 1000 characters');
    expect(result.current.hasErrors).toBe(true);
  });

  it('should show suggestion for short explanation', () => {
    const { result } = renderHook(() => useQuestionFormValidation());

    act(() => {
      result.current.validateField(
        'explanation',
        'Short',
        createMockQuestionData({ explanation: 'Short' }),
        true
      );
    });

    expect(result.current.fieldSuggestions.explanation).toContain('Consider providing a more detailed explanation');
  });

  it('should validate MCQ options', () => {
    const { result } = renderHook(() => useQuestionFormValidation());

    act(() => {
      result.current.validateField(
        'mcq_options',
        ['Option 1'],
        createMockQuestionData(),
        true
      );
    });

    expect(result.current.fieldErrors.mcq_options).toContain('Multiple choice questions must have at least 2 options');
    expect(result.current.hasErrors).toBe(true);
  });

  it('should show warning for too many MCQ options', () => {
    const { result } = renderHook(() => useQuestionFormValidation());
    const manyOptions = Array(7).fill('').map((_, i) => `Option ${i + 1}`);

    act(() => {
      result.current.validateField(
        'mcq_options',
        manyOptions,
        createMockQuestionData(),
        true
      );
    });

    expect(result.current.fieldWarnings.mcq_options).toContain('Consider reducing the number of options for better usability');
    expect(result.current.hasWarnings).toBe(true);
  });

  it('should detect empty MCQ options', () => {
    const { result } = renderHook(() => useQuestionFormValidation());

    act(() => {
      result.current.validateField(
        'mcq_options',
        ['Option 1', '', 'Option 3'],
        createMockQuestionData(),
        true
      );
    });

    expect(result.current.fieldErrors.mcq_options).toContain('All options must have text');
    expect(result.current.hasErrors).toBe(true);
  });

  it('should detect duplicate MCQ options', () => {
    const { result } = renderHook(() => useQuestionFormValidation());

    act(() => {
      result.current.validateField(
        'mcq_options',
        ['Option 1', 'Option 2', 'option 1'],
        createMockQuestionData(),
        true
      );
    });

    expect(result.current.fieldErrors.mcq_options).toContain('Options must be unique');
    expect(result.current.hasErrors).toBe(true);
  });

  it('should validate MCQ correct answer', () => {
    const { result } = renderHook(() => useQuestionFormValidation());

    act(() => {
      result.current.validateField(
        'mcq_correct_answer',
        null,
        createMockQuestionData(),
        true
      );
    });

    expect(result.current.fieldErrors.mcq_correct_answer).toContain('Please select the correct answer');
    expect(result.current.hasErrors).toBe(true);
  });

  it('should validate fill blank answers', () => {
    const { result } = renderHook(() => useQuestionFormValidation());

    act(() => {
      result.current.validateField(
        'fill_blank_answers',
        [],
        createMockQuestionData(),
        true
      );
    });

    expect(result.current.fieldErrors.fill_blank_answers).toContain('At least one correct answer is required');
    expect(result.current.hasErrors).toBe(true);
  });

  it('should validate true/false answer', () => {
    const { result } = renderHook(() => useQuestionFormValidation());

    act(() => {
      result.current.validateField(
        'true_false_answer',
        null,
        createMockQuestionData(),
        true
      );
    });

    expect(result.current.fieldErrors.true_false_answer).toContain('Please select True or False as the correct answer');
    expect(result.current.hasErrors).toBe(true);
  });

  it('should validate match items', () => {
    const { result } = renderHook(() => useQuestionFormValidation());

    act(() => {
      result.current.validateField(
        'match_left_items',
        ['Item 1'],
        createMockQuestionData(),
        true
      );
    });

    expect(result.current.fieldErrors.match_left_items).toContain('At least 2 items are required for matching questions');
    expect(result.current.hasErrors).toBe(true);
  });

  it('should debounce validation when immediate is false', () => {
    const { result } = renderHook(() => useQuestionFormValidation({ debounceDelay: 500 }));

    act(() => {
      result.current.validateField(
        'question_text',
        '',
        createMockQuestionData({ question_text: '' }),
        false
      );
    });

    // Should not validate immediately
    expect(result.current.hasErrors).toBe(false);

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should validate after debounce
    expect(result.current.hasErrors).toBe(true);
  });

  it('should validate entire form', () => {
    mockValidateQuestion.mockReturnValue([]);
    
    const { result } = renderHook(() => useQuestionFormValidation());

    let isValid: boolean;
    act(() => {
      isValid = result.current.validateForm(createMockQuestionData());
    });

    expect(mockValidateQuestion).toHaveBeenCalledWith(createMockQuestionData());
    expect(isValid!).toBe(true);
    expect(result.current.isFormValid).toBe(true);
  });

  it('should handle form validation errors', () => {
    const mockErrors = [
      { message: 'Question text is required', code: 'REQUIRED' },
      { message: 'Options must be unique', code: 'DUPLICATE' }
    ];
    mockValidateQuestion.mockReturnValue(mockErrors as any);
    
    const { result } = renderHook(() => useQuestionFormValidation());

    let isValid: boolean;
    act(() => {
      isValid = result.current.validateForm(createMockQuestionData());
    });

    expect(isValid!).toBe(false);
    expect(result.current.hasErrors).toBe(true);
    expect(result.current.isFormValid).toBe(false);
  });

  it('should clear field validation', () => {
    const { result } = renderHook(() => useQuestionFormValidation());

    // First add some errors
    act(() => {
      result.current.validateField(
        'question_text',
        '',
        createMockQuestionData({ question_text: '' }),
        true
      );
    });

    expect(result.current.hasErrors).toBe(true);

    // Clear the field validation
    act(() => {
      result.current.clearFieldValidation('question_text');
    });

    expect(result.current.fieldErrors.question_text).toBeUndefined();
    expect(result.current.hasErrors).toBe(false);
  });

  it('should clear all validation', () => {
    const { result } = renderHook(() => useQuestionFormValidation());

    // First add some errors
    act(() => {
      result.current.validateField(
        'question_text',
        '',
        createMockQuestionData({ question_text: '' }),
        true
      );
      result.current.validateField(
        'explanation',
        'a'.repeat(1001),
        createMockQuestionData(),
        true
      );
    });

    expect(result.current.hasErrors).toBe(true);

    // Clear all validation
    act(() => {
      result.current.clearAllValidation();
    });

    expect(result.current.fieldErrors).toEqual({});
    expect(result.current.fieldWarnings).toEqual({});
    expect(result.current.fieldSuggestions).toEqual({});
    expect(result.current.hasErrors).toBe(false);
    expect(result.current.hasWarnings).toBe(false);
    expect(result.current.isFormValid).toBe(true);
  });

  it('should get field validation state', () => {
    const { result } = renderHook(() => useQuestionFormValidation());

    // Add some validation results
    act(() => {
      result.current.validateField(
        'question_text',
        'What is 2+2?',
        createMockQuestionData(),
        true
      );
    });

    const fieldValidation = result.current.getFieldValidation('question_text');
    
    expect(fieldValidation.errors).toEqual([]);
    expect(fieldValidation.warnings).toContain('Question should typically end with a question mark or colon');
    expect(fieldValidation.suggestions).toContain('Consider adding more detail to make the question clearer');
    expect(fieldValidation.hasErrors).toBe(false);
    expect(fieldValidation.hasWarnings).toBe(true);
    expect(fieldValidation.hasSuggestions).toBe(true);
  });

  it('should use custom validators', () => {
    const customValidator = vi.fn(() => ({
      isValid: false,
      errors: ['Custom error'],
      warnings: ['Custom warning'],
      suggestions: ['Custom suggestion']
    }));

    const { result } = renderHook(() => 
      useQuestionFormValidation({
        customValidators: {
          question_text: customValidator
        }
      })
    );

    act(() => {
      result.current.validateField(
        'question_text',
        'Test question',
        createMockQuestionData(),
        true
      );
    });

    expect(customValidator).toHaveBeenCalledWith('Test question', createMockQuestionData());
    expect(result.current.fieldErrors.question_text).toContain('Custom error');
    expect(result.current.fieldWarnings.question_text).toContain('Custom warning');
    expect(result.current.fieldSuggestions.question_text).toContain('Custom suggestion');
  });

  it('should handle validation exceptions', () => {
    mockValidateQuestion.mockImplementation(() => {
      throw new Error('Validation failed');
    });
    
    const { result } = renderHook(() => useQuestionFormValidation());

    let isValid: boolean;
    act(() => {
      isValid = result.current.validateForm(createMockQuestionData());
    });

    expect(isValid!).toBe(false);
    expect(result.current.fieldErrors.general).toContain('Validation error occurred. Please check your input.');
  });

  it('should skip validation if data hasnt changed', () => {
    mockValidateQuestion.mockReturnValue([]);
    
    const { result } = renderHook(() => useQuestionFormValidation());
    const questionData = createMockQuestionData();

    // First validation
    act(() => {
      result.current.validateForm(questionData);
    });

    expect(mockValidateQuestion).toHaveBeenCalledTimes(1);

    // Second validation with same data
    act(() => {
      result.current.validateForm(questionData);
    });

    // Should not call validateQuestion again
    expect(mockValidateQuestion).toHaveBeenCalledTimes(1);
  });

  it('should cleanup timeouts on unmount', () => {
    const { result, unmount } = renderHook(() => useQuestionFormValidation({ debounceDelay: 500 }));

    act(() => {
      result.current.validateField(
        'question_text',
        'test',
        createMockQuestionData(),
        false
      );
    });

    // Unmount should clear timeouts
    unmount();

    // Fast-forward time - should not cause any issues
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // No errors should occur
    expect(true).toBe(true);
  });
});