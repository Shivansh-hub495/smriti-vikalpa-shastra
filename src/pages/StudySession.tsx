import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Settings, RotateCcw, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { sortCardsByPriority } from '@/lib/spacedRepetition';

// Custom hooks
import { useCardState } from '@/hooks/useCardState';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useStudyDatabase } from '@/hooks/useStudyDatabase';

// Components
import SwipeableCard from '@/components/SwipeableCard';
import SwipeIndicator from '@/components/SwipeIndicator';

interface Flashcard {
  id: string;
  deck_id: string;
  user_id: string;
  front_content: string;
  back_content: string;
  front_image_url?: string;
  back_image_url?: string;
  difficulty: number;
  next_review_date: string;
  review_count: number;
  correct_count: number;
  created_at: string;
  updated_at: string;
}

interface Deck {
  id: string;
  name: string;
  description?: string;
}

interface StudyStats {
  totalCards: number;
  currentIndex: number;
  knowCount: number;
  learningCount: number;
  startTime: Date;
  learningCardIds?: string[];
}

const StudySession: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Core state
  const [deck, setDeck] = useState<Deck | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionStartTime] = useState(new Date());
  const [isLearningFilter, setIsLearningFilter] = useState(false);
  const [learningCardIds, setLearningCardIds] = useState<string[]>([]);

  // Center indicator state
  const [showCenterIndicator, setShowCenterIndicator] = useState<{
    show: boolean;
    type: 'know' | 'learning' | null
  }>({ show: false, type: null });

  // Modal state to disable swipe when modal is open
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Custom hooks for state management
  const cardState = useCardState(flashcards.length);
  const { saveCardResponse } = useStudyDatabase();

  /**
   * Handle session completion and navigation to summary
   */
  const handleSessionComplete = useCallback((wasCorrect: boolean) => {
    const sessionDuration = Math.round(
      (new Date().getTime() - sessionStartTime.getTime()) / 1000 / 60
    );

    navigate('/study/summary', {
      state: {
        stats: {
          ...cardState.stats,
          knowCount: wasCorrect ? cardState.stats.knowCount + 1 : cardState.stats.knowCount,
          learningCount: !wasCorrect ? cardState.stats.learningCount + 1 : cardState.stats.learningCount,
          duration: sessionDuration,
          deckName: deck?.name,
          deckId: deckId,
          learningCardIds: !wasCorrect
            ? [...(cardState.stats.learningCardIds || []), flashcards[cardState.currentIndex].id]
            : cardState.stats.learningCardIds || []
        }
      }
    });
  }, [navigate, sessionStartTime, deck?.name, deckId, flashcards, cardState.stats]);

  /**
   * Main card response handler
   * Processes user's answer and manages state transitions
   */
  const handleCardResponse = useCallback((wasCorrect: boolean) => {
    if (cardState.currentIndex >= flashcards.length) {
      return;
    }

    const currentCard = flashcards[cardState.currentIndex];
    const responseTime = new Date().getTime() - cardState.cardStartTime.getTime();

    // Show immediate feedback
    setShowCenterIndicator({ show: true, type: wasCorrect ? 'know' : 'learning' });
    setTimeout(() => {
      setShowCenterIndicator({ show: false, type: null });
    }, 600);

    // Update card state
    cardState.addToHistory(cardState.currentIndex, wasCorrect);
    cardState.updateStats(wasCorrect, currentCard.id);

    // Handle session completion or move to next card
    if (cardState.currentIndex + 1 >= flashcards.length) {
      handleSessionComplete(wasCorrect);
    } else {
      cardState.moveToNextCard();
    }

    // Save to database asynchronously
    saveCardResponse({
      card: currentCard,
      wasCorrect,
      responseTime,
      userId: user?.id,
      deckId: deckId
    });
  }, [
    flashcards,
    saveCardResponse,
    user?.id,
    deckId,
    handleSessionComplete,
    cardState
  ]);

  // Card response handlers
  const handleSwipeLeft = useCallback(() => {
    handleCardResponse(false);
  }, [handleCardResponse]);

  const handleSwipeRight = useCallback(() => {
    handleCardResponse(true);
  }, [handleCardResponse]);

  // Swipe gesture hook
  const swipeGesture = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    disabled: cardState.currentIndex >= flashcards.length || isModalOpen
  });

  useEffect(() => {
    const fetchDeckAndFlashcardsWithFilter = async (isLearning: boolean, cardIds: string[]) => {
      try {
        setLoading(true);

        // Fetch deck details
        const { data: deckData, error: deckError } = await supabase
          .from('decks')
          .select('id, name, description')
          .eq('id', deckId)
          .eq('user_id', user?.id)
          .single();

        if (deckError) throw deckError;
        setDeck(deckData);

        // Fetch flashcards
        let flashcardsQuery = supabase
          .from('flashcards')
          .select('*')
          .eq('deck_id', deckId)
          .eq('user_id', user?.id)
          .order('created_at', { ascending: true }); // Show oldest cards first

        // If filtering for learning cards
        if (isLearning) {
          if (cardIds.length > 0) {
            console.log('Filtering flashcards by specific learning card IDs:', cardIds);
            flashcardsQuery = flashcardsQuery.in('id', cardIds);
          } else {
            console.log('Learning filter is on, fetching recently incorrect cards');
            // Get cards that were recently marked as incorrect
            const { data: recentIncorrectCards, error: recentError } = await supabase
              .from('study_sessions')
              .select('flashcard_id')
              .eq('deck_id', deckId)
              .eq('user_id', user?.id)
              .eq('was_correct', false)
              .order('created_at', { ascending: false })
              .limit(20); // Get last 20 incorrect answers

            if (recentError) {
              console.error('Error fetching recent incorrect cards:', recentError);
            } else if (recentIncorrectCards && recentIncorrectCards.length > 0) {
              const incorrectCardIds = [...new Set(recentIncorrectCards.map(s => s.flashcard_id))]; // Remove duplicates
              console.log('Found recently incorrect card IDs:', incorrectCardIds);
              flashcardsQuery = flashcardsQuery.in('id', incorrectCardIds);
            } else {
              console.log('No recently incorrect cards found');
              // If no recent incorrect cards, show all cards due for review
              const now = new Date().toISOString();
              flashcardsQuery = flashcardsQuery.lte('next_review_date', now);
            }
          }
        }

        const { data: flashcardsData, error: flashcardsError } = await flashcardsQuery;

        if (flashcardsError) throw flashcardsError;

        if (!flashcardsData || flashcardsData.length === 0) {
          const message = isLearning
            ? "No cards need review right now. All cards are mastered! 🎉"
            : "This deck doesn't have any flashcards yet.";
          toast({
            title: isLearning ? "Great Progress!" : "No flashcards found",
            description: message,
            variant: isLearning ? "default" : "destructive",
          });
          navigate('/study');
          return;
        }

        // Convert difficulty from integer back to decimal and sort cards by priority
        const cardsWithDecimalDifficulty = flashcardsData.map(card => ({
          ...card,
          // Handle both old format (0-5) and new format (0-500)
          difficulty: card.difficulty > 10 ? card.difficulty / 100 : Math.max(2.5, card.difficulty || 2.5)
        }));

        let finalCards = sortCardsByPriority(cardsWithDecimalDifficulty);

        // Handle shuffle option
        const shuffle = searchParams.get('shuffle');
        if (shuffle === 'true') {
          finalCards = [...finalCards].sort(() => Math.random() - 0.5);
        }

        setFlashcards(finalCards);

        // Handle startFrom option
        const startFrom = searchParams.get('startFrom');
        let startIndex = 0;
        if (startFrom) {
          const startFromNumber = parseInt(startFrom);
          if (!isNaN(startFromNumber) && startFromNumber >= 1 && startFromNumber <= finalCards.length) {
            startIndex = startFromNumber - 1; // Convert to 0-based index
          }
        }

        // Update card state stats
        cardState.setStats(prev => ({
          ...prev,
          totalCards: finalCards.length,
          currentIndex: startIndex,
          learningCardIds: []
        }));

        // Set current index if starting from specific card
        if (startIndex > 0) {
          cardState.setCurrentIndex(startIndex);
        }

        // Reset card start time
        cardState.resetCardStartTime();
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load study session",
          variant: "destructive",
        });
        navigate('/study');
      } finally {
        setLoading(false);
      }
    };

    if (deckId && user) {
      // Check if we should filter for learning cards
      const filter = searchParams.get('filter');
      const learningCards = searchParams.get('learningCards');

      console.log('StudySession URL params:', { filter, learningCards });

      const isLearning = filter === 'learning';
      setIsLearningFilter(isLearning);

      if (learningCards) {
        const cardIds = learningCards.split(',');
        console.log('Setting learning card IDs:', cardIds);
        setLearningCardIds(cardIds);
        // Fetch with the card IDs directly
        fetchDeckAndFlashcardsWithFilter(isLearning, cardIds);
      } else {
        setLearningCardIds([]);
        // Fetch without filter
        fetchDeckAndFlashcardsWithFilter(isLearning, []);
      }
    }
  }, [deckId, user, searchParams, toast, navigate]);

  // Keyboard support for desktop
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Disable keyboard shortcuts when modal is open
      if (isModalOpen) return;

      if (event.key === 'ArrowLeft') {
        // Left arrow = Still Learning
        handleCardResponse(false);
      } else if (event.key === 'ArrowRight') {
        // Right arrow = Know
        handleCardResponse(true);
      } else if (event.key === ' ' || event.key === 'Enter') {
        // Space or Enter = Flip card
        event.preventDefault();
        cardState.flipCard();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleCardResponse, cardState.flipCard, isModalOpen]);

  /**
   * Handle exit from study session
   */
  const handleExit = useCallback(() => {
    navigate('/study');
  }, [navigate]);

  /**
   * Handle undo last card action
   */
  const handleUndo = useCallback(() => {
    if (cardState.cardHistory.length === 0) return;

    swipeGesture.resetSwipeState();
    cardState.undoLastCard();
  }, [cardState.cardHistory.length, cardState.undoLastCard, swipeGesture.resetSwipeState]);

  /**
   * Handle restart session
   */
  const handleRestart = useCallback(() => {
    swipeGesture.resetSwipeState();
    cardState.restartSession();
  }, [cardState.restartSession, swipeGesture.resetSwipeState]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!deck || flashcards.length === 0) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No flashcards found</h2>
          <Button onClick={() => navigate('/study')}>Back to Study</Button>
        </div>
      </div>
    );
  }

  // Current card and progress calculation
  const currentCard = flashcards[cardState.currentIndex];
  const progress = ((cardState.currentIndex) / flashcards.length) * 100;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3 sm:p-4 bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="flex items-center justify-between max-w-sm sm:max-w-md mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExit}
            className="p-1.5 sm:p-2 touch-manipulation"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <div className="text-center">
            <div className="text-base sm:text-lg font-semibold text-gray-800">
              {cardState.currentIndex + 1} / {flashcards.length}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={cardState.cardHistory.length === 0}
            className="p-1.5 sm:p-2 touch-manipulation disabled:opacity-50"
          >
            <Undo2 className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>

      {/* Score Counters */}
      <div className="absolute top-16 sm:top-20 left-0 right-0 z-10 px-3 sm:px-4">
        <div className="flex justify-between max-w-sm sm:max-w-md mx-auto">
          <Badge className="bg-orange-100 text-orange-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm sm:text-base">
            {cardState.stats.learningCount}
          </Badge>
          <Badge className="bg-green-100 text-green-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm sm:text-base">
            {cardState.stats.knowCount}
          </Badge>
        </div>
      </div>

      {/* Main Card Area */}
      <div className="absolute inset-0 pt-28 sm:pt-32 pb-6 sm:pb-8 px-3 sm:px-4 md:px-8 lg:px-12">
        <div className="max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto h-full relative">

          <AnimatePresence mode="wait">
            {currentCard && (
              <SwipeableCard
                key={currentCard.id}
                card={currentCard}
                isFlipped={cardState.isFlipped}
                isStarred={cardState.starredCards.has(currentCard.id)}
                isSwipeInProgress={swipeGesture.isSwipeInProgress}
                isSwipeDisabled={isModalOpen}
                onFlip={cardState.flipCard}
                onStar={cardState.toggleStarCard}
                onPanStart={swipeGesture.handlePanStart}
                onPanEnd={swipeGesture.handlePanEnd}
                onModalStateChange={setIsModalOpen}
              />
            )}
          </AnimatePresence>

          {/* Center Indicator */}
          <SwipeIndicator
            show={showCenterIndicator.show}
            type={showCenterIndicator.type}
          />
        </div>

        {/* Desktop Instructions */}
        <div className="hidden md:block absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span>← Still Learning</span>
              <span>Space/Enter: Flip</span>
              <span>Know →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudySession;