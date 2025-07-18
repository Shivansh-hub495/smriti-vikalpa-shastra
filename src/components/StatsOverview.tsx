
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, BookOpen, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStats {
  studyStreak: number;
  overallAccuracy: number;
  cardsReviewed: number;
  studyTime: number;
}

const StatsOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    studyStreak: 0,
    overallAccuracy: 0,
    cardsReviewed: 0,
    studyTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      // Use count queries for better performance and accuracy
      const [totalSessionsResponse, correctSessionsResponse, recentSessionsResponse] = await Promise.all([
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
        // Recent sessions for streak calculation (last 30 days)
        supabase
          .from('study_sessions')
          .select('created_at')
          .eq('user_id', user?.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
      ]);

      if (totalSessionsResponse.error) throw totalSessionsResponse.error;
      if (correctSessionsResponse.error) throw correctSessionsResponse.error;
      if (recentSessionsResponse.error) throw recentSessionsResponse.error;

      // Calculate stats from count queries (more accurate and efficient)
      const totalReviews = totalSessionsResponse.count || 0;
      const totalCorrect = correctSessionsResponse.count || 0;

      // Calculate study streak based on recent sessions (more accurate)
      const today = new Date();
      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];

        const hasActivity = recentSessionsResponse.data?.some(session =>
          session.created_at?.startsWith(dateStr)
        );

        if (hasActivity) {
          if (i === 0 || streak === i) streak = i + 1;
        } else if (i === 0) {
          break;
        }
      }

      // Estimate study time based on reviews (assuming 30 seconds per review)
      const estimatedStudyTimeMinutes = totalReviews * 0.5;
      const studyTimeHours = estimatedStudyTimeMinutes / 60;

      setStats({
        studyStreak: streak,
        overallAccuracy: totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0,
        cardsReviewed: totalReviews,
        studyTime: Math.round(studyTimeHours * 10) / 10
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    {
      title: "Study Streak",
      value: loading ? "..." : stats.studyStreak.toString(),
      unit: "days",
      icon: TrendingUp,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50"
    },
    {
      title: "Overall Accuracy",
      value: loading ? "..." : stats.overallAccuracy.toString(),
      unit: "%",
      icon: Target,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50"
    },
    {
      title: "Cards Reviewed",
      value: loading ? "..." : stats.cardsReviewed.toLocaleString(),
      unit: "total",
      icon: BookOpen,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50"
    },
    {
      title: "Study Time",
      value: loading ? "..." : stats.studyTime.toString(),
      unit: "hrs total",
      icon: Clock,
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <Card key={index} className="group relative overflow-hidden bg-white/80 backdrop-blur-lg border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:scale-105 rounded-2xl">
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50 group-hover:opacity-70 transition-opacity duration-500`}></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
              {stat.title}
            </CardTitle>
            <div className="relative">
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-xl blur opacity-75`}></div>
              <div className={`relative p-3 rounded-xl bg-gradient-to-r ${stat.gradient} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {stat.unit}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsOverview;
