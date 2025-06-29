/**
 * @fileoverview Shared TypeScript interfaces and types for the Study Session system
 * @description Centralized type definitions for flashcards, decks, study sessions, and related data structures
 * @author StudySession Refactor
 * @version 1.0.0
 */

/**
 * Core flashcard interface representing a single flashcard entity
 * @interface Flashcard
 */
export interface Flashcard {
  /** Unique identifier for the flashcard */
  id: string;
  /** ID of the deck this flashcard belongs to */
  deck_id: string;
  /** ID of the user who owns this flashcard */
  user_id: string;
  /** Text content for the front side of the card */
  front_content: string;
  /** Text content for the back side of the card */
  back_content: string;
  /** Optional HTML content for the front side (rich text) */
  front_content_html?: string;
  /** Optional HTML content for the back side (rich text) */
  back_content_html?: string;
  /** Optional image URL for the front side */
  front_image_url?: string;
  /** Optional image URL for the back side */
  back_image_url?: string;
  /** Spaced repetition difficulty level (0-10) */
  difficulty: number;
  /** ISO date string for when this card should be reviewed next */
  next_review_date: string;
  /** Total number of times this card has been reviewed */
  review_count: number;
  /** Number of times this card was answered correctly */
  correct_count: number;
  /** ISO date string for when this card was created */
  created_at: string;
  /** ISO date string for when this card was last updated */
  updated_at: string;
}

/**
 * Deck interface representing a collection of flashcards
 * @interface Deck
 */
export interface Deck {
  /** Unique identifier for the deck */
  id: string;
  /** Display name of the deck */
  name: string;
  /** Optional description of the deck */
  description?: string;
  /** Optional tags associated with the deck */
  tags?: string[];
  /** ID of the folder containing this deck */
  folder_id?: string;
  /** ID of the user who owns this deck */
  user_id?: string;
  /** ISO date string for when this deck was created */
  created_at?: string;
  /** Optional folder information if populated */
  folder?: {
    name: string;
  };
}

/**
 * Study session statistics and progress tracking
 * @interface StudyStats
 */
export interface StudyStats {
  /** Total number of cards in the current session */
  totalCards: number;
  /** Current card index (0-based) */
  currentIndex: number;
  /** Number of cards marked as "know" */
  knowCount: number;
  /** Number of cards marked as "still learning" */
  learningCount: number;
  /** Timestamp when the study session started */
  startTime: Date;
  /** Array of card IDs that were marked as "still learning" */
  learningCardIds?: string[];
  /** Optional session duration in minutes */
  duration?: number;
  /** Optional deck name for summary display */
  deckName?: string;
  /** Optional deck ID for navigation */
  deckId?: string;
}

/**
 * Individual card response history entry
 * @interface CardHistory
 */
export interface CardHistory {
  /** Index of the card that was answered */
  index: number;
  /** Whether the card was answered correctly */
  wasCorrect: boolean;
  /** Timestamp of the response */
  timestamp: Date;
  /** Response time in milliseconds */
  responseTime: number;
}

/**
 * Study session database record
 * @interface StudySession
 */
export interface StudySession {
  /** Unique identifier for the study session */
  id: string;
  /** ID of the user who performed the session */
  user_id: string;
  /** ID of the deck that was studied */
  deck_id: string;
  /** ID of the specific flashcard */
  flashcard_id: string;
  /** Whether the card was answered correctly */
  was_correct: boolean;
  /** Optional response time in milliseconds */
  response_time_ms?: number;
  /** Optional difficulty level before the response */
  difficulty_before?: number;
  /** Optional difficulty level after the response */
  difficulty_after?: number;
  /** ISO date string for when this session record was created */
  created_at: string;
}

/**
 * Swipe gesture configuration options
 * @interface SwipeGestureConfig
 */
export interface SwipeGestureConfig {
  /** Callback function for left swipe (usually "still learning") */
  onSwipeLeft: () => void;
  /** Callback function for right swipe (usually "know") */
  onSwipeRight: () => void;
  /** Minimum distance threshold for swipe detection (default: 80px) */
  threshold?: number;
  /** Minimum velocity threshold for swipe detection (default: 0.15) */
  velocityThreshold?: number;
  /** Whether swipe gestures are disabled */
  disabled?: boolean;
}

/**
 * Swipe gesture hook return interface
 * @interface SwipeGestureReturn
 */
export interface SwipeGestureReturn {
  /** Whether a swipe gesture is currently in progress */
  isSwipeInProgress: boolean;
  /** Handler for pan start events */
  handlePanStart: () => void;
  /** Handler for pan end events with gesture info */
  handlePanEnd: (event: any, info: any) => void;
  /** Function to reset swipe state */
  resetSwipeState: () => void;
  /** Function to cleanup timeouts and resources */
  cleanup: () => void;
}

/**
 * Progress information for the current study session
 * @interface StudyProgress
 */
export interface StudyProgress {
  /** Completion percentage (0-100) */
  percentage: number;
  /** Number of cards remaining */
  remaining: number;
  /** Whether the session is complete */
  isComplete: boolean;
}

/**
 * Card state management hook return interface
 * @interface CardStateReturn
 */
export interface CardStateReturn {
  /** Current card index */
  currentIndex: number;
  /** Whether the current card is flipped */
  isFlipped: boolean;
  /** Current study session statistics */
  stats: StudyStats;
  /** History of card responses */
  cardHistory: CardHistory[];
  /** Set of starred card IDs */
  starredCards: Set<string>;
  /** Timestamp when current card was started */
  cardStartTime: Date;
  /** Progress information */
  progress: StudyProgress;
  /** Session duration in minutes */
  sessionDuration: number;

  // Action functions
  /** Function to flip the current card */
  flipCard: () => void;
  /** Function to move to the next card */
  moveToNextCard: () => void;
  /** Function to update statistics after a response */
  updateStats: (wasCorrect: boolean, cardId: string) => void;
  /** Function to add a response to history */
  addToHistory: (index: number, wasCorrect: boolean) => void;
  /** Function to undo the last card response */
  undoLastCard: () => void;
  /** Function to restart the entire session */
  restartSession: () => void;
  /** Function to toggle star status of a card */
  toggleStarCard: (cardId: string) => void;
  /** Function to reset the card start time */
  resetCardStartTime: () => void;
  /** Function to set current index directly */
  setCurrentIndex: (index: number) => void;
  /** React state setter for stats */
  setStats: React.Dispatch<React.SetStateAction<StudyStats>>;
}

/**
 * Study database operations interface
 * @interface StudyDatabaseOperations
 */
export interface StudyDatabaseOperations {
  /** Function to save a card response to the database */
  saveCardResponse: (params: {
    card: Flashcard;
    wasCorrect: boolean;
    responseTime: number;
    userId?: string;
    deckId?: string;
  }) => Promise<void>;
}


/**
 * Study session URL parameters
 * @interface StudySessionParams
 */
export interface StudySessionParams {
  /** Deck ID from URL parameters */
  deckId: string;
}

/**
 * Study session search parameters
 * @interface StudySessionSearchParams
 */
export interface StudySessionSearchParams {
  /** Whether to filter for learning cards only */
  learning?: string;
  /** Specific card IDs to study */
  cards?: string;
  /** Study mode (normal, shuffle, etc.) */
  mode?: string;
  /** Starting card number */
  start?: string;
}

/**
 * Animation and gesture related types
 */
export type SwipeDirection = 'left' | 'right';
export type StudyMode = 'normal' | 'shuffle' | 'learning' | 'starred';
export type CardSide = 'front' | 'back';

/**
 * Error types for study session
 */
export interface StudySessionError {
  /** Error message */
  message: string;
  /** Error code for categorization */
  code: 'DECK_NOT_FOUND' | 'NO_CARDS' | 'NETWORK_ERROR' | 'PERMISSION_DENIED' | 'UNKNOWN';
  /** Optional additional error details */
  details?: any;
}
