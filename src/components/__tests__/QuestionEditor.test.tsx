import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuestionEditor from '../QuestionEditor';
import type { QuestionFormData } from '@/types/quiz';

// Mock the child components
vi.mock('../MCQEditor', () => ({
  default: ({ data, onChange }: any) => (
    <div data-testid="mcq-editor">
      MCQ Editor
      <button onClick={() => onChange({ ...data, options: ['A', 'B'] })}>
        Update MCQ
      </button>
    </div>
  )
}));

vi.mock('../FillBlankEditor', () => ({
  default: ({ data, onChange }: any) => (
    <div data-testid="fill-blank-editor">
      Fill Blank Editor
      <button onClick={() => onChange({ ...data, correctAnswers: ['answer'] })}>
        Update Fill Blank
      </button>
    </div>
  )
}));

vi.mock('../TrueFalseEditor', () => ({
  default: ({ data, onChange }: any) => (
    <div data-testid="true-false-editor">
      True False Editor
      <button onClick={() => onChange({ ...data, correctAnswer: false })}>
        Update True False
      </button>
    </div>
  )
}));

vi.mock('../MatchFollowingEditor', () => ({
  default: ({ data, onChange }: any) => (
    <div data-testid="match-following-editor">
      Match Following Editor
      <button onClick={() => onChange({ ...data, leftItems: ['item1'] })}>
        Update Match Following
      </button>
    </div>
  )
}));

describe('QuestionEditor', () => {
  const mockOnChange = vi.fn();
  const mockOnDelete = vi.fn();

  const defaultProps = {
    onChange: mockOnChange,
    onDelete: mockOnDelete,
    questionIndex: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default MCQ question type', () => {
    render(<QuestionEditor {...defaultProps} />);
    
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('mcq')).toBeInTheDocument();
    expect(screen.getByTestId('mcq-editor')).toBeInTheDocument();
  });

  it('shows "New" badge for new questions', () => {
    render(<QuestionEditor {...defaultProps} isNew={true} />);
    
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('updates question text', async () => {
    render(<QuestionEditor {...defaultProps} />);
    
    const questionTextArea = screen.getByPlaceholderText('Enter your question here...');
    fireEvent.change(questionTextArea, { target: { value: 'What is 2+2?' } });
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          question_text: 'What is 2+2?'
        })
      );
    });
  });

  it('switches question types correctly', async () => {
    render(<QuestionEditor {...defaultProps} />);
    
    // Switch to fill_blank
    const typeSelect = screen.getByRole('combobox');
    fireEvent.click(typeSelect);
    
    const fillBlankOption = screen.getByText('Fill in the Blank');
    fireEvent.click(fillBlankOption);
    
    await waitFor(() => {
      expect(screen.getByTestId('fill-blank-editor')).toBeInTheDocument();
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          question_type: 'fill_blank',
          question_data: { correctAnswers: [''], caseSensitive: false }
        })
      );
    });
  });

  it('updates explanation text', async () => {
    render(<QuestionEditor {...defaultProps} />);
    
    const explanationTextArea = screen.getByPlaceholderText('Provide an explanation for the correct answer...');
    fireEvent.change(explanationTextArea, { target: { value: 'This is the explanation' } });
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          explanation: 'This is the explanation'
        })
      );
    });
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<QuestionEditor {...defaultProps} />);
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalled();
  });

  it('does not show delete button when onDelete is not provided', () => {
    render(<QuestionEditor {...defaultProps} onDelete={undefined} />);
    
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('validates question and shows errors', async () => {
    render(<QuestionEditor {...defaultProps} />);
    
    const validateButton = screen.getByText('Validate Question');
    fireEvent.click(validateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Validation Errors')).toBeInTheDocument();
      expect(screen.getByText('• Question text is required')).toBeInTheDocument();
    });
  });

  it('renders with initial data', () => {
    const initialData: QuestionFormData = {
      question_text: 'Initial question',
      question_type: 'true_false',
      question_data: { correctAnswer: true },
      explanation: 'Initial explanation',
      order_index: 0
    };

    render(<QuestionEditor {...defaultProps} initialData={initialData} />);
    
    expect(screen.getByDisplayValue('Initial question')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Initial explanation')).toBeInTheDocument();
    expect(screen.getByTestId('true-false-editor')).toBeInTheDocument();
  });

  it('renders all question type editors correctly', async () => {
    const { rerender } = render(<QuestionEditor {...defaultProps} />);
    
    // Test MCQ editor (default)
    expect(screen.getByTestId('mcq-editor')).toBeInTheDocument();
    
    // Test each question type
    const questionTypes = [
      { type: 'fill_blank', testId: 'fill-blank-editor', displayName: 'Fill in the Blank' },
      { type: 'true_false', testId: 'true-false-editor', displayName: 'True/False' },
      { type: 'match_following', testId: 'match-following-editor', displayName: 'Match the Following' }
    ];
    
    for (const { type, testId, displayName } of questionTypes) {
      const initialData: QuestionFormData = {
        question_text: 'Test question',
        question_type: type as any,
        question_data: {} as any,
        explanation: '',
        order_index: 0
      };
      
      rerender(<QuestionEditor {...defaultProps} initialData={initialData} />);
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    }
  });
});