/**
 * @fileoverview React Query hooks for Quiz operations with caching
 * @description Optimized hooks using React Query for quiz data fetching and caching
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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

// Query keys for consistent caching
export const QUIZ_QUERY_KEYS = {
  all: ['quizzes'] as const,
  lists: () => [...QUIZ_QUERY_KEYS.all, 'list'] as const,
  list: (folderId: string) => [...QUIZ_QUERY_KEYS.lists(), folderId] as const,
  details: () => [...QUIZ_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUIZ_QUERY_KEYS.details(), id] as const,
  questions: (quizId: string) => [...QUIZ_QUERY_KEYS.detail(quizId), 'questions'] as const,
  attempts: () => [...QUIZ_QUERY_KEYS.all, 'attempts'] as const,
  attemptsByQuiz: (quizId: string) => [...QUIZ_QUERY_KEYS.attempts(), quizId] as const,
  attemptsByUser: (userId: string) => [...QUIZ_QUERY_KEYS.attempts(), 'user', userId] as const,
  stats: (quizId: string) => [...QUIZ_QUERY_KEYS.detail(quizId), 'stats'] as const,
};

// Cache configuration
const CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  refetchOnWindowFocus: false,
  retry: 2,
};

/**
 * Hook to fetch quizzes in a folder with caching using Supabase MCP
 */
export const useQuizzesInFolder = (folderId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUIZ_QUERY_KEYS.list(folderId),
    queryFn: async (): Promise<QuizListItem[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Use Supabase MCP to fetch quizzes
      const quizzes = await mcp_supabase_custom_select_data({
        tableName: 'quizzes',
        columns: 'id, title, description, folder_id, user_id, settings, created_at, updated_at',
        filter: { folder_id: folderId, user_id: user.id }
      });

      if (!quizzes || quizzes.length === 0) return [];

      const quizIds = quizzes.map((q: any) => q.id);

      // Get question counts for all quizzes in parallel
      const [questionCounts, attemptStats] = await Promise.all([
        mcp_supabase_custom_select_data({
          tableName: 'questions',
          columns: 'quiz_id',
          filter: { quiz_id: { in: quizIds } }
        }),
        mcp_supabase_custom_select_data({
          tableName: 'quiz_attempts',
          columns: 'quiz_id, score, completed_at',
          filter: { 
            quiz_id: { in: quizIds }, 
            user_id: user.id,
            completed_at: { not: null }
          }
        })
      ]);

      // Process the data efficiently
      const questionCountMap = new Map<string, number>();
      questionCounts?.forEach((q: any) => {
        questionCountMap.set(q.quiz_id, (questionCountMap.get(q.quiz_id) || 0) + 1);
      });

      const attemptStatsMap = new Map<string, { count: number; lastAttempt?: { score: number; completed_at: string } }>();
      attemptStats?.forEach((attempt: any) => {
        const existing = attemptStatsMap.get(attempt.quiz_id) || { count: 0 };
        existing.count++;
        if (!existing.lastAttempt || new Date(attempt.completed_at) > new Date(existing.lastAttempt.completed_at)) {
          existing.lastAttempt = {
            score: attempt.score,
            completed_at: attempt.completed_at
          };
        }
        attemptStatsMap.set(attempt.quiz_id, existing);
      });

      return quizzes.map((quiz: any) => ({
        ...quiz,
        question_count: questionCountMap.get(quiz.id) || 0,
        attempt_count: attemptStatsMap.get(quiz.id)?.count || 0,
        last_attempt: attemptStatsMap.get(quiz.id)?.lastAttempt
      }));
    },
    enabled: !!user?.id && !!folderId,
    ...CACHE_CONFIG,
  });
};

/**
 * Hook to fetch a single quiz with caching using Supabase MCP
 */
export const useQuiz = (quizId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUIZ_QUERY_KEYS.detail(quizId),
    queryFn: async (): Promise<Quiz> => {
      if (!user?.id) throw new Error('User not authenticated');

      const result = await mcp_supabase_custom_select_data({
        tableName: 'quizzes',
        columns: '*',
        filter: { id: quizId, user_id: user.id },
        limit: 1
      });

      if (!result || result.length === 0) {
        throw new Error('Quiz not found');
      }

      return result[0];
    },
    enabled: !!user?.id && !!quizId,
    ...CACHE_CONFIG,
  });
};

/**
 * Hook to fetch questions for a quiz with caching using Supabase MCP
 */
export const useQuizQuestions = (quizId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUIZ_QUERY_KEYS.questions(quizId),
    queryFn: async (): Promise<Question[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      const result = await mcp_supabase_custom_select_data({
        tableName: 'questions',
        columns: '*',
        filter: { quiz_id: quizId }
      });

      // Sort by order_index on client side since MCP doesn't support ordering
      return (result || []).sort((a: any, b: any) => a.order_index - b.order_index);
    },
    enabled: !!user?.id && !!quizId,
    ...CACHE_CONFIG,
  });
};

/**
 * Hook to fetch quiz attempts with pagination using Supabase MCP
 */
export const useQuizAttempts = (quizId: string, pageSize: number = 10) => {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: QUIZ_QUERY_KEYS.attemptsByQuiz(quizId),
    queryFn: async ({ pageParam = 0 }): Promise<{ attempts: QuizAttempt[]; hasMore: boolean }> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get total count first
      const allAttempts = await mcp_supabase_custom_select_data({
        tableName: 'quiz_attempts',
        columns: '*',
        filter: { 
          quiz_id: quizId, 
          user_id: user.id,
          completed_at: { not: null }
        }
      });

      // Sort by completed_at descending and paginate on client side
      const sortedAttempts = (allAttempts || [])
        .sort((a: any, b: any) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

      const from = pageParam * pageSize;
      const to = from + pageSize;
      const pageAttempts = sortedAttempts.slice(from, to);

      return {
        attempts: pageAttempts,
        hasMore: sortedAttempts.length > to
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
    enabled: !!user?.id && !!quizId,
    ...CACHE_CONFIG,
  });
};

/**
 * Hook to fetch quiz statistics using Supabase MCP
 */
export const useQuizStats = (quizId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: QUIZ_QUERY_KEYS.stats(quizId),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const attempts = await mcp_supabase_custom_select_data({
        tableName: 'quiz_attempts',
        columns: 'score, completed_at, time_taken',
        filter: { 
          quiz_id: quizId, 
          user_id: user.id,
          completed_at: { not: null }
        }
      });

      if (!attempts || attempts.length === 0) {
        return {
          totalAttempts: 0,
          averageScore: 0,
          bestScore: 0,
          averageTime: 0,
          lastAttempt: null
        };
      }

      const scores = attempts.map((a: any) => a.score).filter((s: any) => s !== null);
      const times = attempts.map((a: any) => a.time_taken).filter((t: any) => t !== null);
      
      // Sort by completed_at descending to get latest attempt
      const sortedAttempts = attempts.sort((a: any, b: any) => 
        new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      );
      
      return {
        totalAttempts: attempts.length,
        averageScore: scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0,
        bestScore: scores.length > 0 ? Math.max(...scores) : 0,
        averageTime: times.length > 0 ? times.reduce((a: number, b: number) => a + b, 0) / times.length : 0,
        lastAttempt: sortedAttempts[0]
      };
    },
    enabled: !!user?.id && !!quizId,
    ...CACHE_CONFIG,
  });
};

/**
 * Mutation hook for creating a quiz with optimistic updates using Supabase MCP
 */
export const useCreateQuiz = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { title: string; description?: string; folder_id: string; settings?: any }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const quiz = await mcp_supabase_custom_insert_data({
        tableName: 'quizzes',
        data: {
          ...data,
          user_id: user.id
        }
      });

      return quiz;
    },
    onMutate: async (newQuiz) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUIZ_QUERY_KEYS.list(newQuiz.folder_id) });

      // Snapshot previous value
      const previousQuizzes = queryClient.getQueryData(QUIZ_QUERY_KEYS.list(newQuiz.folder_id));

      // Optimistically update
      const optimisticQuiz: QuizListItem = {
        id: 'temp-' + Date.now(),
        title: newQuiz.title,
        description: newQuiz.description,
        folder_id: newQuiz.folder_id,
        user_id: user?.id || '',
        settings: newQuiz.settings || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        question_count: 0,
        attempt_count: 0
      };

      queryClient.setQueryData(
        QUIZ_QUERY_KEYS.list(newQuiz.folder_id),
        (old: QuizListItem[] = []) => [optimisticQuiz, ...old]
      );

      return { previousQuizzes };
    },
    onError: (err, newQuiz, context) => {
      // Rollback on error
      if (context?.previousQuizzes) {
        queryClient.setQueryData(QUIZ_QUERY_KEYS.list(newQuiz.folder_id), context.previousQuizzes);
      }
      toast({
        title: "Error",
        description: "Failed to create quiz",
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: QUIZ_QUERY_KEYS.list(variables.folder_id) });
      toast({
        title: "Success",
        description: "Quiz created successfully",
      });
    },
  });
};

/**
 * Mutation hook for updating a quiz with optimistic updates using Supabase MCP
 */
export const useUpdateQuiz = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ quizId, data }: { quizId: string; data: Partial<Quiz> }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const quiz = await mcp_supabase_custom_update_data({
        tableName: 'quizzes',
        data: data,
        filter: { id: quizId, user_id: user.id }
      });

      return quiz;
    },
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(QUIZ_QUERY_KEYS.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: QUIZ_QUERY_KEYS.list(data.folder_id) });
      toast({
        title: "Success",
        description: "Quiz updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update quiz",
        variant: "destructive",
      });
    },
  });
};

/**
 * Mutation hook for deleting a quiz with optimistic updates using Supabase MCP
 */
export const useDeleteQuiz = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ quizId, folderId }: { quizId: string; folderId: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      await mcp_supabase_custom_delete_data({
        tableName: 'quizzes',
        filter: { id: quizId, user_id: user.id }
      });

      return { quizId, folderId };
    },
    onMutate: async ({ quizId, folderId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUIZ_QUERY_KEYS.list(folderId) });

      // Snapshot previous value
      const previousQuizzes = queryClient.getQueryData(QUIZ_QUERY_KEYS.list(folderId));

      // Optimistically update
      queryClient.setQueryData(
        QUIZ_QUERY_KEYS.list(folderId),
        (old: QuizListItem[] = []) => old.filter(quiz => quiz.id !== quizId)
      );

      return { previousQuizzes };
    },
    onError: (err, { folderId }, context) => {
      // Rollback on error
      if (context?.previousQuizzes) {
        queryClient.setQueryData(QUIZ_QUERY_KEYS.list(folderId), context.previousQuizzes);
      }
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      });
    },
    onSuccess: ({ folderId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: QUIZ_QUERY_KEYS.list(folderId) });
      toast({
        title: "Success",
        description: "Quiz deleted successfully",
      });
    },
  });
};