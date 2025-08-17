import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuestionPreview from '../QuestionPreview';
import type { QuestionFormData } from '@/types/quiz';

const mockMCQQuestion: QuestionFormData = {
  question_text: 'What is the capital of France?',
  question_type: 'mcq',
  question_data: {
    options: ['London', 'Paris', 'Berlin', 'Madrid'],
    correctAnswer: 1
  },
  explanation: 'Paris is the capital and largest city of France.',
  order_index: 0
};

const mockFillBlankQuestion: QuestionFormData = {
  question_text: 'The capital of France is ____.',
  question_type: 'fill_blank',
  question_data: {
    correctAnswers: ['Paris', 'paris'],
    caseSensitive: false
  },
  explanation: 'Paris is the capital of France.',
  order_index: 0
};

const mockTrueFalseQuestion: QuestionFormData = {
  question_text: 'Paris is the capital of France.',
  question_type: 'true_false',
  question_data: {
    correctAnswer: true
  },
  explanation: 'This is correct.',
  order_index: 0
};

const mockMatchFollowingQuestion: QuestionFormData = {
  question_text: 'Match the countries with their capitals.',
  question_type: 'match_following',
  question_data: {
    leftItems: ['France', 'Germany'],
    rightItems: ['Paris', 'Berlin'],
    correctPairs: [{ left: 0, right: 0 }, { left: 1, right: 1 }]
  },
  explanation: 'These are the correct matches.',
  order_index: 0
};

describe('QuestionPreview', () => {
  it('renders hidden state when visible is false', () => {
    const mockToggle = vi.fn();
    render(
      <QuestionPreview
        questionData={mockMCQQuestion}
        visible={false}
        onToggleVisibility={mockToggle}
      />
    );

    expect(screen.getByText('Preview Hidden')).toBeInTheDocument();
    expect(screen.getByText('Click to see how your question will appear to quiz takers')).toBeInTheDocument();
    
    const showButton = screen.getByText('Show Preview');
    fireEvent.click(showButton);
    expect(mockToggle).toHaveBeenCalled();
  });

  it('renders MCQ question preview correctly', () => {
    render(
      <QuestionPreview
        questionData={mockMCQQuestion}
        visible={true}
      />
    );

    expect(screen.getByText('Live Preview')).toBeInTheDocument();
    expect(screen.getByText('Multiple Choice')).toBeInTheDocument();
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.getByText('Madrid')).toBeInTheDocument();
    expect(screen.getByText('Paris is the capital and largest city of France.')).toBeInTheDocument();
  });

  it('renders fill blank question preview correctly', () => {
    render(
      <QuestionPreview
        questionData={mockFillBlankQuestion}
        visible={true}
      />
    );

    expect(screen.getByText('Fill in the Blank')).toBeInTheDocument();
    expect(screen.getByText('The capital of France is ____.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your answer here...')).toBeInTheDocument();
    expect(screen.getByText('Correct answers:')).toBeInTheDocument();
    expect(screen.getByText('• Paris')).toBeInTheDocument();
    expect(screen.getByText('• paris')).toBeInTheDocument();
  });

  it('renders true/false question preview correctly', () => {
    render(
      <QuestionPreview
        questionData={mockTrueFalseQuestion}
        visible={true}
      />
    );

    expect(screen.getByText('True/False')).toBeInTheDocument();
    expect(screen.getByText('Paris is the capital of France.')).toBeInTheDocument();
    expect(screen.getByText('True')).toBeInTheDocument();
    expect(screen.getByText('False')).toBeInTheDocument();
  });

  it('renders match following question preview correctly', () => {
    render(
      <QuestionPreview
        questionData={mockMatchFollowingQuestion}
        visible={true}
      />
    );

    expect(screen.getByText('Match the Following')).toBeInTheDocument();
    expect(screen.getByText('Match the countries with their capitals.')).toBeInTheDocument();
    expect(screen.getByText('Match these items:')).toBeInTheDocument();
    expect(screen.getByText('With these options:')).toBeInTheDocument();
    expect(screen.getByText('France')).toBeInTheDocument();
    expect(screen.getByText('Germany')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('Berlin')).toBeInTheDocument();
  });

  it('shows empty state when question text is empty', () => {
    const emptyQuestion: QuestionFormData = {
      ...mockMCQQuestion,
      question_text: ''
    };

    render(
      <QuestionPreview
        questionData={emptyQuestion}
        visible={true}
      />
    );

    expect(screen.getByText('Enter question text to see preview')).toBeInTheDocument();
  });

  it('handles toggle visibility correctly', () => {
    const mockToggle = vi.fn();
    render(
      <QuestionPreview
        questionData={mockMCQQuestion}
        visible={true}
        onToggleVisibility={mockToggle}
      />
    );

    const hideButton = screen.getByRole('button');
    fireEvent.click(hideButton);
    expect(mockToggle).toHaveBeenCalled();
  });

  it('renders without toggle button when onToggleVisibility is not provided', () => {
    render(
      <QuestionPreview
        questionData={mockMCQQuestion}
        visible={true}
      />
    );

    expect(screen.getByText('Live Preview')).toBeInTheDocument();
    // Should not have a toggle button
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });
});