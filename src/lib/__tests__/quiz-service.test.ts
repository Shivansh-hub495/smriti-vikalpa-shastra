/**
 * @fileoverview Unit tests for Quiz Service utilities
 * @description Tests for quiz validation and scoring functions
 */

import { describe, it, expect } from 'vitest';
import {
  QuizServiceError,
  validateQuestionData,
  calculateQuizScore,
  validateQuizData
} from '../quiz-service';
import type { Question } from '@/types/quiz';

describe('Quiz Service Utilities', () => {
  describe('validateQuestionData', () => {
    it('should validate MCQ data correctly', () => {
      const validMCQ = {
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 2
      };

      expect(() => validateQuestionData('mcq', validMCQ)).not.toThrow();
    });

    it('should reject MCQ with insufficient options', () => {
      const invalidMCQ = {
        options: ['A'],
        correctAnswer: 0
      };

      expect(() => validateQuestionData('mcq', invalidMCQ)).toThrow(QuizServiceError);
      expect(() => validateQuestionData('mcq', invalidMCQ)).toThrow('MCQ must have at least 2 options');
    });

    it('should reject MCQ with invalid correct answer', () => {
      const invalidMCQ = {
        options: ['A', 'B', 'C'],
        correctAnswer: 5
      };

      expect(() => validateQuestionData('mcq', invalidMCQ)).toThrow(QuizServiceError);
      expect(() => validateQuestionData('mcq', invalidMCQ)).toThrow('MCQ must have a valid correct answer index');
    });

    it('should validate fill-in-the-blank data correctly', () => {
      const validFillBlank = {
        correctAnswers: ['answer1', 'answer2']
      };

      expect(() => validateQuestionData('fill_blank', validFillBlank)).not.toThrow();
    });

    it('should reject fill-in-the-blank with no correct answers', () => {
      const invalidFillBlank = {
        correctAnswers: []
      };

      expect(() => validateQuestionData('fill_blank', invalidFillBlank)).toThrow(QuizServiceError);
      expect(() => validateQuestionData('fill_blank', invalidFillBlank)).toThrow('Fill-in-the-blank must have at least one correct answer');
    });

    it('should validate true/false data correctly', () => {
      const validTrueFalse = {
        correctAnswer: true
      };

      expect(() => validateQuestionData('true_false', validTrueFalse)).not.toThrow();
    });

    it('should reject true/false with non-boolean answer', () => {
      const invalidTrueFalse = {
        correctAnswer: 'true'
      };

      expect(() => validateQuestionData('true_false', invalidTrueFalse as any)).toThrow(QuizServiceError);
      expect(() => validateQuestionData('true_false', invalidTrueFalse as any)).toThrow('True/False must have a boolean correct answer');
    });

    it('should validate match-the-following data correctly', () => {
      const validMatch = {
        leftItems: ['Item 1', 'Item 2'],
        rightItems: ['Match A', 'Match B'],
        correctPairs: [{ left: 0, right: 1 }, { left: 1, right: 0 }]
      };

      expect(() => validateQuestionData('match_following', validMatch)).not.toThrow();
    });

    it('should reject match-the-following with invalid data', () => {
      const invalidMatch = {
        leftItems: [],
        rightItems: ['Match A'],
        correctPairs: []
      };

      expect(() => validateQuestionData('match_following', invalidMatch)).toThrow(QuizServiceError);
      expect(() => validateQuestionData('match_following', invalidMatch)).toThrow('Match the Following must have valid items and pairs');
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

    it('should calculate score correctly for all correct answers', () => {
      const userAnswers = [
        { selectedOption: 1 }, // Correct MCQ
        { answer: true }       // Correct True/False
      ];

      const result = calculateQuizScore(mockQuestions, userAnswers);

      expect(result.score).toBe(100);
      expect(result.correctAnswers).toBe(2);
      expect(result.totalQuestions).toBe(2);
    });

    it('should calculate score correctly for partial correct answers', () => {
      const userAnswers = [
        { selectedOption: 0 }, // Incorrect MCQ
        { answer: true }       // Correct True/False
      ];

      const result = calculateQuizScore(mockQuestions, userAnswers);

      expect(result.score).toBe(50);
      expect(result.correctAnswers).toBe(1);
      expect(result.totalQuestions).toBe(2);
    });

    it('should calculate score correctly for all incorrect answers', () => {
      const userAnswers = [
        { selectedOption: 0 }, // Incorrect MCQ
        { answer: false }      // Incorrect True/False
      ];

      const result = calculateQuizScore(mockQuestions, userAnswers);

      expect(result.score).toBe(0);
      expect(result.correctAnswers).toBe(0);
      expect(result.totalQuestions).toBe(2);
    });

    it('should handle missing user answers', () => {
      const userAnswers = [
        { selectedOption: 1 } // Only first question answered
        // Second question not answered
      ];

      const result = calculateQuizScore(mockQuestions, userAnswers);

      expect(result.score).toBe(50);
      expect(result.correctAnswers).toBe(1);
      expect(result.totalQuestions).toBe(2);
    });

    it('should throw error for empty questions array', () => {
      const userAnswers = [];

      expect(() => calculateQuizScore([], userAnswers)).toThrow(QuizServiceError);
      expect(() => calculateQuizScore([], userAnswers)).toThrow('No questions found for this quiz');
    });
  });

  describe('validateQuizData', () => {
    it('should validate correct quiz data', () => {
      const validData = {
        title: 'Valid Quiz Title',
        description: 'A valid description',
        settings: {
          timeLimit: 30,
          maxRetakes: 3,
          passingScore: 70
        }
      };

      const result = validateQuizData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty title', () => {
      const invalidData = {
        title: ''
      };

      const result = validateQuizData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Quiz title is required');
    });

    it('should reject title that is too long', () => {
      const invalidData = {
        title: 'A'.repeat(300) // 300 characters
      };

      const result = validateQuizData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Quiz title must be 255 characters or less');
    });

    it('should reject description that is too long', () => {
      const invalidData = {
        title: 'Valid Title',
        description: 'A'.repeat(1100) // 1100 characters
      };

      const result = validateQuizData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Quiz description must be 1000 characters or less');
    });

    it('should reject invalid time limit', () => {
      const invalidData = {
        title: 'Valid Title',
        settings: {
          timeLimit: -5
        }
      };

      const result = validateQuizData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Time limit must be greater than 0');
    });

    it('should reject negative max retakes', () => {
      const invalidData = {
        title: 'Valid Title',
        settings: {
          maxRetakes: -1
        }
      };

      const result = validateQuizData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Max retakes cannot be negative');
    });

    it('should reject invalid passing score', () => {
      const invalidData = {
        title: 'Valid Title',
        settings: {
          passingScore: 150
        }
      };

      const result = validateQuizData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passing score must be between 0 and 100');
    });

    it('should collect multiple validation errors', () => {
      const invalidData = {
        title: '',
        description: 'A'.repeat(1100),
        settings: {
          timeLimit: -5,
          passingScore: 150
        }
      };

      const result = validateQuizData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.errors).toContain('Quiz title is required');
      expect(result.errors).toContain('Quiz description must be 1000 characters or less');
      expect(result.errors).toContain('Time limit must be greater than 0');
      expect(result.errors).toContain('Passing score must be between 0 and 100');
    });
  });
});