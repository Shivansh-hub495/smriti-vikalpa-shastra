/**
 * @fileoverview Quiz Attempt Service for managing quiz attempts and scoring
 * @description Service layer for quiz attempt operations including creation, completion, and history
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import type {
  Quiz,
  Question,
  QuizAttempt,
  QuestionAnswer,
  QuizAttemptStats,
  QuizResults
} from '@/types/quiz';
import { calculateQuizScore, createQuizResults, calculateQuizStats, isAnswerCorrect } from '@/utils/quizUtils';

/**
 * Custom error class for quiz attempt operations
 */
export class QuizAttemptError extends Error {
  constructor(
    message: string,
    public code: 'ATTEMPT_NOT_FOUND' | 'INVALID_DATA' | 'PERMISSION_DENIED' | 'NETWORK_ERROR' | 'UNKNOWN',
    public details?: any
  ) {
    super(message);
    this.name = 'QuizAttemptError';
  }
}

/**
 * Service class for quiz attempt operations
 */
export class QuizAttemptService {
  /**
   * Starts a new quiz attempt
   * @param quizId - ID of the quiz to attempt
   * @param userId - ID of the user taking the quiz
   * @param totalQuestions - Total number of questions in the quiz
   * @returns Promise resolving to the created quiz attempt
   */
  static async startAttempt(quizId: string, userId: string, totalQuestions: number): Promise<QuizAttempt> {
    try {
      const { mcp_supabase_custom_insert_data } = window as any;
      
      const attemptData = {
        quiz_id: quizId,
        user_id: userId,
        started_at: new Date().toISOString(),
        total_questions: totalQuestions,
        correct_answers: 0,
        answers: JSON.stringify([])
      };

      const result = await mcp_supabase_custom_insert_data({
        tableName: 'quiz_attempts',
        data: attemptData
      });

      return {
        ...result,
        answers: []
      } as QuizAttempt;

    } catch (error) {
      console.error('Error starting quiz attempt:', error);
      throw new QuizAttemptError('Failed to start quiz attempt', 'NETWORK_ERROR', error);
    }
  }

  /**
   * Completes a quiz attempt with scoring
   * @param attemptId - ID of the attempt to complete
   * @param quiz - The quiz that was taken
   * @param questions - Questions from the quiz
   * @param userAnswers - User's answers to the questions
   * @param startTime - When the quiz was started
   * @returns Promise resolving to the completed quiz attempt
   */
  static async completeAttempt(
    attemptId: string,
    quiz: Quiz,
    questions: Question[],
    userAnswers: QuestionAnswer[],
    startTime: Date
  ): Promise<QuizAttempt> {
    try {
      const endTime = new Date();
      const totalTimeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      // Score all answers
      const scoredAnswers = userAnswers.map(answer => {
        const question = questions.find(q => q.id === answer.questionId);
        if (!question) return { ...answer, correct: false };

        const isCorrect = isAnswerCorrect(question, answer.answer);
        return { ...answer, correct: isCorrect };
      });

      // Calculate final score
      const scoreResult = calculateQuizScore(questions, scoredAnswers);

      const { mcp_supabase_custom_update_data } = window as any;
      
      const updateData = {
        completed_at: endTime.toISOString(),
        score: scoreResult.score,
        correct_answers: scoreResult.correctCount,
        time_taken: totalTimeSpent,
        answers: JSON.stringify(scoredAnswers)
      };

      const result = await mcp_supabase_custom_update_data({
        tableName: 'quiz_attempts',
        data: updateData,
        filter: { id: attemptId }
      });

      return {
        ...result,
        answers: scoredAnswers
      } as QuizAttempt;

    } catch (error) {
      console.error('Error completing quiz attempt:', error);
      throw new QuizAttemptError('Failed to complete quiz attempt', 'NETWORK_ERROR', error);
    }
  }

  /**
   * Gets quiz attempts for a specific quiz and/or user
   * @param quizId - ID of the quiz (optional)
   * @param userId - ID of the user (optional)
   * @param limit - Maximum number of attempts to return
   * @returns Promise resolving to array of quiz attempts
   */
  static async getAttempts(quizId?: string, userId?: string, limit?: number): Promise<QuizAttempt[]> {
    try {
      const { mcp_supabase_execute_sql } = window as any;
      
      let query = 'SELECT * FROM quiz_attempts WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (quizId) {
        query += ` AND quiz_id = $${paramIndex}`;
        params.push(quizId);
        paramIndex++;
      }

      if (userId) {
        query += ` AND user_id = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
      }

      query += ' ORDER BY created_at DESC';

      if (limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(limit);
      }

      const response = await mcp_supabase_execute_sql({
        query,
        params
      });

      if (!response.data) return [];

      return response.data.map((attempt: any) => ({
        ...attempt,
        answers: typeof attempt.answers === 'string' 
          ? JSON.parse(attempt.answers) 
          : attempt.answers || []
      })) as QuizAttempt[];

    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
      throw new QuizAttemptError('Failed to fetch quiz attempts', 'NETWORK_ERROR', error);
    }
  }

  /**
   * Gets a specific quiz attempt by ID
   * @param attemptId - ID of the attempt to retrieve
   * @returns Promise resolving to the quiz attempt or null if not found
   */
  static async getAttemptById(attemptId: string): Promise<QuizAttempt | null> {
    try {
      const { mcp_supabase_custom_select_data } = window as any;
      
      const result = await mcp_supabase_custom_select_data({
        tableName: 'quiz_attempts',
        columns: '*',
        filter: { id: attemptId }
      });

      if (!result || result.length === 0) return null;

      const attempt = result[0];
      return {
        ...attempt,
        answers: typeof attempt.answers === 'string' 
          ? JSON.parse(attempt.answers) 
          : attempt.answers || []
      } as QuizAttempt;

    } catch (error) {
      console.error('Error fetching quiz attempt:', error);
      throw new QuizAttemptError('Failed to fetch quiz attempt', 'NETWORK_ERROR', error);
    }
  }

  /**
   * Gets quiz attempt statistics for a user and quiz
   * @param quizId - ID of the quiz
   * @param userId - ID of the user
   * @param passingScore - Optional passing score threshold
   * @returns Promise resolving to quiz attempt statistics
   */
  static async getAttemptStats(quizId: string, userId: string, passingScore?: number): Promise<QuizAttemptStats> {
    try {
      const attempts = await this.getAttempts(quizId, userId);
      return calculateQuizStats(attempts, passingScore);
    } catch (error) {
      console.error('Error calculating quiz stats:', error);
      throw new QuizAttemptError('Failed to calculate quiz statistics', 'NETWORK_ERROR', error);
    }
  }

  /**
   * Creates detailed quiz results from an attempt
   * @param quiz - The quiz that was taken
   * @param questions - Questions from the quiz
   * @param attempt - The completed quiz attempt
   * @returns Detailed quiz results
   */
  static createDetailedResults(quiz: Quiz, questions: Question[], attempt: QuizAttempt): QuizResults {
    return createQuizResults(quiz, questions, attempt);
  }

  /**
   * Deletes a quiz attempt
   * @param attemptId - ID of the attempt to delete
   * @param userId - ID of the user (for permission check)
   * @returns Promise resolving when deletion is complete
   */
  static async deleteAttempt(attemptId: string, userId: string): Promise<void> {
    try {
      const { mcp_supabase_custom_delete_data } = window as any;
      
      await mcp_supabase_custom_delete_data({
        tableName: 'quiz_attempts',
        filter: { id: attemptId, user_id: userId }
      });

    } catch (error) {
      console.error('Error deleting quiz attempt:', error);
      throw new QuizAttemptError('Failed to delete quiz attempt', 'NETWORK_ERROR', error);
    }
  }

  /**
   * Gets the best attempt for a user on a specific quiz
   * @param quizId - ID of the quiz
   * @param userId - ID of the user
   * @returns Promise resolving to the best attempt or null
   */
  static async getBestAttempt(quizId: string, userId: string): Promise<QuizAttempt | null> {
    try {
      const { mcp_supabase_execute_sql } = window as any;
      
      const response = await mcp_supabase_execute_sql({
        query: `
          SELECT * FROM quiz_attempts 
          WHERE quiz_id = $1 AND user_id = $2 AND completed_at IS NOT NULL
          ORDER BY score DESC, completed_at ASC
          LIMIT 1
        `,
        params: [quizId, userId]
      });

      if (!response.data || response.data.length === 0) return null;

      const attempt = response.data[0];
      return {
        ...attempt,
        answers: typeof attempt.answers === 'string' 
          ? JSON.parse(attempt.answers) 
          : attempt.answers || []
      } as QuizAttempt;

    } catch (error) {
      console.error('Error fetching best attempt:', error);
      throw new QuizAttemptError('Failed to fetch best attempt', 'NETWORK_ERROR', error);
    }
  }

  /**
   * Gets the most recent attempt for a user on a specific quiz
   * @param quizId - ID of the quiz
   * @param userId - ID of the user
   * @returns Promise resolving to the most recent attempt or null
   */
  static async getLatestAttempt(quizId: string, userId: string): Promise<QuizAttempt | null> {
    try {
      const { mcp_supabase_execute_sql } = window as any;
      
      const response = await mcp_supabase_execute_sql({
        query: `
          SELECT * FROM quiz_attempts 
          WHERE quiz_id = $1 AND user_id = $2
          ORDER BY created_at DESC
          LIMIT 1
        `,
        params: [quizId, userId]
      });

      if (!response.data || response.data.length === 0) return null;

      const attempt = response.data[0];
      return {
        ...attempt,
        answers: typeof attempt.answers === 'string' 
          ? JSON.parse(attempt.answers) 
          : attempt.answers || []
      } as QuizAttempt;

    } catch (error) {
      console.error('Error fetching latest attempt:', error);
      throw new QuizAttemptError('Failed to fetch latest attempt', 'NETWORK_ERROR', error);
    }
  }
}

export default QuizAttemptService;