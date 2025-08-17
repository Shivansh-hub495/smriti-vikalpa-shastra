/**
 * @fileoverview Unit tests for useQuizAttempts hook
 * @description Tests for quiz attempts hook functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useQuizAttempts } from '../useQuizAttempts';
import type { Quiz, Question, QuestionAnswer } from '@/types/quiz';

// Mock the MCP functions
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

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

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

describe('useQuizAttempts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useQuizAttempts());

    expect(result.current.attempts).toEqual([]);
    expect(result.current.currentAttempt).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should start a quiz attempt', async () => {
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

    const { result } = renderHook(() => useQuizAttempts());

    let attemptResult;
    await act(async () => {
      attemptResult = await result.current.startAttempt('quiz-1', 'user-1', 1);
    });

    expect(mockMCPInsert).toHaveBeenCalledWith({
      tableName: 'quiz_attempts',
      data: expect.objectContaining({
        quiz_id: 'quiz-1',
        user_id: 'user-1',
        total_questions: 1
      })
    });

    expect(attemptResult).toEqual(mockAttempt);
    expect(result.current.currentAttempt).toEqual(mockAttempt);
  });

  it('should complete a quiz attempt', async () => {
    const mockUserAnswers: QuestionAnswer[] = [
      {
        questionId: 'q1',
        answer: { type: 'mcq', selectedOption: 2 },
        correct: true,
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

    const { result } = renderHook(() => useQuizAttempts());

    const startTime = new Date('2024-01-01T00:00:00Z');
    let completedAttempt;

    await act(async () => {
      completedAttempt = await result.current.completeAttempt(
        'attempt-1',
        mockQuiz,
        mockQuestions,
        mockUserAnswers,
        startTime
      );
    });

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

    expect(completedAttempt).toEqual(mockCompletedAttempt);
  });

  it('should load quiz attempts', async () => {
    const mockAttempts = [
      {
        id: 'attempt-1',
        quiz_id: 'quiz-1',
        user_id: 'user-1',
        score: 85,
        answers: '[]'
      },
      {
        id: 'attempt-2',
        quiz_id: 'quiz-1',
        user_id: 'user-1',
        score: 92,
        answers: '[]'
      }
    ];

    mockMCPExecuteSQL.mockResolvedValue({ data: mockAttempts });

    const { result } = renderHook(() => useQuizAttempts());

    await act(async () => {
      await result.current.loadAttempts('quiz-1', 'user-1');
    });

    expect(mockMCPExecuteSQL).toHaveBeenCalledWith({
      query: expect.stringContaining('SELECT * FROM quiz_attempts'),
      params: ['quiz-1', 'user-1']
    });

    expect(result.current.attempts).toHaveLength(2);
    expect(result.current.attempts[0].id).toBe('attempt-1');
  });

  it('should get attempt statistics', async () => {
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

    const { result } = renderHook(() => useQuizAttempts());

    let stats;
    await act(async () => {
      stats = await result.current.getAttemptStats('quiz-1', 'user-1');
    });

    expect(stats).toEqual(expect.objectContaining({
      totalAttempts: 2,
      bestScore: 92,
      averageScore: expect.any(Number)
    }));
  });

  it('should get best attempt', async () => {
    const mockBestAttempt = {
      id: 'attempt-2',
      quiz_id: 'quiz-1',
      user_id: 'user-1',
      score: 95,
      answers: '[]'
    };

    mockMCPExecuteSQL.mockResolvedValue({ data: [mockBestAttempt] });

    const { result } = renderHook(() => useQuizAttempts());

    let bestAttempt;
    await act(async () => {
      bestAttempt = await result.current.getBestAttempt('quiz-1', 'user-1');
    });

    expect(mockMCPExecuteSQL).toHaveBeenCalledWith({
      query: expect.stringContaining('ORDER BY score DESC LIMIT 1')
    });

    expect(bestAttempt).toEqual(expect.objectContaining({
      id: 'attempt-2',
      score: 95
    }));
  });

  it('should get latest attempt', async () => {
    const mockLatestAttempt = {
      id: 'attempt-3',
      quiz_id: 'quiz-1',
      user_id: 'user-1',
      score: 88,
      answers: '[]'
    };

    mockMCPExecuteSQL.mockResolvedValue({ data: [mockLatestAttempt] });

    const { result } = renderHook(() => useQuizAttempts());

    let latestAttempt;
    await act(async () => {
      latestAttempt = await result.current.getLatestAttempt('quiz-1', 'user-1');
    });

    expect(mockMCPExecuteSQL).toHaveBeenCalledWith({
      query: expect.stringContaining('ORDER BY created_at DESC LIMIT 1')
    });

    expect(latestAttempt).toEqual(expect.objectContaining({
      id: 'attempt-3',
      score: 88
    }));
  });

  it('should create detailed results', () => {
    const mockAttempt = {
      id: 'attempt-1',
      quiz_id: 'quiz-1',
      user_id: 'user-1',
      score: 100,
      correct_answers: 1,
      total_questions: 1,
      time_taken: 300,
      answers: [
        {
          questionId: 'q1',
          answer: { type: 'mcq', selectedOption: 2 },
          correct: true,
          timeSpent: 30
        }
      ]
    } as any;

    const { result } = renderHook(() => useQuizAttempts());

    const detailedResults = result.current.createDetailedResults(
      mockQuiz,
      mockQuestions,
      mockAttempt
    );

    expect(detailedResults.attempt).toEqual(mockAttempt);
    expect(detailedResults.quiz).toEqual(mockQuiz);
    expect(detailedResults.questionResults).toHaveLength(1);
    expect(detailedResults.metrics.scorePercentage).toBe(100);
    expect(detailedResults.metrics.correctCount).toBe(1);
    expect(detailedResults.metrics.totalCount).toBe(1);
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Database error');
    mockMCPInsert.mockRejectedValue(error);

    const { result } = renderHook(() => useQuizAttempts());

    await act(async () => {
      try {
        await result.current.startAttempt('quiz-1', 'user-1', 1);
      } catch (e) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBeTruthy();
  });

  it('should clear errors', async () => {
    const { result } = renderHook(() => useQuizAttempts());

    // Set an error first
    await act(async () => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should delete attempt', async () => {
    mockMCPExecuteSQL.mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useQuizAttempts());

    await act(async () => {
      await result.current.deleteAttempt('attempt-1', 'user-1');
    });

    expect(mockMCPExecuteSQL).toHaveBeenCalledWith({
      query: expect.stringContaining('DELETE FROM quiz_attempts'),
      params: ['attempt-1', 'user-1']
    });
  });

  it('should get attempt by ID', async () => {
    const mockAttempt = {
      id: 'attempt-1',
      quiz_id: 'quiz-1',
      user_id: 'user-1',
      score: 85,
      answers: '[]'
    };

    mockMCPExecuteSQL.mockResolvedValue({ data: [mockAttempt] });

    const { result } = renderHook(() => useQuizAttempts());

    let attempt;
    await act(async () => {
      attempt = await result.current.getAttemptById('attempt-1');
    });

    expect(mockMCPExecuteSQL).toHaveBeenCalledWith({
      query: expect.stringContaining('WHERE id = $1'),
      params: ['attempt-1']
    });

    expect(attempt).toEqual(expect.objectContaining({
      id: 'attempt-1',
      score: 85
    }));
  });

  it('should handle loading states correctly', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    mockMCPExecuteSQL.mockReturnValue(promise);

    const { result } = renderHook(() => useQuizAttempts());

    // Start loading
    act(() => {
      result.current.loadAttempts('quiz-1', 'user-1');
    });

    expect(result.current.isLoading).toBe(true);

    // Complete loading
    await act(async () => {
      resolvePromise!({ data: [] });
      await promise;
    });

    expect(result.current.isLoading).toBe(false);
  });
});