/**
 * @fileoverview TypeScript interfaces and types for the Quiz System
 * @description Centralized type definitions for quizzes, questions, quiz attempts, and related data structures
 * @author Quiz System Implementation
 * @version 1.0.0
 */

/**
 * Base question interface with common properties
 * @interface BaseQuestion
 */
export interface BaseQuestion {
  /** Unique identifier for the question */
  id: string;
  /** ID of the quiz this question belongs to */
  quiz_id: string;
  /** The question text/prompt */
  question_text: string;
  /** Type of question (mcq, fill_blank, true_false, match_following) */
  question_type: QuestionType;
  /** Optional explanation shown after answering */
  explanation?: string;
  /** Order/position of question in the quiz (0-based) */
  order_index: number;
  /** ISO date string for when this question was created */
  created_at: string;
  /** ISO date string for when this question was last updated */
  updated_at: string;
}

/**
 * Multiple Choice Question data structure
 * @interface MCQData
 */
export interface MCQData {
  /** Array of answer options */
  options: string[];
  /** Index of the correct answer (0-based) */
  correctAnswer: number;
  /** Whether to shuffle options when displaying */
  shuffleOptions?: boolean;
}

/**
 * Fill in the Blank Question data structure
 * @interface FillBlankData
 */
export interface FillBlankData {
  /** Array of acceptable correct answers */
  correctAnswers: string[];
  /** Whether answer matching is case sensitive */
  caseSensitive?: boolean;
  /** Whether to accept partial matches */
  acceptPartialMatch?: boolean;
}

/**
 * True/False Question data structure
 * @interface TrueFalseData
 */
export interface TrueFalseData {
  /** The correct answer (true or false) */
  correctAnswer: boolean;
}

/**
 * Match the Following Question data structure
 * @interface MatchFollowingData
 */
export interface MatchFollowingData {
  /** Array of items to be matched */
  leftItems: string[];
  /** Array of items to match with */
  rightItems: string[];
  /** Array of correct pairs (indices) */
  correctPairs: Array<{ left: number; right: number }>;
  /** Whether to shuffle the items when displaying */
  shuffleItems?: boolean;
}

/**
 * Union type for all question data types
 */
export type QuestionData = MCQData | FillBlankData | TrueFalseData | MatchFollowingData;

/**
 * Question types enumeration
 */
export type QuestionType = 'mcq' | 'fill_blank' | 'true_false' | 'match_following';

/**
 * Multiple Choice Question interface
 * @interface MCQQuestion
 */
export interface MCQQuestion extends BaseQuestion {
  question_type: 'mcq';
  question_data: MCQData;
}

/**
 * Fill in the Blank Question interface
 * @interface FillBlankQuestion
 */
export interface FillBlankQuestion extends BaseQuestion {
  question_type: 'fill_blank';
  question_data: FillBlankData;
}

/**
 * True/False Question interface
 * @interface TrueFalseQuestion
 */
export interface TrueFalseQuestion extends BaseQuestion {
  question_type: 'true_false';
  question_data: TrueFalseData;
}

/**
 * Match the Following Question interface
 * @interface MatchFollowingQuestion
 */
export interface MatchFollowingQuestion extends BaseQuestion {
  question_type: 'match_following';
  question_data: MatchFollowingData;
}

/**
 * Union type for all question types
 */
export type Question = MCQQuestion | FillBlankQuestion | TrueFalseQuestion | MatchFollowingQuestion;

/**
 * Quiz settings configuration
 * @interface QuizSettings
 */
export interface QuizSettings {
  /** Time limit for the entire quiz in minutes */
  timeLimit?: number;
  /** Whether to shuffle questions */
  shuffleQuestions?: boolean;
  /** Whether to show results immediately after completion */
  showResults?: boolean;
  /** Whether to allow retakes */
  allowRetakes?: boolean;
  /** Maximum number of retakes allowed */
  maxRetakes?: number;
  /** Whether to show correct answers in results */
  showCorrectAnswers?: boolean;
  /** Whether to show explanations in results */
  showExplanations?: boolean;
  /** Passing score percentage (0-100) */
  passingScore?: number;
}

/**
 * Core quiz interface
 * @interface Quiz
 */
export interface Quiz {
  /** Unique identifier for the quiz */
  id: string;
  /** Quiz title */
  title: string;
  /** Optional quiz description */
  description?: string;
  /** ID of the folder containing this quiz */
  folder_id: string;
  /** ID of the user who owns this quiz */
  user_id: string;
  /** Quiz configuration settings */
  settings: QuizSettings;
  /** ISO date string for when this quiz was created */
  created_at: string;
  /** ISO date string for when this quiz was last updated */
  updated_at: string;
  /** Array of questions (populated when needed) */
  questions?: Question[];
  /** Number of questions in the quiz */
  question_count?: number;
}

/**
 * Answer data for different question types
 */
export type AnswerData = 
  | { type: 'mcq'; selectedOption: number }
  | { type: 'fill_blank'; answer: string }
  | { type: 'true_false'; answer: boolean }
  | { type: 'match_following'; pairs: Array<{ left: number; right: number }> };

/**
 * Individual question answer in a quiz attempt
 * @interface QuestionAnswer
 */
export interface QuestionAnswer {
  /** ID of the question */
  questionId: string;
  /** User's answer data */
  answer: AnswerData;
  /** Whether the answer was correct */
  correct: boolean;
  /** Time taken to answer this question in seconds */
  timeSpent?: number;
}

/**
 * Quiz attempt interface
 * @interface QuizAttempt
 */
export interface QuizAttempt {
  /** Unique identifier for the quiz attempt */
  id: string;
  /** ID of the quiz being attempted */
  quiz_id: string;
  /** ID of the user taking the quiz */
  user_id: string;
  /** ISO date string for when the attempt was started */
  started_at: string;
  /** ISO date string for when the attempt was completed (null if in progress) */
  completed_at?: string;
  /** Final score as percentage (0-100) */
  score?: number;
  /** Total number of questions in the quiz */
  total_questions: number;
  /** Number of correct answers */
  correct_answers: number;
  /** Total time taken in seconds */
  time_taken?: number;
  /** Array of all question answers */
  answers: QuestionAnswer[];
  /** ISO date string for when this record was created */
  created_at: string;
}

/**
 * Quiz attempt statistics
 * @interface QuizAttemptStats
 */
export interface QuizAttemptStats {
  /** Total number of attempts */
  totalAttempts: number;
  /** Best score achieved */
  bestScore?: number;
  /** Most recent score */
  lastScore?: number;
  /** Average score across all attempts */
  averageScore?: number;
  /** Average time taken */
  averageTime?: number;
  /** Whether the user has passed (if passing score is set) */
  hasPassed?: boolean;
}

/**
 * Quiz creation/editing form data
 * @interface QuizFormData
 */
export interface QuizFormData {
  /** Quiz title */
  title: string;
  /** Quiz description */
  description?: string;
  /** Quiz settings */
  settings: QuizSettings;
  /** Array of questions */
  questions: Omit<Question, 'id' | 'quiz_id' | 'created_at' | 'updated_at'>[];
}

/**
 * Question creation/editing form data
 * @interface QuestionFormData
 */
export interface QuestionFormData {
  /** Question text */
  question_text: string;
  /** Question type */
  question_type: QuestionType;
  /** Question-specific data */
  question_data: QuestionData;
  /** Optional explanation */
  explanation?: string;
  /** Order index */
  order_index: number;
}

/**
 * Quiz taking session state
 * @interface QuizSession
 */
export interface QuizSession {
  /** The quiz being taken */
  quiz: Quiz;
  /** Current question index */
  currentQuestionIndex: number;
  /** Array of user answers */
  answers: QuestionAnswer[];
  /** Session start time */
  startTime: Date;
  /** Whether the session is completed */
  isCompleted: boolean;
  /** Time remaining in seconds (for timed quizzes) */
  timeRemaining?: number;
  /** Whether the session is paused */
  isPaused?: boolean;
}

/**
 * Quiz results summary
 * @interface QuizResults
 */
export interface QuizResults {
  /** The completed quiz attempt */
  attempt: QuizAttempt;
  /** The quiz that was taken */
  quiz: Quiz;
  /** Detailed breakdown by question */
  questionResults: Array<{
    question: Question;
    answer: QuestionAnswer;
    isCorrect: boolean;
  }>;
  /** Whether the user passed (if passing score is set) */
  passed?: boolean;
  /** Performance metrics */
  metrics: {
    /** Percentage score */
    scorePercentage: number;
    /** Time taken formatted */
    timeFormatted: string;
    /** Questions answered correctly */
    correctCount: number;
    /** Total questions */
    totalCount: number;
  };
}

/**
 * Type guards for question types
 */
export const isQuestionType = (type: string): type is QuestionType => {
  return ['mcq', 'fill_blank', 'true_false', 'match_following'].includes(type);
};

export const isMCQQuestion = (question: Question): question is MCQQuestion => {
  return question.question_type === 'mcq';
};

export const isFillBlankQuestion = (question: Question): question is FillBlankQuestion => {
  return question.question_type === 'fill_blank';
};

export const isTrueFalseQuestion = (question: Question): question is TrueFalseQuestion => {
  return question.question_type === 'true_false';
};

export const isMatchFollowingQuestion = (question: Question): question is MatchFollowingQuestion => {
  return question.question_type === 'match_following';
};

/**
 * Validation functions for question data
 */
export const validateMCQData = (data: any): data is MCQData => {
  return (
    data &&
    Array.isArray(data.options) &&
    data.options.length >= 2 &&
    typeof data.correctAnswer === 'number' &&
    data.correctAnswer >= 0 &&
    data.correctAnswer < data.options.length
  );
};

export const validateFillBlankData = (data: any): data is FillBlankData => {
  return (
    data &&
    Array.isArray(data.correctAnswers) &&
    data.correctAnswers.length > 0 &&
    data.correctAnswers.every((answer: any) => typeof answer === 'string')
  );
};

export const validateTrueFalseData = (data: any): data is TrueFalseData => {
  return data && typeof data.correctAnswer === 'boolean';
};

export const validateMatchFollowingData = (data: any): data is MatchFollowingData => {
  return (
    data &&
    Array.isArray(data.leftItems) &&
    Array.isArray(data.rightItems) &&
    Array.isArray(data.correctPairs) &&
    data.leftItems.length > 0 &&
    data.rightItems.length > 0 &&
    data.correctPairs.length > 0 &&
    data.correctPairs.every((pair: any) => 
      typeof pair.left === 'number' && 
      typeof pair.right === 'number' &&
      pair.left >= 0 && 
      pair.left < data.leftItems.length &&
      pair.right >= 0 && 
      pair.right < data.rightItems.length
    )
  );
};

/**
 * Utility types for quiz operations
 */
export type QuizOperationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

export type QuizValidationError = {
  field: string;
  message: string;
};

export type QuizValidationResult = {
  isValid: boolean;
  errors: QuizValidationError[];
};

/**
 * Quiz error types
 */
export interface QuizError {
  /** Error message */
  message: string;
  /** Error code for categorization */
  code: 'QUIZ_NOT_FOUND' | 'PERMISSION_DENIED' | 'INVALID_DATA' | 'NETWORK_ERROR' | 'UNKNOWN';
  /** Optional additional error details */
  details?: any;
}
/**
 * A
dditional utility types for quiz operations
 */

/**
 * Quiz creation request payload
 * @interface CreateQuizRequest
 */
export interface CreateQuizRequest {
  title: string;
  description?: string;
  folder_id: string;
  settings?: Partial<QuizSettings>;
}

/**
 * Quiz update request payload
 * @interface UpdateQuizRequest
 */
export interface UpdateQuizRequest {
  title?: string;
  description?: string;
  settings?: Partial<QuizSettings>;
}

/**
 * Question creation request payload
 * @interface CreateQuestionRequest
 */
export interface CreateQuestionRequest {
  quiz_id: string;
  question_text: string;
  question_type: QuestionType;
  question_data: QuestionData;
  explanation?: string;
  order_index: number;
}

/**
 * Question update request payload
 * @interface UpdateQuestionRequest
 */
export interface UpdateQuestionRequest {
  question_text?: string;
  question_type?: QuestionType;
  question_data?: QuestionData;
  explanation?: string;
  order_index?: number;
}

/**
 * Quiz attempt creation request payload
 * @interface CreateQuizAttemptRequest
 */
export interface CreateQuizAttemptRequest {
  quiz_id: string;
  total_questions: number;
}

/**
 * Quiz attempt update request payload (for completion)
 * @interface UpdateQuizAttemptRequest
 */
export interface UpdateQuizAttemptRequest {
  completed_at: string;
  score: number;
  correct_answers: number;
  time_taken?: number;
  answers: QuestionAnswer[];
}

/**
 * Quiz list item for folder view
 * @interface QuizListItem
 */
export interface QuizListItem {
  id: string;
  title: string;
  description?: string;
  question_count: number;
  created_at: string;
  updated_at: string;
  last_attempt?: {
    score: number;
    completed_at: string;
  };
  attempt_count: number;
}

/**
 * Quiz search and filter options
 * @interface QuizSearchOptions
 */
export interface QuizSearchOptions {
  /** Search query for title/description */
  query?: string;
  /** Filter by folder ID */
  folder_id?: string;
  /** Sort by field */
  sortBy?: 'title' | 'created_at' | 'updated_at' | 'question_count';
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Pagination limit */
  limit?: number;
  /** Pagination offset */
  offset?: number;
}

/**
 * Quiz analytics data
 * @interface QuizAnalytics
 */
export interface QuizAnalytics {
  /** Quiz ID */
  quiz_id: string;
  /** Total number of attempts */
  total_attempts: number;
  /** Number of unique users who attempted */
  unique_users: number;
  /** Average score across all attempts */
  average_score: number;
  /** Average completion time */
  average_time: number;
  /** Completion rate (completed vs started) */
  completion_rate: number;
  /** Question-level analytics */
  question_analytics: Array<{
    question_id: string;
    question_text: string;
    correct_rate: number;
    average_time: number;
    total_attempts: number;
  }>;
}

/**
 * Quiz export data structure
 * @interface QuizExportData
 */
export interface QuizExportData {
  quiz: Quiz;
  questions: Question[];
  metadata: {
    exported_at: string;
    exported_by: string;
    version: string;
  };
}

/**
 * Quiz import result
 * @interface QuizImportResult
 */
export interface QuizImportResult {
  success: boolean;
  quiz_id?: string;
  errors?: string[];
  warnings?: string[];
}

/**
 * Advanced type guards for answer data
 */
export const isMCQAnswer = (answer: AnswerData): answer is { type: 'mcq'; selectedOption: number } => {
  return answer.type === 'mcq' && typeof answer.selectedOption === 'number';
};

export const isFillBlankAnswer = (answer: AnswerData): answer is { type: 'fill_blank'; answer: string } => {
  return answer.type === 'fill_blank' && typeof answer.answer === 'string';
};

export const isTrueFalseAnswer = (answer: AnswerData): answer is { type: 'true_false'; answer: boolean } => {
  return answer.type === 'true_false' && typeof answer.answer === 'boolean';
};

export const isMatchFollowingAnswer = (answer: AnswerData): answer is { type: 'match_following'; pairs: Array<{ left: number; right: number }> } => {
  return answer.type === 'match_following' && Array.isArray(answer.pairs);
};

/**
 * Quiz state management types
 */
export type QuizLoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface QuizState {
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  currentSession: QuizSession | null;
  loadingState: QuizLoadingState;
  error: string | null;
}

/**
 * Quiz action types for state management
 */
export type QuizAction =
  | { type: 'LOAD_QUIZZES_START' }
  | { type: 'LOAD_QUIZZES_SUCCESS'; payload: Quiz[] }
  | { type: 'LOAD_QUIZZES_ERROR'; payload: string }
  | { type: 'SET_CURRENT_QUIZ'; payload: Quiz | null }
  | { type: 'START_QUIZ_SESSION'; payload: QuizSession }
  | { type: 'UPDATE_QUIZ_SESSION'; payload: Partial<QuizSession> }
  | { type: 'END_QUIZ_SESSION' }
  | { type: 'CLEAR_ERROR' };

/**
 * Quiz hook return type
 */
export interface UseQuizReturn {
  // State
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  currentSession: QuizSession | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadQuizzes: (folderId?: string) => Promise<void>;
  loadQuiz: (quizId: string) => Promise<Quiz | null>;
  createQuiz: (data: CreateQuizRequest) => Promise<Quiz>;
  updateQuiz: (quizId: string, data: UpdateQuizRequest) => Promise<Quiz>;
  deleteQuiz: (quizId: string) => Promise<void>;
  startQuizSession: (quiz: Quiz) => void;
  updateQuizSession: (updates: Partial<QuizSession>) => void;
  endQuizSession: () => void;
  clearError: () => void;
}

/**
 * Question hook return type
 */
export interface UseQuestionsReturn {
  // State
  questions: Question[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadQuestions: (quizId: string) => Promise<void>;
  createQuestion: (data: CreateQuestionRequest) => Promise<Question>;
  updateQuestion: (questionId: string, data: UpdateQuestionRequest) => Promise<Question>;
  deleteQuestion: (questionId: string) => Promise<void>;
  reorderQuestions: (quizId: string, questionIds: string[]) => Promise<void>;
  clearError: () => void;
}

/**
 * Quiz attempts hook return type
 */
export interface UseQuizAttemptsReturn {
  // State
  attempts: QuizAttempt[];
  currentAttempt: QuizAttempt | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadAttempts: (quizId?: string, userId?: string) => Promise<void>;
  startAttempt: (quizId: string, userId: string, totalQuestions: number) => Promise<QuizAttempt>;
  completeAttempt: (attemptId: string, quiz: Quiz, questions: Question[], userAnswers: QuestionAnswer[], startTime: Date) => Promise<QuizAttempt>;
  getAttemptStats: (quizId: string, userId?: string) => Promise<QuizAttemptStats>;
  getAttemptById: (attemptId: string) => Promise<QuizAttempt | null>;
  getBestAttempt: (quizId: string, userId?: string) => Promise<QuizAttempt | null>;
  getLatestAttempt: (quizId: string, userId?: string) => Promise<QuizAttempt | null>;
  deleteAttempt: (attemptId: string, userId?: string) => Promise<void>;
  createDetailedResults: (quiz: Quiz, questions: Question[], attempt: QuizAttempt) => QuizResults;
  clearError: () => void;
}