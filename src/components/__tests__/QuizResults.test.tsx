/**
 * @fileoverview Tests for QuizResults component
 * @description Tests for quiz results display and functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import QuizResults from '../QuizResults';
import type { Quiz, Question, QuizAttempt } from '@/types/quiz';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

describe('QuizResults', () => {
  const mockQuiz: Quiz = {
    id: 'quiz-1',
    title: 'Test Quiz',
    description: 'A test quiz',
    folder_id: 'folder-1',
    user_id: 'user-1',
    settings: {
      showCorrectAnswers: true,
      showExplanations: true,
      passingScore: 70
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockQuestions: Question[] = [
    {
      id: 'q1',
      quiz_id: 'quiz-1',
      question_text: 'What is 2 + 2?',
      question_type: 'mcq',
      question_data: {
        options: ['2', '3', '4', '5'],
        correctAnswer: 2
      },
      explanation: 'Basic addition: 2 + 2 = 4',
      order_index: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'q2',
      quiz_id: 'quiz-1',
      question_text: 'The sky is blue.',
      question_type: 'true_false',
      question_data: {
        correctAnswer: true
      },
      explanation: 'The sky appears blue due to light scattering.',
      order_index: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  const mockAttempt: QuizAttempt = {
    id: 'attempt-1',
    quiz_id: 'quiz-1',
    user_id: 'user-1',
    started_at: '2024-01-01T00:00:00Z',
    completed_at: '2024-01-01T00:05:00Z',
    score: 100,
    total_questions: 2,
    correct_answers: 2,
    time_taken: 300,
    answers: [
      {
        questionId: 'q1',
        answer: { type: 'mcq', selectedOption: 2 },
        correct: true,
        timeSpent: 150
      },
      {
        questionId: 'q2',
        answer: { type: 'true_false', answer: true },
        correct: true,
        timeSpent: 150
      }
    ],
    created_at: '2024-01-01T00:00:00Z'
  };



  const mockOnRetake = vi.fn();
  const mockOnViewHistory = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderQuizResults = (props = {}) => {
    return render(
      <BrowserRouter>
        <QuizResults
          quiz={mockQuiz}
          questions={mockQuestions}
          attempt={mockAttempt}
          onExit={mockOnClose}
          {...props}
        />
      </BrowserRouter>
    );
  };

  it('renders quiz results with perfect score', () => {
    renderQuizResults();

    expect(screen.getByText('Test Quiz')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Correct count
  });

  it('renders quiz results with failing score', () => {
    const failingAttempt = {
      ...mockAttempt,
      score: 50,
      correct_answers: 1
    };

    renderQuizResults({ attempt: failingAttempt });

    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Correct count
  });

  it('displays question breakdown correctly', () => {
    renderQuizResults();

    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
    expect(screen.getByText('The sky is blue.')).toBeInTheDocument();
  });

  it('shows correct answers when enabled', () => {
    renderQuizResults();

    // The component should show question review when showCorrectAnswers is enabled
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
    expect(screen.getByText('The sky is blue.')).toBeInTheDocument();
  });

  it('shows explanations when enabled', () => {
    renderQuizResults();

    expect(screen.getByText('Basic addition: 2 + 2 = 4')).toBeInTheDocument();
    expect(screen.getByText('The sky appears blue due to light scattering.')).toBeInTheDocument();
  });

  it('hides correct answers when disabled', () => {
    const quizWithoutAnswers = {
      ...mockQuiz,
      settings: {
        ...mockQuiz.settings,
        showCorrectAnswers: false
      }
    };

    renderQuizResults({ quiz: quizWithoutAnswers });

    // When showCorrectAnswers is false, the question review section should not appear
    expect(screen.queryByText('Question Review')).not.toBeInTheDocument();
  });

  it('hides explanations when disabled', () => {
    const quizWithoutExplanations = {
      ...mockQuiz,
      settings: {
        ...mockQuiz.settings,
        showExplanations: false
      }
    };

    renderQuizResults({ quiz: quizWithoutExplanations });

    expect(screen.queryByText('Basic addition: 2 + 2 = 4')).not.toBeInTheDocument();
    expect(screen.queryByText('The sky appears blue due to light scattering.')).not.toBeInTheDocument();
  });

  it('calls onRetake when retake button is clicked', async () => {
    const user = userEvent.setup();
    renderQuizResults({ onRetake: mockOnRetake });

    const retakeButton = screen.getByText('Retake Quiz');
    await user.click(retakeButton);

    expect(mockOnRetake).toHaveBeenCalled();
  });

  it('calls onExit when back button is clicked', async () => {
    const user = userEvent.setup();
    renderQuizResults();

    const backButton = screen.getByText('Back to Quiz');
    await user.click(backButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onExit when folder button is clicked', async () => {
    const user = userEvent.setup();
    renderQuizResults();

    const folderButton = screen.getByText('Back to Folder');
    await user.click(folderButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays performance metrics breakdown', () => {
    renderQuizResults();

    expect(screen.getByText('Performance Breakdown')).toBeInTheDocument();
    // Check for breakdown by question type
    expect(screen.getByText(/Multiple Choice/)).toBeInTheDocument();
    expect(screen.getByText(/True\/False/)).toBeInTheDocument();
  });

  it('handles incorrect answers correctly', () => {
    const attemptWithIncorrectAnswers = {
      ...mockAttempt,
      score: 50,
      correct_answers: 1,
      answers: [
        {
          questionId: 'q1',
          answer: { type: 'mcq', selectedOption: 0 },
          correct: false,
          timeSpent: 150
        },
        {
          questionId: 'q2',
          answer: { type: 'true_false', answer: true },
          correct: true,
          timeSpent: 150
        }
      ]
    };

    renderQuizResults({ attempt: attemptWithIncorrectAnswers });

    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Correct count
  });

  it('displays time taken for quiz', () => {
    renderQuizResults();

    // Check if time information is displayed
    expect(screen.getByText('5m')).toBeInTheDocument();
  });

  it('handles quiz without passing score', () => {
    const quizWithoutPassingScore = {
      ...mockQuiz,
      settings: {
        ...mockQuiz.settings,
        passingScore: undefined
      }
    };

    renderQuizResults({ quiz: quizWithoutPassingScore });

    expect(screen.queryByText('PASSED')).not.toBeInTheDocument();
    expect(screen.queryByText('FAILED')).not.toBeInTheDocument();
  });

  it('displays score correctly for perfect score', () => {
    renderQuizResults();

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('displays score correctly for failing score', () => {
    const failingAttempt = {
      ...mockAttempt,
      score: 30
    };

    renderQuizResults({ attempt: failingAttempt });

    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('handles empty questions array', () => {
    renderQuizResults({ questions: [] });

    expect(screen.getByText('Test Quiz')).toBeInTheDocument();
  });

  it('handles missing answer data gracefully', () => {
    const attemptWithMissingAnswers = {
      ...mockAttempt,
      answers: []
    };

    renderQuizResults({ attempt: attemptWithMissingAnswers });

    expect(screen.getByText('Test Quiz')).toBeInTheDocument();
  });

  it('displays retake button when provided', () => {
    renderQuizResults({ onRetake: mockOnRetake });

    expect(screen.getByText('Retake Quiz')).toBeInTheDocument();
  });

  it('does not show retake button when not provided', () => {
    renderQuizResults();

    expect(screen.queryByText('Retake Quiz')).not.toBeInTheDocument();
  });

  it('displays quiz results interface', () => {
    renderQuizResults();

    expect(screen.getByText('Quiz Results')).toBeInTheDocument();
    expect(screen.getByText('Your Score')).toBeInTheDocument();
  });
});