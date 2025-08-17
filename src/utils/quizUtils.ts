/**
 * @fileoverview Utility functions for quiz operations and configurations
 * @description Helper functions for quiz validation, scoring, and data manipulation
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import {
  Quiz,
  Question,
  QuestionType,
  QuestionData,
  QuizSettings,
  QuizAttempt,
  QuestionAnswer,
  AnswerData,
  QuizValidationResult,
  QuizValidationError,
  MCQData,
  FillBlankData,
  TrueFalseData,
  MatchFollowingData,
  validateMCQData,
  validateFillBlankData,
  validateTrueFalseData,
  validateMatchFollowingData,
  isMCQQuestion,
  isFillBlankQuestion,
  isTrueFalseQuestion,
  isMatchFollowingQuestion
} from '../types/quiz';

/**
 * Default quiz settings
 */
export const DEFAULT_QUIZ_SETTINGS: QuizSettings = {
  shuffleQuestions: false,
  showResults: true,
  allowRetakes: true,
  showCorrectAnswers: true,
  showExplanations: true,
};

/**
 * Validates quiz data before creation or update
 * @param quiz - Quiz data to validate
 * @returns Validation result with errors if any
 */
export const validateQuiz = (quiz: Partial<Quiz>): QuizValidationResult => {
  const errors: QuizValidationError[] = [];

  // Validate title
  if (!quiz.title || quiz.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Quiz title is required' });
  } else if (quiz.title.trim().length > 255) {
    errors.push({ field: 'title', message: 'Quiz title must be 255 characters or less' });
  }

  // Validate folder_id
  if (!quiz.folder_id) {
    errors.push({ field: 'folder_id', message: 'Folder ID is required' });
  }

  // Validate user_id
  if (!quiz.user_id) {
    errors.push({ field: 'user_id', message: 'User ID is required' });
  }

  // Validate settings
  if (quiz.settings) {
    const settingsErrors = validateQuizSettings(quiz.settings);
    errors.push(...settingsErrors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates quiz settings
 * @param settings - Quiz settings to validate
 * @returns Array of validation errors
 */
export const validateQuizSettings = (settings: QuizSettings): QuizValidationError[] => {
  const errors: QuizValidationError[] = [];

  if (settings.timeLimit !== undefined) {
    if (settings.timeLimit <= 0) {
      errors.push({ field: 'settings.timeLimit', message: 'Time limit must be greater than 0' });
    } else if (settings.timeLimit > 1440) { // 24 hours
      errors.push({ field: 'settings.timeLimit', message: 'Time limit cannot exceed 24 hours' });
    }
  }

  if (settings.maxRetakes !== undefined && settings.maxRetakes < 0) {
    errors.push({ field: 'settings.maxRetakes', message: 'Max retakes cannot be negative' });
  }

  if (settings.passingScore !== undefined) {
    if (settings.passingScore < 0 || settings.passingScore > 100) {
      errors.push({ field: 'settings.passingScore', message: 'Passing score must be between 0 and 100' });
    }
  }

  return errors;
};

/**
 * Validates question data based on question type
 * @param question - Question to validate
 * @returns Validation result with errors if any
 */
export const validateQuestion = (question: Partial<Question>): QuizValidationResult => {
  const errors: QuizValidationError[] = [];

  // Validate question text
  if (!question.question_text || question.question_text.trim().length === 0) {
    errors.push({ field: 'question_text', message: 'Question text is required' });
  }

  // Validate question type
  if (!question.question_type) {
    errors.push({ field: 'question_type', message: 'Question type is required' });
  } else if (!['mcq', 'fill_blank', 'true_false', 'match_following'].includes(question.question_type)) {
    errors.push({ field: 'question_type', message: 'Invalid question type' });
  }

  // Validate order index
  if (question.order_index !== undefined && question.order_index < 0) {
    errors.push({ field: 'order_index', message: 'Order index cannot be negative' });
  }

  // Validate question data based on type
  if (question.question_type && question.question_data) {
    const dataErrors = validateQuestionData(question.question_type, question.question_data);
    errors.push(...dataErrors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates question data based on question type
 * @param questionType - Type of question
 * @param questionData - Question data to validate
 * @returns Array of validation errors
 */
export const validateQuestionData = (questionType: QuestionType, questionData: QuestionData): QuizValidationError[] => {
  const errors: QuizValidationError[] = [];

  switch (questionType) {
    case 'mcq':
      if (!validateMCQData(questionData)) {
        errors.push({ field: 'question_data', message: 'Invalid MCQ data: must have at least 2 options and valid correct answer index' });
      }
      break;
    case 'fill_blank':
      if (!validateFillBlankData(questionData)) {
        errors.push({ field: 'question_data', message: 'Invalid Fill Blank data: must have at least one correct answer' });
      }
      break;
    case 'true_false':
      if (!validateTrueFalseData(questionData)) {
        errors.push({ field: 'question_data', message: 'Invalid True/False data: must have a boolean correct answer' });
      }
      break;
    case 'match_following':
      if (!validateMatchFollowingData(questionData)) {
        errors.push({ field: 'question_data', message: 'Invalid Match Following data: must have valid items and correct pairs' });
      }
      break;
    default:
      errors.push({ field: 'question_type', message: 'Unknown question type' });
  }

  return errors;
};

/**
 * Calculates the score for a quiz attempt with detailed breakdown
 * @param questions - Array of questions
 * @param answers - Array of user answers
 * @returns Score calculation result with detailed metrics
 */
export const calculateQuizScore = (questions: Question[], answers: QuestionAnswer[]): {
  score: number;
  correctCount: number;
  totalCount: number;
  breakdown: {
    mcq: { correct: number; total: number };
    fill_blank: { correct: number; total: number };
    true_false: { correct: number; total: number };
    match_following: { correct: number; total: number };
  };
  timeMetrics: {
    totalTime: number;
    averageTimePerQuestion: number;
    fastestQuestion: number;
    slowestQuestion: number;
  };
} => {
  if (questions.length === 0) {
    return { 
      score: 0, 
      correctCount: 0, 
      totalCount: 0,
      breakdown: {
        mcq: { correct: 0, total: 0 },
        fill_blank: { correct: 0, total: 0 },
        true_false: { correct: 0, total: 0 },
        match_following: { correct: 0, total: 0 }
      },
      timeMetrics: {
        totalTime: 0,
        averageTimePerQuestion: 0,
        fastestQuestion: 0,
        slowestQuestion: 0
      }
    };
  }

  // Initialize breakdown counters
  const breakdown = {
    mcq: { correct: 0, total: 0 },
    fill_blank: { correct: 0, total: 0 },
    true_false: { correct: 0, total: 0 },
    match_following: { correct: 0, total: 0 }
  };

  // Calculate scores and breakdown
  let correctCount = 0;
  const times: number[] = [];

  questions.forEach(question => {
    const answer = answers.find(a => a.questionId === question.id);
    const questionType = question.question_type;
    
    // Update total count for question type
    breakdown[questionType].total++;
    
    if (answer) {
      // Track time if available
      if (answer.timeSpent) {
        times.push(answer.timeSpent);
      }
      
      // Check if answer is correct and update counters
      if (answer.correct) {
        correctCount++;
        breakdown[questionType].correct++;
      }
    }
  });

  const totalCount = questions.length;
  const score = Math.round((correctCount / totalCount) * 100 * 100) / 100; // Round to 2 decimal places

  // Calculate time metrics
  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTimePerQuestion = times.length > 0 ? Math.round(totalTime / times.length) : 0;
  const fastestQuestion = times.length > 0 ? Math.min(...times) : 0;
  const slowestQuestion = times.length > 0 ? Math.max(...times) : 0;

  return { 
    score, 
    correctCount, 
    totalCount,
    breakdown,
    timeMetrics: {
      totalTime,
      averageTimePerQuestion,
      fastestQuestion,
      slowestQuestion
    }
  };
};

/**
 * Checks if an answer is correct for a given question
 * @param question - The question being answered
 * @param answerData - The user's answer
 * @returns Whether the answer is correct
 */
export const isAnswerCorrect = (question: Question, answerData: AnswerData): boolean => {
  if (question.question_type !== answerData.type) {
    return false;
  }

  switch (question.question_type) {
    case 'mcq':
      if (isMCQQuestion(question) && answerData.type === 'mcq') {
        return answerData.selectedOption === question.question_data.correctAnswer;
      }
      break;
    case 'fill_blank':
      if (isFillBlankQuestion(question) && answerData.type === 'fill_blank') {
        const correctAnswers = question.question_data.correctAnswers;
        const userAnswer = answerData.answer.trim();
        const caseSensitive = question.question_data.caseSensitive ?? false;
        
        return correctAnswers.some(correct => 
          caseSensitive 
            ? correct === userAnswer
            : correct.toLowerCase() === userAnswer.toLowerCase()
        );
      }
      break;
    case 'true_false':
      if (isTrueFalseQuestion(question) && answerData.type === 'true_false') {
        return answerData.answer === question.question_data.correctAnswer;
      }
      break;
    case 'match_following':
      if (isMatchFollowingQuestion(question) && answerData.type === 'match_following') {
        const correctPairs = question.question_data.correctPairs;
        const userPairs = answerData.pairs;
        
        if (correctPairs.length !== userPairs.length) {
          return false;
        }
        
        // Check if all user pairs match correct pairs
        return correctPairs.every(correctPair => 
          userPairs.some(userPair => 
            userPair.left === correctPair.left && userPair.right === correctPair.right
          )
        );
      }
      break;
  }

  return false;
};

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param array - Array to shuffle
 * @returns New shuffled array
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Formats time in seconds to a readable string
 * @param seconds - Time in seconds
 * @returns Formatted time string (e.g., "2m 30s", "1h 15m")
 */
export const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
};

/**
 * Generates a unique order index for a new question
 * @param existingQuestions - Array of existing questions
 * @returns New order index
 */
export const generateQuestionOrderIndex = (existingQuestions: Question[]): number => {
  if (existingQuestions.length === 0) {
    return 0;
  }
  return Math.max(...existingQuestions.map(q => q.order_index)) + 1;
};

/**
 * Reorders questions based on new order indices
 * @param questions - Array of questions to reorder
 * @param newOrder - Array of question IDs in new order
 * @returns Reordered questions with updated order indices
 */
export const reorderQuestions = (questions: Question[], newOrder: string[]): Question[] => {
  const questionMap = new Map(questions.map(q => [q.id, q]));
  
  return newOrder.map((id, index) => {
    const question = questionMap.get(id);
    if (!question) {
      throw new Error(`Question with ID ${id} not found`);
    }
    return {
      ...question,
      order_index: index
    };
  });
};

/**
 * Creates a default question based on type
 * @param questionType - Type of question to create
 * @param orderIndex - Order index for the question
 * @returns Default question data
 */
export const createDefaultQuestion = (questionType: QuestionType, orderIndex: number): Omit<Question, 'id' | 'quiz_id' | 'created_at' | 'updated_at'> => {
  const baseQuestion = {
    question_text: '',
    question_type: questionType,
    explanation: '',
    order_index: orderIndex,
  };

  switch (questionType) {
    case 'mcq':
      return {
        ...baseQuestion,
        question_type: 'mcq',
        question_data: {
          options: ['', ''],
          correctAnswer: 0,
          shuffleOptions: false
        } as MCQData
      };
    case 'fill_blank':
      return {
        ...baseQuestion,
        question_type: 'fill_blank',
        question_data: {
          correctAnswers: [''],
          caseSensitive: false,
          acceptPartialMatch: false
        } as FillBlankData
      };
    case 'true_false':
      return {
        ...baseQuestion,
        question_type: 'true_false',
        question_data: {
          correctAnswer: true
        } as TrueFalseData
      };
    case 'match_following':
      return {
        ...baseQuestion,
        question_type: 'match_following',
        question_data: {
          leftItems: [''],
          rightItems: [''],
          correctPairs: [{ left: 0, right: 0 }],
          shuffleItems: false
        } as MatchFollowingData
      };
    default:
      throw new Error(`Unknown question type: ${questionType}`);
  }
};

/**
 * Creates detailed quiz results from attempt data
 * @param quiz - The quiz that was taken
 * @param questions - Questions from the quiz
 * @param attempt - The completed quiz attempt
 * @returns Detailed quiz results with breakdown
 */
export const createQuizResults = (quiz: Quiz, questions: Question[], attempt: QuizAttempt): {
  attempt: QuizAttempt;
  quiz: Quiz;
  questionResults: Array<{
    question: Question;
    answer: QuestionAnswer | undefined;
    isCorrect: boolean;
  }>;
  passed?: boolean;
  metrics: {
    scorePercentage: number;
    timeFormatted: string;
    correctCount: number;
    totalCount: number;
    breakdown: {
      mcq: { correct: number; total: number };
      fill_blank: { correct: number; total: number };
      true_false: { correct: number; total: number };
      match_following: { correct: number; total: number };
    };
  };
} => {
  // Create question results
  const questionResults = questions.map(question => {
    const answer = attempt.answers.find(a => a.questionId === question.id);
    const isCorrect = answer?.correct || false;
    
    return {
      question,
      answer,
      isCorrect
    };
  });

  // Calculate detailed metrics
  const scoreCalculation = calculateQuizScore(questions, attempt.answers);
  
  // Determine if passed
  const passed = quiz.settings.passingScore !== undefined 
    ? (attempt.score || 0) >= quiz.settings.passingScore 
    : undefined;

  return {
    attempt,
    quiz,
    questionResults,
    passed,
    metrics: {
      scorePercentage: attempt.score || 0,
      timeFormatted: formatTime(attempt.time_taken || 0),
      correctCount: attempt.correct_answers,
      totalCount: attempt.total_questions,
      breakdown: scoreCalculation.breakdown
    }
  };
};

/**
 * Calculates quiz attempt statistics with enhanced metrics
 * @param attempts - Array of quiz attempts
 * @param passingScore - Optional passing score threshold
 * @returns Enhanced quiz attempt statistics
 */
export const calculateQuizStats = (attempts: QuizAttempt[], passingScore?: number) => {
  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      bestScore: undefined,
      lastScore: undefined,
      averageScore: undefined,
      averageTime: undefined,
      hasPassed: undefined,
      improvementTrend: 0,
      consistencyScore: 0
    };
  }

  const completedAttempts = attempts.filter(attempt => attempt.completed_at && attempt.score !== null);
  
  if (completedAttempts.length === 0) {
    return {
      totalAttempts: attempts.length,
      bestScore: undefined,
      lastScore: undefined,
      averageScore: undefined,
      averageTime: undefined,
      hasPassed: undefined,
      improvementTrend: 0,
      consistencyScore: 0
    };
  }

  const scores = completedAttempts.map(attempt => attempt.score!);
  const times = completedAttempts.filter(attempt => attempt.time_taken).map(attempt => attempt.time_taken!);
  
  const bestScore = Math.max(...scores);
  const lastScore = completedAttempts[completedAttempts.length - 1].score!;
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const averageTime = times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : undefined;
  const hasPassed = passingScore !== undefined ? bestScore >= passingScore : undefined;

  // Calculate improvement trend (comparing first half to second half of attempts)
  let improvementTrend = 0;
  if (scores.length >= 4) {
    const midPoint = Math.floor(scores.length / 2);
    const firstHalfAvg = scores.slice(0, midPoint).reduce((sum, score) => sum + score, 0) / midPoint;
    const secondHalfAvg = scores.slice(midPoint).reduce((sum, score) => sum + score, 0) / (scores.length - midPoint);
    improvementTrend = secondHalfAvg - firstHalfAvg;
  }

  // Calculate consistency score (lower standard deviation = higher consistency)
  let consistencyScore = 0;
  if (scores.length > 1) {
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    consistencyScore = Math.max(0, 100 - standardDeviation); // Convert to 0-100 scale
  }

  return {
    totalAttempts: attempts.length,
    bestScore: Math.round(bestScore * 100) / 100,
    lastScore: Math.round(lastScore * 100) / 100,
    averageScore: Math.round(averageScore * 100) / 100,
    averageTime: averageTime ? Math.round(averageTime) : undefined,
    hasPassed,
    improvementTrend: Math.round(improvementTrend * 100) / 100,
    consistencyScore: Math.round(consistencyScore * 100) / 100
  };
};