/**
 * @fileoverview QuizAttemptComparisonModal component for comparing quiz attempts
 * @description Modal for detailed comparison between quiz attempts with analytics
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy, 
  Clock, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Target,
  CheckCircle,
  XCircle,
  Minus,
  BarChart3
} from 'lucide-react';
import { formatTime } from '@/utils/quizUtils';
import type { Quiz, QuizAttempt, Question } from '@/types/quiz';

interface QuizAttemptComparisonModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** The quiz being compared */
  quiz: Quiz;
  /** The current attempt to display */
  currentAttempt: QuizAttempt;
  /** Previous attempt to compare with (optional) */
  previousAttempt?: QuizAttempt;
  /** All attempts for additional context */
  allAttempts: QuizAttempt[];
  /** Questions from the quiz */
  questions: Question[];
}

/**
 * QuizAttemptComparisonModal component
 */
const QuizAttemptComparisonModal: React.FC<QuizAttemptComparisonModalProps> = ({
  isOpen,
  onClose,
  quiz,
  currentAttempt,
  previousAttempt,
  allAttempts,
  questions
}) => {
  // Calculate comparison metrics
  const scoreChange = previousAttempt ? (currentAttempt.score || 0) - (previousAttempt.score || 0) : 0;
  const timeChange = previousAttempt && currentAttempt.time_taken && previousAttempt.time_taken 
    ? currentAttempt.time_taken - previousAttempt.time_taken : 0;
  const accuracyChange = previousAttempt 
    ? (currentAttempt.correct_answers / currentAttempt.total_questions) - 
      (previousAttempt.correct_answers / previousAttempt.total_questions) : 0;

  // Find attempt rank
  const sortedAttempts = [...allAttempts].sort((a, b) => (b.score || 0) - (a.score || 0));
  const currentRank = sortedAttempts.findIndex(a => a.id === currentAttempt.id) + 1;
  const previousRank = previousAttempt 
    ? sortedAttempts.findIndex(a => a.id === previousAttempt.id) + 1 : null;

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get score color based on percentage
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get comparison icon and color
  const getComparisonDisplay = (change: number, isTime: boolean = false) => {
    const isImprovement = isTime ? change < 0 : change > 0;
    const isDecline = isTime ? change > 0 : change < 0;
    
    if (isImprovement) {
      return {
        icon: <TrendingUp className="h-4 w-4 text-green-500" />,
        color: 'text-green-600',
        text: isTime ? 'Faster' : 'Improved'
      };
    } else if (isDecline) {
      return {
        icon: <TrendingDown className="h-4 w-4 text-red-500" />,
        color: 'text-red-600',
        text: isTime ? 'Slower' : 'Declined'
      };
    } else {
      return {
        icon: <Minus className="h-4 w-4 text-gray-500" />,
        color: 'text-gray-600',
        text: 'Same'
      };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Attempt Analysis</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Attempt Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Attempt */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span>Current Attempt</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(currentAttempt.score || 0)}`}>
                    {currentAttempt.score?.toFixed(1) || 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {currentAttempt.correct_answers}/{currentAttempt.total_questions} correct
                  </p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{formatDate(currentAttempt.completed_at || currentAttempt.created_at)}</span>
                  </div>
                  {currentAttempt.time_taken && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span>{formatTime(currentAttempt.time_taken)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Rank:</span>
                    <Badge variant="outline">#{currentRank} of {allAttempts.length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Previous Attempt or Best Attempt */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span>{previousAttempt ? 'Previous Attempt' : 'Best Attempt'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {previousAttempt ? (
                  <>
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getScoreColor(previousAttempt.score || 0)}`}>
                        {previousAttempt.score?.toFixed(1) || 0}%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {previousAttempt.correct_answers}/{previousAttempt.total_questions} correct
                      </p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span>{formatDate(previousAttempt.completed_at || previousAttempt.created_at)}</span>
                      </div>
                      {previousAttempt.time_taken && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Time:</span>
                          <span>{formatTime(previousAttempt.time_taken)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Rank:</span>
                        <Badge variant="outline">#{previousRank} of {allAttempts.length}</Badge>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p>No previous attempt to compare</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Comparison Metrics */}
          {previousAttempt && (
            <>
              <Separator />
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Score Change */}
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        {getComparisonDisplay(scoreChange).icon}
                        <span className="font-medium">Score Change</span>
                      </div>
                      <div className={`text-2xl font-bold ${getComparisonDisplay(scoreChange).color}`}>
                        {scoreChange > 0 ? '+' : ''}{scoreChange.toFixed(1)}%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getComparisonDisplay(scoreChange).text}
                      </p>
                    </div>

                    {/* Time Change */}
                    {currentAttempt.time_taken && previousAttempt.time_taken && (
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          {getComparisonDisplay(timeChange, true).icon}
                          <span className="font-medium">Time Change</span>
                        </div>
                        <div className={`text-2xl font-bold ${getComparisonDisplay(timeChange, true).color}`}>
                          {timeChange > 0 ? '+' : ''}{formatTime(Math.abs(timeChange))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getComparisonDisplay(timeChange, true).text}
                        </p>
                      </div>
                    )}

                    {/* Accuracy Change */}
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        {getComparisonDisplay(accuracyChange).icon}
                        <span className="font-medium">Accuracy Change</span>
                      </div>
                      <div className={`text-2xl font-bold ${getComparisonDisplay(accuracyChange).color}`}>
                        {accuracyChange > 0 ? '+' : ''}{(accuracyChange * 100).toFixed(1)}%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getComparisonDisplay(accuracyChange).text}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Question-by-Question Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questions.slice(0, 5).map((question, index) => {
                  const currentAnswer = currentAttempt.answers.find(a => a.questionId === question.id);
                  const previousAnswer = previousAttempt?.answers.find(a => a.questionId === question.id);
                  const currentCorrect = currentAnswer?.correct || false;
                  const previousCorrect = previousAnswer?.correct || false;
                  
                  let changeIcon = null;
                  let changeColor = '';
                  
                  if (previousAnswer) {
                    if (currentCorrect && !previousCorrect) {
                      changeIcon = <TrendingUp className="h-4 w-4 text-green-500" />;
                      changeColor = 'border-green-200 bg-green-50/50';
                    } else if (!currentCorrect && previousCorrect) {
                      changeIcon = <TrendingDown className="h-4 w-4 text-red-500" />;
                      changeColor = 'border-red-200 bg-red-50/50';
                    }
                  }

                  return (
                    <div key={question.id} className={`p-3 border rounded-lg ${changeColor}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">Q{index + 1}</span>
                            <Badge variant="outline" className="text-xs">
                              {question.question_type.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {changeIcon}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {question.question_text}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3 ml-4">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Current</div>
                            {currentCorrect ? (
                              <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600 mx-auto" />
                            )}
                          </div>
                          {previousAnswer && (
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">Previous</div>
                              {previousCorrect ? (
                                <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600 mx-auto" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {questions.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Showing first 5 questions. View full results for complete analysis.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizAttemptComparisonModal;