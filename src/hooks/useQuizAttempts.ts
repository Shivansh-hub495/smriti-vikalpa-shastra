/**
 * @fileoverview React Hook for Quiz Attempt Operations
 * @description Hook for managing quiz attempts including creation, completion, and history
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import QuizAttemptService, { QuizAttemptError } from '@/lib/quiz-attempt-service';
import type { 
  Quiz, 
  Question, 
  QuizAttempt, 
  QuestionAnswer, 
  QuizAttemptStats,
  QuizResults,
  UseQuizAttemptsReturn 
} from '@/types/quiz';

/**
 * Hook for managing quiz attempts
 */
export const useQuizAttempts = (): UseQuizAttemptsReturn => {
  const { toast } = useToast();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: any) => {
    console.error('Quiz attempt operation error:', err);
    if (err instanceof QuizAttemptError) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } else {
      const message = err?.message || 'An unknown error occurred';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load attempts for a quiz/user
  const loadAttempts = useCallback(async (quizId?: string, userId?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loadedAttempts = await QuizAttemptService.getAttempts(quizId, userId);
      setAttempts(loadedAttempts);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Start a new quiz attempt
  const startAttempt = useCallback(async (quizId: string, userId: string, totalQuestions: number): Promise<QuizAttempt> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const attempt = await QuizAttemptService.startAttempt(quizId, userId, totalQuestions);
      setCurrentAttempt(attempt);
      
      toast({
        title: "Quiz Started",
        description: "Good luck with your quiz!",
      });
      
      return attempt;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, toast]);

  // Complete a quiz attempt
  const completeAttempt = useCallback(async (
    attemptId: string,
    quiz: Quiz,
    questions: Question[],
    userAnswers: QuestionAnswer[],
    startTime: Date
  ): Promise<QuizAttempt> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const completedAttempt = await QuizAttemptService.completeAttempt(
        attemptId,
        quiz,
        questions,
        userAnswers,
        startTime
      );
      
      setCurrentAttempt(completedAttempt);
      
      // Update attempts list if it includes this attempt
      setAttempts(prev => {
        const index = prev.findIndex(a => a.id === attemptId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = completedAttempt;
          return updated;
        }
        return [completedAttempt, ...prev];
      });

      toast({
        title: "Quiz Completed!",
        description: `You scored ${completedAttempt.score?.toFixed(1)}% (${completedAttempt.correct_answers}/${completedAttempt.total_questions} correct)`,
      });
      
      return completedAttempt;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, toast]);

  // Get attempt statistics
  const getAttemptStats = useCallback(async (quizId: string, userId?: string): Promise<QuizAttemptStats> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const stats = await QuizAttemptService.getAttemptStats(quizId, userId || 'current_user_id');
      return stats;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Get a specific attempt by ID
  const getAttemptById = useCallback(async (attemptId: string): Promise<QuizAttempt | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const attempt = await QuizAttemptService.getAttemptById(attemptId);
      return attempt;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Get best attempt for a quiz
  const getBestAttempt = useCallback(async (quizId: string, userId?: string): Promise<QuizAttempt | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const attempt = await QuizAttemptService.getBestAttempt(quizId, userId || 'current_user_id');
      return attempt;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Get latest attempt for a quiz
  const getLatestAttempt = useCallback(async (quizId: string, userId?: string): Promise<QuizAttempt | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const attempt = await QuizAttemptService.getLatestAttempt(quizId, userId || 'current_user_id');
      return attempt;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Delete an attempt
  const deleteAttempt = useCallback(async (attemptId: string, userId?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await QuizAttemptService.deleteAttempt(attemptId, userId || 'current_user_id');
      
      // Remove from local state
      setAttempts(prev => prev.filter(a => a.id !== attemptId));
      
      if (currentAttempt?.id === attemptId) {
        setCurrentAttempt(null);
      }

      toast({
        title: "Attempt Deleted",
        description: "Quiz attempt has been deleted successfully.",
      });
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [handleError, currentAttempt?.id, toast]);

  // Create detailed results
  const createDetailedResults = useCallback((
    quiz: Quiz,
    questions: Question[],
    attempt: QuizAttempt
  ): QuizResults => {
    return QuizAttemptService.createDetailedResults(quiz, questions, attempt);
  }, []);

  return {
    // State
    attempts,
    currentAttempt,
    isLoading,
    error,

    // Actions
    loadAttempts,
    startAttempt,
    completeAttempt,
    getAttemptStats,
    getAttemptById,
    getBestAttempt,
    getLatestAttempt,
    deleteAttempt,
    createDetailedResults,
    clearError
  };
};

export default useQuizAttempts;