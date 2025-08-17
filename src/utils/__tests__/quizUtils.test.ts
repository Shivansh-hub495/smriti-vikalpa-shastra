/**
 * @fileoverview Unit tests for Quiz Utilities
 * @description Tests for quiz validation, scoring, and utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  validateQuiz,
  validateQuizSettings,
  validateQuestion,
  validateQuestionData,
  calculateQuizScore,
  isAnswerCorrect,
  shuffleArray,
  formatTime,
  generateQuestionOrderIndex,
  reorderQuestions,
  createDefaultQuestion,
  createQuizResults,
  calculateQuizStats,
  DEFAULT_QUIZ_SETTINGS
} from '../quizUtils';
import type { Quiz, Question, QuizAttempt, QuestionAnswer } from '@/types/quiz';

describe('Quiz Utilities', () => {
  describe('validateQuiz', () => {
    it('should validate a complete quiz', () => {
      const validQuiz: Partial<Quiz> = {
        title: 'Test Quiz',
        folder_id: 'folder-1',
        user_id: 'user-1',
        settings: DEFAULT_QUIZ_SETTINGS
      };

      const result = validateQuiz(validQuiz);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject quiz without title', () => {
      const invalidQuiz: Partial<Quiz> = {
        folder_id: 'folder-1',
        user_id: 'user-1'
      };

      const result = validateQuiz(invalidQuiz);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'title',
        message: 'Quiz title is required'
      });
    });

    it('should reject quiz with title too long', () => {
      const invalidQuiz: Partial<Quiz> = {
        title: 'A'.repeat(300),
        folder_id: 'folder-1',
        user_id: 'user-1'
      };

      const result = validateQuiz(invalidQuiz);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'title',
        message: 'Quiz title must be 255 characters or less'
      });
    });

    it('should reject quiz without folder_id', () => {
      const invalidQuiz: Partial<Quiz> = {
        title: 'Test Quiz',
        user_id: 'user-1'
      };

      const result = validateQuiz(invalidQuiz);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'folder_id',
        message: 'Folder ID is required'
      });
    });

    it('should reject quiz without user_id', () => {
      const invalidQuiz: Partial<Quiz> = {
        title: 'Test Quiz',
        folder_id: 'folder-1'
      };

      const result = validateQuiz(invalidQuiz);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'user_id',
        message: 'User ID is required'
      });
    });
  });

  describe('validateQuizSettings', () => {
    it('should validate valid settings', () => {
      const validSettings = {
        timeLimit: 30,
        maxRetakes: 3,
        passingScore: 70
      };

      const errors = validateQuizSettings(validSettings);
      expect(errors).toHaveLength(0);
    });

    it('should reject negative time limit', () => {
      const invalidSettings = { timeLimit: -5 };
      const errors = validateQuizSettings(invalidSettings);
      
      expect(errors).toContainEqual({
        field: 'settings.timeLimit',
        message: 'Time limit must be greater than 0'
      });
    });

    it('should reject time limit over 24 hours', () => {
      const invalidSettings = { timeLimit: 1500 }; // 25 hours
      const errors = validateQuizSettings(invalidSettings);
      
      expect(errors).toContainEqual({
        field: 'settings.timeLimit',
        message: 'Time limit cannot exceed 24 hours'
      });
    });

    it('should reject negative max retakes', () => {
      const invalidSettings = { maxRetakes: -1 };
      const errors = validateQuizSettings(invalidSettings);
      
      expect(errors).toContainEqual({
        field: 'settings.maxRetakes',
        message: 'Max retakes cannot be negative'
      });
    });

    it('should reject invalid passing score', () => {
      const invalidSettings = { passingScore: 150 };
      const errors = validateQuizSettings(invalidSettings);
      
      expect(errors).toContainEqual({
        field: 'settings.passingScore',
        message: 'Passing score must be between 0 and 100'
      });
    });
  });

  describe('validateQuestion', () => {
    it('should validate MCQ question', () => {
      const validQuestion: Partial<Question> = {
        question_text: 'What is 2+2?',
        question_type: 'mcq',
        question_data: {
          options: ['2', '3', '4', '5'],
          correctAnswer: 2
        },
        order_index: 0
      };

      const result = validateQuestion(validQuestion);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject question without text', () => {
      const invalidQuestion: Partial<Question> = {
        question_type: 'mcq',
        question_data: {
          options: ['A', 'B'],
          correctAnswer: 0
        }
      };

      const result = validateQuestion(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'question_text',
        message: 'Question text is required'
      });
    });

    it('should reject question with invalid type', () => {
      const invalidQuestion: Partial<Question> = {
        question_text: 'Test question',
        question_type: 'invalid_type' as any
      };

      const result = validateQuestion(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'question_type',
        message: 'Invalid question type'
      });
    });

    it('should reject question with negative order index', () => {
      const invalidQuestion: Partial<Question> = {
        question_text: 'Test question',
        question_type: 'mcq',
        order_index: -1
      };

      const result = validateQuestion(invalidQuestion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'order_index',
        message: 'Order index cannot be negative'
      });
    });
  });

  describe('calculateQuizScore', () => {
    const mockQuestions: Question[] = [
      {
        id: 'q1',
        quiz_id: 'quiz-1',
        question_text: 'MCQ Question',
        question_type: 'mcq',
        question_data: { options: ['A', 'B', 'C'], correctAnswer: 1 },
        explanation: null,
        order_index: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'q2',
        quiz_id: 'quiz-1',
        question_text: 'True/False Question',
        question_type: 'true_false',
        question_data: { correctAnswer: true },
        explanation: null,
        order_index: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    it('should calculate perfect score', () => {
      const userAnswers: QuestionAnswer[] = [
        {
          questionId: 'q1',
          answer: { type: 'mcq', selectedOption: 1 },
          correct: true,
          timeSpent: 30
        },
        {
          questionId: 'q2',
          answer: { type: 'true_false', answer: true },
          correct: true,
          timeSpent: 20
        }
      ];

      const result = calculateQuizScore(mockQuestions, userAnswers);

      expect(result.score).toBe(100);
      expect(result.correctCount).toBe(2);
      expect(result.totalCount).toBe(2);
      expect(result.timeMetrics.totalTime).toBe(50);
      expect(result.timeMetrics.averageTimePerQuestion).toBe(25);
    });

    it('should calculate partial score', () => {
      const userAnswers: QuestionAnswer[] = [
        {
          questionId: 'q1',
          answer: { type: 'mcq', selectedOption: 0 },
          correct: false,
          timeSpent: 30
        },
        {
          questionId: 'q2',
          answer: { type: 'true_false', answer: true },
          correct: true,
          timeSpent: 20
        }
      ];

      const result = calculateQuizScore(mockQuestions, userAnswers);

      expect(result.score).toBe(50);
      expect(result.correctCount).toBe(1);
      expect(result.totalCount).toBe(2);
    });

    it('should handle empty questions array', () => {
      const result = calculateQuizScore([], []);

      expect(result.score).toBe(0);
      expect(result.correctCount).toBe(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('isAnswerCorrect', () => {
    it('should validate MCQ answer correctly', () => {
      const question: Question = {
        id: 'q1',
        quiz_id: 'quiz-1',
        question_text: 'MCQ Question',
        question_type: 'mcq',
        question_data: { options: ['A', 'B', 'C'], correctAnswer: 1 },
        explanation: null,
        order_index: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const correctAnswer = { type: 'mcq' as const, selectedOption: 1 };
      const incorrectAnswer = { type: 'mcq' as const, selectedOption: 0 };

      expect(isAnswerCorrect(question, correctAnswer)).toBe(true);
      expect(isAnswerCorrect(question, incorrectAnswer)).toBe(false);
    });

    it('should validate fill-in-the-blank answer correctly', () => {
      const question: Question = {
        id: 'q1',
        quiz_id: 'quiz-1',
        question_text: 'Fill Question',
        question_type: 'fill_blank',
        question_data: { 
          correctAnswers: ['answer1', 'answer2'],
          caseSensitive: false
        },
        explanation: null,
        order_index: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const correctAnswer = { type: 'fill_blank' as const, answer: 'ANSWER1' };
      const incorrectAnswer = { type: 'fill_blank' as const, answer: 'wrong' };

      expect(isAnswerCorrect(question, correctAnswer)).toBe(true);
      expect(isAnswerCorrect(question, incorrectAnswer)).toBe(false);
    });

    it('should validate true/false answer correctly', () => {
      const question: Question = {
        id: 'q1',
        quiz_id: 'quiz-1',
        question_text: 'T/F Question',
        question_type: 'true_false',
        question_data: { correctAnswer: true },
        explanation: null,
        order_index: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const correctAnswer = { type: 'true_false' as const, answer: true };
      const incorrectAnswer = { type: 'true_false' as const, answer: false };

      expect(isAnswerCorrect(question, correctAnswer)).toBe(true);
      expect(isAnswerCorrect(question, incorrectAnswer)).toBe(false);
    });
  });

  describe('shuffleArray', () => {
    it('should return array with same elements', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(original);

      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort()).toEqual(original.sort());
      expect(shuffled).not.toBe(original); // Should be a new array
    });

    it('should handle empty array', () => {
      const result = shuffleArray([]);
      expect(result).toEqual([]);
    });

    it('should handle single element array', () => {
      const result = shuffleArray([1]);
      expect(result).toEqual([1]);
    });
  });

  describe('formatTime', () => {
    it('should format seconds correctly', () => {
      expect(formatTime(30)).toBe('30s');
      expect(formatTime(59)).toBe('59s');
    });

    it('should format minutes correctly', () => {
      expect(formatTime(60)).toBe('1m');
      expect(formatTime(90)).toBe('1m 30s');
      expect(formatTime(120)).toBe('2m');
    });

    it('should format hours correctly', () => {
      expect(formatTime(3600)).toBe('1h');
      expect(formatTime(3900)).toBe('1h 5m');
      expect(formatTime(7200)).toBe('2h');
    });
  });

  describe('generateQuestionOrderIndex', () => {
    it('should return 0 for empty array', () => {
      const result = generateQuestionOrderIndex([]);
      expect(result).toBe(0);
    });

    it('should return next index for existing questions', () => {
      const questions: Question[] = [
        { order_index: 0 } as Question,
        { order_index: 2 } as Question,
        { order_index: 1 } as Question
      ];

      const result = generateQuestionOrderIndex(questions);
      expect(result).toBe(3);
    });
  });

  describe('reorderQuestions', () => {
    const questions: Question[] = [
      { id: 'q1', order_index: 0 } as Question,
      { id: 'q2', order_index: 1 } as Question,
      { id: 'q3', order_index: 2 } as Question
    ];

    it('should reorder questions correctly', () => {
      const newOrder = ['q3', 'q1', 'q2'];
      const result = reorderQuestions(questions, newOrder);

      expect(result[0].id).toBe('q3');
      expect(result[0].order_index).toBe(0);
      expect(result[1].id).toBe('q1');
      expect(result[1].order_index).toBe(1);
      expect(result[2].id).toBe('q2');
      expect(result[2].order_index).toBe(2);
    });

    it('should throw error for missing question ID', () => {
      const newOrder = ['q1', 'q4', 'q2'];
      expect(() => reorderQuestions(questions, newOrder)).toThrow('Question with ID q4 not found');
    });
  });

  describe('createDefaultQuestion', () => {
    it('should create default MCQ question', () => {
      const result = createDefaultQuestion('mcq', 0);

      expect(result.question_type).toBe('mcq');
      expect(result.order_index).toBe(0);
      expect(result.question_data).toEqual({
        options: ['', ''],
        correctAnswer: 0,
        shuffleOptions: false
      });
    });

    it('should create default fill-blank question', () => {
      const result = createDefaultQuestion('fill_blank', 1);

      expect(result.question_type).toBe('fill_blank');
      expect(result.order_index).toBe(1);
      expect(result.question_data).toEqual({
        correctAnswers: [''],
        caseSensitive: false,
        acceptPartialMatch: false
      });
    });

    it('should create default true/false question', () => {
      const result = createDefaultQuestion('true_false', 2);

      expect(result.question_type).toBe('true_false');
      expect(result.order_index).toBe(2);
      expect(result.question_data).toEqual({
        correctAnswer: true
      });
    });

    it('should create default match-following question', () => {
      const result = createDefaultQuestion('match_following', 3);

      expect(result.question_type).toBe('match_following');
      expect(result.order_index).toBe(3);
      expect(result.question_data).toEqual({
        leftItems: [''],
        rightItems: [''],
        correctPairs: [{ left: 0, right: 0 }],
        shuffleItems: false
      });
    });

    it('should throw error for unknown question type', () => {
      expect(() => createDefaultQuestion('unknown' as any, 0)).toThrow('Unknown question type: unknown');
    });
  });

  describe('calculateQuizStats', () => {
    it('should handle empty attempts array', () => {
      const result = calculateQuizStats([]);

      expect(result.totalAttempts).toBe(0);
      expect(result.bestScore).toBeUndefined();
      expect(result.averageScore).toBeUndefined();
    });

    it('should calculate stats for multiple attempts', () => {
      const attempts: QuizAttempt[] = [
        {
          id: 'a1',
          score: 80,
          completed_at: '2024-01-01T00:00:00Z',
          time_taken: 300
        } as QuizAttempt,
        {
          id: 'a2',
          score: 90,
          completed_at: '2024-01-02T00:00:00Z',
          time_taken: 250
        } as QuizAttempt,
        {
          id: 'a3',
          score: 85,
          completed_at: '2024-01-03T00:00:00Z',
          time_taken: 280
        } as QuizAttempt
      ];

      const result = calculateQuizStats(attempts, 75);

      expect(result.totalAttempts).toBe(3);
      expect(result.bestScore).toBe(90);
      expect(result.lastScore).toBe(85);
      expect(result.averageScore).toBeCloseTo(85);
      expect(result.averageTime).toBeCloseTo(277);
      expect(result.hasPassed).toBe(true);
    });

    it('should calculate improvement trend', () => {
      const attempts: QuizAttempt[] = [
        { id: 'a1', score: 60, completed_at: '2024-01-01T00:00:00Z' } as QuizAttempt,
        { id: 'a2', score: 65, completed_at: '2024-01-02T00:00:00Z' } as QuizAttempt,
        { id: 'a3', score: 80, completed_at: '2024-01-03T00:00:00Z' } as QuizAttempt,
        { id: 'a4', score: 85, completed_at: '2024-01-04T00:00:00Z' } as QuizAttempt
      ];

      const result = calculateQuizStats(attempts);

      expect(result.improvementTrend).toBeGreaterThan(0); // Should show improvement
    });
  });
});