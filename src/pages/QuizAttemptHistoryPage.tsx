/**
 * @fileoverview QuizAttemptHistoryPage component
 * @description Page for viewing quiz attempt history and analytics
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import QuizAttemptHistory from '@/components/QuizAttemptHistory';
import QuizAttemptComparisonModal from '@/components/QuizAttemptComparisonModal';
import QuizBreadcrumb from '@/components/QuizBreadcrumb';
import { useQuizRouteGuard } from '@/hooks/useQuizRouteGuard';
import useQuizAttempts from '@/hooks/useQuizAttempts';
import type { Quiz, Question, QuizAttempt } from '@/types/quiz';

/**
 * QuizAttemptHistoryPage component
 */
const QuizAttemptHistoryPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { attempts, isLoading: attemptsLoading, error: attemptsError } = useQuizAttempts();

  // Use route guard to check quiz access
  const { quiz: guardedQuiz, isLoading: guardLoading, hasAccess } = useQuizRouteGuard({
    requireOwnership: false, // Anyone can view their own attempt history
    redirectPath: '/'
  });

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Scroll to top on page load/refresh
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load quiz and questions
  useEffect(() => {
    const loadQuizData = async () => {
      if (!quizId) {
        setError('Quiz ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load quiz data using Supabase MCP
        const { mcp_supabase_execute_sql } = window as any;
        
        const quizResponse = await mcp_supabase_execute_sql({
          query: `
            SELECT q.*, 
                   COUNT(questions.id) as question_count
            FROM quizzes q
            LEFT JOIN questions ON questions.quiz_id = q.id
            WHERE q.id = '${quizId}'
            GROUP BY q.id
          `
        });

        // MCP returns data directly, not in a data property
        const quizData = Array.isArray(quizResponse) ? quizResponse : quizResponse?.data || [];

        if (!quizData || quizData.length === 0) {
          setError('Quiz not found');
          setLoading(false);
          return;
        }

        const quizDataItem = quizData[0];
        
        // Parse settings if it's a string
        let settings = quizDataItem.settings;
        if (typeof settings === 'string') {
          try {
            settings = JSON.parse(settings);
          } catch (e) {
            settings = {};
          }
        }

        const loadedQuiz: Quiz = {
          ...quizDataItem,
          settings: settings || {}
        };

        setQuiz(loadedQuiz);

        // Load questions
        const questionsResponse = await mcp_supabase_execute_sql({
          query: `SELECT * FROM questions WHERE quiz_id = '${quizId}' ORDER BY order_index ASC`
        });

        // MCP returns data directly, not in a data property
        const questionsData = Array.isArray(questionsResponse) ? questionsResponse : questionsResponse?.data || [];

        if (questionsData) {
          const loadedQuestions: Question[] = questionsData.map(q => ({
            ...q,
            question_data: typeof q.question_data === 'string' 
              ? JSON.parse(q.question_data) 
              : q.question_data
          }));
          setQuestions(loadedQuestions);
        }

        // Load quiz attempts for this user and quiz
        if (user?.id) {
          const attemptsResponse = await mcp_supabase_execute_sql({
            query: `SELECT * FROM quiz_attempts WHERE quiz_id = '${quizId}' AND user_id = '${user.id}' ORDER BY created_at DESC`
          });

          // MCP returns data directly, not in a data property
          const attemptsData = Array.isArray(attemptsResponse) ? attemptsResponse : attemptsResponse?.data || [];

          if (attemptsData) {
            const loadedAttempts: QuizAttempt[] = attemptsData.map((attempt: any) => ({
              ...attempt,
              answers: typeof attempt.answers === 'string' 
                ? JSON.parse(attempt.answers) 
                : attempt.answers || []
            }));
            setQuizAttempts(loadedAttempts);
          }
        }

      } catch (err) {
        console.error('Error loading quiz:', err);
        setError('Failed to load quiz. Please try again.');
        toast({
          title: "Error",
          description: "Failed to load quiz data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, [quizId, user?.id, toast]);

  // Handle retake quiz
  const handleRetakeQuiz = () => {
    if (quizId) {
      navigate(`/quiz/${quizId}/take`);
    }
  };

  // Handle view attempt details
  const handleViewAttempt = (attempt: QuizAttempt) => {
    setSelectedAttempt(attempt);
    setShowComparisonModal(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10" />
              <div>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48 mt-2" />
              </div>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full" />
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Quiz Not Available</h3>
                <p className="text-muted-foreground mt-2">
                  {error || 'The requested quiz could not be found.'}
                </p>
              </div>
              <Button onClick={() => navigate(-1)} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <QuizBreadcrumb
            quizTitle={quiz.title}
            folderId={quiz.folder_id}
            quizId={quiz.id}
            currentPage="history"
            className="mb-4"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Quiz History</h1>
                <p className="text-muted-foreground">{quiz.title}</p>
              </div>
            </div>
            <Button onClick={handleRetakeQuiz}>
              Take Quiz Again
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <QuizAttemptHistory
            quiz={quiz}
            userId={user?.id}
            onRetake={handleRetakeQuiz}
            onViewAttempt={handleViewAttempt}
          />
        </div>
      </div>

      {/* Attempt Comparison Modal */}
      {selectedAttempt && (
        <QuizAttemptComparisonModal
          isOpen={showComparisonModal}
          onClose={() => {
            setShowComparisonModal(false);
            setSelectedAttempt(null);
          }}
          quiz={quiz}
          currentAttempt={selectedAttempt}
          previousAttempt={
            quizAttempts.find((attempt, index) => 
              quizAttempts[index - 1]?.id === selectedAttempt.id
            )
          }
          allAttempts={quizAttempts}
          questions={questions}
        />
      )}
    </div>
  );
};

export default QuizAttemptHistoryPage;