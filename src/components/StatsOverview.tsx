
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, BookOpen, Clock } from "lucide-react";

const StatsOverview = () => {
  const stats = [
    {
      title: "Study Streak",
      value: "12",
      unit: "days",
      icon: TrendingUp,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50"
    },
    {
      title: "Overall Accuracy",
      value: "87",
      unit: "%",
      icon: Target,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50"
    },
    {
      title: "Cards Reviewed",
      value: "1,247",
      unit: "total",
      icon: BookOpen,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50"
    },
    {
      title: "Study Time",
      value: "2.5",
      unit: "hrs today",
      icon: Clock,
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
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
