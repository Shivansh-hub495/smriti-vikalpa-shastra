/**
 * @fileoverview Tests for QuestionPageHeader component
 * @description Unit tests for the question page header navigation component
 * @author Quiz Question Management System
 * @version 1.0.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import QuestionPageHeader from '../QuestionPageHeader';
import type { Quiz } from '@/types/quiz';

// Mock the useNavigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockQuiz: Quiz = {
  id: '1',
  title: 'Test Quiz',
  description: 'A test quiz',
  user_id: 'user-1',
  folder_id: null,
  settings: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  questions: []
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('QuestionPageHeader', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders create mode header correctly', () => {
    renderWithRouter(
      <QuestionPageHeader
        quiz={mockQuiz}
        mode="create"
        questionNumber={1}
      />
    );

    expect(screen.getByText('Create Question')).toBeInTheDocument();
    expect(screen.getByText('Test Quiz')).toBeInTheDocument();
    expect(screen.getByText('Question #1 • Press Ctrl+S to save')).toBeInTheDocument();
    expect(screen.getByText('Back to Quiz')).toBeInTheDocument();
  });

  it('renders edit mode header correctly', () => {
    renderWithRouter(
      <QuestionPageHeader
        quiz={mockQuiz}
        mode="edit"
        hasUnsavedChanges={true}
      />
    );

    expect(screen.getByText('Edit Question')).toBeInTheDocument();
    expect(screen.getByText('Test Quiz')).toBeInTheDocument();
    expect(screen.getByText('Editing mode • Press Ctrl+S to save changes')).toBeInTheDocument();
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const mockOnBack = vi.fn();
    
    renderWithRouter(
      <QuestionPageHeader
        quiz={mockQuiz}
        mode="create"
        onBack={mockOnBack}
      />
    );

    const backButton = screen.getByText('Back to Quiz');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('navigates to default URL when no onBack provided', () => {
    renderWithRouter(
      <QuestionPageHeader
        quiz={mockQuiz}
        mode="create"
      />
    );

    const backButton = screen.getByText('Back to Quiz');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/quiz/1/edit');
  });

  it('shows unsaved changes indicator when hasUnsavedChanges is true', () => {
    renderWithRouter(
      <QuestionPageHeader
        quiz={mockQuiz}
        mode="edit"
        hasUnsavedChanges={true}
      />
    );

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('does not show unsaved changes indicator when hasUnsavedChanges is false', () => {
    renderWithRouter(
      <QuestionPageHeader
        quiz={mockQuiz}
        mode="edit"
        hasUnsavedChanges={false}
      />
    );

    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
  });
});