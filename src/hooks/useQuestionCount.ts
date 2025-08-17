/**
 * @fileoverview useQuestionCount hook for fetching quiz question count
 * @description Hook for retrieving the total number of questions in a quiz
 * @author Quiz Question Management System
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UseQuestionCountResult {
  /** Total number of questions */
  count: number;
  /** Whether the count is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Function to refresh the count */
  refreshCount: () => void;
}

/**
 * Hook for fetching question count for a quiz
 */
export const useQuestionCount = (quizId?: string): UseQuestionCountResult => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCount = async () => {
    if (!quizId || !user) {
      setCount(0);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { count: questionCount, error: countError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quizId);

      if (countError) {
        throw new Error(`Failed to fetch question count: ${countError.message}`);
      }

      setCount(questionCount || 0);
    } catch (err) {
      console.error('Error fetching question count:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch question count');
      setCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
  }, [quizId, user?.id]);

  const refreshCount = () => {
    fetchCount();
  };

  return {
    count,
    isLoading,
    error,
    refreshCount
  };
};

export default useQuestionCount;