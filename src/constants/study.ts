/**
 * @fileoverview Constants and configuration values for the Study Session system
 * @description Centralized constants for animations, timing, thresholds, and other configuration
 * @author StudySession Refactor
 * @version 1.0.0
 */

/**
 * Animation duration constants (in milliseconds)
 */
export const ANIMATION_DURATIONS = {
  /** Card flip animation duration */
  CARD_FLIP: 600,
  /** Card entrance animation duration */
  CARD_ENTRANCE: 300,
  /** Card exit animation duration */
  CARD_EXIT: 200,
  /** Swipe indicator display duration */
  SWIPE_INDICATOR: 800,
  /** Center indicator display duration */
  CENTER_INDICATOR: 600,
  /** Modal transition duration */
  MODAL_TRANSITION: 200,
  /** Loading state transition */
  LOADING_TRANSITION: 150,
} as const;

/**
 * Swipe gesture configuration constants
 */
export const SWIPE_CONFIG = {
  /** Minimum distance threshold for swipe detection (pixels) */
  DISTANCE_THRESHOLD: 80,
  /** Minimum velocity threshold for swipe detection */
  VELOCITY_THRESHOLD: 0.15,
  /** Swipe state reset delay (milliseconds) */
  RESET_DELAY: 300,
  /** Drag elastic resistance */
  DRAG_ELASTIC: 0.2,
  /** Maximum drag distance multiplier */
  MAX_DRAG_DISTANCE: 1.5,
} as const;

/**
 * Animation easing functions
 */
export const EASING = {
  /** Standard ease for most animations */
  STANDARD: "easeInOut",
  /** Bounce effect for card interactions */
  BOUNCE: [0.25, 0.46, 0.45, 0.94],
  /** Spring physics for natural movement */
  SPRING: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
  },
  /** Smooth spring for card flips */
  CARD_FLIP_SPRING: {
    type: "spring" as const,
    stiffness: 100,
    damping: 15,
  },
  /** Drag transition settings */
  DRAG_TRANSITION: {
    bounceStiffness: 600,
    bounceDamping: 20,
  },
} as const;

/**
 * Responsive breakpoints (pixels)
 */
export const BREAKPOINTS = {
  /** Mobile devices */
  MOBILE: 768,
  /** Tablet devices */
  TABLET: 1024,
  /** Desktop devices */
  DESKTOP: 1280,
  /** Large desktop devices */
  LARGE_DESKTOP: 1536,
} as const;

/**
 * Card content thresholds for responsive behavior
 */
export const CONTENT_THRESHOLDS = {
  /** Character count thresholds for different screen sizes */
  CHARACTERS: {
    MOBILE: 200,
    DESKTOP: 400,
  },
  /** Line count thresholds for different screen sizes */
  LINES: {
    MOBILE: 3,
    DESKTOP: 5,
  },
  /** Image height constraints based on content length */
  IMAGE_HEIGHT: {
    LONG_TEXT: "max-h-24 sm:max-h-28 md:max-h-32",
    NORMAL_TEXT: "max-h-32 sm:max-h-40 md:max-h-48",
  },
} as const;

/**
 * Study session timing constants
 */
export const STUDY_TIMING = {
  /** Auto-advance delay for cards (milliseconds) */
  AUTO_ADVANCE_DELAY: 3000,
  /** Minimum time before allowing next action (milliseconds) */
  MIN_ACTION_DELAY: 100,
  /** Session timeout warning (minutes) */
  SESSION_TIMEOUT_WARNING: 30,
  /** Maximum session duration (minutes) */
  MAX_SESSION_DURATION: 120,
  /** Progress save interval (milliseconds) */
  PROGRESS_SAVE_INTERVAL: 10000,
} as const;

/**
 * Spaced repetition algorithm constants
 */
export const SPACED_REPETITION = {
  /** Initial difficulty for new cards */
  INITIAL_DIFFICULTY: 2.5,
  /** Minimum difficulty value */
  MIN_DIFFICULTY: 1.3,
  /** Maximum difficulty value */
  MAX_DIFFICULTY: 10.0,
  /** Difficulty adjustment for correct answers */
  CORRECT_ADJUSTMENT: 0.1,
  /** Difficulty adjustment for incorrect answers */
  INCORRECT_ADJUSTMENT: -0.8,
  /** Minimum interval between reviews (hours) */
  MIN_INTERVAL: 1,
  /** Maximum interval between reviews (days) */
  MAX_INTERVAL: 365,
} as const;

/**
 * UI element sizes and spacing
 */
export const UI_SIZES = {
  /** Card dimensions */
  CARD: {
    MIN_HEIGHT: "400px",
    MAX_WIDTH: {
      MOBILE: "sm:max-w-md",
      TABLET: "md:max-w-2xl",
      DESKTOP: "lg:max-w-4xl xl:max-w-5xl",
    },
    BORDER_RADIUS: "24px",
    PADDING: {
      MOBILE: "p-4 sm:p-6",
      DESKTOP: "md:p-8",
    },
  },
  /** Button sizes */
  BUTTON: {
    SMALL: "p-1.5 sm:p-2",
    MEDIUM: "p-2 sm:p-3",
    LARGE: "p-3 sm:p-4",
  },
  /** Icon sizes */
  ICON: {
    SMALL: "h-4 w-4 sm:h-5 sm:w-5",
    MEDIUM: "h-5 w-5 sm:h-6 sm:w-6",
    LARGE: "h-6 w-6 sm:h-7 sm:w-7",
  },
} as const;

/**
 * Color scheme constants
 */
export const COLORS = {
  /** Card background colors */
  CARD: {
    FRONT: "bg-white",
    BACK: "bg-gradient-to-br from-blue-50 to-indigo-50",
    BORDER: {
      FRONT: "border-gray-100",
      BACK: "border-blue-100",
    },
  },
  /** Swipe indicator colors */
  SWIPE_INDICATOR: {
    KNOW: "bg-green-500",
    LEARNING: "bg-orange-500",
  },
  /** Button colors */
  BUTTON: {
    PRIMARY: "bg-blue-100 hover:bg-blue-200",
    SECONDARY: "bg-gray-100 hover:bg-gray-200",
    SUCCESS: "bg-green-100 hover:bg-green-200",
    WARNING: "bg-orange-100 hover:bg-orange-200",
  },
} as const;

/**
 * Accessibility constants
 */
export const A11Y = {
  /** ARIA labels */
  LABELS: {
    FLIP_CARD: "Flip flashcard to see answer",
    SWIPE_LEFT: "Mark card as still learning",
    SWIPE_RIGHT: "Mark card as known",
    STAR_CARD: "Star this card for later review",
    EDIT_CARD: "Edit this flashcard",
    CLOSE_MODAL: "Close modal",
    PREVIOUS_CARD: "Go to previous card",
    NEXT_CARD: "Go to next card",
  },
  /** Keyboard shortcuts */
  SHORTCUTS: {
    FLIP: " ", // Spacebar
    KNOW: "ArrowRight",
    LEARNING: "ArrowLeft",
    STAR: "s",
    EDIT: "e",
    UNDO: "u",
    RESTART: "r",
    ESCAPE: "Escape",
  },
  /** Focus management */
  FOCUS: {
    TRAP_ENABLED: true,
    RESTORE_ON_CLOSE: true,
    SKIP_LINKS: true,
  },
} as const;

/**
 * Performance optimization constants
 */
export const PERFORMANCE = {
  /** Debounce delays (milliseconds) */
  DEBOUNCE: {
    SEARCH: 300,
    RESIZE: 150,
    SCROLL: 100,
    INPUT: 200,
  },
  /** Throttle delays (milliseconds) */
  THROTTLE: {
    ANIMATION: 16, // ~60fps
    GESTURE: 50,
    NETWORK: 1000,
  },
  /** Virtual scrolling thresholds */
  VIRTUAL_SCROLL: {
    ITEM_HEIGHT: 100,
    BUFFER_SIZE: 5,
    OVERSCAN: 2,
  },
} as const;

/**
 * Error messages and codes
 */
export const ERROR_MESSAGES = {
  DECK_NOT_FOUND: "Deck not found or you don't have permission to access it",
  NO_CARDS: "This deck doesn't contain any flashcards",
  NETWORK_ERROR: "Network error occurred. Please check your connection",
  PERMISSION_DENIED: "You don't have permission to perform this action",
  SESSION_EXPIRED: "Your session has expired. Please log in again",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again",
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  STUDY_PROGRESS: "study_progress",
  USER_PREFERENCES: "user_preferences",
  CARD_HISTORY: "card_history",
  SESSION_STATE: "session_state",
} as const;

/**
 * API endpoints and configuration
 */
export const API_CONFIG = {
  /** Request timeout (milliseconds) */
  TIMEOUT: 10000,
  /** Retry attempts */
  RETRY_ATTEMPTS: 3,
  /** Retry delay (milliseconds) */
  RETRY_DELAY: 1000,
  /** Batch size for bulk operations */
  BATCH_SIZE: 50,
} as const;

/**
 * Feature flags for conditional functionality
 */
export const FEATURE_FLAGS = {
  /** Enable keyboard shortcuts */
  KEYBOARD_SHORTCUTS: true,
  /** Enable swipe gestures */
  SWIPE_GESTURES: true,
  /** Enable progress persistence */
  PROGRESS_PERSISTENCE: true,
  /** Enable analytics tracking */
  ANALYTICS: false,
  /** Enable experimental features */
  EXPERIMENTAL: false,
} as const;
