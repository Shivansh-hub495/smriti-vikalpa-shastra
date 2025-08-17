import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuestionManager from '../QuestionManager';
import type { QuestionFormData } from '@/types/quiz';

// Mock react-beautiful-dnd
vi.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }: any) => <div data-testid="drag-drop-context">{children}</div>,
  Droppable: ({ children }: any) => (
    <div data-testid="droppable">
      {children({ innerRef: vi.fn(), droppableProps: {}, placeholder: null })}
    </div>
  ),
  Draggable: ({ children, index }: any) => (
    <div data-testid={`draggable-${index}`}>
      {children({ innerRef: vi.fn(), draggableProps: {}, dragHandleProps: {} }, { isDragging: false })}
    </div>
  )
}));

// Mock QuestionEditor
vi.mock('../QuestionEditor', () => ({
  default: ({ initialData, onChange, onDelete, questionIndex }: any) => (
    <div data-testid={`question-editor-${questionIndex}`}>
      <div>Question {questionIndex + 1}</div>
      <div>Type: {initialData?.question_type || 'mcq'}</div>
      <div>Text: {initialData?.question_text || ''}</div>
      <button onClick={() => onChange({ ...initialData, question_text: 'Updated question' })}>
        Update Question
      </button>
      {onDelete && (
        <button onClick={onDelete} data-testid={`delete-question-${questionIndex}`}>
          Delete
        </button>
      )}
    </div>
  )
}));

describe('QuestionManager', () => {
  const mockOnChange = vi.fn();

  const defaultProps = {
    onChange: mockOnChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no questions', () => {
    render(<QuestionManager {...defaultProps} />);
    
    expect(screen.getByText('No questions yet')).toBeInTheDocument();
    expect(screen.getByText('Questions (0/50)')).toBeInTheDocument();
    expect(screen.getByText('Start building your quiz by adding your first question')).toBeInTheDocument();
  });

  it('shows question type buttons in empty state', () => {
    render(<QuestionManager {...defaultProps} />);
    
    expect(screen.getByText('Multiple Choice')).toBeInTheDocument();
    expect(screen.getByText('Fill in the Blank')).toBeInTheDocument();
    expect(screen.getByText('True/False')).toBeInTheDocument();
    expect(screen.getByText('Match Following')).toBeInTheDocument();
  });

  it('adds a new MCQ question when Add Question button is clicked', async () => {
    render(<QuestionManager {...defaultProps} />);
    
    const addButton = screen.getByText('Add Question');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          question_type: 'mcq',
          question_text: '',
          order_index: 0
        })
      ]);
    });
  });

  it('adds specific question types from empty state buttons', async () => {
    render(<QuestionManager {...defaultProps} />);
    
    const fillBlankButton = screen.getByText('Fill in the Blank');
    fireEvent.click(fillBlankButton);
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          question_type: 'fill_blank',
          question_data: { correctAnswers: [''], caseSensitive: false }
        })
      ]);
    });
  });

  it('renders existing questions', () => {
    const initialQuestions: QuestionFormData[] = [
      {
        question_text: 'Question 1',
        question_type: 'mcq',
        question_data: { options: ['A', 'B'], correctAnswer: 0 },
        explanation: '',
        order_index: 0
      },
      {
        question_text: 'Question 2',
        question_type: 'fill_blank',
        question_data: { correctAnswers: ['answer'], caseSensitive: false },
        explanation: '',
        order_index: 1
      }
    ];

    render(<QuestionManager {...defaultProps} initialQuestions={initialQuestions} />);
    
    expect(screen.getByText('Questions (2/50)')).toBeInTheDocument();
    expect(screen.getByTestId('question-editor-0')).toBeInTheDocument();
    expect(screen.getByTestId('question-editor-1')).toBeInTheDocument();
    expect(screen.getByText('Type: mcq')).toBeInTheDocument();
    expect(screen.getByText('Type: fill_blank')).toBeInTheDocument();
  });

  it('deletes a question when delete button is clicked', async () => {
    const initialQuestions: QuestionFormData[] = [
      {
        question_text: 'Question 1',
        question_type: 'mcq',
        question_data: { options: ['A', 'B'], correctAnswer: 0 },
        explanation: '',
        order_index: 0
      },
      {
        question_text: 'Question 2',
        question_type: 'fill_blank',
        question_data: { correctAnswers: ['answer'], caseSensitive: false },
        explanation: '',
        order_index: 1
      }
    ];

    render(<QuestionManager {...defaultProps} initialQuestions={initialQuestions} />);
    
    const deleteButton = screen.getByTestId('delete-question-0');
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          question_text: 'Question 2',
          order_index: 0 // Should be reordered
        })
      ]);
    });
  });

  it('updates a question when question editor changes', async () => {
    const initialQuestions: QuestionFormData[] = [
      {
        question_text: 'Original question',
        question_type: 'mcq',
        question_data: { options: ['A', 'B'], correctAnswer: 0 },
        explanation: '',
        order_index: 0
      }
    ];

    render(<QuestionManager {...defaultProps} initialQuestions={initialQuestions} />);
    
    const updateButton = screen.getByText('Update Question');
    fireEvent.click(updateButton);
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          question_text: 'Updated question'
        })
      ]);
    });
  });

  it('respects maxQuestions limit', () => {
    render(<QuestionManager {...defaultProps} maxQuestions={1} />);
    
    expect(screen.getByText('Questions (0/1)')).toBeInTheDocument();
    
    // Add one question
    const addButton = screen.getByText('Add Question');
    fireEvent.click(addButton);
    
    // Button should be disabled after reaching limit
    expect(addButton).toBeDisabled();
  });

  it('shows validation errors when validate all is clicked', async () => {
    const initialQuestions: QuestionFormData[] = [
      {
        question_text: '', // Empty question text should cause validation error
        question_type: 'mcq',
        question_data: { options: [''], correctAnswer: 0 }, // Invalid MCQ data
        explanation: '',
        order_index: 0
      }
    ];

    render(<QuestionManager {...defaultProps} initialQuestions={initialQuestions} />);
    
    const validateButton = screen.getByText('Validate All');
    fireEvent.click(validateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Validation Errors Found')).toBeInTheDocument();
      expect(screen.getByText(/1 question\(s\) have validation errors/)).toBeInTheDocument();
    });
  });

  it('shows question type summary', () => {
    const initialQuestions: QuestionFormData[] = [
      {
        question_text: 'MCQ Question',
        question_type: 'mcq',
        question_data: { options: ['A', 'B'], correctAnswer: 0 },
        explanation: '',
        order_index: 0
      },
      {
        question_text: 'Fill Blank Question',
        question_type: 'fill_blank',
        question_data: { correctAnswers: ['answer'], caseSensitive: false },
        explanation: '',
        order_index: 1
      },
      {
        question_text: 'Another MCQ Question',
        question_type: 'mcq',
        question_data: { options: ['A', 'B'], correctAnswer: 0 },
        explanation: '',
        order_index: 2
      }
    ];

    render(<QuestionManager {...defaultProps} initialQuestions={initialQuestions} />);
    
    expect(screen.getByText('Multiple Choice: 2')).toBeInTheDocument();
    expect(screen.getByText('Fill in the Blank: 1')).toBeInTheDocument();
    expect(screen.getByText('Total Questions: 3')).toBeInTheDocument();
  });

  it('hides controls in read-only mode', () => {
    render(<QuestionManager {...defaultProps} readOnly={true} />);
    
    expect(screen.queryByText('Add Question')).not.toBeInTheDocument();
    expect(screen.queryByText('Validate All')).not.toBeInTheDocument();
  });

  it('shows add another question button when questions exist', () => {
    const initialQuestions: QuestionFormData[] = [
      {
        question_text: 'Question 1',
        question_type: 'mcq',
        question_data: { options: ['A', 'B'], correctAnswer: 0 },
        explanation: '',
        order_index: 0
      }
    ];

    render(<QuestionManager {...defaultProps} initialQuestions={initialQuestions} />);
    
    expect(screen.getByText('Add Another Question')).toBeInTheDocument();
  });
});