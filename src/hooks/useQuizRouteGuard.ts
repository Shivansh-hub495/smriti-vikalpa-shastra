/**
 * @fileoverview useQuizRouteGuard hook for quiz route protection
 * @description Hook for checking quiz access permissions and route validation
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Quiz } from '@/types/quiz';

interface QuizRouteGuardOptions {
  /** Whether to check if user owns the quiz */
  requireOwnership?: boolean;
  /** Whether to allow access to completed quizzes */
  allowCompleted?: boolean;
  /** Redirect path on access denied */
  redirectPath?: string;
}

interface QuizRouteGuardResult {
  /** The quiz data if accessible */
  quiz: Quiz | null;
  /** Whether the route is loading */
  isLoading: boolean;
  /** Error message if access is denied */
  error: string | null;
  /** Whether the user has access to this quiz */
  hasAccess: boolean;
  /** Whether the user owns this quiz */
  isOwner: boolean;
}

/**
 * Hook for protecting quiz routes and checking permissions
 */
export const useQuizRouteGuard = (
  options: QuizRouteGuardOptions = {}
): QuizRouteGuardResult => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const {
    requireOwnership = false,
    allowCompleted = true,
    redirectPath = '/'
  } = options;

  useEffect(() => {
    const checkQuizAccess = async () => {
      if (!quizId || !user) {
        setError('Quiz ID or user not available');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch quiz data using Supabase client
        const { supabase } = await import('@/integrations/supabase/client');
        
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (quizError || !quizData) {
          setError('Quiz not found');
          setHasAccess(false);
          
          toast({
            title: "Quiz Not Found",
            description: "The requested quiz could not be found.",
            variant: "destructive",
          });

          if (redirectPath) {
            navigate(redirectPath, { replace: true });
          }
          return;
        }
        
        // Parse settings if it's a string
        let settings = quizData.settings;
        if (typeof settings === 'string') {
          try {
            settings = JSON.parse(settings);
          } catch (e) {
            settings = {};
          }
        }

        const loadedQuiz: Quiz = {
          ...quizData,
          settings: settings || {}
        };

        setQuiz(loadedQuiz);

        // Check ownership
        const userIsOwner = loadedQuiz.user_id === user.id;
        setIsOwner(userIsOwner);

        // Check access permissions
        let userHasAccess = true;

        // If ownership is required, check if user owns the quiz
        if (requireOwnership && !userIsOwner) {
          userHasAccess = false;
          setError('You do not have permission to access this quiz');
          
          toast({
            title: "Access Denied",
            description: "You do not have permission to access this quiz.",
            variant: "destructive",
          });

          if (redirectPath) {
            navigate(redirectPath, { replace: true });
          }
        }

        // Additional access checks can be added here
        // For example, checking if quiz is published, if user is in allowed group, etc.

        setHasAccess(userHasAccess);

      } catch (err) {
        console.error('Error checking quiz access:', err);
        setError('Failed to verify quiz access');
        setHasAccess(false);
        
        toast({
          title: "Error",
          description: "Failed to verify quiz access. Please try again.",
          variant: "destructive",
        });

        if (redirectPath) {
          navigate(redirectPath, { replace: true });
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkQuizAccess();
  }, [quizId, user?.id, requireOwnership, allowCompleted, redirectPath, navigate, toast]);

  return {
    quiz,
    isLoading,
    error,
    hasAccess,
    isOwner
  };
};

/**
 * Hook for checking folder access permissions
 */
export const useFolderRouteGuard = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [folderTitle, setFolderTitle] = useState<string>('');

  useEffect(() => {
    const checkFolderAccess = async () => {
      if (!folderId || !user) {
        setError('Folder ID or user not available');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch folder data using Supabase client
        const { supabase } = await import('@/integrations/supabase/client');
        
        const { data: folderData, error: folderError } = await supabase
          .from('folders')
          .select('*')
          .eq('id', folderId)
          .eq('user_id', user.id)
          .single();

        if (folderError || !folderData) {
          setError('Folder not found or access denied');
          setHasAccess(false);
          
          toast({
            title: "Folder Not Found",
            description: "The requested folder could not be found or you don't have access to it.",
            variant: "destructive",
          });

          navigate('/', { replace: true });
          return;
        }

        setFolderTitle(folderData.name);
        setHasAccess(true);

      } catch (err) {
        console.error('Error checking folder access:', err);
        setError('Failed to verify folder access');
        setHasAccess(false);
        
        toast({
          title: "Error",
          description: "Failed to verify folder access. Please try again.",
          variant: "destructive",
        });

        navigate('/', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkFolderAccess();
  }, [folderId, user?.id, navigate, toast]);

  return {
    isLoading,
    error,
    hasAccess,
    folderTitle,
    folderId
  };
};

export default useQuizRouteGuard;