/**
 * @fileoverview Tests for QuizAttemptService
 * @description Unit tests for quiz attempt service functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import QuizAttemptService, { QuizAttemptError } from '../quiz-attempt-service';
import type { Quiz, Question } from '@/types/quiz';

// Mock window MCP functions
const mockMCPInsert = vi.fn();
const mockMCPUpdate = vi.fn();
const mockMCPSelect = vi.fn();
const mockMCPExecuteSQL = vi.fn();

Object.defineProperty(window, 'mcp_supabase_custom_insert_data', {
  value: mockMCPInsert,
  writable: true
});

Object.defineProperty(window, 'mcp_supabase_custom_update_data', {
  value: mockMCPUpdate,
  writable: true
});

Object.defineProperty(window, 'mcp_supabase_custom_select_data', {
  value: mockMCPSelect,
  writable: true
});

Object.defineProperty(window, 'mcp_supabase_execute_sql', {
  value: mockMCPExecuteSQL,
  writable: true
});

const mockQuiz: Quiz = {
  id: 'quiz-1',
  title: 'Test Quiz',
  description: 'A test quiz',
  folder_id: 'folder-1',
  user_id: 'user-1',
  settings: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockQuestions: Question[] = [
  {
    id: 'q1',
    quiz_id: 'quiz-1',
    question_text: 'What is 2+2?',
    question_type: 'mcq',
    question_data: {
      options: ['2', '3', '4', '5'],
      correctAnswer: 2
    },
    order_index: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

describe('QuizAttemptService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startAttempt', () => {
    it('creates a new quiz attempt', async () => {
      const mockAttempt = {
        id: 'attempt-1',
        quiz_id: 'quiz-1',
        user_id: 'user-1',
        started_at: '2024-01-01T00:00:00Z',
        total_questions: 1,
        correct_answers: 0,
        answers: []
      };

      mockMCPInsert.mockResolvedValue(mockAttempt);

      const result = await QuizAttemptService.startAttempt('quiz-1', 'user-1', 1);

      expect(mockMCPInsert).toHaveBeenCalledWith({
        tableName: 'quiz_attempts',
        data: expect.objectContaining({
          quiz_id: 'quiz-1',
          user_id: 'user-1',
          total_questions: 1,
          correct_answers: 0
        })
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'attempt-1',
        quiz_id: 'quiz-1',
        user_id: 'user-1'
      }));
    });

    it('throws QuizAttemptError on failure', async () => {
      mockMCPInsert.mockRejectedValue(new Error('Database error'));

      await expect(
        QuizAttemptService.startAttempt('quiz-1', 'user-1', 1)
      ).rejects.toThrow(QuizAttemptError);
    });
  });

  describe('completeAttempt', () => {
    it('completes a quiz attempt with scoring', async () => {
      const mockUserAnswers = [
        {
          questionId: 'q1',
          answer: { type: 'mcq' as const, selectedOption: 2 },
          correct: false,
          timeSpent: 30
        }
      ];

      const mockCompletedAttempt = {
        id: 'attempt-1',
        quiz_id: 'quiz-1',
        user_id: 'user-1',
        completed_at: '2024-01-01T00:05:00Z',
        score: 100,
        correct_answers: 1,
        time_taken: 300,
        answers: mockUserAnswers
      };

      mockMCPUpdate.mockResolvedValue(mockCompletedAttempt);

      const startTime = new Date('2024-01-01T00:00:00Z');
      const result = await QuizAttemptService.completeAttempt(
        'attempt-1',
        mockQuiz,
        mockQuestions,
        mockUserAnswers,
        startTime
      );

      expect(mockMCPUpdate).toHaveBeenCalledWith({
        tableName: 'quiz_attempts',
        data: expect.objectContaining({
          completed_at: expect.any(String),
          score: expect.any(Number),
          correct_answers: expect.any(Number),
          time_taken: expect.any(Number)
        }),
        filter: { id: 'attempt-1' }
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'attempt-1',
        score: 100
      }));
    });
  });

  describe('getAttempts', () => {
    it('retrieves quiz attempts with filters', async () => {
      const mockAttempts = [
        {
          id: 'attempt-1',
          quiz_id: 'quiz-1',
          user_id: 'user-1',
          score: 85,
          answers: '[]'
        }
      ];

      mockMCPExecuteSQL.mockResolvedValue({ data: mockAttempts });

      const result = await QuizAttemptService.getAttempts('quiz-1', 'user-1');

      expect(mockMCPExecuteSQL).toHaveBeenCalledWith({
        query: expect.stringContaining('SELECT * FROM quiz_attempts'),
        params: ['quiz-1', 'user-1']
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'attempt-1',
        answers: []
      }));
    });
  });

  describe('getAttemptStats', () => {
    it('calculates attempt statistics', async () => {
      const mockAttempts = [
        {
          id: 'attempt-1',
          quiz_id: 'quiz-1',
          user_id: 'user-1',
          score: 85,
          completed_at: '2024-01-01T00:05:00Z',
          time_taken: 300,
          answers: '[]'
        },
        {
          id: 'attempt-2',
          quiz_id: 'quiz-1',
          user_id: 'user-1',
          score: 92,
          completed_at: '2024-01-02T00:05:00Z',
          time_taken: 250,
          answers: '[]'
        }
      ];

      mockMCPExecuteSQL.mockResolvedValue({ data: mockAttempts });

      const result = await QuizAttemptService.getAttemptStats('quiz-1', 'user-1');

      expect(result).toEqual(expect.objectContaining({
        totalAttempts: 2,
        bestScore: 92,
        averageScore: expect.any(Number)
      }));
    });
  });
});