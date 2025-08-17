import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import QuestionList from '../QuestionList';
import type { QuestionFormData } from '@/types/quiz';

// Mock react-beautiful-dnd
vi.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Droppable: ({ children }: { children: (provided: any, snapshot: any) => React.ReactNode }) => 
    children({ droppableProps: {}, innerRef: vi.fn(), placeholder: null }, { isDraggingOver: false }),
  Draggable: ({ children }: { children: (provided: any, snapshot: any) => React.ReactNode }) => 
    children({ 
      innerRef: vi.fn(), 
      draggableProps: {}, 
      dragHandleProps: {} 
    }, { isDragging: false })
}));

const mockQuestions: QuestionFormData[] = [
  {
    question_text: 'What is the capital of France?',
    question_type: 'mcq',
    question_data: { options: ['Paris', 'London', 'Berlin', 'Madrid'], correctAnswer: 0 },
    explanation: 'Paris is the capital and largest city of France.',
    order_index: 0
  },
  {
    question_text: 'Fill in the blank: The sky is ___.',
    question_type: 'fill_blank',
    question_data: { correctAnswers: ['blue'], caseSensitive: false },
    explanation: '',
    order_index: 1
  }
];

describe('QuestionList', () => {
  const mockProps = {
    questions: mockQuestions,
    onAddQuestion: vi.fn(),
    onEditQuestion: vi.fn(),
    onDeleteQuestion: vi.fn(),
    onReorderQuestions: vi.fn(),
    readOnly: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders questions correctly', () => {
    render(<QuestionList {...mockProps} />);
    
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
    expect(screen.getByText('Fill in the blank: The sky is ___.', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getByText('Question 2')).toBeInTheDocument();
  });

  it('shows empty state when no questions', () => {
    render(<QuestionList {...mockProps} questions={[]} />);
    
    expect(screen.getByText('No questions yet')).toBeInTheDocument();
    expect(screen.getByText('Add First Question')).toBeInTheDocument();
  });

  it('calls onAddQuestion when add button is clicked', () => {
    render(<QuestionList {...mockProps} />);
    
    const addButton = screen.getByText('Add Another Question');
    fireEvent.click(addButton);
    
    expect(mockProps.onAddQuestion).toHaveBeenCalledTimes(1);
  });

  it('calls onEditQuestion when edit button is clicked', () => {
    render(<QuestionList {...mockProps} />);
    
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    expect(mockProps.onEditQuestion).toHaveBeenCalledWith(0);
  });

  it('shows question type badges correctly', () => {
    render(<QuestionList {...mockProps} />);
    
    expect(screen.getByText('Multiple Choice')).toBeInTheDocument();
    expect(screen.getByText('Fill in the Blank')).toBeInTheDocument();
  });

  it('displays question data preview', () => {
    render(<QuestionList {...mockProps} />);
    
    expect(screen.getByText('4 options')).toBeInTheDocument();
    expect(screen.getByText('1 correct answer(s)')).toBeInTheDocument();
  });

  it('shows explanation when available', () => {
    render(<QuestionList {...mockProps} />);
    
    expect(screen.getByText('Explanation:', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Paris is the capital and largest city of France.', { exact: false })).toBeInTheDocument();
  });

  it('hides action buttons in read-only mode', () => {
    render(<QuestionList {...mockProps} readOnly={true} />);
    
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    expect(screen.queryByText('Add Another Question')).not.toBeInTheDocument();
  });
});