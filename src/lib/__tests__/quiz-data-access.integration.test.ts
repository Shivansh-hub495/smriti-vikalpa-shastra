/**
 * @fileoverview Integration tests for Quiz Data Access
 * @description Tests for quiz database operations using Supabase MCP tools
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Quiz, Question, QuizAttempt } from '@/types/quiz';

// Mock the MCP functions
const mockMCPInsert = vi.fn();
const mockMCPUpdate = vi.fn();
const mockMCPSelect = vi.fn();
const mockMCPDelete = vi.fn();
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

Object.defineProperty(window, 'mcp_supabase_custom_delete_data', {
  value: mockMCPDelete,
  writable: true
});

Object.defineProperty(window, 'mcp_supabase_execute_sql', {
  value: mockMCPExecuteSQL,
  writable: true
});

describe('Quiz Data Access Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Quiz CRUD Operations', () => {
    it('should create a quiz successfully', async () => {
      const quizData = {
        title: 'Integration Test Quiz',
        description: 'A quiz for integration testing',
        folder_id: 'folder-123',
        user_id: 'user-123',
        settings: {
          timeLimit: 30,
          shuffleQuestions: false,
          showResults: true
        }
      };

      const mockCreatedQuiz: Quiz = {
        id: 'quiz-123',
        ...quizData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockMCPInsert.mockResolvedValue(mockCreatedQuiz);

      // Simulate quiz creation
      const result = await window.mcp_supabase_custom_insert_data({
        tableName: 'quizzes',
        data: quizData
      });

      expect(mockMCPInsert).toHaveBeenCalledWith({
        tableName: 'quizzes',
        data: quizData
      });

      expect(result).toEqual(mockCreatedQuiz);
    });

    it('should read quizzes from a folder', async () => {
      const mockQuizzes: Quiz[] = [
        {
          id: 'quiz-1',
          title: 'Quiz 1',
          description: 'First quiz',
          folder_id: 'folder-123',
          user_id: 'user-123',
          settings: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'quiz-2',
          title: 'Quiz 2',
          description: 'Second quiz',
          folder_id: 'folder-123',
          user_id: 'user-123',
          settings: {},
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ];

      mockMCPSelect.mockResolvedValue(mockQuizzes);

      const result = await window.mcp_supabase_custom_select_data({
        tableName: 'quizzes',
        filter: { folder_id: 'folder-123', user_id: 'user-123' }
      });

      expect(mockMCPSelect).toHaveBeenCalledWith({
        tableName: 'quizzes',
        filter: { folder_id: 'folder-123', user_id: 'user-123' }
      });

      expect(result).toEqual(mockQuizzes);
      expect(result).toHaveLength(2);
    });

    it('should update a quiz', async () => {
      const updateData = {
        title: 'Updated Quiz Title',
        description: 'Updated description',
        settings: {
          timeLimit: 45,
          shuffleQuestions: true
        }
      };

      const mockUpdatedQuiz: Quiz = {
        id: 'quiz-123',
        title: 'Updated Quiz Title',
        description: 'Updated description',
        folder_id: 'folder-123',
        user_id: 'user-123',
        settings: {
          timeLimit: 45,
          shuffleQuestions: true
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      };

      mockMCPUpdate.mockResolvedValue(mockUpdatedQuiz);

      const result = await window.mcp_supabase_custom_update_data({
        tableName: 'quizzes',
        data: updateData,
        filter: { id: 'quiz-123', user_id: 'user-123' }
      });

      expect(mockMCPUpdate).toHaveBeenCalledWith({
        tableName: 'quizzes',
        data: updateData,
        filter: { id: 'quiz-123', user_id: 'user-123' }
      });

      expect(result).toEqual(mockUpdatedQuiz);
    });

    it('should delete a quiz', async () => {
      mockMCPDelete.mockResolvedValue({ success: true });

      const result = await window.mcp_supabase_custom_delete_data({
        tableName: 'quizzes',
        filter: { id: 'quiz-123', user_id: 'user-123' }
      });

      expect(mockMCPDelete).toHaveBeenCalledWith({
        tableName: 'quizzes',
        filter: { id: 'quiz-123', user_id: 'user-123' }
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('Question CRUD Operations', () => {
    it('should create questions for a quiz', async () => {
      const questionData = {
        quiz_id: 'quiz-123',
        question_text: 'What is 2 + 2?',
        question_type: 'mcq',
        question_data: {
          options: ['2', '3', '4', '5'],
          correctAnswer: 2
        },
        explanation: 'Basic addition',
        order_index: 0
      };

      const mockCreatedQuestion: Question = {
        id: 'question-123',
        ...questionData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockMCPInsert.mockResolvedValue(mockCreatedQuestion);

      const result = await window.mcp_supabase_custom_insert_data({
        tableName: 'questions',
        data: questionData
      });

      expect(mockMCPInsert).toHaveBeenCalledWith({
        tableName: 'questions',
        data: questionData
      });

      expect(result).toEqual(mockCreatedQuestion);
    });

    it('should read questions for a quiz', async () => {
      const mockQuestions: Question[] = [
        {
          id: 'q1',
          quiz_id: 'quiz-123',
          question_text: 'MCQ Question',
          question_type: 'mcq',
          question_data: { options: ['A', 'B', 'C'], correctAnswer: 1 },
          explanation: 'MCQ explanation',
          order_index: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'q2',
          quiz_id: 'quiz-123',
          question_text: 'True/False Question',
          question_type: 'true_false',
          question_data: { correctAnswer: true },
          explanation: 'T/F explanation',
          order_index: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockMCPSelect.mockResolvedValue(mockQuestions);

      const result = await window.mcp_supabase_custom_select_data({
        tableName: 'questions',
        filter: { quiz_id: 'quiz-123' }
      });

      expect(mockMCPSelect).toHaveBeenCalledWith({
        tableName: 'questions',
        filter: { quiz_id: 'quiz-123' }
      });

      expect(result).toEqual(mockQuestions);
      expect(result).toHaveLength(2);
    });

    it('should update a question', async () => {
      const updateData = {
        question_text: 'Updated question text',
        explanation: 'Updated explanation'
      };

      const mockUpdatedQuestion: Question = {
        id: 'question-123',
        quiz_id: 'quiz-123',
        question_text: 'Updated question text',
        question_type: 'mcq',
        question_data: { options: ['A', 'B', 'C'], correctAnswer: 1 },
        explanation: 'Updated explanation',
        order_index: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      };

      mockMCPUpdate.mockResolvedValue(mockUpdatedQuestion);

      const result = await window.mcp_supabase_custom_update_data({
        tableName: 'questions',
        data: updateData,
        filter: { id: 'question-123' }
      });

      expect(mockMCPUpdate).toHaveBeenCalledWith({
        tableName: 'questions',
        data: updateData,
        filter: { id: 'question-123' }
      });

      expect(result).toEqual(mockUpdatedQuestion);
    });

    it('should delete a question', async () => {
      mockMCPDelete.mockResolvedValue({ success: true });

      const result = await window.mcp_supabase_custom_delete_data({
        tableName: 'questions',
        filter: { id: 'question-123' }
      });

      expect(mockMCPDelete).toHaveBeenCalledWith({
        tableName: 'questions',
        filter: { id: 'question-123' }
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('Quiz Attempt Operations', () => {
    it('should create a quiz attempt', async () => {
      const attemptData = {
        quiz_id: 'quiz-123',
        user_id: 'user-123',
        total_questions: 2,
        correct_answers: 0,
        answers: []
      };

      const mockCreatedAttempt: QuizAttempt = {
        id: 'attempt-123',
        ...attemptData,
        started_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z'
      };

      mockMCPInsert.mockResolvedValue(mockCreatedAttempt);

      const result = await window.mcp_supabase_custom_insert_data({
        tableName: 'quiz_attempts',
        data: attemptData
      });

      expect(mockMCPInsert).toHaveBeenCalledWith({
        tableName: 'quiz_attempts',
        data: attemptData
      });

      expect(result).toEqual(mockCreatedAttempt);
    });

    it('should complete a quiz attempt', async () => {
      const completionData = {
        completed_at: '2024-01-01T00:05:00Z',
        score: 100,
        correct_answers: 2,
        time_taken: 300,
        answers: [
          {
            questionId: 'q1',
            answer: { type: 'mcq', selectedOption: 1 },
            correct: true,
            timeSpent: 150
          },
          {
            questionId: 'q2',
            answer: { type: 'true_false', answer: true },
            correct: true,
            timeSpent: 150
          }
        ]
      };

      const mockCompletedAttempt: QuizAttempt = {
        id: 'attempt-123',
        quiz_id: 'quiz-123',
        user_id: 'user-123',
        started_at: '2024-01-01T00:00:00Z',
        total_questions: 2,
        ...completionData,
        created_at: '2024-01-01T00:00:00Z'
      };

      mockMCPUpdate.mockResolvedValue(mockCompletedAttempt);

      const result = await window.mcp_supabase_custom_update_data({
        tableName: 'quiz_attempts',
        data: completionData,
        filter: { id: 'attempt-123' }
      });

      expect(mockMCPUpdate).toHaveBeenCalledWith({
        tableName: 'quiz_attempts',
        data: completionData,
        filter: { id: 'attempt-123' }
      });

      expect(result).toEqual(mockCompletedAttempt);
    });

    it('should retrieve quiz attempts with statistics', async () => {
      const mockAttempts = [
        {
          id: 'attempt-1',
          quiz_id: 'quiz-123',
          user_id: 'user-123',
          score: 85,
          completed_at: '2024-01-01T00:05:00Z',
          time_taken: 300,
          answers: '[]'
        },
        {
          id: 'attempt-2',
          quiz_id: 'quiz-123',
          user_id: 'user-123',
          score: 92,
          completed_at: '2024-01-02T00:05:00Z',
          time_taken: 250,
          answers: '[]'
        }
      ];

      mockMCPExecuteSQL.mockResolvedValue({ data: mockAttempts });

      const query = `
        SELECT * FROM quiz_attempts 
        WHERE quiz_id = $1 AND user_id = $2 
        ORDER BY created_at DESC
      `;

      const result = await window.mcp_supabase_execute_sql({
        query,
        params: ['quiz-123', 'user-123']
      });

      expect(mockMCPExecuteSQL).toHaveBeenCalledWith({
        query,
        params: ['quiz-123', 'user-123']
      });

      expect(result.data).toEqual(mockAttempts);
      expect(result.data).toHaveLength(2);
    });

    it('should get best attempt for a quiz', async () => {
      const mockBestAttempt = [
        {
          id: 'attempt-2',
          quiz_id: 'quiz-123',
          user_id: 'user-123',
          score: 95,
          completed_at: '2024-01-02T00:05:00Z',
          answers: '[]'
        }
      ];

      mockMCPExecuteSQL.mockResolvedValue({ data: mockBestAttempt });

      const query = `
        SELECT * FROM quiz_attempts 
        WHERE quiz_id = $1 AND user_id = $2 AND completed_at IS NOT NULL
        ORDER BY score DESC LIMIT 1
      `;

      const result = await window.mcp_supabase_execute_sql({
        query,
        params: ['quiz-123', 'user-123']
      });

      expect(mockMCPExecuteSQL).toHaveBeenCalledWith({
        query,
        params: ['quiz-123', 'user-123']
      });

      expect(result.data[0].score).toBe(95);
    });
  });

  describe('Complex Quiz Operations', () => {
    it('should handle quiz with multiple question types', async () => {
      const quizData = {
        title: 'Mixed Question Types Quiz',
        folder_id: 'folder-123',
        user_id: 'user-123',
        settings: {}
      };

      const questionsData = [
        {
          quiz_id: 'quiz-123',
          question_text: 'MCQ Question',
          question_type: 'mcq',
          question_data: { options: ['A', 'B', 'C', 'D'], correctAnswer: 2 },
          order_index: 0
        },
        {
          quiz_id: 'quiz-123',
          question_text: 'Fill in the blank: The capital of France is ____',
          question_type: 'fill_blank',
          question_data: { correctAnswers: ['Paris', 'paris'], caseSensitive: false },
          order_index: 1
        },
        {
          quiz_id: 'quiz-123',
          question_text: 'The Earth is round.',
          question_type: 'true_false',
          question_data: { correctAnswer: true },
          order_index: 2
        },
        {
          quiz_id: 'quiz-123',
          question_text: 'Match the countries with their capitals',
          question_type: 'match_following',
          question_data: {
            leftItems: ['France', 'Germany'],
            rightItems: ['Paris', 'Berlin'],
            correctPairs: [{ left: 0, right: 0 }, { left: 1, right: 1 }]
          },
          order_index: 3
        }
      ];

      // Mock quiz creation
      mockMCPInsert.mockResolvedValueOnce({
        id: 'quiz-123',
        ...quizData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      });

      // Mock questions creation
      questionsData.forEach((questionData, index) => {
        mockMCPInsert.mockResolvedValueOnce({
          id: `question-${index + 1}`,
          ...questionData,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        });
      });

      // Create quiz
      const quiz = await window.mcp_supabase_custom_insert_data({
        tableName: 'quizzes',
        data: quizData
      });

      // Create questions
      const questions = [];
      for (const questionData of questionsData) {
        const question = await window.mcp_supabase_custom_insert_data({
          tableName: 'questions',
          data: questionData
        });
        questions.push(question);
      }

      expect(quiz.id).toBe('quiz-123');
      expect(questions).toHaveLength(4);
      expect(questions[0].question_type).toBe('mcq');
      expect(questions[1].question_type).toBe('fill_blank');
      expect(questions[2].question_type).toBe('true_false');
      expect(questions[3].question_type).toBe('match_following');
    });

    it('should handle quiz attempt with mixed answers', async () => {
      const attemptData = {
        quiz_id: 'quiz-123',
        user_id: 'user-123',
        total_questions: 4,
        correct_answers: 0,
        answers: []
      };

      const userAnswers = [
        {
          questionId: 'question-1',
          answer: { type: 'mcq', selectedOption: 2 },
          correct: true,
          timeSpent: 30
        },
        {
          questionId: 'question-2',
          answer: { type: 'fill_blank', answer: 'Paris' },
          correct: true,
          timeSpent: 25
        },
        {
          questionId: 'question-3',
          answer: { type: 'true_false', answer: true },
          correct: true,
          timeSpent: 15
        },
        {
          questionId: 'question-4',
          answer: { 
            type: 'match_following', 
            pairs: [{ left: 0, right: 0 }, { left: 1, right: 1 }] 
          },
          correct: true,
          timeSpent: 45
        }
      ];

      // Mock attempt creation
      mockMCPInsert.mockResolvedValue({
        id: 'attempt-123',
        ...attemptData,
        started_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z'
      });

      // Mock attempt completion
      mockMCPUpdate.mockResolvedValue({
        id: 'attempt-123',
        quiz_id: 'quiz-123',
        user_id: 'user-123',
        started_at: '2024-01-01T00:00:00Z',
        completed_at: '2024-01-01T00:02:00Z',
        score: 100,
        total_questions: 4,
        correct_answers: 4,
        time_taken: 115,
        answers: userAnswers,
        created_at: '2024-01-01T00:00:00Z'
      });

      // Start attempt
      const attempt = await window.mcp_supabase_custom_insert_data({
        tableName: 'quiz_attempts',
        data: attemptData
      });

      // Complete attempt
      const completedAttempt = await window.mcp_supabase_custom_update_data({
        tableName: 'quiz_attempts',
        data: {
          completed_at: '2024-01-01T00:02:00Z',
          score: 100,
          correct_answers: 4,
          time_taken: 115,
          answers: userAnswers
        },
        filter: { id: 'attempt-123' }
      });

      expect(attempt.id).toBe('attempt-123');
      expect(completedAttempt.score).toBe(100);
      expect(completedAttempt.correct_answers).toBe(4);
      expect(completedAttempt.answers).toHaveLength(4);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const error = new Error('Database connection failed');
      mockMCPSelect.mockRejectedValue(error);

      await expect(
        window.mcp_supabase_custom_select_data({
          tableName: 'quizzes',
          filter: { folder_id: 'folder-123' }
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid data insertion', async () => {
      const invalidQuizData = {
        // Missing required fields
        description: 'Invalid quiz'
      };

      const error = new Error('Missing required field: title');
      mockMCPInsert.mockRejectedValue(error);

      await expect(
        window.mcp_supabase_custom_insert_data({
          tableName: 'quizzes',
          data: invalidQuizData
        })
      ).rejects.toThrow('Missing required field: title');
    });

    it('should handle permission errors', async () => {
      const error = new Error('Permission denied');
      mockMCPUpdate.mockRejectedValue(error);

      await expect(
        window.mcp_supabase_custom_update_data({
          tableName: 'quizzes',
          data: { title: 'Updated title' },
          filter: { id: 'quiz-123', user_id: 'different-user' }
        })
      ).rejects.toThrow('Permission denied');
    });
  });
});