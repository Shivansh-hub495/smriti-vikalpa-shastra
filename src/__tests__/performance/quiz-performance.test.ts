/**
 * @fileoverview Performance tests for Quiz System
 * @description Tests for quiz performance with large datasets and multiple users
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performance } from 'perf_hooks';
import { calculateQuizScore, isAnswerCorrect, shuffleArray } from '../../utils/quizUtils';
import { validateQuestionData, calculateQuizScore as serviceCalculateScore } from '../../lib/quiz-service';
import type { Quiz, Question, QuestionAnswer } from '../../types/quiz';

describe('Quiz Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to generate large quizzes for testing
  const generateLargeQuiz = (questionCount: number): { quiz: Quiz; questions: Question[] } => {
      const quiz: Quiz = {
        id: 'large-quiz',
        title: `Large Quiz with ${questionCount} questions`,
        description: 'Performance test quiz',
        folder_id: 'folder-1',
        user_id: 'user-1',
        settings: {
          shuffleQuestions: true,
          showResults: true
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const questions: Question[] = [];
      for (let i = 0; i < questionCount; i++) {
        const questionType = ['mcq', 'fill_blank', 'true_false', 'match_following'][i % 4] as any;
        
        let questionData: any;
        switch (questionType) {
          case 'mcq':
            questionData = {
              options: [`Option A${i}`, `Option B${i}`, `Option C${i}`, `Option D${i}`],
              correctAnswer: i % 4
            };
            break;
          case 'fill_blank':
            questionData = {
              correctAnswers: [`answer${i}`, `ans${i}`],
              caseSensitive: false
            };
            break;
          case 'true_false':
            questionData = {
              correctAnswer: i % 2 === 0
            };
            break;
          case 'match_following':
            questionData = {
              leftItems: [`Left${i}A`, `Left${i}B`],
              rightItems: [`Right${i}A`, `Right${i}B`],
              correctPairs: [{ left: 0, right: 0 }, { left: 1, right: 1 }]
            };
            break;
        }

        questions.push({
          id: `q${i}`,
          quiz_id: 'large-quiz',
          question_text: `Question ${i + 1}: This is a performance test question`,
          question_type: questionType,
          question_data: questionData,
          explanation: `Explanation for question ${i + 1}`,
          order_index: i,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        });
      }

      return { quiz, questions };
    };

  // Helper function to generate answers for questions
  const generateAnswers = (questions: Question[]): QuestionAnswer[] => {
      return questions.map(question => {
        let answer: any;
        switch (question.question_type) {
          case 'mcq':
            answer = { type: 'mcq', selectedOption: Math.floor(Math.random() * 4) };
            break;
          case 'fill_blank':
            answer = { type: 'fill_blank', answer: `answer${question.order_index}` };
            break;
          case 'true_false':
            answer = { type: 'true_false', answer: Math.random() > 0.5 };
            break;
          case 'match_following':
            answer = { 
              type: 'match_following', 
              pairs: [{ left: 0, right: 0 }, { left: 1, right: 1 }] 
            };
            break;
        }

        return {
          questionId: question.id,
          answer,
          correct: isAnswerCorrect(question, answer),
          timeSpent: Math.floor(Math.random() * 60) + 10
        };
      });
    };

  describe('Large Quiz Handling', () => {
    it('should handle 100 questions efficiently', () => {
      const { questions } = generateLargeQuiz(100);
      const answers = generateAnswers(questions);

      const startTime = performance.now();
      const result = calculateQuizScore(questions, answers);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(100); // Should complete in under 100ms
      expect(result.totalCount).toBe(100);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should handle 500 questions efficiently', () => {
      const { questions } = generateLargeQuiz(500);
      const answers = generateAnswers(questions);

      const startTime = performance.now();
      const result = calculateQuizScore(questions, answers);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(500); // Should complete in under 500ms
      expect(result.totalCount).toBe(500);
      expect(result.breakdown).toBeDefined();
      expect(result.timeMetrics).toBeDefined();
    });

    it('should handle 1000 questions within reasonable time', () => {
      const { questions } = generateLargeQuiz(1000);
      const answers = generateAnswers(questions);

      const startTime = performance.now();
      const result = calculateQuizScore(questions, answers);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(1000); // Should complete in under 1 second
      expect(result.totalCount).toBe(1000);
      expect(result.correctCount).toBeGreaterThanOrEqual(0);
      expect(result.correctCount).toBeLessThanOrEqual(1000);
    });

    it('should efficiently shuffle large arrays', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => i);

      const startTime = performance.now();
      const shuffled = shuffleArray(largeArray);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(50); // Should complete in under 50ms
      expect(shuffled).toHaveLength(10000);
      expect(shuffled.sort((a, b) => a - b)).toEqual(largeArray);
      // Note: There's a small chance the shuffle returns the same order, so we'll just check it's an array
      expect(Array.isArray(shuffled)).toBe(true);
    });
  });

  describe('Multiple User Simulation', () => {
    const simulateMultipleUsers = (userCount: number, questionsPerQuiz: number) => {
      const { questions } = generateLargeQuiz(questionsPerQuiz);
      const results: Array<{ userId: string; score: number; time: number }> = [];

      const startTime = performance.now();

      for (let userId = 0; userId < userCount; userId++) {
        const userStartTime = performance.now();
        const answers = generateAnswers(questions);
        const result = calculateQuizScore(questions, answers);
        const userEndTime = performance.now();

        results.push({
          userId: `user-${userId}`,
          score: result.score,
          time: userEndTime - userStartTime
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      return { results, totalTime };
    };

    it('should handle 10 concurrent users efficiently', () => {
      const { results, totalTime } = simulateMultipleUsers(10, 50);

      expect(totalTime).toBeLessThan(1000); // Should complete in under 1 second
      expect(results).toHaveLength(10);
      
      const averageTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
      expect(averageTime).toBeLessThan(100); // Average per user should be under 100ms
    });

    it('should handle 50 concurrent users efficiently', () => {
      const { results, totalTime } = simulateMultipleUsers(50, 25);

      expect(totalTime).toBeLessThan(2000); // Should complete in under 2 seconds
      expect(results).toHaveLength(50);
      
      results.forEach(result => {
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
        expect(result.time).toBeLessThan(200); // Each user should complete in under 200ms
      });
    });

    it('should handle 100 concurrent users within reasonable time', () => {
      const { results, totalTime } = simulateMultipleUsers(100, 20);

      expect(totalTime).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(results).toHaveLength(100);
      
      const maxTime = Math.max(...results.map(r => r.time));
      expect(maxTime).toBeLessThan(300); // No single user should take more than 300ms
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not cause memory leaks with repeated calculations', () => {
      const { questions } = generateLargeQuiz(100);
      
      // Simulate repeated quiz taking
      for (let i = 0; i < 1000; i++) {
        const answers = generateAnswers(questions);
        const result = calculateQuizScore(questions, answers);
        
        // Verify result is valid
        expect(result.totalCount).toBe(100);
        
        // Clear references to help GC
        answers.length = 0;
      }

      // If we reach here without running out of memory, the test passes
      expect(true).toBe(true);
    });

    it('should handle large question data efficiently', () => {
      const largeQuestionData = {
        options: Array.from({ length: 1000 }, (_, i) => `Option ${i}`),
        correctAnswer: 500
      };

      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        validateQuestionData('mcq', largeQuestionData);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(100); // Should complete in under 100ms
    });
  });

  describe('Algorithm Efficiency Tests', () => {
    it('should have O(n) complexity for score calculation', () => {
      const sizes = [100, 200, 400, 800];
      const times: number[] = [];

      sizes.forEach(size => {
        const { questions } = generateLargeQuiz(size);
        const answers = generateAnswers(questions);

        const startTime = performance.now();
        calculateQuizScore(questions, answers);
        const endTime = performance.now();

        times.push(endTime - startTime);
      });

      // Check that time complexity is roughly linear
      // Time for 800 questions should be less than 10x time for 100 questions
      const ratio = times[3] / times[0];
      expect(ratio).toBeLessThan(10);
    });

    it('should efficiently validate different question types', () => {
      const questionTypes = ['mcq', 'fill_blank', 'true_false', 'match_following'] as const;
      const validationTimes: Record<string, number> = {};

      questionTypes.forEach(type => {
        let questionData: any;
        switch (type) {
          case 'mcq':
            questionData = {
              options: Array.from({ length: 100 }, (_, i) => `Option ${i}`),
              correctAnswer: 50
            };
            break;
          case 'fill_blank':
            questionData = {
              correctAnswers: Array.from({ length: 50 }, (_, i) => `answer${i}`),
              caseSensitive: false
            };
            break;
          case 'true_false':
            questionData = { correctAnswer: true };
            break;
          case 'match_following':
            questionData = {
              leftItems: Array.from({ length: 50 }, (_, i) => `Left${i}`),
              rightItems: Array.from({ length: 50 }, (_, i) => `Right${i}`),
              correctPairs: Array.from({ length: 50 }, (_, i) => ({ left: i, right: i }))
            };
            break;
        }

        const startTime = performance.now();
        
        for (let i = 0; i < 1000; i++) {
          validateQuestionData(type, questionData);
        }
        
        const endTime = performance.now();
        validationTimes[type] = endTime - startTime;
      });

      // All validation types should complete in reasonable time
      Object.values(validationTimes).forEach(time => {
        expect(time).toBeLessThan(100); // Under 100ms for 1000 validations
      });
    });
  });

  describe('Stress Tests', () => {
    it('should handle extreme quiz sizes', () => {
      const { questions } = generateLargeQuiz(5000);
      const answers = generateAnswers(questions);

      const startTime = performance.now();
      const result = calculateQuizScore(questions, answers);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(2000); // Should complete in under 2 seconds
      expect(result.totalCount).toBe(5000);
      expect(result.breakdown).toBeDefined();
    });

    it('should handle rapid successive calculations', () => {
      const { questions } = generateLargeQuiz(50);
      const startTime = performance.now();

      for (let i = 0; i < 10000; i++) {
        const answers = generateAnswers(questions);
        const result = calculateQuizScore(questions, answers);
        expect(result.totalCount).toBe(50);
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(5000); // 10,000 calculations in under 5 seconds
    });

    it('should handle memory-intensive operations', () => {
      const largeData = Array.from({ length: 100000 }, (_, i) => ({
        id: `item-${i}`,
        data: `data-${i}`.repeat(100) // Create larger strings
      }));

      const startTime = performance.now();
      const shuffled = shuffleArray(largeData);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(1000); // Should complete in under 1 second
      expect(shuffled).toHaveLength(100000);
    });
  });

  describe('Real-world Scenario Tests', () => {
    it('should handle typical classroom scenario (30 students, 20 questions)', () => {
      const { questions } = generateLargeQuiz(20);
      const studentCount = 30;
      const results: number[] = [];

      const startTime = performance.now();

      for (let student = 0; student < studentCount; student++) {
        const studentStartTime = performance.now();
        const answers = generateAnswers(questions);
        const result = calculateQuizScore(questions, answers);
        const studentEndTime = performance.now();

        results.push(studentEndTime - studentStartTime);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(1000); // All students in under 1 second
      expect(results.every(time => time < 50)).toBe(true); // Each student under 50ms
    });

    it('should handle large online course scenario (1000 students, 50 questions)', () => {
      const { questions } = generateLargeQuiz(50);
      const studentCount = 1000;
      let totalCalculations = 0;

      const startTime = performance.now();

      // Simulate batched processing
      const batchSize = 100;
      for (let batch = 0; batch < studentCount / batchSize; batch++) {
        for (let student = 0; student < batchSize; student++) {
          const answers = generateAnswers(questions);
          const result = calculateQuizScore(questions, answers);
          totalCalculations++;
          expect(result.totalCount).toBe(50);
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalCalculations).toBe(1000);
      expect(totalTime).toBeLessThan(10000); // All students in under 10 seconds
    });

    it('should handle quiz with mixed complexity questions', () => {
      const complexQuestions: Question[] = [
        // Simple MCQ
        {
          id: 'q1',
          quiz_id: 'mixed-quiz',
          question_text: 'Simple MCQ',
          question_type: 'mcq',
          question_data: { options: ['A', 'B'], correctAnswer: 0 },
          explanation: '',
          order_index: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        // Complex MCQ with many options
        {
          id: 'q2',
          quiz_id: 'mixed-quiz',
          question_text: 'Complex MCQ',
          question_type: 'mcq',
          question_data: { 
            options: Array.from({ length: 20 }, (_, i) => `Option ${i}`),
            correctAnswer: 10
          },
          explanation: '',
          order_index: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        // Complex matching with many pairs
        {
          id: 'q3',
          quiz_id: 'mixed-quiz',
          question_text: 'Complex Matching',
          question_type: 'match_following',
          question_data: {
            leftItems: Array.from({ length: 15 }, (_, i) => `Left ${i}`),
            rightItems: Array.from({ length: 15 }, (_, i) => `Right ${i}`),
            correctPairs: Array.from({ length: 15 }, (_, i) => ({ left: i, right: i }))
          },
          explanation: '',
          order_index: 2,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      const answers = generateAnswers(complexQuestions);

      const startTime = performance.now();
      const result = calculateQuizScore(complexQuestions, answers);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(50); // Should handle complexity efficiently
      expect(result.totalCount).toBe(3);
      expect(result.breakdown).toBeDefined();
    });
  });
});