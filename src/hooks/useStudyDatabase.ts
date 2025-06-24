import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateNextReview, getQualityScore, type FlashcardReview } from '@/lib/spacedRepetition';

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

interface DatabaseOperationParams {
  card: Flashcard;
  wasCorrect: boolean;
  responseTime: number;
  userId?: string;
  deckId?: string;
}

/**
 * Custom hook for handling database operations related to study sessions
 * Encapsulates all database logic for better separation of concerns
 */
export const useStudyDatabase = () => {
  
  /**
   * Save card response to database with spaced repetition algorithm
   * Runs asynchronously in background to avoid blocking UI
   */
  const saveCardResponse = useCallback(async ({
    card,
    wasCorrect,
    responseTime,
    userId,
    deckId
  }: DatabaseOperationParams) => {
    try {
      const quality = getQualityScore(wasCorrect, responseTime);

      // Calculate next review using SM-2 algorithm
      const reviewData: FlashcardReview = {
        difficulty: card.difficulty,
        reviewCount: card.review_count,
        correctCount: card.correct_count,
        lastReviewDate: new Date(card.updated_at)
      };

      const nextReview = calculateNextReview(reviewData, quality);
      
      // Convert difficulty to integer for database storage
      const difficultyInt = Math.round(nextReview.difficulty * 100);
      const currentDifficultyInt = Math.round(card.difficulty * 100);

      // Update flashcard in database
      const { error: updateError } = await supabase
        .from('flashcards')
        .update({
          difficulty: difficultyInt,
          next_review_date: nextReview.nextReviewDate.toISOString(),
          review_count: nextReview.reviewCount,
          correct_count: wasCorrect ? card.correct_count + 1 : card.correct_count,
          updated_at: new Date().toISOString()
        })
        .eq('id', card.id);

      if (updateError) {
        console.error('Flashcard update error:', updateError);
        throw updateError;
      }

      // Record study session
      const { error: sessionError } = await supabase
        .from('study_sessions')
        .insert({
          user_id: userId,
          deck_id: deckId,
          flashcard_id: card.id,
          was_correct: wasCorrect,
          response_time_ms: Math.round(responseTime),
          difficulty_before: currentDifficultyInt,
          difficulty_after: difficultyInt
        });

      if (sessionError) {
        console.error('Study session insert error:', sessionError);
        throw sessionError;
      }

      console.log('Study progress saved successfully');
      
    } catch (error) {
      console.error('Error saving study data:', error);
      
      // Fallback: simple update without spaced repetition
      await saveFallbackResponse({ card, wasCorrect, responseTime, userId, deckId });
    }
  }, []);

  /**
   * Fallback database operation when main save fails
   * Provides basic functionality without spaced repetition
   */
  const saveFallbackResponse = useCallback(async ({
    card,
    wasCorrect,
    responseTime,
    userId,
    deckId
  }: DatabaseOperationParams) => {
    try {
      // Simple flashcard update
      const { error: fallbackError } = await supabase
        .from('flashcards')
        .update({
          review_count: card.review_count + 1,
          correct_count: wasCorrect ? card.correct_count + 1 : card.correct_count,
          updated_at: new Date().toISOString()
        })
        .eq('id', card.id);

      if (fallbackError) {
        console.error('Fallback update also failed:', fallbackError);
        return;
      }

      // Record study session in fallback
      await supabase
        .from('study_sessions')
        .insert({
          user_id: userId,
          deck_id: deckId,
          flashcard_id: card.id,
          was_correct: wasCorrect,
          response_time_ms: Math.round(responseTime),
          difficulty_before: Math.round(card.difficulty * 100),
          difficulty_after: Math.round(card.difficulty * 100)
        });

      console.log('Fallback save successful');
      
    } catch (fallbackError) {
      console.error('Both primary and fallback saves failed:', fallbackError);
      // Don't throw error to avoid interrupting user flow
    }
  }, []);

  return {
    saveCardResponse,
  };
};
