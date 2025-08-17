/**
 * @fileoverview QuizTaking page component
 * @description Page for taking quizzes with loading, error handling, and result display
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
import { supabase } from '@/integrations/supabase/client';
import QuizPlayer from '@/components/QuizPlayer';
import QuizResults from '@/components/QuizResults';
import type { Quiz, Question, QuizSession, QuestionAnswer, QuizAttempt } from '@/types/quiz';

/**
 * QuizTaking page component
 */
const QuizTaking: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [quizResults, setQuizResults] = useState<QuizAttempt | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [activeAttempt, setActiveAttempt] = useState<QuizAttempt | null>(null);

  // Scroll to top on page load/refresh
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load quiz and questions
  useEffect(() => {
    const loadQuizData = async () => {
      console.log('loadQuizData called with:', { quizId, user: user?.id });
      
      if (!quizId) {
        console.error('No quiz ID provided');
        setError('Quiz ID is required');
        setLoading(false);
        return;
      }

      if (!user) {
        console.log('User not authenticated yet, waiting...');
        // User not authenticated yet, keep loading
        return;
      }

      console.log('Current user ID:', user.id);
      console.log('Starting to load quiz data for:', quizId);
      console.log('Quiz ID type:', typeof quizId);
      console.log('Quiz ID length:', quizId?.length);
      console.log('Is valid UUID format:', /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(quizId || ''));

      try {
        setLoading(true);
        setError(null);

        // Use Supabase client directly for better reliability
        console.log('Using Supabase client for quiz data');
        console.log('Querying for quiz ID:', quizId);
        
        // Load quiz and questions in parallel for better performance
        const [quizResult, questionsResult] = await Promise.all([
          supabase
            .from('quizzes')
            .select('*')
            .eq('id', quizId)
            .single(),
          supabase
            .from('questions')
            .select('*')
            .eq('quiz_id', quizId)
            .order('order_index', { ascending: true })
        ]);
          
        if (quizResult.error) {
          console.error('Supabase error loading quiz:', quizResult.error);
          if (quizResult.error.code === 'PGRST116') {
            setError('Quiz not found');
          } else {
            throw new Error(`Failed to load quiz: ${quizResult.error.message}`);
          }
          setLoading(false);
          return;
        }
        
        console.log('Supabase quiz data:', quizResult.data);

        // Parse settings if it's a string
        let settings = quizResult.data.settings;
        if (typeof settings === 'string') {
          try {
            settings = JSON.parse(settings);
          } catch (e) {
            settings = {};
          }
        }

        const loadedQuiz: Quiz = {
          ...quizResult.data,
          settings: settings as any || {}
        };

        setQuiz(loadedQuiz);

        // Handle questions
        if (questionsResult.error) {
          console.error('Supabase error loading questions:', questionsResult.error);
          throw new Error(`Failed to load questions: ${questionsResult.error.message}`);
        }
        
        console.log('Supabase questions data:', questionsResult.data);

        if (questionsResult.data) {
          const loadedQuestions: Question[] = questionsResult.data.map((q: any) => ({
            ...q,
            question_data: typeof q.question_data === 'string' 
              ? JSON.parse(q.question_data) 
              : q.question_data
          }));
          console.log('Loaded questions:', loadedQuestions);
          setQuestions(loadedQuestions);
        } else {
          console.log('No questions found for quiz:', quizId);
          setQuestions([]);
        }

      } catch (err) {
        console.error('Error loading quiz data:', err);
        console.error('Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
          quizId,
          userId: user?.id
        });
        const errorMessage = err instanceof Error ? err.message : 'Failed to load quiz data';
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, [quizId, user, toast]);

  // Start quiz attempt when quiz begins
  const handleQuizStart = async () => {
    if (!quiz || !quizId || !user) return;

    try {
      // Create a new quiz attempt using MCP
      const attemptData = {
        quiz_id: quizId,
        user_id: user.id,
        total_questions: questions.length,
        started_at: new Date().toISOString()
      };

      // Use Supabase client (more reliable for inserts)
      const { data: attempt, error } = await supabase
        .from('quiz_attempts')
        .insert(attemptData)
        .select()
        .single();

      if (error) {
        console.error('Error creating quiz attempt:', error);
      } else {
        setActiveAttempt(attempt as any);
      }
    } catch (err) {
      console.error('Error starting quiz attempt:', err);
      // Continue with quiz even if attempt creation fails
    }
  };

  // Handle quiz completion
  const handleQuizComplete = async (session: QuizSession, answers: QuestionAnswer[]) => {
    if (!quiz || !quizId || !user) return;

    try {
      // Calculate score
      const correctAnswers = answers.filter(a => a.correct).length;
      const score = Math.round((correctAnswers / answers.length) * 100);
      const timeSpent = Math.floor((new Date().getTime() - session.startTime.getTime()) / 1000);

      let attemptToComplete = activeAttempt;
      
      // If no active attempt, create one now (fallback)
      if (!attemptToComplete) {
        const attemptData = {
          quiz_id: quizId,
          user_id: user.id,
          total_questions: questions.length,
          started_at: session.startTime.toISOString()
        };

        const { data: newAttempt, error: createError } = await supabase
          .from('quiz_attempts')
          .insert(attemptData)
          .select()
          .single();

        if (createError) {
          throw new Error(`Failed to create quiz attempt: ${createError.message}`);
        }
        
        attemptToComplete = newAttempt as any;
      }

      // Update the attempt with completion data using Supabase client
      const updateData = {
        score: score,
        correct_answers: correctAnswers,
        time_taken: timeSpent,
        answers: answers as any, // Supabase can handle JSON directly
        completed_at: new Date().toISOString()
      };

      const { data: completedAttempt, error: updateError } = await supabase
        .from('quiz_attempts')
        .update(updateData)
        .eq('id', attemptToComplete.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update quiz attempt: ${updateError.message}`);
      }

      setQuizResults(completedAttempt as any);
      setShowResults(true);

    } catch (err) {
      console.error('Error saving quiz attempt:', err);
      toast({
        title: "Error",
        description: "Failed to save quiz results. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle quiz exit
  const handleQuizExit = () => {
    navigate(-1); // Go back to previous page
  };

  // Handle retake quiz
  const handleRetakeQuiz = () => {
    setQuizResults(null);
    setShowResults(false);
    setQuizSession(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-xl font-semibold">Loading Quiz...</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error state or no quiz
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

  // Still loading questions (quiz is loaded but questions might not be)
  if (quiz && questions.length === 0 && !error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">{quiz.title}</h2>
              <p className="text-muted-foreground">Loading questions...</p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show results
  if (showResults && quizResults) {
    return (
      <QuizResults
        quiz={quiz}
        questions={questions}
        attempt={quizResults}
        onRetake={quiz.settings.allowRetakes ? handleRetakeQuiz : undefined}
        onExit={handleQuizExit}
      />
    );
  }

  // Check if quiz has questions
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">No Questions Available</h3>
                <p className="text-muted-foreground mt-2">
                  This quiz doesn't have any questions yet. Please contact the quiz creator.
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

  // Show quiz player
  return (
    <QuizPlayer
      quiz={quiz}
      questions={questions}
      onComplete={handleQuizComplete}
      onExit={handleQuizExit}
      onStart={handleQuizStart}
    />
  );
};

export default QuizTaking;