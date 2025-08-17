/**
 * @fileoverview Optimized Quiz Service with Caching and Performance Enhancements
 * @description Service layer with caching, batch operations, and performance optimizations
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import { validateQuestionData, calculateQuizScore, QuizServiceError } from './quiz-service';
import type { Quiz, Question, QuizAttempt, QuizListItem } from '@/types/quiz';

// MCP function declarations
declare const mcp_supabase_custom_select_data: (params: { 
  tableName: string; 
  columns?: string; 
  filter?: any; 
  limit?: number 
}) => Promise<any[]>;

declare const mcp_supabase_custom_insert_data: (params: { 
  tableName: string; 
  data: any 
}) => Promise<any>;

declare const mcp_supabase_custom_update_data: (params: { 
  tableName: string; 
  data: any; 
  filter: any 
}) => Promise<any>;

declare const mcp_supabase_custom_delete_data: (params: { 
  tableName: string; 
  filter: any 
}) => Promise<any>;

// In-memory cache for frequently accessed data
class QuizCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

const quizCache = new QuizCache();

/**
 * Optimized Quiz Service with caching and batch operations
 */
export class OptimizedQuizService {
  /**
   * Batch fetch quizzes with their metadata
   */
  static async getQuizzesWithMetadata(folderId: string, userId: string): Promise<QuizListItem[]> {
    const cacheKey = `quizzes_${folderId}_${userId}`;
    const cached = quizCache.get(cacheKey);
    if (cached) return cached;

    try {
      // Fetch quizzes
      const quizzes = await mcp_supabase_custom_select_data({
        tableName: 'quizzes',
        columns: 'id, title, description, folder_id, user_id, settings, created_at, updated_at',
        filter: { folder_id: folderId, user_id: userId }
      });

      if (!quizzes || quizzes.length === 0) {
        quizCache.set(cacheKey, [], 2 * 60 * 1000); // Cache empty result for 2 minutes
        return [];
      }

      const quizIds = quizzes.map(q => q.id);

      // Batch fetch related data
      const [questionCounts, attemptStats] = await Promise.all([
        this.getQuestionCounts(quizIds),
        this.getAttemptStats(quizIds, userId)
      ]);

      // Combine data efficiently
      const result = quizzes.map(quiz => ({
        ...quiz,
        question_count: questionCounts.get(quiz.id) || 0,
        attempt_count: attemptStats.get(quiz.id)?.count || 0,
        last_attempt: attemptStats.get(quiz.id)?.lastAttempt
      }));

      quizCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching quizzes with metadata:', error);
      throw new QuizServiceError('Failed to fetch quizzes', 'NETWORK_ERROR', error);
    }
  }

  /**
   * Get question counts for multiple quizzes
   */
  private static async getQuestionCounts(quizIds: string[]): Promise<Map<string, number>> {
    const cacheKey = `question_counts_${quizIds.join(',')}`;
    const cached = quizCache.get(cacheKey);
    if (cached) return cached;

    const questions = await mcp_supabase_custom_select_data({
      tableName: 'questions',
      columns: 'quiz_id',
      filter: { quiz_id: { in: quizIds } }
    });

    const countMap = new Map<string, number>();
    questions?.forEach(q => {
      countMap.set(q.quiz_id, (countMap.get(q.quiz_id) || 0) + 1);
    });

    quizCache.set(cacheKey, countMap, 10 * 60 * 1000); // Cache for 10 minutes
    return countMap;
  }

  /**
   * Get attempt statistics for multiple quizzes
   */
  private static async getAttemptStats(quizIds: string[], userId: string): Promise<Map<string, { count: number; lastAttempt?: any }>> {
    const cacheKey = `attempt_stats_${quizIds.join(',')}_${userId}`;
    const cached = quizCache.get(cacheKey);
    if (cached) return cached;

    const attempts = await mcp_supabase_custom_select_data({
      tableName: 'quiz_attempts',
      columns: 'quiz_id, score, completed_at',
      filter: { 
        quiz_id: { in: quizIds }, 
        user_id: userId,
        completed_at: { not: null }
      }
    });

    const statsMap = new Map<string, { count: number; lastAttempt?: any }>();
    attempts?.forEach(attempt => {
      const existing = statsMap.get(attempt.quiz_id) || { count: 0 };
      existing.count++;
      if (!existing.lastAttempt || new Date(attempt.completed_at) > new Date(existing.lastAttempt.completed_at)) {
        existing.lastAttempt = {
          score: attempt.score,
          completed_at: attempt.completed_at
        };
      }
      statsMap.set(attempt.quiz_id, existing);
    });

    quizCache.set(cacheKey, statsMap, 5 * 60 * 1000); // Cache for 5 minutes
    return statsMap;
  }

  /**
   * Get quiz with questions (cached)
   */
  static async getQuizWithQuestions(quizId: string, userId: string): Promise<{ quiz: Quiz; questions: Question[] }> {
    const cacheKey = `quiz_with_questions_${quizId}_${userId}`;
    const cached = quizCache.get(cacheKey);
    if (cached) return cached;

    try {
      const [quizResult, questionsResult] = await Promise.all([
        mcp_supabase_custom_select_data({
          tableName: 'quizzes',
          columns: '*',
          filter: { id: quizId, user_id: userId },
          limit: 1
        }),
        mcp_supabase_custom_select_data({
          tableName: 'questions',
          columns: '*',
          filter: { quiz_id: quizId }
        })
      ]);

      if (!quizResult || quizResult.length === 0) {
        throw new QuizServiceError('Quiz not found', 'QUIZ_NOT_FOUND');
      }

      const quiz = quizResult[0];
      const questions = (questionsResult || []).sort((a, b) => a.order_index - b.order_index);

      const result = { quiz, questions };
      quizCache.set(cacheKey, result, 10 * 60 * 1000); // Cache for 10 minutes
      return result;
    } catch (error) {
      console.error('Error fetching quiz with questions:', error);
      throw error instanceof QuizServiceError ? error : new QuizServiceError('Failed to fetch quiz', 'NETWORK_ERROR', error);
    }
  }

  /**
   * Create quiz attempt with optimistic caching
   */
  static async createQuizAttempt(quizId: string, userId: string, totalQuestions: number): Promise<QuizAttempt> {
    try {
      const attempt = await mcp_supabase_custom_insert_data({
        tableName: 'quiz_attempts',
        data: {
          quiz_id: quizId,
          user_id: userId,
          total_questions: totalQuestions,
          correct_answers: 0,
          answers: [],
          started_at: new Date().toISOString()
        }
      });

      // Invalidate related caches
      quizCache.invalidate(`attempt_stats_${quizId}`);
      quizCache.invalidate(`quiz_stats_${quizId}`);

      return attempt;
    } catch (error) {
      console.error('Error creating quiz attempt:', error);
      throw new QuizServiceError('Failed to create quiz attempt', 'NETWORK_ERROR', error);
    }
  }

  /**
   * Complete quiz attempt with score calculation
   */
  static async completeQuizAttempt(
    attemptId: string,
    quiz: Quiz,
    questions: Question[],
    userAnswers: any[],
    startTime: Date
  ): Promise<QuizAttempt> {
    try {
      // Calculate score
      const { score, correctAnswers } = calculateQuizScore(questions, userAnswers);
      const timeTaken = Math.round((Date.now() - startTime.getTime()) / 1000); // in seconds

      const completedAttempt = await mcp_supabase_custom_update_data({
        tableName: 'quiz_attempts',
        data: {
          completed_at: new Date().toISOString(),
          score: score,
          correct_answers: correctAnswers,
          time_taken: timeTaken,
          answers: userAnswers
        },
        filter: { id: attemptId }
      });

      // Invalidate related caches
      quizCache.invalidate(`attempt_stats_${quiz.id}`);
      quizCache.invalidate(`quiz_stats_${quiz.id}`);
      quizCache.invalidate(`quizzes_${quiz.folder_id}`);

      return completedAttempt;
    } catch (error) {
      console.error('Error completing quiz attempt:', error);
      throw new QuizServiceError('Failed to complete quiz attempt', 'NETWORK_ERROR', error);
    }
  }

  /**
   * Get paginated quiz attempts
   */
  static async getQuizAttempts(
    quizId: string, 
    userId: string, 
    page: number = 0, 
    pageSize: number = 10
  ): Promise<{ attempts: QuizAttempt[]; hasMore: boolean; total: number }> {
    const cacheKey = `quiz_attempts_${quizId}_${userId}_${page}_${pageSize}`;
    const cached = quizCache.get(cacheKey);
    if (cached) return cached;

    try {
      // Get all attempts (we'll paginate on client side for simplicity with MCP)
      const allAttempts = await mcp_supabase_custom_select_data({
        tableName: 'quiz_attempts',
        columns: '*',
        filter: { 
          quiz_id: quizId, 
          user_id: userId,
          completed_at: { not: null }
        }
      });

      // Sort by completed_at descending
      const sortedAttempts = (allAttempts || [])
        .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

      const total = sortedAttempts.length;
      const from = page * pageSize;
      const to = from + pageSize;
      const pageAttempts = sortedAttempts.slice(from, to);

      const result = {
        attempts: pageAttempts,
        hasMore: total > to,
        total
      };

      quizCache.set(cacheKey, result, 2 * 60 * 1000); // Cache for 2 minutes
      return result;
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
      throw new QuizServiceError('Failed to fetch quiz attempts', 'NETWORK_ERROR', error);
    }
  }

  /**
   * Invalidate cache for a specific quiz
   */
  static invalidateQuizCache(quizId: string): void {
    quizCache.invalidate(quizId);
  }

  /**
   * Clear all cache
   */
  static clearCache(): void {
    quizCache.clear();
  }

  /**
   * Preload quiz data for better UX
   */
  static async preloadQuizData(quizId: string, userId: string): Promise<void> {
    try {
      // Preload quiz with questions in background
      this.getQuizWithQuestions(quizId, userId).catch(console.error);
      
      // Preload attempt history
      this.getQuizAttempts(quizId, userId, 0, 5).catch(console.error);
    } catch (error) {
      // Ignore preload errors
      console.debug('Preload error (non-critical):', error);
    }
  }
}

export default OptimizedQuizService;