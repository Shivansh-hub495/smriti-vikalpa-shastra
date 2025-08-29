import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { TrendingUp, Target, Clock, BookOpen, Calendar, Award, Brain, Percent, BarChart3 } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  ResponsiveLineChart,
  ResponsiveAreaChart,
  ResponsiveBarChart,
  ResponsivePieChart,
  StudyStreakHeatmap
} from '@/components/charts/ResponsiveChart';

interface Flashcard {
  id: string;
  deck_id: string;
  user_id: string;
  review_count: number;
  correct_count: number;
  created_at: string;
  updated_at: string;
  deck?: {
    name: string;
  };
}

interface ProgressStats {
  totalReviews: number;
  totalCards: number;
  totalCorrect: number;
  totalTime: number;
  averageAccuracy: number;
  studyStreak: number;
  weeklyProgress: Array<{ date: string; reviews: number; accuracy: number }>;
  deckPerformance: Array<{ name: string; accuracy: number; reviews: number }>;
  accuracyBreakdown: Array<{ name: string; value: number }>;
  streakData: Array<{ date: string; value: number }>;
}

interface QuizStats {
  totalQuizzes: number;
  totalQuizAttempts: number;
  avgQuizScore: number; // percentage 0-100
  bestQuizScore: number; // percentage 0-100
}

interface RecentQuizAttempt {
  id: string;
  quiz_id: string;
  score: number | null;
  created_at: string;
  title?: string;
}

const Progress = () => {
  const { user } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [stats, setStats] = useState<ProgressStats>({
    totalReviews: 0,
    totalCards: 0,
    totalCorrect: 0,
    totalTime: 0,
    averageAccuracy: 0,
    studyStreak: 0,
    weeklyProgress: [],
    deckPerformance: [],
    accuracyBreakdown: [],
    streakData: []
  });
  const [loading, setLoading] = useState(true);
  const [quizStats, setQuizStats] = useState<QuizStats>({ totalQuizzes: 0, totalQuizAttempts: 0, avgQuizScore: 0, bestQuizScore: 0 });
  const [recentQuizAttempts, setRecentQuizAttempts] = useState<RecentQuizAttempt[]>([]);

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user]);

  const fetchProgressData = async () => {
    try {
      console.log('Fetching progress data for user:', user?.id);
      console.log('User object:', user);
      // Fetch flashcards and use optimized count queries for study sessions
      // Also fetch quiz stats using Supabase MCP for richer analytics
      const [flashcardsResponse, totalSessionsResponse, correctSessionsResponse, recentSessionsResponse, mcpQuizAggResponse, mcpRecentAttempts] = await Promise.all([
        supabase
          .from('flashcards')
          .select(`
            *,
            deck:decks(name)
          `)
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false }),
        // Total sessions count
        supabase
          .from('study_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user?.id),
        // Correct sessions count
        supabase
          .from('study_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user?.id)
          .eq('was_correct', true),
        // Recent sessions for detailed calculations (last 60 days)
        supabase
          .from('study_sessions')
          .select('created_at, was_correct, flashcard_id')
          .eq('user_id', user?.id)
          .gte('created_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false }),
        // Quiz aggregate stats - try MCP first, fallback to Supabase client
        (async () => {
          try {
            if ((window as any).mcp_supabase_execute_sql) {
              return await (window as any).mcp_supabase_execute_sql({
                query: `
                  SELECT
                    COUNT(DISTINCT q.id) AS total_quizzes,
                    COUNT(qa.id) AS total_attempts,
                    COALESCE(AVG(qa.score), 0) AS avg_score,
                    COALESCE(MAX(qa.score), 0) AS best_score
                  FROM quizzes q
                  LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.user_id = '${user?.id}' AND qa.completed_at IS NOT NULL
                  WHERE q.user_id = '${user?.id}'
                `
              });
            } else {
              // Fallback to regular Supabase client - direct queries
              const { data: quizzes } = await supabase.from('quizzes').select('id').eq('user_id', user?.id);
              const { data: attempts } = await supabase.from('quiz_attempts').select('score').eq('user_id', user?.id).not('completed_at', 'is', null);
              const scores = attempts?.map(a => a.score).filter(s => s != null) || [];
              return [{
                total_quizzes: quizzes?.length || 0,
                total_attempts: attempts?.length || 0,
                avg_score: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
                best_score: scores.length > 0 ? Math.max(...scores) : 0
              }];
            }
          } catch (err) {
            console.warn('MCP quiz stats failed, using fallback:', err);
            // Manual fallback query
            const { data: quizzes } = await supabase.from('quizzes').select('id').eq('user_id', user?.id);
            const { data: attempts } = await supabase.from('quiz_attempts').select('score').eq('user_id', user?.id).not('completed_at', 'is', null);
            const scores = attempts?.map(a => a.score).filter(s => s != null) || [];
            return [{
              total_quizzes: quizzes?.length || 0,
              total_attempts: attempts?.length || 0,
              avg_score: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
              best_score: scores.length > 0 ? Math.max(...scores) : 0
            }];
          }
        })(),
        // Recent quiz attempts with quiz titles
        (async () => {
          try {
            if ((window as any).mcp_supabase_execute_sql) {
              return await (window as any).mcp_supabase_execute_sql({
                query: `
                  SELECT qa.id, qa.quiz_id, qa.score, qa.created_at, q.title
                  FROM quiz_attempts qa
                  JOIN quizzes q ON q.id = qa.quiz_id
                  WHERE qa.user_id = '${user?.id}'
                  ORDER BY qa.created_at DESC
                  LIMIT 6
                `
              });
            } else {
              // Fallback to regular Supabase client
              const { data, error } = await supabase
                .from('quiz_attempts')
                .select(`
                  id,
                  quiz_id,
                  score,
                  created_at,
                  quizzes!inner(title)
                `)
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })
                .limit(6);
              if (error) throw error;
              return data?.map(attempt => ({
                id: attempt.id,
                quiz_id: attempt.quiz_id,
                score: attempt.score,
                created_at: attempt.created_at,
                title: (attempt.quizzes as any)?.title
              })) || [];
            }
          } catch (err) {
            console.warn('MCP recent attempts failed, using fallback:', err);
            return [];
          }
        })()
      ]);

      if (flashcardsResponse.error) throw flashcardsResponse.error;
      if (totalSessionsResponse.error) throw totalSessionsResponse.error;
      if (correctSessionsResponse.error) throw correctSessionsResponse.error;
      if (recentSessionsResponse.error) throw recentSessionsResponse.error;

      setFlashcards(flashcardsResponse.data || []);
      calculateStats(
        flashcardsResponse.data || [],
        recentSessionsResponse.data || [],
        totalSessionsResponse.count || 0,
        correctSessionsResponse.count || 0
      );

      // Parse quiz aggregates (MCP or fallback response)
      console.log('Quiz aggregates response:', mcpQuizAggResponse);
      const aggRows = Array.isArray(mcpQuizAggResponse)
        ? mcpQuizAggResponse
        : (mcpQuizAggResponse?.data || []);
      if (aggRows && aggRows.length > 0) {
        const row: any = aggRows[0];
        const quizStatsData = {
          totalQuizzes: Number(row.total_quizzes) || 0,
          totalQuizAttempts: Number(row.total_attempts) || 0,
          avgQuizScore: Math.round(Number(row.avg_score) || 0),
          bestQuizScore: Math.round(Number(row.best_score) || 0),
        };
        console.log('Setting quiz stats:', quizStatsData);
        setQuizStats(quizStatsData);
      } else {
        console.log('No quiz aggregate data found');
      }

      // Parse recent attempts (MCP or fallback response)
      console.log('Recent attempts response:', mcpRecentAttempts);
      const recentRows = Array.isArray(mcpRecentAttempts)
        ? mcpRecentAttempts
        : (mcpRecentAttempts?.data || []);
      if (recentRows && recentRows.length > 0) {
        const recentAttemptsData = recentRows.map((r: any) => ({
          id: r.id,
          quiz_id: r.quiz_id,
          score: r.score,
          created_at: r.created_at,
          title: r.title,
        }));
        console.log('Setting recent attempts:', recentAttemptsData);
        setRecentQuizAttempts(recentAttemptsData);
      } else {
        console.log('No recent attempts data found');
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (flashcards: Flashcard[], recentSessions: any[], totalSessionsCount: number, correctSessionsCount: number) => {
    const totalCards = flashcards.length;
    // Use count queries for accurate total stats
    const totalReviews = totalSessionsCount;
    const totalCorrect = correctSessionsCount;
    const totalTime = totalReviews * 0.5 / 60; // Estimate 30 seconds per review, convert to hours
    const averageAccuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

    // Calculate study streak based on recent sessions (more accurate)
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const hasActivity = recentSessions.some(session =>
        session.created_at?.startsWith(dateStr)
      );

      if (hasActivity) {
        if (i === 0 || streak === i) streak = i + 1;
      } else if (i === 0) {
        break;
      }
    }

    // Calculate weekly progress using recent sessions (more accurate)
    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const daySessions = recentSessions.filter(session =>
        session.created_at?.startsWith(dateStr)
      );

      const dayReviews = daySessions.length;
      const dayCorrect = daySessions.filter(session => session.was_correct).length;
      const dayAccuracy = dayReviews > 0 ? Math.round((dayCorrect / dayReviews) * 100) : 0;

      weeklyProgress.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        reviews: dayReviews,
        accuracy: dayAccuracy
      });
    }

    // Calculate deck performance
    const deckMap = new Map();
    flashcards.forEach(card => {
      const deckName = card.deck?.name || 'Unknown Deck';
      if (!deckMap.has(deckName)) {
        deckMap.set(deckName, { reviews: 0, correct: 0 });
      }
      const deck = deckMap.get(deckName);
      deck.reviews += card.review_count || 0;
      deck.correct += card.correct_count || 0;
    });

    const deckPerformance = Array.from(deckMap.entries()).map(([name, data]) => ({
      name,
      accuracy: data.reviews > 0 ? Math.round((data.correct / data.reviews) * 100) : 0,
      reviews: data.reviews
    }));

    // Calculate accuracy breakdown
    const accuracyBreakdown = [
      { name: 'Correct', value: totalCorrect },
      { name: 'Incorrect', value: totalReviews - totalCorrect }
    ];

    // Generate streak heatmap data using recent sessions (more accurate)
    const streakData = [];
    for (let i = 48; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayActivity = recentSessions.filter(session =>
        session.created_at?.startsWith(dateStr)
      ).length;

      streakData.push({
        date: dateStr,
        value: dayActivity
      });
    }

    setStats({
      totalReviews,
      totalCards,
      totalCorrect,
      totalTime,
      averageAccuracy,
      studyStreak: streak,
      weeklyProgress,
      deckPerformance,
      accuracyBreakdown,
      streakData
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors" />
          <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">Progress</h1>
            <p className="text-gray-600 dark:text-gray-300">Track your learning journey and achievements</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Reviews</p>
                  <p className="text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalReviews.toLocaleString()}</p>
                </div>
                <div className="p-2 lg:p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <BookOpen className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Cards</p>
                  <p className="text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalCards.toLocaleString()}</p>
                </div>
                <div className="p-2 lg:p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <Target className="h-5 w-5 lg:h-6 lg:w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Average Accuracy</p>
                  <p className="text-2xl lg:text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.averageAccuracy}%</p>
                </div>
                <div className="p-2 lg:p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Study Streak</p>
                  <p className="text-2xl lg:text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.studyStreak}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">days</p>
                </div>
                <div className="p-2 lg:p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <Award className="h-5 w-5 lg:h-6 lg:w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quiz Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Quizzes</p>
                  <p className="text-2xl lg:text-3xl font-bold text-indigo-600 dark:text-indigo-400">{quizStats.totalQuizzes}</p>
                </div>
                <div className="p-2 lg:p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-full">
                  <Brain className="h-5 w-5 lg:h-6 lg:w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Quiz Attempts</p>
                  <p className="text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400">{quizStats.totalQuizAttempts}</p>
                </div>
                <div className="p-2 lg:p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <BarChart3 className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg Quiz Score</p>
                  <p className="text-2xl lg:text-3xl font-bold text-purple-600 dark:text-purple-400">{quizStats.avgQuizScore}%</p>
                </div>
                <div className="p-2 lg:p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <Percent className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Best Quiz Score</p>
                  <p className="text-2xl lg:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{quizStats.bestQuizScore}%</p>
                </div>
                <div className="p-2 lg:p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-full">
                  <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
          {/* Weekly Progress Chart */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl font-semibold text-gray-800 dark:text-gray-100">Weekly Progress</CardTitle>
            </CardHeader>
            <CardContent className="p-4 lg:p-6">
              <ResponsiveAreaChart
                data={stats.weeklyProgress}
                xKey="date"
                yKey="reviews"
                areaColor="#8b5cf6"
                height={250}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Accuracy Breakdown */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl font-semibold text-gray-800 dark:text-gray-100">Accuracy Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-4 lg:p-6">
              <ResponsivePieChart
                data={stats.accuracyBreakdown}
                dataKey="value"
                nameKey="name"
                colors={['#10b981', '#ef4444']}
                height={250}
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-8">
          {/* Deck Performance */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl font-semibold text-gray-800 dark:text-gray-100">Deck Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-4 lg:p-6">
              <ResponsiveBarChart
                data={stats.deckPerformance}
                xKey="name"
                yKey="accuracy"
                barColor="#3b82f6"
                height={300}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Study Streak Heatmap */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl font-semibold text-gray-800 dark:text-gray-100">Study Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-4 lg:p-6">
              <StudyStreakHeatmap
                data={stats.streakData}
                className="w-full flex flex-col items-center"
                title=""
              />
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Current streak: <span className="font-semibold text-orange-600 dark:text-orange-400">{stats.studyStreak} days</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Summary */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg lg:text-xl font-semibold text-gray-800 dark:text-gray-100">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            {flashcards.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">No flashcards yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create some flashcards to see your progress here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {flashcards.slice(0, 6).map((card) => (
                  <div key={card.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="font-medium text-gray-800 dark:text-gray-100 mb-2">
                      {card.deck?.name || 'Unknown Deck'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      Reviews: {card.review_count || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Accuracy: {card.review_count > 0 ? Math.round(((card.correct_count || 0) / card.review_count) * 100) : 0}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Last reviewed: {new Date(card.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Quiz Attempts */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg lg:text-xl font-semibold text-gray-800 dark:text-gray-100">Recent Quiz Attempts</CardTitle>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            {recentQuizAttempts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">No quiz attempts yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentQuizAttempts.map((attempt) => (
                  <div key={attempt.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="font-medium text-gray-800 dark:text-gray-100 mb-2 truncate" title={attempt.title || 'Quiz'}>
                      {attempt.title || 'Quiz'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      Score: {attempt.score != null ? Math.round(attempt.score) : '—'}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(attempt.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Progress;
