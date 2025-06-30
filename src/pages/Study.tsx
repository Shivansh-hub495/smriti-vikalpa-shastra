import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, Target, TrendingUp, Play, Pause, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import StudyOptionsModal, { StudyOptions } from '@/components/StudyOptionsModal';

interface Deck {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  folder_id: string;
  user_id: string;
  created_at: string;
  folder?: {
    name: string;
  };
}

interface StudySession {
  id: string;
  deck_id: string;
  deck_name: string;
  correct_answers: number;
  total_questions: number;
  created_at: string;
}

const Study = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [todayStats, setTodayStats] = useState({
    studyTime: 0,
    cardsReviewed: 0,
    accuracy: 0
  });
  const [loading, setLoading] = useState(true);
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [deckCardCount, setDeckCardCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchDecks();
      fetchRecentSessions();
      fetchTodayStats();
    }
  }, [user]);

  const fetchDecks = async () => {
    try {
      const { data, error } = await supabase
        .from('decks')
        .select(`
          *,
          folder:folders(name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDecks(data || []);
    } catch (error) {
      console.error('Error fetching decks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentSessions = async () => {
    try {
      // Get recent study sessions grouped by date and deck
      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select(`
          *,
          deck:decks(name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50); // Get more to group properly

      if (error) throw error;

      // Group sessions by date and deck
      const groupedSessions = new Map();

      sessions?.forEach(session => {
        const date = session.created_at.split('T')[0];
        const key = `${date}-${session.deck_id}`;

        if (!groupedSessions.has(key)) {
          groupedSessions.set(key, {
            id: key,
            deck_id: session.deck_id,
            deck_name: session.deck?.name || 'Unknown Deck',
            correct_answers: 0,
            total_questions: 0,
            created_at: session.created_at
          });
        }

        const group = groupedSessions.get(key);
        group.total_questions++;
        if (session.was_correct) {
          group.correct_answers++;
        }
      });

      // Convert to array and take latest 5
      const recentSessionsArray = Array.from(groupedSessions.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setRecentSessions(recentSessionsArray);
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
    }
  };

  const fetchTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get today's study sessions
      const { data: todaySessions, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      if (error) throw error;

      const sessions = todaySessions || [];
      const cardsReviewed = sessions.length;
      const correctAnswers = sessions.filter(s => s.was_correct).length;
      const accuracy = cardsReviewed > 0 ? Math.round((correctAnswers / cardsReviewed) * 100) : 0;

      // Estimate study time (30 seconds per card on average)
      const studyTime = Math.round((cardsReviewed * 0.5)); // 0.5 minutes per card

      setTodayStats({
        studyTime,
        cardsReviewed,
        accuracy
      });
    } catch (error) {
      console.error('Error fetching today stats:', error);
    }
  };

  const startStudySession = async (deckId: string) => {
    // Find the deck and get card count
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;

    try {
      // Get card count for this deck
      const { count, error } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('deck_id', deckId);

      if (error) throw error;

      setSelectedDeck(deck);
      setDeckCardCount(count || 0);
      setShowStudyModal(true);
    } catch (error) {
      console.error('Error getting deck card count:', error);
      // Fallback to direct navigation if error
      navigate(`/study/${deckId}`);
    }
  };

  const handleStudyStart = (options: StudyOptions) => {
    if (!selectedDeck) return;

    let url = `/study/${selectedDeck.id}`;

    // Add query parameters based on options
    const params = new URLSearchParams();

    if (options.mode === 'shuffle') {
      params.set('shuffle', 'true');
    } else if (options.mode === 'startFrom' && options.startFromCard) {
      params.set('startFrom', options.startFromCard.toString());
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    setShowStudyModal(false);
    setSelectedDeck(null);
    navigate(url);
  };

  const handleModalClose = () => {
    setShowStudyModal(false);
    setSelectedDeck(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
                ))}
              </div>
              <div className="h-64 bg-gray-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4">
          <SidebarTrigger className="text-gray-600 hover:text-gray-900 transition-colors" />
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">Study</h1>
            <p className="text-sm sm:text-base text-gray-600">Choose a deck to start your study session</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Available Decks */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Available Decks</h2>
            
            {decks.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No decks available</h3>
                  <p className="text-gray-600 mb-6">Create your first deck to start studying</p>
                  <Button
                    onClick={() => navigate('/create')}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    Create Deck
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {decks.map((deck) => (
                  <Card
                    key={deck.id}
                    className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300"
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 break-words leading-tight">{deck.name}</h3>
                            {deck.folder && (
                              <Badge variant="secondary" className="bg-purple-100 text-purple-800 w-fit">
                                {deck.folder.name}
                              </Badge>
                            )}
                          </div>
                          {deck.description && (
                            <p className="text-sm sm:text-base text-gray-600 mb-3 line-clamp-2">{deck.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {deck.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="w-full sm:w-auto sm:ml-6">
                          <Button
                            onClick={() => startStudySession(deck.id)}
                            className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm sm:text-base py-2 sm:py-2.5"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Study Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Study Stats & Recent Sessions */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Stats */}
            <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-800">Today's Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-xs sm:text-sm text-gray-600">Study Time</span>
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-gray-800">{todayStats.studyTime} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="text-xs sm:text-sm text-gray-600">Cards Reviewed</span>
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-gray-800">{todayStats.cardsReviewed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <span className="text-xs sm:text-sm text-gray-600">Accuracy</span>
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-gray-800">
                    {todayStats.cardsReviewed > 0 ? `${todayStats.accuracy}%` : '--%'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {recentSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <RotateCcw className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No recent sessions</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-sm font-medium text-gray-800">
                            {session.deck_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {session.correct_answers}/{session.total_questions} correct ({Math.round((session.correct_answers / session.total_questions) * 100)}%)
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(session.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Study Options Modal */}
      {selectedDeck && (
        <StudyOptionsModal
          isOpen={showStudyModal}
          onClose={handleModalClose}
          onStartStudy={handleStudyStart}
          deckName={selectedDeck.name}
          totalCards={deckCardCount}
        />
      )}
    </div>
  );
};

export default Study;
