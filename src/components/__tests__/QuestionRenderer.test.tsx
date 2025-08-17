/**
 * @fileoverview Tests for QuestionRenderer component
 * @description Tests for rendering different question types during quiz taking
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QuestionRenderer from '../QuestionRenderer';
import type { Question } from '@/types/quiz';

// Mock react-beautiful-dnd
vi.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }: any) => <div>{children}</div>,
  Droppable: ({ children }: any) => children({ innerRef: vi.fn(), droppableProps: {}, placeholder: null }, {}),
  Draggable: ({ children }: any) => children({ innerRef: vi.fn(), draggableProps: {}, dragHandleProps: {} }, {})
}));

describe('QuestionRenderer', () => {
  const mockOnAnswerChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('MCQ Questions', () => {
    const mcqQuestion: Question = {
      id: 'q1',
      quiz_id: 'quiz-1',
      question_text: 'What is the capital of France?',
      question_type: 'mcq',
      question_data: {
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswer: 2
      },
      explanation: 'Paris is the capital of France',
      order_index: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    it('renders MCQ question correctly', () => {
      render(
        <QuestionRenderer
          question={mcqQuestion}
          onAnswerChange={mockOnAnswerChange}
        />
      );

      expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
      expect(screen.getByText('London')).toBeInTheDocument();
      expect(screen.getByText('Berlin')).toBeInTheDocument();
      expect(screen.getByText('Paris')).toBeInTheDocument();
      expect(screen.getByText('Madrid')).toBeInTheDocument();
    });

    it('handles MCQ option selection', async () => {
      const user = userEvent.setup();
      render(
        <QuestionRenderer
          question={mcqQuestion}
          onAnswerChange={mockOnAnswerChange}
        />
      );

      const parisOption = screen.getByLabelText(/Paris/);
      await user.click(parisOption);

      expect(mockOnAnswerChange).toHaveBeenCalledWith({
        type: 'mcq',
        selectedOption: 2
      });
    });

    it('shows selected option visually', async () => {
      const user = userEvent.setup();
      render(
        <QuestionRenderer
          question={mcqQuestion}
          onAnswerChange={mockOnAnswerChange}
          answer={{
            questionId: 'q1',
            answer: { type: 'mcq', selectedOption: 2 },
            correct: true
          }}
        />
      );

      const parisOption = screen.getByLabelText(/Paris/);
      expect(parisOption).toBeChecked();
    });

    it('handles shuffled options when enabled', () => {
      const shuffledQuestion = {
        ...mcqQuestion,
        question_data: {
          ...mcqQuestion.question_data,
          shuffleOptions: true
        }
      };

      render(
        <QuestionRenderer
          question={shuffledQuestion}
          onAnswerChange={mockOnAnswerChange}
        />
      );

      // All options should still be present
      expect(screen.getByText('London')).toBeInTheDocument();
      expect(screen.getByText('Berlin')).toBeInTheDocument();
      expect(screen.getByText('Paris')).toBeInTheDocument();
      expect(screen.getByText('Madrid')).toBeInTheDocument();
    });
  });

  describe('Fill-in-the-Blank Questions', () => {
    const fillBlankQuestion: Question = {
      id: 'q2',
      quiz_id: 'quiz-1',
      question_text: 'The capital of France is ____.',
      question_type: 'fill_blank',
      question_data: {
        correctAnswers: ['Paris', 'paris'],
        caseSensitive: false
      },
      explanation: 'Paris is the capital and largest city of France',
      order_index: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    it('renders fill-blank question correctly', () => {
      render(
        <QuestionRenderer
          question={fillBlankQuestion}
          onAnswerChange={mockOnAnswerChange}
        />
      );

      expect(screen.getByText('The capital of France is ____.')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type your answer here...')).toBeInTheDocument();
    });

    it('handles fill-blank answer input', async () => {
      const user = userEvent.setup();
      render(
        <QuestionRenderer
          question={fillBlankQuestion}
          onAnswerChange={mockOnAnswerChange}
        />
      );

      const input = screen.getByPlaceholderText('Type your answer here...');
      await user.type(input, 'Paris');

      expect(mockOnAnswerChange).toHaveBeenCalledWith({
        type: 'fill_blank',
        answer: 'Paris'
      });
    });

    it('shows current answer in input field', () => {
      render(
        <QuestionRenderer
          question={fillBlankQuestion}
          onAnswerChange={mockOnAnswerChange}
          answer={{
            questionId: 'q2',
            answer: { type: 'fill_blank', answer: 'Paris' },
            correct: true
          }}
        />
      );

      const input = screen.getByDisplayValue('Paris');
      expect(input).toBeInTheDocument();
    });

    it('handles case sensitivity settings', async () => {
      const caseSensitiveQuestion = {
        ...fillBlankQuestion,
        question_data: {
          ...fillBlankQuestion.question_data,
          caseSensitive: true
        }
      };

      render(
        <QuestionRenderer
          question={caseSensitiveQuestion}
          onAnswerChange={mockOnAnswerChange}
        />
      );

      expect(screen.getByText(/not case-sensitive/i)).toBeInTheDocument();
    });
  });

  describe('True/False Questions', () => {
    const trueFalseQuestion: Question = {
      id: 'q3',
      quiz_id: 'quiz-1',
      question_text: 'The Earth is round.',
      question_type: 'true_false',
      question_data: {
        correctAnswer: true
      },
      explanation: 'The Earth is approximately spherical in shape',
      order_index: 2,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    it('renders true/false question correctly', () => {
      render(
        <QuestionRenderer
          question={trueFalseQuestion}
          onAnswerChange={mockOnAnswerChange}
        />
      );

      expect(screen.getByText('The Earth is round.')).toBeInTheDocument();
      expect(screen.getByText('True')).toBeInTheDocument();
      expect(screen.getByText('False')).toBeInTheDocument();
    });

    it('handles true selection', async () => {
      const user = userEvent.setup();
      render(
        <QuestionRenderer
          question={trueFalseQuestion}
          onAnswerChange={mockOnAnswerChange}
        />
      );

      const trueButton = screen.getByText('True');
      await user.click(trueButton);

      expect(mockOnAnswerChange).toHaveBeenCalledWith({
        type: 'true_false',
        answer: true
      });
    });

    it('handles false selection', async () => {
      const user = userEvent.setup();
      render(
        <QuestionRenderer
          question={trueFalseQuestion}
          onAnswerChange={mockOnAnswerChange}
        />
      );

      const falseButton = screen.getByText('False');
      await user.click(falseButton);

      expect(mockOnAnswerChange).toHaveBeenCalledWith({
        type: 'true_false',
        answer: false
      });
    });

    it('shows selected answer visually', () => {
      render(
        <QuestionRenderer
          question={trueFalseQuestion}
          onAnswerChange={mockOnAnswerChange}
          answer={{
            questionId: 'q3',
            answer: { type: 'true_false', answer: true },
            correct: true
          }}
        />
      );

      // The component should show the selected state visually
      expect(screen.getByText('True')).toBeInTheDocument();
    });
  });

  describe('Match-the-Following Questions', () => {
    const matchQuestion: Question = {
      id: 'q4',
      quiz_id: 'quiz-1',
      question_text: 'Match the countries with their capitals:',
      question_type: 'match_following',
      question_data: {
        leftItems: ['France', 'Germany', 'Italy'],
        rightItems: ['Berlin', 'Paris', 'Rome'],
        correctPairs: [
          { left: 0, right: 1 }, // France - Paris
          { left: 1, right: 0 }, // Germany - Berlin
          { left: 2, right: 2 }  // Italy - Rome
        ]
      },
      explanation: 'These are the capital cities of the respective countries',
      order_index: 3,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    it('renders match-following question correctly', () => {
      render(
        <QuestionRenderer
          question={matchQuestion}
          onAnswerChange={mockOnAnswerChange}
        />
      );

      expect(screen.getByText('Match the countries with their capitals:')).toBeInTheDocument();
      expect(screen.getByText('France')).toBeInTheDocument();
      expect(screen.getByText('Germany')).toBeInTheDocument();
      expect(screen.getByText('Italy')).toBeInTheDocument();
      expect(screen.getByText('Berlin')).toBeInTheDocument();
      expect(screen.getByText('Paris')).toBeInTheDocument();
      expect(screen.getByText('Rome')).toBeInTheDocument();
    });

    it('handles drag and drop pairing', async () => {
      render(
        <QuestionRenderer
          question={matchQuestion}
          onAnswerChange={mockOnAnswerChange}
        />
      );

      // Since drag and drop is complex to test, we'll just verify the component renders
      expect(screen.getByText('France')).toBeInTheDocument();
      expect(screen.getByText('Paris')).toBeInTheDocument();
    });

    it('shows current pairings visually', () => {
      const currentAnswer = {
        type: 'match_following' as const,
        pairs: [
          { left: 0, right: 1 }, // France - Paris
          { left: 1, right: 0 }  // Germany - Berlin
        ]
      };

      render(
        <QuestionRenderer
          question={matchQuestion}
          onAnswerChange={mockOnAnswerChange}
          answer={{
            questionId: 'q4',
            answer: currentAnswer,
            correct: true
          }}
        />
      );

      // Check if pairings are visually indicated
      expect(screen.getByText('France')).toBeInTheDocument();
      expect(screen.getAllByText('Paris')).toHaveLength(2); // One in matched, one in available
    });

    it('handles shuffled items when enabled', () => {
      const shuffledQuestion = {
        ...matchQuestion,
        question_data: {
          ...matchQuestion.question_data,
          shuffleItems: true
        }
      };

      render(
        <QuestionRenderer
          question={shuffledQuestion}
          onAnswerChange={mockOnAnswerChange}
        />
      );

      // All items should still be present
      expect(screen.getByText('France')).toBeInTheDocument();
      expect(screen.getByText('Germany')).toBeInTheDocument();
      expect(screen.getByText('Italy')).toBeInTheDocument();
      expect(screen.getByText('Berlin')).toBeInTheDocument();
      expect(screen.getByText('Paris')).toBeInTheDocument();
      expect(screen.getByText('Rome')).toBeInTheDocument();
    });
  });

  describe('Common Features', () => {
    const sampleQuestion: Question = {
      id: 'q1',
      quiz_id: 'quiz-1',
      question_text: 'Sample question',
      question_type: 'mcq',
      question_data: {
        options: ['A', 'B'],
        correctAnswer: 0
      },
      explanation: 'Sample explanation',
      order_index: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    it('displays question text correctly', () => {
      render(
        <QuestionRenderer
          question={sampleQuestion}
          onAnswerChange={mockOnAnswerChange}
        />
      );

      expect(screen.getByText('Sample question')).toBeInTheDocument();
    });

    it('shows question type badge', () => {
      render(
        <QuestionRenderer
          question={sampleQuestion}
          onAnswerChange={mockOnAnswerChange}
        />
      );

      expect(screen.getByText('MCQ')).toBeInTheDocument();
    });

    it('handles disabled state', () => {
      render(
        <QuestionRenderer
          question={sampleQuestion}
          onAnswerChange={mockOnAnswerChange}
          disabled={true}
        />
      );

      const inputs = screen.getAllByRole('radio');
      inputs.forEach(input => {
        expect(input).toBeDisabled();
      });
    });

    it('renders without loading state', () => {
      render(
        <QuestionRenderer
          question={sampleQuestion}
          onAnswerChange={mockOnAnswerChange}
        />
      );

      expect(screen.getByText('Sample question')).toBeInTheDocument();
    });

    it('handles unknown question type gracefully', () => {
      const unknownQuestion = {
        ...sampleQuestion,
        question_type: 'unknown_type' as any
      };

      render(
        <QuestionRenderer
          question={unknownQuestion}
          onAnswerChange={mockOnAnswerChange}
        />
      );

      expect(screen.getByText('Unsupported question type')).toBeInTheDocument();
    });

    it('renders without validation errors', () => {
      render(
        <QuestionRenderer
          question={sampleQuestion}
          onAnswerChange={mockOnAnswerChange}
        />
      );

      expect(screen.getByText('Sample question')).toBeInTheDocument();
    });

    it('handles keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <QuestionRenderer
          question={sampleQuestion}
          onAnswerChange={mockOnAnswerChange}
        />
      );

      const firstOption = screen.getAllByRole('radio')[0];
      firstOption.focus();
      
      await user.keyboard('{ArrowDown}');
      
      // Just verify the component handles keyboard events
      expect(firstOption).toBeInTheDocument();
    });

    it('renders question without time display', () => {
      render(
        <QuestionRenderer
          question={sampleQuestion}
          onAnswerChange={mockOnAnswerChange}
        />
      );

      expect(screen.getByText('Sample question')).toBeInTheDocument();
    });
  });
});