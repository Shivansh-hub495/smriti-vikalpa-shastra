import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Clock,
  Target,
  TrendingUp,
  RotateCcw,
  Home,
  Trophy,
  Star,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ScrollToTop from '@/components/ScrollToTop';

interface StudyStats {
  totalCards: number;
  knowCount: number;
  learningCount: number;
  duration: number;
  deckName?: string;
  deckId?: string;
  learningCardIds?: string[];
}

const StudySummary: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const stats: StudyStats = location.state?.stats || {
    totalCards: 0,
    knowCount: 0,
    learningCount: 0,
    duration: 0,
    deckName: 'Unknown Deck',
    deckId: undefined,
    learningCardIds: []
  };

  console.log('StudySummary received stats:', stats);

  const accuracy = stats.totalCards > 0 ? Math.round((stats.knowCount / stats.totalCards) * 100) : 0;
  const completionRate = 100; // Since we completed all cards

  const getPerformanceMessage = () => {
    if (accuracy >= 90) return { message: "Excellent work! 🎉", color: "text-green-600 dark:text-green-400", icon: Trophy };
    if (accuracy >= 75) return { message: "Great job! 👏", color: "text-blue-600 dark:text-blue-400", icon: Star };
    if (accuracy >= 60) return { message: "Good progress! 👍", color: "text-yellow-600 dark:text-yellow-400", icon: Target };
    return { message: "Keep practicing! 💪", color: "text-orange-600 dark:text-orange-400", icon: TrendingUp };
  };

  const performance = getPerformanceMessage();
  const PerformanceIcon = performance.icon;

  const handleRestartFlashcards = () => {
    // Get deck ID from stats or extract from path as fallback
    const deckId = stats.deckId || location.pathname.split('/')[2];
    if (deckId) {
      navigate(`/study/${deckId}`);
    } else {
      navigate('/study');
    }
  };

  const handleStudyStillLearning = () => {
    // Get deck ID from stats or extract from path as fallback
    const deckId = stats.deckId || location.pathname.split('/')[2];
    console.log('handleStudyStillLearning called:', {
      deckId,
      learningCount: stats.learningCount,
      learningCardIds: stats.learningCardIds
    });

    if (deckId) {
      if (stats.learningCount > 0 && stats.learningCardIds && stats.learningCardIds.length > 0) {
        // Navigate to study session with specific learning card IDs from current session
        const learningCardsParam = stats.learningCardIds.join(',');
        const url = `/study/${deckId}?filter=learning&learningCards=${learningCardsParam}`;
        console.log('Navigating to current session learning cards:', url);
        navigate(url);
      } else {
        // Navigate to study session with filter for recently incorrect cards
        const url = `/study/${deckId}?filter=learning`;
        console.log('Navigating to recent learning cards:', url);
        navigate(url);
      }
    } else {
      console.log('No deck ID found, going back to study');
      navigate('/study');
    }
  };

  const handleBackToDecks = () => {
    navigate('/study');
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="text-center pb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto mb-4"
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center`}>
                  <PerformanceIcon className="h-8 w-8 text-white" />
                </div>
              </motion.div>
              
              <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                Study Complete!
              </CardTitle>
              
              <p className={`text-lg font-semibold ${performance.color}`}>
                {performance.message}
              </p>
              
              {stats.deckName && (
                <Badge variant="secondary" className="mt-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                  {stats.deckName}
                </Badge>
              )}
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Main Stats */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl"
                >
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.knowCount}</div>
                  <div className="text-sm text-green-600 dark:text-green-400">Known</div>
                </motion.div>

                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl"
                >
                  <XCircle className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.learningCount}</div>
                  <div className="text-sm text-orange-600 dark:text-orange-400">Learning</div>
                </motion.div>
              </div>

              {/* Accuracy */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Accuracy</span>
                  <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{accuracy}%</span>
                </div>
                <Progress value={accuracy} className="h-3" />
              </motion.div>

              {/* Additional Stats */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-2 gap-4 pt-2"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Duration</div>
                    <div className="font-semibold text-gray-800 dark:text-gray-100">{stats.duration}m</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Cards</div>
                    <div className="font-semibold text-gray-800 dark:text-gray-100">{stats.totalCards}</div>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="space-y-3 pt-4"
              >
                <Button
                  onClick={handleRestartFlashcards}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-2xl font-semibold"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Restart Flashcards
                </Button>

                <Button
                  onClick={handleStudyStillLearning}
                  disabled={stats.learningCount === 0}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  {stats.learningCount > 0
                    ? `Study Still Learning Cards (${stats.learningCount})`
                    : 'Study Still Learning Cards'
                  }
                </Button>

                <Button
                  onClick={handleBackToDecks}
                  variant="outline"
                  className="w-full py-3 rounded-2xl border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Decks
                </Button>
              </motion.div>

              {/* Motivational Message */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center pt-4 border-t border-gray-100 dark:border-gray-700"
              >
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {accuracy >= 80 
                    ? "You're mastering this deck! Keep up the excellent work." 
                    : stats.learningCount > 0 
                    ? "Those cards will come back for review. Spaced repetition helps you learn!"
                    : "Great session! Regular practice leads to mastery."
                  }
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <ScrollToTop />
    </div>
  );
};

export default StudySummary;
