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
    disabled: cardState.currentIndex >= flashcards.length
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

        const sortedCards = sortCardsByPriority(cardsWithDecimalDifficulty);
        setFlashcards(sortedCards);

        // Update card state stats
        cardState.setStats(prev => ({
          ...prev,
          totalCards: sortedCards.length,
          currentIndex: 0,
          learningCardIds: []
        }));

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

export default StudySession;
