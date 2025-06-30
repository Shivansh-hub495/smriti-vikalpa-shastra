/**
 * SM-2 Spaced Repetition Algorithm Implementation
 * Based on the SuperMemo 2 algorithm for optimal learning intervals
 */

export interface SpacedRepetitionResult {
  difficulty: number;
  interval: number;
  nextReviewDate: Date;
  reviewCount: number;
}

export interface FlashcardReview {
  difficulty: number;
  reviewCount: number;
  correctCount: number;
  lastReviewDate?: Date;
}

/**
 * Calculate the next review parameters using SM-2 algorithm
 * @param flashcard Current flashcard review data
 * @param quality Quality of response (0-5, where 3+ is correct)
 * @returns Updated spaced repetition parameters
 */
export function calculateNextReview(
  flashcard: FlashcardReview,
  quality: number
): SpacedRepetitionResult {
  // Ensure quality is within valid range (0-5)
  quality = Math.max(0, Math.min(5, quality));
  
  let { difficulty, reviewCount, correctCount } = flashcard;
  
  // Initialize difficulty if it's the first review
  if (reviewCount === 0) {
    difficulty = 2.5;
  }
  
  // Update difficulty based on quality
  difficulty = Math.max(1.3, difficulty + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  
  let interval: number;
  
  // If quality < 3, the answer was incorrect
  if (quality < 3) {
    // Reset interval to 1 day for incorrect answers
    interval = 1;
    // Don't increment correct count for wrong answers
  } else {
    // Correct answer - increment correct count
    correctCount++;
    
    // Calculate interval based on review count
    if (correctCount === 1) {
      interval = 1; // First correct answer: 1 day
    } else if (correctCount === 2) {
      interval = 6; // Second correct answer: 6 days
    } else {
      // Subsequent reviews: multiply previous interval by difficulty
      const previousInterval = getPreviousInterval(correctCount - 1, difficulty);
      interval = Math.round(previousInterval * difficulty);
    }
  }
  
  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  
  return {
    difficulty: Math.round(difficulty * 100) / 100, // Round to 2 decimal places
    interval,
    nextReviewDate,
    reviewCount: reviewCount + 1
  };
}

/**
 * Get the previous interval for a given review count and difficulty
 * Used for calculating subsequent intervals
 */
function getPreviousInterval(reviewCount: number, difficulty: number): number {
  if (reviewCount === 1) return 1;
  if (reviewCount === 2) return 6;
  
  // For higher review counts, calculate recursively
  let interval = 6;
  for (let i = 3; i <= reviewCount; i++) {
    interval = Math.round(interval * difficulty);
  }
  return interval;
}

/**
 * Convert user response to SM-2 quality score
 * @param wasCorrect Whether the user answered correctly
 * @param responseTime Response time in milliseconds (optional)
 * @returns Quality score (0-5)
 */
export function getQualityScore(wasCorrect: boolean, responseTime?: number): number {
  if (!wasCorrect) {
    return 0; // Complete blackout
  }
  
  // For correct answers, adjust quality based on response time if available
  if (responseTime) {
    if (responseTime < 3000) return 5; // Perfect response (< 3 seconds)
    if (responseTime < 5000) return 4; // Correct with hesitation (< 5 seconds)
    if (responseTime < 10000) return 3; // Correct with difficulty (< 10 seconds)
    return 3; // Correct but slow
  }
  
  // Default to good quality for correct answers without timing
  return 4;
}

/**
 * Check if a flashcard is due for review
 * @param nextReviewDate The scheduled next review date
 * @returns Whether the card is due for review
 */
export function isCardDue(nextReviewDate: Date): boolean {
  const now = new Date();
  return now >= nextReviewDate;
}

/**
 * Get cards that are due for review from a list of flashcards
 * @param flashcards Array of flashcards with review data
 * @returns Array of flashcards due for review
 */
export function getDueCards<T extends { next_review_date: string }>(flashcards: T[]): T[] {
  const now = new Date();
  return flashcards.filter(card => {
    const reviewDate = new Date(card.next_review_date);
    return now >= reviewDate;
  });
}

/**
 * Sort flashcards by priority (overdue cards first, then by difficulty)
 * @param flashcards Array of flashcards to sort
 * @returns Sorted array with highest priority cards first
 */
export function sortCardsByPriority<T extends {
  next_review_date: string;
  difficulty: number;
  created_at: string;
}>(flashcards: T[]): T[] {
  const now = new Date();
  
  return flashcards.sort((a, b) => {
    const aReviewDate = new Date(a.next_review_date);
    const bReviewDate = new Date(b.next_review_date);
    
    // Calculate how overdue each card is (negative means not due yet)
    const aOverdue = now.getTime() - aReviewDate.getTime();
    const bOverdue = now.getTime() - bReviewDate.getTime();
    
    // If both are overdue or both are not due, sort by creation date (oldest first)
    if ((aOverdue >= 0 && bOverdue >= 0) || (aOverdue < 0 && bOverdue < 0)) {
      const aCreated = new Date(a.created_at).getTime();
      const bCreated = new Date(b.created_at).getTime();
      return aCreated - bCreated; // Oldest cards first
    }
    
    // Otherwise, overdue cards come first
    return bOverdue - aOverdue;
  });
}
