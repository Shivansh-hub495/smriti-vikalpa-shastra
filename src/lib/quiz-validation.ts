/**
 * @fileoverview Enhanced Quiz Validation Utilities
 * @description Comprehensive validation functions for quiz forms and data
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import { z } from 'zod';
import { 
  ValidationQuizError, 
  validators, 
  getErrorHandler 
} from '@/lib/error-handling';
import type { 
  QuizFormData, 
  QuestionFormData, 
  QuestionType, 
  QuestionData,
  QuizSettings 
} from '@/types/quiz';

/**
 * Enhanced quiz creation schema with detailed validation
 */
export const quizCreationSchema = z.object({
  title: z.string()
    .min(1, 'Quiz title is required')
    .max(255, 'Quiz title must be 255 characters or less')
    .refine(val => val.trim().length > 0, 'Quiz title cannot be empty')
    .refine(val => !/^\s+$/.test(val), 'Quiz title cannot contain only whitespace')
    .refine(val => val.trim().length >= 3, 'Quiz title must be at least 3 characters'),
  
  description: z.string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional()
    .refine(val => !val || val.trim().length === 0 || val.trim().length >= 10, 
      'Description must be at least 10 characters if provided'),
  
  settings: z.object({
    questionTypes: z.array(z.enum(['mcq', 'fill_blank', 'true_false', 'match_following']))
      .min(1, 'Select at least one question type')
      .max(4, 'Cannot select more than 4 question types')
      .default(['mcq']),
    
    timeLimit: z.number()
      .min(1, 'Time limit must be at least 1 minute')
      .max(480, 'Time limit cannot exceed 8 hours (480 minutes)')
      .optional()
      .refine(val => val === undefined || val % 1 === 0, 'Time limit must be a whole number'),
    
    shuffleQuestions: z.boolean().default(false),
    
    showResults: z.boolean().default(true),
    
    allowRetakes: z.boolean().default(true),
    
    maxRetakes: z.number()
      .min(1, 'Must allow at least 1 retake')
      .max(10, 'Cannot exceed 10 retakes')
      .optional()
      .refine(val => val === undefined || val % 1 === 0, 'Max retakes must be a whole number'),
    
    showCorrectAnswers: z.boolean().default(true),
    
    showExplanations: z.boolean().default(true),
    
    passingScore: z.number()
      .min(0, 'Passing score cannot be negative')
      .max(100, 'Passing score cannot exceed 100')
      .optional()
      .refine(val => val === undefined || val % 1 === 0, 'Passing score must be a whole number')
  }).default({})
    .refine(data => {
      // If retakes are disabled, maxRetakes should not be set
      if (!data.allowRetakes && data.maxRetakes !== undefined) {
        return false;
      }
      return true;
    }, 'Cannot set max retakes when retakes are disabled')
    .refine(data => {
      // If time limit is set, it should be reasonable for the number of question types
      if (data.timeLimit && data.questionTypes) {
        const minTimePerType = 2; // 2 minutes per question type minimum
        const minTime = data.questionTypes.length * minTimePerType;
        return data.timeLimit >= minTime;
      }
      return true;
    }, 'Time limit too short for selected question types')
});

/**
 * Question validation schemas by type
 */
export const questionSchemas = {
  mcq: z.object({
    options: z.array(z.string().min(1, 'Option cannot be empty'))
      .min(2, 'MCQ must have at least 2 options')
      .max(6, 'MCQ cannot have more than 6 options')
      .refine(options => {
        // Check for duplicate options
        const unique = new Set(options.map(opt => opt.trim().toLowerCase()));
        return unique.size === options.length;
      }, 'Options must be unique'),
    
    correctAnswer: z.number()
      .min(0, 'Correct answer index must be non-negative')
      .refine((val, ctx) => {
        const options = (ctx.parent as any)?.options;
        return options ? val < options.length : true;
      }, 'Correct answer index is out of range'),
    
    shuffleOptions: z.boolean().optional()
  }),

  fill_blank: z.object({
    correctAnswers: z.array(z.string().min(1, 'Answer cannot be empty'))
      .min(1, 'Must have at least one correct answer')
      .max(10, 'Cannot have more than 10 correct answers')
      .refine(answers => {
        // Check for duplicate answers (case-insensitive)
        const unique = new Set(answers.map(ans => ans.trim().toLowerCase()));
        return unique.size === answers.length;
      }, 'Correct answers must be unique'),
    
    caseSensitive: z.boolean().optional().default(false),
    acceptPartialMatch: z.boolean().optional().default(false)
  }),

  true_false: z.object({
    correctAnswer: z.boolean()
  }),

  match_following: z.object({
    leftItems: z.array(z.string().min(1, 'Left item cannot be empty'))
      .min(2, 'Must have at least 2 items to match')
      .max(10, 'Cannot have more than 10 items')
      .refine(items => {
        const unique = new Set(items.map(item => item.trim().toLowerCase()));
        return unique.size === items.length;
      }, 'Left items must be unique'),
    
    rightItems: z.array(z.string().min(1, 'Right item cannot be empty'))
      .min(2, 'Must have at least 2 items to match')
      .max(10, 'Cannot have more than 10 items')
      .refine(items => {
        const unique = new Set(items.map(item => item.trim().toLowerCase()));
        return unique.size === items.length;
      }, 'Right items must be unique'),
    
    correctPairs: z.array(z.object({
      left: z.number().min(0),
      right: z.number().min(0)
    }))
      .min(1, 'Must have at least one correct pair')
      .refine((pairs, ctx) => {
        const leftItems = (ctx.parent as any)?.leftItems;
        const rightItems = (ctx.parent as any)?.rightItems;
        
        if (!leftItems || !rightItems) return true;
        
        return pairs.every(pair => 
          pair.left < leftItems.length && pair.right < rightItems.length
        );
      }, 'Pair indices are out of range')
      .refine(pairs => {
        // Check for duplicate pairs
        const unique = new Set(pairs.map(pair => `${pair.left}-${pair.right}`));
        return unique.size === pairs.length;
      }, 'Pairs must be unique'),
    
    shuffleItems: z.boolean().optional()
  })
};

/**
 * Base question schema
 */
export const baseQuestionSchema = z.object({
  question_text: z.string()
    .min(1, 'Question text is required')
    .max(2000, 'Question text must be 2000 characters or less')
    .refine(val => val.trim().length >= 10, 'Question text must be at least 10 characters')
    .refine(val => !/^\s+$/.test(val), 'Question text cannot contain only whitespace'),
  
  question_type: z.enum(['mcq', 'fill_blank', 'true_false', 'match_following']),
  
  explanation: z.string()
    .max(1000, 'Explanation must be 1000 characters or less')
    .optional()
    .refine(val => !val || val.trim().length === 0 || val.trim().length >= 10,
      'Explanation must be at least 10 characters if provided'),
  
  order_index: z.number().min(0, 'Order index must be non-negative')
});

/**
 * Comprehensive question validation function
 */
export function validateQuestion(questionData: QuestionFormData): ValidationQuizError[] {
  const errors: ValidationQuizError[] = [];
  const errorHandler = getErrorHandler();

  try {
    // Validate base question fields
    baseQuestionSchema.parse(questionData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        errors.push(new ValidationQuizError(
          err.message,
          'QUESTION_VALIDATION',
          err.path.join('.'),
          'valid value',
          err.code
        ));
      });
    }
  }

  // Validate question-specific data
  try {
    const schema = questionSchemas[questionData.question_type];
    if (schema) {
      schema.parse(questionData.question_data);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        errors.push(new ValidationQuizError(
          err.message,
          'QUESTION_DATA_VALIDATION',
          `question_data.${err.path.join('.')}`,
          'valid value',
          err.code
        ));
      });
    }
  }

  // Additional custom validations
  errors.push(...validateQuestionContent(questionData));

  return errors;
}

/**
 * Custom content validation for questions
 */
function validateQuestionContent(questionData: QuestionFormData): ValidationQuizError[] {
  const errors: ValidationQuizError[] = [];

  // Check for inappropriate content patterns
  const inappropriatePatterns = [
    /\b(test|example|placeholder|lorem ipsum)\b/i,
    /^(question \d+|q\d+)$/i,
    /^\s*$/ // Empty or whitespace only
  ];

  inappropriatePatterns.forEach(pattern => {
    if (pattern.test(questionData.question_text)) {
      errors.push(new ValidationQuizError(
        'Question text appears to be placeholder content',
        'PLACEHOLDER_CONTENT',
        'question_text',
        'meaningful question text',
        questionData.question_text
      ));
    }
  });

  // Validate question type specific content
  switch (questionData.question_type) {
    case 'mcq':
      errors.push(...validateMCQContent(questionData.question_data as any));
      break;
    case 'fill_blank':
      errors.push(...validateFillBlankContent(questionData.question_data as any));
      break;
    case 'match_following':
      errors.push(...validateMatchFollowingContent(questionData.question_data as any));
      break;
  }

  return errors;
}

/**
 * MCQ specific content validation
 */
function validateMCQContent(data: any): ValidationQuizError[] {
  const errors: ValidationQuizError[] = [];

  if (data.options) {
    // Check for obviously wrong options
    const shortOptions = data.options.filter((opt: string) => opt.trim().length < 2);
    if (shortOptions.length > 0) {
      errors.push(new ValidationQuizError(
        'MCQ options should be meaningful and at least 2 characters',
        'SHORT_OPTIONS',
        'options',
        'meaningful options',
        shortOptions.length
      ));
    }

    // Check for similar options
    const similarOptions = findSimilarStrings(data.options);
    if (similarOptions.length > 0) {
      errors.push(new ValidationQuizError(
        'Some MCQ options are too similar and may confuse users',
        'SIMILAR_OPTIONS',
        'options',
        'distinct options',
        similarOptions
      ));
    }
  }

  return errors;
}

/**
 * Fill-in-the-blank specific content validation
 */
function validateFillBlankContent(data: any): ValidationQuizError[] {
  const errors: ValidationQuizError[] = [];

  if (data.correctAnswers) {
    // Check for very short answers
    const shortAnswers = data.correctAnswers.filter((ans: string) => ans.trim().length < 2);
    if (shortAnswers.length > 0) {
      errors.push(new ValidationQuizError(
        'Fill-in-the-blank answers should be at least 2 characters',
        'SHORT_ANSWERS',
        'correctAnswers',
        'meaningful answers',
        shortAnswers.length
      ));
    }
  }

  return errors;
}

/**
 * Match-the-following specific content validation
 */
function validateMatchFollowingContent(data: any): ValidationQuizError[] {
  const errors: ValidationQuizError[] = [];

  if (data.leftItems && data.rightItems) {
    // Check if items are too short
    const shortLeftItems = data.leftItems.filter((item: string) => item.trim().length < 2);
    const shortRightItems = data.rightItems.filter((item: string) => item.trim().length < 2);

    if (shortLeftItems.length > 0 || shortRightItems.length > 0) {
      errors.push(new ValidationQuizError(
        'Match items should be meaningful and at least 2 characters',
        'SHORT_MATCH_ITEMS',
        'items',
        'meaningful items',
        { shortLeft: shortLeftItems.length, shortRight: shortRightItems.length }
      ));
    }

    // Check if left and right items have same count as pairs
    if (data.correctPairs && data.leftItems.length !== data.correctPairs.length) {
      errors.push(new ValidationQuizError(
        'Number of left items should match number of correct pairs',
        'MISMATCH_PAIRS_COUNT',
        'correctPairs',
        `${data.leftItems.length} pairs`,
        data.correctPairs.length
      ));
    }
  }

  return errors;
}

/**
 * Utility function to find similar strings
 */
function findSimilarStrings(strings: string[], threshold: number = 0.8): string[] {
  const similar: string[] = [];
  
  for (let i = 0; i < strings.length; i++) {
    for (let j = i + 1; j < strings.length; j++) {
      const similarity = calculateStringSimilarity(strings[i], strings[j]);
      if (similarity > threshold) {
        similar.push(`"${strings[i]}" and "${strings[j]}"`);
      }
    }
  }
  
  return similar;
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  
  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }
  
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - matrix[s2.length][s1.length] / maxLength;
}

/**
 * Validate quiz settings
 */
export function validateQuizSettings(settings: QuizSettings): ValidationQuizError[] {
  const errors: ValidationQuizError[] = [];

  // Custom business logic validations
  if (settings.timeLimit && settings.timeLimit < 5) {
    errors.push(new ValidationQuizError(
      'Time limit should be at least 5 minutes for a meaningful quiz',
      'TIME_LIMIT_TOO_SHORT',
      'timeLimit',
      'at least 5 minutes',
      settings.timeLimit
    ));
  }

  if (settings.passingScore && settings.passingScore < 50) {
    errors.push(new ValidationQuizError(
      'Passing score below 50% may not be meaningful for assessment',
      'LOW_PASSING_SCORE',
      'passingScore',
      'at least 50%',
      settings.passingScore
    ));
  }

  if (settings.maxRetakes && settings.maxRetakes > 5) {
    errors.push(new ValidationQuizError(
      'Too many retakes may reduce the assessment value',
      'TOO_MANY_RETAKES',
      'maxRetakes',
      'maximum 5 retakes',
      settings.maxRetakes
    ));
  }

  return errors;
}

/**
 * Comprehensive quiz validation
 */
export function validateCompleteQuiz(quizData: QuizFormData): {
  isValid: boolean;
  errors: ValidationQuizError[];
  warnings: ValidationQuizError[];
} {
  const errors: ValidationQuizError[] = [];
  const warnings: ValidationQuizError[] = [];

  // Validate quiz metadata
  try {
    quizCreationSchema.parse(quizData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        errors.push(new ValidationQuizError(
          err.message,
          'QUIZ_VALIDATION',
          err.path.join('.'),
          'valid value',
          err.code
        ));
      });
    }
  }

  // Validate settings
  const settingsErrors = validateQuizSettings(quizData.settings);
  settingsErrors.forEach(error => {
    if (error.severity === 'low') {
      warnings.push(error);
    } else {
      errors.push(error);
    }
  });

  // Validate questions
  if (quizData.questions && quizData.questions.length > 0) {
    quizData.questions.forEach((question, index) => {
      const questionErrors = validateQuestion(question);
      questionErrors.forEach(error => {
        error.field = `questions[${index}].${error.field}`;
        errors.push(error);
      });
    });

    // Check for minimum questions
    if (quizData.questions.length < 3) {
      warnings.push(new ValidationQuizError(
        'Quiz should have at least 3 questions for meaningful assessment',
        'FEW_QUESTIONS',
        'questions',
        'at least 3 questions',
        quizData.questions.length
      ));
    }

    // Check for question type diversity
    const questionTypes = new Set(quizData.questions.map(q => q.question_type));
    if (questionTypes.size === 1 && quizData.questions.length > 5) {
      warnings.push(new ValidationQuizError(
        'Consider using different question types for better engagement',
        'SINGLE_QUESTION_TYPE',
        'questions',
        'mixed question types',
        Array.from(questionTypes)[0]
      ));
    }
  } else {
    errors.push(new ValidationQuizError(
      'Quiz must have at least one question',
      'NO_QUESTIONS',
      'questions',
      'at least 1 question',
      0
    ));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Real-time validation hook for forms
 */
export function useQuizValidation() {
  const [errors, setErrors] = React.useState<ValidationQuizError[]>([]);
  const [warnings, setWarnings] = React.useState<ValidationQuizError[]>([]);

  const validateField = React.useCallback((fieldName: string, value: any, context?: any) => {
    // Implement field-specific validation
    const fieldErrors: ValidationQuizError[] = [];

    switch (fieldName) {
      case 'title':
        if (!value || value.trim().length === 0) {
          fieldErrors.push(new ValidationQuizError(
            'Title is required',
            'REQUIRED_FIELD',
            'title'
          ));
        } else if (value.trim().length < 3) {
          fieldErrors.push(new ValidationQuizError(
            'Title must be at least 3 characters',
            'MIN_LENGTH',
            'title'
          ));
        }
        break;

      case 'timeLimit':
        if (value && value < 1) {
          fieldErrors.push(new ValidationQuizError(
            'Time limit must be at least 1 minute',
            'MIN_VALUE',
            'timeLimit'
          ));
        }
        break;

      // Add more field validations as needed
    }

    setErrors(prev => {
      const filtered = prev.filter(err => err.field !== fieldName);
      return [...filtered, ...fieldErrors];
    });

    return fieldErrors;
  }, []);

  const clearFieldErrors = React.useCallback((fieldName: string) => {
    setErrors(prev => prev.filter(err => err.field !== fieldName));
    setWarnings(prev => prev.filter(warn => warn.field !== fieldName));
  }, []);

  const clearAllErrors = React.useCallback(() => {
    setErrors([]);
    setWarnings([]);
  }, []);

  return {
    errors,
    warnings,
    validateField,
    clearFieldErrors,
    clearAllErrors,
    hasErrors: errors.length > 0,
    hasWarnings: warnings.length > 0
  };
}

export default {
  quizCreationSchema,
  questionSchemas,
  baseQuestionSchema,
  validateQuestion,
  validateQuizSettings,
  validateCompleteQuiz,
  useQuizValidation
};