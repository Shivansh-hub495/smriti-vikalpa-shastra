/**
 * @fileoverview Tests for QuizPlayer component
 * @description Tests for quiz taking interface functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import QuizPlayer from '../QuizPlayer';
import type { Quiz, Question } from '@/types/quiz';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('QuizPlayer', () => {
  const mockQuiz: Quiz = {
    id: 'test-quiz-id',
    title: 'Test Quiz',
    description: 'A test quiz',
    folder_id: 'folder-1',
    user_id: 'user-1',
    settings: {
      timeLimit: 10, // 10 minutes
      shuffleQuestions: false,
      showResults: true,
      allowRetakes: true
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockQuestions: Question[] = [
    {
      id: 'q1',
      quiz_id: 'test-quiz-id',
      question_text: 'What is 2 + 2?',
      question_type: 'mcq',
      question_data: {
        options: ['2', '3', '4', '5'],
        correctAnswer: 2
      },
      explanation: 'Basic addition',
      order_index: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'q2',
      quiz_id: 'test-quiz-id',
      question_text: 'The sky is blue.',
      question_type: 'true_false',
      question_data: {
        correctAnswer: true
      },
      order_index: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  const mockOnComplete = vi.fn();
  const mockOnExit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderQuizPlayer = () => {
    return render(
      <BrowserRouter>
        <QuizPlayer
          quiz={mockQuiz}
          questions={mockQuestions}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      </BrowserRouter>
    );
  };

  it('renders quiz header with title and progress', () => {
    renderQuizPlayer();
    
    expect(screen.getByText('Test Quiz')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('0/2 answered')).toBeInTheDocument();
  });

  it('displays timer when time limit is set', () => {
    renderQuizPlayer();
    
    // Should show timer (10 minutes = 600 seconds = 10:00)
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('renders first question correctly', () => {
    renderQuizPlayer();
    
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
    expect(screen.getByText('MCQ')).toBeInTheDocument();
  });

  it('allows answering MCQ questions', async () => {
    const user = userEvent.setup();
    renderQuizPlayer();
    
    // Click on option C (which is "4", the correct answer)
    const optionC = screen.getByLabelText(/4/);
    await user.click(optionC);
    
    // Should show as answered
    await waitFor(() => {
      expect(screen.getByText('1/2 answered')).toBeInTheDocument();
    });
  });

  it('navigates between questions', async () => {
    const user = userEvent.setup();
    renderQuizPlayer();
    
    // Should start on question 1
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
    
    // Click next button
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    // Should show question 2
    expect(screen.getByText('The sky is blue.')).toBeInTheDocument();
    expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();
  });

  it('shows finish button on last question', async () => {
    const user = userEvent.setup();
    renderQuizPlayer();
    
    // Navigate to last question
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    // Should show finish button instead of next
    expect(screen.getByText('Finish Quiz')).toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('allows jumping to specific questions using navigation dots', async () => {
    const user = userEvent.setup();
    renderQuizPlayer();
    
    // Click on question 2 dot
    const question2Dot = screen.getByText('2');
    await user.click(question2Dot);
    
    // Should jump to question 2
    expect(screen.getByText('The sky is blue.')).toBeInTheDocument();
    expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();
  });

  it('shows exit confirmation dialog', async () => {
    const user = userEvent.setup();
    renderQuizPlayer();
    
    // Click exit button
    const exitButton = screen.getByText('Exit Quiz');
    await user.click(exitButton);
    
    // Should show confirmation dialog
    expect(screen.getByText('Exit Quiz?')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to exit this quiz? Your progress will be lost.')).toBeInTheDocument();
  });

  it('calls onExit when exit is confirmed', async () => {
    const user = userEvent.setup();
    renderQuizPlayer();
    
    // Click exit button
    const exitButton = screen.getByText('Exit Quiz');
    await user.click(exitButton);
    
    // Confirm exit
    const confirmButton = screen.getByText('Exit Quiz');
    await user.click(confirmButton);
    
    expect(mockOnExit).toHaveBeenCalled();
  });

  it('handles quiz completion', async () => {
    const user = userEvent.setup();
    renderQuizPlayer();
    
    // Answer first question
    const optionC = screen.getByLabelText(/4/);
    await user.click(optionC);
    
    // Go to next question
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    // Answer second question
    const trueButton = screen.getByText('True');
    await user.click(trueButton);
    
    // Finish quiz
    const finishButton = screen.getByText('Finish Quiz');
    await user.click(finishButton);
    
    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('handles empty questions gracefully', () => {
    render(
      <QuizPlayer
        quiz={mockQuiz}
        questions={[]}
        onComplete={mockOnComplete}
        onExit={mockOnExit}
      />
    );
    
    expect(screen.getByText('No Questions Found')).toBeInTheDocument();
    expect(screen.getByText("This quiz doesn't have any questions yet.")).toBeInTheDocument();
  });
});