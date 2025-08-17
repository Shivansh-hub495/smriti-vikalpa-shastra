/**
 * @fileoverview QuizResults component for displaying quiz completion results
 * @description Shows score, time taken, correct/incorrect answers with explanations
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  ArrowLeft,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  Minus,
  Star,
  Award,
  Sparkles
} from 'lucide-react';
import { createQuizResults, formatTime } from '@/utils/quizUtils';
import type { Quiz, Question, QuizAttempt } from '@/types/quiz';

interface QuizResultsProps {
  /** The quiz that was taken */
  quiz: Quiz;
  /** Questions from the quiz */
  questions: Question[];
  /** The completed quiz attempt */
  attempt: QuizAttempt;
  /** Previous attempt for comparison (optional) */
  previousAttempt?: QuizAttempt;
  /** Callback for retaking the quiz */
  onRetake?: () => void;
  /** Callback for exiting results */
  onExit: () => void;
}

/**
 * QuizResults component for displaying quiz completion results
 */
const QuizResults: React.FC<QuizResultsProps> = ({
  quiz,
  questions,
  attempt,
  previousAttempt,
  onRetake,
  onExit
}) => {
  // Create detailed results using the enhanced scoring system
  const detailedResults = React.useMemo(() => {
    return createQuizResults(quiz, questions, attempt);
  }, [quiz, questions, attempt]);

  const scorePercentage = attempt.score || 0;
  const correctCount = attempt.correct_answers;
  const totalCount = attempt.total_questions;
  const timeFormatted = formatTime(attempt.time_taken || 0);
  
  // Determine pass/fail status
  const passingScore = quiz.settings.passingScore || 0;
  const hasPassed = scorePercentage >= passingScore;

  // Calculate improvement metrics if previous attempt exists
  const scoreImprovement = previousAttempt ? scorePercentage - (previousAttempt.score || 0) : null;
  const timeImprovement = previousAttempt && attempt.time_taken && previousAttempt.time_taken 
    ? previousAttempt.time_taken - attempt.time_taken : null;
  const accuracyImprovement = previousAttempt 
    ? (correctCount / totalCount) - (previousAttempt.correct_answers / previousAttempt.total_questions) : null;
  
  // Get score color and icon
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <Trophy className="h-8 w-8 text-green-600" />;
    if (score >= 70) return <Target className="h-8 w-8 text-blue-600" />;
    if (score >= 50) return <TrendingUp className="h-8 w-8 text-yellow-600" />;
    return <XCircle className="h-8 w-8 text-red-600" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Enhanced Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm"
      >
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              >
                Quiz Results
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-muted-foreground text-base sm:text-lg"
              >
                {quiz.title}
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button 
                variant="outline" 
                onClick={onExit}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Quiz
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
          {/* Enhanced Score Overview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Card className="shadow-2xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
              <CardHeader className="relative z-10 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20">
                <CardTitle className="flex items-center space-x-3 sm:space-x-4 text-xl sm:text-2xl">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: "spring" }}
                  >
                    {getScoreIcon(scorePercentage)}
                  </motion.div>
                  <span className="bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
                    Your Score
                  </span>
                  {scorePercentage >= 90 && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.8, type: "spring" }}
                    >
                      <Sparkles className="h-6 w-6 text-yellow-500" />
                    </motion.div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 p-5 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                {/* Enhanced Score */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="text-center"
                >
                  <div className="relative">
                    <div className={`text-4xl sm:text-6xl font-bold ${getScoreColor(scorePercentage)} mb-2`}>
                      {scorePercentage}%
                    </div>
                    {scorePercentage >= 90 && (
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        className="absolute -top-2 -right-2"
                      >
                        <Star className="h-8 w-8 text-yellow-500 fill-current" />
                      </motion.div>
                    )}
                  </div>
                  <p className="text-muted-foreground text-base sm:text-lg font-medium">Overall Score</p>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 1, duration: 1 }}
                    className="mt-4"
                  >
                    <Progress 
                      value={scorePercentage} 
                      className="h-3 bg-gray-200 dark:bg-gray-700"
                    />
                  </motion.div>
                </motion.div>

                {/* Enhanced Correct Answers */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="text-center"
                >
                  <div className="text-4xl sm:text-6xl font-bold text-green-600 mb-2">
                    {correctCount}
                  </div>
                  <p className="text-muted-foreground text-base sm:text-lg font-medium">
                    Correct out of {totalCount}
                  </p>
                  <div className="flex items-center justify-center mt-4 space-x-2 bg-green-50 dark:bg-green-900/20 rounded-full px-4 py-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-600">
                      {Math.round((correctCount / totalCount) * 100)}% accuracy
                    </span>
                  </div>
                </motion.div>

                {/* Enhanced Time Taken */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                  className="text-center"
                >
                  <div className="text-4xl sm:text-6xl font-bold text-blue-600 mb-2">
                    {timeFormatted}
                  </div>
                  <p className="text-muted-foreground text-base sm:text-lg font-medium">Time Taken</p>
                  <div className="flex items-center justify-center mt-4 space-x-2 bg-blue-50 dark:bg-blue-900/20 rounded-full px-4 py-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-600">
                      {Math.round((attempt.time_taken || 0) / totalCount)}s per question
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Pass/Fail Status */}
              {passingScore > 0 && (
                <div className="mt-6 text-center">
                  <Badge 
                    variant={hasPassed ? "default" : "destructive"}
                    className="text-lg px-4 py-2"
                  >
                    {hasPassed ? "PASSED" : "FAILED"}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    Passing score: {passingScore}%
                  </p>
                </div>
              )}

              {/* Improvement Indicators */}
              {previousAttempt && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-3 text-center">Improvement from Last Attempt</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {/* Score Improvement */}
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        {scoreImprovement && scoreImprovement > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : scoreImprovement && scoreImprovement < 0 ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <Minus className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="font-medium">Score</span>
                      </div>
                      <div className={`text-lg font-bold ${
                        scoreImprovement && scoreImprovement > 0 ? 'text-green-600' :
                        scoreImprovement && scoreImprovement < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {scoreImprovement && scoreImprovement > 0 ? '+' : ''}{scoreImprovement?.toFixed(1) || 0}%
                      </div>
                    </div>

                    {/* Time Improvement */}
                    {timeImprovement !== null && (
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          {timeImprovement > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : timeImprovement < 0 ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : (
                            <Minus className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="font-medium">Time</span>
                        </div>
                        <div className={`text-lg font-bold ${
                          timeImprovement > 0 ? 'text-green-600' :
                          timeImprovement < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {timeImprovement > 0 ? '-' : timeImprovement < 0 ? '+' : ''}{formatTime(Math.abs(timeImprovement))}
                        </div>
                      </div>
                    )}

                    {/* Accuracy Improvement */}
                    {accuracyImprovement !== null && (
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          {accuracyImprovement > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : accuracyImprovement < 0 ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : (
                            <Minus className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="font-medium">Accuracy</span>
                        </div>
                        <div className={`text-lg font-bold ${
                          accuracyImprovement > 0 ? 'text-green-600' :
                          accuracyImprovement < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {accuracyImprovement > 0 ? '+' : ''}{(accuracyImprovement * 100).toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 mt-6">
                {onRetake && (
                  <Button onClick={onRetake} className="bg-blue-600 hover:bg-blue-700">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retake Quiz
                  </Button>
                )}
                <Button variant="outline" onClick={onExit}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Folder
                </Button>
              </div>
            </CardContent>
            </Card>
          </motion.div>

          {/* Performance Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Performance Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* MCQ Performance */}
                {detailedResults.metrics.breakdown.mcq.total > 0 && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {detailedResults.metrics.breakdown.mcq.correct}/{detailedResults.metrics.breakdown.mcq.total}
                    </div>
                    <p className="text-sm text-muted-foreground">Multiple Choice</p>
                    <div className="text-xs text-blue-600 mt-1">
                      {Math.round((detailedResults.metrics.breakdown.mcq.correct / detailedResults.metrics.breakdown.mcq.total) * 100)}% accuracy
                    </div>
                  </div>
                )}

                {/* Fill Blank Performance */}
                {detailedResults.metrics.breakdown.fill_blank.total > 0 && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {detailedResults.metrics.breakdown.fill_blank.correct}/{detailedResults.metrics.breakdown.fill_blank.total}
                    </div>
                    <p className="text-sm text-muted-foreground">Fill in the Blank</p>
                    <div className="text-xs text-green-600 mt-1">
                      {Math.round((detailedResults.metrics.breakdown.fill_blank.correct / detailedResults.metrics.breakdown.fill_blank.total) * 100)}% accuracy
                    </div>
                  </div>
                )}

                {/* True/False Performance */}
                {detailedResults.metrics.breakdown.true_false.total > 0 && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {detailedResults.metrics.breakdown.true_false.correct}/{detailedResults.metrics.breakdown.true_false.total}
                    </div>
                    <p className="text-sm text-muted-foreground">True/False</p>
                    <div className="text-xs text-purple-600 mt-1">
                      {Math.round((detailedResults.metrics.breakdown.true_false.correct / detailedResults.metrics.breakdown.true_false.total) * 100)}% accuracy
                    </div>
                  </div>
                )}

                {/* Match Following Performance */}
                {detailedResults.metrics.breakdown.match_following.total > 0 && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {detailedResults.metrics.breakdown.match_following.correct}/{detailedResults.metrics.breakdown.match_following.total}
                    </div>
                    <p className="text-sm text-muted-foreground">Match Following</p>
                    <div className="text-xs text-orange-600 mt-1">
                      {Math.round((detailedResults.metrics.breakdown.match_following.correct / detailedResults.metrics.breakdown.match_following.total) * 100)}% accuracy
                    </div>
                  </div>
                )}
              </div>

              {/* Time Analysis */}
              {attempt.time_taken && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    Time Analysis
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Time:</span>
                      <div className="font-medium">{timeFormatted}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Average per Question:</span>
                      <div className="font-medium">
                        {Math.round((attempt.time_taken || 0) / totalCount)}s
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pace:</span>
                      <div className="font-medium">
                        {(attempt.time_taken || 0) < (totalCount * 30) ? 'Fast' : 
                         (attempt.time_taken || 0) < (totalCount * 60) ? 'Moderate' : 'Slow'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Question-by-Question Results */}
          {quiz.settings.showCorrectAnswers && (
            <Card>
              <CardHeader>
                <CardTitle>Question Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {questions.map((question, index) => {
                    const userAnswer = attempt.answers.find(a => a.questionId === question.id);
                    const isCorrect = userAnswer?.correct || false;
                    
                    return (
                      <div key={question.id} className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium">Question {index + 1}</span>
                              <Badge variant={isCorrect ? "default" : "destructive"}>
                                {isCorrect ? "Correct" : "Incorrect"}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {question.question_type.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            
                            <p className="text-sm mb-3">{question.question_text}</p>
                            
                            <QuestionAnswerReview 
                              question={question} 
                              userAnswer={userAnswer} 
                              isCorrect={isCorrect}
                            />
                            
                            {/* Explanation */}
                            {question.explanation && quiz.settings.showExplanations && (
                              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                <h5 className="font-medium text-sm text-muted-foreground mb-1">
                                  Explanation:
                                </h5>
                                <p className="text-sm">{question.explanation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {index < questions.length - 1 && <Separator />}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Component to show question-specific answer review
 */
const QuestionAnswerReview: React.FC<{
  question: Question;
  userAnswer?: any;
  isCorrect: boolean;
}> = ({ question, userAnswer, isCorrect }) => {
  const renderAnswerReview = () => {
    switch (question.question_type) {
      case 'mcq':
        const mcqData = question.question_data as any;
        const userSelection = userAnswer?.answer?.selectedOption;
        const correctAnswer = mcqData.correctAnswer;
        
        return (
          <div className="space-y-2">
            {mcqData.options.map((option: string, index: number) => (
              <div
                key={index}
                className={`p-2 rounded border text-sm ${
                  index === correctAnswer
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : index === userSelection && !isCorrect
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-background border-border'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span>{option}</span>
                  {index === correctAnswer && (
                    <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                  )}
                  {index === userSelection && index !== correctAnswer && (
                    <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case 'fill_blank':
        const fillData = question.question_data as any;
        const userText = userAnswer?.answer?.answer || '';
        
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Your answer: </span>
              <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                "{userText}"
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Correct answers: </span>
              <span className="text-green-600">
                {fillData.correctAnswers.map((answer: string, index: number) => (
                  <span key={index}>
                    "{answer}"
                    {index < fillData.correctAnswers.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </span>
            </div>
          </div>
        );

      case 'true_false':
        const tfData = question.question_data as any;
        const userChoice = userAnswer?.answer?.answer;
        const correctChoice = tfData.correctAnswer;
        
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Your answer: </span>
              <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                {userChoice ? 'True' : 'False'}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Correct answer: </span>
              <span className="text-green-600">
                {correctChoice ? 'True' : 'False'}
              </span>
            </div>
          </div>
        );

      case 'match_following':
        const matchData = question.question_data as any;
        const userPairs = userAnswer?.answer?.pairs || [];
        
        return (
          <div className="space-y-2">
            <div className="text-sm font-medium">Your matches:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {matchData.leftItems.map((leftItem: string, index: number) => {
                const userMatch = userPairs.find((p: any) => p.left === index);
                const correctMatch = matchData.correctPairs.find((p: any) => p.left === index);
                const isMatchCorrect = userMatch && correctMatch && 
                  userMatch.right === correctMatch.right;
                
                return (
                  <div key={index} className="flex items-center space-x-2">
                    <span>{leftItem}</span>
                    <span>→</span>
                    <span className={isMatchCorrect ? 'text-green-600' : 'text-red-600'}>
                      {userMatch ? matchData.rightItems[userMatch.right] : '(no match)'}
                    </span>
                    {isMatchCorrect ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-600" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return <div className="text-sm text-muted-foreground">Answer review not available</div>;
    }
  };

  return renderAnswerReview();
};



export default QuizResults;