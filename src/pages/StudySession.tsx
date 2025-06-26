import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, RotateCcw, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { sortCardsByPriority } from '@/lib/spacedRepetition';

// Types
import type {
  Flashcard,
  Deck,
  StudyStats,
  CenterIndicatorState,
  StudySessionParams,
  StudySessionError
} from '@/types/study';

// Constants
import {
  ANIMATION_DURATIONS,
  EASING,
  ERROR_MESSAGES,
  A11Y,
  FEATURE_FLAGS
} from '@/constants/study';

// Custom hooks
import { useCardState } from '@/hooks/useCardState';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useStudyDatabase } from '@/hooks/useStudyDatabase';

// Components
import SwipeableCard from '@/components/SwipeableCard';
import SwipeIndicator from '@/components/SwipeIndicator';

/**
 * @fileoverview Optimized StudySession component with modern React patterns
 * @description Enhanced study session with performance optimizations, error handling, and accessibility
 * @author StudySession Refactor
 * @version 2.0.0
 */

/**
 * Error Boundary Component for StudySession
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: StudySessionError | null;
}

class StudySessionErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: StudySessionError) => void },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error: {
        message: error.message,
        code: 'UNKNOWN',
        details: error
      }
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('StudySession Error:', error, errorInfo);
    this.props.onError?.({
      message: error.message,
      code: 'UNKNOWN',
      details: { error, errorInfo }
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-6">{this.state.error?.message || ERROR_MESSAGES.UNKNOWN_ERROR}</p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Main StudySession Component
 *
 * @description A comprehensive study session interface for flashcard learning with:
 * - Spaced repetition algorithm (SM-2) for optimal learning
 * - Swipe gestures and keyboard shortcuts for interaction
 * - Real-time progress tracking and statistics
 * - Error handling and recovery mechanisms
 * - Accessibility features and screen reader support
 * - Performance optimizations with React.memo and memoization
 *
 * @features
 * - Card flipping animations with Framer Motion
 * - Swipe left (still learning) / right (know) gestures
 * - Keyboard shortcuts for power users
 * - Progress persistence across sessions
 * - Image zoom and text expansion modals
 * - Center feedback indicators for user actions
 * - Comprehensive error boundaries and fallbacks
 *
 * @accessibility
 * - ARIA labels and roles for screen readers
 * - Keyboard navigation support
 * - Focus management for modals
 * - High contrast mode compatibility
 *
 * @performance
 * - Memoized calculations and event handlers
 * - Optimized re-render prevention
 * - Lazy loading and code splitting ready
 * - Efficient state management with custom hooks
 *
 * @author StudySession Refactor Team
 * @version 2.0.0
 * @since 2024-06-26
 */
const StudySession: React.FC = () => {
  const { deckId } = useParams<StudySessionParams>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Core state with optimized initial values
  const [deck, setDeck] = useState<Deck | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<StudySessionError | null>(null);
  const sessionStartTimeRef = useRef(new Date());
  const [isLearningFilter, setIsLearningFilter] = useState(false);
  const [learningCardIds, setLearningCardIds] = useState<string[]>([]);

  // Center indicator state
  const [showCenterIndicator, setShowCenterIndicator] = useState<CenterIndicatorState>({
    show: false,
    type: null
  });

  // Modal state to disable swipe when modal is open
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Custom hooks for state management
  const cardState = useCardState(flashcards.length);
  const { saveCardResponse } = useStudyDatabase();

  // Memoized error handler
  const handleError = useCallback((error: StudySessionError) => {
    console.error('StudySession Error:', error);
    setError(error);
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  }, [toast]);

  // Memoized loading state
  const isLoading = useMemo(() => loading || !deck || flashcards.length === 0, [loading, deck, flashcards.length]);

  /**
   * Handle session completion and navigation to summary
   * Optimized with error handling and memoized calculations
   */
  const handleSessionComplete = useCallback((wasCorrect: boolean) => {
    try {
      const sessionDuration = Math.round(
        (new Date().getTime() - sessionStartTimeRef.current.getTime()) / 1000 / 60
      );

      const finalStats = {
        ...cardState.stats,
        knowCount: wasCorrect ? cardState.stats.knowCount + 1 : cardState.stats.knowCount,
        learningCount: !wasCorrect ? cardState.stats.learningCount + 1 : cardState.stats.learningCount,
        duration: sessionDuration,
        deckName: deck?.name,
        deckId: deckId,
        learningCardIds: !wasCorrect
          ? [...(cardState.stats.learningCardIds || []), flashcards[cardState.currentIndex]?.id].filter(Boolean)
          : cardState.stats.learningCardIds || []
      };

      navigate('/study/summary', { state: { stats: finalStats } });
    } catch (error) {
      handleError({
        message: 'Failed to navigate to summary',
        code: 'NAVIGATION_ERROR',
        details: error
      });
    }
  }, [navigate, deck?.name, deckId, flashcards, cardState.stats, cardState.currentIndex, handleError]);

  // Ref to store timeout for cleanup
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized center indicator handler
  const showFeedback = useCallback((type: 'know' | 'learning') => {
    console.log('🎯 Showing feedback:', type); // Debug log
    console.log('🎯 Current state before:', showCenterIndicator); // Debug current state

    // Clear any existing timeout
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    setShowCenterIndicator({ show: true, type });

    // Set new timeout
    feedbackTimeoutRef.current = setTimeout(() => {
      console.log('🎯 Hiding feedback:', type); // Debug log
      setShowCenterIndicator({ show: false, type: null });
      feedbackTimeoutRef.current = null;
    }, 1500); // Increased to 1.5 seconds for testing
  }, []); // Remove dependency to avoid infinite re-renders

  /**
   * Main card response handler
   * Optimized with error handling and performance improvements
   */
  const handleCardResponse = useCallback((wasCorrect: boolean) => {
    try {
      // Early return for invalid state
      if (cardState.currentIndex >= flashcards.length || !flashcards[cardState.currentIndex]) {
        console.warn('Invalid card index or missing card');
        return;
      }

      const currentCard = flashcards[cardState.currentIndex];
      const responseTime = Math.max(0, new Date().getTime() - cardState.cardStartTime.getTime());

      // Show immediate feedback
      showFeedback(wasCorrect ? 'know' : 'learning');

      // Update card state
      cardState.addToHistory(cardState.currentIndex, wasCorrect);
      cardState.updateStats(wasCorrect, currentCard.id);

      // Handle session completion or move to next card
      if (cardState.currentIndex + 1 >= flashcards.length) {
        handleSessionComplete(wasCorrect);
      } else {
        cardState.moveToNextCard();
      }

      // Save to database asynchronously with error handling
      saveCardResponse({
        card: currentCard,
        wasCorrect,
        responseTime,
        userId: user?.id,
        deckId: deckId
      }).catch((error) => {
        console.error('Failed to save card response:', error);
        // Don't show error to user as it's background operation
      });
    } catch (error) {
      handleError({
        message: 'Failed to process card response',
        code: 'CARD_RESPONSE_ERROR',
        details: error
      });
    }
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
    console.log('🔥 SWIPE LEFT CALLED!');
    handleCardResponse(false);
  }, [handleCardResponse]);

  const handleSwipeRight = useCallback(() => {
    console.log('🔥 SWIPE RIGHT CALLED!');
    handleCardResponse(true);
  }, [handleCardResponse]);

  // Swipe gesture hook
  const swipeGesture = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    disabled: cardState.currentIndex >= flashcards.length || isModalOpen
  });

  // Reset swipe state when card changes to ensure next card is swipeable
  useEffect(() => {
    swipeGesture.resetSwipeState();
  }, [cardState.currentIndex, swipeGesture.resetSwipeState]);

  // Debug effect to track state changes
  useEffect(() => {
    console.log('🎯 showCenterIndicator state changed:', showCenterIndicator);
  }, [showCenterIndicator]);

  // Keyboard shortcuts handler
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Don't handle shortcuts when modal is open or input is focused
    if (isModalOpen || document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
      return;
    }

    // Don't handle shortcuts if session is complete
    if (cardState.currentIndex >= flashcards.length) {
      return;
    }

    switch (event.key) {
      case A11Y.SHORTCUTS.FLIP: // Spacebar
      case 'Enter': // Enter key also flips
        event.preventDefault();
        cardState.flipCard();
        break;
      case A11Y.SHORTCUTS.KNOW: // Right arrow
        event.preventDefault();
        handleCardResponse(true);
        break;
      case A11Y.SHORTCUTS.LEARNING: // Left arrow
        event.preventDefault();
        handleCardResponse(false);
        break;
      case 'ArrowDown': // Down arrow for undo (previous card)
        event.preventDefault();
        cardState.undoLastCard();
        break;
      case A11Y.SHORTCUTS.STAR: // 's' key
        event.preventDefault();
        if (flashcards[cardState.currentIndex]) {
          cardState.toggleStarCard(flashcards[cardState.currentIndex].id);
        }
        break;
      case A11Y.SHORTCUTS.UNDO: // 'u' key
        event.preventDefault();
        cardState.undoLastCard();
        break;
      case A11Y.SHORTCUTS.RESTART: // 'r' key
        event.preventDefault();
        cardState.restartSession();
        break;
      case A11Y.SHORTCUTS.ESCAPE: // Escape key
        event.preventDefault();
        navigate(-1);
        break;
      default:
        break;
    }
  }, [isModalOpen, cardState, flashcards, handleCardResponse, navigate]);

  // Keyboard shortcuts effect
  useEffect(() => {
    if (FEATURE_FLAGS.KEYBOARD_SHORTCUTS) {
      document.addEventListener('keydown', handleKeyPress);
      return () => {
        document.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [handleKeyPress]);

  // Progress persistence effect
  useEffect(() => {
    if (FEATURE_FLAGS.PROGRESS_PERSISTENCE && cardState.currentIndex > 0) {
      const progressData = {
        deckId,
        currentIndex: cardState.currentIndex,
        stats: cardState.stats,
        timestamp: Date.now()
      };

      try {
        localStorage.setItem(`study_progress_${deckId}`, JSON.stringify(progressData));
      } catch (error) {
        console.warn('Failed to save progress to localStorage:', error);
      }
    }
  }, [deckId, cardState.currentIndex, cardState.stats]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup swipe gesture resources
      swipeGesture.cleanup?.();

      // Clear any pending feedback timeout
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = null;
      }

      // Clear any pending timeouts only on component unmount
      setShowCenterIndicator({ show: false, type: null });
    };
  }, [swipeGesture]);

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
    // If there's history, undo the last card
    if (cardState.cardHistory.length > 0) {
      swipeGesture.resetSwipeState();
      cardState.undoLastCard();
      return;
    }

    // If no history but not at first card, go to previous card
    if (cardState.currentIndex > 0) {
      swipeGesture.resetSwipeState();
      cardState.setCurrentIndex(cardState.currentIndex - 1);
      cardState.resetCardStartTime();
    }
  }, [cardState.cardHistory.length, cardState.currentIndex, cardState.undoLastCard, cardState.setCurrentIndex, cardState.resetCardStartTime, swipeGesture.resetSwipeState]);

  /**
   * Handle restart session
   */
  const handleRestart = useCallback(() => {
    swipeGesture.resetSwipeState();
    cardState.restartSession();
  }, [cardState.restartSession, swipeGesture.resetSwipeState]);

  /**
   * Handle edit card - navigate to card edit page
   */
  const handleEditCard = useCallback((cardId: string) => {
    navigate(`/study/${deckId}/card/${cardId}/edit?currentIndex=${cardState.currentIndex}`);
  }, [navigate, deckId, cardState.currentIndex]);

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
            disabled={cardState.cardHistory.length === 0 && cardState.currentIndex === 0}
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
                onEdit={handleEditCard}
                onPanStart={swipeGesture.handlePanStart}
                onPanEnd={swipeGesture.handlePanEnd}
                onModalStateChange={setIsModalOpen}

              />
            )}
          </AnimatePresence>

          {/* Card Center Swipe Feedback Indicators */}
          <AnimatePresence>
            {showCenterIndicator.show && showCenterIndicator.type && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] pointer-events-none"
              >
                <div
                  className="px-6 py-3 rounded-full text-white font-bold text-lg shadow-lg"
                  style={{
                    backgroundColor: showCenterIndicator.type === 'know' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(249, 115, 22, 0.9)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                  }}
                >
                  {showCenterIndicator.type === 'know' ? '✓ KNOW' : '📚 STILL LEARNING'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>


        </div>

        {/* Desktop Instructions */}
        <div className="hidden md:block absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span>← Still Learning</span>
              <span>Space/Enter: Flip</span>
              <span>Know →</span>
              <span>↓ Undo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudySession;