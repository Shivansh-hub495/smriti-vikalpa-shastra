/**
 * @fileoverview QuizAttemptHistory component for displaying quiz attempt history
 * @description Shows user's quiz attempt history with scores, dates, and performance analytics
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, 
  Clock, 
  Calendar, 
  TrendingUp, 
  RotateCcw,
  Eye,
  Target,
  BarChart3,
  TrendingDown,
  Minus,
  Award,
  Zap,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatTime, calculateQuizStats } from '@/utils/quizUtils';
import type { Quiz, QuizAttempt, QuizAttemptStats } from '@/types/quiz';

interface QuizAttemptHistoryProps {
  /** The quiz to show attempts for */
  quiz: Quiz;
  /** User ID to filter attempts (optional, defaults to current user) */
  userId?: string;
  /** Callback when user wants to retake quiz */
  onRetake?: () => void;
  /** Callback when user wants to view attempt details */
  onViewAttempt?: (attempt: QuizAttempt) => void;
}

/**
 * QuizAttemptHistory component for displaying quiz attempt history
 */
const QuizAttemptHistory: React.FC<QuizAttemptHistoryProps> = ({
  quiz,
  userId,
  onRetake,
  onViewAttempt
}) => {
  const { toast } = useToast();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [stats, setStats] = useState<QuizAttemptStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load quiz attempts
  useEffect(() => {
    const loadAttempts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use MCP to fetch quiz attempts
        const { mcp_supabase_execute_sql } = window as any;
        
        const query = userId 
          ? `SELECT * FROM quiz_attempts WHERE quiz_id = '${quiz.id}' AND user_id = '${userId}' ORDER BY created_at DESC`
          : `SELECT * FROM quiz_attempts WHERE quiz_id = '${quiz.id}' ORDER BY created_at DESC`;
        
        const response = await mcp_supabase_execute_sql({
          query
        });

        // MCP returns data directly, not in a data property
        const attemptsData = Array.isArray(response) ? response : response?.data || [];

        if (attemptsData) {
          const loadedAttempts: QuizAttempt[] = attemptsData.map((attempt: any) => ({
            ...attempt,
            answers: typeof attempt.answers === 'string' 
              ? JSON.parse(attempt.answers) 
              : attempt.answers || []
          }));
          
          setAttempts(loadedAttempts);
          
          // Calculate statistics with enhanced metrics
          const calculatedStats = calculateQuizStats(loadedAttempts, quiz.settings.passingScore);
          setStats(calculatedStats);
        }

      } catch (err) {
        console.error('Error loading quiz attempts:', err);
        setError('Failed to load quiz attempts');
        toast({
          title: "Error",
          description: "Failed to load quiz attempt history.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAttempts();
  }, [quiz.id, userId, quiz.settings.passingScore, toast]);

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

  // Get score badge variant
  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    if (score >= 50) return 'outline';
    return 'destructive';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (attempts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Attempts Yet</h3>
            <p className="mb-4">You haven't taken this quiz yet.</p>
            {onRetake && (
              <Button onClick={onRetake}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Take Quiz
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Performance Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Attempts */}
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {stats.totalAttempts}
                </div>
                <p className="text-sm text-muted-foreground">Total Attempts</p>
                <Activity className="h-4 w-4 mx-auto mt-1 text-blue-500" />
              </div>

              {/* Best Score */}
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(stats.bestScore || 0)}`}>
                  {stats.bestScore?.toFixed(1) || 0}%
                </div>
                <p className="text-sm text-muted-foreground">Best Score</p>
                <Trophy className="h-4 w-4 mx-auto mt-1 text-yellow-500" />
              </div>

              {/* Average Score */}
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(stats.averageScore || 0)}`}>
                  {stats.averageScore?.toFixed(1) || 0}%
                </div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <TrendingUp className="h-4 w-4 mx-auto mt-1 text-blue-500" />
              </div>

              {/* Average Time */}
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {stats.averageTime ? formatTime(stats.averageTime) : 'N/A'}
                </div>
                <p className="text-sm text-muted-foreground">Average Time</p>
                <Clock className="h-4 w-4 mx-auto mt-1 text-purple-500" />
              </div>
            </div>

            {/* Enhanced Progress Tracking */}
            {stats.totalAttempts > 1 && (
              <div className="mt-8 space-y-6">
                {/* Performance Trends */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Improvement Trend */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm">Performance Trend</h4>
                      {(stats as any).improvementTrend > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (stats as any).improvementTrend < 0 ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <Minus className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <div className="text-2xl font-bold mb-1">
                      <span className={
                        (stats as any).improvementTrend > 0 ? 'text-green-600' :
                        (stats as any).improvementTrend < 0 ? 'text-red-600' : 'text-gray-600'
                      }>
                        {(stats as any).improvementTrend > 0 ? '+' : ''}{(stats as any).improvementTrend?.toFixed(1) || 0}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(stats as any).improvementTrend > 0 ? 'Improving over time' :
                       (stats as any).improvementTrend < 0 ? 'Declining performance' : 'Stable performance'}
                    </p>
                  </div>

                  {/* Consistency Score */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm">Consistency</h4>
                      <Award className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold mb-1 text-blue-600">
                      {(stats as any).consistencyScore?.toFixed(0) || 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(stats as any).consistencyScore > 80 ? 'Very consistent' :
                       (stats as any).consistencyScore > 60 ? 'Moderately consistent' : 'Variable performance'}
                    </p>
                  </div>
                </div>

                {/* Score Progress Chart (Simple visualization) */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-sm mb-4">Score Progress</h4>
                  <div className="space-y-2">
                    {attempts.slice(0, 10).reverse().map((attempt, index) => {
                      const score = attempt.score || 0;
                      const isLatest = index === attempts.length - 1;
                      return (
                        <div key={attempt.id} className="flex items-center space-x-3">
                          <div className="text-xs text-muted-foreground w-8">
                            #{attempts.length - index}
                          </div>
                          <div className="flex-1 bg-muted rounded-full h-2 relative">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                score >= 90 ? 'bg-green-500' :
                                score >= 70 ? 'bg-blue-500' :
                                score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.max(score, 5)}%` }}
                            />
                            {isLatest && (
                              <div className="absolute -top-1 -right-1">
                                <Zap className="h-3 w-3 text-yellow-500" />
                              </div>
                            )}
                          </div>
                          <div className="text-xs font-medium w-12 text-right">
                            {score.toFixed(0)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {attempts.length > 10 && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Showing last 10 attempts
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Pass/Fail Status */}
            {quiz.settings.passingScore && stats.hasPassed !== undefined && (
              <div className="mt-6 text-center">
                <Badge 
                  variant={stats.hasPassed ? "default" : "destructive"}
                  className="text-lg px-4 py-2"
                >
                  {stats.hasPassed ? "PASSED" : "NOT PASSED"}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  Passing score: {quiz.settings.passingScore}%
                </p>
              </div>
            )}

            {/* Retake Button */}
            {onRetake && (
              <div className="flex justify-center mt-6">
                <Button onClick={onRetake}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake Quiz
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attempt History */}
      <Card>
        <CardHeader>
          <CardTitle>Attempt History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attempts.map((attempt, index) => {
              const previousAttempt = index < attempts.length - 1 ? attempts[index + 1] : null;
              const scoreChange = previousAttempt ? (attempt.score || 0) - (previousAttempt.score || 0) : 0;
              const timeChange = previousAttempt && attempt.time_taken && previousAttempt.time_taken 
                ? attempt.time_taken - previousAttempt.time_taken : 0;
              const isBestScore = attempt.score === stats?.bestScore;
              const isLatestAttempt = index === 0;

              return (
                <div
                  key={attempt.id}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                    isBestScore ? 'ring-2 ring-yellow-200 bg-yellow-50/50 dark:ring-yellow-800 dark:bg-yellow-900/20' : ''
                  } ${
                    isLatestAttempt ? 'ring-2 ring-blue-200 bg-blue-50/50 dark:ring-blue-800 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 flex flex-col items-center space-y-1">
                      <Badge variant="outline" className="text-xs">
                        #{attempts.length - index}
                      </Badge>
                      {isBestScore && (
                        <Trophy className="h-3 w-3 text-yellow-500" />
                      )}
                      {isLatestAttempt && (
                        <Zap className="h-3 w-3 text-blue-500" />
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={getScoreBadgeVariant(attempt.score || 0)}>
                          {attempt.score?.toFixed(1) || 0}%
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {attempt.correct_answers}/{attempt.total_questions} correct
                        </span>
                        
                        {/* Score comparison with previous attempt */}
                        {previousAttempt && (
                          <div className="flex items-center space-x-1">
                            {scoreChange > 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : scoreChange < 0 ? (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            ) : (
                              <Minus className="h-3 w-3 text-gray-500" />
                            )}
                            <span className={`text-xs ${
                              scoreChange > 0 ? 'text-green-600' :
                              scoreChange < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {scoreChange > 0 ? '+' : ''}{scoreChange.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(attempt.completed_at || attempt.created_at)}</span>
                        </div>
                        
                        {attempt.time_taken && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(attempt.time_taken)}</span>
                            {/* Time comparison with previous attempt */}
                            {previousAttempt && previousAttempt.time_taken && (
                              <span className={`text-xs ml-1 ${
                                timeChange < 0 ? 'text-green-600' :
                                timeChange > 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                ({timeChange < 0 ? '' : '+'}{formatTime(Math.abs(timeChange))})
                              </span>
                            )}
                          </div>
                        )}
                        
                        {quiz.settings.passingScore && (
                          <div className="flex items-center space-x-1">
                            <Target className="h-3 w-3" />
                            <span className={
                              (attempt.score || 0) >= quiz.settings.passingScore 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }>
                              {(attempt.score || 0) >= quiz.settings.passingScore ? 'Passed' : 'Failed'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {onViewAttempt && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewAttempt(attempt)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizAttemptHistory;