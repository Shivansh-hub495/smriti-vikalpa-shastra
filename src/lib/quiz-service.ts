/**
 * @fileoverview Quiz Service using Supabase MCP Tools
 * @description Simple service layer that uses Supabase MCP tools for quiz operations
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import type {
  Quiz,
  Question,
  QuizAttempt,
  CreateQuizRequest,
  UpdateQuizRequest,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  CreateQuizAttemptRequest,
  UpdateQuizAttemptRequest,
  QuizListItem,
  QuizAttemptStats,
  QuestionType,
  QuestionData
} from '@/types/quiz';

/**
 * Custom error class for quiz operations
 */
export class QuizServiceError extends Error {
  constructor(
    message: string,
    public code: 'QUIZ_NOT_FOUND' | 'PERMISSION_DENIED' | 'INVALID_DATA' | 'NETWORK_ERROR' | 'UNKNOWN',
    public details?: any
  ) {
    super(message);
    this.name = 'QuizServiceError';
  }
}

/**
 * Validates question data based on question type
 */
export const validateQuestionData = (questionType: QuestionType, questionData: QuestionData): void => {
  switch (questionType) {
    case 'mcq':
      const mcqData = questionData as any;
      if (!Array.isArray(mcqData.options) || mcqData.options.length < 2) {
        throw new QuizServiceError('MCQ must have at least 2 options', 'INVALID_DATA');
      }
      if (typeof mcqData.correctAnswer !== 'number' || 
          mcqData.correctAnswer < 0 || 
          mcqData.correctAnswer >= mcqData.options.length) {
        throw new QuizServiceError('MCQ must have a valid correct answer index', 'INVALID_DATA');
      }
      break;
      
    case 'fill_blank':
      const fillData = questionData as any;
      if (!Array.isArray(fillData.correctAnswers) || fillData.correctAnswers.length === 0) {
        throw new QuizServiceError('Fill-in-the-blank must have at least one correct answer', 'INVALID_DATA');
      }
      break;
      
    case 'true_false':
      const tfData = questionData as any;
      if (typeof tfData.correctAnswer !== 'boolean') {
        throw new QuizServiceError('True/False must have a boolean correct answer', 'INVALID_DATA');
      }
      break;
      
    case 'match_following':
      const matchData = questionData as any;
      if (!Array.isArray(matchData.leftItems) || !Array.isArray(matchData.rightItems) ||
          !Array.isArray(matchData.correctPairs) || matchData.leftItems.length === 0) {
        throw new QuizServiceError('Match the Following must have valid items and pairs', 'INVALID_DATA');
      }
      break;
      
    default:
      throw new QuizServiceError('Invalid question type', 'INVALID_DATA');
  }
};

/**
 * Calculates the score for a quiz attempt based on answers
 */
export const calculateQuizScore = (
  questions: Question[],
  userAnswers: any[]
): { score: number; correctAnswers: number; totalQuestions: number } => {
  if (questions.length === 0) {
    throw new QuizServiceError('No questions found for this quiz', 'INVALID_DATA');
  }

  let correctAnswers = 0;
  const totalQuestions = questions.length;

  questions.forEach((question, index) => {
    const userAnswer = userAnswers[index];
    if (!userAnswer) return;

    let isCorrect = false;

    switch (question.question_type) {
      case 'mcq':
        const mcqData = question.question_data as any;
        isCorrect = userAnswer.selectedOption === mcqData.correctAnswer;
        break;

      case 'fill_blank':
        const fillData = question.question_data as any;
        const userText = userAnswer.answer?.toLowerCase().trim();
        isCorrect = fillData.correctAnswers.some((correct: string) => 
          fillData.caseSensitive 
            ? correct.trim() === userAnswer.answer?.trim()
            : correct.toLowerCase().trim() === userText
        );
        break;

      case 'true_false':
        const tfData = question.question_data as any;
        isCorrect = userAnswer.answer === tfData.correctAnswer;
        break;

      case 'match_following':
        const matchData = question.question_data as any;
        const userPairs = userAnswer.pairs || [];
        isCorrect = matchData.correctPairs.every((correctPair: any) =>
          userPairs.some((userPair: any) =>
            userPair.left === correctPair.left && userPair.right === correctPair.right
          )
        ) && userPairs.length === matchData.correctPairs.length;
        break;
    }

    if (isCorrect) {
      correctAnswers++;
    }
  });

  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  return { score, correctAnswers, totalQuestions };
};

/**
 * Validates quiz data before creation/update
 */
export const validateQuizData = (data: Partial<CreateQuizRequest | UpdateQuizRequest>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (data.title !== undefined) {
    if (!data.title || !data.title.trim()) {
      errors.push('Quiz title is required');
    } else if (data.title.trim().length > 255) {
      errors.push('Quiz title must be 255 characters or less');
    }
  }

  if (data.description !== undefined && data.description && data.description.length > 1000) {
    errors.push('Quiz description must be 1000 characters or less');
  }

  if (data.settings) {
    const settings = data.settings;
    
    if (settings.timeLimit !== undefined && settings.timeLimit <= 0) {
      errors.push('Time limit must be greater than 0');
    }
    
    if (settings.maxRetakes !== undefined && settings.maxRetakes < 0) {
      errors.push('Max retakes cannot be negative');
    }
    
    if (settings.passingScore !== undefined && (settings.passingScore < 0 || settings.passingScore > 100)) {
      errors.push('Passing score must be between 0 and 100');
    }
  }

  return { isValid: errors.length === 0, errors };
};

// Note: The actual CRUD operations will be performed directly using Supabase MCP tools
// in the components/hooks that need them. This service file provides utility functions
// and validation logic that can be reused across the application.

export default {
  QuizServiceError,
  validateQuestionData,
  calculateQuizScore,
  validateQuizData
};