import { useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateNextReview, getQualityScore, type FlashcardReview } from '@/lib/spacedRepetition';
import type { Flashcard, StudyDatabaseOperations } from '@/types/study';
import { API_CONFIG, PERFORMANCE } from '@/constants/study';

/**
 * @fileoverview Optimized study database operations hook with performance best practices
 * @description Handles database operations with retry logic, batching, and proper error handling
 * @author StudySession Refactor
 * @version 2.0.0
 */

interface DatabaseOperationParams {
  card: Flashcard;
  wasCorrect: boolean;
  responseTime: number;
  userId?: string;
  deckId?: string;
}

interface BatchOperation {
  id: string;
  operation: () => Promise<void>;
  timestamp: number;
  retries: number;
}

/**
 * Custom hook for handling database operations related to study sessions with optimizations
 *
 * @description This hook provides robust database operations for study sessions, including
 * spaced repetition calculations, retry logic, and performance optimizations.
 *
 * @features
 * - **Spaced Repetition**: Implements SM-2 algorithm for optimal learning intervals
 * - **Retry Logic**: Automatic retry with exponential backoff for failed operations
 * - **Batch Processing**: Efficient batch processing of multiple database operations
 * - **Error Handling**: Comprehensive error handling with fallback mechanisms
 * - **Performance**: Throttled operations and optimized database queries
 * - **Background Processing**: Non-blocking database operations to maintain UI responsiveness
 *
 * @performance
 * - Batch processing to reduce database round trips
 * - Throttled operations to prevent overwhelming the database
 * - Retry logic with exponential backoff to handle temporary failures
 * - Asynchronous operations that don't block the UI
 *
 * @reliability
 * - Fallback mechanisms when primary operations fail
 * - Graceful degradation without interrupting user flow
 * - Comprehensive error logging for debugging
 * - Transaction-like behavior for related operations
 *
 * @example
 * ```tsx
 * const { saveCardResponse } = useStudyDatabase();
 *
 * // Save a card response with automatic retry and spaced repetition
 * await saveCardResponse({
 *   card: currentCard,
 *   wasCorrect: true,
 *   responseTime: 2500,
 *   userId: user.id,
 *   deckId: deck.id
 * });
 * ```
 *
 * @returns {StudyDatabaseOperations} Object containing database operation functions
 *
 * @author StudySession Refactor Team
 * @version 2.0.0
 * @since 2024-06-26
 */
export const useStudyDatabase = (): StudyDatabaseOperations => {
  // Refs for managing batch operations and retries
  const batchQueueRef = useRef<BatchOperation[]>([]);
  const processingRef = useRef<boolean>(false);
  const lastProcessTimeRef = useRef<number>(0);

  // Memoized configuration for stable references
  const config = useMemo(() => ({
    maxRetries: API_CONFIG.RETRY_ATTEMPTS,
    retryDelay: API_CONFIG.RETRY_DELAY,
    batchSize: API_CONFIG.BATCH_SIZE,
    throttleDelay: PERFORMANCE.THROTTLE.NETWORK,
  }), []);
  /**
   * Retry a database operation with exponential backoff
   */
  const retryOperation = useCallback(async (
    operation: () => Promise<any>,
    retries: number = 0
  ): Promise<any> => {
    try {
      return await operation();
    } catch (error) {
      if (retries < config.maxRetries) {
        const delay = config.retryDelay * Math.pow(2, retries);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryOperation(operation, retries + 1);
      }
      throw error;
    }
  }, [config.maxRetries, config.retryDelay]);

  /**
   * Process batch queue with throttling
   */
  const processBatchQueue = useCallback(async () => {
    if (processingRef.current || batchQueueRef.current.length === 0) return;

    const now = Date.now();
    if (now - lastProcessTimeRef.current < config.throttleDelay) return;

    processingRef.current = true;
    lastProcessTimeRef.current = now;

    try {
      const batch = batchQueueRef.current.splice(0, config.batchSize);
      await Promise.allSettled(batch.map(item => item.operation()));
    } catch (error) {
      console.error('Batch processing error:', error);
    } finally {
      processingRef.current = false;
    }
  }, [config.batchSize, config.throttleDelay]);

  /**
   * Save card response to database with spaced repetition algorithm
   * Optimized with retry logic and batch processing
   */
  const saveCardResponse = useCallback(async ({
    card,
    wasCorrect,
    responseTime,
    userId,
    deckId
  }: DatabaseOperationParams) => {
    const operation = async () => {
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

        // Batch database operations for better performance
        const updateOperation = () => supabase
          .from('flashcards')
          .update({
            difficulty: difficultyInt,
            next_review_date: nextReview.nextReviewDate.toISOString(),
            review_count: nextReview.reviewCount,
            correct_count: wasCorrect ? card.correct_count + 1 : card.correct_count,
            updated_at: new Date().toISOString()
          })
          .eq('id', card.id);

        const sessionOperation = () => supabase
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

        // Execute operations with retry logic
        const [updateResult, sessionResult] = await Promise.allSettled([
          retryOperation(updateOperation),
          retryOperation(sessionOperation)
        ]);

        // Check for errors
        if (updateResult.status === 'rejected') {
          console.error('Flashcard update error:', updateResult.reason);
          throw updateResult.reason;
        }

        if (sessionResult.status === 'rejected') {
          console.error('Study session insert error:', sessionResult.reason);
          throw sessionResult.reason;
        }

        console.log('Study progress saved successfully');

      } catch (error) {
        console.error('Error saving study data:', error);

        // Fallback: simple update without spaced repetition
        await saveFallbackResponse({ card, wasCorrect, responseTime, userId, deckId });
      }
    };

    // Add to batch queue for processing
    const batchItem: BatchOperation = {
      id: `${card.id}-${Date.now()}`,
      operation,
      timestamp: Date.now(),
      retries: 0
    };

    batchQueueRef.current.push(batchItem);

    // Process queue asynchronously
    setTimeout(processBatchQueue, 0);
  }, [retryOperation, processBatchQueue]);

  /**
   * Fallback database operation when main save fails
   * Optimized with retry logic and minimal operations
   */
  const saveFallbackResponse = useCallback(async ({
    card,
    wasCorrect,
    responseTime,
    userId,
    deckId
  }: DatabaseOperationParams) => {
    try {
      const fallbackOperation = async () => {
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
          throw fallbackError;
        }

        // Record study session in fallback
        const { error: sessionError } = await supabase
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

        if (sessionError) {
          throw sessionError;
        }
      };

      await retryOperation(fallbackOperation);
      console.log('Fallback save successful');

    } catch (fallbackError) {
      console.error('Both primary and fallback saves failed:', fallbackError);
      // Don't throw error to avoid interrupting user flow
    }
  }, [retryOperation]);

  // Memoize return object for performance
  const databaseOperations = useMemo<StudyDatabaseOperations>(() => ({
    saveCardResponse,
  }), [saveCardResponse]);

  return databaseOperations;
};
