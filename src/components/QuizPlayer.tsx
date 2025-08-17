/**
 * @fileoverview QuizPlayer component for taking quizzes
 * @description Main component that handles quiz taking interface with navigation, timer, and answer storage
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Clock, ChevronLeft, ChevronRight, Flag, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Quiz, Question, QuizSession, QuestionAnswer, AnswerData } from '@/types/quiz';
import { calculateQuizScore } from '@/lib/quiz-service';
import QuestionRenderer from './QuestionRenderer';
import { saveQuizSession, loadQuizSession, clearQuizSession, hasQuizSession } from '@/utils/quizSessionStorage';
import QuizResumeDialog from './QuizResumeDialog';

interface QuizPlayerProps {
  /** The quiz to be taken */
  quiz: Quiz;
  /** Questions for the quiz */
  questions: Question[];
  /** Callback when quiz is completed */
  onComplete: (session: QuizSession, answers: QuestionAnswer[]) => void;
  /** Callback when quiz is exited */
  onExit: () => void;
  /** Callback when quiz is started (optional) */
  onStart?: () => void;
}

/**
 * QuizPlayer component for taking quizzes
 */
const QuizPlayer: React.FC<QuizPlayerProps> = ({
  quiz,
  questions,
  onComplete,
  onExit,
  onStart
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize state from session storage or defaults
  const initializeSession = useCallback(() => {
    const savedSession = loadQuizSession(quiz.id);
    if (savedSession) {
      return {
        currentQuestionIndex: savedSession.currentQuestionIndex,
        answers: savedSession.answers,
        startTime: new Date(savedSession.startTime),
        timeRemaining: savedSession.timeRemaining,
        questionStartTime: new Date(savedSession.questionStartTime),
        shuffledQuestionIds: savedSession.shuffledQuestionIds
      };
    }
    return {
      currentQuestionIndex: 0,
      answers: [],
      startTime: new Date(),
      timeRemaining: quiz.settings.timeLimit ? quiz.settings.timeLimit * 60 : null,
      questionStartTime: new Date(),
      shuffledQuestionIds: undefined
    };
  }, [quiz.id, quiz.settings.timeLimit]);

  const sessionData = useMemo(() => initializeSession(), [initializeSession]);

  // Quiz session state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(sessionData.currentQuestionIndex);
  const [answers, setAnswers] = useState<QuestionAnswer[]>(sessionData.answers);
  const [startTime] = useState(sessionData.startTime);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(sessionData.timeRemaining);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(sessionData.questionStartTime);
  const [hasStarted, setHasStarted] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(hasQuizSession(quiz.id));

  // Call onStart when component mounts (quiz begins)
  useEffect(() => {
    if (!hasStarted && onStart) {
      onStart();
      setHasStarted(true);
    }
  }, [onStart, hasStarted]);

  // Shuffle questions if enabled, but maintain order if session exists
  const shuffledQuestions = useMemo(() => {
    if (sessionData.shuffledQuestionIds) {
      // Restore previous order from session
      return sessionData.shuffledQuestionIds
        .map(id => questions.find(q => q.id === id))
        .filter(Boolean) as Question[];
    }
    
    if (quiz.settings.shuffleQuestions) {
      return [...questions].sort(() => Math.random() - 0.5);
    }
    return questions;
  }, [questions, quiz.settings.shuffleQuestions, sessionData.shuffledQuestionIds]);

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const totalQuestions = shuffledQuestions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Debug logging
  console.log('QuizPlayer - Quiz:', quiz?.title);
  console.log('QuizPlayer - Questions count:', questions.length);
  console.log('QuizPlayer - Shuffled questions count:', shuffledQuestions.length);
  console.log('QuizPlayer - Current question:', currentQuestion);

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || isCompleted) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          // Time's up - auto-submit quiz
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isCompleted]);

  // Save session to localStorage whenever state changes
  useEffect(() => {
    if (!isCompleted) {
      const sessionData = {
        quizId: quiz.id,
        currentQuestionIndex,
        answers,
        startTime: startTime.toISOString(),
        timeRemaining,
        questionStartTime: questionStartTime.toISOString(),
        shuffledQuestionIds: shuffledQuestions.map(q => q.id)
      };
      saveQuizSession(sessionData);
    }
  }, [quiz.id, currentQuestionIndex, answers, startTime, timeRemaining, questionStartTime, shuffledQuestions, isCompleted]);

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle time up
  const handleTimeUp = useCallback(() => {
    toast({
      title: "Time's Up!",
      description: "The quiz has been automatically submitted.",
      variant: "destructive",
    });
    handleQuizComplete();
  }, []);

  // Handle answer change
  const handleAnswerChange = useCallback((answerData: AnswerData) => {
    if (!currentQuestion) return;
    
    const timeSpent = Math.floor((new Date().getTime() - questionStartTime.getTime()) / 1000);
    
    const newAnswer: QuestionAnswer = {
      questionId: currentQuestion.id,
      answer: answerData,
      correct: false, // Will be calculated on submission
      timeSpent
    };

    setAnswers(prev => {
      const existing = prev.findIndex(a => a.questionId === currentQuestion.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newAnswer;
        return updated;
      }
      return [...prev, newAnswer];
    });

  }, [currentQuestion, questionStartTime]);

  // Navigate to next question
  const handleNext = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(new Date());
    }
  }, [currentQuestionIndex, totalQuestions]);

  // Navigate to previous question
  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setQuestionStartTime(new Date());
    }
  }, [currentQuestionIndex, totalQuestions]);

  // Jump to specific question
  const handleQuestionJump = useCallback((index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index);
      setQuestionStartTime(new Date());
    }
  }, [totalQuestions]);

  // Complete the quiz
  const handleQuizComplete = useCallback(() => {
    if (isCompleted) return;

    const endTime = new Date();
    const totalTimeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Calculate scores for all answers
    const scoredAnswers = answers.map(answer => {
      const question = shuffledQuestions.find(q => q.id === answer.questionId);
      if (!question) return { ...answer, correct: false };

      let isCorrect = false;

      switch (question.question_type) {
        case 'mcq':
          const mcqData = question.question_data as any;
          isCorrect = answer.answer.type === 'mcq' && 
                     answer.answer.selectedOption === mcqData.correctAnswer;
          break;

        case 'fill_blank':
          const fillData = question.question_data as any;
          if (answer.answer.type === 'fill_blank') {
            const userText = fillData.caseSensitive 
              ? answer.answer.answer.trim()
              : answer.answer.answer.toLowerCase().trim();
            isCorrect = fillData.correctAnswers.some((correct: string) => 
              fillData.caseSensitive 
                ? correct.trim() === answer.answer.answer.trim()
                : correct.toLowerCase().trim() === userText
            );
          }
          break;

        case 'true_false':
          const tfData = question.question_data as any;
          isCorrect = answer.answer.type === 'true_false' && 
                     answer.answer.answer === tfData.correctAnswer;
          break;

        case 'match_following':
          const matchData = question.question_data as any;
          if (answer.answer.type === 'match_following') {
            const userPairs = answer.answer.pairs;
            isCorrect = matchData.correctPairs.every((correctPair: any) =>
              userPairs.some((userPair: any) =>
                userPair.left === correctPair.left && userPair.right === correctPair.right
              )
            ) && userPairs.length === matchData.correctPairs.length;
          }
          break;
      }

      return { ...answer, correct: isCorrect };
    });

    const correctCount = scoredAnswers.filter(a => a.correct).length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    const session: QuizSession = {
      quiz,
      currentQuestionIndex,
      answers: scoredAnswers,
      startTime,
      isCompleted: true,
      timeRemaining
    };

    setIsCompleted(true);
    // Clear session storage when quiz is completed
    clearQuizSession(quiz.id);
    onComplete(session, scoredAnswers);
  }, [answers, currentQuestionIndex, quiz, shuffledQuestions, startTime, timeRemaining, isCompleted, onComplete]);

  // Handle exit quiz
  const handleExit = useCallback(() => {
    setShowExitDialog(false);
    // Clear session storage when quiz is exited
    clearQuizSession(quiz.id);
    onExit();
  }, [onExit, quiz.id]);

  // Handle resume quiz
  const handleResume = useCallback(() => {
    setShowResumeDialog(false);
    setHasStarted(true);
    if (onStart) {
      onStart();
    }
  }, [onStart]);

  // Handle restart quiz
  const handleRestart = useCallback(() => {
    setShowResumeDialog(false);
    clearQuizSession(quiz.id);
    // Reset all state to initial values
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setQuestionStartTime(new Date());
    setHasStarted(true);
    if (onStart) {
      onStart();
    }
  }, [quiz.id, onStart]);

  // Get current answer for the question
  const getCurrentAnswer = useCallback(() => {
    if (!currentQuestion) return undefined;
    return answers.find(a => a.questionId === currentQuestion.id);
  }, [answers, currentQuestion]);

  // Check if current question is answered
  const isCurrentQuestionAnswered = useMemo(() => {
    if (!currentQuestion) return false;
    return answers.some(a => a.questionId === currentQuestion.id);
  }, [answers, currentQuestion]);

  // Get answered questions count
  const answeredCount = useMemo(() => {
    return answers.length;
  }, [answers.length]);



  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Questions Found</h3>
              <p className="text-muted-foreground mb-4">
                This quiz doesn't have any questions yet.
              </p>
              <Button onClick={onExit}>Go Back</Button>
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
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExitDialog(true)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Exit Quiz
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold">{quiz.title}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {timeRemaining !== null && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <Badge variant={timeRemaining < 300 ? "destructive" : "secondary"}>
                    {formatTime(timeRemaining)}
                  </Badge>
                </div>
              )}
              <Badge variant="outline">
                {answeredCount}/{totalQuestions} answered
              </Badge>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 sm:mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Question {currentQuestionIndex + 1}</span>
                {isCurrentQuestionAnswered && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QuestionRenderer
                question={currentQuestion}
                answer={getCurrentAnswer()}
                onAnswerChange={handleAnswerChange}
                disabled={isCompleted}
              />
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-6 sm:mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center sm:justify-center">
              {/* Question navigation dots */}
              <div className="flex gap-1 overflow-x-auto -mx-2 px-2 py-1 whitespace-nowrap">
                {shuffledQuestions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionJump(index)}
                    className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-medium transition-colors ${
                      index === currentQuestionIndex
                        ? 'bg-primary text-primary-foreground'
                        : answers.some(a => a.questionId === shuffledQuestions[index].id)
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>

            {currentQuestionIndex === totalQuestions - 1 ? (
              <Button
                onClick={handleQuizComplete}
                disabled={isCompleted}
                className="bg-green-600 hover:bg-green-700"
              >
                <Flag className="h-4 w-4 mr-1" />
                Finish Quiz
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={currentQuestionIndex === totalQuestions - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Resume quiz dialog */}
      <QuizResumeDialog
        open={showResumeDialog}
        onOpenChange={setShowResumeDialog}
        quizTitle={quiz.title}
        currentQuestion={currentQuestionIndex}
        totalQuestions={totalQuestions}
        onResume={handleResume}
        onRestart={handleRestart}
      />

      {/* Exit confirmation dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to exit this quiz? Your progress will be saved and you can resume later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Quiz</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleExit} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Exit Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QuizPlayer;