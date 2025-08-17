/**
 * @fileoverview React Hook for Quiz Operations using MCP Tools
 * @description Example hook showing how to use Supabase MCP tools for quiz operations
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';
import { validateQuizData, validateQuestionData, calculateQuizScore, QuizServiceError } from '@/lib/quiz-service';
import type { Quiz, Question, QuizAttempt, CreateQuizRequest, CreateQuestionRequest } from '@/types/quiz';

// Note: These MCP functions would be imported from your MCP integration
// For now, they're typed as placeholders
declare const mcp_supabase_custom_insert_data: (params: { tableName: string; data: any }) => Promise<any>;
declare const mcp_supabase_custom_select_data: (params: { tableName: string; columns?: string; filter?: any; limit?: number }) => Promise<any[]>;
declare const mcp_supabase_custom_update_data: (params: { tableName: string; data: any; filter: any }) => Promise<any>;
declare const mcp_supabase_custom_delete_data: (params: { tableName: string; filter: any }) => Promise<any>;

interface UseQuizMCPReturn {
  // State
  loading: boolean;
  error: string | null;

  // Quiz operations
  createQuiz: (data: CreateQuizRequest) => Promise<Quiz>;
  getQuizById: (quizId: string) => Promise<Quiz | null>;
  getQuizzesByFolder: (folderId: string) => Promise<Quiz[]>;
  updateQuiz: (quizId: string, data: Partial<CreateQuizRequest>) => Promise<Quiz>;
  deleteQuiz: (quizId: string) => Promise<void>;

  // Question operations
  createQuestion: (data: CreateQuestionRequest) => Promise<Question>;
  getQuestionsByQuizId: (quizId: string) => Promise<Question[]>;
  updateQuestion: (questionId: string, data: Partial<CreateQuestionRequest>) => Promise<Question>;
  deleteQuestion: (questionId: string) => Promise<void>;

  // Quiz attempt operations
  startQuizAttempt: (quizId: string, totalQuestions: number) => Promise<QuizAttempt>;
  completeQuizAttempt: (attemptId: string, questions: Question[], userAnswers: any[]) => Promise<QuizAttempt>;
  getQuizAttempts: (quizId?: string, userId?: string) => Promise<QuizAttempt[]>;

  // Utility functions
  clearError: () => void;
}

export const useQuizMCP = (): UseQuizMCPReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: any) => {
    console.error('Quiz operation error:', err);
    if (err instanceof QuizServiceError) {
      setError(err.message);
    } else {
      setError(err?.message || 'An unknown error occurred');
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Quiz operations
  const createQuiz = useCallback(async (data: CreateQuizRequest): Promise<Quiz> => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate data
      const validation = validateQuizData(data);
      if (!validation.isValid) {
        throw new QuizServiceError(validation.errors.join(', '), 'INVALID_DATA');
      }

      const result = await mcp_supabase_custom_insert_data({
        tableName: 'quizzes',
        data: {
          title: data.title.trim(),
          description: data.description?.trim() || null,
          folder_id: data.folder_id,
          settings: data.settings || {}
        }
      });

      return result as Quiz;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getQuizById = useCallback(async (quizId: string): Promise<Quiz | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mcp_supabase_custom_select_data({
        tableName: 'quizzes',
        columns: '*',
        filter: { id: quizId }
      });

      return result.length > 0 ? result[0] as Quiz : null;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getQuizzesByFolder = useCallback(async (folderId: string): Promise<Quiz[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mcp_supabase_custom_select_data({
        tableName: 'quizzes',
        columns: '*',
        filter: { folder_id: folderId }
      });

      return result as Quiz[];
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const updateQuiz = useCallback(async (quizId: string, data: Partial<CreateQuizRequest>): Promise<Quiz> => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate data
      const validation = validateQuizData(data);
      if (!validation.isValid) {
        throw new QuizServiceError(validation.errors.join(', '), 'INVALID_DATA');
      }

      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title.trim();
      if (data.description !== undefined) updateData.description = data.description?.trim() || null;
      if (data.settings !== undefined) updateData.settings = data.settings;

      const result = await mcp_supabase_custom_update_data({
        tableName: 'quizzes',
        data: updateData,
        filter: { id: quizId }
      });

      return result as Quiz;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const deleteQuiz = useCallback(async (quizId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await mcp_supabase_custom_delete_data({
        tableName: 'quizzes',
        filter: { id: quizId }
      });
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Question operations
  const createQuestion = useCallback(async (data: CreateQuestionRequest): Promise<Question> => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate question data
      validateQuestionData(data.question_type, data.question_data);

      const result = await mcp_supabase_custom_insert_data({
        tableName: 'questions',
        data: {
          quiz_id: data.quiz_id,
          question_text: data.question_text.trim(),
          question_type: data.question_type,
          question_data: data.question_data,
          explanation: data.explanation?.trim() || null,
          order_index: data.order_index
        }
      });

      return result as Question;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getQuestionsByQuizId = useCallback(async (quizId: string): Promise<Question[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mcp_supabase_custom_select_data({
        tableName: 'questions',
        columns: '*',
        filter: { quiz_id: quizId }
      });

      // Sort by order_index
      return (result as Question[]).sort((a, b) => a.order_index - b.order_index);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const updateQuestion = useCallback(async (questionId: string, data: Partial<CreateQuestionRequest>): Promise<Question> => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate question data if provided
      if (data.question_type && data.question_data) {
        validateQuestionData(data.question_type, data.question_data);
      }

      const updateData: any = {};
      if (data.question_text !== undefined) updateData.question_text = data.question_text.trim();
      if (data.question_type !== undefined) updateData.question_type = data.question_type;
      if (data.question_data !== undefined) updateData.question_data = data.question_data;
      if (data.explanation !== undefined) updateData.explanation = data.explanation?.trim() || null;
      if (data.order_index !== undefined) updateData.order_index = data.order_index;

      const result = await mcp_supabase_custom_update_data({
        tableName: 'questions',
        data: updateData,
        filter: { id: questionId }
      });

      return result as Question;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const deleteQuestion = useCallback(async (questionId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await mcp_supabase_custom_delete_data({
        tableName: 'questions',
        filter: { id: questionId }
      });
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Quiz attempt operations
  const startQuizAttempt = useCallback(async (quizId: string, totalQuestions: number): Promise<QuizAttempt> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mcp_supabase_custom_insert_data({
        tableName: 'quiz_attempts',
        data: {
          quiz_id: quizId,
          total_questions: totalQuestions,
          correct_answers: 0,
          answers: []
        }
      });

      return result as QuizAttempt;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const completeQuizAttempt = useCallback(async (
    attemptId: string, 
    questions: Question[], 
    userAnswers: any[]
  ): Promise<QuizAttempt> => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculate score using utility function
      const { score, correctAnswers } = calculateQuizScore(questions, userAnswers);

      const result = await mcp_supabase_custom_update_data({
        tableName: 'quiz_attempts',
        data: {
          completed_at: new Date().toISOString(),
          score: score,
          correct_answers: correctAnswers,
          answers: userAnswers
        },
        filter: { id: attemptId }
      });

      return result as QuizAttempt;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getQuizAttempts = useCallback(async (quizId?: string, userId?: string): Promise<QuizAttempt[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const filter: any = {};
      if (quizId) filter.quiz_id = quizId;
      if (userId) filter.user_id = userId;

      const result = await mcp_supabase_custom_select_data({
        tableName: 'quiz_attempts',
        columns: '*',
        filter: filter
      });

      return result as QuizAttempt[];
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  return {
    loading,
    error,
    createQuiz,
    getQuizById,
    getQuizzesByFolder,
    updateQuiz,
    deleteQuiz,
    createQuestion,
    getQuestionsByQuizId,
    updateQuestion,
    deleteQuestion,
    startQuizAttempt,
    completeQuizAttempt,
    getQuizAttempts,
    clearError
  };
};